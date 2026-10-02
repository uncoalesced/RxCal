// Owner: Jammy. UI-facing output shape lives in src/contract/plan.js; ask Joel before changing it.
import { matchDrug } from './match.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const iso = (d, m, y) => {
  if (y < 100) y += 2000;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null; // rejects 31/02 etc.
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

/** First valid day-month-year date in text, as YYYY-MM-DD, or null. */
export function parseDate(text) {
  const numeric = /(?<!\d)(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/g;
  const named = /(?<!\d)(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3})[a-z]*\.?,?[\s-]+(\d{4})(?!\d)/gi;
  const hits = [];
  for (const m of text.matchAll(numeric)) hits.push([m.index, iso(+m[1], +m[2], +m[3])]);
  for (const m of text.matchAll(named)) {
    const mon = MONTHS.indexOf(m[2].toLowerCase()) + 1;
    if (mon) hits.push([m.index, iso(+m[1], mon, +m[3])]);
  }
  return hits.filter((h) => h[1]).sort((a, b) => a[0] - b[0])[0]?.[1] ?? null;
}

// One slot value: 1/2, 1½, ½, 0.5, 1.5, or one digit. Any digit is accepted because OCR often misreads ½ as 4 or 2;
// keeping the row lets the confirm screen show the wrong value instead of silently dropping the medicine.
// Lookarounds keep dates like 2-10-26 out.
const TOKEN = String.raw`(?:1\/2|\d(?:\.5|½)?|½)(?![\d./])`;
const DOSAGE = new RegExp(String.raw`(?<![\d./])${TOKEN}(?:\s*[-–]\s*${TOKEN}){2,3}`);

const tokenValue = (t) => (t === '½' || t === '1/2' ? 0.5 : t.endsWith('½') ? +t[0] + 0.5 : +t);

/** `1-0-1` style slots in a line: { slots, index, length } or null. */
export function parseDosage(line) {
  const m = line.match(DOSAGE);
  if (!m) return null;
  return { slots: m[0].split(/\s*[-–]\s*/).map(tokenValue), index: m.index, length: m[0].length };
}

/** Duration in days (`x 5 days`, `for 1 week`, `5d`, `1 month`), or null. */
export function parseDuration(line) {
  const m = line.match(/(?<![\d.])(\d{1,3})\s*(days?|d|weeks?|wks?|w|months?|mths?)\b/i);
  if (!m) return null;
  const unit = m[2][0].toLowerCase();
  return +m[1] * (unit === 'w' ? 7 : unit === 'm' ? 30 : 1);
}

/** Meal timing note, or ''. */
export function parseMealNote(line) {
  if (/before\s+(food|meals?|breakfast)|\bac\b|empty\s+stomach/i.test(line)) return 'Before food';
  if (/after\s+(food|meals?|breakfast)|\bpc\b/i.test(line)) return 'After food';
  if (/with\s+(food|meals?)/i.test(line)) return 'With food';
  return '';
}

const cleanName = (s) =>
  s.replace(/^\s*\d+[.)]\s*/, '').replace(/^(tab|tablet|cap|capsule|syp|syrup|inj|injection)\b\.?\s*/i, '').replace(/[\s:,-]+$/, '').trim();

/** OCR text to ScanResult. Every line with a dosage pattern becomes one row. */
export function parsePrescription(text, vocab) {
  const rows = [];
  for (const raw of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const dose = parseDosage(raw);
    if (!dose) continue;
    const name = cleanName(raw.slice(0, dose.index));
    const rest = raw.slice(dose.index + dose.length);
    rows.push({
      raw,
      name,
      candidates: matchDrug(name, vocab),
      slots: dose.slots,
      durationDays: parseDuration(rest),
      note: parseMealNote(rest),
    });
  }
  return { date: parseDate(text), rawText: text, rows };
}
