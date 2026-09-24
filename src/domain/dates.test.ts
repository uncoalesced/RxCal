import { describe, expect, it } from 'vitest';
import { addDays, formatDisplayDate, isIsoDate, isTime, todayIso } from './dates';

describe('dates', () => {
  it('validates ISO dates, including impossible days', () => {
    expect(isIsoDate('2026-09-24')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('24-09-2026')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });

  it('validates 24-hour times', () => {
    expect(isTime('08:00')).toBe(true);
    expect(isTime('23:59')).toBe(true);
    expect(isTime('24:00')).toBe(false);
    expect(isTime('8:00')).toBe(false);
    expect(isTime('')).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-09-24', 0)).toBe('2026-09-24');
    expect(addDays('2026-09-24', 7)).toBe('2026-10-01');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('formats display dates without the runtime locale', () => {
    expect(formatDisplayDate('2026-09-04')).toBe('4 Sep 2026');
  });

  it('uses the local calendar date for today', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
