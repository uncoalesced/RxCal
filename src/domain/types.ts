/** A dose slot in the Indian numeric notation: `1-0-1` or `1-0-0-1`. */
export type SlotId = 'morning' | 'afternoon' | 'evening' | 'night';

export const SLOT_LABELS: Record<SlotId, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

/** Slot order for each supported pattern, left to right as written on the prescription. */
export const SLOT_PATTERNS = {
  '3-slot': ['morning', 'afternoon', 'night'],
  '4-slot': ['morning', 'afternoon', 'evening', 'night'],
} as const satisfies Record<string, readonly SlotId[]>;

export type SlotPattern = keyof typeof SLOT_PATTERNS;

export interface DoseSlot {
  slot: SlotId;
  /** Units per dose, e.g. 1, 2 or 0.5 for ½. Zero means "skip this slot". */
  quantity: number;
}

export interface DoseSchedule {
  pattern: SlotPattern;
  /** Every slot of the pattern, in order, including zero-quantity ones. */
  slots: DoseSlot[];
}

/** Local wall-clock time for each slot, as `HH:MM`. */
export type ReminderTimes = Record<SlotId, string>;

export const DEFAULT_REMINDER_TIMES: ReminderTimes = {
  morning: '08:00',
  afternoon: '14:00',
  evening: '18:00',
  night: '21:00',
};

export type FoodTiming = 'unspecified' | 'before-food' | 'after-food' | 'with-food';

export const FOOD_TIMING_LABELS: Record<FoodTiming, string> = {
  unspecified: 'Not specified',
  'before-food': 'Before food',
  'after-food': 'After food',
  'with-food': 'With food',
};

/**
 * A medication as entered or extracted, before validation. `dosage` keeps the
 * raw text exactly as written so the confirm/edit screen can show what OCR saw.
 */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  durationDays: number | null;
  foodTiming: FoodTiming;
  notes: string;
}

export interface Prescription {
  /** Date written on the prescription, `YYYY-MM-DD`. */
  date: string;
  medications: Medication[];
}

export interface ValidatedMedication extends Medication {
  schedule: DoseSchedule;
  durationDays: number;
}

/** A prescription that passed validation. Exporters only accept this type. */
export interface ValidatedPrescription {
  date: string;
  medications: ValidatedMedication[];
}

export interface ExportOptions {
  /** First day of reminders, `YYYY-MM-DD`. */
  startDate: string;
  reminderTimes: ReminderTimes;
}
