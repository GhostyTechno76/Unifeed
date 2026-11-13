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
  ImageIcon,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  X,
  Edit3,
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
  eta?: string;
  admin_notes?: string;
  media_url?: string;
}

interface UserRecord {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const { session, logout } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [sort, setSort] = useState<'upvotes' | 'newest'>('upvotes');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'in_progress' | 'completed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // AI Summary State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Problem Edit / Update Modal State
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [editStatus, setEditStatus] = useState<string>('pending');
  const [editEta, setEditEta] = useState<string>('Within 24–48 Hours');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editMediaUrl, setEditMediaUrl] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Student Directory / Registration Modal State
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [registeringStudent, setRegisteringStudent] = useState(false);
  const [studentSuccessMsg, setStudentSuccessMsg] = useState('');
  const [studentErrorMsg, setStudentErrorMsg] = useState('');

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = (await res.json()) as any;
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [sort]);

  const openEditModal = (problem: Problem) => {
    setEditingProblem(problem);
    const s = problem.status.toLowerCase();
    setEditStatus(s === 'completed' || s === 'resolved' ? 'completed' : s === 'in progress' || s === 'in_progress' ? 'in progress' : 'pending');
    setEditEta(problem.eta || 'Within 24–48 Hours');
    setEditNotes(problem.admin_notes || '');
    setEditMediaUrl(problem.media_url || '');
  };

  const handleSaveProblemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProblem) return;

    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/problems', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProblem.id,
          status: editStatus,
          eta: editEta.trim(),
          admin_notes: editNotes.trim(),
          media_url: editMediaUrl.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update problem');
      }

      const data = (await res.json()) as any;
      const updatedProblem: Problem = data.problem || {
        ...editingProblem,
        status: editStatus,
        eta: editEta.trim(),
        admin_notes: editNotes.trim(),
        media_url: editMediaUrl.trim(),
      };

      setProblems((prev) =>
        prev.map((p) => (p.id === editingProblem.id ? updatedProblem : p))
      );

      setEditingProblem(null);
    } catch (err: any) {
      console.error('Error saving problem edit:', err);
      alert(err.message || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEmail.trim() || !newStudentId.trim()) {
      setStudentErrorMsg('Both student email and student ID are required.');
      return;
    }

    setRegisteringStudent(true);
    setStudentErrorMsg('');
    setStudentSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newStudentEmail.trim(),
          id: newStudentId.trim(),
          role: 'student',
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register student');
      }

      setStudentSuccessMsg(`Student ${data.user.email} (ID: ${data.user.id}) registered successfully!`);
      setNewStudentEmail('');
      setNewStudentId('');
      fetchUsers();
    } catch (err: any) {
      setStudentErrorMsg(err.message || 'Error registering student');
    } finally {
      setRegisteringStudent(false);
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

  // Metrics computation
  const totalComplaints = problems.length;
  const pendingComplaints = problems.filter(
    (p) => p.status.toLowerCase() !== 'completed' && p.status.toLowerCase() !== 'resolved'
  ).length;
  const inProgressComplaints = problems.filter(
    (p) => p.status.toLowerCase() === 'in progress' || p.status.toLowerCase() === 'in_progress'
  ).length;
  const resolvedComplaints = problems.filter(
    (p) => p.status.toLowerCase() === 'completed' || p.status.toLowerCase() === 'resolved'
  ).length;
  const highPriority = problems.filter(
    (p) => p.upvotes >= 10 && p.status.toLowerCase() !== 'completed' && p.status.toLowerCase() !== 'resolved'
  ).length;

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const s = p.status.toLowerCase();
      const isCompleted = s === 'completed' || s === 'resolved';
      const isInProgress = s === 'in progress' || s === 'in_progress';

      if (statusFilter === 'pending' && isCompleted) return false;
      if (statusFilter === 'in_progress' && !isInProgress) return false;
      if (statusFilter === 'completed' && !isCompleted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchEmail = (p.student_email || '').toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEmail && !matchId) return false;
      }
      return true;
    });
  }, [problems, statusFilter, searchQuery]);

  return (
    <RoleGuard allow="admin">
      <div className="min-h-screen bg-[#faf6ef] text-stone-900 pb-16">
        {/* Navigation Bar */}
        <header className="border-b border-stone-200/80 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStudentModalOpen(true);
                  fetchUsers();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 transition hover:bg-stone-50 shadow-sm"
              >
                <UserPlus className="h-4 w-4 text-stone-600" />
                <span>Student Directory</span>
              </button>

              <span className="hidden sm:inline-block rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                Council Administrator
              </span>
              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-50 shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">
          {/* Executive Overview Banner & AI Trigger (No Cloudflare mention) */}
          <section className="rounded-3xl border border-stone-800 bg-[#231a14] p-6 text-white shadow-md sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Grievance Intelligence
                </span>
                <h1 className="text-2xl font-bold sm:text-3xl">Grievance Synthesis &amp; Prioritization</h1>
                <p className="text-xs leading-relaxed text-stone-300">
                  Synthesize active student complaints into structured, actionable bullet points highlighting
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

          {/* Metrics Overview Cards (Changed "Total Complaints" to "Total Pending") */}
          <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`rounded-2xl border p-5 text-left transition shadow-sm ${
                statusFilter === 'pending'
                  ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-500'
                  : 'border-stone-200/80 bg-white hover:bg-[#faf6ef]'
              }`}
            >
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Pending</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-amber-700">{pendingComplaints}</p>
              <p className="mt-1 text-[11px] text-stone-500">Active backlog awaiting resolution</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`rounded-2xl border p-5 text-left transition shadow-sm ${
                statusFilter === 'in_progress'
                  ? 'border-sky-600 bg-sky-50 text-sky-950 ring-2 ring-sky-500'
                  : 'border-stone-200/80 bg-white hover:bg-[#faf6ef]'
              }`}
            >
              <div className="flex items-center justify-between text-sky-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
                <TrendingUp className="h-4 w-4 text-sky-600" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-sky-700">{inProgressComplaints}</p>
              <p className="mt-1 text-[11px] text-stone-500">Work actively assigned</p>
            </button>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-rose-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">High Priority</span>
                <Flame className="h-4 w-4 text-rose-600" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-rose-600">{highPriority}</p>
              <p className="mt-1 text-[11px] text-stone-500">&gt; 10 student upvotes</p>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`rounded-2xl border p-5 text-left transition shadow-sm ${
                statusFilter === 'completed'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500'
                  : 'border-stone-200/80 bg-white hover:bg-[#faf6ef]'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-emerald-700">{resolvedComplaints}</p>
              <p className="mt-1 text-[11px] text-stone-500">Resolved &amp; verified issues</p>
            </button>
          </section>

          {/* Admin Control Bar & Problem Feed */}
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  {statusFilter === 'pending'
                    ? 'Pending Student Complaints'
                    : statusFilter === 'in_progress'
                    ? 'In-Progress Grievances'
                    : statusFilter === 'completed'
                    ? 'Completed & Solved Grievances'
                    : 'All Campus Grievances'}
                </h2>
                <p className="text-xs text-stone-500">
                  Click on any complaint to update progress, enter resolution ETA, post remarks, or attach proof of work.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Tabs (Defaults to Pending Only) */}
                <div className="flex items-center rounded-xl border border-stone-200 bg-[#faf6ef] p-0.5 text-xs">
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`rounded-lg px-3 py-1 font-semibold transition ${
                      statusFilter === 'pending' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Pending ({pendingComplaints})
                  </button>
                  <button
                    onClick={() => setStatusFilter('in_progress')}
                    className={`rounded-lg px-3 py-1 font-semibold transition ${
                      statusFilter === 'in_progress' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    In Progress ({inProgressComplaints})
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`rounded-lg px-3 py-1 font-semibold transition ${
                      statusFilter === 'completed' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Completed ({resolvedComplaints})
                  </button>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`rounded-lg px-3 py-1 font-semibold transition ${
                      statusFilter === 'all' ? 'bg-[#231a14] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({totalComplaints})
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
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or student email..."
                className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200"
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
                  const s = p.status.toLowerCase();
                  const isCompleted = s === 'completed' || s === 'resolved';
                  const isInProgress = s === 'in progress' || s === 'in_progress';
                  return (
                    <div
                      key={p.id}
                      onClick={() => openEditModal(p)}
                      className="group flex flex-col gap-4 rounded-2xl border border-stone-200 bg-[#faf6ef]/40 p-5 transition hover:border-stone-400 hover:bg-white hover:shadow-md cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-2 flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-stone-200 px-2 py-0.5 font-mono text-[10px] text-stone-700">
                            #{p.id.slice(0, 8)}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isInProgress
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-stone-500">
                            <User className="h-3 w-3 text-stone-400" /> {p.student_email || p.student_id}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                            <Clock className="h-3 w-3 text-amber-700" /> ETA: {p.eta || 'Within 24–48 Hours'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-950 transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{p.description}</p>

                        {p.admin_notes && (
                          <div className="text-[11px] text-stone-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60 mt-1">
                            <b className="text-amber-900">Admin Remarks:</b> {p.admin_notes}
                          </div>
                        )}

                        {p.media_url && (
                          <div className="flex items-center gap-2 text-[11px] text-stone-600 font-semibold pt-1">
                            <ImageIcon className="h-3.5 w-3.5 text-stone-500" />
                            <span>1 Work-Done Photo Attached</span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-center min-w-[70px]">
                          <span className="text-base font-black text-stone-900">{p.upvotes}</span>
                          <span className="text-[9px] font-bold uppercase text-stone-500">Upvotes</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(p);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-bold text-stone-900 transition hover:bg-stone-50 shadow-sm"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-stone-600" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>

        {/* 1. Modal: Manage Problem, Status, ETA, Notes & Media */}
        {editingProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-stone-800" />
                  <h3 className="text-base font-bold text-stone-900">
                    Manage Problem: #{editingProblem.id.slice(0, 8)}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingProblem(null)}
                  className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProblemEdit} className="py-4 space-y-4">
                <div className="bg-[#faf6ef] p-3 rounded-xl border border-stone-200">
                  <p className="text-xs font-bold text-stone-900">{editingProblem.title}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Submitted by: {editingProblem.student_email || editingProblem.student_id}</p>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Resolution Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'pending', label: 'Pending', color: 'border-amber-300 bg-amber-50 text-amber-900' },
                      { id: 'in progress', label: 'In Progress', color: 'border-sky-300 bg-sky-50 text-sky-900' },
                      { id: 'completed', label: 'Completed', color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
                    ].map((s) => {
                      const active = editStatus.toLowerCase() === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setEditStatus(s.id)}
                          className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                            active
                              ? `${s.color} ring-2 ring-stone-900 shadow-sm`
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ETA Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Estimated Resolution (ETA)
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      {['24 Hours', '48 Hours', '3 Days', 'Completed'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEditEta(preset)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-medium"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editEta}
                    onChange={(e) => setEditEta(e.target.value)}
                    placeholder="e.g. Within 24–48 Hours or Nov 15, 2026"
                    className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 px-3.5 py-2 text-xs sm:text-sm text-stone-800 outline-none focus:border-stone-500 focus:bg-white"
                  />
                </div>

                {/* Admin Remarks / Work Done Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Administrative Remarks &amp; Work Done
                  </label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Enter details of maintenance work done, parts replaced, or reasons for delay..."
                    className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 p-3 text-xs sm:text-sm text-stone-800 outline-none focus:border-stone-500 focus:bg-white"
                  />
                </div>

                {/* Media / Photo Attachment */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Attach Work-Done Photo / Proof
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-[#faf6ef] px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-200">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Photo</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <input
                        type="text"
                        value={editMediaUrl}
                        onChange={(e) => setEditMediaUrl(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                        className="flex-1 rounded-xl border border-stone-300 bg-[#faf6ef]/40 px-3 py-2 text-xs text-stone-800 outline-none focus:border-stone-500 focus:bg-white"
                      />
                      {editMediaUrl && (
                        <button
                          type="button"
                          onClick={() => setEditMediaUrl('')}
                          className="text-stone-400 hover:text-red-600 text-xs font-bold p-1"
                          title="Remove media"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {editMediaUrl && (
                      <div className="mt-2 relative rounded-xl border border-stone-200 overflow-hidden bg-stone-50 p-2">
                        <img
                          src={editMediaUrl}
                          alt="Work done preview"
                          className="max-h-40 rounded-lg object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingProblem(null)}
                    className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#231a14] px-5 py-2 text-xs font-bold text-white hover:bg-black shadow-sm disabled:opacity-50"
                  >
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Modal: Student Directory & Registration */}
        {studentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-stone-800" />
                  <h3 className="text-base font-bold text-stone-900">Student Directory &amp; Registration</h3>
                </div>
                <button
                  onClick={() => {
                    setStudentModalOpen(false);
                    setStudentSuccessMsg('');
                    setStudentErrorMsg('');
                  }}
                  className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Add New Student Form */}
              <div className="py-4 border-b border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Enroll New Student
                </h4>
                <form onSubmit={handleRegisterStudent} className="space-y-3">
                  {studentSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                      {studentSuccessMsg}
                    </div>
                  )}
                  {studentErrorMsg && (
                    <div className="p-2.5 rounded-xl bg-red-50 text-red-800 text-xs font-medium border border-red-200">
                      {studentErrorMsg}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Institutional Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        placeholder="e.g. subham@iiit-bh.ac.in"
                        className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 px-3.5 py-2 text-xs text-stone-800 outline-none focus:border-stone-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Student ID / Roll No <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                        placeholder="e.g. B426099 or usr_subham"
                        className="w-full rounded-xl border border-stone-300 bg-[#faf6ef]/40 px-3.5 py-2 text-xs text-stone-800 outline-none focus:border-stone-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={registeringStudent}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#231a14] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
                    >
                      {registeringStudent ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      <span>Register Student</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Registered Student List */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Enrolled Users ({usersList.length})
                  </h4>
                  <button
                    onClick={fetchUsers}
                    className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingUsers ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border border-stone-200 rounded-xl p-2 bg-[#faf6ef]/30">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-xs text-stone-500">Loading student directory...</div>
                  ) : usersList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-500">No users found.</div>
                  ) : (
                    usersList.map((u) => (
                      <div
                        key={u.id + u.email}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-white text-xs"
                      >
                        <div>
                          <p className="font-bold text-stone-900">{u.email}</p>
                          <p className="font-mono text-[10px] text-stone-500">ID: {u.id}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-stone-200 pt-3 mt-4">
                <button
                  onClick={() => setStudentModalOpen(false)}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Modal: AI Executive Briefing (No Cloudflare mention, Bullet points) */}
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
                      Synthesizing student grievances into prioritized bullet points...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs leading-relaxed text-stone-800 whitespace-pre-line bg-[#faf6ef] p-5 rounded-xl border border-stone-200 font-sans">
                    {aiSummary}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                <span className="text-[11px] text-stone-500 font-medium">AI Grievance Intelligence System</span>
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
