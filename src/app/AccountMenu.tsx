import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, LogOutIcon } from '../auth/icons';

export function AccountMenu({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', close); // e.g. clicking into the game iframe
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', close);
    };
  }, [open]);

  return (
    <div className="account" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="account__button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden="true">
          {username.charAt(0).toUpperCase()}
        </span>
        <span className="account__name">{username}</span>
        <ChevronDownIcon width={16} height={16} />
      </button>
      {open && (
        <div className="account__menu" role="menu" aria-label="Account">
          <p className="account__label">
            Signed in as
            <strong>{username}</strong>
          </p>
          <button type="button" role="menuitem" className="account__item" onClick={onSignOut} autoFocus>
            <LogOutIcon width={18} height={18} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
