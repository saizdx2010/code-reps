export const rep = {
  id: 'most-frequent-number',
  title: 'Find the most frequent number',
  prompt: 'Given an array of numbers, return the number that appears most often. If two numbers appear the same number of times, return the smaller number.',
  example: { input: 'mostFrequent([4, 2, 4, 2, 4, 3])', output: '4' },
  note: 'For an empty array, return null. Negative numbers are allowed.',
  starter: `/** Return the most frequent number, or null for an empty array. */\nfunction mostFrequent(numbers: number[]): number | null {\n  // Write your solution here\n  return null\n}\n`,
  hints: [
    'Count how many times each number appears as you visit the array.',
    'Keep the current best number and its count. Update it when a count is higher, or when counts tie and the new number is smaller.',
    'A Map<number, number> can hold the counts. The whole solution can take one pass through the array.',
  ],
  checkCount: 6,
} as const
