# Code Reps design language

Code Reps uses bright practice sheets and a green coding desk. The original logo supplies the charcoal green, sage, and lime colors. Source Sans 3 carries interface and reading text; Maple Mono carries code. Both are local assets. This system belongs to the app and uses the existing React controls, native HTML semantics, and CSS; it adds no UI library or hosted service.

## Character

Practice steps select immediately. The indicator glides for 160 ms without spring overshoot or animated width/height; new pane content fades from 80% opacity for 120 ms without translating. Required pane scrolling is instant, and rapid selections must leave focus on the latest pane. Keep unchanged learner summaries out of tab-only recalculation. Reduced motion disables the visual transition.

Dark mode uses deep green surfaces, pale readable text, and the same logo-derived lime actions. Semantic tokens apply across pages, inputs, popovers, feedback, and loading surfaces; the coding desk stays dark and follows the selected colour scheme. The Appearance panel's Dark mode toggle starts from the system preference and keeps an explicit choice across refresh in this browser session, shared between local profiles. It is a UI preference and never enters learner backups. Startup HTML resolves the theme before first paint.

Switching lesson sections keeps the page scroll position and focus on the activated tab. Selecting a different lesson may still bring its article into view.

Lesson-list rows respond in place: a quick white hover surface and the shared arrow fading/sliding into its reserved space. The selected lesson retains its sage surface and visible arrow. Keyboard focus reveals the same cue; reduced motion removes its movement. Avoid lifted shadows or moving the entire row.

The interface should feel like a welcoming workbook: playful when a learner interacts, calm while they read, write, or code. Its identity comes from the original logo, the contrast between light practice sheets and the dark coding desk, and the same control geometry repeated across every page.

Use lime to draw attention to the next useful action, warm yellow for hints, and motion to acknowledge interaction. Keep decoration purposeful. Avoid unrelated gradients, ornamental badges, competing card styles, or constant animation. Every new page should look and behave as part of the same app.

## Shared rules

`src/index.css` owns semantic tokens. `src/design.css`, `src/fluency.css`, and `src/input.css` apply them to pages, learning tools, and controls. `src/motion.css` owns the shared interaction treatment.

| Role | Treatment |
| --- | --- |
| Reading background | `#F0F4ED` |
| Practice sheet, menu, dialog | White with a `#C4D1C1` border |
| Text / supporting text | `#293E33` / `#607465` |
| Reading action | `#303F38` with lime text |
| Coding action | Lime with dark green text |
| Hint / attention | Warm yellow with dark brown text |
| Success / error | Separate semantic text, border, and surface tokens, paired with explicit copy |
| Controls / panels | 8px / 12px corners |
| Standard control height | 40px; dense editor and calendar controls retain their local layout constraints |

Use `Button`, `Input`, `Select`, `DateInput`, `Tooltip`, and the existing dialog owners. Existing action classes receive the same treatment. `Icon.tsx` provides small app-owned action icons with an 18px box and a consistent stroke. Keep the original `/favicon.svg` logo rather than replacing it with a code symbol.

## Hierarchy and learner work

Home highlights the actual recommended rep. The exercise library retains search and disclosed filters. The workspace has its own header and five-step navigation; it does not repeat library filters. Reading, planning, explanation, and reflection occupy the task pane beside the coding desk. On narrow screens, the existing pane selection keeps one working surface visible while retaining both panes and drafts.

Active primary navigation uses a quiet sage surface. Active practice and lesson steps use the stronger green fill with lime text. Do not make every navigation item a primary action. Written work and behavioral checks remain separate evidence.

## Motion

