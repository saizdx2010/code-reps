export const firstPath = {
  id: 'typescript',
  title: 'TypeScript from the beginning',
  description: 'Learn the language basics first, then build fluency with arrays, text, lookup collections, and stacks.',
  introduction: {
    title: 'A gentle start with TypeScript',
    body: 'A program is a set of instructions for working with information. TypeScript lets you name values, combine them in functions, and describe the kinds of values you expect. You can start here without knowing the syntax yet.',
    example: 'const name = "Ada"\nfunction greet(person: string): string {\n  return "Hello, " + person\n}\ngreet(name) // "Hello, Ada"',
    explanation: 'The first line saves a text value. The function takes text and returns a greeting. The last line calls it with the saved name.',
    next: 'First, try a tiny rep that creates a greeting. Read the example, make a plan in your own words, and use the checks to learn from mistakes.',
  },
  stages: [
    { title: 'Learn the language', description: 'Declare values, use types, create objects and arrays, and write functions.', repIds: ['declare-variables', 'basic-types', 'create-objects', 'make-arrays', 'write-functions'] },
    { title: 'Work through values', description: 'Start with guided arrays, solve a related problem alone, then return later for recall.', repIds: ['sum-positive-numbers', 'count-even-numbers', 'count-above-threshold', 'first-long-word'] },
    { title: 'Count and remember', description: 'Use maps and sets when repeated lookup helps.', repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character'] },
    { title: 'Handle text and gaps', description: 'Think through whitespace and missing values.', repIds: ['count-words', 'missing-number'] },
    { title: 'Match openings and closings', description: 'Track what remains unmatched.', repIds: ['valid-parentheses', 'balanced-brackets'] },
    { title: 'Recall in a new setting', description: 'Return to related word, lookup, and stack problems after a break.', repIds: ['count-long-words', 'first-repeated-number', 'remove-adjacent-pairs'] },
    { title: 'Use skills in code', description: 'Repair a bug, read a teammate\'s function, and transform data for a UI.', repIds: ['repair-visible-count', 'read-unique-names', 'transform-active-labels'] },
  ],
} as const

export const paths = [
  firstPath,
  {
    id: 'typescript-browser', title: 'Build with TypeScript and the DOM',
    description: 'Bridge programming knowledge to typed state, browser interactions, persistence, async behavior, tests, and three external project levels.',
    introduction: {
      title: 'Own a small browser application',
      body: 'Start with basic programming knowledge in JavaScript or another language. Use the short language reps as a refresher, then model valid states and practise browser decisions. Projects supplies three levels with detailed requirements for applications you create outside Code Reps. Navigation is free; readiness guidance does not lock tasks.',
      example: "type State = {status: 'pending'} | {status: 'ready'; titles: string[]}",
      explanation: 'The tag identifies which fields exist. Semantic type checking, behavioral tests, and browser observations provide different evidence. The current worker checks behavior, while external projects require a strict compiler check.',
      next: 'Read Model states with TypeScript unions, try the guided and independent reps, and return after three days for distinct recall. Choose any external project level in Projects and record its self-review in the notebook.',
    },
    stages: [
      { title: 'Refresh the language', description: 'Optional starting practice for values, objects, arrays, and functions.', repIds: ['basic-types', 'create-objects', 'make-arrays', 'write-functions'] },
      { title: 'Model valid states', description: 'Guided state labels, independent save outcomes, and distinct delayed catalog recall.', repIds: ['task-state-label', 'saved-record-status', 'catalog-request-summary'] },
      { title: 'Level 1 preparation: forms and views', description: 'Practise selection, state precedence, and DOM interaction before building the external task list.', repIds: ['frontend-visible-items', 'frontend-view-state', 'frontend-directory'] },
      { title: 'Level 2 preparation: validation and modules', description: 'Practise unknown inputs and module integration before the external persistent reading journal.', repIds: ['backend-validate-user', 'validate-stock-adjustment', 'parse-delivery-window', 'project-team-directory'] },
      { title: 'Level 3 preparation: async and debugging', description: 'Practice policy traces and regression reasoning before the external catalog tests real promises and recovery.', repIds: ['promise-outcomes', 'latest-request', 'search-request-state', 'preview-slot-results', 'debug-cart-total'] },
    ],
  },
  {
    'id': 'algorithms-data-structures',
    'title': 'Algorithms & Data Structures',
    'description': 'Start with collection operations, apply arrays, maps, sets, stacks, and queues, then learn techniques for sorted data and windows.',
    'introduction': {
      'title': 'Learn the tools before solving the problem',
      'body': 'A data structure organizes values; an algorithm describes steps for working with them. Learn them together here. If TypeScript is new, begin with the short language reps. Read “Use collections before solving problems” in Knowledge, then practise declaring and updating collections before attempting the problem-solving stages. Read “Stack and queue operations” before that stage and “Two pointers, windows, and binary search” before the final stage.',
      'example': 'const waiting: number[] = [4, 7]\nwaiting.push(9) // add at the back\nwaiting.shift() // serve 4 first\nwaiting[0] // next is 7',
      'explanation': 'This array acts as a queue: earlier arrivals leave first. A stack removes the latest arrival instead. Trace operations before choosing a structure for a larger task.',
      'next': 'Start with language foundations or go directly to collection operations if you can already write a TypeScript function. Explain empty cases and input ownership after each rep. Existing array, lookup, and stack journeys offer distinct independent and delayed recall tasks; new introductory and technique reps do not establish retention on their own.'
    },
    'stages': [{
        'title': 'Prepare the language',
        'description': 'Declare values, create typed arrays, and return results from functions.',
        'repIds': ['declare-variables', 'basic-types', 'make-arrays', 'write-functions']
      }, {
        'title': 'Use collections',
        'description': 'Read the collection-operations lesson, then practise copying, adding, deleting, overwriting, and reading before problem solving.',
        'repIds': ['ds-array-operations', 'ds-set-operations', 'ds-map-operations']
      }, {
        'title': 'Apply arrays and text',
        'description': 'Scan values and handle empty input; progress from guided practice to independence and delayed recall.',
        'repIds': ['sum-positive-numbers', 'count-even-numbers', 'count-above-threshold', 'count-words', 'first-long-word', 'count-long-words']
      }, {
        'title': 'Apply maps and sets',
        'description': 'Use membership and counts, explain ties, and return later for a different lookup application.',
        'repIds': ['has-duplicate', 'most-frequent-number', 'first-unique-character', 'first-repeated-number']
      }, {
        'title': 'Use stacks and queues',
        'description': 'Read the operations lesson, practise both removal orders, then apply stacks to nesting and cancellation.',
        'repIds': ['ds-stack-operations', 'ds-queue-operations', 'valid-parentheses', 'balanced-brackets', 'remove-adjacent-pairs']
      }, {
        'title': 'Learn algorithm techniques',
        'description': 'Read the techniques lesson, trace why each move is safe, then practise two pointers, fixed windows, and binary search.',
        'repIds': ['algo-sorted-pair', 'algo-window-sum', 'algo-binary-search']
      }]
  },
  {
    id: 'practical-concepts', title: 'Practical concepts',
    description: 'Learn closures, shared instances, events, async control, live connections, cleanup, and reliable updates.',
    introduction: {
      title: 'Understand the problem behind the pattern',
      body: 'Start with values, functions, arrays, and maps in the TypeScript path. Then use Knowledge to read each concept, predict its example, and check your understanding before coding. These reps isolate decisions you will meet in real applications: who owns a connection, which response can update a screen, and whether a retry repeats an effect.',
      example: 'Request A starts. Request B starts.\nB finishes first and updates the screen.\nA finishes later: ignore its obsolete result.',
      explanation: 'Completion order is not request ownership. A small state model lets you practise that distinction without a live server. Real timers, networks, authentication, and server persistence still require integration checks.',
      next: 'Begin with closures and reference identity, then work through async and networking policies. Use the related Knowledge lesson for each rep and explain one boundary after checking your code. Return to request and resource ownership with fresh recall tasks after three days.',
    },
    stages: [
      { title: 'Understand runtime behavior', description: 'Explore private state, reference identity, promise outcomes, and callback ordering.', repIds: ['closure-counters', 'reference-groups', 'promise-outcomes', 'event-loop-order'] },
      { title: 'Share and decouple work', description: 'Scope a singleton, route subscriptions, and inject a clock.', repIds: ['singleton-owner', 'pubsub-trace', 'injected-clock'] },
      { title: 'Control asynchronous updates', description: 'Separate debounce and throttle policies; guard cancelled and obsolete requests.', repIds: ['debounce-schedule', 'leading-throttle', 'latest-request', 'search-request-state'] },
      { title: 'Keep live connections correct', description: 'Gate socket messages, compare polling and SSE, and release shared resources.', repIds: ['websocket-gate', 'choose-live-transport', 'shared-resource', 'subscription-cleanup'] },
      { title: 'Handle uncertainty', description: 'Check cache freshness, bound backoff, deduplicate operations, and reconcile optimistic updates.', repIds: ['cache-freshness', 'retry-backoff', 'idempotent-ledger', 'optimistic-balance'] },
      { title: 'Recall asynchronous ownership', description: 'After independent search-state practice, wait three days and manage multiple previews without hints.', repIds: ['preview-slot-results'] },
      { title: 'Refresh with previous data', description: 'Apply a different display policy: preserve the last report during refresh, failure, and cancellation.', repIds: ['refresh-report-state'] },
      { title: 'Recall ownership in a new setting', description: 'After independent subscription cleanup, wait three days and apply ownership to room membership without hints.', repIds: ['room-leases'] },
    ],
  },
  {
    id: 'real-world', title: 'Apply skills in real code',
    description: 'Debug a checkout, trace an importer, build an interactive UI, implement a request handler, and refactor a working report.',
    introduction: {
      title: 'Small tasks with complete behavior',
      body: 'Real work starts with an existing contract, a bug report, or a person who needs an interface. These reps reuse arrays, sets, validation, and state decisions in complete small tasks. Revisit the language and core paths if those pieces are unfamiliar.',
      example: 'Bug report: two units are charged as one.\nTrace: price 250 cents × quantity 2 = 500 cents.\nCheck: the discount is applied once after the subtotal.',
      explanation: 'A concrete trace separates the requirement from the current implementation. It also suggests a regression check before you make a change.',
      next: 'Start with the checkout bug report. Write what the original code does before repairing it, then explore the other formats.',
    },
    stages: [
      { title: 'Understand existing code', description: 'Use a bug report and a trace to establish the current behavior.', repIds: ['debug-cart-total', 'read-batch-labels'] },
      { title: 'Implement a complete small feature', description: 'Build a browser interface and a request handler with clear states and boundaries.', repIds: ['frontend-directory', 'backend-ticket-handler'] },
      { title: 'Improve code safely', description: 'Refactor a working report, preserve its behavior, and explain the tradeoffs.', repIds: ['refactor-stock-summary'] },
    ],
  },
  {
    id: 'ai-era', title: 'Code confidently with AI',
    description: 'Learn the language, inspect suggested code, and prove behavior with your own checks and explanations.',
    introduction: {
      title: 'Learn the code before judging a suggestion',
      body: 'AI can suggest code quickly, but understanding still starts with small pieces: values, functions, inputs, and outputs. This path teaches those pieces first, then lets you test a suggested answer against a clear requirement.',
      example: 'const names = ["Ada", "Bo"]\nnames[0] // "Ada"\nnames[2] // undefined',
      explanation: 'An array stores values in order, starting at position 0. Checking an unexpected position shows why examples and edge cases matter.',
      next: 'Begin with short TypeScript reps. When you reach the suggested-code task, trace an input yourself before running the checks.',
    },
    stages: [
      { title: 'Read and write TypeScript', description: 'Learn values, types, functions, and arrays.', repIds: ['declare-variables', 'basic-types', 'create-objects', 'make-arrays', 'write-functions'] },
      { title: 'Verify a suggestion', description: 'Trace a draft, find the missing edge case, and repair it.', repIds: ['verify-generated-code'] },
      { title: 'Work independently', description: 'Apply your skills in unfamiliar code and explain the change.', repIds: ['repair-visible-count', 'read-unique-names'] },
    ],
  },
  {
    id: 'frontend', title: 'Frontend core',
    description: 'Practise the data and state decisions behind clear, reliable interfaces.',
    introduction: {
      title: 'From data to what a person sees',
      body: 'A frontend reads data and decides what to show. Before building a full screen, practise small decisions: which items are visible, whether data is still loading, and what an empty result means.',
      example: 'const items = [{ label: "Ada", active: true }]\nconst visible = items.filter(item => item.active)',
      explanation: 'The filter keeps active items. If the input changes, the visible result can be calculated again.',
      next: 'Start with typed objects and arrays, then try the focused UI data and state reps.',
    },
    stages: [
      { title: 'Prepare the language', description: 'Use typed objects, arrays, and functions.', repIds: ['create-objects', 'make-arrays', 'write-functions'] },
      { title: 'Derive what the UI shows', description: 'Filter data and decide when to show loading, error, empty, or ready.', repIds: ['frontend-visible-items', 'frontend-view-state'] },
      { title: 'Apply the skill', description: 'Transform realistic data and explain the result.', repIds: ['transform-active-labels', 'frontend-directory'] },
    ],
  },
  {
    id: 'backend', title: 'Backend core',
    description: 'Practise input boundaries, predictable data results, and clear API rules.',
    introduction: {
      title: 'From a request to a trustworthy result',
      body: 'A backend receives input, checks it, does work, and returns a result. Even when TypeScript describes a value, data arriving at runtime still needs validation.',
      example: 'const input: unknown = { name: "Ada" }\n// Check its shape before reading input.name.',
      explanation: 'Unknown means the value has not been verified. A type assertion alone would not check what arrived.',
      next: 'Begin with typed values and objects, then practise validation and paging a list.',
    },
    stages: [
      { title: 'Prepare the language', description: 'Work with typed values, objects, arrays, and functions.', repIds: ['basic-types', 'create-objects', 'make-arrays', 'write-functions'] },
      { title: 'Handle untrusted input', description: 'Validate values at runtime before using them.', repIds: ['backend-validate-user'] },
      { title: 'Validate independently', description: 'Apply a fresh boundary contract without hints after guided validation.', repIds: ['validate-stock-adjustment'] },
      { title: 'Recall conditional validation', description: 'Wait three days after independent practice, then apply defaults and error precedence in a different setting.', repIds: ['parse-delivery-window'] },
      { title: 'Validate a complete batch', description: 'Check normalized IDs, conflicting errors, and all-or-nothing output in a further application.', repIds: ['validate-import-batch'] },
      { title: 'Return predictable results', description: 'Bound and page a list while preserving the original data.', repIds: ['backend-page-results', 'backend-ticket-handler'] },
    ],
  },
  {
    id: 'interviews', title: 'Frontend and backend interviews',
    description: 'Practise clarifying, planning, coding, explaining, and reviewing. These rounds are untimed for now.',
    introduction: {
      title: 'Treat an interview as a conversation',
      body: 'You do not need to write code immediately. First restate the task and clarify edge cases. Then write a short plan, implement it, run checks, and explain what your solution does and does not cover.',
      example: 'Prompt: return active names.\nClarify: should blank names be included?\nPlan: filter, then map names.',
      explanation: 'A clarification changes the contract before you code. Your plan makes your reasoning visible.',
      next: 'Choose the frontend or backend round. The current practice is untimed, so take the time to explain your decisions.',
    },
    stages: [
      { title: 'Frontend round', description: 'Clarify filtering and ordering rules; plan, implement, check, and explain.', repIds: ['interview-frontend'] },
      { title: 'Backend round', description: 'Clarify an input contract; validate, normalize, check, and explain.', repIds: ['interview-backend'] },
    ],
  },
] as const

export type PathIntroduction = {
  title: string
  body: string
  example: string
  explanation: string
  next: string
}
