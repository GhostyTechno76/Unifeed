'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Bus,
  CheckCircle2,
  CircleCheck,
  Clock,
  Clover,
  Flame,
  GraduationCap,
  ListChecks,
  ListFilter,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
  User,
  UtensilsCrossed,
  Volleyball,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

const INITIAL_VISIBLE = 20;

type Tone = 'amber' | 'blue' | 'green';
type Category = 'Hostel' | 'Mess' | 'Library' | 'IT' | 'Sports' | 'Transport';

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
  byEmail?: string;
  votes: number;
  goal: number;
  eta?: string;
  admin_notes?: string;
  media_url?: string;
}

interface CategoryInfo {
  id: Category;
  label: string;
  shortDesc: string;
  icon: LucideIcon;
}

const CATEGORY_INFOS: CategoryInfo[] = [
  { id: 'IT', label: 'Wi-Fi & IT', shortDesc: 'Network, portals & lab PCs', icon: Wifi },
  { id: 'Mess', label: 'Mess & Dining', shortDesc: 'Food quality, water & hygiene', icon: UtensilsCrossed },
  { id: 'Hostel', label: 'Hostel & Housing', shortDesc: 'Room upkeep, water & repairs', icon: Building2 },
  { id: 'Library', label: 'Library & Study', shortDesc: 'AC, study desks & resources', icon: GraduationCap },
  { id: 'Sports', label: 'Sports & Arena', shortDesc: 'Equipment, gym & ground lights', icon: Volleyball },
  { id: 'Transport', label: 'Transit & Grounds', shortDesc: 'Campus shuttles & pathways', icon: Bus },
];

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
  if (combined.includes('bus') || combined.includes('shuttle') || combined.includes('transit') || combined.includes('road')) return 'Transport';
  return 'IT';
}

function extractLocation(desc: string): string {
  const match = desc.match(/\[location:\s*([^\]]+)\]/i);
  if (match) return match[1].trim();
  return 'Campus Infrastructure';
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/\[category:\s*[^\]]+\]/gi, '')
    .replace(/\[location:\s*[^\]]+\]/gi, '')
    .replace(/\[ETA:\s*[^\]]+\]/gi, '')
    .replace(/\[AdminNotes:\s*[^\]]+\]/gi, '')
    .replace(/\[Media:\s*[^\]]+\]/gi, '')
    .trim();
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

        <div className="mt-3.5 space-y-2 border-t border-stone-100 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-stone-600">
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              <span>Estimated Resolution (ETA):</span>
              <span className="font-bold text-stone-900 bg-[#faf6ef] px-2.5 py-0.5 rounded-lg border border-stone-200">
                {p.eta || 'Within 24–48 Hours'}
              </span>
            </div>
          </div>

          {p.admin_notes && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-950">
              <span className="font-bold block text-[11px] text-amber-900 mb-0.5">Admin Work &amp; Notes:</span>
              <p className="leading-relaxed">{p.admin_notes}</p>
            </div>
          )}

          {p.media_url && (
            <div className="mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Resolution Work Media:
              </span>
              <img
                src={p.media_url}
                alt="Proof of work done"
                className="max-h-56 max-w-full rounded-xl border border-stone-200 object-cover shadow-sm"
              />
            </div>
          )}
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

