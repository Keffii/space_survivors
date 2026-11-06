import { defineFunction } from '@aws-amplify/backend';

// API_ENDPOINT / API_KEY are injected in amplify/backend.ts from the deployed
// AppSync API. The function lives in the "data" stack to avoid a circular
// dependency between the data and function stacks.
export const highscoreApi = defineFunction({
  name: 'highscoreApi',
  entry: './handler.ts',
  timeoutSeconds: 30,
  resourceGroupName: 'data',
});
