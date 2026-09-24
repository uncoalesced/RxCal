import { newId } from '../domain/ids';
import type { Medication, Prescription } from '../domain/types';
import type { MedicationErrors } from '../domain/validate';
import { MedicationRow } from './MedicationRow';

interface Props {
  prescription: Prescription;
  startDate: string;
  medicationErrors: Record<string, MedicationErrors>;
  onChange: (prescription: Prescription) => void;
  onStartDateChange: (date: string) => void;
}

export function emptyMedication(): Medication {
  return {
    id: newId(),
    name: '',
    dosage: '',
    durationDays: null,
    foodTiming: 'unspecified',
    notes: '',
  };
}

export function PrescriptionForm({
  prescription,
  startDate,
  medicationErrors,
  onChange,
  onStartDateChange,
}: Props) {
  const { medications } = prescription;
  const setMedications = (next: Medication[]) => onChange({ ...prescription, medications: next });

  return (
    <section aria-labelledby="details-heading">
      <h2 id="details-heading">Prescription details</h2>

      <div className="card field-row">
        <div className="field">
          <label htmlFor="rx-date">Prescription date</label>
          <input
            id="rx-date"
            type="date"
            value={prescription.date}
            onChange={(e) => onChange({ ...prescription, date: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="start-date">Start reminders on</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
      </div>

      {medications.map((med, i) => (
        <MedicationRow
          key={med.id}
          index={i}
          medication={med}
          errors={medicationErrors[med.id]}
          canRemove={medications.length > 1}
          onChange={(updated) =>
            setMedications(medications.map((m) => (m.id === updated.id ? updated : m)))
          }
          onRemove={() => setMedications(medications.filter((m) => m.id !== med.id))}
        />
      ))}

      <button
        type="button"
        className="button-secondary"
        onClick={() => setMedications([...medications, emptyMedication()])}
      >
        + Add medication
      </button>
    </section>
  );
}
