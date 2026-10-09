# Code Reps roadmap

Code Reps helps you practise independently through **understand → plan → solve → explain → review**. It stays free and local-first.

The immediate audience is its owner using it for personal practice. The immediate problem is feeling lost: knowing where to start, what to do next, and how today's work connects to a useful goal. Prioritize that experience before expanding the catalog or preparing a public release.

This roadmap uses ordered phases rather than promised dates or release numbers. Unchecked items are proposals, not implemented behavior. Finish a small, usable improvement and evaluate it in ordinary practice before starting the next batch.

## What already exists

- [x] A practice workspace with plans, code, checks, explanations, hints, authored reviews, and saved attempts.
- [x] Trail, Library, and Progress, with Foundations plus Problem solving, Frontend, and Backend tracks.
- [x] Lessons, interactive predictions, glossary help, and guided → independent → delayed-recall skill journeys.
- [x] Debugging, code reading, refactoring, DOM interactions, multi-file projects, and optional timed interviews.
- [x] Problem-solving content covering collections, sorting, recursion, trees, graphs, linked structures, heaps, backtracking, and dynamic programming.
- [x] Recommendations, resumable drafts, due reviews, weekly planning, a Journal, and explicit practice-session records.
- [x] Local profiles, browser persistence, a loopback SQLite service, backups, imports, and portable web bundles.
- [x] Profile summaries with streaks, path completion rows, and completion badges on Progress. Badges are derived from completed attempts; section 3 lists the remaining verification.
- [x] Automated content checks, Node tests, Chromium flows, and build budgets.

Implemented features do not establish learner comprehension, full accessibility, disconnected operation, or support across every platform. See the [UI guide](./docs/UI_GUIDE.md), [fluency guide](./docs/FLUENCY_PLATFORM.md), and [browser testing guide](./docs/BROWSER_TESTING.md) for current behavior and limits.

## 1. Make daily practice easy to enter

**Goal:** Open Code Reps and immediately understand what to do, why it matters, and how to continue saved work.

- [x] Make Trail's primary action answer three questions: what should I practise, why this rep, and what comes afterward. The Home “Up next” panel shows the rep, its reason, and an afterward line.
- [x] Offer a short, optional walkthrough around the real “Declare a value” rep. Introduce checks, hints, writing, and completion at the relevant steps; allow skipping and replay from Trail without replacing saved work.
- [x] Make the selected learning goal obvious, with an easy way to change it and a clear explanation that browsing another track does not change the goal.
- [x] Clarify opening a rep versus recording a practice session with “Record a session” and “Resume session” actions. Completing a rep and ending a session remain separate actions.
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
- [ ] Walk through desktop, narrow, short, and zoomed layouts with keyboard navigation. Check editor exit, focus, checks, writing fields, and preserved drafts.

**Done when:** A small rep can be completed without disproportionate form filling, and a harder rep makes prerequisites and missing completion requirements clear. Navigation, pane changes, reloads, and failed editor loads preserve work.

## 3. Make completion visible in the profile

**Goal:** Recognize finished work with satisfying badges that remain honest about what was assessed.

- [x] Turn existing path completion rows into recognizable badges within the local profile on Progress. Reuse the logo palette, shared geometry, and reduced-motion behavior.
- [x] Add smaller milestones, starting with a first completed rep and a completed path stage, so recognition does not require finishing an entire track.
- [x] Give each badge a name, clear earning rule, earned or unearned state, progress where useful, and a link to supporting work. Show an earned date when it can be derived reliably.
- [x] Show earned badges prominently and keep upcoming badges compact. Use text alongside artwork so status is understandable without color.
- [ ] Offer a restrained acknowledgement when a milestone is reached. Avoid repeated celebrations on reload and preserve keyboard focus.
- [x] Derive completion from the active profile's existing completed attempts where possible. Repeated attempts must not inflate distinct-rep milestones; unfinished drafts and ended sessions must not count as rep completion.
- [x] Keep completion badges separate from independent and retained skill evidence. Hinted completions may earn completion badges; they must not imply mastery.
- [ ] Decide how badges behave when a path gains or replaces required reps before introducing durable awards. Preserve rep IDs and define any storage or migration change explicitly.
- [x] Cover badge derivation with unit tests: repeat attempts, hinted completions, invalid and future dates, earliest first completion, and separate profile histories (`tests/badges.test.mjs`).
- [ ] Verify badges in the browser: switching profiles, importing backed-up history, reloading, and narrow layouts. A 390px Chromium check of Progress badges exists in `tests/e2e/practice.spec.ts`; the badge unit tests do not exercise imports or reloads.

**Done when:** You can see what you have finished, understand exactly how each badge was earned, and open the relevant work. Badge behavior stays consistent across profiles and backups without changing fluency rules.

