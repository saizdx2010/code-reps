import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const aiReviewDepth: Record<string, RepDepth> = {
  'ai-empty-input-suggestion': {
    reasoning:
      'The draft fails two sentences of the contract: reduce without a starting value throws on an empty array, and it averages values the contract says to ignore. Filtering the valid ratings first makes both the average and the empty case follow from one list: no valid ratings means null, and otherwise the average is computed only from values that count.',
    trace:
      'For [5, 4, 0, 4] the draft adds 13 over four values and returns 3.3. The repair keeps 5, 4, and 4, then rounds 13 / 3 = 4.333… to 4.3. For [] the draft throws a TypeError before returning anything; the repair returns null.',
    alternative:
      'Giving reduce a starting value of 0 stops the throw but returns NaN for an empty list, which is still not null. Counting and summing in one loop avoids building a filtered array, which matters only for very large inputs.',
    counterexample:
      'Testing only with the ticket’s example, [5, 4, 4], passes the draft. Treating 0 as a valid low rating returns 3.3 for [5, 4, 0, 4]. Using toFixed(1) returns the string "4.3" rather than a number.',
    transfer:
      'Return the average together with the number of ratings it used, so the page can say “based on 3 ratings”. Decide what count accompanies null. This changed contract is self-reviewed.',
  },
  'ai-invented-api': {
    reasoning:
      'capitalize is not a String method in JavaScript, so the draft throws on the first word. Building each word from charAt(0).toUpperCase() and slice(1).toLowerCase() uses only standard methods. Trimming before splitting on /\\s+/ removes the empty words that leading, trailing, and repeated whitespace would otherwise produce.',
    trace:
      'For "  hello   WORLD ", trim gives "hello   WORLD", splitting on runs of whitespace gives hello and WORLD, and each becomes Hello and World. For " \\t " trim gives an empty string, which has no words, so the result is empty.',
    alternative:
      'A replace with /\\b\\w/g and an uppercase callback is short, but \\b treats the apostrophe in o’neil as a boundary and produces O’Neil, which this contract does not want. Adding capitalize to String.prototype would make the draft run, but changing built-in prototypes affects every other script on the page.',
    counterexample:
      'Splitting on a single space turns double spaces into empty words, and an empty word’s charAt(0) is "", so the result keeps the extra spaces. Forgetting toLowerCase on the rest leaves mIXed as MIXed.',
    transfer:
      'Keep small words such as and, of, and the in lowercase unless they are first. Decide how you recognize them and whether punctuation affects the rule. This changed contract is self-reviewed.',
  },
  'ai-expose-wrong-median': {
    reasoning:
      'Each suggestion breaks a different sentence of the contract, so the table needs one case aimed at each: a mix of one-digit and two-digit numbers for text sorting, an even-length list for the averaging rule, an empty list for null, and the copy comparison for input changes. Running every case on a fresh copy keeps one variant’s mutation from leaking into the next case.',
    trace:
      'Suggestion A sorts [10, 9, 2] as text, giving 10, 2, 9 and a median of 2 instead of 9. Suggestion B returns 3 for [4, 1, 3, 2] instead of 2.5. Suggestion C returns the right medians but leaves the copy sorted. Suggestion D returns NaN for [] instead of null. The ticket’s odd-length, one-digit example exposes none of them.',
    alternative:
      'Property-based testing generates many random lists and compares each variant with the correct version, which finds these mistakes without hand-written cases but needs a trusted reference. A single large hand-picked case can expose several suggestions at once, but then a failure does not say which rule broke.',
    counterexample:
      'Checking only the result misses suggestion C, which returns correct medians while sorting the caller’s array. A table of odd-length lists of one-digit numbers accepts suggestions A and B. Writing expected values by running the correct version makes the table agree with that version rather than with the contract.',
    transfer:
      'Add a fifth suggestion that rounds the even-length average to a whole number. Decide which existing case already exposes it, or which case you would add. This changed contract is self-reviewed.',
  },
}

export const aiReviewGuides: Record<string, ReflectionGuide> = {
  'ai-empty-input-suggestion': {
    plan: [
      'Before running anything, trace the draft on [] and on [5, 4, 0, 4].',
      'Write what it returns and which sentence of the contract it breaks.',
    ],
    explanation: [
      'Name each way the draft broke the contract and the input that showed it.',
      'Explain how your repair decides which ratings count and what happens when none do.',
      'Explain why the ticket’s example was not enough to approve the draft.',
    ],
    example:
      'The draft threw on an empty list and averaged invalid ratings such as 0. I keep only whole numbers from 1 to 5, return null when none remain, and otherwise round the average to one decimal place.',
  },
  'ai-invented-api': {
    plan: ['Run the draft once and copy the exact error.', 'Name the call that does not exist and another step that breaks the contract.'],
    explanation: [
      'Explain how you confirmed that capitalize is not a standard method.',
      'Explain how your code handles repeated whitespace, tabs, and blank text.',
      'Name the check that would have caught the draft before it shipped.',
    ],
    example:
      'The draft called word.capitalize(), which does not exist, and split on single spaces. I trim the text, split on runs of whitespace, and rebuild each word from its first character uppercased plus the rest lowercased. Blank text returns an empty string.',
  },
  'ai-expose-wrong-median': {
    plan: [
      'For each sentence of the contract, write one input a careless version could get wrong.',
      'Name the input that sorting by text would get wrong.',
    ],
    explanation: [
      'For each suggestion, name its mistake and the case that exposes it.',
      'Explain why you compare the copy as well as the result.',
      'Name a wrong median your table would still accept.',
    ],
    example:
      'My cases are [10, 9, 2] → 9 for text sorting, [4, 1, 3, 2] → 2.5 for the even rule, [] → null for the empty rule, and [3, 1, 2] → 2 as a plain case. exposes runs each case on a fresh copy and also compares the copy, which catches the in-place sort.',
  },
}
