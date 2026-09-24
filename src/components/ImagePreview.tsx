import { useEffect, useState } from 'react';

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
}

/**
 * Shows the user's own photo beside the form so they can copy details across.
 * The image is read through a local blob: URL and never uploaded.
 */
export function ImagePreview({ file, onChange }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <section aria-labelledby="photo-heading">
      <h2 id="photo-heading">Prescription photo</h2>
      <div className="card photo">
        <input
          id="photo-input"
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={(e) => {
            onChange(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
        {url ? (
          <>
            <img src={url} alt="Your prescription" />
            <button type="button" className="button-link" onClick={() => onChange(null)}>
              Remove photo
            </button>
          </>
        ) : (
          <>
            <label htmlFor="photo-input" className="button-secondary">
              Choose or take a photo
            </label>
            <p className="hint">
              Optional. Keep it open while you type in the details. Automatic reading is coming
              soon. The photo stays on this device.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
