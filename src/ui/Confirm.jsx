// Owner: Joel. Mandatory human check before any export. Nothing from OCR is exported unconfirmed.
import { useState } from 'react';
import { SLOT_LABELS, formatDose } from '../contract/plan.js';

const DOSES = [0, 0.5, 1, 1.5, 2, 3];
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const blank = () => ({ name: '', candidates: [], slots: [1, 0, 1], durationDays: '', note: '' });

const resize = (slots, n) => (n === 4 ? [slots[0], slots[1], 0, slots[2]] : [slots[0], slots[1], slots[3]]);

const valid = (m) => m.name.trim() && Number(m.durationDays) >= 1 && m.slots.some((s) => s > 0);

/** @param {{ scan: import('../contract/plan.js').ScanResult, image: string, onConfirm: Function, onCancel: Function }} props */
export default function Confirm({ scan, image, onConfirm, onCancel }) {
  const [startDate, setStartDate] = useState(scan.date ?? today());
  const [meds, setMeds] = useState(() =>
    scan.rows.length
      ? scan.rows.map((r) => ({ ...r, slots: r.slots ?? [1, 0, 1], durationDays: r.durationDays ?? '' }))
      : [blank()],
  );

  const update = (i, patch) => setMeds((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const ok = startDate && meds.length > 0 && meds.every(valid);

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        onConfirm({
          startDate,
          meds: meds.map((m) => ({ name: m.name.trim(), slots: m.slots, durationDays: Number(m.durationDays), note: m.note.trim() })),
        });
      }}
    >
      <section className="card">
        <h2>Check every detail</h2>
        <p className="muted">The reading can be wrong. Compare with your prescription and fix anything that differs.</p>
        <div className="split">
          {image && <img className="preview" src={image} alt="Your prescription" />}
          <details>
            <summary>Text the app read</summary>
            <pre>{scan.rawText || '(no text found)'}</pre>
          </details>
        </div>
        <label className="field">
          <span>Start date</span>
          <input type="date" value={startDate} required onChange={(e) => setStartDate(e.target.value)} />
        </label>
        {!scan.date && <p className="muted small">No date found on the prescription, so today is used.</p>}
      </section>

      {meds.map((m, i) => (
        <fieldset className="card med" key={i}>
          <legend>Medicine {i + 1}</legend>

          <label className="field">
            <span>Name</span>
            <input value={m.name} required placeholder="Type the medicine name" onChange={(e) => update(i, { name: e.target.value })} />
          </label>
          {m.raw && <p className="muted small">Read as: “{m.raw}”</p>}
          {m.candidates.length > 0 ? (
            <div className="chips" role="group" aria-label="Possible matches">
              {m.candidates.map((c) => (
                <button type="button" key={c.name} className={`chip${m.name === c.name ? ' on' : ''}`} onClick={() => update(i, { name: c.name })}>
                  {c.name}
                  {c.generic !== c.name && <small> · {c.generic}</small>}
                  <small> · {Math.round(c.score * 100)}%</small>
                </button>
              ))}
            </div>
          ) : (
            m.raw && <p className="muted small">Not recognized. Type the name manually.</p>
          )}

          <div className="field">
            <span>Times a day</span>
            <div className="segmented" role="group" aria-label="Dose slots">
              {[3, 4].map((n) => (
                <button type="button" key={n} className={m.slots.length === n ? 'on' : ''} onClick={() => m.slots.length !== n && update(i, { slots: resize(m.slots, n) })}>
                  {n} slots
                </button>
              ))}
            </div>
          </div>

          <div className="slots">
            {m.slots.map((s, k) => (
              <label className="field" key={k}>
                <span>{SLOT_LABELS[m.slots.length][k]}</span>
                <select value={s} onChange={(e) => update(i, { slots: m.slots.map((x, j) => (j === k ? Number(e.target.value) : x)) })}>
                  {(DOSES.includes(s) ? DOSES : [s, ...DOSES]).map((d) => (
                    <option key={d} value={d}>
                      {formatDose(d)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="row">
            <label className="field">
              <span>Days</span>
              <input type="number" min="1" max="365" inputMode="numeric" required value={m.durationDays} onChange={(e) => update(i, { durationDays: e.target.value })} />
            </label>
            <label className="field grow">
              <span>Note</span>
              <input value={m.note} list="meal-notes" placeholder="e.g. After food" onChange={(e) => update(i, { note: e.target.value })} />
            </label>
          </div>

          {meds.length > 1 && (
            <button type="button" className="button plain danger" onClick={() => setMeds((ms) => ms.filter((_, j) => j !== i))}>
              Remove medicine
            </button>
          )}
        </fieldset>
      ))}

      <datalist id="meal-notes">
        <option value="Before food" />
        <option value="After food" />
        <option value="With food" />
      </datalist>

      <div className="actions">
        <button type="button" className="button plain" onClick={() => setMeds((ms) => [...ms, blank()])}>
          Add medicine
        </button>
        <button type="button" className="button plain" onClick={onCancel}>
          Start over
        </button>
        <button type="submit" className="button primary" disabled={!ok}>
          Looks right
        </button>
      </div>
      {!ok && <p className="muted small right">Each medicine needs a name, a number of days and at least one dose.</p>}
    </form>
  );
}
