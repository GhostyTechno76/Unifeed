import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as summarizeHandler } from '@/app/api/admin/summarize/route';
import { POST as submitProblemHandler } from '@/app/api/problems/submit/route';
import { createMockCloudflareEnv } from './mocks/mock-cloudflare';

describe('Workers AI Summarization Verification Suite', () => {
  it('should return 0 unresolved problems message when database has no unresolved problems', async () => {
    const mockEnv = createMockCloudflareEnv();
    (globalThis as any).DB = mockEnv.env.DB;
    (globalThis as any).AI = mockEnv.env.AI;

    const req = new NextRequest('http://localhost/api/admin/summarize', { method: 'GET' });
    const res = await summarizeHandler(req);
    const data = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.unresolved_count).toBe(0);
    expect(data.summary).toContain('no unresolved campus problems reported');

    delete (globalThis as any).DB;
    delete (globalThis as any).AI;
  });

  it('should format grievances and invoke Workers AI model @cf/meta/llama-3-8b-instruct', async () => {
    const mockEnv = createMockCloudflareEnv();
    (globalThis as any).DB = mockEnv.env.DB;
    (globalThis as any).AI = mockEnv.env.AI;

    // Add 2 unresolved problems
    mockEnv.problems.push(
      {
        id: 'p1',
        student_id: 'usr_student_01',
        title: 'Severe packet drop in Lab 4',
        description: 'Switches keep dropping packets during midterm tests.',
        upvotes: 35,
        status: 'unresolved',
        created_at: new Date().toISOString(),
      },
      {
        id: 'p2',
        student_id: 'usr_student_01',
        title: 'Mess Hall dining table cleanliness',
        description: 'Sanitizer dispensers are empty and tables are not wiped.',
        upvotes: 12,
        status: 'unresolved',
        created_at: new Date().toISOString(),
      }
    );

    const req = new NextRequest('http://localhost/api/admin/summarize', { method: 'GET' });
    const res = await summarizeHandler(req);
    const data = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.unresolved_count).toBe(2);
    expect(data.model).toBe('@cf/meta/llama-3-8b-instruct');
    expect(mockEnv.aiCalls.length).toBe(1);
    expect(mockEnv.aiCalls[0].model).toBe('@cf/meta/llama-3-8b-instruct');

    // Verify system prompt and user prompt were constructed properly
    const messages = mockEnv.aiCalls[0].input.messages;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Lead Campus Grievance Administrator at IIIT Bhubaneswar');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('Severe packet drop in Lab 4');
    expect(messages[1].content).toContain('Mess Hall dining table cleanliness');

    delete (globalThis as any).DB;
    delete (globalThis as any).AI;
  });

  it('should dynamically update when new problems are added and upvoted', async () => {
    const mockEnv = createMockCloudflareEnv();
    (globalThis as any).DB = mockEnv.env.DB;
    (globalThis as any).AI = mockEnv.env.AI;

    // Add problem A
    mockEnv.problems.push({
      id: 'p_ac',
      student_id: 'usr_student_01',
      title: 'Library 3rd Floor AC breakdown during heatwave',
      description: 'Chillers are offline and room temperature exceeds 38C.',
      upvotes: 80,
      status: 'unresolved',
      created_at: new Date().toISOString(),
    });

    const req = new NextRequest('http://localhost/api/admin/summarize', { method: 'GET' });
    const res = await summarizeHandler(req);
    const data = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(data.unresolved_count).toBe(1);

    const userPrompt = mockEnv.aiCalls[0].input.messages[1].content;
    expect(userPrompt).toContain('Library 3rd Floor AC breakdown during heatwave');
    expect(userPrompt).toContain('Upvotes: 80');

    delete (globalThis as any).DB;
    delete (globalThis as any).AI;
  });
});
