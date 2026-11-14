import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

const MODEL_NAME = '@cf/meta/llama-3.1-8b-instruct';
const FALLBACK_MODEL = '@cf/meta/llama-3.2-3b-instruct';

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
Format your output as clear, prioritized bullet points under two distinct sections:
Key Bottlenecks & Active Issues:
- (Concise bullet points highlighting the most urgent complaints, high-upvote issues, and locations)

Recommended Administrative Actions:
- (Concise bullet points with actionable operational remedies, technical deployments, and timelines)`;

    const userPrompt = `Here is the current list of ${problems.length} unresolved campus problem(s):\n\n${formattedProblems}\n\nPlease generate the summarized bullet points briefing.`;

    if (!env.AI || typeof env.AI.run !== 'function') {
      return NextResponse.json(
        {
          error: 'Workers AI binding "AI" is not available on the execution context.',
        },
        { status: 500 }
      );
    }

    // Invoke Cloudflare Workers AI model with resilient fallback
    let aiOutput: any;
    let usedModel = MODEL_NAME;
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
      console.warn(`Primary model ${MODEL_NAME} failed, trying fallback ${FALLBACK_MODEL}:`, err);
      usedModel = FALLBACK_MODEL;
      try {
        aiOutput = await env.AI.run(FALLBACK_MODEL, {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 600,
          temperature: 0.3,
        });
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr?.message || err?.message || 'Workers AI execution failed');
      }
    }

    const summaryText =
      typeof aiOutput === 'string'
        ? aiOutput
        : aiOutput?.response ||
          aiOutput?.result?.response ||
          aiOutput?.choices?.[0]?.message?.content ||
          aiOutput?.result?.choices?.[0]?.message?.content ||
          JSON.stringify(aiOutput);

    return NextResponse.json(
      {
        success: true,
        unresolved_count: problems.length,
        summary: summaryText,
        model: usedModel,
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
