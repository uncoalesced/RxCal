import { isIsoDate, isTime } from './dates';
import { parseDosage } from './dosage';
import {
  SLOT_LABELS,
  type ExportOptions,
  type Prescription,
  type SlotId,
  type ValidatedMedication,
  type ValidatedPrescription,
} from './types';

export const MAX_DURATION_DAYS = 365;

export interface MedicationErrors {
  name?: string;
  dosage?: string;
  durationDays?: string;
}

export interface ValidationResult {
  /** Present only when there are no errors at all. */
  value: ValidatedPrescription | null;
  formErrors: string[];
  medicationErrors: Record<string, MedicationErrors>;
  errorCount: number;
}

export function validatePrescription(
  prescription: Prescription,
  options: ExportOptions,
): ValidationResult {
  const formErrors: string[] = [];
  const medicationErrors: Record<string, MedicationErrors> = {};
  const validated: ValidatedMedication[] = [];

  if (!isIsoDate(prescription.date)) formErrors.push('Enter the prescription date.');
  if (!isIsoDate(options.startDate)) formErrors.push('Enter the date reminders should start.');
  for (const [slot, time] of Object.entries(options.reminderTimes)) {
    if (!isTime(time)) formErrors.push(`Set a reminder time for ${SLOT_LABELS[slot as SlotId]}.`);
  }
  if (prescription.medications.length === 0) formErrors.push('Add at least one medication.');

  for (const med of prescription.medications) {
    const errors: MedicationErrors = {};
    if (med.name.trim() === '') errors.name = 'Enter the medication name.';

    const parsed = parseDosage(med.dosage);
    if (parsed.status !== 'ok') errors.dosage = parsed.message;

    const days = med.durationDays;
    if (days === null || !Number.isInteger(days) || days < 1 || days > MAX_DURATION_DAYS) {
      errors.durationDays = `Enter a duration between 1 and ${MAX_DURATION_DAYS} days.`;
    }

    if (Object.keys(errors).length > 0) {
      medicationErrors[med.id] = errors;
    } else if (parsed.status === 'ok' && days !== null) {
      validated.push({
        ...med,
        name: med.name.trim(),
        schedule: parsed.schedule,
        durationDays: days,
      });
    }
  }

  const errorCount =
    formErrors.length +
    Object.values(medicationErrors).reduce((n, e) => n + Object.keys(e).length, 0);

  return {
    value: errorCount === 0 ? { date: prescription.date, medications: validated } : null,
    formErrors,
    medicationErrors,
    errorCount,
  };
}
