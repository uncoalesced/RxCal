# Jammy's Delegation Hub - RxCal

Welcome Jammy! This folder contains everything you need to start development on **RxCal**.

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

## 2. Territory & Folder Boundaries (Engine & Data)

You own the engine and data pipeline:
- `src/engine/` (`parse.js`, `match.js`, `ics.js`, `text.js`, `ocr.js`, and their test suites)
- `data/vocab/` (`seed.json`, `nlem.json`)
- `scripts/make-fixtures.js` & `fixtures/`
- `e2e/eval.spec.js`

### Shared Seam: `src/contract/plan.js`
- Defines the data schema between OCR scanning and the confirm/export UI.
- If you need to change field names or types, **align with Joel first**.

---

## 3. Jammy's Task Backlog

- [ ] **NLEM 2022 Vocabulary**: Format all 384 NLEM generic names into `data/vocab/nlem.json` with an automated count test (`=== 384`).
- [ ] **Brand-to-Generic Seed Expansion**: Expand `data/vocab/seed.json` with common Indian brand names mapped to generics (Crocin, Augmentin, Dolo 650, etc.).
- [ ] **Reminder Time Semantics Research**: Test how Google, Apple, and Outlook calendars handle floating time vs UTC recurring alarms, and document in `docs/decisions.md`.
- [ ] **Parser Hardening**: Add test cases for complex slot notations (`1/2 - 0 - 1/2`, `1+0+1`, `OD`, `BD`) in `src/engine/parse.test.js`.

For detailed communication prompts, see [`docs/DELEGATION-JAMMY.md`](../docs/DELEGATION-JAMMY.md).
