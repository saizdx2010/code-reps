# Code Reps roadmap

Code Reps helps you practice independently through **understand → plan → solve → explain → review**. It stays free and local-first.

The immediate audience is its owner using it for personal practice. The immediate problem is feeling lost: knowing where to start, what to do next, and how today's work connects to a useful goal. Prioritize that experience before expanding the catalog or preparing a public release.

This roadmap uses ordered phases rather than promised dates or release numbers. Unchecked items are proposals, not implemented behavior. Finish a small, usable improvement and evaluate it in ordinary practice before starting the next batch.

## What already exists

- [x] A practice workspace with plans, code, checks, explanations, hints, authored reviews, and saved attempts.
- [x] Trail, Library, and Progress, with Foundations plus Problem solving, Pattern Recognition, Frontend, SQL, and Backend tracks.
- [x] Lessons, interactive predictions, glossary help, and guided → independent → delayed-recall skill journeys.
- [x] Debugging, code reading, refactoring, DOM interactions, multi-file projects, and optional timed interviews.
- [x] Problem-solving content covering collections, sorting, recursion, trees, graphs, linked structures, heaps, backtracking, and dynamic programming.
- [x] Recommendations, resumable drafts, due reviews, weekly planning, and a Journal of attempts, notes, and mistake tags.
- [x] Local profiles, browser persistence, a loopback SQLite service, backups, imports, and portable web bundles.
- [x] Profile summaries with streaks, path completion rows, and completion badges on Progress. Badges are derived from completed attempts and the current paths, with a quiet notice when one is earned.
- [x] Automated content checks, Node tests, Chromium flows, and build budgets.

Implemented features do not establish learner comprehension, full accessibility, disconnected operation, or support across every platform. See the [UI guide](./docs/UI_GUIDE.md), [fluency guide](./docs/FLUENCY_PLATFORM.md), and [browser testing guide](./docs/BROWSER_TESTING.md) for current behavior and limits.

## 1. Make daily practice easy to enter

**Goal:** Open Code Reps and immediately understand what to do, why it matters, and how to continue saved work.

- [x] Make Trail's primary action answer three questions: what should I practice, why this rep, and what comes afterward. The Home “Up next” panel shows the rep, its reason, and an afterward line.
- [x] Offer a short, optional walkthrough around the real “Declare a value” rep. Introduce checks, hints, writing, and completion at the relevant steps; allow skipping and replay from Trail without replacing saved work.
- [x] Make the selected learning goal obvious, with an easy way to change it and a clear explanation that browsing another track does not change the goal.
- [x] ~~Clarify opening a rep versus recording a practice session with “Record a session” and “Resume session” actions.~~ Superseded: practice sessions were retired from the interface (769a139), so a completed attempt is the record of practice. Existing `sessions:v1` records still import.
- [x] Offer a small daily choice: continue saved work, take the recommended next rep, or choose a due review. Keep other tools reachable through existing sections.
- [x] Improve recommendation reasons with the specific skill involved, rather than only naming the selected track. Concrete prerequisite and readiness guidance remains in section 2.
- [x] Keep advanced planning, assessment, and management controls secondary so they do not compete with the next useful action. Planning and evidence are text links below the primary action, and changing the starting point is under a disclosure.

**Done when:** During your own normal use, you can start or resume without browsing multiple pages, identify the active goal, and explain why the recommended rep comes next. Verify fresh and returning profiles, including drafts and due reviews; preserve work and Back/Forward behavior.

## 2. Make each rep feel manageable

**Goal:** Know what a task expects before starting and stay oriented while working.

