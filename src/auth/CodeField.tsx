type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  label?: string;
};

/** One 6-digit code input. Only digits are kept. */
export function CodeField({ id, value, onChange, autoFocus, label = 'Confirmation code' }: Props) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <input
        id={id}
        className="auth-input auth-input--code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        autoFocus={autoFocus}
        required
      />
    </div>
  );
}
