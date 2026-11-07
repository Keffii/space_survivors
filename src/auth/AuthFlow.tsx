import { useState } from 'react';
import type { Notice } from './AuthAlert';
import { AuthLayout } from './AuthLayout';
import { ConfirmEmailScreen } from './ConfirmEmailScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import type { SignInHandlers } from './flows';
import { SignInScreen } from './SignInScreen';
import { SignUpScreen } from './SignUpScreen';

type View =
  | { name: 'signIn'; notice?: Notice }
  | { name: 'signUp' }
  | { name: 'confirm'; username: string; password: string; destination?: string }
  | { name: 'forgot'; notice?: Notice };

/** Sign in, sign up, confirm email and forgot password, inside the shared layout. */
export function AuthFlow({ onSignedIn }: { onSignedIn: () => void }) {
  const [view, setViewState] = useState<View>({ name: 'signIn' });
  // Only move focus into the form after the visitor has navigated between screens.
  const [navigated, setNavigated] = useState(false);

  const setView = (next: View) => {
    setNavigated(true);
    setViewState(next);
  };

  const toSignIn = (notice?: Notice) => setView({ name: 'signIn', notice });

  const handlers: SignInHandlers = {
    onSignedIn,
    onNeedsConfirm: (username, password, destination) => setView({ name: 'confirm', username, password, destination }),
    onNeedsReset: () =>
      setView({ name: 'forgot', notice: { kind: 'info', text: 'You need to choose a new password before you can sign in.' } }),
  };

  return (
    <AuthLayout>
      {view.name === 'signIn' && (
        <SignInScreen
          key="signIn"
          {...handlers}
          initialNotice={view.notice}
          autoFocus={navigated}
          onCreateAccount={() => setView({ name: 'signUp' })}
          onForgotPassword={() => setView({ name: 'forgot' })}
        />
      )}
      {view.name === 'signUp' && <SignUpScreen key="signUp" {...handlers} onSignIn={() => toSignIn()} />}
      {view.name === 'confirm' && (
        <ConfirmEmailScreen
          key="confirm"
          {...handlers}
          username={view.username}
          password={view.password}
          destination={view.destination}
          onBack={toSignIn}
        />
      )}
      {view.name === 'forgot' && (
        <ForgotPasswordScreen key="forgot" {...handlers} initialNotice={view.notice} onBack={toSignIn} />
      )}
    </AuthLayout>
  );
}
