'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { authMessage, logOut, onAuth, signIn, signInGoogle } from '@/lib/auth';
import { ApiError } from '@/lib/config';

const MESSAGES: Record<string, string> = {
  forbidden: 'Not authorized.',
  reauth: 'Please sign in again.',
  unverified: 'Verify your email address, then sign in again.',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('m');
    if (m && MESSAGES[m]) setMsg(MESSAGES[m]);
  }, []);

  // Already signed in with a verified email and a valid admin session: go straight in.
  useEffect(() => {
    let off: (() => void) | undefined; let dead = false;
    onAuth(async (s) => {
      if (!s || !s.verified || new URLSearchParams(window.location.search).get('m')) return;
      try { await api('GET', '/me'); if (!dead) window.location.replace('/'); } catch { /* api() already handled auth failures */ }
    }).then((u) => { if (dead) u(); else off = u; }).catch(() => {});
    return () => { dead = true; off?.(); };
  }, []);

  async function afterLogin(verified: boolean) {
    if (!verified) { await logOut(); setMsg(MESSAGES.unverified); return; }
    try { await api('GET', '/me'); window.location.replace('/'); }
    catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 401)) return; // api() signed out and is redirecting
      await logOut(); setMsg('Something went wrong. Please try again.');
    }
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true); setMsg('');
    try { await fn(); } catch (e) { setMsg(authMessage(e)); } finally { setBusy(false); }
  }
  const emailLogin = (ev: React.FormEvent) => { ev.preventDefault(); run(async () => afterLogin(await signIn(email.trim(), pw))); };
  const google = () => run(async () => afterLogin(await signInGoogle()));

  return (
    <main className="login">
      <div className="glass">
        <div className="logo" aria-hidden />
        <h1>Console</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>Sign in to continue.</p>
        <form onSubmit={emailLogin}>
          <label className="sr" htmlFor="e">Email</label>
          <input id="e" className="field" type="email" autoComplete="username" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="sr" htmlFor="p">Password</label>
          <input id="p" className="field" type="password" autoComplete="current-password" placeholder="Password" required value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          <button type="button" className="btn ghost" disabled={busy} onClick={google}>Continue with Google</button>
          <p className="err" role="alert">{msg}</p>
        </form>
      </div>
    </main>
  );
}
