import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Reading an error and its stack trace: the throwing frame, the caller that chose a bad value, and a returned null.
export const stackTraceDepth: Record<string, RepDepth> = {
  'stack-trace-missing-field': {
    reasoning:
      'The top frame names the line that threw: line 5 reads parts[1][0], and for a one-word name parts[1] is undefined. Splitting on runs of spaces after trimming gives the real words, the first and last words supply the initials, and checking for no words before reading a letter means no index is read that does not exist.',
    trace:
      'For "Plato", the starter splits into ["Plato"], so parts[1] is undefined and reading [0] from it throws, which is the reported TypeError. The repair reads words[0] and words[words.length - 1], which are the same word, and returns "P". For "   ", trimming leaves "", and filtering the empty piece leaves no words, so it returns "?" before touching a letter.',
    traceSteps: {
      code: [
        'type Person = { id: string; name: string }',
        'function initials(name: string): string {',
        '  const words = name.trim().split(/\\s+/).filter(Boolean)',
        "  if (words.length === 0) return '?'",
        '  const first = words[0][0].toUpperCase()',
        '  return words.length === 1 ? first : first + words[words.length - 1][0].toUpperCase()',
        '}',
        'function badgeLabels(people: Person[]): string[] {',
        '  return people.map(person => `${initials(person.name)} ${person.id}`)',
        '}',
      ],
      input: 'people = [{id: "12", name: "Plato"}, {id: "4", name: "   "}]',
      steps: [
        {
          line: 8,
          vars: {},
          structure: { kind: 'calls', frames: [{ call: 'badgeLabels(people)', locals: '2 people' }], event: 'call' },
          note: 'badgeLabels is the bottom frame, the same as the last "at" line in the report.',
        },
        {
          line: 8,
          vars: { person: '12' },
          structure: {
            kind: 'calls',
            frames: [{ call: 'badgeLabels(people)' }, { call: 'map callback', locals: 'person 12' }],
            event: 'call',
          },
          note: 'map calls the arrow function once per person. It has no name, so a stack trace shows it only as a position, "at solution.ts:9".',
        },
        {
          line: 2,
          vars: { name: 'Plato', words: '["Plato"]' },
          structure: {
            kind: 'calls',
            frames: [{ call: 'badgeLabels(people)' }, { call: 'map callback' }, { call: 'initials("Plato")', locals: 'words ["Plato"]' }],
            event: 'call',
          },
          note: 'initials is now the top frame. In the starter, this is where the error was thrown: the frame at the top of the report.',
        },
        {
          line: 5,
          vars: { first: 'P', result: 'P' },
          structure: {
            kind: 'calls',
            frames: [{ call: 'badgeLabels(people)' }, { call: 'map callback' }, { call: 'initials("Plato")', returns: '"P"' }],
            event: 'return',
          },
          note: 'One word, so the first letter is the whole answer. The starter read parts[1][0] here, and parts[1] did not exist.',
        },
        {
          line: 8,
          vars: { label: 'P 12' },
          structure: {
            kind: 'calls',
            frames: [{ call: 'badgeLabels(people)' }, { call: 'map callback', returns: '"P 12"' }],
            event: 'return',
          },
          note: 'initials has returned, so its frame is gone. The callback builds "P 12" and returns it to map.',
        },
        {
          line: 3,
          vars: { name: '   ', words: '[]' },
          structure: {
            kind: 'calls',
            frames: [{ call: 'badgeLabels(people)' }, { call: 'map callback' }, { call: 'initials("   ")', returns: '"?"' }],
            event: 'return',
          },
          note: 'For the space-only name there are no words, so initials returns "?" before reading any letter.',
        },
        {
          line: 8,
          vars: { result: '["P 12","? 4"]' },
          structure: { kind: 'calls', frames: [{ call: 'badgeLabels(people)', returns: '["P 12", "? 4"]' }], event: 'return' },
          note: 'Every callback has returned. Only badgeLabels is left, and it returns one label per person.',
        },
      ],
    },
    alternative:
      'A regular expression such as /\\S+/g can collect the words directly instead of split and filter. Both visit each character once. Wrapping the call in try and catch would hide the crash but print a wrong or missing badge, which the contract does not allow.',
    counterexample:
      'Guarding only with parts[1] ?? "" fixes "Plato" but still crashes on "" and gives "GB" for "Grace Brewster Hopper", because the second word is not the last word. Splitting on a single space keeps empty pieces, so "  bell   hooks " reads an empty first word.',
    transfer:
      'Change the label to use the initials of every word, up to three. Which line would a one-letter name such as "A" now reach, and what would a stack trace show if it failed? This changed contract is self-reviewed.',
  },
  'stack-trace-wrong-caller': {
    reasoning:
      'padCell threw because width - text.length was negative, but its contract says it is only given a width at least as long as the text, so padCell is behaving as designed. The frame below it, formatRow, chose the width: it paired cell i with widths[i + 1]. Pairing each cell with the width at its own index keeps padCell’s contract true for every call.',
    trace:
      'For ["Engineer", "Ada"] with widths [8, 5], the starter gives "Engineer" the width 5, so repeat receives 5 - 8 = -3, which is the reported RangeError. With matching indices, "Engineer" gets 8 and no padding, and "Ada" gets 5 and two spaces, giving "Engineer | Ada  ". For the last column, the starter read widths[2], which is undefined; the count became NaN, repeat treated it as 0, and the cell was silently left unpadded.',
    alternative:
      'padEnd(width) does the same padding as padCell and would not throw for a short width. Using it in formatRow still needs the right width per column; switching functions alone would hide this crash and keep every column misaligned.',
    counterexample:
      'Changing padCell to Math.max(0, width - text.length) stops the crash but still pads "Ada" to the wrong width and leaves the last column unpadded. The report pointed at padCell, but the cause was one frame lower.',
    transfer:
      'Suppose widths could be shorter than a cell, and long cells should be cut to fit. Which function should own that rule, and which frame would a stack trace show if a negative count slipped through again? This changed contract is self-reviewed.',
  },
  'stack-trace-null-lookup': {
    reasoning:
      'The top frame is the arrow function inside ownerNames, reading .name from the value findUser returned. findUser had already returned null on purpose, so it is not on the stack. Handling null in the caller, where "no user" has a meaning, keeps findUser’s shared contract and covers both a null ownerId and an id that matches nobody.',
    trace:
      'For ownerId "u9" with only user u1, findUser returns null, and reading .name from null throws the reported TypeError at line 9. With the repair, the callback checks the result: null gives "Unassigned", and user u2 named "" gives "" because the user exists. A null ownerId skips the lookup and also gives "Unassigned".',
    alternative:
      'Building a Map from id to name once makes each lookup O(1) instead of a scan per ticket, which matters for large lists. Optional chaining, findUser(...)?.name ?? "Unassigned", is concise, but the null ownerId still needs its own check, because findUser expects a string.',
    counterexample:
      'Writing findUser(...)?.name || "Unassigned" turns a real empty name into "Unassigned". Changing findUser to return a placeholder user would break the other screens that rely on null meaning "not found".',
    transfer:
      'Return the owner’s team as well, where a user may have no team. Decide which layer turns each missing value into text, and name the frame a stack trace would show if one were missed. This changed contract is self-reviewed.',
  },
}

