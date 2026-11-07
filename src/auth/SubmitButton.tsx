import type { ReactNode } from 'react';

type Props = {
  loading: boolean;
  loadingLabel: string;
  disabled?: boolean;
  children: ReactNode;
};

export function SubmitButton({ loading, loadingLabel, disabled, children }: Props) {
  return (
    <button type="submit" className="auth-submit" disabled={disabled || loading} aria-busy={loading}>
      {loading && <span className="auth-spinner" aria-hidden="true" />}
      <span>{loading ? loadingLabel : children}</span>
    </button>
  );
}
