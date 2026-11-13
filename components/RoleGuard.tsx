'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allow?: 'student' | 'admin' | Array<'student' | 'admin'>;
}

export default function RoleGuard({ children, allow }: RoleGuardProps) {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      router.replace('/login');
      return;
    }

    if (allow) {
      const allowedRoles = Array.isArray(allow) ? allow : [allow];
      if (!allowedRoles.includes(session.role)) {
        if (session.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/student');
        }
      }
    }
  }, [ready, session, allow, router]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf6ef]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-stone-700" />
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  if (allow) {
    const allowedRoles = Array.isArray(allow) ? allow : [allow];
    if (!allowedRoles.includes(session.role)) {
      return null;
    }
  }

  return <>{children}</>;
}
