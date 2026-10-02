// Owner: Joel. Files are built and downloaded locally via Blob URLs.
import { buildICS } from '../engine/ics.js';
import { buildText } from '../engine/text.js';
import { SLOT_LABELS, formatDose } from '../contract/plan.js';

function download(name, type, body) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** @param {{ plan: import('../contract/plan.js').ConfirmedPlan, onEdit: Function, onRestart: Function }} props */
export default function Export({ plan, onEdit, onRestart }) {
  return (
    <section className="card stack">
      <h2>Your schedule</h2>
      <p className="muted">Starting {new Date(`${plan.startDate}T00:00`).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
      <ul className="summary">
        {plan.meds.map((m, i) => (
          <li key={i}>
            <strong>{m.name}</strong>
            <span>
              {m.slots
                .map((s, k) => (s ? `${formatDose(s)} ${SLOT_LABELS[m.slots.length][k].toLowerCase()}` : null))
                .filter(Boolean)
                .join(', ')}{' '}
              · {m.durationDays} day{m.durationDays === 1 ? '' : 's'}
              {m.note && ` · ${m.note}`}
            </span>
          </li>
        ))}
      </ul>
      <div className="actions">
        <button className="button plain" onClick={onEdit}>Edit</button>
        <button className="button plain" onClick={() => download('rxcal-plan.txt', 'text/plain', buildText(plan))}>Save note</button>
        <button className="button primary" onClick={() => download('rxcal-plan.ics', 'text/calendar', buildICS(plan))}>Add to calendar</button>
      </div>
      <p className="muted small">The .ics file opens in Google Calendar (Import), Apple Calendar or Outlook.</p>
      <button className="button plain" onClick={onRestart}>Scan another</button>
    </section>
  );
}
