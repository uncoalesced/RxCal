import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDER_TIMES, type Medication, type Prescription } from './types';
import { validatePrescription } from './validate';

const options = { startDate: '2026-09-24', reminderTimes: DEFAULT_REMINDER_TIMES };

function med(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'm1',
    name: 'Paracetamol 500 mg',
    dosage: '1-0-1',
    durationDays: 5,
    foodTiming: 'after-food',
    notes: '',
    ...overrides,
  };
}

function rx(medications: Medication[]): Prescription {
  return { date: '2026-09-23', medications };
}

describe('validatePrescription', () => {
  it('returns a validated prescription with parsed schedules', () => {
    const result = validatePrescription(rx([med({ name: '  Paracetamol 500 mg ' })]), options);
    expect(result.errorCount).toBe(0);
    expect(result.value?.medications[0]?.name).toBe('Paracetamol 500 mg');
    expect(result.value?.medications[0]?.schedule.pattern).toBe('3-slot');
  });

  it('collects per-medication errors and withholds the value', () => {
    const result = validatePrescription(
      rx([med(), med({ id: 'm2', name: ' ', dosage: 'BD', durationDays: null })]),
      options,
    );
    expect(result.value).toBeNull();
    expect(result.errorCount).toBe(3);
    expect(result.medicationErrors.m1).toBeUndefined();
    expect(result.medicationErrors.m2?.name).toMatch(/name/);
    expect(result.medicationErrors.m2?.dosage).toMatch(/aren't supported yet/);
    expect(result.medicationErrors.m2?.durationDays).toMatch(/between 1 and 365/);
  });

  it.each([0, -1, 2.5, 366])('rejects a duration of %s days', (days) => {
    const result = validatePrescription(rx([med({ durationDays: days })]), options);
    expect(result.medicationErrors.m1?.durationDays).toBeDefined();
  });

  it('requires dates, reminder times and at least one medication', () => {
    const result = validatePrescription(
      { date: '', medications: [] },
      { startDate: 'nope', reminderTimes: { ...DEFAULT_REMINDER_TIMES, evening: '' } },
    );
    expect(result.formErrors).toEqual([
      'Enter the prescription date.',
      'Enter the date reminders should start.',
      'Set a reminder time for Evening.',
      'Add at least one medication.',
    ]);
    expect(result.value).toBeNull();
  });
});
