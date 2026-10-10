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

## Contract consistency pass — 2026-10-05

Clarified the exact sentence templates in the basic-types and object reps, changed the open-ticket title to say “at or above,” and documented basic Latin input and JavaScript string length for both long-word reps. Rep IDs and existing expected answers remain unchanged.

Added checks for uppercase suffix normalization, ordinary undo strings with different case or surrounding whitespace, and paging size lower bounds, fractions, numeric strings, and the minimum valid size. Regression coverage runs known incorrect solutions against the authored checks to ensure these omissions cannot silently return.

Content validation, lint, the full Node suite, build/typecheck, and all 28 Chromium browser-flow tests passed. The browser suite covers existing app flows; it does not provide a manual walkthrough of each edited rep or establish learner comprehension or retention.

## Depth pass — 2026-10-01 (content v2)

Expanded all 47 current reps with authored post-check reasoning, a concrete boundary trace, an approach comparison, a counterexample or separately observed failure, and an optional transfer variation. Coverage includes the five foundations, independent and recall exercises, practical transfer tasks, richer formats, interview tasks, and both multi-file projects. Added a deeper example and a prediction/repair/reasoning challenge with a separately revealed discussion to all 14 knowledge lessons.

The existing prompts, checked lesson answer identities, rep IDs, and learner history keys are preserved. Solution reasoning is shown only inside the existing comparison reveal after checks pass. Transfer variations and lesson discussions are explicitly self-reviewed; their completion is not recorded as checked mastery. The authoring guide now specifies this standard for future content, and catalog validation rejects missing depth fields and unknown targets.

Verification: content validation, lint, build/typecheck, all 107 tests, and whitespace checks passed. Coverage tests also exercise missing, blank, and orphaned depth entries. These structural checks cannot establish editorial quality or comprehension. A browser walkthrough and learner validation of the expanded material were not performed in this pass.

## Rep and lesson audit — 2026-10-09 (catalog of 83 reps, 34 lessons)

Read-only pass against [Content authoring](./CONTENT_AUTHORING.md). No source files changed. Every rep and knowledge lesson, with its depth entry, was read line by line. Reflection guides were checked by the existing coverage test (every rep has one) but not reviewed sentence by sentence. Evidence is cited as `file:line`. Counts in the earlier sections above are historical and no longer match the catalog.

The findings and scores below preserve the original audit snapshot. **Status (updated)** notes were checked against the current implementation on 2026-10-09; historical line references may have moved. Fixed means the named editorial change is present, not that learner comprehension or retention has been validated.

### Method and verification

- **Automated checks run on this branch:** `tests/content.test.mjs` 74/74 pass; `tests/trace-depth.test.mjs` and `tests/trace-content.test.mjs` 9/9 pass; `scripts/validate-content.mjs` (content:check) passes: 34 lessons, 68 interactive checks, 83 exercises. To run tests, the worktree's `node_modules` was symlinked to the main checkout (git-ignored).
- **Not run:** lint, build, Playwright, and browser walkthroughs. Nothing in the app changed, so the browser checks do not apply. Readability and quality scores are reviewer judgments. The automated checks prove that reference solutions match the checks. They do not show that the prompts are clear or that the checks cover the contract.

### Scoring

- **5** — Meets every standard item with specific, progressive content.
- **4** — Meets the standard; one minor weakness.
- **3** — Meets the structure but has a notable gap: a final hint that is the answer, a generic plan prompt or placeholder vocabulary, a dense or ambiguous prompt, or a contract detail that is not stated.
- **2** — Multiple gaps. A learner can pass without the target skill, or a fact the prompt depends on is not visible to the learner.
- **1** — Fails the standard. None found.

Systemic patterns, scored into the tables below:

1. **Placeholder vocabulary.** 30 reps use the skill title, "Ownership", or "Contract | Boundary" as their vocabulary (19 practical, 11 fluency) (for example `src/practical-concepts.ts:1102`, `src/fluency-reps.ts:151`). These do not explain terms.
2. **Generic plan prompts.** 17 reps share one plan prompt, "State the required behavior, trace a boundary case, and describe the state you need before coding." (`src/practical-concepts.ts:1108` and 16 others).
3. **Final hint equals the solution.** Common in foundations, DSA, and several core reps. A last hint that names the complete algorithm does not stage help; it removes the retrieval step.
4. **Prescriptive prompts in DSA reps.** The collection prompts tell the learner which API to use (`src/dsa-reps.ts:8`). Output checks cannot test that choice, and the self-review carries it.
5. **Dense prompts.** Eight prompts exceed 70 words and read as one paragraph. Ranked by length: `validate-import-batch` (116), `parse-delivery-window` (93), `search-request-state` (90), `backend-ticket-handler` and `project-ticket-api` (86 each), `preview-slot-results` (83), `refresh-report-state` (79), `catalog-request-summary` (72).
6. **Jargon in learner-facing text.** Examples: "draining checkpoint" (`src/practical-concepts.ts:190`), "unmatched open" (`src/practical-concepts.ts:3268`), "JavaScript string length" (`src/rep.ts:155`), "reference-keyed bookkeeping" (`src/practical-concepts.ts:3223` lesson reasoning), "trace wrapper" (`src/practical-concepts.ts:3205`).

