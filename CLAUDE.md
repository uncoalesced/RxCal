# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RxCal: a no-login, fully client-side web app that turns a prescription into calendar reminders (`.ics`) or a text note. React 19 + TypeScript (strict, `noUncheckedIndexedAccess`) + Vite, deployed as a static site on Cloudflare Pages (build `npm run build`, output `dist`, `NODE_VERSION=22`). The full design and phased roadmap are in `prescription-scanner-project-spec.md`.

Current state: manual entry, the confirm/edit UI and export are built. Next comes OCR for printed prescriptions (Tesseract.js). After that, a handwritten drug-name classifier and a digit classifier (ONNX via onnxruntime-web). Text dosage codes (OD/BD/TDS…) come post-launch.

## Commands

```sh
npm run dev                                   # dev server (no CSP in dev, see below)
npm test                                      # all Vitest unit + component tests
npx vitest run src/domain/dosage.test.ts      # one test file
npx vitest run -t "parses half doses"         # tests matching a name
npm run test:e2e                              # Playwright: builds, serves on :4173, runs e2e/
npx playwright test e2e/export.spec.ts        # one e2e file
npm run lint && npm run format:check && npm run typecheck
npm run build                                 # tsc -b && vite build → dist/ (includes _headers)
```

CI (`.github/workflows/ci.yml`) runs lint, format check, typecheck, unit tests and build in one job, and Playwright in another. In the Claude Code cloud container Chromium is preinstalled under `/opt/pw-browsers`. Don't run `playwright install`; set `PW_CHROMIUM_EXECUTABLE` to the `chrome` binary there (`playwright.config.ts` reads it).

## Architecture

The data flow runs across a few files:

1. **State** lives in `src/App.tsx`: `Prescription`, start date, reminder times, photo, and the `confirmed` flag. Every form setter is wrapped by `edit()`, which resets `confirmed`. That is how "any edit requires re-confirmation" is enforced.
2. **Validation** runs on every render (`useMemo`). `validatePrescription` (`src/domain/validate.ts`) returns per-medication field errors keyed by medication id, which the form shows inline and `ExportPanel` lists. It returns a `ValidatedPrescription` only when there are zero errors.
3. **Export** functions (`generateICS`, `generateTextNote` in `src/export/`) accept only `ValidatedPrescription`. The type system therefore stops unvalidated data from reaching a file. `downloadFile` saves the result through a Blob URL.

Key design points:

- **Raw vs parsed:** `Medication.dosage` stores the raw text as written or OCR'd. It is parsed with `parseDosage` (`src/domain/dosage.ts`) at validation and display time, which returns `ok | unsupported-format | invalid`. Text codes currently return `unsupported-format` with a friendly hint. Add support by extending `parseDosage`; the UI already handles all three states.
- **Slots:** `SLOT_PATTERNS` in `src/domain/types.ts` maps `3-slot` (morning-afternoon-night) and `4-slot` (adds evening). Slot labels, default reminder times (08:00/14:00/18:00/21:00) and the reminder-times editor are all keyed by `SlotId`.
- **`.ics` output** (`src/export/ics.ts`): one `VEVENT` per medication per non-zero slot with `RRULE:FREQ=DAILY;COUNT=<days>`. `DTSTART` uses floating local time (no `Z`/`TZID`, intentional), with a `-PT10M` display alarm. `UID` is `<medicationId>-<slot>@rxcal`. Output uses RFC 5545 text escaping and 75-octet UTF-8-safe folding.
- **CSP** comes from `security-headers.ts`, a build-only Vite plugin. It injects a `<meta>` CSP into `index.html` and emits `dist/_headers` for Cloudflare Pages. Dev mode has no CSP (HMR needs inline scripts and a websocket), so check privacy behaviour against `npm run preview` or the e2e test, which asserts no request leaves the origin.
- **OCR integration (future):** OCR should produce a `Prescription` that pre-fills the existing form. It must not bypass the confirm step.

Tests: domain and export tests sit next to the code. `src/export/fixtures.ts` holds the shared sample prescription (includes `,` `;` `\` and `½` to exercise escaping). The ICS tests round-trip through `ical.js` (dev-only dependency). `src/App.test.tsx` mocks `./export/download` and drives the form with Testing Library.

## Invariants (do not break)

1. **No data egress.** No network calls carrying user data, no analytics or error-reporting SDKs, no third-party CDNs. Don't loosen `connect-src 'self'` in `security-headers.ts`.
2. **Self-host every model and WASM asset.** Tesseract.js, onnxruntime-web and transformers.js fetch from CDNs by default. Point their worker, core and model paths at files served from this site, or the CSP will block them.
3. **Mandatory confirmation before export.** Export requires a valid form plus the explicit checkbox. OCR guesses must never flow straight into a calendar file.
4. **Dosage format at launch is numeric only** (`1-0-1`, `1-0-0-1`, halves). Text codes are deferred, not rejected: keep the "not supported yet" hint.
5. Keep the `// Engineered by uncoalesced` signature at the top of `src/export/ics.ts`.

Date-only values are `YYYY-MM-DD` strings throughout. Use the helpers in `src/domain/dates.ts` (UTC arithmetic, locale-free formatting) rather than `Date` locale methods.
