# Grow content through complete journeys

For the agreed goal of independently building, testing, and debugging a plain TypeScript browser app outside Code Reps, see the [browser application journey decision and gap assessment](./TYPESCRIPT_BROWSER_JOURNEY.md). Its three external project briefs and state-modeling journey are implemented; the wider curriculum remains proposed.

Implementation inventory: 2026-10-05, content version 7. Every current skill has a knowledge lesson, interactive questions, authored depth, and linked coding applications. A linked application is not necessarily independent practice, and recognizing an answer does not establish coding fluency. The dedicated journeys below are the only skills with guided → independent → delayed-recall evidence rules.

## Coverage map

The source of truth remains `src/knowledge.ts`, `src/learning.ts`, and `src/fluency.ts`. This editorial snapshot helps choose a batch; update it when adding a journey. Application counts describe lesson links and can overlap across skills.

| Skill | Linked coding applications | Dedicated journey | Next gap |
| --- | ---: | --- | --- |
| TypeScript state modeling | 3 | Guided, independent, delayed recall | Observe unfamiliar application; in-app checks remain behavioral, not semantic type analysis. |
| Values, types, and functions | 5 | None | Add a distinct independent application and delayed recall. |
| Arrays and one-pass reasoning | 5 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Text and normalization | 6 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Maps, sets, and lookup | 5 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Stacks and nested structure | 5 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Runtime validation and API boundaries | 9 | Guided, independent, delayed recall | Observe normalization, error precedence, and unfamiliar delayed transfer. |
| Frontend state and derived data | 6 | None | Add fresh independent and recall interfaces; keep visual review separate. |
| Debugging, reading, and safe refactoring | 6 | None | Add distinct repair and reading cases with delayed recall. |
| Time, space, and tradeoffs | 3 | None | Add unfamiliar comparison tasks; behavior alone cannot assess analysis. |
| Promises and asynchronous work | 3 | None | Add actual asynchronous composition/failure practice beyond settled records. |
| HTTP requests and response contracts | 4 | None | Add distinct response-boundary recall; current handlers are simulated. |
| React state and effects | 3 | None | Introduce a complete React-specific runner/task before claiming React fluency. |
| Tests, boundaries, and evidence | 3 | None | Add learner-authored test practice, rather than only code passing provided checks. |
| Data modeling and database boundaries | 3 | None | Introduce a local database runner/task before claiming query or transaction fluency. |
| Closures and private state | 1 | None | Add distinct independent and delayed-recall applications. |
| Reference equality and shallow copies | 1 | None | Add distinct independent and delayed-recall applications. |
| Event loop and microtasks | 1 | None | Add distinct independent and delayed-recall applications. |
| Singleton and scoped shared instances | 1 | None | Add distinct independent and delayed-recall applications. |
| Observer, pub/sub, and subscriptions | 1 | None | Add distinct independent and delayed-recall applications. |
| Dependency injection | 1 | None | Add distinct independent and delayed-recall applications. |
| Debouncing | 1 | None | Add distinct independent and delayed-recall applications. |
| Throttling | 1 | None | Add distinct independent and delayed-recall applications. |
| Cancellation and race conditions | 4 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| WebSockets and connection state | 1 | None | Add distinct independent and delayed-recall applications. |
| Polling and server-sent events | 1 | None | Add distinct independent and delayed-recall applications. |
| Cleanup, reference counting, and shared connections | 3 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Caching and freshness | 1 | None | Add distinct independent and delayed-recall applications. |
| Retries and reconnect backoff | 1 | None | Add distinct independent and delayed-recall applications. |
| Idempotency and safe repeated requests | 1 | None | Add distinct independent and delayed-recall applications. |
| Optimistic updates and rollback | 1 | None | Add distinct independent and delayed-recall applications. |

## Request ownership batch

Request ownership now has four applications within the Frontend track:

| Role | Rep | Decision practised |
| --- | --- | --- |
| Guided, existing | `latest-request` | Reject obsolete results and cancellation by request identity. |
| Independent, new | `search-request-state` | Distinguish idle, unresolved, ready-empty, and failure; ignore settled duplicates. |
| Recall after three days, new | `preview-slot-results` | Scope ownership to multiple slots; handle removal, replacement, and output ordering. |
| Recurring review / transfer, new | `refresh-report-state` | Keep accepted data visible during refresh, failure, and cancellation. |

