// Owner: Joel.
import { useState } from 'react';

export default function Upload({ onFile, error }) {
  const [over, setOver] = useState(false);

  const pick = (files) => {
    const f = files?.[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  };

  return (
    <section
      className={`card drop${over ? ' over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        pick(e.dataTransfer.files);
      }}
    >
      <h2>Add your prescription</h2>
      <p className="muted">Printed or e-prescriptions work best. Take a photo or choose an image.</p>
      <label className="button primary">
        Choose photo
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files)} />
      </label>
      <p className="muted small">or drop an image here</p>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
