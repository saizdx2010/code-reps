import type { MistakeTagId } from './mistakes.ts'

// Kept apart from src/mistakes.ts, which practice loads at startup: only Journal → Mistakes reads this.

/**
 * Lessons that address each tag, by knowledge skill ID, with one practice habit. A suggestion only: tags are
 * self-reported, and revisiting a lesson does not establish that the mistake is fixed.
 */
export const mistakeHelp: Record<MistakeTagId, { lessons: string[]; habit: string }> = {
  'off-by-one': {
    lessons: ['control-flow', 'array-techniques'],
    habit: 'Trace the first and last loop turns by hand and say which index each one reads.',
  },
  'mutated-input': {
    lessons: ['reference-identity', 'sorting-basics'],
    habit: 'Copy before sorting, splicing, or pushing, and check the input after a run.',
  },
  'missed-empty-case': { lessons: ['arrays', 'testing'], habit: 'Write the empty input and its expected result in your plan first.' },
  'wrong-boundary-condition': {
    lessons: ['testing', 'array-techniques'],
    habit: 'Name the values just below, at, and just above each limit, and decide which side each belongs to.',
  },
  'misread-contract': {
    lessons: ['validation', 'testing'],
    habit: 'Restate the rules in your own words, in order, before planning.',
  },
  'type-or-null-handling': {
    lessons: ['typescript-boundaries', 'values'],
    habit: 'Ask what each value can be, including null, undefined, and zero, before reading from it.',
  },
  other: { lessons: [], habit: 'Write one sentence in the Notebook about what went wrong, so you notice it next time.' },
}