- [x] Show concrete prerequisites and a rough effort range before opening a rep. Label estimates as guidance; do not infer proficiency from speed.
- [x] Make the exercise library easier to sample with a few relevant reps or a useful initially expanded group, while retaining search and filters.
- [x] Add brief readiness checkpoints before significant difficulty jumps. Offer an optional bridge rep or prerequisite lesson without locking access.
- [x] Scale plan and explanation prompts to the task: one useful sentence for a small syntax exercise, deeper reasoning for a larger problem. Preserve self-review and avoid automated prose scoring.
- [x] Keep the current step, completion requirements, saved state, and next action clear without adding another toolbar or navigation layer.
- [x] After completion, offer one clear next step and make stopping for the day understandable too.
- [x] Walk through desktop, narrow, short, and zoomed layouts with keyboard navigation. Check editor exit, focus, checks, writing fields, and preserved drafts.
- [x] Split `dom-accessible-form` into checkpoints of about 60 to 80 words each, following the connected-note pattern. `dom-form-fields`, `dom-form-errors`, and `dom-form-submit` now precede it; `dom-accessible-form` stays unchanged as the final integration step, and manual-review points remain self-reviewed.

**Done when:** A small rep can be completed without disproportionate form filling, and a harder rep makes prerequisites and missing completion requirements clear. Navigation, pane changes, reloads, and failed editor loads preserve work.

## 3. Make completion visible in the profile

**Goal:** Recognize finished work with satisfying badges that remain honest about what was assessed.

- [x] Turn existing path completion rows into recognizable badges within the local profile on Progress. Reuse the logo palette, shared geometry, and reduced-motion behavior.
- [x] Add smaller milestones, starting with a first completed rep and a completed path stage, so recognition does not require finishing an entire track.
- [x] Give each badge a name, clear earning rule, and a link to supporting work. Show an earned date when it can be derived reliably.
- [x] Show earned badges on Progress. Progress later moved to listing only earned badges, quietly, with no upcoming list. Use text alongside artwork so status is understandable without color.
- [x] Offer a restrained acknowledgement when a milestone is reached. Avoid repeated celebrations on reload and preserve keyboard focus.
- [x] Derive completion from the active profile's existing completed attempts where possible. Repeated attempts must not inflate distinct-rep milestones; unfinished drafts must not count as rep completion.
- [x] Keep completion badges separate from independent and retained skill evidence. Hinted completions may earn completion badges; they must not imply mastery.
- [x] Decide how badges behave when a path gains or replaces required reps before introducing durable awards. Preserve rep IDs and define any storage or migration change explicitly. Badges stay derived from the current path: an added required rep stops showing an earned badge as earned while its completed reps are kept, and a removed rep stops counting toward the badge (see the [README](./README.md)).
- [x] Cover badge derivation with unit tests: repeat attempts, hinted completions, invalid and future dates, earliest first completion, and separate profile histories (`tests/badges.test.mjs`).
- [x] Verify badges in the browser: switching profiles, importing backed-up history, reloading, and narrow layouts. `tests/e2e/badges.spec.ts` covers each of these in Chromium at desktop width and at 390px; the unit tests in `tests/badges.test.mjs` cover derivation and path edits.

**Done when:** You can see what you have finished, understand exactly how each badge was earned, and open the relevant work. Badge behavior stays consistent across profiles and backups without changing fluency rules.

Follow-up, rewarding what the app measures rather than volume (no points, levels, leaderboards, timers, or locks):

- [x] Mark a skill moving up to Independent or Retained in the completion panel, and replay the step once on the skill map.
- [x] Count reviews as practice days, carry over one missed day in any seven, and show the last seven days beside the streak.
- [x] Show at most one personal-best note, compared only with the learner's own earlier attempts.
- [x] Give Trail a Today plan of one new rep and up to two due reviews, recalculated from today's attempts.
- [x] Cover the rules with unit tests (`tests/profile-progress.test.mjs`, `tests/learning-moments.test.mjs`) and the flows in Chromium (`tests/e2e/learning-evidence.spec.ts`). The design is on the FigCraft page Proposals — Learning evidence.
- [x] Add evidence badges for independence, retention, steady practice, and coming back, and redraw every badge from the logo (FigCraft page Proposals — Achievement badges; `tests/evidence-badges.test.mjs`).

## 4. Connect small exercises to working software

**Goal:** Move from isolated functions to building and maintaining a complete feature.

Start with one connected plain TypeScript browser feature using the existing DOM and multi-file owners. Keep it inside the Frontend track rather than adding a new main area.

