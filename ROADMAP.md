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

- [ ] Add a small debugging, code-reading, and data-transformation task using familiar skills.
- [ ] Keep tests and self-review suited to each format.

## 1.0 — Easy local distribution

- [ ] Package a reproducible, signed desktop build for macOS, Windows, and Linux.
- [ ] Test first run, upgrades, backup restore, and offline use on each platform.
- [ ] Publish a plain-language guide and contribution guide for free content.

## Release gates

Each version needs a clean build, lint, focused tests, a real local-server smoke test, and a manual pass through its learner flow. Before expanding the catalog, ask a small group of learners whether they can solve a later related problem independently and understand why their progress state changed.
