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

Plan and Explain offer optional English sentence starters above the writing field. Selecting one appends it to your draft and returns focus to the field; your writing saves normally. **Show Indonesian help**, beside Quick vocabulary in the brief, is off by default. It adds short Indonesian glosses where available and an English tips disclosure in Explain. English stays primary. This profile-scoped preference survives refresh in the current browser session and never enters learner backups.

After every check passes, a rep with an authored step trace also compares your code line by line with the trace's reference code, ignoring spacing and comments; a different approach can still be correct. After you complete a rep you have finished before, or a journey's independent or recall rep, **Read back your earlier explanation** shows that earlier plan and explanation beside today's (`src/compare-work.ts`). Both appear only after your own work is done.

Check results also show the editor's TypeScript errors for your files, labelled as separate from the checks: code can pass every check with a type error, and a clean type check does not prove the types a brief asks for.

> Passing checks establishes behavior. Plans and explanations use a self-review rubric; independent fluency and retention need evidence from unhinted work and later recall.

## What you can practice

- **TypeScript foundations:** playable reps and searchable knowledge lessons, with starting points for beginners and returning developers.
- **Guided tracks:** Foundations (TypeScript basics, reading and repairing code, how JavaScript runs) plus four tracks that build on it: Problem solving, Pattern Recognition, Frontend, and Backend. Interview rounds sit at the end of Problem solving, Frontend, and Backend and are untimed.
- **SQLite practice:** one stock-transfer rep runs real SQL and commit/rollback checks in a fresh in-memory database per check. It works in browser development without the local service and never opens the learner progress database.
- **React practice:** one rep renders a real React component in the sandboxed frame and checks that its subscriptions are released, including after unmount.
- **Real-world tasks:** checkout debugging, batch-pipeline predictions, an interactive browser directory, a ticket request handler, and behavior-preserving stock-report refactoring.
- **Skill journeys:** from arrays, words, and lookups through validation, request ownership, sorting, trees, graphs, grids, debugging, reading stack traces, maintenance, and DOM interactions. Each pairs guided work with an independent problem and fresh recall after three days.
- **Algorithms & Data Structures:** collection operations before problem solving, stacks and queues, two pointers, windows, binary search, sorting, recursion, trees, binary search trees, graphs, linked lists, heaps, backtracking, and introductory dynamic programming. Pattern Recognition then asks you to choose the tool from the contract. See the [path guide](./docs/ALGORITHMS_DATA_STRUCTURES.md) for scope and expansion.
- **Pattern cards:** Lessons → Pattern cards (`#/patterns`, `src/pattern-cards.ts`) shows a short unlabeled contract and three tools. After you choose, it names the deciding signal and why the tempting alternative fits less well, then links a rep that applies the tool. Answers stay on the page and never count as evidence.
- **Practical concepts:** closures, reference equality, async ordering, subscriptions, dependency injection, cancellation, caching, retries, idempotency, and optimistic updates. Local async practice awaits deterministic injected fetchers (sequential records, parallel panel outcomes, and cancellable exports) without network or timer waits. See the [Practical Concepts guide](./docs/PRACTICAL_CONCEPTS.md) for the full scope and evidence limits.
- **Browser application journey:** a TypeScript state-modeling lesson and guided/independent/delayed-recall reps, plus three freely accessible external project levels using plain TypeScript and the DOM. Detailed requirements cover forms, persistence recovery, real promises, learner-written tests, and a runnable production build. External self-reviews are learner-reported and do not grant retained-skill status.
- **Personal practice:** two multi-file projects, weekly plans, notes, recurring reviews, self-assessment, and optional timed interview rounds.

Trail is home: your chosen track drawn as stages, with lessons placed before the reps that use them, and your next rep beside it, with one compact list for a saved draft and a due review. All tracks shows Foundations and the tracks that build on it, and holds the starting-point choice. Saved goals that name a retired path (typescript-browser, practical-concepts, real-world, ai-era, interviews) move to the track that absorbed it. Library holds exercises, lessons, projects, and interviews. Progress holds your skills and the Journal: completed attempts, notes, and mistakes in one place.

