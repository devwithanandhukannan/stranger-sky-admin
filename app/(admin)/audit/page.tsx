'use client';
import { useGet, when } from '@/lib/hooks';

type Log = { id: number; action: string; target: string | number | null; meta: unknown; created_at: string; admin_id: string };

export default function Audit() {
  const { data, error, loading } = useGet<{ logs: Log[] }>('/audit');
  const logs = data?.logs || [];
  return (
    <>
      <h1>Audit</h1>
      <p className="muted sub">The 100 most recent admin actions.</p>
      <p className="err" role="alert">{error}</p>
      <div className="glass tablewrap" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>When</th><th>Action</th><th>Target</th><th>Details</th><th>Admin</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{when(l.created_at)}</td><td>{l.action}</td>
                <td className="wrap" style={{ wordBreak: 'break-all' }}>{l.target ?? '-'}</td>
                <td className="wrap">{l.meta ? JSON.stringify(l.meta) : '-'}</td>
                <td className="tiny" style={{ wordBreak: 'break-all' }}>{l.admin_id}</td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={5} className="muted">{loading ? 'Loading...' : 'Nothing yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
