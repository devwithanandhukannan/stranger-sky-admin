'use client';
import { ADMIN_API, ApiError } from './config';
import { getToken, logOut } from './auth';

let failing = false;
/** 403 forbidden / 401 reauth_required: sign out and go to the login page with a generic message. */
async function authFail(code: 'forbidden' | 'reauth') {
  if (failing) return;
  failing = true;
  await logOut();
  window.location.replace(`/login?m=${code}`);
}

export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken(); // fresh per request
  if (!token) { await authFail('reauth'); throw new ApiError(401, 'reauth_required'); }
  const res = await fetch(`${ADMIN_API}${path}`, {
    method, cache: 'no-store',
    headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  if (res.status === 403 && json?.error === 'forbidden') { await authFail('forbidden'); throw new ApiError(403, 'forbidden'); }
  if (res.status === 401) { await authFail('reauth'); throw new ApiError(401, 'reauth_required'); }
  if (!res.ok) throw new ApiError(res.status, json?.error || 'error', json?.message || '');
  return json as T;
}
