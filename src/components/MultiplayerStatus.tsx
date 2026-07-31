import { type MultiplayerConnection } from '../lib/multiplayerSystem';
import './MultiplayerStatus.css';

type MultiplayerStatusProps = {
  code: string;
  playerCount: number;
  status: MultiplayerConnection;
  onLeave: () => void;
};

export function MultiplayerStatus({
  code,
  playerCount,
  status,
  onLeave,
}: MultiplayerStatusProps) {
  return (
    <aside className={`multiplayer-status is-${status}`}>
      <i aria-hidden="true" />
      <span>
        <small>CO-OP ROOM · {status.toUpperCase()}</small>
        <strong>{code} · {playerCount}/4 PLAYERS</strong>
      </span>
      <button type="button" onClick={onLeave}>LEAVE</button>
    </aside>
  );
}
