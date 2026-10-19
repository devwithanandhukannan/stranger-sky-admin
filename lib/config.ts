export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const ADMIN_API = `${API}/admin-api`;

export type AdminConfig = { appName: string; firebase: Record<string, string> };

export class ApiError extends Error {
  constructor(public status: number, public code: string, public detail = '') { super(code); }
}

let cfg: Promise<AdminConfig> | null = null;
export function getConfig(): Promise<AdminConfig> {
  if (!cfg) {
    cfg = fetch(`${ADMIN_API}/config`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new ApiError(r.status, 'config'); return r.json(); })
      .catch((e) => { cfg = null; throw e; });
  }
  return cfg;
}
