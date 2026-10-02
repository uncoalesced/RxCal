// Owner: Joel + Jammy (shared seam between src/ui and src/engine). Change only after asking the other owner.

/**
 * @typedef {{ name: string, generic: string, score: number }} Candidate
 * @typedef {{ raw: string, name: string, candidates: Candidate[], slots: number[] | null, durationDays: number | null, note: string }} ScanRow
 * @typedef {{ date: string | null, rawText: string, rows: ScanRow[] }} ScanResult   date is YYYY-MM-DD
 * @typedef {{ name: string, slots: number[], durationDays: number, note: string }} ConfirmedMed
 * @typedef {{ startDate: string, meds: ConfirmedMed[] }} ConfirmedPlan
 */

export const SLOT_LABELS = {
  3: ['Morning', 'Afternoon', 'Night'],
  4: ['Morning', 'Noon', 'Evening', 'Night'],
};

// Floating local times; semantics still open, see docs/decisions.md.
export const SLOT_TIMES = {
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
};

export const formatDose = (n) => (n === 0.5 ? '½' : Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`);

/** @type {ScanResult} */
export const SAMPLE_SCAN = {
  date: '2026-10-02',
  rawText: 'Date: 02/10/2026\nTab. Crocin 500mg 1-0-1 x 5 days after food\nCap. Pan 40 1-0-0 x 7 days before food',
  rows: [
    { raw: 'Tab. Crocin 500mg 1-0-1 x 5 days after food', name: 'Crocin 500mg', candidates: [{ name: 'Crocin', generic: 'Paracetamol', score: 1 }], slots: [1, 0, 1], durationDays: 5, note: 'After food' },
    { raw: 'Cap. Pan 40 1-0-0 x 7 days before food', name: 'Pan 40', candidates: [{ name: 'Pan 40', generic: 'Pantoprazole', score: 1 }], slots: [1, 0, 0], durationDays: 7, note: 'Before food' },
  ],
};
