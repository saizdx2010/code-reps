# Authoring learning content locally

Code Reps is built for people trying to become more independent at coding. A useful rep should teach or test one clear skill, include plain-language vocabulary, and make edge cases visible through checks.

This is an internal authoring guide. Source rights are reserved for now; public contribution and redistribution terms have not been published.

## Add a rep

1. Add a typed `Rep` (type in `src/rep-types.ts`) to a focused content module. The base reps live in `src/core-reps.ts`. A new module is also listed in `src/rep-sources.ts` (catalog order) and `src/rep-content.ts` (its lazy loader), then run `yarn content:index`.
2. Give it a unique ID, concise prompt, example, starter function, plan prompt, progressive hints, and checks for normal and edge cases.
3. Keep a hint from giving away the full answer until the final reveal. Write a self-review guide in `src/reflection-guides.ts` (or the matching `src/review-*.ts` module) when the rep belongs to a journey.
4. Give it a difficulty level in `repLevels` in `src/rep-levels.ts`: 1 (Beginner) for language basics, control flow, and introductory collection operations; 2 (Intermediate) for typical journeys, frontend and backend reps, techniques, and validation; 3 (Advanced) for recursion, trees, graphs, linked lists with node-identity requirements, dynamic programming with competing subproblems, complex ARIA widgets with coordinated keyboard/focus state, batch validation, harder async or reliability state, projects, and interviews. The level appears in the library, on the trail, and in the practice header. `yarn test` names any rep that still lacks one.
5. If it is guided, independent, or recall practice, add it to `journeys` in `src/learning.ts`. A recall rep must use a distinct problem; a hinted or early solve cannot count as retained.
6. Run `yarn lint`, `yarn test`, and `yarn build`. Try the rep in the local app and read the prompt as someone new to the terminology.

Function checks run authored TypeScript in a browser worker. The frontend implementation format instead runs DOM interaction checks in a sandboxed frame. See [Richer exercises](./RICH_EXERCISES.md) for the frame contract and verification limits. Do not import exercise packs from untrusted sources or treat this worker as a secure sandbox. Content review should include accessibility, clarity for English learners, and whether the checks match the prompt.

Every rep should have an authored self-review guide in `src/reflection-guides.ts` and a reference solution covered by `tests/content.test.mjs`, `tests/ai-era.test.mjs`, or `tests/rich-reps.test.mjs`. Cover each stated boundary, precedence rule, and normalization rule. When the contract prohibits changing inputs, set `preserveInput: true`; the runner compares supplied values after each check and reports mutation separately from incorrect output. This detects changes visible after the function returns, not temporary mutations that are undone.

Output checks do not prove a learner used a particular declaration, type, or approach. Make those requirements explicit self-review points. Keep implementation hints progressive, and leave the full approach comparison in the post-attempt self-review. State the supported character set when string indexing or character iteration could produce different answers.

AI-era content should make verification a learner action: trace a proposed answer, name a boundary case, run checks, and explain any correction. Avoid treating generated code as an authority. Frontend and backend interview reps should explicitly prompt for clarification, planning, implementation, explanation, and review; current interview practice is untimed and uses the same TypeScript function runner as other reps.

For a substantial new format, add one complete playable task and its self-review flow before adding a large catalog.

## Knowledge lessons and fluency evidence

Author skill articles in `src/knowledge.ts`. Each skill needs stable identity, objectives, prerequisites, a plain-language explanation, a worked example and trace, common mistakes, two interactive checks, relevant exercise IDs, and related skill links. Keep recognition checks separate from independent coding tasks: correctly picking an answer is not evidence of implementation fluency.

Completion questions should request a small, unambiguous token/expression and state the permitted form. The current checker compares trimmed text to the authored expected expression; it is not a semantic code equivalence checker. Use coding reps when multiple implementations should be accepted.

For every new exercise, provide an independent reference solution in the test fixtures and an authored self-review guide. State input limits and mutation rules; include empty, equality, normalization, malformed-input, or conflicting-state checks where the contract requires them. Add recall variants to `src/fluency.ts` with distinct applications rather than changing only example values.

Multi-file capstones use `encodeFiles` with an entry module and named `.ts` files. Use local relative imports; dependencies outside the project are unavailable. Keep frontend checks in the sandboxed frame and backend behavior in the timed worker. Neither environment is a security boundary for arbitrary third-party exercise packs. Avoid treating integration success as proof of module quality.

