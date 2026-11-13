'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  Clock,
  Clover,
  ListFilter,
  Plus,
  User,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

// Same photo as the login page. Swap for '/campus-bg.jpg' if you keep it in /public.
const BG_URL = 'https://kommodo.ai/i/kNZ8VWLE4ntmTarR5rlH';
const INITIAL_VISIBLE = 3;

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

// TODO: replace with data from your API (e.g. apiFetch('/api/problems')).
const PROBLEMS: Problem[] = [
  {
    id: 'PRB-2026-0104',
    category: 'Library',
    status: 'UNDER REVIEW BY DEAN',
    tone: 'amber',
    location: 'Central Library 3rd Floor',
    title: 'Central Library AC and Wi-Fi intermittent dropouts during final examination preparations',
    description:
      'The high-density study area in Wing-B experiences continuous wireless disconnections every 15 minutes, and the HVAC units are producing severe noise and inadequate cooling during afternoon hours when occupancy is highest (300+ students).',
    ago: '2 days ago',
    by: 'B426061',
    votes: 284,
    goal: 300,
  },
  {
    id: 'PRB-2026-0098',
    category: 'Mess',
    status: 'ACTION SCHEDULED - FACILITIES',
    tone: 'blue',
    location: 'South Residential Quad',
    title: 'Mess Hall hygiene protocol & reverse-osmosis drinking water filtration maintenance',
    description:
      'TDS levels at Block 4 water dispensers were recorded at 380 ppm (recommended threshold <150). Filter replacement certificates expired three months prior; immediate recalibration and certified hygiene audit requested.',
    ago: '4 days ago',
    by: 'B426074',
    votes: 192,
    goal: 200,
  },
  {
    id: 'PRB-2026-0089',
    category: 'Hostel',
    status: 'INVESTIGATION ACTIVE',
    tone: 'green',
    location: 'North Gate Transit Terminal',
    title: 'Campus commuter shuttle bus frequency delay during peak 08:30 AM morning lectures',
    description:
      'Between 08:00 AM and 09:15 AM, headway intervals between Shuttles #2 and #5 frequently exceed 35 minutes, forcing over 120 off-campus day-scholars to arrive tardy for mandatory 1st-period laboratory seminars.',
    ago: '6 days ago',
    by: 'B426089',
    votes: 145,
    goal: 200,
  },
  {
    id: 'PRB-2026-0081',
    category: 'IT',
    status: 'UNDER REVIEW BY DEAN',
    tone: 'amber',
    location: 'Hostel Block C',
    title: 'Hostel Wi-Fi speeds drop below 2 Mbps every evening after 8 PM',
    description:
      'Speed tests across Block C show sustained throughput under 2 Mbps during peak evening hours, making online lectures and assignment uploads unreliable.',
    ago: '1 week ago',
    by: 'B426102',
    votes: 131,
    goal: 200,
  },
  {
    id: 'PRB-2026-0077',
    category: 'Sports',
    status: 'ACTION SCHEDULED - FACILITIES',
    tone: 'blue',
    location: 'Main Sports Complex',
    title: 'Gym equipment out of service: three treadmills and one cable station',
    description:
      'Multiple machines have carried out-of-order tags for over a month, leaving long queues during evening slots.',
    ago: '1 week ago',
    by: 'B426115',
    votes: 118,
    goal: 150,
  },
  {
    id: 'PRB-2026-0072',
    category: 'Hostel',
    status: 'INVESTIGATION ACTIVE',
    tone: 'green',
    location: 'Hostel Block A, 2nd Floor',
    title: 'Hot water supply unavailable in morning hours',
    description: 'Geysers on the second floor stay cold until after 9 AM, affecting students with early lectures.',
    ago: '8 days ago',
    by: 'B426120',
    votes: 104,
    goal: 150,
  },
  {
    id: 'PRB-2026-0068',
    category: 'Mess',
    status: 'UNDER REVIEW BY DEAN',
    tone: 'amber',
    location: 'Mess Hall 2',
    title: 'Dinner slot overcrowding and insufficient seating',
    description: 'Peak dinner hour sees queues beyond 40 minutes; seating capacity is well below the number of residents.',
    ago: '9 days ago',
    by: 'B426133',
    votes: 97,
    goal: 150,
  },
  {
    id: 'PRB-2026-0064',
    category: 'Library',
    status: 'ACTION SCHEDULED - FACILITIES',
    tone: 'blue',
    location: 'Central Library 1st Floor',
    title: 'Insufficient power sockets at reading desks',
    description: 'Most desks have no nearby charging points, forcing students to crowd around a few wall outlets.',
    ago: '10 days ago',
    by: 'B426140',
    votes: 88,
    goal: 120,
  },
  {
    id: 'PRB-2026-0059',
    category: 'IT',
    status: 'INVESTIGATION ACTIVE',
    tone: 'green',
    location: 'Computer Lab 2',
    title: 'Campus gateway login fails repeatedly on lab machines',
    description: 'Authentication times out for several minutes before succeeding, wasting lab session time.',
    ago: '11 days ago',
    by: 'B426151',
    votes: 76,
    goal: 120,
  },
  {
    id: 'PRB-2026-0054',
    category: 'Sports',
    status: 'UNDER REVIEW BY DEAN',
    tone: 'amber',
    location: 'Football Ground',
    title: 'Ground floodlights not working after sunset',
    description: 'Evening practice sessions are cut short because two of the four floodlight towers are dead.',
    ago: '12 days ago',
    by: 'B426160',
    votes: 69,
    goal: 100,
  },
  {
    id: 'PRB-2026-0049',
    category: 'Hostel',
    status: 'ACTION SCHEDULED - FACILITIES',
    tone: 'blue',
    location: 'Hostel Block B',
    title: 'Leaking ceiling in common room during rain',
    description: 'Water seeps through the ceiling near the TV area, creating slip hazards and damaging furniture.',
    ago: '2 weeks ago',
    by: 'B426172',
    votes: 61,
    goal: 100,
  },
  {
    id: 'PRB-2026-0044',
    category: 'Mess',
    status: 'INVESTIGATION ACTIVE',
    tone: 'green',
    location: 'Mess Hall 1',
    title: 'Inconsistent food quality and limited vegetarian variety',
    description: 'Repeated menu items and uneven cooking quality have been reported across several weeks.',
    ago: '2 weeks ago',
    by: 'B426181',
    votes: 54,
    goal: 100,
  },
  {
    id: 'PRB-2026-0039',
    category: 'Library',
    status: 'UNDER REVIEW BY DEAN',
    tone: 'amber',
    location: 'Central Library Reading Hall',
    title: 'Extend library closing time during examination weeks',
    description: 'Students request a 1 AM closing time from the second week of examination preparation.',
    ago: '3 weeks ago',
    by: 'B426190',
    votes: 47,
    goal: 100,
  },
  {
    id: 'PRB-2026-0033',
    category: 'IT',
    status: 'ACTION SCHEDULED - FACILITIES',
    tone: 'blue',
    location: 'Academic Block',
    title: 'Projectors in lecture halls frequently fail to detect laptops',
    description: 'HDMI ports and adapters are faulty in several halls, delaying the start of lectures.',
    ago: '3 weeks ago',
    by: 'B426204',
    votes: 39,
    goal: 100,
  },
];

