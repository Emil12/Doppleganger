import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import './GoogleAuth.css';

type AuthMode = 'signin' | 'signup';

export function Auth() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/');
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

  async function continueWithGoogle() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === 'signup' && password !== confirmation) {
      setMessage('The passwords do not match.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.session) navigate('/');
        else setMessage('Account created. Check your email to confirm it.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function changeMode() {
    setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
    setConfirmation('');
    setMessage('');
  }

  return (
    <section className="auth-card">
      <p className="auth-card__eyebrow">{mode === 'signup' ? 'NEW TRAVELLER' : 'WELCOME BACK'}</p>
      <h2>{mode === 'signup' ? 'Create an account' : 'Sign in'}</h2>
      <p className="auth-card__intro">
        {mode === 'signup'
          ? 'Register to start your night shift.'
          : 'Enter your details to return to Doppleganger.'}
      </p>

      <button className="google-auth" type="button" onClick={continueWithGoogle} disabled={busy}>
        <span className="google-auth__logo" aria-hidden="true">G</span>
        CONTINUE WITH GOOGLE
      </button>
      <div className="auth-divider"><span>OR USE EMAIL</span></div>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
        </label>
        {mode === 'signup' && (
          <label>
            Confirm password
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Type it again"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
        )}
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? 'PLEASE WAIT…' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
        </button>
      </form>

      {message && <p className="auth-message" role="status">{message}</p>}
      <button className="auth-switch" type="button" onClick={changeMode}>
        {mode === 'signup' ? 'Already registered? Sign in' : 'Need an account? Register'}
      </button>
    </section>
  );
}
