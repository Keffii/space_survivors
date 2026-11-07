import { useState, type FormEvent } from 'react';
import { signUp } from 'aws-amplify/auth';
import { AuthAlert, type Notice } from './AuthAlert';
import { BackLink } from './BackLink';
import { authErrorMessage } from './errors';
import { signInAndContinue, type SignInHandlers } from './flows';
import { PasswordField } from './PasswordField';
import { passwordMeetsRules } from './passwordRules';
import { SubmitButton } from './SubmitButton';

type Props = SignInHandlers & {
  onSignIn: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function usernameProblem(username: string): string | null {
  if (/\s/.test(username)) return "Usernames can't contain spaces.";
  if (username.includes('@')) return 'Pick a username, not an email address. Your email goes in the next field.';
  if (username.length < 3) return 'Usernames need at least 3 characters.';
  return null;
}

export function SignUpScreen({ onSignIn, ...handlers }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const problem =
      usernameProblem(username) ??
      (EMAIL.test(trimmedEmail) ? null : 'Enter a valid email address, like name@example.com.') ??
      (passwordMeetsRules(password) ? null : "Your password doesn't meet all the rules yet.");
    if (problem) {
      setNotice({ kind: 'error', text: problem });
      return;
    }

    setNotice(null);
    setLoading(true);
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username,
        password,
        options: { userAttributes: { email: trimmedEmail } },
      });
      if (!isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        handlers.onNeedsConfirm(username, password, nextStep.codeDeliveryDetails.destination ?? trimmedEmail);
        return;
      }
      await signInAndContinue(username, password, handlers);
    } catch (err) {
      setNotice({ kind: 'error', text: authErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <BackLink onClick={onSignIn} />
      <header className="auth-header">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">It takes a minute. You'll get a code by email to confirm it.</p>
      </header>

      <AuthAlert notice={notice} />

      <div className="auth-field">
        <label htmlFor="signup-username" className="auth-label">
          Username
        </label>
        <input
          id="signup-username"
          className="auth-input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="signup-username-hint"
          autoFocus
          required
        />
        <p className="auth-hint" id="signup-username-hint">
          No spaces. Capital letters don't matter when signing in.
        </p>
      </div>

      <div className="auth-field">
        <label htmlFor="signup-email" className="auth-label">
          Email
        </label>
        <input
          id="signup-email"
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="signup-email-hint"
          required
        />
        <p className="auth-hint" id="signup-email-hint">
          You can sign in with this email or your username.
        </p>
      </div>

      <PasswordField
        id="signup-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        showRules
      />

      <SubmitButton loading={loading} loadingLabel="Creating account…">
        Create account
      </SubmitButton>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" className="auth-link" onClick={onSignIn}>
          Sign in
        </button>
      </p>
    </form>
  );
}
