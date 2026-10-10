# Practice UI

## Voice and terms

Use US English: **practice** is both a noun and a verb. Write directly to the learner in plain English.

- **Track:** a curriculum, such as Foundations or Frontend.
- **Goal:** the track the learner chose to follow.
- **Trail:** the visual path of stages on the Trail page.
- **Stage:** a group of related reps within a track.
- **Rep:** one coding exercise and its understand, plan, solve, explain, and review loop.
- **Lesson:** an explanation with examples and knowledge checks.

A completed stage replaces its description with a short recap of the work practiced. It does not establish independent fluency or retention. The editor header follows the active project file.

## Navigation and visual structure

- Main navigation has Trail, Library, and Progress. The second row contains only the pages in the selected area: Your trail and All tracks; Exercises, Lessons, and Projects; or Skills and Journal. Skills switches between Journeys and Skill map (`#/progress`, `#/skillmap`). Journal switches between Attempts (`#/history`), Notebook (`#/notebook`), and Mistakes (`#/mistakes`) with a segmented control; each keeps its own bookmarkable route, and the retired `#/sessions` redirects to `#/history`. Timed interview practice (`#/interview`) is an optional link at the end of Projects. The weekly plan (`#/plan`) and self-assessment (`#/assessment`) are quiet links near the end of Skills. Their saved data is unchanged, and every old route still opens a page.
- Each tool has a bookmarkable hash route, including `#/plan`, `#/skillmap`, `#/mistakes`, `#/projects`, `#/interview`, `#/notebook`, and `#/assessment`. Existing `#/knowledge`, `#/learn`, and exercise bookmarks remain valid. Lessons opens full lessons; `#/learn` continues to open quick introductions.
- During practice, Navigate opens the main destinations in a compact menu. Escape closes it and restores focus to its summary. Profile management remains beside the profile name. Search opens the command palette; its keyboard shortcut is also available in the narrow workspace.
- Reading surfaces use a light sage background, white practice sheets, green text, and dark green actions with lime labels. Home highlights the recommended rep on a pale lime surface. The coding desk retains the logo's dark green with lime actions. The compact Home practice loop is explanatory, not a progress indicator. Source Sans 3 is bundled in `public/fonts/` under the included SIL Open Font License; Maple Mono remains the code face. Fonts do not require a runtime external request.
- The [Code Reps visual system](./DESIGN_SYSTEM.md) defines our shared palette, controls, hierarchy, and motion. Practice and lesson navigation use a moving active indicator. Buttons respond on hover and press, menus and dialogs reveal, and native disclosures expand; reduced-motion preferences keep all controls usable without movement. These effects do not remount writing fields or editors, delay real check feedback, or change save acknowledgements.
- `src/design.css` owns navigation, shared controls, pages, workspace, and utilities. `src/fluency.css` owns learning layouts; `src/input.css` owns fields; `src/motion.css` owns shared motion. `src/index.css` owns semantic tokens. The earlier overlapping App, practice, system, and experience stylesheets have been replaced.
- Shared controls are app-owned: `Input.tsx` provides styled text fields, choices, search clearing, file selection, and number buttons; `Select.tsx` renders dropdown menus; `DateInput.tsx` renders the history calendar; `Tooltip.tsx` renders hover/focus descriptions. Menu indicators, dialogs, and command search also use our own presentation. Monaco remains the code editor, with its menus and suggestions themed to the same palette. File selection opens the operating system's file chooser.
- Lesson and exercise rows use flat hover feedback; starting-point and path-choice cards use softer depth; path completion rows stay flat. Disclosure headings acknowledge hover and native content transitions cover both opening and closing. Focus rings remain thin and visible. Page-specific pending layouts in `LoadingStates.tsx` retain each tool's heading and working surface, and startup progress loading uses the light workbook and original logo.
- Loading status occupies existing page padding, so it does not push the loaded content down. Lesson loading reserves the mobile browse strip; notebook loading follows an existing draft or entry-list state. Editor and preview placeholders retain their local working surfaces. Skeletons stay still while a small status dot responds to real pending work, including profile operations and saves; reduced motion disables the pulse.

## Find and resume work

