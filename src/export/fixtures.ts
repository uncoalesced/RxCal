import { DEFAULT_REMINDER_TIMES, type ValidatedPrescription } from '../domain/types';
import { parseDosage } from '../domain/dosage';

function schedule(dosage: string) {
  const result = parseDosage(dosage);
  if (result.status !== 'ok') throw new Error(`bad fixture dosage ${dosage}`);
  return result.schedule;
}

export const sampleOptions = {
  startDate: '2026-09-24',
  reminderTimes: DEFAULT_REMINDER_TIMES,
  now: new Date(Date.UTC(2026, 8, 24, 6, 30, 0)),
};

export const samplePrescription: ValidatedPrescription = {
  date: '2026-09-23',
  medications: [
    {
      id: 'med-a',
      name: 'Paracetamol 500 mg',
      dosage: '1-0-1',
      schedule: schedule('1-0-1'),
      durationDays: 5,
      foodTiming: 'after-food',
      notes: '',
    },
    {
      id: 'med-b',
      name: 'Amoxicillin, 250 mg; syrup',
      dosage: '½-0-0-1',
      schedule: schedule('½-0-0-1'),
      durationDays: 3,
      foodTiming: 'unspecified',
      notes: 'Shake well\\before use',
    },
  ],
};
