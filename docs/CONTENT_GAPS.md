# Grow content through complete journeys

Implementation inventory: 2026-10-01, content version 4. Every current skill has a knowledge lesson, interactive questions, authored depth, and linked coding applications. A linked application is not necessarily independent practice, and recognizing an answer does not establish coding fluency. The dedicated journeys below are the only skills with guided → independent → delayed-recall evidence rules.

## Coverage map

The source of truth remains `src/knowledge.ts`, `src/learning.ts`, and `src/fluency.ts`. This editorial snapshot helps choose a batch; update it when adding a journey. Application counts describe lesson links and can overlap across skills.

| Skill | Linked coding applications | Dedicated journey | Next gap |
| --- | ---: | --- | --- |
| Values, types, and functions | 5 | None | Add a distinct independent application and delayed recall. |
| Arrays and one-pass reasoning | 5 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Text and normalization | 6 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Maps, sets, and lookup | 5 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Stacks and nested structure | 5 | Guided, independent, delayed recall | Observe comprehension and unfamiliar delayed transfer. |
| Runtime validation and API boundaries | 6 | None | Connect existing boundary tasks into an independent/recall sequence. |
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

## The first batch

Request ownership now has four applications within the existing Practical Concepts path:

| Role | Rep | Decision practised |
| --- | --- | --- |
| Guided, existing | `latest-request` | Reject obsolete results and cancellation by request identity. |
| Independent, new | `search-request-state` | Distinguish idle, unresolved, ready-empty, and failure; ignore settled duplicates. |
| Recall after three days, new | `preview-slot-results` | Scope ownership to multiple slots; handle removal, replacement, and output ordering. |
| Recurring review / transfer, new | `refresh-report-state` | Keep accepted data visible during refresh, failure, and cancellation. |

Independent and recall prompts state the observable contract without providing an implementation approach. Hints are intentional reveals; full reasoning, traces, alternatives, counterexamples, and transfer challenges appear in the existing post-check review. These exercises consume deterministic records and do not test real HTTP cancellation, image loading, or timer behavior. A passing transfer rep checks that rep's contract; each further challenge remains self-reviewed.

## Next batches

1. **Observe the new journey.** Use `docs/LEARNER_VALIDATION.md` to check whether the wording, recommendations, and delayed application make sense. Internal coverage does not prove learning effectiveness.
2. **Validation and data boundaries.** Reuse existing backend tasks for a guided starting point, then author fresh independent and recall contracts. Cover normalization, invalid values, precedence, and unchanged input.
3. **Frontend state and debugging.** Reuse the existing directory and repair formats, with genuinely different applications. Keep visual, accessibility, reasoning, and behavioral evidence separate.
4. **Runtime and reliability topics.** Expand one topic at a time from its current single trace into a complete journey. Prioritize learner difficulty and missing applications rather than catalog size.
5. **React and databases.** Ship one complete format and review flow when a task requires the actual runtime. Current DOM/function tasks and simulated handlers do not establish React rendering or SQL behavior.

## Keep discovery manageable

Add a batch of roughly three to five reps around one learning goal. Reuse existing lessons, paths, topic groups, and filters before adding navigation. Home keeps one primary recommendation and short draft/review previews; all work remains reachable. Knowledge keeps one selected article, grouped topics, and filters; Quick lessons remains an introduction rather than a competing full library.

A batch needs independent reference solutions, normal and boundary checks, progressive hints, authored depth and self-review, stable IDs, and dedicated recall scheduling where retention is claimed. Run `yarn content:check`, `yarn lint`, `yarn test`, `yarn build`, and `git diff --check`. Verify discovery, keyboard access, narrow layouts, draft preservation, and the new learner flow in a browser. Record browser, offline, platform, and learner validation separately; these remain release gates where not exercised.

## Verification of this batch

Lint, the full Node suite, content validation, and the TypeScript/Vite build passed. The build reports a large-chunk warning. On macOS, headless Chromium checks passed at desktop and 375px phone widths for topic search, session filter restoration, native keyboard disclosures, Quick lessons navigation, and compact Home queue expansion/restoration. Real Monaco model edits survived navigation; the search exercise passed browser-worker checks and completed through the normal review flow. This does not establish Monaco keyboard editing, assistive-technology support, disconnected-browser operation, Windows/Linux behavior, or learner comprehension and delayed transfer; those checks remain pending.
