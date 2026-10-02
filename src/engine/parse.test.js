import { describe, expect, test } from 'vitest';
import { parseDate, parseDosage, parseDuration, parseMealNote, parsePrescription } from './parse.js';
import { flattenVocab } from './match.js';
import seed from '../../data/vocab/seed.json';

describe('parseDate', () => {
  test.each([
    ['Date: 02/10/2026', '2026-10-02'],
    ['2-10-26', '2026-10-02'],
    ['02.10.2026', '2026-10-02'],
    ['2 Oct 2026', '2026-10-02'],
    ['2nd October, 2026', '2026-10-02'],
    ['31/02/2026', null],
    ['no date here 1-0-1', null],
  ])('%s', (s, want) => expect(parseDate(s)).toBe(want));
});

describe('parseDosage', () => {
  test.each([
    ['1-0-1', [1, 0, 1]],
    ['1 - 1 - 1 - 1', [1, 1, 1, 1]],
    ['½-0-½', [0.5, 0, 0.5]],
    ['1/2-0-1', [0.5, 0, 1]],
    ['0.5-1-1½', [0.5, 1, 1.5]],
    ['1–0–1', [1, 0, 1]],
    ['4-0-2', [4, 0, 2]], // Tesseract's reading of ½-0-½; kept so the user can fix it
  ])('%s', (s, want) => expect(parseDosage(s).slots).toEqual(want));

  test.each(['2-10-26', '02/10/2026', 'Crocin 500mg', '1-0'])('no match: %s', (s) => expect(parseDosage(s)).toBeNull());
});

describe('parseDuration', () => {
  test.each([
    ['x 5 days', 5],
    ['for 1 week', 7],
    ['5d', 5],
    ['1 month', 30],
    ['x 2 wks', 14],
    ['after food', null],
  ])('%s', (s, want) => expect(parseDuration(s)).toBe(want));
});

test('parseMealNote', () => {
  expect(parseMealNote('after food')).toBe('After food');
  expect(parseMealNote('Before meals')).toBe('Before food');
  expect(parseMealNote('empty stomach')).toBe('Before food');
  expect(parseMealNote('x 5 days')).toBe('');
});

test('parsePrescription end to end', () => {
  const text = 'Dr. A Sharma\nDate: 02/10/2026\n1. Tab. Crocin 500mg 1-0-1 x 5 days after food\nCap. Pan 40 1-0-0 for 1 week before food\nAdvice: rest';
  const r = parsePrescription(text, flattenVocab(seed));
  expect(r.date).toBe('2026-10-02');
  expect(r.rows).toHaveLength(2);
  expect(r.rows[0]).toMatchObject({ name: 'Crocin 500mg', slots: [1, 0, 1], durationDays: 5, note: 'After food' });
  expect(r.rows[0].candidates[0]).toMatchObject({ name: 'Crocin', generic: 'Paracetamol' });
  expect(r.rows[1]).toMatchObject({ name: 'Pan 40', slots: [1, 0, 0], durationDays: 7, note: 'Before food' });
  expect(r.rows[1].candidates[0].generic).toBe('Pantoprazole');
});
