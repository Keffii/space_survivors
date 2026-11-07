import { useState, type FormEvent } from 'react';
import { AuthAlert, type Notice } from './AuthAlert';
import { APP_NAME } from './content';
import { authErrorMessage } from './errors';
import { signInAndContinue, type SignInHandlers } from './flows';
import { PasswordField } from './PasswordField';
import { SubmitButton } from './SubmitButton';

type Props = SignInHandlers & {
  initialNotice?: Notice;
  /** False on first load so phones don't scroll past the overview and open the keyboard. */
  autoFocus: boolean;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
};

export function SignInScreen({ initialNotice, autoFocus, onCreateAccount, onForgotPassword, ...handlers }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<Notice | null>(initialNotice ?? null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id || !password) {
      setNotice({ kind: 'error', text: 'Enter your username or email and your password.' });
      return;
    }
    setNotice(null);
    setLoading(true);
    try {
      await signInAndContinue(id, password, handlers);
    } catch (err) {
      setNotice({ kind: 'error', text: authErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <header className="auth-header">
        <h1 className="auth-title">Sign in to play</h1>
      </header>

      <AuthAlert notice={notice} />

      <div className="auth-field">
        <label htmlFor="signin-id" className="auth-label">
          Username or email
        </label>
        <input
          id="signin-id"
          className="auth-input"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          required
        />
      </div>

      <PasswordField
        id="signin-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        labelAction={
          <button type="button" className="auth-link" onClick={onForgotPassword}>
            Forgot password?
          </button>
        }
      />

      <SubmitButton loading={loading} loadingLabel="Signing in…">
        Sign in
      </SubmitButton>

      <p className="auth-switch">
        New to {APP_NAME}?{' '}
        <button type="button" className="auth-link" onClick={onCreateAccount}>
          Create an account
        </button>
      </p>
    </form>
  );
}
