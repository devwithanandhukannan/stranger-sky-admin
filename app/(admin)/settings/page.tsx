'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { errText, useGet } from '@/lib/hooks';

type S = { key: string; label: string; group: string; secret: boolean; type: string; value: string; isSet: boolean };
const LONG = /galaxies|seed_thoughts|prompts|blocked_words/;

export default function Settings() {
  const { data, error } = useGet<{ settings: S[] }>('/settings');
  const [base, setBase] = useState<S[]>([]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [clear, setClear] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  function load(list: S[]) { setBase(list); setVals(Object.fromEntries(list.map((s) => [s.key, s.value]))); setClear(new Set()); }
  useEffect(() => { if (data) load(data.settings); }, [data]);

  const groups = useMemo(() => {
    const m = new Map<string, S[]>();
    for (const s of base) (m.get(s.group) || m.set(s.group, []).get(s.group)!).push(s);
    return [...m.entries()];
  }, [base]);

  // Only changed keys are sent. Secrets are write-only: a non-empty box means "set a new value".
  const changed = base.filter((s) => (s.secret ? (vals[s.key] || '').trim() !== '' : (vals[s.key] ?? '') !== s.value));
  const dirty = changed.length > 0 || clear.size > 0;

  async function save() {
    setBusy(true); setMsg(''); setOk('');
    try {
      const values = Object.fromEntries(changed.map((s) => [s.key, vals[s.key]]));
      const r = await api<{ settings: S[]; changed: string[] }>('PUT', '/settings', { values, clear: [...clear] });
      load(r.settings); setOk(r.changed.length ? `Saved ${r.changed.length} setting${r.changed.length === 1 ? '' : 's'}.` : 'Nothing to change.');
    } catch (e) { setMsg(errText(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <h1>Settings</h1>
      <p className="muted sub">Changes apply to the whole service as soon as they are saved.</p>
      <p className="note">Firebase values change how people sign in. A wrong value can lock everyone out, including you. Empty keys can be filled in later.</p>
      <p className="err" role="alert">{error}</p>
      {groups.map(([g, items]) => (
        <section key={g} className="glass group" aria-labelledby={`g-${g}`}>
          <h2 id={`g-${g}`}>{g}</h2>
          {items.map((s) => {
            const id = `f-${s.key}`;
            return (
              <div key={s.key} className="set">
                <label htmlFor={id}>{s.label} <code>{s.key}</code></label>
                {s.secret ? (
                  <div className="row">
                    <input id={id} className="field grow" style={{ width: 'auto' }} type="password" autoComplete="new-password" placeholder={s.isSet ? 'set (hidden)' : 'not set'} value={vals[s.key] || ''}
                      onChange={(e) => { setVals({ ...vals, [s.key]: e.target.value }); }} />
                    <span className={`tag ${s.isSet && !clear.has(s.key) ? 'good' : ''}`}>{s.isSet && !clear.has(s.key) ? 'set' : 'not set'}</span>
                    {s.isSet && <button type="button" className="btn ghost sm" aria-pressed={clear.has(s.key)} onClick={() => { const n = new Set(clear); n.has(s.key) ? n.delete(s.key) : n.add(s.key); setClear(n); }}>{clear.has(s.key) ? 'Undo clear' : 'Clear'}</button>}
                  </div>
                ) : s.type === 'number' ? (
                  <input id={id} className="field" type="number" inputMode="numeric" min={0} step={1} value={vals[s.key] ?? ''} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })} />
                ) : LONG.test(s.key) ? (
                  <textarea id={id} className="field" rows={5} value={vals[s.key] ?? ''} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })} />
                ) : (
                  <input id={id} className="field" type="text" value={vals[s.key] ?? ''} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })} />
                )}
              </div>
            );
          })}
        </section>
      ))}
      {!!base.length && (
        <div className="glass savebar">
          <button className="btn" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving...' : 'Save changes'}</button>
          {dirty && <button className="btn ghost" disabled={busy} onClick={() => { load(base); setMsg(''); setOk(''); }}>Discard</button>}
          <span className="tiny">{dirty ? `${changed.length + clear.size} unsaved` : 'No changes'}</span>
          <span className="err" role="alert">{msg}</span><span className="ok" role="status">{ok}</span>
        </div>
      )}
    </>
  );
}
