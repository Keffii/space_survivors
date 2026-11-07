import { useCallback, useEffect, useState } from 'react';
import { resendSignUpCode, signIn } from 'aws-amplify/auth';
import { errorName } from './errors';

export type SignInHandlers = {
  onSignedIn: () => void;
  /** The account exists but its email was never confirmed. A new code has been sent. */
  onNeedsConfirm: (username: string, password: string, destination?: string) => void;
  onNeedsReset: () => void;
};

/**
 * Sign in and route to the next step. An unconfirmed account goes to the
 * confirm-email step with a fresh code instead of showing an error.
 */
export async function signInAndContinue(username: string, password: string, h: SignInHandlers): Promise<void> {
  const toConfirm = async () => {
    const details = await resendSignUpCode({ username });
    h.onNeedsConfirm(username, password, details.destination);
  };

  try {
    const { isSignedIn, nextStep } = await signIn({ username, password });
    if (isSignedIn) return h.onSignedIn();
    if (nextStep.signInStep === 'CONFIRM_SIGN_UP') return toConfirm();
    if (nextStep.signInStep === 'RESET_PASSWORD') return h.onNeedsReset();
    throw Object.assign(new Error(`Unsupported sign-in step: ${nextStep.signInStep}`), { name: 'UnsupportedStep' });
  } catch (err) {
    const name = errorName(err);
    if (name === 'UserNotConfirmedException') return toConfirm();
    if (name === 'UserAlreadyAuthenticatedException') return h.onSignedIn();
    throw err;
  }
}

/** Seconds left before "Send a new code" is allowed again. */
export function useCountdown(initialSeconds: number) {
  const [left, setLeft] = useState(initialSeconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  const restart = useCallback(() => setLeft(initialSeconds), [initialSeconds]);
  return [left, restart] as const;
}

export const RESEND_SECONDS = 30;
