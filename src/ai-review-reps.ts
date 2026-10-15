import { lines } from './rep-helpers.ts'
import type { Rep } from './rep-types.ts'

// Reviewing suggested code: a draft that skips the empty and invalid cases (guided), a draft that calls a method
// JavaScript does not have (independent), and a case table that separates a correct median from plausible wrong
// suggestions (recall). The suggestions are authored drafts, not output from a live tool.

const averageStarter = lines(
  '// Suggested draft: "Returns the average rating to one decimal place."',
  '// Check it against the contract before trusting it.',
  'function averageRating(ratings: number[]): number | null {',
  '  const total = ratings.reduce((sum, rating) => sum + rating)',
  '  return Math.round((total / ratings.length) * 10) / 10',
  '}',
)

const titleStarter = lines(
  '// Suggested draft: "Capitalizes each word of the text."',
  '// It looks reasonable. Run it before trusting it.',
  'function titleCase(text: string): string {',
  "  return text.split(' ').map(word => word.capitalize()).join(' ')",
  '}',
)

const medianStarter = lines(
  'type Case = { values: number[]; expected: number | null }',
  'type Median = (values: number[]) => number | null',
  '',
  '// Supplied. "correct" follows the contract; the others are suggestions with one plausible mistake each.',
  'const implementations: Record<string, Median> = {',
  '  correct: values => {',
  '    if (values.length === 0) return null',
  '    const sorted = [...values].sort((a, b) => a - b)',
  '    const middle = Math.floor(sorted.length / 2)',
  '    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2',
  '  },',
  "  'suggestion-a': values => {",
  '    if (values.length === 0) return null',
  '    const sorted = [...values].sort()',
  '    const middle = Math.floor(sorted.length / 2)',
  '    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2',
  '  },',
  "  'suggestion-b': values => {",
  '    if (values.length === 0) return null',
  '    const sorted = [...values].sort((a, b) => a - b)',
  '    return sorted[Math.floor(sorted.length / 2)]',
  '  },',
  "  'suggestion-c': values => {",
  '    if (values.length === 0) return null',
  '    const sorted = values.sort((a, b) => a - b)',
  '    const middle = Math.floor(sorted.length / 2)',
  '    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2',
  '  },',
  "  'suggestion-d': values => {",
  '    const sorted = [...values].sort((a, b) => a - b)',
  '    const middle = Math.floor(sorted.length / 2)',
  '    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2',
  '  },',
  '}',
  '',
  '// 1. Work out each expected median by hand from the contract.',
  'const cases: Case[] = [',
  '  // { values: [3, 1, 2], expected: 2 },',
  ']',
  '',
  '// 2. Run every case against implementations[variant]. Return true as soon as one case fails.',
  'function exposes(variant: string): boolean {',
  '  return false',
  '}',
)

