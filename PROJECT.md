# Code Reps — project plan

## Purpose

Code Reps is a local-first coding practice platform for developers who know how to build software but want to regain independent coding fluency and prepare for technical interviews. It should also be approachable to learners who speak English as an additional language: technical words are explained plainly without turning coding exercises into reading tests.

The first audience is working TypeScript developers who feel rusty with algorithms, data structures, or explaining their thinking. The app should eventually serve frontend and backend learners too.

## Core learning loop

1. **Understand:** Read a concise prompt, examples, constraints, and definitions of unfamiliar terms.
2. **Plan:** Write an approach and identify edge cases before coding.
3. **Solve:** Work in an editor, run local checks, and reveal progressive hints only when requested.
4. **Explain:** Describe the solution, tradeoffs, and time and space costs in clear English.
5. **Review:** Inspect feedback, record where the difficulty was, and retry later.

Vocabulary help is always available. Solution hints are intentional reveals. Learn mode guides the loop; Practice mode allows independent work; Interview mode adds timing and communication; Review mode revisits weak or fading skills.

## Content model

**Path → Skill → Rep**

- A **path** points toward a goal, such as TypeScript frontend interview preparation.
- A **skill** teaches one concept with a plain-English explanation, a small example, terminology, common mistakes, and several applications.
- A **rep** is one exercise with a prompt, examples, starter files, checks, hints, solution explanation, and review prompts.

Skill progression: guided → independent → timed → retained. A skill should appear in multiple contexts where useful. For example, maps can appear in an algorithm, a UI data transformation, a backend task, and an interview explanation.

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

The rep workspace is the reference screen: task and vocabulary beside an editor or preview, with readable test feedback. On narrow screens, task and workspace become tabs without losing work.

## Experience and visual direction

Aim for an immaculate, calm training-studio feel: readable type, generous spacing, strong hierarchy, keyboard access, clear focus, and polished loading, error, success, and saved states. Inspiration comes from the motivation and momentum of interactive learning products, while Code Reps develops its own identity around clarity, independence, and interview communication.

Use semantic UI tokens so components do not contain scattered color values. Initial palette direction:

| Role | Value |
| --- | --- |
| Background | `#101827` |
| Surface | `#1B2738` |
| Text | `#F5F3EC` |
| Muted text | `#A8B4C3` |
| Primary action | `#C8F36B` |
| Learning accent | `#78C9E8` |
| Error | `#F08A7E` |

Include tokens for borders, focus, spacing, radii, typography, and motion. Consider a light reading surface and dark workspace using the same semantic roles. Use shadcn/ui selectively for basic accessible controls; build the path, rep, feedback, and progress experiences specifically for Code Reps.

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
