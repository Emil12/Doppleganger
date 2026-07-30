import { Link } from 'wouter';
import { Auth } from '../components/Auth';
import '../auth.css';
import '../authBackdrop.css';

export function AuthPage() {
  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true">
        <div className="auth-canopy" />
        <div className="auth-light auth-light--left" />
        <div className="auth-light auth-light--right" />
      </div>

      <header className="auth-header">
        <Link href="/" className="auth-logo">DOPPLEGANGER</Link>
        <Link href="/" className="auth-back">← BACK TO STATION</Link>
      </header>

      <Auth />
      <p className="auth-footer">HIGHWAY 09 · OPEN ALL NIGHT</p>
    </main>
  );
}
