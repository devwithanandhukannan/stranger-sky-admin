'use client';
import { Bars } from '@/components/Bars';
import { useGet } from '@/lib/hooks';

type Overview = {
  users: number; newToday: number; dau: number; wau: number;
  retention: { d1: number | null; d1Base: number; d7: number | null; d7Base: number };
  chats7d: number; avgChatMinutes: number; keptPct: number | null;
  openReports: number; lanternsFloating: number; lanternsHeld: number;
  live: { online: number; planets: number; galaxies: { slug: string; name: string; count: number }[]; memMb: number };
};

const NODATA = 'not enough data yet';
const pct = (v: number | null) => (v === null ? null : `${v}%`);

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return <div className="glass stat"><b>{value}</b><span>{label}</span>{note && <small>{note}</small>}</div>;
}
function Soft({ v }: { v: string | null }) { return v ?? <span style={{ fontSize: 15, fontWeight: 400 }} className="muted">{NODATA}</span>; }

export default function Dashboard() {
  const { data: o, error } = useGet<Overview>('/overview', 20000);
  if (!o) return <><h1>Dashboard</h1><p className={error ? 'err' : 'muted'} role={error ? 'alert' : 'status'}>{error || 'Loading...'}</p></>;

  const d7 = o.retention.d7;
  const d7State = d7 === null ? 'gray' : d7 < 10 ? 'red' : 'green';
  const chatState = o.chats7d === 0 ? 'gray' : o.avgChatMinutes < 2 ? 'amber' : 'green';
  const label = { gray: 'No data yet', red: 'Red', amber: 'Amber', green: 'Healthy' } as const;

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted sub">Refreshes every 20 seconds.{error && <span className="err"> {error}</span>}</p>

      <div className="grid">
        <Stat label="Users" value={o.users} />
        <Stat label="New today" value={o.newToday} note="last 24 hours" />
        <Stat label="DAU" value={o.dau} />
        <Stat label="WAU" value={o.wau} />
        <Stat label="Online now" value={o.live.online} />
        <Stat label="Open reports" value={o.openReports} />
        <Stat label="Lanterns" value={`${o.lanternsFloating} / ${o.lanternsHeld}`} note="floating / held" />
      </div>

      <h2 className="sec">Retention and chats</h2>
      <div className="grid">
        <Stat label="D1 retention" value={<Soft v={pct(o.retention.d1)} />} note={o.retention.d1 !== null ? `of ${o.retention.d1Base} users` : undefined} />
        <Stat label="7-day return" value={<Soft v={pct(o.retention.d7)} />} note={o.retention.d7 !== null ? `of ${o.retention.d7Base} users` : undefined} />
        <Stat label="Chats, last 7 days" value={o.chats7d} />
        <Stat label="Avg chat length" value={o.chats7d ? `${o.avgChatMinutes} min` : <Soft v={null} />} />
        <Stat label="Chats kept" value={<Soft v={pct(o.keptPct)} />} />
      </div>

      <h2 className="sec">Pilot health</h2>
      <div className="glass health">
        <div>
          <div className="row"><strong>7-day return</strong><span className={`pill ${d7State}`}>{label[d7State]}</span></div>
          <p className="tiny" style={{ margin: '4px 0 0' }}>Red when fewer than 10% of people come back in the week after joining. {d7 === null ? 'Not enough data yet.' : `Now ${d7}%.`}</p>
        </div>
        <div>
          <div className="row"><strong>Average chat length</strong><span className={`pill ${chatState}`}>{label[chatState]}</span></div>
          <p className="tiny" style={{ margin: '4px 0 0' }}>Amber when chats average under 2 minutes. {o.chats7d === 0 ? 'No chats yet.' : `Now ${o.avgChatMinutes} min.`}</p>
        </div>
      </div>

      <h2 className="sec">Live galaxies</h2>
      <div className="glass">
        {o.live.galaxies.length ? <Bars items={o.live.galaxies} /> : <p className="muted">No galaxies.</p>}
      </div>
    </>
  );
}
