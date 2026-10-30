import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const journeyPracticeDepth: Record<string, RepDepth> = {
  'sum-in-range': {
    reasoning: 'A running sum contains exactly the qualifying values already visited.',
    trace: 'For [2,2,3] with bounds 2 and 2, both 2s qualify: totals 2, then 4; 3 leaves 4 unchanged.',
    alternative: 'Filtering then reducing is readable but allocates a selected array; one scan needs constant extra space.',
    counterexample: 'Strict comparisons exclude both 2s when low and high are 2.',
    transfer:
      'What changes if the bounds may arrive in either order? This changed contract is self-reviewed, not checked by the original cases.',
    traceSteps: {
      code: [
        'function sumInRange(numbers: number[], low: number, high: number): number {',
        '  let total = 0',
        '  for (const value of numbers) {',
        '    if (value >= low && value <= high) total += value',
        '  }',
        '  return total',
        '}',
      ],
      input: 'numbers = [-2, 0, 3, 3, 8], low = 0, high = 3',
      steps: [
        {
          line: 1,
          vars: { low: 0, high: 3, total: 0 },
          structure: { kind: 'array', values: [-2, 0, 3, 3, 8] },
          note: '`total` starts at 0 and holds the sum of the in-range values visited so far.',
        },
        {
          line: 3,
          vars: { value: -2, total: 0 },
          structure: { kind: 'array', values: [-2, 0, 3, 3, 8], pointers: { value: 0 } },
          note: '-2 is below `low`, so it is skipped.',
        },
        {
          line: 3,
          vars: { value: 0, total: 0 },
          structure: { kind: 'array', values: [-2, 0, 3, 3, 8], pointers: { value: 1 }, dimmed: [0] },
          note: '0 equals `low`, and both endpoints count, so it is added. Adding 0 leaves `total` at 0.',
        },
        {
          line: 3,
          vars: { value: 3, total: 3 },
          structure: { kind: 'array', values: [-2, 0, 3, 3, 8], pointers: { value: 2 }, dimmed: [0, 1] },
          note: '3 equals `high`, so it counts: `total` is 3.',
        },
        {
          line: 3,
          vars: { value: 3, total: 6 },
          structure: { kind: 'array', values: [-2, 0, 3, 3, 8], pointers: { value: 3 }, dimmed: [0, 1, 2] },
          note: 'The second 3 counts too, because every occurrence is added: 6.',
        },
        {
          line: 3,
          vars: { value: 8, total: 6 },
          structure: { kind: 'array', values: [-2, 0, 3, 3, 8], pointers: { value: 4 }, dimmed: [0, 1, 2, 3] },
          note: '8 is above `high`, so it is skipped.',
        },
        {
          line: 5,
          vars: { result: 6 },
          structure: { kind: 'array', values: [-2, 0, 3, 3, 8], dimmed: [0, 1, 2, 3, 4] },
          note: 'Return 6. With `>` and `<` instead, 0 and both 3s would be left out, giving 0.',
        },
      ],
    },
  },
  'adjacent-rise-count': {
    reasoning: 'Each pair is assessed exactly once; the count represents rises among visited pairs.',
    trace: 'For [1,3,3,2,5], 1→3 adds one, 3→3 and 3→2 add none, and 2→5 makes two.',
    alternative: 'A sliced array with filter also works but creates a copy; indexed scanning needs constant extra space.',
    counterexample: 'Using >= reports a rise for [2,2], which must return zero.',
    transfer:
      'How would you return the start and end of the longest rising run? This changed contract is self-reviewed, not checked by the original cases.',
    traceSteps: {
      code: [
        'function countRises(numbers: number[]): number {',
        '  let rises = 0',
        '  for (let i = 1; i < numbers.length; i++) {',
        '    if (numbers[i] > numbers[i - 1]) rises++',
        '  }',
        '  return rises',
        '}',
      ],
      input: 'numbers = [1, 3, 3, 2, 5]',
      steps: [
        {
          line: 1,
          vars: { rises: 0 },
          structure: { kind: 'array', values: [1, 3, 3, 2, 5] },
          note: 'Each adjacent pair is checked once: the value at `i` against the one before it, at `i - 1`.',
        },
        {
          line: 3,
          vars: { i: 1, rises: 1 },
          structure: { kind: 'array', values: [1, 3, 3, 2, 5], pointers: { i: 1 }, window: [0, 1], windowLabel: 'rise' },
          note: '3 is greater than 1: one rise.',
        },
        {
          line: 3,
          vars: { i: 2, rises: 1 },
          structure: { kind: 'array', values: [1, 3, 3, 2, 5], pointers: { i: 2 }, window: [1, 2], windowLabel: 'equal' },
          note: '3 and 3 are equal. A rise must be strictly greater, so `rises` stays 1.',
        },
        {
          line: 3,
          vars: { i: 3, rises: 1 },
          structure: { kind: 'array', values: [1, 3, 3, 2, 5], pointers: { i: 3 }, window: [2, 3], windowLabel: 'fall' },
          note: '2 is less than 3: a fall, not a rise.',
        },
        {
          line: 3,
          vars: { i: 4, rises: 2 },
          structure: { kind: 'array', values: [1, 3, 3, 2, 5], pointers: { i: 4 }, window: [3, 4], windowLabel: 'rise' },
          note: '5 is greater than 2: the second rise.',
        },
        {
          line: 5,
          vars: { result: 2 },
          structure: { kind: 'array', values: [1, 3, 3, 2, 5] },
          note: 'Five numbers make four pairs, and two of them rise. Return 2.',
        },
      ],
    },
  },
  'last-matching-word': {
    reasoning: 'Scanning backward makes the first accepted word the last qualifying word in input order.',
    trace: 'For ["A","a"] and suffix "A", the final "a" fails, then "A" matches; return "A" unchanged.',
    alternative: 'A forward scan can overwrite a candidate on every match; both avoid allocating a filtered list.',
    counterexample: 'Lowercasing would incorrectly return "a" for ["A","a"] with suffix "A".',
    transfer:
      'How would case-insensitive matching preserve the original output spelling? This changed contract is self-reviewed, not checked by the original cases.',
  },
  'word-length-span': {
    reasoning: 'The minimum and maximum lengths bound all visited words; their difference measures spread, not word count.',
    trace: 'For ["","four"], lengths are 0 and 4; maximum minus minimum is 4.',
    alternative: 'Tracking two bounds in a loop uses constant extra space; sorting a copied list costs more time.',
    counterexample: 'Trimming " a " changes its length from 3 to 1 and makes [" a ","!"] produce the wrong span.',
    transfer:
      'How would you define length for emoji and combined characters? This changed contract is self-reviewed, not checked by the original cases.',
    traceSteps: {
      code: [
        'function wordLengthSpan(words: string[]): number {',
        '  if (words.length === 0) return 0',
        '  let shortest = words[0].length, longest = words[0].length',
        '  for (const word of words) {',
        '    shortest = Math.min(shortest, word.length)',
        '    longest = Math.max(longest, word.length)',
        '  }',
        '  return longest - shortest',
        '}',
      ],
      input: "words = ['cat', 'a', 'hello']",
      steps: [
        {
          line: 1,
          vars: { length: 3 },
          structure: { kind: 'array', values: ['cat', 'a', 'hello'] },
          note: 'There is at least one word, so both bounds can start from a real length.',
        },
        {
          line: 2,
          vars: { shortest: 3, longest: 3 },
          structure: { kind: 'array', values: ['cat', 'a', 'hello'], pointers: { shortest: 0, longest: 0 } },
          note: '`cat` has length 3. Starting both bounds there avoids a made-up length that no word has.',
        },
        {
          line: 5,
          vars: { word: 'cat', shortest: 3, longest: 3 },
          structure: { kind: 'array', values: ['cat', 'a', 'hello'], pointers: { shortest: 0, longest: 0 } },
          note: 'The loop starts again at `cat`. It matches both bounds, so nothing changes.',
        },
        {
          line: 4,
          vars: { word: 'a', shortest: 1, longest: 3 },
          structure: { kind: 'array', values: ['cat', 'a', 'hello'], pointers: { shortest: 1, longest: 0 } },
          note: '`a` has length 1, shorter than 3, so it is the new shortest.',
        },
        {
          line: 5,
          vars: { word: 'hello', shortest: 1, longest: 5 },
          structure: { kind: 'array', values: ['cat', 'a', 'hello'], pointers: { shortest: 1, longest: 2 } },
          note: '`hello` has length 5, longer than 3, so it is the new longest.',
        },
        {
          line: 7,
          vars: { result: 4 },
          structure: { kind: 'array', values: ['cat', 'a', 'hello'], pointers: { shortest: 1, longest: 2 } },
          note: 'Return 5 - 1 = 4: the spread of the lengths, not the number of words.',
        },
      ],
    },
  },
  'shared-number-count': {
    reasoning: 'Iterating distinct left values counts each common value once, regardless of repetitions on either side.',
    trace: 'For [2,2] and [2,2], both sets contain only 2, so one membership success returns 1.',
    alternative: 'Searching right for each distinct left value avoids a second set but can require quadratic work.',
    counterexample: 'Counting matching left occurrences returns 2 instead of 1 for [2,2] and [2].',
    transfer:
      'How would the result change if pairs of occurrences rather than distinct values were counted? This changed contract is self-reviewed, not checked by the original cases.',
    traceSteps: {
      code: [
        'function sharedNumberCount(left: number[], right: number[]): number {',
        '  const inRight = new Set(right)',
        '  let shared = 0',
        '  for (const value of new Set(left)) {',
        '    if (inRight.has(value)) shared++',
        '  }',
        '  return shared',
        '}',
      ],
      input: 'left = [1, 1, 2, 3], right = [1, 3, 3]',
      steps: [
        {
          line: 1,
          vars: { inRight: '{1, 3}' },
          structure: { kind: 'array', values: [1, 3, 3] },
          note: 'Put `right` in a `Set`. Its repeated 3 is stored once.',
        },
        {
          line: 3,
          vars: { inRight: '{1, 3}', shared: 0 },
          structure: { kind: 'array', values: [1, 2, 3] },
          note: '`new Set(left)` drops the second 1, so each left value is checked once. The drawing now shows those distinct values.',
        },
        {
          line: 4,
          vars: { value: 1, shared: 1 },
          structure: { kind: 'array', values: [1, 2, 3], pointers: { value: 0 } },
          note: '1 is in `inRight`, so `shared` becomes 1.',
        },
        {
          line: 4,
          vars: { value: 2, shared: 1 },
          structure: { kind: 'array', values: [1, 2, 3], pointers: { value: 1 }, dimmed: [0] },
          note: '2 is not in `inRight`.',
        },
        {
          line: 4,
          vars: { value: 3, shared: 2 },
          structure: { kind: 'array', values: [1, 2, 3], pointers: { value: 2 }, dimmed: [0, 1] },
          note: '3 is in `inRight`: 2. Its two copies on the right still count once.',
        },
        {
          line: 6,
          vars: { result: 2 },
          structure: { kind: 'array', values: [1, 2, 3], dimmed: [0, 1, 2] },
          note: 'Return 2, for the values 1 and 3.',
        },
      ],
    },
  },
  'singleton-number-list': {
    reasoning: 'Complete counts are needed before choosing output; scanning the original array preserves order.',
    trace: 'For [4,2,4,3,2,1], counts are 4:2, 2:2, 3:1, 1:1; only 3 then 1 survive.',
    alternative:
      'Checking first and last positions for each value is concise but quadratic; a count map takes linear expected time and space.',
    counterexample: 'A Set returns [2] for [2,2], but the correct result is empty.',
    transfer:
      'What would change when returning the first value occurring exactly twice? This changed contract is self-reviewed, not checked by the original cases.',
    traceSteps: {
      code: [
        'function singletonNumbers(numbers: number[]): number[] {',
        '  const counts = new Map<number, number>()',
        '  for (const n of numbers) counts.set(n, (counts.get(n) ?? 0) + 1)',
        '  const singles: number[] = []',
        '  for (const n of numbers) if (counts.get(n) === 1) singles.push(n)',
        '  return singles',
        '}',
      ],
      input: 'numbers = [4, 2, 4, 3, 2, 1]',
      steps: [
        {
          line: 1,
          vars: {},
          structure: { kind: 'map', entries: [] },
          note: 'First pass: count every number. A count is not final until the whole array has been read.',
        },
        {
          line: 2,
          vars: { n: 4 },
          structure: { kind: 'map', entries: [['4', 1]] },
          note: '4 is new: count 1.',
        },
        {
          line: 2,
          vars: { n: 2 },
          structure: {
            kind: 'map',
            entries: [
              ['4', 1],
              ['2', 1],
            ],
          },
          note: '2 is new: count 1.',
        },
        {
          line: 2,
          vars: { n: 4 },
          structure: {
            kind: 'map',
            entries: [
              ['4', 2],
              ['2', 1],
            ],
          },
          note: 'The second 4 raises its count to 2, so 4 is not a singleton after all.',
        },
        {
          line: 2,
          vars: { n: 1 },
          structure: {
            kind: 'map',
            entries: [
              ['4', 2],
              ['2', 2],
              ['3', 1],
              ['1', 1],
            ],
          },
          note: '3 is new, 2 rises to 2, and 1 is new. Counting is done.',
        },
        {
          line: 4,
          vars: { n: 3, singles: '[3]' },
          structure: { kind: 'array', values: [4, 2, 4, 3, 2, 1], pointers: { n: 3 }, dimmed: [0, 1, 2] },
          note: 'Second pass, in the original order. 4, 2, and 4 have count 2 and are skipped; 3 has count 1 and is kept.',
        },
        {
          line: 4,
          vars: { n: 1, singles: '[3, 1]' },
          structure: { kind: 'array', values: [4, 2, 4, 3, 2, 1], pointers: { n: 5 }, dimmed: [0, 1, 2, 3, 4] },
          note: '2 is skipped again, and 1 is kept.',
        },
        {
          line: 5,
          vars: { result: '[3,1]' },
          structure: { kind: 'array', values: [4, 2, 4, 3, 2, 1], dimmed: [0, 1, 2, 3, 4, 5] },
          note: 'Return `[3, 1]`, in the order those numbers appeared.',
        },
      ],
    },
  },
  'undo-word-actions': {
    reasoning: 'The stored words are precisely the active additions; undo removes only the latest still-active addition.',
    trace: 'For ["undo","UNDO","UNDO","x"], add lowercase undo, remove it, ignore the extra undo, then add x.',
    alternative: 'A linked list supports latest-item removal but adds node complexity; an array stack fits this bounded task.',
    counterexample: 'Removing the first word gives ["blue"] instead of ["red"] for ["red","blue","UNDO"].',
    transfer:
      'How would a REDO action affect history after a new word is added? This changed contract is self-reviewed, not checked by the original cases.',
    traceSteps: {
      code: [
        'function applyWordActions(actions: string[]): string[] {',
        '  const words: string[] = []',
        '  for (const action of actions) {',
        "    if (action === 'UNDO') words.pop()",
        '    else words.push(action)',
        '  }',
        '  return words',
        '}',
      ],
      input: "actions = ['red', 'blue', 'UNDO', 'green']",
      steps: [
        {
          line: 1,
          vars: {},
          structure: { kind: 'stack', values: [] },
          note: 'The stack holds the words that are still added, oldest at the bottom.',
        },
        {
          line: 4,
          vars: { action: 'red' },
          structure: { kind: 'stack', values: ['red'] },
          note: '`red` is a word: push it.',
        },
        {
          line: 4,
          vars: { action: 'blue' },
          structure: { kind: 'stack', values: ['red', 'blue'] },
          note: 'Push `blue`. It is now the most recent addition.',
        },
        {
          line: 3,
          vars: { action: 'UNDO' },
          structure: { kind: 'stack', values: ['red'] },
          note: '`UNDO` pops the most recent word, `blue`. On an empty stack, `pop` would do nothing.',
        },
        {
          line: 4,
          vars: { action: 'green' },
          structure: { kind: 'stack', values: ['red', 'green'] },
          note: 'Push `green`.',
        },
        {
          line: 6,
          vars: { result: '["red","green"]' },
          structure: { kind: 'stack', values: ['red', 'green'] },
          note: 'Return the words from bottom to top, which is the order they were added.',
        },
      ],
    },
  },
  'erase-text-markers': {
    reasoning: 'The stack holds the text remaining after each prefix; a marker removes the latest remaining character only.',
    trace: 'For "a #b", add a and a space; # removes the space; adding b gives "ab".',
    alternative:
      'Repeated string slicing is simple but may copy growing strings repeatedly; a character array collects output in linear work.',
    counterexample: 'Deleting all # symbols leaves "abc" for "abc###", which must return empty text.',
    transfer:
      'What contract would allow a literal # without erasing a character? This changed contract is self-reviewed, not checked by the original cases.',
    traceSteps: {
      code: [
        'function eraseMarkers(text: string): string {',
        '  const kept: string[] = []',
        '  for (const character of text) {',
        "    if (character === '#') kept.pop()",
        '    else kept.push(character)',
        '  }',
        "  return kept.join('')",
        '}',
      ],
      input: "text = 'ab#c'",
      steps: [
        {
          line: 1,
          vars: {},
          structure: { kind: 'stack', values: [] },
          note: '`kept` is a stack of the characters that remain so far.',
        },
        {
          line: 4,
          vars: { character: 'a' },
          structure: { kind: 'stack', values: ['a'] },
          note: 'Push `a`.',
        },
        {
          line: 4,
          vars: { character: 'b' },
          structure: { kind: 'stack', values: ['a', 'b'] },
          note: 'Push `b`. It is the most recent remaining character.',
        },
        {
          line: 3,
          vars: { character: '#' },
          structure: { kind: 'stack', values: ['a'] },
          note: '`#` erases the most recent remaining character, `b`. The marker itself is never kept.',
        },
        {
          line: 4,
          vars: { character: 'c' },
          structure: { kind: 'stack', values: ['a', 'c'] },
          note: 'Push `c`.',
        },
        {
          line: 6,
          vars: { result: 'ac' },
          structure: { kind: 'stack', values: ['a', 'c'] },
          note: 'Join the stack from bottom to top: `ac`.',
        },
      ],
    },
  },
}

