'use client';
import { useState } from 'react';
import { ConfirmButton } from '@/components/Confirm';
import { api } from '@/lib/api';
import { errText, useGet, when } from '@/lib/hooks';

type L = { id: number; body: string; status: string; hops: number; galaxy: string; created_at: string; held: boolean };

export default function Lanterns() {
  const { data, error, loading, reload } = useGet<{ lanterns: L[] }>('/lanterns');
  const [msg, setMsg] = useState('');
  async function remove(l: L) {
    setMsg('');
    try { await api('PATCH', `/lanterns/${l.id}`, {}); await reload(); } catch (e) { setMsg(errText(e)); }
  }
  const list = data?.lanterns || [];
  return (
    <>
      <h1>Lanterns</h1>
      <p className="muted sub">The 100 most recent.</p>
      <p className="err" role="alert">{error || msg}</p>
      <div className="glass tablewrap" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Lantern</th><th>Status</th><th>Hops</th><th>Held</th><th>Galaxy</th><th>Created</th><th /></tr></thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id}>
                <td className="wrap">{l.body}</td>
                <td><span className={`tag ${l.status === 'removed' ? 'bad' : ''}`}>{l.status}</span></td>
                <td>{l.hops}</td><td>{l.held ? 'Yes' : 'No'}</td><td>{l.galaxy}</td><td>{when(l.created_at)}</td>
                <td>{l.status !== 'removed' && <ConfirmButton label="Remove" question="Remove this lantern?" className="btn danger sm" onConfirm={() => remove(l)} />}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={7} className="muted">{loading ? 'Loading...' : 'No lanterns.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