- Home puts the starting-point choice before the first recommendation. After choosing, Change starting point keeps it available without interrupting the daily practice queue.
- The header shows the active local profile and opens profile management. Switching is immediately available; creation/renaming and full-profile export/import open separately. Save feedback remains visible in the page navigation or workspace controls.
- Home names the active learning goal and links to its chooser. The primary rep names its task and the next learning step. One compact secondary list offers at most one saved draft and one due review, with links to find the rest in Progress or the Library. Opening a choice preserves the existing resume or fresh-review behavior. The starting-point choice (New or Returning to coding) is on All tracks.
- Home (`#/home`) is the learner's trail: the chosen track drawn as stages of connected nodes, with the next practice and a compact draft and due-review list beside it (above it on narrow screens). Each lesson appears once, immediately before the first rep that uses it; reps show done, next, in progress, or recall-later states, and project milestones end the trail.
- All tracks (`#/paths`) has an always-visible Choose track dropdown before the selected track and its next action. The menu supports keyboard selection and remembers the chosen track in the current session. Explore tracks shows Foundations first, then the three tracks (Problem solving, Frontend, Backend), with completed-rep counts; it starts open on desktop, collapsed on narrow screens, and remembers expansion in the current session. Stages made only of Foundations reps are marked as covered by Foundations and link back to it. Selecting a track on a narrow screen closes the chooser and focuses the selected track heading.
- Practice filters exercises by skill, format, and draft status or review due. Filters start expanded on desktop and collapsed on narrow screens; expansion is a session preference. Clear filters restores the full library. Search stays visible.
- History filters completed attempts by rep or skill search, skill, difficulty, and local calendar date.
- Exercise URLs use `#/practice/<rep-id>`. Pages and exercises support bookmarks, refresh, and browser Back/Forward.
- Returning to a screen restores its scroll position and open sections. Filters, the selected path, and the mobile workspace tab survive refresh in the same browser session.
- Editor cursor, selection, and scroll position are remembered per exercise. Learner drafts remain in the existing local store; session-only UI preferences do not enter backups.

## Browse learning content

- Lessons have focused Read, Predict, Practice, and Review views. Review opens the evidence and self-assessment disclosure. Moving between views keeps predictions and written evidence mounted; the selected view survives refresh per lesson and profile. Predictions remain distinct from independent coding evidence.
- Lessons opens full lessons. Its index groups lessons by topic, with search, a topic filter, and bookmarks. Search opens matching groups; Clear knowledge filters restores all topics. Filters survive refresh in the same profile and browser session. On narrow screens, Browse lessons starts collapsed and selecting a lesson closes the index and focuses the reader.
- Quick lessons inside the lesson index opens short introductions. The existing `#/learn` bookmark still works.
- Home previews up to three saved drafts and three due reviews. Show all exposes the complete queue without changing drafts, priorities, or review dates; Show fewer restores the compact view. Expansion is a session preference.

## First rep walkthrough

Trail offers **Try first rep walkthrough** around the real Declare a value rep. After starting it, **Replay walkthrough** stays available under **How a rep works**, keeping the daily choices prominent. Inline help follows Understand, Plan, Solve, Explain, and Review; normal step navigation remains available. The guide introduces saved writing, behavioral checks, optional recorded hints, and the existing completion checklist without inserting a solution, completing an attempt, or granting mastery. Skip or Finish dismisses the help; replay opens the existing draft without resetting it.

Walkthrough visibility is a profile-scoped session UI preference through `useSessionPreference`, survives refresh in that browser session, and stays out of learner backups. The guide appears only on its rep and resumes on return until dismissed; Back/Forward and reload use the existing routes and draft owners. The editor remains mounted while changing steps. Focused Chromium flows cover skip/replay (including completed attempts), dismissal focus, real checks and completion, profile separation, guide-load failure, and short/narrow-screen draft preservation. Desktop and phone Solve layouts were also inspected in Chromium on macOS; this does not establish all-screen visual fidelity, browser zoom, other platforms, disconnected operation, or assistive-technology support.

## Arrange the workspace

