'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Bus,
  ChevronDown,
  CircleHelp,
  Clover,
  Filter,
  GraduationCap,
  History,
  ListChecks,
  LogOut,
  Plus,
  SquarePen,
  TriangleAlert,
  User,
  UtensilsCrossed,
  Volleyball,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

interface CategoryCard {
  slug: string;
  title: string;
  description: string;
  tag: string;
  highPriority?: boolean;
  tickets: number;
  Icon: LucideIcon;
}

const INITIAL_CATEGORIES: CategoryCard[] = [
  {
    slug: 'mess',
    title: 'Mess Related Problem',
    description:
      'Report dining hall quality, food hygiene, delay in meal timings, drinking water purification, or weekly menu concerns.',
    tag: 'Dining Hall #2 & #4',
    tickets: 14,
    Icon: UtensilsCrossed,
  },
  {
    slug: 'hostel',
    title: 'Hostel Allotment',
    description:
      'Room allocation inquiries, room swap requests, washroom plumbing repairs, housekeeping, and furniture requisitions.',
    tag: 'Blocks A, B, C & D',
    tickets: 8,
    Icon: Building2,
  },
  {
    slug: 'wifi',
    title: 'Wi-Fi & Network Issue',
    description:
      'Campus intranet credentials, hostel Wi-Fi access points downtime, portal authentication bugs, or low bandwidth speed.',
    tag: 'High Priority',
    highPriority: true,
    tickets: 22,
    Icon: Wifi,
  },
  {
    slug: 'sports',
    title: 'Sports & Recreation',
    description:
      'Damaged court floodlights, sports kit inventory shortage, gym machine servicing, and sports ground maintenance.',
    tag: 'Complex & Arena',
    tickets: 5,
    Icon: Volleyball,
  },
  {
    slug: 'academic',
    title: 'Academic Facilities',
    description:
      'Smart classroom projector faults, lab computer hardware malfunction, library book issue errors, and whiteboard supplies.',
    tag: 'Auditorium & Labs',
    tickets: 11,
    Icon: GraduationCap,
  },
  {
    slug: 'transport',
    title: 'Transport & Campus Grounds',
    description:
      'Campus commuter shuttle delays, bus stop shade repairs, nighttime pathway solar lamps, waste bins, and parking tags.',
    tag: 'Routes & Grounds',
    tickets: 7,
    Icon: Bus,
  },
];

const NAV = [
  { label: 'Home Hub', href: '/student/home', Icon: null, active: true },
  { label: 'Live Problems', href: '/student/dashboard', Icon: ListChecks, active: false },
  { label: 'Submit Problem', href: '/student/submit', Icon: SquarePen, active: false },
  { label: 'Solved Archive', href: '/student/dashboard#archive', Icon: History, active: false },
];

