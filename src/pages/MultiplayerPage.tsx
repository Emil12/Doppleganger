import { useState } from 'react';
import { useLocation } from 'wouter';
import { GasStationGame } from '../components/GasStationGame';
import { MultiplayerLobby } from '../components/MultiplayerLobby';
import { type MultiplayerRoomSession } from '../lib/multiplayerRoom';
import '../game.css';

export function MultiplayerPage() {
  const [, navigate] = useLocation();
  const [session, setSession] = useState<MultiplayerRoomSession | null>(null);
  const [notice, setNotice] = useState('');

  if (!session) return <MultiplayerLobby notice={notice} onJoin={setSession} />;

  return (
    <main className="game-page">
      <GasStationGame
        multiplayerRoom={session}
        onKickedMultiplayer={() => {
          setNotice('KICKED: YOU USED ALL 3 REVIVES');
          setSession(null);
        }}
        onLeaveMultiplayer={() => navigate('/')}
      />
    </main>
  );
}
