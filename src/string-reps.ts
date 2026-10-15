import type { Rep } from './rep-types.ts'

// Text-building journey: compress runs (guided) → group anagrams (independent) → normalized palindrome (recall),
// with word wrapping as extra practice. Checks compare returned strings and arrays, not the technique used.

export const stringReps: Rep[] = [
  {
    id: 'text-run-length',
    title: 'Compress repeated characters',
    category: 'Strings',
    context: 'A log viewer shortens long runs of the same character, such as progress bars, before showing them.',
    prompt:
      'Return a string where each run of the same character is written as that character followed by the run’s length. A run is a group of equal characters next to each other, so the same character can start a new run later. Compare characters exactly: a and A are different. Practice keeping the start of the current run while you scan.',
    example: { input: "compressRuns('aaabcc')", output: "'a3b1c2'" },
    note: 'text has 0 to 1000 printable ASCII characters and contains no digits. An empty string returns an empty string. Spaces are characters too.',
    vocabulary: [
      { term: 'Run', meaning: 'a group of equal characters that stand next to each other' },
      { term: 'Encoding', meaning: 'a different way of writing the same information' },
    ],
    planPrompt: 'How do you know a run has ended? Predict the result for aabaa, for an empty string, and for a run of twelve characters.',
    starter: "function compressRuns(text: string): string {\n  // Write your solution here.\n  return ''\n}\n",
    functionName: 'compressRuns',
    hints: [
      'A run ends when the next character differs from the run’s character, or when the text ends.',
      'Remember where the current run started. When it ends, its length is the current position minus that start.',
      'Write the run’s character and length when it ends, then start the new run at the current position. Check the end of the text as well, or the last run is lost.',
    ],
    checks: [
      { name: 'Compresses the example', input: ['aaabcc'], expected: 'a3b1c2' },
      { name: 'Empty text', input: [''], expected: '' },
      { name: 'One character', input: ['x'], expected: 'x1' },
      { name: 'No repeats', input: ['abc'], expected: 'a1b1c1' },
      { name: 'A run longer than nine', input: ['aaaaaaaaaaaa'], expected: 'a12' },
      { name: 'A character returns later', input: ['aabaa'], expected: 'a2b1a2' },
      { name: 'Case is compared exactly', input: ['aA'], expected: 'a1A1' },
      { name: 'Spaces and punctuation form runs', input: ['!!  '], expected: '!2 2' },
    ],
  },
  {
    id: 'text-anagram-groups',
    title: 'Group anagram labels',
    category: 'Strings',
    context:
      'A label manager suspects that some labels are the same word with scrambled letters, such as listen and silent. It wants them shown together.',
    prompt:
      'Group the words that use exactly the same letters the same number of times. Return the groups in the order their first word appears, and keep each group’s words in input order. A repeated word belongs to its group again. Do not change words.',
    example: {
      input: "anagramGroups(['listen', 'cat', 'silent', 'act'])",
      output: "[['listen', 'silent'], ['cat', 'act']]",
    },
    note: 'words has 0 to 1000 entries. Each word has 1 to 20 lowercase letters from a to z.',
    vocabulary: [
      { term: 'Anagram', meaning: 'a word made by rearranging all the letters of another word' },
      { term: 'Group', meaning: 'a list of words that belong together under one rule' },
    ],
    planPrompt: 'Predict the groups for aab and abb, and for ab, ba, ab. What do two words in the same group have in common?',
    starter: 'function anagramGroups(words: string[]): string[][] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'anagramGroups',
    preserveInput: true,
    hints: [
      'Two words belong together when some description of their letters is identical, whatever order the letters were in.',
      'Same letters is not enough: aab and abb use the same letters different numbers of times.',
      'Build that description as a text key for each word, and look up the group for the key instead of comparing every pair of words.',
    ],
    checks: [
      {
        name: 'Groups the example',
        input: [['listen', 'cat', 'silent', 'act']],
        expected: [
          ['listen', 'silent'],
          ['cat', 'act'],
        ],
      },
      { name: 'No words', input: [[]], expected: [] },
      { name: 'One word', input: [['a']], expected: [['a']] },
      { name: 'A repeated word joins its group again', input: [['ab', 'ba', 'ab']], expected: [['ab', 'ba', 'ab']] },
      { name: 'Different letters stay apart', input: [['abc', 'abd']], expected: [['abc'], ['abd']] },
      { name: 'Letter counts matter', input: [['aab', 'abb']], expected: [['aab'], ['abb']] },
      {
        name: 'Five arrangements of one word',
        input: [['stop', 'pots', 'tops', 'opts', 'post']],
        expected: [['stop', 'pots', 'tops', 'opts', 'post']],
      },
      {
        name: 'Groups follow first appearance',
        input: [['google', 'cat', 'gogole', 'tac', 'dog']],
        expected: [['google', 'gogole'], ['cat', 'tac'], ['dog']],
      },
    ],
  },
  {
    id: 'text-normalized-palindrome',
    title: 'Check a palindrome after normalizing',
    category: 'Strings',
    context:
      'A word game accepts phrases that read the same forwards and backwards, such as “Was it a car or a cat I saw?”. Players type freely, with capitals, spaces, and punctuation.',
    prompt:
      'Return true if the letters and digits of text read the same forwards and backwards when case is ignored. Ignore every other character. Text with no letters or digits counts as a palindrome.',
    example: { input: "isPalindrome('No lemon, no melon')", output: 'true' },
    note: 'text has 0 to 10000 ASCII characters. Letters are A to Z and a to z; digits are 0 to 9.',
    vocabulary: [
      { term: 'Palindrome', meaning: 'text that reads the same forwards and backwards' },
      { term: 'Normalize', meaning: 'convert text to one standard form before comparing it' },
    ],
    planPrompt: 'Predict the result for an empty string, for "!!", and for "0P". Which characters take part in the comparison?',
    starter: 'function isPalindrome(text: string): boolean {\n  // Write your solution here.\n  return false\n}\n',
    functionName: 'isPalindrome',
    hints: [
      'Decide which characters count before comparing anything.',
      'Compare the first counted character with the last, then move both inward.',
      'Either build a cleaned, lowercase copy first, or skip uncounted characters from both ends as you go. Stop when the two positions meet.',
    ],
    checks: [
      { name: 'Classic phrase', input: ['A man, a plan, a canal: Panama'], expected: true },
      { name: 'Not a palindrome', input: ['race a car'], expected: false },
      { name: 'Empty text', input: [''], expected: true },
      { name: 'Only punctuation', input: ['!!'], expected: true },
      { name: 'Ignores case and spaces', input: ['No lemon, no melon'], expected: true },
      { name: 'Digits count', input: ['0P'], expected: false },
      { name: 'Digits in the middle', input: ['ab2ba'], expected: true },
      { name: 'Question with punctuation', input: ['Was it a car or a cat I saw?'], expected: true },
      { name: 'Differs only near the middle', input: ['abca'], expected: false },
    ],
  },
  {
    id: 'text-wrap-column',
    title: 'Wrap text to a column width',
    category: 'Strings',
    context: 'A terminal help screen wraps long descriptions so no line runs past a fixed column.',
    prompt:
      'Split text into words separated by one or more spaces, then return the lines produced by putting as many whole words on each line as fit. Words on a line are joined by one space, and a line’s length must not exceed width. A word longer than width goes on a line by itself, unbroken. Text with no words returns [].',
    example: {
      input: "wrapText('The quick brown fox jumps', 10)",
      output: "['The quick', 'brown fox', 'jumps']",
    },
    note: 'text has 0 to 2000 printable ASCII characters; the only whitespace is the space character. width is an integer from 1 to 80.',
    vocabulary: [
      { term: 'Wrap', meaning: 'continue text on a new line instead of letting it run past an edge' },
      { term: 'Width', meaning: 'the largest number of characters allowed on one line' },
    ],
    planPrompt: 'Predict the lines for two words that fit exactly, a word longer than width, and text with extra spaces.',
    starter: 'function wrapText(text: string, width: number): string[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'wrapText',
    hints: [
      'Extra spaces between words should not produce empty words.',
      'A word fits on the current line when the line’s length plus one space plus the word is at most width.',
      'When the word does not fit, finish the current line and start a new one with that word. An empty current line takes any word, however long.',
    ],
    checks: [
      {
        name: 'Wraps a sentence',
        input: ['The quick brown fox jumps over the lazy dog', 10],
        expected: ['The quick', 'brown fox', 'jumps over', 'the lazy', 'dog'],
      },
      { name: 'Exact fit stays on one line', input: ['ab cd', 5], expected: ['ab cd'] },
      { name: 'One character too long', input: ['ab cd', 4], expected: ['ab', 'cd'] },
      { name: 'Long word on its own line', input: ['a extraordinary b', 5], expected: ['a', 'extraordinary', 'b'] },
      { name: 'Extra spaces collapse', input: ['  hello   world  ', 20], expected: ['hello world'] },
      { name: 'Empty text', input: ['', 10], expected: [] },
      { name: 'Only spaces', input: ['   ', 10], expected: [] },
      { name: 'Width of one', input: ['a b c', 1], expected: ['a', 'b', 'c'] },
    ],
  },
]
