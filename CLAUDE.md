# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

RxCal: a no-login, fully client-side web app that turns a prescription into calendar reminders (`.ics`) or a text note. React 19 + TypeScript + Vite, hosted as a static site on Cloudflare Pages. The full design and roadmap is in `prescription-scanner-project-spec.md`.

Current state: manual entry, confirm/edit UI and export are built. OCR (Tesseract.js for printed prescriptions) is the next phase, and the handwritten drug-name classifier (ONNX in the browser) comes after that.

## Commands

```sh
npm install
npm run dev
npm test              # Vitest unit + component tests
npm run test:e2e      # Playwright; builds and serves on :4173
npm run lint
npm run format:check
npm run typecheck
npm run build
```

Run lint, format check, typecheck and tests before committing. In the Claude Code cloud container Chromium is preinstalled. Run e2e with `PW_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-<version>/chrome-linux/chrome` rather than `playwright install`.

## Architecture

- `src/domain/types.ts`: `Prescription` / `Medication` (raw, as entered or extracted) and `ValidatedPrescription` (what exporters accept).
- `src/domain/dosage.ts`: `parseDosage` returns `ok | unsupported-format | invalid`. Supports `1-0-1` and `1-0-0-1` with whole or half quantities. Text codes (OD/BD/TDS…) return `unsupported-format` for now; add them as another format here without touching the UI.
- `src/domain/validate.ts`: `validatePrescription` yields per-field errors and a `ValidatedPrescription` only when everything is valid.
- `src/export/ics.ts`: RFC 5545 generator with one `RRULE` event per medication per slot, floating local times, escaping and 75-octet folding. Tests round-trip through `ical.js`.
- `src/export/text.ts`: plain-text note.
- `security-headers.ts`: Vite build plugin that injects the CSP `<meta>` and emits `dist/_headers`.
- Future OCR code should output a `Prescription` that pre-fills the existing form. It must not bypass the confirm step.

## Invariants (do not break)

1. **No data egress.** Never add network calls, analytics, error-reporting SDKs or third-party CDNs. The CSP (`connect-src 'self'`) enforces this. Don't loosen it.
2. **Self-host every model and WASM asset.** Tesseract.js, onnxruntime-web and transformers.js fetch from CDNs by default. Point their worker, core and model paths at files served from this site.
3. **Mandatory confirmation before export.** Export requires a valid form and an explicit checkbox, and any edit resets it. OCR guesses must never flow straight into a calendar file.
4. **Dosage format:** only numeric slots are supported at launch. Text codes are deferred, not rejected: keep the friendly "not supported yet" hint.
5. Keep the `// Engineered by uncoalesced` signature at the top of `src/export/ics.ts`.

## Conventions

- TypeScript strict mode with `noUncheckedIndexedAccess`. Keep domain logic pure and framework-free in `src/domain` and `src/export`, with tests next to the code (`*.test.ts`).
- Date-only values are `YYYY-MM-DD` strings. Use the helpers in `src/domain/dates.ts` rather than `Date` locale formatting.
