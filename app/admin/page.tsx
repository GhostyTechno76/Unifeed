'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  Check,
  CheckCircle2,
  Clock,
  Clover,
  Copy,
  Flame,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  User,
  X,
  RotateCcw,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

interface Problem {
  id: string;
  student_id: string;
  student_email?: string;
  title: string;
  description: string;
  upvotes: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const { session, logout } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [sort, setSort] = useState<'upvotes' | 'newest'>('upvotes');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // AI Summary State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/problems?sort=${sort}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        setProblems(data.problems || []);
      }
    } catch (e) {
      console.error('Error fetching admin problems:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [sort]);

  const handleToggleStatus = async (problem: Problem) => {
    const isResolved = problem.status.toLowerCase() === 'resolved';
    const newStatus = isResolved ? 'unresolved' : 'resolved';
    setUpdatingId(problem.id);

    // Optimistic update
    setProblems((prev) =>
      prev.map((p) => (p.id === problem.id ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await fetch('/api/admin/problems', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: problem.id, status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
    } catch (e) {
      console.error('Error updating status:', e);
      // Revert if error
      setProblems((prev) =>
        prev.map((p) => (p.id === problem.id ? { ...p, status: problem.status } : p))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const generateAISummary = async () => {
    setAiLoading(true);
    setAiModalOpen(true);
    try {
      const res = await fetch('/api/admin/summarize');
      const data = (await res.json()) as any;
      if (res.ok && data.summary) {
        setAiSummary(data.summary);
      } else {
        setAiSummary(data.error || 'Failed to generate summary.');
      }
    } catch (e: any) {
      setAiSummary('Error generating summary: ' + (e.message || 'Network error'));
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!aiSummary) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(aiSummary)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopy(aiSummary);
        });
    } else {
      fallbackCopy(aiSummary);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Fallback copy failed:', e);
    }
  };

  const totalComplaints = problems.length;
  const unresolvedComplaints = problems.filter((p) => p.status.toLowerCase() === 'unresolved').length;
  const resolvedComplaints = problems.filter((p) => p.status.toLowerCase() === 'resolved').length;
  const highPriority = problems.filter((p) => p.upvotes >= 10).length;

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (statusFilter === 'unresolved' && p.status.toLowerCase() !== 'unresolved') return false;
      if (statusFilter === 'resolved' && p.status.toLowerCase() !== 'resolved') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchEmail = (p.student_email || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEmail) return false;
      }
      return true;
    });
  }, [problems, statusFilter, searchQuery]);

  return (
    <RoleGuard allow="admin">
      <div className="min-h-screen bg-[#faf6ef] text-stone-900 pb-16">
        {/* Navigation Bar */}
        <header className="border-b border-stone-200/80 bg-white/95">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#231a14] text-amber-100 shadow-sm">
                <Clover className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Administrative Console
                </p>
                <p className="font-serif text-lg font-bold text-stone-950">UNIFEED - DEAN&apos;S COUNCIL</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                Council Administrator
              </span>
              <span className="hidden sm:inline text-xs text-stone-600">{session?.user.email}</span>
              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 space-y-6">
          {/* Executive Overview Banner & AI Trigger */}
          <section className="rounded-3xl border border-white/80 bg-gradient-to-r from-[#231a14] via-[#35271d] to-[#231a14] p-6 text-white shadow-md sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  Cloudflare Workers AI (Llama 3 8B)
                </span>
                <h1 className="text-2xl font-bold sm:text-3xl">Grievance Intelligence &amp; Prioritization</h1>
                <p className="text-xs leading-relaxed text-stone-300">
                  Synthesize active campus complaints into an actionable, 2-paragraph executive briefing highlighting
                  critical bottlenecks and prioritized administrative remedies.
                </p>
              </div>
              <button
                onClick={generateAISummary}
                className="inline-flex items-center gap-2.5 rounded-xl bg-amber-500 px-5 py-3.5 text-xs font-black tracking-wide text-stone-950 shadow-md transition hover:bg-amber-400 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                GENERATE EXECUTIVE AI SUMMARY
              </button>
            </div>
          </section>

          {/* Metrics Overview Cards */}
          <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Complaints</span>
                <TrendingUp className="h-4 w-4 text-stone-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-stone-900">{totalComplaints}</p>
              <p className="mt-1 text-[11px] text-stone-500">Logged across campus</p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Unresolved</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-amber-600">{unresolvedComplaints}</p>
              <p className="mt-1 text-[11px] text-stone-500">Active backlog</p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-rose-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">High Priority</span>
                <Flame className="h-4 w-4 text-rose-600" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-rose-600">{highPriority}</p>
              <p className="mt-1 text-[11px] text-stone-500">&gt; 10 student upvotes</p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-emerald-700">{resolvedComplaints}</p>
              <p className="mt-1 text-[11px] text-stone-500">Action completed</p>
            </div>
          </section>

          {/* Admin Control Bar & Problem Feed */}
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Campus Grievance Registry</h2>
                <p className="text-xs text-stone-500">Manage, inspect, and update student complaint statuses</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center rounded-lg border border-stone-200 bg-[#faf6ef]/80 p-0.5 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      statusFilter === 'all' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({totalComplaints})
                  </button>
                  <button
                    onClick={() => setStatusFilter('unresolved')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      statusFilter === 'unresolved' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Unresolved ({unresolvedComplaints})
                  </button>
                  <button
                    onClick={() => setStatusFilter('resolved')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      statusFilter === 'resolved' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Resolved ({resolvedComplaints})
                  </button>
                </div>

                {/* Sort Controls */}
                <button
                  onClick={() => setSort('upvotes')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    sort === 'upvotes'
                      ? 'bg-[#231a14] text-white shadow-sm'
                      : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" /> Most Upvoted
                </button>
                <button
                  onClick={() => setSort('newest')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    sort === 'newest'
                      ? 'bg-[#231a14] text-white shadow-sm'
                      : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" /> Newest First
                </button>
                <button
                  onClick={fetchProblems}
                  aria-label="Refresh problems"
                  title="Refresh grievances"
                  className="rounded-lg border border-stone-300 p-2 text-stone-600 transition hover:bg-stone-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="mt-4 relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or student email..."
                className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 py-2 pl-10 pr-4 text-xs sm:text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
              />
            </div>

            {/* Complaints Feed */}
            <div className="mt-5 space-y-4">
              {loading && problems.length === 0 ? (
                <div className="flex items-center justify-center p-12 text-xs text-stone-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-stone-600" /> Loading grievances...
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  No grievances matching the selected filters.
                </div>
              ) : (
                filteredProblems.map((p) => {
                  const isResolved = p.status.toLowerCase() === 'resolved';
                  const isUpdating = updatingId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-[#faf6ef]/50 p-4 transition hover:bg-[#faf6ef] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-stone-200 px-2 py-0.5 font-mono text-[10px] text-stone-700">
                            #{p.id.slice(0, 8)}
                          </span>
                          <span
                            className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-stone-500">
                            <User className="h-3 w-3 text-stone-400" /> {p.student_email || p.student_id}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900">{p.title}</h3>
                        <p className="text-xs text-stone-600 line-clamp-2">{p.description}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-center min-w-[70px]">
                          <span className="text-base font-black text-stone-900">{p.upvotes}</span>
                          <span className="text-[9px] font-bold uppercase text-stone-500">Upvotes</span>
                        </div>

                        {/* Status Toggle Action Button */}
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shadow-sm ${
                            isResolved
                              ? 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800'
                          } disabled:opacity-50`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isResolved ? (
                            <>
                              <RotateCcw className="h-3.5 w-3.5 text-stone-500" /> Reopen Ticket
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>

        {/* AI Summary Modal */}
        {aiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-base font-bold text-stone-900">
                    Executive Campus Grievance Brief
                  </h3>
                </div>
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-5">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                    <p className="text-xs font-semibold text-stone-600">
                      Cloudflare Workers AI (@cf/meta/llama-3-8b-instruct) synthesizing grievances...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs leading-relaxed text-stone-700 whitespace-pre-line bg-[#faf6ef] p-5 rounded-xl border border-stone-200">
                    {aiSummary}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                <span className="text-[11px] text-stone-400">Model: Meta Llama-3-8B-Instruct on Edge GPU</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy Summary'}
                  </button>
                  <button
                    onClick={() => setAiModalOpen(false)}
                    className="rounded-lg bg-[#231a14] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-black"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
