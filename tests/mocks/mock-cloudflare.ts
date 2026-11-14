import type { CloudflareEnv } from '@/lib/cloudflare';

export interface MockUser {
  id: string;
  email: string;
  role: 'student' | 'admin';
  password?: string;
  created_at: string;
}

export interface MockProblem {
  id: string;
  student_id: string;
  title: string;
  description: string;
  upvotes: number;
  status: string;
  created_at: string;
}

export function createMockCloudflareEnv(initialData?: {
  users?: MockUser[];
  problems?: MockProblem[];
  aiResponse?: string;
}): {
  env: CloudflareEnv;
  users: MockUser[];
  problems: MockProblem[];
  aiCalls: Array<{ model: string; input: any }>;
} {
  const users: MockUser[] = initialData?.users
    ? [...initialData.users]
    : [
        {
          id: 'usr_admin_01',
          email: 'admin@iiit-bh.ac.in',
          role: 'admin',
          password: 'admin123',
          created_at: '2026-11-11 18:14:19',
        },
        {
          id: 'usr_student_01',
          email: 'student@iiit-bh.ac.in',
          role: 'student',
          password: 'student123',
          created_at: '2026-11-11 18:14:19',
        },
      ];

  const problems: MockProblem[] = initialData?.problems
    ? [...initialData.problems]
    : [];

  const aiCalls: Array<{ model: string; input: any }> = [];

  const mockDb: any = {
    prepare(query: string) {
      let boundParams: any[] = [];
      const stmt = {
        bind(...params: any[]) {
          boundParams = params;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          const lower = query.toLowerCase();
          if (lower.includes('from users where lower(email) = ?')) {
            const targetEmail = String(boundParams[0]).toLowerCase();
            const found = users.find((u) => u.email.toLowerCase() === targetEmail);
            return (found as unknown as T) || null;
          }
          if (lower.includes('from users where id = ?')) {
            const targetId = String(boundParams[0]);
            const found = users.find((u) => u.id === targetId);
            return (found as unknown as T) || null;
          }
          return null;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const lower = query.toLowerCase();
          if (lower.includes('from users')) {
            return { results: users as unknown as T[] };
          }
          if (lower.includes('from problems')) {
            let res = [...problems];

            // Status filter check
            if (lower.includes('unresolved')) {
              res = res.filter((p) => p.status.toLowerCase() === 'unresolved');
            } else if (lower.includes('status') && boundParams.length > 0) {
              const statusVal = String(boundParams[0] || '').toLowerCase();
              res = res.filter((p) => p.status.toLowerCase() === statusVal);
            }

            // Ordering
            if (lower.includes('order by p.created_at desc') && !lower.includes('upvotes desc')) {
              res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            } else if (lower.includes('upvotes desc')) {
              res.sort((a, b) => b.upvotes - a.upvotes);
            }

            // Join mock student email
            const joined = res.map((p) => {
              const u = users.find((user) => user.id === p.student_id);
              return {
                ...p,
                student_email: u?.email,
              };
            });

            return { results: joined as unknown as T[] };
          }
          return { results: [] };
        },
        async run(): Promise<{ success: boolean; meta: any }> {
          const lower = query.toLowerCase();
          if (lower.includes('insert into problems')) {
            const [id, student_id, title, description, upvotes, status, created_at] = boundParams;
            problems.push({
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
          if (lower.includes('insert into users')) {
            const id = boundParams[0];
            const email = boundParams[1];
            const role = boundParams[2];
            const password = boundParams.length === 5 ? boundParams[3] : 'student123';
            const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
            if (existing) {
              existing.id = id;
              existing.role = role || 'student';
              if (password) existing.password = password;
            } else {
              users.push({
                id,
                email,
                role: role || 'student',
                password: password || 'student123',
                created_at: new Date().toISOString(),
              });
            }
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('update problems set status = ?, description = ?, eta = ?, admin_notes = ?, media_url = ? where id = ?')) {
            const [newStatus, newDesc, newEta, newNotes, newMedia, id] = boundParams;
            const p = problems.find((x) => x.id === id);
            if (p) {
              p.status = newStatus;
              p.description = newDesc;
              (p as any).eta = newEta;
              (p as any).admin_notes = newNotes;
              (p as any).media_url = newMedia;
            }
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('update problems set status = ?, description = ? where id = ?')) {
            const [newStatus, newDesc, id] = boundParams;
            const p = problems.find((x) => x.id === id);
            if (p) {
              p.status = newStatus;
              p.description = newDesc;
            }
            return { success: true, meta: { changes: 1 } };
          }
          if (lower.includes('update problems set status = ? where id = ?')) {
            const [newStatus, id] = boundParams;
            const p = problems.find((x) => x.id === id);
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
    async run(model: string, input: any) {
      aiCalls.push({ model, input });
      return {
        response:
          initialData?.aiResponse ||
          'IIIT Bhubaneswar students report significant network downtime across academic blocks and intermittent hot water disruption in the senior hostels.\n\nImmediate maintenance protocols must be dispatched to replace faulty network switches and inspect hostel boilers to restore campus normalcy.',
      };
    },
  };

  return {
    env: {
      DB: mockDb,
      AI: mockAi,
    },
    users,
    problems,
    aiCalls,
  };
}
