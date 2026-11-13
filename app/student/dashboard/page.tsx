'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  ArrowUpDown,
  CircleCheck,
  Clock,
  Clover,
  Home,
  ListFilter,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

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

function extractLocation(desc: string): string {
  const match = desc.match(/\[location:\s*([^\]]+)\]/i);
  if (match) return match[1].trim();
  return 'Campus Infrastructure';
}

function cleanDescription(desc: string): string {
  return desc.replace(/\[category:\s*[^\]]+\]/gi, '').replace(/\[location:\s*[^\]]+\]/gi, '').trim();
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
    <header className="rounded-2xl border border-stone-200/80 bg-white/95 px-5 py-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231a14] text-amber-100 shadow-sm">
            <Clover className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">Campus Grievance System</p>
            <p className="font-serif text-xl font-bold tracking-wide text-stone-950">UNIFEED</p>
          </div>
        </div>

        <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-stone-200 bg-[#faf6ef] px-3.5 py-1 text-[11px] font-medium text-stone-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Campus Resolution Network
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-right leading-tight">
              <p className="text-xs font-bold text-stone-900">{name}</p>
              <p className="font-mono text-[10px] text-stone-500">ID: {id}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efe6d6] text-[11px] font-bold text-stone-800">
              {initials}
            </div>
          </div>
          <nav className="flex items-center gap-2.5 text-xs">
            <Link
              href="/student/home"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <Home className="h-3.5 w-3.5" /> Categories
            </Link>
            <Link
              href="/student/submit"
              className="inline-flex items-center gap-1 rounded-lg bg-[#231a14] px-3 py-1 font-semibold text-white transition hover:bg-black"
            >
              <Plus className="h-3.5 w-3.5" /> File Problem
            </Link>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="rounded-lg border border-stone-300 p-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut className="h-3.5 w-3.5" />
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
  const votes = p.votes;
  const pct = Math.min(100, Math.round((votes / p.goal) * 100));

  return (
    <article className="flex items-stretch gap-4 sm:gap-5 rounded-2xl border border-stone-200/80 bg-white/95 p-5 shadow-sm transition hover:shadow-md">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-stone-300 bg-[#faf6ef] px-2.5 py-0.5 font-mono font-semibold text-stone-800">
            {p.category} ⊙
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${TONES[p.tone]}`}>{p.status}</span>
          <span className="text-stone-500">
            #{p.id.slice(0, 8)} • {p.location}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-lg sm:text-xl font-bold leading-snug text-stone-950">{p.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-stone-600">{cleanDescription(p.description)}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-stone-400" /> Logged {p.ago}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3 text-stone-400" /> Submitter: {p.by}
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
            <div className="h-full rounded-full bg-emerald-600 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEndorse}
        aria-pressed={endorsed}
        aria-label={endorsed ? 'Remove endorsement' : 'Endorse this problem'}
        className={`flex w-20 sm:w-24 shrink-0 flex-col items-center justify-center gap-1 self-start rounded-xl border px-2 py-4 transition ${
          endorsed
            ? 'border-stone-900 bg-white ring-2 ring-emerald-600 shadow-sm'
            : 'border-stone-200 bg-[#faf6ef] hover:border-stone-400 hover:bg-white'
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-95 ${
            endorsed ? 'bg-emerald-700 text-white shadow-sm' : 'bg-[#231a14] text-white'
          }`}
        >
          <ArrowUp className="h-4 w-4" />
        </span>
        <span className="text-base sm:text-lg font-bold text-stone-900">{votes}</span>
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'votes' | 'progress'>('votes');
  const [expanded, setExpanded] = useState(false);
  const [endorsed, setEndorsed] = useState<Set<string>>(new Set());

  // Load endorsed tickets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unifeed_endorsed_ids');
      if (saved) {
        setEndorsed(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.warn('Failed to load endorsed tickets from localStorage', e);
    }
  }, []);

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
            const isResolved = (p.status || '').toLowerCase() === 'resolved';
            const tone: Tone = isResolved ? 'green' : (p.upvotes || 0) >= 10 ? 'amber' : 'blue';
            const goal = Math.max(30, Math.ceil(((p.upvotes || 0) + 10) / 20) * 20);
            return {
              id: p.id,
              category: cat,
              status: isResolved ? 'RESOLVED' : (p.upvotes || 0) >= 10 ? 'UNDER REVIEW BY DEAN' : 'INVESTIGATION ACTIVE',
              tone,
              location: extractLocation(p.description),
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

  const toggleEndorse = async (pid: string) => {
    const isCurrentlyEndorsed = endorsed.has(pid);
    const nextEndorsed = new Set(endorsed);

    if (isCurrentlyEndorsed) {
      nextEndorsed.delete(pid);
    } else {
      nextEndorsed.add(pid);
    }
    setEndorsed(nextEndorsed);

    // Save to localStorage
    try {
      localStorage.setItem('unifeed_endorsed_ids', JSON.stringify(Array.from(nextEndorsed)));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }

    // Optimistically update vote counter in state
    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === pid) {
          const delta = isCurrentlyEndorsed ? -1 : 1;
          return { ...p, votes: Math.max(0, p.votes + delta) };
        }
        return p;
      })
    );

    // Persist to backend
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

  const list = useMemo(() => {
    let filtered = problems.filter((p) => {
      // Category filter
      if (filter !== 'All' && p.category !== filter) return false;
      // Status filter
      if (statusFilter === 'unresolved' && p.status === 'RESOLVED') return false;
      if (statusFilter === 'resolved' && p.status !== 'RESOLVED') return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchLoc = p.location.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }
      return true;
    });

    if (sort === 'votes') {
      return [...filtered].sort((a, b) => b.votes - a.votes);
    }
    if (sort === 'progress') {
      return [...filtered].sort((a, b) => b.votes / b.goal - a.votes / a.goal);
    }
    // Default newest
    return filtered;
  }, [problems, filter, statusFilter, searchQuery, sort]);

  const visible = expanded ? list : list.slice(0, INITIAL_VISIBLE);
  const hidden = list.length - visible.length;
  const resolvedCount = problems.filter((p) => p.status === 'RESOLVED').length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-12 pt-4">
      <Header />

      {/* Title + filters banner */}
      <section className="rounded-2xl border border-stone-200/80 bg-white/95 p-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[10px]">
              <span className="rounded border border-stone-300 bg-[#faf6ef] px-2 py-0.5 font-mono text-stone-700">
                STUDENT ID: <b className="text-stone-900">{id}</b>
              </span>
              <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-semibold uppercase text-emerald-800">
                Verified Active
              </span>
            </p>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-stone-950">Current Problems</h1>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              Community grievance registry. Endorse peer grievances with the <b>Upvote (▲)</b> button to escalate
              priority for administrative resolution and weekly Dean&apos;s Council review.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/student/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#231a14] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              Add New Problem
            </Link>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition ${
                statusFilter === 'resolved'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                  : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
              }`}
            >
              <CircleCheck className="h-4 w-4 text-emerald-700" />
              Problems Solved
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-800">
                {resolvedCount}
              </span>
            </button>
            <button
              onClick={loadProblems}
              title="Refresh database records"
              className="rounded-xl border border-stone-300 bg-white p-3 text-stone-700 transition hover:bg-stone-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by keyword, facility, or location..."
            className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 py-2 pl-10 pr-4 text-xs sm:text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
          />
        </div>

        {/* Category filters & sort toolbar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 pt-4">
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
                    active ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 bg-stone-100/80 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  {f === 'All' ? `All (${count})` : `${f} (${count})`}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
              <ArrowUpDown className="h-3 w-3" />
              Sort:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'newest' | 'votes' | 'progress')}
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-900 outline-none"
              >
                <option value="votes">Highest Upvotes</option>
                <option value="newest">Newest First</option>
                <option value="progress">Closest to Goal</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Problem list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/95 border border-stone-200/80 p-12 text-center text-xs text-stone-500 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
          <p>Loading database records...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/95 border border-stone-200/80 p-10 text-center text-stone-600 shadow-sm">
          <CircleCheck className="h-10 w-10 text-stone-400" />
          <h3 className="text-base font-bold text-stone-900">No Grievances Found</h3>
          <p className="max-w-sm text-xs text-stone-500">
            {searchQuery
              ? `No complaints matched "${searchQuery}". Try adjusting your search query.`
              : 'There are currently no reported problems in this category. Be the first to report an issue.'}
          </p>
          <Link
            href="/student/submit"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#231a14] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-black"
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
          className="flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white/95 px-5 py-4 text-left shadow-sm transition hover:bg-stone-50"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-[#faf6ef] text-stone-600">
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
          </span>
        </button>
      )}

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4 text-[11px] text-stone-500">
        <p>
          <b className="font-serif text-stone-900">UNIFEED</b> • Campus Grievance &amp; Resolution Network
        </p>
        <div className="flex gap-4">
          <Link href="/student/home" className="hover:text-stone-900">
            Categories
          </Link>
          <Link href="/student/submit" className="hover:text-stone-900">
            File Grievance
          </Link>
          <span>© 2026 Unifeed</span>
        </div>
      </footer>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RoleGuard allow="student">
      <div className="min-h-screen bg-[#faf6ef] text-stone-900">
        <Dashboard />
      </div>
    </RoleGuard>
  );
}
