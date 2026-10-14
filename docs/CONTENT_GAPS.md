# Content gaps

This map helps choose the next small content batch. It names gaps that stay true until someone closes them, rather than counting the catalog. Check it against source before selecting work, and update it when a batch closes a gap.

## Where coverage lives

| Question | Source of truth |
| --- | --- |
| Which skills have guided → independent → delayed-recall evidence? | `journeys` in `src/learning.ts` |
| Which recall variants rotate after retention? | `src/fluency.ts` |
| Which lessons exist and which reps they link? | `src/knowledge.ts`, `src/dsa-knowledge.ts`, `src/typescript-depth-knowledge.ts`, and the practical-concept lesson module; the generated `src/catalog-index.ts` lists them all |
| Which reps appear on a track, and in what order? | `src/path.ts` |

A lesson's linked reps are applications, not necessarily independent practice. Only a dedicated journey can establish Independent or Retained evidence, and recognizing a lesson answer does not establish coding fluency.

## Topics without a dedicated journey

These topics have a lesson and linked reps but no guided → independent → delayed-recall journey. Completing their reps records practice; it cannot establish retention.

- **Language and analysis:** values, types, and functions; time, space, and tradeoffs. Behavior checks alone cannot assess complexity analysis.
- **Runtime and application patterns:** closures, reference equality, the event loop, singletons, pub/sub, dependency injection, debouncing, throttling, WebSockets, polling and server-sent events, caching, retries, idempotency, and optimistic updates. Most are taught through a single authored policy trace; see [Practical concepts](./PRACTICAL_CONCEPTS.md) for what those traces establish.
- **React and databases:** one React task (`react-channel-counter`) runs real rendering and effect cleanup, and one SQLite task (`sqlite-stock-transfer`) runs real queries and rollback. Neither has independent or recall applications. Expand them only when a concrete need appears (see the [roadmap](../ROADMAP.md#later-when-there-is-a-concrete-need)).

## Track stages without a journey

- **Problem solving, later stages:** prefix sums, merged intervals, a min-heap, subsets, and introductory dynamic programming are single reps. Linked lists have a lesson and three reps (reversal, sorted insertion, and removal) but no journey. Binary search tree insertion is not yet authored. See [Algorithms & Data Structures](./ALGORITHMS_DATA_STRUCTURES.md#next-expansion).
- **Harder patterns and the two-part puzzle:** these Problem solving reps, which Pattern Recognition also uses, are applications without recall evidence.

## Assessment gaps

- **Type-system fluency:** the check runner uses `transpileModule`, which does not run full semantic type checking. The checks drawer now also reports the editor's own TypeScript errors (`src/type-issues.ts`), separately from the checks, but nothing verifies that a solution uses the types a brief asks for, so TypeScript reps still label type requirements as self-reviewed. `tests/type-check-content.test.mjs` keeps starters and traced references free of type errors under the editor's settings. See the [browser journey](./TYPESCRIPT_BROWSER_JOURNEY.md).
- **Prose, approach, and accessibility:** plans, explanations, technique choice, and manual accessibility points remain self-reviewed. Checks establish behavior only.
- **Learner evidence:** no journey has been observed with learners yet. Use the [learner validation protocol](./LEARNER_VALIDATION.md) before tuning recall intervals or expanding a journey.

Open editorial fixes to existing reps (missing step traces, code-level final hints, weak recall variants) are tracked in [roadmap section 5](../ROADMAP.md#5-deepen-the-paths-you-actually-use).

## Choosing a batch

Prefer a difficulty observed in real practice over catalog size. Add roughly three to five reps around one learning goal: a lesson where needed, guided practice, an independent application without approach clues, and a distinct delayed-recall application that cannot be solved by remembering the earlier answer. Reuse existing lessons, tracks, topic groups, and filters before adding navigation.

Follow [content authoring](./CONTENT_AUTHORING.md) for the rep and lesson contract, and [Maintaining](./MAINTAINING.md) for the steps and gates.
