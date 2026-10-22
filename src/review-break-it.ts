import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Reviews for the Break it hunts in src/break-it-reps.ts. They name the authored bugs, so they appear only after the hunt.
export const breakItDepth: Record<string, RepDepth> = {
  'break-page-count': {
    reasoning:
      'A suspect hides its bugs where its own branches meet the contract’s edges. The contract is one division rounded up, so the edges are the smallest allowed items (0), the switch from one page to several (items equal to perPage), and a last page that comes out exactly full. The suspect’s first branch returns 1 for every items up to perPage, which swallows 0; its second branch adds 1 to a rounded-down division, which is one too many whenever perPage divides items evenly.',
    trace:
      'items 0, perPage 5: the suspect takes the first branch because 0 <= 5 and returns 1; the contract computes ceil(0 / 5) = 0, so the no-items bug is caught. items 10, perPage 5: 10 <= 5 is false, so the suspect returns floor(2) + 1 = 3 while ceil(2) = 2, which catches the full-last-page bug. items 5, perPage 5 looks just as risky, but the first branch answers 1, which is right, so it catches nothing.',
    alternative:
      'You could also try every items from 0 to 20 with a few perPage values and compare. That brute-force sweep finds both bugs without thinking about edges, but it needs a trusted answer key and it does not tell you which rule broke. Reading the contract for its edges finds the same two inputs in a handful of tries and names the rule each one breaks.',
    counterexample:
      'A hunt that only tries comfortable values such as items 7, perPage 3 or items 23, perPage 10 sees the suspect agree every time, because rounding a remainder down and adding 1 is the same as rounding up. Trying items 1, perPage 1 or items 5, perPage 5 also agrees, so equal values alone do not expose the full-page bug: the last page has to come out full on the second branch.',
    transfer:
      'A teammate fixes pageCount with if (items === 0) return 0 at the top and return Math.floor((items - 1) / perPage) + 1 below. Before you try anything, decide which edges you would test first and whether any input still breaks the contract. This transfer is self-reviewed.',
  },
}

export const breakItGuides: Record<string, ReflectionGuide> = {
  'break-page-count': {
    plan: [
      'List each contract sentence and the input at its edge: the smallest items, items equal to perPage, and a last page that comes out full.',
      'Predict the suspect’s answer for each input by reading its branches before you try it.',
      'Name one input you expect the suspect to get right, so a same answer still teaches you something.',
    ],
    explanation: [
      'Name each bug in one sentence: the input that shows it and the contract rule it breaks.',
      'Say which branch of the suspect causes each bug.',
      'Name an input that looks risky but that the suspect gets right. The checks do not show you would find every bug.',
    ],
    example:
      'Bug 1: with no items the suspect still returns 1 page (items 0, perPage 5), because its first branch covers every items up to perPage, but no items means no pages. Bug 2: when the last page comes out exactly full it adds an empty page (items 10, perPage 5 gives 3, not 2), because it rounds down and always adds 1. items 5, perPage 5 looks risky, but the first branch answers 1, which is right.',
  },
}
