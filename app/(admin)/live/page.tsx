'use client';
import { Bars } from '@/components/Bars';
import { useGet } from '@/lib/hooks';

type Live = { online: number; planets: number; memMb: number; galaxies: { slug: string; name: string; count: number }[] };

export default function LivePage() {
  const { data: d, error } = useGet<Live>('/live', 5000);
  if (!d) return <><h1>Live</h1><p className={error ? 'err' : 'muted'} role={error ? 'alert' : 'status'}>{error || 'Loading...'}</p></>;
  return (
    <>
      <h1>Live</h1>
      <p className="muted sub">Refreshes every 5 seconds.{error && <span className="err"> {error}</span>}</p>
      <div className="grid">
        <div className="glass stat"><b>{d.online}</b><span>Online</span></div>
        <div className="glass stat"><b>{d.planets}</b><span>Planets</span></div>
        <div className="glass stat"><b>{d.memMb}</b><span>Memory (MB)</span></div>
      </div>
      <h2 className="sec">Galaxies</h2>
      <div className="glass"><Bars items={d.galaxies} /></div>
    </>
  );
}
