import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

interface SubmitRequestBody {
  student_id?: string;
  studentId?: string;
  title?: string;
  description?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as SubmitRequestBody;
    const studentId = (body.student_id || body.studentId)?.trim();
    const title = body.title?.trim();
    const description = body.description?.trim();

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    if (!title || title.length < 3) {
      return NextResponse.json(
        { error: 'title is required and must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!description || description.length < 5) {
      return NextResponse.json(
        { error: 'description is required and must be at least 5 characters' },
        { status: 400 }
      );
    }

    const env = await getCloudflareEnv(req);

    // Verify student user exists in D1 database
    const user = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?')
      .bind(studentId)
      .first<{ id: string; role: string }>();

    if (!user) {
      return NextResponse.json(
        { error: 'Student not found in user directory' },
        { status: 404 }
      );
    }

    // Insert new problem into D1
    const problemId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const initialUpvotes = 0;
    const initialStatus = 'unresolved';

    await env.DB.prepare(
      `INSERT INTO problems (id, student_id, title, description, upvotes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        problemId,
        studentId,
        title,
        description,
        initialUpvotes,
        initialStatus,
        createdAt
      )
      .run();

    return NextResponse.json(
      {
        success: true,
        message: 'Problem submitted successfully',
        problem: {
          id: problemId,
          student_id: studentId,
          title,
          description,
          upvotes: initialUpvotes,
          status: initialStatus,
          created_at: createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Problem submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
