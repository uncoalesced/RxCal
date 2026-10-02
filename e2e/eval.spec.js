// Owner: Jammy. Phase 1 baseline: OCR + parse over fixtures/ vs fixtures/truth.json, per-field exact match.
// Prints a table; asserts only that the pipeline ran. Regenerate fixtures with `npm run fixtures`.
import { test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const truth = JSON.parse(readFileSync('fixtures/truth.json', 'utf8'));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

test('baseline on synthetic printed prescriptions', async ({ page }) => {
  await page.goto('/');
  const tally = { date: 0, rows: 0, top1: 0, top3: 0, slots: 0, duration: 0, note: 0, meds: 0 };
  const times = [];

  for (const t of truth) {
    const b64 = readFileSync(`fixtures/${t.file}`).toString('base64');
    const { result, ms } = await page.evaluate(async (b64) => {
      const [{ recognize }, { parsePrescription }, { flattenVocab }, seed] = await Promise.all([
        import('/src/engine/ocr.js'),
        import('/src/engine/parse.js'),
        import('/src/engine/match.js'),
        fetch('/data/vocab/seed.json').then((r) => r.json()),
      ]);
      const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
      const t0 = performance.now();
      const text = await recognize(blob);
      return { result: parsePrescription(text, flattenVocab(seed)), ms: performance.now() - t0 };
    }, b64);

    times.push(ms);
    tally.date += result.date === t.date;
    tally.rows += result.rows.length === t.meds.length;
    if (result.rows.length !== t.meds.length) console.log(`${t.file}: expected ${t.meds.length} rows, got ${result.rows.length}\n${result.rawText}`);
    t.meds.forEach((m, i) => {
      const r = result.rows[i];
      tally.meds++;
      if (!r) return;
      tally.top1 += r.candidates[0]?.name === m.name;
      tally.top3 += r.candidates.some((c) => c.name === m.name);
      tally.slots += same(r.slots, m.slots);
      tally.duration += r.durationDays === m.durationDays;
      tally.note += r.note === m.note;
    });
  }

  const n = truth.length;
  const pct = (x, d) => `${x}/${d} (${Math.round((100 * x) / d)}%)`;
  times.sort((a, b) => a - b);
  console.table({
    'date exact': pct(tally.date, n),
    'row count exact': pct(tally.rows, n),
    'drug top-1': pct(tally.top1, tally.meds),
    'drug top-3': pct(tally.top3, tally.meds),
    'dosage slots': pct(tally.slots, tally.meds),
    'duration days': pct(tally.duration, tally.meds),
    'meal note': pct(tally.note, tally.meds),
    'OCR ms p50': Math.round(times[Math.floor(n / 2)]),
    'OCR ms max (first run includes model load)': Math.round(times[n - 1]),
  });
});