**Quick warm-up** on Trail offers three short Beginner reps you finished at least a day ago, least recently practiced first and from different topics where possible (`src/warmup.ts`). Starting it opens the first rep from its starter, and the completion button leads through the rest. Unfinished drafts and recall reps that are not ready yet are never included, and a warm-up completion counts like any other attempt.

Progress shows your local profile, completion badges, completed-rep calendar streaks, and the evidence behind **Learning**, **Practicing**, **Independent**, and **Retained**. Progress → Skill map (`#/skillmap`) draws each skill of a track as a node labelled Not started, Practiced, Independent, Retained, or Review due, with a link to the next useful rep; the labels describe recorded practice, not mastery.

- **Badges** (`src/badges.ts`) are derived from completed attempts: a first-rep badge, one per track stage, and one per track. Progress lists only earned badges, quietly, with no upcoming list. Each distinct rep counts once at its earliest valid completion; hinted attempts count, and drafts and invalid or future dates do not. An earned date is the latest first completion among a badge's reps. Badges follow the current track definitions: a required rep added to an earned stage stops showing that badge as earned while its completed reps are kept. A newly earned badge shows a quiet notice once per browser session. Nothing is stored, so backups are unchanged. Badges do not establish mastery and are separate from independent and retained evidence.
- **Streaks** group completed attempts by calendar day in the current local timezone; yesterday keeps the current streak active until today ends. Imported completion history counts.
- **Practice calendar** on Progress shades the last 20 weeks by completed attempts per local day (`activityCalendar` in `src/profile-progress.ts`), with the counts also stated in text. **Look back at the last seven days**, at the top of the weekly plan (`#/plan`, `src/retro.ts`), summarizes that week's attempts, unhinted work, most tagged mistake, and most common hardest part, and saves three short reflection answers as an ordinary Notebook note. Neither is a skill measure.
- **Mistake tags:** while reviewing a rep you can optionally tag mistakes from a fixed list (off-by-one, mutated input, missed empty case, wrong boundary condition, misread contract, type or null handling, other). Journal → Mistakes counts each tag, lists recent attempts, and compares the last 14 days with the 14 days before. Tags are self-reported, never block completion, and do not measure skill. They are stored as an optional `mistakes` array on each attempt (`src/mistakes.ts`), so older attempts and backups load unchanged.
- **Stuck points:** the optional “What was hardest?” answer now also offers “Something I had not learned yet” and “Combining the pieces”. Journal → Stuck points (`#/stuck`, `src/stuck.ts`) groups these answers, including saved drafts, by kind and by topic, suggests where to focus next with the rep's linked lesson or a nearer step, and gives one habit per kind. Journal → Mistakes now offers a habit and related lessons for each tag. Both are self-reported and never change skill evidence.

Practice sessions were retired from the interface. Existing `sessions:v1` records stay in storage and backups and still import, but they are no longer created or shown, and the old `#/sessions` bookmark opens the Journal.

Practical-concept traces check authored application policies; they do not establish live network or timer behavior. See the [learning tools and verification boundaries](./docs/FLUENCY_PLATFORM.md) for details.

## Get started

Requires **Node.js 24+** and **Yarn Classic 1.22.22**.

```sh
yarn install --frozen-lockfile
yarn dev          # development: saves work in the browser, no SQLite service needed
```

To run the local app with SQLite instead, run `yarn build` and then `yarn serve`. It binds to `127.0.0.1` and stores learner data in `~/.code-reps/progress.sqlite`. `yarn package` builds a portable local web bundle with its own Node runtime; see the [portable bundle guide](./docs/PORTABLE_BUNDLE.md).

Your work stays local: separate profiles keep each learner's work apart, **Progress → Download backup** exports a portable JSON backup, and the local server keeps daily SQLite snapshots. The [local setup guide](./docs/LOCAL_SETUP.md) covers installation, updates, backups, restores, and moving browser data to the local app.

## A focused workspace

