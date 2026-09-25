# Code Reps

A local-first place to learn concepts, practise coding, and prepare for technical interviews. Code Reps starts with TypeScript and is designed to grow into frontend, backend, algorithms, data structures, debugging, and code-reading exercises.

The product plan is in [PROJECT.md](./PROJECT.md).

## Status

Three TypeScript reps are playable: plan an approach, solve it in a local Monaco editor, run six checks, explain your reasoning, and save the attempt in this browser. Each rep keeps its own draft in this browser. Attempt history and the local service are still planned.

## Run locally

Requires a current Node.js installation.

```sh
yarn install
yarn dev
```

Run `yarn build` and `yarn lint` to check the app.

The first rep runs authored code in a browser worker with a five-second timeout. This is for personal practice with code you write yourself; it is not an isolation boundary for imported third-party exercises.

## Guiding principles

- Learn terminology without revealing the solution.
- Practise independently, then explain the reasoning.
- Track retained skills and useful retries, not just completed problems.
- Keep learning data on the learner's machine.
- Make the workspace pleasant and focused enough to return to regularly.
