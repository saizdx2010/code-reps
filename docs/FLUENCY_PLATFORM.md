# A free local fluency platform

Code Reps helps people build coding fluency and assess their own understanding. No account, email, password, subscription, certificate, leaderboard, video course, or AI tutor is required. Learning content, application assets, runners, and learner data are local.

## Learning tools

The main navigation has three areas: Trail, Library, and Progress. The learning tools sit inside Library and Progress and connect reference material to practice:

- **Lessons** (Library): authored skill lessons with objectives, suggested prerequisites, worked examples, execution walkthroughs, common mistakes, related concepts, bookmarks, and interactive prediction/completion checks. Search includes article text. Subjects run from values, arrays, and lookup through validation, frontend state, debugging, complexity, asynchronous work, HTTP, React, testing, databases, practical application patterns, and algorithm techniques. Quick lessons offers short introductions.
- **Projects** (Library): frontend and backend milestone sequences culminate in two multi-file implementations. TypeScript file tabs preserve the other files while editing. Frontend integration has a local sandboxed preview and DOM checks; backend integration checks parsed request/response behavior. The backend exercise does not start a real HTTP service or database. Projects also lists the external browser projects.
- **Interview** (an optional link at the end of Projects): timed frontend/backend rounds. Clarifications and debriefs are saved. The timer persists through navigation and refresh using its start date; reaching the budget does not submit or erase code. End the round manually and review each dimension separately.
- **Self-assessment** (a link near the end of Progress → Skills): an optional four-task coding diagnostic with dated evidence and a suggested focus. Each skill separates checked attempts, completions without revealed hints, latest prediction results, delayed recall, and learner judgments. Understanding, approach, implementation, and explanation have explicit rubrics. There is no overall mastery score.
- **Weekly plan** (a link near the end of Progress → Skills): choose a track, a time budget, and days. The next seven local calendar days mix due reviews, unfinished work, and remaining exercises on the chosen track. Suggestions can be overridden.
- **Notebook** (Progress → Journal): searchable notes, mistakes, and questions linked to a skill and exercise. Unfinished entries are saved as profile drafts, including across profile switches. Saved entries can be edited or deleted.

Most lessons are reference material rather than complete courses. React and databases each have one executable task: a React component rendered in the sandboxed frame and a SQLite transaction run in an in-memory database (see [Richer exercises](./RICH_EXERCISES.md#one-react-task) and [ADR 0002](./adr/0002-in-memory-sqlite-practice.md)). Neither topic has a dedicated journey yet.

## Local profiles

Use **Profiles** in the app header to create, switch, rename, export, import, or delete a local profile. Each profile owns its attempts, drafts, history, starting choice, learning-tool data, selected exercise, and workspace preference. Session UI preferences and editor paths are separated too.

On first upgrade, existing `code-reps:*` learner keys move into the default **My learning** profile in a single batch. Storage infrastructure keys are excluded. Switching saves the active exercise and waits for pending server writes before changing the profile. Failed saves leave the current profile open.

Profiles separate data; they do not provide authentication or privacy from someone with access to the machine. Each browser tab remembers its selected profile for its session. Simultaneous editing of the same profile in multiple tabs is not a collaborative editing workflow; the existing store uses last writes rather than conflict merging.

Under **Full profile file**, **Export {profile}** produces a full profile file with notes, lesson answers, assessments, rounds, and preferences. **Import as a new profile** validates it before a batch write and creates a separate profile with a new ID. Export and import share a 20 MB limit; an export that would exceed it is refused with a notice rather than downloaded. Progress → Download backup also includes learning-tool data while retaining compatibility with older attempt-only backups. A Progress backup is previewed before it merges. When merging, existing local goals and matching record IDs take precedence; unique incoming notes, rounds, answers, and bookmarks are retained.

Delete asks for explicit confirmation and retains at least one profile. Export before deleting if you want a portable copy. Existing automatic SQLite backups may retain earlier profile data.

## Retention rules

The existing guided → independent → delayed recall evidence remains intact. After the first successful delayed recall, recurring reviews rotate through other authored applications for that skill:

1. The first further review is due after seven days.
2. A scheduled completion without hints and without reported difficulty increases the interval, up to 60 days, and advances to the next variant.
3. A hinted or difficult scheduled completion keeps the variant and shortens the interval to three days.
4. Early attempts or out-of-sequence variants do not establish scheduled recall.

Dates and reasons remain visible. A review completion is evidence for the checked task, not a guarantee of permanent retention. These initial intervals need learner validation.

The windows, two-pointers, sorting, binary-search, recursion, trees, and graphs review rotations also include fresh applications: sensor spans, reservation occurrence matching, dispatch ordering, affordable editions, nested parcel loads, terminal folder paths, and broadcast coverage. These variants are appended after existing entries so saved review indices keep their meaning. Checks establish the stated output and input-preservation behavior; they do not establish the chosen algorithm or independent understanding.

Control-flow reviews now apply repetition and conditions to packing batches and inspection streaks. Interface-logic reviews derive bulk-action availability and nearby chapter links. Request-response reviews shape conditional resource and retry responses. Find-the-bug reviews ask learners to author stock-allocation and access-policy cases; distinguishing supplied variants does not prove a complete case table. Existing recall variants keep their positions, with the new applications appended.

The validation journey uses the existing user-request validator for guided work, a stock-adjustment contract for independence, and a delivery-window contract after three days for recall. After retention, scheduled reviews begin with batch import validation. Defaults, error precedence, and normalized duplicate detection require different applications; passing output checks does not assess the learner's reasoning or establish a live service.

## Content quality

Run `yarn content:check`, `yarn test`, `yarn lint`, and `yarn build`. Content validation checks references, prerequisite cycles, question answers, recall variants, project milestones, briefs, and rubric availability. Reference-solution tests check authored expected behavior, including the real DOM integration of the frontend capstone. They do not prove every possible incorrect solution is rejected or assess the quality of learner prose.

Content version is exported from `src/knowledge.ts`; exercise IDs remain stable. Bump the content version for published lesson/check changes and document behavior changes. Profiles carry learner answers; validators recompute their correctness from current authored answers. Changing a question's options or answer needs a migration or a new question ID to avoid invalidating old saved assessments. A downloadable third-party executable content-pack installer is not implemented; authored content ships with application releases.

## Verification boundaries

Automated coverage includes profile migration, storage separation, full-profile validation, learning backup compatibility, recurring-review rules, weekly calendar planning, content references, module loading, frontend/backend capstone behavior, and actual React knowledge/notebook/profile-switch flows in JSDOM. The React test substitutes the editor component; runner/editor behavior has separate coverage.

The learning tools reuse the app's typography, green action palette, compact spacing, and surfaces. Shared `Input`, `Select`, `Textarea`, and `NumberInput` controls cover both existing pages and the new tools; number fields allow clearing and retyping before committing valid whole numbers. Shared buttons make primary, secondary, text, and destructive actions consistent. Skill evidence is expandable to keep the assessment overview concise.

The local server was exercised using an isolated data directory. Desktop Safari screenshots were inspected for Knowledge, Practice, the practice plan, profile management, self-assessment, and the notebook empty state. Native automation lost access to the window during the narrow-screen check, so mobile visual verification remains unconfirmed. Keyboard, screen-reader, zoom, real disconnected-browser use, and Windows/Linux release validation remain manual gates. Learner understanding and later transfer must be checked with people using the protocol in `docs/LEARNER_VALIDATION.md`.