- Page changes arrive over 380ms. Practice and lesson indicators move over 420ms with the shared spring easing.
- Buttons lift on precise-pointer hover, respond on press, and show a brief click ripple. Icons respond within the same button. Disabled controls remain still; text fields and code do not tilt or move on hover.
- Lesson rows, exercise rows, secondary navigation, disclosure headings, and small field controls respond in place with color and border transitions. Lesson rows never inherit raised button shadows. Starting-point and path-choice cards lift by 2px; path completion rows respond in place and acknowledge focus within their real action. Reading sheets and editable forms stay stable.
- Menus enter over 240ms; tooltips use 110ms entry and exit. Dialogs enter over 380ms and use native close/focus behavior. Disclosures expand using native details semantics, with a presentation fallback for browsers without animated intrinsic sizing.
- Native disclosures expand and collapse over 420ms with a balanced easing curve and matching opacity timing, so closing remains visible. A second activation reverses the transition. Menu items remain available immediately when opened.
- Hints and real check feedback reveal over 320ms. Checks display real results as soon as they arrive: there are no simulated checks, delayed acknowledgements, or artificial progress stages in the app.

`StepIndicator` measures the existing active button. `ui-motion.ts` and `useAppMotion.ts` add presentation without owning learner state. Animations must never remount editors, replace drafts, block an action, or change cancellation and stale-result handling. Honor `prefers-reduced-motion` for CSS and JavaScript motion, including hover/press movement and ripple creation. Keyboard focus remains visible independently of animation.

Keyboard focus uses a thin 1px green outline. Fields use a 1px offset alongside their emphasized border, avoiding the former thick double ring. Keep focus visible on both white sheets and the dark coding desk.

## Loading language

Learning tools load as a separate local bundle when opened, keeping the initial app within its existing JavaScript budget. `LoadingStates.tsx` owns page-specific pending layouts, while `learning-pages.ts` shares headings with the loaded pages; `loading.css` owns their presentation. Lessons reserve their index and reading sheet, including the narrow-screen browse strip. Notebook shows writing fields only when an existing draft is open; otherwise it reserves the entry list or empty workspace. Practice plan shows a week and schedule rows, assessment shows an introduction and task rows, projects reserve their introduction and requirement rows, and interview shows its setup sheet. Editor loading uses a quiet code gutter and lines; preview loading reserves its idle controls and empty area rather than an ungenerated frame.

Place page-loading status within the existing top padding, outside document flow, so its removal does not move the working surface. Skeleton shapes stay still; one small status dot acknowledges real pending work and respects reduced motion. Profile operations and saves use the same inline indicator. Keep the loaded and pending first working surface aligned on desktop and narrow screens. Pending placeholders remain noninteractive and never replace or clear a draft.

The startup shell in `index.html` loads the local stylesheet before JavaScript starts. It uses the original logo and a light workbook while local progress initializes. Loading silhouettes are hidden from assistive technology; a short status explains the real pending work. Respect reduced motion and never show invented learner records, counts, results, or percentage progress. Failed loads retain the existing recovery actions without replacing learner storage.

## Verification

Check Home, the exercise library, paths, lessons and prediction/review views, notebook, practice plan, projects, interview, progress, histories, assessment, profiles, and workspace steps. Include controls, empty states, runner errors, failed checks, save recovery, and the editor fallback. Use fresh browser contexts and temporary server data; never seed the learner's real database.

The browser suite covers step-indicator alignment after resizing, retained writing across animated steps, and usable reduced-motion controls/dialogs alongside the existing editor, navigation, profile, and persistence flows. These checks do not establish visual fidelity, assistive-technology support, other browser engines, disconnected operation, or cross-platform behavior. See [UI guide](./UI_GUIDE.md) and [accessibility review](./ACCESSIBILITY_REVIEW.md).

## Icons

Use `Icon.tsx` for decorative control icons. `icons.css` is the single geometry source for both components and native disclosure markers: a 24px view box, 1.8px rounded outline strokes, and an 18px display size. Icons inherit the control color. Use the same arrow for forward actions, chevron for menus and directional navigation, plus/minus for expansion, check for success and selection, and close for dismissal or failed checks. Do not substitute Unicode glyphs or separate inline SVG drawings. Keep visible action labels and accessible names on controls; icons are hidden from assistive technology. Keyboard shortcut notation and authored code/content remain text. Preserve the original logo as its own brand asset.

