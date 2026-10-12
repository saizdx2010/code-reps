# Code Reps — project plan

## Purpose

Code Reps is a free, local-first, self-assessment application for building coding fluency, supported by authored practice and a searchable knowledge base. It serves developers who know how to build software but want to regain independent coding fluency and explain their thinking, and it should stay approachable to learners with basic JavaScript or another language. Technical words are explained plainly, so learners who speak English as an additional language are not handed a reading test.

The core learning journey remains free for everyone. Each learner runs the app on their own laptop through a loopback-only local server, or in the browser alone, with no account. Local profiles separate learners, and export and import let them carry their work elsewhere.

The plain TypeScript browser journey extends this to building, testing, and debugging a small DOM application outside Code Reps; see [the journey decision](./docs/TYPESCRIPT_BROWSER_JOURNEY.md). The [fluency guide](./docs/FLUENCY_PLATFORM.md) describes the implemented learning tools and their limits, and the [roadmap](./ROADMAP.md) holds planned work and priorities.

## Core learning loop

1. **Understand:** Read a concise prompt, examples, constraints, and definitions of unfamiliar terms.
2. **Plan:** Write an approach and identify edge cases before coding.
3. **Solve:** Work in an editor, run local checks, and reveal progressive hints only when requested.
4. **Explain:** Describe the solution, tradeoffs, and time and space costs in clear English.
5. **Review:** Inspect feedback, record where the difficulty was, and retry later.

Vocabulary help is always available. Solution hints are intentional reveals. Optional timed interview rounds add timing and communication practice; recurring reviews revisit skills after a gap.

## Content model

**Track → Stage → Rep**, with **skills** connecting lessons to practice.

- A **track** (a path in code) points toward a goal. Foundations is the shared root; the other tracks build on it.
- A **stage** groups related reps within a track, with lessons placed before the reps that use them.
- A **rep** is one exercise with a prompt, examples, starter files, checks, hints, an authored review, and reflection prompts. Formats include functions, debugging, code reading, DOM interfaces, request handlers, refactoring, multi-file projects, React, and SQLite; see [Richer exercises](./docs/RICH_EXERCISES.md).
- A **skill** has a lesson with a plain-English explanation, worked examples, common mistakes, interactive checks, and linked reps. A skill should appear in several contexts where useful.

A dedicated **journey** gives a skill guided practice, a related independent problem, and a different recall problem at least three days later. Hinted completions remain visible but cannot establish independence or retention, and each stage must name the attempts and dates that support it.

Content ships with application releases. Distributable content packs would need versioning, validation, and stronger isolation for executable content before they are considered.

## Assessment and progress

Assessment keeps four dimensions separate: understanding, approach, implementation, and communication. Tests check behavior and edge cases. Planning and explanation use a transparent rubric and learner reflection; automated feedback must not imply certainty it cannot provide.

A completed attempt saves its plan, code, explanation, hint count, completion date, and optional difficulty, confidence, and mistake tags. Skill states (learning, practicing, independent, retained) come from fresh attempts and later recall. Progress shows reviews due, skill history, and completion without collapsing everything into one score.

## Experience

Aim for a calm, readable training studio: strong hierarchy, keyboard access, clear focus, and polished loading, error, success, and saved states. The [design language](./docs/DESIGN_SYSTEM.md) defines the palette, page frame, components, and motion; the [UI guide](./docs/UI_GUIDE.md) defines routes, keyboard behavior, and saved state.

## Scope boundaries

Accounts, cloud sync, leaderboards, certificates, video courses, AI tutoring, AI-generated challenge volume, and a large multi-language catalog are out of scope. The app, content, and progress work locally; runners are for personal practice, not secure isolation for third-party code.

Learning effectiveness, plain-English comprehension, accessibility with real learners, and install and update behavior across operating systems remain to be validated; the [roadmap](./ROADMAP.md#before-sharing-more-widely) lists those release gates.
