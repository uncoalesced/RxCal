import { describeDosage, parseDosage } from '../domain/dosage';
import { FOOD_TIMING_LABELS, type FoodTiming, type Medication } from '../domain/types';
import type { MedicationErrors } from '../domain/validate';

interface Props {
  index: number;
  medication: Medication;
  errors: MedicationErrors | undefined;
  canRemove: boolean;
  onChange: (medication: Medication) => void;
  onRemove: () => void;
}

export function MedicationRow({ index, medication, errors, canRemove, onChange, onRemove }: Props) {
  const id = (field: string) => `med-${medication.id}-${field}`;
  const update = <K extends keyof Medication>(key: K, value: Medication[K]) =>
    onChange({ ...medication, [key]: value });

  const dosage = medication.dosage.trim() === '' ? null : parseDosage(medication.dosage);
  const nameError = medication.name !== '' ? errors?.name : undefined;
  const durationError = medication.durationDays !== null ? errors?.durationDays : undefined;

  return (
    <fieldset className="card medication">
      <legend>Medication {index + 1}</legend>

      <div className="field">
        <label htmlFor={id('name')}>Name</label>
        <input
          id={id('name')}
          type="text"
          autoComplete="off"
          placeholder="e.g. Paracetamol 500 mg"
          value={medication.name}
          onChange={(e) => update('name', e.target.value)}
          aria-invalid={nameError ? true : undefined}
        />
        {nameError && <p className="error">{nameError}</p>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={id('dosage')}>Dosage</label>
          <input
            id={id('dosage')}
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="1-0-1 or 1-0-0-1"
            value={medication.dosage}
            onChange={(e) => update('dosage', e.target.value)}
            aria-invalid={dosage && dosage.status !== 'ok' ? true : undefined}
            aria-describedby={id('dosage-hint')}
          />
          <p id={id('dosage-hint')} className={dosageHintClass(dosage?.status)} aria-live="polite">
            {dosage === null
              ? 'Morning-Afternoon-Night, or Morning-Afternoon-Evening-Night'
              : dosage.status === 'ok'
                ? describeDosage(dosage.schedule)
                : dosage.message}
          </p>
        </div>

        <div className="field field-narrow">
          <label htmlFor={id('days')}>Days</label>
          <input
            id={id('days')}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="5"
            value={medication.durationDays ?? ''}
            onChange={(e) =>
              update('durationDays', e.target.value === '' ? null : Number(e.target.value))
            }
            aria-invalid={durationError ? true : undefined}
          />
          {durationError && <p className="error">{durationError}</p>}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={id('food')}>Food</label>
          <select
            id={id('food')}
            value={medication.foodTiming}
            onChange={(e) => update('foodTiming', e.target.value as FoodTiming)}
          >
            {(Object.keys(FOOD_TIMING_LABELS) as FoodTiming[]).map((key) => (
              <option key={key} value={key}>
                {FOOD_TIMING_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={id('notes')}>Notes</label>
          <input
            id={id('notes')}
            type="text"
            autoComplete="off"
            placeholder="Optional"
            value={medication.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>
      </div>

      {canRemove && (
        <button type="button" className="button-link danger" onClick={onRemove}>
          Remove medication {index + 1}
        </button>
      )}
    </fieldset>
  );
}

function dosageHintClass(status: string | undefined): string {
  if (status === 'ok') return 'hint ok';
  if (status === 'unsupported-format') return 'hint warning';
  if (status === 'invalid') return 'error';
  return 'hint';
}
