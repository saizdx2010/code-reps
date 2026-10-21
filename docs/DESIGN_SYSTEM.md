# Code Reps design language

Code Reps uses bright practice sheets and a green coding desk. The original logo supplies the charcoal green, sage, and lime colors. Source Sans 3 carries interface and reading text; Maple Mono carries code. Both are local assets: Source Sans 3 is bundled in `public/fonts/` under its included SIL Open Font License, so fonts need no runtime external request. This system belongs to the app and uses app-owned React components, native HTML semantics, and CSS; it adds no UI library or hosted service.

## Character

The interface should feel like a welcoming workbook: playful when a learner interacts, calm while they read, write, or code. Its identity comes from the original logo, the contrast between light practice sheets and the dark coding desk, and the same frame, type scale, and control geometry repeated across every page.

Three ideas organize the redesign:

- **A visible route.** Learners always see where they are on a trail and what comes next. Structure is drawn (stages, connected nodes, states), not explained in paragraphs.
- **Work first.** Chrome stays compact so the brief, the editor, and the learner's writing own the screen.
- **Quiet evidence.** Evidence rules stay accurate and available, but live in `InfoNote` disclosures and visual state rather than repeated body text.

Use lime to draw attention to the next useful action, warm yellow for hints, and motion to acknowledge interaction. Keep decoration purposeful. Avoid unrelated gradients, ornamental badges, competing card styles, or constant animation. Every new page should look and behave as part of the same app.

## Information architecture

Main navigation has three areas. Each area's section tabs list only its own pages.

| Area | Sections | Purpose |
| --- | --- | --- |
| Trail | Your trail (`#/home`), All tracks (`#/paths`) | Where you are and what to do next |
| Library | Exercises (`#/practice`), Lessons (`#/knowledge`), Projects (timed interview practice is an opt-in link inside Projects) | Everything, browsable by topic |
| Progress | Skills (`#/progress`, with a Journeys / Skill map switch), Journal | Evidence and records |

Journal is one section with an Attempts / Notebook / Mistakes switch (`JournalTabs`); each view keeps its own route (`#/history`, `#/notebook`, `#/mistakes`; the retired `#/sessions` redirects to `#/history`). The skill map (`#/skillmap`), weekly plan (`#/plan`), self-assessment (`#/assessment`), and timed interview (`#/interview`) are not tabs; their routes still work and `sectionView` highlights the page that links to them. Quick lessons (`#/learn`) belongs to Lessons. `ui-navigation.ts` owns sections and the `sectionView` aliases; do not add a fourth main area or a second navigation row inside a page. Old bookmarks must keep resolving.

Foundations (`typescript`) is the shared root track. The tracks that build on it (Problem solving, Pattern Recognition, Frontend, SQL, Backend, and DevOps) are grouped in `curriculum.ts` (`trackGroups`) and declare it implicitly. The All tracks picker draws them as a three-column grid of track cards (one column at 900px and below) in reading order; a card whose track builds on another adds "· Builds on SQL" (or Foundations, or Backend for DevOps) after its count, from `trackBuildsOn`. That line is guidance only: no card is locked, dimmed, or reordered by it; a stage made only of Foundations reps is shown as covered by Foundations rather than repeated, and Backend's stage of SQL reps is shown as covered by SQL with an Open SQL link. Path IDs, rep lists, badges, and recommendations are unchanged by this presentation.

## Page frame and layout

- Every page uses one frame: `main` is `max-width: var(--page-width)` (1224px) with `var(--page-gutter)` side padding (28px, 22px at ≤900px, 18px at ≤600px). The section tabs use the same frame, so the page title, section tabs, and content share one left edge. Do not set per-page `max-width` on `main`; narrow a reading block inside the page instead (for example, 65ch prose).
- Each page starts with `PageHeader`: an optional eyebrow, exactly one `h1`, one line of description, and optional actions on the right (search, a track chooser, `JournalTabs`). There are no hero headings.
- The practice workspace is the one exception: it uses the full window width with its own compact header row.
- Two-column pages (Trail) put the primary content on the left and the next action on the right; on narrow screens the next action comes first.

## Type scale

`src/index.css` owns the scale. Use the tokens instead of pixel sizes for headings.

