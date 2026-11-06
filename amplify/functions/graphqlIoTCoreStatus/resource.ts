import { defineFunction, secret } from '@aws-amplify/backend';

// Triggered by the IoT lifecycle (connect/disconnect) rule defined in
// amplify/backend.ts. API_ENDPOINT / API_KEY are injected in amplify/backend.ts
// from the deployed AppSync API.
export const graphqlIoTCoreStatus = defineFunction({
  name: 'graphqlIoTCoreStatus',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    // Set this secret in the Amplify console (Hosting → Secrets) or with
    // `npx ampx sandbox secret set DISCORD_WEBHOOK` for a sandbox.
    DISCORD_WEBHOOK: secret('DISCORD_WEBHOOK'),
  },
});
