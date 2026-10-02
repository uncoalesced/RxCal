// Owner: Joel. App shell: upload -> read -> confirm -> export.
import { useState } from 'react';
import Upload from './ui/Upload.jsx';
import Confirm from './ui/Confirm.jsx';
import Export from './ui/Export.jsx';
import { recognize } from './engine/ocr.js';
import { parsePrescription } from './engine/parse.js';
import { flattenVocab } from './engine/match.js';
import seed from '../data/vocab/seed.json';

const vocab = flattenVocab(seed);

export default function App() {
  const [step, setStep] = useState('upload');
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [scan, setScan] = useState(null);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  async function read(file) {
    setImage(URL.createObjectURL(file));
    setStep('reading');
    setProgress(0);
    setError('');
    try {
      const text = await recognize(file, (m) => m.status === 'recognizing text' && setProgress(m.progress));
      setScan(parsePrescription(text, vocab));
      setStep('confirm');
    } catch (e) {
      setError(`Could not read the image: ${e.message}`);
      setStep('upload');
    }
  }

  function restart() {
    if (image) URL.revokeObjectURL(image);
    setImage(null);
    setScan(null);
    setPlan(null);
    setStep('upload');
  }

  return (
    <main className="shell">
      <header className="hero">
        <h1>RxCal</h1>
        <p className="lede">Prescription to calendar. Nothing leaves your device.</p>
      </header>

      {step === 'upload' && <Upload onFile={read} error={error} />}

      {step === 'reading' && (
        <section className="card reading" aria-live="polite">
          {image && <img className="preview" src={image} alt="Your prescription" />}
          <p>Reading on this device… {Math.round(progress * 100)}%</p>
          <progress value={progress} max="1" />
        </section>
      )}

      {/* Stays mounted while exporting so "Edit" returns to the user's edits, not the raw scan. */}
      {scan && (
        <div hidden={step !== 'confirm'}>
          <Confirm
            scan={scan}
            image={image}
            onConfirm={(p) => {
              setPlan(p);
              setStep('done');
            }}
            onCancel={restart}
          />
        </div>
      )}

      {step === 'done' && <Export plan={plan} onEdit={() => setStep('confirm')} onRestart={restart} />}

      <footer className="foot">
        <p>OCR runs in your browser. No uploads, no accounts, no analytics. Always check the result against your prescription.</p>
      </footer>
    </main>
  );
}
