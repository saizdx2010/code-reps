# Code Reps

A free, local-first place to learn concepts, practise coding, and see what you can solve independently. Code Reps starts with TypeScript and is designed to grow into frontend, backend, algorithms, data structures, debugging, and code-reading exercises.

The product plan is in [PROJECT.md](./PROJECT.md).

## Status

Sixteen TypeScript reps are playable. Learners can start with language basics or guided problem solving. The first complete skill journey uses arrays: guided practice, a related problem without hints, and a fresh recall problem after three days. Progress explains the evidence behind Learning, Practising, Independent, and Retained. Code checks verify behavior; a written rubric helps learners review their own plans and explanations. Attempts and drafts stay in this browser, with JSON export and import for portability. A SQLite service remains a possible later storage option.

## Run locally

Requires a current Node.js installation.

```sh
yarn install
yarn dev
```

To run the built app from a local server on your laptop:

```sh
yarn build
yarn serve
```

Open the local address printed by the server. The server binds to `127.0.0.1`; learner data remains in that browser's local storage, so use Progress → Download backup before changing browsers or clearing site data. Import backup adds history and fills empty drafts without replacing existing drafts. No account or paid tier is needed.

Run `yarn build`, `yarn lint`, and `yarn test` to check the app.

Each rep runs authored code in a browser worker with a five-second timeout. This is for personal practice with code you write yourself; it is not an isolation boundary for imported third-party exercises.

## Guiding principles

- Learn terminology without revealing the solution.
- Practise independently, then explain the reasoning.
- Track retained skills and useful retries, not just completed problems.
- Keep learning data on the learner's machine.
- Make the workspace pleasant and focused enough to return to regularly.
