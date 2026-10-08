# Working on Code Reps

## Purpose and priorities

Code Reps is a free, local-first coding practice and self-assessment app. Its core loop is **understand → plan → solve → explain → review**. Help learners become independent, retain skills, and explain their decisions in plain English.

Prioritize learner work, honest assessment, clear content, and a reliable practice loop. Accounts, cloud sync, leaderboards, certificates, and AI tutoring are outside the current product scope. Do not add external services or network-dependent features without a task that calls for them.

Read `README.md` for current behavior, `PROJECT.md` for product intent, and `ROADMAP.md` for planned work. Some technical directions in the plan are aspirational: inspect the implementation before adopting them. The current runners use a browser worker and a sandboxed frontend frame, unit/integration tests use Node's built-in test runner, and browser-flow tests use Playwright with Chromium.

## Start here

- Check `pwd`, `git status --short`, and the current branch before editing. Preserve existing uncommitted changes; never reset or revert unrelated work.
- Read the relevant implementation, tests, and focused documentation before choosing a change. Use `rg` to locate the actual state or rendering owner.
- Keep changes scoped to the task. Follow nearby patterns instead of introducing a new framework, dependency, abstraction, or broad refactor.
- Treat a request to review or investigate as read-only unless fixes are requested.
- Update documentation when a change affects setup, content contracts, learner behavior, or verification limits. Do not duplicate large catalogs or hard-code current content counts here.

## Commands

Use **Node.js 24 or later** and **Yarn Classic 1.22.22**, as declared in `package.json`. Keep `yarn.lock` as the dependency lockfile.

| Command | Purpose |
| --- | --- |
| `yarn install --frozen-lockfile` | Install the locked dependencies |
| `yarn dev` | Start Vite development with browser-local persistence |
| `yarn build` | Typecheck with `tsc -b` and build with Vite |
| `yarn serve` | Serve the existing build through the local SQLite service |
| `yarn preview` | Preview the Vite build; this is not the SQLite service |
| `yarn lint` | Run Oxlint |
| `yarn test` | Run `tests/*.test.mjs` with Node's test runner and TypeScript stripping |
| `yarn playwright install chromium` | Install the browser required by the end-to-end suite |
| `yarn test:e2e` | Run real-browser practice flows in Chromium |
| `yarn content:check` | Validate authored content and depth coverage |
| `yarn package` | Build a portable web bundle with a Node runtime |
| `node scripts/verify-portable.mjs` | Smoke-test the generated portable bundle |

For a focused test, use `node --experimental-strip-types --test tests/<name>.test.mjs`. There is no separate `typecheck` script; `yarn build` includes it. `just check` runs lint, tests, and build but does **not** run content validation.

## Implementation map

| Area | Main owners |
| --- | --- |
| Startup and local profiles | `src/main.tsx`, `src/ProfileApp.tsx`, `src/profiles.ts` |
| Practice workspace and attempts | `src/App.tsx`, `src/practice.ts` |
| Navigation and session UI state | `src/ui-navigation.ts`, `src/AppNavigation.tsx`, `src/useNavigation.ts`, `src/useSessionPreference.ts`, `src/Experience.tsx` |
| Trail, tracks, and Journal | `src/HomePage.tsx`, `src/PathsPage.tsx`, `src/Trail.tsx`, `src/trail-map.ts`, `src/curriculum.ts`, `src/Journal.tsx` |
| Shared page components and styles | `src/Layout.tsx`, `src/ui-status.ts`, `src/layout.css`, `src/trail.css`, `src/index.css` (tokens) |
| Editors and previews | `src/CodeEditor.tsx`, `src/SolutionEditor.tsx`, `src/ProjectEditor.tsx`, `src/editor-loader.ts`, `src/FrontendPreview.tsx` |
| Check orchestration and execution | `src/check-run.ts`, `src/runner.worker.ts`, `src/runner.ts`, `src/runner.types.ts`, `src/compile-solution.ts`, `src/frontend-run.ts`, `src/frontend-frame.ts`, `src/project-files.ts` |
| Reps and paths | `src/rep.ts`, `src/path.ts`, and focused `*-reps.ts` / content modules |
| Learning and progress evidence | `src/learning.ts`, `src/fluency.ts`, `src/useFluency.ts`, `src/LearningHub.tsx`, `src/ProgressPage.tsx` |
| Knowledge and authored reviews | `src/knowledge.ts`, `src/rep-depth.ts`, `src/lesson-depth.ts`, `src/content-depth.ts` |
| Persistence and backup contracts | `src/local-store.ts`, `src/portability.ts`, `src/profile-backup.ts`, `server/store.mjs`, `server/index.mjs` |
| Distribution | `scripts/package.mjs`, `scripts/verify-portable.mjs`, `.github/workflows/portable-bundles.yml` |

