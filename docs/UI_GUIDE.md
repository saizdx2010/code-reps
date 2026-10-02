# Practice UI

## Find and resume work

- Home puts the starting-point choice before the first recommendation. After choosing, Change starting point keeps it available without interrupting the daily practice queue.
- The header shows the active local profile and opens profile management. Save feedback remains visible in the header or the narrow-screen page/workspace controls.
- Paths leads with the selected path and its next action. Explore paths shows a grid with completed-rep counts; it starts collapsed on narrow screens and remembers expansion in the current session. Selecting a path on a narrow screen closes the chooser and focuses the selected path heading.
- Practice filters exercises by skill, format, and draft status or review due. Clear filters restores the full library.
- History filters completed attempts by rep or skill search, skill, difficulty, and local calendar date.
- Exercise URLs use `#/practice/<rep-id>`. Pages and exercises support bookmarks, refresh, and browser Back/Forward.
- Returning to a screen restores its scroll position and open sections. Filters, the selected path, and the mobile workspace tab survive refresh in the same browser session.
- Editor cursor, selection, and scroll position are remembered per exercise. Learner drafts remain in the existing local store; session-only UI preferences do not enter backups.

## Browse learning content

- Lessons have Read, Predict, Practise, and Review section navigation. Review opens the evidence and self-assessment disclosure. Moving between sections preserves predictions and written evidence; predictions remain distinct from independent coding evidence.
- Knowledge is the main entry for full lessons, predictions, self-assessment, planning, and notes. Its index groups lessons by topic, with search, a topic filter, and bookmarks. Search opens matching groups; Clear knowledge filters restores all topics. Filters survive refresh in the same profile and browser session.
- Quick lessons inside Knowledge opens short introductions. The existing `#/learn` bookmark still works; it no longer needs a separate main-navigation item.
- Home previews up to three saved drafts and three due reviews. Show all exposes the complete queue without changing drafts, priorities, or review dates; Show fewer restores the compact view. Expansion is a session preference.

## Arrange the workspace

- Drag the divider between brief and editor. Focus the divider and use Left/Right to resize, Home/End for the limits, or double-click to restore the default split. The split preference is saved locally.
- Focus mode expands the coding workspace. Use Exit focus in Tools or press Escape to return; Understand and Plan also restore the brief.
- Understand, Plan, Solve, Explain, and Review navigate the practice loop without enforcing a sequence. Status labels show written work and behavioral checks, not an assessment of understanding or writing quality. The selected step is a session preference.
- A sticky workspace toolbar keeps Run/Stop and result counts within reach. Results links appear after checking, and passing checks offers a direct action to explain the solution.
- On narrow screens, the practice steps switch to the appropriate task or code pane and focus the requested section. Both panes retain their drafts and editor state.
- Glossary stays beside the exercise title; Tools contains focus mode, Reset rep, and related concepts. Escape closes Tools and returns focus to its summary.
- The editor begins loading when an exercise row is hovered or focused. Editor recovery remains available if loading fails.

## Checks and completion

- The first failed check expands to show the failing input, expected and actual values where available, and actionable feedback. Selecting another failed check opens that case and closes the previous one. Passed checks stay in a collapsed group.
- The completion checklist separately shows plan, behavioral checks, explanation, and reflection requirements.
- Review links to the first missing plan, checks, or explanation. Completion still requires the existing plan, passed checks, explanation, difficulty, and confidence fields; written work remains self-reviewed.
- Completion records the attempt, explains hint use, shows applicable recall timing, and offers the next recommendation and skill evidence.
- History compares earlier and current code, plans, explanations, and hint counts. Written work remains self-reviewed.
- Progress leads with reviews ready, counts of skills with independent and retained evidence, and the existing next-practice recommendation. Journey summaries show the next stage or recall date; expanding a journey exposes its supporting attempts. Independent counts include retained skills and do not constitute an overall coding score.

## Reference and preview

- Glossary opens a searchable drawer without leaving the exercise.
- Frontend previews support fit-to-panel, phone (375px), tablet (768px), and desktop (1280px) widths. Larger previews scroll horizontally when needed.
- Expanded preview uses a modal with the same running frame and size controls. Expanding or closing the modal preserves preview interactions; Update preview deliberately restarts it with the latest code; changing the request scenario also refreshes an existing preview.

## Keyboard and motion

- Ctrl/Command K opens the searchable command palette. Up/Down selects an action; Enter opens it; Escape closes the palette or glossary.
- Ctrl/Command Enter runs checks in the workspace, including the editor.
- The command palette includes page navigation, exercises, glossary, editor focus, focus mode, results, and explanation.
- Selecting a knowledge lesson scrolls to its content and moves keyboard focus there.
- Narrow screens keep save feedback visible on every page; the navigation scrollbar reveals additional pages and Commands retains its text label.
- Profile switching, creation, import, export, and deletion show an operation message while work is pending.
- Focus outlines, native modal focus containment, reserved feedback space, and short transitions support continuity. Reduced-motion preferences disable UI animation and smooth scrolling.

Home, path discovery, and the practice library render in `HomePage.tsx`, `PathsPage.tsx`, and `PracticeCatalog.tsx`. `App.tsx` retains their session preferences, navigation, draft persistence, practice recommendations, and runner lifecycle. Presentation extraction does not introduce a second source of learner state.

See [the accessibility walkthrough](./ACCESSIBILITY_REVIEW.md) for manual screen-reader, zoom, contrast, and learner checks that automated keyboard and narrow-layout tests cannot establish. See [performance budgets](./PERFORMANCE.md) for local editor-loading measurements and verification limits.
