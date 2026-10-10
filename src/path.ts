export type PathStage = { title: string; description: string; recap?: string; repIds: readonly string[] }

export const firstPath = {
  id: 'typescript',
  title: 'Foundations',
  description: 'Learn the language basics, then build confidence with arrays, text, lookups, stacks, and reading other people\'s code.',
  introduction: {
    title: 'A gentle start with TypeScript',
    body: 'A program is a set of instructions for working with information. TypeScript lets you name values, combine them in functions, and describe the kinds of values you expect. You can start here without knowing the syntax yet.',
    example: 'const name = "Ada"\nfunction greet(person: string): string {\n  return "Hello, " + person\n}\ngreet(name) // "Hello, Ada"',
    explanation: 'The first line saves a text value. The function takes text and returns a greeting. The last line calls it with the saved name.',
    next: 'First, try a tiny rep that creates a greeting. Read the example, make a plan in your own words, and use the checks to learn from mistakes.',
  },
  stages: [
    { title: 'Learn the language', description: 'Declare values, use types, create objects and arrays, and write functions.', recap: 'You can now declare values, use types, create objects and arrays, and write small functions.', repIds: ['declare-variables', 'basic-types', 'create-objects', 'make-arrays', 'write-functions'] },
    { title: 'Make decisions and repeat', description: 'Choose between cases, repeat work with loops, shape text, and update objects without changing the original.', recap: 'You can now choose between cases, repeat work, shape text, and update objects without changing the original.', repIds: ['pass-or-retry', 'use-conditions', 'loop-with-for', 'loop-while', 'string-basics', 'object-update'] },
    { title: 'Work through arrays', description: 'Scan arrays to total, count, and find values, from guided practice to later recall.', recap: 'You can now scan arrays to total, count, and find values.', repIds: ['sum-positive-numbers', 'count-even-numbers', 'count-above-threshold', 'first-long-word'] },
    { title: 'Count and remember', description: 'Use maps and sets when you need to look something up again.', recap: 'You can now use maps and sets to remember values and look them up again.', repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character'] },
    { title: 'Handle text and gaps', description: 'Think through extra spaces and missing values.', recap: 'You can now handle extra spaces in text and find missing values.', repIds: ['count-words', 'missing-number'] },
    { title: 'Match openings and closings', description: 'Keep track of what is still unmatched with a stack.', recap: 'You can now use a stack to match openings and closings.', repIds: ['valid-parentheses', 'balanced-brackets'] },
    { title: 'Calculate shipping on your own', description: 'Use loops and conditions without hints on a fresh pricing problem.', recap: 'You can now combine loops and conditions to calculate tiered shipping costs.', repIds: ['shipping-cost-tiers'] },
    { title: 'Recall in a new setting', description: 'Come back after a break and solve related word, lookup, stack, and countdown problems.', recap: 'You can now apply counting, lookups, and stacks in different settings.', repIds: ['count-long-words', 'first-repeated-number', 'remove-adjacent-pairs', 'countdown-labels'] },
    { title: 'Read and repair code', description: 'Fix a bug, read a teammate\'s function, transform data for a screen, and check a suggested answer.', recap: 'You can now read unfamiliar code, find bugs, and check a proposed answer.', repIds: ['repair-visible-count', 'read-unique-names', 'transform-active-labels', 'verify-generated-code'] },
    { title: 'How JavaScript runs', description: 'See how closures, shared objects, promises, and the event loop behave.', recap: 'You can now trace closures, shared objects, promises, and event-loop ordering.', repIds: ['closure-counters', 'reference-groups', 'promise-outcomes', 'event-loop-order'] },
  ] satisfies readonly PathStage[],
} as const

export const paths = [
  firstPath,
  {
    id: 'algorithms-data-structures',
    title: 'Problem solving',
    description: 'Pick the right collection, then use techniques for sorted data and windows.',
    introduction: {
      title: 'Learn the tools, then solve the problem',
      body: 'A data structure organizes values. An algorithm is a set of steps for working with them. You will learn both together here. Do Foundations first, or be ready to write a TypeScript function. Read "Use collections before solving problems" in Lessons before the first stage, "Stack and queue operations" before stacks, and "Two pointers, windows, and binary search" before the techniques.',
      example: 'const waiting: number[] = [4, 7]\nwaiting.push(9) // add at the back\nwaiting.shift() // serve 4 first\nwaiting[0] // next is 7',
      explanation: 'This array acts like a queue: the earliest arrival leaves first. A stack removes the latest arrival instead. Trace a few operations before you choose a structure.',
      next: 'Start with collection operations. After each rep, say what happens with empty input and who owns the data. Stages that reuse Foundations reps link back instead of repeating them.',
    },
    stages: [
      { title: 'Use collections', description: 'Practice copying, adding, deleting, overwriting, and reading with arrays, sets, and maps.', recap: 'You can now copy, update, and read arrays, sets, and maps.', repIds: ['ds-array-operations', 'ds-set-operations', 'ds-map-operations'] },
      { title: 'Apply arrays and text', description: 'Scan values and handle empty input, from guided practice to recall.', recap: 'You can now scan arrays and text while handling empty input.', repIds: ['sum-positive-numbers', 'count-even-numbers', 'count-above-threshold', 'count-words', 'first-long-word', 'count-long-words'] },
      { title: 'Apply maps and sets', description: 'Use membership and counts, then return later for a different lookup problem.', recap: 'You can now use membership and counts to solve lookup problems.', repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character', 'first-repeated-number'] },
      { title: 'Stack and queue operations', description: 'Add and remove in both orders, and see how a stack differs from a queue.', recap: 'You can now trace stack and queue operations and their different removal orders.', repIds: ['ds-stack-operations', 'ds-queue-operations', 'ticket-service-times', 'parcel-loading-turns'] },
      { title: 'Apply stacks', description: 'Use a stack for nesting, canceling pairs, and simplifying paths.', recap: 'You can now use stacks to handle nesting, cancel pairs, and simplify file paths.', repIds: ['valid-parentheses', 'balanced-brackets', 'remove-adjacent-pairs', 'simplify-file-path'] },
      { title: 'Search sorted data and scan windows', description: 'Trace why each move is safe, then try two pointers, fixed and growing windows, and binary search.', recap: 'You can now search sorted data and scan windows with clear stopping rules.', repIds: ['algo-sorted-pair', 'sorted-offset-squares', 'reading-run-summary', 'algo-window-sum', 'count-unique-windows', 'shortest-run-reaching-target', 'algo-binary-search', 'first-insertion-point', 'smallest-daily-capacity'] },
      { title: 'Sort and merge', description: 'Build sorted order one value at a time, then merge two sorted lists.', recap: 'You can now sort values and merge sorted lists without changing the input.', repIds: ['algo-insertion-sort', 'algo-merge-sorted', 'sort-score-records', 'kth-smallest-copy'] },
      { title: 'Recursion', description: 'Solve a problem by solving smaller copies of it, starting from the base case.', recap: 'You can now break recursive problems into smaller cases with a stopping point.', repIds: ['algo-recursive-sum', 'flatten-nested-numbers', 'count-object-leaves'] },
      { title: 'Trees and graphs', description: 'Find tree depths and paths, then explore graph connections and shortest routes.', recap: 'You can now explore trees and graphs to find depths, connections, and routes.', repIds: ['algo-tree-depth', 'tree-depth-sum', 'tree-value-path', 'algo-graph-reachable', 'graph-shortest-hops', 'graph-connected-groups'] },
      { title: 'Ranges and linked structures', description: 'Answer range questions with prefix sums, merge intervals, reverse a linked list, and keep a heap in order.', recap: 'You can now answer range queries and work with intervals, linked lists, and heaps.', repIds: ['algo-prefix-sums', 'algo-merge-intervals', 'algo-linked-list-reverse', 'algo-min-heap'] },
      { title: 'Backtracking and dynamic programming', description: 'List every choice with backtracking, then reuse answers to smaller problems.', recap: 'You can now explore choices and reuse answers to smaller problems.', repIds: ['algo-subsets', 'algo-climb-stairs', 'algo-coin-change'] },
      { title: 'Interview round', description: 'Practice clarifying, planning, coding, and explaining in a backend-style interview task.', recap: 'You can now clarify, plan, solve, and explain a backend interview task.', repIds: ['interview-backend'] },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    description: 'Decide what a screen shows, keep async results current, and manage live connections.',
    introduction: {
      title: 'From data to what a person sees',
      body: 'A frontend reads data and decides what to show. Is it loading? Did it fail? Is it empty? You will practice those small decisions first, then handle timing, requests, and live updates. Foundations first helps, especially objects, arrays, and functions.',
      example: "type State = {status: 'pending'} | {status: 'ready'; titles: string[]}\nconst items = [{ label: 'Ada', active: true }]\nconst visible = items.filter(item => item.active)",
      explanation: 'The tag tells you which fields exist. The filter keeps only active items, and the result can be recalculated whenever the data changes.',
      next: 'Start with state labels, then derive what the screen shows. Return to the recall reps after three days. When you are ready, build the team directory project on your own.',
    },
    stages: [
      { title: 'Show one state', description: 'Turn a single screen state into the words a person sees, before you model several states.', recap: 'You can now turn one screen state into the words a person sees.', repIds: ['frontend-screen-message'] },
      { title: 'Model valid states', description: 'Use unions so a screen can only be in states that make sense.', recap: 'You can now model screen states with unions that rule out invalid combinations.', repIds: ['task-state-label', 'saved-record-status', 'catalog-request-summary'] },
      { title: 'Decide what the screen shows', description: 'Filter items and choose between loading, error, empty, and ready.', recap: 'You can now choose what to show for loading, error, empty, and ready states.', repIds: ['frontend-visible-items', 'frontend-view-state'] },
      { title: 'Build interface logic', description: 'Sort a table, show form errors, choose page buttons, group items, and summarize filters.', recap: 'You can now derive table order, form errors, page buttons, groups, and filter labels.', repIds: ['frontend-sort-table', 'frontend-form-errors', 'frontend-pagination-controls', 'group-items-by-heading', 'filter-chip-summary'] },
      { title: 'Build accessible interactions', description: 'Wire a form, a disclosure, tabs, a live search, and an accordion that work with a keyboard and announce changes.', recap: 'You can now build forms, disclosures, tabs, search, and accordions with keyboard support.', repIds: ['dom-disclosure', 'dom-accessible-form', 'dom-live-search', 'dom-tabs', 'dom-accordion'] },
      { title: 'Build one connected browser feature', description: 'Model, render, edit, save, recover, test, then build independently.', recap: 'You can now model, render, edit, save, recover, and test a connected browser feature.', repIds: ['connected-note-state', 'connected-note-render', 'connected-note-input', 'connected-note-save', 'connected-note-recover', 'connected-note-test', 'connected-note-independent'] },
      { title: 'Keep async updates current', description: 'Delay, limit, and ignore stale requests so the screen shows the right result.', recap: 'You can now trace delayed requests and keep stale results from replacing current ones.', repIds: ['debounce-schedule', 'leading-throttle', 'latest-request', 'search-request-state', 'preview-slot-results', 'refresh-report-state'] },
      { title: 'Keep live connections correct', description: 'Gate socket messages, compare polling with server events, and clean up subscriptions.', recap: 'You can now trace live-message rules, choose a transport, and clean up subscriptions.', repIds: ['websocket-gate', 'choose-live-transport', 'pubsub-trace', 'subscription-cleanup'] },
      { title: 'Apply it to real code', description: 'Debug a cart total and build a small interactive directory.', recap: 'You can now debug a cart total and build an interactive directory.', repIds: ['debug-cart-total', 'frontend-directory'] },
      { title: 'Interview round', description: 'Clarify, plan, build, and explain a frontend interview task.', recap: 'You can now clarify, plan, build, and explain a frontend interview task.', repIds: ['interview-frontend'] },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'backend',
    title: 'Backend',
    description: 'Check input, return predictable results, and keep retries, caches, and shared resources safe.',
    introduction: {
      title: 'From a request to a trustworthy result',
      body: 'A backend receives input, checks it, does work, and returns a result. TypeScript describes a value, but data from outside still needs a runtime check. Foundations first helps, especially objects, arrays, and functions.',
      example: 'const input: unknown = { name: "Ada" }\n// Check its shape before reading input.name.',
      explanation: '"Unknown" means nobody has verified the value yet. A type assertion would not check what actually arrived.',
      next: 'Begin with validation, then paging and handlers. Reliability reps come next: caches, retries, and shared resources. Finish with the ticket API project.',
    },
    stages: [
      { title: 'Check one value', description: 'Accept a value only when it is the right type and in range, using the conditions from Foundations.', recap: 'You can now check one value against a rule and reject the rest.', repIds: ['backend-check-quantity'] },
      { title: 'Handle untrusted input', description: 'Validate values at runtime, from a guided rep to a fresh recall task.', recap: 'You can now validate untrusted values before using them.', repIds: ['backend-validate-user', 'validate-stock-adjustment', 'parse-delivery-window'] },
      { title: 'Validate a whole batch', description: 'Normalize IDs, report conflicting errors, and accept all or nothing.', recap: 'You can now normalize a batch, report conflicting errors, and accept all or nothing.', repIds: ['validate-import-batch'] },
      { title: 'Return predictable results', description: 'Page a list without changing the original data, and handle a ticket request.', recap: 'You can now page data without changing it and handle a ticket request.', repIds: ['backend-page-results', 'backend-ticket-handler'] },
      { title: 'Shape requests and responses', description: 'Turn query parameters into safe filters and errors into safe responses.', recap: 'You can now turn query parameters into safe filters and shape predictable responses.', repIds: ['backend-query-filters', 'backend-error-response', 'parse-sort-param', 'page-response-envelope'] },
      { title: 'Stay reliable', description: 'Check cache freshness, back off retries, limit request rates, avoid double effects, roll back optimistic updates, and share resources safely.', recap: 'You can now trace caches, retries, rate limits, duplicate requests, and shared-resource ownership.', repIds: ['cache-freshness', 'retry-backoff', 'idempotent-ledger', 'optimistic-balance', 'shared-resource', 'room-leases', 'singleton-owner', 'injected-clock', 'backend-rate-limit'] },
      { title: 'Read and improve code', description: 'Trace an existing importer, then refactor a working report without changing its behavior.', recap: 'You can now trace an importer and refactor a report while preserving its behavior.', repIds: ['read-batch-labels', 'refactor-stock-summary'] },
      { title: 'Find bugs with your own cases', description: 'Write cases that expose faulty pagination, repair a range label, then expose faulty overlap checks from requirements alone.', recap: 'You can now write cases that expose faulty versions of a function, and repair one.', repIds: ['expose-page-bugs', 'repair-range-label', 'expose-overlap-bugs'] },
      { title: 'Interview round', description: 'Clarify, validate, and explain a backend interview task.', recap: 'You can now clarify, validate, and explain a backend interview task.', repIds: ['interview-backend'] },
    ] satisfies readonly PathStage[],
  },
] as const

/** Paths that were merged into the current Foundations and tracks. Saved goals that name one still need a home. */
export const retiredPathIds: Record<string, (typeof paths)[number]['id']> = {
  'typescript-browser': 'frontend',
  'practical-concepts': 'frontend',
  'real-world': 'backend',
  'ai-era': 'typescript',
  interviews: 'algorithms-data-structures',
}

export function migratePathId(id: string): string {
  return Object.hasOwn(retiredPathIds, id) ? retiredPathIds[id] : id
}

export type PathIntroduction = {
  title: string
  body: string
  example: string
  explanation: string
  next: string
}
