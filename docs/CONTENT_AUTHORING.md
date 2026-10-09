# Authoring learning content locally

Code Reps is built for people trying to become more independent at coding. A useful rep should teach or test one clear skill, include plain-language vocabulary, and make edge cases visible through checks.

This is an internal authoring guide. Source rights are reserved for now; public contribution and redistribution terms have not been published.

## Add a rep

1. Add a typed `Rep` in `src/rep.ts` or a focused content module.
2. Give it a unique ID, concise prompt, example, starter function, plan prompt, progressive hints, and checks for normal and edge cases.
3. Keep a hint from giving away the full answer until the final reveal. Write a self-review guide in `src/learning.ts` when the rep belongs to a journey.
4. If it is guided, independent, or recall practice, add it to `journeys` in `src/learning.ts`. A recall rep must use a distinct problem; a hinted or early solve cannot count as retained.
5. Run `yarn lint`, `yarn test`, and `yarn build`. Try the rep in the local app and read the prompt as someone new to the terminology.

Function checks run authored TypeScript in a browser worker. The frontend implementation format instead runs DOM interaction checks in a sandboxed frame. See [Richer exercises](./RICH_EXERCISES.md) for the frame contract and verification limits. Do not import exercise packs from untrusted sources or treat this worker as a secure sandbox. Content review should include accessibility, clarity for English learners, and whether the checks match the prompt.

Every rep should have an authored self-review guide in `src/learning.ts` and a reference solution covered by `tests/content.test.mjs`, `tests/ai-era.test.mjs`, or `tests/rich-reps.test.mjs`. Cover each stated boundary, precedence rule, and normalization rule. When the contract prohibits changing inputs, set `preserveInput: true`; the runner compares supplied values after each check and reports mutation separately from incorrect output. This detects changes visible after the function returns, not temporary mutations that are undone.

Output checks do not prove a learner used a particular declaration, type, or approach. Make those requirements explicit self-review points. Keep implementation hints progressive, and leave the full approach comparison in the post-attempt self-review. State the supported character set when string indexing or character iteration could produce different answers.

AI-era content should make verification a learner action: trace a proposed answer, name a boundary case, run checks, and explain any correction. Avoid treating generated code as an authority. Frontend and backend interview reps should explicitly prompt for clarification, planning, implementation, explanation, and review; current interview practice is untimed and uses the same TypeScript function runner as other reps.

For a substantial new format, add one complete playable task and its self-review flow before adding a large catalog.

## Knowledge lessons and fluency evidence

Author skill articles in `src/knowledge.ts`. Each skill needs stable identity, objectives, prerequisites, a plain-language explanation, a worked example and trace, common mistakes, two interactive checks, relevant exercise IDs, and related skill links. Keep recognition checks separate from independent coding tasks: correctly picking an answer is not evidence of implementation fluency.

Completion questions should request a small, unambiguous token/expression and state the permitted form. The current checker compares trimmed text to the authored expected expression; it is not a semantic code equivalence checker. Use coding reps when multiple implementations should be accepted.

For every new exercise, provide an independent reference solution in the test fixtures and an authored self-review guide. State input limits and mutation rules; include empty, equality, normalization, malformed-input, or conflicting-state checks where the contract requires them. Add recall variants to `src/fluency.ts` with distinct applications rather than changing only example values.

Multi-file capstones use `encodeFiles` with an entry module and named `.ts` files. Use local relative imports; dependencies outside the project are unavailable. Keep frontend checks in the sandboxed frame and backend behavior in the timed worker. Neither environment is a security boundary for arbitrary third-party exercise packs. Avoid treating integration success as proof of module quality.

Run `yarn content:check` before publishing an app/content update. Keep exercise IDs stable so saved attempts remain linked. If changing an interactive question's answer or option ordering, add a new question ID or migrate saved answers explicitly. Content version alone does not migrate learner evidence.

## Depth standard for every rep and lesson

Every rep, including foundations, independent tasks, delayed recall, debugging, and project milestones, must have a task-specific entry in `src/rep-depth.ts`:

- **Reasoning:** explain why the approach satisfies the contract, using an invariant, state precedence, or validation argument where relevant.
- **Trace:** follow concrete values through a boundary or conflicting case, not just restate the happy-path example.
- **Alternative:** compare a plausible approach, including relevant time, storage, readability, or contract tradeoffs.
- **Counterexample:** name a tempting mistake and an input or observation that exposes it.
- **Transfer:** propose an unfamiliar variation and the decision it requires. Keep it explicitly self-reviewed; original checks do not validate a changed contract.

These reviews appear in the existing post-check comparison reveal. Do not copy solution reasoning into independent or recall prompts. Scale depth to the skill: a foundational expression needs a clear value trace, not an artificially complicated algorithm.

Every knowledge lesson must also have an entry in `src/lesson-depth.ts` with a concrete example, causal reasoning, a prediction/repair/counterexample challenge, and a separately revealed discussion. These challenges are self-review, not automated evidence of coding independence. Existing checked questions retain their identities and answer contracts.

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
These authored snapshots appear only in the post-check comparison reveal after
all checks pass. They describe the reference approach, not the learner's live
execution, and must never be copied into independent or recall prompts.

Retired checked questions can keep their old answer contracts in `src/fluency.ts`.
This lets older local data and backups load. Retired answers do not count toward
replacement questions. The frontend derived-list and event-loop follow-up checks
use new IDs after their option wording changed in the October 2026 audit.

## Paths

The Trail has one root, Foundations (`typescript`), and three tracks: Problem solving (`algorithms-data-structures`), Frontend (`frontend`), and Backend (`backend`). Add a rep to the stage it belongs to in `src/path.ts`; avoid listing it in two tracks except interview rounds and project capstones (`pathApplications` in `src/curriculum.ts`). A track stage made only of Foundations reps renders as a link back to Foundations. Retired path ids (`typescript-browser`, `practical-concepts`, `real-world`, `ai-era`, `interviews`) are mapped to current ids by `migratePathId`, which saved learning goals pass through when loaded; `tests/path-structure.test.mjs` checks that no previously placed rep is dropped.
