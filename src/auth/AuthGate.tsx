import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { AuthFlow } from './AuthFlow';
import { APP_NAME, LOGO_SRC } from './content';
import './auth.css';

type State = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; username: string };

type SignedInUser = { username: string; signOut: () => void };

function LoadingScreen() {
  return (
    <div className="auth-loading" role="status" aria-label={`Loading ${APP_NAME}`}>
      <div className="auth-loading__inner">
        <img className="auth-loading__logo" src={LOGO_SRC} alt="" width={72} height={72} />
        <div className="auth-loading__bar" />
      </div>
    </div>
  );
}

/** Checks the saved session, then shows the auth screens or the signed-in app. */
export function AuthGate({ children }: { children: (user: SignedInUser) => ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setState({ status: 'signedIn', username: user.username });
    } catch {
      setState({ status: 'signedOut' });
    }
  }, []);

  useEffect(() => {
    refresh();
    return Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') refresh();
      if (payload.event === 'signedOut' || payload.event === 'tokenRefresh_failure') setState({ status: 'signedOut' });
    });
  }, [refresh]);

  const handleSignOut = useCallback(() => {
    signOut().finally(() => setState({ status: 'signedOut' }));
  }, []);

  if (state.status === 'loading') return <LoadingScreen />;
  if (state.status === 'signedOut') return <AuthFlow onSignedIn={refresh} />;
  return <>{children({ username: state.username, signOut: handleSignOut })}</>;
}
