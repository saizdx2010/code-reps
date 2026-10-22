# Break it

A Break it hunt is a quick bug hunt. The learner reads a short, plausible function (the *suspect*) and its contract, and their move is one input at a time. Each try runs the suspect and the contract on a fresh copy of the input: the same answer means keep looking, and a different one is a *catch*. The format trains the same boundary thinking as the [find-the-bug journey](./FIND_THE_BUG.md), without writing a case table first.

One task ships: `break-page-count` (**Break pageCount**), in Library → Reliability & testing → Testing with cases. It is not placed on a track or a journey, so no stage, badge, or recommendation changes. The approved design is section 5 of the FigCraft page "Proposals — Playful practice" (`design/previews/47-proposal-playful-practice-light.png`).

## How it plays

- **Solve shows the hunt** in place of the editor, the checks drawer, and the run bar: the suspect as `suspect.ts` (read only, wrapped like the editor), then **Your move** with a "2 bugs hidden" chip, one labelled field per parameter, and **Try it** (Enter in a field also tries). The brief keeps the contract, one rule per line.
- **Inputs outside the contract are refused** with the rule they break ("Not tried. perPage is a whole number ≥ 1."), the field is marked invalid and focused, and nothing is added. Only whole numbers written as digits are read, within each parameter's range. Trying an input again points at the earlier try instead of adding a row. A hunt keeps up to 100 tries.
- **The log** lists tries newest first: `#2 · items 10, perPage 5 · suspect 3 · contract 2`, with a **Same answer** chip, or, on a catch, the suspect's answer struck through and a **Caught one** chip (**Caught again** when the try only exposes a bug an earlier try caught). The strike and the chip carry the result, never colour alone.
- **The catch card** appears with the first catch: "1 of 2 bugs caught", a segment per authored bug, one sentence about the latest catch, and **What is the bug, in one sentence?** (with two or more caught, "What are the bugs? One sentence each."). That field is the attempt's explanation, the same text as the Explain step. It offers **Keep hunting** (back to the first field) and **Reread the contract**; once every bug is caught, **Go to Finish** and **Compare in Explain**. The count is of distinct authored bugs, not tries. The card states what was observed and does not describe the bug; the authored descriptions are in the review after the hunt.
- **Stop**: while a try runs, Try it becomes Stop. Stopping adds nothing and keeps the tries.
- **Finishing** uses the ordinary rules: the checks must pass (every bug caught, and every try inside the contract), and this Intermediate rep also needs a plan and the explanation, both self-reviewed.

