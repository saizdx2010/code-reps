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

## Depth pass — 2026-10-01 (content v2)

Expanded all 47 current reps with authored post-check reasoning, a concrete boundary trace, an approach comparison, a counterexample or separately observed failure, and an optional transfer variation. Coverage includes the five foundations, independent and recall exercises, practical transfer tasks, richer formats, interview tasks, and both multi-file projects. Added a deeper example and a prediction/repair/reasoning challenge with a separately revealed discussion to all 14 knowledge lessons.

The existing prompts, checked lesson answer identities, rep IDs, and learner history keys are preserved. Solution reasoning is shown only inside the existing comparison reveal after checks pass. Transfer variations and lesson discussions are explicitly self-reviewed; their completion is not recorded as checked mastery. The authoring guide now specifies this standard for future content, and catalog validation rejects missing depth fields and unknown targets.

Verification: content validation, lint, build/typecheck, all 107 tests, and whitespace checks passed. Coverage tests also exercise missing, blank, and orphaned depth entries. These structural checks cannot establish editorial quality or comprehension. A browser walkthrough and learner validation of the expanded material were not performed in this pass.
