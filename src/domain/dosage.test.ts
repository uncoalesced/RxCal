import { describe, expect, it } from 'vitest';
import { describeDosage, formatDosage, formatQuantity, parseDosage } from './dosage';

function quantities(input: string) {
  const result = parseDosage(input);
  if (result.status !== 'ok') throw new Error(`expected ok for "${input}", got ${result.status}`);
  return result.schedule.slots.map((s) => [s.slot, s.quantity]);
}

describe('parseDosage', () => {
  it('parses the 3-slot morning-afternoon-night pattern', () => {
    expect(quantities('1-0-1')).toEqual([
      ['morning', 1],
      ['afternoon', 0],
      ['night', 1],
    ]);
  });

  it('parses the 4-slot pattern with an evening slot', () => {
    expect(quantities('1-0-0-1')).toEqual([
      ['morning', 1],
      ['afternoon', 0],
      ['evening', 0],
      ['night', 1],
    ]);
  });

  it('reports which pattern was used', () => {
    const three = parseDosage('1-1-1');
    const four = parseDosage('0-1-1-0');
    expect(three.status === 'ok' && three.schedule.pattern).toBe('3-slot');
    expect(four.status === 'ok' && four.schedule.pattern).toBe('4-slot');
  });

  it('keeps multi-unit quantities', () => {
    expect(quantities('2-0-1').map(([, q]) => q)).toEqual([2, 0, 1]);
  });

  it.each([
    ['½-0-½', [0.5, 0, 0.5]],
    ['1/2-0-1/2', [0.5, 0, 0.5]],
    ['0.5-0-.5', [0.5, 0, 0.5]],
    ['1½-0-1', [1.5, 0, 1]],
    ['1 1/2-0-1', [1.5, 0, 1]],
    ['1.5-0-1', [1.5, 0, 1]],
  ])('parses half doses in %s', (input, expected) => {
    expect(quantities(input).map(([, q]) => q)).toEqual(expected);
  });

  it.each(['1 - 0 - 1', ' 1-0-1 ', '1–0–1', '1—0—1'])(
    'tolerates spacing and dash variants: %j',
    (input) => {
      expect(quantities(input).map(([, q]) => q)).toEqual([1, 0, 1]);
    },
  );

  it.each(['OD', 'BD', 'b.d.', 'TDS', 'tid', 'QID', 'HS', 'SOS', 'PRN', 'STAT'])(
    'marks text code %s as not supported yet (rather than invalid)',
    (input) => {
      const result = parseDosage(input);
      expect(result.status).toBe('unsupported-format');
      if (result.status === 'unsupported-format') {
        expect(result.message).toMatch(/aren't supported yet/);
        expect(result.message).toMatch(/1-0-1/);
      }
    },
  );

  it.each([
    ['', /Enter a dosage/],
    ['   ', /Enter a dosage/],
    ['1-0', /3 slots/],
    ['1-0-1-0-1', /3 slots/],
    ['1', /3 slots/],
    ['1-x-1', /"x" isn't a dose amount/],
    ['1--1', /"" isn't a dose amount/],
    ['-1-1', /"" isn't a dose amount/],
    ['0-0-0', /At least one slot/],
    ['0-0-0-0', /At least one slot/],
    ['1-0-11', /misread/],
    ['twice daily', /3 slots/],
  ])('rejects %j', (input, message) => {
    const result = parseDosage(input);
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') expect(result.message).toMatch(message);
  });
});

describe('formatting', () => {
  it('formats halves with ½', () => {
    expect(formatQuantity(0.5)).toBe('½');
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(0)).toBe('0');
  });

  it('normalises notation and describes non-zero slots', () => {
    const result = parseDosage('1/2 - 0 - 0 - 2');
    if (result.status !== 'ok') throw new Error('expected ok');
    expect(formatDosage(result.schedule)).toBe('½-0-0-2');
    expect(describeDosage(result.schedule)).toBe('Morning ½ · Night 2');
  });
});
