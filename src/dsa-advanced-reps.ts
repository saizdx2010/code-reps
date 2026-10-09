import type { Rep } from './rep.ts'
import type { RepDepth } from './rep-depth.ts'

export const dsaAdvancedReps: Rep[] = [
  {
    id: 'algo-prefix-sums',
    title: 'Answer many range sums',
    category: 'Advanced problem solving',
    prompt: 'Return the sum for each inclusive [left, right] query, in query order. Practise building prefix sums once rather than rescanning each range.',
    example: {
      input: 'rangeSums([3, -1, 4], [[1, 2]])',
      output: '[3]'
    },
    note: 'numbers has 0–1000 integers from -1000 to 1000. There are 0–1000 valid integer-index queries with 0 <= left <= right < numbers.length. Empty numbers has no queries. No queries returns []. Repeated queries produce repeated answers. Do not change any input. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Prefix sum',
        meaning: 'the total of all values before a position'
      },
      {
        term: 'Inclusive',
        meaning: 'including both named endpoints'
      }
    ],
    planPrompt: 'What will each prefix position mean? How will a query beginning at zero work?',
    starter: 'function rangeSums(numbers: number[], queries: [number, number][]): number[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'rangeSums',
    preserveInput: true,
    hints: [
      'First decide where the total before any items belongs.',
      'A range is the whole total through its right edge minus the total before its left edge.',
      'Store a leading zero so the same subtraction also handles ranges starting at zero.'
    ],
    checks: [
      {
        name: 'Overlapping ranges',
        input: [
          [
            2,
            -3,
            5,
            4
          ],
          [
            [
              0,
              2
            ],
            [
              1,
              3
            ],
            [
              2,
              2
            ]
          ]
        ],
        expected: [
          4,
          6,
          5
        ]
      },
      {
        name: 'Empty',
        input: [
          [

          ],
          [

          ]
        ],
        expected: [

        ]
      },
      {
        name: 'No queries',
        input: [
          [
            7
          ],
          [

          ]
        ],
        expected: [

        ]
      },
      {
        name: 'Repeated full range',
        input: [
          [
            0,
            -1000,
            1000
          ],
          [
            [
              0,
              2
            ],
            [
              0,
              2
            ]
          ]
        ],
        expected: [
          0,
          0
        ]
      }
    ]
  },
  {
    id: 'algo-merge-intervals',
    title: 'Merge overlapping intervals',
    category: 'Advanced problem solving',
    prompt: 'Return the union of closed [start, end] intervals as merged pairs sorted by start. Touching intervals merge: [1,3] and [3,5] become [1,5]. Practise sorting then sweeping.',
    example: {
      input: 'mergeIntervals([[6, 8], [1, 4], [4, 5]])',
      output: '[[1, 5], [6, 8]]'
    },
    note: 'At most 1000 pairs, integer endpoints -1000 to 1000, start <= end. Input may be unsorted. Empty returns []. Duplicate, nested, and zero-length intervals are valid. Equal starts use the largest end; output has no touching or overlapping pairs. Do not change any input. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Closed interval',
        meaning: 'a range including its start and end'
      },
      {
        term: 'Sweep',
        meaning: 'processing ordered items while carrying the current result'
      }
    ],
    planPrompt: 'After sorting, when can you close the current interval? How will nested ranges affect its end?',
    starter: 'function mergeIntervals(intervals: [number, number][]): [number, number][] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'mergeIntervals',
    preserveInput: true,
    hints: [
      'Order the ranges using their start values.',
      'Compare the next start with the current end, including equality.',
      'An overlap can extend the end but must never shorten it.'
    ],
    checks: [
      {
        name: 'Unsorted and nested',
        input: [
          [
            [
              5,
              7
            ],
            [
              1,
              4
            ],
            [
              2,
              3
            ],
            [
              6,
              9
            ]
          ]
        ],
        expected: [
          [
            1,
            4
          ],
          [
            5,
            9
          ]
        ]
      },
      {
        name: 'Empty',
        input: [
          [

          ]
        ],
        expected: [

        ]
      },
      {
        name: 'Touching and equal starts',
        input: [
          [
            [
              2,
              2
            ],
            [
              2,
              5
            ],
            [
              5,
              6
            ],
            [
              2,
              3
            ]
          ]
        ],
        expected: [
          [
            2,
            6
          ]
        ]
      },
      {
        name: 'Negative and separate points',
        input: [
          [
            [
              -4,
              -2
            ],
            [
              -3,
              0
            ],
            [
              1,
              1
            ]
          ]
        ],
        expected: [
          [
            -4,
            0
          ],
          [
            1,
            1
          ]
        ]
      }
    ]
  },
  {
    id: 'algo-linked-list-reverse',
    title: 'Reverse a list without changing it',
    category: 'Advanced problem solving',
    prompt: 'Given a head node shaped {value, next}, return a new list with values in reverse traversal order. Allocate every output node afresh; do not reuse input nodes. Practise walking links and prepending nodes.',
    example: {
      input: 'reverseList({value: 2, next: {value: 8, next: null}})',
      output: '{value: 8, next: {value: 2, next: null}}'
    },
    note: 'The input is null or a finite acyclic list of at most 1000 nodes. Values are integers -1000 to 1000, including duplicates. null returns null. A singleton still needs a new node. Values remain unchanged; only their order reverses. Do not change any input. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Head',
        meaning: 'the first node of a list'
      },
      {
        term: 'Link',
        meaning: 'a reference to the next node'
      },
      {
        term: 'Prepend',
        meaning: 'put a new item at the front'
      }
    ],
    planPrompt: 'What does the new head represent after each input node? How will you avoid reusing or changing input links?',
    starter: 'type ListNode = { value: number; next: ListNode | null }\nfunction reverseList(head: ListNode | null): ListNode | null {\n  // Write your solution here.\n  return null\n}\n',
    functionName: 'reverseList',
    preserveInput: true,
    hints: [
      'Walk the original list in its existing direction.',
      'The most recently visited value belongs at the front of the reversed result.',
      'Create a fresh node pointing to the result built so far; keep the input cursor separate.'
    ],
    checks: [
      {
        name: 'Three nodes',
        input: [
          {
            value: 1,
            next: {
              value: 0,
              next: {
                value: -2,
                next: null
              }
            }
          }
        ],
        expected: {
          value: -2,
          next: {
            value: 0,
            next: {
              value: 1,
              next: null
            }
          }
        }
      },
      {
        name: 'Empty',
        input: [
          null
        ],
        expected: null
      },
      {
        name: 'Singleton',
        input: [
          {
            value: 7,
            next: null
          }
        ],
        expected: {
          value: 7,
          next: null
        }
      },
      {
        name: 'Duplicates',
        input: [
          {
            value: 2,
            next: {
              value: 2,
              next: {
                value: 3,
                next: null
              }
            }
          }
        ],
        expected: {
          value: 3,
          next: {
            value: 2,
            next: {
              value: 2,
              next: null
            }
          }
        }
      }
    ]
  },
  {
    id: 'algo-min-heap',
    title: 'Process a min-heap operation trace',
    category: 'Advanced problem solving',
    prompt: 'Start empty. Process operations in order: {type: "push", value} inserts a number; {type: "pop"} removes and reports the smallest number, or null if empty. Return only pop results, in operation order. Practise an array-backed binary min-heap: every parent is no greater than either child.',
    example: {
      input: 'heapPops([{type: "push", value: 6}, {type: "push", value: 2}, {type: "pop"}])',
      output: '[2]'
    },
    note: 'At most 1000 valid operations. Push values are integers -1000 to 1000. Duplicates are separate entries; tied minimum values produce the same numeric answer, with no identity ordering required. Empty operations or only pushes returns []. Pop on empty reports null and leaves it empty. Do not change any input. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Heap property',
        meaning: 'each parent value is at most its children'
      },
      {
        term: 'Sift',
        meaning: 'move an item through parent or child positions until the heap property holds'
      }
    ],
    planPrompt: 'Which positions can a push or pop disturb? How will you choose a child when repairing the root?',
    starter: 'type HeapOperation = { type: \'push\'; value: number } | { type: \'pop\' }\nfunction heapPops(operations: HeapOperation[]): (number | null)[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'heapPops',
    preserveInput: true,
    hints: [
      'The root holds the minimum, but siblings need not be sorted.',
      'A pushed item can move upward; replacing a removed root can require moving downward.',
      'When moving downward, compare both children and use the smaller one, stopping when the parent is already no greater.'
    ],
    checks: [
      {
        name: 'Interleaved operations',
        input: [
          [
            {
              type: 'push',
              value: 4
            },
            {
              type: 'push',
              value: 1
            },
            {
              type: 'pop'
            },
            {
              type: 'push',
              value: -2
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            }
          ]
        ],
        expected: [
          1,
          -2,
          4,
          null
        ]
      },
      {
        name: 'Empty',
        input: [
          [

          ]
        ],
        expected: [

        ]
      },
      {
        name: 'Only pushes',
        input: [
          [
            {
              type: 'push',
              value: 0
            }
          ]
        ],
        expected: [

        ]
      },
      {
        name: 'Duplicates and empty pop',
        input: [
          [
            {
              type: 'pop'
            },
            {
              type: 'push',
              value: 0
            },
            {
              type: 'push',
              value: 0
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            }
          ]
        ],
        expected: [
          null,
          0,
          0
        ]
      },
      {
        name: 'Both child branches',
        input: [
          [
            {
              type: 'push',
              value: 9
            },
            {
              type: 'push',
              value: 4
            },
            {
              type: 'push',
              value: 7
            },
            {
              type: 'push',
              value: 1
            },
            {
              type: 'push',
              value: 3
            },
            {
              type: 'push',
              value: 2
            },
            {
              type: 'push',
              value: 8
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            },
            {
              type: 'pop'
            }
          ]
        ],
        expected: [
          1,
          2,
          3,
          4,
          7,
          8,
          9
        ]
      }
    ]
  },
  {
    id: 'algo-subsets',
    title: 'Explore all subsets',
    category: 'Advanced problem solving',
    prompt: 'Return all subsets of numbers in depth-first preorder: emit the current subset first, then try each remaining position from left to right. Keep values inside each subset in input order. Practise backtracking: choose, explore, then undo.',
    example: {
      input: 'subsets([4, 1])',
      output: '[[], [4], [4, 1], [1]]'
    },
    note: '0–10 distinct integers from -1000 to 1000; input order may be unsorted. Empty input returns [[]]. For [a,b], the exact output order is [[],[a],[a,b],[b]]. Each subset must be a separate array. No duplicate input values or malformed inputs are supplied. Do not change any input. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Subset',
        meaning: 'a selection containing each input position at most once'
      },
      {
        term: 'Backtracking',
        meaning: 'exploring a choice then undoing it before another choice'
      }
    ],
    planPrompt: 'When will you record a subset? Which next position prevents repeats, and what must you undo?',
    starter: 'function subsets(numbers: number[]): number[][] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'subsets',
    preserveInput: true,
    hints: [
      'The empty selection is a valid first result.',
      'After selecting a position, only later positions are eligible.',
      'Save a copy of each selection and undo the last choice before exploring its sibling.'
    ],
    checks: [
      {
        name: 'Three positions',
        input: [
          [
            2,
            5,
            7
          ]
        ],
        expected: [
          [

          ],
          [
            2
          ],
          [
            2,
            5
          ],
          [
            2,
            5,
            7
          ],
          [
            2,
            7
          ],
          [
            5
          ],
          [
            5,
            7
          ],
          [
            7
          ]
        ]
      },
      {
        name: 'Empty',
        input: [
          [

          ]
        ],
        expected: [
          [

          ]
        ]
      },
      {
        name: 'Singleton zero',
        input: [
          [
            0
          ]
        ],
        expected: [
          [

          ],
          [
            0
          ]
        ]
      },
      {
        name: 'Input order',
        input: [
          [
            3,
            -1
          ]
        ],
        expected: [
          [

          ],
          [
            3
          ],
          [
            3,
            -1
          ],
          [
            -1
          ]
        ]
      }
    ]
  },
  {
    id: 'algo-climb-stairs',
    title: 'Count ways to climb stairs',
    category: 'Advanced problem solving',
    prompt: 'Return how many ordered step sequences reach exactly n stairs using steps of size 1 or 2. Practise one-dimensional dynamic programming by reusing counts for smaller destinations.',
    example: {
      input: 'climbStairs(4)',
      output: '5'
    },
    note: 'n is an integer from 0 to 40. n=0 returns 1: the one empty sequence. Step order matters, so [1,2] and [2,1] are different ways. Return an exact integer; all answers in this range are safely representable. No invalid n is supplied. Do not change any input. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Dynamic programming',
        meaning: 'saving smaller answers to avoid repeating their work'
      },
      {
        term: 'Base case',
        meaning: 'a smallest case whose answer is known directly'
      }
    ],
    planPrompt: 'What are the possible final steps? Why does zero have one way rather than zero?',
    starter: 'function climbStairs(n: number): number {\n  // Write your solution here.\n  return 0\n}\n',
    functionName: 'climbStairs',
    preserveInput: true,
    hints: [
      'Group sequences by whether their final step has size one or two.',
      'Removing the final step leaves a smaller version of the same problem.',
      'Keep the two previous counts and advance them together; handle zero before advancing.'
    ],
    checks: [
      {
        name: 'Five stairs',
        input: [
          5
        ],
        expected: 8
      },
      {
        name: 'Zero',
        input: [
          0
        ],
        expected: 1
      },
      {
        name: 'One',
        input: [
          1
        ],
        expected: 1
      },
      {
        name: 'Two',
        input: [
          2
        ],
        expected: 2
      },
      {
        name: 'Upper bound',
        input: [
          40
        ],
        expected: 165580141
      }
    ]
  },
  {
    id: 'algo-coin-change',
    title: 'Find the fewest coins',
    category: 'Advanced problem solving',
    prompt: 'Return the fewest coins needed to total amount exactly, or -1 if impossible. Each listed denomination can be used any number of times. Practise dynamic programming over smaller amounts.',
    example: {
      input: 'coinChange([1, 3, 4], 6)',
      output: '2'
    },
    note: 'amount is an integer 0–1000. coins contains 0–20 integers from 1 to 1000, possibly unsorted or repeated. Repeated denominations do not limit supply. Amount zero returns 0 even with no coins; positive amount with no coins returns -1. Ties return the same count; no coin sequence is returned. Do not change any input. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Denomination',
        meaning: 'the value of one kind of coin'
      },
      {
        term: 'Unreachable state',
        meaning: 'an amount no available coin combination can form'
      }
    ],
    planPrompt: 'What does each saved amount mean? How will you distinguish impossible from zero coins, and why can greedy fail?',
    starter: 'function coinChange(coins: number[], amount: number): number {\n  // Write your solution here.\n  return -1\n}\n',
    functionName: 'coinChange',
    preserveInput: true,
    hints: [
      'The zero amount already needs zero coins.',
      'For an amount, consider every denomination that could be its last coin.',
      'Only extend reachable smaller amounts, and keep the smallest resulting count.'
    ],
    checks: [
      {
        name: 'Greedy trap',
        input: [
          [
            1,
            3,
            4
          ],
          10
        ],
        expected: 3
      },
      {
        name: 'Impossible',
        input: [
          [
            4,
            6
          ],
          7
        ],
        expected: -1
      },
      {
        name: 'Zero without coins',
        input: [
          [

          ],
          0
        ],
        expected: 0
      },
      {
        name: 'No coins',
        input: [
          [

          ],
          5
        ],
        expected: -1
      },
      {
        name: 'Repeated unsorted coins',
        input: [
          [
            5,
            2,
            2
          ],
          6
        ],
        expected: 3
      },
      {
        name: 'Upper amount',
        input: [
          [
            1
          ],
          1000
        ],
        expected: 1000
      },
      {
        name: 'Large denomination',
        input: [
          [
            1000
          ],
          1000
        ],
        expected: 1
      }
    ]
  }
]

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
