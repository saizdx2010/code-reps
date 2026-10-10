# Independent TypeScript browser application journey

## Decision and audience

Accepted direction from the curriculum discussion: serve learners who know basic JavaScript or another programming language. The first finish line is independently building, testing, and debugging a small local browser application with plain TypeScript and the DOM. React and backend development are later paths.

The learner must also create and run the project outside Code Reps: install dependencies, run development and test commands, diagnose compiler errors, and produce a build. In-app completion alone does not meet this outcome.

Documentation is permitted. Independence means no exercise hints or AI-generated solutions during the assessed task. This is a scoped competence target, not a claim of expert or production readiness. Existing beginner content remains useful as an optional refresher.

The final project supplies detailed requirements and observable acceptance criteria, including examples and boundary behavior. It does not prescribe the implementation, module layout, algorithms, or test code. A later transfer task can use a less prescriptive brief after the learner has demonstrated implementation independence.

Navigation remains free: learners can open any lesson, rep, or project without prerequisite completion gates. Readiness guidance should explain recommended prior skills and link to relevant practice without blocking access. Opening or completing later content must not bypass the existing evidence requirements for Independent and Retained states. Recommendations are guidance, not mastery claims.

The external project uses learner self-review; another person's review is not required. Supply a concrete checklist tied to acceptance criteria, require the learner to record evidence and unresolved issues, and distinguish reported command results from checks executed by Code Reps. Self-review completion does not establish independently verified competence.

## Implemented first release

Projects now exposes one detailed external task at each of the three levels, preparation links, local setup guidance, a self-review note template, and later transfer challenges. Reflections use the existing profile notebook and preserve unfinished note drafts. The TypeScript browser path links a new state-modeling lesson and guided, independent, and distinct delayed-recall reps. These function reps check behavior; semantic compiler analysis is required in the external projects, not added to the app runner.

Additional equivalent project themes and deeper dedicated DOM, persistence, generic-type, and learner-test-authoring reps remain future content work. The external tasks practice these skills through their requirements, but their completion is self-reported. No external-project mastery tracking, new storage format, or real-service runner is introduced.

## Current assessment

The existing catalog is a useful foundation but is not sufficient evidence for this finish line. The TypeScript path starts with five language reps and then emphasizes collection problem solving. Existing DOM and multi-file directory tasks provide a starting point for browser practice, while the ticket project exercises simulated handler behavior.

The [content gap map](./CONTENT_GAPS.md) identifies incomplete independent and recall journeys for language foundations, frontend state, debugging, and learner-authored tests. It also distinguishes deterministic async policy traces from actual asynchronous composition and failure handling.

`src/compile-solution.ts` uses `transpileModule`; its diagnostics are not full semantic type checking. Behavioral success must remain separate from evidence of TypeScript correctness. Type-focused assessment requires semantic compiler checks, with normal and deliberately invalid cases, before claiming that the app assesses type-system fluency.

## Proposed progression

| Stage | Learner outcome | Practice to add or deepen |
| --- | --- | --- |
| Runtime bridge | Explain the JavaScript behavior their TypeScript relies on | Scope, equality, references, missing values, callbacks, and errors; optional diagnostic placement for JavaScript learners |
| TypeScript modeling | Represent valid states and safely consume uncertain values | Inference, object types, unions, narrowing, discriminated unions, generics, useful utility types, and strict compiler feedback |
| Browser behavior | Implement an interface from an observable contract | DOM selection, events, forms, safe text rendering, keyboard access, validation, and derived views |
| Modules and persistence | Separate responsibilities and preserve valid data | Local modules, serialization, runtime validation on load, malformed stored data, and storage failures |
| Async work | Handle real completion and failure | Promise composition, error handling, loading/empty/error states, and stale-result protection using local fixtures rather than external services |
| Tests and debugging | Produce evidence and repair unfamiliar defects | Learner-written unit and DOM tests, regression cases, boundary cases, and compiler/runtime debugging |
| External project | Own the entire development loop | Create a local TypeScript project, understand scripts and compiler configuration, run tests, and produce a build |
| Independent transfer | Adapt without a worked solution | Complete a project from requirements, diagnose a seeded defect, and handle a later unfamiliar change request |

