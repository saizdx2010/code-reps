# Daily practice verification and findings

## Scope and build

Stages 3 and 4 were authorized after the shared-understanding interview. This report covers the current uncommitted daily-practice work on top of `43ecb8a`, verified on macOS arm64 with Node 24.21.0 and Yarn 1.22.22. It is an internal engineering report, not public-release or learner-effectiveness approval.

The [accepted plan](./DAILY_PRACTICE_PLAN.md) and [learner observation packet](./LEARNER_VALIDATION.md) define the scope. No participants were contacted and no learner observations were fabricated.

## Engineering evidence

- Lint: passed.
- Node suite: 183 passed, no failures or skips.
- Content validation: passed for authored references, prerequisites, recall variants, project milestones, and rubrics.
- TypeScript/build and bundle budgets: passed through `yarn package` and the browser suite's build step. Initial JavaScript was 220,246 gzip bytes against a 225,000-byte budget. Vite still reports large lazy chunks; this warning did not fail the budgets.
- Portable macOS arm64 bundle: packaged and passed `node scripts/verify-portable.mjs` (24 local assets, first run, paths with spaces, bundled runtime, save, restart, snapshot, clean shutdown). The verifier used temporary data.
- Chromium: initial full run had 44 passes and one test-fixture failure described below. The corrected focused recall-session test passed. The final full rerun passed all 45 tests without retries.

Coverage includes explicit path choice, early recall boundaries, narrow/keyboard flows, unfinished session endings, reload/new-session resume, immutable attempt links, profile separation, malformed imports, cross-tab conflicts, quota recovery, pending SQLite replay, and unchanged recall/independence evidence. See [browser testing](./BROWSER_TESTING.md) for detailed coverage and limits.

## Stage 4 findings and response

### Recall-session fixture initialized after profile startup

The full Chromium run intermittently recommended the initial TypeScript rep instead of due array recall. The test wrote history after loading Home, then used hash navigation, which does not remount the profile. Depending on startup timing, the in-memory history had already been read as empty. This was a fixture race rather than evidence that ending a session changed recall scheduling.

Changed the test to seed its disposable history with Playwright `addInitScript` before profile initialization. Preserved all assertions: unchanged history, due recall recommendation, one independent skill, and zero retained skills. The focused test and subsequent full 45-test run passed after the correction. No application scheduling or assessment rule changed.

### Browser coverage documentation omitted daily sessions

Updated the coverage inventory to describe the existing session and curriculum flows, including isolated SQLite replay/restore. This is a documentation correction, not additional test evidence.

No other reproducible application failure was found by the checks recorded here. That does not establish learner comprehension. Scheduling changes and curriculum expansion remain deferred.

Final `git diff --check` passed. Documentation links were checked against local paths.

## Manual review and pending gates

A separate Chrome for Testing window loaded a dedicated browser-only origin on loopback port 4186, separate from the learner SQLite service. Home's visible hierarchy, recommendation reason, explicit path choice, practice start, and save feedback were inspected at the default zoom. This was a limited visual observation.

Native browser automation did not reliably apply page keyboard/zoom actions or verify a zoom percentage. Therefore the intended 200% zoom and complete manual keyboard walkthrough remain pending; automated keyboard/narrow results are recorded separately above. Do not report the attempted zoom as a pass.

Pending:

- Three to five returning TypeScript developers: participant availability, first-session comprehension, and later independent recall after at least three days.
- Manual 200% browser zoom, short-window walkthrough, complete keyboard review, screen-reader announcements, and contrast review.
- Full disconnected-browser operation, other browser engines, Windows/Linux first run/upgrade/restore/launcher verification.
- Learning effectiveness, retention, and transfer conclusions.

Stage 3 engineering execution and observation preparation can finish independently of these gates. Stage 4 learner-driven refinement remains pending actual findings. Record observations with aliases and consent boundaries using the prepared packet; propose scoped changes only when their evidence supports them.