Profile access uses a restrained 1px lift with 130ms feedback. Tooltips use compact white surfaces, a quiet shadow, and 110ms entry/exit transitions; pointer exit dismisses after 60ms while keyboard focus retains the hint. Avoid applying the deeper primary-action hover to compact header utilities.

Tab bars share an in-place hover wash with 140ms color/opacity feedback and a 180ms expansion. Main navigation, practice steps, lesson sections, and project file tabs keep their hit areas and selected indicators stable. Secondary navigation previews its underline on hover. Keyboard focus gets the same wash plus the existing focus outline; touch does not depend on hover, and reduced motion switches states immediately.

Practice step tabs are direct buttons without tooltips. Keep status feedback in the workspace and review checklist so tab hover never covers the brief or editor.

Practice checks occupy a separate full-width feedback sheet below the brief and coding desk. Use light semantic surfaces for running, failed, and passed states. Keep passed cases visible with a status at the right; failed cases reveal one diagnostic at a time. The outer sheet can collapse, and results navigation scrolls and focuses it without replacing the editor or learner draft.

Practice gives the working surfaces priority: a compact optional session strip, five step tabs, and a resizable 40/60 reading/code split by default. Existing divider preferences remain in effect. Run and Stop share one action bar below the editor. On narrow screens it stays at the bottom of the coding desk while the step tabs stay above the selected pane. Session reflection stays mounted behind an explicit Reflect and end session control; starting a session does not open the reflection form or complete the rep.

Across learning and progress pages, lesson feedback and notebook save messages use the same light semantic feedback surfaces as practice. Small view switches use a shared segmented control with a visible selected state and the tab hover treatment. Path completion rows expose one accessible path action across the whole row, with a thin completion bar. Commands and Glossary close natively, retain their exit transition before unmounting, and restore focus; reduced motion closes immediately.
# Startup first paint

The initial workbook in `index.html` includes scoped critical styles so its logo header, sage background, white skeleton sheet, and narrow layout render before external styles or JavaScript load. Keep this small first-paint subset aligned with `src/loading.css`. Verify it with external scripts and styles blocked, as well as delayed progress loading. Preserve reduced-motion support.

## Colour schemes

The header Appearance control opens the shared dialog with Sage (original), Ocean, and Plum choices alongside dark mode. Every scheme uses the same semantic surface, text, accent, action, and feature tokens in light and dark variants. Palette definitions live in `index.html` so they also style first paint before app assets arrive. Keep status colours semantic and preserve the original logo geometry and dark coding-desk structure. The palette uses device-scoped session UI preferences, survives refresh, and stays out of learner backups.

The logo has Sage, Ocean, and Plum colour variants using the original geometry. The header, initial loading screen, and favicon follow the selected scheme in both display modes. Sage retains `public/favicon.svg`; the alternate local SVG assets are `public/favicon-ocean.svg` and `public/favicon-plum.svg`.

Monaco and the coding desk follow the active scheme together, including editor background, gutter, selection, cursor, suggestions, keyword accents, and Run checks. Scheme changes update editor colours in place without replacing the model, draft, or view state.

Library and learning tools use the shared compact `PageHeader`, with secondary evidence guidance in native `InfoNote` disclosures. Exercises group by authored category; groups begin collapsed, remember expansion in the profile’s browser session, and open matching results during search or filtering. Search remains visible and skill, format, and status filters share one compact disclosure. Self-assessment groups skills by knowledge topic while retaining each skill’s supporting evidence and the optional assessment flow. Lessons keep their compact search, topic, and bookmark controls beside the Read, Predict, Practise, and Review views. Project summaries disclose milestones and final self-review. Progress uses one statistics row, thin path-completion bars, and expandable skill journeys with guided, independent, and recall markers; Home owns the next-practice recommendation. Backup and profile actions remain available. Pending pages use the same header and reserve the corresponding compact working surfaces.
