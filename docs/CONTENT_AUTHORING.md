# Authoring learning content locally

Code Reps is built for people trying to become more independent at coding. A useful rep should teach or test one clear skill, include plain-language vocabulary, and make edge cases visible through checks.

This is an internal authoring guide. Source rights are reserved for now; public contribution and redistribution terms have not been published.

## Add a rep

1. Add a typed `Rep` in `src/rep.ts` or a focused content module.
2. Give it a unique ID, concise prompt, example, starter function, plan prompt, progressive hints, and checks for normal and edge cases.
3. Keep a hint from giving away the full answer until the final reveal. Write a self-review guide in `src/learning.ts` when the rep belongs to a journey.
4. If it is guided, independent, or recall practice, add it to `journeys` in `src/learning.ts`. A recall rep must use a distinct problem; a hinted or early solve cannot count as retained.
5. Run `yarn lint`, `yarn test`, and `yarn build`. Try the rep in the local app and read the prompt as someone new to the terminology.

Checks currently run authored TypeScript in a browser worker. Do not import exercise packs from untrusted sources or treat this worker as a secure sandbox. Content review should include accessibility, clarity for English learners, and whether the checks match the prompt.

For a substantial new format, add one complete playable task and its self-review flow before adding a large catalog.