Develop one complete guided → independent → delayed-recall journey at a time, following [content authoring](./CONTENT_AUTHORING.md). Do not copy guided implementation clues into assessment prompts. Reuse existing content owners and formats where possible; runner changes require their own design and verification.

## Accepted project levels and choice

Use three project levels. Levels describe increasing scope and recommended readiness; they do not lock navigation or represent mastery states. Offer project choices with equivalent skill requirements within each level.

| Level | Required focus | Candidate project choices |
| --- | --- | --- |
| 1 | Types, DOM events, forms, and filtering | Task list, reading list, expense list |
| 2 | Modules, validated persistence, editing, and recovery, building on level 1 | Task planner, reading journal, expense tracker |
| 3 | Async states and failures, learner-written tests, and debugging, integrating earlier skills | Task board, searchable local catalog, spending dashboard |

The three-level structure and project choice are accepted. Individual project specifications remain to be authored. Initially ship one complete project per level, then add equivalent choices after validating the progression. Learners may choose different project themes between levels; later levels must state their own complete contracts rather than assume completion of a specific earlier app.

Every final-level option requires external project setup, detailed acceptance criteria, self-review, and a later unfamiliar change request. Define a common level rubric and map each option's acceptance criteria to it so a simpler theme does not bypass required skills. Requirements must define normalization, identity, ordering, validation, failure behavior, and supported browsers before authoring checks. Async work uses local fixtures and must not depend on an external service.

## Final-level assessment evidence

Evidence should include:

- A plan and implementation produced from requirements without a solution scaffold.
- A successful semantic type check, learner-authored tests, and a runnable build outside Code Reps.
- Browser observations of forms, keyboard interaction, narrow layouts, reload persistence, and failure recovery.
- A regression test and explanation for a seeded bug.
- A later unfamiliar requirement implemented without hints, with tests and an explanation of affected decisions.

Tests establish the behaviors exercised. Accessibility, design quality, reasoning, and independence need separate review. An externally completed project is self-reported or manually reviewed until a validated evidence mechanism exists; it must not automatically grant a current retained-skill state.

### Self-review checklist contract

Each item should let the learner record met, not met, or not yet checked, with supporting evidence. A failed or unperformed check remains visible; the checklist must not collapse all dimensions into a mastery score.

- Map every feature requirement to an observable result, including boundary and failure cases.
- Record the commands and results for semantic type checking, learner-authored tests, and the production build; confirm the built app runs locally.
- Identify a regression test that fails before the seeded bug is fixed and passes afterward.
- Record keyboard, narrow-layout, reload-persistence, and recovery observations separately from automated results.
- Explain the data model, module responsibilities, async ownership, and one meaningful tradeoff in plain English.
- Disclose hints, generated solutions, or other assistance used; assisted work remains useful practice but does not establish independence.
- Record remaining defects and unchecked behavior, then repeat the relevant checks after the later change request.

The Projects page supplies these requirements and creates a saved notebook template for evidence. There is no automatic external-project progress integration or new storage format.

## Terms

- **Rep:** a focused exercise with a contract, checks, and authored review.
- **Journey:** related guided, independent, and distinct delayed-recall applications with explicit evidence rules.
- **Capstone:** an integrated application task requiring several skills together.
- **Transfer:** applying a skill to an unfamiliar requirement or context.
- **Independent:** completed without hints or generated solutions; documentation remains available.
- **Behavioral check:** evidence about observed output or interaction for the cases run.
- **Semantic type check:** compiler analysis of type relationships across the learner's program.
- **External project:** a learner-owned project run outside the Code Reps editor and runners.
- **Project level:** a scope and readiness grouping with shared skill requirements, independent of navigation access and fluency states.
- **Project option:** a theme-specific application contract that satisfies the shared requirements of its level.

## Open decisions and validation

Initial themes are the task list, reading journal, and local catalog. Their detailed contracts, setup guidance, self-review criteria, and transfer prompts are in src/browser-projects.ts. Additional project choices should satisfy the same level requirements and be validated before expanding the catalog. The detailed project contract must be reviewed separately from its reference implementation so requirements do not accidentally reveal the solution.

This document distinguishes the implemented first release from the wider curriculum proposal. Shipping these tasks does not demonstrate learning effectiveness. Use the [learner validation protocol](./LEARNER_VALIDATION.md) to observe whether learners can complete and later adapt the application independently.
