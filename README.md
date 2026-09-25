# Code Reps

A free, local-first place to learn concepts, practise coding, and see what you can solve independently. Code Reps starts with TypeScript and is designed to grow into frontend, backend, algorithms, data structures, debugging, and code-reading exercises.

The product plan is in [PROJECT.md](./PROJECT.md).
See [ROADMAP.md](./ROADMAP.md) for the version plan, [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) for local installation, updates, and restores, and [docs/CONTENT_AUTHORING.md](./docs/CONTENT_AUTHORING.md) for internal content guidance. Source rights are reserved for now; the core app is intended to remain free to use.

## Status

Twenty-two TypeScript reps are playable. Learners can start with language basics or guided problem solving. Four skill journeys cover arrays, words, lookups, and stacks: guided practice, a related problem without hints, and a fresh recall problem after three days. Small debugging, code-reading, and data-transformation tasks apply familiar skills to working code. Progress explains the evidence behind Learning, Practising, Independent, and Retained. Code checks verify behavior; a written rubric helps learners review their own plans and explanations. Attempts and drafts are saved locally with SQLite when using the local server, with JSON export and import for portability.

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

Open the local address printed by the server. It binds to `127.0.0.1` and stores learner data in `~/.code-reps/progress.sqlite`. On first use, it migrates browser data from the same address. If you previously used a different port, download a backup there and import it in the local app. A SQLite backup is saved on startup and daily while running; the seven most recent daily backups are kept in `~/.code-reps/backups`. Progress → Download backup also creates a portable JSON file. No account or paid tier is needed.

Run `yarn build`, `yarn lint`, and `yarn test` to check the app.

Each rep runs authored code in a browser worker with a five-second timeout. This is for personal practice with code you write yourself; it is not an isolation boundary for imported third-party exercises.

## Guiding principles

- Learn terminology without revealing the solution.
- Practise independently, then explain the reasoning.
- Track retained skills and useful retries, not just completed problems.
- Keep learning data on the learner's machine.
- Make the workspace pleasant and focused enough to return to regularly.
