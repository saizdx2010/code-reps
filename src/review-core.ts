import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Core, journey, and transfer reps.
export const coreDepth: Record<string, RepDepth> = {
  'most-frequent-number': {
    reasoning: 'A winner depends on final frequency and an explicit tie rule, not first appearance.',
    trace: 'For [9,2,9,2], counts finish at 9:2 and 2:2; choose 2 because it is smaller. Empty input has no winner.',
    alternative:
      'Count then select separates responsibilities. Online best tracking can also work if every update handles ties; repeated counting scans can become quadratic.',
    counterexample: 'Keeping the first maximum gives 9 on the tie case. Using zero as an empty sentinel confuses a valid winning zero.',
    transfer: 'Change ties to earliest original occurrence. Explain which extra information must be retained.',
  },
  'first-unique-character': {
    reasoning: 'Uniqueness requires knowledge of later occurrences, while first requires original order.',
    trace: 'In swiss, s occurs three times, w once and i once. Scan from index zero: s fails, w succeeds at index 1.',
    alternative:
      'A frequency map plus a second scan is expected linear time. Comparing first and last positions is compact but repeated searches can be quadratic.',
    counterexample: 'Returning the first character not yet seen accepts s before discovering its later repetitions.',
    transfer: 'Return every unique character in original order. Keep the basic Latin assumption explicit.',
  },
  'balanced-brackets': {
    reasoning: 'Nested structure must close the latest unmatched opening first.',
    trace: 'For ([)], push (, push [, then ) expects ( but the top is [. Reject before reaching the final ].',
    traceSteps: {
      code: [
        'function isBalanced(text: string): boolean {',
        '  const stack: string[] = []',
        "  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }",
        '  for (const character of text) {',
        "    if (character === '(' || character === '[' || character === '{') stack.push(character)",
        '    else if (stack.pop() !== pairs[character]) return false',
        '  }',
        '  return stack.length === 0',
        '}',
      ],
      input: "text = '([)]'",
      steps: [
        {
          line: 1,
          vars: { text: '([)]' },
          structure: { kind: 'stack', values: [] },
          note: 'Start with an empty stack for opening brackets that are still waiting for a closing bracket.',
        },
        {
          line: 3,
          vars: { character: '(' },
          structure: { kind: 'stack', values: [] },
          note: 'Read the first character, an opening bracket.',
        },
        { line: 4, vars: { character: '(' }, structure: { kind: 'stack', values: ['('] }, note: 'Save the opening bracket on the stack.' },
        {
          line: 3,
          vars: { character: '[' },
          structure: { kind: 'stack', values: ['('] },
          note: 'Read the next character, another opening bracket.',
        },
        {
          line: 4,
          vars: { character: '[' },
          structure: { kind: 'stack', values: ['(', '['] },
          note: 'The newer [ sits on top, so it must be closed before the (.',
        },
        {
          line: 3,
          vars: { character: ')' },
          structure: { kind: 'stack', values: ['(', '['] },
          note: 'Read ). It must match the most recent unmatched opening bracket.',
        },
        {
          line: 5,
          vars: { character: ')' },
          structure: { kind: 'stack', values: ['('] },
          note: 'Removing [ leaves ( on the stack. ) needs (, so the two do not match and the function rejects here.',
        },
        {
          line: 5,
          vars: { character: ')', result: false },
          structure: { kind: 'stack', values: ['('] },
          note: 'The function returns false before reading the final ]. Both bracket types appear twice, but the order is wrong.',
        },
      ],
    },
    alternative:
      'A stack handles several bracket types. A single counter suffices for one type but loses the opening type and nesting order here.',
    counterexample: '([)] has matching counts for each type but is not balanced.',
    transfer: 'Allow non-bracket text to be ignored. State that new rule and test a mixed-text expression.',
  },
  'sum-positive-numbers': {
    traceSteps: {
      code: [
        'function sumPositive(numbers: number[]): number {',
        '  let sum = 0',
        '  for (let i = 0; i < numbers.length; i++) {',
        '    if (numbers[i] > 0) sum += numbers[i]',
        '  }',
        '  return sum',
        '}',
      ],
      input: 'numbers = [-2, 3, 0, 5]',
      steps: [
        {
          line: 2,
          vars: { sum: 0 },
          structure: { kind: 'array', values: [-2, 3, 0, 5] },
          note: 'The total starts at 0. No position has been checked yet.',
        },
        {
          line: 3,
          vars: { sum: 0, i: 0 },
          structure: { kind: 'array', values: [-2, 3, 0, 5], pointers: { i: 0 } },
          note: 'Index 0 holds -2. It is not above 0, so the total stays 0.',
        },
        {
          line: 3,
          vars: { sum: 0, i: 1 },
          structure: { kind: 'array', values: [-2, 3, 0, 5], pointers: { i: 1 }, dimmed: [0] },
          note: 'Index 1 holds 3. It is above 0, so 3 will be added to the total.',
        },
        {
          line: 3,
          vars: { sum: 3, i: 2 },
          structure: { kind: 'array', values: [-2, 3, 0, 5], pointers: { i: 2 }, dimmed: [0, 1] },
          note: 'Index 2 holds 0. Zero is not above 0, so the total stays 3.',
        },
        {
          line: 3,
          vars: { sum: 3, i: 3 },
          structure: { kind: 'array', values: [-2, 3, 0, 5], pointers: { i: 3 }, dimmed: [0, 1, 2] },
          note: 'Index 3 holds 5. It is above 0, so 5 will be added to the total.',
        },
        {
          line: 5,
          vars: { sum: 8, result: 8 },
          structure: { kind: 'array', values: [-2, 3, 0, 5], dimmed: [0, 1, 2, 3] },
          note: 'Every index has been checked. Return the total, 8.',
        },
      ],
    },
    reasoning:
      'After each visit, the total equals the sum of the positive values seen so far. It starts at 0, which is the right answer for an empty array, and only a positive value changes it.',
    trace:
      'For the example [-2, 3, 0, 5], the total stays 0 at -2, becomes 3, stays 3 at 0, and becomes 8. An empty array never enters the loop, so the starting 0 is returned.',
    alternative:
      'A loop keeps only a total; filter then reduce creates a selected array first. A reducer without an initial value throws on an empty array.',
    counterexample:
      'Returning inside the loop after the first positive gives 3 instead of 8 for the example. Emptying the array with shift() as you go gives the right sum, but the caller is left with an empty array, which the checks report.',
    transfer: 'Sum prices only when a record is available. Explain how the invariant changes from numbers to records.',
  },
  'count-even-numbers': {
    traceSteps: {
      code: [
        'function countEvens(numbers: number[]): number {',
        '  let count = 0',
        '  for (let i = 0; i < numbers.length; i++) {',
        '    if (numbers[i] % 2 === 0) count++',
        '  }',
        '  return count',
        '}',
      ],
      input: 'numbers = [-3, 4, 0, 7]',
      steps: [
        {
          line: 1,
          vars: { count: 0 },
          structure: { kind: 'array', values: [-3, 4, 0, 7] },
          note: 'The count starts at 0. No number has been checked yet.',
        },
        {
          line: 3,
          vars: { count: 0, i: 0, remainder: -1 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], pointers: { i: 0 } },
          note: '-3 % 2 is -1 in JavaScript, not 1. It is not 0, so -3 is odd and the count stays 0.',
        },
        {
          line: 3,
          vars: { count: 1, i: 1, remainder: 0 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], pointers: { i: 1 }, dimmed: [0] },
          note: '4 % 2 is 0, so 4 is even. The count goes from 0 to 1.',
        },
        {
          line: 3,
          vars: { count: 2, i: 2, remainder: 0 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], pointers: { i: 2 }, dimmed: [0, 1] },
          note: '0 % 2 is 0, so zero is even too. The count goes from 1 to 2.',
        },
        {
          line: 3,
          vars: { count: 2, i: 3, remainder: 1 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], pointers: { i: 3 }, dimmed: [0, 1, 2] },
          note: '7 % 2 is 1, so 7 is odd. The count stays 2.',
        },
        {
          line: 2,
          vars: { count: 2, i: 4 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], dimmed: [0, 1, 2, 3] },
          note: 'i is 4, which is not less than the 4 numbers, so the loop stops.',
        },
        {
          line: 5,
          vars: { count: 2, result: 2 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], dimmed: [0, 1, 2, 3] },
          note: 'Return 2. The array itself was only read, never changed.',
        },
      ],
    },
    reasoning:
      'The count is the number of values seen so far whose remainder after dividing by 2 is 0. Zero and negative even numbers leave a remainder of 0 too, so one test covers every case.',
    trace:
      'For the example [-3, 4, 0, 7], the remainders are -1, 0, 0, and 1, so the count goes 0, 1, 2, 2 and the result is 2. An empty array returns the starting 0.',
    alternative: 'A loop uses constant working memory; filtering and reading length builds an array. Both inspect every input.',
    counterexample:
      'Testing n % 2 !== 1 counts -3 as even, because -3 % 2 is -1, so the example returns 3 instead of 2. Counting distinct values with a Set returns 1 instead of 3 for [2, 2, 2].',
    transfer: 'Count numbers divisible by a supplied nonzero divisor. Define the zero-divisor contract first.',
  },
  'count-above-threshold': {
    traceSteps: {
      code: [
        'function countAbove(numbers: number[], limit: number): number {',
        '  let count = 0',
        '  for (let i = 0; i < numbers.length; i++) {',
        '    if (numbers[i] > limit) count++',
        '  }',
        '  return count',
        '}',
      ],
      input: 'numbers = [2, 7, 7, 10], limit = 7',
      steps: [
        {
          line: 1,
          vars: { limit: 7, count: 0 },
          structure: { kind: 'array', values: [2, 7, 7, 10] },
          note: 'The count starts at 0. Only values strictly above 7 will raise it.',
        },
        {
          line: 3,
          vars: { limit: 7, count: 0, i: 0 },
          structure: { kind: 'array', values: [2, 7, 7, 10], pointers: { i: 0 } },
          note: '2 is not above 7. The count stays 0.',
        },
        {
          line: 3,
          vars: { limit: 7, count: 0, i: 1 },
          structure: { kind: 'array', values: [2, 7, 7, 10], pointers: { i: 1 }, dimmed: [0] },
          note: '7 equals the limit. Equal is not above, so the count stays 0.',
        },
        {
          line: 3,
          vars: { limit: 7, count: 0, i: 2 },
          structure: { kind: 'array', values: [2, 7, 7, 10], pointers: { i: 2 }, dimmed: [0, 1] },
          note: 'The second 7 also equals the limit. The count stays 0.',
        },
        {
          line: 3,
          vars: { limit: 7, count: 1, i: 3 },
          structure: { kind: 'array', values: [2, 7, 7, 10], pointers: { i: 3 }, dimmed: [0, 1, 2] },
          note: '10 is above 7. The count goes from 0 to 1.',
        },
        {
          line: 2,
          vars: { limit: 7, count: 1, i: 4 },
          structure: { kind: 'array', values: [2, 7, 7, 10], dimmed: [0, 1, 2, 3] },
          note: 'i is 4, which is not less than the 4 values, so the loop stops.',
        },
        {
          line: 5,
          vars: { limit: 7, count: 1, result: 1 },
          structure: { kind: 'array', values: [2, 7, 7, 10], dimmed: [0, 1, 2, 3] },
          note: 'Return 1. With >= the two 7s would have counted too, giving 3.',
        },
      ],
    },
    reasoning:
      'A strict comparison leaves values equal to the limit out, and visiting every value means each match is counted once per occurrence, repeats included.',
    trace:
      'For the example [2, 7, 7, 10] with limit 7, the count stays 0 at 2 and at both 7s, because equal is not above, and becomes 1 at 10. An empty array returns the starting 0.',
    alternative: 'A loop avoids allocating selected values; filter is concise when the selected values are also needed.',
    counterexample:
      'Using >= counts both 7s and returns 3 instead of 1. Removing duplicates with a Set first counts 6 once in [4, 6, 6, 8] above 3 and returns 3 instead of 4. Sorting the array to stop early changes the caller’s array.',
    transfer: 'Count values within a range. Specify whether both endpoints are included before choosing operators.',
  },
  'first-long-word': {
    traceSteps: {
      code: [
        'function firstLongWord(words: string[], minimum: number): string | null {',
        '  for (let i = 0; i < words.length; i++) {',
        '    if (words[i].length >= minimum) return words[i]',
        '  }',
        '  return null',
        '}',
      ],
      input: "words = ['cat', 'tiger', 'dog'], minimum = 5",
      steps: [
        {
          line: 0,
          vars: { minimum: 5 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'dog'] },
          note: 'Look for the first word with at least 5 characters, from left to right.',
        },
        {
          line: 1,
          vars: { minimum: 5, i: 0 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'dog'], pointers: { i: 0 } },
          note: 'Start at index 0, the first word.',
        },
        {
          line: 2,
          vars: { minimum: 5, i: 0, length: 3 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'dog'], pointers: { i: 0 } },
          note: 'cat has 3 characters, fewer than 5. Keep looking.',
        },
        {
          line: 1,
          vars: { minimum: 5, i: 1 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'dog'], pointers: { i: 1 }, dimmed: [0] },
          note: 'Move to index 1.',
        },
        {
          line: 2,
          vars: { minimum: 5, i: 1, length: 5 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'dog'], pointers: { i: 1 }, dimmed: [0] },
          note: 'tiger has exactly 5 characters. At least 5 includes 5, so it qualifies.',
        },
        {
          line: 2,
          vars: { minimum: 5, i: 1, result: 'tiger' },
          structure: { kind: 'array', values: ['cat', 'tiger', 'dog'], pointers: { i: 1 }, dimmed: [0] },
          note: 'Return tiger at once. dog is never read: a later word cannot change which one came first.',
        },
      ],
    },
    reasoning: 'First-match search may stop early because later items cannot change the earliest result.',
    trace:
      'For the example, cat has 3 characters, fewer than 5. tiger has exactly 5, so it is returned and dog is never read. With a minimum of 0 the first word qualifies at once, even when it is empty.',
    alternative:
      'find is concise but its absent result is undefined, so adapt it to null. Filtering all words does unnecessary work for a first-match task.',
    counterexample:
      'Using > skips tiger, because 5 is not more than 5, and returns null for the example. Sorting the words by length first returns moon instead of planet for [planet, moon, galaxy] with minimum 4, and it changes the caller’s array.',
    transfer: 'Search records for the first available item at a price limit. Explain the stopping condition.',
  },
  'count-words': {
    traceSteps: {
      code: [
        'function countWords(text: string): number {',
        '  let count = 0',
        '  let inWord = false',
        '  for (let i = 0; i < text.length; i++) {',
        '    if (/\\s/.test(text[i])) inWord = false',
        '    else if (!inWord) { inWord = true; count++ }',
        '  }',
        '  return count',
        '}',
      ],
      input: "text = ' ab  c '",
      steps: [
        {
          line: 3,
          vars: { count: 0, inWord: false },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'] },
          note: 'Each box is one character, and ␣ stands for a space. Start with zero words and no word open.',
        },
        {
          line: 4,
          vars: { count: 0, inWord: false, i: 0 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 0 } },
          note: 'The first character is a space. A space before a word does not start a word.',
        },
        {
          line: 5,
          vars: { count: 0, inWord: false, i: 1 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 1 }, dimmed: [0] },
          note: 'a is not a space and no word is open, so a new word starts. Count will go from 0 to 1.',
        },
        {
          line: 4,
          vars: { count: 1, inWord: true, i: 2 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 2 }, dimmed: [0, 1] },
          note: 'b is not a space and a word is already open, so count stays at 1.',
        },
        {
          line: 4,
          vars: { count: 1, inWord: true, i: 3 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 3 }, dimmed: [0, 1, 2] },
          note: 'This space ends the word, so inWord becomes false.',
        },
        {
          line: 4,
          vars: { count: 1, inWord: false, i: 4 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 4 }, dimmed: [0, 1, 2, 3] },
          note: 'Another space. Repeated spaces do not add words.',
        },
        {
          line: 5,
          vars: { count: 1, inWord: false, i: 5 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 5 }, dimmed: [0, 1, 2, 3, 4] },
          note: 'c starts a second word. Count will go from 1 to 2.',
        },
        {
          line: 4,
          vars: { count: 2, inWord: true, i: 6 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 6 }, dimmed: [0, 1, 2, 3, 4, 5] },
          note: 'The trailing space ends the second word. Count stays at 2.',
        },
        {
          line: 7,
          vars: { count: 2, inWord: false, result: 2 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], dimmed: [0, 1, 2, 3, 4, 5, 6] },
          note: 'Every character has been checked. Return the count, 2.',
        },
      ],
    },
    reasoning: 'Whitespace runs are separators, not words, and blank text needs an explicit zero result.',
    trace: 'Trim spaces around Ada followed by a tab and Bo; splitting the remaining text on whitespace yields [Ada,Bo], so return 2.',
    alternative: 'Splitting is clear but allocates words. A character scan can count transitions into words using constant working space.',
    counterexample: 'Splitting only on a single space misses tabs and can count empty pieces from repeated spaces.',
    transfer: 'Count words without allocating a word array. Describe the state needed while scanning.',
  },
  'has-duplicate': {
    traceSteps: {
      code: [
        'function hasDuplicate(numbers: number[]): boolean {',
        '  const seen = new Map<number, number>()',
        '  for (let i = 0; i < numbers.length; i++) {',
        '    if (seen.has(numbers[i])) return true',
        '    seen.set(numbers[i], i)',
        '  }',
        '  return false',
        '}',
      ],
      input: 'numbers = [4, 0, -1, 4]',
      steps: [
        {
          line: 1,
          vars: {},
          structure: { kind: 'map', entries: [] },
          note: 'Start with an empty map. Each number seen so far is stored with the index where it first appeared.',
        },
        {
          line: 3,
          vars: { i: 0 },
          structure: { kind: 'map', entries: [] },
          note: '4 is not in the map, so it is not a duplicate. It is stored next.',
        },
        {
          line: 3,
          vars: { i: 1 },
          structure: { kind: 'map', entries: [['4', 0]] },
          note: '0 is not in the map yet, so it is new. It is stored with index 1.',
        },
        {
          line: 3,
          vars: { i: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['4', 0],
              ['0', 1],
            ],
          },
          note: '-1 is new too. Negative numbers are stored the same way as any other number.',
        },
        {
          line: 3,
          vars: { i: 3 },
          structure: {
            kind: 'map',
            entries: [
              ['4', 0],
              ['0', 1],
              ['-1', 2],
            ],
          },
          note: '4 is already in the map, stored at index 0. This is a repeat, so this line returns true.',
        },
        {
          line: 3,
          vars: { i: 3, result: true },
          structure: {
            kind: 'map',
            entries: [
              ['4', 0],
              ['0', 1],
              ['-1', 2],
            ],
          },
          note: 'The function returns true right away. Later numbers are not checked.',
        },
      ],
    },
    reasoning: 'Before each visit, seen contains exactly the values in the visited prefix.',
    trace: 'For [5,2,2], save 5, save 2, then find 2 already saved and return true.',
    alternative: 'A Set uses expected efficient lookup and O(k) space; nested comparisons avoid a Set but can take quadratic time.',
    counterexample: 'Adding before testing membership makes the very first value appear duplicated.',
    transfer: 'Detect duplicates by record ID instead of object identity. Explain which key enters the Set.',
  },
  'missing-number': {
    reasoning: 'The complete range is determined by length, under the guaranteed no-duplicate contract.',
    trace: 'For [3,0,1], n is 3, expected sum is 6 and actual sum is 4; missing is 2. [] gives zero.',
    alternative:
      'A Set makes membership visible but uses O(n) storage. Sum subtraction uses constant storage; safe numeric range matters if the contract expands.',
    counterexample: 'Treating the maximum supplied value as n fails when n itself is missing, such as [0,1].',
    transfer: 'Now permit duplicate inputs. Explain why the sum argument no longer proves one missing value and define validation.',
  },
  'valid-parentheses': {
    reasoning: 'Every prefix must have at least as many openings as closings, and the final balance must be zero.',
    trace: 'For )(, the first close makes balance negative, so reject immediately even though the final counts match.',
    alternative: 'A counter is enough for one bracket type; a stack uses more storage but generalizes to multiple types.',
    counterexample: 'Checking only final balance incorrectly accepts )(.',
    transfer: 'Extend to multiple bracket types. Explain exactly what information the counter loses.',
  },
  'count-long-words': {
    reasoning: 'The running count describes all qualifying words already visited.',
    trace: 'For [a,code,longer] and minimum 4, counts are 0,1,2. Minimum zero includes even an empty word.',
    alternative:
      'A loop needs constant storage; filter allocates matches. Reading basic Latin string length is not a general grapheme count.',
    counterexample: 'Using > excludes a word exactly at the minimum.',
    transfer: 'Count matching records with two conditions. Write an invariant that includes both requirements.',
  },
  'first-repeated-number': {
    reasoning: 'The earliest second occurrence determines the result, not the earliest first occurrence.',
    trace: 'For [8,3,3,8], seen grows to {8,3}; the next 3 repeats before the final 8, so return 3.',
    traceSteps: {
      code: [
        'function firstRepeated(numbers: number[]): number | null {',
        '  const seen = new Set<number>()',
        '  for (let index = 0; index < numbers.length; index++) {',
        '    const value = numbers[index]',
        '    if (seen.has(value)) return value',
        '    seen.add(value)',
        '  }',
        '  return null',
        '}',
      ],
      input: 'numbers = [8, 3, 3, 8]',
      steps: [
        {
          line: 1,
          vars: { seen: '{}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 0 } },
          note: 'Start with an empty Set and the first position.',
        },
        {
          line: 2,
          vars: { index: 0, seen: '{}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 0 } },
          note: 'Move to the first position.',
        },
        {
          line: 3,
          vars: { index: 0, value: 8, seen: '{}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 0 } },
          note: 'The value is 8. The Set is empty, so it is not a repeat.',
        },
        {
          line: 5,
          vars: { index: 0, value: 8, seen: '{8}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 0 } },
          note: 'Remember 8 for the positions after it.',
        },
        {
          line: 2,
          vars: { index: 1, seen: '{8}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 1 }, dimmed: [0] },
          note: 'Move to the second position.',
        },
        {
          line: 3,
          vars: { index: 1, value: 3, seen: '{8}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 1 }, dimmed: [0] },
          note: 'The value is 3. It is not in the Set yet, so it is not a repeat.',
        },
        {
          line: 5,
          vars: { index: 1, value: 3, seen: '{8, 3}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 1 }, dimmed: [0] },
          note: 'Remember 3.',
        },
        {
          line: 2,
          vars: { index: 2, seen: '{8, 3}' },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 2 }, dimmed: [0, 1] },
          note: 'Move to the third position.',
        },
        {
          line: 4,
          vars: { index: 2, value: 3, seen: '{8, 3}', result: 3 },
          structure: { kind: 'array', values: [8, 3, 3, 8], pointers: { current: 2 }, dimmed: [0, 1] },
          note: '3 is already in the Set, so this is its second occurrence. The later 8 is never reached because the function has returned 3.',
        },
      ],
    },
    alternative:
      'A Set scan can stop immediately. Computing frequencies then taking the first duplicated value selects a different notion of first.',
    counterexample: 'The frequency-first approach returns 8 on [8,3,3,8], violating second-occurrence ordering.',
    transfer: 'Return the index of the first repeated occurrence instead of its value.',
  },
  'remove-adjacent-pairs': {
    reasoning: 'The stack holds the reduced visited prefix, so its top is the only possible match for the next character.',
    trace: 'For abba, save a, save b, remove b on the next b, then remove a. The result is empty.',
    traceSteps: {
      code: [
        'function removePairs(text: string): string {',
        '  const stack: string[] = []',
        '  for (const character of text) {',
        '    if (stack[stack.length - 1] === character) stack.pop()',
        '    else stack.push(character)',
        '  }',
        "  return stack.join('')",
        '}',
      ],
      input: "text = 'abba'",
      steps: [
        {
          line: 1,
          vars: { text: 'abba' },
          structure: { kind: 'stack', values: [] },
          note: 'Start with an empty stack of characters that have not been removed.',
        },
        {
          line: 2,
          vars: { character: 'a' },
          structure: { kind: 'stack', values: [] },
          note: 'Read the first a. Nothing is saved yet, so it cannot pair with anything.',
        },
        {
          line: 4,
          vars: { character: 'a' },
          structure: { kind: 'stack', values: ['a'] },
          note: 'Save a. The stack now has one saved character.',
        },
        {
          line: 3,
          vars: { character: 'b' },
          structure: { kind: 'stack', values: ['a'] },
          note: 'Compare the next b with the top, a. They differ, so b is not removed.',
        },
        { line: 4, vars: { character: 'b' }, structure: { kind: 'stack', values: ['a', 'b'] }, note: 'Save b above a.' },
        {
          line: 3,
          vars: { character: 'b' },
          structure: { kind: 'stack', values: ['a'] },
          note: 'The second b matches the saved top b, so both are removed. a is on top again.',
        },
        {
          line: 3,
          vars: { character: 'a' },
          structure: { kind: 'stack', values: [] },
          note: 'The last a matches the saved a, so that pair is removed too.',
        },
        {
          line: 6,
          vars: { result: '' },
          structure: { kind: 'stack', values: [] },
          note: 'Nothing remains, so the function returns an empty string.',
        },
      ],
    },
    alternative: 'Repeated replacement is intuitive but can rescan the string many times; a stack processes each character once.',
    counterexample: 'One replacement pass can leave aa after removing bb from abba, even though another pair must vanish.',
    transfer: 'Explain the same process for numeric IDs, including zero and negative IDs.',
  },
  'repair-visible-count': {
    reasoning: 'A minimal repair should align the condition with the contract while preserving the working scan.',
    trace:
      'For one active and one inactive item, the original !active condition counts the inactive one. With both active, the original returns zero instead of two.',
    alternative: 'Replacing the whole loop with filter is possible but broadens a one-condition repair and allocates output.',
    counterexample: 'A mixed list with one of each gives count 1 before and after the fix, so that test alone hides the bug.',
    transfer: 'Choose the smallest regression case that distinguishes the reversed condition, then explain why it does.',
  },
  'read-unique-names': {
    reasoning: 'The Set determines membership; the array retains first-seen output order.',
    trace: 'For [Ada,Bo,Ada], names becomes [Ada,Bo]; slice(1) returns only [Bo]. Returning names keeps both.',
    alternative:
      'Returning the Set as an array could work for order, but this task asks you to preserve the loop and repair only the return.',
    counterexample: 'Trimming names changes the contract: whitespace-only names are intentionally kept here.',
    transfer: 'Compare this contract with a version that ignores trimmed blanks. Identify outputs that differ.',
  },
  'transform-active-labels': {
    reasoning: 'Selection precedes normalization, and normalization precedes the blank check.',
    trace: 'An inactive Ada is skipped; active blank becomes empty and is skipped; active Bo with spaces becomes BO.',
    alternative: 'filter/map pipelines can express the stages; a loop performs them without multiple intermediate arrays.',
    counterexample: 'Checking raw length before trimming admits a whitespace-only label as an empty output string.',
    transfer: 'Return original names alongside normalized labels without changing the source objects.',
  },
}

export const coreGuides: Record<string, ReflectionGuide> = {
  'first-unique-character': {
    plan: [
      'Count occurrences or compare first and last positions.',
      'Search in original order.',
      'Handle empty input and repeated characters.',
    ],
    explanation: ['Explain zero-based indices and case-sensitive comparison.', 'State the cost of your chosen approach.'],
    example:
      'I count characters, then scan from index 0 for the first count of one. I return -1 if none qualifies. For the stated basic Latin input, this takes O(n) expected time and O(k) space for k distinct characters.',
  },
  'missing-number': {
    plan: [
      'Use the array length to identify the full range.',
      'Compare the expected range with the supplied values.',
      'Consider missing zero and missing n.',
    ],
    explanation: [
      'State the assumption that exactly one value is missing and none repeats.',
      'Explain your chosen time and storage costs.',
    ],
    example:
      'I subtract the supplied sum from n * (n + 1) / 2. The contract guarantees one missing value and no duplicates. One scan takes O(n) time and O(1) extra space.',
  },
  'sum-positive-numbers': {
    plan: [
      'Start with a total of zero.',
      'Visit each number and add only values greater than zero.',
      'Consider an empty array and values at zero.',
    ],
    explanation: ['Say why zero and negative values are skipped.', 'Describe the number of visits and the extra storage used.'],
    example:
      'I visit each number once and add it only if it is positive. An empty array leaves the total at zero. This takes O(n) time and O(1) extra space.',
  },
  'count-even-numbers': {
    plan: [
      'Start a count at zero.',
      'Check each value with the remainder operator.',
      'Remember that zero and negative even numbers count.',
    ],
    explanation: ['Explain why a remainder of zero means even.', 'Describe the number of visits and the extra storage used.'],
    example:
      'I visit every number and increase a count when number % 2 is zero. Zero and negative even numbers work the same way. This takes O(n) time and O(1) extra space.',
  },
  'count-above-threshold': {
    plan: [
      'Choose an initial count.',
      'Compare every value with the threshold.',
      'Consider values equal to the threshold and an empty array.',
    ],
    explanation: ['Explain why equal values are excluded.', 'Describe the number of visits and the extra storage used.'],
    example:
      'I count each value strictly greater than the threshold. Equal values do not count. One pass takes O(n) time and O(1) extra space.',
  },
  'count-words': {
    plan: ['Handle empty or whitespace-only text.', 'Separate words on runs of whitespace.', 'Count the resulting words.'],
    explanation: ['Explain why repeated spaces do not create extra words.', 'Describe the time and storage used.'],
    example:
      'I trim the text first. If it is empty, I return zero; otherwise I split on whitespace and count the pieces. The scan takes O(n) time and the split uses O(n) extra space.',
  },
  'first-long-word': {
    plan: ['Visit words in their given order.', 'Compare each length with the minimum.', 'Return null if none qualifies.'],
    explanation: ['Explain why the first qualifying word is returned.', 'Describe the worst-case scan.'],
    example:
      'I scan left to right and return the first word whose length meets the minimum. If there is none, I return null. The scan takes O(n) time and O(1) extra space.',
  },
  'count-long-words': {
    plan: ['Start a count at zero.', 'Check every word against the minimum length.', 'Include words exactly at the minimum.'],
    explanation: ['Explain how empty input and exact-length words behave.', 'Describe the time and storage used.'],
    example:
      'I visit each word and count it when its length is at least the minimum. An empty list keeps the count at zero. This takes O(n) time and O(1) extra space.',
  },
  'has-duplicate': {
    plan: ['Remember values already visited.', 'Check before adding a value.', 'Return false when the scan ends without a repeat.'],
    explanation: ['Explain why a set helps with repeat detection.', 'Describe the time and storage used.'],
    example:
      'I scan the array with a set of seen values. If a value is already in the set, I return true. Otherwise I add it and continue. This is O(n) expected time and O(n) extra space.',
  },
  'most-frequent-number': {
    plan: ['Count occurrences with a map.', 'Handle empty input.', 'Resolve equal counts by choosing the smaller number.'],
    explanation: ['Explain when the best number changes.', 'Describe the time and storage used.'],
    example:
      'I count each number in a map, then choose the highest count and smaller number on a tie. Empty input returns null. This takes O(n) expected time and O(n) extra space.',
  },
  'first-repeated-number': {
    plan: ['Scan left to right with a set of seen numbers.', 'Return as soon as one appears again.', 'Return null if none repeats.'],
    explanation: ['Explain why the second occurrence decides the answer.', 'Describe the time and storage used.'],
    example:
      'I check each number against a set before adding it. The first number already present is the answer. If the scan ends, I return null. This takes O(n) expected time and O(n) extra space.',
  },
  'valid-parentheses': {
    plan: ['Track unmatched opening parentheses.', 'Reject a closing one when nothing is open.', 'Accept only when none remain.'],
    explanation: ['Explain early rejection and the final check.', 'Describe the time and storage used.'],
    example:
      'I increase a count for each opening parenthesis and decrease it for each closing one. A negative count fails immediately; zero at the end succeeds. This takes O(n) time and O(1) space.',
  },
  'balanced-brackets': {
    plan: [
      'Push opening brackets onto a stack.',
      'Match each closing bracket against the most recent opening.',
      'Require an empty stack at the end.',
    ],
    explanation: ['Explain why matching counts alone are insufficient.', 'Describe the time and storage used.'],
    example:
      'I push openings and compare each closing bracket with the top of the stack. A mismatch fails, and an empty stack at the end succeeds. This takes O(n) time and O(n) space.',
  },
  'remove-adjacent-pairs': {
    plan: [
      'Use a stack for characters not yet removed.',
      'Pop the top when it equals the next character.',
      'Join the remaining characters.',
    ],
    explanation: ['Explain why a new pair can form after removal.', 'Describe the time and storage used.'],
    example:
      'I compare each character with the last saved one, removing a match or saving a nonmatch. The stack naturally exposes newly adjacent characters. This takes O(n) time and O(n) space.',
  },
  'repair-visible-count': {
    plan: [
      'Trace one active and one inactive item through the original condition.',
      'Identify the reversed condition.',
      'Keep the rest of the loop.',
    ],
    explanation: ['Name the bug and why the correction works.', 'Explain the scan cost.'],
    example:
      'The condition used !item.active, so it counted inactive items. I changed it to item.active. The loop visits each item once, using O(n) time and O(1) extra space.',
  },
  'read-unique-names': {
    plan: ['Read what the loop adds to names.', 'Check what slice(1) returns.', 'Preserve the loop and return the complete result.'],
    explanation: ['Describe what the set and array each do.', 'Explain why the first name was lost.'],
    example:
      'The set prevents duplicates while names preserves first-seen order. slice(1) removed the first kept name, so I return names directly. The loop uses O(n) expected time and O(n) space.',
  },
  'transform-active-labels': {
    plan: ['Skip inactive users.', 'Trim each active name and skip an empty result.', 'Uppercase names and keep the input order.'],
    explanation: ['Explain why trim comes before the empty check.', 'Describe the output and scan cost.'],
    example:
      'I visit each user, skip inactive ones, trim the name, and add its uppercase form only when it is nonempty. This preserves order and takes O(n) visits plus the work to process each name.',
  },
}
