import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Core, journey, and transfer reps.
export const coreDepth: Record<string, RepDepth> = {
  'most-frequent-number': {
    traceSteps: {
      code: [
        'function mostFrequent(numbers: number[]): number | null {',
        '  const counts = new Map<number, number>()',
        '  for (const n of numbers) counts.set(n, (counts.get(n) ?? 0) + 1)',
        '  let best: number | null = null',
        '  let bestCount = 0',
        '  for (const [n, count] of counts) {',
        '    if (count > bestCount || (count === bestCount && n < best!)) {',
        '      best = n',
        '      bestCount = count',
        '    }',
        '  }',
        '  return best',
        '}',
      ],
      input: 'numbers = [7, 2, 7, 2, 5]',
      steps: [
        {
          line: 1,
          vars: {},
          structure: { kind: 'map', entries: [] },
          note: 'This input has a tie. Start with an empty `Map`: each key will be a number, and its value how many times it has appeared.',
        },
        {
          line: 2,
          vars: { n: 7 },
          structure: { kind: 'map', entries: [['7', 1]] },
          note: '7 is new, so `counts.get(7)` is `undefined` and `?? 0` supplies 0. Its count becomes 1.',
        },
        {
          line: 2,
          vars: { n: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 1],
              ['2', 1],
            ],
          },
          note: '2 is new too. Its count becomes 1.',
        },
        {
          line: 2,
          vars: { n: 7 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 2],
              ['2', 1],
            ],
          },
          note: '7 was counted before, so its count goes from 1 to 2.',
        },
        {
          line: 2,
          vars: { n: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 2],
              ['2', 2],
            ],
          },
          note: '2 reaches 2 as well. 7 and 2 now tie.',
        },
        {
          line: 2,
          vars: { n: 5 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 2],
              ['2', 2],
              ['5', 1],
            ],
          },
          note: '5 appears once. Every number is counted, so no later copy can change a count.',
        },
        {
          line: 7,
          vars: { n: 7, count: 2, best: 7, bestCount: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 2],
              ['2', 2],
              ['5', 1],
            ],
          },
          note: 'Now choose. The first entry, 7 with count 2, beats the starting count of 0, so 7 is the best so far.',
        },
        {
          line: 7,
          vars: { n: 2, count: 2, best: 2, bestCount: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 2],
              ['2', 2],
              ['5', 1],
            ],
          },
          note: '2 also has count 2: a tie. 2 is smaller than 7, so 2 replaces it.',
        },
        {
          line: 6,
          vars: { n: 5, count: 1, best: 2, bestCount: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 2],
              ['2', 2],
              ['5', 1],
            ],
          },
          note: '5 has count 1, lower than 2. The best stays 2.',
        },
        {
          line: 11,
          vars: { best: 2, bestCount: 2, result: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['7', 2],
              ['2', 2],
              ['5', 1],
            ],
          },
          note: 'Return 2. Keeping the first number to reach the top count would have returned 7, which the tie rule rejects.',
        },
      ],
    },
    reasoning:
      'The winner depends on each number’s final count and on the tie rule, not on which number appears first. Counting the whole array before choosing means no later copy can change a decision. The choice then keeps the highest count and, on an equal count, the lower value.',
    trace:
      'For the example `[4, 2, 4, 2, 4, 3]`, the counts finish at `4: 3`, `2: 2`, and `3: 1`, so 4 wins outright. For the tie `[9, 2, 9, 2]`, both counts are 2 and the smaller 2 is returned. An empty array never sets a best, so the result is `null`.',
    alternative:
      'Tracking the best while counting takes one pass, but every update must apply the tie rule, because a number can catch up later. Sorting a copy and counting runs of equal values also works, in O(n log n) time. Counting each number with `filter` inside a loop rescans the array and takes O(n²) time.',
    counterexample:
      'Keeping the first number to reach the top count returns 9 for `[9, 2, 9, 2]`. Keeping the last one, with `>=`, returns -1 for `[-3, -1, -3, -1]`. Sorting the keys with `sort()` and no comparator compares them as text, so -1 comes before -3. Returning `best || null` turns a winning `0` into `null`.',
    transfer: 'Change the tie rule so the number that appeared first wins. Explain what extra information you must keep beside each count.',
  },
  'first-unique-character': {
    traceSteps: {
      code: [
        'function firstUnique(text: string): number {',
        '  const counts = new Map<string, number>()',
        '  for (const character of text) counts.set(character, (counts.get(character) ?? 0) + 1)',
        '  for (let i = 0; i < text.length; i++) {',
        '    if (counts.get(text[i]) === 1) return i',
        '  }',
        '  return -1',
        '}',
      ],
      input: "text = 'swiss'",
      steps: [
        {
          line: 1,
          vars: {},
          structure: { kind: 'map', entries: [] },
          note: 'First pass: count every character. Start with an empty `Map` from character to count.',
        },
        {
          line: 2,
          vars: { character: 's' },
          structure: { kind: 'map', entries: [['s', 1]] },
          note: '`s` is new: count 1. It looks unique for now, but the rest of the text has not been read.',
        },
        {
          line: 2,
          vars: { character: 'w' },
          structure: {
            kind: 'map',
            entries: [
              ['s', 1],
              ['w', 1],
            ],
          },
          note: '`w` is new: count 1.',
        },
        {
          line: 2,
          vars: { character: 'i' },
          structure: {
            kind: 'map',
            entries: [
              ['s', 1],
              ['w', 1],
              ['i', 1],
            ],
          },
          note: '`i` is new: count 1.',
        },
        {
          line: 2,
          vars: { character: 's' },
          structure: {
            kind: 'map',
            entries: [
              ['s', 2],
              ['w', 1],
              ['i', 1],
            ],
          },
          note: 'The second `s` raises its count to 2. The `s` at index 0 is not unique after all.',
        },
        {
          line: 2,
          vars: { character: 's' },
          structure: {
            kind: 'map',
            entries: [
              ['s', 3],
              ['w', 1],
              ['i', 1],
            ],
          },
          note: 'The third `s` makes its count 3. Every character is counted.',
        },
        {
          line: 4,
          vars: { i: 0, count: 3 },
          structure: { kind: 'array', values: ['s', 'w', 'i', 's', 's'], pointers: { i: 0 } },
          note: 'Second pass, in the original order. `s` at index 0 has count 3, so it is not unique.',
        },
        {
          line: 4,
          vars: { i: 1, count: 1, result: 1 },
          structure: { kind: 'array', values: ['s', 'w', 'i', 's', 's'], pointers: { i: 1 }, dimmed: [0] },
          note: '`w` at index 1 has count 1. Return 1. `i` at index 2 is unique too, but it comes later.',
        },
      ],
    },
    reasoning:
      'Whether a character is unique depends on the characters after it, so one left-to-right pass cannot decide. Counting the whole text first settles every character. A second pass in the original order then finds the first character with a count of 1.',
    trace:
      'In `swiss`, the counts finish at `s: 3`, `w: 1`, and `i: 1`. The second pass rejects `s` at index 0 and returns 1 for `w`. In `aAbba`, `a` appears twice but `A` once, so the answer is 1; lowercasing first would merge them and return -1. An empty string skips both loops and returns -1.',
    alternative:
      'Checking whether `indexOf` and `lastIndexOf` agree for each character needs no `Map`, but each check searches the text again, so long text takes O(n²) time. The `Map` needs two passes of O(n) and O(k) extra space for k different characters.',
    counterexample:
      'Returning the first character not seen before returns 0 for `swiss`: `s` looks new at index 0, and its repeats come later. Keeping the last unique index instead of returning the first gives 2, the `i`.',
    transfer: 'Return every unique character in original order. Keep the basic Latin assumption explicit.',
  },
  'balanced-brackets': {
    reasoning:
      'Pairs can nest but not cross, so a closing bracket must close the latest bracket that is still open. A stack keeps the open brackets in order with the latest on top: push each opening bracket, and for each closing bracket pop the top and compare kinds. An empty stack at the end means nothing is left open.',
    trace:
      'In the example `{[()]}`, the stack grows to `{`, `[`, `(` and then each closing bracket pops a match: `)` takes `(`, `]` takes `[`, and `}` takes `{`. The stack ends empty, so the result is `true`. In `([)]`, the `)` pops `[`, a different kind, so the function returns `false` before reading the last `]`. For `]`, `pop` on an empty stack gives `undefined`, which matches no opening bracket, so the result is `false`.',
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
      input: "text = '{[()]}'",
      steps: [
        {
          line: 1,
          vars: { text: '{[()]}' },
          structure: { kind: 'stack', values: [] },
          note: 'Start with an empty stack for the opening brackets that are still waiting to be closed.',
        },
        {
          line: 4,
          vars: { character: '{' },
          structure: { kind: 'stack', values: ['{'] },
          note: '`{` is an opening bracket, so push it.',
        },
        {
          line: 4,
          vars: { character: '[' },
          structure: { kind: 'stack', values: ['{', '['] },
          note: '`[` opens inside `{`, so it goes on top. It must close before `{` can.',
        },
        {
          line: 4,
          vars: { character: '(' },
          structure: { kind: 'stack', values: ['{', '[', '('] },
          note: '`(` opens inside `[`. It is now the latest open bracket, on top of the stack.',
        },
        {
          line: 5,
          vars: { character: ')' },
          structure: { kind: 'stack', values: ['{', '['] },
          note: '`)` pops the top, `(`. They are the same kind, so the innermost pair is closed and `[` is on top again.',
        },
        {
          line: 5,
          vars: { character: ']' },
          structure: { kind: 'stack', values: ['{'] },
          note: '`]` pops `[`, a match. Only `{` is still open.',
        },
        {
          line: 5,
          vars: { character: '}' },
          structure: { kind: 'stack', values: [] },
          note: '`}` pops `{`, the last open bracket. Every closing bracket matched the latest open one.',
        },
        {
          line: 7,
          vars: { result: true },
          structure: { kind: 'stack', values: [] },
          note: 'The text has ended and the stack is empty, so nothing is left open. Return `true`.',
        },
      ],
    },
    alternative:
      'One counter per kind of bracket checks the totals but not the order, so it accepts `([)]`. Removing `()`, `[]`, and `{}` from the text until nothing changes also works, but every pass rescans the text, which takes O(n²) time for deep nesting. The stack reads each character once: O(n) time and O(n) space.',
    counterexample:
      '`([)]` has two brackets of each kind, so any check that only counts accepts it. Skipping the comparison when the stack is empty accepts `]`. Returning `true` without checking that the stack is empty at the end accepts `()[`, whose `[` is never closed.',
    transfer:
      'Allow other characters, such as letters and spaces, between the brackets and ignore them. State the new rule, then predict the result for `f(a[0])` and for `f(a[0)]`.',
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
      'For the example `[-2, 3, 0, 5]`, the total stays 0 at -2, becomes 3, stays 3 at 0, and becomes 8. An empty array never enters the loop, so the starting 0 is returned.',
    alternative:
      'A loop keeps only a total; `filter` then `reduce` creates a selected array first. A reducer without an initial value throws on an empty array.',
    counterexample:
      'Returning inside the loop after the first positive gives 3 instead of 8 for the example. Emptying the array with `shift()` as you go gives the right sum, but the caller is left with an empty array, which the checks report.',
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
          note: '`-3 % 2` is -1 in JavaScript, not 1. It is not 0, so -3 is odd and the count stays 0.',
        },
        {
          line: 3,
          vars: { count: 1, i: 1, remainder: 0 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], pointers: { i: 1 }, dimmed: [0] },
          note: '`4 % 2` is 0, so 4 is even. The count goes from 0 to 1.',
        },
        {
          line: 3,
          vars: { count: 2, i: 2, remainder: 0 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], pointers: { i: 2 }, dimmed: [0, 1] },
          note: '`0 % 2` is 0, so zero is even too. The count goes from 1 to 2.',
        },
        {
          line: 3,
          vars: { count: 2, i: 3, remainder: 1 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], pointers: { i: 3 }, dimmed: [0, 1, 2] },
          note: '`7 % 2` is 1, so 7 is odd. The count stays 2.',
        },
        {
          line: 2,
          vars: { count: 2, i: 4 },
          structure: { kind: 'array', values: [-3, 4, 0, 7], dimmed: [0, 1, 2, 3] },
          note: '`i` is 4, which is not less than the 4 numbers, so the loop stops.',
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
      'For the example `[-3, 4, 0, 7]`, the remainders are -1, 0, 0, and 1, so the count goes 0, 1, 2, 2 and the result is 2. An empty array returns the starting 0.',
    alternative: 'A loop uses constant working memory; filtering and reading length builds an array. Both inspect every input.',
    counterexample:
      'Testing `n % 2 !== 1` counts -3 as even, because `-3 % 2` is -1, so the example returns 3 instead of 2. Counting distinct values with a `Set` returns 1 instead of 3 for `[2, 2, 2]`.',
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
          note: '`i` is 4, which is not less than the 4 values, so the loop stops.',
        },
        {
          line: 5,
          vars: { limit: 7, count: 1, result: 1 },
          structure: { kind: 'array', values: [2, 7, 7, 10], dimmed: [0, 1, 2, 3] },
          note: 'Return 1. With `>=` the two 7s would have counted too, giving 3.',
        },
      ],
    },
    reasoning:
      'A strict comparison leaves values equal to the limit out, and visiting every value means each match is counted once per occurrence, repeats included.',
    trace:
      'For the example `[2, 7, 7, 10]` with limit 7, the count stays 0 at 2 and at both 7s, because equal is not above, and becomes 1 at 10. An empty array returns the starting 0.',
    alternative: 'A loop avoids allocating selected values; `filter` is concise when the selected values are also needed.',
    counterexample:
      'Using `>=` counts both 7s and returns 3 instead of 1. Removing duplicates with a `Set` first counts 6 once in `[4, 6, 6, 8]` above 3 and returns 3 instead of 4. Sorting the array to stop early changes the caller’s array.',
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
          note: '`cat` has 3 characters, fewer than 5. Keep looking.',
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
          note: '`tiger` has exactly 5 characters. At least 5 includes 5, so it qualifies.',
        },
        {
          line: 2,
          vars: { minimum: 5, i: 1, result: 'tiger' },
          structure: { kind: 'array', values: ['cat', 'tiger', 'dog'], pointers: { i: 1 }, dimmed: [0] },
          note: 'Return `tiger` at once. `dog` is never read: a later word cannot change which one came first.',
        },
      ],
    },
    reasoning: 'First-match search may stop early because later items cannot change the earliest result.',
    trace:
      'For the example, `cat` has 3 characters, fewer than 5. `tiger` has exactly 5, so it is returned and `dog` is never read. With a minimum of 0 the first word qualifies at once, even when it is empty.',
    alternative:
      '`find` is concise but its absent result is `undefined`, so adapt it to `null`. Filtering all words does unnecessary work for a first-match task.',
    counterexample:
      'Using `>` skips `tiger`, because 5 is not more than 5, and returns `null` for the example. Sorting the words by length first returns `moon` instead of `planet` for `[planet, moon, galaxy]` with minimum 4, and it changes the caller’s array.',
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
          note: '`a` is not a space and no word is open, so a new word starts. Count will go from 0 to 1.',
        },
        {
          line: 4,
          vars: { count: 1, inWord: true, i: 2 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 2 }, dimmed: [0, 1] },
          note: '`b` is not a space and a word is already open, so count stays at 1.',
        },
        {
          line: 4,
          vars: { count: 1, inWord: true, i: 3 },
          structure: { kind: 'array', values: ['␣', 'a', 'b', '␣', '␣', 'c', '␣'], pointers: { i: 3 }, dimmed: [0, 1, 2] },
          note: 'This space ends the word, so `inWord` becomes `false`.',
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
          note: '`c` starts a second word. Count will go from 1 to 2.',
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
    reasoning:
      'A word is a run of characters that are not whitespace, so any run of whitespace is one gap, and whitespace at either end separates nothing. Trimming removes the ends, and splitting at each run then gives one piece per word. Empty text is the exception: splitting it still gives one empty piece, so it needs its own 0.',
    trace:
      "Trimming the example removes the two spaces at each end and leaves `code`, three spaces, and `reps`. Splitting at each run of whitespace gives `['code', 'reps']`, so the result is 2. For text of only spaces, trimming leaves `''`, and the early `return` gives 0 before any split. `'one\\ntwo\\nthree'` splits at both newlines into 3 words.",
    alternative:
      'Splitting is clear but builds an array of words first. The character scan in the step trace counts each place where a word starts and needs only a count and one flag, whatever the length of the text.',
    counterexample:
      "`split(' ')` cuts at single spaces only: the example gives `['', '', 'code', '', '', 'reps', '', '']`, and `'a\\tb'` stays one piece. Splitting at runs without trimming gives 4 pieces for the example. Skipping the empty check makes `''` return 1, because splitting `''` gives `['']`.",
    transfer: 'Return the length of the longest word instead of the count. Decide what text with no words should return, and say why.',
  },
  'has-duplicate': {
    traceSteps: {
      code: [
        'function hasDuplicate(numbers: number[]): boolean {',
        '  const seen = new Set<number>()',
        '  for (let i = 0; i < numbers.length; i++) {',
        '    if (seen.has(numbers[i])) return true',
        '    seen.add(numbers[i])',
        '  }',
        '  return false',
        '}',
      ],
      input: 'numbers = [3, 1, 3]',
      steps: [
        {
          line: 1,
          vars: { seen: '{}' },
          structure: { kind: 'array', values: [3, 1, 3] },
          note: 'Start with an empty `Set`. It will hold every number visited so far.',
        },
        {
          line: 3,
          vars: { i: 0, seen: '{}' },
          structure: { kind: 'array', values: [3, 1, 3], pointers: { i: 0 } },
          note: '3 is not in the `Set`, so it is not a repeat yet. Check before adding.',
        },
        {
          line: 4,
          vars: { i: 0, seen: '{3}' },
          structure: { kind: 'array', values: [3, 1, 3], pointers: { i: 0 } },
          note: 'Remember 3 by adding it to the `Set`.',
        },
        {
          line: 3,
          vars: { i: 1, seen: '{3}' },
          structure: { kind: 'array', values: [3, 1, 3], pointers: { i: 1 }, dimmed: [0] },
          note: '1 is not in the `Set`, so it is new.',
        },
        {
          line: 4,
          vars: { i: 1, seen: '{3, 1}' },
          structure: { kind: 'array', values: [3, 1, 3], pointers: { i: 1 }, dimmed: [0] },
          note: 'Add 1. The `Set` now holds both numbers visited so far.',
        },
        {
          line: 3,
          vars: { i: 2, seen: '{3, 1}', result: true },
          structure: { kind: 'array', values: [3, 1, 3], pointers: { i: 2 }, dimmed: [0, 1] },
          note: '3 is already in the `Set`: it appeared at index 0. Return `true` at once, even though the two copies are not side by side.',
        },
      ],
    },
    reasoning:
      'Before each number is checked, `seen` holds exactly the numbers visited so far. A number already in `seen` therefore appeared earlier, which makes it a repeat. If the loop ends without a match, every number was new when it was visited.',
    trace:
      'For the example `[3, 1, 3]`, `seen` grows from `{}` to `{3}` to `{3, 1}`. The last 3 is already in `seen`, so the result is `true`. An empty array never enters the loop and returns `false`, and a single number is added once and never matched.',
    alternative:
      'Comparing every pair with two nested loops needs no extra storage but makes about n² comparisons. Sorting a copy puts equal numbers side by side in O(n log n) time; sorting the array itself changes the caller’s data. A `Set` takes one pass with expected fast lookup and O(n) extra storage.',
    counterexample:
      'Adding before checking makes every number look repeated: `[1, 2, 3]` returns `true`. Comparing only neighbors misses the example, where the two 3s are apart. Storing each index in a `Map` and testing whether `get` returns a truthy value misses a repeat of the first number, because its stored index is `0`.',
    transfer: 'Detect duplicates by record ID instead of object identity. Explain which key enters the `Set`.',
  },
  'missing-number': {
    traceSteps: {
      code: [
        'function missingNumber(numbers: number[]): number {',
        '  const n = numbers.length',
        '  let remaining = 0',
        '  for (let k = 0; k <= n; k++) remaining += k',
        '  for (let i = 0; i < n; i++) remaining -= numbers[i]',
        '  return remaining',
        '}',
      ],
      input: 'numbers = [3, 0, 1]',
      steps: [
        {
          line: 2,
          vars: { n: 3, remaining: 0 },
          structure: { kind: 'array', values: [0, 1, 2, 3] },
          note: '`n` is 3, the array’s length, so the full range is 0 to 3: these four boxes. The total starts at 0.',
        },
        {
          line: 3,
          vars: { n: 3, k: 0, remaining: 0 },
          structure: { kind: 'array', values: [0, 1, 2, 3], pointers: { k: 0 } },
          note: 'Add 0. The total stays 0.',
        },
        {
          line: 3,
          vars: { n: 3, k: 1, remaining: 1 },
          structure: { kind: 'array', values: [0, 1, 2, 3], pointers: { k: 1 }, dimmed: [0] },
          note: 'Add 1. The total is 1.',
        },
        {
          line: 3,
          vars: { n: 3, k: 2, remaining: 3 },
          structure: { kind: 'array', values: [0, 1, 2, 3], pointers: { k: 2 }, dimmed: [0, 1] },
          note: 'Add 2. The total is 3.',
        },
        {
          line: 3,
          vars: { n: 3, k: 3, remaining: 6 },
          structure: { kind: 'array', values: [0, 1, 2, 3], pointers: { k: 3 }, dimmed: [0, 1, 2] },
          note: 'Add 3, which is `n` itself, because `k <= n` includes it. The whole range adds up to 6.',
        },
        {
          line: 4,
          vars: { n: 3, i: 0, remaining: 3 },
          structure: { kind: 'array', values: [3, 0, 1], pointers: { i: 0 } },
          note: 'Now the boxes are the array. Subtract 3: 6 - 3 = 3.',
        },
        {
          line: 4,
          vars: { n: 3, i: 1, remaining: 3 },
          structure: { kind: 'array', values: [3, 0, 1], pointers: { i: 1 }, dimmed: [0] },
          note: 'Subtract 0. The total stays 3.',
        },
        {
          line: 4,
          vars: { n: 3, i: 2, remaining: 2 },
          structure: { kind: 'array', values: [3, 0, 1], pointers: { i: 2 }, dimmed: [0, 1] },
          note: 'Subtract 1. The total is 2.',
        },
        {
          line: 5,
          vars: { n: 3, remaining: 2, result: 2 },
          structure: { kind: 'array', values: [3, 0, 1], dimmed: [0, 1, 2] },
          note: 'Every number present has been taken back out. What remains, 2, is the one number the array never held.',
        },
      ],
    },
    reasoning:
      'The range 0 to `n` has `n + 1` numbers and the array holds `n` of them, each once, so exactly one is absent. Adding the whole range and then subtracting every number present cancels each present number, which leaves only the missing one. This relies on the contract: with repeats, the difference would no longer name one missing number.',
    trace:
      'For the example `[3, 0, 1]`, `n` is 3: 0 + 1 + 2 + 3 = 6, the array adds up to 4, and 6 - 4 = 2. For `[0, 1]`, `n` is 2, so the range is 0 to 2 and the answer is 2 itself. An empty array has `n = 0`: the range is only 0, nothing is subtracted, and the result is 0.',
    alternative:
      'A `Set` of the numbers present makes membership visible: check 0 to `n` in order and return the first one missing, with O(n) extra storage. Sorting a copy and finding the first index whose value differs takes O(n log n) time. Subtracting totals needs constant storage; a much larger range would need care with number precision.',
    counterexample:
      'Treating the largest number as `n` fails when `n` itself is missing: `[0, 1]` gives 0 instead of 2. Adding 0 through `n - 1` leaves `n` out of the total and returns -1 for the example. Sorting a copy with `sort()` and no comparator puts 10 before 2, so the gap among ten numbers is found in the wrong place.',
    transfer: 'Now permit duplicate inputs. Explain why the sum argument no longer proves one missing value and define validation.',
  },
  'valid-parentheses': {
    traceSteps: {
      code: [
        'function validParentheses(text: string): boolean {',
        '  let open = 0',
        '  for (const character of text) {',
        "    open += character === '(' ? 1 : -1",
        '    if (open < 0) return false',
        '  }',
        '  return open === 0',
        '}',
      ],
      input: "text = '(())'",
      steps: [
        {
          line: 1,
          vars: { open: 0 },
          structure: { kind: 'array', values: ['(', '(', ')', ')'] },
          note: '`open` counts the `(` that are still waiting for a `)`. Nothing has been read, so it starts at 0.',
        },
        {
          line: 3,
          vars: { character: '(', open: 1 },
          structure: { kind: 'array', values: ['(', '(', ')', ')'], pointers: { character: 0 } },
          note: 'The first `(` opens a pair: `open` is 1.',
        },
        {
          line: 3,
          vars: { character: '(', open: 2 },
          structure: { kind: 'array', values: ['(', '(', ')', ')'], pointers: { character: 1 }, dimmed: [0] },
          note: 'A second `(` opens inside the first: `open` is 2.',
        },
        {
          line: 4,
          vars: { character: ')', open: 1 },
          structure: { kind: 'array', values: ['(', '(', ')', ')'], pointers: { character: 2 }, dimmed: [0, 1] },
          note: 'The first `)` closes one of them: `open` is 1. It is not below 0, so the text is still valid so far.',
        },
        {
          line: 4,
          vars: { character: ')', open: 0 },
          structure: { kind: 'array', values: ['(', '(', ')', ')'], pointers: { character: 3 }, dimmed: [0, 1, 2] },
          note: 'The last `)` closes the other: `open` is 0. The count never dropped below 0 on the way.',
        },
        {
          line: 6,
          vars: { open: 0, result: true },
          structure: { kind: 'array', values: ['(', '(', ')', ')'], dimmed: [0, 1, 2, 3] },
          note: 'The text has ended with `open` at 0, so every `(` was closed. Return `true`.',
        },
      ],
    },
    reasoning:
      'Reading left to right, `open` is the number of `(` still waiting for a `)`. A `)` is valid only when `open` is above 0, so a negative count means a `)` closed nothing and the text can be rejected at once. When the loop ends, every `(` must have been closed, so `open` must be 0. With one kind of bracket, the count is enough: any open `(` can be closed by any `)`.',
    trace:
      'For the example `(())`, `open` goes 1, 2, 1, 0: it never drops below 0 and ends at 0, so the result is `true`. For `())(()`, `open` goes 1, 0, -1 at the third character, so the function returns `false` without reading the rest, even though the text has three of each. For `()(`, `open` ends at 1, so one `(` is still open and the result is `false`.',
    alternative:
      'A stack of the open `(` gives the same answer, and it is what Check balanced brackets needs, where each closing bracket must match the kind on top. With one kind, every entry on the stack is the same, so only its length matters, and the count stores that length in constant space.',
    counterexample:
      'Comparing only the totals of `(` and `)` accepts `)(`. Checking the totals and that the text does not start with `)` still accepts `())(()`, whose third character closes nothing. Returning `true` as soon as the count reaches 0 accepts `()(`, whose last `(` is never closed.',
    transfer:
      'Return the deepest nesting level instead of `true` or `false`: `(())` is 2 and `()()` is 1. Decide what text that is not valid, such as `())(`, should return, and say why.',
  },
  'count-long-words': {
    traceSteps: {
      code: [
        'function countLongWords(words: string[], minimum: number): number {',
        '  let count = 0',
        '  for (const word of words) {',
        '    if (word.length >= minimum) count++',
        '  }',
        '  return count',
        '}',
      ],
      input: "words = ['cat', 'tiger', 'bear'], minimum = 4",
      steps: [
        {
          line: 1,
          vars: { minimum: 4, count: 0 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'bear'] },
          note: 'No word has been checked yet, so the count starts at 0.',
        },
        {
          line: 3,
          vars: { word: 'cat', length: 3, count: 0 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'bear'], pointers: { word: 0 } },
          note: '`cat` has 3 characters, fewer than 4, so the count stays 0.',
        },
        {
          line: 3,
          vars: { word: 'tiger', length: 5, count: 1 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'bear'], pointers: { word: 1 }, dimmed: [0] },
          note: '`tiger` has 5 characters, more than 4: the count is 1.',
        },
        {
          line: 3,
          vars: { word: 'bear', length: 4, count: 2 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'bear'], pointers: { word: 2 }, dimmed: [0, 1] },
          note: '`bear` has exactly 4. At least includes the minimum itself, so the count is 2.',
        },
        {
          line: 2,
          vars: { count: 2 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'bear'], dimmed: [0, 1, 2] },
          note: 'Every word has been checked, so the loop ends. A count depends on the whole array, so nothing returns early.',
        },
        {
          line: 5,
          vars: { count: 2, result: 2 },
          structure: { kind: 'array', values: ['cat', 'tiger', 'bear'], dimmed: [0, 1, 2] },
          note: 'Return 2: `tiger` and `bear`.',
        },
      ],
    },
    reasoning:
      'After each word, `count` is the number of long words among the words already visited. It starts at 0, which is already the answer for an empty array, and grows only when a word reaches the minimum. Unlike Find the first long word, the answer depends on every word, so the loop cannot stop early.',
    trace:
      "For the example, `cat` (3) is too short, `tiger` (5) counts, and `bear` (4) counts because at least includes 4 itself, so the result is 2. In `['a b', ' hi', 'no']` with a minimum of 3, `a b` and the space before `hi` both count as characters, so two words have 3 and the result is 2. A minimum of 0 counts every word, even an empty one.",
    alternative:
      '`words.filter(word => word.length >= minimum).length` gives the same count in one line, but it builds an array of the matches first. The loop keeps only the count: O(n) time and O(1) extra space.',
    counterexample:
      "Using `>` drops `bear` from the example and returns 1. Trimming each word first gives `' hi'` a length of 2, so the spaces check returns 1 instead of 2. Counting distinct words with a `Set` counts `['hi', 'hi']` once.",
    transfer:
      'Count the words whose length is between two limits, inclusive at both ends. Decide what to return when the lower limit is above the upper one, and say why.',
  },
  'first-repeated-number': {
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
      input: 'numbers = [6, 1, 9, 1, 6]',
      steps: [
        {
          line: 1,
          vars: { seen: '{}' },
          structure: { kind: 'array', values: [6, 1, 9, 1, 6] },
          note: 'Start with an empty `Set` of the numbers already passed.',
        },
        {
          line: 4,
          vars: { index: 0, value: 6, seen: '{}' },
          structure: { kind: 'array', values: [6, 1, 9, 1, 6], pointers: { index: 0 } },
          note: 'The value is 6. The `Set` is empty, so 6 has not been seen before.',
        },
        {
          line: 5,
          vars: { index: 0, value: 6, seen: '{6}' },
          structure: { kind: 'array', values: [6, 1, 9, 1, 6], pointers: { index: 0 } },
          note: 'Remember 6, after the check, so that its own first occurrence is not mistaken for a repeat.',
        },
        {
          line: 5,
          vars: { index: 1, value: 1, seen: '{6, 1}' },
          structure: { kind: 'array', values: [6, 1, 9, 1, 6], pointers: { index: 1 }, dimmed: [0] },
          note: '1 is not in the `Set`, so it is not a repeat. Remember it.',
        },
        {
          line: 5,
          vars: { index: 2, value: 9, seen: '{6, 1, 9}' },
          structure: { kind: 'array', values: [6, 1, 9, 1, 6], pointers: { index: 2 }, dimmed: [0, 1] },
          note: '9 is new as well. Remember it.',
        },
        {
          line: 4,
          vars: { index: 3, value: 1, seen: '{6, 1, 9}', result: 1 },
          structure: { kind: 'array', values: [6, 1, 9, 1, 6], pointers: { index: 3 }, dimmed: [0, 1, 2] },
          note: '1 is already in the `Set`, so this is its second occurrence. Return 1. The second 6, at index 4, is never read.',
        },
      ],
    },
    reasoning:
      'A number is known to repeat only at its second occurrence, so reading left to right and stopping at the first number already seen returns the earliest second occurrence. Checking before adding matters: after adding, the current number is always in the `Set`. Returning at once also leaves the rest of the array unread.',
    trace:
      'In the example `[6, 1, 9, 1, 6]`, the `Set` grows to `{6, 1, 9}`. At index 3, 1 is already in the `Set`, so the function returns 1, and the second 6 is never reached. For `[0, 1, 0]`, `has(0)` is `true` at index 2, so `0` is returned. For `[1, 2, 3]`, no number is found and the loop ends with `null`.',
    alternative:
      'Counting every number first and then taking the first one with a count of 2 answers a different question: for the example it returns 6, the number that appeared first. Comparing each number with all earlier ones finds the right answer without a `Set`, but takes O(n²) time. The `Set` scan takes O(n) expected time and O(n) space, and stops early.',
    counterexample:
      'Counting first, or `numbers.find` with `indexOf !== lastIndexOf`, returns 6 for the example. Storing each number in an object as `seen[n] = n` and testing `if (seen[n])` misses a repeated `0`, so `[0, 1, 0]` returns `null`. Comparing only neighbors misses the example, where the two 1s are not next to each other.',
    transfer:
      'Return the index of the second occurrence instead of the number: 3 for the example. Decide what to return when nothing repeats, and say why `null` or `-1` fits better.',
  },
  'remove-adjacent-pairs': {
    reasoning:
      'The stack holds the text reduced so far, so its top is the only character the next one can pair with. A match pops the top, which can uncover an earlier character for the next one to meet; anything else is pushed. Each character is pushed or pops once, so one pass handles every chain of removals.',
    trace:
      'For the example `abbaca`, the stack goes `a`, `ab`, `a`, empty, `c`, `ca`: the second `b` removes `b`, the next `a` meets the `a` that this uncovered, and `c` and `a` are kept, so the result is `ca`. For `aaa`, the second `a` removes the first and the third is kept, so the result is `a`. For `aA`, the two characters differ, so both stay.',
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
      input: "text = 'abbaca'",
      steps: [
        {
          line: 1,
          vars: { text: 'abbaca' },
          structure: { kind: 'stack', values: [] },
          note: 'Start with an empty stack of the characters kept so far.',
        },
        {
          line: 4,
          vars: { character: 'a' },
          structure: { kind: 'stack', values: ['a'] },
          note: 'Nothing is kept yet, so `a` cannot pair with anything. Keep it.',
        },
        {
          line: 4,
          vars: { character: 'b' },
          structure: { kind: 'stack', values: ['a', 'b'] },
          note: '`b` differs from the top, `a`, so keep it on top.',
        },
        {
          line: 3,
          vars: { character: 'b' },
          structure: { kind: 'stack', values: ['a'] },
          note: 'This `b` equals the top `b`, so the pair is removed. `a` is on top again.',
        },
        {
          line: 3,
          vars: { character: 'a' },
          structure: { kind: 'stack', values: [] },
          note: 'The next `a` equals the `a` that removing `bb` uncovered, so that pair goes too.',
        },
        {
          line: 4,
          vars: { character: 'c' },
          structure: { kind: 'stack', values: ['c'] },
          note: 'The stack is empty, so `c` is kept.',
        },
        {
          line: 4,
          vars: { character: 'a' },
          structure: { kind: 'stack', values: ['c', 'a'] },
          note: '`a` differs from the top, `c`, so it is kept as well.',
        },
        {
          line: 6,
          vars: { result: 'ca' },
          structure: { kind: 'stack', values: ['c', 'a'] },
          note: 'Join the kept characters from the bottom up, in their original order: `ca`.',
        },
      ],
    },
    alternative:
      'Replacing pairs with a regular expression until the text stops changing gives the same result, but each pass rescans the whole text, which can take O(n²) time. The stack takes O(n) time and O(n) space. A string used as the stack also works, though each removal copies the text.',
    counterexample:
      "One pass of `replace(/(.)\\1/g, '')` turns `abbaca` into `aaca` and stops there. Removing whole runs of equal characters turns `aaa` into empty text instead of `a`. Comparing each character with the one before it in the input, instead of the kept top, leaves `aa` for `abba`.",
    transfer:
      'Remove a pair only when a lowercase letter meets the same letter in uppercase, as in `aA`, so `aa` stays. Predict the result for `abBA`, then say what the stack compares at each step.',
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