### Reps — core (`src/rep.ts`)

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| most-frequent-number | src/rep.ts:31 | 4 | Hint 2 spells the whole tie rule: "Update it when a count is higher, or when counts tie and the new number is smaller." (line 43). Hint 3 names the structure. |
| first-unique-character | src/rep.ts:56 | 4 | Hint 3 names `Map<string, number>` and the second pass (line 69). Case rule and character set are stated (line 61). |
| balanced-brackets | src/rep.ts:81 | 4 | Good trace prose exists in `src/rep-depth.ts:118`, but there is no `traceSteps`. Hint 3 "Use an array as a stack" (line 94) names the structure. |
| sum-positive-numbers | src/rep.ts:106 | 4 | The note never says values may be decimal, but check "Handles decimals" (line 117) depends on it. Add "Values may be decimals." |
| count-even-numbers | src/rep.ts:121 | 4 | Hint 2 "A number is even when number % 2 is zero" (line 126) is close to the answer. Contract is clear. |
| count-above-threshold | src/rep.ts:134 | 4 | Strong equality boundary (line 137). Numeric domain not stated, though check line 149 uses decimals. |
| first-long-word | src/rep.ts:153 | 4 | Note line 155 packs four rules into one sentence and uses the jargon "JavaScript string length". |
| count-words | src/rep.ts:166 | 4 | Prompt never defines "whitespace"; only the note does (line 168). Hint 3 gives the method: "split on one or more whitespace characters" (line 172). |
| has-duplicate | src/rep.ts:180 | 4 | Hint 3 names a Set (line 185). Otherwise clean. |
| missing-number | src/rep.ts:193 | 4 | Hint 3 gives the formula: "Subtract the sum of the supplied numbers." (line 199). Contract and checks agree (`n` equals array length). |
| valid-parentheses | src/rep.ts:207 | 3 | Hint 3 is the full algorithm: "Reject if the count goes below zero; accept only if it ends at zero." (line 213). Overlaps `balanced-brackets` (same category, same bracket theme). |

### Reps — foundations (`src/foundations.ts`)

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| declare-variables | src/foundations.ts:38 | 2 | The lesson goal (const vs let) is not checked; the note says so (line 41). Hint 2 is the code: `const greeting = "Hello, " and let message = greeting + name` (line 46). |
| basic-types | src/foundations.ts:54 | 3 | Hint 3 is the exact return expression (line 62). |
| create-objects | src/foundations.ts:70 | 3 | Hints 1 and 3 are code (line 78). Object use is unverifiable (the note admits it, line 73). |
| make-arrays | src/foundations.ts:86 | 3 | Hint 2 is code: "If names.length === 0, return null." (line 94). Hint 3 is the answer. |
| write-functions | src/foundations.ts:103 | 3 | Hint 3 is the answer: "Return price * quantity." (line 111). The decimal check (line 115) has no stated numeric domain. |

### Reps — AI-era, frontend, backend, interview (`src/ai-era-reps.ts`)

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| verify-generated-code | src/ai-era-reps.ts:50 | 4 | Draft behavior is stated (line 51). Hint 3 is close to the full answer (line 58). |
| frontend-visible-items | src/ai-era-reps.ts:68 | 4 | Prompt does not define the case-folding scope for "without case sensitivity" (line 69). |
| frontend-view-state | src/ai-era-reps.ts:88 | 4 | Precedence is clear (line 89). Note defines error and count domains (line 91). |
| backend-validate-user | src/ai-era-reps.ts:106 | 4 | Hint 2 names `Number.isInteger` (line 114), which is an API hint. Otherwise strong. |
| backend-page-results | src/ai-era-reps.ts:132 | 4 | Hint 3 gives the offset formula (line 140). Clamp rules are explicit. |
| interview-frontend | src/ai-era-reps.ts:151 | 3 | Note says "Clarify the tie rule in your plan" (line 154), but the prompt already fixes the tie rule (line 152). Hint 2 gives the sort recipe (line 159). The clarification step is not part of the prompt. |
| interview-backend | src/ai-era-reps.ts:168 | 3 | The trim-before-split rule appears only in hint 2 (line 176) and depth (`src/rep-depth.ts:99`), not in the contract (line 169). "nonblank text on both sides" does not say whether sides are trimmed. |

### Reps — journeys and transfer (`src/journey-reps.ts`, `src/transfer-reps.ts`)

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| count-long-words | src/journey-reps.ts:5 | 4 | Hint 2 gives the comparison (line 13). Note is dense but accurate (line 8). |
| first-repeated-number | src/journey-reps.ts:24 | 4 | Hint 2 is almost the algorithm (line 32). Second-occurrence rule is well stated. |
| remove-adjacent-pairs | src/journey-reps.ts:43 | 4 | Hints 2 and 3 (line 51) give the stack algorithm. Strong candidate for a visual trace. |
| repair-visible-count | src/transfer-reps.ts:5 | 4 | Hint 2 names the bug: "The exclamation mark reverses a boolean." (line 12). Right size for a debugging rep. |
| read-unique-names | src/transfer-reps.ts:21 | 3 | Hint 3 is the entire fix: "Return names directly." (line 28). |
| transform-active-labels | src/transfer-reps.ts:40 | 4 | Hint 3 gives `trimmed.toUpperCase()` (line 47). Contract explicit. |

