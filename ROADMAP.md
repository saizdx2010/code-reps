# Code Reps roadmap

Code Reps' core learning loop is always free and runs on each learner's laptop. A release is useful when it helps someone practise, understand a miss, or demonstrate that a skill lasted.

## 0.1 — First playable journey (shipped)

- [x] TypeScript reps, local editor and checks, plans, explanations, and saved history.
- [x] Beginner and returning starting points.
- [x] An array journey with guided, independent, and delayed recall reps.
- [x] Evidence-based progress and self-review prompts.

## 0.2 — Reliable local app

- [x] Replace the development preview with a loopback-only app server and SQLite store.
- [x] Migrate existing browser attempts from the same origin without overwriting data; use JSON import for other ports.
- [x] Add automatic local backups and a JSON restore path.
- [x] Give learners a clear first-run and update guide.

## 0.3 — More skill journeys

- [x] Add three more authored journeys with distinct guided, independent, and recall reps.
- [x] Give beginners and returning developers separate suggested sequences.
- [x] Validate every journey's rep IDs, checks, and review timing.

## 0.4 — Better feedback

- [x] Make failed checks actionable without giving away the solution.
- [x] Add authored approach comparisons for the new journeys.
- [x] Show changes between a learner's attempts without scoring prose automatically.

## 0.5 — Useful review

- [x] Recommend due recall, incomplete independent work, and difficult attempts with a clear reason.
- [x] Keep review dates and evidence visible in Progress.
- [ ] Check scheduling and learner understanding with real users before tuning intervals.

## 0.6 — Real-world transfer

- [x] Add a small debugging, code-reading, and data-transformation task using familiar skills.
- [x] Keep tests and self-review suited to each format.

## 1.0 — Easy local web distribution

- [x] Build portable local web bundles for macOS, Windows, and Linux with a bundled Node runtime. No desktop installer or signing is planned.
- [ ] Test first run, upgrades, backup restore, and offline use on each platform before public release.
- [x] Publish a plain-language local guide and internal content authoring guide. Source rights remain reserved; public contributions are deferred.

## Next — Platform quality and richer exercises

Complete an internal quality pass before inviting learners. Learner validation remains pending and will follow this work.

- [x] Audit all 29 reps for plain wording, examples, checks, hints, explanations, and path ordering; add reference-solution and self-review coverage. See `docs/CONTENT_AUDIT.md` for findings and verification limits.
- [x] Improve the daily practice flow: explain the next recommendation, resume unfinished work, and surface difficult attempts and due reviews. Scheduling tests cover prioritization, latest attempts, and saved recall/retry drafts; manual browser verification remains pending.
- [x] Polish workspace run/stop controls, stale-result handling, editor recovery, keyboard access, narrow/short layouts, and visible save feedback. Worker lifecycle tests pass; manual browser and assistive-technology verification remain pending.
- [x] Ship one complete debugging rep with a bug report, failing tests, hints, and solution review.
- [x] Ship one complete frontend rep with a local preview and checks for loading, empty, error, and success states.
- [x] Add a code-reading rep with behavior predictions, an edge case, and an authored self-review rubric.
- [x] Add a backend rep covering validation, filtering, pagination, and consistent errors.
- [x] Add a refactoring rep with behavior-preserving regression checks and an approach comparison.
- [x] Harden pending-save recovery, atomic imports, snapshot creation/restore, missing assets, and shutdown; verify the macOS arm64 portable bundle. See `docs/LOCAL_RELIABILITY.md`.
- [ ] Complete disconnected-browser testing and Windows/Linux first-run, upgrade, restore, and launcher checks before public release.
- [ ] After the internal pass, invite learners to check comprehension, recommendations, and independent delayed recall.

## Release gates

Each version needs a clean build, lint, focused tests, a real local-server smoke test, and a manual pass through its learner flow. The next development phase may add the small richer-exercise set above before learner validation. After the internal quality pass, ask a small group of learners whether they can solve a later related problem independently and understand why their progress state changed before expanding the catalog broadly or tuning review intervals.

## Local fluency platform — implemented foundations

- [x] Local profiles with legacy migration, save-before-switch, rename, separate imports, full exports, and confirmed deletion.
- [x] Searchable skill reference: 14 lessons with objectives, prerequisites, worked examples, walkthroughs, common mistakes, related concepts, and bookmarks.
- [x] Interactive prediction and missing-code checks; separate knowledge-check evidence from coding evidence.
- [x] Optional dated starting assessment and transparent four-dimension self-review.
- [x] Eleven more application/recall exercises and recurring review variants with visible scheduling reasons.
- [x] Personal weekly plans and searchable notes, mistakes, questions, and saved notebook drafts.
- [x] Frontend/backend project milestones and multi-file integration exercises with local module imports.
- [x] Optional interview timers, saved clarification, and post-round debrief.
- [x] Knowledge references attached to workspace tasks and failed-check concepts.
- [x] Content validation command, independent reference checks, profile/backup tests, and React flow coverage.
- [x] Prepared learner observation and delayed-transfer protocol in `docs/LEARNER_VALIDATION.md`.
- [ ] Complete real visual, keyboard, assistive-technology, zoom, and disconnected-browser walkthroughs.
- [ ] Execute release checks on Windows/Linux and observe real learners before claiming learning effectiveness.
- [ ] Deepen async, React, and database practice beyond the introductory reference lessons; introduce real service/database runners when those tasks need them.
- [ ] Add externally distributable content-pack tooling after an isolation and content-migration design.

No accounts, certificates, leaderboards, video courses, or AI tutoring will be added. Learning effectiveness and cross-platform validation remain evidence gates, not automatic consequences of shipping features.
