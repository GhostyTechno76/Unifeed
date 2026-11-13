'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  Clock,
  Clover,
  Home,
  ListFilter,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

const BG_URL = 'https://kommodo.ai/i/kNZ8VWLE4ntmTarR5rlH';
const INITIAL_VISIBLE = 20;

type Tone = 'amber' | 'blue' | 'green';
type Category = 'Hostel' | 'Mess' | 'Library' | 'IT' | 'Sports';

interface Problem {
  id: string;
  category: Category;
  status: string;
  tone: Tone;
  location: string;
  title: string;
  description: string;
  ago: string;
  by: string;
  votes: number;
  goal: number;
}

const FILTERS: Array<'All' | Category> = ['All', 'Hostel', 'Mess', 'Library', 'IT', 'Sports'];

const TONES: Record<Tone, string> = {
  amber: 'border-amber-300 bg-amber-50 text-amber-800',
  blue: 'border-sky-300 bg-sky-50 text-sky-800',
  green: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

function detectCategory(title: string, desc: string): Category {
  const combined = (title + ' ' + desc).toLowerCase();
  if (combined.includes('wifi') || combined.includes('wi-fi') || combined.includes('network') || combined.includes('packet loss') || combined.includes('lab') || combined.includes('pc')) return 'IT';
  if (combined.includes('mess') || combined.includes('food') || combined.includes('water') || combined.includes('dining')) return 'Mess';
  if (combined.includes('hostel') || combined.includes('room') || combined.includes('geyser') || combined.includes('block')) return 'Hostel';
  if (combined.includes('library') || combined.includes('book') || combined.includes('ac') || combined.includes('chiller')) return 'Library';
  if (combined.includes('sport') || combined.includes('gym') || combined.includes('court') || combined.includes('ground')) return 'Sports';
  return 'IT';
}

function Header() {
  const { session, logout } = useAuth();
  const name = session?.user.name ?? session?.user.email.split('@')[0] ?? 'Student';
  const id = session?.user.id ?? 'usr_student_01';
  const initials =
    name
      .split(' ')
      .map((p: string) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

  return (
    <header className="rounded-2xl border border-white/60 bg-[#f7f3ee]/90 shadow-lg backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#231a14] text-amber-100">
            <Clover className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">Campus Grievance System</p>
            <p className="font-serif text-xl font-bold tracking-wide text-stone-900">AMA COLLEGE</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-4 py-1.5 text-[11px] text-stone-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Transparent Many-to-One Resolution Architecture
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight">
              <p className="text-xs font-bold text-stone-900">{name}</p>
              <p className="font-mono text-[10px] text-stone-500">ID: {id}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efe6d6] text-[11px] font-bold text-stone-800">
              {initials}
            </div>
          </div>
          <nav className="flex items-center gap-3 text-xs">
            <Link href="/student/home" className="inline-flex items-center gap-1 font-semibold text-stone-700 hover:text-stone-950">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <span className="font-semibold text-stone-900 border-b-2 border-stone-800">Complaints Feed</span>
            <button
              onClick={() => logout()}
              className="rounded border border-dashed border-stone-400 px-2 py-0.5 font-semibold text-stone-800 hover:bg-white/60"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

function ProblemCard({
  p,
  endorsed,
  onEndorse,
}: {
  p: Problem;
  endorsed: boolean;
  onEndorse: () => void;
}) {
  const votes = p.votes + (endorsed ? 1 : 0);
  const pct = Math.min(100, Math.round((votes / p.goal) * 100));

  return (
    <article className="flex items-stretch gap-5 rounded-2xl border border-white/60 bg-[#f7f3ee]/95 p-5 shadow-lg backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-stone-300 bg-white px-2.5 py-0.5 font-mono font-semibold text-stone-800">
            {p.category} ⊙
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${TONES[p.tone]}`}>{p.status}</span>
          <span className="text-stone-500">
            #{p.id.slice(0, 12)} • {p.location}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-xl font-bold leading-snug text-stone-950">{p.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-stone-600">{p.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> Logged {p.ago}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" /> Submitter: {p.by}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-semibold text-stone-700">
            <span>Escalation Threshold</span>
            <span>
              {votes} / {p.goal} Endorsements ({pct}%)
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEndorse}
        aria-pressed={endorsed}
        aria-label={endorsed ? 'Remove endorsement' : 'Endorse this problem'}
        className={`flex w-24 shrink-0 flex-col items-center justify-center gap-1 self-start rounded-xl border px-3 py-4 transition ${
          endorsed ? 'border-stone-900 bg-white ring-2 ring-emerald-500' : 'border-stone-300 bg-white/70 hover:border-stone-500'
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            endorsed ? 'bg-emerald-700 text-white' : 'bg-[#231a14] text-white'
          }`}
        >
          <ArrowUp className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold text-stone-900">{votes}</span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-stone-500">
          {endorsed ? 'Endorsed' : 'Endorse'}
        </span>
      </button>
    </article>
  );
}

function Dashboard() {
  const { session } = useAuth();
  const id = session?.user.id ?? 'usr_student_01';

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | Category>('All');
  const [sort, setSort] = useState<'newest' | 'votes' | 'progress'>('newest');
  const [expanded, setExpanded] = useState(false);
  const [endorsed, setEndorsed] = useState<Set<string>>(new Set());

  // Fetch real problems from backend
  const loadProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/problems?sort=newest');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.problems && Array.isArray(data.problems)) {
          const mapped: Problem[] = data.problems.map((p: any) => {
            const cat = detectCategory(p.title, p.description);
            const tone: Tone = p.status === 'resolved' ? 'green' : p.upvotes > 10 ? 'amber' : 'blue';
            const goal = Math.max(30, Math.ceil(((p.upvotes || 0) + 10) / 20) * 20);
            return {
              id: p.id,
              category: cat,
              status: p.status === 'resolved' ? 'RESOLVED' : 'UNDER REVIEW BY DEAN',
              tone,
              location: 'Campus Infrastructure',
              title: p.title,
              description: p.description,
              ago: p.created_at ? formatTimeAgo(p.created_at) : 'recently',
              by: p.student_email || p.student_id || 'Student',
              votes: p.upvotes || 0,
              goal,
            };
          });
          setProblems(mapped);
        }
      }
    } catch (err) {
      console.warn('Failed to load backend problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const list = useMemo(() => {
    const filtered = problems.filter((p) => filter === 'All' || p.category === filter);
    if (sort === 'votes') {
      return [...filtered].sort((a, b) => (b.votes + (endorsed.has(b.id) ? 1 : 0)) - (a.votes + (endorsed.has(a.id) ? 1 : 0)));
    }
    if (sort === 'progress') {
      return [...filtered].sort(
        (a, b) =>
          (b.votes + (endorsed.has(b.id) ? 1 : 0)) / b.goal -
          (a.votes + (endorsed.has(a.id) ? 1 : 0)) / a.goal
      );
    }
    // Default newest
    return filtered;
  }, [problems, filter, sort, endorsed]);

  const visible = expanded ? list : list.slice(0, INITIAL_VISIBLE);
  const hidden = list.length - visible.length;

  const toggleEndorse = async (pid: string) => {
    const isCurrentlyEndorsed = endorsed.has(pid);
    const next = new Set(endorsed);
    if (isCurrentlyEndorsed) {
      next.delete(pid);
    } else {
      next.add(pid);
    }
    setEndorsed(next);

    try {
      await fetch('/api/problems/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pid, action: isCurrentlyEndorsed ? 'downvote' : 'upvote' }),
      });
    } catch (e) {
      console.warn('Failed to sync upvote to backend:', e);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-10 pt-4">
      <Header />

      {/* Title + filters */}
      <section className="rounded-2xl border border-white/60 bg-[#f7f3ee]/95 p-6 shadow-lg backdrop-blur-md sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[10px]">
              <span className="rounded border border-stone-300 bg-white px-2 py-0.5 font-mono text-stone-600">
                STUDENT ID: <b className="text-stone-900">{id}</b>
              </span>
              <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-semibold uppercase text-emerald-800">
                Verified Active
              </span>
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-stone-950">Current Problems</h1>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              Live campus grievance registry loaded directly from the database. Endorse peer grievances with the{' '}
              <b>Upvote (▲)</b> button to escalate priority for administrative intervention and weekly Dean&apos;s
              Council review.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/student/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#231a14] px-5 py-3 text-xs font-bold text-white shadow transition hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              Add New Problem
            </Link>
            <button
              onClick={loadProblems}
              title="Refresh database records"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = f === filter;
              const count = f === 'All' ? problems.length : problems.filter((p) => p.category === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f);
                    setExpanded(false);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                    active ? 'bg-[#231a14] text-white' : 'text-stone-600 hover:bg-white/70 hover:text-stone-900'
                  }`}
                >
                  {f === 'All' ? `All Problems (${count})` : `${f} (${count})`}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-stone-500">
            <ArrowUpDown className="h-3 w-3" />
            Sort:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'votes' | 'progress')}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-900 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="votes">Highest Endorsements</option>
              <option value="progress">Closest to Goal</option>
            </select>
          </label>
        </div>
      </section>

      {/* Problem list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#f7f3ee]/95 p-12 text-center text-xs text-stone-500 shadow-lg backdrop-blur-md">
          <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
          <p>Loading database records...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#f7f3ee]/95 p-10 text-center text-stone-600 shadow-lg backdrop-blur-md">
          <CircleCheck className="h-10 w-10 text-stone-400" />
          <h3 className="text-base font-bold text-stone-900">No Complaints Found</h3>
          <p className="max-w-sm text-xs text-stone-500">
            There are currently no reported problems in this category. Be the first to report an issue to campus
            authorities.
          </p>
          <Link
            href="/student/submit"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#231a14] px-4 py-2 text-xs font-bold text-white shadow hover:bg-black"
          >
            <Plus className="h-4 w-4" /> File a Grievance
          </Link>
        </div>
      ) : (
        visible.map((p) => (
          <ProblemCard key={p.id} p={p} endorsed={endorsed.has(p.id)} onEndorse={() => toggleEndorse(p.id)} />
        ))
      )}

      {/* Show more if there are more than INITIAL_VISIBLE */}
      {list.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/60 bg-[#f7f3ee]/95 px-5 py-4 text-left shadow-lg backdrop-blur-md transition hover:bg-white"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600">
              <ListFilter className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-widest text-stone-500">
                Campus Registry
              </span>
              <span className="block font-serif text-base font-bold text-stone-900">
                {expanded ? 'Show Fewer Problems' : `View All Listed Problems (${hidden} More)`}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 text-[11px] text-stone-600">
            {expanded ? 'Collapse list' : 'Show remaining grievances'}
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-300 bg-white">
              <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />
            </span>
          </span>
        </button>
      )}

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4 text-[11px] text-stone-600">
        <p>
          <b className="font-serif text-stone-900">AMA COLLEGE</b> • Resolution &amp; Governance Network
        </p>
        <nav className="flex gap-5">
          <span className="hover:text-stone-900 cursor-pointer">Governance Charter</span>
          <span className="hover:text-stone-900 cursor-pointer">Privacy &amp; Anonymity</span>
          <span className="hover:text-stone-900 cursor-pointer">IT Helpdesk</span>
          <span>© 2026 AMA College</span>
        </nav>
      </footer>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RoleGuard allow="student">
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#c9bfa8]">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 scale-110 bg-cover bg-center blur-[10px]"
          style={{ backgroundImage: `url('${BG_URL}')` }}
        />
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-[#d9cdb9]/30" />
        <div className="relative">
          <Dashboard />
        </div>
      </div>
    </RoleGuard>
  );
}
