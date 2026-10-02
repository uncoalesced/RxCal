# Delegation Guide: Jammy

Welcome Jammy! This document outlines your workspace setup, folder ownership, roadmap tasks, and communication protocols for **RxCal**.

---

## 1. Quick Setup

```bash
git clone https://github.com/uncoalesced/RxCal.git
cd RxCal
npm install
npm test
PW_CHANNEL=chrome npm run e2e
```

---

## 2. Your Territory (Engine & Data)

You own the following directories and files:
- `src/engine/` (`parse.js`, `match.js`, `ics.js`, `text.js`, `ocr.js`, and their test suites)
- `data/vocab/` (`seed.json`, `nlem.json`)
- `scripts/make-fixtures.js` & `fixtures/`
- `e2e/eval.spec.js`

### Boundary Seam: `src/contract/plan.js`
- This defines the shape of OCR scan results and confirmed medication plans.
- If you need to change field names or types in `plan.js`, **ask Joel before modifying**.

---

## 3. Jammy's Backlog & Task Order

### Priority 1: NLEM 2022 Vocabulary
- Transcribe/format all 384 NLEM 2022 generic names into `data/vocab/nlem.json`.
- Add an automated test asserting `Object.keys(nlem).length === 384`.

### Priority 2: Brand-to-Generic Seed Expansion
- Expand `data/vocab/seed.json` with common Indian brand names mapped to generics (e.g., Crocin &rarr; Paracetamol, Augmentin &rarr; Amoxicillin + Clavulanic Acid, Dolo 650 &rarr; Paracetamol).
- Verify each entry against standard pharmacology sources.

### Priority 3: Calendar Reminder Time Semantics
- Research and test how Google Calendar, Apple Calendar, and Outlook interpret floating time vs UTC vs explicit TZID for recurring medication alarms.
- Document conclusions in `docs/decisions.md`.

### Priority 4: Parser Hardening & Edge Cases
- Add test cases in `src/engine/parse.test.js` for unusual slot notations (e.g. `1/2 - 0 - 1/2`, `1+0+1`, `OD`, `BD`).
- Keep all unit tests passing (`npm test`).

---

## 4. When to Ask Joel

Copy and send these prompts whenever you need alignment:

> **On Contract Changes**:  
> *"Hey Joel, I need to add/modify the `<field_name>` field in `src/contract/plan.js` to support `<reason>`. Will this break any UI components in `src/ui/`?"*

> **On Reminder Semantics**:  
> *"Hey Joel, I tested `.ics` export on Google/Apple Calendar. Here are the findings on floating vs UTC alarms: `<findings>`. Should we lock floating local time as default?"*

> **On Phase 2 Datasets**:  
> *"Hey Joel, I surveyed the handwritten prescription dataset from Kaggle. The licence is `<licence>` and it contains `<count>` samples. Shall we proceed with synthetic crops or use this?"*
