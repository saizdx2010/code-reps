export type Check = { name: string; input: unknown[]; expected: unknown }
export type Rep = {
  id: string
  title: string
  category: string
  prompt: string
  example: { input: string; output: string }
  note: string
  vocabulary: { term: string; meaning: string }[]
  planPrompt: string
  starter: string
  functionName: string
  hints: string[]
  checks: Check[]
}

export const reps: Rep[] = [
  {
    id: 'most-frequent-number',
    title: 'Find the most frequent number',
    category: 'Arrays & maps',
    prompt: 'Given an array of numbers, return the number that appears most often. If two numbers appear the same number of times, return the smaller number.',
    example: { input: 'mostFrequent([4, 2, 4, 2, 4, 3])', output: '4' },
    note: 'For an empty array, return null. Negative numbers are allowed.',
    vocabulary: [{ term: 'Frequency', meaning: 'how many times a value appears' }, { term: 'Map', meaning: 'a collection that stores values by key for quick lookup' }],
    planPrompt: 'Before coding, what will you count? What happens with an empty array or a tie?',
    starter: `/** Return the most frequent number, or null for an empty array. */\nfunction mostFrequent(numbers: number[]): number | null {\n  // Write your solution here\n  return null\n}\n`,
    functionName: 'mostFrequent',
    hints: [
      'Count how many times each number appears as you visit the array.',
      'Keep the current best number and its count. Update it when a count is higher, or when counts tie and the new number is smaller.',
      'A Map<number, number> can hold the counts. The whole solution can take one pass through the array.',
    ],
    checks: [
      { name: 'Counts the example', input: [[4, 2, 4, 2, 4, 3]], expected: 4 },
      { name: 'Returns null for an empty array', input: [[]], expected: null },
      { name: 'Handles a single number', input: [[7]], expected: 7 },
      { name: 'Chooses the smaller number on a tie', input: [[9, 2, 9, 2]], expected: 2 },
      { name: 'Handles negative numbers', input: [[-3, -1, -3, -1, -1]], expected: -1 },
      { name: 'Counts repeated zeroes', input: [[0, 5, 0, 1, 0]], expected: 0 },
    ],
  },
  {
    id: 'first-unique-character',
    title: 'Find the first unique character',
    category: 'Strings & maps',
    prompt: 'Given a string, return the index of the first character that appears exactly once. Count uppercase and lowercase letters separately.',
    example: { input: "firstUnique('swiss')", output: '1' },
    note: 'Return -1 when no character is unique. An empty string also returns -1.',
    vocabulary: [{ term: 'Index', meaning: 'the zero-based position of a character in a string' }, { term: 'Unique', meaning: 'appearing exactly once' }],
    planPrompt: 'How will you know which characters appear once? How will you keep their original order?',
    starter: `/** Return the index of the first character that occurs once. */\nfunction firstUnique(text: string): number {\n  // Write your solution here\n  return -1\n}\n`,
    functionName: 'firstUnique',
    hints: [
      'First count every character in the string.',
      'Then visit the string in its original order and return the first index with a count of one.',
      'A Map<string, number> works for the counts. Return -1 after the second pass if nothing qualifies.',
    ],
    checks: [
      { name: 'Finds the example', input: ['swiss'], expected: 1 },
      { name: 'Handles an empty string', input: [''], expected: -1 },
      { name: 'Handles all repeated characters', input: ['aabb'], expected: -1 },
      { name: 'Returns the first unique position', input: ['leetcode'], expected: 0 },
      { name: 'Treats letter case separately', input: ['aAbba'], expected: 1 },
      { name: 'Handles spaces as characters', input: ['a a'], expected: 1 },
    ],
  },
  {
    id: 'balanced-brackets',
    title: 'Check balanced brackets',
    category: 'Stacks',
    prompt: 'Given a string containing only (), [], and {}, return true when every opening bracket is closed in the correct order.',
    example: { input: "isBalanced('{[()]}')", output: 'true' },
    note: 'An empty string is balanced. A matching count alone is not enough: order matters.',
    vocabulary: [{ term: 'Stack', meaning: 'a collection where the last item added is the first one removed' }, { term: 'Balanced', meaning: 'every opening bracket has a matching closing bracket in the right order' }],
    planPrompt: 'What should happen when you see an opening bracket? What must match when you see a closing one?',
    starter: `/** Return whether all brackets close in the correct order. */\nfunction isBalanced(text: string): boolean {\n  // Write your solution here\n  return false\n}\n`,
    functionName: 'isBalanced',
    hints: [
      'Save each opening bracket as you scan from left to right.',
      'For a closing bracket, compare it with the most recent unmatched opening bracket.',
      'Use an array as a stack. At the end, it must be empty.',
    ],
    checks: [
      { name: 'Accepts the example', input: ['{[()]}'], expected: true },
      { name: 'Accepts an empty string', input: [''], expected: true },
      { name: 'Rejects the wrong closing order', input: ['([)]'], expected: false },
      { name: 'Rejects an unmatched opening bracket', input: ['(()'], expected: false },
      { name: 'Rejects an unmatched closing bracket', input: [']'], expected: false },
      { name: 'Accepts adjacent pairs', input: ['()[]{}'], expected: true },
    ],
  },
]
