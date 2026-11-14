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
  eta?: string | null;
  admin_notes?: string | null;
  media_url?: string | null;
}

function parseRow(p: any) {
  const desc = p.description || '';
  const etaMatch = desc.match(/\[ETA:\s*([^\]]+)\]/i);
  const notesMatch = desc.match(/\[AdminNotes:\s*([^\]]+)\]/i);
  const mediaMatch = desc.match(/\[Media:\s*([^\]]+)\]/i);

  const eta = p.eta || (etaMatch ? etaMatch[1].trim() : 'Within 24–48 Hours');
  const admin_notes = p.admin_notes || (notesMatch ? notesMatch[1].trim() : '');
  const media_url = p.media_url || (mediaMatch ? mediaMatch[1].trim() : '');

  // Strip all bracket tags from description so that neither media base64 strings nor metadata clutter human text
  const cleanedDesc = desc
    .replace(/\[Media:\s*[^\]]+\]/gi, '')
    .replace(/\[ETA:\s*[^\]]+\]/gi, '')
    .replace(/\[AdminNotes:\s*[^\]]+\]/gi, '')
    .replace(/\[Category:\s*[^\]]+\]/gi, '')
    .replace(/\[Location:\s*[^\]]+\]/gi, '')
    .trim();

  return {
    ...p,
    description: cleanedDesc,
    eta,
    admin_notes,
    media_url,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort')?.toLowerCase() || 'upvotes';
    const statusFilter = searchParams.get('status')?.toLowerCase();

    const env = await getCloudflareEnv(req);

    // Build query based on sorting and optional status filter
    let queryWithExtra = `
      SELECT 
        p.id, 
        p.student_id, 
        u.email as student_email,
        p.title, 
        p.description, 
        p.upvotes, 
        p.status, 
        p.created_at,
        p.eta,
        p.admin_notes,
        p.media_url
      FROM problems p
      LEFT JOIN users u ON p.student_id = u.id
    `;

    let baseQuery = `
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

    let filterClause = '';
    const params: string[] = [];

    if (statusFilter) {
      if (statusFilter === 'unresolved') {
        filterClause = ` WHERE LOWER(p.status) NOT IN ('resolved', 'completed')`;
      } else if (statusFilter === 'resolved') {
        filterClause = ` WHERE LOWER(p.status) IN ('resolved', 'completed')`;
      } else {
        filterClause = ` WHERE LOWER(p.status) = ?`;
        params.push(statusFilter);
      }
    }

    const orderClause = sort === 'newest' ? ` ORDER BY p.created_at DESC` : ` ORDER BY p.upvotes DESC, p.created_at DESC`;

    let results: ProblemRow[] | undefined;
    try {
      const stmt = env.DB.prepare(queryWithExtra + filterClause + orderClause);
      const res = await (params.length > 0 ? stmt.bind(...params) : stmt).all<ProblemRow>();
      results = res.results;
    } catch {
      // Fallback for mock environments lacking eta/admin_notes/media_url columns
      const stmt = env.DB.prepare(baseQuery + filterClause + orderClause);
      const res = await (params.length > 0 ? stmt.bind(...params) : stmt).all<ProblemRow>();
      results = res.results;
    }

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

    const cleanedDesc = (existing?.description || '')
      .replace(/\[ETA:\s*[^\]]+\]/gi, '')
      .replace(/\[AdminNotes:\s*[^\]]+\]/gi, '')
      .replace(/\[Media:\s*[^\]]+\]/gi, '')
      .trim();

    const newEta = eta !== undefined ? eta : (existing?.eta || null);
    const newNotes = admin_notes !== undefined ? admin_notes : (existing?.admin_notes || null);
    const newMedia = media_url !== undefined ? media_url : (existing?.media_url || null);

    try {
      await env.DB.prepare(
        'UPDATE problems SET status = ?, description = ?, eta = ?, admin_notes = ?, media_url = ? WHERE id = ?'
      )
        .bind(status, cleanedDesc, newEta, newNotes, newMedia, id)
        .run();
    } catch {
      // Fallback for environments without dedicated columns
      let fallbackDesc = cleanedDesc;
      if (newEta) fallbackDesc += ` [ETA: ${newEta}]`;
      if (newNotes) fallbackDesc += ` [AdminNotes: ${newNotes}]`;
      if (newMedia) fallbackDesc += ` [Media: ${newMedia}]`;

      await env.DB.prepare('UPDATE problems SET status = ?, description = ? WHERE id = ?')
        .bind(status, fallbackDesc, id)
        .run();
    }

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