Independent and recall prompts state the observable contract without providing an implementation approach. Hints are intentional reveals; full reasoning, traces, alternatives, counterexamples, and transfer challenges appear in the existing post-check review. These exercises consume deterministic records and do not test real HTTP cancellation, image loading, or timer behavior. A passing transfer rep checks that rep's contract; each further challenge remains self-reviewed.

## Validation and data-boundary batch

Content version 5 adds a journey to the Backend track and validation lesson:

| Role | Rep | Decision practised |
| --- | --- | --- |
| Guided, existing | `backend-validate-user` | Check unknown shape and field types, then normalize accepted input. |
| Independent, new | `validate-stock-adjustment` | Apply a fresh character, length, integer, and nonzero boundary contract without hints. |
| Recall after three days, new | `parse-delivery-window` | Apply conditional fields, absent-value defaults, and conflicting-error precedence in a different setting. |
| Recurring review / transfer, new | `validate-import-batch` | Validate a complete batch, detect normalized duplicates, and return the earliest row error without partial output. |

New tasks preserve input and have independent reference solutions, boundary checks, progressive hints, and authored reviews. Existing rep and checked-question IDs, answer ordering, and backup formats remain unchanged. Existing user-request completions can supply guided evidence; only later unhinted completion of the new independent task starts the recall delay. Early or hinted recall does not establish retention. Recognizing the validation lesson's answers is separate evidence.

These functions consume parsed objects. They do not establish real HTTP validation, inventory correctness, delivery behavior, or database transaction safety. Transfer challenges remain self-reviewed. Adding this journey does not establish learner comprehension or delayed transfer.

## Next batches

1. **Observe the new journey.** Use `docs/LEARNER_VALIDATION.md` to check whether the wording, recommendations, and delayed application make sense. Internal coverage does not prove learning effectiveness.
2. **Observe validation and data boundaries.** The new journey covers normalization, invalid values, conditional fields, precedence, and unchanged input. Check whether learners can explain these decisions before expanding it.
3. **Frontend state and debugging.** Reuse the existing directory and repair formats, with genuinely different applications. Keep visual, accessibility, reasoning, and behavioral evidence separate.
4. **Runtime and reliability topics.** Expand one topic at a time from its current single trace into a complete journey. Prioritize learner difficulty and missing applications rather than catalog size.
5. **React and databases.** Ship one complete format and review flow when a task requires the actual runtime. Current DOM/function tasks and simulated handlers do not establish React rendering or SQL behavior.

## Keep discovery manageable

Add a batch of roughly three to five reps around one learning goal. Reuse existing lessons, paths, topic groups, and filters before adding navigation. Home keeps one primary recommendation and short draft/review previews; all work remains reachable. Knowledge keeps one selected article, grouped topics, and filters; Quick lessons remains an introduction rather than a competing full library.

A batch needs independent reference solutions, normal and boundary checks, progressive hints, authored depth and self-review, stable IDs, and dedicated recall scheduling where retention is claimed. Run `yarn content:check`, `yarn lint`, `yarn test`, `yarn build`, and `git diff --check`. Verify discovery, keyboard access, narrow layouts, draft preservation, and the new learner flow in a browser. Record browser, offline, platform, and learner validation separately; these remain release gates where not exercised.

## Earlier request-ownership verification

Lint, the full Node suite, content validation, and the TypeScript/Vite build passed. The build reports a large-chunk warning. On macOS, headless Chromium checks passed at desktop and 375px phone widths for topic search, session filter restoration, native keyboard disclosures, Quick lessons navigation, and compact Home queue expansion/restoration. Real Monaco model edits survived navigation; the search exercise passed browser-worker checks and completed through the normal review flow. This does not establish Monaco keyboard editing, assistive-technology support, disconnected-browser operation, Windows/Linux behavior, or learner comprehension and delayed transfer; those checks remain pending.

## Validation batch verification