### Reps — rich exercises and capstones (`src/rich-reps.ts`, `src/capstone-reps.ts`)

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| debug-cart-total | src/rich-reps.ts:14 | 4 | Strong bug story (line 15). Planning asks for regression cases (line 20), but no check verifies them. |
| frontend-directory | src/rich-reps.ts:35 | 3 | 67-word prompt (line 37) packs four states, a filter rule, and a label rule. "Loading…" uses U+2026 (line 37), so typed "Loading..." fails. Note line 39 mentions a "manual review checklist" the app does not provide; acceptance criteria are at line 40. |
| read-batch-labels | src/rich-reps.ts:59 | 2 | The example is check 1: `predictLabels('repeat') => ['Ada', 'Bo']` (line 62, check at line 70). Checks compare four literal arrays, and the note says "You may write each predicted array directly" (line 63), so a learner can pass without tracing. Strong visual-trace candidate. |
| backend-ticket-handler | src/rich-reps.ts:77 | 3 | Example refers to "the supplied three-ticket dataset" (line 80), but the learner never sees it. Checks depend on `tickets[2]` (lines 89–90). The example input is a URL string, while the note says the rep does not parse URLs (line 81). |
| refactor-stock-summary | src/rich-reps.ts:109 | 4 | Zero-unit and duplicate-ID checks are strong. "Use the existing checks" (line 111) assumes learners can see checks that are only revealed on run. |
| project-team-directory | src/capstone-reps.ts:8 | 3 | Prompt and checks are copied from `frontend-directory` (`src/rich-reps.ts:37`). The only data-module contract is one starter comment. |
| project-ticket-api | src/capstone-reps.ts:17 | 3 | Inherits the dataset gap from `backend-ticket-handler`. Starter comment "Validate the query contract in the brief" does not say what `parseQuery` returns for each invalid kind. |

### Reps — validation, browser state, async (`src/validation-reps.ts`, `src/browser-state-reps.ts`, `src/async-reps.ts`)

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| validate-stock-adjustment | src/validation-reps.ts:6 | 4 | Excellent contract and 20 checks. Last hint contains the full regex `/^[A-Z0-9-]{1,12}$/` (hint 3), which is the answer. |
| parse-delivery-window | src/validation-reps.ts:44 | 3 | Note (line 48) says "at most 200 characters" while the prompt says trimmed length 1–80. The contract limit and the test-data limit are not separated. Hint 3 is nearly the code. |
| validate-import-batch | src/validation-reps.ts:81 | 3 | Densest prompt (116 words, line 82). Rule order is one paragraph. The key precedence rule ("Validate the entire row before duplicate detection", line 85) belongs in the prompt. The 24 checks are strong. Strong visual-trace candidate. |
| task-state-label | src/browser-state-reps.ts:8 | 4 | Clean union contract. Hint 3 gives the full mapping (line 48 area). |
| saved-record-status | src/browser-state-reps.ts:35 | 3 | "Saved 1 books" follows from the literal suffix rule (prompt line 37). Deliberate, but awkward plain English. Vocabulary "Acknowledgement" (line 40) is not used by the prompt. |
| catalog-request-summary | src/browser-state-reps.ts:62 | 3 | 72-word prompt. Hint 3 gives the algorithm. Checks are clear. |
| search-request-state | src/async-reps.ts:7 | 3 | 90-word prompt in one paragraph. Twelve checks cover ownership well. Strong visual-trace candidate. |
| preview-slot-results | src/async-reps.ts:38 | 3 | 83-word prompt. "Replacing a present slot keeps its position" is buried. Hint 2 names an insertion-ordered Map. |
| refresh-report-state | src/async-reps.ts:66 | 3 | 79-word prompt. "Stale data" vocabulary is not used in the prompt. Checks are strong. |

### Reps — DSA collections and algorithms (`src/dsa-reps.ts`)

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| ds-array-operations | src/dsa-reps.ts:5 | 3 | Prompt prescribes the API: "Practice declaring number[], copying with spread, appending with push" (line 8). Hint 3 is the full code. |
| ds-set-operations | src/dsa-reps.ts:44 | 3 | Same prescriptive prompt. Hint 3 is the full code. |
| ds-map-operations | src/dsa-reps.ts:83 | 3 | Hint 3 is the full code. The note honestly says "API choice is self-reviewed." |
| ds-stack-operations | src/dsa-reps.ts:126 | 3 | Has `traceSteps` (`src/dsa-reps.ts:393`), the model for others. Hint 3 is the full code. Prompt prescribes push and pop. |
| ds-queue-operations | src/dsa-reps.ts:165 | 3 | Note prescribes "an array with push and shift". Hint 3 is the full code. |
| algo-sorted-pair | src/dsa-reps.ts:211 | 4 | Has `traceSteps` (line 427). Hint 3 gives the full pointer algorithm, which is acceptable here. |
| algo-window-sum | src/dsa-reps.ts:258 | 4 | Has `traceSteps` (line 458). Note says "k is 1 to 101" while the prompt says "positive integer"; state that larger k returns null. |
| algo-binary-search | src/dsa-reps.ts:309 | 3 | No `traceSteps`, the strongest visual-trace candidate. Hint 3 gives the full algorithm and says "use left = middle + 1 for a smaller middle value" ("smaller middle value" is ambiguous). |

### Reps — practical concepts (`src/practical-concepts.ts`)

