import { AlertIcon, InfoIcon, SuccessIcon } from './icons';

export type Notice = { kind: 'error' | 'success' | 'info'; text: string };

export function AuthAlert({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  const Icon = notice.kind === 'error' ? AlertIcon : notice.kind === 'success' ? SuccessIcon : InfoIcon;
  return (
    <div className={`auth-alert auth-alert--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
      <Icon className="auth-alert__icon" />
      <p>{notice.text}</p>
    </div>
  );
}
