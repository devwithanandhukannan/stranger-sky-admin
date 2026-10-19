'use client';
import { getConfig } from './config';

// Firebase is loaded lazily and configured from the settings served by the API. Tokens stay in Firebase's own persistence.
type FB = typeof import('firebase/auth');
let ready: Promise<{ auth: import('firebase/auth').Auth; fb: FB }> | null = null;

function init() {
  if (!ready) {
    ready = (async () => {
      const [cfg, app, fb] = await Promise.all([getConfig(), import('firebase/app'), import('firebase/auth')]);
      const a = app.getApps().length ? app.getApp() : app.initializeApp(cfg.firebase);
      return { auth: fb.getAuth(a), fb };
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}

export type AuthState = { email: string; verified: boolean } | null;

export async function onAuth(cb: (s: AuthState) => void) {
  const { auth, fb } = await init();
  return fb.onAuthStateChanged(auth, (u) => cb(u ? { email: u.email || '', verified: u.emailVerified } : null));
}
export async function getToken() {
  const { auth } = await init();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}
export async function signIn(email: string, password: string) {
  const { auth, fb } = await init();
  return (await fb.signInWithEmailAndPassword(auth, email, password)).user.emailVerified;
}
export async function signInGoogle() {
  const { auth, fb } = await init();
  return (await fb.signInWithPopup(auth, new fb.GoogleAuthProvider())).user.emailVerified;
}
export async function logOut() {
  try {
    const { auth, fb } = await init();
    await fb.signOut(auth);
  } catch { /* nothing to sign out of */ }
}
export function authMessage(e: unknown) {
  const code = (e as { code?: string })?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is not right.', 'auth/wrong-password': 'Email or password is not right.',
    'auth/user-not-found': 'Email or password is not right.', 'auth/invalid-email': 'That email does not look right.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.', 'auth/popup-closed-by-user': '',
    'auth/popup-blocked': 'Allow pop-ups to sign in with Google.', 'auth/network-request-failed': 'Network problem. Check your connection.',
  };
  return code in map ? map[code] : 'Something went wrong. Please try again.';
}
