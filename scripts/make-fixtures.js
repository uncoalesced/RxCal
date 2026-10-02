// Renders synthetic printed prescriptions to fixtures/rx-NN.png plus fixtures/truth.json (ground truth for e2e/eval.spec.js).
// All names and clinics are invented. Run: npm run fixtures  (PW_CHANNEL=msedge to use an installed browser).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const RX = [
  { date: ['02/10/2026', '2026-10-02'], meds: [['Tab. Crocin 500mg', '1-0-1', 'x 5 days', 'after food', 'Crocin', [1, 0, 1], 5, 'After food']] },
  { date: ['14-09-2026', '2026-09-14'], meds: [['Cap. Pan 40', '1-0-0', 'for 1 week', 'before food', 'Pan 40', [1, 0, 0], 7, 'Before food'], ['Tab. Dolo 650', '1-1-1', 'x 3 days', 'after food', 'Dolo 650', [1, 1, 1], 3, 'After food']] },
  { date: ['5 Oct 2026', '2026-10-05'], meds: [['Tab. Azithral 500', '1-0-0', 'x 3 days', '', 'Azithral', [1, 0, 0], 3, '']] },
  { date: ['21/08/26', '2026-08-21'], meds: [['Tab. Montair 10mg', '0-0-1', 'x 1 month', '', 'Montair', [0, 0, 1], 30, ''], ['Tab. Allegra 120', '1-0-0', 'x 10 days', '', 'Allegra', [1, 0, 0], 10, '']] },
  { date: ['01.11.2026', '2026-11-01'], meds: [['Tab. Augmentin 625', '1-0-1', 'x 5 days', 'after food', 'Augmentin', [1, 0, 1], 5, 'After food']] },
  { date: ['12/10/2026', '2026-10-12'], meds: [['Tab. Brufen 400', '½-0-½', 'x 3 days', 'after food', 'Brufen', [0.5, 0, 0.5], 3, 'After food']] },
  { date: ['3rd December 2026', '2026-12-03'], meds: [['Tab. Glycomet 500', '1-0-1', 'x 2 months', 'with food', 'Glycomet', [1, 0, 1], 60, 'With food'], ['Tab. Telma 40', '1-0-0', 'x 2 months', '', 'Telma', [1, 0, 0], 60, '']] },
  { date: ['09/09/2026', '2026-09-09'], meds: [['Syp. Calpol', '1-1-1-1', 'x 3 days', 'after food', 'Calpol', [1, 1, 1, 1], 3, 'After food']] },
  { date: ['30-10-2026', '2026-10-30'], meds: [['Tab. Thyronorm 50mcg', '1-0-0', 'x 30 days', 'empty stomach', 'Thyronorm', [1, 0, 0], 30, 'Before food'], ['Tab. Ecosprin 75', '0-1-0', 'x 30 days', 'after food', 'Ecosprin', [0, 1, 0], 30, 'After food']] },
  { date: ['18/10/2026', '2026-10-18'], meds: [['Tab. Ciplox 500', '1-0-1', 'x 5 days', '', 'Ciplox', [1, 0, 1], 5, ''], ['Tab. Emeset 4mg', '1/2-0-1/2', 'x 2 days', 'before food', 'Emeset', [0.5, 0, 0.5], 2, 'Before food'], ['Tab. Metrogyl 400', '1-1-1', 'x 5 days', 'after food', 'Metrogyl', [1, 1, 1], 5, 'After food']] },
];

const page = (rx, i) => `<!doctype html><html><body style="margin:0;font-family:Arial,sans-serif;color:#111;background:#fff">
<div style="width:800px;padding:40px">
  <div style="border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:20px">
    <div style="font-size:28px;font-weight:bold">Sample Clinic ${i + 1}</div>
    <div style="font-size:16px">Dr. Test Doctor, MBBS · Reg. No. 00000 · Synthetic fixture</div>
  </div>
  <div style="font-size:20px;display:flex;justify-content:space-between"><span>Patient: Test Patient</span><span>Date: ${rx.date[0]}</span></div>
  <div style="font-size:32px;font-weight:bold;margin:24px 0 12px">Rx</div>
  ${rx.meds.map((m, k) => `<div style="font-size:22px;margin:12px 0">${k + 1}. ${m[0]} &nbsp; ${m[1]} &nbsp; ${m[2]} &nbsp; ${m[3]}</div>`).join('')}
  <div style="font-size:18px;margin-top:40px">Advice: plenty of fluids. Review after course.</div>
</div></body></html>`;

mkdirSync('fixtures', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const tab = await browser.newPage({ viewport: { width: 880, height: 700 } });
const truth = [];
for (const [i, rx] of RX.entries()) {
  const file = `rx-${String(i + 1).padStart(2, '0')}.png`;
  await tab.setContent(page(rx, i));
  await tab.screenshot({ path: `fixtures/${file}`, fullPage: true });
  truth.push({ file, date: rx.date[1], meds: rx.meds.map((m) => ({ name: m[4], slots: m[5], durationDays: m[6], note: m[7] })) });
}
await browser.close();
writeFileSync('fixtures/truth.json', JSON.stringify(truth, null, 2) + '\n');
console.log(`wrote ${truth.length} fixtures`);
