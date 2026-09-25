export const firstPath = {
  title: 'TypeScript from the beginning',
  description: 'Learn the language basics first, then build fluency with arrays, text, lookup collections, and stacks.',
  stages: [
    { title: 'Learn the language', description: 'Declare values, use types, create objects and arrays, and write functions.', repIds: ['declare-variables', 'basic-types', 'create-objects', 'make-arrays', 'write-functions'] },
    { title: 'Work through values', description: 'Start with simple loops and decisions.', repIds: ['sum-positive-numbers', 'count-even-numbers', 'first-long-word'] },
    { title: 'Count and remember', description: 'Use maps and sets when repeated lookup helps.', repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character'] },
    { title: 'Handle text and gaps', description: 'Think through whitespace and missing values.', repIds: ['count-words', 'missing-number'] },
    { title: 'Match openings and closings', description: 'Track what remains unmatched.', repIds: ['valid-parentheses', 'balanced-brackets'] },
  ],
} as const
