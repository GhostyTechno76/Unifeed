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

function parseRow(p: any) {
  const desc = p.description || '';
  const etaMatch = desc.match(/\[ETA:\s*([^\]]+)\]/i);
  const notesMatch = desc.match(/\[AdminNotes:\s*([^\]]+)\]/i);
  const mediaMatch = desc.match(/\[Media:\s*([^\]]+)\]/i);
  return {
    ...p,
    eta: etaMatch ? etaMatch[1].trim() : (p.eta || 'Within 24–48 Hours'),
    admin_notes: notesMatch ? notesMatch[1].trim() : (p.admin_notes || ''),
    media_url: mediaMatch ? mediaMatch[1].trim() : (p.media_url || ''),
  };
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
    const parsedResults = (results || []).map(parseRow);

    return NextResponse.json(
      {
        success: true,
        count: parsedResults.length,
        sort: sort === 'newest' ? 'newest' : 'upvotes',
        problems: parsedResults,
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

export async function PATCH(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => ({}))) || {}) as any;
    const { id, status, eta, admin_notes, media_url } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const env = await getCloudflareEnv(req);
    const existing = await env.DB.prepare('SELECT * FROM problems WHERE id = ?')
      .bind(id)
      .first<any>();

    let updatedDesc = existing?.description || '';
    if (eta !== undefined) {
      updatedDesc = updatedDesc.replace(/\[ETA:\s*[^\]]+\]/gi, '').trim() + (eta ? ` [ETA: ${eta}]` : '');
    }
    if (admin_notes !== undefined) {
      updatedDesc = updatedDesc.replace(/\[AdminNotes:\s*[^\]]+\]/gi, '').trim() + (admin_notes ? ` [AdminNotes: ${admin_notes}]` : '');
    }
    if (media_url !== undefined) {
      updatedDesc = updatedDesc.replace(/\[Media:\s*[^\]]+\]/gi, '').trim() + (media_url ? ` [Media: ${media_url}]` : '');
    }

    await env.DB.prepare('UPDATE problems SET status = ?, description = ? WHERE id = ?')
      .bind(status, updatedDesc, id)
      .run();

    const updated = await env.DB.prepare('SELECT * FROM problems WHERE id = ?')
      .bind(id)
      .first<any>();

    return NextResponse.json({ success: true, problem: parseRow(updated || {}) }, { status: 200 });
  } catch (error: any) {
    console.error('Update problem status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

