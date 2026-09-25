# Code Reps

A local-first place to learn concepts, practise coding, and prepare for technical interviews. Code Reps starts with TypeScript and is designed to grow into frontend, backend, algorithms, data structures, debugging, and code-reading exercises.

The product plan is in [PROJECT.md](./PROJECT.md).

## Status

Ten TypeScript reps are playable: plan an approach, solve it in a local Monaco editor, run six checks, explain your reasoning, reflect on the difficulty, and save the attempt in this browser. Each rep keeps its own draft in this browser. Completed attempts are saved in History with their reflection. Paths offers a guided TypeScript problem-solving sequence through the current reps and tracks completed work. Home recommends unfinished work and brings back reps marked for more practice or completed with hints after three days. Learn has short skill notes and a glossary drawn from the reps. A local service and SQLite storage are still planned.

## Run locally

Requires a current Node.js installation.

```sh
yarn install
yarn dev
```

Run `yarn build` and `yarn lint` to check the app.

Each rep runs authored code in a browser worker with a five-second timeout. This is for personal practice with code you write yourself; it is not an isolation boundary for imported third-party exercises.

## Guiding principles

- Learn terminology without revealing the solution.
- Practise independently, then explain the reasoning.
- Track retained skills and useful retries, not just completed problems.
- Keep learning data on the learner's machine.
- Make the workspace pleasant and focused enough to return to regularly.
