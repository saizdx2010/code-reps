import type { RepDepth } from './rep-depth.ts'

export const dsaAdvancedDepth: Record<string, RepDepth> = {
  'algo-prefix-sums': {
    reasoning: 'A prefix at position k totals exactly the first k items. Subtraction cancels the items outside the requested range.',
    trace: '[3,-1,4] gives prefixes [0,3,2,6]; query [1,2] is 6-3=3. Query [0,0] uses 3-0=3; with no queries the result is [].',
    alternative: 'Scanning each range is O(nq) worst case. Prefix sums use O(n+q) time and O(n) auxiliary space, excluding answers.',
    counterexample: 'Subtracting the prefix at right instead of right+1 loses the last value: [5], [0,0] would return 0.',
    transfer: 'Answer rectangle sums in a grid. Define which borders your two-dimensional prefix includes.'
  },
  'algo-merge-intervals': {
    reasoning: 'Sorted starts ensure that once the next start exceeds the current end, no later interval can join the current group.',
    trace: '[1,4], [4,5], [6,8]: equality extends the first group to [1,5]; 6 starts a new group.',
    alternative: 'Repeatedly rescanning for any overlapping pair avoids sorting but can require O(n³) comparisons in the worst case. Sorting and sweeping takes O(n log n) time and O(n) copy/output space.',
    counterexample: 'Replacing the end with the next end turns [1,9],[2,3] into [1,3] and loses coverage.',
    transfer: 'Merge meeting slots with a required gap. Decide whether equal endpoints still count as overlap.'
  },
  'algo-linked-list-reverse': {
    reasoning: 'After each visit, the new list contains fresh nodes for the visited prefix in reverse order. Keeping a separate cursor preserves the original links.',
    trace: 'Visit 2: new list 2. Visit 8: new list 8→2; the input remains 2→8. For null, there are no visits and the result stays null. A singleton creates one fresh node.',
    alternative: 'Collecting values then building backwards also takes O(n) time, but uses an extra O(n) array besides output nodes. Direct prepending needs O(1) auxiliary space besides output.',
    counterexample: 'Reversing input next links produces the right values but breaks the caller’s original list. Returning the input singleton also violates fresh allocation.',
    transfer: 'Reverse only a selected segment while preserving the whole original list. Which untouched nodes also need copying?'
  },
  'algo-min-heap': {
    reasoning: 'Parent-child ordering places a minimum at the root. Push only disturbs an ancestor route; root replacement only disturbs a descendant route.',
    trace: 'Push 6 then 2: [6] becomes [2,6]. Pop reports 2 and leaves [6]; the next pop reports 6, then null.',
    alternative: 'Keeping a sorted array also passes output checks, but insertion/removal can cost O(n). A heap takes O(log n) per nonempty operation and O(n) storage.',
    counterexample: 'Treating the array as a stack returns 6 after pushing 2 then 6, while a min-heap must return 2.',
    transfer: 'Keep the largest k values from a stream. Explain why removing the smallest retained value helps.'
  },
  'algo-subsets': {
    reasoning: 'Choosing only later positions generates every selection once. Recording before children gives the required preorder; undo restores the parent selection.',
    trace: '[4,1]: record []; choose 4, record [4]; choose 1, record [4,1]; undo twice; choose 1, record [1]. Empty input records [] once and has no children, producing [[]].',
    alternative: 'Bit masks generate the same subsets but need a separate ordering rule. Backtracking output copying costs O(n·2^n) time and output space; the working route is O(n).',
    counterexample: 'Saving the same mutable selection reference repeatedly lets later undo operations empty all recorded results.',
    transfer: 'Allow repeated input values but emit unique subsets. Decide how sorting changes the requested order.'
  },
  'algo-climb-stairs': {
    reasoning: 'Every nonempty route ends in one or two. These disjoint groups contribute the counts for n-1 and n-2; no route is counted twice.',
    trace: 'Counts for destinations 0,1,2,3,4 are 1,1,2,3,5. At 4, three routes end in 1 and two end in 2.',
    alternative: 'A full table takes O(n) time and O(n) space. Two saved counts take O(n) time and O(1) space. Naive recursion repeats work exponentially.',
    counterexample: 'Using zero ways for zero stairs removes the valid [2] route when calculating two stairs.',
    transfer: 'Count routes when some stairs are blocked. Which states should become zero and how does the start behave?'
  },
  'algo-coin-change': {
    reasoning: 'An optimal nonzero solution has a last coin. Removing it leaves an optimal smaller solution, or replacing that prefix would improve the whole answer.',
    trace: 'For [1,3,4], amount 6: using 1 gives 3 coins, 3 gives 2, and 4 gives 3. Choose 2, representing 3+3. For [4,6], amount 7, every last-coin choice leaves an unreachable amount, so return -1.',
    alternative: 'Breadth-first search of reachable amounts finds the fewest coins by layers. A DP table takes O(amount·coins.length) time and O(amount) space; greedy is cheaper but not generally correct.',
    counterexample: 'Largest-first for [1,3,4], amount 6 chooses 4+1+1, but 3+3 uses fewer coins.',
    transfer: 'Give each denomination a limited stock. Why can the unlimited recurrence reuse unavailable coins?'
  }
}

