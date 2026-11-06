import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { graphqlIoTCoreButtonEvents } from './functions/graphqlIoTCoreButtonEvents/resource';
import { graphqlIoTCoreStatus } from './functions/graphqlIoTCoreStatus/resource';
import { buttonEventsApi } from './functions/buttonEventsApi/resource';
import { highscoreApi } from './functions/highscoreApi/resource';

const backend = defineBackend({
  auth,
  data,
  graphqlIoTCoreButtonEvents,
  graphqlIoTCoreStatus,
  buttonEventsApi,
  highscoreApi,
});

// ---------------------------------------------------------------------------
// GraphQL endpoint + API key for the Lambda functions
// (previously the CUSTOM_LAMBDA_GRAPHQL_ENDPOINT / CUSTOM_LAMBDA_GRAPHQL_KEY
// secrets, which had to be copied by hand after the first deploy)
// ---------------------------------------------------------------------------
const graphqlUrl = backend.data.graphqlUrl;
const graphqlApiKey = backend.data.apiKey;
if (!graphqlApiKey) {
  throw new Error('The data resource must have API key authorization enabled.');
}

for (const fn of [
  backend.graphqlIoTCoreButtonEvents,
  backend.graphqlIoTCoreStatus,
  backend.buttonEventsApi,
  backend.highscoreApi,
]) {
  fn.addEnvironment('API_ENDPOINT', graphqlUrl);
  fn.addEnvironment('API_KEY', graphqlApiKey);
}

// ---------------------------------------------------------------------------
// Function URLs for Grafana
// ---------------------------------------------------------------------------
const functionUrlCors = {
  allowedOrigins: ['*'],
  // Don't mix HttpMethod.ALL with specific methods: Lambda Function URL CORS
  // rejects combining the wildcard with extra entries.
  allowedMethods: [HttpMethod.ALL],
  allowedHeaders: ['*'],
};

const buttonEventsUrl = backend.buttonEventsApi.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: functionUrlCors,
});

const highscoreUrl = backend.highscoreApi.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: functionUrlCors,
});

// ---------------------------------------------------------------------------
// AWS IoT Core: rules, browser permissions and endpoint lookup
// ---------------------------------------------------------------------------
const iotStack = backend.createStack('iot');
const { region, account } = Stack.of(iotStack);

const BUTTON_TOPIC_FILTER = '+/events/button';

// 1) Rule: ESP32 button presses -> graphqlIoTCoreButtonEvents
//    The handler derives the device id from `topic`.
const buttonEventsRule = new iot.CfnTopicRule(iotStack, 'ButtonEventsRule', {
  topicRulePayload: {
    description: 'Forward ESP32 button events to the graphqlIoTCoreButtonEvents Lambda',
    sql: `SELECT *, topic() AS topic FROM '${BUTTON_TOPIC_FILTER}'`,
    awsIotSqlVersion: '2016-03-23',
    ruleDisabled: false,
    actions: [
      { lambda: { functionArn: backend.graphqlIoTCoreButtonEvents.resources.lambda.functionArn } },
    ],
  },
});

// 2) Rule: device connect/disconnect lifecycle events -> graphqlIoTCoreStatus
//    (updates Device.status and posts to Discord). Browser clients (web-*) are ignored.
const presenceRule = new iot.CfnTopicRule(iotStack, 'DevicePresenceRule', {
  topicRulePayload: {
    description: 'Forward ESP32 connect/disconnect events to the graphqlIoTCoreStatus Lambda',
    sql: "SELECT * FROM '$aws/events/presence/+/+' WHERE NOT startswith(clientId, 'web-')",
    awsIotSqlVersion: '2016-03-23',
    ruleDisabled: false,
    actions: [
      { lambda: { functionArn: backend.graphqlIoTCoreStatus.resources.lambda.functionArn } },
    ],
  },
});

// Allow IoT to invoke the Lambdas. CfnPermission lives in the iot stack (not
// via fn.addPermission) so the data stack doesn't depend on the iot stack.
new lambda.CfnPermission(iotStack, 'ButtonEventsRuleInvoke', {
  action: 'lambda:InvokeFunction',
  functionName: backend.graphqlIoTCoreButtonEvents.resources.lambda.functionArn,
  principal: 'iot.amazonaws.com',
  sourceAccount: account,
  sourceArn: buttonEventsRule.attrArn,
});
new lambda.CfnPermission(iotStack, 'DevicePresenceRuleInvoke', {
  action: 'lambda:InvokeFunction',
  functionName: backend.graphqlIoTCoreStatus.resources.lambda.functionArn,
  principal: 'iot.amazonaws.com',
  sourceAccount: account,
  sourceArn: presenceRule.attrArn,
});

// 3) Browser access to IoT over WebSockets for signed-in users.
//    Authenticated Cognito identities need BOTH an IAM policy on the
//    authenticated role AND an IoT policy attached to the identity. The
//    frontend attaches the IoT policy below to its own identity on connect.
const iotStatements = [
  { actions: ['iot:Connect'], resources: [`arn:aws:iot:${region}:${account}:client/web-*`] },
  { actions: ['iot:Subscribe'], resources: [`arn:aws:iot:${region}:${account}:topicfilter/*/events/button`] },
  { actions: ['iot:Receive'], resources: [`arn:aws:iot:${region}:${account}:topic/*/events/button`] },
];

const browserIotPolicy = new iot.CfnPolicy(iotStack, 'BrowserIotPolicy', {
  policyDocument: {
    Version: '2012-10-17',
    Statement: iotStatements.map((s) => ({ Effect: 'Allow', Action: s.actions, Resource: s.resources })),
  },
});

const authenticatedRolePolicy = new iam.Policy(iotStack, 'AuthenticatedIotAccess', {
  statements: [
    ...iotStatements.map((s) => new iam.PolicyStatement(s)),
    new iam.PolicyStatement({
      actions: ['iot:AttachPolicy'],
      resources: [browserIotPolicy.attrArn],
    }),
  ],
});
authenticatedRolePolicy.attachToRole(backend.auth.resources.authenticatedUserIamRole);

// 4) Look up this account's IoT data (ATS) endpoint so it doesn't have to be
//    hardcoded in the frontend.
const iotEndpoint = new AwsCustomResource(iotStack, 'IotEndpoint', {
  onUpdate: {
    service: 'Iot',
    action: 'describeEndpoint',
    parameters: { endpointType: 'iot:Data-ATS' },
    physicalResourceId: PhysicalResourceId.of('iot-data-ats-endpoint'),
  },
  policy: AwsCustomResourcePolicy.fromSdkCalls({
    resources: AwsCustomResourcePolicy.ANY_RESOURCE,
  }),
  installLatestAwsSdk: false,
});

// ---------------------------------------------------------------------------
// Outputs (available in amplify_outputs.json under "custom")
// ---------------------------------------------------------------------------
backend.addOutput({
  custom: {
    buttonEventsApiUrl: buttonEventsUrl.url,
    highscoreApiUrl: highscoreUrl.url,
    iotRegion: region,
    iotEndpoint: iotEndpoint.getResponseField('endpointAddress'),
    iotBrowserPolicyName: browserIotPolicy.ref,
  },
});
