import type { RepDepth } from './rep-depth.ts'

export const journeyPracticeDepth: Record<string, RepDepth> = {
  'sum-in-range': {
    reasoning: 'A running sum contains exactly the qualifying values already visited.',
    trace: 'For [2,2,3] with bounds 2 and 2, both 2s qualify: totals 2, then 4; 3 leaves 4 unchanged.',
    alternative: 'Filtering then reducing is readable but allocates a selected array; one scan needs constant extra space.',
    counterexample: 'Strict comparisons exclude both 2s when low and high are 2.',
    transfer: 'What changes if the bounds may arrive in either order? This changed contract is self-reviewed, not checked by the original cases.'
  },
  'adjacent-rise-count': {
    reasoning: 'Each pair is assessed exactly once; the count represents rises among visited pairs.',
    trace: 'For [1,3,3,2,5], 1→3 adds one, 3→3 and 3→2 add none, and 2→5 makes two.',
    alternative: 'A sliced array with filter also works but creates a copy; indexed scanning needs constant extra space.',
    counterexample: 'Using >= reports a rise for [2,2], which must return zero.',
    transfer: 'How would you return the start and end of the longest rising run? This changed contract is self-reviewed, not checked by the original cases.'
  },
  'last-matching-word': {
    reasoning: 'Scanning backward makes the first accepted word the last qualifying word in input order.',
    trace: 'For ["A","a"] and suffix "A", the final "a" fails, then "A" matches; return "A" unchanged.',
    alternative: 'A forward scan can overwrite a candidate on every match; both avoid allocating a filtered list.',
    counterexample: 'Lowercasing would incorrectly return "a" for ["A","a"] with suffix "A".',
    transfer: 'How would case-insensitive matching preserve the original output spelling? This changed contract is self-reviewed, not checked by the original cases.'
  },
  'word-length-span': {
    reasoning: 'The minimum and maximum lengths bound all visited words; their difference measures spread, not word count.',
    trace: 'For ["","four"], lengths are 0 and 4; maximum minus minimum is 4.',
    alternative: 'Tracking two bounds in a loop uses constant extra space; sorting a copied list costs more time.',
    counterexample: 'Trimming " a " changes its length from 3 to 1 and makes [" a ","!"] produce the wrong span.',
    transfer: 'How would you define length for emoji and combined characters? This changed contract is self-reviewed, not checked by the original cases.'
  },
  'shared-number-count': {
    reasoning: 'Iterating distinct left values counts each common value once, regardless of repetitions on either side.',
    trace: 'For [2,2] and [2,2], both sets contain only 2, so one membership success returns 1.',
    alternative: 'Searching right for each distinct left value avoids a second set but can require quadratic work.',
    counterexample: 'Counting matching left occurrences returns 2 instead of 1 for [2,2] and [2].',
    transfer: 'How would the result change if pairs of occurrences rather than distinct values were counted? This changed contract is self-reviewed, not checked by the original cases.'
  },
  'singleton-number-list': {
    reasoning: 'Complete counts are needed before choosing output; scanning the original array preserves order.',
    trace: 'For [4,2,4,3,2,1], counts are 4:2, 2:2, 3:1, 1:1; only 3 then 1 survive.',
    alternative: 'Checking first and last positions for each value is concise but quadratic; a count map takes linear expected time and space.',
    counterexample: 'A Set returns [2] for [2,2], but the correct result is empty.',
    transfer: 'What would change when returning the first value occurring exactly twice? This changed contract is self-reviewed, not checked by the original cases.'
  },
  'undo-word-actions': {
    reasoning: 'The stored words are precisely the active additions; undo removes only the latest still-active addition.',
    trace: 'For ["undo","UNDO","UNDO","x"], add lowercase undo, remove it, ignore the extra undo, then add x.',
    alternative: 'A linked list supports latest-item removal but adds node complexity; an array stack fits this bounded task.',
    counterexample: 'Removing the first word gives ["blue"] instead of ["red"] for ["red","blue","UNDO"].',
    transfer: 'How would a REDO action affect history after a new word is added? This changed contract is self-reviewed, not checked by the original cases.'
  },
  'erase-text-markers': {
    reasoning: 'The stack holds the text remaining after each prefix; a marker removes the latest remaining character only.',
    trace: 'For "a #b", add a and a space; # removes the space; adding b gives "ab".',
    alternative: 'Repeated string slicing is simple but may copy growing strings repeatedly; a character array collects output in linear work.',
    counterexample: 'Deleting all # symbols leaves "abc" for "abc###", which must return empty text.',
    transfer: 'What contract would allow a literal # without erasing a character? This changed contract is self-reviewed, not checked by the original cases.'
  }
}

