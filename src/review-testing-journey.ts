import type { RepDepth } from './rep-depth.ts'

export const testingJourneyDepth: Record<string, RepDepth> = {
  'expose-page-bugs': {
    reasoning: 'A case table exposes a faulty version only when some case sits where the fault changes the answer. Each contract sentence needs a case at its edge, and the input copy has to be compared after the call, because a version can return the right page and still damage its input.',
    trace: 'Case {items: [10, 20, 30], page: 2, size: 2, expected: [30]} runs on a copy. correct slices indexes 2 to 4 and returns [30]. drops-short-last-page gets length 1, below size 2, and returns [], so exposes returns true. removes-from-input returns [30] but the copy is left as [10, 20], which differs from the original and exposes it.',
    alternative: 'Generating many random cases is cheap and finds surprises, but it needs a trusted answer key and rarely lands on exact boundaries. A short hand-chosen table is easier to explain, so each case can name the sentence it protects.',
    counterexample: 'A table of only page 1 and page 2 on a list that divides evenly accepts drops-short-last-page, because every page is full. A table that compares only return values accepts removes-from-input.',
    transfer: 'Add a fifth faulty version that returns a page copy of the wrong item type, or that treats size as larger than the list. Decide which case would catch it, then say what your table still cannot catch. This transfer is self-reviewed.',
  },
  'repair-range-label': {
    reasoning: 'The label has to agree with what the page shows: the first position is the zero-based offset plus one, and the last position is capped at the total. The empty total is handled first so no other rule can describe a list that has nothing in it.',
    trace: 'rangeLabel(25, 3, 10): offset 20 so start is 21; page * size is 30 so end is min(30, 25) = 25; the label is Showing 21-25 of 25. The faulty code printed 20-30 because it never added one or capped the end.',
    alternative: 'Compute the last item first and derive the start from it, or compute the page count. Both work, but computing start and a capped end directly mirrors the wording of the contract.',
    counterexample: 'Fixing only the reported pages leaves rangeLabel(0, 5, 0) printing a range for an empty list, and rangeLabel(25, 4, 10) printing 31-25.',
    transfer: 'The product team wants Showing 1 of 1 for a single item and a thousands separator for large totals. Decide which rule changes and which checks you would add. This transfer is self-reviewed.',
  },
  'expose-overlap-bugs': {
    reasoning: 'Half-open intervals hide their faults on boundaries: touching ends, empty intervals, the order of the arguments, shared starts, and changed inputs. A table covers the requirement list when every sentence has a boundary case.',
    trace: 'overlaps([1, 5], [5, 9]) is false in the requirements because 5 is excluded. A version using <= says true, so that one case exposes it. overlaps([5, 9], [1, 6]) is true, while a version that only tests whether the second start lies inside the first says false.',
    alternative: 'Comparing a version against the correct one on every small pair would find these faults without hand-written answers, but it only works when a trusted version exists. Here the written requirements are the key.',
    counterexample: 'Cases made only of clearly overlapping and clearly separate intervals accept every one of the five versions except the one that changes its inputs.',
    transfer: 'Change the requirements to closed intervals that include both ends. Decide which of your cases flip, and which faulty version you would now write. This transfer is self-reviewed.',
  },
}

export const testingJourneyGuides: Record<string, { plan: string[]; explanation: string[]; example: string }> = {
  'expose-page-bugs': {
    plan: ['Write one case for each sentence of the contract before you code exposes.', 'Decide how each run gets a fresh copy of its items.', 'Decide what exposes compares after the call: the result, the copy, or both.'],
    explanation: ['Say which case exposes each faulty variant and why the correct version passes it.', 'Explain how a version can return the right page and still be wrong.', 'Name one faulty version your table would still accept. The checks cannot prove completeness.'],
    example: 'My table has the first page, a middle page, a short last page, a page past the end, page 0, and size 0. exposes copies the items for each case, runs the chosen implementation, and returns true if the result or the copy differs from what I expected by hand.',
  },
  'repair-range-label': {
    plan: ['Reproduce each reported label by hand and name the line behind it.', 'Order the rules: empty total first, then invalid page and size, then the range.', 'List the boundary inputs you will try after the fix.'],
    explanation: ['Trace the last page of a list whose total is not a multiple of the page size.', 'Explain why the empty total comes before the invalid page rule.', 'Say what the checks do not show, such as every possible input.'],
    example: 'I return No results for a total of 0, then Page out of range for a bad page or size or a start past the total, then compute start as offset plus one and end as the smaller of page times size and the total.',
  },
  'expose-overlap-bugs': {
    plan: ['Turn each requirement into a pair of intervals that sits on its boundary.', 'Include a case for the argument order and one for unchanged inputs.', 'Write expected answers from the requirements, not from the variants.'],
    explanation: ['Say which case exposes each lettered variant and why.', 'Explain how you chose boundaries instead of clearly separate or clearly overlapping pairs.', 'Name a faulty version your table would still accept; the checks cannot show completeness.'],
    example: 'My cases are a plain overlap, touching ends in both orders, containment, an empty interval inside a longer one, equal intervals, equal starts, and a comparison of each input after the call. exposes copies each interval first and returns true on the first difference.',
  },
}