All 19 reps share the generic plan prompt. Each lacks a task-specific vocabulary term; the only term is the skill title. Line numbers are the rep's `id` line.

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| closure-counters | src/practical-concepts.ts:1093 | 3 | Generic plan (1108); vocabulary is the skill title (1102). The note "review your code to confirm state belongs to the returned closure" is good. |
| reference-groups | src/practical-concepts.ts:1176 | 3 | Note tells learners where to build objects "because the exercise runner copies inputs" — an implementation detail in the contract. Generic plan. |
| event-loop-order | src/practical-concepts.ts:1251 | 3 | "Simplified queue model" note is honest. Generic plan. Example shows the full order. |
| promise-outcomes | src/practical-concepts.ts:1358 | 3 | Prompt: "These are the records after Promise.allSettled has completed" is jargon for a synchronous exercise. Vocabulary is the skill title. |
| singleton-owner | src/practical-concepts.ts:1446 | 3 | Note admits outputs cannot prove the pattern. Hint 3 gives the algorithm. Generic plan. |
| pubsub-trace | src/practical-concepts.ts:1528 | 3 | 55-word prompt with five rules. Checks are strong (five). Strong visual-trace candidate. |
| injected-clock | src/practical-concepts.ts:1677 | 3 | Only three checks. Add a check where the clock is one below the deadline so `false` is tested. |
| debounce-schedule | src/practical-concepts.ts:1756 | 3 | Equality rule ("When an event arrives exactly at a pending deadline…") is hard to parse. Visual-trace candidate. |
| leading-throttle | src/practical-concepts.ts:1870 | 3 | Rule is crisp and checks are good. Generic plan and title vocabulary. |
| latest-request | src/practical-concepts.ts:1954 | 3 | "Obsolete" and "ownership" are not defined for learners. Visual-trace candidate. |
| websocket-gate | src/practical-concepts.ts:2082 | 3 | Clear. Generic plan and title vocabulary. |
| choose-live-transport | src/practical-concepts.ts:2199 | 2 | A three-branch `if`. Hints 1 and 2 state the decision (`src/practical-concepts.ts:2218`). No reasoning evidence beyond self-review. Consider a third requirement that changes the answer. |
| shared-resource | src/practical-concepts.ts:2259 | 3 | Clear transitions. Vocabulary title is long. |
| cache-freshness | src/practical-concepts.ts:2376 | 3 | Strict-boundary rule and five checks are strong. Title vocabulary. |
| retry-backoff | src/practical-concepts.ts:2473 | 3 | Formula and checks are clear. Hint 3 is the formula. |
| idempotent-ledger | src/practical-concepts.ts:2549 | 3 | Clear first-amount rule. Hint 1 names the Map. Title vocabulary. |
| optimistic-balance | src/practical-concepts.ts:2667 | 3 | 56-word prompt. "Pending" and "displayed" need definitions for a learner. Title vocabulary. |
| subscription-cleanup | src/practical-concepts.ts:2808 | 3 | Vocabulary "Ownership" (line 2819). Note "Inputs are valid under the stated contract." (line 2816) does not say which inputs are valid. |
| room-leases | src/practical-concepts.ts:2932 | 3 | Vocabulary "Ownership" (line 2943). Same generic note (line 2940). Structurally a copy of `subscription-cleanup`, so weak as a recall variant. |

### Reps — fluency recall pool (`src/fluency-reps.ts`)

All 11 use the placeholder vocabulary "Contract | Boundary" (for example line 151). These reps are the recall pool in `src/fluency.ts:42–51`.

| Rep | File:line | Score | Missing or weak items |
|---|---|---|---|
| sum-matching-prices | src/fluency-reps.ts:140 | 3 | Same accumulate-and-filter pattern as the guided `sum-positive-numbers`. Weak as a distinct recall application. |
| count-open-tickets | src/fluency-reps.ts:223 | 3 | Same filter-count pattern as `count-above-threshold`. Checks cover AND vs OR. |
| first-label-ending | src/fluency-reps.ts:310 | 3 | Prompt and note are clear. Placeholder vocabulary. |
| count-label-prefix | src/fluency-reps.ts:393 | 3 | Blank-prefix rule is stated. Placeholder vocabulary. |
| first-duplicate-label | src/fluency-reps.ts:469 | 3 | Same second-occurrence algorithm as `first-repeated-number` (`src/journey-reps.ts:24`) plus trimming. Weak distinctness. |
| count-statuses | src/fluency-reps.ts:552 | 3 | Trivial task. Checks cover the missing-status zero. Placeholder vocabulary. |
| remaining-actions | src/fluency-reps.ts:633 | 3 | Distinct application (undo). Placeholder vocabulary. Visual-trace candidate. |
| cancel-adjacent-ids | src/fluency-reps.ts:740 | 2 | Same algorithm as `remove-adjacent-pairs` on integers. The counterexample at `src/rep-depth.ts:307` cites `[1,2,1]`, but no check tests it. Weak as recall evidence. |
| validate-page-query | src/fluency-reps.ts:834 | 3 | Overlaps `backend-validate-user`. Size limit 1–50 differs from pagination reps (1–3), which is intentional but should be noted. |
| derive-task-summary | src/fluency-reps.ts:1001 | 3 | Good total-versus-visible contract. Placeholder vocabulary. |
| debug-page-offset | src/fluency-reps.ts:1101 | 3 | Starter has two bugs (`page * size` and `slice(start, size)`). The prompt names only the one-based issue. Example equals check 2. |

### Lessons — knowledge skills (`src/knowledge.ts`, `src/lesson-depth.ts`)

Skill block at `src/knowledge.ts` (line of `id`), lesson depth at `src/lesson-depth.ts` (line of key).

