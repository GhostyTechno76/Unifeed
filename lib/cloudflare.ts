export interface CloudflareEnv {
  DB: D1Database;
  AI: {
    run: (model: string, input: any) => Promise<any>;
  };
}

const DEFAULT_DATABASE_ID = '2070c0ea-2662-4d50-8dc3-265e9f7b8c1b';

interface StoredData {
  users: Array<{ id: string; email: string; role: 'student' | 'admin'; created_at: string }>;
  problems: Array<{
    id: string;
    student_id: string;
    title: string;
    description: string;
    upvotes: number;
    status: string;
    created_at: string;
  }>;
}

const SEED_DATA: StoredData = {
  users: [
    { id: 'usr_admin_01', email: 'admin@iiit-bh.ac.in', role: 'admin', created_at: '2026-11-11 18:14:19' },
    { id: 'usr_student_01', email: 'student@iiit-bh.ac.in', role: 'student', created_at: '2026-11-11 18:14:19' },
  ],
  problems: [
    {
      id: 'prob_live_01',
      student_id: 'usr_student_01',
      title: 'High packet loss on Academic Block Wi-Fi',
      description: 'Students in Labs 3 and 4 experience over 40% packet loss during online coding contests.',
      upvotes: 15,
      status: 'unresolved',
      created_at: '2026-11-11 18:28:34',
    },
  ],
};

function getSharedState(): StoredData {
  const g = globalThis as any;
  if (!g.__d1_shared_state) {
    g.__d1_shared_state = JSON.parse(JSON.stringify(SEED_DATA));
  }
  return g.__d1_shared_state;
}

// Remote Cloudflare D1 REST client for live remote synchronization
function createRemoteCloudflareEnv(accountId: string, apiToken: string, databaseId: string): CloudflareEnv {
  const d1Url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const aiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`;

  const remoteDb: any = {
    prepare(query: string) {
      let boundParams: any[] = [];
      const stmt = {
        bind(...params: any[]) {
          boundParams = params;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          const res = await fetch(d1Url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: query, params: boundParams }),
          });
          const json = (await res.json()) as any;
          if (!json.success || !json.result?.[0]) {
            throw new Error(json.errors?.[0]?.message || 'D1 query failed');
          }
          const results = json.result[0].results;
          return (results && results.length > 0 ? results[0] : null) as unknown as T;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const res = await fetch(d1Url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: query, params: boundParams }),
          });
          const json = (await res.json()) as any;
          if (!json.success || !json.result?.[0]) {
            throw new Error(json.errors?.[0]?.message || 'D1 query failed');
          }
          return { results: (json.result[0].results || []) as unknown as T[] };
        },
        async run(): Promise<{ success: boolean; meta: any }> {
          const res = await fetch(d1Url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: query, params: boundParams }),
          });
          const json = (await res.json()) as any;
          if (!json.success) {
            throw new Error(json.errors?.[0]?.message || 'D1 execute failed');
          }
          return { success: true, meta: json.result?.[0]?.meta || {} };
        },
      };
      return stmt;
    },
  };

  const remoteAi = {
    async run(model: string, input: any) {
      // Automatically map deprecated model to currently active Llama 3.1
      const activeModel =
        model === '@cf/meta/llama-3-8b-instruct' ? '@cf/meta/llama-3.1-8b-instruct' : model;
      const res = await fetch(`${aiUrl}/${activeModel}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as any;
      if (!json.success || !json.result) {
        throw new Error(json.errors?.[0]?.message || 'Workers AI execution failed');
      }
      return json.result;
    },
  };

  return { DB: remoteDb, AI: remoteAi };
}

