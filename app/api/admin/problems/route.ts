import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

interface ProblemRow {
  id: string;
  student_id: string;
  student_email?: string;
  title: string;
  description: string;
  upvotes: number;
  status: string;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort')?.toLowerCase() || 'upvotes';
    const statusFilter = searchParams.get('status')?.toLowerCase();

    const env = await getCloudflareEnv(req);

    // Build query based on sorting and optional status filter
    let query = `
      SELECT 
        p.id, 
        p.student_id, 
        u.email as student_email,
        p.title, 
        p.description, 
        p.upvotes, 
        p.status, 
        p.created_at
      FROM problems p
      LEFT JOIN users u ON p.student_id = u.id
    `;

    const params: string[] = [];

    if (statusFilter) {
      query += ` WHERE LOWER(p.status) = ?`;
      params.push(statusFilter);
    }

    if (sort === 'newest') {
      query += ` ORDER BY p.created_at DESC`;
    } else {
      // Default to most upvotes
      query += ` ORDER BY p.upvotes DESC, p.created_at DESC`;
    }

    const statement = env.DB.prepare(query);
    const boundStatement = params.length > 0 ? statement.bind(...params) : statement;
    const { results } = await boundStatement.all<ProblemRow>();

    return NextResponse.json(
      {
        success: true,
        count: results ? results.length : 0,
        sort: sort === 'newest' ? 'newest' : 'upvotes',
        problems: results || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Fetch problems error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