export const journeyPracticeGuides = {
  'sum-in-range': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return the sum of values between low and high, including both endpoints. Count every occurrence.'
    ],
    explanation: [
      'Strict comparisons exclude both 2s when low and high are 2.',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'A running sum contains exactly the qualifying values already visited. For [2,2,3] with bounds 2 and 2, both 2s qualify: totals 2, then 4; 3 leaves 4 unchanged. Filtering then reducing is readable but allocates a selected array; one scan needs constant extra space.'
  },
  'adjacent-rise-count': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return how many adjacent pairs have a second value strictly greater than the first. Equal neighbors do not count.'
    ],
    explanation: [
      'Using >= reports a rise for [2,2], which must return zero.',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'Each pair is assessed exactly once; the count represents rises among visited pairs. For [1,3,3,2,5], 1→3 adds one, 3→3 and 3→2 add none, and 2→5 makes two. A sliced array with filter also works but creates a copy; indexed scanning needs constant extra space.'
  },
  'last-matching-word': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return the last word ending with suffix, preserving its spelling. Matching is case-sensitive. An empty suffix matches every word, including an empty word. Return null if nothing matches.'
    ],
    explanation: [
      'Lowercasing would incorrectly return "a" for ["A","a"] with suffix "A".',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'Scanning backward makes the first accepted word the last qualifying word in input order. For ["A","a"] and suffix "A", the final "a" fails, then "A" matches; return "A" unchanged. A forward scan can overwrite a candidate on every match; both avoid allocating a filtered list.'
  },
  'word-length-span': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return the longest word length minus the shortest word length. Return 0 for no words. Empty words have length zero.'
    ],
    explanation: [
      'Trimming " a " changes its length from 3 to 1 and makes [" a ","!"] produce the wrong span.',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'The minimum and maximum lengths bound all visited words; their difference measures spread, not word count. For ["","four"], lengths are 0 and 4; maximum minus minimum is 4. Tracking two bounds in a loop uses constant extra space; sorting a copied list costs more time.'
  },
  'shared-number-count': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return how many distinct numbers appear in both arrays. Repetitions in either array count only once.'
    ],
    explanation: [
      'Counting matching left occurrences returns 2 instead of 1 for [2,2] and [2].',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'Iterating distinct left values counts each common value once, regardless of repetitions on either side. For [2,2] and [2,2], both sets contain only 2, so one membership success returns 1. Searching right for each distinct left value avoids a second set but can require quadratic work.'
  },
  'singleton-number-list': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Return numbers occurring exactly once, in their original order. Return an empty array if none qualify.'
    ],
    explanation: [
      'A Set returns [2] for [2,2], but the correct result is empty.',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'Complete counts are needed before choosing output; scanning the original array preserves order. For [4,2,4,3,2,1], counts are 4:2, 2:2, 3:1, 1:1; only 3 then 1 survive. Checking first and last positions for each value is concise but quadratic; a count map takes linear expected time and space.'
  },
  'undo-word-actions': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Process actions in order. The exact token UNDO removes the most recently added word if one exists; otherwise it does nothing. Every other token adds that word. Return the remaining words in order.'
    ],
    explanation: [
      'Removing the first word gives ["blue"] instead of ["red"] for ["red","blue","UNDO"].',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'The stored words are precisely the active additions; undo removes only the latest still-active addition. For ["undo","UNDO","UNDO","x"], add lowercase undo, remove it, ignore the extra undo, then add x. A linked list supports latest-item removal but adds node complexity; an array stack fits this bounded task.'
  },
  'erase-text-markers': {
    plan: [
      'Predict the example and a boundary case before implementing.',
      'Read text left to right. Each # erases the most recent remaining character, if any. Other characters remain in order. Extra erase markers do nothing.'
    ],
    explanation: [
      'Deleting all # symbols leaves "abc" for "abc###", which must return empty text.',
      'Explain your time and storage costs and confirm inputs stay unchanged.'
    ],
    example: 'The stack holds the text remaining after each prefix; a marker removes the latest remaining character only. For "a #b", add a and a space; # removes the space; adding b gives "ab". Repeated string slicing is simple but may copy growing strings repeatedly; a character array collects output in linear work.'
  }
}
