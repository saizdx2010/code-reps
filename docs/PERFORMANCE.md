# Local loading and bundle budgets

`yarn build` produces Vite's manifest and runs `scripts/check-bundle.mjs`. It reports raw and gzip JavaScript bytes in `dist/bundle-size.json` and fails when either budget is exceeded. Gzip is a size comparison, not a claim that the local server compresses responses. CSS, fonts, and HTML are not included in these JavaScript budgets.

| Group | Raw byte budget | Gzip byte budget |
| --- | ---: | ---: |
| Initial route JavaScript and static dependencies | 750,000 | 220,000 |
| Additional editor JavaScript, including its dynamic language modules | 4,200,000 | 1,050,000 |
| Additional frontend preview/check JavaScript | 3,900,000 | 1,050,000 |
| Editor, TypeScript, and practice worker JavaScript | 11,200,000 | 3,100,000 |

The script deduplicates shared chunks within each group, excludes initial-route dependencies from the additional groups, and requires all three local workers. It also rejects unused CSS, HTML, and JSON language workers. Editor and frontend groups describe separate features; their totals are not a sum of every possible network request.

Monaco remains lazy, with existing hover/focus preloading and a plain text recovery editor. `src/monaco.ts` retains editor contributions from the locked Monaco release but registers only TypeScript and JavaScript language support. The previous general import also bundled CSS, HTML, and JSON workers plus many unused language modules. Removing those workers alone avoids approximately 2.26 MB of raw build output. This does not imply a corresponding startup-speed improvement: unused workers were not necessarily loaded on the first route.

The learning-tools presentation in `LearningHub.tsx` also loads on demand. Home, the library, and workspace keep their existing owners. A pending learning route displays local practice-sheet placeholders; load failure offers reload, and replacing a focused loading view restores the real page heading. This split keeps the shared design and motion within the existing initial JavaScript budget without changing learner persistence.

The SQLite browser suite attaches Home and editor readiness durations alongside the bundle report. It uses the built app and a fresh browser context on the local machine, without CPU/network throttling. Measurements include Playwright observation overhead and are not representative of every learner's hardware. Shared CI timing has no hard speed threshold; byte budgets provide the reproducible regression gate.

When a dependency or content change exceeds a budget, inspect the manifest and measured flow before changing the limit. Keep TypeScript assistance, editor keyboard operation, recovery, and local worker behavior covered by the browser suite. Large editor/compiler chunks still trigger Vite's warning; it remains visible. The budgets establish current size limits, not a claim that loading performance is fully optimized.
