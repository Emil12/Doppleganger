import { Link } from 'wouter';
import { GasStationGame } from '../components/GasStationGame';
import '../game.css';

export function HomePage() {
  return (
    <main className="game-page">
      <header className="game-header">
        <div>
          <p className="eyebrow">HIGHWAY 09 · 2:13 AM</p>
          <h1>DOPPLEGANGER</h1>
        </div>
        <div className="header-actions">
          <span className="quality-badge">NIGHT SHIFT · OPEN</span>
          <Link href="/auth" className="account-link">ACCOUNT</Link>
        </div>
      </header>

      <GasStationGame />

      <footer className="game-footer">
        <span>WASD · MOUSE TO LOOK · SHIFT SPRINT · C CROUCH · SPACE JUMP</span>
        <span>GO THROUGH THE GREEN DOOR</span>
      </footer>
    </main>
  );
}
