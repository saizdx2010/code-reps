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