export const aiReviewReps: Rep[] = [
  {
    id: 'ai-empty-input-suggestion',
    title: 'Reject a suggestion that skips the empty case',
    category: 'AI-era coding',
    format: 'debug',
    context:
      'A coding assistant suggested averageRating for a product page. It works on the example in the ticket, and the reviewer is about to approve it. Your job is to check it against the whole contract first.',
    prompt:
      'Repair averageRating. Use only ratings that are whole numbers from 1 to 5 and ignore every other value. Return their average rounded to one decimal place, with halves rounded up, or null when no valid rating remains. Do not change ratings.',
    example: { input: 'averageRating([5, 4, 0, 4])', output: '4.3' },
    note: 'ratings has 0 to 1000 numbers, which may include 0, negatives, fractions such as 4.5, and values above 5. A rating of 0 means “not rated” and is ignored like any other invalid value.',
    vocabulary: [
      { term: 'Suggested draft', meaning: 'code proposed by a tool or teammate that has not been verified yet' },
      { term: 'Valid rating', meaning: 'a whole number from 1 to 5' },
    ],
    planPrompt:
      'Before running anything, trace the draft on [] and on [5, 4, 0, 4]. Write what it returns and which sentence of the contract it breaks.',
    starter: averageStarter,
    functionName: 'averageRating',
    preserveInput: true,
    hints: [
      'reduce with no starting value throws on an empty array. The draft also averages values the contract says to ignore.',
      'Filter the valid ratings first, then decide what to return when none are left.',
      'Keep values where Number.isInteger(value) and 1 <= value <= 5. Return null when that list is empty; otherwise round total / count to one decimal place.',
    ],
    checks: [
      { name: 'Ignores a zero rating', input: [[5, 4, 0, 4]], expected: 4.3 },
      { name: 'Empty list returns null', input: [[]], expected: null },
      { name: 'Only invalid ratings return null', input: [[0, 6, -1, 4.5]], expected: null },
      { name: 'Rounds to one decimal place', input: [[5, 4, 4]], expected: 4.3 },
      { name: 'Rounds a half up', input: [[1, 2, 2, 2]], expected: 1.8 },
      { name: 'A whole-number average', input: [[3, 5]], expected: 4 },
      { name: 'Ignores fractions and values above 5', input: [[5, 5.5, 10, 1]], expected: 3 },
      { name: 'One valid rating', input: [[2]], expected: 2 },
    ],
  },
  {
    id: 'ai-invented-api',
    title: 'Replace a method JavaScript does not have',
    category: 'AI-era coding',
    format: 'debug',
    context:
      'A suggested helper for a heading component reads naturally and even type-checks in the editor of the person who pasted it, because their project declares extra methods. In this project it fails the first time it runs.',
    prompt:
      'Repair titleCase using only standard JavaScript. Split text into words on runs of whitespace, ignoring whitespace at either end. Write each word with its first character in uppercase and the rest in lowercase, and join the words with single spaces. Text with no words returns an empty string.',
    example: { input: "titleCase('  hello   WORLD ')", output: "'Hello World'" },
    note: 'text has 0 to 1000 printable ASCII characters, spaces, and tabs. A word is any run of non-whitespace characters, so punctuation stays inside its word.',
    vocabulary: [
      { term: 'Invented API', meaning: 'a method or function that looks plausible but does not exist in the language or library' },
      { term: 'Whitespace', meaning: 'characters that show as empty space, such as spaces and tabs' },
    ],
    planPrompt: 'Run the draft once and copy the exact error. Which call does not exist, and which other step also breaks the contract?',
    starter: titleStarter,
    functionName: 'titleCase',
    hints: [
      'Strings have toUpperCase, toLowerCase, slice, and trim, but no capitalize method.',
      'Splitting on a single space produces empty words when spaces repeat, and it does not split on tabs.',
      'Trim the text, split it on /\\s+/, return an empty string for blank text, and build each word from its first character uppercased plus the rest lowercased.',
    ],
    checks: [
      { name: 'Capitalizes two words', input: ['hello world'], expected: 'Hello World' },
      { name: 'Collapses extra spaces', input: ['  hello   WORLD '], expected: 'Hello World' },
      { name: 'Lowercases the rest of each word', input: ['mIXed CASE'], expected: 'Mixed Case' },
      { name: 'Empty text', input: [''], expected: '' },
      { name: 'Only whitespace', input: [' \t '], expected: '' },
      { name: 'Tabs separate words', input: ['one\ttwo'], expected: 'One Two' },
      { name: 'Punctuation stays inside a word', input: ["o'neil and co."], expected: "O'neil And Co." },
      { name: 'One letter', input: ['a'], expected: 'A' },
    ],
  },
  {
    id: 'ai-expose-wrong-median',
    title: 'Write cases that reject plausible medians',
    category: 'AI-era coding',
    format: 'backend',
    context:
      'Four suggested median functions all pass the single example in the ticket. Each hides one plausible mistake. Your cases decide which suggestion is safe to merge, and you work out every expected answer by hand from the contract.',
    prompt:
      'Fill the cases table and write exposes(variant). median(values) returns the middle value of the numbers in increasing numeric order. With an even count it returns the average of the two middle values, and with no values it returns null. It never changes values. In exposes, give each run its own copy of the values, compare the result with the expected value, and compare the copy with the original after the call. Return true as soon as one case fails and false when every case passes. exposes("correct") must be false, and every suggestion must be true.',
    brief: {
      summary: 'Write cases for median and an exposes(variant) function that runs them against one named implementation.',
      rules: [
        'median(values) returns the middle value in increasing numeric order.',
        'With an even count it returns the average of the two middle values; with no values it returns null.',
        'median never changes values.',
        'exposes(variant) runs each case on a fresh copy and returns true as soon as the result or the copy is wrong.',
        'exposes("correct") must be false, and every suggestion must be true.',
      ],
      edgeCases: ['A suggestion can return the right median and still change its input, so compare the copy after each call.'],
    },
    example: {
      input: "cases: [{ values: [3, 1, 2], expected: 2 }]; exposes('suggestion-b')",
      output: 'false: that case alone does not expose it',
    },
    note: 'Variants are chosen by name because checks pass plain values to your function. These checks establish only that your cases tell the supplied suggestions apart. They do not establish that your table is complete.',
    acceptanceCriteria: [
      'Name the mistake in each suggestion and the case that exposes it.',
      'Explain why the example in the ticket did not expose any of them.',
    ],
    vocabulary: [
      { term: 'Median', meaning: 'the middle value of sorted numbers, or the average of the two middle values' },
      { term: 'Numeric order', meaning: 'ordering by value, so 9 comes before 10' },
    ],
    planPrompt:
      'For each sentence of the contract, write one input a careless version could get wrong. Which input would sorting by text get wrong?',
    starter: medianStarter,
    functionName: 'exposes',
    hints: [
      'Read each suggestion against the contract one line at a time: sorting, the even case, the empty case, and the input.',
      'Default sort compares values as text, so 10 sorts before 9. An odd-length example cannot show an even-count mistake.',
      'Include an even-length case, an empty case, and a case with numbers of different digit lengths. Run each case on [...c.values] and compare JSON.stringify of the copy with the original.',
    ],
    checks: [
      { name: 'Your cases accept the correct version', input: ['correct'], expected: false },
      { name: 'Exposes suggestion A', input: ['suggestion-a'], expected: true },
      { name: 'Exposes suggestion B', input: ['suggestion-b'], expected: true },
      { name: 'Exposes suggestion C', input: ['suggestion-c'], expected: true },
      { name: 'Exposes suggestion D', input: ['suggestion-d'], expected: true },
    ],
  },
]
