# Practice UI

This guide owns behavior: routes, navigation, keyboard controls, saved state, and session preferences. The [Code Reps design language](./DESIGN_SYSTEM.md) owns page structure, tokens, shared components, and motion.

## Voice and terms

Use US English: **practice** is both a noun and a verb. Write directly to the learner in short, friendly, plain English.

- **Track:** a curriculum, such as Foundations or Frontend. Code and saved data call it a path (`src/path.ts`, `goal.pathId`); learner-facing text says track.
- **Goal:** the track the learner chose as their current focus. A suggested default becomes the goal only when the learner chooses it, and browsing another track does not change it. Avoid “assigned course”.
- **Trail:** the visual path of stages on the Trail page.
- **Stage:** a group of related reps within a track.
- **Rep:** one coding exercise and its understand, plan, solve, explain, and review loop.
- **Lesson:** an explanation with examples and knowledge checks.
- **Due recall:** a scheduled chance to apply a previously practiced skill after a gap. It comes first in recommendations. Avoid “overdue assignment” or “mastery test”.

A completed stage replaces its description with a short recap of the work practiced. It does not establish independent fluency or retention. The editor header follows the active project file.

Progress and Journal share readable local dates and singular/plural labels. A zero Progress stat explains which practice unlocks it. Library topics are presentation labels shared by filtering and grouping; authored categories, rep IDs, and checked answers stay unchanged.

Briefs and lesson prose render paired backticks as inline code using the shared `InlineCode` component. All text stays escaped by React. Keep each rep's assessment limits in one “How this is checked” `InfoNote`: checks show tested behavior, while the learner reviews writing and variations. Task limits stay visible in the brief; only assessment sentences move into the disclosure. The checks drawer reports results.

## Navigation

