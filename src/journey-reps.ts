import type { Rep } from './rep-types.ts'

export const journeyReps: Rep[] = [
  {
    id: 'count-long-words',
    title: 'Count long words',
    category: 'Arrays & strings',
    prompt:
      'Return how many words are at least the minimum length. Length counts every character, spaces included; words use basic Latin letters. The minimum is 0 or more. Do not change the array. Exactly the minimum length counts; an empty array returns 0.',
    brief: {
      summary: 'Return how many words are at least the minimum length.',
      rules: [
        'Length counts every character, spaces included; words use basic Latin letters.',
        'The minimum is 0 or more.',
        'Do not change the array.',
      ],
      edgeCases: ['Exactly the minimum length counts; an empty array returns 0.'],
    },
    example: { input: "countLongWords(['cat', 'tiger', 'bear'], 4)", output: '2' },
    note: 'In the example, cat is too short, tiger is longer than 4, and bear has exactly 4 letters, so 2 words count. Checks cover no match, spaces inside and around a word, exact length, an empty array, a minimum of 0, and a repeated word, and they detect changes to the array.',
    vocabulary: [{ term: 'At least', meaning: 'greater than or equal to' }],
    planPrompt: 'Before coding, say which words in the example count and why bear is one of them. What does an empty array give?',
    starter: 'function countLongWords(words: string[], minimum: number): number {\n  // Write your solution here\n  return 0\n}\n',
    functionName: 'countLongWords',
    preserveInput: true,
    hints: [
      'A long word can sit anywhere in the array, and a word exactly as long as the minimum counts. In the example, cat is too short, while tiger and bear both reach 4.',
      'Visit every word and count each one whose length is at least the minimum. Do not stop at the first match: the answer depends on the whole array.',
      'Start a count at 0, add 1 for each word that is long enough, and return the count once every word has been visited. An empty array never adds anything, so it returns 0.',
    ],
    checks: [
      { name: 'Counts the example', input: [['cat', 'tiger', 'bear'], 4], expected: 2 },
      { name: 'Returns 0 when no word is long enough', input: [['a', 'bb'], 3], expected: 0 },
      { name: 'Counts the spaces in a word toward its length', input: [['a b', ' hi', 'no'], 3], expected: 2 },
      { name: 'Includes a word of exactly the minimum length', input: [['four'], 4], expected: 1 },
      { name: 'Returns 0 for an empty array', input: [[], 2], expected: 0 },
      { name: 'Counts an empty word when the minimum is 0', input: [['', 'a'], 0], expected: 2 },
      { name: 'Counts a repeated word each time', input: [['hi', 'hi'], 2], expected: 2 },
    ],
  },
  {
    id: 'first-repeated-number',
    title: 'Find the first repeated number',
    category: 'Arrays & sets',
    prompt:
      'Return the first number that occurs a second time, reading the array from left to right. The number whose second occurrence comes first wins, even if another number appeared earlier. Numbers may be zero or negative. Do not change the array. Return null when nothing repeats, including for an empty array.',
    brief: {
      summary: 'Return the first number that occurs a second time, reading the array from left to right.',
      rules: [
        'The number whose second occurrence comes first wins, even if another number appeared earlier.',
        'Numbers may be zero or negative.',
        'Do not change the array.',
      ],
      edgeCases: ['Return null when nothing repeats, including for an empty array.'],
    },
    example: { input: 'firstRepeated([6, 1, 9, 1, 6])', output: '1' },
    note: 'In the example, 6 appears first, but the second 1 comes before the second 6, so the answer is 1. Checks cover an empty array, no repeats, zero, and negative numbers, and they detect changes to the array.',
    vocabulary: [{ term: 'Occurrence', meaning: 'one appearance of a value in the array' }],
    planPrompt: 'Before coding, predict the answer for [2, 5, 5, 2] and say why it is not 2. What should an array with no repeats return?',
    starter: 'function firstRepeated(numbers: number[]): number | null {\n  // Write your solution here\n  return null\n}\n',
    functionName: 'firstRepeated',
    preserveInput: true,
    hints: [
      'You only know that a number repeats when you reach its second occurrence. In the example, the second 1 arrives at index 3, before the second 6 at index 4, so 1 is the answer even though 6 came first.',
      'Read the numbers in order and remember each one you pass. The first number that is already remembered when you reach it is the answer.',
      'Keep the numbers you have passed in a Set. Check it before adding the current number, return the number on a match, and return null once the loop ends.',
    ],
    checks: [
      { name: 'Finds the example', input: [[6, 1, 9, 1, 6]], expected: 1 },
      { name: 'Chooses the earlier second occurrence, not the earlier first one', input: [[1, 2, 2, 1]], expected: 2 },
      { name: 'Returns null for an empty array', input: [[]], expected: null },
      { name: 'Returns null when no number repeats', input: [[1, 2, 3]], expected: null },
      { name: 'Finds a repeated 0', input: [[0, 1, 0]], expected: 0 },
      { name: 'Finds a repeated negative number', input: [[-3, 2, -3]], expected: -3 },
    ],
  },
  {
    id: 'remove-adjacent-pairs',
    title: 'Remove adjacent pairs',
    category: 'Stacks & strings',
    prompt:
      'Return the text left after removing pairs of equal adjacent characters until no pair remains. A removal can create a new pair; remove that too. Comparison is case-sensitive. Text uses basic Latin characters only. Three equal characters in a row leave one.',
    brief: {
      summary: 'Return the text left after removing pairs of equal adjacent characters until no pair remains.',
      rules: [
        'A removal can create a new pair; remove that too.',
        'Comparison is case-sensitive.',
        'Text uses basic Latin characters only.',
      ],
      edgeCases: ['Three equal characters in a row leave one.'],
    },
    example: { input: "removePairs('abbaca')", output: "'ca'" },
    note: 'In the example, removing bb leaves aaca, and removing aa then leaves ca; the characters that remain keep their order. Checks cover empty text, a chain that removes everything, text with no pairs, two pairs side by side, three in a row, and letter case.',
    vocabulary: [{ term: 'Adjacent', meaning: 'next to each other' }],
    planPrompt: 'Before coding, predict the result for abba and for aaa. Why is removing bb from abba not the end?',
    starter: 'function removePairs(text: string): string {\n  // Write your solution here\n  return text\n}\n',
    functionName: 'removePairs',
    hints: [
      'Removing a pair can bring two equal characters together. In abbaca, removing bb leaves aaca, and then aa goes too, leaving ca.',
      'Build the result one character at a time. Each new character either cancels the last character kept, when the two are equal, or is kept after it.',
      'Keep the surviving characters in an array used as a stack. If its top equals the next character, pop it; otherwise push the character. Join what is left at the end.',
    ],
    checks: [
      { name: 'Reduces the example', input: ['abbaca'], expected: 'ca' },
      { name: 'Returns an empty string for empty text', input: [''], expected: '' },
      { name: 'Keeps removing until a whole chain is gone', input: ['abba'], expected: '' },
      { name: 'Leaves text with no equal neighbors unchanged', input: ['abc'], expected: 'abc' },
      { name: 'Removes two pairs side by side', input: ['aabb'], expected: '' },
      { name: 'Leaves one character from three in a row', input: ['aaa'], expected: 'a' },
      { name: 'Treats a and A as different characters', input: ['aA'], expected: 'aA' },
    ],
  },
]
