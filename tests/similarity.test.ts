import { describe, it, expect } from 'vitest';
import {
  tokens,
  score,
  findSimilar,
  SIMILARITY_THRESHOLD,
  MIN_SHARED_TOKENS,
  MIN_QUERY_TOKENS,
} from '@/lib/similarity';

describe('Similarity Engine (lib/similarity.ts)', () => {
  const seededWifiProblem = {
    id: 'prob_live_01',
    title: 'High packet loss on Academic Block Wi-Fi',
    description:
      'Students in Labs 3 and 4 experience over 40% packet loss during online coding contests.',
  };

  it('matches "wifi not working in lab" with Academic Block Wi-Fi problem via synonyms and stemming', () => {
    const query = 'wifi not working in lab';
    const matches = findSimilar(query, [seededWifiProblem]);

    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('prob_live_01');
    expect(matches[0].title).toBe('High packet loss on Academic Block Wi-Fi');
  });

  it('does NOT match "Mess food is stale" with the Wi-Fi problem', () => {
    const query = 'Mess food is stale';
    const matches = findSimilar(query, [seededWifiProblem]);

    expect(matches).toEqual([]);
  });

  it('strips [Category: ...] and bracket metadata before matching', () => {
    const problemWithPrefix = {
      id: 'prob_prefix_01',
      title: 'Water cooler leaking',
      description:
        '[Category: MESS] [Location: Ground Floor] Filter tap is dripping constantly.',
    };

    const query = 'Water cooler tap dripping';
    const matches = findSimilar(query, [problemWithPrefix]);

    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('prob_prefix_01');

    // Verify token set does not include raw bracket junk
    const tokenSet = tokens(problemWithPrefix.description);
    expect(tokenSet.has('category')).toBe(false);
    expect(tokenSet.has('location')).toBe(false);
  });

  it('returns an empty array for queries with fewer than 2 meaningful tokens', () => {
    expect(findSimilar('wifi', [seededWifiProblem])).toEqual([]);
    expect(findSimilar('the and for', [seededWifiProblem])).toEqual([]);
    expect(findSimilar('', [seededWifiProblem])).toEqual([]);
  });

  it('respects the limit argument and sorts by score descending', () => {
    const candidates = [
      {
        id: 'p1',
        title: 'Gym dumbbell set missing in arena',
        description: 'Several dumbbell weights are missing from the rack.',
      },
      {
        id: 'p2',
        title: 'Gym equipment missing in training room',
        description: 'Workout accessories and plates missing from gym.',
      },
      {
        id: 'p3',
        title: 'Library reading room air conditioner faulty',
        description: 'AC is blowing warm air.',
      },
    ];

    const query = 'Gym dumbbell equipment missing';
    const matches = findSimilar(query, candidates, 2);

    expect(matches.length).toBe(2);
    // p2 has 3 shared tokens (value = 1.0), p1 has 2 shared tokens (value = 0.67)
    expect(matches[0].id).toBe('p2');
    expect(matches[1].id).toBe('p1');
  });

  it('handles empty existing array gracefully', () => {
    expect(findSimilar('wifi not working', [])).toEqual([]);
  });

  it('exports tuned threshold constants', () => {
    expect(SIMILARITY_THRESHOLD).toBe(0.4);
    expect(MIN_SHARED_TOKENS).toBe(2);
    expect(MIN_QUERY_TOKENS).toBe(2);
  });
});
