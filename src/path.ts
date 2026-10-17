type PathStage = { title: string; description: string; recap?: string; repIds: readonly string[] }

export const firstPath = {
  id: 'typescript',
  title: 'Foundations',
  description: "Learn the language basics, then build confidence with arrays, text, lookups, stacks, and reading other people's code.",
  stages: [
    {
      title: 'Learn the language',
      description: 'Declare values, use types, create objects and arrays, and write functions.',
      recap: 'You can now declare values, use types, create objects and arrays, and write small functions.',
      repIds: ['declare-variables', 'basic-types', 'create-objects', 'make-arrays', 'write-functions'],
    },
    {
      title: 'Make decisions and repeat',
      description: 'Choose between cases, repeat work with loops, shape text, and update objects without changing the original.',
      recap: 'You can now choose between cases, repeat work, shape text, and update objects without changing the original.',
      repIds: ['pass-or-retry', 'use-conditions', 'loop-with-for', 'loop-while', 'string-basics', 'object-update'],
    },
    {
      title: 'Work through arrays',
      description: 'Scan arrays to total, count, and find values, from guided practice to later recall.',
      recap: 'You can now scan arrays to total, count, and find values.',
      repIds: ['sum-positive-numbers', 'count-even-numbers', 'count-above-threshold', 'first-long-word'],
    },
    {
      title: 'Count and remember',
      description: 'Use maps and sets when you need to look something up again.',
      recap: 'You can now use maps and sets to remember values and look them up again.',
      repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character'],
    },
    {
      title: 'Handle text and gaps',
      description: 'Think through extra spaces and missing values.',
      recap: 'You can now handle extra spaces in text and find missing values.',
      repIds: ['count-words', 'missing-number'],
    },
    {
      title: 'Match openings and closings',
      description: 'Keep track of what is still unmatched with a stack.',
      recap: 'You can now use a stack to match openings and closings.',
      repIds: ['valid-parentheses', 'balanced-brackets'],
    },
    {
      title: 'Calculate shipping on your own',
      description: 'Use loops and conditions without hints on a fresh pricing problem.',
      recap: 'You can now combine loops and conditions to calculate tiered shipping costs.',
      repIds: ['shipping-cost-tiers'],
    },
    {
      title: 'Recall in a new setting',
      description: 'Come back after a break and solve related word, lookup, stack, and countdown problems.',
      recap: 'You can now apply counting, lookups, and stacks in different settings.',
      repIds: ['count-long-words', 'first-repeated-number', 'remove-adjacent-pairs', 'countdown-labels'],
    },
    {
      title: 'Read and repair code',
      description: "Fix a bug, read a teammate's function, transform data for a screen, and check a suggested answer.",
      recap: 'You can now read unfamiliar code, find bugs, and check a proposed answer.',
      repIds: ['repair-visible-count', 'read-unique-names', 'transform-active-labels', 'verify-generated-code'],
    },
    {
      title: 'TypeScript boundaries',
      description: 'Validate unknown data and preserve types in reusable APIs.',
      recap: 'You can now practice typed boundaries, reviewing compiler guarantees separately from behavior.',
      repIds: ['guard-contact-input', 'exhaustive-delivery-label', 'generic-prefix-copy', 'typed-record-lookup', 'sensor-import-report'],
    },
    {
      title: 'How JavaScript runs',
      description: 'Return a function from a function, then see how closures, shared objects, promises, and the event loop behave.',
      recap: 'You can now return a function from a function and trace closures, shared objects, promises, and event-loop ordering.',
      repIds: ['function-returns-function', 'closure-counters', 'reference-groups', 'promise-outcomes', 'event-loop-order'],
    },
  ] satisfies readonly PathStage[],
} as const

