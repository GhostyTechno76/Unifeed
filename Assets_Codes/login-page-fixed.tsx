'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Clover,
  Contact,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Loader2,
  Lock,
  Mail,
  Megaphone,
  Presentation,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CardProps {
  title: string;
  badge: string;
  headerIcon: LucideIcon;
  userIcon: LucideIcon;
  passIcon: LucideIcon;
  userPlaceholder: string;
  passPlaceholder: string;
  checkboxLabel: string;
  defaultChecked: boolean;
  footerLeft: string;
  footerRight: string;
}

function LoginCard(props: CardProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(props.defaultChecked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const HeaderIcon = props.headerIcon;
  const UserIcon = props.userIcon;
  const PassIcon = props.passIcon;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // The API is passwordless (email lookup); the password field is UI-only.
      const session = await login(username.trim());
      router.push(session.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const input =
    'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-300';

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-white/60 bg-[#f7f3ee]/90 p-6 shadow-xl shadow-stone-900/10 backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#efe6d6] text-stone-800">
            <HeaderIcon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">{props.title}</h2>
        </div>
        <span className="rounded-full border border-[#e6d9bf] bg-[#f3ead8] px-3 py-1 text-[11px] font-medium text-stone-700">
          {props.badge}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-700">
            Username <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type="email"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={props.userPlaceholder}
              className={input}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
              Password <span className="text-red-600">*</span>
            </label>
            <button type="button" className="text-xs text-stone-600 hover:text-stone-900 hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <PassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={props.passPlaceholder}
              className={`${input} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="h-4 w-4 rounded border-stone-400 accent-stone-900"
          />
          {props.checkboxLabel}
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#231a14] py-3 text-sm font-bold tracking-wide text-white transition hover:bg-black disabled:opacity-60"
        >
          NEXT
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="text-stone-500">{props.footerLeft}</span>
        <button type="button" className="font-semibold text-stone-800 hover:underline">
          {props.footerRight}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && session) router.replace(session.role === 'admin' ? '/admin' : '/student');
  }, [ready, session, router]);

  return (
    // Fixed full-screen layer so this page has its own header/footer and hides the global navbar.
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#c9bfa8]">
      {/* Background photo, softly blurred */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 scale-110 bg-cover bg-center blur-[10px]"
        style={{ backgroundImage: "url('https://kommodo.ai/i/kNZ8VWLE4ntmTarR5rlH')" }}
      />
      {/* Warm tint to keep the cards and text readable */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[#d9cdb9]/30" />

      <div className="relative flex min-h-full flex-col">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7f3ee] text-stone-700 shadow">
              <Clover className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                Campus Grievance System
              </p>
              <p className="text-2xl font-extrabold tracking-wide text-stone-900">AMA COLLEGE</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-[#f7f3ee]/90 px-4 py-2 text-xs text-stone-700 shadow backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-stone-500" />
            Transparent Many-to-One Resolution Architecture
            <button className="font-bold text-stone-900 underline">Details</button>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pb-6 pt-2">
          {/* Welcome */}
          <section className="mx-auto w-full max-w-xl rounded-3xl border border-white/60 bg-[#f7f3ee]/90 px-6 py-7 text-center shadow-xl shadow-stone-900/10 backdrop-blur-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6d9bf] bg-[#f3ead8] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-700">
              <Landmark className="h-3.5 w-3.5" />
              Official Resolution &amp; Tracking Portal
            </span>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-stone-950">WELCOME</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-stone-600">
              Sign in to submit, endorse, and inspect real-time campus resolutions. Eliminating black-box
              1-on-1 portals through democratic oversight.
            </p>
          </section>

          {/* Login cards */}
          <div className="grid gap-5 md:grid-cols-2">
            <LoginCard
              title="Students"
              badge="Peer Voting Active"
              headerIcon={GraduationCap}
              userIcon={Contact}
              passIcon={Lock}
              userPlaceholder="e.g. abc@iiit.bh.ac.in"
              passPlaceholder="Enter student password"
              checkboxLabel="Keep me logged in on this browser"
              defaultChecked={false}
              footerLeft="First time logging in?"
              footerRight="Activate AMA Student ID"
            />
            <LoginCard
              title="Administration"
              badge="Admin Oversight"
              headerIcon={Presentation}
              userIcon={Mail}
              passIcon={ShieldCheck}
              userPlaceholder="e.g. prof.williams@iiit.bh.ac.in"
              passPlaceholder="Enter faculty password"
              checkboxLabel="Require institutional 2FA verification"
              defaultChecked
              footerLeft="Faculty Dean / Committee?"
              footerRight="Department Admin Login"
            />
          </div>

          {/* Info strip */}
          <section className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-[#f7f3ee]/90 p-4 shadow-lg backdrop-blur-md sm:flex-row sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#efe6d6] text-stone-800">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="flex items-center gap-2 text-sm font-bold text-stone-900">
                Transforming Campus Grievance Resolution
                <span className="rounded bg-[#f3ead8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-700 ring-1 ring-[#e6d9bf]">
                  Active Protocol
                </span>
              </p>
              <p className="mt-0.5 text-xs text-stone-600">
                No more opaque black-box tickets or chaotic reply-all email threads. Direct peer upvoting,
                timestamped faculty responses, and real-time public milestone tracking.
              </p>
            </div>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#efe6d6] px-4 py-2 text-xs font-bold text-stone-900 transition hover:bg-[#e6d9bf]">
              <BarChart3 className="h-4 w-4" />
              View Public Tracker
            </button>
          </section>
        </main>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 bg-[#f7f3ee]/90 px-5 py-3 text-xs text-stone-600 backdrop-blur sm:px-8">
          <p className="flex items-center gap-2">
            <Clover className="h-3.5 w-3.5 text-stone-700" />
            &copy; 2026 <span className="font-bold text-stone-900">AMA COLLEGE</span> Resolution &amp; Governance
            Network. All rights reserved.
          </p>
          <nav className="flex gap-5">
            <button className="hover:text-stone-900 hover:underline">Terms of Service</button>
            <button className="hover:text-stone-900 hover:underline">Privacy &amp; Whistleblower Policy</button>
            <button className="hover:text-stone-900 hover:underline">IT Helpdesk</button>
          </nav>
        </footer>
      </div>
    </div>
  );
}