| Lesson | File:line | Score | Missing or weak items |
|---|---|---|---|
| values | src/knowledge.ts:9 · src/lesson-depth.ts:10 | 4 | Clear. Questions are shallow (recognition only). |
| arrays | src/knowledge.ts:23 · src/lesson-depth.ts:17 | 4 | Boundary question prompt lists options in a different order from the choices (`src/knowledge.ts:33`): prompt "n > limit, n >= limit, n !== limit" vs options "n >= limit, n > limit, n !== limit". |
| text | src/knowledge.ts:37 · src/lesson-depth.ts:24 | 4 | Good normalization section. |
| lookup | src/knowledge.ts:51 · src/lesson-depth.ts:31 | 3 | The count-completion prompt contains its answer: "use (counts.get(key) ?? 0) + 1 for an initial zero" (`src/knowledge.ts:61`). |
| stacks | src/knowledge.ts:65 · src/lesson-depth.ts:38 | 4 | Good nested-structure contrast. |
| validation | src/knowledge.ts:79 · src/lesson-depth.ts:45 | 4 | Strong "Reject before normalizing" lesson. |
| frontend | src/knowledge.ts:93 · src/lesson-depth.ts:52 | 3 | Derive question (`src/knowledge.ts:103`) has a distractor no learner would choose: "A mutation of the source array". |
| debugging | src/knowledge.ts:107 · src/lesson-depth.ts:59 | 3 | Regression question's correct option restates the bug in the prompt: "Bug: quantity two is charged as one." → "Two units of one available item". |
| complexity | src/knowledge.ts:121 · src/lesson-depth.ts:66 | 4 | Good challenge comparing time and storage. |
| async | src/knowledge.ts:135 · src/lesson-depth.ts:73 | 4 | Strong ownership challenge. |
| http | src/knowledge.ts:149 · src/lesson-depth.ts:80 | 4 | Clear offset and total questions. |
| react | src/knowledge.ts:163 · src/lesson-depth.ts:87 | 3 | Linked reps (`derive-task-summary`, `frontend-visible-items`, `frontend-directory`) are plain functions or DOM code. No rep practices effects or cleanup, which the objectives claim. |
| testing | src/knowledge.ts:177 · src/lesson-depth.ts:94 | 4 | Good counterexample challenge. |
| databases | src/knowledge.ts:191 · src/lesson-depth.ts:101 | 3 | Recognition-only. No linked rep runs SQL. The lesson states this (`reasoning`), which is honest, but the skill's rep links are in-memory handlers. |

### Lessons — browser state, DSA, and practical skills

| Lesson | File:line | Score | Missing or weak items |
|---|---|---|---|
| state-modeling | src/browser-state-reps.ts:101 · :119 | 4 | Strong four sections. Question IDs are versioned (`-v1`). |
| collection-operations | src/dsa-knowledge.ts (skill) · :121 | 4 | Good "Presence is different from truthiness" challenge. |
| queues | src/dsa-knowledge.ts:77 (repIds) · :128 | 4 | `repIds` includes `balanced-brackets`, a stack-matching rep, not a queue rep. |
| array-techniques | src/dsa-knowledge.ts (skill) · :135 | 4 | Strong challenge with counterexample `[4, 1, 3]`. |
| closures | src/practical-concepts.ts:10 · :3202 | 3 | Title is generic (`…: a boundary to explain`, line 3203). Reasoning "The trace wrapper preserves call order." (line 3205) is implementation jargon. |
| reference-identity | src/practical-concepts.ts:75 · :3209 | 3 | Generic title. Reasoning "Identity is preserved when each selection reuses an object…" describes the rep's internals. |
| event-loop | src/practical-concepts.ts:142 · :3216 | 3 | Generic title. Option "It runs during the draining checkpoint" (line 190) is jargon. |
| singleton | src/practical-concepts.ts:207 · :3223 | 3 | Generic title. Reasoning "Reference-keyed bookkeeping assigns the same identity number…" is internal. |
| events | src/practical-concepts.ts:276 · :3230 | 3 | Generic title. Reasoning uses internal wording ("topic-specific ordered registration set"). |
| dependency-injection | src/practical-concepts.ts:344 · :3237 | 3 | Generic title. Challenge "Can an injected dependency still mutate state?" is strong. |
| debouncing | src/practical-concepts.ts:410 · :3244 | 3 | Generic title. Reasoning "Testing its deadline before replacement preserves the explicit equality policy." is internal. |
| throttling | src/practical-concepts.ts:477 · :3251 | 3 | Generic title. Worked example and challenge are good. |
| request-ownership | src/practical-concepts.ts:542 · :3258 | 3 | Generic title. "Ownership ends and has a scope" section (line 562) is about 660 characters, the longest section in the lesson set. |
| websockets | src/practical-concepts.ts:615 · :3265 | 3 | Generic title. Reasoning "Every accepted send is preceded by an unmatched open…" (line 3268) is jargon. |
| live-transports | src/practical-concepts.ts:682 · :3272 | 3 | Generic title. Challenge asks about SSE last-event IDs, which the linked rep does not cover. |
| resource-ownership | src/practical-concepts.ts:749 · :3279 | 3 | Generic title. Clear transitions. |
| caching | src/practical-concepts.ts:819 · :3286 | 3 | Generic title. TTL challenge is strong. |
| retries | src/practical-concepts.ts:887 · :3293 | 3 | Generic title. Challenge (`src/practical-concepts.ts:3297`) asks about closing a shared connection, which belongs to resource-ownership. |
| idempotency | src/practical-concepts.ts:955 · :3300 | 3 | Generic title. Timeout challenge is strong. |
| optimistic-updates | src/practical-concepts.ts:1023 · :3307 | 3 | Generic title. Clear ownership reasoning. |

## Top 15 fixes