Run `yarn content:check` before publishing an app/content update. Keep exercise IDs stable so saved attempts remain linked. If changing an interactive question's answer or option ordering, add a new question ID or migrate saved answers explicitly. Content version alone does not migrate learner evidence.

## Where content lives: startup versus review modules

The initial JavaScript chunk must stay small, so content is split by when it is needed:

- **Startup (imported synchronously):** `src/catalog-index.ts`, a generated index with each rep's id, title, category, format, starter code, hint count, brief word count, check count, and source module, plus each lesson's id, title, summary, prerequisites, related lessons, rep links, first common mistake, and question ids with their answer contracts. Paths, journeys (`src/learning.ts`), fluency data, the Trail, planner, and badges read these. Run `yarn content:index` after changing a rep or lesson; `tests/catalog-index.test.mjs` fails when the file is stale and when a startup module imports heavy content.
- **Rep content (loaded when a rep opens):** the brief, example, notes, vocabulary, plan prompt, hints, checks, and the short lesson before a rep, loaded per source module by `src/rep-content.ts`. `useRepContent` shows a loading state, and an error state with Retry (then Reload app if Retry cannot recover) that leaves the draft untouched. Lesson bodies (`src/knowledge.ts`) load with the lesson views, and the glossary and quick lessons load on demand.
- **Whole catalog (Node only):** tests, scripts, and the practice worker import `src/rep.ts` (all reps, through `src/rep-sources.ts`) and `src/knowledge.ts` (all lessons). The app never imports them directly.
- **Review (loaded when a rep or lesson opens):** self-review guides, rep depth (including `traceSteps`), and lesson depth. They live in `src/review-*.ts` (one module per content area, for example `src/review-dsa.ts` exports `dsaDepth` and `dsaGuides`) and are aggregated by `src/rep-depth.ts`, `src/lesson-depth.ts`, and `src/reflection-guides.ts`. `src/load-review-content.ts` imports those aggregators dynamically; `useReviewContent` shows a loading state, and an error state with Retry that leaves the draft untouched.

Add depth, trace, guide, and lesson-depth entries to the matching `src/review-*.ts` module, not to the rep module, and never import `src/review-*.ts`, `rep-depth.ts`, `lesson-depth.ts`, or `reflection-guides.ts` from startup code; tests and `yarn content:check` may import them directly. `yarn build` fails if the initial chunk exceeds its budget in `scripts/check-bundle.mjs`.

## Depth standard for every rep and lesson

Every rep, including foundations, independent tasks, delayed recall, debugging, and project milestones, must have a task-specific entry, registered through `src/rep-depth.ts`:

- **Reasoning:** explain why the approach satisfies the contract, using an invariant, state precedence, or validation argument where relevant.
- **Trace:** follow concrete values through a boundary or conflicting case, not just restate the happy-path example.
- **Alternative:** compare a plausible approach, including relevant time, storage, readability, or contract tradeoffs.
- **Counterexample:** name a tempting mistake and an input or observation that exposes it.
- **Transfer:** propose an unfamiliar variation and the decision it requires. Keep it explicitly self-reviewed; original checks do not validate a changed contract.

These reviews appear in the existing post-check comparison reveal. Do not copy solution reasoning into independent or recall prompts. Scale depth to the skill: a foundational expression needs a clear value trace, not an artificially complicated algorithm.

Every knowledge lesson must also have an entry registered through `src/lesson-depth.ts` with a concrete example, causal reasoning, a prediction/repair/counterexample challenge, and a separately revealed discussion. These challenges are self-review, not automated evidence of coding independence. Existing checked questions retain their identities and answer contracts.

Run `yarn content:check`, `yarn lint`, `yarn test`, and `yarn build`. Coverage validation rejects missing fields and unknown targets; human review must still verify correctness, plain wording, progressive difficulty, and whether an alternative actually teaches a decision. Adding text volume alone does not meet the editorial standard.

## Path application links

`src/curriculum.ts` contains authored path-to-project application links. Each link names an existing project milestone rep and explains how it applies the path's skills. Keep links relevant rather than assigning every path a destination. Roles and recall evidence derive from `src/learning.ts`; do not duplicate journey definitions. `tests/curriculum.test.mjs` checks target validity and evidence distinctions. Project completion is not automatic proof of transfer or mastery.

