'use client';
import { useState } from 'react';
import { ConfirmButton } from '@/components/Confirm';
import { api } from '@/lib/api';
import { errText, useGet, when } from '@/lib/hooks';

type Msg = { who: string; t: string; ts?: string };
type Evidence = { galaxy?: string; at?: string; thought?: string; mood?: string; lantern?: string; transcript?: Msg[]; thread?: Msg[] };
type R = {
  id: number; reason: string; kind: string; details: string | null; status: string; created_at: string; lantern_id: number | null;
  reporterName: string | null; reportedName: string | null; reportedStatus: string | null; openAgainstReported: number; evidence: Evidence | null;
};
const TABS = ['open', 'reviewing', 'actioned', 'dismissed'] as const;

function Chat({ title, msgs }: { title: string; msgs: Msg[] }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <h4>{title}</h4>
      {msgs.map((m, i) => (
        <div key={i} className={`msg ${m.who === 'reported' ? 'reported' : 'reporter'}`}>
          <small>{m.who === 'reported' ? 'Reported person' : 'Reporter'}{m.ts ? ` - ${when(m.ts)}` : ''}</small>{m.t}
        </div>
      ))}
    </div>
  );
}

function Evidence({ ev }: { ev: Evidence | null }) {
  if (!ev || typeof ev !== 'object') return null;
  const chat = ev.transcript?.length ? ev.transcript : null;
  const thread = ev.thread?.length ? ev.thread : null;
  if (!ev.thought && !ev.lantern && !chat && !thread) return null;
  return (
    <div className="evidence">
      {ev.thought && <div><h4>Thought{ev.mood ? ` (${ev.mood})` : ''}{ev.galaxy ? ` - ${ev.galaxy}` : ''}</h4><blockquote>{ev.thought}</blockquote></div>}
      {ev.lantern && <div><h4>Lantern</h4><blockquote>{ev.lantern}</blockquote></div>}
      {chat && <Chat title="Transcript" msgs={chat} />}
      {thread && <Chat title="Lantern thread" msgs={thread} />}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('open');
  const [msg, setMsg] = useState('');
  const { data, error, loading, reload } = useGet<{ reports: R[] }>(`/reports?status=${tab}`);

  async function act(r: R, status: string, action = 'none') {
    setMsg('');
    try { await api('PATCH', `/reports/${r.id}`, { status, action }); await reload(); } catch (e) { setMsg(errText(e)); }
  }
  const list = data?.reports || [];

  return (
    <>
      <h1>Reports</h1>
      <p className="muted sub">Most-reported people first. Nothing is actioned automatically.</p>
      <div className="tabs" role="tablist" aria-label="Report status">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      <p className="err" role="alert">{error || msg}</p>
      <div className="reports" role="tabpanel">
        {list.map((r) => {
          const under = r.reason === 'underage';
          return (
            <article key={r.id} className={`glass report ${under ? 'under' : ''} ${r.openAgainstReported >= 3 ? 'hot' : ''}`}>
              <header>
                <h3>{r.reason.replace(/_/g, ' ')}</h3>
                <span className="tag">{r.kind}</span>
                {under && <span className="tag bad">Underage</span>}
                {r.openAgainstReported >= 3 && <span className="tag bad">{r.openAgainstReported} open reports against this person</span>}
                <span className="tiny grow" style={{ textAlign: 'right' }}>{when(r.created_at)}</span>
              </header>
              <div className="meta">
                <span>Reporter: {r.reporterName || 'unknown'}</span>
                <span>Reported: {r.reportedName || 'unknown'}{r.reportedStatus && r.reportedStatus !== 'active' ? ` (${r.reportedStatus})` : ''}</span>
                {r.openAgainstReported < 3 && <span>Open reports against them: {r.openAgainstReported}</span>}
              </div>
              {r.details && <p style={{ margin: '0 0 6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.details}</p>}
              <Evidence ev={r.evidence} />
              {(tab === 'open' || tab === 'reviewing') && (
                <div className="actions">
                  <ConfirmButton label="Dismiss" question="Dismiss this report?" onConfirm={() => act(r, 'dismissed')} />
                  {tab === 'open' && <button className="btn ghost sm" onClick={() => act(r, 'reviewing')}>Mark reviewing</button>}
                  <span className="tiny">Action:</span>
                  <ConfirmButton label="Suspend" question="Suspend the reported person?" onConfirm={() => act(r, 'actioned', 'suspend')} />
                  <ConfirmButton label="Ban" question="Ban the reported person?" className="btn danger sm" onConfirm={() => act(r, 'actioned', 'ban')} />
                  {r.lantern_id && <ConfirmButton label="Remove lantern" question="Remove this lantern?" className="btn danger sm" onConfirm={() => act(r, 'actioned', 'remove_lantern')} />}
                </div>
              )}
            </article>
          );
        })}
        {!list.length && <p className="muted">{loading ? 'Loading...' : `No ${tab} reports.`}</p>}
      </div>
    </>
  );
}
