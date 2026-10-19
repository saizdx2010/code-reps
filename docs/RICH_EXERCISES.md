# Richer exercises

This guide covers the formats beyond single-function reps: debugging, code reading, DOM interfaces, request handlers, refactoring, multi-file projects, learner-written test cases, maintenance, React, and SQL text. SQLite reps that call the database from TypeScript are covered in [content authoring](./CONTENT_AUTHORING.md#sqlite-tasks) and [ADR 0002](./adr/0002-in-memory-sqlite-practice.md). The first five complete small tasks across the Frontend and Backend tracks are:

| Rep | Learner work | Checks |
| --- | --- | --- |
| Debug a checkout total | Trace a bug report, repair quantities, availability, and discounts. | Normal totals, discount boundaries, free/zero-unit items, and input preservation. |
| Trace a batch label pipeline | Predict four named inputs before checking; explain the loop, trim, and Set. | Predicted results; reasoning remains self-reviewed. |
| Build an interactive directory | Implement browser DOM elements, search events, and request states. | Nine DOM checks for precedence, Retry, filtering, clearing search, labels, list semantics, safe text, and input preservation. |
| Implement a ticket list handler | Validate parsed requests, filter tickets, count, and page a response. | Method and query errors, defaults, boundaries, filtering, total-before-pagination, empty results, and input preservation. |
| Refactor a stock summary | Improve working code while preserving order, duplicates, zero units, and totals. | Regression checks; readability and structure remain self-reviewed. |

Every task has a context, contract, starter, progressive hints, planning prompts, and an authored post-check comparison. The directory and ticket handler also appear in the Frontend and Backend tracks.

## Frontend runtime

`mountDirectory(root, state)` receives a DOM root and a supplied state. The learner builds real elements and event listeners in `solution.ts`. The preview offers ready, loading, error, and empty scenarios. Update preview executes the current code; edits show a stale-preview notice. Close preview removes the frame. Retry reports callback invocations without making a network request.

The interaction runner mounts each case into a cleared root, dispatches input/click events, and inspects the DOM and callbacks. Authored `data-testid` values define the observation contract. Search must have an associated label; names must remain literal text inside list items. The runner checks mutation visible after the interactions.

Both preview and checks use an iframe with `sandbox="allow-scripts"`, without same-origin, popup, or top-navigation permissions. A frame content policy blocks network resources. The parent accepts feedback only from the expected frame and run token. Cancelling, timing out, or finishing removes the check frame and its listener; old messages cannot update the current results. Only complete, well-shaped check feedback is accepted.

The frontend frame has a five-second response timeout, but browser-frame code does not have the worker's independent termination guarantee: the frame shares the page's thread, so the timeout cannot fire while learner code is busy. To keep the page usable, `compileSolution` with `guardLoops` (used by `src/frontend-frame.ts`) gives every `for`, `while`, and `do` loop in learner code a two-second limit and reports "A loop ran for more than 2 seconds and was stopped." Once one loop is stopped, every guarded loop in that frame stops, so a retry or nested loop cannot block again; the next check run starts a fresh frame. Loops that `await` or `yield` are left unguarded because they give the page a turn. Recursion and other non-loop busy work can still block the browser before Stop or Close can act. This remains a personal-practice runner, not a supported boundary for imported third-party exercise code. The checks do not prove visual quality, full accessibility, or honest independent reasoning.

### DOM and accessibility reps

Reps that set `domPreview` (see `src/dom-reps.ts`) reuse the same frame, token, timeout, and cleanup, but check an authored attribute-and-behavior contract instead of the directory contract. A check supplies `props` and ordered `steps` (`type`, `click`, `focus`, `key`, `submit`, `mark`) and lists observations by `data-testid` (text, attributes, properties, label, `aria-describedby` targets, focus, element identity, the text of the element named by `aria-activedescendant` with `activeText`, and the options marked `aria-selected="true"` with `selectedTexts`). Steps run against the learner's real DOM inside the sandbox; keys are dispatched as `keydown` events on the focused element, with `shift: true` for Shift+Tab, and nothing moves focus for the learner. `type` sets the value through the native setter, so React-controlled inputs see the change too, and `submit` dispatches a submit event on the form.

These checks establish the stated ARIA, focus, and behavior contract only. They do not prove screen-reader announcements, visual design, or native key handling in other browsers; every rep says so and lists manual review steps. The checks frame is rendered offscreen (not `display:none`) because browsers cannot focus elements in a non-rendered frame.

## Backend runtime

The ticket exercise tests a pure request handler with parsed request objects in the existing worker. It does not start an HTTP service, parse URL query strings, or create a database. This makes the stated handler contract playable offline while keeping network/service setup outside this rep's scope.

`src/backend-service-reps.ts` holds the Backend track's service stages, with reviews in `src/review-backend.ts`, lessons in `src/backend-knowledge.ts`, references in `tests/fixtures/backend-solutions.mjs`, and `tests/backend-track.test.mjs`, which names the check that catches each common mistake. Each rep is a pure function over request-shaped values: target and query strings, a request line, `[name, value]` header pairs, and request objects with a string body. The first stage reads the parts of a request, the second routes it, and a later one refuses stale writes; its concurrency reps replay authored event logs in order, so they establish the version rules, not behavior under real simultaneous requests. Checks call the function directly, so they establish the stated parsing and status rules on authored values, not a real HTTP parser, socket reads, body streaming, or Content-Length handling.

## Verification

Lint, build/typecheck, and all 65 tests pass. DOM tests use jsdom to exercise the same generated frame script; transport tests cover source/token matching, cleanup, cancellation, timeout, and malformed feedback.

A Safari smoke test passed all nine directory checks, exercised live search and its empty result, invoked the preview Retry callback, and completed the rep. The completed attempt was verified through the local state API using a temporary test data directory. Broader browser, mobile, assistive-technology, and cross-platform verification remains pending.

## Connected scratch-note feature

The Frontend path includes seven ordered multi-file checkpoints: state modeling,
rendering, input, saving, invalid-data recovery, learner-written reader tests, and
an independent requirements-only brief. Each guided starter carries forward the
previous checkpoint's completed files; drafts are not automatically copied between
reps. Learners can compare or copy their own implementation before continuing.

The feature uses the existing `encodeFiles` entry-module loader and generic DOM
frame. Saving uses an injected, per-mount in-memory record (`props.raw`) because
the sandbox has no browser-storage access. Save, failure, and reload checks establish
this fixture's synchronous contract, not actual localStorage durability or offline
operation. No new runner, dependency, network service, or main area is added.

The testing checkpoint asks the learner to write a case table against a supplied
reader and detect a version-accepting mutant and a throwing reader. It is one
feature checkpoint, not a guided/independent/delayed testing journey. The independent
brief combines the same feature requirements with an empty entry file and no module
plan. Type modeling, module design, keyboard usability, visual quality, and
assistive-technology behavior remain self-reviewed separately from DOM checks.
Async practice with deterministic local fixtures is described in [Content authoring](./CONTENT_AUTHORING.md#local-asynchronous-function-checks); the maintenance journey is described below.

## Find-the-bug journey

`src/testing-journey-reps.ts` holds a guided, independent, and delayed find-the-bug journey in the Backend track: `expose-page-bugs`, `repair-range-label`, and `expose-overlap-bugs`. It uses the existing function worker. In the two expose reps the starter supplies a correct implementation and named faulty variants, and the learner writes a case table and `exposes(variant)`, which returns `true` when their cases fail on that variant. Variants are chosen by name because the worker passes only JSON-like inputs.

The checks establish that the learner's cases separate the supplied variants from the correct one. They do not establish that a table is complete, that unsupplied faults would be caught, or that expected values were derived independently; the reps say so and ask the learner to name a version their table would still accept. The repair rep is checked behaviorally, and its reasoning stays self-reviewed. See [Find the bug](./FIND_THE_BUG.md) for how to author more journeys of this kind.

## React tasks

`react-channel-counter`, `react-row-keys`, and `react-stale-request` are the React reps. They use the existing
sandboxed frame and review flow. Learners write a single TSX component with the
injected `React` global (no imports). The installed React and React DOM packages
are bundled locally as a production IIFE by `scripts/react-frame-bundle.mjs`;
Vite exposes its text through a dynamically imported module only for React frames.
No CDN or network resource is requested by the frame, and the runtime text is
outside the initial app chunk.

The deterministic source exposes `subscribe(channel, listener)` returning a
removal function, and `request(query, done)`, which records a request that a check
answers later with a `respond` step, in any order. React checks flush rendering and
effects around each event, response, click, props replacement, and unmount. They
observe DOM text, element identity across props changes, checkbox state, active
registration counts, including zero after unmount, and the number of requests made. This establishes behavior under this harness,
not useEffect usage, real timer scheduling, network behavior, accessible announcements,
or disconnected-browser operation. Effect structure and dependencies are self-reviewed.

## Maintenance journey

`src/maintenance-journey-reps.ts` holds six Backend reps that follow one maintenance story, with reference solutions in `tests/fixtures/maintenance-journey-solutions.mjs`. See [Maintenance journey](./MAINTENANCE_JOURNEY.md) for how the checks work and how to author another.

## SQL text reps

A rep with `format: 'sql'` and a `sql` block (`SqlTask` in `src/rep-types.ts`) takes SQL text instead of a TypeScript function; `functionName` stays empty. The editor opens `query.sql` with Monaco's SQL keyword colouring (registered in `src/monaco.ts`; its tokenizer loads only when a SQL model opens), and its footer names the dialect and the rep's contract. If Monaco fails, the plain-text fallback is labelled `QUERY.SQL` and keeps the same draft. `src/sql-reps.ts` holds the SQL track's reps; `tests/fixtures/sql-solutions.mjs` holds an independent reference query for each.

The task is data, so one generic checker in `src/sqlite-task.ts` runs every SQLite rep:

- `schema` runs first, then the check's named seed from `seeds` (each seed has an `about` line that a failed check shows as its starting data). Every check opens a fresh in-memory database and closes it, even when the SQL fails. No files, progress data, or server endpoints reach it.
- `compare: 'ordered' | 'unordered'`: the learner submits exactly one statement. A second statement is refused before anything runs. The statement runs inside a savepoint; if it changed any table or the schema, the check fails with what changed ("deleted 1 row from orders") and the change is rolled back. Rows compare by value against `expected.rows`, in order or as a multiset, and the result column names compare with `columns`, ignoring letter case.
- `compare: 'state'`: the learner's statements run in order, as a script. An open transaction fails the check. Then the check's optional `probes` run (each recorded as accepted or rejected), and the authored `read` queries capture the stored rows that `expected` names by label. A schema-design rep starts from an empty database, and each check probes one rule with a few inserts; `labels` names each probe in feedback ("Your table stored price -5 instead of rejecting it"), and the drawer counts probes rather than checks. `foreignKeys: true` turns on `PRAGMA foreign_keys = ON` before the learner's SQL, because SQLite does not enforce foreign keys by default. An index rep's check names a `plan`: an authored query whose rows are compared as `result`, and whose `EXPLAIN QUERY PLAN` lines must match every `uses` pattern and no `avoids` pattern; each pattern carries the words its feedback uses ("SQLite's plan still reads every row of users"). The drawer shows the plan text on passed and failed checks with the note that it shows SQLite's choice for the check data, not speed. A state script may be empty, so a learner can see the plan before changing anything.
- A result over 1,000 rows fails its check. Statements cannot run longer than the worker's five-second limit; Stop, edit, and timeout terminate the worker as for every function rep, and stale results are rejected.
- Numbers compare as JavaScript numbers, so an integer and a real with the same value (500 and 500.0) are equal. Text compares exactly.

A failed check reports one structured comparison per differing table: columns first (a missing, extra, or renamed column), then rows paired with the fewest changes, sorted by every column first when order does not matter. The drawer (`src/SqlResults.tsx`, loaded with the first SQL failure) draws Expected and Received as real tables with row numbers; a wrong cell shows the received value and the expected one, an extra or missing row carries a text label, NULL shows as NULL, and one sentence names the first difference. Up to 20 rows show in full; longer results show the first difference with two rows either side. When SQLite rejects the SQL text itself on every check (a syntax error or an unknown name), the drawer shows SQLite's message with the offending line and a caret instead of the check list. The location comes from preparing growing prefixes of the failing statement until SQLite repeats the complaint; it is a best effort for other errors.

The brief's Tables card (`src/SqlTables.tsx`) and its example rows come from `src/sql-previews.ts`, which `yarn content:index` generates by running each SQLite rep's schema and first seed through SQLite; `tests/catalog-index.test.mjs` fails when it is stale. Put the seed you want learners to read first in `seeds`.

What the checks establish: SQLite's behavior for the authored schema and data, and, for index reps, the plan SQLite 3.49 chose for that data. They do not establish another database's dialect, query performance, concurrency, or SQL style.