Use the relevant guide rather than guessing: `docs/CONTENT_AUTHORING.md`, `docs/RICH_EXERCISES.md`, `docs/FLUENCY_PLATFORM.md`, `docs/PRACTICAL_CONCEPTS.md`, `docs/UI_GUIDE.md`, `docs/LOCAL_SETUP.md`, `docs/LOCAL_RELIABILITY.md`, or `docs/PORTABLE_BUNDLE.md`.

## Code and UI conventions

- Match existing TypeScript and ESM conventions: single quotes, no routine semicolons, explicit type-only imports, and the local import style. Node-loaded TypeScript modules often need `.ts` extensions.
- Keep content, assessment rules, persistence, and runners separate from React presentation. Prefer extending an existing owner over creating a second source of truth.
- Reuse the existing controls and CSS tokens. Inspect `src/Input.tsx`, `src/Button.tsx`, and the relevant stylesheets before adding UI. Do not introduce a component library merely because the project plan mentions one.
- Follow `docs/DESIGN_SYSTEM.md` for Code Reps' logo-based palette, shared control geometry, page hierarchy, and motion. Extend the existing visual and motion owners; retain the original logo and reduced-motion behavior.
- Keep the redesigned design language consistent (details and the new-page checklist are in `docs/DESIGN_SYSTEM.md`):
  - Three main areas only: Trail, Library, and Progress. New pages join an existing area's section tabs; Journal views switch with `JournalTabs`.
  - Every page uses the shared frame (`--page-width`, `--page-gutter`) and starts with `PageHeader` and exactly one `h1`. Do not set per-page `main` widths or add hero headings.
  - Use the type tokens (`--type-page`, `--type-reading`, `--type-feature`, `--type-section`, `--type-card`) and `--control-height` (40px) instead of ad hoc sizes.
  - Draw structure instead of explaining it: paths render with `Trail`, long lists with `ListGroup`/`ListRow`, status with `StatusChip` plus text, empty results with `EmptyState`. Evidence caveats go in `InfoNote`, not repeated body paragraphs.
  - Disclosure uses a rotating chevron; plus/minus is only for adding or subtracting values. Supporting text on selected or recommended surfaces keeps 4.5:1 contrast.
  - In practice, keep the single compact header row, the step rail, and the checks drawer inside the coding desk; the work surfaces own the screen.
  - Give each interactive element its one interaction from the motion table in `docs/DESIGN_SYSTEM.md`, built in `src/motion.css` from the shared motion tokens. Keep movement inside the element's box, avoid continuous animation, and provide a reduced-motion fallback.
- Preserve the calm, readable workspace: clear hierarchy, visible focus, semantic controls, keyboard operation, and reduced-motion support.
- Cover loading, empty, error, saved, and recovery states. A failed editor load must leave a usable fallback and preserve the draft.
- Keep narrow and short screens usable. Preserve pane selection, scroll position, editor state, and save feedback when navigation or layout changes.
- Maintain bookmarkable hash routes, refresh, and Back/Forward behavior. Session UI preferences belong in session state, not learner backups.

## Learner data is a compatibility contract

The local server binds to `127.0.0.1` and normally stores SQLite data in `~/.code-reps/progress.sqlite`. Browser development also works without the server. Keep both modes usable.

- Route learner persistence through the existing local-store and profile mechanisms; do not bypass them with ad hoc storage writes.
- Preserve profile separation, cached drafts, pending-write replay, and recovery after failed requests. An acknowledgement for an older write must not discard a newer edit.
- Validate imported backups and server data before replacing state. Invalid data or startup failures must preserve the learner's existing work.
- Keep rep, skill, and question IDs stable. Changing a checked question's answer or option ordering requires a new question ID or an explicit migration; bumping a content version alone does not migrate evidence.
- Treat storage keys, backup formats, and migration behavior as compatibility-sensitive. Add migration and failure coverage when changing them.
- Use temporary data directories for server, restore, and packaging checks. Do not experiment on the user's real progress database or backups.
- Preserve loopback binding and request validation. Do not broaden server exposure as a convenience.

