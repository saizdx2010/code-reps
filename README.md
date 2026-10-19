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

> Passing checks establishes behavior. Plans and explanations use a self-review rubric; independent fluency and retention need evidence from unhinted work and later recall.

## What you can practice

- **TypeScript foundations:** playable reps and searchable knowledge lessons, with starting points for beginners and returning developers.
- **Guided tracks:** Foundations (TypeScript basics, reading and repairing code, how JavaScript runs) plus the tracks that build on it: Problem solving, Pattern Recognition, Frontend, SQL, Backend, and DevOps. The track picker suggests an order (SQL builds on Foundations, Backend on SQL, DevOps on Backend) as guidance only; nothing is locked. Interview rounds sit at the end of Problem solving, Frontend, and Backend and are untimed.
- **SQL and SQLite practice:** SQL reps take SQL text in a `query.sql` editor; three reps in SQL's Change data safely stage (a stock transfer with rollback, a per-customer JOIN report, and an all-or-nothing restock) call SQLite from TypeScript, and Backend links to that stage instead of repeating it. Every check runs in a fresh in-memory SQLite database in the practice worker. The brief draws each table's columns and first rows from the same schema and seed the checks load, and a failed check shows the expected and received rows side by side with the first difference named. They work in browser development without the local service and never open the learner progress database. Checks establish SQLite's behavior on the authored data, not other SQL dialects or performance.
- **Backend services:** Backend opens by reading the parts of a request: splitting a target, decoding a query string, parsing a request line, reading headers in any letter case, and accepting a JSON body only when it is declared. It then routes requests: matching path patterns, choosing 404 or 405, cleaning and building paths, and picking the most specific route. Later it decides who may act (whether a session still counts, what a role allows, and which notes or loans a member may reach, answering 401, 403, or 404), keeps concurrent edits from being lost with version numbers, If-Match tags, and compare-and-set, runs background jobs with retries, dead letters, leases, and repeat-safe handlers, limits request rates with token buckets and sliding windows, and evolves its API with versions, compatibility checks, deprecation and sunset dates, webhook signatures, and webhook deliveries that arrive twice or out of order. Each handler is a function over request values that the checks call directly, not a live server.
- **DevOps policies:** DevOps reps are TypeScript functions that apply an authored policy to authored inputs: reading CI output (exit codes, the first real error in a noisy log, step conditions, compiler errors as annotations, and the step that failed a job) checking configuration (typed settings with defaults, a schema checked at startup, masked secrets, .env files, and drift between environments), working with versions (comparing and choosing semantic versions, sorting pre-releases, caret and tilde ranges, and lockfile changes), running pipelines (job order and loops, cache keys and fallbacks, the critical path, and skipping jobs a change cannot affect), building container images (which layers a change rebuilds, in one stage or several, the build context, image tags, and tag cleanup), deploying safely (rolling batches, blue/green switches, stable-hash percentage rollouts, paused canaries, and promote-or-roll-back decisions), keeping instances healthy (liveness versus readiness, check thresholds, restart backoff, check timing for slow starts, and draining before shutdown), and scheduling jobs (cron fields and the two-day-field rule, local times across clock changes, and the next run in UTC or a named time zone, with the time and zone always passed in), and watching a service (nearest-rank percentiles, error budgets and burn rates in whole numbers, latency targets per route, two-window burn alerts, and alerts that do not flap), and learning from incidents (a timeline across time offsets, durations, impact windows, recent changes, and a postmortem skeleton whose explanation the learner writes and reviews themselves). The checks call each function directly; they do not run a shell, Docker, a CI service, or a real network. The track ends with a hero project, shown as the trail's last step and opened in Library → Projects, containerizing a service and adding CI on the learner's own machine, recorded as a learner-reported self-review note that Code Reps never checks or counts.
- **React practice:** three reps render real React components in the sandboxed frame: one checks that subscriptions are released, one that list keys keep rows and ticks with their data, and one that stale request results are ignored.
- **Real-world tasks:** checkout debugging, batch-pipeline predictions, an interactive browser directory, a ticket request handler, and behavior-preserving stock-report refactoring.
- **Skill journeys:** from arrays, words, and lookups through text building, validation, request ownership, timing policies, reliable requests, sorting, trees, linked lists, heaps, dynamic programming, graphs, grids, debugging, reviewing suggested code, maintenance, DOM interactions, and composite widgets. Each pairs guided work with an independent problem and fresh recall after three days.
- **Algorithms & Data Structures:** collection operations before problem solving, stacks and queues, two pointers, windows, binary search, sorting, recursion, trees, binary search trees, graphs, linked lists, heaps, backtracking, and introductory dynamic programming. Pattern Recognition then asks you to choose the tool from the contract. See the [path guide](./docs/ALGORITHMS_DATA_STRUCTURES.md) for scope and expansion.
- **Practical concepts:** closures, reference equality, async ordering, subscriptions, dependency injection, cancellation, caching, retries, idempotency, and optimistic updates. Local async practice awaits deterministic injected fetchers (sequential records, parallel panel outcomes, and cancellable exports) without network or timer waits. See the [Practical Concepts guide](./docs/PRACTICAL_CONCEPTS.md) for the full scope and evidence limits.
- **Browser application journey:** a TypeScript state-modeling lesson and guided/independent/delayed-recall reps, plus three freely accessible external project levels using plain TypeScript and the DOM. Detailed requirements cover forms, persistence recovery, real promises, learner-written tests, and a runnable production build. External self-reviews are learner-reported and do not grant retained-skill status.
- **Personal practice:** two multi-file projects, weekly plans, notes, recurring reviews, self-assessment, and optional timed interview rounds.

