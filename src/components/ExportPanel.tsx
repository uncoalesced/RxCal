import type { ValidationResult } from '../domain/validate';

interface Props {
  validation: ValidationResult;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onExportCalendar: () => void;
  onExportText: () => void;
}

export function ExportPanel({
  validation,
  confirmed,
  onConfirmedChange,
  onExportCalendar,
  onExportText,
}: Props) {
  const ready = validation.value !== null;
  const canExport = ready && confirmed;

  return (
    <section aria-labelledby="export-heading">
      <h2 id="export-heading">Check and export</h2>
      <div className="card export">
        {!ready && (
          <div role="status">
            <p>
              {validation.errorCount} {validation.errorCount === 1 ? 'thing needs' : 'things need'}{' '}
              fixing before you can export:
            </p>
            <ul className="issues">
              {validation.formErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
              {Object.entries(validation.medicationErrors).flatMap(([id, errors]) =>
                Object.entries(errors).map(([field, msg]) => <li key={`${id}-${field}`}>{msg}</li>),
              )}
            </ul>
          </div>
        )}

        <label className="confirm">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={!ready}
            onChange={(e) => onConfirmedChange(e.target.checked)}
          />
          <span>I have checked every medication, dose and duration against my prescription.</span>
        </label>

        <div className="actions">
          <button type="button" disabled={!canExport} onClick={onExportCalendar}>
            Download calendar (.ics)
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={!canExport}
            onClick={onExportText}
          >
            Download note (.txt)
          </button>
        </div>
        <p className="hint">
          Open the .ics file to add the reminders to Google Calendar, Apple Calendar or Outlook.
        </p>
      </div>
    </section>
  );
}
