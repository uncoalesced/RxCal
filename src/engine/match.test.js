import { expect, test } from 'vitest';
import { flattenVocab, matchDrug } from './match.js';
import seed from '../../data/vocab/seed.json';

const vocab = flattenVocab(seed);

test('exact, OCR typo and extra words match', () => {
  expect(matchDrug('Crocin', vocab)[0].name).toBe('Crocin');
  expect(matchDrug('Cr0cin 500mg', vocab)[0].name).toBe('Crocin');
  expect(matchDrug('Augmentin 625 Duo', vocab)[0].generic).toBe('Amoxicillin + Clavulanic acid');
});

test('abstains on unknown and caps at 3', () => {
  expect(matchDrug('Xylophonex', vocab)).toEqual([]);
  expect(matchDrug('', vocab)).toEqual([]);
  expect(matchDrug('Amlo', vocab).length).toBeLessThanOrEqual(3);
});
