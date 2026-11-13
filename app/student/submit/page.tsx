'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clover,
  Loader2,
  Send,
  SquarePen,
  AlertCircle,
  Building2,
  UtensilsCrossed,
  Wifi,
  Volleyball,
  GraduationCap,
  Bus,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = [
  { id: 'wifi', label: 'Wi-Fi & Network', icon: Wifi },
  { id: 'mess', label: 'Mess & Dining', icon: UtensilsCrossed },
  { id: 'hostel', label: 'Hostel & Housing', icon: Building2 },
  { id: 'library', label: 'Library & Study', icon: GraduationCap },
  { id: 'sports', label: 'Sports & Gym', icon: Volleyball },
  { id: 'transport', label: 'Campus & Transit', icon: Bus },
];

function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const { session } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(categoryParam || 'wifi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (description.trim().length < 5) {
      setError('Description must be at least 5 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const locStr = location.trim() ? ` [Location: ${location.trim()}]` : '';
      const fullDescription = `[Category: ${category.toUpperCase()}]${locStr} ${description.trim()}`;

      const res = await fetch('/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session?.user.id || 'usr_student_01',
          title: title.trim(),
          description: fullDescription,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit problem');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error submitting grievance');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href="/student/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-stone-600 transition hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Complaints Feed
      </Link>

      <div className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231a14] text-white">
              <SquarePen className="h-5 w-5 text-amber-100" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">File a Campus Grievance</h1>
              <p className="text-xs text-stone-500">Submit your grievance for peer upvoting and administration review</p>
            </div>
          </div>
          <span className="rounded-full bg-[#fdeedd] px-3 py-1 text-[11px] font-bold text-[#b5651d] border border-[#e6d9bf]">
            IIIT Bhubaneswar
          </span>
        </div>

        {success ? (
          <div className="my-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-900">Grievance Submitted Successfully!</h2>
            <p className="text-xs text-emerald-700">
              Your report has been published to the student registry. Redirecting to the live dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                        active
                          ? 'border-stone-900 bg-[#231a14] text-white shadow-sm'
                          : 'border-stone-200 bg-[#faf6ef]/50 text-stone-700 hover:border-stone-400 hover:bg-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-amber-200' : 'text-stone-500'}`} />
                      <span className="text-xs font-semibold">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Grievance Title <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">{title.length} / min 3 chars</span>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wi-Fi access point failure in Hostel 3"
                className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 px-3.5 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700">
                Specific Location <span className="text-stone-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Block C, 3rd Floor, Corridor B"
                className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 px-3.5 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">{description.length} / min 5 chars</span>
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, frequency of occurrence, and how it impacts student activities..."
                className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 p-3.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#231a14] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-black disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting Grievance...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Grievance
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SubmitProblemPage() {
  return (
    <RoleGuard allow="student">
      <div className="min-h-screen bg-[#faf6ef] text-stone-900">
        <header className="border-b border-stone-200/80 bg-white/95">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
            <Link href="/student/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231a14] text-amber-100 shadow-sm">
                <Clover className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Student Portal</p>
                <p className="font-serif text-lg font-bold text-stone-950">UNIFEED</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/student/dashboard"
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                Browse Problems
              </Link>
            </div>
          </div>
        </header>

        <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Loading form...</div>}>
          <SubmitForm />
        </Suspense>
      </div>
    </RoleGuard>
  );
}
