import { describe, expect, it } from 'vitest';
import { generateTextNote } from './text';
import { sampleOptions, samplePrescription } from './fixtures';

describe('generateTextNote', () => {
  it('lists each medication with its schedule, dates and instructions', () => {
    expect(generateTextNote(samplePrescription, sampleOptions)).toBe(
      [
        'RxCal: Prescription schedule',
        '',
        'Prescription date: 23 Sep 2026',
        'Reminders start: 24 Sep 2026',
        'Reminder times: Morning 08:00, Night 21:00',
        '',
        '1. Paracetamol 500 mg',
        '   Dosage: 1-0-1 (Morning 1 · Night 1)',
        '   Duration: 5 days (24 Sep 2026 to 28 Sep 2026)',
        '   Take: After food',
        '',
        '2. Amoxicillin, 250 mg; syrup',
        '   Dosage: ½-0-0-1 (Morning ½ · Night 1)',
        '   Duration: 3 days (24 Sep 2026 to 26 Sep 2026)',
        '   Notes: Shake well\\before use',
        '',
        'Always check this schedule against your original prescription.',
        '',
      ].join('\n'),
    );
  });
});
