'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { logOut, onAuth } from '@/lib/auth';

const NAV: [string, string][] = [['/', 'Dashboard'], ['/users', 'Users'], ['/reports', 'Reports'], ['/lanterns', 'Lanterns'], ['/live', 'Live'], ['/settings', 'Settings'], ['/audit', 'Audit']];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [me, setMe] = useState('');

  useEffect(() => {
    let off: (() => void) | undefined; let dead = false;
    onAuth(async (s) => {
      if (!s) { window.location.replace('/login'); return; }
      if (!s.verified) { await logOut(); window.location.replace('/login?m=unverified'); return; }
      try {
        const m = await api<{ email: string; name: string }>('GET', '/me');
        if (!dead) { setMe(m.name || m.email); setState('ready'); }
      } catch { if (!dead) setState('error'); } // 401/403 are handled (sign-out + redirect) inside api()
    }).then((u) => { if (dead) u(); else off = u; }).catch(() => setState('error'));
    return () => { dead = true; off?.(); };
  }, []);

  if (state === 'loading') return <p className="muted" style={{ padding: 32 }} role="status">Loading...</p>;
  if (state === 'error') return <p className="err" style={{ padding: 32 }} role="alert">Could not reach the service. Reload to try again.</p>;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><i aria-hidden />Console</div>
        <nav className="nav" aria-label="Main">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} aria-current={(href === '/' ? path === '/' : path.startsWith(href)) ? 'page' : undefined}>{label}</Link>
          ))}
        </nav>
        <div className="who">
          <span className="tiny">{me}</span>
          <button className="btn ghost sm" onClick={async () => { await logOut(); window.location.replace('/login'); }}>Sign out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
