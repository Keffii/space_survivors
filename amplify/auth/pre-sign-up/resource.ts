import { defineFunction } from '@aws-amplify/backend';

// Confirms "Sign in as guest" accounts without an email code (see handler.ts and src/auth/guest.ts).
export const preSignUp = defineFunction({
  name: 'guestPreSignUp',
  entry: './handler.ts',
  resourceGroupName: 'auth',
});
