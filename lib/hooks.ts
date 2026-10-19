'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { ApiError } from './config';

export function errText(e: unknown) {
  if (e instanceof ApiError) {
    if (e.detail) return e.detail;
    const m: Record<string, string> = { invalid_input: 'That input was not accepted.', cannot_change_self: 'You cannot change your own account.', cannot_change_admin: 'Admin accounts cannot be changed here.', not_found: 'Not found.', bad_value: 'A value was not accepted.' };
    return m[e.code] || 'Something went wrong. Try again.';
  }
  return 'Network problem. Try again.';
}

/** GET a path, optionally polling. Re-fetches when `path` changes. */
export function useGet<T>(path: string, every = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const load = useCallback(async () => {
    const n = ++seq.current;
    try {
      const d = await api<T>('GET', path);
      if (n === seq.current) { setData(d); setError(''); }
    } catch (e) { if (n === seq.current) setError(errText(e)); }
    finally { if (n === seq.current) setLoading(false); }
  }, [path]);
  useEffect(() => {
    setLoading(true); load();
    if (!every) return;
    const t = setInterval(() => { if (!document.hidden) load(); }, every);
    return () => { clearInterval(t); seq.current++; };
  }, [load, every]);
  return { data, error, loading, reload: load };
}

export const when = (s?: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-');
