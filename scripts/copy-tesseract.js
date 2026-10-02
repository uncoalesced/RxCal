// Copies Tesseract worker, core and English data into public/tesseract/ so OCR never touches a CDN.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';

const out = 'public/tesseract';
mkdirSync(out, { recursive: true });
cpSync('node_modules/tesseract.js/dist/worker.min.js', `${out}/worker.min.js`);
for (const f of readdirSync('node_modules/tesseract.js-core')) {
  if (f.endsWith('.wasm.js')) cpSync(`node_modules/tesseract.js-core/${f}`, `${out}/${f}`);
}
cpSync('node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', `${out}/eng.traineddata.gz`);
console.log('tesseract assets copied to', out);
