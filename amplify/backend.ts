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
