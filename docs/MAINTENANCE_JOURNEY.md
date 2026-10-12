# Maintenance journey

The maintenance journey teaches the loop of working on code you did not write: read it, reproduce a reported bug, guard it with a regression case, fix it, and adapt it to a changed requirement. It reuses the multi-file loader (`src/project-files.ts`, `src/compile-solution.ts`) and the function worker. It adds no runner, dependency, exercise format, or main area. It sits in the Backend track as the stage "Maintain unfamiliar code", before the interview round.

## The reps

All six live in `src/maintenance-journey-reps.ts` in the category "Maintaining code".

| Step | Rep | Learner work |
| --- | --- | --- |
| Read | `read-shipping-quote` (`read`) | Predict what a three-file shipping module returns today for six named parcels, including the faulty behavior. |
| Reproduce | `reproduce-quote-bug` (`backend`) | Write a case table and `exposes(version)`. The case must fail on the reported `quote.ts` and pass on the pricing-sheet reference. A second variant (rounds to the nearest kilogram) checks that the learner did not only copy the report. |
| Regression and fix | `fix-quote-bug` (`debug`, guided) | Add regression cases in `guard.ts`, then fix `quote.ts`. The case must fail on the frozen `original.ts` and pass on the fix, and ordinary prices must not move. |
| Changed requirement | `adapt-quote-rule` (`backend`) | Change the free-shipping threshold and add a heavy fee, keeping every unchanged price. Checks cover both sides of each new boundary and the order of the rules. |
| Independent | `maintain-library-fines` (`debug`) | The same job in a different domain, with a bug report and a contract but no steps or bug-naming hints. |
| Delayed recall | `maintain-room-booking` (`backend`) | A different domain again: write cases for a new pricing rule that fail on the old code, then change the code. |

In `src/learning.ts` the `maintenance` journey stages `fix-quote-bug` (guided), `maintain-library-fines` (independent), and `maintain-room-booking` (recall, also its fresh variant in `src/fluency.ts`). The read, reproduce, and adapt reps are required practice in the track stage but are not journey evidence.

## How a learner's case is checked

The worker passes only plain values, so a learner's regression table cannot be passed to the checks. The starter has a supplied entry module, `main.ts`, that imports the learner's `guard.ts` table, the module they edit, and a read-only `original.ts`. Its `run(task, ...)` function answers `guard-passes-on-fix` (the table is not empty and every case passes on the learner's code), `guard-fails-on-original` (at least one case fails on the frozen original), and a compute task for ordinary behavior checks. The reproduce rep follows the find-the-bug pattern instead: an `exposes(version)` function the learner writes.

## What the checks prove

The checks establish that a case separates the original from the fix, and that ordinary behavior after the change matches the contract. They do not establish that the regression cases are complete, that the fix is minimal, or that expected values were worked out independently from the contract (the `reference` and `original` files are readable). The reps say so in their notes and ask the learner to name an input their cases would not catch. Reading, tracing, and explanation stay self-reviewed.

## Authoring another module

1. Write a small module of two or three files (about 60 to 120 lines in all) with a written contract, one plausible faulty line, and at least two rules that interact.
2. Write the expected values by hand from the contract, then confirm the faulty copy fails at least one of them on an input the report would not name by itself.
3. Add a frozen `original.ts` for the faulty or old behavior. Keep the harness `main.ts` supplied and marked "do not edit".
4. Add checks for every unchanged rule, both sides of every boundary, and a plausible wrong fix (here, rounding to the nearest kilogram).
5. Use `solve(id, overrides)` in `tests/fixtures/maintenance-journey-solutions.mjs` for the reference solution, and add tests for weak tables in `tests/maintenance-journey.test.mjs`.
6. Register the reps as described in [Find the bug](./FIND_THE_BUG.md) (sources, loader, depth, guides, levels, journey, track stage), then run `yarn content:index`.

## Known limits

- Starter code is embedded in `src/catalog-index.ts`, so multi-file starters count toward the initial bundle budget in `scripts/check-bundle.mjs`. The six starters total about 14 KB raw, and the whole journey added about 2.7 KB gzip to the initial bundle (151,410 to 154,151 bytes against a 153,000 budget). Check the budget before adding more.
- Passing the checks does not prove the learner can maintain unfamiliar code in a real repository. Version control, running a real test suite, and reading logs are outside this journey.
