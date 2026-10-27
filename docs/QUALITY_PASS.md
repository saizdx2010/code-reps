# Quality pass

A planned editorial pass over the content that already exists: read, play, and improve every rep and lesson on a track until each one meets the bar below. It adds no tracks, exercise formats, tools, or interface features.

**Starts:** after the SQL work on `content/zero-to-hero` is merged into `main`, so the pass works on one catalog and includes the new SQL reps.

**Why:** practice in Code Reps begins on 2026-11-01. Better versions of the reps already on Trail are worth more than more reps.

## Starting point

Snapshot from `main` at `ba19aa4` (2026-10-17), before the SQL track lands. Recount with the scan below when the pass starts.

| Track | Stages | Rep slots | Briefs under 30 words | Reps with 3 checks or fewer |
| --- | --- | --- | --- | --- |
| Foundations (`typescript`) | 11 | 41 | 20 | 4 |
| Problem solving (`algorithms-data-structures`) | 20 | 86 | 17 | 0 |
| Pattern Recognition | 5 | 18 | 4 | 0 |
| Frontend | 13 | 49 | 5 | 1 |
| Backend | 13 | 43 | 3 | 1 |

There are 246 reps; 205 appear on a track and 41 are Library-only. There are 45 lessons. Wrong-solution tests (`assertMutantsFail` in `tests/helpers/checks.mjs`) cover only some reps, and 84 reviews have visual `traceSteps`.

Word count is a prompt for reading, not a defect: a short brief can be complete. The rubric decides.

## The bar for every rep

A rep passes when all ten are true. Each maps to an existing field or test, so nothing new is needed to meet it.

1. **The task is clear on first read.** The first sentence says what to return. The rules state the input shape, output, normalization, ordering, mutation, and limits wherever they affect the answer (`prompt`, `brief`).
2. **It teaches before it tests.** Everything the rep needs is covered by a lesson placed before it on Trail, or by the brief and vocabulary. Nothing relies on a concept the track has not introduced yet.
3. **The example shows the main rule,** and the brief's edge cases name every boundary the checks test.
4. **The hints step down gently.** Hint 1 says what to notice, hint 2 gives the approach, and hint 3 gives the next concrete step. None of them is code (`hints`).
5. **Every rule has a check,** and every check has a plain-English name a learner would understand when it fails. Normal, boundary, and empty cases are all covered (`checks`).
6. **The checks catch plausible wrong answers.** Two or three realistic incorrect solutions fail: off-by-one, mutating the input, a missed empty case, wrong ordering, or whatever is most likely for this task. Add them to the rep's test with `assertMutantsFail`.
7. **The review is specific to this task.** The trace walks through the actual example, and the alternative, counterexample, and transfer challenge are not generic text (`src/review-*.ts`). Code in its prose and trace notes is marked with backticks so it renders as code.
8. **It's visual where state changes.** Reps with loops, pointers, stacks, queues, trees, grids, or DP tables get `traceSteps`. The user is a visual learner.
9. **The voice is plain and consistent.** Short sentences, terms match the lesson and vocabulary, and the title starts with a verb. Words like "simply" and "just" don't appear, and the wording never hints at the solution.
10. **The difficulty fits its place.** Guided → independent → recall steps up, and recall needs a different application, not the earlier answer remembered.

## The bar for every lesson

Five minutes to read. Every lesson has:

- One objective a learner can check.
- An explanation that stops when the reps it links to are covered.
- A worked example traced step by step.
- The most common mistake, shown.
- Interactive checks that test understanding, not wording.
- A discussion in `src/lesson-depth.ts` that adds something beyond the lesson.

Trim long lessons instead of splitting them, so lesson IDs stay the same.

## How each stage is worked

One Trail stage per batch, usually 3–6 reps plus their lessons.

1. **Scan.** Gather the stage's metrics from `src/catalog-index.ts` (brief words, check and hint counts, source module), plus mutant coverage, `traceSteps`, and lesson placement. This is a throwaway script, not a new feature.
2. **Read.** Score each rep against the ten points above and note each failure in one line.
3. **Play.** In the real app, submit a wrong answer first and read the failure, read the hints in order, then solve it and read the review. Check light and dark mode, and 390px width when anything visual changes.
4. **Fix.** Rewrite briefs, hints, check names, and reviews; add checks, wrong-solution tests, and `traceSteps`. Keep the reference solution independent of the rewrite.
5. **Verify.** Run `yarn content:index`, the focused tests, `yarn lint`, `yarn test`, `yarn build`, `yarn content:check`, and `git diff --check`. Run `yarn test:e2e` only if a batch touches the interface.
6. **Commit** the stage, for example "Quality pass: Foundations, stage 3 (arrays)", and tick it below.

## Compatibility rules

These come from `AGENTS.md`. They matter here because the pass edits content that already has saved attempts.

- **Keep IDs.** Rep, skill, lesson, and question IDs stay the same.
- **Questions:** changing a question's answer or option order requires a new question ID.
- **Starters:** changing a starter changes its `starterHash`. A saved draft that still holds the old untouched starter will then show as **In progress**. Change a starter only when it is wrong or misleading.
- **Changing a contract** (what counts as correct) is a content change, not a polish. Note it in the commit message.
- **Recall rotations** in `src/fluency.ts` append only. Don't reorder or remove variants, because saved review positions depend on their order.
- **Retiring a Library-only rep** means removing it from navigation while it stays loadable, so old attempts and backups still open.

## Order

Follow what will be practised first, one stage ahead of practice:

1. **Foundations.** Most thin briefs, and every other track builds on it.
2. **Problem solving,** stage by stage in Trail order.
3. **SQL,** after it lands. Usually a light pass, since it is new and written to the current standard.
4. **Pattern Recognition.**
5. **Backend.**
6. **Frontend.**
7. **Library-only reps.** For each: place it on a track, keep it in the Library, or retire it from navigation.

If something in daily practice feels unclear, flag it with **Something unclear here?** at the end of the rep's brief; that rep goes to the front of the queue. Find the flags in Journal → Notebook by searching for "Unclear".

## Progress

- [ ] Foundations (11 stages)
  - [x] Stage 1: Learn the language
  - [x] Stage 2: Make decisions and repeat
  - [x] Stage 3: Work through arrays
  - [x] Stage 4: Count and remember
  - [x] Stage 5: Handle text and gaps
  - [x] Stage 6: Match openings and closings
  - [x] Stage 7: Calculate shipping on your own
  - [x] Stage 8: Recall in a new setting
- [ ] Problem solving (20 stages)
- [ ] SQL
- [ ] Pattern Recognition (5 stages)
- [ ] Backend (13 stages)
- [ ] Frontend (13 stages)
- [ ] Library-only reps (41)
- [ ] Lessons (45), each with the track that links it first

## What the pass does not establish

Editorial review and authored wrong-solution tests show that the content is clear and that its checks catch the wrong answers someone thought of. They do not show that a learner finds a rep clear; only real practice shows that. Record those observations as described in [learner validation](./LEARNER_VALIDATION.md).

See [content authoring](./CONTENT_AUTHORING.md) for the full rep and lesson contract, and [maintaining](./MAINTAINING.md) for the gates.
