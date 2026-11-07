import { signIn, signUp } from 'aws-amplify/auth';

/**
 * Guest accounts: "Sign in as guest" creates a throwaway Cognito user per visitor, so nobody shares
 * a password and every guest gets their own scores. The pre-sign-up Lambda
 * (amplify/auth/pre-sign-up) confirms these accounts without an email. Keep the two in sync.
 */
const GUEST_PREFIX = 'guest-';
const GUEST_EMAIL_DOMAIN = 'guest.invalid';

export const isGuestUsername = (username: string) => username.startsWith(GUEST_PREFIX);

/** "Guest 3fa9" for guest accounts (short id keeps leaderboard rows apart), the username otherwise. */
export const displayName = (username: string) =>
  isGuestUsername(username) ? `Guest ${username.slice(GUEST_PREFIX.length, GUEST_PREFIX.length + 4)}` : username;

const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');

/** Create a fresh guest account and sign in with it. The password is never shown; the session keeps the guest signed in. */
export async function signInAsGuest(): Promise<void> {
  const username = `${GUEST_PREFIX}${randomHex(5)}`;
  // Upper, lower, digit and symbol, so it passes the Cognito password policy
  const password = `Gx9!${randomHex(16)}`;

  const { nextStep } = await signUp({
    username,
    password,
    options: { userAttributes: { email: `${username}@${GUEST_EMAIL_DOMAIN}` } },
  });
  if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
    // The pre-sign-up Lambda isn't deployed, so Cognito wants an email code that will never arrive
    throw Object.assign(new Error("Guest sign-in isn't available right now. Create an account instead."), {
      name: 'GuestUnavailable',
    });
  }
  const { isSignedIn } = await signIn({ username, password });
  if (!isSignedIn) throw Object.assign(new Error('Guest sign-in failed. Try again.'), { name: 'GuestUnavailable' });
}
