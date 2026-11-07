import { useState, type ReactNode } from 'react';
import { CheckIcon, DotIcon, EyeIcon, EyeOffIcon } from './icons';
import { PASSWORD_RULES } from './passwordRules';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  labelAction?: ReactNode;
  showRules?: boolean;
  autoFocus?: boolean;
};

export function PasswordField({ id, label, value, onChange, autoComplete, labelAction, showRules, autoFocus }: Props) {
  const [visible, setVisible] = useState(false);
  const rulesId = `${id}-rules`;

  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="auth-password">
        <input
          id={id}
          className="auth-input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-describedby={showRules ? rulesId : undefined}
          required
        />
        <button
          type="button"
          className="auth-password__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {showRules && (
        <ul className="auth-rules" id={rulesId}>
          {PASSWORD_RULES.map((rule) => {
            const done = rule.test(value);
            return (
              <li key={rule.id} className={done ? 'is-done' : undefined}>
                {done ? <CheckIcon width={16} height={16} /> : <DotIcon width={16} height={16} />}
                <span>
                  {rule.label}
                  <span className="sr-only">{done ? ' (done)' : ' (not yet)'}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
