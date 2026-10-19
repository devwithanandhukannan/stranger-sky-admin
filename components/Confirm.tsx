'use client';
import { useState } from 'react';

/** Button that asks for an inline confirmation before running. */
export function ConfirmButton({ label, question, onConfirm, className = 'btn ghost sm', disabled }: {
  label: string; question: string; onConfirm: () => void | Promise<void>; className?: string; disabled?: boolean;
}) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ask) return <button type="button" className={className} disabled={disabled} onClick={() => setAsk(true)}>{label}</button>;
  return (
    <span className="confirm" role="alertdialog" aria-label={question}>
      {question}
      <button type="button" className="btn danger sm" disabled={busy} autoFocus onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); setAsk(false); } }}>Confirm</button>
      <button type="button" className="btn ghost sm" onClick={() => setAsk(false)}>Cancel</button>
    </span>
  );
}
