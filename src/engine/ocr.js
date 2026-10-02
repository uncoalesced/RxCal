// Owner: Jammy. Tesseract bridge. Every asset is served from /tesseract/ (scripts/copy-tesseract.js), never a CDN.
import { createWorker } from 'tesseract.js';

const base = `${import.meta.env.BASE_URL}tesseract/`;
let workerPromise;
let progress = () => {};

const getWorker = () =>
  (workerPromise ??= createWorker('eng', 1, {
    workerPath: `${base}worker.min.js`,
    corePath: base,
    langPath: base,
    workerBlobURL: false,
    logger: (m) => progress(m),
  }));

/** Image (File, Blob or URL) to plain text. onProgress gets Tesseract's { status, progress }. */
export async function recognize(image, onProgress = () => {}) {
  progress = onProgress;
  const worker = await getWorker();
  const { data } = await worker.recognize(image);
  return data.text;
}
