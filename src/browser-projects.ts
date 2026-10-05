export type BrowserProject = {
  id: string
  level: 1 | 2 | 3
  title: string
  brief: string
  readiness: string
  preparation: string[]
  requirements: string[]
  examples: string[]
  verification: string[]
  transfer: string
}

export const externalSetup = [
  'Create a separate folder outside the Code Reps checkout. Use Node.js 24+ and Yarn Classic 1.22.22. Create your own package.json, index.html, TypeScript entry file, and tsconfig.json; do not copy an application solution.',
  'Use TypeScript and Vite for a plain DOM app. Install pinned versions and keep yarn.lock. Enable strict compiler checking, target ES2022, include DOM libraries, and use module resolution compatible with Vite. Documentation is allowed; understand each option you select.',
  'Provide dev, test, build, and preview scripts. build must run tsc --noEmit before vite build: Vite transpilation alone is not a semantic type check. Use Node tests for pure modules and a DOM/browser test environment for interactions; choose and document your test tools.',
  'Run yarn dev, yarn test, yarn build, and yarn preview. Verify the built application through the local preview server rather than opening dist/index.html as a file. Record actual command results and remaining failures in your self-review.',
  'Use only local assets and fixtures. No accounts, cloud services, remote APIs, or learner databases are required. This is a learner-owned project, not a change to Code Reps persistence.',
]

export const projectReview = [
  'For every requirement, record Met, Not met, or Not checked, with an example, test name, or browser observation.',
  'Record semantic type-check, test, and build commands and their actual results. A command you did not run remains Not checked.',
  'Use the app with a keyboard at desktop and 375px width. Check labels, focus, readable errors, safe text rendering, and no horizontal page overflow. Record browser observations separately from automated results.',
  'Explain the data model, module responsibilities, and one alternative you rejected. Describe a concrete boundary or failure trace.',
  'Record assistance, hints, and generated solutions used. Documentation is permitted. Assisted completion is useful practice, but does not establish independence.',
  'List unresolved defects and unchecked behavior. After the transfer task, rerun affected tests and build checks and explain what changed.',
]

