// Engineered by uncoalesced
import { formatDisplayDate } from '../domain/dates';
import { describeDosage, formatDosage, formatQuantity } from '../domain/dosage';
import {
  FOOD_TIMING_LABELS,
  type ExportOptions,
  type ValidatedMedication,
  type ValidatedPrescription,
} from '../domain/types';

const CRLF = '\r\n';
const MAX_LINE_OCTETS = 75;
const EVENT_DURATION = 'PT15M';
const ALARM_TRIGGER = '-PT10M';

export interface IcsOptions extends ExportOptions {
  /** Timestamp written to DTSTAMP; injectable for deterministic tests. */
  now?: Date;
}

/**
 * Build an RFC 5545 calendar with one recurring event per medication per dose
 * slot. Times are "floating" local times so an 08:00 dose stays at 08:00 on the
 * user's own clock, wherever they are.
 */
export function generateICS(prescription: ValidatedPrescription, options: IcsOptions): string {
  const stamp = toUtcStamp(options.now ?? new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RxCal//Prescription Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...prescription.medications.flatMap((med) =>
      medicationEvents(med, prescription, options, stamp),
    ),
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

function medicationEvents(
  med: ValidatedMedication,
  prescription: ValidatedPrescription,
  options: IcsOptions,
  stamp: string,
): string[] {
  const description = [
    `Dosage: ${formatDosage(med.schedule)} (${describeDosage(med.schedule)})`,
    med.foodTiming !== 'unspecified' ? `Take: ${FOOD_TIMING_LABELS[med.foodTiming]}` : null,
    med.notes.trim() ? `Notes: ${med.notes.trim()}` : null,
    `Duration: ${med.durationDays} day${med.durationDays === 1 ? '' : 's'}`,
    `Prescribed: ${formatDisplayDate(prescription.date)}`,
    'Created with RxCal. Always check against your original prescription.',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return med.schedule.slots
    .filter((s) => s.quantity > 0)
    .flatMap(({ slot, quantity }) => {
      const summary = `Take ${med.name} (${formatQuantity(quantity)})`;
      return [
        'BEGIN:VEVENT',
        `UID:${med.id}-${slot}@rxcal`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${toFloatingDateTime(options.startDate, options.reminderTimes[slot])}`,
        `DURATION:${EVENT_DURATION}`,
        `RRULE:FREQ=DAILY;COUNT=${med.durationDays}`,
        `SUMMARY:${escapeText(summary)}`,
        `DESCRIPTION:${escapeText(description)}`,
        'CATEGORIES:Medication',
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `TRIGGER:${ALARM_TRIGGER}`,
        `DESCRIPTION:${escapeText(summary)}`,
        'END:VALARM',
        'END:VEVENT',
      ];
    });
}

/** `2026-09-24` + `08:00` → `20260924T080000` (no zone: floating local time). */
function toFloatingDateTime(isoDate: string, time: string): string {
  return `${isoDate.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Escape a TEXT value per RFC 5545 §3.3.11. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Fold a content line to at most 75 octets per physical line (RFC 5545 §3.1),
 * never splitting a multi-byte UTF-8 character.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= MAX_LINE_OCTETS) return line;

  const parts: string[] = [];
  let current = '';
  let octets = 0;
  // Continuation lines start with a space, which counts toward the limit.
  let limit = MAX_LINE_OCTETS;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (octets + size > limit) {
      parts.push(current);
      current = '';
      octets = 0;
      limit = MAX_LINE_OCTETS - 1;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join(CRLF + ' ');
}
