<div align="center">

# Code Reps

**Build coding fluency, one rep at a time.**

A free, local-first place to learn concepts, practise independently, and explain your decisions.

**Understand → Plan → Solve → Explain → Review**

[Get started](#get-started) · [What you can practise](#what-you-can-practise) · [Documentation](#documentation) · [Roadmap](./ROADMAP.md)

</div>

---

## A place to practise with intention

Code Reps starts with TypeScript and pairs coding exercises with plain-English lessons, progressive hints, and authored self-reviews. Local profiles keep each learner’s work separate, with no signup or paid tier.

| Learn | Practise | Reflect |
| --- | --- | --- |
| Searchable lessons, worked examples, and interactive knowledge checks | Coding reps, realistic debugging, multi-file projects, and optional timed interviews | Saved attempts, personal notes, recurring reviews, and evidence behind progress |

The workspace follows five steps:

1. **Understand** the task, examples, constraints, and vocabulary.
2. **Plan** your approach and identify edge cases.
3. **Solve** in the editor, run checks, and reveal hints when you need them.
4. **Explain** your decisions, tradeoffs, and complexity in plain English.
5. **Review** the result, reflect on difficulties, and return for fresh practice.

> Passing checks establishes behavior. Plans and explanations use a self-review rubric; independent fluency and retention need evidence from unhinted work and later recall.

## What you can practise

- **TypeScript foundations:** 72 playable reps and 30 searchable knowledge lessons, with starting points for beginners and returning developers.
- **Guided paths:** language basics, problem solving, AI-era coding habits, frontend core, backend core, and untimed interview practice.
- **Real-world tasks:** checkout debugging, batch-pipeline predictions, an interactive browser directory, a ticket request handler, and behavior-preserving stock-report refactoring.
- **Skill journeys:** arrays, words, lookups, stacks, request ownership, resource ownership, and validation. Each pairs guided work with an independent problem and fresh recall after three days.
- **Practical concepts:** closures, reference equality, async ordering, subscriptions, dependency injection, cancellation, caching, retries, idempotency, and optimistic updates. See the [Practical Concepts guide](./docs/PRACTICAL_CONCEPTS.md) for the full scope.
- **Personal practice:** two multi-file projects, weekly plans, notes, recurring reviews, self-assessment, and optional timed interview rounds.

Home brings together your next rep, drafts, and due reviews. Practice holds exercises, projects, and interviews; Learn holds paths, lessons, and notes; Progress shows history and the evidence behind **Learning**, **Practising**, **Independent**, and **Retained**.

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
| [Fluency platform](./docs/FLUENCY_PLATFORM.md) | Learning tools and progress evidence |
| [Practical concepts](./docs/PRACTICAL_CONCEPTS.md) | Application policies and transfer practice |
| [Content authoring](./docs/CONTENT_AUTHORING.md) | Internal exercise and lesson standards |
| [Content gap map](./docs/CONTENT_GAPS.md) | Priorities for future practice content |
| [Browser testing](./docs/BROWSER_TESTING.md) | Real-browser coverage and verification limits |

---

Code Reps values independent work, plain-English explanations, useful retries, and learning data that stays on the learner’s machine. Accounts, cloud sync, leaderboards, certificates, and AI tutoring are outside the current scope.

**Free to use.** Source rights are reserved for now; the core app is intended to remain free.
