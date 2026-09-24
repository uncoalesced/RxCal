# Project Spec: RxCal

## 1. Problem statement

Patients routinely lose track of prescribed medication schedules because the source of truth — the paper prescription — is illegible (doctor's handwriting), easy to misplace, and disconnected from any reminder system. Existing digital solutions either require manual re-entry (tedious, error-prone) or route a photo of a prescription through a cloud API (a privacy non-starter for a document that is inherently PHI-adjacent, even for a personal-use app).

**What this project builds:** a no-login website where a user photographs or uploads a prescription, and the page — running entirely client-side, no image or extracted data ever leaving the browser — extracts (a) the date, (b) the medication name(s), and (c) the dosage schedule, then lets the user export the result as a calendar file (`.ics`) or a plain-text note.

## 2. Assumptions flagged upfront

These are judgment calls I'm making explicit rather than silently baking in:

- **Assumption A — vocabulary source:** NLEM 2022 (India's National List of Essential Medicines, 384 generic-name drugs across 27 therapeutic categories) is the base vocabulary, per your choice. Flagging a real gap this creates: **NLEM lists generic names, but Indian prescriptions are overwhelmingly written in brand names** (a doctor writes "Crocin," not "Paracetamol"). A generic-only vocabulary will fail on the majority of real handwritten prescriptions. Section 6 below proposes a brand-name augmentation layer to close this gap — treat that as part of the scope, not an afterthought.
- **Assumption B — dosage format:** you specified the `1-0-1` numeric slot format (morning-afternoon-night) as the target. Real Indian prescriptions also commonly use text abbreviations (OD, BD, TDS, QID, SOS, HS, STAT) instead of or alongside the numeric format. I've scoped numeric-slot parsing as the MVP and abbreviation parsing as a Phase 2 item — flag if you want it in scope from day one instead.
- **Assumption C — "prescription" means a single-page, single-visit document** with one date, one to a handful of medications, and one dosage line per medication — not a multi-page hospital discharge summary. If the real target document is messier than this, the segmentation step (Section 5) gets meaningfully harder.
- **Assumption D — hosting is static** (Cloudflare Pages, GitHub Pages, Netlify, or Vercel static export) since there is no backend by design. All of these have generous free tiers suitable for a portfolio project.

## 3. Scope — phased

| Phase | Deliverable | Why this order |
|---|---|---|
| **Phase 1 (~2–3 weeks)** | Printed/e-prescriptions only: date, drug name, dosage all machine-printed. Tesseract.js handles this at high accuracy out of the box. | Ships a fully working, demoable v1 fast; de-risks the calendar/export plumbing before touching the hard OCR problem. |
| **Phase 2 (~4–6 weeks)** | Handwritten drug-name matching via closed-vocabulary classification (Section 6) + handwritten numeric dosage/date via a small digit classifier + mandatory confirm/edit UI. | This is where the actual engineering difficulty and the real resume story live. |
| **Phase 3 (stretch, ~2–3 weeks, may not fully land)** | Text-abbreviation dosage codes (OD/BD/TDS/etc.), multi-medication prescriptions, basic deskew/glare correction for phone photos. | Document as "known limitations, here's the plan" if it doesn't fully land — that's honest engineering, not a failure to hide. |

Total: 8–12 weeks solo, matching your 1–3 month portfolio-project window.

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Static site (React + Vite, hosted on Cloudflare Pages)  │
│                                                           │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │ Upload/     │──▶│ Preprocess   │──▶│ OCR pipeline  │  │
│  │ camera      │   │ (Canvas/     │   │ (3 tracks,    │  │
│  │ capture     │   │  OpenCV.js   │   │  Section 6)   │  │
│  │ (no server) │   │  WASM)       │   └───────┬───────┘  │
│  └─────────────┘   └──────────────┘           │          │
│                                                ▼          │
│                                    ┌───────────────────┐  │
│                                    │ Confirm/edit UI    │  │
│                                    │ (mandatory step)   │  │
│                                    └─────────┬─────────┘  │
│                                              ▼             │
│                                  ┌───────────────────────┐│
│                                  │ .ics / .txt export    ││
│                                  │ (client-generated,    ││
│                                  │  no login required)   ││
│                                  └───────────────────────┘│
└─────────────────────────────────────────────────────────┘
        No network request after initial page + model load.
```

- **Frontend:** React + Vite, per your choice. (VERT uses SvelteKit — the "fully local, WASM-in-the-browser" pattern transfers regardless of framework; React just means more familiar tooling for you and a wider hiring-audience recognition of the stack.)
- **Preprocessing:** Canvas API for basic crop/contrast; OpenCV.js (WASM) if deskew/binarization turns out to be necessary in Phase 3.
- **Inference runtime:** `onnxruntime-web` (loaded via `@huggingface/transformers` for convenience) for all ML models. Models are quantized (int8) and cached via the browser Cache API/IndexedDB after first load — the same pattern VERT uses for its own multi-ten-MB WASM binaries, so a 10–20 MB model bundle is proportionate, not exceptional, for this class of app.
- **No backend, no database, no analytics that phone home.** The privacy claim has to be literally true, not just marketed — this is worth stating explicitly in the README as a design constraint, not a slogan.

## 5. Drug vocabulary — sourcing plan (addressing Assumption A)

1. **Base layer:** NLEM 2022's 384 generic names (Ministry of Health and Family Welfare publication — available as a PDF; you'll need to manually transcribe or scrape it into a structured list, since it isn't distributed as CSV/JSON as far as I could confirm).
2. **Brand-name augmentation layer (necessary, not optional):** map common Indian brand names to their NLEM generic entry, so the classifier can recognize what's actually written on a prescription. Sourcing options, roughly in order of effort vs. coverage:
   - Manually curate a few hundred high-frequency brand↔generic pairs (Crocin↔Paracetamol, Augmentin↔Amoxicillin+Clavulanate, etc.) — fastest to start, limited coverage.
   - Look for an existing open Indian brand-name/generic-name dataset (several exist on Kaggle under names like "Indian medicine dataset" — verify licensing before use, and validate a sample against a pharmacology reference before trusting it wholesale, since crowd-scraped medicine datasets vary in quality).
3. **Vocabulary size management:** a few hundred to ~1,000 entries (base + common brands) keeps the closed-set classifier small and the confusion space tractable. Don't try to cover every drug in India in v1 — cover the common ones and let the confirm/edit UI handle misses gracefully (show "not recognized — type manually" as a first-class path, not a failure state).

## 6. OCR pipeline — three tracks, not one

This is the core technical decision, and it's worth restating why: **open-vocabulary transcription of doctor handwriting is not a solved problem** even for dedicated research models — a compact general handwriting model (10 MB, int8) on *clean, cooperative* modern handwriting still runs ~8% character error rate, and doctor's prescriptions are harder than that baseline on every axis (idiosyncratic scrawl, abbreviations, phone-camera glare/skew instead of clean scans). Published work on this exact problem doesn't attempt free transcription — it reframes handwritten-medicine reading as **classification against a known drug list**, and gets meaningfully better (published results: ~83–97% depending on split) precisely because it isn't solving general handwriting recognition.

| Field | Track | Approach |
|---|---|---|
| **Medication name** | Closed-set classification | Crop the word region → small CNN/embedding model → nearest-match against the drug vocabulary from Section 5 → show top-3 candidates with confidence scores |
| **Dosage (numeric, `1-0-1`)** | Structured pattern recognition | Format space is tiny (digits 0–2, separated by dashes, three slots) — a lightweight digit classifier or even careful template matching is enough; don't over-build this part |
| **Date** | Printed: Tesseract.js. Handwritten: same digit-classifier approach as dosage | Digits are far more tractable than cursive words either way |

**Non-negotiable: a confirm/edit screen before any export.** Never auto-commit an OCR guess for a medication schedule into a calendar entry. Show the top-3 candidates for the drug name; let the user tap the correct one or type a manual correction. This isn't a workaround for model weakness — it's the same human-in-the-loop principle that should govern any tool touching medication information, full stop.

## 7. Calendar / notes export

`.ics` generation, entirely client-side, no login, no API:

```javascript
// Engineered by uncoalesced
function generateICS({ medication, dosageSlots, startDate, durationDays }) {
  // dosageSlots example: [true, false, true] for "1-0-1" (morning, afternoon, night)
  const slotTimes = ['08:00', '14:00', '20:00'];
  const events = [];

  for (let day = 0; day < durationDays; day++) {
    dosageSlots.forEach((take, i) => {
      if (!take) return;
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      const [hh, mm] = slotTimes[i].split(':');
      date.setHours(Number(hh), Number(mm), 0, 0);

      events.push([
        'BEGIN:VEVENT',
        `DTSTART:${toICSDate(date)}`,
        `SUMMARY:Take ${medication}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'));
    });
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function toICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
```

This `.ics` file downloads directly and opens in Google Calendar ("Import"), Apple Calendar, or Outlook without any OAuth flow — keeping the no-login promise intact for the core feature. A direct Google Calendar API push (requires OAuth, hence a login) is a reasonable **optional, clearly-labeled v2 feature**, not part of the core flow, since it would otherwise contradict the app's central privacy pitch.

A parallel plain-text/Markdown note export is close to free once the structured data exists — same function, different serializer.

## 8. Privacy / threat model (worth writing into the README verbatim)

- The prescription image never leaves the browser tab: no `fetch`/`XHR` call carries image bytes or extracted text anywhere.
- No analytics, no error-reporting SDK that phones home with any user content (if you add crash reporting, scrub to stack traces only, never payloads).
- Extracted data lives in memory / browser storage (IndexedDB) only until the user exports it or closes the tab — no persistence layer under your control at all, by design, not by policy.
- This is a genuinely strong, verifiable claim (a reviewer can open DevTools' Network tab and confirm zero outbound requests carrying prescription content) — which is exactly the kind of auditable privacy story that reads well against the healthcare-AI hiring signals from the earlier research (traceability, PHI-safety-by-construction, no data egress).

## 9. Evaluation plan (make this the headline, same principle as any ML project)

Build a small hand-labeled test set — even 30–50 real or realistic mock prescriptions (printed + handwritten mix) with ground-truth date/drug/dosage — and report against it:

- **Drug-name classification:** top-1 and top-3 accuracy against the gold labels, broken out by printed vs. handwritten.
- **Dosage/date extraction accuracy:** exact-match rate on the structured fields.
- **"Unknown, needs manual entry" rate:** how often the classifier correctly abstains instead of guessing wrong — an honest metric, not a vanity one.
- **Correction rate at the confirm/edit step:** what fraction of auto-extracted fields the user had to fix — this is arguably the single most honest end-to-end metric for a tool like this.
- **Latency:** time from image upload to first result, entirely client-side (worth reporting p50/p95 across a couple of device classes if you can test on more than one machine).

Report these as an honest ablation (printed-only baseline → + handwritten drug-name classifier → + digit classifier) rather than one blended number — same principle as the eval discipline in the earlier medical-AI research brief.

## 10. How this maps to real job requirements

This project demonstrates a genuinely different (and currently less crowded) skill cluster than another cloud-RAG chatbot: **on-device/edge ML engineering, browser-based WASM deployment, and privacy-by-construction system design.** These map to real, current hiring categories: ML engineers building on-device inference (mobile/web), privacy engineers, and healthcare-adjacent roles that explicitly value "no PHI transmission" as a design property rather than a compliance afterthought. Pair it with the earlier RAG/agent-eval project in your portfolio and you cover both ends of the 2026 AI-engineering skill spectrum — server-side agentic systems *and* constrained, on-device ML — which is a more complete story than either alone.

## 11. Resume-ready impact framing (credible, self-measured — not fabricated)

Draft bullet shape once you have real numbers from Section 9:

> "Built a fully client-side prescription-scanning tool (React, ONNX Runtime Web) achieving [X]% top-3 medication-match accuracy on a [N]-prescription handwritten test set, with zero server-side data transmission — verified via network-traffic audit."

Fill in `[X]` and `[N]` only once measured; don't estimate them now.

## 12. Doctor / medical-student validation questionnaire

Purpose: validate the actual pain point and surface constraints before building further, the same way the earlier project's questionnaire was meant to. Ask these to a handful of practicing doctors and medical students.

**On the real-world problem:**
1. In your own practice (or observed clinical rotations), how often do patients come back confused about their dosage schedule, and is illegible handwriting typically the cause, or something else (language barrier, memory, multiple prescribers)?
2. Do you already write dosage using the numeric slot format (e.g., 1-0-1), text abbreviations (OD/BD/TDS/SOS), or a mix — and does that vary by specialty or by hospital vs. private practice?
3. Roughly what fraction of prescriptions you write or see are fully handwritten vs. printed/e-prescription today, and do you expect that ratio to shift in the next few years?

**On trust and adoption:**
4. If a patient used a phone app to auto-read your handwriting into a reminder, would you want a "verify before trusting" step to be visible to the patient, or would that undermine confidence in the tool?
5. What would make a demo of a tool like this credible to you as a clinician — a live handwriting test in front of you, a reported accuracy number, something else?
6. Are there specific medications or dosage patterns (e.g., titrating doses, PRN/as-needed, controlled substances) where you'd actively *not* want an automated tool making scheduling suggestions, even with a confirm step?

**On data and privacy:**
7. Does the "100% on-device, nothing uploaded" design meaningfully change how comfortable you'd be recommending this to a patient, or is that a distinction patients wouldn't notice/care about?
8. Are there hospital or clinic policies you're aware of that would restrict patients from photographing prescriptions at all, or restrict what apps they're allowed to use for this?

**On scope and edge cases:**
9. How often do prescriptions in your experience list more than one medication with different schedules, and would a tool that only handles one medication cleanly per pass still be useful, or is multi-drug support a hard requirement to be worth using?
10. Is there a standard/common Indian drug-name reference (brand or generic) you'd trust as a base vocabulary for something like this, beyond NLEM?

```
Copy the above questions as-is or trim to the 4–5 most relevant per person — a 10-question survey is a lot to ask a busy clinician in one sitting.
```

## 13. Risks / open questions to revisit as you build

- Brand-name vocabulary coverage (Section 5) is the single biggest unknown — validate it early with a handful of real prescriptions before committing to the full pipeline.
- Multi-medication prescriptions (several drugs, several schedules, on one page) add real segmentation complexity beyond what's scoped in Phase 1–2; Q9 in the questionnaire is aimed at finding out whether this is even necessary for v1 to be useful.
- Phone-camera photos (glare, skew, shadows, non-flat paper) are a meaningfully harder input than scanned images — Phase 3's deskew/binarization step exists because of this, and it may need more time than allocated if real photos turn out messier than expected.
