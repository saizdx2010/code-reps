# Project audit — 7 October 2026

## Scope

Reviewed the current worktree, product and design documentation, page rendering owners, practice and editor lifecycle, navigation, learning evidence, profiles, persistence, backup validation, local server, runners, tests, and distribution configuration. Existing uncommitted work was preserved.

The visual sweep covered home, practice catalogue, paths, progress, knowledge, learning, notebook, planning, assessment, projects, interview, attempt history, session history, and function, frontend, and multi-file workspaces. Each was checked at 1280 × 900, 320 × 568, and 900 × 568: 48 route/viewport observations with no document overflow or uncaught page errors. This is layout evidence, not full accessibility certification.

## UI consistency changes

- Session-history switches use the shared segmented control, retain their selected colours on hover, and respond without lifting.
- Path badge cards have a full-card button target and aligned actions, with distinct accessible labels.
- Lesson and notebook feedback use shared readable success/error surfaces and canonical status icons.
- Inactive lesson tabs use readable text contrast.
- Search and glossary drawers retain exit motion while restoring keyboard focus; reduced-motion behaviour is preserved.
- Project copy describes the playable experience rather than future roadmap work.
- The design-system guide records the shared feedback, card, switch, and drawer rules.

Existing practice changes retain the separate light checks container below the workspace, compact session controls, and reflection on request. Shared controls, icons, loading states, and motion remain owned by the existing design styles and components.

## Outstanding findings

### High: an unsaved notebook entry can be replaced

`src/LearningHub.tsx` replaces the editing entry when New entry or another entry's Edit action is used. A fresh browser reproduction entered an unfinished title, selected New entry again, and observed the title disappear. Save the draft or explicitly resolve unsaved changes before replacing it. Add a browser regression covering switching between new and existing entries.

### High: a valid export can exceed its own import limit

`src/App.tsx` exports supported drafts without a total size limit; `src/portability.ts` rejects imports above 2,000,000 characters. Profile export/import has the same mismatch with `src/profile-backup.ts`. A synthetic backup with 24 individually valid 90,000-character drafts produced 2,162,213 characters and was rejected by the importer. No real learner data was used. Align export/import limits and verify a large export round trip before promising backup recovery.

These data-behaviour findings were reported rather than changed as part of the UI consistency work.

## Verification

- Baseline: lint, 190 Node tests, build, content validation, and all 57 existing Chromium tests passed.
- Content validation covered 34 lessons, 68 interactive checks, and 83 exercises. It does not replace manual review of every authored explanation.
- After UI changes, a full Chromium run passed 58 cases and failed the new session-switch hover assertion. The generic button transform was corrected, followed by focused design-system, controls, and validation verification.
- An earlier run encountered one validation-dropdown timeout; it passed on the subsequent full run. This remains an observed intermittent failure, not a confirmed fix.
- Final lint, all 190 Node tests, build (including asset budgets), all 16 focused design-system/controls/validation Chromium tests, and `git diff --check` passed.

Audit logs, route screenshots, and reproduction scripts are in `/tmp/code-reps-project-audit-oct07/`; these temporary artifacts are not committed project fixtures.

## Dark-mode follow-up

Added a shared semantic dark palette and a keyboard-accessible header toggle. System preference initializes the theme; an explicit selection survives refresh in session UI state, shared between profiles and excluded from learner backups. Critical startup styling covers dark first paint before external assets arrive. A further 48 dark route/viewport observations had no document overflow or uncaught page errors; home, progress, narrow learning/workspace, and startup screenshots were inspected.

Lint, 190 Node tests, build budgets, and the dedicated theme/startup/navigation checks passed. The final full Chromium run passed 61 cases, while two validation cases failed during trace cleanup with missing files when another Playwright process shared the output directory. An isolated parallel rerun then encountered worker timeouts; those validation cases were rerun serially in a separate temporary output directory. The short-screen layout assertion now waits for disclosure motion to settle before checking the same geometry requirement. The lesson-navigation test asserts the requested tab focus rather than the former focus jump.

The isolated serial run passed the narrow validation flow but still failed the longer validation journey with a worker timeout. Its cause is unresolved; a clean full-suite pass is not claimed for this follow-up.

## Verification boundaries

This audit did not establish full disconnected-browser operation, other browser engines, screen-reader usability, cross-platform portable launch/upgrade/restore, or learner effectiveness. Portable packaging and remote CI were not rerun for this UI audit. Automated content and runner checks do not prove understanding, independence, accessibility, or the quality of every explanation. Those remain separate release checks.