## 4. Connect small exercises to working software

**Goal:** Move from isolated functions to building and maintaining a complete feature.

Start with one connected plain TypeScript browser feature using the existing DOM and multi-file owners. Keep it inside the Frontend track rather than adding a new main area.

- [ ] Sequence a feature through modeling state → rendering → handling input → saving → recovering from invalid data → testing.
- [ ] Provide integration checkpoints and a final independent brief that combines familiar skills without supplying the implementation approach.
- [ ] Add a learner-written testing journey: choose boundary cases, expose a plausible faulty implementation, repair it, and apply the skill in a fresh delayed task.
- [ ] Add actual asynchronous practice using deterministic local fixtures: awaiting work, parallel operations, partial failure, cancellation, and cleanup. Distinguish policy traces from runtime behavior.
- [ ] Add a maintenance journey: read unfamiliar code, reproduce a bug, write a regression test, fix it, and adapt to a changed requirement.
- [ ] Use existing external browser project briefs as transfer options. External self-reviews remain learner-reported rather than checked fluency evidence.

**Done when:** One complete feature can be built, tested, explained, and repaired through the existing practice loop. Behavioral checks, type checks, visual review, accessibility review, and self-reviewed reasoning remain distinct.

## 5. Deepen the paths you actually use

**Goal:** Build confidence through different applications of the same skill before adding more topics.

- [ ] Record where you get stuck during ordinary practice: wording, missing prerequisite, approach, syntax, boundaries, or integration. Use those notes to select the next content batch.
- [ ] Add a DOM interactions journey with guided, independent, and delayed-recall stages. Its `dom-*` reps (disclosure, tabs, accessible form, live search) exist, but no journey in `src/learning.ts` stages them.
- [ ] Add knowledge lessons for sorting, recursion, trees, and graphs. Their journeys and reps already exist (`src/learning.ts`, `src/path.ts`), but `src/dsa-knowledge.ts` defines only collection operations, queues, and array techniques, so these topics have no lesson questions or authored knowledge depth. Then review their journeys for difficulty transitions and unfamiliar transfer.
- [ ] Add independent or recall tasks to queues, two pointers, windows, or binary search only when learner observations show a specific gap. Each of those four already has guided, independent, and delayed-recall journey stages.
- [ ] Deepen TypeScript through narrowing unknown input, discriminated unions, exhaustive handling, generics, and reusable typed APIs. Separate compile-time guarantees from behavioral checks.
- [ ] Strengthen debugging and frontend practice with fresh contexts instead of cosmetic variants of the same problem.
- [ ] Keep batches small and complete: a lesson where needed, guided practice, an independent application, delayed recall, reference solutions, boundaries, hints, and authored review.

**Done when:** Each chosen batch addresses a difficulty observed in your own use and includes a fresh application that cannot be solved merely by recalling the previous answer. Later attempts support only the evidence the task actually establishes.

See [content authoring](./docs/CONTENT_AUTHORING.md) for requirements and the [content gap map](./docs/CONTENT_GAPS.md) for editorial context. Check documentation snapshots against current source before selecting work.

## Later, when there is a concrete need

- [ ] Introduce one complete React task with actual rendering and effect cleanup before expanding React content.
- [ ] Introduce one local SQLite task with real queries and transaction behavior before expanding database content. Use temporary learner-independent data.
- [ ] Add alternative external projects after the existing browser progression is useful in practice.
- [ ] Consider distributable content packs only after defining executable-content isolation, versioning, and evidence migration.

These options should not delay making daily personal practice clear and enjoyable.

## Reliability and verification throughout

Keep browser development and the local SQLite mode usable. Protect profile separation, stable content IDs, pending writes, drafts, backups, cancellation, and rejection of stale results.

- Source changes: run relevant focused tests, then `yarn lint`, `yarn test`, and `yarn build`.
- Content, assessment, or content-model changes: also run `yarn content:check`.
- Practice, editor, navigation, profile, or browser-persistence changes: also run `yarn test:e2e` using its dedicated server and fresh contexts.
- UI changes: inspect the affected flow at representative sizes, with keyboard access and work preservation. Automated flows do not establish visual fidelity or assistive-technology support.
- Packaging or local-service changes: run `yarn package` and `node scripts/verify-portable.mjs` as appropriate, using temporary data directories.
- Documentation changes: review links, paths, and commands. Finish every change with `git diff --check` and review the final diff.

Record failures and unavailable checks explicitly. See [local reliability](./docs/LOCAL_RELIABILITY.md), [accessibility review](./docs/ACCESSIBILITY_REVIEW.md), and [portable bundles](./docs/PORTABLE_BUNDLE.md).

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
