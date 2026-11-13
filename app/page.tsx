'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (session) {
      router.replace(session.role === 'admin' ? '/admin' : '/student');
    } else {
      router.replace('/login');
    }
  }, [ready, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf6ef]">
      <Loader2 className="h-8 w-8 animate-spin text-stone-700" />
    </div>
  );
}
