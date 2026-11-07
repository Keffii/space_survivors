import type { PreSignUpTriggerHandler } from 'aws-lambda';

// Guest accounts are "guest-" + 10 hex characters with an "@guest.invalid" email, created by
// src/auth/guest.ts. Confirm them without sending a code; every other sign-up confirms by email.
const GUEST_USERNAME = /^guest-[0-9a-f]{10}$/;
const GUEST_EMAIL_DOMAIN = '@guest.invalid';

export const handler: PreSignUpTriggerHandler = async (event) => {
  const email = event.request.userAttributes.email ?? '';
  if (GUEST_USERNAME.test(event.userName) && email.endsWith(GUEST_EMAIL_DOMAIN)) {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = false; // the address doesn't exist
  }
  return event;
};