export const dsaAdvancedGuides = {
  'algo-prefix-sums': {
    plan: [
      'What will each prefix position mean? How will a query beginning at zero work?',
      'Name a boundary case before coding.'
    ],
    explanation: [
      'Explain the invariant and trace a boundary case.',
      'Review the requested approach, allocation rules, and time/space costs; passing checks does not prove them.'
    ],
    example: 'A prefix at position k totals exactly the first k items. Subtraction cancels the items outside the requested range. [3,-1,4] gives prefixes [0,3,2,6]; query [1,2] is 6-3=3. Query [0,0] uses 3-0=3; with no queries the result is [].'
  },
  'algo-merge-intervals': {
    plan: [
      'After sorting, when can you close the current interval? How will nested ranges affect its end?',
      'Name a boundary case before coding.'
    ],
    explanation: [
      'Explain the invariant and trace a boundary case.',
      'Review the requested approach, allocation rules, and time/space costs; passing checks does not prove them.'
    ],
    example: 'Sorted starts ensure that once the next start exceeds the current end, no later interval can join the current group. [1,4], [4,5], [6,8]: equality extends the first group to [1,5]; 6 starts a new group.'
  },
  'algo-linked-list-reverse': {
    plan: [
      'What does the new head represent after each input node? How will you avoid reusing or changing input links?',
      'Name a boundary case before coding.'
    ],
    explanation: [
      'Explain the invariant and trace a boundary case.',
      'Review the requested approach, allocation rules, and time/space costs; passing checks does not prove them.'
    ],
    example: 'After each visit, the new list contains fresh nodes for the visited prefix in reverse order. Keeping a separate cursor preserves the original links. Visit 2: new list 2. Visit 8: new list 8→2; the input remains 2→8. For null, there are no visits and the result stays null. A singleton creates one fresh node.'
  },
  'algo-min-heap': {
    plan: [
      'Which positions can a push or pop disturb? How will you choose a child when repairing the root?',
      'Name a boundary case before coding.'
    ],
    explanation: [
      'Explain the invariant and trace a boundary case.',
      'Review the requested approach, allocation rules, and time/space costs; passing checks does not prove them.'
    ],
    example: 'Parent-child ordering places a minimum at the root. Push only disturbs an ancestor route; root replacement only disturbs a descendant route. Push 6 then 2: [6] becomes [2,6]. Pop reports 2 and leaves [6]; the next pop reports 6, then null.'
  },
  'algo-subsets': {
    plan: [
      'When will you record a subset? Which next position prevents repeats, and what must you undo?',
      'Name a boundary case before coding.'
    ],
    explanation: [
      'Explain the invariant and trace a boundary case.',
      'Review the requested approach, allocation rules, and time/space costs; passing checks does not prove them.'
    ],
    example: 'Choosing only later positions generates every selection once. Recording before children gives the required preorder; undo restores the parent selection. [4,1]: record []; choose 4, record [4]; choose 1, record [4,1]; undo twice; choose 1, record [1]. Empty input records [] once and has no children, producing [[]].'
  },
  'algo-climb-stairs': {
    plan: [
      'What are the possible final steps? Why does zero have one way rather than zero?',
      'Name a boundary case before coding.'
    ],
    explanation: [
      'Explain the invariant and trace a boundary case.',
      'Review the requested approach, allocation rules, and time/space costs; passing checks does not prove them.'
    ],
    example: 'Every nonempty route ends in one or two. These disjoint groups contribute the counts for n-1 and n-2; no route is counted twice. Counts for destinations 0,1,2,3,4 are 1,1,2,3,5. At 4, three routes end in 1 and two end in 2.'
  },
  'algo-coin-change': {
    plan: [
      'What does each saved amount mean? How will you distinguish impossible from zero coins, and why can greedy fail?',
      'Name a boundary case before coding.'
    ],
    explanation: [
      'Explain the invariant and trace a boundary case.',
      'Review the requested approach, allocation rules, and time/space costs; passing checks does not prove them.'
    ],
    example: 'An optimal nonzero solution has a last coin. Removing it leaves an optimal smaller solution, or replacing that prefix would improve the whole answer. For [1,3,4], amount 6: using 1 gives 3 coins, 3 gives 2, and 4 gives 3. Choose 2, representing 3+3. For [4,6], amount 7, every last-coin choice leaves an unreachable amount, so return -1.'
  }
}
