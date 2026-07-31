import { Link } from 'wouter';
import './AccountRequired.css';

export function AccountRequired() {
  return (
    <section className="account-required" role="dialog" aria-modal="true">
      <div className="account-required__panel">
        <p>FREE ACCESS COMPLETE</p>
        <h2>YOUR 50-HOUR TRIAL HAS ENDED</h2>
        <span>
          Create an account or sign in to continue your night shifts.
        </span>
        <Link href="/auth">CREATE ACCOUNT / SIGN IN</Link>
        <small>THE STATION WILL BE WAITING.</small>
      </div>
    </section>
  );
}
