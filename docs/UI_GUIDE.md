# Practice UI

## Find and resume work

- Practice filters exercises by skill, format, and draft status or review due. Clear filters restores the full library.
- History filters completed attempts by rep or skill search, skill, difficulty, and local calendar date.
- Exercise URLs use `#/practice/<rep-id>`. Pages and exercises support bookmarks, refresh, and browser Back/Forward.
- Returning to a screen restores its scroll position and open sections. Filters, the selected path, and the mobile workspace tab survive refresh in the same browser session.
- Editor cursor, selection, and scroll position are remembered per exercise. Learner drafts remain in the existing local store; session-only UI preferences do not enter backups.

## Browse learning content

- Knowledge is the main entry for full lessons, predictions, self-assessment, planning, and notes. Its index groups lessons by topic, with search, a topic filter, and bookmarks. Search opens matching groups; Clear knowledge filters restores all topics. Filters survive refresh in the same profile and browser session.
- Quick lessons inside Knowledge opens short introductions. The existing `#/learn` bookmark still works; it no longer needs a separate main-navigation item.
- Home previews up to three saved drafts and three due reviews. Show all exposes the complete queue without changing drafts, priorities, or review dates; Show fewer restores the compact view. Expansion is a session preference.

## Arrange the workspace

- Drag the divider between brief and editor. Focus the divider and use Left/Right to resize, Home/End for the limits, or double-click to restore the default split. The split preference is saved locally.
- Focus mode expands the coding workspace. Exit focus or press Escape to return; Brief & hints also restores the brief.
- A sticky workspace toolbar keeps Run/Stop, result counts, and section navigation within reach.
- On narrow screens, Task & plan and Code & results switch panes. Workspace navigation switches to and focuses the requested section.
- The editor begins loading when an exercise row is hovered or focused. Editor recovery remains available if loading fails.

## Checks and completion

- Failed checks expand to show the failing input, expected and actual values where available, and actionable feedback. Passed checks stay in a collapsed group.
- The completion checklist separately shows plan, behavioral checks, explanation, and reflection requirements.
- Completion records the attempt, explains hint use, shows applicable recall timing, and offers the next recommendation and skill evidence.
- History compares earlier and current code, plans, explanations, and hint counts. Written work remains self-reviewed.

## Reference and preview

- Glossary opens a searchable drawer without leaving the exercise.
- Frontend previews support fit-to-panel, phone (375px), tablet (768px), and desktop (1280px) widths. Larger previews scroll horizontally when needed.
- Expanded preview uses a modal with the same state and size controls. Update preview refreshes the code; changing the request scenario refreshes an existing preview.

## Keyboard and motion

- Ctrl/Command K opens the searchable command palette. Up/Down selects an action; Enter opens it; Escape closes the palette or glossary.
- Ctrl/Command Enter runs checks in the workspace, including the editor.
- The command palette includes page navigation, exercises, glossary, editor focus, focus mode, results, and explanation.
- Focus outlines, native modal focus containment, reserved feedback space, and short transitions support continuity. Reduced-motion preferences disable UI animation and smooth scrolling.
