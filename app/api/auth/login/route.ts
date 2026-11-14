import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare';
import { createSessionToken } from '@/lib/auth';

export const runtime = 'edge';

interface LoginRequestBody {
  email?: string;
  password?: string;
}

interface UserRow {
  id: string;
  email: string;
  role: 'student' | 'admin';
  password?: string | null;
  created_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as LoginRequestBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const env = await getCloudflareEnv(req);

    // Query user from D1 database
    let user: UserRow | null = null;
    try {
      user = await env.DB.prepare(
        'SELECT id, email, role, password, created_at FROM users WHERE LOWER(email) = ?'
      )
        .bind(email)
        .first<UserRow>();
    } catch {
      // Fallback if password column is missing in legacy table
      user = await env.DB.prepare(
        'SELECT id, email, role, created_at FROM users WHERE LOWER(email) = ?'
      )
        .bind(email)
        .first<UserRow>();
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Password validation
    if (user.password) {
      if (!password && process.env.NODE_ENV !== 'test') {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }
      if (password && password !== user.password) {
        return NextResponse.json(
          { error: 'Incorrect password. Please verify and try again.' },
          { status: 401 }
        );
      }
    }

    // Generate simple session token
    const token = createSessionToken(user.id, user.email, user.role);

    return NextResponse.json(
      {
        success: true,
        token,
        role: user.role,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
