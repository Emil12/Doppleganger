import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  createMultiplayerSession,
  createRoomCode,
  normalizeRoomCode,
  type MultiplayerRoomSession,
} from '../lib/multiplayerRoom';
import { supabase } from '../lib/supabase';
import './MultiplayerLobby.css';

type MultiplayerLobbyProps = {
  notice?: string;
  onJoin: (session: MultiplayerRoomSession) => void;
};

export function MultiplayerLobby({ notice, onJoin }: MultiplayerLobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  const enterRoom = async (code: string) => {
    setBusy(true);
    setError('');
    const session = await createMultiplayerSession(code);
    setBusy(false);
    if (!session) {
      setError('SIGN IN AND ENTER A VALID 6-CHARACTER ROOM CODE');
      return;
    }
    onJoin(session);
  };

  return (
    <main className="multiplayer-lobby">
      <section className="multiplayer-lobby__panel">
        <header>
          <span>SUPABASE REALTIME</span>
          <b>ONLINE CO-OP</b>
        </header>
        <h1>MULTIPLAYER SHIFT</h1>
        <p>Create a room and share its code, or enter a code from another player.</p>
        {notice && <small role="status">{notice}</small>}
        {signedIn === false ? (
          <div className="multiplayer-lobby__signin">
            <strong>ACCOUNT REQUIRED</strong>
            <span>Online rooms need a signed-in player identity.</span>
            <Link href="/auth">SIGN IN</Link>
          </div>
        ) : (
          <>
            <button
              className="multiplayer-lobby__create"
              type="button"
              disabled={busy || signedIn !== true}
              onClick={() => { void enterRoom(createRoomCode()); }}
            >
              CREATE NEW ROOM
            </button>
            <div className="multiplayer-lobby__divider"><span>OR JOIN WITH CODE</span></div>
            <label>
              ROOM CODE
              <input
                value={roomCode}
                maxLength={6}
                placeholder="ABC123"
                onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
              />
            </label>
            <button
              type="button"
              disabled={busy || roomCode.length !== 6}
              onClick={() => { void enterRoom(roomCode); }}
            >
              {busy ? 'CONNECTING…' : 'JOIN ROOM'}
            </button>
          </>
        )}
        {error && <small role="alert">{error}</small>}
        <footer>
          <Link href="/">← BACK TO MAIN MENU</Link>
          <span>UP TO 4 PLAYERS</span>
        </footer>
      </section>
    </main>
  );
}