- [x] Sequence a feature through modeling state → rendering → handling input → saving → recovering from invalid data → testing.
- [x] Provide integration checkpoints and a final independent brief that combines familiar skills without supplying the implementation approach.
- [x] Add a learner-written testing journey: choose boundary cases, expose a plausible faulty implementation, repair it, and apply the skill in a fresh delayed task. One journey ships (pagination cases, a range-label repair, and an interval-overlap transfer rep); checks show the learner's cases separate the supplied variants, not that a case table is complete. More journeys are authored with `docs/FIND_THE_BUG.md`.
- [x] Add actual asynchronous practice using deterministic local fixtures: awaiting work, parallel operations, partial failure, cancellation, and cleanup. Distinguish policy traces from runtime behavior.
- [x] Add a maintenance journey: read unfamiliar code, reproduce a bug, write a regression test, fix it, and adapt to a changed requirement. Six reps ship (a shipping module read, reproduce, guard-and-fix, and adapt sequence, then library-fines and room-booking transfer reps); checks show a case separates the original from the fix, not that a regression suite is complete. See `docs/MAINTENANCE_JOURNEY.md`.
- [x] Use existing external browser project briefs as transfer options. Each of the three projects in Library → Projects (`src/browser-projects.ts`) offers a later transfer challenge recorded through the notebook template. External self-reviews remain learner-reported rather than checked fluency evidence.

**Done when:** One complete feature can be built, tested, explained, and repaired through the existing practice loop. Behavioral checks, type checks, visual review, accessibility review, and self-reviewed reasoning remain distinct.

## 5. Deepen the paths you actually use

**Goal:** Build confidence through different applications of the same skill before adding more topics.

