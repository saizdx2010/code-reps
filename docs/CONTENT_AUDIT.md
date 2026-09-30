# Learning quality audit — 2026-09-30

Reviewed all 29 authored reps across foundations, core exercises, journeys, transfer tasks, and AI-era/frontend/backend/interview content. Reviewed the five paths and four journeys for progression: language foundations precede applications; guided, independent, and recall tasks remain distinct. No rep IDs or learner history keys changed.

## Changes

- Added authored self-review guides for the 14 reps that previously used generic prompts. All 29 now include planning criteria, explanation criteria, and an approach comparison after the attempt.
- Added reference-solution coverage for the 22 reps outside the existing seven-rep AI-era test set. The catalog check requires every rep to have coverage and a complete brief.
- Clarified the empty-error-string rule, supplied Person type, integer inputs for even-number counting, basic Latin character scope, and whitespace-only names in the reading task.
- Made declaration and object-use requirements explicit self-review points because returned-output checks cannot prove those choices.
- Added missing validation, empty-input, normalization, case-sensitivity, and whitespace boundaries. Corrected an empty-array check label.
- Added opt-in input-preservation checks to label transformation, pagination, and frontend interview reps. Correct output accompanied by input changes now fails with an actionable message. Changes undone before returning are outside this check's scope.
- Replaced the backend validation lesson's unguarded property-access example with a guarded unknown-input example.

## Verification

Lint, build/typecheck, all 40 tests, and diff whitespace checks passed. A temporary local server served the built app, its JavaScript entry asset, and the state API successfully without touching learner data.

The audit is an internal content and behavior pass. A manual browser walkthrough of every rep, accessibility testing, cross-platform checks, and learner comprehension/retention validation remain pending. Passing authored checks does not prove the absence of all incorrect solutions or assess the learner's written reasoning.

Next priority: daily practice flow, including explained recommendations, unfinished drafts, and difficult attempts/due reviews.
