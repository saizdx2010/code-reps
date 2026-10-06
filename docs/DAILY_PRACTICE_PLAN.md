# Daily practice and curriculum cohesion

Status: shared understanding confirmed. Stage 1 implemented; stages 2 and 3 remain planned.

## Agreed direction

Improve daily practice flow and curriculum cohesion for returning TypeScript developers. Retain the free, local-first, authored-content model and existing exclusions: accounts, cloud sync, leaderboards, certificates, and AI tutoring.

Boot.dev is a reference for clear progression and momentum. The plan should extend Code Reps' existing recommendations, journeys, review evidence, and project milestones.

## Existing foundations

- Home recommends a rep with a reason and surfaces unfinished work and due reviews.
- Skill journeys connect guided work, independent application, and delayed recall.
- Attempt completion offers a next action; projects contain practical milestones.
- Weekly planning has a time budget, but there is no dedicated daily session lifecycle.

## Agreed experience

- Today's practice is one rep plus reflection.
- Due recall takes first priority in the daily recommendation, followed by unfinished drafts within the chosen goal path and then progression in that path. Other drafts remain secondary resume options.
- An ordered path is the main curriculum view, with distinct completion and skill evidence.
- A learner may end a session with saved unfinished work and reflection; the rep remains incomplete.
- After a difficult recall, help is optional. Solution hints affect independence evidence, and independent retry remains available.
- Offer a suggested default path and an explicit learner choice. Keep that goal until the learner changes it.
- When no recall is due, prioritize drafts within the chosen path. Other drafts remain secondary resume options.
- Explicitly ending a session requires one short reflection on learning or difficulty; difficulty tags are optional. Saving and leaving remain available without reflection.
- Returning to the app opens Home with a fresh recommendation and a resume option for unfinished sessions.
- Ended sessions appear as separate practice records linked to their draft or attempt. They do not count as rep completion or skill evidence.
- The ordered path shows guided, independent, and recall roles alongside completion, highlights the next action, and shows scheduled recall availability. Reps remain freely accessible.
- Authored links connect paths to existing relevant project milestones with a short explanation. These are application opportunities, not automatic transfer or mastery evidence.

## Session and recall rules

- Explicitly starting practice again creates a new session using the existing draft. Merely crossing midnight does not split an active session.
- Returning after closing the app does not automatically start or reopen a session. Home offers a fresh recommendation and explicit resume action.
- Existing recall scheduling governs retries. Ending a session alone never completes recall or changes its due date.
- Preserve existing assessment stages and the separation of behavioral checks, self-review, independence, and retention.

## Delivery stages

### 1. Curriculum cohesion

Extend the existing path, Home, and completion views rather than introducing parallel recommendation logic. Show the recommendation reason and how the current rep connects to the next action. Present guided, independent, and recall roles with evidence and availability dates. Add authored connections to relevant existing project milestones. Offer a suggested goal path with explicit selection and preserve free browsing.

Relevant owners: `src/path.ts`, `src/PathsPage.tsx`, `src/HomePage.tsx`, `src/practice.ts`, `src/App.tsx`, `src/learning.ts`, and project definitions in `src/fluency.ts`.

### 2. Daily session lifecycle

Add explicit start and end actions around one rep plus reflection, optional continuation through another session, draft resume, and separate per-profile practice records. Preserve save-and-leave behavior without requiring reflection. Reuse existing reflection where suitable instead of asking learners to write the same response twice.

Route session data through existing profile and persistence mechanisms. Define and validate its additive backup contract before implementation; cover legacy imports, profile separation, failed writes, newer edits during acknowledgements, and draft/attempt links. Preserve browser-only and local-service modes. Use temporary data for service checks.

Relevant owners: `src/App.tsx`, `src/practice.ts`, `src/fluency.ts`, `src/local-store.ts`, `src/profiles.ts`, `src/profile-backup.ts`, and existing server validation/storage owners as needed.

### 3. Verification and learner observation

Run focused tests, lint, the Node suite, content validation for authored relationships/model changes, build, Chromium flows, and diff checks. Run portable/service verification if persistence changes affect those contracts. Browser coverage should include keyboard and narrow layouts, reload/resume, unfinished session endings, profile separation, optional recall help, and unchanged recall evidence after session end.

Observe returning learners before tuning scheduling. Ask whether they can identify the next rep and its reason, end and resume practice without losing work, and explain the difference between path completion and skill evidence. Automated behavior checks do not establish comprehension or learning effectiveness.

## Acceptance scenarios

- A due recall from another path is recommended with a reason; the chosen goal remains unchanged.
- With no recall due, a draft in the goal path takes priority; drafts outside that path remain available.
- An unfinished rep can produce an ended practice record after reflection without becoming a completed attempt.
- Saving and leaving without reflection preserves work without claiming an ended session.
- Starting again reuses the draft in a new session; an active session crossing midnight remains one session.
- Optional help is an intentional reveal and retains existing hint evidence rules.
- Path completion, independent/retained evidence, and project application remain visibly distinct.
- Legacy backups and data remain usable, and session records stay separated by profile.

## Confirmation

The learner experience and stage 1 implementation were authorized after this interview. Detailed schema and UI choices must follow the existing contracts and conventions; surface any newly discovered product trade-off rather than silently widening scope.
