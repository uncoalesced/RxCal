import { SLOT_LABELS, type ReminderTimes, type SlotId } from '../domain/types';

interface Props {
  times: ReminderTimes;
  onChange: (times: ReminderTimes) => void;
}

export function ReminderTimesEditor({ times, onChange }: Props) {
  return (
    <section aria-labelledby="times-heading">
      <h2 id="times-heading">Reminder times</h2>
      <div className="card times-grid">
        {(Object.keys(SLOT_LABELS) as SlotId[]).map((slot) => (
          <div className="field" key={slot}>
            <label htmlFor={`time-${slot}`}>{SLOT_LABELS[slot]}</label>
            <input
              id={`time-${slot}`}
              type="time"
              value={times[slot]}
              onChange={(e) => onChange({ ...times, [slot]: e.target.value })}
            />
          </div>
        ))}
        <p className="hint times-note">Evening is used only by 4-slot doses such as 1-0-0-1.</p>
      </div>
    </section>
  );
}
