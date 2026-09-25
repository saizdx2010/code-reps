import type { Rep } from './rep'

export const transferReps: Rep[] = [
  {
    id: 'repair-visible-count', title: 'Repair a visibility count', category: 'Debugging', format: 'debug',
    prompt: 'A teammate wrote a function to count active items, but it counts the wrong ones. Read the existing code and repair the condition.',
    example: { input: 'countVisible([{ active: true }, { active: false }])', output: '1' },
    note: 'Keep the function name and input type. An empty list has no active items.',
    vocabulary: [{ term: 'Condition', meaning: 'an expression that decides whether a block runs' }],
    planPrompt: 'What does the current condition select? What should it select?',
    starter: 'function countVisible(items: { active: boolean }[]): number {\n  let count = 0\n  for (const item of items) {\n    if (!item.active) count++\n  }\n  return count\n}\n',
    functionName: 'countVisible', hints: ['Trace the condition with active: true.', 'The exclamation mark reverses a boolean.', 'Count only when item.active is true.'],
    checks: [
      { name: 'Counts the example', input: [[{ active: true }, { active: false }]], expected: 1 },
      { name: 'Handles only active items', input: [[{ active: true }, { active: true }]], expected: 2 },
      { name: 'Handles only inactive items', input: [[{ active: false }]], expected: 0 },
      { name: 'Handles an empty list', input: [[]], expected: 0 },
    ],
  },
  {
    id: 'read-unique-names', title: 'Read a name collector', category: 'Code reading', format: 'read',
    prompt: 'Read the starter function. Its loop keeps the first occurrence of each nonempty name. Fix the return statement so the full kept list is returned.',
    example: { input: "uniqueNames(['Ada', 'Bo', 'Ada'])", output: "['Ada', 'Bo']" },
    note: 'Name comparison is case-sensitive. Do not change the working loop.',
    vocabulary: [{ term: 'Slice', meaning: 'a portion of an array' }],
    planPrompt: 'What is in names after the loop? Why does slice(1) lose data?',
    starter: 'function uniqueNames(input: string[]): string[] {\n  const seen = new Set<string>()\n  const names: string[] = []\n  for (const name of input) {\n    if (name !== "" && !seen.has(name)) {\n      seen.add(name)\n      names.push(name)\n    }\n  }\n  return names.slice(1)\n}\n',
    functionName: 'uniqueNames', hints: ['The loop builds the answer in names.', 'slice(1) starts at the second item.', 'Return names directly.'],
    checks: [
      { name: 'Keeps the example', input: [['Ada', 'Bo', 'Ada']], expected: ['Ada', 'Bo'] },
      { name: 'Keeps one name', input: [['Ada']], expected: ['Ada'] },
      { name: 'Skips empty names', input: [['', 'Bo']], expected: ['Bo'] },
      { name: 'Handles empty input', input: [[]], expected: [] },
      { name: 'Keeps original order', input: [['Z', 'A', 'Z']], expected: ['Z', 'A'] },
    ],
  },
  {
    id: 'transform-active-labels', title: 'Transform active labels', category: 'Data transformation', format: 'transform',
    prompt: 'A UI needs labels for active users. Return their trimmed names in uppercase, in the original order. Skip inactive users and names that become empty after trimming.',
    example: { input: "activeLabels([{ name: ' Ada ', active: true }, { name: 'Bo', active: false }])", output: "['ADA']" },
    note: 'Do not change the input objects. An empty list returns an empty list.',
    vocabulary: [{ term: 'Transform', meaning: 'create a new value from existing data' }, { term: 'Trim', meaning: 'remove surrounding whitespace' }],
    planPrompt: 'Which users should you keep? In what order will you trim, check, and uppercase each name?',
    starter: 'function activeLabels(users: { name: string; active: boolean }[]): string[] {\n  // Return a new list of labels.\n  return []\n}\n',
    functionName: 'activeLabels', hints: ['Visit users in their original order.', 'Skip inactive users; trim a name before checking whether it is empty.', 'Add trimmed.toUpperCase() to a new array.'],
    checks: [
      { name: 'Transforms the example', input: [[{ name: ' Ada ', active: true }, { name: 'Bo', active: false }]], expected: ['ADA'] },
      { name: 'Preserves order', input: [[{ name: ' zoe', active: true }, { name: 'amy ', active: true }]], expected: ['ZOE', 'AMY'] },
      { name: 'Skips blank names', input: [[{ name: '  ', active: true }, { name: 'Li', active: true }]], expected: ['LI'] },
      { name: 'Handles all inactive', input: [[{ name: 'Ada', active: false }]], expected: [] },
      { name: 'Handles empty input', input: [[]], expected: [] },
    ],
  },
]
