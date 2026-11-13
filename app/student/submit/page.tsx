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
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const { session } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      const res = await fetch('/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session?.user.id || 'usr_student_01',
          title: title.trim(),
          description: `[Category: ${category.toUpperCase()}] ${description.trim()}`,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit problem');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error submitting grievance');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href="/student"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Student Portal
      </Link>

      <div className="rounded-3xl border border-white/60 bg-[#f7f3ee]/95 p-6 shadow-xl shadow-stone-900/10 backdrop-blur-md sm:p-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231a14] text-white">
              <SquarePen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">File a Campus Grievance</h1>
              <p className="text-xs text-stone-500">Recorded instantly on Cloudflare D1 distributed edge database</p>
            </div>
          </div>
          <span className="rounded-full bg-[#fdeedd] px-3 py-1 text-[11px] font-bold text-[#b5651d]">
            IIIT Bhubaneswar
          </span>
        </div>

        {success ? (
          <div className="my-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-900">Problem Submitted Successfully!</h2>
            <p className="text-xs text-emerald-700">
              Your grievance has been published to the student registry. Redirecting to live dashboard...
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
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              >
                <option value="wifi">Wi-Fi &amp; Network Infrastructure</option>
                <option value="mess">Mess &amp; Dining Hall Hygiene</option>
                <option value="hostel">Hostel Accommodation &amp; Maintenance</option>
                <option value="library">Library &amp; Study Facilities</option>
                <option value="sports">Sports Arena &amp; Equipment</option>
                <option value="academic">Academic Classrooms &amp; Laboratories</option>
                <option value="transport">Campus Grounds &amp; Transit</option>
              </select>
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
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Detailed Description &amp; Location <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">{description.length} / min 5 chars</span>
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, exact floor/room location, and frequency of occurrence..."
                className="w-full rounded-xl border border-stone-300 bg-white p-3.5 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#231a14] py-3.5 text-sm font-bold text-white shadow transition hover:bg-black disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting to Cloudflare D1...
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
      <div className="min-h-screen bg-[#faf6ef]">
        <header className="border-b border-[#ece5d8] bg-[#fdfaf5]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
            <Link href="/student" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231a14] text-amber-100">
                <Clover className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Student Portal</p>
                <p className="font-serif text-lg font-bold text-stone-900">AMA COLLEGE</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/student/dashboard"
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
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
