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
  {
    id: 'sum-positive-numbers', title: 'Sum positive numbers', category: 'Arrays',
    prompt: 'Return the sum of numbers greater than zero in an array.',
    example: { input: 'sumPositive([-2, 3, 0, 5])', output: '8' },
    note: 'Return 0 for an empty array or when there are no positive numbers.',
    vocabulary: [{ term: 'Positive', meaning: 'greater than zero' }],
    planPrompt: 'What value should the total start at? Which numbers should change it?',
    starter: `function sumPositive(numbers: number[]): number {\n  // Write your solution here\n  return 0\n}\n`, functionName: 'sumPositive',
    hints: ['Start a total at zero.', 'Visit every number and add it only when it is greater than zero.', 'Return the total after the loop.'],
    checks: [
      { name: 'Sums the example', input: [[-2, 3, 0, 5]], expected: 8 }, { name: 'Handles an empty array', input: [[]], expected: 0 },
      { name: 'Ignores zero', input: [[0, 0]], expected: 0 }, { name: 'Ignores negative numbers', input: [[-4, -1]], expected: 0 },
      { name: 'Handles decimals', input: [[1.5, -3, 2.5]], expected: 4 }, { name: 'Handles one positive number', input: [[7]], expected: 7 },
    ],
  },
  {
    id: 'count-even-numbers', title: 'Count even numbers', category: 'Arrays',
    prompt: 'Return how many numbers in an array are even.', example: { input: 'countEvens([1, 2, 4, 7])', output: '2' },
    note: 'Zero and negative even numbers count too.', vocabulary: [{ term: 'Even', meaning: 'divisible by two with no remainder' }],
    planPrompt: 'How can you check whether a number is even? What should the count start at?',
    starter: `function countEvens(numbers: number[]): number {\n  // Write your solution here\n  return 0\n}\n`, functionName: 'countEvens',
    hints: ['Use the remainder operator %.', 'A number is even when number % 2 is zero.', 'Increase a count for each even number.'],
    checks: [
      { name: 'Counts the example', input: [[1, 2, 4, 7]], expected: 2 }, { name: 'Handles an empty array', input: [[]], expected: 0 },
      { name: 'Counts zero', input: [[0]], expected: 1 }, { name: 'Counts negative evens', input: [[-4, -3, -2]], expected: 2 },
      { name: 'Handles all odd numbers', input: [[1, 3, 5]], expected: 0 }, { name: 'Handles repeated evens', input: [[2, 2, 2]], expected: 3 },
    ],
  },
  {
    id: 'first-long-word', title: 'Find the first long word', category: 'Arrays & strings',
    prompt: 'Return the first word whose length is at least the given minimum.', example: { input: "firstLongWord(['cat', 'tiger', 'dog'], 5)", output: "'tiger'" },
    note: 'Return null if no word is long enough. The minimum can be zero.', vocabulary: [{ term: 'At least', meaning: 'greater than or equal to' }],
    planPrompt: 'Why does checking words in their original order matter?',
    starter: `function firstLongWord(words: string[], minimum: number): string | null {\n  // Write your solution here\n  return null\n}\n`, functionName: 'firstLongWord',
    hints: ['Visit the words from left to right.', 'Return immediately when a word has length >= minimum.', 'Return null after the loop if none matched.'],
    checks: [
      { name: 'Finds the example', input: [['cat', 'tiger', 'dog'], 5], expected: 'tiger' }, { name: 'Handles no match', input: [['a', 'bb'], 3], expected: null },
      { name: 'Handles empty words', input: [[], 2], expected: null }, { name: 'Includes exact length', input: [['four'], 4], expected: 'four' },
      { name: 'Keeps original order', input: [['first', 'second'], 3], expected: 'first' }, { name: 'Handles zero minimum', input: [['', 'a'], 0], expected: '' },
    ],
  },
  {
    id: 'count-words', title: 'Count words', category: 'Strings',
    prompt: 'Count words separated by whitespace in a string.', example: { input: "countWords('  code   reps  ')", output: '2' },
    note: 'Spaces, tabs, and newlines separate words. An empty or whitespace-only string has zero words.',
    vocabulary: [{ term: 'Whitespace', meaning: 'spacing characters such as spaces, tabs, and newlines' }],
    planPrompt: 'How will you avoid counting extra spaces as words?',
    starter: `function countWords(text: string): number {\n  // Write your solution here\n  return 0\n}\n`, functionName: 'countWords',
    hints: ['Remove whitespace from both ends first.', 'An empty trimmed string has zero words.', 'Otherwise split on one or more whitespace characters.'],
    checks: [
      { name: 'Counts the example', input: ['  code   reps  '], expected: 2 }, { name: 'Handles an empty string', input: [''], expected: 0 },
      { name: 'Handles only spaces', input: ['   '], expected: 0 }, { name: 'Handles tabs', input: ['a\tb'], expected: 2 },
      { name: 'Handles newlines', input: ['one\ntwo\nthree'], expected: 3 }, { name: 'Handles one word', input: ['hello'], expected: 1 },
    ],
  },
  {
    id: 'has-duplicate', title: 'Find a duplicate', category: 'Arrays & sets',
    prompt: 'Return true if any number appears more than once in the array.', example: { input: 'hasDuplicate([3, 1, 3])', output: 'true' },
    note: 'Return false for an empty array.', vocabulary: [{ term: 'Set', meaning: 'a collection of distinct values' }],
    planPrompt: 'What do you need to remember as you scan each number?',
    starter: `function hasDuplicate(numbers: number[]): boolean {\n  // Write your solution here\n  return false\n}\n`, functionName: 'hasDuplicate',
    hints: ['Keep track of numbers you have seen.', 'If the current number is already in that collection, return true.', 'A Set supports quick membership checks.'],
    checks: [
      { name: 'Finds the example', input: [[3, 1, 3]], expected: true }, { name: 'Handles an empty array', input: [[]], expected: false },
      { name: 'Handles distinct numbers', input: [[1, 2, 3]], expected: false }, { name: 'Finds zero twice', input: [[0, 1, 0]], expected: true },
      { name: 'Finds a negative duplicate', input: [[-2, 1, -2]], expected: true }, { name: 'Handles one number', input: [[5]], expected: false },
    ],
  },
  {
    id: 'missing-number', title: 'Find the missing number', category: 'Arrays',
    prompt: 'An array contains each whole number from 0 to n except one. Return the missing number. The array has length n.',
    example: { input: 'missingNumber([3, 0, 1])', output: '2' }, note: 'The numbers can appear in any order. An empty array is missing 0.',
    vocabulary: [{ term: 'Whole number', meaning: 'zero or a positive number without a fractional part' }],
    planPrompt: 'How can you compare the expected numbers with the numbers you received?',
    starter: `function missingNumber(numbers: number[]): number {\n  // Write your solution here\n  return 0\n}\n`, functionName: 'missingNumber',
    hints: ['The largest possible number is the array length.', 'Find the expected sum from 0 through n.', 'Subtract the sum of the supplied numbers.'],
    checks: [
      { name: 'Finds the example', input: [[3, 0, 1]], expected: 2 }, { name: 'Handles an empty array', input: [[]], expected: 0 },
      { name: 'Finds zero', input: [[1]], expected: 0 }, { name: 'Finds the last number', input: [[0, 1]], expected: 2 },
      { name: 'Handles unordered numbers', input: [[4, 2, 0, 1]], expected: 3 }, { name: 'Handles one zero', input: [[0]], expected: 1 },
    ],
  },
  {
    id: 'valid-parentheses', title: 'Check parentheses', category: 'Stacks',
    prompt: 'Given a string of only opening and closing parentheses, return true when every pair closes in the correct order.',
    example: { input: "validParentheses('(())')", output: 'true' }, note: 'An empty string is valid. A closing parenthesis cannot come before its opening one.',
    vocabulary: [{ term: 'Pair', meaning: 'an opening parenthesis and its matching closing parenthesis' }],
    planPrompt: 'What value will track unclosed parentheses? When should you reject early?',
    starter: `function validParentheses(text: string): boolean {\n  // Write your solution here\n  return false\n}\n`, functionName: 'validParentheses',
    hints: ['Track the number of openings that have not closed.', 'Increase for ( and decrease for ).', 'Reject if the count goes below zero; accept only if it ends at zero.'],
    checks: [
      { name: 'Accepts the example', input: ['(())'], expected: true }, { name: 'Accepts an empty string', input: [''], expected: true },
      { name: 'Rejects an early close', input: [')('], expected: false }, { name: 'Rejects an unclosed open', input: ['(()'], expected: false },
      { name: 'Accepts adjacent pairs', input: ['()()'], expected: true }, { name: 'Rejects one closing parenthesis', input: [')'], expected: false },
    ],
  },
]
