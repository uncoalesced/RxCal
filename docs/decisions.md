# RxCal Architecture & Product Decisions

Record of locked architectural, scoping, and interface decisions.

---

## 1. Team & Ownership Split
- **Decision**: 50/50 division of responsibilities between Joel Anthony and Jammy.
- **Rule**: Strict boundary by directories. Joel owns UI/styles/export screen/CSP/deploy; Jammy owns engine/parsers/vocab/eval harness. The shared contract is `src/contract/plan.js`.
- **Status**: Locked.

## 2. On-Device Execution & Privacy Guarantee
- **Decision**: 100% in-browser OCR via self-hosted Tesseract.js WASM and language assets (`/tesseract/*`). Zero requests leave origin post-load.
- **Enforcement**: Playwright network auditing (`e2e/privacy.spec.js`) and strict Content-Security-Policy headers in `public/_headers`.
- **Status**: Locked.

## 3. Scope & Phasing
- **Phase 1**: Printed / e-prescriptions only. Machine-printed date, drug names, dosage slots (`1-0-1`, halves, 4 slots), duration, start-date selector, meal notes, RFC 5545 `.ics` export, plain text export.
- **Phase 2**: Handwritten drug-name matching with closed-vocabulary classification, digit classification, and fuzzy brand-name resolution.
- **Phase 3**: Medical abbreviations (OD, BD, TDS, QID, SOS, HS, STAT), multi-page segmentation, image deskewing/preprocessing.
- **Status**: Locked.

## 4. UI / UX Design Direction
- **Decision**: Apple Human Interface Guidelines aesthetic with light/dark mode support.
- **Tokens**: Neutral greys (`#6E6E73`), midnight blue accent (`#18206F` in light mode, adjusted tint in dark mode).
- **Status**: Locked.

## 5. Calendar Reminder Semantics
- **Decision**: Deferred for in-depth cross-platform testing. Currently defaults to floating local time recurring slots, fixed in `SLOT_TIMES` (`src/contract/plan.js`): 3 slots at 08:00 / 14:00 / 20:00 (morning, afternoon, night); 4 slots at 08:00 / 12:00 / 16:00 / 20:00 (morning, noon, evening, night).
- **Open Action**: Test floating vs UTC vs TZID across Google Calendar, Apple Calendar, and Outlook.
- **Status**: Open / Deferred.

## 6. Synthetic Data Only
- **Decision**: Only synthetic prescriptions allowed in repo test fixtures (`fixtures/`). No actual patient identifiable information or real-world prescription crops without explicit informed consent.
- **Status**: Locked.
