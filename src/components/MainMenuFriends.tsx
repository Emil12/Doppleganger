import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  addGameFriend,
  type GameFriend,
  loadGameFriends,
  searchGamePlayers,
} from '../lib/gameFriends';

type MainMenuFriendsProps = {
  signedIn: boolean;
  onBack: () => void;
};

export function MainMenuFriends({ signedIn, onBack }: MainMenuFriendsProps) {
  const [friends, setFriends] = useState<GameFriend[]>([]);
  const [results, setResults] = useState<GameFriend[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refreshFriends = async () => setFriends(await loadGameFriends());

  useEffect(() => {
    if (signedIn) void refreshFriends();
  }, [signedIn]);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true);
    setMessage('');
    const matches = await searchGamePlayers(query);
    setResults(matches);
    setMessage(matches.length === 0 ? 'NO PLAYERS FOUND' : '');
    setBusy(false);
  };

  const add = async (player: GameFriend) => {
    setBusy(true);
    const added = await addGameFriend(player.playerId);
    if (added) {
      setResults((current) => current.filter(({ playerId }) => playerId !== player.playerId));
      setMessage(`${player.displayName} ADDED`);
      await refreshFriends();
    } else {
      setMessage('COULD NOT ADD FRIEND');
    }
    setBusy(false);
  };

  return (
    <div className="friends-panel">
      <header><strong>FRIENDS</strong><span>{friends.length} ADDED</span></header>
      {!signedIn ? (
        <div className="friends-panel__signin">
          <span>SIGN IN TO FIND AND SAVE FRIENDS</span>
          <Link href="/auth">SIGN IN</Link>
        </div>
      ) : (
        <>
          <form onSubmit={(event) => { void search(event); }}>
            <input
              aria-label="Search player name"
              value={query}
              maxLength={24}
              placeholder="TYPE A PLAYER NAME"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" disabled={busy || query.trim().length < 2}>SEARCH</button>
          </form>
          {message && <small role="status">{message}</small>}
          <div className="friends-panel__list">
            {results.map((player) => (
              <article key={player.playerId}>
                <span>{player.displayName}</span>
                <button type="button" disabled={busy} onClick={() => { void add(player); }}>ADD</button>
              </article>
            ))}
            {results.length === 0 && friends.map((friend) => (
              <article key={friend.playerId}><span>{friend.displayName}</span><i>FRIEND</i></article>
            ))}
          </div>
        </>
      )}
      <button type="button" onClick={onBack}>BACK</button>
    </div>
  );
}
