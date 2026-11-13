import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => ({}))) || {}) as any;
    const id = body.id;
    const action = body.action === 'downvote' ? -1 : 1;

    if (!id) {
      return NextResponse.json({ error: 'Problem id is required' }, { status: 400 });
    }

    const env = await getCloudflareEnv(req);

    if (action > 0) {
      await env.DB.prepare('UPDATE problems SET upvotes = upvotes + 1 WHERE id = ?')
        .bind(id)
        .run();
    } else {
      await env.DB.prepare('UPDATE problems SET upvotes = MAX(0, upvotes - 1) WHERE id = ?')
        .bind(id)
        .run();
    }

    const updated = await env.DB.prepare('SELECT * FROM problems WHERE id = ?')
      .bind(id)
      .first();

    return NextResponse.json({ success: true, problem: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Upvote error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
