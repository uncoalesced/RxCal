import { addDays, formatDisplayDate } from '../domain/dates';
import { describeDosage, formatDosage } from '../domain/dosage';
import {
  FOOD_TIMING_LABELS,
  SLOT_LABELS,
  type ExportOptions,
  type SlotId,
  type ValidatedPrescription,
} from '../domain/types';

/** Plain-text note of the schedule; also reads cleanly as Markdown. */
export function generateTextNote(
  prescription: ValidatedPrescription,
  options: ExportOptions,
): string {
  const usedSlots = new Set<SlotId>();
  const meds = prescription.medications.map((med, i) => {
    med.schedule.slots.filter((s) => s.quantity > 0).forEach((s) => usedSlots.add(s.slot));
    const endDate = addDays(options.startDate, med.durationDays - 1);
    const lines = [
      `${i + 1}. ${med.name}`,
      `   Dosage: ${formatDosage(med.schedule)} (${describeDosage(med.schedule)})`,
      `   Duration: ${med.durationDays} day${med.durationDays === 1 ? '' : 's'} ` +
        `(${formatDisplayDate(options.startDate)} to ${formatDisplayDate(endDate)})`,
    ];
    if (med.foodTiming !== 'unspecified')
      lines.push(`   Take: ${FOOD_TIMING_LABELS[med.foodTiming]}`);
    if (med.notes.trim()) lines.push(`   Notes: ${med.notes.trim()}`);
    return lines.join('\n');
  });

  const times = (Object.keys(SLOT_LABELS) as SlotId[])
    .filter((slot) => usedSlots.has(slot))
    .map((slot) => `${SLOT_LABELS[slot]} ${options.reminderTimes[slot]}`)
    .join(', ');

  return [
    'RxCal: Prescription schedule',
    '',
    `Prescription date: ${formatDisplayDate(prescription.date)}`,
    `Reminders start: ${formatDisplayDate(options.startDate)}`,
    `Reminder times: ${times}`,
    '',
    meds.join('\n\n'),
    '',
    'Always check this schedule against your original prescription.',
    '',
  ].join('\n');
}
