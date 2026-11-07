import { useState, type FormEvent } from 'react';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import { AuthAlert, type Notice } from './AuthAlert';
import { BackLink } from './BackLink';
import { CodeField } from './CodeField';
import { authErrorMessage, errorName } from './errors';
import { RESEND_SECONDS, signInAndContinue, useCountdown, type SignInHandlers } from './flows';
import { PasswordField } from './PasswordField';
import { passwordMeetsRules } from './passwordRules';
import { SubmitButton } from './SubmitButton';

type Props = SignInHandlers & {
  onBack: (notice?: Notice) => void;
  initialNotice?: Notice;
};

// Errors that would reveal whether an account exists. Treat them as "sent".
const SILENT = new Set(['UserNotFoundException', 'InvalidParameterException']);

export function ForgotPasswordScreen({ onBack, initialNotice, ...handlers }: Props) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<Notice | null>(initialNotice ?? null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, restartCountdown] = useCountdown(RESEND_SECONDS);

  const sendCode = async (): Promise<boolean> => {
    const id = identifier.trim();
    let destination: string | undefined;
    try {
      const out = await resetPassword({ username: id });
      destination = out.nextStep.codeDeliveryDetails?.destination;
    } catch (err) {
      if (!SILENT.has(errorName(err))) {
        setNotice({ kind: 'error', text: authErrorMessage(err) });
        return false;
      }
    }
    setNotice({ kind: 'info', text: `If an account matches, we sent a code to ${destination ?? 'its email address'}.` });
    return true;
  };

  const request = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setNotice({ kind: 'error', text: 'Enter your username or email.' });
      return;
    }
    setNotice(null);
    setLoading(true);
    const ok = await sendCode();
    setLoading(false);
    if (ok) {
      restartCountdown();
      setStep('reset');
    }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setNotice({ kind: 'error', text: 'Enter the 6-digit code from the email.' });
      return;
    }
    if (!passwordMeetsRules(password)) {
      setNotice({ kind: 'error', text: "Your new password doesn't meet all the rules yet." });
      return;
    }
    const id = identifier.trim();
    setNotice(null);
    setLoading(true);
    try {
      await confirmResetPassword({ username: id, confirmationCode: code, newPassword: password });
    } catch (err) {
      setNotice({ kind: 'error', text: authErrorMessage(err) });
      setLoading(false);
      return;
    }
    try {
      await signInAndContinue(id, password, handlers);
    } catch {
      onBack({ kind: 'success', text: 'Your password is saved. Sign in with it to continue.' });
    }
  };

  const resend = async () => {
    restartCountdown();
    await sendCode();
  };

  if (step === 'request') {
    return (
      <form className="auth-form" onSubmit={request} noValidate>
        <BackLink onClick={() => onBack()} />
        <header className="auth-header">
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">Enter your username or email and we'll send you a code to choose a new password.</p>
        </header>

        <AuthAlert notice={notice} />

        <div className="auth-field">
          <label htmlFor="forgot-id" className="auth-label">
            Username or email
          </label>
          <input
            id="forgot-id"
            className="auth-input"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
          />
        </div>

        <SubmitButton loading={loading} loadingLabel="Sending code…">
          Send code
        </SubmitButton>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={reset} noValidate>
      <BackLink onClick={() => onBack()} />
      <header className="auth-header">
        <h1 className="auth-title">Choose a new password</h1>
        <p className="auth-subtitle">Enter the code from the email, then pick a new password.</p>
      </header>

      <AuthAlert notice={notice} />

      {/* Lets password managers save the new password against the right account. */}
      <input type="text" name="username" autoComplete="username" value={identifier} readOnly hidden />

      <CodeField id="reset-code" value={code} onChange={setCode} autoFocus />

      <PasswordField
        id="reset-password"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        showRules
      />

      <SubmitButton loading={loading} loadingLabel="Saving…">
        Save and sign in
      </SubmitButton>

      <div className="auth-actions">
        <button type="button" className="auth-link" onClick={resend} disabled={secondsLeft > 0}>
          {secondsLeft > 0 ? `Send a new code in ${secondsLeft}s` : 'Send a new code'}
        </button>
        <p>Can't find it? Check your spam folder.</p>
      </div>
    </form>
  );
}