export const paths = [
  firstPath,
  {
    id: 'algorithms-data-structures',
    title: 'Problem solving',
    description: 'Pick the right collection, then use techniques for sorted data and windows.',
    stages: [
      {
        title: 'Use collections',
        description: 'Practice copying, adding, deleting, overwriting, and reading with arrays, sets, and maps.',
        recap: 'You can now copy, update, and read arrays, sets, and maps.',
        repIds: ['ds-array-operations', 'ds-set-operations', 'ds-map-operations'],
      },
      {
        title: 'Apply arrays and text',
        description: 'Scan values and handle empty input, from guided practice to recall.',
        recap: 'You can now scan arrays and text while handling empty input.',
        repIds: [
          'sum-positive-numbers',
          'count-even-numbers',
          'count-above-threshold',
          'count-words',
          'first-long-word',
          'count-long-words',
        ],
      },
      {
        title: 'Apply maps and sets',
        description: 'Use membership and counts, then return later for a different lookup problem.',
        recap: 'You can now use membership and counts to solve lookup problems.',
        repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character', 'first-repeated-number'],
      },
      {
        title: 'Build and compare text',
        description: 'Compress repeated characters, group scrambled words, check a palindrome after cleaning, and wrap text to a width.',
        recap: 'You can now scan text in runs, build comparison keys, and normalize text before comparing it.',
        repIds: ['text-run-length', 'text-anagram-groups', 'text-normalized-palindrome', 'text-wrap-column'],
      },
      {
        title: 'Stack and queue operations',
        description: 'Add and remove in both orders, and see how a stack differs from a queue.',
        recap: 'You can now trace stack and queue operations and their different removal orders.',
        repIds: ['ds-stack-operations', 'ds-queue-operations', 'ticket-service-times', 'parcel-loading-turns'],
      },
      {
        title: 'Apply stacks',
        description: 'Use a stack for nesting, canceling pairs, and simplifying paths.',
        recap: 'You can now use stacks to handle nesting, cancel pairs, and simplify file paths.',
        repIds: ['valid-parentheses', 'balanced-brackets', 'remove-adjacent-pairs', 'simplify-file-path'],
      },
      {
        title: 'Search sorted data and scan windows',
        description: 'Trace why each move is safe, then try two pointers, fixed and growing windows, and binary search.',
        recap: 'You can now search sorted data and scan windows with clear stopping rules.',
        repIds: [
          'algo-sorted-pair',
          'sorted-offset-squares',
          'reading-run-summary',
          'algo-window-sum',
          'count-unique-windows',
          'shortest-run-reaching-target',
          'algo-binary-search',
          'first-insertion-point',
          'smallest-daily-capacity',
        ],
      },
      {
        title: 'Sort and merge',
        description: 'Build sorted order one value at a time, then merge two sorted lists.',
        recap: 'You can now sort values and merge sorted lists without changing the input.',
        repIds: ['algo-insertion-sort', 'algo-merge-sorted', 'sort-score-records', 'kth-smallest-copy', 'closest-value-gap'],
      },
      {
        title: 'Recursion',
        description: 'Solve a problem by solving smaller copies of it, starting from the base case.',
        recap: 'You can now break recursive problems into smaller cases with a stopping point.',
        repIds: ['algo-recursive-sum', 'flatten-nested-numbers', 'count-object-leaves'],
      },
      {
        title: 'Trees and graphs',
        description: 'Find tree depths and paths, then explore graph connections and shortest routes.',
        recap: 'You can now explore trees and graphs to find depths, connections, and routes.',
        repIds: [
          'algo-tree-depth',
          'tree-depth-sum',
          'tree-value-depth',
          'tree-leaf-count',
          'tree-value-path',
          'algo-graph-reachable',
          'graph-reachable-count',
          'graph-incoming-counts',
          'graph-shortest-hops',
          'graph-connected-groups',
        ],
      },
      {
        title: 'Binary search trees',
        description:
          'Use the left-smaller, right-larger rule to search one path, insert without changing the original, list a range, find the nearest value, and check the rule itself.',
        recap: 'You can now search, extend, and query a binary search tree along the routes its ordering rule allows.',
        repIds: [
          'bst-search-path',
          'bst-insert-value',
          'bst-latest-at-or-before',
          'bst-range-values',
          'bst-check-order',
          'bst-nearest-slot',
        ],
      },
      {
        title: 'Grids',
        description: 'Inspect cell boundaries, count connected floor regions, and find a shortest route through walls.',
        recap: 'You can now explore rectangular grids while respecting boundaries and movement rules.',
        repIds: ['grid-open-neighbours', 'grid-count-rooms', 'grid-fewest-steps'],
      },
      {
        title: 'Solve a two-part puzzle',
        description: 'Interpret a greenhouse log, then adapt its answer to a changed request.',
        recap: 'You can now preserve useful input structure across related requests.',
        repIds: ['puzzle-parse-part-one', 'puzzle-adapt-part-two'],
      },
      {
        title: 'Ranges and linked structures',
        description:
          'Answer range questions with prefix sums, merge intervals, reverse, insert into, and remove from linked lists, and keep a heap in order.',
        recap: 'You can now answer range queries and work with intervals, linked lists, and heaps.',
        repIds: [
          'algo-prefix-sums',
          'algo-merge-intervals',
          'algo-linked-list-reverse',
          'list-insert-sorted',
          'list-remove-value',
          'algo-min-heap',
        ],
      },
      {
        title: 'Rebuild linked lists',
        description: 'Merge two sorted lists, split a playlist at a track, and rotate a route, creating new nodes each time.',
        recap: 'You can now move several cursors through linked nodes and build new lists without changing the originals.',
        repIds: ['list-merge-sorted', 'list-split-at-first', 'list-rotate-route'],
      },
      {
        title: 'Heaps and priority queues',
        description: 'Merge sorted log streams, count the meeting rooms a day needs, and track a live cutoff score.',
        recap: 'You can now recognize when a problem keeps asking for the smallest item and keep that item ready.',
        repIds: ['heap-merge-log-streams', 'heap-rooms-needed', 'heap-kth-largest-stream'],
      },
      {
        title: 'Backtracking and dynamic programming',
        description: 'List every choice with backtracking, then reuse answers to smaller problems.',
        recap: 'You can now explore choices and reuse answers to smaller problems.',
        repIds: ['algo-subsets', 'algo-climb-stairs', 'algo-coin-change'],
      },
      {
        title: 'Fill tables of smaller answers',
        description: 'Count routes through a garage, choose stalls for the most revenue, and measure the edits between two tags.',
        recap: 'You can now name a subproblem, write how its answers combine, and fill a table in a safe order.',
        repIds: ['dp-garage-paths', 'dp-stall-revenue', 'dp-tag-edits'],
      },
      {
        title: 'Harder patterns',
        description: 'Resolve future readings, rank frequent labels, schedule dependencies, and compare ordered sequences.',
        recap: 'You can now justify approaches for competing order and dependency rules.',
        repIds: ['next-warmer-day', 'top-k-frequent-tags', 'course-order', 'longest-shared-sequence'],
      },
      {
        title: 'Interview round',
        description: 'Practice clarifying, planning, coding, and explaining in a backend-style interview task.',
        recap: 'You can now clarify, plan, solve, and explain a backend interview task.',
        repIds: ['interview-backend'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'pattern-recognition',
    title: 'Pattern Recognition',
    description: 'Read an unlabeled problem, identify its decisive signals, and explain your choice before coding.',
    stages: [
      {
        title: 'Name the pattern first',
        description: 'Read "Recognize the pattern" in Lessons, then justify a candidate using the input contract before coding.',
        recap: 'You can now justify a candidate from the input contract before coding.',
        repIds: ['algo-sorted-pair'],
      },
      {
        title: 'Decide which tool fits',
        description: 'Switch between different kinds of problems. Write the decisive signal and a near-miss before you code.',
        recap: 'You can now compare candidate tools across different kinds of problems.',
        repIds: [
          'has-duplicate',
          'valid-parentheses',
          'algo-window-sum',
          'most-frequent-number',
          'simplify-file-path',
          'count-unique-windows',
        ],
      },
      {
        title: 'Find your way across a floor plan',
        description:
          'Inspect nearby cells, separate rooms, then guide a robot along its shortest route. Choose from the movement contract before coding.',
        recap: 'You can now reason about map boundaries, connected areas, and minimum moves.',
        repIds: ['grid-open-neighbours', 'grid-count-rooms', 'grid-fewest-steps'],
      },
      {
        title: 'Solve a two-part puzzle',
        description: 'Read a greenhouse log, solve the first request, then adapt to a changed rule using the same input.',
        recap: 'You can now separate input interpretation from a changing answer rule.',
        repIds: ['puzzle-parse-part-one', 'puzzle-adapt-part-two'],
      },
      {
        title: 'Choose under pressure',
        description: 'Mix unfamiliar contracts with earlier tasks. Name the decisive signal and reject a near-miss before coding.',
        recap: 'You can now defend a choice across contrasting contracts.',
        repIds: ['next-warmer-day', 'top-k-frequent-tags', 'algo-prefix-sums', 'course-order', 'longest-shared-sequence', 'algo-subsets'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    description: 'Decide what a screen shows, keep async results current, and manage live connections.',
    stages: [
      {
        title: 'Show one state',
        description: 'Turn a single screen state into the words a person sees, before you model several states.',
        recap: 'You can now turn one screen state into the words a person sees.',
        repIds: ['frontend-screen-message'],
      },
      {
        title: 'Show empty or not',
        description:
          'Choose the words for an empty list and for a list with items, including the one-item case, before you model several states.',
        recap: 'You can now choose the words for an empty list and a list with items.',
        repIds: ['frontend-list-summary'],
      },
      {
        title: 'Model valid states',
        description: 'Use unions so a screen can only be in states that make sense.',
        recap: 'You can now model screen states with unions that rule out invalid combinations.',
        repIds: ['task-state-label', 'saved-record-status', 'catalog-request-summary'],
      },
      {
        title: 'Decide what the screen shows',
        description: 'Filter items and choose between loading, error, empty, and ready.',
        recap: 'You can now choose what to show for loading, error, empty, and ready states.',
        repIds: ['frontend-visible-items', 'frontend-view-state'],
      },
      {
        title: 'Build interface logic',
        description: 'Sort a table, show form errors, choose page buttons, group items, and summarize filters.',
        recap: 'You can now derive table order, form errors, page buttons, groups, and filter labels.',
        repIds: [
          'frontend-sort-table',
          'frontend-form-errors',
          'frontend-pagination-controls',
          'group-items-by-heading',
          'filter-chip-summary',
        ],
      },
      {
        title: 'Render with React',
        description:
          'Keep state and release an effect subscription, keep list rows matched to their data with keys, and ignore stale results in an effect.',
        recap: 'You can now render components whose state, rows, and effects stay matched to the current data.',
        repIds: ['react-channel-counter', 'react-row-keys', 'react-stale-request'],
      },
      {
        title: 'Build accessible interactions',
        description: 'Wire a form, a disclosure, tabs, a live search, and an accordion that work with a keyboard and announce changes.',
        recap: 'You can now build forms, disclosures, tabs, search, and accordions with keyboard support.',
        repIds: [
          'dom-disclosure',
          'dom-form-fields',
          'dom-form-errors',
          'dom-form-submit',
          'dom-accessible-form',
          'dom-live-search',
          'dom-tabs',
          'dom-accordion',
        ],
      },
      {
        title: 'Build composite widgets',
        description:
          'Reorder a list with buttons, keep focus inside a modal dialog, and pick suggestions from a combobox with the keyboard.',
        recap: 'You can now coordinate focus, state, and ARIA attributes across widgets made of several parts.',
        repIds: ['dom-reorder-list', 'dom-modal-dialog', 'dom-combobox'],
      },
      {
        title: 'Build one connected browser feature',
        description: 'Model, render, edit, save, recover, test, then build independently.',
        recap: 'You can now model, render, edit, save, recover, and test a connected browser feature.',
        repIds: [
          'connected-note-state',
          'connected-note-render',
          'connected-note-input',
          'connected-note-save',
          'connected-note-recover',
          'connected-note-test',
          'connected-note-independent',
        ],
      },
      {
        title: 'Keep async updates current',
        description:
          'Delay, limit, and ignore stale requests so the screen shows the right result, then autosave and report scrolling at a steady rate.',
        recap: 'You can now trace delayed and limited updates and keep stale results from replacing current ones.',
        repIds: [
          'debounce-schedule',
          'autosave-debounce',
          'leading-throttle',
          'scroll-report-throttle',
          'latest-request',
          'search-request-state',
          'preview-slot-results',
          'refresh-report-state',
        ],
      },
      {
        title: 'Keep live connections correct',
        description: 'Gate socket messages, compare polling with server events, and clean up subscriptions.',
        recap: 'You can now trace live-message rules, choose a transport, and clean up subscriptions.',
        repIds: ['websocket-gate', 'choose-live-transport', 'pubsub-trace', 'subscription-cleanup'],
      },
      {
        title: 'Apply it to real code',
        description: 'Debug a cart total, repair toolbar buttons that share one loop variable, and build a small interactive directory.',
        recap: 'You can now debug real interface code and build an interactive directory.',
        repIds: ['debug-cart-total', 'debug-stale-handlers', 'frontend-directory'],
      },
      {
        title: 'Interview round',
        description: 'Clarify, plan, build, and explain a frontend interview task.',
        recap: 'You can now clarify, plan, build, and explain a frontend interview task.',
        repIds: ['interview-frontend'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'sql',
    title: 'SQL',
    description: 'Query a real SQLite database: filter, summarize, join, design tables, and change data safely.',
    stages: [
      {
        title: 'Read a table',
        description: 'Choose the columns a result needs from one table.',
        recap: 'You can now choose and rename the columns a query returns.',
        repIds: ['sql-select-columns'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'backend',
    title: 'Backend',
    description: 'Check input, return predictable results, and keep retries, caches, and shared resources safe.',
    stages: [
      {
        title: 'Check one value',
        description: 'Accept a value only when it is the right type and in range, using the conditions from Foundations.',
        recap: 'You can now check one value against a rule and reject the rest.',
        repIds: ['backend-check-quantity'],
      },
      {
        title: 'Handle untrusted input',
        description: 'Validate values at runtime, from a guided rep to a fresh recall task.',
        recap: 'You can now validate untrusted values before using them.',
        repIds: ['backend-validate-user', 'validate-stock-adjustment', 'parse-delivery-window'],
      },
      {
        title: 'Validate a whole batch',
        description: 'Normalize IDs, report conflicting errors, and accept all or nothing.',
        recap: 'You can now normalize a batch, report conflicting errors, and accept all or nothing.',
        repIds: ['validate-import-batch'],
      },
      {
        title: 'Return predictable results',
        description: 'Page a list without changing the original data, and handle a ticket request.',
        recap: 'You can now page data without changing it and handle a ticket request.',
        repIds: ['backend-page-results', 'backend-ticket-handler'],
      },
      {
        title: 'Shape requests and responses',
        description: 'Turn query parameters into safe filters and errors into safe responses.',
        recap: 'You can now turn query parameters into safe filters and shape predictable responses.',
        repIds: ['backend-query-filters', 'backend-error-response', 'parse-sort-param', 'page-response-envelope'],
      },
      {
        title: 'Query and change local data',
        description:
          'Run real SQLite queries: undo a failed stock transfer, total orders per customer with a join, and restock inventory all or nothing.',
        recap: 'You can now write joins and aggregates and keep multi-statement changes atomic.',
        repIds: ['sqlite-stock-transfer', 'sqlite-customer-totals', 'sqlite-restock-upsert'],
      },
      {
        title: 'Stay reliable',
        description:
          'Check cache freshness, back off retries, limit request rates, avoid double effects, resubmit payments safely, roll back optimistic updates, and share resources safely.',
        recap: 'You can now trace caches, retries, rate limits, duplicate requests, and shared-resource ownership.',
        repIds: [
          'cache-freshness',
          'retry-backoff',
          'idempotent-ledger',
          'payment-resubmit',
          'quote-cache-retry',
          'optimistic-balance',
          'shared-resource',
          'room-leases',
          'singleton-owner',
          'injected-clock',
          'backend-rate-limit',
        ],
      },
      {
        title: 'Read and improve code',
        description: 'Trace an existing importer, then refactor a working report without changing its behavior.',
        recap: 'You can now trace an importer and refactor a report while preserving its behavior.',
        repIds: ['read-batch-labels', 'refactor-stock-summary'],
      },
      {
        title: 'Review suggested code',
        description:
          'Check suggested functions against their contracts: a skipped empty case, an invented method, and medians that only look right.',
        recap: 'You can now verify suggested code against its contract before trusting it.',
        repIds: ['ai-empty-input-suggestion', 'ai-invented-api', 'ai-expose-wrong-median'],
      },
      {
        title: 'Debug in fresh contexts',
        description: 'Repair a date filter that drops its boundaries, a total that loses a cent, and a reducer that breaks undo.',
        recap: 'You can now reproduce a reported bug, find its cause, and repair it without breaking the rest of the contract.',
        repIds: ['debug-date-range-filter', 'debug-invoice-rounding', 'debug-reducer-mutation'],
      },
      {
        title: 'Find bugs with your own cases',
        description:
          'Write cases that expose faulty pagination, repair a range label, then expose faulty overlap checks from requirements alone.',
        recap: 'You can now write cases that expose faulty versions of a function, and repair one.',
        repIds: ['expose-page-bugs', 'repair-range-label', 'expose-overlap-bugs'],
      },
      {
        title: 'Maintain unfamiliar code',
        description:
          'Read a shipping module, reproduce its reported bug, guard and fix it, adapt it to a changed rule, then maintain two modules in other domains.',
        recap: 'You can now read unfamiliar code, reproduce a bug, guard and fix it, and adapt it to a changed requirement.',
        repIds: [
          'read-shipping-quote',
          'reproduce-quote-bug',
          'fix-quote-bug',
          'adapt-quote-rule',
          'maintain-library-fines',
          'maintain-room-booking',
        ],
      },
      {
        title: 'Interview round',
        description: 'Clarify, validate, and explain a backend interview task.',
        recap: 'You can now clarify, validate, and explain a backend interview task.',
        repIds: ['interview-backend'],
      },
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

export type PathId = (typeof paths)[number]['id']

/** Shown on All tracks; the text lives in src/path-introductions.ts, which loads with that page. */
export type PathIntroduction = {
  title: string
  body: string
  example: string
  explanation: string
  next: string
}
