import { defineFunction } from '@aws-amplify/backend';

// Triggered by the IoT rule "+/events/button" defined in amplify/backend.ts.
// API_ENDPOINT / API_KEY are injected in amplify/backend.ts from the deployed
// AppSync API.
export const graphqlIoTCoreButtonEvents = defineFunction({
  name: 'graphqlIoTCoreButtonEvents',
  entry: './handler.ts',
  resourceGroupName: 'data',
});
