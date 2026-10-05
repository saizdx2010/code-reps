# Code Reps — project plan

## Purpose

Code Reps is a free, local, self-assessment application for building coding fluency, supported by excellent authored practice and a rich searchable knowledge base. Accounts, certificates, leaderboards, video courses, and AI tutoring are excluded. Local profiles separate learners and learning tracks without signup. See [docs/FLUENCY_PLATFORM.md](./docs/FLUENCY_PLATFORM.md) for the implemented learning tools and their current limits.

Code Reps is a local-first coding practice platform for developers who know how to build software but want to regain independent coding fluency and prepare for technical interviews. It should also be approachable to learners who speak English as an additional language: technical words are explained plainly without turning coding exercises into reading tests.

The first audience is working TypeScript developers who feel rusty with algorithms, data structures, or explaining their thinking. The app should eventually serve frontend and backend learners too.

The core learning journey remains free for everyone. Each learner can run the app on their own laptop through a loopback-only local server, with no account required. Local export and import let them carry their work elsewhere.

## Core learning loop

1. **Understand:** Read a concise prompt, examples, constraints, and definitions of unfamiliar terms.
2. **Plan:** Write an approach and identify edge cases before coding.
3. **Solve:** Work in an editor, run local checks, and reveal progressive hints only when requested.
4. **Explain:** Describe the solution, tradeoffs, and time and space costs in clear English.
5. **Review:** Inspect feedback, record where the difficulty was, and retry later.

Vocabulary help is always available. Solution hints are intentional reveals. Learn mode guides the loop; Practice mode allows independent work; optional Interview rounds add timing and communication; Review mode revisits weak or fading skills.

## Content model

**Path → Skill → Rep**

- A **path** points toward a goal, such as TypeScript frontend interview preparation.
- A **skill** teaches one concept with a plain-English explanation, a small example, terminology, common mistakes, and several applications.
- A **rep** is one exercise with a prompt, examples, starter files, checks, hints, solution explanation, and review prompts.

Skill progression: guided → independent → timed → retained. A skill should appear in multiple contexts where useful. For example, maps can appear in an algorithm, a UI data transformation, a backend task, and an interview explanation.

The first complete journey is arrays: guided practice, a related independent problem, then a different recall problem at least three days later. Hinted completions remain visible but cannot establish independence or retention. A stage must name the attempts and dates that support it.

Planned rep formats: algorithms and data structures, TypeScript, UI implementation, backend APIs and data, debugging, and code reading. The first curated pack should be small and excellent, beginning with arrays, maps, and stacks. Content packs should be versioned and validated before distribution; imported executable content requires stronger isolation.

## Assessment and progress

Assessment keeps four dimensions separate: understanding, approach, implementation, and communication. Tests can check behavior and edge cases. Planning and explanation use a transparent rubric and learner reflection; automated feedback must not imply certainty it cannot provide.

Save each attempt's code, result, duration, hints, explanation, notes, and difficulty tags such as wording, approach, TypeScript, or edge cases. Show skill states—learning, practising, independent, retained—based on fresh attempts and later recall. The Progress page should show the next useful rep, reviews due, skill history, and interview-round feedback without collapsing everything into one score.

## Product areas

- **Home:** One clear next rep, reviews due, and a compact progress summary.
- **Paths:** Guided sequences across frontend, backend, algorithms, and interviews.
- **Practice:** Search and filter individual reps.
- **Interview:** Timed rounds, clarification and planning, coding, explanation, and post-round review.
- **Progress:** Attempts, skill history, retained skills, and next focus.
- **Glossary:** Searchable plain-English definitions with small code examples.

The rep workspace is the reference screen: task and vocabulary beside an editor or preview, with readable test feedback. On narrow screens, the five practice steps show one pane at a time without losing work.

## Experience and visual direction

Aim for an immaculate, calm training-studio feel: readable type, generous spacing, strong hierarchy, keyboard access, clear focus, and polished loading, error, success, and saved states. Inspiration comes from the motivation and momentum of interactive learning products, while Code Reps develops its own identity around clarity, independence, and interview communication.

Use semantic UI tokens so components do not contain scattered color values. The reading surfaces and coding desk use this palette:

| Role | Value |
| --- | --- |
| Background | `#2B3531` |
| Surface | `#35423B` |
| Text | `#EDF0EB` |
| Muted text | `#BDC8BE` |
| Primary action | `#BCE57B` |
| Links and focus | `#BCE57B` |
| Editor background | `#303F38` |
| Error | `#EF978B` |