| Token | Size | Use |
| --- | --- | --- |
| `--type-page` | 32px (26px narrow) | The page `h1` in `PageHeader` |
| `--type-reading` | 26px | A lesson's reading title |
| `--type-feature` | 22px | The recommended rep, the selected track, practice panel titles |
| `--type-section` | 20px | Section headings within a page |
| `--type-card` | 17px | Card, row-group, trail-stage, and journey titles |

The workspace title is a dense 22px (20px narrow). Body text is 15–16px; secondary text 13–14px. Text disclosures (Filters, Explore tracks, Set up your local project, Starting as) are 15px; disclosures that act as group headings use the card or section title; dense workspace disclosures are 14px, lesson-index group labels 13px, and `InfoNote` 13px.

## Tokens and colour

`src/index.css` owns semantic tokens. `src/design.css`, `src/fluency.css`, `src/input.css`, `src/layout.css`, and `src/trail.css` apply them; `src/motion.css` owns the shared interaction treatment.

| Role | Treatment |
| --- | --- |
| Reading background | `#F0F4ED` |
| Practice sheet, menu, dialog | White with a `#C4D1C1` border |
| Text / supporting text | `#293E33` / `#5A6D5F` |
| Reading action | `#303F38` with lime text |
| Coding action | Lime with dark green text |
| Hint / attention | Warm yellow with dark brown text |
| Selected or recommended | Sage `--accent-soft`, or pale lime `--feature` for the single next action |
| Earned badge | Success surface, border, and icon (`--success-soft`, `--success-border`, `--success`); never the next-action lime |
| Success / error | Separate semantic text, border, and surface tokens, paired with explicit copy |
| Controls / panels | 8px / 12px corners |
| Standard control height | 40px for fields, selects, and buttons; dense workspace header controls are 36px |

Text keeps at least 4.5:1 contrast in every scheme and mode. Supporting text on a selected (`--accent-soft`) or recommended (`--feature`) surface uses `--feature-muted` rather than `--muted`. Status is never conveyed by colour alone; pair it with a label.

## Components

