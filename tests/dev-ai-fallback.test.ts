import { describe, it, expect } from 'vitest';
import { getDevFallback } from '@/lib/cloudflare';

describe('Dev fallback AI summarization verification', () => {
  it('should parse problem titles and generate dynamic 2-paragraph briefing', async () => {
    const env = getDevFallback();

    const sampleInput = {
      messages: [
        { role: 'system', content: 'You are the Lead Campus Grievance Administrator...' },
        {
          role: 'user',
          content: `Here is the current list of 3 unresolved campus problem(s):

Issue #1 (Upvotes: 42):
Title: Defective Fire Extinguishers in Chemical Engineering Wing
Description: Pressure gauges are at zero on floors 1, 2, and 3.

Issue #2 (Upvotes: 28):
Title: Cafeteria Food Storage Freezers Tripping Circuit
Description: Perishables are spoiling due to faulty wiring.

Issue #3 (Upvotes: 15):
Title: Auditorium AV System Microphone Static
Description: High pitched screeching during guest lectures.

Please generate the 2-paragraph executive summary.`,
        },
      ],
    };

    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', sampleInput);

    expect(result.response).toContain('Defective Fire Extinguishers in Chemical Engineering Wing');
    expect(result.response).toContain('Cafeteria Food Storage Freezers Tripping Circuit');
    expect(result.response).toContain('Auditorium AV System Microphone Static');
    expect(result.response).toContain('Key Bottlenecks & Active Issues:');
    expect(result.response).toContain('Recommended Administrative Actions:');
  });
});