export const journeyPracticeGuides: Record<string, ReflectionGuide> = {
  'sum-in-range': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return the sum of values between low and high, including both endpoints. Count every occurrence.',
    ],
    explanation: [
      'Strict comparisons exclude both 2s when low and high are 2.',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'A running sum contains exactly the qualifying values already visited. For [2,2,3] with bounds 2 and 2, both 2s qualify: totals 2, then 4; 3 leaves 4 unchanged. Filtering then reducing is readable but allocates a selected array; one scan needs constant extra space.',
  },
  'adjacent-rise-count': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return how many adjacent pairs have a second value strictly greater than the first. Equal neighbors do not count.',
    ],
    explanation: [
      'Using >= reports a rise for [2,2], which must return zero.',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'Each pair is assessed exactly once; the count represents rises among visited pairs. For [1,3,3,2,5], 1→3 adds one, 3→3 and 3→2 add none, and 2→5 makes two. A sliced array with filter also works but creates a copy; indexed scanning needs constant extra space.',
  },
  'last-matching-word': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return the last word ending with suffix, preserving its spelling. Matching is case-sensitive. An empty suffix matches every word, including an empty word. Return null if nothing matches.',
    ],
    explanation: [
      'Lowercasing would incorrectly return "a" for ["A","a"] with suffix "A".',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'Scanning backward makes the first accepted word the last qualifying word in input order. For ["A","a"] and suffix "A", the final "a" fails, then "A" matches; return "A" unchanged. A forward scan can overwrite a candidate on every match; both avoid allocating a filtered list.',
  },
  'word-length-span': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return the longest word length minus the shortest word length. Return 0 for no words. Empty words have length zero.',
    ],
    explanation: [
      'Trimming " a " changes its length from 3 to 1 and makes [" a ","!"] produce the wrong span.',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'The minimum and maximum lengths bound all visited words; their difference measures spread, not word count. For ["","four"], lengths are 0 and 4; maximum minus minimum is 4. Tracking two bounds in a loop uses constant extra space; sorting a copied list costs more time.',
  },
  'shared-number-count': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return how many distinct numbers appear in both arrays. Repetitions in either array count only once.',
    ],
    explanation: [
      'Counting matching left occurrences returns 2 instead of 1 for [2,2] and [2].',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'Iterating distinct left values counts each common value once, regardless of repetitions on either side. For [2,2] and [2,2], both sets contain only 2, so one membership success returns 1. Searching right for each distinct left value avoids a second set but can require quadratic work.',
  },
  'singleton-number-list': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return numbers occurring exactly once, in their original order. Return an empty array if none qualify.',
    ],
    explanation: [
      'A Set returns [2] for [2,2], but the correct result is empty.',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'Complete counts are needed before choosing output; scanning the original array preserves order. For [4,2,4,3,2,1], counts are 4:2, 2:2, 3:1, 1:1; only 3 then 1 survive. Checking first and last positions for each value is concise but quadratic; a count map takes linear expected time and space.',
  },
  'undo-word-actions': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Process actions in order. The exact token UNDO removes the most recently added word if one exists; otherwise it does nothing. Every other token adds that word. Return the remaining words in order.',
    ],
    explanation: [
      'Removing the first word gives ["blue"] instead of ["red"] for ["red","blue","UNDO"].',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'The stored words are precisely the active additions; undo removes only the latest still-active addition. For ["undo","UNDO","UNDO","x"], add lowercase undo, remove it, ignore the extra undo, then add x. A linked list supports latest-item removal but adds node complexity; an array stack fits this bounded task.',
  },
  'erase-text-markers': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Read text left to right. Each # erases the most recent remaining character, if any. Other characters remain in order. Extra erase markers do nothing.',
    ],
    explanation: [
      'Deleting all # symbols leaves "abc" for "abc###", which must return empty text.',
      'Explain your time and storage costs and confirm inputs stay unchanged.',
    ],
    example:
      'The stack holds the text remaining after each prefix; a marker removes the latest remaining character only. For "a #b", add a and a space; # removes the space; adding b gives "ab". Repeated string slicing is simple but may copy growing strings repeatedly; a character array collects output in linear work.',
  },
}
