# RxCal

No-login website: photo of a prescription -> on-device OCR -> confirm/edit -> `.ics` / `.txt` export.
Spec: `prescription-scanner-project-spec.md`. Decisions: `docs/decisions.md`.

## First, ask who you are working with
Ask whether the user is **Joel** or **Jammy** before editing. Each owns folders (below). If a task touches the
other person's folders, stop and give the user a short message to send them instead of editing.

| Owner | Paths |
|---|---|
| Joel | `src/ui/`, `src/App.jsx`, `src/main.jsx`, `src/styles.css`, `index.html`, `public/_headers`, `e2e/privacy.spec.js`, deploy, `README.md` |
| Jammy | `src/engine/`, `data/vocab/`, `e2e/eval.spec.js`, `scripts/make-fixtures.js`, `fixtures/` |
| Both (ask first) | `src/contract/plan.js`, `package.json`, configs, `CLAUDE.md`, `docs/decisions.md` |

## Stack and commands
React + Vite, plain JavaScript (no TypeScript in the frontend). Tesseract.js 7, self-hosted.
- `npm install` also copies Tesseract assets into `public/tesseract/` (gitignored).
- `npm run dev`, `npm run build`, `npm test` (Vitest, `src/**/*.test.js`).
- `npm run e2e` (Playwright). No bundled Chromium? `PW_CHANNEL=chrome npm run e2e`.
- `npm run fixtures` regenerates synthetic prescriptions + `fixtures/truth.json`.

## Hard rules
- No request may leave the origin after page load. No CDNs, analytics, fonts, error reporters or third-party fetches.
  `e2e/privacy.spec.js` and the CSP in `public/_headers` enforce this; keep both passing.
- Never export unconfirmed OCR output. The confirm screen is mandatory.
- Never copy unsourced accuracy numbers from the spec into docs. Report only what `e2e/eval.spec.js` measures.
- Only synthetic prescriptions in `fixtures/`. Real ones need consent first (see `docs/decisions.md`).
- The user commits. Hand them commands; do not commit or push yourself.
