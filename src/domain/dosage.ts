import { SLOT_LABELS, SLOT_PATTERNS, type DoseSchedule, type SlotPattern } from './types';

export type DosageParseResult =
  | { status: 'ok'; schedule: DoseSchedule }
  /** A recognised notation that RxCal does not support yet (e.g. `BD`). */
  | { status: 'unsupported-format'; code: string; message: string }
  | { status: 'invalid'; message: string };

const MAX_QUANTITY = 10;

/**
 * Text dosage codes common on Indian prescriptions. They are recognised so the
 * user gets a clear "not supported yet" hint; support is planned post-launch.
 */
const KNOWN_TEXT_CODES = new Set([
  'OD',
  'QD',
  'BD',
  'BID',
  'TDS',
  'TID',
  'QID',
  'QDS',
  'HS',
  'SOS',
  'PRN',
  'STAT',
  'OW',
]);

const PATTERN_BY_LENGTH: Record<number, SlotPattern> = { 3: '3-slot', 4: '4-slot' };

/**
 * Parse a numeric slot dosage such as `1-0-1` (morning-afternoon-night) or
 * `1-0-0-1` (morning-afternoon-evening-night). Quantities may be whole numbers
 * or halves (`½`, `1/2`, `0.5`, `1½`).
 */
export function parseDosage(input: string): DosageParseResult {
  const text = input.trim();
  if (text === '') {
    return { status: 'invalid', message: 'Enter a dosage such as 1-0-1 or 1-0-0-1.' };
  }

  const code = text.replace(/\./g, '').replace(/\s+/g, '').toUpperCase();
  if (KNOWN_TEXT_CODES.has(code)) {
    return {
      status: 'unsupported-format',
      code,
      message: `Dosage codes like "${code}" aren't supported yet — enter the dose as 1-0-1 or 1-0-0-1.`,
    };
  }

  const tokens = text.split(/\s*[-–—]\s*/);
  const pattern = PATTERN_BY_LENGTH[tokens.length];
  if (!pattern) {
    return {
      status: 'invalid',
      message: 'Use 3 slots (morning-afternoon-night, e.g. 1-0-1) or 4 slots (e.g. 1-0-0-1).',
    };
  }

  const quantities = tokens.map(parseQuantity);
  const badIndex = quantities.findIndex((q) => q === null);
  if (badIndex !== -1) {
    return {
      status: 'invalid',
      message: `"${tokens[badIndex]}" isn't a dose amount. Use numbers like 0, 1, 2 or ½.`,
    };
  }

  const slots = SLOT_PATTERNS[pattern].map((slot, i) => ({ slot, quantity: quantities[i] ?? 0 }));
  if (slots.every((s) => s.quantity === 0)) {
    return { status: 'invalid', message: 'At least one slot needs a dose above 0.' };
  }
  if (slots.some((s) => s.quantity > MAX_QUANTITY)) {
    return {
      status: 'invalid',
      message: `A single dose above ${MAX_QUANTITY} looks like a misread — please check it.`,
    };
  }

  return { status: 'ok', schedule: { pattern, slots } };
}

function parseQuantity(token: string): number | null {
  const t = token.trim();
  if (/^\d+$/.test(t)) return Number(t);
  if (t === '½' || t === '1/2' || /^0?\.5$/.test(t)) return 0.5;
  const mixed = /^(\d+)\s*(?:½|1\/2)$/.exec(t);
  if (mixed) return Number(mixed[1]) + 0.5;
  if (/^\d+\.5$/.test(t)) return Number(t);
  return null;
}

/** `0.5` → `½`, `1.5` → `1½`, `2` → `2`. */
export function formatQuantity(quantity: number): string {
  const whole = Math.floor(quantity);
  const half = quantity - whole === 0.5;
  if (!half) return String(quantity);
  return whole === 0 ? '½' : `${whole}½`;
}

/** Canonical notation for a schedule, e.g. `1-0-½`. */
export function formatDosage(schedule: DoseSchedule): string {
  return schedule.slots.map((s) => formatQuantity(s.quantity)).join('-');
}

/** Human-readable summary, e.g. `Morning 1 · Night 1`. */
export function describeDosage(schedule: DoseSchedule): string {
  return schedule.slots
    .filter((s) => s.quantity > 0)
    .map((s) => `${SLOT_LABELS[s.slot]} ${formatQuantity(s.quantity)}`)
    .join(' · ');
}
