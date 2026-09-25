export const firstPath = {
  title: 'TypeScript problem solving',
  description: 'Build fluency with arrays, text, lookup collections, and stacks. Plan each solution, check it, then explain it.',
  stages: [
    { title: 'Work through values', description: 'Start with simple loops and decisions.', repIds: ['sum-positive-numbers', 'count-even-numbers', 'first-long-word'] },
    { title: 'Count and remember', description: 'Use maps and sets when repeated lookup helps.', repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character'] },
    { title: 'Handle text and gaps', description: 'Think through whitespace and missing values.', repIds: ['count-words', 'missing-number'] },
    { title: 'Match openings and closings', description: 'Track what remains unmatched.', repIds: ['valid-parentheses', 'balanced-brackets'] },
  ],
} as const