- [ ] Record where you get stuck during ordinary practice: wording, missing prerequisite, approach, syntax, boundaries, or integration. Use those notes to select the next content batch.
- [x] Add a DOM interactions journey with guided, independent, and delayed-recall stages. The `dom-interactions` journey in `src/learning.ts` stages `dom-disclosure`, `dom-live-search`, and `dom-accordion`.
- [x] Add knowledge lessons for sorting, recursion, trees, and graphs (`sorting-basics`, `recursion-basics`, `trees`, `graphs` in `src/dsa-knowledge.ts`, with discussions in `src/review-dsa-lessons.ts`).
- [x] Review the sorting, recursion, tree, and graph journeys for difficulty transitions and unfamiliar transfer. Findings and fixes (a fresh sorting recall, tree and graph bridge practice reps, trimmed lesson clues) are in the archived [journey review](./docs/archive/DSA_JOURNEY_REVIEW.md); this is editorial review, not learner evidence.
- [ ] Add independent or recall tasks to queues, two pointers, windows, or binary search only when learner observations show a specific gap. Each of those four already has guided, independent, and delayed-recall journey stages.
- [x] Deepen TypeScript through narrowing unknown input, discriminated unions, exhaustive handling, generics, and reusable typed APIs. Separate compile-time guarantees from behavioral checks.
- [x] Strengthen debugging and frontend practice with fresh contexts instead of cosmetic variants of the same problem. A fresh-debugging journey (date filter boundaries, floating-point money, a reducer that breaks undo, captured loop variables), a suggested-code review journey, and a composite-widgets journey (reorderable list, modal dialog, combobox) ship. These are authored contexts, not observations from learner practice.
- [x] Add structured step-by-step traces (`traceSteps`) to the reviews of `read-batch-labels`, `preview-slot-results`, `validate-import-batch`, `debug-page-offset`, and `leading-throttle`, the visual-trace candidates named in the archived [content audit](./docs/archive/CONTENT_AUDIT.md).
- [x] Keep final hints as non-code guidance. `declare-variables`, `basic-types`, and `create-objects` now show their code in the post-attempt comparison instead. The eight array, text, lookup, and stack journey practice reps, whose final hints were complete solutions, also have specific progressive hints, task-specific plan prompts, and named checks.
- [x] Strengthen weak recall variants: `first-duplicate-label` and `sum-matching-prices` repeat their guided comparison and accumulation patterns. `count-record-highs` (comparison with a running record) and `first-pair-to-target` (complement lookup) are appended to the arrays and lookup rotations, so saved review positions keep their meaning. The weaker variants stay in place, because removing them would change how saved history replays.
- [x] Add linked-list insertion and removal after reversal, with a linked-lists lesson, and a binary search tree lesson and journey (search path → latest value at or before a time → ordering check). See [Algorithms & Data Structures](./docs/ALGORITHMS_DATA_STRUCTURES.md#next-expansion).
- [ ] Keep batches small and complete: a lesson where needed, guided practice, an independent application, delayed recall, reference solutions, boundaries, hints, and authored review.

**Done when:** Each chosen batch addresses a difficulty observed in your own use and includes a fresh application that cannot be solved merely by recalling the previous answer. Later attempts support only the evidence the task actually establishes.

See [content authoring](./docs/CONTENT_AUTHORING.md) for requirements and the [content gap map](./docs/CONTENT_GAPS.md) for editorial context. Check documentation snapshots against current source before selecting work.

## 6. Zero to hero: SQL, Backend, and DevOps

**Goal:** Take a learner from no database or service knowledge to writing, changing, and shipping a small backend: SQL first, then Backend, then DevOps, each in small complete batches (a lesson where needed, guided, independent, and a distinct delayed recall, plus reference solutions, boundary checks, and authored reviews). The order is guidance on the track picker, never a lock.

Every check is honest about what it establishes: SQL reps run SQLite's dialect on authored data; backend handlers are plain functions over request objects, not a live server; DevOps reps simulate authored policies in TypeScript, not Docker, a shell, or CI; anything time-dependent takes the clock and time zone as inputs.

**Phase 1: SQL** (new `sql` track; the learner writes SQL text)

- [x] S0 · SQL text format with one complete playable rep (`sql-select-columns`): a data-driven `sql` block on the rep, one generic checker for every SQLite rep (fresh in-memory database per check, ordered, unordered, and stored-state comparisons, probes), read-only guards (one statement; a change is described and undone), Monaco SQL colouring, the brief's Tables card, row comparisons and SQLite errors in the checks drawer, and browser coverage. The three existing SQLite reps keep their IDs and behavior on the same checker.
- [x] S1 · Read a table: SELECT, WHERE, ORDER BY, LIMIT, with a lesson (`sql-reading`) and the `sql-reading` journey: filter and sort, newest open tickets, then a delayed catalog page; distinct cities and calculated totals are practice.
- [x] S2 · Filter precisely: AND/OR precedence, IN, LIKE, and NULL's three-valued logic, with a lesson (`sql-filtering`) and the `sql-filtering` journey: grouped conditions, members you can text, then a delayed article search; ranges and code patterns are practice.
- [x] S3 · Summarize: COUNT, SUM, AVG, GROUP BY, HAVING, and COUNT(*) versus COUNT(column), with a lesson (`sql-summarizing`) and the `sql-summarizing` journey: counts per status, busy delivery days, then a delayed monthly spenders report; rated reviews and distinct visitors are practice.
- [x] S4 · Combine tables: inner versus left joins, missing matches, and join fan-out inflating sums, with a lesson (`sql-joining`) and the `sql-joining` journey: orders with customer names, June returns for every product, then a delayed latest-book report; customers without orders and fan-out-free team totals are practice.
- [x] S5 · Ask in steps: subqueries, EXISTS, and common table expressions, with a lesson (`sql-subqueries`) and the `sql-subqueries` journey: invoices above the average, rooms free on a night, then a delayed months-above-average report with WITH; category averages and the NOT IN NULL trap are practice.
- [x] S6 · Design a schema: the learner writes CREATE TABLE; probe inserts check each constraint, one rule per check, with a lesson (`sql-schema-design`) and the `sql-schema-design` journey: a products table, linked members and clubs with enforced foreign keys, then a delayed shifts table; defaults and STRICT types are practice.
- [x] S7 · Change data safely: UPDATE and DELETE scope, upserts, and parameter binding from TypeScript, with a lesson (`sql-changing-data`) and the `sql-changing-data` journey: a scoped price rise, a delivery upsert, then a delayed archive move. The three SQLite reps moved here with the same IDs; Backend's SQLite stage now links to SQL, so its stage badge is earned in SQL while those reps still count toward the Backend track badge.
- [x] S8 · Rank and run totals: window functions and top-N per group, with a lesson (`sql-window-functions`) and the `sql-window-functions` journey: places per level, a running balance, then a delayed top two per region; shared ranks and day-over-day changes are practice.
- [x] S9 · Make it fast: indexes, checked through SQLite's `EXPLAIN QUERY PLAN` (the plan SQLite chose, not speed), with a lesson (`sql-indexes`) and the `sql-indexes` journey: a lookup index, a two-column index whose order matters, then a delayed join that needs both sides indexed; sort-ready and covering indexes are practice.
- [x] S10 · Evolve a schema: migrations and backfills that preserve rows, with a lesson (`sql-migrations`) and the `sql-migrations` journey: add and backfill a column, rebuild a table to add rules, then a delayed code-to-text migration; renaming and splitting a column are practice. Checks read rows, `pragma_table_info`, and probe inserts.
- [x] S11 · Hero: a reporting capstone (best category per region with order counts and shares) and an untimed SQL interview round. The timed interview page still offers only Frontend and Backend rounds.

**Phase 2: Backend** (extends the `backend` track; existing stages and rep IDs stay)

- [x] B1 · What a request is: method, path, query, headers, and body, as the Backend track's new first stage, with a lesson (`http-request-anatomy`) and the `request-anatomy` journey: split a target, decode a query string, then a delayed JSON-body reader; the request line and case-insensitive headers are practice. Handlers are functions over strings, header pairs, and request objects, not a live server.
- [x] B2 · Routing: path parameters, and 404 versus 405, as a stage before validation, with a lesson (`http-routing`) and the `routing` journey: match a pattern, choose 404 or 405 with an Allow list, then a delayed most-specific-route picker with wildcards; cleaning a path and building one from values are practice.
- [ ] B3 · Authorization: session expiry, roles, and ownership checks. Skipped in this pass: an automated content check stopped the drafting twice, so this stage still needs separate authoring. Later stages do not depend on it.
- [x] B4 · Concurrent writes: version numbers and lost updates, after the SQL-linked storage stage, with a lesson (`concurrent-writes`) and the `concurrent-writes` journey: refuse a stale write by version, honor If-Match with 412 and 428, then a delayed replay of several clients' edits; spotting lost updates in a last-write-wins log and compare-and-set are practice.
- [x] B5 · Background jobs: retries, dead letters, and at-least-once processing, after Stay reliable, with a lesson (`background-jobs`) and the `background-jobs` journey: decide a retry or a dead letter, claim a job with a lease, then a delayed replay of a whole queue under a retry policy; skipping repeated messages and publishing from an outbox are practice.
- [x] B6 · Rate limits: token bucket and sliding window, after Run background jobs, with a lesson (`rate-limiting`) and the `rate-limiting` journey: refill a token bucket, limit with a sliding window, then a delayed per-caller limiter with a bucket per key; answering 429 with Retry-After and estimating a sliding window from two counters are practice. The earlier fixed-window rep stays in Stay reliable.
- [x] B7 · Evolve an API: versioning, compatible and breaking changes, and deprecation dates, after Limit request rates, with a lesson (`api-evolution`) and the `api-evolution` journey: choose a response version from the path or a header, classify field changes for requests and responses, then a delayed downgrade of a response for a client pinned to an older dated version; Deprecation and Sunset headers relative to a supplied time, and webhook deliveries that repeat or arrive out of order, are practice. Webhook signature verification was left out of this pass; the webhook rep covers delivery handling only.

**Phase 3: DevOps** (new `devops` track; TypeScript reps that simulate authored policies)

- [x] D1 · Read CI output: exit codes and the first real error in a log, as the new `devops` track's first stage (last on the track picker, "Builds on Backend"), with a lesson (`ci-output`) and the `ci-output` journey: read an exit code, find the first real error in a log with colour codes, timestamps, warnings, and an exit-code summary, then a delayed "which step failed the job" with steps allowed to fail; step conditions (on success, on failure, always) and compiler errors as annotations are practice.
- [x] D2 · Configuration: environment-variable validation and secret redaction, as the Check configuration stage with a lesson (`service-config`) and the `service-config` journey: read a port with a default, check every setting against a schema (required, type, default) at startup, then a delayed comparison of two environments that never prints a sensitive value; masking sensitive values in log lines and reading a .env file are practice.
- [ ] D3 · Versions: semver comparison and bumps, ranges, and lockfile diffs.
- [ ] D4 · Pipelines: job ordering, cache keys, and skipping unchanged work.
- [ ] D5 · Containers: which image layers rebuild, and tag rules.
- [ ] D6 · Deploys: rolling, blue/green, and canary plans, stable-hash flags, and rollback decisions.
- [ ] D7 · Health: liveness versus readiness, and draining before shutdown.
- [ ] D8 · Scheduling: the next cron run across time zones and DST.
- [ ] D9 · Observability: p95 latency, SLO burn rate, and alerts that stop flapping.
- [ ] D10 · Incidents: a timeline from events, then a self-reviewed postmortem.
- [ ] D11 · Hero: containerize an app and add CI on your own machine, recorded as a learner-reported self-review like Library → Projects.

**Done when:** each phase's stages are playable end to end with honest notes, and a learner who finishes them can explain what each check did and did not establish. Completing a track earns the existing track badge; a Backend badge earned before its new stages shows as unearned again while its completed reps are kept, as for any added required rep.

## Later, when there is a concrete need

- [x] Introduce one complete React task with actual rendering and effect cleanup before expanding React content.
- [x] Introduce one local SQLite task with real queries and transaction behavior before expanding database content. Use temporary learner-independent data.
- [x] Expand React and SQLite modestly: row keys and stale request results in React; a JOIN report and an all-or-nothing restock in SQLite. They remain track practice without journeys.
- [ ] Add alternative external projects after the existing browser progression is useful in practice.
- [ ] Consider distributable content packs only after defining executable-content isolation, versioning, and evidence migration.
- [ ] A multi-file, SQLite-backed API capstone. It needs the project runner and the SQLite checker to work together, which neither does today.
- [ ] A real Dockerfile or CI YAML exercise format. DevOps reps simulate policies in TypeScript until then.

These options should not delay making daily personal practice clear and enjoyable.

## Reliability and verification throughout

Keep browser development and the local SQLite mode usable. Protect profile separation, stable content IDs, pending writes, drafts, backups, cancellation, and rejection of stale results.

Run the gates that match each change, as listed in [Maintaining](./docs/MAINTAINING.md#what-each-gate-catches) and [AGENTS.md](./AGENTS.md#verification-and-delivery). Automated flows do not establish visual fidelity or assistive-technology support, so UI changes also need a walkthrough at representative sizes with the keyboard. Record failures and unavailable checks explicitly. See [local reliability](./docs/LOCAL_RELIABILITY.md), [accessibility review](./docs/ACCESSIBILITY_REVIEW.md), and [portable bundles](./docs/PORTABLE_BUNDLE.md).

## Before sharing more widely

Public release is a separate milestone, not the current priority.

- [ ] Complete disconnected-browser, first-run, upgrade, backup/restore, and launcher checks on each supported platform.
- [ ] Complete visual, keyboard, zoom, and assistive-technology walkthroughs.
- [ ] Observe a small group using the first session, recommendations, and delayed transfer, following the [learner validation protocol](./docs/LEARNER_VALIDATION.md).
- [ ] Use observations before tuning review intervals or claiming learning effectiveness.
- [ ] Refresh behavior and coverage documentation so release claims match current implementation and recorded verification.

## Scope boundaries

Keep three main areas: Trail, Library, and Progress. Extend existing owners and controls before adding abstractions or dependencies.

Accounts, cloud sync, leaderboards, certificates, video courses, and AI tutoring remain outside scope. Completion badges recognize personal work; they are not credentials or an overall coding score.

