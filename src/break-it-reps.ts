import { lines } from './rep-helpers.ts'
import type { Rep } from './rep-types.ts'

// Break it: read a short suspect and its contract, then try one input at a time until every hidden bug is caught.
// The suspect, the contract, and each one-bug variant run in the practice worker (src/run-rep.ts); the learner's tries
// are the attempt's code (src/break-it.ts). See docs/BREAK_IT.md before adding another hunt.
const signature = 'function pageCount(items: number, perPage: number) {'

export const breakItReps: Rep[] = [
  {
    id: 'break-page-count',
    title: 'Break pageCount',
    category: 'Testing with cases',
    format: 'break',
    context:
      'A teammate wrote pageCount for a search results page. It looks right and it passed the one example they tried, but two bugs are hidden in it. You cannot change the code: your move is the input.',
    prompt:
      'Find inputs where the suspect pageCount(items, perPage) disagrees with its contract. pageCount returns how many pages it takes to show items, perPage at a time. Every page is full except possibly the last. No items means no pages. items is a whole number ≥ 0; perPage is a whole number ≥ 1. Each try runs the suspect and the contract on a fresh copy of your input. Catch both hidden bugs, then name each one in a sentence.',
    brief: {
      summary: 'Find inputs where the suspect pageCount(items, perPage) disagrees with its contract. Two bugs are hidden in it.',
      rules: [
        'Returns how many pages it takes to show items, perPage at a time.',
        'Every page is full except possibly the last.',
        'No items means no pages.',
        'items is a whole number ≥ 0; perPage is a whole number ≥ 1.',
      ],
    },
    acceptanceCriteria: [
      'Name each bug in one sentence: an input that shows it and the rule it breaks.',
      'Name an input that looks risky but that the suspect gets right.',
    ],
    example: { input: 'Try items 7, perPage 3', output: 'suspect 3 · contract 3 · Same answer' },
    note: 'Inputs outside the rules are refused, so a catch always means a real bug; this hunt also caps each field at 1,000,000. The checks confirm that your tries make the suspect disagree with the contract once for each hidden bug. They do not establish that you would find every bug, and naming each bug stays self-reviewed.',
    vocabulary: [
      { term: 'Suspect', meaning: 'the code under test, which you can read and run but not change' },
      { term: 'Contract', meaning: 'the written rules that decide the right answer for every allowed input' },
      { term: 'Boundary case', meaning: 'an input at the edge of a rule, such as the smallest allowed value' },
      { term: 'Catch', meaning: 'an input where the suspect and the contract give different answers' },
    ],
    planPrompt:
      'Before you try anything, list three inputs you would try first and the contract sentence each one tests. Which input do you expect the suspect to get right, and why?',
    // No tries yet: the saved code is the tries table (src/break-it.ts).
    starter: '[]',
    functionName: 'pageCount',
    breakIt: {
      suspect: lines(signature, '  if (items <= perPage) return 1', '  return Math.floor(items / perPage) + 1', '}'),
      contract: lines(signature, '  return Math.ceil(items / perPage)', '}'),
      params: [
        { name: 'items', min: 0, max: 1_000_000, rule: 'items is a whole number ≥ 0.' },
        { name: 'perPage', min: 1, max: 1_000_000, rule: 'perPage is a whole number ≥ 1.' },
      ],
      bugs: [
        { id: 'no-items', variant: lines(signature, '  if (items <= perPage) return 1', '  return Math.ceil(items / perPage)', '}') },
        {
          id: 'full-last-page',
          variant: lines(
            signature,
            '  if (items === 0) return 0',
            '  if (items <= perPage) return 1',
            '  return Math.floor(items / perPage) + 1',
            '}',
          ),
        },
      ],
    },
    hints: [
      'Take the contract one sentence at a time and ask which input sits right on its edge.',
      'Each field has a smallest allowed value. Try the limits the rules name, not only comfortable middle values.',
      'Compare a last page that comes out short with one that comes out exactly full: try items that divide evenly by perPage, and items that do not.',
    ],
    checks: [
      { name: 'Catches bug 1', input: [], expected: true, bug: 'no-items' },
      { name: 'Catches bug 2', input: [], expected: true, bug: 'full-last-page' },
      { name: 'Every try follows the input rules', input: [], expected: true },
    ],
  },
]