Ranked by learner impact. ID impact follows [Content authoring](./CONTENT_AUTHORING.md): changing a checked question's answer or option order needs a new question ID. A prompt-only edit does not.

1. **`read-batch-labels` — remove the answer from the example and make learners trace.** `src/rich-reps.ts:62` shows the answer to check 1 (`src/rich-reps.ts:70`). Replace the example with a case that is not checked, for example `collectLabels([' Cy ', 'cy', ' Cy'])` → `['Cy', 'cy']`. Change the planning prompt (line 65) to require a row per input: raw value, trimmed label, Set contents, and output. ID impact: none; this is a rep, not an interactive question.
   - **Status (updated):** Fixed — The Cy/cy example is separate from the checked cases, and the plan requires raw, trimmed, Set, and output columns (`src/rich-reps.ts`).
2. **`backend-ticket-handler` and `project-ticket-api` — show the dataset.** Add to the prompt: "tickets: t1 'Login issue' (open), t2 'Invoice copy' (closed), t3 'Login on mobile' (open)." Replace the URL example (`src/rich-reps.ts:80`) with `handleTickets({method:'GET', query:{status:'open', page:2, size:1}}, tickets) => {status:200, body:{items:[t3], total:2, page:2, size:1}}`. In `src/capstone-reps.ts:17`, state what `parseQuery` returns for invalid input (`null`).
   - **Status (updated):** Fixed — Both briefs expose the ticket dataset and paged example through the shared ticket contract; the project plan explicitly states that invalid parseQuery input returns null (`src/rich-reps.ts`, `src/capstone-reps.ts`).
3. **`algo-binary-search` — add a visual trace and sharpen hint 3.** Add `traceSteps` in `src/dsa-reps.ts` next to the `algo-binary-search` depth key (line 484), following the sorted-pair pattern. Use `sortedIndex([-3, 0, 4, 9], 4)` with left, right, and middle pointers. Replace "use left = middle + 1 for a smaller middle value" with "if numbers[middle] is less than target, set left = middle + 1; otherwise set right = middle - 1."
   - **Status (updated):** Fixed — Binary search has a pointer trace in `src/review-dsa.ts` and an explicit middle-value comparison in hint 3 (`src/dsa-reps.ts`).
4. **`remove-adjacent-pairs` — turn the `abba` prose into a stack trace.** The prose is at `src/rep-depth.ts:195`: "save a, save b, remove b on the next b, then remove a." Move it into `traceSteps` with the stack shown bottom to top. This is the stacks journey's recall rep, so visual evidence matters most here.
   - **Status (updated):** Fixed — The abba cascade has stack traceSteps (`src/rep-depth.ts`).
5. **`balanced-brackets` — add `traceSteps` for `([)]`.** The prose at `src/rep-depth.ts:118` describes push, push, then a close that expects `(` but finds `[`. Convert it to steps and keep the hint text.
   - **Status (updated):** Fixed — The mismatched ([)] case has stack traceSteps (`src/rep-depth.ts`).
6. **`cancel-adjacent-ids` — make the recall distinct and test the counterexample it names.** Add `{ name: 'Keeps nonadjacent matches', input: [[1, 2, 1]], expected: [1, 2, 1] }` at `src/fluency-reps.ts:740`, which `src/rep-depth.ts:307` already relies on. Then either replace the task with a distinct application (for example, a Map-based "keep the last occurrence of each ID" task) or remove it from `recallVariants.stacks` in `src/fluency.ts:50`. ID impact: none.
   - **Status (updated):** Fixed — The nonadjacent counterexample is checked, and the stack recall pool uses simplify-file-path in place of cancel-adjacent-ids (`src/fluency-reps.ts`, `src/fluency.ts`, `src/dsa-reps.ts`). The old rep remains available for existing evidence.
7. **`search-request-state` — split the 90-word prompt into event bullets and add a trace.** Replace the paragraph at `src/async-reps.ts:8` with: "Start: {status:'idle', items:[], error:null}. start(id): make id current; return loading. resolve(id) for the current id: return ready with its items (an empty list is still ready); the request ends. reject(id) for the current id: return error with its message (an empty message is still an error); the request ends. cancel(id) for the current id: return idle; the request ends. Any other id, or any event after its request ended: no effect." Add a `traceSteps` for the example.
   - **Status (updated):** Partly — The prompt now labels each event and states settled-request behavior, and an event trace exists (`src/async-reps.ts`, `src/review-async.ts`). The prompt remains one paragraph rather than event bullets.
8. **`validate-import-batch` — number the rules and move the precedence rule into the prompt.** Replace the 116-word prompt at `src/validation-reps.ts:82` with numbered rules: (1) batch shape, (2) row shape, (3) id normalization and character set, (4) amount range, (5) duplicate check after a row passes, (6) output. Move "Validate the entire row before duplicate detection" from the note (line 85) into rule 5. Add `traceSteps` showing the accepted-ID Set and the row index for the example.
   - **Status (updated):** Partly — The prompt numbers rules 1–6 and places row-before-duplicate precedence in rule 5 (`src/validation-reps.ts`). The review still has prose only; accepted-ID Set/index traceSteps remain open (`src/review-validation.ts`).
9. **`parse-delivery-window` — separate the two address limits.** `src/validation-reps.ts:48` says "at most 200 characters" while the contract says trimmed length 1–80. Rewrite: "The contract allows a trimmed address of 1 to 80 characters. Authored test data never exceeds 200 characters." Then check that the "above its limit" check uses 81.
   - **Status (updated):** Fixed — The note separates the trimmed 1–80 contract from the 200-character authored-input bound, and the over-limit check uses 81 characters (`src/validation-reps.ts`).