export const browserProjects: BrowserProject[] = [
  {
    id: 'browser-task-list', level: 1, title: 'Build a task list',
    brief: 'Create a plain TypeScript browser app with an accessible form, typed task state, and derived filters. Set it up and run it outside Code Reps.',
    readiness: 'Recommended: typed values and functions, arrays, unions and narrowing, basic HTML, and DOM events. You may open this level at any time.',
    preparation: ['write-functions', 'create-objects', 'task-state-label', 'frontend-visible-items', 'frontend-directory'],
    requirements: [
      'A task has a stable unique string ID, a title, and a boolean done flag. IDs remain unchanged when toggling completion. Duplicate titles are allowed and remain separate tasks.',
      'Start with an empty in-memory list. Submitting a labeled title form creates an incomplete task at the end of the list. Trim the title; accept 1–80 JavaScript string code units after trimming. Reject blank or longer titles without changing the list or clearing the entered draft. Show an associated readable error.',
      'On successful submission, clear the title field and return focus to it. Each task has a keyboard-operable completion control with an accessible name that identifies the task. Show titles as literal text, never as HTML.',
      'Provide All, Open, and Done filters, starting with All. A labeled search field compares trimmed, case-insensitive text against task titles. Status and search filters apply together and preserve creation order. Clearing search restores the selected status filter.',
      'Show the total number of tasks and the number currently visible. Distinguish no tasks yet from no matches. Filtering never changes or deletes the underlying tasks.',
      'Keep state typed without any or unchecked assertions that bypass an uncertain value. The semantic type check must pass. Review type design yourself: behavioral tests do not prove a particular type or implementation.',
      'This level does not persist tasks: reloading intentionally starts empty. Explain this boundary in the app and README. Use semantic list/form controls and keep the layout usable at 375px.',
    ],
    examples: [
      'Submit "  Read handbook  ": one open task titled "Read handbook" is appended. Submit it again: a second task with a different ID is created.',
      'Tasks Alpha (open), Beta (done), ALPINE (open); Open plus search " al " displays Alpha then ALPINE. Search "zzz" shows no matches while total remains 3.',
      'An 80-code-unit trimmed title is accepted; 81 is rejected. "<img src=x>" is displayed literally and creates no image element.',
    ],
    verification: [
      'Write tests for title boundaries, duplicate titles with distinct IDs, combined filters, order preservation, and input preservation in pure transformations.',
      'Write DOM/browser tests for form submission, rejected-input draft preservation, toggling, clearing search, counts, and literal markup text. Run them through your test script.',
      'Diagnose this supplied defect scenario: toggling by title changes both tasks with identical titles. Reproduce it in a separate intentionally faulty version, add a failing regression test, then fix it using stable identity. Record the failure before the repair.',
    ],
    transfer: 'After a break, add deletion by task identity. Define behavior when the focused task disappears, preserve active filters, and prove deleting one duplicate title does not delete its sibling. Write acceptance criteria before implementation.',
  },
  {
    id: 'browser-reading-journal', level: 2, title: 'Build a persistent reading journal',
    brief: 'Build an editable journal whose browser-local data survives reloads and whose invalid saved data cannot silently replace current work.',
    readiness: 'Recommended: level 1 skills, local modules, unknown-value validation, JSON, and browser storage. Completion of level 1 is not required.',
    preparation: ['backend-validate-user', 'validate-stock-adjustment', 'parse-delivery-window', 'saved-record-status', 'project-team-directory'],
    requirements: [
      'A book has a unique nonempty string ID, a title, an author, and status "planned", "reading", or "finished". Trim title and author; title length is 1–80 and author length is 1–60 JavaScript code units. Duplicate title/author combinations are allowed. IDs stay stable through editing.',
      'Provide labeled create and edit forms. Creation appends a planned book up to 500 records; at the limit reject creation, retain the form draft, and explain the limit. Editing preserves its position and ID. Canceling an edit preserves the original book. Invalid edits leave the draft visible and the stored record unchanged.',
      'Provide status filtering and trimmed case-insensitive search across title or author, combined with AND between status and search. Preserve list order and distinguish an empty journal from no matches.',
      'Persist a versioned JSON envelope {version: 1, books: [...]} under an app-specific storage key, never a Code Reps key. Accept at most 500 records. Validate the entire envelope, field types, statuses, lengths, and unique IDs before replacing state. Reject non-objects, arrays as records, unknown versions, and malformed JSON. Ignore extra properties and reconstruct only supported fields.',
      'On a fresh key, start empty. On valid data, restore all records and order. On corrupt or unsupported data, show a recovery error, preserve the original stored value, and do not automatically overwrite it. Offer an explicit reset action with confirmation; canceling leaves the original value intact.',
      'When a write fails, preserve the current in-memory edits and show that they are unsaved with an explicit Retry save action. Do not report Saved until the latest snapshot succeeds. Disable further persistence attempts while corrupt startup data remains unresolved; keep drafts available.',
      'Separate data validation and transformations, storage operations, and DOM rendering into local modules with clear contracts. Render user text safely, support keyboard editing/cancel/retry, and pass a strict semantic type check.',
    ],
    examples: [
      'Save a book, edit its title, reload: the edited title and original ID return at the same list position.',
      'The saved value is "{broken": display recovery guidance and leave that exact stored string intact until the learner confirms reset.',
      'Two records share an ID: reject the entire snapshot. A storage adapter throws on save: keep edited books in memory, report Unsaved, and retry the latest snapshot after the adapter recovers.',
    ],
    verification: [
      'Write unit tests for all accepted/rejected envelope cases, field boundaries, duplicate IDs, normalized fields, and no partial restore. Include extra properties and a 501-record envelope.',
      'Use an injected storage adapter to test read and write exceptions, unchanged corrupt data, canceled reset, and retrying the latest state. Do not alter your real browser data to simulate failures.',
      'Write browser tests for edit/cancel, valid reload, corrupt-data recovery, and unsaved feedback. Reproduce a bug that displays Saved in a finally block after a write throws; add a failing regression test and repair it.',
    ],
    transfer: 'After a break, add JSON file import with a preview and explicit confirmation. Invalid or canceled imports must preserve existing records and drafts. Define append versus replace and duplicate-ID rules before implementing and testing them.',
  },
  {
    id: 'browser-local-catalog', level: 3, title: 'Build an asynchronous local catalog',
    brief: 'Integrate typed state, real promises, a DOM interface, persistence, tests, and debugging in a learner-owned local application.',
    readiness: 'Recommended: earlier browser skills, modules, runtime validation, promises, and request ownership. All levels remain open.',
    preparation: ['catalog-request-summary', 'promise-outcomes', 'latest-request', 'search-request-state', 'preview-slot-results', 'project-team-directory'],
    requirements: [
      'Create local JSON fixtures containing at most 200 items per category. Support categories Books and Tools. Each item has a unique string ID, a trimmed title of 1–80 code units, and a category exactly equal to the selected category. Books IDs use books: and Tools IDs use tools:, followed by 1–40 ASCII letters, digits, or hyphens. IDs are case-sensitive and stay unchanged; these prefixes prevent cross-category favorite collisions. Validate the entire returned payload before accepting it; reject duplicates or malformed records without partial results.',
      'Implement a service that returns Promise<unknown> and loads bundled local fixtures. Supply a deterministic test adapter whose promises can be resolved or rejected in a chosen order; do not use remote APIs or timing-based sleeps in tests.',
      'A labeled category selector triggers loading; a labeled query field filters the accepted category data using trimmed case-insensitive title matching. Show distinct initial, loading, failed, ready-empty, and ready-with-data states. On category change, clear previous displayed results so they cannot appear under the wrong category.',
      'Only the latest category request may settle the current state. Ignore obsolete success and failure after another selection or retry. Retry starts a new request for the current category. A failed current request shows a readable error and a keyboard-operable Retry action; it must never remain stuck loading.',
      'Persist favorite IDs in a separate versioned local envelope. Validate unique IDs using the same books:/tools: format and a maximum of 1000 favorites on load. Reject toggling a new favorite at the limit without removing existing favorites, and explain the limit. Keep favorite IDs for categories not currently loaded. A current item can be toggled independently; persisted favorites survive reload. Corrupt storage and failed writes use the same preservation, reset, unsaved, and retry guarantees as level 2.',
      'Render literal titles and accessible favorite controls, preserve focus while updating the interface, and handle empty data and no query matches distinctly. Do not insert server-style error text as HTML. Keep the interface usable with keyboard and at 375px.',
      'Organize service, data validation, state transitions, persistence, and DOM concerns into understandable modules. Pass strict semantic type checking and your learner-authored unit and browser tests. Document setup, fixture formats, scripts, recovery behavior, and known limits.',
    ],
    examples: [
      'Select Books (request A), then Tools (B). Resolve B with valid tools, then A with books: Tools remains visible. Reject A instead: no Tools error appears.',
      'The current Tools request rejects: show failure and Retry. Retry resolves to []: show a ready-empty category rather than an error or loading spinner.',
      'Favorite book b1, switch to Tools, and favorite t1. Reload then return to Books: b1 remains favorite. Searching for a missing title does not clear favorites.',
    ],
    verification: [
      'Write payload and persistence validation tests, including malformed JSON, duplicate IDs, wrong categories, limits, failed reads/writes, and recovery without data loss.',
      'Write deferred-promise tests for success, rejection, obsolete success, obsolete failure, multiple retries, and rapid category switches. Verify intermediate loading states as well as final states.',
      'Write browser tests for category changes, query filtering, retry, favorite persistence, keyboard controls, safe text, and empty states. Run tests and a production build outside Code Reps.',
      'Create an intentionally faulty request handler that applies every resolved response. Demonstrate the A/B race with a failing regression test, repair it, and explain why cancellation alone would not establish ownership.',
    ],
    transfer: 'After at least three days, add refresh within the current category while retaining its accepted results. Define how refreshing, failure, category changes, and favorites interact. Update acceptance criteria, implement without hints, and rerun type, unit, browser, and build checks. This external transfer remains self-reviewed, not an automatic Retained state.',
  },
]

export function projectReflection(project: BrowserProject): string {
  return [
    `Level ${project.level}: ${project.title}`, 'External project self-review — learner-reported evidence',
    'Date:', 'Project location:', 'Assistance used:',
    ...project.requirements.map((requirement, index) => `Requirement ${index + 1}: ${requirement}\nStatus (Met / Not met / Not checked):\nEvidence:`),
    ...projectReview.map(point => `${point}\nEvidence:`),
    ...project.verification.map(point => `${point}\nResult:`),
    `Later transfer: ${project.transfer}\nDate and evidence:`,
    'Unresolved issues:',
  ].join('\n\n')
}
