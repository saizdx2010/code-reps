import { dsaPlanPrompts } from './dsa-plan-prompts.ts'
import { starter } from './rep-starter.ts'
import type { Rep } from './rep.ts'

// A two-part puzzle: parse a log, then adapt the solution to a changed rule.
export const dsaPuzzleReps: Rep[] = [
  {
    id: 'puzzle-parse-part-one',
    title: 'Greenhouse lamp log: part 1',
    brief: {
      summary: 'The night gardener records lamp readings for each greenhouse tray. Return the sum of the strongest reading on each tray.',
      rules: [
        'Each nonblank line is one tray.',
        'Use its greatest reading, even when all readings are negative.',
        'Read ASCII integers separated by spaces or tabs; ignore blank lines. See the input contract below for number formats and limits.',
      ],
      edgeCases: ['Empty or blank-only input returns 0.', 'A final newline is allowed; it does not create a tray.'],
    },
    category: 'Algorithm applications',
    prompt:
      'The night gardener records lamp readings for each greenhouse tray, one tray per nonblank line. For the first part, return the sum of the strongest reading on each tray. Negative readings still count: use the greatest value, not zero.',
    example: { input: 'strongestTotal("1 4 3\\n-5 -2 -4")', output: '2' },
    note: 'Input uses ASCII lines separated only by \\n, with an optional final newline. Each nonblank line contains 1 to 20 readings separated by one or more ASCII spaces or tabs; leading and trailing spaces or tabs are allowed. Empty or space/tab-only lines are ignored, including blank section separators. Readings are base-10 integers from -1000 to 1000: optional minus, no plus, no leading zeros except 0, and no -0. There are at most 1000 nonblank lines and 100000 characters. Empty or blank-only input returns 0. CRLF, malformed tokens, and inputs beyond these limits are outside the contract; no error handling is required. Do not change the input.',
    vocabulary: [
      { term: 'Tray', meaning: 'one nonblank line of readings' },
      { term: 'Reading', meaning: 'a signed whole-number lamp measurement' },
      { term: 'Occurrence', meaning: 'one recorded reading, even if its value repeats' },
    ],
    planPrompt: dsaPlanPrompts['puzzle-parse-part-one'],
    starter: starter('function strongestTotal(input: string): number', '0'),
    functionName: 'strongestTotal',
    preserveInput: true,
    hints: [
      'Separate the text rules from the rule that produces the answer. Which lines contain trays?',
      'Keep the readings of each tray together; a negative tray still has a strongest reading.',
      'Split on newline, trim spaces and tabs, skip empty lines, and convert tokens to numbers. Add each tray maximum.',
    ],
    checks: [
      { name: 'Empty log', input: [''], expected: 0 },
      { name: 'Single tray', input: ['5'], expected: 5 },
      { name: 'Trailing newline', input: ['5\n'], expected: 5 },
      { name: 'Two trays', input: ['1 4 3\n-5 -2 -4'], expected: 2 },
      { name: 'Blank section separator', input: ['1 4 3\n\n-5 -2 -4\n'], expected: 2 },
      { name: 'Spaces and tabs', input: [' \t1\t4 3 \n\t-5  -2 -4\t'], expected: 2 },
      { name: 'Blank-only log', input: [' \t\n\n'], expected: 0 },
      { name: 'Negative readings', input: ['-8 -3 -5'], expected: -3 },
      { name: 'Duplicates and inclusive cutoff', input: ['7 7 5 4'], expected: 7 },
      { name: 'Zero and negative cutoff', input: ['0 -2 -3'], expected: 0 },
      { name: 'Number limits', input: ['-1000 1000 998 997'], expected: 1000 },
      { name: 'Maximum tray count and width', input: [Array(1000).fill(Array(20).fill('1000').join(' ')).join('\n')], expected: 1000000 },
    ],
  },
  {
    id: 'puzzle-adapt-part-two',
    title: 'Greenhouse lamp log: part 2',
    brief: {
      summary: 'This is part 2 of puzzle-parse-part-one. Reuse your parser if useful: the greenhouse log format is unchanged.',
      rules: [
        "Replace the part 1 sum with the total count of readings at least their own tray's strongest reading minus 2.",
        'Count every occurrence, including duplicates, and include readings exactly at the cutoff.',
        'The same ASCII text and number limits apply; see the input contract below.',
      ],
      edgeCases: ['Empty or blank-only input returns 0.', 'Blank separators and a final newline do not create trays.'],
    },
    category: 'Algorithm applications',
    prompt:
      'This is part 2 of the previous greenhouse rep, puzzle-parse-part-one. Reuse your parser if useful: the log format is unchanged. The gardener now wants the total number of readings that are at least the strongest reading on their own tray minus 2. Count every occurrence, including equal readings. Return this count instead of the part 1 sum.',
    example: { input: 'nearPeakCount("1 4 3\\n-5 -2 -4")', output: '4' },
    note: 'Input uses ASCII lines separated only by \\n, with an optional final newline. Each nonblank line contains 1 to 20 readings separated by one or more ASCII spaces or tabs; leading and trailing spaces or tabs are allowed. Empty or space/tab-only lines are ignored, including blank section separators. Readings are base-10 integers from -1000 to 1000: optional minus, no plus, no leading zeros except 0, and no -0. There are at most 1000 nonblank lines and 100000 characters. Empty or blank-only input returns 0. CRLF, malformed tokens, and inputs beyond these limits are outside the contract; no error handling is required. Do not change the input.',
    vocabulary: [
      { term: 'Tray', meaning: 'one nonblank line of readings' },
      { term: 'Reading', meaning: 'a signed whole-number lamp measurement' },
      { term: 'Occurrence', meaning: 'one recorded reading, even if its value repeats' },
    ],
    planPrompt: dsaPlanPrompts['puzzle-adapt-part-two'],
    starter: starter('function nearPeakCount(input: string): number', '0'),
    functionName: 'nearPeakCount',
    preserveInput: true,
    hints: [
      'Separate the text rules from the rule that produces the answer. Which lines contain trays?',
      'Keep the readings of each tray together; a negative tray still has a strongest reading.',
      'Split on newline, trim spaces and tabs, skip empty lines, and convert tokens to numbers. Find each tray maximum, then count readings greater than or equal to maximum minus 2. Do not remove duplicates.',
    ],
    checks: [
      { name: 'Empty log', input: [''], expected: 0 },
      { name: 'Single tray', input: ['5'], expected: 1 },
      { name: 'Trailing newline', input: ['5\n'], expected: 1 },
      { name: 'Two trays', input: ['1 4 3\n-5 -2 -4'], expected: 4 },
      { name: 'Blank section separator', input: ['1 4 3\n\n-5 -2 -4\n'], expected: 4 },
      { name: 'Spaces and tabs', input: [' \t1\t4 3 \n\t-5  -2 -4\t'], expected: 4 },
      { name: 'Blank-only log', input: [' \t\n\n'], expected: 0 },
      { name: 'Negative readings', input: ['-8 -3 -5'], expected: 2 },
      { name: 'Duplicates and inclusive cutoff', input: ['7 7 5 4'], expected: 3 },
      { name: 'Zero and negative cutoff', input: ['0 -2 -3'], expected: 2 },
      { name: 'Number limits', input: ['-1000 1000 998 997'], expected: 2 },
      { name: 'Maximum tray count and width', input: [Array(1000).fill(Array(20).fill('1000').join(' ')).join('\n')], expected: 20000 },
    ],
  },
]