10. **`interview-backend` — put the trim rule in the contract.** Add to the prompt at `src/ai-era-reps.ts:169`: "Trim the whole email first, then require exactly one @ and nonblank text on each side." Remove the rule from hint 2 (line 176), which currently introduces a rule the prompt does not state. State in the note that internal spaces are allowed, matching check 13.
   - **Status (updated):** Fixed — Trimming and exactly one @ are in the prompt; internal spaces are explicitly allowed and checked (`src/ai-era-reps.ts`). Hint 2 repeats the stated rule rather than introducing it.
11. **`interview-frontend` — remove the contradiction and add a clarification step.** Replace the note at `src/ai-era-reps.ts:154` ("Clarify the tie rule in your plan") with "Before coding, write one question you would ask an interviewer about ties, then answer it from the prompt." Add to the plan prompt (line 156): "What would you clarify before coding?"
   - **Status (updated):** Fixed — The note asks for a clarification question answered from the tie contract, and the plan asks what to clarify (`src/ai-era-reps.ts`).
12. **Practical reps — replace the generic plan prompts and title vocabulary (19 reps).** Use a rep-specific plan and a real term. Examples: `closure-counters` (`src/practical-concepts.ts:1108`): plan "Where does each counter's count live? After one call on the first counter, what does the second counter return?" Vocabulary (line 1102): "Closure: a returned function that keeps variables from the place where it was created." `pubsub-trace`: plan "After an unsubscribe and a re-subscribe, which listener receives the next publish first?" Vocabulary: "Topic: a named channel. Listener: a function registered on one topic." Apply the same pattern to the other 17.
   - **Status (updated):** Fixed — All 19 practical reps now have task-specific plans and defined terms (`src/practical-concepts.ts`); the shared generic plan is gone.
13. **Fluency reps — replace "Contract | Boundary" with terms (11 reps).** Examples: `count-statuses` (`src/fluency-reps.ts:552` area): "Initial value" and "Key". `remaining-actions` (line 633): "Undo" and "Saved action". `debug-page-offset` (line 1101): "Zero-based index" and "Slice end". For `subscription-cleanup` and `room-leases`, replace "Ownership" (`src/practical-concepts.ts:2819`, `:2943`) with "Owner" and "Registration".
   - **Status (updated):** Fixed — All 11 fluency reps have specific terms, including Initial value/Key, Undo/Saved action, and Zero-based index/Slice end (`src/fluency-reps.ts`). The two ownership reps define Owner and Registration (`src/practical-concepts.ts`).
14. **Knowledge questions that give away the answer, or whose prompt order does not match the choices.** `src/knowledge.ts:61`: change "Complete the update: use (counts.get(key) ?? 0) + 1 for an initial zero." to "Complete the update so a key seen for the first time starts from zero." `src/knowledge.ts:33`: reorder the prompt to "n >= limit, n > limit, or n !== limit" to match the options. Both are prompt-only edits, so no ID change. For `src/knowledge.ts:103`, replacing the distractor "A mutation of the source array" with a plausible wrong option keeps the answer position but changes option text. Per the strict reading of the authoring guide, give it a new question ID.
   - **Status (updated):** Fixed — The lookup prompt no longer supplies the expression, array prompt order matches choices, and changed frontend options use derive-source-v2 (`src/knowledge.ts`).
15. **Practical lesson titles and jargon.** Replace each generic title ("…: a boundary to explain", for example `src/practical-concepts.ts:3203`) with the claim the lesson makes. Example: closures becomes "A returned function keeps its own variables." Rewrite jargon: `src/practical-concepts.ts:3268` "Every accepted send is preceded by an unmatched open" becomes "A send is accepted only while the connection is open." Replace "draining checkpoint" (line 190, a checked option) with "after the current script finishes", which needs a new question ID. Move the retries challenge at line 3297 (about closing a shared connection) to `resource-ownership`, and write a retries challenge about the cap or jitter.
   - **Status (updated):** Partly — All 16 titles state specific claims; closures, event-loop, and websocket reasoning are clearer; the changed microtask option uses microtask-followup-v2. The reconnect challenge belongs to resource ownership and retries asks about the cap (`src/review-practical.ts`, `src/practical-concepts.ts`). Some internal wording remains, including reference-keyed bookkeeping, topic-specific ordered registration set, and deadline replacement policy.

### Other findings, not in the top 15

- **`debug-page-offset`** (`src/fluency-reps.ts:1101`): the prompt names only the one-based offset. Add "Check both the start and the end of the slice."
  - **Status (updated):** Fixed — The prompt now explicitly asks learners to check both the start and end of the slice (`src/fluency-reps.ts`).
- **`frontend-directory`** (`src/rich-reps.ts:37`): "Loading…" uses U+2026. Either use ASCII "Loading..." in the checks or state the exact character. Replace "use the manual review checklist" (line 39) with a pointer to the acceptance criteria (line 40).
  - **Status (updated):** Fixed — The prompt specifies the single ellipsis character and the note points to acceptance criteria (`src/rich-reps.ts`).
- **`react` lesson** (`src/knowledge.ts:163–176`): its linked reps are not React reps. Add a rep that practices effects and cleanup, or narrow the lesson's objectives.
  - **Status (updated):** Fixed — Objectives label immutable updates and effects as concept checks and explicitly distinguish linked plain TypeScript/DOM practice from React API practice (`src/knowledge.ts`). No React effects rep has been added.
