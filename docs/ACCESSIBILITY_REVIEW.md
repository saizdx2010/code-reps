# Accessibility and learner review

Automated Chromium checks exercise keyboard practice steps, focus after navigation and preview-modal exit, editor Tab exit, draft preservation, and no horizontal page overflow on selected 320px and 390px flows. They also exercise reduced motion on the narrow validation task. These checks do not establish assistive-technology support or browser zoom behavior.

## Manual walkthrough still required

Use a fresh local profile, keeping any exported work on the learner's machine. Record browser, operating system, zoom, and assistive technology with each result.

- With only the keyboard, choose a starting point, open a path, write a plan, edit code, inspect a failed check, explain, and complete an attempt. Confirm focus stays visible and the editor can be exited.
- Open and close Commands, Glossary, Profiles, Tools, and an expanded frontend preview. Confirm labels, focus containment where applicable, Escape, and focus restoration.
- At 200% browser zoom and on a short window, confirm navigation, save feedback, Run/Stop, task text, and completion controls remain reachable. Check overflow inside the code editor separately from page overflow.
- With VoiceOver or another available screen reader, read headings and landmarks, identify every input, inspect check results, and hear save/error feedback. Confirm the names and states of disclosures and selected practice steps.
- Trigger editor loading failure and confirm the plain text recovery editor remains labelled, preserves the draft, and allows running checks.
- Review text contrast and focus contrast, including muted labels, disabled recall actions, selected steps, and editor syntax colors. Do not infer contrast approval from a screenshot alone.

## Observe the validation journey

Use [the existing learner protocol](./LEARNER_VALIDATION.md) with `backend-validate-user` → `validate-stock-adjustment` → `parse-delivery-window`. Ask learners to explain normalization, an exact boundary, absent versus invalid values, and which conflicting error wins. Let them request hints themselves.

After at least three days, offer the delivery-window task from a fresh start. Later, use `validate-import-batch` to observe normalized duplicate detection and all-or-nothing output. Record contract confusion, hint use, reasoning, and explanation independently. Automated early-recall rejection validates scheduling rules; it does not prove people retained or transferred the skill.

No participant sessions, screen-reader walkthrough, zoom review, or manual contrast review have been completed as part of this engineering batch.