- Drag the divider between brief and editor. Focus the divider and use Left/Right to resize, Home/End for the limits, or double-click to restore the default split. The split preference is saved locally.
- Focus mode expands the coding workspace. Use Exit focus in Tools or press Escape to return; selecting a writing or understanding step also exits focus mode.
- The brief opens with a collapsed **Effort and prerequisites** note (`src/RepGuidance.tsx`, derived in `src/rep-guidance.ts`): a rough first-attempt effort range by authored level, linked lessons and their prerequisites, and unfinished earlier reps in the same stage. When a rep is two or more levels above anything completed, a readiness checkpoint offers an optional bridge rep and lesson. Estimates are guidance only, never change with learner speed, and nothing is locked.
- Understand, Plan, Solve, Explain, and Review navigate the practice loop without enforcing a sequence. The brief is available during Understand and Solve; Plan, Explain, and Review each show their own writing or reflection view. On desktop the steps form a slim vertical rail at the left edge of the brief pane, and the editor remains mounted beside the selected step; narrow screens keep a horizontal step bar above the selected pane. Step status descriptions report written work and behavioral checks, not an assessment of understanding or writing quality. The selected step is a session preference.
- The toolbar below the editor keeps Run/Stop and result counts within reach. Checks open as a drawer inside the coding desk, directly above that toolbar: it starts as a slim bar, expands on running or selecting Results, takes at most about half of the desk (less beside a frontend preview) and scrolls internally while the editor shrinks, and can be collapsed without discarding feedback. Passing checks offers a direct action to explain the solution.
- On narrow screens, Solve shows the coding pane with checks under the editor; the other steps show only their selected task or writing view. Both panes remain mounted, preserving drafts, file selection, cursor, selection, preview interactions, and editor scroll position.
- One compact header row carries the Practice back link, exercise title, status chip, save status, Glossary, and Tools. Tools contains focus mode, Reset rep, and related concepts. Escape closes Tools and returns focus to its summary.
- The editor begins loading when an exercise row is hovered or focused. Editor recovery remains available if loading fails.

## Checks and completion

- The first failed check expands to show the failing input, expected and actual values where available, and actionable feedback. Selecting another failed check opens that case and closes the previous one. Passed checks remain visible as rows with right-aligned outcomes in the checks drawer.
- The completion checklist separately shows plan, behavioral checks, explanation, and reflection requirements.
- Review links to the first missing plan, checks, or explanation. Completion always requires passed checks. Plan and explanation are required on reasoned reps and optional on sentence-scale and focused reps; difficulty and confidence are always optional, and empty sections are hidden in the Journal. Written work remains self-reviewed, and none of these fields establishes independence or retention (those come from hints, checks, and recall timing). The review step also offers optional, self-reported mistake tags from a fixed list; they never block completion and are locked once the rep is complete.
- Completion records the attempt, explains hint use, shows applicable recall timing, and offers the next recommendation and skill evidence.
- History compares earlier and current code, plans, explanations, and hint counts. Written work remains self-reviewed.
- Progress leads with reviews ready, counts of skills with independent and retained evidence, and compact path completion rows. Journey summaries show the next stage or recall date; expanding a journey exposes its supporting attempts. Independent counts include retained skills and do not constitute an overall coding score.
- Practice backup controls in Progress open on demand. They retain the existing merge behavior and differ from full-profile export/import in Profiles. Timed interview setup selects a focus and duration before starting a round; project summaries open their milestones and final self-review.

## Reference and preview

- Glossary opens a searchable drawer without leaving the exercise.
- Frontend previews support fit-to-panel, phone (375px), tablet (768px), and desktop (1280px) widths. Larger previews scroll horizontally when needed.
- Expanded preview uses a modal with the same running frame and size controls. Expanding or closing the modal preserves preview interactions; Update preview deliberately restarts it with the latest code; changing the request scenario also refreshes an existing preview.

## Keyboard and motion

- Ctrl/Command K opens the searchable command palette. Up/Down selects an action; Enter opens it; Escape closes the palette or glossary.
- Ctrl/Command Enter runs checks in the workspace, including the editor.
- Practice steps use direct buttons with hover feedback and no tooltips. The full profile name appears on hover or focus; Escape dismisses that tooltip while keeping focus on its trigger.
- Dropdowns keep focus on their trigger. Arrow keys explore options, Home/End reach the first/last option, and typing searches option labels. Enter or Tab applies the highlighted option; Escape closes without changing it. Menus use the browser's popover top layer to avoid clipping inside panes and dialogs; this requires a browser supporting the Popover API.
- The calendar opens with focus on the selected date or today. Arrow keys move by day/week, Home/End reach the week's boundaries, and Page Up/Down changes month while preserving the day where possible. Shift with Page Up/Down changes year. Enter selects a date; Escape cancels and returns focus. Clear date removes the filter. Values remain local `YYYY-MM-DD` dates.
- The command palette includes page navigation, exercises, glossary, editor focus, focus mode, results, and explanation.
- Selecting a knowledge lesson scrolls to its content and moves keyboard focus there.
- Narrow screens keep save feedback visible on every page. Main navigation fits in four destinations; section navigation can scroll when needed. Search keeps a visible text label on browsing pages, and Ctrl/Command K remains available in practice.
- Profile switching, creation, import, export, and deletion show an operation message while work is pending.
- Focus outlines, native modal focus containment, reserved feedback space, and short transitions support continuity. Reduced-motion preferences disable UI animation and smooth scrolling.