Lint, 154 Node tests, content validation, build/bundle budgets, and 21 Chromium flows passed on macOS. The browser suite includes the new guided/independent/delayed-recall flow, an early solve that does not establish retention, fresh recall reset, complete batch checks, and a 320px layout with editor keyboard exit and preserved work. A follow-up narrow-flow check verifies step labels stay inside their buttons. Desktop and phone content renders were inspected separately. The macOS arm64 portable bundle smoke passed using temporary data directories.

This does not establish human comprehension or delayed transfer, assistive-technology support, browser zoom, Windows/Linux execution, or remote GitHub Actions results. The remaining manual protocol is in `docs/ACCESSIBILITY_REVIEW.md` and `docs/LEARNER_VALIDATION.md`.

## Journey coverage snapshot (2026-10-09)

Verified by reading `src/learning.ts` (`journeys`), `src/knowledge.ts` and `src/dsa-knowledge.ts` (skill/lesson definitions with `repIds`), `src/path.ts` (path stages), and `src/rep.ts` (rep existence). "Missing" means the stage was verified absent: no rep with that role exists for the topic, and the topic has no entry in `src/learning.ts` `journeys`.

| Topic | Skill / lesson ID(s) | Guided rep | Independent rep | Delayed-recall rep | Lesson in `src/knowledge.ts`? |
| --- | --- | --- | --- | --- | --- |
| Queues | `queues` (`src/dsa-knowledge.ts:43`) | Missing | Missing | Missing | Yes (`queues` in `src/dsa-knowledge.ts`) |
| Two pointers | `array-techniques` (`src/dsa-knowledge.ts:79`) | Missing | Missing | Missing | Yes (`array-techniques` in `src/dsa-knowledge.ts`) |
| Sliding windows | `array-techniques` (`src/dsa-knowledge.ts:79`) | Missing | Missing | Missing | Yes (`array-techniques` in `src/dsa-knowledge.ts`) |
| Binary search | `array-techniques` (`src/dsa-knowledge.ts:79`) | `algo-binary-search` (`src/learning.ts`) | `first-insertion-point` | `smallest-daily-capacity` | Yes (`array-techniques` in `src/dsa-knowledge.ts`) |
| DOM interactions | `frontend` (`src/knowledge.ts:107`) | Missing | Missing | Missing | Yes (`frontend`) |
| Sorting | No skill/lesson ID | `algo-insertion-sort` (`src/learning.ts:23`) | `sort-score-records` | `kth-smallest-copy` | No |
| Recursion | No skill/lesson ID | `algo-recursive-sum` (`src/learning.ts:24`) | `flatten-nested-numbers` | `count-object-leaves` | No |
| Trees | No skill/lesson ID | `algo-tree-depth` (`src/learning.ts:25`) | `tree-depth-sum` | `tree-value-path` | No |
| Graphs | No skill/lesson ID | `algo-graph-reachable` (`src/learning.ts:26`) | `graph-shortest-hops` | `graph-connected-groups` | No |

Notes on linked reps that are not journey stages: queues has `ds-stack-operations`, `ds-queue-operations`, and `remaining-actions` (`src/dsa-knowledge.ts:76`); the array-techniques topic has `algo-sorted-pair`, `algo-window-sum`, `algo-binary-search` (`src/dsa-knowledge.ts:115`); DOM interactions has `dom-disclosure`, `dom-accessible-form`, `dom-live-search`, `dom-tabs` (`src/knowledge.ts`, `frontend` lesson). All path placements are in the Problem solving path (`src/path.ts:39-51`) and Frontend path (`src/path.ts:54-75`). All rep IDs above were verified to exist in `src/rep.ts`.

Thin areas:

- No journey (guided → independent → delayed-recall) exists for queues, two pointers, sliding windows, binary search, or DOM interactions; their reps are linked to lessons but carry no stage evidence rules.
- Sorting, recursion, trees, and graphs have complete journeys but no skill or knowledge lesson: their reps appear in no `Skill.repIds`, so they also have no lesson questions or authored knowledge depth.
- DOM interactions is the only topic above whose practice reps (`dom-*`) run in the sandboxed frontend frame rather than the function worker, while its lesson (`frontend`) covers broader frontend state, not interactions specifically.
