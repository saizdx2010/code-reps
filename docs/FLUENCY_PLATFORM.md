# A free local fluency platform

Code Reps helps people build coding fluency and assess their own understanding. No account, email, password, subscription, certificate, leaderboard, video course, or AI tutor is required. Learning content, application assets, runners, and learner data are local.

## Learning tools

Open **Knowledge** from the main navigation. Its six areas connect reference material to practice:

- **Knowledge:** 30 authored skill lessons with objectives, suggested prerequisites, worked examples, execution walkthroughs, common mistakes, related concepts, bookmarks, and 60 interactive prediction/completion checks. Search includes article text. Subjects include values, arrays, text, lookup, stacks, runtime validation, frontend state, debugging, complexity, asynchronous work, HTTP, React, testing, and databases.
- **Self-assessment:** an optional four-task coding diagnostic with dated evidence and a suggested focus. Each skill separates checked attempts, completions without revealed hints, latest prediction results, delayed recall, and learner judgments. Understanding, approach, implementation, and explanation have explicit rubrics. There is no overall mastery score.
- **Practice plan:** choose a path, session budget, and days. The next seven local calendar days mix due reviews, unfinished work, and remaining exercises on the chosen path. Suggestions can be overridden.
- **Notebook:** searchable notes, mistakes, and questions linked to a skill and exercise. Unfinished entries are saved as profile drafts, including across profile switches. Saved entries can be edited or deleted.
- **Projects:** frontend and backend milestone sequences culminate in two multi-file implementations. TypeScript file tabs preserve the other files while editing. Frontend integration has a local sandboxed preview and DOM checks; backend integration checks parsed request/response behavior. The backend exercise does not start a real HTTP service or database.
- **Interview:** optional timed frontend/backend rounds. Clarifications and debriefs are saved. The timer persists through navigation and refresh using its start date; reaching the budget does not submit or erase code. End the round manually and review each dimension separately.

The catalog has 72 exercises. Eleven new focused exercises add further array, text, lookup, stack, validation, derived-state, and debugging applications; two capstones add module integration. Asynchronous work, React, and database articles are introductory reference lessons, not complete courses with framework/database execution environments.

## Local profiles

Use **Profiles** in the app header to create, switch, rename, export, import, or delete a local profile. Each profile owns its attempts, drafts, history, starting choice, learning-tool data, selected exercise, and workspace preference. Session UI preferences and editor paths are separated too.

On first upgrade, existing `code-reps:*` learner keys move into the default **My learning** profile in a single batch. Storage infrastructure keys are excluded. Switching saves the active exercise and waits for pending server writes before changing the profile. Failed saves leave the current profile open.

Profiles separate data; they do not provide authentication or privacy from someone with access to the machine. Each browser tab remembers its selected profile for its session. Simultaneous editing of the same profile in multiple tabs is not a collaborative editing workflow; the existing store uses last writes rather than conflict merging.

**Export current** produces a full profile file with notes, lesson answers, assessments, rounds, and preferences. **Import profile** validates it before a batch write and creates a separate profile with a new ID. The local import limit is 2 MB. Progress → Download backup also includes learning-tool data while retaining compatibility with older attempt-only backups. When merging a Progress backup, existing local goals and matching record IDs take precedence; unique incoming notes, rounds, answers, and bookmarks are retained.

Delete asks for explicit confirmation and retains at least one profile. Export before deleting if you want a portable copy. Existing automatic SQLite backups may retain earlier profile data.

## Retention rules

The existing guided → independent → delayed recall evidence remains intact. After the first successful delayed recall, recurring reviews rotate through other authored applications for that skill:

1. The first further review is due after seven days.
2. A scheduled completion without hints and without reported difficulty increases the interval, up to 60 days, and advances to the next variant.
3. A hinted or difficult scheduled completion keeps the variant and shortens the interval to three days.
4. Early attempts or out-of-sequence variants do not establish scheduled recall.

Dates and reasons remain visible. A review completion is evidence for the checked task, not a guarantee of permanent retention. These initial intervals need learner validation.

The validation journey uses the existing user-request validator for guided work, a stock-adjustment contract for independence, and a delivery-window contract after three days for recall. After retention, scheduled reviews begin with batch import validation. Defaults, error precedence, and normalized duplicate detection require different applications; passing output checks does not assess the learner's reasoning or establish a live service.

## Content quality

Run `yarn content:check`, `yarn test`, `yarn lint`, and `yarn build`. Content validation checks references, prerequisite cycles, question answers, recall variants, project milestones, briefs, and rubric availability. Reference-solution tests check authored expected behavior, including the real DOM integration of the frontend capstone. They do not prove every possible incorrect solution is rejected or assess the quality of learner prose.

Content version is exported from `src/knowledge.ts`; exercise IDs remain stable. Bump the content version for published lesson/check changes and document behavior changes. Profiles carry learner answers; validators recompute their correctness from current authored answers. Changing a question's options or answer needs a migration or a new question ID to avoid invalidating old saved assessments. A downloadable third-party executable content-pack installer is not implemented; authored content ships with application releases.

## Verification boundaries

Automated coverage includes profile migration, storage separation, full-profile validation, learning backup compatibility, recurring-review rules, weekly calendar planning, content references, module loading, frontend/backend capstone behavior, and actual React knowledge/notebook/profile-switch flows in JSDOM. The React test substitutes the editor component; runner/editor behavior has separate coverage.

The learning tools reuse the app's typography, green action palette, compact spacing, and surfaces. Shared `Input`, `Select`, `Textarea`, and `NumberInput` controls cover both existing pages and the new tools; number fields allow clearing and retyping before committing valid whole numbers. Shared buttons make primary, secondary, text, and destructive actions consistent. Skill evidence is expandable to keep the assessment overview concise.

The local server was exercised using an isolated data directory. Desktop Safari screenshots were inspected for Knowledge, Practice, the practice plan, profile management, self-assessment, and the notebook empty state. Native automation lost access to the window during the narrow-screen check, so mobile visual verification remains unconfirmed. Keyboard, screen-reader, zoom, real disconnected-browser use, and Windows/Linux release validation remain manual gates. Learner understanding and later transfer must be checked with people using the protocol in `docs/LEARNER_VALIDATION.md`.