All components are app-owned. Extend these before writing page-specific markup. Menu indicators, dialogs, and command search use the same presentation; Monaco remains the code editor, with its menus and suggestions themed to the active palette. Native text fields and choices keep browser input semantics. [UI guide](./UI_GUIDE.md#keyboard) describes their keyboard behavior.

| Component | Owner | Use |
| --- | --- | --- |
| `Button`, `Input`, `Select`, `DateInput`, `Tooltip`, `Icon` | `Button.tsx`, `Input.tsx`, `Select.tsx`, `DateInput.tsx`, `Tooltip.tsx`, `Icon.tsx` | All controls. Keep the existing action classes (`primary-button`, `reset-button`, `text-button`). |
| `PageHeader` | `Layout.tsx` | Every page title, description, and header actions |
| `InfoNote` | `Layout.tsx` | “ⓘ How evidence works” and other secondary explanation; never body paragraphs of caveats |
| `StatusChip` + `statusTone` | `Layout.tsx`, `ui-status.ts` | Rep and path status: neutral, progress, success, attention |
| `EmptyState` | `Layout.tsx` | Empty lists and no-match results, with one recovery action |
| `ListGroup` / `ListRow` | `Layout.tsx` | Collapsible topic groups and their rows (exercises, path badges, assessment skills) |
| `Trail` | `Trail.tsx`, `trail.css`, `trail-map.ts` | Path stages and nodes on Home and All tracks |
| `JournalTabs` | `Journal.tsx` | The Journal switch |
| Segmented control | `.segmented-control` | Small view switches with a visible selected state |
| `StepIndicator` | `StepIndicator.tsx` | Moving indicator for practice steps (vertical or horizontal) and lesson sections |

## The trail

Home is the learner's trail: the chosen track drawn as stages of connected nodes on the reading background, with the recommended rep on a pale lime surface beside it. `trail-map.ts` derives node order and state from existing progress without storing anything.

- Node shapes: square for a lesson (placed once, immediately before the first rep that uses it), circle for a rep, flag for a project milestone or an external project (whose stage count reads "Self-review" instead of a number), repeat icon for a recall rep.
- Node states: completed nodes use the dark action fill with a check; the single next rep uses the lime ring, a Next chip, and `aria-current="step"` (Next · In progress when it is also a draft); drafts use the accent outline and an In progress chip; recall that is not yet due uses a dashed outline and says when it becomes available. The next node is the recommended rep whenever that rep is on the trail.
- Rows are one line: the title, a level chip only when the rep's level differs from its stage's range, and the state at the far edge (wrapping below the title on phones). Not started is announced but not printed; journey evidence appears once a journey has some.
- Stages are native disclosures. The current stage and an unfinished first stage start open; project stages stay open. Completed stages show a check in their index.
- Returning learners start after the leading language-basics stages, the same reps the practice plan skips.
- Generic “Application” roles are not labelled; Guided, Independent, and Recall are.

## Practice workspace

Practice gives the working surfaces priority: one compact header row (back to Library, title, status chip, category, save status, Glossary, Tools), a slim vertical step rail on the left edge of the brief pane, and a resizable 40/60 reading/code split by default. Existing divider preferences remain in effect. On narrow screens the same moving indicator and buttons become a horizontal step bar above the selected pane, and both panes stay mounted. On phones the header takes two rows (back link with Glossary and Tools, then the title) and one quiet line of chips with the save status, and checks become a bottom sheet over the editor, resting on a run toolbar fixed to the screen edge.

SQL reps add three pieces, all drawn from existing tokens. The brief has a Tables disclosure (leading chevron, open by default, remembered for the session) listing each table's name, row count, columns with types and keys in the code font, and the first three rows in a mini table that scrolls inside its own box. The editor tab reads `query.sql` and a footer line names SQLite and the rep's contract. A failed SQL check shows Expected and Received tables on the desk's `--surface-2` (stacked on phones) with a pinned row-number column, a wrong cell outlined in `--error` with the expected value beside it, extra and missing rows outlined with a text pill, NULL in muted italics, and one semibold sentence naming the first difference; SQLite's own error replaces the check list with the message, the line, and a caret.

Check results open as a drawer inside the dark coding desk, anchored above the run toolbar and limited to about half the desk (about a third beside a frontend preview); the editor shrinks rather than being covered. Use the desk's semantic surfaces for running, failed, and passed states. Keep passed cases visible with a status at the right; failed cases reveal one diagnostic at a time. After an edit the drawer turns neutral with an Out of date chip and dimmed outcomes, keeping the open diagnostic readable. The inline frontend preview is padded like the desk's other panels and keeps its state, viewport, Update, and Expand controls in one compact row.

Practice step tabs are direct buttons without tooltips. Active primary navigation uses a quiet sage surface; active practice and lesson steps use the stronger green fill with lime text. Do not make every navigation item a primary action. Written work and behavioral checks remain separate evidence.

## Disclosures and icons

Use `Icon.tsx` for decorative control icons. `icons.css` is the single geometry source for both components and native disclosure markers: a 24px view box, 1.8px rounded outline strokes, and an 18px display size. Icons inherit the control color and are hidden from assistive technology; keep visible labels and accessible names. Do not substitute Unicode glyphs or separate inline SVG drawings. Preserve the original logo as its own brand asset.

- **Arrow:** forward actions and row navigation.
- **Chevron:** every expand/collapse control. Collapsible groups and cards (topic groups, trail stages, journeys, project overviews, path picker, the Plan step brief) use a trailing chevron that points down and rotates 180° when open. Inline text disclosures (Quick vocabulary, Starting as) use the leading native marker. Buttons with `aria-expanded` rotate their chevron the same way; the checks drawer opens upward, so its chevron points up while closed.
- **Plus/minus:** only for adding and subtracting values, such as number steppers. Never for disclosure.
- **Hover tint:** a disclosure's rounded hover tint never touches or runs past a divider. It spans the divider's width with the chevron inset by at least 8px, and keeps 3px of air from the lines above and below (see the plain-disclosure and divided-list rules in `design.css`).
- **Check / close:** success and selection / dismissal and failed checks.
- **Info, book, repeat, flag:** `InfoNote`, lesson nodes, recall nodes, and project nodes.

## Motion

Motion acknowledges interaction and shows where something came from; it never decorates idle screens. Each kind of element has one recognizable interaction, all built from the shared tokens (`--motion-fast` 180ms, `--motion-ease`, `--motion-spring`). Movement stays inside the element's own box, so hovering never shifts neighbours, and nothing animates continuously: the only repeating motion is the next trail node's ring, which plays twice on arrival and stops.

| Element | Interaction |
| --- | --- |
| Primary action | Lifts 2px with a soft shadow and a single shine sweep; arrow and play icons nudge forward; press compresses to 97%; a ripple marks the press point |
| Secondary action | Lifts 1px and takes an accent border; no shine |
| Text link | Underline fades in while rising toward the text |
| Main navigation tab | Sage wash scales in behind the label |
| Section tab | Underline grows from the centre; the current tab keeps it |
| Practice steps, lesson sections, segmented switches, Journal | Selected fill glides between options (`StepIndicator`); first placement and layout resizes snap |
| Trail node | Marker grows to 114% with an accent ring; title takes the accent; press washes the row |
| Next trail node | Lime ring pulses twice when the trail arrives or the next rep moves, then stays still |
| Next-practice panel | When its rep changes in place (a starting choice or Undo), its words rise in over 320ms and a short confirmation rises beneath it; nothing moves on page arrival |
| Trail stage, topic group, check results | Rows cascade in (30ms apart, capped at 180ms) when the group opens or results arrive |
| List row | Stays in place; the arrow slides into its reserved space; press settles to 99.5% |
| Track and starting cards | Lift 2px on hover; settle on press |
| Progress bars | Fill grows from the left when the page arrives (path progress, topic meters, and the skill-ladder bar) |
| Skill moved up, personal best | In the completion panel, the notice rises in just after the panel, the arrow slides in, and the new state's chip settles in after the old one; the personal-best note rises in last. Static text: reopening the finished rep shows it without replaying the skill map |
| Skill map step | A step made by completing a rep plays once per browser session when its node is on screen: the node scrolls into view, the marker grows to 114% with a lime ring and settles, its icon and chip settle in, and the title takes the accent for a moment; announced in a status line |
| Today plan, practice rhythm | A Today item finished since your last visit pops its check in and fills its meter segment once, and the done note rises in; nothing replays on reload or a fresh session. The last seven days on Progress pop in left to right |
| Badge earning | A newly earned badge plays once, inside its own box: the tile settles in, the rungs fill from the bottom (Guided, Independent, Retained) as the glow rises, the kept rim draws around the tile, and a tag pops in last. In the notice always; on Progress only for badges earned since the page was last shown this session |
| Milestone notice | Shows the earned badge's art (up to three) before its words. Rises 8px once when a badge is newly earned in this session; sits in the section bar inside the page frame (or in the completion panel) so the page heading does not move; never takes focus; is acknowledged as soon as it is shown, so moving on never repeats it; clears itself after 8 seconds |
| Progress statistics, track cards | Rise in a short cascade |
| Status chip | Settles in (scale and fade) when it appears or its status changes; an unchanged status stays still |
| Checkbox and radio | Mark pops in |
| Info note | Icon tilts on hover; the note takes the accent when open |
| Disclosure | Native content expands and collapses over 420ms; chevron rotates over 180ms; with reduced motion it opens and closes at once |
| Close and clear icons | Quarter-turn on hover |
| Number stepper | Presses down |
| Workspace divider | Grip lengthens on hover and focus |
| Logo, appearance symbol | Logo tilts slightly; the light/dark symbol half-turns |
| Dark mode toggle | The page crossfades over 260ms (View Transitions where supported). Colour-scheme radios apply immediately so their checked state never lags |
| Menus, tooltips, dialogs | Menus enter over 240ms; tooltips 110ms; dialogs 380ms with native close and focus |
| Page change | The page arrives over 380ms |
| Out-of-date checks | Run invites a fresh run with one lime ring when an edit puts results out of date, then stays still |
| Completion panel | Rises into the top of the Finish pane once; a finished step's check pops into the rail |
| Hint question | The inline first-hint question settles in where the hint control was |
| Checks sheet (phones) | Opening the sheet raises its contents into place once; closing is immediate |
| Restore preview and receipt | The merge preview, an import error, and the post-merge receipt each rise in once where they appear |
| Hints and real check feedback | Reveal over 320ms. Results appear as soon as they arrive: no simulated checks, delayed acknowledgements, or artificial progress |

Practice steps select immediately; new pane content fades from 80% opacity for 120ms without translating, and rapid selections leave focus on the latest pane. Lesson rows, reading sheets, and editable forms stay stable: text fields and code never move on hover, and rows never inherit raised button shadows. Disabled controls stay still.

`StepIndicator` measures the existing active button. `ui-motion.ts` and `useAppMotion.ts` add presentation without owning learner state; groups that cascade their own rows are excluded from the generic disclosure reveal. Animations must never remount editors, replace drafts, block an action, or change cancellation and stale-result handling. Animate children rather than page containers, so loading and page surfaces settle with no running animations.

Honor `prefers-reduced-motion` for CSS and JavaScript motion: hover and press movement, icon rotation, cascades, progress fills, ripples, the dark-mode crossfade, and indicator glides all switch to immediate state changes. Keyboard focus uses a 2px solid green outline with a 2px offset, on controls and fields alike. It stays visible on both white sheets and the dark coding desk, and receives the same cue as hover where one exists. A component that is inset on purpose (the workspace divider grip) may set its own offset.

## Loading language

Learning tools load as a separate local bundle when opened, keeping the initial app within its existing JavaScript budget. `LoadingStates.tsx` owns page-specific pending layouts and renders the same `PageHeader`, including the Journal switch on Notebook; `learning-pages.ts` shares headings with the loaded pages; `loading.css` owns their presentation. Skeleton fields use `--control-height`. Keep the loaded and pending first working surface aligned on desktop and narrow screens.

Every lazy page's pending state uses `RouteLoading` with that page's own frame class, eyebrow, title, and header actions (such as the Journal switch), and a failed page load shows the same `PageHeader` with a Reload action. Pieces of the brief that load just after it (the "About this rep" note and the SQL Tables card) hold their space with still skeletons. Running checks show the pending-status dot beside "Running checks", never a looping progress bar. Place page-loading status within the existing top padding, outside document flow, so its removal does not move the working surface. Skeleton shapes stay still; one small status dot acknowledges real pending work and respects reduced motion. Pending placeholders remain noninteractive and never replace or clear a draft. Never show invented learner records, counts, results, or percentage progress.

## Startup first paint

The initial workbook in `index.html` includes scoped critical styles so its logo header, sage background, white skeleton sheet, and narrow layout render before external styles or JavaScript load. Its title uses the page-title size. Keep this small first-paint subset aligned with `src/loading.css`. Verify it with external scripts and styles blocked, as well as delayed progress loading.

## Colour schemes and dark mode

The header Appearance control opens the shared dialog with Sage (original), Ocean, and Plum choices alongside dark mode. Every scheme uses the same semantic surface, text, accent, action, and feature tokens in light and dark variants. Palette definitions live in `index.html` so they also style first paint. Dark mode uses deep surfaces, pale readable text, and the same logo-derived actions; the coding desk stays dark and follows the selected scheme. Appearance is a device-scoped session UI preference, survives refresh, and never enters learner backups.

The logo has Sage, Ocean, and Plum colour variants using the original geometry; the header, loading screen, and favicon follow the selected scheme. Monaco and the coding desk follow the active scheme together and update in place without replacing the model, draft, or view state.

## Checklist for a new or changed page

1. Use `PageHeader` inside the shared frame; one `h1`; no per-page `main` width.
2. Use type tokens for headings and `--control-height` for controls.
3. Put caveats and evidence rules in an `InfoNote`; keep body copy about the task.
4. Group long lists with `ListGroup`/`ListRow`; give empty lists an `EmptyState` with a recovery action.
5. Show status with `StatusChip` and text, not colour alone.
6. Use a trailing rotating chevron for disclosure; never plus/minus.
7. Provide a matching pending layout if the page loads lazily.
8. Give each new interactive element one interaction from the motion table, contained in its own box, with a reduced-motion fallback.
9. Check light and dark, Sage/Ocean/Plum, 1440px and 320–390px widths, keyboard focus, and reduced motion.

## Verification

The browser suite asserts that every page shares the frame (title aligned with section tabs), the 32px page title, and 40px standalone controls, alongside step-indicator alignment, retained writing across animated steps, reduced-motion controls and dialogs, pending-layout alignment, and the editor, navigation, profile, and persistence flows. Use fresh browser contexts and temporary server data; never seed the learner's real database. These checks do not establish visual fidelity, assistive-technology support, other browser engines, disconnected operation, or cross-platform behavior. See the [UI guide](./UI_GUIDE.md) for routes, keyboard behavior, and saved state, and the [accessibility review](./ACCESSIBILITY_REVIEW.md) for manual checks.
