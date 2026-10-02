// Owner: Jammy. RFC 5545 calendar export of a ConfirmedPlan (src/contract/plan.js).
import { SLOT_LABELS, SLOT_TIMES, formatDose } from '../contract/plan.js';

const escape = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Fold lines over 75 octets (RFC 5545 3.1) without splitting a multi-byte character.
function fold(line) {
  const enc = new TextEncoder();
  let out = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 75) {
      out += '\r\n ';
      bytes = 1;
    }
    out += ch;
    bytes += n;
  }
  return out;
}

const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

/**
 * @param {import('../contract/plan.js').ConfirmedPlan} plan
 * @param {{ now?: Date, uid?: () => string }} [opts] injectable for tests
 */
export function buildICS(plan, { now = new Date(), uid = () => crypto.randomUUID() } = {}) {
  const day = plan.startDate.replace(/-/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//uncoalesced//RxCal//EN', 'CALSCALE:GREGORIAN'];
  for (const med of plan.meds) {
    const labels = SLOT_LABELS[med.slots.length];
    const times = SLOT_TIMES[med.slots.length];
    med.slots.forEach((dose, i) => {
      if (!dose) return;
      const desc = `Dose: ${formatDose(dose)} (${labels[i].toLowerCase()}).${med.note ? ` ${med.note}.` : ''}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid()}@rxcal`,
        `DTSTAMP:${utcStamp(now)}`,
        `DTSTART:${day}T${times[i].replace(':', '')}00`, // floating local time
        'DURATION:PT15M',
        `RRULE:FREQ=DAILY;COUNT=${med.durationDays}`,
        `SUMMARY:${escape(`Take ${med.name}`)}`,
        `DESCRIPTION:${escape(desc)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escape(`Take ${med.name}`)}`,
        'TRIGGER:-PT10M',
        'END:VALARM',
        'END:VEVENT',
      );
    });
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