const SOLVED = [
  { title: 'Science Block B Lab Oscilloscope Replacement', note: '8 brand-new digital oscilloscopes delivered & calibrated.', date: 'Nov 10' },
  { title: 'East Gate Streetlight Illumination Restored', note: '4 LED high-lumen street poles repaired along the walkway.', date: 'Nov 07' },
];

const FILTERS: Array<'All' | Category> = ['All', 'Hostel', 'Mess', 'Library', 'IT', 'Sports'];

const TONES: Record<Tone, string> = {
  amber: 'border-amber-300 bg-amber-50 text-amber-800',
  blue: 'border-sky-300 bg-sky-50 text-sky-800',
  green: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

function Header() {
  const { session } = useAuth();
  // logout name differs between projects; use it only if your AuthContext provides it.
  const auth = useAuth() as ReturnType<typeof useAuth> & { logout?: () => void };
  const name = (session?.user as { name?: string } | undefined)?.name ?? 'Student';
  const id = session?.user.id ?? 'AMA-2026-8842';
  const initials =
    name
      .split(' ')
      .map((p) => p[0])
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
          Many-to-One Transparent Resolution Architecture
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
          <nav className="flex items-center gap-5 text-xs">
            <span className="font-semibold text-stone-900">Active</span>
            <button className="text-stone-600 hover:text-stone-900">Archive</button>
            <button
              onClick={() => auth.logout?.()}
              className="rounded border border-dashed border-stone-400 px-1.5 py-0.5 font-semibold text-stone-800 hover:bg-white/60"
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
            Problem ⊙
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${TONES[p.tone]}`}>{p.status}</span>
          <span className="text-stone-500">
            #{p.id} • {p.location}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-xl font-bold leading-snug text-stone-950">{p.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-stone-600">{p.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> Logged {p.ago}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" /> Submitted by: {p.by}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-semibold text-stone-700">
            <span>Progress Bar</span>
            <span>
              {votes} / {p.goal} Upvotes ({pct}%)
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
          endorsed ? 'border-stone-900 bg-white' : 'border-stone-300 bg-white/70 hover:border-stone-500'
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
        <span className="text-[9px] font-semibold uppercase tracking-widest text-stone-500">Endorse</span>
      </button>
    </article>
  );
}

function Dashboard() {
  const { session } = useAuth();
  const id = session?.user.id ?? 'AMA-2026-8842';

  const [filter, setFilter] = useState<'All' | Category>('All');
  const [sort, setSort] = useState<'votes' | 'progress'>('votes');
  const [expanded, setExpanded] = useState(false);
  const [endorsed, setEndorsed] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    const filtered = PROBLEMS.filter((p) => filter === 'All' || p.category === filter);
    const score = (p: Problem) =>
      sort === 'votes' ? p.votes + (endorsed.has(p.id) ? 1 : 0) : (p.votes + (endorsed.has(p.id) ? 1 : 0)) / p.goal;
    return [...filtered].sort((a, b) => score(b) - score(a));
  }, [filter, sort, endorsed]);

  const visible = expanded ? list : list.slice(0, INITIAL_VISIBLE);
  const hidden = list.length - visible.length;

  const toggleEndorse = (pid: string) =>
    setEndorsed((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });

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
              Transparent campus issue registry. Endorse peer grievances with the <b>Upvote (▲)</b> button to escalate
              priority for administrative intervention and weekly Dean&apos;s Council review.
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
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              <CircleCheck className="h-4 w-4 text-emerald-700" />
              Problem Solved
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold">84</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = f === filter;
              const label = f === 'All' ? `All Problems (${PROBLEMS.length})` : f;
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
                  {label}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-stone-500">
            <ArrowUpDown className="h-3 w-3" />
            Sort:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'votes' | 'progress')}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-900 outline-none"
            >
              <option value="votes">Highest Endorsements</option>
              <option value="progress">Closest to Goal</option>
            </select>
          </label>
        </div>
      </section>

      {/* Problem list */}
      {visible.length === 0 && (
        <p className="rounded-2xl bg-[#f7f3ee]/95 p-6 text-center text-sm text-stone-600">No problems in this category.</p>
      )}
      {visible.map((p) => (
        <ProblemCard key={p.id} p={p} endorsed={endorsed.has(p.id)} onEndorse={() => toggleEndorse(p.id)} />
      ))}

      {/* Show more */}
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
                Extended Campus Registry
              </span>
              <span className="block font-serif text-base font-bold text-stone-900">
                {expanded ? 'Show Fewer Problems' : `View All Listed Problems Under Filter (${hidden} More)`}
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

      {/* Solved archive */}
      <section className="rounded-2xl border border-white/60 bg-[#f7f3ee]/95 p-6 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-stone-900">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            Recently Solved Problems (Archive)
          </h2>
          <span className="text-[11px] text-stone-500">All verified by student representative sign-off</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SOLVED.map((s) => (
            <div key={s.title} className="rounded-xl border border-stone-200 bg-white p-3.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-700">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolved &amp; Verified
                </span>
                <span className="font-mono font-normal text-stone-500">{s.date}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-stone-900">{s.title}</p>
              <p className="mt-0.5 text-[11px] text-stone-500">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4 text-[11px] text-stone-600">
        <p>
          <b className="font-serif text-stone-900">AMA COLLEGE</b> • Resolution &amp; Governance Network
        </p>
        <nav className="flex gap-5">
          <button className="hover:text-stone-900 hover:underline">Governance Charter</button>
          <button className="hover:text-stone-900 hover:underline">Privacy &amp; Anonymity</button>
          <button className="hover:text-stone-900 hover:underline">IT Helpdesk</button>
          <span>© 2026 AMA College</span>
        </nav>
      </footer>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RoleGuard allow="student">
      {/* Fixed full-screen layer with its own header/footer; hides the global navbar. */}
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
