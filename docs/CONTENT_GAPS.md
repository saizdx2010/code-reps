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
- **Runtime and application patterns:** closures, reference equality, the event loop, singletons, pub/sub, dependency injection, WebSockets, polling and server-sent events, and optimistic updates. Most are taught through a single authored policy trace; see [Practical concepts](./PRACTICAL_CONCEPTS.md) for what those traces establish. Debouncing and throttling now share the `timing-policies` journey, and caching, retries, and idempotency share the `reliable-requests` journey; both still trace authored policies rather than real timers or networks.
- **React and databases:** three React reps (subscription cleanup, row keys, and ignoring stale results) run real rendering in the sandboxed frame, and three SQLite reps written in TypeScript (a rolled-back transfer, a LEFT JOIN report, and an all-or-nothing restock) run real queries in a fresh in-memory database. The React reps are practice in Frontend; the SQLite reps sit in SQL's Change data safely stage, where only the restock counts as journey practice, so none of them establishes independent or retained evidence on its own.
- **SQL track:** all eleven stages ship, ten with a lesson and a journey (`sql-reading`, `sql-filtering`, `sql-summarizing`, `sql-joining`, `sql-subqueries`, `sql-schema-design`, `sql-changing-data`, `sql-window-functions`, `sql-indexes`, `sql-migrations`), and a final stage with a reporting capstone and an untimed interview round. The capstone and interview are applications, not journeys, and the timed interview page does not offer a SQL round yet. No journey has been observed with learners. The stages after it are planned in [roadmap section 6](../ROADMAP.md#6-zero-to-hero-sql-backend-and-devops).

- **Backend service stages:** What a request is, Route a request, Handle concurrent writes, and Run background jobs ship with lessons (`http-request-anatomy`, `http-routing`, `concurrent-writes`, `background-jobs`) and journeys (`request-anatomy`, `routing`, `concurrent-writes`, `background-jobs`). Their handlers are functions over request values and event logs, so the journeys establish parsing, routing, version-check, and retry rules on authored values, not live HTTP behavior, real concurrent requests, or a running queue, and they have not been observed with learners. The authorization stage was skipped in this pass. Later Backend stages (rate limits and API evolution) are planned in [roadmap section 6](../ROADMAP.md#6-zero-to-hero-sql-backend-and-devops).

## Track stages without a journey

- **Problem solving, later stages:** prefix sums, merged intervals, and subsets are single reps. Linked lists, binary search trees, heaps, and dynamic programming have journeys. See [Algorithms & Data Structures](./ALGORITHMS_DATA_STRUCTURES.md#next-expansion).
- **Harder patterns and the two-part puzzle:** these Problem solving reps, which Pattern Recognition also uses, are applications without recall evidence.

## Assessment gaps

- **Type-system fluency:** the in-app compiler uses `transpileModule`, which does not run full semantic type checking. TypeScript reps label type requirements as self-reviewed. See the [browser journey](./TYPESCRIPT_BROWSER_JOURNEY.md).
- **Prose, approach, and accessibility:** plans, explanations, technique choice, and manual accessibility points remain self-reviewed. Checks establish behavior only.
- **Learner evidence:** no journey has been observed with learners yet. Use the [learner validation protocol](./LEARNER_VALIDATION.md) before tuning recall intervals or expanding a journey.

Open editorial fixes to existing reps (missing step traces, code-level final hints, weak recall variants) are tracked in [roadmap section 5](../ROADMAP.md#5-deepen-the-paths-you-actually-use).

## Choosing a batch

Prefer a difficulty observed in real practice over catalog size. Add roughly three to five reps around one learning goal: a lesson where needed, guided practice, an independent application without approach clues, and a distinct delayed-recall application that cannot be solved by remembering the earlier answer. Reuse existing lessons, tracks, topic groups, and filters before adding navigation.

Follow [content authoring](./CONTENT_AUTHORING.md) for the rep and lesson contract, and [Maintaining](./MAINTAINING.md) for the steps and gates.
