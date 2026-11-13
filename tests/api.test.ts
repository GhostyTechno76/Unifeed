import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as submitProblemHandler } from '@/app/api/problems/submit/route';
import { GET as getProblemsHandler } from '@/app/api/admin/problems/route';
import { GET as summarizeGetHandler, POST as summarizePostHandler } from '@/app/api/admin/summarize/route';
import { createMockCloudflareEnv } from './mocks/mock-cloudflare';
import { parseSessionToken } from '@/lib/auth';

describe('College Grievance API Suite (Next.js Edge + Cloudflare D1 + Workers AI)', () => {
  let mockEnv: ReturnType<typeof createMockCloudflareEnv>;

  beforeEach(() => {
    mockEnv = createMockCloudflareEnv();
    (globalThis as any).DB = mockEnv.env.DB;
    (globalThis as any).AI = mockEnv.env.AI;
  });

  afterEach(() => {
    delete (globalThis as any).DB;
    delete (globalThis as any).AI;
  });

  describe('Task 2.1: Authentication (/api/auth/login)', () => {
    it('should successfully authenticate an existing student and return token and role', async () => {
      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@iiit-bh.ac.in' }),
      });

      const res = await loginHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.role).toBe('student');
      expect(typeof data.token).toBe('string');
      expect(data.user.email).toBe('student@iiit-bh.ac.in');

      // Verify token payload
      const payload = parseSessionToken(data.token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('usr_student_01');
      expect(payload?.role).toBe('student');
    });

    it('should successfully authenticate an admin user and return admin role', async () => {
      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@iiit-bh.ac.in' }),
      });

      const res = await loginHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.role).toBe('admin');
      expect(data.user.id).toBe('usr_admin_01');
    });

    it('should return 404 for an unregistered email address', async () => {
      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'unknown@iiit-bh.ac.in' }),
      });

      const res = await loginHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 400 when email is missing or empty', async () => {
      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await loginHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email is required');
    });

    it('should return 400 when email format is invalid', async () => {
      const req = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });

      const res = await loginHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });
  });

  describe('Task 2.2: Student Problem Submission (/api/problems/submit)', () => {
    it('should allow a registered student to submit a problem', async () => {
      const req = new NextRequest('http://localhost/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'usr_student_01',
          title: 'Wi-Fi disconnects in Hostel 3 2nd floor',
          description: 'The access point in Corridor B drops connections every 10 minutes during evening study hours.',
        }),
      });

      const res = await submitProblemHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.problem).toBeDefined();
      expect(data.problem.title).toBe('Wi-Fi disconnects in Hostel 3 2nd floor');
      expect(data.problem.status).toBe('unresolved');
      expect(data.problem.upvotes).toBe(0);
      expect(data.problem.student_id).toBe('usr_student_01');

      // Check D1 mock storage
      expect(mockEnv.problems.length).toBe(1);
      expect(mockEnv.problems[0].title).toBe('Wi-Fi disconnects in Hostel 3 2nd floor');
    });

    it('should return 400 if student_id is omitted', async () => {
      const req = new NextRequest('http://localhost/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Hostel Water Leak',
          description: 'The pipe on the 1st floor is leaking water.',
        }),
      });

      const res = await submitProblemHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(400);
      expect(data.error).toBe('student_id is required');
    });

    it('should return 400 if title is too short', async () => {
      const req = new NextRequest('http://localhost/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'usr_student_01',
          title: 'Hi',
          description: 'A valid description of the issue on campus.',
        }),
      });

      const res = await submitProblemHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(400);
      expect(data.error).toContain('at least 3 characters');
    });

    it('should return 404 if the student is not in the D1 users table', async () => {
      const req = new NextRequest('http://localhost/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'non_existent_student_id',
          title: 'Cafeteria hygiene concern',
          description: 'Water filtration system in the dining hall needs immediate cartridge replacement.',
        }),
      });

      const res = await submitProblemHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(404);
      expect(data.error).toBe('Student not found in user directory');
    });
  });

  describe('Task 2.3: Admin Problem View (/api/admin/problems)', () => {
    beforeEach(() => {
      // Populate mock problems with different upvotes and creation timestamps
      mockEnv.problems.push(
        {
          id: 'prob_01',
          student_id: 'usr_student_01',
          title: 'Low water pressure in Block A',
          description: 'Showers on 3rd floor have virtually no water pressure.',
          upvotes: 5,
          status: 'unresolved',
          created_at: '2026-11-10T10:00:00.000Z',
        },
        {
          id: 'prob_02',
          student_id: 'usr_student_01',
          title: 'Projector malfunction in LT-1',
          description: 'HDMI port is loose and flickers during computer science lectures.',
          upvotes: 24,
          status: 'unresolved',
          created_at: '2026-11-11T08:00:00.000Z',
        },
        {
          id: 'prob_03',
          student_id: 'usr_student_01',
          title: 'Old lab equipment in VLSI lab',
          description: 'Oscilloscope probes are broken.',
          upvotes: 12,
          status: 'resolved',
          created_at: '2026-11-09T14:00:00.000Z',
        }
      );
    });

    it('should fetch all problems ordered by most upvotes by default', async () => {
      const req = new NextRequest('http://localhost/api/admin/problems');
      const res = await getProblemsHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
      expect(data.sort).toBe('upvotes');
      expect(data.problems[0].id).toBe('prob_02'); // 24 upvotes
      expect(data.problems[1].id).toBe('prob_03'); // 12 upvotes
      expect(data.problems[2].id).toBe('prob_01'); // 5 upvotes
    });

    it('should fetch all problems ordered by newest when requested', async () => {
      const req = new NextRequest('http://localhost/api/admin/problems?sort=newest');
      const res = await getProblemsHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.sort).toBe('newest');
      expect(data.problems[0].id).toBe('prob_02'); // Nov 11
      expect(data.problems[1].id).toBe('prob_01'); // Nov 10
      expect(data.problems[2].id).toBe('prob_03'); // Nov 09
    });

    it('should filter problems by status when status parameter is passed', async () => {
      const req = new NextRequest('http://localhost/api/admin/problems?status=unresolved');
      const res = await getProblemsHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.count).toBe(2);
      expect(data.problems.every((p: any) => p.status === 'unresolved')).toBe(true);
    });
  });

  describe('Task 2.4: Cloudflare Workers AI Executive Summary (/api/admin/summarize)', () => {
    it('should return a 2-paragraph executive summary using @cf/meta/llama-3-8b-instruct', async () => {
      mockEnv.problems.push(
        {
          id: 'prob_101',
          student_id: 'usr_student_01',
          title: 'Library AC malfunctioning in 40C heat',
          description: 'The reading hall AC units have stopped working, causing extreme discomfort during exams.',
          upvotes: 42,
          status: 'unresolved',
          created_at: '2026-11-11T12:00:00.000Z',
        },
        {
          id: 'prob_102',
          student_id: 'usr_student_01',
          title: 'Central Mess drinking water cooler offline',
          description: 'The main UV cooler in the boys mess has been leaking and powered down for two days.',
          upvotes: 35,
          status: 'unresolved',
          created_at: '2026-11-11T13:00:00.000Z',
        }
      );

      const req = new NextRequest('http://localhost/api/admin/summarize', {
        method: 'POST',
      });

      const res = await summarizePostHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.unresolved_count).toBe(2);
      expect(data.model).toBe('@cf/meta/llama-3-8b-instruct');
      expect(typeof data.summary).toBe('string');
      expect(data.summary.length).toBeGreaterThan(50);

      // Verify Workers AI call
      expect(mockEnv.aiCalls.length).toBe(1);
      expect(mockEnv.aiCalls[0].model).toBe('@cf/meta/llama-3-8b-instruct');
      expect(mockEnv.aiCalls[0].input.messages[1].content).toContain('Library AC malfunctioning');
      expect(mockEnv.aiCalls[0].input.messages[1].content).toContain('Central Mess drinking water cooler');
    });

    it('should handle GET requests as well for convenient administrative dashboard polling', async () => {
      mockEnv.problems.push({
        id: 'prob_103',
        student_id: 'usr_student_01',
        title: 'Streetlight failure near girls hostel',
        description: 'Pathway lights are dark after 7 PM.',
        upvotes: 18,
        status: 'unresolved',
        created_at: '2026-11-11T14:00:00.000Z',
      });

      const req = new NextRequest('http://localhost/api/admin/summarize', {
        method: 'GET',
      });

      const res = await summarizeGetHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.unresolved_count).toBe(1);
    });

    it('should handle zero unresolved problems gracefully without making unnecessary AI calls', async () => {
      // No unresolved problems
      const req = new NextRequest('http://localhost/api/admin/summarize', {
        method: 'GET',
      });

      const res = await summarizeGetHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.unresolved_count).toBe(0);
      expect(mockEnv.aiCalls.length).toBe(0);
    });

    it('should return 500 if AI binding is absent', async () => {
      delete (globalThis as any).AI;
      mockEnv.problems.push({
        id: 'prob_104',
        student_id: 'usr_student_01',
        title: 'Lab switch blown',
        description: 'Switch tripped in Hardware Lab.',
        upvotes: 3,
        status: 'unresolved',
        created_at: '2026-11-11T14:00:00.000Z',
      });

      const req = new NextRequest('http://localhost/api/admin/summarize', {
        method: 'GET',
      });

      const res = await summarizeGetHandler(req);
      const data = (await res.json()) as any;

      expect(res.status).toBe(500);
      expect(data.error).toContain('Workers AI binding "AI" is not available');
    });
  });
});
