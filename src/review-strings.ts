import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

const runs = ['a', 'a', 'a', 'b', 'c', 'c']
const taco = ['t', 'a', 'c', 'o', 'c', 'a', 't']

export const stringDepth: Record<string, RepDepth> = {
  'text-run-length': {
    reasoning:
      'start always marks the first character of the run being scanned, so everything from start up to the current position is one run of equal characters. A run ends exactly when the next character differs or the text ends; at that moment its length is the distance from start, and the next run begins at the current position. Checking the end of the text inside the same condition writes the final run without a separate step.',
    trace:
      'For aabaa: the first run ends at b, writing a2. b ends at the next a, writing b1. The text ends after two more a characters, writing a2. The two a runs stay separate because they are not next to each other.',
    traceSteps: {
      code: [
        'function compressRuns(text: string): string {',
        "  let result = ''",
        '  let start = 0',
        '  for (let i = 1; i <= text.length; i++) {',
        '    if (i === text.length || text[i] !== text[start]) {',
        '      result += text[start] + (i - start)',
        '      start = i',
        '    }',
        '  }',
        '  return result',
        '}',
      ],
      input: "text = 'aaabcc'",
      steps: [
        {
          line: 2,
          vars: { start: 0, result: '' },
          structure: { kind: 'array', values: runs, pointers: { start: 0 } },
          note: 'The first run starts at position 0. Nothing has been written yet.',
        },
        {
          line: 4,
          vars: { i: 2, start: 0 },
          structure: { kind: 'array', values: runs, pointers: { start: 0, i: 2 } },
          note: 'Positions 1 and 2 hold a, the same as text[start], so the run keeps growing and nothing is written.',
        },
        {
          line: 5,
          vars: { i: 3, result: 'a3' },
          structure: { kind: 'array', values: runs, pointers: { start: 0, i: 3 } },
          note: 'b differs from a, so the run of a has ended. Its length is 3 - 0 = 3.',
        },
        {
          line: 6,
          vars: { start: 3, result: 'a3' },
          structure: { kind: 'array', values: runs, pointers: { start: 3, i: 3 }, dimmed: [0, 1, 2] },
          note: 'The new run starts where the old one ended, at the b.',
        },
        {
          line: 5,
          vars: { i: 4, result: 'a3b1' },
          structure: { kind: 'array', values: runs, pointers: { start: 3, i: 4 }, dimmed: [0, 1, 2] },
          note: 'c differs from b, so write b1 and start a new run at position 4.',
        },
        {
          line: 5,
          vars: { i: 6, result: 'a3b1c2' },
          structure: { kind: 'array', values: runs, pointers: { start: 4 }, dimmed: [0, 1, 2, 3] },
          note: 'i reaches the end of the text, past the last position. The end also closes a run, so c2 is written.',
        },
        {
          line: 9,
          vars: { result: 'a3b1c2' },
          structure: { kind: 'array', values: runs, dimmed: [0, 1, 2, 3, 4, 5] },
          note: 'Every character was looked at once. Without the end check, the last run would be lost.',
        },
      ],
    },
    alternative:
      'A regular expression such as /(.)\\1*/g finds every run in one call and is short, but its backreference is harder to read for someone new to patterns. Building an array of parts and joining it at the end avoids repeated string concatenation, which matters for very long text in some engines.',
    counterexample:
      'Counting each character’s total with a map gives a4b1 for aabaa, merging runs that are not next to each other. Writing only when the character changes, without the end check, returns a3b1 for aaabcc. Writing the count before the character gives 3a1b2c, the wrong encoding.',
    transfer:
      'Decode an encoded string back to the original, where counts may have several digits. Decide how you know where a count ends. This changed contract is self-reviewed.',
  },
  'text-anagram-groups': {
    reasoning:
      'Two words are anagrams exactly when they have the same count of each letter, so any key that encodes those counts, such as the letters sorted alphabetically, is identical for every word in a group and different between groups. A Map from key to group keeps groups in first-appearance order because Maps iterate in insertion order, and pushing each word as it arrives keeps words in input order.',
    trace:
      'For google, cat, gogole, tac, dog: google and gogole both sort to eggloo, cat and tac both sort to act, and dog sorts to dgo. The Map was created in the order eggloo, act, dgo, so the groups come out in that order.',
    alternative:
      'A key of 26 letter counts, such as 1,0,0,…, avoids sorting each word and costs O(length) per word instead of O(length log length); with words of at most 20 letters the difference is small. Comparing every pair of words works but costs O(n²) comparisons.',
    counterexample:
      'Using the set of distinct letters as the key puts aab and abb together. Collecting groups in a plain object whose keys look like numbers can reorder them. Sorting the input words first changes the required group and word order.',
    transfer:
      'Treat uppercase and lowercase letters as the same, and ignore spaces, so Dormitory and dirty room match. Decide which normalization the key needs and which form of each word you return. This changed contract is self-reviewed.',
  },
  'text-normalized-palindrome': {
    reasoning:
      'After keeping only letters and digits and lowercasing them, the text is a palindrome exactly when each character equals its mirror. Comparing from both ends inward checks every mirrored pair once and can stop at the first mismatch; when the two positions meet, every pair has matched. An empty or one-character result has no pairs to fail.',
    trace:
      'For Taco cat!, the counted characters are tacocat. Compare t with t, a with a, and c with c; the middle o has no partner, so the result is true. For 0P the characters are 0 and p, which differ, so the result is false.',
    traceSteps: {
      code: [
        'function isPalindrome(text: string): boolean {',
        "  const chars = text.toLowerCase().replace(/[^a-z0-9]/g, '')",
        '  let left = 0',
        '  let right = chars.length - 1',
        '  while (left < right) {',
        '    if (chars[left] !== chars[right]) return false',
        '    left++',
        '    right--',
        '  }',
        '  return true',
        '}',
      ],
      input: "text = 'Taco cat!'",
      steps: [
        {
          line: 1,
          vars: { chars: 'tacocat' },
          structure: { kind: 'array', values: taco },
          note: 'Lowercase first, then drop everything that is not a letter or digit: the capital T, the space, and the ! all change or disappear.',
        },
        {
          line: 5,
          vars: { left: 0, right: 6 },
          structure: { kind: 'array', values: taco, pointers: { left: 0, right: 6 } },
          note: 't matches t, so the outermost pair is fine. Move both pointers inward.',
        },
        {
          line: 5,
          vars: { left: 1, right: 5 },
          structure: { kind: 'array', values: taco, pointers: { left: 1, right: 5 }, dimmed: [0, 6] },
          note: 'a matches a.',
        },
        {
          line: 5,
          vars: { left: 2, right: 4 },
          structure: { kind: 'array', values: taco, pointers: { left: 2, right: 4 }, dimmed: [0, 1, 5, 6] },
          note: 'c matches c.',
        },
        {
          line: 4,
          vars: { left: 3, right: 3 },
          structure: { kind: 'array', values: taco, pointers: { left: 3, right: 3 }, dimmed: [0, 1, 2, 4, 5, 6] },
          note: 'The pointers meet at o. A middle character has no partner, so the loop ends without comparing it.',
        },
        {
          line: 9,
          vars: { result: true },
          structure: { kind: 'array', values: taco, dimmed: [0, 1, 2, 3, 4, 5, 6] },
          note: 'Every mirrored pair matched. An empty cleaned string never enters the loop and also returns true.',
        },
      ],
    },
    alternative:
      'Comparing the cleaned string with its reverse is one line and equally O(n), but builds two extra strings and always reads everything, even when the first pair differs. Skipping uncounted characters from both ends without building a copy uses O(1) extra space at the cost of a more careful loop.',
    counterexample:
      'Cleaning with /[^a-z]/ drops digits and accepts 0P as a palindrome. Removing characters before lowercasing with /[^a-z0-9]/ deletes every capital letter. Comparing the raw text with its reverse rejects No lemon, no melon because of the spaces and capitals.',
    transfer:
      'Allow one character to be removed before the check, so abca counts. Decide what you try when the first mismatch appears and how many options you need to test. This changed contract is self-reviewed.',
  },
  'text-wrap-column': {
    reasoning:
      'The contract asks for the greedy rule: each word joins the current line whenever it fits. A word fits when the line’s length plus one space plus the word stays within width, and an empty line accepts any word, which is how an overlong word gets a line of its own. Filling each line as far as possible also produces the fewest lines, because it never leaves later words with less room.',
    trace:
      'For a extraordinary b with width 5: a starts the first line. extraordinary does not fit after a, so the line a is finished and extraordinary starts a new line even though it is 13 characters long. b does not fit after it, so extraordinary is finished and b starts the last line.',
    alternative:
      'Breaking at the last space before width in the remaining text is another common method, but it needs special handling for runs of spaces and overlong words. Balanced wrapping, which minimizes ragged right edges, needs dynamic programming and produces different lines from this greedy contract.',
    counterexample:
      'Splitting on a single space produces empty words from double spaces and lines that start with a space. Testing line + space + word < width instead of <= sends ab cd with width 5 onto two lines. Forcing an overlong word onto a line that already has words exceeds the width.',
    transfer:
      'Break words longer than width into pieces of at most width characters. Decide whether a piece may share a line with the next word. This changed contract is self-reviewed.',
  },
}