Home, path discovery, and the practice library render in `HomePage.tsx`, `PathsPage.tsx`, and `PracticeCatalog.tsx`. `App.tsx` retains their session preferences, navigation, draft persistence, practice recommendations, and runner lifecycle. Presentation extraction does not introduce a second source of learner state.

See [the accessibility walkthrough](./ACCESSIBILITY_REVIEW.md) for manual screen-reader, zoom, contrast, and learner checks that automated keyboard and narrow-layout tests cannot establish. See [performance budgets](./PERFORMANCE.md) for local editor-loading measurements and verification limits.

## Goals and curriculum connections

Home draws the chosen track as a trail. Browsing another track does not change the goal; choose **Use this as my learning goal** to save that preference for the current profile. Foundations is the starting suggestion.

Tracks identify guided, independent, and recall reps from the authored skill journeys, show recall availability and evidence, and connect the Frontend and Backend tracks to project integration milestones. Track completion includes hinted attempts and remains separate from independence and retention. Early recall can be opened freely, but existing timing and hint rules still govern retention evidence.

Due recall remains first in recommendations. Drafts within the chosen track take priority over new reps in that track; other drafts remain visible for explicit resume. Existing difficult-review scheduling remains available. Completed attempts show the reason for the recommended next action. Practice sessions were retired; see below.

## Retired practice sessions

The separate practice session (Record a session, Reflect and end session, Unfinished sessions, Practice history) is no longer in the interface; a completed attempt is the record of practice. Existing `sessions:v1` data is kept: it is still validated and imported from backups and profile exports, and it never contributed to streaks, completion, independence, retention, or recall scheduling. The `#/sessions` route redirects to the Journal.

The editor action bar sits below code, and checks open as a drawer inside the dark coding desk above it. A new learner starts with a 40/60 reading/code split; saved divider choices are preserved.

Desktop practice uses a fixed split workspace: the task pane and editor scroll independently, while the step rail, save status, and Run checks stay visible. Checks expand into a bounded drawer in the coding desk with its own scrolling feedback. The divider remains resizable. Frontend previews scroll within their own bounded area and can still expand into a dialog. Session reflection stays accessible in a bounded row under the header. Narrow screens retain the existing pane navigation.

Library and learning tools use the shared compact `PageHeader`, with secondary evidence guidance in native `InfoNote` disclosures. Exercises group by primary topic; groups begin collapsed, remember expansion in the profile’s browser session, and open matching results during search or filtering. Search remains visible and topic, rep type, and progress filters share one compact disclosure. Self-assessment groups skills by knowledge topic while retaining each skill’s supporting evidence and the optional assessment flow. Lessons keep their compact search, topic, and bookmark controls beside the Read, Predict, Practice, and Review views. Project summaries disclose milestones and final self-review. Progress uses one statistics row, thin track-completion bars, and expandable skill journeys with guided, independent, and recall markers; Home owns the next-practice recommendation. Backup and profile actions remain available. Pending pages use the same header and reserve the corresponding compact working surfaces.

### Interface wording

Use short, friendly wording addressed to the learner. Use “practice” as both a verb and a noun. Progress and Journal share readable local dates and
singular/plural labels. A zero Progress stat explains which practice unlocks it.
Library topics are presentation labels shared by filtering and grouping; authored
categories, rep IDs, and checked answers stay unchanged.

Briefs and lesson prose render paired backticks as inline code using the shared
`InlineCode` component. All text stays escaped by React. Keep each rep's assessment
limits in one “How this is checked” `InfoNote`: checks show tested behavior, while
the learner reviews writing and variations. Task limits stay visible in the brief;
only assessment sentences move into the disclosure. The checks drawer reports results.

### Skill map

Progress → Skills → Skill map (`#/skillmap`, `src/SkillMapPage.tsx`) reuses the Trail stage and node styling to draw each skill of a chosen track (the goal by default). `src/skill-map.ts` derives one state per skill from the existing journey evidence only: Retained (fresh recall solved without hints after the break), Review due (independent work recorded and the recall break has passed), Independent (a hint-free related rep after the guided rep), Practiced (guided rep completed, with or without hints), otherwise Not started. Every node pairs a `StatusChip` with text and a distinct marker, and links to the guided, independent, or recall rep as appropriate; waiting and retained skills show a date or note instead. A legend and an `InfoNote` state that the labels describe recorded practice evidence, not mastery. Markers use the trail marker hover/focus interaction with a reduced-motion fallback. Home offers a small "See your skill map" link among its trail links.