export default function StudentDashboardPage() {
  const { session, logout } = useAuth();
  const studentName = session?.user.name ?? session?.user.email.split('@')[0] ?? 'Student';
  const studentId = session?.user.id ?? 'usr_student_01';
  const studentEmail = session?.user.email ?? '';

  const initials =
    studentName
      .split(' ')
      .map((p: string) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'votes' | 'newest' | 'progress'>('votes');
  const [expanded, setExpanded] = useState(false);
  const [endorsed, setEndorsed] = useState<Set<string>>(new Set());

  // User-scoped localStorage key so endorsements never cross-contaminate between different accounts
  const userStorageKey = studentId ? `unifeed_endorsed_${studentId}` : 'unifeed_endorsed_guest';

  // Load endorsed tickets from user-scoped localStorage whenever user session changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        setEndorsed(new Set(JSON.parse(saved)));
      } else {
        setEndorsed(new Set());
      }
    } catch (e) {
      console.warn('Failed to load endorsed tickets from localStorage', e);
      setEndorsed(new Set());
    }
  }, [userStorageKey]);

  // Fetch real problems from backend
  const loadProblems = async () => {
    setLoading(true);
    try {
      const url = studentId
        ? `/api/problems?sort=newest&userId=${encodeURIComponent(studentId)}`
        : '/api/problems?sort=newest';
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.problems && Array.isArray(data.problems)) {
          const mapped: Problem[] = data.problems.map((p: any) => {
            const cat = detectCategory(p.title, p.description);
            const statusStr = (p.status || '').toLowerCase();
            const isResolved = statusStr === 'resolved' || statusStr === 'completed';
            const isInProgress = statusStr === 'in progress' || statusStr === 'in_progress';
            const tone: Tone = isResolved ? 'green' : isInProgress ? 'blue' : (p.upvotes || 0) >= 10 ? 'amber' : 'blue';
            const goal = Math.max(30, Math.ceil(((p.upvotes || 0) + 10) / 20) * 20);
            return {
              id: p.id,
              category: cat,
              status: isResolved ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : (p.upvotes || 0) >= 10 ? 'UNDER REVIEW BY DEAN' : 'PENDING',
              tone,
              location: extractLocation(p.description),
              title: p.title,
              description: p.description,
              ago: p.created_at ? formatTimeAgo(p.created_at) : 'recently',
              by: p.student_email || p.student_id || 'Student',
              byEmail: p.student_email,
              votes: p.upvotes || 0,
              goal,
              eta: p.eta || 'Within 24–48 Hours',
              admin_notes: p.admin_notes || '',
              media_url: p.media_url || '',
            };
          });
          setProblems(mapped);
        }

        // If backend returns user upvotes from problem_upvotes table, sync with user's endorsed set
        if (data.upvoted_ids && Array.isArray(data.upvoted_ids) && studentId) {
          setEndorsed((prev) => {
            const merged = new Set([...Array.from(prev), ...data.upvoted_ids]);
            try {
              localStorage.setItem(userStorageKey, JSON.stringify(Array.from(merged)));
            } catch (e) {
              console.warn('Failed to cache server upvotes', e);
            }
            return merged;
          });
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
  }, [studentId]);

  const toggleEndorse = async (pid: string) => {
    const isCurrentlyEndorsed = endorsed.has(pid);
    const nextEndorsed = new Set(endorsed);

    if (isCurrentlyEndorsed) {
      nextEndorsed.delete(pid);
    } else {
      nextEndorsed.add(pid);
    }
    setEndorsed(nextEndorsed);

    try {
      localStorage.setItem(userStorageKey, JSON.stringify(Array.from(nextEndorsed)));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }

    // Optimistically update vote counter
    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === pid) {
          const delta = isCurrentlyEndorsed ? -1 : 1;
          return { ...p, votes: Math.max(0, p.votes + delta) };
        }
        return p;
      })
    );

    // Persist to backend with userId
    try {
      await fetch('/api/problems/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pid,
          action: isCurrentlyEndorsed ? 'downvote' : 'upvote',
          userId: studentId,
        }),
      });
    } catch (e) {
      console.warn('Failed to sync upvote to backend:', e);
    }
  };

  // Metrics computation
  const activeGrievancesCount = problems.filter(
    (p) => p.status !== 'COMPLETED' && p.status !== 'RESOLVED'
  ).length;
  const userTicketsCount = problems.filter(
    (p) => (p.byEmail && studentEmail && p.byEmail.toLowerCase() === studentEmail.toLowerCase()) || p.by === studentId
  ).length;
  const resolvedCount = problems.filter((p) => p.status === 'COMPLETED' || p.status === 'RESOLVED').length;
  const totalEndorsementsCast = problems.reduce((acc, p) => acc + p.votes, 0);

  // Filtered list
  const filteredList = useMemo(() => {
    let filtered = problems.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      const isResolved = p.status === 'COMPLETED' || p.status === 'RESOLVED';
      if (statusFilter === 'unresolved' && isResolved) return false;
      if (statusFilter === 'resolved' && !isResolved) return false;
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
    return filtered;
  }, [problems, selectedCategory, statusFilter, searchQuery, sort]);

  const visibleList = expanded ? filteredList : filteredList.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filteredList.length - visibleList.length;

  return (
    <RoleGuard allow="student">
      <div className="min-h-screen bg-[#faf6ef] text-stone-900 pb-16">
        {/* Navigation Bar */}
        <header className="border-b border-stone-200/80 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231a14] text-amber-100 shadow-sm">
                <Clover className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Campus Grievance System
                </p>
                <p className="font-serif text-xl font-bold tracking-wide text-stone-950">UNIFEED</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <Link
                href="/student/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#231a14] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-black"
              >
                <Plus className="h-4 w-4" />
                <span>File Grievance</span>
              </Link>

              <div className="flex items-center gap-2.5 border-l border-stone-200 pl-3">
                <div className="text-right leading-tight hidden sm:block">
                  <p className="text-xs font-bold text-stone-900">{studentName}</p>
                  <p className="font-mono text-[10px] text-stone-500">ID: {studentId}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efe6d6] text-[11px] font-bold text-stone-800">
                  {initials}
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="rounded-lg border border-stone-300 p-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 space-y-6">
          {/* Welcome & Overview Hero Banner (Replaces raw "Current Problems" text) */}
          <section className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-2xl space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6d9bf] bg-[#f3ead8] px-3 py-0.5 text-[11px] font-bold text-stone-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Academic Session 2026 - 2027
                  </span>
                  <span className="rounded-full border border-stone-200 bg-[#faf6ef] px-2.5 py-0.5 text-[10px] font-mono text-stone-600">
                    Student ID: <b className="text-stone-900">{studentId}</b>
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-950 tracking-tight">
                  Welcome, {studentName}
                </h1>
                <p className="text-xs sm:text-sm leading-relaxed text-stone-600">
                  Democratic issue tracking for campus affairs. Vote on peer grievances to escalate high-priority
                  facilities to the Dean&apos;s Council, or file a report for immediate institutional inspection.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadProblems}
                  title="Refresh grievance database"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-[#faf6ef] px-3.5 py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-[#f0e8db]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Feed</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-stone-100 pt-5">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'unresolved' ? 'all' : 'unresolved')}
                className={`rounded-xl border p-3.5 text-left transition ${
                  statusFilter === 'unresolved'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-500'
                    : 'border-stone-100 bg-[#faf6ef]/60 hover:bg-[#f3ece3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-stone-500">Active Grievances</span>
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="mt-1 block text-2xl font-extrabold text-amber-700">{activeGrievancesCount}</span>
                <span className="text-[10px] text-stone-400">Click to filter active</span>
              </button>

              <div className="rounded-xl border border-stone-100 bg-[#faf6ef]/60 p-3.5">
                <span className="block text-[11px] font-medium text-stone-500">Your Filed Reports</span>
                <span className="mt-1 block text-2xl font-extrabold text-stone-900">{userTicketsCount}</span>
                <span className="text-[10px] text-stone-400">By your student account</span>
              </div>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
                className={`rounded-xl border p-3.5 text-left transition ${
                  statusFilter === 'resolved'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-stone-100 bg-[#faf6ef]/60 hover:bg-[#f3ece3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-stone-500">Issues Resolved</span>
                  <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="mt-1 block text-2xl font-extrabold text-emerald-700">{resolvedCount}</span>
                <span className="text-[10px] text-emerald-800 font-medium">Click to filter solved</span>
              </button>

              <div className="rounded-xl border border-stone-100 bg-[#faf6ef]/60 p-3.5">
                <span className="block text-[11px] font-medium text-stone-500">Total Upvotes</span>
                <span className="mt-1 block text-2xl font-extrabold text-amber-700">{totalEndorsementsCast}</span>
                <span className="text-[10px] text-stone-400">Community consensus</span>
              </div>
            </div>
          </section>

          {/* Interactive Category Filter Rail (Replaces disconnected categories from /student/home) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Explore by Category</h2>
                <span className="text-[11px] text-stone-400">({CATEGORY_INFOS.length} core facilities)</span>
              </div>
              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-semibold text-amber-800 hover:underline"
                >
                  Reset to All Categories
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {CATEGORY_INFOS.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                const count = problems.filter((p) => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(active ? 'All' : cat.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-stone-900 bg-[#231a14] text-white shadow-md ring-2 ring-stone-900'
                        : 'border-stone-200/80 bg-white/95 text-stone-800 hover:border-stone-400 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          active ? 'bg-white/10 text-amber-200' : 'bg-[#efe6d6] text-stone-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {count}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-bold leading-tight">{cat.label}</p>
                      <p className={`mt-0.5 text-[10px] line-clamp-1 ${active ? 'text-stone-300' : 'text-stone-500'}`}>
                        {cat.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Grievance Feed Section */}
          <section className="space-y-4">
            {/* Toolbar & Search Bar */}
            <div className="rounded-2xl border border-stone-200/80 bg-white/95 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-stone-950">Campus Grievance Feed</h2>
                  <p className="text-xs text-stone-500">
                    {selectedCategory === 'All' ? 'Showing all reported campus issues' : `Filtered to ${selectedCategory} problems`}
                    {' • '}
                    {filteredList.length} grievances listed
                  </p>
                </div>

                {/* Status Toggle & Sort */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-xl border border-stone-200 bg-[#faf6ef] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                        statusFilter === 'all' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('unresolved')}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                        statusFilter === 'unresolved' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('resolved')}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                        statusFilter === 'resolved' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Resolved
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 text-xs text-stone-500">
                    <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
                    <span className="hidden sm:inline">Sort:</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as 'votes' | 'newest' | 'progress')}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-900 outline-none"
                    >
                      <option value="votes">Highest Upvotes</option>
                      <option value="newest">Newest First</option>
                      <option value="progress">Closest to Goal</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Keyword Search Input */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grievances by title, keyword, or specific facility location..."
                  className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
                />
              </div>
            </div>

            {/* Problem List Cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/95 border border-stone-200/80 p-12 text-center text-xs text-stone-500 shadow-sm">
                <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
                <p>Loading database records...</p>
              </div>
            ) : visibleList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/95 border border-stone-200/80 p-12 text-center text-stone-600 shadow-sm">
                <CircleCheck className="h-10 w-10 text-stone-400" />
                <h3 className="text-base font-bold text-stone-900">No Grievances Found</h3>
                <p className="max-w-sm text-xs text-stone-500">
                  {searchQuery
                    ? `No complaints matched "${searchQuery}". Try clearing search filters.`
                    : selectedCategory !== 'All'
                    ? `No issues reported in ${selectedCategory}. Everything looks clear in this area.`
                    : 'There are currently no active problems listed.'}
                </p>
                <div className="mt-2 flex gap-3">
                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                    >
                      Clear Category Filter
                    </button>
                  )}
                  <Link
                    href={`/student/submit${selectedCategory !== 'All' ? `?category=${selectedCategory.toLowerCase()}` : ''}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#231a14] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-black"
                  >
                    <Plus className="h-4 w-4" /> File Grievance
                  </Link>
                </div>
              </div>
            ) : (
              visibleList.map((p) => (
                <ProblemCard key={p.id} p={p} endorsed={endorsed.has(p.id)} onEndorse={() => toggleEndorse(p.id)} />
              ))
            )}

            {/* Pagination / Expand button */}
            {filteredList.length > INITIAL_VISIBLE && (
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
                      Grievance Registry
                    </span>
                    <span className="block font-serif text-base font-bold text-stone-900">
                      {expanded ? 'Show Fewer Issues' : `View All Listed Problems (${hiddenCount} More)`}
                    </span>
                  </span>
                </span>
                <span className="text-xs font-semibold text-stone-600">
                  {expanded ? 'Collapse list' : 'Show remaining'}
                </span>
              </button>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="mx-auto max-w-6xl px-4 pt-4 sm:px-8 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/70 mt-10">
          <p className="flex items-center gap-1.5">
            <Clover className="h-3.5 w-3.5 text-stone-600" />
            <b className="font-serif text-stone-900">UNIFEED</b> • Campus Grievance &amp; Resolution Network
          </p>
          <div className="flex gap-4">
            <span>IIIT Bhubaneswar</span>
            <span>•</span>
            <Link href="/student/submit" className="hover:text-stone-900 font-medium">
              File a Grievance
            </Link>
            <span>•</span>
            <span>© 2026 Unifeed</span>
          </div>
        </footer>
      </div>
    </RoleGuard>
  );
}
