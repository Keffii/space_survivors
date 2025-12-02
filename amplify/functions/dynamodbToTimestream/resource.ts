import { defineFunction } from '@aws-amplify/backend';

export const dynamodbToTimestream = defineFunction({
  name: 'dynamodbToTimestream',
  entry: './handler.ts',
  environment: {
    TIMESTREAM_DATABASE: 'SpaceSurvivors',
  },
  timeoutSeconds: 30,
});
