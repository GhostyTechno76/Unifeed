'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
  name?: string;
}

export interface Session {
  token: string;
  role: 'student' | 'admin';
  user: User;
}

interface AuthContextType {
  session: Session | null;
  ready: boolean;
  login: (emailOrIdentifier: string, password?: string) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'college_grievance_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load session from storage', e);
    } finally {
      setReady(true);
    }
  }, []);

  const login = async (input: string, password?: string): Promise<Session> => {
    let email = input.trim();
    // Convenience helper: if user typed 'student' or 'admin', map to demo institutional accounts
    if (email.toLowerCase() === 'student') {
      email = 'student@iiit-bh.ac.in';
    } else if (email.toLowerCase() === 'admin') {
      email = 'admin@iiit-bh.ac.in';
    } else if (!email.includes('@')) {
      email = `${email}@iiit-bh.ac.in`;
    }

    const payload: { email: string; password?: string } = { email };
    if (password) {
      payload.password = password;
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    const name = data.user.email
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const newSession: Session = {
      token: data.token,
      role: data.role,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.role,
        name: name || (data.role === 'admin' ? 'Administrator' : 'Student'),
      },
    };

    setSession(newSession);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.error('Failed to save session to storage', e);
    }

    return newSession;
  };

  const logout = () => {
    setSession(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Clean up legacy non-user-scoped key if present
      localStorage.removeItem('unifeed_endorsed_ids');
    } catch (e) {
      console.error('Failed to clear session from storage', e);
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
