# Authoring a find-the-bug journey

A find-the-bug journey teaches learners to choose boundary cases that tell a correct function from a plausible faulty one. It uses the existing function worker only. It adds no runner, no dependency, and no new main area. The shipped example is in `src/testing-journey-reps.ts`: `expose-page-bugs` (guided), `repair-range-label` (independent), and `expose-overlap-bugs` (delayed transfer).

## The three reps

1. **Expose (guided).** The starter supplies a map of implementations: one `correct` version and two to five faulty variants, each with one plausible mistake (off by one, dropped short final chunk, empty input, changed input). The learner writes a case table and `exposes(variant: string): boolean`, which runs their cases against the named implementation and returns `true` if any case fails. Checks call `exposes('correct')` (expect `false`) and `exposes('<variant>')` for each variant (expect `true`).
2. **Repair (independent).** Format `debug`. The learner gets a faulty function and a bug report that reproduces with specific inputs. Checks cover the reports, the boundaries around them, rule precedence, and, where the contract forbids it, input mutation (`preserveInput: true`).
3. **Transfer (delayed recall).** Another function with its own variants, a requirements-only brief, and no hints that name or describe a bug. It must be a different application, not the same function with new numbers. Name the variants neutrally (`variant-a`, `variant-b`).

Why variants are chosen by name: the worker passes JSON-like inputs, and functions cannot be passed. The implementations live in the learner's starter file, and the checks send only a string.

## What the checks prove

The checks establish that the learner's cases distinguish the supplied variants. They do not establish that the table is complete, that a variant you did not supply would be caught, or that the learner derived the expected values independently. A learner can return `variant !== 'correct'` and pass. Say this plainly in the rep `note` (the shipped reps use the phrase "do not establish that your table is complete") and in the self-review guide. The self-review asks the learner to name a faulty version their table would still accept.

## Step-by-step template

1. **Pick a function** that is small but has at least three real traps. Good traps: off-by-one on 1-based versus 0-based positions, a short final group, empty input, equal values, touching boundaries, argument order, and changed inputs. Pick a different function for the transfer rep.
2. **Write the contract** in sentences, one rule per sentence. State normalization, precedence, mutation, and input limits. Every sentence will become a bullet in `brief.rules`.
3. **Write `correct` first**, then each variant as a copy with one mistake. Confirm that each variant fails on at least one input that the correct version handles, and that no variant is exposed only by an accident.
4. **Include a mutation variant** (for example it calls `splice`, `shift`, or `sort` on the input but returns the right answer). It teaches learners to compare inputs after the call. Return values alone cannot expose it.
5. **Write the expose starter.** Include the types, the implementations map, an empty `cases` table with one commented example, and an `exposes` stub that returns `false`. The stub makes every faulty-variant check fail, and `correct` pass, so nothing passes by accident.
6. **Write the repair rep.** Start from a bug report with the exact wrong outputs, then write checks for: each reported case, the fixed boundaries, a rule-precedence case, and the invalid inputs.
7. **Write the transfer rep.** Reuse the format of the expose rep but give no case example in the starter and hints that talk only about method ("test each sentence of the requirements at its edge").
8. **Fill the standard fields** for each rep: `context`, `prompt`, `example`, `note`, `vocabulary`, `planPrompt`, `starter`, `functionName`, at least three progressive `hints`, and at least three `checks` with unique names. Add `brief` when prompt plus note is over 120 words. Every number in the prompt must appear in the brief.
9. **Write self-review** in your `review-*.ts` module: a `RepDepth` entry (reasoning, concrete trace, alternative, counterexample, transfer) and a guide (`plan`, `explanation`, `example`) for each rep. The counterexample should name a table that would miss a specific variant.
10. **Write the reference solutions** in a fixture file. For expose reps, write a learner-style solution (case table plus `exposes`). For repair, write a correct function.
11. **Write tests**: the reference passes (add it to `tests/content.test.mjs` through the fixture), the starter fails, an empty table exposes nothing, a weak table misses a named variant (for example, one that never compares inputs), and a shortcut such as `return true` fails the `correct` check. See `tests/testing-journey.test.mjs`.
12. **Register everything** (next section), then run the commands below.

## Files to touch

| File | Change |
| --- | --- |
| `src/<name>-reps.ts` | The new `Rep[]` export |
| `src/rep-sources.ts` | Import and add `{ name, reps }` (catalog order) |
| `src/rep-content.ts` | Add the lazy loader for the same source name |
| `src/review-<name>.ts` | Depth entries and self-review guides |
| `src/rep-depth.ts`, `src/reflection-guides.ts` | Spread the new depth and guide records |
| `src/rep-levels.ts` | A level for each rep |
| `src/learning.ts` | A `journeys` entry (guided, independent, recall) |
| `src/path.ts` | Add the reps to a stage of the track where they belong |
| `tests/fixtures/<name>-solutions.mjs`, `tests/content.test.mjs` | Reference solutions, merged into the `solutions` map |
| `tests/<name>.test.mjs` | Variant, weak-table, and shortcut tests |
| `src/catalog-index.ts` | Generated; never edit by hand |

## Commands

```
yarn content:index
node --experimental-strip-types --test tests/<name>.test.mjs
yarn lint && yarn test && yarn build && yarn content:check
E2E_PORT=4191 yarn test:e2e
git diff --check
```

Use a port other than 4175 for the Playwright server if another checkout is running.

## Checklist

- [ ] Each variant has one mistake and is exposed by some input; `correct` follows the written contract
- [ ] At least one variant is exposed only by checking the input after the call
- [ ] The stub fails the faulty-variant checks and passes `correct`
- [ ] The note says the checks do not prove the table is complete
- [ ] Transfer rep: different function, requirements-only brief, neutral variant names, hints about method only
- [ ] Brief present when prompt plus note exceeds 120 words
- [ ] Depth and guide entries for every rep, each with a concrete trace and a table that would miss a variant
- [ ] Reference solutions, and tests for starter, weak table, and shortcut
- [ ] `yarn content:index` run; lint, test, build, and content check pass

## Placement and badges

Adding a rep to a path stage makes it required, so an earned stage or path badge moves back to upcoming until the new rep is finished. A new stage creates a new, unearned stage badge. There is no optional-rep support in `src/path.ts`. The journey is a new stage near the end of the Backend track, before the interview round.
