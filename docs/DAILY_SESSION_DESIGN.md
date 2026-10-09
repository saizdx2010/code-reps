# Daily practice sessions

Status: shared understanding confirmed and stage 2 implemented. Learner observation remains pending.

This is stage 2 of [the daily practice plan](./DAILY_PRACTICE_PLAN.md). It serves returning TypeScript developers within the existing free, local-first, authored-content boundaries.

## Lifecycle

- Opening or browsing a rep does not create a session. Home and the workspace offer explicit Record a session.
- A profile has at most one active session, attached to one rep. Browsing elsewhere preserves it. Starting practice elsewhere leaves the previous session unfinished without requiring reflection or claiming it ended.
- Starting practice again creates a new session using the existing draft. An active session crossing midnight remains one session.
- Returning after closing the app shows Home and a fresh recommendation. Previously active work is unfinished and available for explicit resume; resuming starts a new session.
- Completing a rep records its completed attempt but does not end the session. Ending a session requires a nonblank written reflection and may occur with an incomplete rep.
- Saving and leaving without reflection remains possible. Unfinished sessions appear separately, with resume and discard actions.
- An ended session shows a compact saved summary, Back to Home, and optional Start another rep. Continuing explicitly creates another session.

## Reflection and evidence

Prompt: What did you learn or where did you get stuck?

Save reflection while typing and permit later edits. Difficulty tags are optional. Difficulty/confidence selections and the solution explanation are separate concepts; permit intentional reuse of suitable written text without copying it automatically.

An ended practice record contains the rep, start/end dates, reflection, optional difficulty, hint use, and whether an attempt was completed during the session. Do not score duration or infer mastery. Session actions do not complete a rep, change recall dates, or contribute to independence, retention, path badges, or completed-rep streaks.

## Work references

Store factual summary and links rather than duplicate code snapshots. A completed-attempt link opens recorded work by its stable identity. A draft link clearly opens current work, which may have changed since the session.

If original work is missing, retain the reflection and summary, explain that the original work is unavailable, and offer the rep. Never substitute a different completed attempt. Imported draft links must retain the current-work wording, because existing drafts win learner-import conflicts.

## Persistence and recovery

- Keep session data separately validated and scoped to the profile through existing persistence mechanisms. Do not mix it into completed-attempt history.
- Save work before switching profiles and preserve session isolation. Profile deletion removes its session data through existing profile cleanup.
- Detect stale session changes across tabs and offer reload/recovery without silently overwriting session data or losing code drafts. Collaborative editing is outside scope.
- Reuse browser persistence and pending-write replay when the local service is unavailable. Clearly distinguish a local save awaiting service synchronization from a failed local save.
- If local persistence fails, preserve the form and offer retry or backup; do not falsely acknowledge an ended session.
- Older backups remain valid with no sessions. Both learner backups and full-profile imports must validate and round-trip the new contract. Invalid session data rejects an import before replacement.
- Permit explicit deletion with confirmation, without deleting linked drafts or completed attempts. Do not automatically prune history. At limits, explain the issue and offer export and cleanup.

## Presentation

Progress contains Practice history with ended and unfinished views. Preserve completed-attempt History and distinguish it from session records. Home offers a fresh recommendation and unfinished-work resume; the workspace offers start, reflection, and end actions without interrupting the existing five-step loop.

## Implementation constraints discovered in the repository

Drafts currently have no stable attempt identity; they are mutable values keyed by rep. Completed history records have UUIDs and snapshots. Current reflection fields are difficulty and confidence, not learning/stuck prose.

Both backup routes require explicit updates: learner backup parsing currently ignores unknown fields, while full-profile import allowlists keys. Learner imports merge history by UUID and preserve existing drafts. Session imports must preserve these behaviors and handle identity collisions without silently mislinking work.

The local store provides profile scoping, browser rollback on quota failure, pending replay, and protection against older acknowledgements clearing newer writes. It also supports batched writes. These mechanisms must be reused and tested; they do not themselves establish protection against all cross-tab races.

Existing file, entry, batch, and request limits constrain the new format. Choose an additive bounded contract within those limits; never silently trim learner records to make an import or save succeed.

## Verification

Run focused lifecycle, persistence, migration, import, profile, and stale-write tests; then lint, full Node tests, build, Chromium flows, and diff checks. Run portable and service smoke checks as appropriate using temporary data. Browser flows must cover keyboard and narrow layouts, reload/resume, unfinished endings, reflection recovery, profile separation, optional help, and unchanged recall evidence after ending a session.

Test legacy backups, invalid-session rejection, missing work links, import collisions, storage limits, pending replay, failed local saves, and cross-tab stale edits. Automated verification establishes behavior; learner observation, full disconnected operation, assistive technology, and cross-platform validation remain separate evidence gates.

## Implemented data contract

`code-reps:sessions:v1` is a profile-scoped, versioned object containing a revision token and session records. Records have stable session IDs, rep IDs, start dates, reflection, and hint counts, with optional end date, difficulty, and completed-attempt ID. A record with no end date is unfinished; active session identity exists only while the app is open. Reload never automatically reactivates it.

The contract accepts at most 1,000 records, 2,000 characters per reflection, and 800,000 serialized UTF-8 bytes. Limits reject additions/imports with export-and-cleanup guidance; records are not pruned automatically. Learner backup v1 adds optional `sessions`; older files remain valid. Full-profile files allow and validate `sessions:v1`. Repeated learner imports keep local session IDs and edits in a collision, matching existing history merge precedence. Missing attempt/draft references remain valid and receive explicit unavailable-work presentation.

Session mutations use browser Web Locks and compare the loaded serialized revision before committing through the existing local store. Browsers without Web Locks leave ordinary rep practice usable but cannot mutate session records; use a supported current browser for sessions. Cross-tab recovery explicitly reloads saved session records, preserves locally unsaved reflection, and lets the learner retry it. These safeguards coordinate session writes, not arbitrary concurrent editing of code drafts or separate browser installations.

## Verification evidence

On macOS arm64, lint, 183 Node tests, content validation, production build/bundle budgets, and the full 45-test Chromium suite passed. The nine session-specific browser flows were rerun after the final lifecycle and history refinements. Focused session validation covers malformed and empty profile entries, Unicode storage limits, legacy backups, repeated imports, and stale revisions.

The portable bundle smoke test passed using temporary data: bundled runtime, local assets, first run, paths with spaces, save/restart, snapshot, and shutdown. Narrow history screenshots were inspected at 320 CSS pixels. These results do not establish Windows/Linux behavior, full disconnected-browser operation, other browser engines, assistive-technology support, or learning effectiveness.
