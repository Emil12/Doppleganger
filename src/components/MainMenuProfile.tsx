import { type FormEvent, useEffect, useState } from 'react';
import './MainMenuProfile.css';

type MainMenuProfileProps = {
  displayName: string;
  signedIn: boolean;
  busy: boolean;
  onSave: (displayName: string) => Promise<boolean>;
  onSignIn: () => void;
};

export function MainMenuProfile({
  displayName,
  signedIn,
  busy,
  onSave,
  onSignIn,
}: MainMenuProfileProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [error, setError] = useState('');

  useEffect(() => setDraft(displayName), [displayName]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedName = draft.trim().replace(/\s+/g, ' ');
    if (cleanedName.length < 2) {
      setError('Use at least 2 characters.');
      return;
    }
    setError('');
    if (await onSave(cleanedName)) {
      setOpen(false);
    } else {
      setError('Could not save. Please try again.');
    }
  };

  const handleProfileClick = () => {
    if (!signedIn) {
      onSignIn();
      return;
    }
    setError('');
    setOpen((current) => !current);
  };

  return (
    <div className="menu-profile">
      <button
        className="menu-profile__trigger"
        type="button"
        aria-expanded={open}
        aria-label={signedIn ? `Edit nickname ${displayName}` : 'Sign in to create a profile'}
        onClick={handleProfileClick}
      >
        <span className="menu-profile__avatar" aria-hidden="true">
          {signedIn ? displayName.charAt(0).toUpperCase() : '?'}
        </span>
        <span className="menu-profile__identity">
          <strong>{displayName}</strong>
          <small>{signedIn ? 'EDIT NICKNAME' : 'SIGN IN'}</small>
        </span>
      </button>

      {open && (
        <form className="menu-profile__editor" onSubmit={(event) => { void submit(event); }}>
          <label htmlFor="profile-nickname">NICKNAME</label>
          <input
            id="profile-nickname"
            value={draft}
            minLength={2}
            maxLength={24}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
          />
          <small className={error ? 'is-error' : ''}>
            {error || '2–24 characters · shown to friends'}
          </small>
          <div className="menu-profile__editor-actions">
            <button type="button" onClick={() => setOpen(false)}>CANCEL</button>
            <button type="submit" disabled={busy}>SAVE</button>
          </div>
        </form>
      )}
    </div>
  );
}
