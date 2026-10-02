# Code Reps

A free, local-first place to learn concepts, practise coding, and see what you can solve independently. Code Reps starts with TypeScript and is designed to grow into frontend, backend, algorithms, data structures, debugging, and code-reading exercises.

The product plan is in [PROJECT.md](./PROJECT.md).
See [ROADMAP.md](./ROADMAP.md) for the version plan, [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) for local installation, updates, and restores, and [docs/CONTENT_AUTHORING.md](./docs/CONTENT_AUTHORING.md) for internal content guidance. Source rights are reserved for now; the core app is intended to remain free to use.

## Status

Seventy-two TypeScript reps are playable. Local profiles separate each learner’s work without signup. A learning hub adds 30 searchable knowledge lessons, interactive checks, self-assessment rubrics, personal practice plans, notes, recurring reviews, timed interview practice, and two multi-file projects. See [docs/FLUENCY_PLATFORM.md](./docs/FLUENCY_PLATFORM.md) for the learning tools and verification boundaries. A real-world path adds checkout debugging, batch-pipeline predictions, an interactive browser directory, a ticket request handler, and behavior-preserving stock-report refactoring. Learners can start with language basics or guided problem solving. Free paths now cover AI-era coding habits, frontend core, backend core, and untimed frontend and backend interview practice. Each path begins with a plain-language introduction and a small example before its first rep. The new lessons teach learners to inspect suggested code, validate inputs, derive UI states, and explain their choices. Seven skill journeys cover arrays, words, lookups, stacks, request ownership, resource ownership, and validation: guided practice, a related problem without hints, and a fresh recall problem after three days. Progress explains the evidence behind Learning, Practising, Independent, and Retained. Code checks verify behavior; a written rubric helps learners review their own plans and explanations. Attempts and drafts are saved locally with SQLite when using the local server, with JSON export and import for portability.

The [Practical Concepts path](./docs/PRACTICAL_CONCEPTS.md) adds closures, reference equality, event-loop ordering, promises, singleton ownership, observer and pub/sub subscriptions, dependency injection, debouncing, throttling, cancellation and races, WebSockets, polling and SSE, cleanup and reference counting, caching, retry backoff, idempotency, and optimistic updates. Knowledge groups lessons by topic, and Home keeps draft and review queues compact with an option to show all. The [content gap map](./docs/CONTENT_GAPS.md) guides future batches. Practical-concept traces check application policies; they do not establish live network or timer behavior.

## Run locally

Requires Node.js 24 or later.

```sh
yarn install
yarn dev
```

To run the built app from a local server on your laptop:

```sh
yarn build
yarn serve
```

`yarn package` creates a portable local web bundle with its own Node runtime. It still opens in a browser; it does not install a desktop app.

Open the local address printed by the server. It binds to `127.0.0.1` and stores learner data in `~/.code-reps/progress.sqlite`. On first use, it migrates browser data from the same address. If you previously used a different port, download a backup there and import it in the local app. A SQLite backup is saved on startup and daily while running; the seven most recent daily backups are kept in `~/.code-reps/backups`. Progress → Download backup also creates a portable JSON file. No account or paid tier is needed.

Run `yarn content:check`, `yarn build`, `yarn lint`, and `yarn test` to check the app. The build also checks JavaScript bundle-size budgets. Pull requests and pushes to main run these checks plus Chromium browser flows in CI; portable release builds run a bundle smoke test.

For real-browser practice checks, run `yarn playwright install chromium` once after installing dependencies, then `yarn test:e2e`. See [docs/BROWSER_TESTING.md](./docs/BROWSER_TESTING.md) for coverage and isolation details.

Function reps run authored code in a browser worker with a five-second timeout. The frontend implementation rep uses a sandboxed browser frame for its preview and DOM interaction checks; it needs no external service. This is for personal practice with code you write yourself; it is not an isolation boundary for imported third-party exercises.

In the workspace, press Ctrl+Enter or Command+Enter to run checks, or use Run checks. Stop checks cancels a run without changing your code. Editing code cancels an active run and clears old feedback. Tab moves focus out of the editor. If the editor cannot load, a plain text editor lets you keep writing and running checks. Narrow and short screens use page scrolling, and narrow screens keep save feedback visible.

## Guiding principles

- Learn terminology without revealing the solution.
- Practise independently, then explain the reasoning.
- Track retained skills and useful retries, not just completed problems.
- Keep learning data on the learner's machine.
- Make the workspace pleasant and focused enough to return to regularly.
