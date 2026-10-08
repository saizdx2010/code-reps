# Practice UI

## Navigation and visual structure

- Main navigation has Home, Practice, Learn, and Progress. The second row contains only the pages in the selected area: Today and Practice plan; Exercises, Projects, and Interview; Lessons, Paths, and Notebook; or Skills, History, and Self-assessment.
- Each tool has a bookmarkable hash route, including `#/plan`, `#/projects`, `#/interview`, `#/notebook`, and `#/assessment`. Existing `#/knowledge`, `#/learn`, and exercise bookmarks remain valid. Learn opens full lessons; `#/learn` continues to open quick introductions.
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
- Paths has an always-visible Choose path dropdown before the selected path and its next action. The menu supports keyboard selection and remembers the chosen path in the current session. Explore paths shows a grid with completed-rep counts; it starts collapsed on narrow screens and remembers expansion in the current session. Selecting a path on a narrow screen closes the chooser and focuses the selected path heading.
- Practice filters exercises by skill, format, and draft status or review due. Filters start expanded on desktop and collapsed on narrow screens; expansion is a session preference. Clear filters restores the full library. Search stays visible.
- History filters completed attempts by rep or skill search, skill, difficulty, and local calendar date.
- Exercise URLs use `#/practice/<rep-id>`. Pages and exercises support bookmarks, refresh, and browser Back/Forward.
- Returning to a screen restores its scroll position and open sections. Filters, the selected path, and the mobile workspace tab survive refresh in the same browser session.
- Editor cursor, selection, and scroll position are remembered per exercise. Learner drafts remain in the existing local store; session-only UI preferences do not enter backups.

## Browse learning content

- Lessons have focused Read, Predict, Practise, and Review views. Review opens the evidence and self-assessment disclosure. Moving between views keeps predictions and written evidence mounted; the selected view survives refresh per lesson and profile. Predictions remain distinct from independent coding evidence.
- Learn opens full lessons. Its index groups lessons by topic, with search, a topic filter, and bookmarks. Search opens matching groups; Clear knowledge filters restores all topics. Filters survive refresh in the same profile and browser session. On narrow screens, Browse lessons starts collapsed and selecting a lesson closes the index and focuses the reader.
- Quick lessons inside the lesson index opens short introductions. The existing `#/learn` bookmark still works.
- Home previews up to three saved drafts and three due reviews. Show all exposes the complete queue without changing drafts, priorities, or review dates; Show fewer restores the compact view. Expansion is a session preference.

## Arrange the workspace

- Drag the divider between brief and editor. Focus the divider and use Left/Right to resize, Home/End for the limits, or double-click to restore the default split. The split preference is saved locally.
- Focus mode expands the coding workspace. Use Exit focus in Tools or press Escape to return; selecting a writing or understanding step also exits focus mode.
- Understand, Plan, Solve, Explain, and Review navigate the practice loop without enforcing a sequence. The brief is available during Understand and Solve; Plan, Explain, and Review each show their own writing or reflection view. On desktop the steps form a slim vertical rail at the left edge of the brief pane, and the editor remains mounted beside the selected step; narrow screens keep a horizontal step bar above the selected pane. Step status descriptions report written work and behavioral checks, not an assessment of understanding or writing quality. The selected step is a session preference.
- The toolbar below the editor keeps Run/Stop and result counts within reach. Checks open as a drawer inside the coding desk, directly above that toolbar: it starts as a slim bar, expands on running or selecting Results, takes at most about half of the desk (less beside a frontend preview) and scrolls internally while the editor shrinks, and can be collapsed without discarding feedback. Passing checks offers a direct action to explain the solution.
- On narrow screens, Solve shows the coding pane with checks under the editor; the other steps show only their selected task or writing view. Both panes remain mounted, preserving drafts, file selection, cursor, selection, preview interactions, and editor scroll position.
- One compact header row carries the Practice back link, exercise title, status chip, save status, Start practice, Glossary, and Tools. Tools contains focus mode, Reset rep, and related concepts. Escape closes Tools and returns focus to its summary.
- The editor begins loading when an exercise row is hovered or focused. Editor recovery remains available if loading fails.