Source Sans 3 carries interface and reading text; Maple Mono carries code. Both fonts are bundled locally. Reuse the app-owned shared controls and tokens for borders, focus, spacing, radii, typography, and motion. Dropdowns, menus, calendars, number buttons, and file controls use our own presentation; native text fields and choices retain browser input semantics. Monaco remains the code editor. Home, Practice, Learn, and Progress group the full app; secondary pages stay bookmarkable. Disclose filters and management tools when needed, and keep the editor mounted while learners plan, explain, and review.

## Technical direction

- Local web UI: React, TypeScript, and Vite.
- Editor: Monaco, loaded when a coding rep opens.
- Local service: Node.js and TypeScript for persistence and managing runners.
- Learner data: SQLite on the learner's machine, with export and import.
- Content: versioned Markdown plus structured metadata, starter files, and checks.
- First runner: Vitest for TypeScript reps in a separate, time-limited process.
- Later runners: local UI preview and browser checks; temporary backend services and databases.

The app, content, and progress should work offline. Runners start on demand, report clearly, can be cancelled, and clean up after a rep. A child process is not a secure sandbox; accepting third-party executable packs requires a deliberate isolation design. Keep runner interfaces separate from learning content and progress so new challenge formats can be added without rewriting the app.

## Roadmap

1. **Usable practice loop:** 10–15 curated TypeScript reps, editor, local tests, saved attempts.
2. **Learning layer:** Skill pages, glossary, examples, progressive hints.
3. **Review and progress:** Retry scheduling, attempt history, skill states, weekly summary.
4. **Interview mode:** Timed rounds, planning and explanation prompts, separate feedback dimensions.
5. **Broader formats:** UI, debugging, code reading, then backend exercises with local services.
6. **Content and experience:** More paths, content pack tooling, visual walkthroughs, refined interactions.

Each stage should leave the app usable. Before expanding the catalog, test whether people return regularly and can solve and explain a previously difficult skill independently after a gap.

## Next development priorities

Before inviting learners, improve the platform through an internal quality pass. Learner validation remains a later milestone; internal checks establish content and product quality, while learner sessions will establish whether skills transfer and last.

1. **Learning quality:** Audit every rep's wording, examples, constraints, starter code, checks, hints, and explanations. Keep terminology plain, difficulty increases gradual, and independent reps free of accidental solution clues.
2. **Daily practice flow:** Give learners a clear next rep with a reason, let them resume unfinished work, and make difficult attempts and due reviews easy to revisit. Preserve the evidence behind progress states.
3. **Workspace polish:** Refine editor interactions, actionable feedback, keyboard navigation, narrow-screen layouts, and saved, loading, error, and success states. Switching views or recovering from an error must preserve work.
4. **Exercise depth:** Add realistic debugging, code-reading, frontend, backend, and refactoring exercises using familiar skills. Deliver a small number of complete experiences before expanding their volume.
5. **Local reliability:** Verify first run, offline use, upgrades, backups, restore, and runner cleanup before sharing the platform. Cover each supported platform before public release.

### Richer exercises

Begin with one debugging rep and one frontend rep to establish the workspace and feedback needed by the broader set. Then add code reading, backend, and refactoring. Reuse arrays, maps, validation, and state concepts so learners apply known skills in new contexts.

| Format | First exercise scope | Evidence |
| --- | --- | --- |
| Debugging | Repair broken code from a realistic bug report and failing tests. | The reported failure is fixed and related behavior still passes. |
| Code reading | Trace existing code, predict its behavior, and explain an edge case. | Authored expected outcomes and a transparent self-review rubric. |
| Frontend | Build a small interactive UI with loading, empty, error, and success states. | A local preview, interaction checks, and a visual/accessibility review checklist. |
| Backend | Implement input validation, filtering, pagination, and consistent error responses. | Request/response checks covering valid input, boundaries, and failures. |
| Refactoring | Improve messy code while preserving behavior. | Existing regression checks plus an authored comparison of structure and tradeoffs. |

Each exercise needs a realistic brief, examples and constraints, starter code, observable checks, progressive hints, an authored solution review, and reflection prompts. Introduce multi-file editing, UI previews, and local services only where the exercise requires them. Keep checks separate from self-reviewed reasoning and communication; passing tests alone must not imply those dimensions were assessed.

## Decisions to validate

- The exact first path and difficulty range for working TypeScript developers.
- The review process and quality standard for authored content.
- The assessment rubric for communication and approach.
- Install and update experience across operating systems.
- Isolation for imported exercises and backend runners.
- Accessibility and plain-English comprehension with real learners.
- Real-device startup, memory, editor responsiveness, and runner cleanup.

## Out of scope for the first release

Accounts, cloud sync, leaderboards, AI-generated challenge volume, and a large multi-language catalog. The first release should prove that a small local practice loop helps people learn, solve independently, and retain skills.