## Content and assessment standards

Read `docs/CONTENT_AUTHORING.md` before adding or changing learning content. A complete rep includes a clear contract, examples, constraints, starter code, vocabulary, a plan prompt, progressive hints, normal and boundary checks, and an authored self-review.

- State normalization, precedence, mutation rules, character sets, and input limits where they affect the answer. Checks must match the written contract.
- Provide an independent reference solution and test coverage, following `tests/content.test.mjs`, the format-specific tests, and `tests/fixtures/`.
- Add a task-specific entry in `src/rep-depth.ts`: reasoning, a concrete trace, an alternative, a counterexample, and a transfer challenge.
- Knowledge lessons need objectives, prerequisites, explanation, worked examples, mistakes, interactive checks, exercise links, and an entry in `src/lesson-depth.ts` with a separately revealed discussion.
- Keep independent and recall prompts free of solution clues. Recall tasks must require a distinct application; hinted or early completion must not establish retention.
- Preserve the distinction between behavioral checks, recognition questions, and self-reviewed planning or communication. Passing tests does not prove a particular implementation approach, understanding, accessibility, or independent fluency.
- Practical-concept traces establish the authored policy, not live timer, browser, or network behavior. Transfer challenges remain self-reviewed unless separately checked.
- For a new exercise format, ship one complete playable task and review flow before expanding the catalog.

## Runner lifecycle

Function reps execute authored TypeScript in a browser worker with a five-second timeout. Frontend reps use a sandboxed frame for previews and DOM checks. These are personal-practice execution environments, not secure isolation for arbitrary third-party code.

Preserve cancellation, timeout, cleanup, and rejection of stale results. Editing code must cancel the active run and clear obsolete feedback; stopping a run must preserve the draft. Keep authored inputs isolated between checks and attempts, and retain input-mutation detection where the contract prohibits mutation.

Multi-file tasks use the existing file encoding and entry-module contract. Follow its supported local imports instead of assuming arbitrary packages are available inside learner code.

## Verification and delivery

For source changes, run the relevant focused tests while developing, then `yarn lint`, `yarn test`, and `yarn build`. Also run `yarn content:check` for content, assessment, or content-model changes, and before an app/content release. Finish with `git diff --check` and inspect the final diff for unrelated changes.

For packaging or local-service reliability changes, run `yarn package` and `node scripts/verify-portable.mjs` as appropriate. The portable workflow builds on Linux, macOS, and Windows; a local pass establishes only the platform actually exercised.

For changes affecting practice, editors, navigation, profiles, or browser persistence, run `yarn test:e2e` alongside the Node suite. Playwright tests live in `tests/e2e/`; configuration is in `playwright.config.ts`. They start a dedicated loopback Vite server on port 4175 and use fresh browser contexts without accessing the learner's SQLite database. Do not reuse a running learner server or seed the user's real progress. Any future SQLite browser tests must use temporary data directories. Failure traces and screenshots are written to ignored `test-results/`, and the HTML report to `playwright-report/`.

For UI changes, verify the affected browser flow when available, including keyboard access, narrow layouts, and preservation of work. The initial Playwright suite covers real Monaco editing, worker checks and stale feedback, draft reloads, profile separation, and narrow-pane switching with keyboard exit. It does not establish SQLite recovery, disconnected-browser operation, other browser engines, cross-platform behavior, visual fidelity, or assistive-technology support. Node/jsdom tests that substitute Monaco do not establish real editor behavior, visual fidelity, or assistive-technology support. Local asset availability does not establish disconnected-browser operation.

Documentation-only changes need link/path and command review plus `git diff --check`; do not run the full app suite solely for prose edits.

Report what changed, what was verified, and any relevant checks that were unavailable or failed. Separate automated evidence from browser, offline, cross-platform, and learner validation. Never claim a pass you did not run or weaken checks to hide a failure.