## Optional visual step traces

A rep depth entry may add `traceSteps: RepTrace` alongside its required prose `trace`.
Use a non-empty `code` array, an `input` description, and at least two snapshots in
`steps`. Each snapshot has a zero-based `line`, `vars`, a non-empty `note`, and
an optional array, stack (bottom to top), or map `structure`. Array `pointers`
use in-bounds zero-based indices; `dimmed` marks visited or inactive indices.
Keep variable names and values concise so diagram labels remain readable.
Three more structures suit recursion and event traces. A `tree` has a nested `root`
of `{id, value, note?, children?}` nodes with unique ids, an optional `current` id, and
`visited` ids; the optional `note` is a short per-node annotation such as `depth 2`. A
`calls` snapshot lists `frames` bottom to top (`call`, optional `locals`, optional
`returns` on the top frame only); set `event` to `call` for a just-pushed top frame or
`return` for one about to be popped. A `state` snapshot lists labelled `entries`, with
optional `events` and the `eventIndex` being processed, for event-by-event policies. The
viewer marks changed `state` rows by itself. Each structure also has a screen-reader
description, and the viewer tests check these snapshots against the real reference code.
A `table` snapshot uses rectangular, non-empty `cells` rows, with `null` for
not-yet-filled cells. Optional `rowLabels` and `colLabels` must match the dimensions;
`name` labels the table in read descriptions. `current` and `reads` use zero-based
`[row, column]` coordinates. Reads must refer to filled cells and cannot include the
current cell. Show the value after each update and explain its dependencies in the
step note. Single rows wrap at narrow widths; multiple rows scroll together to keep
columns aligned. Border styles and explicit labels distinguish current, read, filled,
and empty cells without relying on colour. Keep new traces to at most ten snapshots.
Run the trace's code against the rep checks and compare its final displayed result
with execution on the traced input in `tests/trace-content.test.mjs`.
These authored snapshots appear only in the post-check comparison reveal after
all checks pass. They describe the reference approach, not the learner's live
execution, and must never be copied into independent or recall prompts.

Retired checked questions can keep their old answer contracts in `src/fluency.ts`.
This lets older local data and backups load. Retired answers do not count toward
replacement questions. The frontend derived-list and event-loop follow-up checks
use new IDs after their option wording changed in the October 2026 audit.

The effort estimate on a rep derives from the brief word count plus eight per check, in four bands per level (`effortRange` in `src/rep-guidance.ts`), so a long Beginner brief does not promise the lightest range. It is guidance, not a time limit. A readiness checkpoint also appears, without blocking, on an Intermediate or Advanced track rep when no Beginner rep of that track is finished; each of Frontend and Backend opens with a Beginner bridge rep for this reason.

## Paths

The Trail has one root, Foundations (`typescript`), and three tracks: Problem solving (`algorithms-data-structures`), Frontend (`frontend`), and Backend (`backend`). Add a rep to the stage it belongs to in `src/path.ts`; avoid listing it in two tracks except interview rounds and project capstones (`pathApplications` in `src/curriculum.ts`). A track stage made only of Foundations reps renders as a link back to Foundations. Retired path ids (`typescript-browser`, `practical-concepts`, `real-world`, `ai-era`, `interviews`) are mapped to current ids by `migratePathId`, which saved learning goals pass through when loaded; `tests/path-structure.test.mjs` checks that no previously placed rep is dropped.

## Advanced algorithm function reps

`src/dsa-advanced-reps.ts` owns the guided prefix-sum, interval, linked-list, heap, subset, and dynamic-programming reps. Their depth and reflection guides live in `src/review-dsa-advanced.ts`. Register its exports alongside the existing DSA exports in `src/rep-sources.ts`, `src/rep-depth.ts`, and `src/learning.ts`. Independent references live in `tests/fixtures/dsa-solutions.mjs`; `tests/dsa-advanced.test.mjs` checks common mistakes and the taught heap repair.

The linked-list contract requires fresh output nodes. Value comparisons and input-mutation checks cannot establish output identity; fresh allocation remains a learner self-review point. The authoring test checks reference-node identity separately. These guided reps alone do not establish independent or retained fluency.
