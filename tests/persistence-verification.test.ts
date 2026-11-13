import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as submitProblemHandler } from '@/app/api/problems/submit/route';
import { GET as getProblemsHandler } from '@/app/api/problems/route';
import { POST as upvoteHandler } from '@/app/api/problems/upvote/route';
import { createMockCloudflareEnv } from './mocks/mock-cloudflare';

describe('Real-time Problem Persistence & Listing Verification', () => {
  let mockEnv: ReturnType<typeof createMockCloudflareEnv>;

  beforeEach(() => {
    mockEnv = createMockCloudflareEnv();
    (globalThis as any).DB = mockEnv.env.DB;
    (globalThis as any).AI = mockEnv.env.AI;
  });

  it('should immediately show a newly created problem in the problems list', async () => {
    // 1. Initial list should be empty or contain only seeded problems
    const req1 = new NextRequest('http://localhost/api/problems?sort=newest', { method: 'GET' });
    const res1 = await getProblemsHandler(req1);
    const data1 = (await res1.json()) as any;
    expect(res1.status).toBe(200);
    expect(data1.problems.length).toBe(0);

    // 2. Submit a brand new grievance
    const submitReq = new NextRequest('http://localhost/api/problems/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'usr_student_01',
        title: 'Corridor B Water Cooler Filter Alarm Triggered',
        description: 'The warning LED is flashing red and water dispensing is halted.',
      }),
    });
    const submitRes = await submitProblemHandler(submitReq);
    const submitData = (await submitRes.json()) as any;
    expect(submitRes.status).toBe(201);
    expect(submitData.success).toBe(true);
    expect(submitData.problem.title).toBe('Corridor B Water Cooler Filter Alarm Triggered');
    const newProblemId = submitData.problem.id;

    // 3. Immediately query the problems list again
    const req2 = new NextRequest('http://localhost/api/problems?sort=newest', { method: 'GET' });
    const res2 = await getProblemsHandler(req2);
    const data2 = (await res2.json()) as any;
    expect(res2.status).toBe(200);
    expect(data2.problems.length).toBe(1);
    expect(data2.problems[0].id).toBe(newProblemId);
    expect(data2.problems[0].title).toBe('Corridor B Water Cooler Filter Alarm Triggered');
    expect(data2.problems[0].upvotes).toBe(0);

    // 4. Upvote the newly submitted problem
    const upvoteReq = new NextRequest('http://localhost/api/problems/upvote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newProblemId, action: 'upvote' }),
    });
    const upvoteRes = await upvoteHandler(upvoteReq);
    expect(upvoteRes.status).toBe(200);
  });
});
