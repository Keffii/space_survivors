// Map Cognito / Amplify error names to plain messages. Never show raw provider text.

const WRONG_CREDENTIALS = 'Incorrect username, email or password.';
const RATE_LIMITED = 'Too many attempts. Wait a few minutes and try again.';
const NETWORK = 'No connection. Check your internet and try again.';

export function errorName(err: unknown): string {
  return typeof err === 'object' && err !== null && 'name' in err ? String((err as { name: unknown }).name) : '';
}

function errorText(err: unknown): string {
  return typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : '';
}

export function authErrorMessage(err: unknown): string {
  const name = errorName(err);

  switch (name) {
    case 'NotAuthorizedException':
      // Cognito uses the same code when it locks sign-in after repeated failures.
      return /attempts exceeded/i.test(errorText(err)) ? RATE_LIMITED : WRONG_CREDENTIALS;
    case 'UserNotFoundException':
      return WRONG_CREDENTIALS;
    case 'UsernameExistsException':
      return 'That username is taken. Try another one.';
    case 'AliasExistsException':
      return 'That email already belongs to another account.';
    case 'CodeMismatchException':
      return "That code isn't right. Check the email and try again.";
    case 'ExpiredCodeException':
      return 'That code has expired. Send a new one.';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException':
      return RATE_LIMITED;
    case 'InvalidPasswordException':
      return "That password doesn't meet all the rules yet.";
    case 'CodeDeliveryFailureException':
      return "We couldn't send the email. Check the address and try again.";
    case 'NetworkError':
      return NETWORK;
  }

  if (name.startsWith('Empty')) return 'Fill in every field.';
  if (typeof navigator !== 'undefined' && !navigator.onLine) return NETWORK;
  if (/network|failed to fetch/i.test(errorText(err))) return NETWORK;
  return 'Something went wrong. Try again.';
}