## Checks and completion

- The first failed check expands to show the failing input, expected and actual values where available, and actionable feedback. Selecting another failed check opens that case and closes the previous one. Passed checks remain visible as rows with right-aligned outcomes in the checks drawer.
- The completion checklist separately shows plan, behavioral checks, explanation, and reflection requirements.
- Review links to the first missing plan, checks, or explanation. Completion still requires the existing plan, passed checks, explanation, difficulty, and confidence fields; written work remains self-reviewed.
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

## Goal paths and curriculum connections

Home links to the current ordered goal path. Browsing another path does not change the goal; choose **Use this as my learning goal** to save that preference for the current profile. The existing TypeScript goal is the starting suggestion.

Paths identify guided, independent, and recall reps from the authored skill journeys, show recall availability and evidence, and connect relevant frontend, backend, and real-world paths to project integration milestones. Path completion includes hinted attempts and remains separate from independence and retention. Early recall can be opened freely, but existing timing and hint rules still govern retention evidence.

Due recall remains first in recommendations. Drafts within the goal path take priority over new path work; other drafts remain visible for explicit resume. Existing difficult-review scheduling remains available. Completed attempts show the reason for the recommended next action. Daily session start/end and separate practice records are described below.

## Daily practice sessions

Choose **Start practice** from Home or the workspace to create a session around one rep. Opening a rep normally remains available and creates no session. While active, the session asks what you learned or where you got stuck; text saves as you type. You may intentionally reuse your solution explanation. **End session** requires nonblank reflection and may be used before the rep is complete. **Save and leave** preserves work without marking the session ended. Completing a rep and ending a session are separate actions.

Progress → Practice history separates ended sessions from unfinished sessions. Resuming starts a new session using current saved work; the earlier record stays unfinished. You can edit reflection or explicitly remove a session after confirmation without deleting drafts or completed attempts. Draft links open current work; stable completed-attempt links display a snapshot without replacing your draft. Missing work is identified explicitly.

Reload and profile changes preserve records but do not automatically resume a session. A session spanning midnight stays one session. These records do not contribute to completed-rep streaks, path completion, independence, retention, or recall scheduling.

Session recovery distinguishes browser saves awaiting the local service from failed local saves. For conflicting changes in another tab, reload session records, review preserved unsaved reflection, and retry saving. Recovery backups include the locally held reflection. Session writes require browser Web Locks; regular practice remains available if that capability is absent.

Practice sessions are a compact control in the workspace header rather than a separate row. Start practice explicitly records a session; while active the header shows a small session chip and Reflect and end session, which reveals the saved reflection draft and ending controls in a row below the header. Collapsing the reflection preserves the draft. The editor action bar sits below code, and checks open as a drawer inside the dark coding desk above it. A new learner starts with a 40/60 reading/code split; saved divider choices are preserved.

Desktop practice uses a fixed split workspace: the task pane and editor scroll independently, while the step rail, save status, and Run checks stay visible. Checks expand into a bounded drawer in the coding desk with its own scrolling feedback. The divider remains resizable. Frontend previews scroll within their own bounded area and can still expand into a dialog. Session reflection stays accessible in a bounded row under the header. Narrow screens retain the existing pane navigation.

Library and learning tools use the shared compact `PageHeader`, with secondary evidence guidance in native `InfoNote` disclosures. Exercises group by authored category; groups begin collapsed, remember expansion in the profile’s browser session, and open matching results during search or filtering. Search remains visible and skill, format, and status filters share one compact disclosure. Self-assessment groups skills by knowledge topic while retaining each skill’s supporting evidence and the optional assessment flow. Lessons keep their compact search, topic, and bookmark controls beside the Read, Predict, Practise, and Review views. Project summaries disclose milestones and final self-review. Progress uses one statistics row, thin path-completion bars, and expandable skill journeys with guided, independent, and recall markers; Home owns the next-practice recommendation. Backup and profile actions remain available. Pending pages use the same header and reserve the corresponding compact working surfaces.
