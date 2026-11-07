import { ArrowLeftIcon } from './icons';

/** "Back to sign in" shown at the top of every screen except sign in. */
export function BackLink({ onClick, label = 'Back to sign in' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="auth-link auth-back" onClick={onClick}>
      <ArrowLeftIcon width={16} height={16} />
      {label}
    </button>
  );
}
