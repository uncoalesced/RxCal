// Owner: Jammy. Closed-vocabulary drug matcher; Phase 2 replaces scoring with a classifier.

const norm = (s) => s.toLowerCase().replace(/\d+(\.\d+)?\s*(mg|mcg|g|ml|iu)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const similarity = (a, b) => (a && b ? 1 - levenshtein(a, b) / Math.max(a.length, b.length) : 0);

/** Flattens data/vocab/seed.json into [{ name, generic }]. */
export const flattenVocab = (v) => [
  ...v.brands.map((b) => ({ name: b.brand, generic: b.generic })),
  ...v.generics.map((g) => ({ name: g, generic: g })),
];

/** Top-3 candidates scoring >= threshold; empty means "not recognized, type manually". */
export function matchDrug(query, vocab, threshold = 0.6) {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(' ');
  return vocab
    .map((e) => {
      const n = norm(e.name);
      // Score against the whole query and its leading words, so "crocin advance" still finds "crocin".
      const score = Math.max(...words.map((_, i) => similarity(words.slice(0, i + 1).join(' '), n)));
      return { name: e.name, generic: e.generic, score: Math.round(score * 100) / 100 };
    })
    .filter((c) => c.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
