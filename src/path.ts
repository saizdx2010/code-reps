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
