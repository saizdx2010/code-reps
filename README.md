<div align="center">

# Code Reps

**Build coding fluency, one rep at a time.**

A free, local-first place to learn concepts, practice independently, and explain your decisions.

**Understand → Plan → Solve → Explain → Review**

[Get started](#get-started) · [What you can practice](#what-you-can-practice) · [Documentation](#documentation) · [Roadmap](./ROADMAP.md)

</div>

---

## A place to practice with intention

Code Reps starts with TypeScript and pairs coding exercises with plain-English lessons, progressive hints, and authored self-reviews. Local profiles keep each learner’s work separate, with no signup or paid tier.

| Learn | Practice | Reflect |
| --- | --- | --- |
| Searchable lessons, worked examples, and interactive knowledge checks | Coding reps, realistic debugging, multi-file projects, and optional timed interviews | Saved attempts, personal notes, recurring reviews, and evidence behind progress |

The workspace follows five steps:

1. **Understand** the task, examples, constraints, and vocabulary.
2. **Plan** your approach and identify edge cases.
3. **Solve** in the editor, run checks, and reveal hints when you need them.
4. **Explain** your decisions, tradeoffs, and complexity in plain English.
5. **Review** the result, reflect on difficulties, and return for fresh practice.

Practice writing scales with the task: one useful sentence for a small Foundations rep, a focused approach and boundary for other beginner reps, and deeper reasoning for larger problems. Plan and explanation are optional on sentence-scale and focused reps and required on reasoned reps; passing checks is always required, and difficulty and confidence are optional. The step rail marks each step Needed, Optional, or Done; the header keeps save status visible. Completion offers one next action, with a quiet option to stop for today. A completed attempt is the record of practice; there is no separate session to end. Existing drafts keep their format.

> Passing checks establishes behavior. Plans and explanations use a self-review rubric; independent fluency and retention need evidence from unhinted work and later recall.

## What you can practice

- **TypeScript foundations:** 83 playable reps and 34 searchable knowledge lessons, with starting points for beginners and returning developers.
- **Guided tracks:** Foundations (TypeScript basics, reading and repairing code, how JavaScript runs) plus three tracks: Problem solving, Frontend, and Backend. Interview rounds sit at the end of the tracks and are untimed.
- **Real-world tasks:** checkout debugging, batch-pipeline predictions, an interactive browser directory, a ticket request handler, and behavior-preserving stock-report refactoring.
- **Skill journeys:** arrays, words, lookups, stacks, request ownership, resource ownership, validation, TypeScript state modeling, control flow, interface logic, request-response, queues, two pointers, sorting, sliding windows, binary search, recursion, trees, and graphs. Each pairs guided work with an independent problem and fresh recall after three days.
- **Algorithms & Data Structures:** collection operations before problem solving, stack and queue ordering, two pointers, fixed windows, and binary search. See the [path guide](./docs/ALGORITHMS_DATA_STRUCTURES.md) for scope and expansion.
- **Practical concepts:** closures, reference equality, async ordering, subscriptions, dependency injection, cancellation, caching, retries, idempotency, and optimistic updates. See the [Practical Concepts guide](./docs/PRACTICAL_CONCEPTS.md) for the full scope.
- **Browser application journey:** a TypeScript state-modeling lesson and guided/independent/delayed-recall reps, plus three freely accessible external project levels using plain TypeScript and the DOM. Detailed requirements cover forms, persistence recovery, real promises, learner-written tests, and a runnable production build. External self-reviews are learner-reported and do not grant retained-skill status.
- **Personal practice:** two multi-file projects, weekly plans, notes, recurring reviews, self-assessment, and optional timed interview rounds.

Trail is home: your chosen track drawn as stages, with lessons placed before the reps that use them, and your next rep beside it, with one compact list for a saved draft and a due review. All tracks shows Foundations and the three tracks that build on it. Saved goals that name a retired path (typescript-browser, practical-concepts, real-world, ai-era, interviews) move to the track that absorbed it. Progress → Journal keeps completed attempts and notes in one place. Practice sessions were retired from the interface; existing `sessions:v1` records stay in storage and backups and still import, but they are no longer created or shown, and the old `#/sessions` bookmark opens the Journal. Library holds exercises, lessons, projects, and interviews; Progress includes your local profile, completion badges (first rep, track stages, and whole tracks), completed-rep calendar streaks, and the evidence behind **Learning**, **Practicing**, **Independent**, and **Retained**. While reviewing a rep you can optionally tag mistakes you made from a fixed list (off-by-one, mutated input, missed empty case, wrong boundary condition, misread contract, type or null handling, other); Progress → Mistakes counts each tag, lists recent attempts with links to the rep, and compares the last 14 days with the 14 days before. Tags are self-reported, never block completion, and do not measure skill. They are stored as an optional `mistakes` array of tag IDs on each attempt (`src/mistakes.ts`), so older attempts and backups load unchanged; backup import drops unknown tag IDs and rejects a malformed field, and tags stay with their profile. Progress → Skill map (`#/skillmap`) draws each skill of a track as a node on the trail, labelled Not started, Practiced, Independent, Retained, or Review due, with a link to the next useful rep. It reads the same recorded journey evidence as Skills and adds no storage; the labels describe recorded practice, not mastery. Home links to progress; the starting-point choice lives on All tracks.

Practical-concept traces check authored application policies; they do not establish live network or timer behavior. See the [learning tools and verification boundaries](./docs/FLUENCY_PLATFORM.md) for details.

## Get started

Requires **Node.js 24+** and **Yarn Classic 1.22.22**.

### Development

```sh
yarn install --frozen-lockfile
yarn dev
```

Open the address printed by Vite. Development saves learner work in the browser and works without the SQLite service.

### Local app with SQLite

After installing dependencies:

```sh
yarn build
yarn serve
```

Open the address printed by the server. It binds to `127.0.0.1` and stores learner data in `~/.code-reps/progress.sqlite`.

### Portable bundle

```sh
yarn package
```

This creates a portable local web bundle with its own Node runtime. It opens in your browser rather than installing a desktop app. See the [portable bundle guide](./docs/PORTABLE_BUNDLE.md) for instructions and platform verification limits.

## Your work stays local

- **Separate profiles** keep each learner’s drafts, attempts, and progress apart.
- **Portable JSON backups** are available through **Progress → Download backup**, with import for restores and transfers.
- **Automatic SQLite backups** run on startup and daily while the local server is running. The seven most recent daily backups stay in `~/.code-reps/backups`.
- **Browser migration** imports existing browser data on first use of the local server at the same address. If you used a different port, download a backup there and import it into the local app.

The [local setup guide](./docs/LOCAL_SETUP.md) covers installation, updates, backups, and restores.

## A focused workspace

| Control | Behavior |
| --- | --- |
| **Ctrl+Enter / Command+Enter** | Run checks from the workspace |
| **Stop checks** | Cancel the active run and keep your code |
| **Edit code** | Cancel an active run and clear obsolete feedback |
| **Tab** | Move focus out of the editor |

Monaco is the code editor, with a plain text fallback if it cannot load. Desktop layouts keep writing steps beside the editor; narrow screens show one pane at a time and keep save feedback visible. See the [UI guide](./docs/UI_GUIDE.md) for navigation, keyboard controls, and saved-state behavior.

Function reps execute authored code in a browser worker with a five-second timeout. Frontend reps use a sandboxed browser frame for previews and DOM checks, without an external service. These runners are for personal practice with code you write yourself, not secure isolation for arbitrary third-party exercises.

## Development checks

| Command | Checks |
| --- | --- |
| `yarn lint` | Source linting with Oxlint |
| `yarn test` | Unit and integration tests with Node’s test runner |
| `yarn content:check` | Authored content and depth coverage |
| `yarn build` | TypeScript, production build, and JavaScript bundle-size budgets |
| `yarn test:e2e` | Real-browser flows with Chromium and Monaco |

Install Chromium once before running the browser suite:

```sh
yarn playwright install chromium
yarn test:e2e
```

Pull requests and pushes to main run these checks in CI. Portable release builds also run a bundle smoke test. See [browser testing](./docs/BROWSER_TESTING.md) for coverage, data isolation, and debugging.

Automated checks do not establish learning effectiveness, full disconnected-browser operation, cross-platform behavior, visual fidelity, or assistive-technology support. Those remain separate validation tasks.

## Documentation

| Guide | What it covers |
| --- | --- |
| [Project plan](./PROJECT.md) | Product intent, learning loop, and scope |
| [Roadmap](./ROADMAP.md) | Shipped foundations, planned work, and release gates |
| [Local setup](./docs/LOCAL_SETUP.md) | Installation, updates, backups, and restores |
| [Portable bundles](./docs/PORTABLE_BUNDLE.md) | Distribution with a bundled Node runtime |
| [UI guide](./docs/UI_GUIDE.md) | Routes, keyboard controls, and saved state |
| [Design system](./docs/DESIGN_SYSTEM.md) | Code Reps palette, app-owned controls, and motion |
| [Fluency platform](./docs/FLUENCY_PLATFORM.md) | Learning tools and progress evidence |
| [Algorithms & Data Structures](./docs/ALGORITHMS_DATA_STRUCTURES.md) | Beginner progression and planned expansion |
| [Practical concepts](./docs/PRACTICAL_CONCEPTS.md) | Application policies and transfer practice |
| [Content authoring](./docs/CONTENT_AUTHORING.md) | Internal exercise and lesson standards |
| [Content gap map](./docs/CONTENT_GAPS.md) | Priorities for future practice content |
| [Browser testing](./docs/BROWSER_TESTING.md) | Real-browser coverage and verification limits |

---

Code Reps values independent work, plain-English explanations, useful retries, and learning data that stays on the learner’s machine. Accounts, cloud sync, leaderboards, certificates, and AI tutoring are outside the current scope.

**Free to use.** Source rights are reserved for now; the core app is intended to remain free.

Completion badges (`src/badges.ts`) are derived from completed attempts: a first-rep badge, one per path stage, and one per path. Each distinct rep counts once at its earliest valid completion, hinted attempts count, and drafts, ended sessions, and invalid or future dates do not. An earned date is the latest first completion among a badge's reps. Nothing is stored, so backups are unchanged. Badges follow the current path definitions: a required rep added to an earned stage returns that badge to upcoming with its completed reps kept, and a rep removed from a stage stops being required. When a badge is newly earned during a session, a quiet notice appears once; the acknowledged badge IDs live in per-profile session state, so they are not repeated on reload, are never exported, and need no storage key. Badges do not establish mastery and are separate from independent and retained evidence. Streaks use completed attempts grouped by calendar day in the current local timezone; yesterday keeps the current streak active until today ends. Imported completion history contributes to these summaries. All summaries are derived per profile without new storage or accounts.
