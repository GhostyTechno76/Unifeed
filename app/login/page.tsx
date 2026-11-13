'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Clover,
  Contact,
  GraduationCap,
  Landmark,
  Loader2,
  Mail,
  Megaphone,
  Presentation,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CardProps {
  title: string;
  badge: string;
  headerIcon: LucideIcon;
  userIcon: LucideIcon;
  userPlaceholder: string;
  helperText: string;
  quickFillEmail: string;
  demoLabel: string;
}

function LoginCard(props: CardProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(props.quickFillEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const HeaderIcon = props.headerIcon;
  const UserIcon = props.userIcon;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Institutional email is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const session = await login(email.trim());
      router.push(session.role === 'admin' ? '/admin' : '/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail(props.quickFillEmail);
    setError('');
    setLoading(true);
    try {
      const session = await login(props.quickFillEmail);
      router.push(session.role === 'admin' ? '/admin' : '/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-sm sm:p-7"
    >
      <div>
        <div className="flex items-center justify-between border-b border-stone-200/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#efe6d6] text-stone-800">
              <HeaderIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">{props.title}</h2>
              <p className="text-[11px] text-stone-500">{props.helperText}</p>
            </div>
          </div>
          <span className="rounded-full border border-[#e6d9bf] bg-[#f3ead8] px-3 py-1 text-[11px] font-medium text-stone-700">
            {props.badge}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Institutional Email <span className="text-red-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => setEmail(props.quickFillEmail)}
                className="inline-flex items-center gap-1 rounded bg-[#efe6d6] px-2 py-0.5 text-[10px] font-bold text-stone-800 transition hover:bg-[#e6d9bf]"
              >
                <Zap className="h-3 w-3 text-amber-700" /> Auto-Fill
              </button>
            </div>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={props.userPlaceholder}
                className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/50 py-2.5 pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Verified demo account: <code className="font-mono text-stone-800">{props.quickFillEmail}</code>
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2.5 border-t border-stone-100 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#231a14] py-3 text-sm font-bold tracking-wide text-white transition hover:bg-black disabled:opacity-60 shadow-sm"
        >
          {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH EMAIL'}
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-[#faf6ef] py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-[#f0e8db] hover:border-stone-400"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-700" />
          {props.demoLabel}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && session) {
      router.replace(session.role === 'admin' ? '/admin' : '/student/dashboard');
    }
  }, [ready, session, router]);

  return (
    <div className="min-h-screen bg-[#faf6ef] text-stone-900 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-stone-200/80 bg-white/70 px-5 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#231a14] text-white shadow-sm">
              <Clover className="h-5 w-5 text-amber-100" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Campus Grievance System
              </p>
              <p className="font-serif text-2xl font-extrabold tracking-wide text-stone-950">UNIFEED</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Campus Democratic Resolution Network
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-6 px-4 py-8">
        {/* Welcome Section */}
        <section className="mx-auto w-full max-w-xl rounded-3xl border border-stone-200/80 bg-white/80 p-6 text-center shadow-sm sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6d9bf] bg-[#f3ead8] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-800">
            <Landmark className="h-3.5 w-3.5 text-stone-700" />
            Official Student &amp; Faculty Portal
          </span>
          <h1 className="mt-3 font-serif text-4xl font-extrabold tracking-tight text-stone-950 sm:text-5xl">WELCOME</h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-600 sm:text-sm">
            Democratic grievance management for campus affairs. Submit grievances, endorse peer issues, and inspect real-time administrative actions.
          </p>
        </section>

        {/* Dual Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <LoginCard
            title="Student Portal"
            badge="Peer Voting Active"
            headerIcon={GraduationCap}
            userIcon={Contact}
            userPlaceholder="e.g. student@iiit-bh.ac.in"
            helperText="Submit grievances &amp; upvote peer issues"
            quickFillEmail="student@iiit-bh.ac.in"
            demoLabel="1-Click Login as Demo Student"
          />
          <LoginCard
            title="Administration Hub"
            badge="Faculty &amp; Dean Council"
            headerIcon={Presentation}
            userIcon={Mail}
            userPlaceholder="e.g. admin@iiit-bh.ac.in"
            helperText="Review reports &amp; generate AI summaries"
            quickFillEmail="admin@iiit-bh.ac.in"
            demoLabel="1-Click Login as Demo Administrator"
          />
        </div>

        {/* Info Banner */}
        <section className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#efe6d6] text-stone-800">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="flex items-center gap-2 text-sm font-bold text-stone-900">
              Transparent Campus Resolution
              <span className="rounded bg-[#f3ead8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-700 border border-[#e6d9bf]">
                Live Network
              </span>
            </p>
            <p className="mt-0.5 text-xs text-stone-600">
              Grievances gain priority as more students upvote them. Administration reviews top-voted concerns directly with automated AI summaries.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/60 px-5 py-3 text-xs text-stone-600 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2">
            <Clover className="h-3.5 w-3.5 text-stone-700" />
            &copy; 2026 <span className="font-bold text-stone-900">Unifeed</span> Campus Grievance Portal. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs">
            <span className="text-stone-500">IIIT Bhubaneswar</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-500">Student Affairs Council</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
