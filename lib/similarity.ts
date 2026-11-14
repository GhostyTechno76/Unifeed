export const SIMILARITY_THRESHOLD = 0.4;
export const MIN_SHARED_TOKENS = 2;
export const MIN_QUERY_TOKENS = 2;
export const DEFAULT_LIMIT = 3;

// English and Hinglish filler words to remove from token sets
const STOPWORDS = new Set<string>([
  // English common stopwords
  'the',
  'and',
  'for',
  'not',
  'with',
  'from',
  'this',
  'that',
  'these',
  'those',
  'are',
  'has',
  'have',
  'had',
  'was',
  'were',
  'been',
  'being',
  'is',
  'in',
  'on',
  'at',
  'to',
  'of',
  'by',
  'an',
  'as',
  'it',
  'its',
  'or',
  'be',
  'do',
  'does',
  'did',
  'done',
  'but',
  'if',
  'can',
  'could',
  'will',
  'would',
  'should',
  'problem',
  'issue',
  'issues',
  'complaint',
  'please',
  'pls',
  'very',
  'too',
  'so',
  // Hinglish / Hindi fillers
  'hai',
  'hain',
  'ho',
  'hoga',
  'hogi',
  'ka',
  'ki',
  'ke',
  'ko',
  'me',
  'mein',
  'se',
  'par',
  'pe',
  'nahi',
  'nahin',
  'na',
  'kaam',
  'karo',
  'kare',
  'karna',
  'karega',
  'raha',
  'rahi',
  'rahe',
  'bhi',
  'aur',
  'bhai',
  'sir',
  'ye',
  'yeh',
  'wo',
  'woh',
  'ek',
  'kuch',
  'kya',
  'bohot',
  'bahut',
  'dikkat',
  'pareshani',
]);

// Synonym normalization dictionary: maps related words to canonical tokens
const SYNONYMS: Record<string, string> = {
  // wi/fi/wifi/internet/network/router/packet -> "wifi"
  wi: 'wifi',
  fi: 'wifi',
  wifi: 'wifi',
  internet: 'wifi',
  network: 'wifi',
  net: 'wifi',
  router: 'wifi',
  packet: 'wifi',
  lan: 'wifi',
  ethernet: 'wifi',
  hotspot: 'wifi',

  // cooler/purifier/filter/ro -> "water"
  cooler: 'water',
  purifier: 'water',
  filter: 'water',
  ro: 'water',
  drinking: 'water',
  water: 'water',

  // mess/canteen/dining -> "food"
  mess: 'food',
  canteen: 'food',
  dining: 'food',
  food: 'food',
  meal: 'food',

  // treadmill/bench/dumbbell -> "gym"
  treadmill: 'gym',
  bench: 'gym',
  dumbbell: 'gym',
  weights: 'gym',
  gym: 'gym',

  // AC & Cooling
  ac: 'ac',
  airconditioner: 'ac',
  chiller: 'ac',
  cooling: 'ac',

  // Hostel & Housing
  hostel: 'hostel',
  geyser: 'hostel',

  // Transit
  bus: 'transit',
  shuttle: 'transit',
  transit: 'transit',
};

/**
 * Crude stemmer stripping trailing 'ing', 'ed', 'es', or 's'
 * Preserves double-s endings (e.g. 'mess', 'loss')
 */
function stemWord(word: string): string {
  if (word.length <= 2) return word;
  if (word.endsWith('ss')) return word;
  return word.replace(/(?:ing|ed|es|s)$/, '');
}

/**
 * Tokenize a text string into canonical, deduplicated tokens.
 */
export function tokens(text: string): Set<string> {
  if (!text) return new Set();

  // Strip all bracketed metadata like [Category: ...], [Location: ...], [ETA: ...], etc.
  const cleanedText = text
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/[^a-z0-9]/g, ' ');

  const rawWords = cleanedText.split(/\s+/).filter(Boolean);
  const result = new Set<string>();

  for (const rawWord of rawWords) {
    if (rawWord.length < 2) continue;
    if (STOPWORDS.has(rawWord)) continue;

    // Apply crude stemmer
    const stemmed = stemWord(rawWord);
    if (STOPWORDS.has(stemmed)) continue;

    // Map through synonyms or use canonical stemmed word
    const canonical = SYNONYMS[stemmed] || SYNONYMS[rawWord] || stemmed;
    if (canonical.length >= 2 && !STOPWORDS.has(canonical)) {
      result.add(canonical);
    }
  }

  return result;
}

/**
 * Calculates overlap coefficient between two token sets.
 * Overlap coefficient = |a ∩ b| / min(|a|, |b|)
 */
export function score(
  a: Set<string>,
  b: Set<string>
): { value: number; shared: number } {
  const minSize = Math.min(a.size, b.size);
  if (minSize === 0) {
    return { value: 0, shared: 0 };
  }

  let shared = 0;
  // Iterate over smaller set for optimal performance
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of smaller) {
    if (larger.has(item)) {
      shared += 1;
    }
  }

  const value = shared / minSize;
  return { value, shared };
}

/**
 * Searches existing problems for similar issues based on token overlap.
 */
export function findSimilar<T extends { title: string; description: string }>(
  query: string,
  existing: T[],
  limit = DEFAULT_LIMIT
): T[] {
  if (!existing || existing.length === 0) return [];

  const qTokens = tokens(query);
  if (qTokens.size < MIN_QUERY_TOKENS) {
    return [];
  }

  interface ScoredMatch {
    item: T;
    value: number;
    shared: number;
  }

  const matches: ScoredMatch[] = [];

  for (const item of existing) {
    const itemTokens = tokens(`${item.title} ${item.description}`);
    const { value, shared } = score(qTokens, itemTokens);

    if (value >= SIMILARITY_THRESHOLD && shared >= MIN_SHARED_TOKENS) {
      matches.push({ item, value, shared });
    }
  }

  // Sort by score descending, breaking ties with shared token count descending
  matches.sort((a, b) => {
    if (b.value !== a.value) {
      return b.value - a.value;
    }
    return b.shared - a.shared;
  });

  return matches.slice(0, limit).map((m) => m.item);
}