Trail is home: your chosen track drawn as stages, with lessons placed before the reps that use them, and your next rep beside it. Below it, **Today** lists one new rep and up to two due reviews, each marked done once you complete it today, and a compact list keeps a saved draft. All tracks shows Foundations and the tracks that build on it, and holds the starting-point choice. Saved goals that name a retired path (typescript-browser, practical-concepts, real-world, ai-era, interviews) move to the track that absorbed it. Library holds exercises, lessons, projects, and interviews. Progress holds your skills and the Journal: completed attempts, notes, and mistakes in one place.

Progress shows your local profile, completion badges, your practice rhythm, and the evidence behind **Not started**, **Guided**, **Independent**, and **Retained**. Progress → Skill map (`#/skillmap`) draws each skill of a track as a node labelled Not started, Guided, Independent, Retained, or Review due, with a link to the next useful rep; the labels describe recorded practice, not mastery.

- **Badges** (`src/badges.ts`) are derived from completed attempts. Completion badges are a first-rep badge, one per track stage, and one per track. Evidence badges (`src/evidence-badges.ts`) reward learning rather than volume: first independent skill, first retained skill, five and ten skills kept, held for a month (a hint-free recall 30 or more days after independence), four steady weeks (3 or more practice days in each of 4 Monday-to-Sunday weeks in a row, reviews included), welcome back (practice after a break of 14 days or more), and stage, independently (every skill of one track stage at Independent, for stages of two or more skills, so one rep never earns it alongside first independent skill). Each badge is drawn from the logo (`src/BadgeArt.tsx`): a coding-desk tile with the code brackets and the three rep bars as the evidence ladder; square tiles are evidence and round tiles are completion, and the art follows Sage, Ocean, and Plum. Progress lists only earned badges, evidence first, quietly, with no upcoming list. An evidence badge names what earned it and opens that rep. Each distinct rep counts once at its earliest valid completion; hinted attempts count, and drafts and invalid or future dates do not. A completion badge's earned date is the latest first completion among its reps; an evidence badge's is the completion that earned it, shown as a calendar day in your timezone. Badges follow the current track definitions: a required rep added to an earned stage stops showing that badge as earned while its completed reps are kept. A newly earned badge shows a quiet notice once per browser session. Nothing is stored, so backups are unchanged. Badges do not establish mastery and are separate from independent and retained evidence.
- **Streaks** group completed attempts by calendar day in the current local timezone (`src/profile-progress.ts`). Any completed attempt makes a practice day, reviews included. A streak counts practice days and carries over a single missed day (a rest day) when no other rest day falls within seven days of it; two missed days in a row end it, and yesterday keeps it active until today ends. Beside it, Progress shows how many of the last seven days you practiced and draws them as one row (new practice, reviews only, a carried-over rest day, today); the 12-week calendar sits under **Last 12 weeks**. Imported completion history counts.
- **Learning moments** are worked out from completed attempts, so nothing is stored and backups are unchanged. When the attempt you just completed moves a skill to Independent or Retained, the completion panel says **Skill moved up** (Guided is never celebrated), and the skill map replays the change once, the next time it opens in that browser session. The panel may also show one note that compares the attempt only with your own earlier work (`src/personal-best.ts`): **Recall held** (a recall rep solved without hints at least 14 days after the skill's first hint-free rep), **Personal best** (no hints, after hints last time on that skill or rep), or **Fewer hints** (a repeat with fewer hints than last time, still at least one). First attempts, ties, worse attempts, and invalid or future dates show nothing. **Today** on Trail (`src/today-plan.ts`) is one new rep and up to two due reviews; it is recalculated from attempts completed today, starts again at local midnight, stays hidden when it would only repeat the next-practice panel, and never locks anything.
- **Mistake tags:** while reviewing a rep you can optionally tag mistakes from a fixed list (off-by-one, mutated input, missed empty case, wrong boundary condition, misread contract, type or null handling, other). Journal → Mistakes counts each tag, lists recent attempts, and compares the last 14 days with the 14 days before. Tags are self-reported, never block completion, and do not measure skill. They are stored as an optional `mistakes` array on each attempt (`src/mistakes.ts`), so older attempts and backups load unchanged.

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