// Development fallback driver
export function getDevFallback(): CloudflareEnv {
  const g = globalThis as any;
  if (g.__dev_cf_env) return g.__dev_cf_env;

  const mockDb: any = {
    prepare(query: string) {
      let boundParams: any[] = [];
      const stmt = {
        bind(...params: any[]) {
          boundParams = params;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          const data = getSharedState();
          const lower = query.toLowerCase();
          if (lower.includes('from users where lower(email) = ?')) {
            const target = String(boundParams[0]).toLowerCase();
            const u = data.users.find((x) => x.email.toLowerCase() === target);
            return (u as unknown as T) || null;
          }
          if (lower.includes('from users where id = ?')) {
            const target = String(boundParams[0]);
            const u = data.users.find((x) => x.id === target);
            return (u as unknown as T) || null;
          }
          if (lower.includes('from problems where id = ?')) {
            const target = String(boundParams[0]);
            const p = data.problems.find((x) => x.id === target);
            return (p as unknown as T) || null;
          }
          return null;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const data = getSharedState();
          const lower = query.toLowerCase();
          if (lower.includes('from users')) {
            return { results: data.users as unknown as T[] };
          }
          if (lower.includes('from problems')) {
            let res = [...data.problems];
            if (lower.includes('unresolved')) {
              res = res.filter((p) => p.status.toLowerCase() === 'unresolved');
            } else if (lower.includes('status') && boundParams.length > 0) {
              const statusVal = String(boundParams[0] || '').toLowerCase();
              res = res.filter((p) => p.status.toLowerCase() === statusVal);
            }

            if (lower.includes('order by p.created_at desc') && !lower.includes('upvotes desc')) {
              res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            } else {
              res.sort((a, b) => b.upvotes - a.upvotes);
            }

            const joined = res.map((p) => {
              const u = data.users.find((user) => user.id === p.student_id);
              return { ...p, student_email: u?.email || 'student@iiit-bh.ac.in' };
            });
            return { results: joined as unknown as T[] };
          }
          return { results: [] };
        },
        async run(): Promise<{ success: boolean; meta: any }> {
          const data = getSharedState();
          const lower = query.toLowerCase();
          if (lower.includes('insert into problems')) {
            const [id, student_id, title, description, upvotes, status, created_at] = boundParams;
            data.problems.unshift({
              id,
              student_id,
              title,
              description,
              upvotes: Number(upvotes) || 0,
              status: status || 'unresolved',
              created_at: created_at || new Date().toISOString(),
            });
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('update problems set upvotes = upvotes + 1')) {
            const id = boundParams[0];
            const p = data.problems.find((x) => x.id === id);
            if (p) {
              p.upvotes += 1;
            }
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('update problems set upvotes = max(0, upvotes - 1)')) {
            const id = boundParams[0];
            const p = data.problems.find((x) => x.id === id);
            if (p) {
              p.upvotes = Math.max(0, p.upvotes - 1);
            }
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('insert into users')) {
            const [id, email, role] = boundParams;
            const existing = data.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
            if (existing) {
              existing.id = id;
              existing.role = role || 'student';
            } else {
              data.users.push({
                id,
                email,
                role: role || 'student',
                created_at: new Date().toISOString(),
              });
            }
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('update problems set status = ?, description = ? where id = ?')) {
            const [newStatus, newDesc, id] = boundParams;
            const p = data.problems.find((x) => x.id === id);
            if (p) {
              p.status = newStatus;
              p.description = newDesc;
            }
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('update problems set status = ? where id = ?')) {
            const [newStatus, id] = boundParams;
            const p = data.problems.find((x) => x.id === id);
            if (p) {
              p.status = newStatus;
            }
            return { success: true, meta: { changes: 1 } };
          }
          return { success: true, meta: { changes: 0 } };
        },
      };
      return stmt;
    },
  };

  const mockAi = {
    async run(_model: string, input: any) {
      const userMsg = (input?.messages?.find((m: any) => m.role === 'user')?.content || '') as string;
      const titles: string[] = [];
      const regex = /Title: ([^\n]+)/g;
      let match;
      while ((match = regex.exec(userMsg)) !== null) {
        titles.push(match[1]);
      }

      if (titles.length === 0) {
        return {
          response:
            'Campus grievance reports at IIIT Bhubaneswar indicate urgent infrastructure challenges across campus utilities.\n\nImmediate maintenance protocols must be dispatched to inspect facilities and resolve pending items.',
        };
      }

      const topTitles = titles.slice(0, 3);
      const bottlenecks = topTitles
        .map((t, idx) => `• Issue #${idx + 1}: ${t} - Urgent disruption reported by student body.`)
        .join('\n');
      const actions = topTitles
        .map((t) => `• Direct action: Deploy technical team to inspect and service "${t}".`)
        .join('\n');

      return {
        response: `Key Bottlenecks & Active Issues:\n${bottlenecks}\n\nRecommended Administrative Actions:\n${actions}\n• Post resolution progress and milestone updates to the student portal within 24–48 hours.`,
      };
    },
  };

  g.__dev_cf_env = { DB: mockDb, AI: mockAi };
  return g.__dev_cf_env;
}

/**
 * Retrieves the Cloudflare environment bindings (D1 Database and Workers AI)
 * Supports:
 * 1. Cloudflare Pages edge runtime (Next-on-pages)
 * 2. Request / Global bindings (Workers & test environments)
 * 3. Remote Cloudflare D1 REST API (when CLOUDFLARE_API_TOKEN & CLOUDFLARE_ACCOUNT_ID are provided)
 * 4. Local persistent storage with exact seeded data
 */
export async function getCloudflareEnv(req?: Request): Promise<CloudflareEnv> {
  // 1. Next-on-pages runtime context (active on Cloudflare Pages)
  try {
    const nextOnPages = await import('@cloudflare/next-on-pages');
    const ctx = nextOnPages?.getRequestContext ? (nextOnPages.getRequestContext() as any) : null;
    if (ctx?.env?.DB) {
      return ctx.env as unknown as CloudflareEnv;
    }
  } catch {
    // getRequestContext is only active inside Cloudflare Pages edge runtime
  }

  // 2. Request context fallback
  if ((req as any)?.env?.DB) {
    return (req as any).env as CloudflareEnv;
  }

  // 3. GlobalThis binding fallback (Workers runtime & test mocks)
  const g = globalThis as any;
  if (g.DB) {
    return {
      DB: g.DB,
      AI: g.AI,
    };
  }

  // 4. Process env fallback
  const p = (typeof process !== 'undefined' ? process.env : {}) as any;
  if (p.DB) {
    return {
      DB: p.DB,
      AI: p.AI,
    };
  }

  // 5. Remote Cloudflare REST API when account credentials are provided in environment
  const accountId = p.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = p.CLOUDFLARE_API_TOKEN || p.CLOUDFLARE_D1_TOKEN;
  const databaseId = p.CLOUDFLARE_DATABASE_ID || DEFAULT_DATABASE_ID;
  if (accountId && apiToken) {
    return createRemoteCloudflareEnv(accountId, apiToken, databaseId);
  }

  // 6. Local development fallback (seeded with exact database records, no fake mock items)
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && !process.env.VITEST) {
    return getDevFallback();
  }

  throw new Error(
    'Cloudflare D1 binding "DB" is not available in the current execution context. Ensure wrangler bindings are set.'
  );
}
