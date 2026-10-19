'use client';
import { useEffect, useState } from 'react';
import { ConfirmButton } from '@/components/Confirm';
import { api } from '@/lib/api';
import { errText, useGet, when } from '@/lib/hooks';

type U = { id: string; display_name: string; email: string; status: 'active' | 'suspended' | 'banned'; role: string; created_at: string; last_seen: string | null; openReports: number; online: boolean };

export default function Users() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [msg, setMsg] = useState('');
  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, error, loading, reload } = useGet<{ users: U[] }>(`/users?q=${encodeURIComponent(dq)}&status=${status}&page=${page}`);

  async function set(u: U, s: string) {
    setMsg('');
    try { await api('PATCH', `/users/${u.id}`, { status: s }); await reload(); } catch (e) { setMsg(errText(e)); }
  }
  const users = data?.users || [];

  return (
    <>
      <h1>Users</h1>
      <p className="muted sub">Newest first, 50 per page.</p>
      <div className="toolbar">
        <label className="sr" htmlFor="q">Search</label>
        <input id="q" className="field" type="search" placeholder="Search name or email" maxLength={60} value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr" htmlFor="st">Status</label>
        <select id="st" className="field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="banned">Banned</option>
        </select>
      </div>
      <p className="err" role="alert">{error || msg}</p>
      <div className="glass tablewrap" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Role</th><th>Joined</th><th>Last seen</th><th>Online</th><th>Open reports</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.display_name}</td><td>{u.email}</td>
                <td><span className={`tag ${u.status === 'active' ? 'good' : 'bad'}`}>{u.status}</span></td>
                <td>{u.role}</td><td>{when(u.created_at)}</td><td>{when(u.last_seen)}</td>
                <td><span className={`dot ${u.online ? 'on' : ''}`} role="img" aria-label={u.online ? 'Online' : 'Offline'} /></td>
                <td style={u.openReports >= 3 ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>{u.openReports}</td>
                <td>
                  {u.role === 'admin' ? <span className="tiny">-</span> : (
                    <div className="actions" style={{ marginTop: 0 }}>
                      {u.status !== 'suspended' && <ConfirmButton label="Suspend" question={`Suspend ${u.display_name}?`} onConfirm={() => set(u, 'suspended')} />}
                      {u.status !== 'banned' && <ConfirmButton label="Ban" question={`Ban ${u.display_name}?`} className="btn danger sm" onConfirm={() => set(u, 'banned')} />}
                      {u.status !== 'active' && <ConfirmButton label="Reactivate" question={`Reactivate ${u.display_name}?`} onConfirm={() => set(u, 'active')} />}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={9} className="muted">{loading ? 'Loading...' : 'No users found.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn ghost sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
        <span className="tiny">Page {page + 1}</span>
        <button className="btn ghost sm" disabled={users.length < 50} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </>
  );
}