| Control | Behavior |
| --- | --- |
| **Ctrl+Enter / Command+Enter** | Run checks from the workspace |
| **Stop checks** | Cancel the active run and keep your code |
| **Edit code** | Cancel an active run and clear obsolete feedback |
| **Tab** | Move focus out of the editor |

Monaco is the code editor, with a plain text fallback if it cannot load. Desktop layouts keep writing steps beside the editor; narrow screens show one pane at a time and keep save feedback visible. See the [UI guide](./docs/UI_GUIDE.md) for navigation, keyboard controls, and saved-state behavior.

Function reps execute authored code in a browser worker with a five-second timeout. Frontend reps use a sandboxed browser frame for previews and DOM checks, without an external service. These runners are for personal practice with code you write yourself, not secure isolation for arbitrary third-party exercises.

## Development

[Maintaining](./docs/MAINTAINING.md) lists every command, what each gate catches, and when to run it; [AGENTS.md](./AGENTS.md) is the same contract for coding agents. `just check` runs lint, build, tests, and content validation; `just check-all` adds the Chromium suite. Pull requests and pushes to main run these checks in CI.

Automated checks do not establish learning effectiveness, full disconnected-browser operation, cross-platform behavior, visual fidelity, or assistive-technology support. Those remain separate validation tasks.

## Documentation

| Guide | What it covers |
| --- | --- |
| [Project plan](./PROJECT.md) | Product intent, learning loop, content model, and scope |
| [Roadmap](./ROADMAP.md) | Shipped foundations, planned work, and release gates |
| [Local setup](./docs/LOCAL_SETUP.md) | Installation, updates, backups, and restores |
| [Portable bundles](./docs/PORTABLE_BUNDLE.md) | Distribution with a bundled Node runtime |
| [UI guide](./docs/UI_GUIDE.md) | Routes, keyboard controls, and saved state |
| [Design system](./docs/DESIGN_SYSTEM.md) | Page structure, tokens, shared components, and motion |
| [Fluency platform](./docs/FLUENCY_PLATFORM.md) | Learning tools and progress evidence |
| [Algorithms & Data Structures](./docs/ALGORITHMS_DATA_STRUCTURES.md) | Problem solving and Pattern Recognition progression |
| [Practical concepts](./docs/PRACTICAL_CONCEPTS.md) | Application policies and transfer practice |
| [Browser application journey](./docs/TYPESCRIPT_BROWSER_JOURNEY.md) | Plain TypeScript browser projects and their evidence limits |
| [Richer exercises](./docs/RICH_EXERCISES.md) | Debugging, reading, frontend, backend, multi-file, testing, and React formats |
| [Find the bug](./docs/FIND_THE_BUG.md) | Learner-written test cases that expose faulty implementations |
| [Maintenance journey](./docs/MAINTENANCE_JOURNEY.md) | Reading, reproducing, fixing, and adapting unfamiliar code |
| [Content authoring](./docs/CONTENT_AUTHORING.md) | Internal exercise and lesson standards |
| [Content gap map](./docs/CONTENT_GAPS.md) | Topics without dedicated journeys, and how to choose the next batch |
| [Maintaining](./docs/MAINTAINING.md) | Commands, gates, adding reps and lessons, common failures, and backups |
| [Browser testing](./docs/BROWSER_TESTING.md) | Real-browser coverage and verification limits |
| [Local reliability](./docs/LOCAL_RELIABILITY.md) | Reliability checks still pending |
| [Performance](./docs/PERFORMANCE.md) | Bundle budgets and editor-loading measurements |
| [Accessibility review](./docs/ACCESSIBILITY_REVIEW.md) | Manual screen-reader, zoom, and contrast walkthrough |
| [Learner validation](./docs/LEARNER_VALIDATION.md) | Protocol for observing learners |
| [Decision records](./docs/adr/README.md) | Architecture decisions and their status |

Finished reviews and plans are kept in [docs/archive](./docs/archive/) as historical records.

---

Code Reps values independent work, plain-English explanations, useful retries, and learning data that stays on the learner’s machine. Accounts, cloud sync, leaderboards, certificates, and AI tutoring are outside the current scope.

**Free to use.** Source rights are reserved for now; the core app is intended to remain free.