export const stringGuides: Record<string, ReflectionGuide> = {
  'text-run-length': {
    plan: ['How do you know a run has ended?', 'Predict the result for aabaa, for an empty string, and for a run of twelve characters.'],
    explanation: [
      'Explain how your code finds where each run ends, including the last one.',
      'Explain why two runs of the same character stay separate.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I keep the start of the current run and scan forward. When the next character differs, or the text ends, I write the run’s character and its length, then start a new run there. That is O(n) time and O(n) storage for the result.',
  },
  'text-anagram-groups': {
    plan: ['Predict the groups for aab and abb, and for ab, ba, ab.', 'Write down what two words in the same group have in common.'],
    explanation: [
      'Explain why your key is equal for anagrams and different for other words, including aab and abb.',
      'Explain how your result keeps the required group order and word order.',
      'State time and storage costs for your approach.',
    ],
    example:
      'For each word I build a key by sorting its letters, then push the word onto the Map entry for that key, creating it the first time. Map insertion order gives the group order. That is O(n × k log k) time for n words of length k and O(n × k) storage.',
  },
  'text-normalized-palindrome': {
    plan: ['Predict the result for an empty string, for "!!", and for "0P".', 'Name which characters take part in the comparison.'],
    explanation: [
      'Explain how you decide which characters count, and in which order you lowercase and filter.',
      'Explain why your comparison can stop early and when it is finished.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I lowercase the text and keep only a to z and 0 to 9. Then I compare characters from both ends, moving inward, and return false at the first mismatch. When the positions meet, I return true. That is O(n) time and O(n) storage for the cleaned copy.',
  },
  'text-wrap-column': {
    plan: [
      'Predict the lines for two words that fit exactly, a word longer than width, and text with extra spaces.',
      'Write the exact test for whether a word fits.',
    ],
    explanation: [
      'Explain how your code handles extra spaces and an empty text.',
      'Explain why an overlong word ends up alone on its line.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I split on runs of spaces and drop empty words. I add each word to the current line when the line is empty or the line plus a space plus the word is within width; otherwise I finish the line and start a new one. That is O(n) time for n characters.',
  },
}
