import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

const MODEL_NAME = '@cf/meta/llama-3-8b-instruct';

interface ProblemRecord {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  created_at: string;
}

async function handleSummarize(req: NextRequest) {
  try {
    const env = await getCloudflareEnv(req);

    // Fetch all unresolved problems from D1
    const { results } = await env.DB.prepare(
      `SELECT id, title, description, upvotes, created_at
       FROM problems
       WHERE LOWER(status) = 'unresolved'
       ORDER BY upvotes DESC, created_at DESC`
    ).all<ProblemRecord>();

    const problems = results || [];

    if (problems.length === 0) {
      return NextResponse.json(
        {
          success: true,
          unresolved_count: 0,
          summary: 'There are currently no unresolved campus problems reported. All issues have been resolved.',
          model: MODEL_NAME,
        },
        { status: 200 }
      );
    }

    // Format problems for Workers AI context
    const formattedProblems = problems
      .map(
        (p, index) =>
          `Issue #${index + 1} (Upvotes: ${p.upvotes}):\nTitle: ${p.title}\nDescription: ${p.description}`
      )
      .join('\n\n');

    const systemPrompt = `You are the Lead Campus Grievance Administrator at IIIT Bhubaneswar. You analyze student-reported campus problems and generate concise, professional executive summaries for university leadership.
Generate exactly a 2-paragraph executive summary based on the reported issues:
Paragraph 1: Synthesize the dominant themes, recurring patterns, and high-impact pain points across the reported grievances (such as hostel amenities, academic infrastructure, network connectivity, laboratory facilities, or student welfare).
Paragraph 2: Provide clear, prioritized administrative recommendations and operational next steps for IIIT Bhubaneswar authorities to resolve these issues promptly.`;

    const userPrompt = `Here is the current list of ${problems.length} unresolved campus problem(s):\n\n${formattedProblems}\n\nPlease generate the 2-paragraph executive summary.`;

    if (!env.AI || typeof env.AI.run !== 'function') {
      return NextResponse.json(
        {
          error: 'Workers AI binding "AI" is not available on the execution context.',
        },
        { status: 500 }
      );
    }

    // Invoke Cloudflare Workers AI model @cf/meta/llama-3-8b-instruct (with graceful fallback to llama-3.1-8b)
    let aiOutput: any;
    try {
      aiOutput = await env.AI.run(MODEL_NAME, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
      });
    } catch (err: any) {
      if (String(err?.message || err).toLowerCase().includes('deprecated')) {
        aiOutput = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 600,
          temperature: 0.3,
        });
      } else {
        throw err;
      }
    }

    const summaryText =
      typeof aiOutput === 'string'
        ? aiOutput
        : aiOutput?.response || aiOutput?.result?.response || JSON.stringify(aiOutput);

    return NextResponse.json(
      {
        success: true,
        unresolved_count: problems.length,
        summary: summaryText,
        model: MODEL_NAME,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('AI Summarization error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleSummarize(req);
}

export async function POST(req: NextRequest) {
  return handleSummarize(req);
}
