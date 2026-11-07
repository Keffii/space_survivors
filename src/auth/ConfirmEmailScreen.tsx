import { useState, type FormEvent } from 'react';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { AuthAlert, type Notice } from './AuthAlert';
import { BackLink } from './BackLink';
import { CodeField } from './CodeField';
import { authErrorMessage } from './errors';
import { RESEND_SECONDS, signInAndContinue, useCountdown, type SignInHandlers } from './flows';
import { SubmitButton } from './SubmitButton';

type Props = SignInHandlers & {
  username: string;
  password: string;
  destination?: string;
  onBack: (notice?: Notice) => void;
};

export function ConfirmEmailScreen({ username, password, destination, onBack, ...handlers }: Props) {
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState(destination);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, restartCountdown] = useCountdown(RESEND_SECONDS);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setNotice(null);
    setLoading(true);
    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (err) {
      setNotice({ kind: 'error', text: authErrorMessage(err) });
      setLoading(false);
      return;
    }
    // Confirmed. Sign straight in with the password that's still in memory.
    try {
      await signInAndContinue(username, password, handlers);
    } catch {
      onBack({ kind: 'success', text: 'Your email is confirmed. Sign in to continue.' });
    }
  };

  const resend = async () => {
    setNotice(null);
    restartCountdown();
    try {
      const details = await resendSignUpCode({ username });
      if (details.destination) setSentTo(details.destination);
      setNotice({ kind: 'info', text: `We sent a new code to ${details.destination ?? 'your email'}.` });
    } catch (err) {
      setNotice({ kind: 'error', text: authErrorMessage(err) });
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <BackLink onClick={() => onBack()} />
      <header className="auth-header">
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong>{sentTo ?? 'your email'}</strong>. Enter it below to confirm your account.
        </p>
      </header>

      <AuthAlert notice={notice} />

      <CodeField id="confirm-code" value={code} onChange={setCode} autoFocus />

      <SubmitButton loading={loading} loadingLabel="Confirming…" disabled={code.length !== 6}>
        Confirm and sign in
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
