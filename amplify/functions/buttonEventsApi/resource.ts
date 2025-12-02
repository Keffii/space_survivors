import { defineFunction, secret } from '@aws-amplify/backend';

export const buttonEventsApi = defineFunction({
  name: 'buttonEventsApi',
  entry: './handler.ts',
  environment: {
    API_ENDPOINT: secret('CUSTOM_LAMBDA_GRAPHQL_ENDPOINT'),
    API_KEY: secret('CUSTOM_LAMBDA_GRAPHQL_KEY')
  },
  timeoutSeconds: 30
});
