import { expect, test } from 'vitest';
import { buildICS } from './ics.js';
import { buildText } from './text.js';

const plan = {
  startDate: '2026-10-02',
  meds: [
    { name: 'Crocin 500mg', slots: [1, 0, 0.5], durationDays: 5, note: 'After food' },
    { name: 'Pan, 40; very long name that will surely need folding past seventy five octets', slots: [1, 0, 0, 0], durationDays: 7, note: '' },
  ],
};
let n = 0;
const ics = buildICS(plan, { now: new Date('2026-10-02T10:00:00Z'), uid: () => `id${n++}` });

test('ics has required RFC 5545 properties', () => {
  expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:')).toBe(true);
  expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3); // one per active slot
  expect(ics.match(/UID:/g)).toHaveLength(3);
  expect(ics.match(/DTSTAMP:20261002T100000Z/g)).toHaveLength(3);
  expect(ics).toContain('DTSTART:20261002T080000\r\n');
  expect(ics).toContain('DTSTART:20261002T200000\r\n');
  expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=5');
  expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=7');
  expect(ics).toContain('Dose: ½ (night). After food.');
  expect(ics).toContain('SUMMARY:Take Pan\\, 40\\; very');
});

test('ics lines fold at 75 octets and use CRLF only', () => {
  const lines = ics.split('\r\n');
  for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  expect(lines.some((l) => l.startsWith(' '))).toBe(true);
  expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
});

test('text note', () => {
  const t = buildText(plan);
  expect(t).toContain('Start: 2026-10-02');
  expect(t).toContain('- Crocin 500mg: 1-0-½ for 5 days. After food');
});