function Header() {
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = session?.user.name ?? session?.user.email.split('@')[0] ?? 'Rohan Banerjee';
  const id = session?.user.id ?? 'usr_student_01';

  return (
    <header className="border-b border-[#ece5d8] bg-[#fdfaf5]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#231a14] text-white shadow-sm">
            <Clover className="h-5 w-5 text-amber-100" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-lg font-bold text-stone-950">UNIFEED</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-500">Student Grievance Portal</p>
          </div>
        </div>

        <nav className="order-last flex w-full flex-wrap items-center justify-center gap-1 sm:order-none sm:w-auto">
          {NAV.map(({ label, href, Icon, active }) => (
            <Link
              key={label}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition ${
                active
                  ? 'border-[#f3d7b5] bg-[#fdeedd] text-[#b5651d]'
                  : 'border-transparent text-stone-600 hover:bg-[#f3ece3] hover:text-stone-900'
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </Link>
          ))}
        </nav>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-[#ece5d8] bg-[#f3ece3] py-1.5 pl-1.5 pr-3 text-left transition hover:border-stone-300"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-600">
              <User className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-bold text-stone-900">{name}</span>
              <span className="block font-mono text-[10px] text-stone-500">{id}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg">
              <div className="border-b border-stone-100 px-3 py-2 text-[11px] text-stone-500">
                {session?.user.email}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function CategoryTile({ c }: { c: CategoryCard }) {
  const { Icon } = c;
  return (
    <Link
      href={`/student/submit?category=${c.slug}`}
      className="group flex flex-col rounded-2xl border border-[#ece5d8] bg-[#fffdf9] p-5 transition hover:border-[#dccfb8] hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3ece3] text-[#b5651d]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            c.highPriority ? 'bg-[#fdeedd] text-[#b5651d]' : 'bg-[#f3ece3] text-stone-600'
          }`}
        >
          {c.tag}
        </span>
      </div>

      <h3 className="mt-5 text-[17px] font-bold text-stone-900">{c.title}</h3>
      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-stone-600">{c.description}</p>

      <div className="mt-5 flex items-center justify-between border-t border-[#ece5d8] pt-3.5 text-[12px]">
        <span className="text-stone-600">
          <b className="font-bold text-stone-900">{c.tickets}</b> active tickets
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-[#b5651d]">
          Raise Problem
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default function StudentHomePage() {
  const { session } = useAuth();
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [activeCount, setActiveCount] = useState<number>(2);

  // Fetch live problems from backend to count student tickets
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await fetch('/api/problems?status=unresolved');
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.problems && Array.isArray(data.problems)) {
            // Count problems logged by this student or total active
            const studentProblems = data.problems.filter(
              (p: any) => p.student_id === session?.user.id
            );
            setActiveCount(studentProblems.length > 0 ? studentProblems.length : data.problems.length);
          }
        }
      } catch (err) {
        console.warn('Could not fetch problems from backend API:', err);
      }
    }
    loadBackendData();
  }, [session]);

  return (
    <RoleGuard allow="student">
      <div className="min-h-screen bg-[#faf6ef] text-stone-900">
        <Header />

        <main className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8">
          {/* Welcome */}
          <section className="flex flex-wrap items-start justify-between gap-5 border-b border-[#ece5d8] pb-7">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fdeedd] px-3 py-1 text-[11px] font-semibold text-[#b5651d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b5651d]/70" />
                Academic Session 2026 - 2027
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-[44px]">Welcome {session?.user.name || 'Student'}</h1>
              <p className="mt-2 text-sm text-stone-600">
                Student Grievance Central • What would you like to report or track today?
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#ece5d8] bg-white px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fdeedd] text-[#b5651d]">
                <ListChecks className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] text-stone-500">Your Active Tickets</span>
                <span className="block text-sm font-bold text-stone-900">{activeCount} In-Progress</span>
              </span>
            </div>
          </section>

          {/* Categories */}
          <section className="pt-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">Problem Raised</h2>
                  <span className="rounded-full bg-[#f3ece3] px-2.5 py-0.5 text-[10px] font-semibold text-stone-600">
                    {categories.length} Core Categories
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-stone-600">
                  Select an administrative domain below to raise a new incident or view filed grievances.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  href="/student/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#ece5d8] bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
                >
                  <Filter className="h-3.5 w-3.5" />
                  View All Complaints
                </Link>
                <Link
                  href="/student/submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#b5651d] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#9d5516]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Custom Query
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <CategoryTile key={c.slug} c={c} />
              ))}
            </div>
          </section>

          {/* Emergency banner */}
          <section className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ece5d8] bg-[#f3ece3] px-5 py-4">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdeedd] text-[#b5651d]">
                <TriangleAlert className="h-[18px] w-[18px]" />
              </span>
              <div className="leading-snug">
                <p className="text-sm font-bold text-stone-900">Emergency or Urgent Utility Hazard?</p>
                <p className="text-[11px] text-stone-600">
                  For power outages or major water pipeline bursts, please contact the 24x7 Campus Helpline at{' '}
                  <span className="font-mono">+91 (0) 80-2849-0199</span> directly.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-[#ece5d8] bg-white px-4 py-2 text-xs font-semibold text-stone-900 transition hover:bg-stone-50"
            >
              View Escalation Matrix
            </button>
          </section>
        </main>
      </div>
    </RoleGuard>
  );
}