Motion follows the [design system](./DESIGN_SYSTEM.md#motion): a new try slides into the top of the log over 180 ms; on a catch the suspect's answer takes a strike, the check icon plays its reaction, and the meter segment fills once. There is no shaking or confetti, and reduced motion makes all of it instant.

## Data and runner

| Piece | Owner |
| --- | --- |
| `format: 'break'` and `breakIt: BreakTask` (suspect, contract, `params` with `min`, `max`, and `rule`, and `bugs` as `{ id, variant }`) | `src/rep-types.ts` |
| The tries table: reading, writing, input rules, and counting caught bugs | `src/break-it.ts` |
| Running a table: `runBreakIt`, used by the worker and by `runRep`/`runAsyncRep` | `src/run-rep.ts`, `src/runner.worker.ts` |
| The desk, loaded with the first hunt opened, and its stylesheet | `src/BreakIt.tsx`, `src/break-it.css` |
| The hunt's content and reviews | `src/break-it-reps.ts`, `src/review-break-it.ts` |

**Saved work.** The tries are the attempt's `code` text, so the attempt shape, storage keys, drafts, profile separation, backups, and profile files do not change. The text is a JSON array with one try per line, which keeps the Journal and **Then and now** readable:

```
[
  {"input":[7,3],"suspect":"3","contract":"3","caught":[]},
  {"input":[10,5],"suspect":"3","contract":"2","caught":["full-last-page"]}
]
```

The starter is `[]`. Saved text that cannot be read is never replaced on its own: the desk says so and keeps it until the learner chooses **Start a new table**.

**A try.** The page checks the input against the rules, then sends the whole table (inputs only) through `startCheckRun` to a fresh practice worker. `runBreakIt` compiles the suspect, the contract, and every variant, reruns every try on its own `structuredClone` of the input, and returns the checks' results and the recomputed tries; the page saves those, not what it sent. The worker's five-second limit (after a separate load allowance), Stop, and termination apply as for any check run. A reply is dropped when the saved tries changed while it ran (a reset, for example), and only the newest run may report.

**Crediting a catch.** Each authored bug is also a one-bug variant: the suspect with only that bug left in. A try catches bug X when the suspect disagrees with the contract and variant X disagrees too. A try that the suspect gets right never credits a bug, even if a variant would be wrong there.

**Completion.** Each bug has a check (`{ name, input: [], expected: true, bug: '<id>' }`), and one check without `bug` passes when every try follows the input rules. The desk reports the worker's results through `setResults` on `useCheckRun`, so the step bar and Finish read them as any check run. Opening a hunt with saved tries runs them again in a fresh worker before Solve counts as done; a completed attempt is never rewritten by opening it. The desk saves through the attempt's own `update`, not the workspace's code update, which would clear that verdict.

**Budget.** Startup carries the catalog row, the "Break it" format label, and one branch in `src/App.tsx`. The desk and its stylesheet load on first use (`lazyRoute`, whose failure offers a reload and keeps the draft). The hunts load with the testing chunk: `testingReps` in `src/testing-journey-reps.ts` adds them to the find-the-bug journey's source, because a new source adds a loader and a chunk name to startup.

## What a catch establishes

A catch shows that one input separates the suspect from the contract, and which authored bug it exposes. It does not show that the learner would find every bug, that a bug nobody authored would be caught, or that the learner understands why; the one-sentence explanation is self-reviewed. Inputs are limited to whole numbers within authored ranges, so a catch cannot come from an input the contract does not allow.

## Author another hunt

1. **Pick a small function** with two or three independent bugs at the contract's edges: an empty input, a full last group, a boundary that should be excluded. Prefer bugs whose wrong inputs do not overlap, so each catch names one bug.
2. **Write the contract** one rule per sentence in `brief.rules`, including the input rules. State any normalization, precedence, and limits.
3. **Write `contract` first**, then the suspect with every bug, then each variant: the suspect with only that bug left in. Each variant must be wrong only where the suspect is, and together they must explain every wrong answer of the suspect.
4. **Choose the parameters.** Today every parameter is a whole number: give `min`, `max`, and `rule` (the contract sentence it breaks). Pick `max` so the arithmetic stays exact; `break-page-count` caps both fields at 1,000,000 and says so in its note.
5. **Plant a red herring**: an input that looks risky but the suspect gets right (`items 5, perPage 5` here). Name it in the acceptance criteria and the review.
6. **Write the checks**: one per bug with `bug`, named neutrally ("Catches bug 1"), plus "Every try follows the input rules". The rep validator still needs three checks.
7. **Fill the standard fields**: `context`, `prompt`, `brief`, `example`, `note` (say what the checks do not establish), `vocabulary` (with glosses in `src/vocabulary-id.ts`), `planPrompt`, `starter: '[]'`, `functionName` (the suspect's), three hints about method rather than the bugs, and a level in `src/rep-levels.ts`.
8. **Write the review** in `src/review-break-it.ts`: reasoning, a trace through each catch and the red herring, an alternative (such as a brute-force sweep), a counterexample (a hunt that misses a bug), and a self-reviewed transfer.
9. **Write the reference and tests**: a tries table that catches every bug in `tests/fixtures/break-it-solutions.mjs` (merged into `tests/content.test.mjs`), an independent implementation of the contract, and checks in `tests/break-it.test.mjs` that the contract matches it, that each variant is a one-bug variant over a grid of inputs, and that the starter, weak tables, and red herrings catch nothing.
10. **Register and run**: add the rep to `breakItReps` and run the commands below.

```
yarn content:index
node --experimental-strip-types --test tests/break-it.test.mjs
yarn lint && yarn test && yarn build && yarn content:check
E2E_PORT=4193 yarn test:e2e tests/e2e/break-it.spec.ts
git diff --check
```

## Not yet

- Parameters are whole numbers only; text, arrays, and objects need their own field and rule types.
- The Explain step shows the general prompt for reasoned reps. The hunt's own prompt is the card's label and the brief's acceptance criteria; a per-rep Explain prompt would add startup bytes the budget does not have.
- The proposal's "Fix it instead" path (repairing the suspect in the debug format) needs a repair rep for the same function; none is authored, so the card links back to the contract and to Explain instead.