- Main navigation has Trail, Library, and Progress. The second row contains only the pages in the selected area: Your trail and All tracks; Exercises, Lessons, and Projects; or Skills and Journal. The [information architecture](./DESIGN_SYSTEM.md#information-architecture) table lists each area's routes.
- Skills switches between Journeys and Skill map (`#/progress`, `#/skillmap`). Journal switches between Attempts (`#/history`), Notebook (`#/notebook`), Mistakes (`#/mistakes`), and Stuck points (`#/stuck`); each keeps its own bookmarkable route, and the retired `#/sessions` redirects to `#/history`. Timed interview practice (`#/interview`) is an optional link at the end of Projects. The weekly plan (`#/plan`) and self-assessment (`#/assessment`) are quiet links near the end of Skills. Their saved data is unchanged, and every old route still opens a page.
- Each tool has a bookmarkable hash route. Existing `#/knowledge`, `#/learn`, and exercise bookmarks remain valid. Lessons opens full lessons; `#/learn` continues to open quick introductions.
- Exercise URLs use `#/practice/<rep-id>`. Pages and exercises support bookmarks, refresh, and browser Back/Forward.
- During practice, Navigate opens the main destinations in a compact menu. Escape closes it and restores focus to its summary. Profile management remains beside the profile name. Search opens the command palette; its keyboard shortcut is also available in the narrow workspace.
- Narrow screens keep save feedback visible on every page. Main navigation fits in four destinations; section navigation can scroll when needed. Search keeps a visible text label on browsing pages, and Ctrl/Command K remains available in practice.

## Find and resume work

- The header shows the active local profile and opens profile management. Switching is immediately available; creation/renaming and full-profile export/import open separately. Save feedback remains visible in the page navigation or workspace controls. Profile switching, creation, import, export, and deletion show an operation message while work is pending.
- Your trail (`#/home`) draws the goal track as stages of connected nodes, with the next practice beside it (above it on narrow screens). Each lesson appears once, immediately before the first rep that uses it; reps show done, next, in progress, or recall-later states, and project milestones end the trail.
- The next-practice panel names the rep, the reason, and the next learning step. Below it, one compact Also waiting list offers at most one saved draft and one due review. When more are waiting, See all due reviews opens Progress and Find saved drafts in the Library opens the Library. Opening a choice preserves the existing resume or fresh-review behavior. Trail links lead to progress and, after the first walkthrough, Replay walkthrough.
- All tracks (`#/paths`) holds the starting-point choice (New or Returning to coding) in a Starting as disclosure, an always-visible Choose track dropdown, and the selected track with its next action. The menu supports keyboard selection and remembers the chosen track in the current session. Explore tracks shows Foundations first, then the tracks that build on it, with completed-rep counts; it starts open on desktop, collapsed on narrow screens, and remembers expansion in the current session. Stages made only of Foundations reps are marked as covered by Foundations and link back to it. Selecting a track on a narrow screen closes the chooser and focuses the selected track heading.
- Exercises groups reps by primary topic; groups begin collapsed, remember expansion in the profile's browser session, and open matching results during search or filtering. Search stays visible. Topic, type of rep, and progress filters share one compact Filters disclosure that starts expanded on desktop and collapsed on narrow screens; expansion is a session preference. Clear filters restores the full library.
- Journal → Attempts filters completed attempts by rep or skill search, skill, difficulty, and local calendar date, and compares earlier and current code, plans, explanations, and hint counts. Written work remains self-reviewed.
- Returning to a screen restores its scroll position and open sections. Filters, the selected track, and the mobile workspace tab survive refresh in the same browser session.
- Editor cursor, selection, and scroll position are remembered per exercise. Learner drafts remain in the existing local store; session-only UI preferences do not enter backups.

## Goals and recommendations

Your trail draws the goal track. Browsing another track does not change the goal; choose **Use this as my learning goal** on All tracks to save that preference for the current profile. Foundations is the starting suggestion.

Tracks identify guided, independent, and recall reps from the authored skill journeys, show recall availability and evidence, and connect the Frontend and Backend tracks to project integration milestones. Track completion includes hinted attempts and remains separate from independence and retention. Early recall can be opened freely, but existing timing and hint rules still govern retention evidence.

Due recall remains first in recommendations. Drafts within the chosen track take priority over new reps in that track; other drafts remain visible for explicit resume. Existing difficult-review scheduling remains available. Completed attempts show the reason for the recommended next action.

## Browse learning content

- Lessons opens full lessons. Its index groups lessons by topic, with search, a topic filter, and bookmarks. Search opens matching groups; Clear knowledge filters restores all topics. Filters survive refresh in the same profile and browser session. On narrow screens, Browse lessons starts collapsed and selecting a lesson closes the index and focuses the reader. Selecting a lesson scrolls to its content and moves keyboard focus there.
- Lessons have focused Read, Predict, Practice, and Review views. Review opens the evidence and self-assessment disclosure. Moving between views keeps predictions and written evidence mounted; the selected view survives refresh per lesson and profile. Predictions remain distinct from independent coding evidence.
- Quick lessons inside the lesson index opens short introductions. The existing `#/learn` bookmark still works.
- Self-assessment groups skills by knowledge topic while retaining each skill's supporting evidence and the optional assessment flow. Project summaries disclose milestones and final self-review.

## First rep walkthrough

Trail offers **Show me how a rep works**, a walkthrough around the real Declare a value rep. After starting it, **Replay walkthrough** stays among the trail links, keeping the daily choices prominent. Inline help follows Understand, Plan, Solve, Explain, and Review; normal step navigation remains available. The guide introduces saved writing, behavioral checks, optional recorded hints, and the existing completion checklist without inserting a solution, completing an attempt, or granting mastery. Skip or Finish dismisses the help; replay opens the existing draft without resetting it.

Walkthrough visibility is a profile-scoped session UI preference through `useSessionPreference`, survives refresh in that browser session, and stays out of learner backups. The guide appears only on its rep and resumes on return until dismissed; Back/Forward and reload use the existing routes and draft owners. The editor remains mounted while changing steps. Focused Chromium flows cover skip/replay (including completed attempts), dismissal focus, real checks and completion, profile separation, guide-load failure, and short/narrow-screen draft preservation. Desktop and phone Solve layouts were also inspected in Chromium on macOS; this does not establish all-screen visual fidelity, browser zoom, other platforms, disconnected operation, or assistive-technology support.

## Arrange the workspace

The [practice workspace](./DESIGN_SYSTEM.md#practice-workspace) section describes the layout. Its behavior:

- One compact header row carries the Library back link, exercise title, status chip, save status, Glossary, and Tools. Tools contains focus mode, Reset rep, and related concepts. Escape closes Tools and returns focus to its summary.
- Desktop practice uses a fixed split workspace: the task pane and editor scroll independently, while the step rail, save status, and Run checks stay visible. A new learner starts with a 40/60 reading/code split. Drag the divider between brief and editor, or focus it and use Left/Right to resize, Home/End for the limits, or double-click to restore the default split. The split preference is saved locally.
- Focus mode expands the coding workspace. Use Exit focus in Tools or press Escape to return; selecting a writing or understanding step also exits focus mode.
- The brief opens with a collapsed **About this rep** note (`src/RepGuidance.tsx`, derived in `src/rep-guidance.ts`): a rough first-attempt effort range by authored level, linked lessons and their prerequisites, and unfinished earlier reps in the same stage. When a rep is two or more levels above anything completed, a readiness checkpoint offers an optional bridge rep and lesson. Estimates are guidance only, never change with learner speed, and nothing is locked.
- Understand, Plan, Solve, Explain, and Review navigate the practice loop without enforcing a sequence. The brief is available during Understand and Solve; Plan, Explain, and Review each show their own writing or reflection view. The editor remains mounted beside the selected step. Step status descriptions report written work and behavioral checks, not an assessment of understanding or writing quality. The selected step is a session preference.
- The toolbar below the editor keeps Run/Stop and result counts within reach. Checks open as a drawer inside the coding desk, directly above that toolbar: it starts as a slim bar, expands on running or selecting Results, scrolls internally while the editor shrinks, and can be collapsed without discarding feedback. Passing checks offers a direct action to explain the solution.
- On narrow screens, Solve shows the coding pane with checks under the editor; the other steps show only their selected task or writing view. Both panes remain mounted, preserving drafts, file selection, cursor, selection, preview interactions, and editor scroll position.
- The editor begins loading when an exercise row is hovered or focused. Editor recovery remains available if loading fails.

Plan and Explain offer optional English sentence starters above the writing field. Selecting one appends it to your draft and returns focus to the field; your writing saves normally. **Show Indonesian help**, beside Quick vocabulary in the brief, is off by default. It adds short Indonesian glosses where available and an English tips disclosure in Explain. English stays primary. This profile-scoped preference survives refresh in the current browser session and never enters learner backups.

## Checks and completion

- The first failed check expands to show the failing input, expected and actual values where available, and actionable feedback. Selecting another failed check opens that case and closes the previous one. Passed checks remain visible as rows with right-aligned outcomes in the checks drawer.
- The completion checklist separately shows plan, behavioral checks, explanation, and reflection requirements.
- Review links to the first missing plan, checks, or explanation. Completion always requires passed checks. Plan and explanation are required on reasoned reps and optional on sentence-scale and focused reps; difficulty and confidence are always optional, and empty sections are hidden in the Journal. Written work remains self-reviewed, and none of these fields establishes independence or retention (those come from hints, checks, and recall timing). The review step also offers optional, self-reported mistake tags from a fixed list; they never block completion and are locked once the rep is complete.
- Completion records the attempt, explains hint use, shows applicable recall timing, and offers the next recommendation and skill evidence.

## Progress

- Skills leads with reviews ready, counts of skills with independent and retained evidence, and compact track completion rows. Journey summaries show the next stage or recall date; expanding a journey exposes its supporting attempts. Independent counts include retained skills and do not constitute an overall coding score. Your trail owns the next-practice recommendation.
- Practice backup controls in Progress open on demand. They retain the existing merge behavior and differ from full-profile export/import in Profiles. Timed interview setup selects a focus and duration before starting a round.
- Skill map (`#/skillmap`, `src/SkillMapPage.tsx`) reuses the trail stage and node styling to draw each skill of a chosen track (the goal by default). `src/skill-map.ts` derives one state per skill from the existing journey evidence only: Retained (fresh recall solved without hints after the break), Review due (independent work recorded and the recall break has passed), Independent (a hint-free related rep after the guided rep), Practiced (guided rep completed, with or without hints), otherwise Not started. Every node pairs a `StatusChip` with text and a distinct marker, and links to the guided, independent, or recall rep as appropriate; waiting and retained skills show a date or note instead. A legend and an `InfoNote` state that the labels describe recorded practice evidence, not mastery.

## Retired practice sessions

The separate practice session (Record a session, Reflect and end session, Unfinished sessions, Practice history) is no longer in the interface; a completed attempt is the record of practice. Existing `sessions:v1` data is kept: it is still validated and imported from backups and profile exports, and it never contributed to streaks, completion, independence, retention, or recall scheduling. The `#/sessions` route redirects to the Journal. [Maintaining](./MAINTAINING.md#retired-practice-session-records) describes the contract.

## Reference and preview

- Glossary opens a searchable drawer without leaving the exercise.
- Frontend previews support fit-to-panel, phone (375px), tablet (768px), and desktop (1280px) widths. Larger previews scroll horizontally when needed, within their own bounded area.
- Expanded preview uses a modal with the same running frame and size controls. Expanding or closing the modal preserves preview interactions; Update preview deliberately restarts it with the latest code; changing the request scenario also refreshes an existing preview.

## Keyboard

- Ctrl/Command K opens the searchable command palette. Up/Down selects an action; Enter opens it; Escape closes the palette or glossary. The palette includes page navigation, exercises, glossary, editor focus, focus mode, results, and explanation.
- Ctrl/Command Enter runs checks in the workspace, including the editor.
- Practice steps use direct buttons with hover feedback and no tooltips. The full profile name appears on hover or focus; Escape dismisses that tooltip while keeping focus on its trigger.
- Dropdowns keep focus on their trigger. Arrow keys explore options, Home/End reach the first/last option, and typing searches option labels. Enter or Tab applies the highlighted option; Escape closes without changing it. Menus use the browser's popover top layer to avoid clipping inside panes and dialogs; this requires a browser supporting the Popover API.
- The calendar opens with focus on the selected date or today. Arrow keys move by day/week, Home/End reach the week's boundaries, and Page Up/Down changes month while preserving the day where possible. Shift with Page Up/Down changes year. Enter selects a date; Escape cancels and returns focus. Clear date removes the filter. Values remain local `YYYY-MM-DD` dates.
- File selection opens the operating system's file chooser.
- Focus outlines, native modal focus containment, and reserved feedback space support continuity. Reduced-motion preferences disable UI animation and smooth scrolling; see [Motion](./DESIGN_SYSTEM.md#motion) for what moves and its fallbacks.

## Ownership

Your trail, All tracks, and the exercise library render in `HomePage.tsx`, `PathsPage.tsx`, and `PracticeCatalog.tsx`. `App.tsx` retains their session preferences, navigation, draft persistence, practice recommendations, and runner lifecycle. Presentation extraction does not introduce a second source of learner state.

See [the accessibility walkthrough](./ACCESSIBILITY_REVIEW.md) for manual screen-reader, zoom, contrast, and learner checks that automated keyboard and narrow-layout tests cannot establish. See [performance budgets](./PERFORMANCE.md) for local editor-loading measurements and verification limits.
