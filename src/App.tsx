import { useMemo, useState } from 'react';
import { ExportPanel } from './components/ExportPanel';
import { ImagePreview } from './components/ImagePreview';
import { PrescriptionForm, emptyMedication } from './components/PrescriptionForm';
import { ReminderTimesEditor } from './components/ReminderTimesEditor';
import { todayIso } from './domain/dates';
import { DEFAULT_REMINDER_TIMES, type Prescription, type ReminderTimes } from './domain/types';
import { validatePrescription } from './domain/validate';
import { downloadFile } from './export/download';
import { generateICS } from './export/ics';
import { generateTextNote } from './export/text';

export default function App() {
  const [prescription, setPrescription] = useState<Prescription>(() => ({
    date: todayIso(),
    medications: [emptyMedication()],
  }));
  const [startDate, setStartDate] = useState(todayIso);
  const [reminderTimes, setReminderTimes] = useState<ReminderTimes>(DEFAULT_REMINDER_TIMES);
  const [photo, setPhoto] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const options = useMemo(() => ({ startDate, reminderTimes }), [startDate, reminderTimes]);
  const validation = useMemo(
    () => validatePrescription(prescription, options),
    [prescription, options],
  );

  // Any edit invalidates the user's confirmation: they must re-check before exporting.
  const edit =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setConfirmed(false);
    };

  const exportAs = (kind: 'ics' | 'txt') => {
    if (!validation.value || !confirmed) return;
    const filename = `rxcal-${prescription.date}.${kind}`;
    if (kind === 'ics') {
      downloadFile(filename, generateICS(validation.value, options), 'text/calendar;charset=utf-8');
    } else {
      downloadFile(
        filename,
        generateTextNote(validation.value, options),
        'text/plain;charset=utf-8',
      );
    }
  };

  return (
    <>
      <header className="site-header">
        <h1>RxCal</h1>
        <p>
          Turn a prescription into calendar reminders. Everything happens in your browser, so
          nothing you enter or photograph is uploaded.
        </p>
      </header>

      <main className="layout">
        <div className="column">
          <ImagePreview file={photo} onChange={setPhoto} />
        </div>
        <div className="column">
          <PrescriptionForm
            prescription={prescription}
            startDate={startDate}
            medicationErrors={validation.medicationErrors}
            onChange={edit(setPrescription)}
            onStartDateChange={edit(setStartDate)}
          />
          <ReminderTimesEditor times={reminderTimes} onChange={edit(setReminderTimes)} />
          <ExportPanel
            validation={validation}
            confirmed={confirmed}
            onConfirmedChange={setConfirmed}
            onExportCalendar={() => exportAs('ics')}
            onExportText={() => exportAs('txt')}
          />
        </div>
      </main>

      <footer className="site-footer">
        <p>
          RxCal is a reminder tool, not medical advice. If anything is unclear, ask your doctor or
          pharmacist.
        </p>
      </footer>
    </>
  );
}
