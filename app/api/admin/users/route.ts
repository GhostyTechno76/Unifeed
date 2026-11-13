import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

interface UserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const env = await getCloudflareEnv(req);
    const { results } = await env.DB.prepare(
      `SELECT id, email, role, created_at FROM users ORDER BY created_at DESC`
    ).all<UserRow>();

    return NextResponse.json(
      { success: true, users: results || [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => ({}))) || {}) as any;
    const { email, id, role = 'student' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    if (!id || String(id).trim().length < 2) {
      return NextResponse.json({ error: 'A valid Student ID / Roll number is required' }, { status: 400 });
    }

    const env = await getCloudflareEnv(req);
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = String(id).trim();

    // Check if email already exists
    const existing = await env.DB.prepare(
      `SELECT id, email, role FROM users WHERE LOWER(email) = ?`
    )
      .bind(cleanEmail)
      .first<UserRow>();

    if (existing) {
      return NextResponse.json(
        { error: `User with email ${cleanEmail} is already registered (ID: ${existing.id})` },
        { status: 409 }
      );
    }

    const createdAt = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO users (id, email, role, created_at) VALUES (?, ?, ?, ?)`
    )
      .bind(cleanId, cleanEmail, role, createdAt)
      .run();

    return NextResponse.json(
      {
        success: true,
        message: 'Student registered successfully',
        user: { id: cleanId, email: cleanEmail, role, created_at: createdAt },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