- **`queues` skill** (`src/dsa-knowledge.ts:77`): `balanced-brackets` is linked to a queue lesson. Remove it from `repIds`.
  - **Status (updated):** Fixed — repIds now contains stack operations, queue operations, and remaining-actions; balanced-brackets is removed (`src/dsa-knowledge.ts`).
- **`valid-parentheses` and `balanced-brackets`** (`src/rep.ts:207`, `:81`): near-duplicate skill in one category. Keep both only if the second adds a multi-type extension; otherwise fold one into the other.
  - **Status (updated):** Fixed — Both remain with the stated distinction: valid-parentheses checks one bracket type, while balanced-brackets extends matching to (), [], and {} (`src/rep.ts`).
- **`sum-positive-numbers` and count reps**: the note does not say numbers may be decimals, though checks use decimals. Add a numeric-domain sentence to each.
  - **Status (updated):** Fixed — sum-positive-numbers and count-above-threshold explicitly allow decimals; count-even-numbers states its integer domain (`src/rep.ts`).
- **`first-duplicate-label` and `sum-matching-prices`**: weak as recall variants because they repeat the guided algorithm. Both should use a changed comparison or data shape.
  - **Status (updated):** Open — These recall tasks still repeat the guided comparison/accumulation patterns (`src/fluency-reps.ts`).
- **Systemic: final hints that are code.** Affects `ds-*` reps, `make-arrays`, `write-functions`, `algo-binary-search`, and `validate-stock-adjustment` (regex). Keep progressive hints to three non-code steps and move the code into the post-attempt reveal.
  - **Status (updated):** Open — Algorithm/code-level final hints remain in foundations, DSA, and validation content.
- **Systemic: "Inputs are valid under the stated contract."** Used in `subscription-cleanup` (`src/practical-concepts.ts:2816`) and `room-leases` (`:2940`). Say which inputs are valid.
  - **Status (updated):** Fixed — Both ownership notes now enumerate valid event kinds and nonempty string fields (`src/practical-concepts.ts`).
- **Systemic: examples repeat check 1.** Most reps do this. It is fine for foundations, but for recall reps, such as `remaining-actions`, the example already shows the answer shape.
  - **Status (updated):** Open — Examples still duplicate checked cases in several reps; recall distinctness needs a separate pass.
- **Authoring doc vs code**: `docs/CONTENT_AUTHORING.md` is accurate about recall variants in `src/fluency.ts`, but the rep definitions live in `src/fluency-reps.ts`. A short sentence would help new authors.
  - **Status (updated):** Open — The guide still identifies src/fluency.ts for recall variants without a matching definition-file pointer.

## Where a visual step trace helps most

Ranked. Trace types: array with pointers, stack, map or Set, or event-by-event state. Existing traces are in `src/dsa-reps.ts` for `ds-stack-operations`, `algo-sorted-pair`, and `algo-window-sum`.

1. **`algo-binary-search`** (`src/dsa-reps.ts:309`) — array with `left`, `right`, and `middle` pointers. It is the most common array pattern and the only DSA pilot family member without a trace.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
2. **`read-batch-labels`** (`src/rich-reps.ts:59`) — the rep is a prediction exercise. A row per iteration (raw, label, Set contents, output) is the content itself.
   - **Status (updated):** Open — The current depth entry still has prose only; structured traceSteps remain absent.
3. **`remove-adjacent-pairs`** (`src/journey-reps.ts:43`) — a stack cascade. For `abba`, the stack shows `a`, `ab`, `a`, empty.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
4. **`balanced-brackets`** (`src/rep.ts:81`) — stack push and pop for `([)]`, showing the reject before the final `]`.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
5. **`remaining-actions`** (`src/fluency-reps.ts:633`) — a stack with UNDO, including an UNDO on an empty stack.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
6. **`search-request-state`** (`src/async-reps.ts:7`) — an event-by-event state object. Shows which events change the screen and which are ignored.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
7. **`preview-slot-results`** (`src/async-reps.ts:38`) — an insertion-ordered slot map. Shows that replacement keeps position and reselection moves to the end.
   - **Status (updated):** Open — The current depth entry still has prose only; structured traceSteps remain absent.
8. **`validate-import-batch`** (`src/validation-reps.ts:81`) — an index pointer plus the accepted-ID Set. Shows duplicates detected only after a row passes.
   - **Status (updated):** Open — The current depth entry still has prose only; structured traceSteps remain absent.
9. **`debounce-schedule`** (`src/practical-concepts.ts:1756`) — a timeline of events and the pending deadline. Shows the equality case.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
10. **`pubsub-trace`** (`src/practical-concepts.ts:1528`) — a map from topic to ordered listeners. Shows that re-subscribing moves a listener last.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
11. **`first-repeated-number`** (`src/journey-reps.ts:24`) — the Set growing, with a pointer at the second occurrence.
   - **Status (updated):** Fixed — Structured traceSteps are present in the current depth owner.
12. **`debug-page-offset`** (`src/fluency-reps.ts:1101`) — start and end pointers on the array. Shows the off-by-one bug.
   - **Status (updated):** Open — The current depth entry still has prose only; structured traceSteps remain absent.
13. **`leading-throttle`** (`src/practical-concepts.ts:1870`) — the accepted list plus a last-accepted pointer. Shows that rejected events do not move the window.
   - **Status (updated):** Open — The current depth entry still has prose only; structured traceSteps remain absent.
