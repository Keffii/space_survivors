import { defineBackend } from '@aws-amplify/backend';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { highscoreApi } from './functions/highscoreApi/resource';

const backend = defineBackend({
  auth,
  data,
  highscoreApi,
});

// ---------------------------------------------------------------------------
// Cognito: sign in with a username OR the verified email (email is an alias
// instead of the username), case-insensitive usernames, Lite tier (free up to
// 10,000 monthly users). Cognito can't change UsernameAttributes/AliasAttributes
// on an existing pool, so the pool gets a new logical ID: CloudFormation creates
// a new pool, repoints the client, identity pool and API, then deletes the old
// one (and its users). Keep this ID from now on.
// ---------------------------------------------------------------------------
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.overrideLogicalId('amplifyAuthUserPoolUsernameAlias');
cfnUserPool.addPropertyDeletionOverride('UsernameAttributes');
cfnUserPool.aliasAttributes = ['email'];
cfnUserPool.usernameConfiguration = { caseSensitive: false };
cfnUserPool.userPoolTier = 'LITE';

// ---------------------------------------------------------------------------
// GraphQL endpoint + API key for the highscore Lambda, taken from the
// deployed AppSync API (no secrets to copy by hand).
// ---------------------------------------------------------------------------
const graphqlApiKey = backend.data.apiKey;
if (!graphqlApiKey) {
  throw new Error('The data resource must have API key authorization enabled.');
}
backend.highscoreApi.addEnvironment('API_ENDPOINT', backend.data.graphqlUrl);
backend.highscoreApi.addEnvironment('API_KEY', graphqlApiKey);

// ---------------------------------------------------------------------------
// Public Function URL with highscores (e.g. for a Grafana JSON data source)
// ---------------------------------------------------------------------------
const highscoreUrl = backend.highscoreApi.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.ALL],
    allowedHeaders: ['*'],
  },
});

backend.addOutput({
  custom: {
    highscoreApiUrl: highscoreUrl.url,
  },
});