export const stackTraceGuides: Record<string, ReflectionGuide> = {
  'stack-trace-missing-field': {
    plan: [
      'Name the frame that threw and the value on that line that was undefined.',
      'List the names that reach the same line: one word, many spaces, no words, more than two words.',
    ],
    explanation: [
      'Explain why reading parts[1] failed for the reported name.',
      'Trace one name with extra spaces and one with no words through your repair.',
    ],
    example:
      'The top frame was initials at line 5, which read parts[1][0]; for "Plato" there is no parts[1]. I split on runs of spaces after trimming, return "?" when there are no words, and use the first and last words, so one-word, spaced, and three-word names all work.',
  },
  'stack-trace-wrong-caller': {
    plan: [
      'Decide whether the top frame broke its contract or was given a bad value.',
      'Find the frame that chose the value and the width each cell should get.',
    ],
    explanation: [
      'Explain why padCell threw even though its code is correct.',
      'Trace the reported row and the last column through your repair.',
    ],
    example:
      'padCell threw because it got width 5 for "Engineer", but its contract only allows widths at least as long as the text. formatRow passed widths[index + 1]; using widths[index] gives "Engineer" 8 and "Ada" 5, and the last column is padded instead of reading undefined.',
  },
  'stack-trace-null-lookup': {
    plan: [
      'Explain why findUser does not appear in the stack trace.',
      'List every input that makes the lookup return null, and choose where to handle it.',
    ],
    explanation: [
      'Explain where the null came from and why the caller should handle it.',
      'Trace a missing owner, a null owner, and an empty name.',
    ],
    example:
      'findUser had already returned null for an owner who left, so only the callback in ownerNames was on the stack when it read .name. I keep findUser as it is and return "Unassigned" for a null result or null ownerId, checking for null so an empty name is still returned.',
  },
}
