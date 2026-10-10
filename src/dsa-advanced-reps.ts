import type { Rep } from './rep.ts'

export const dsaAdvancedReps: Rep[] = [
  {
    id: 'algo-prefix-sums',
    title: 'Answer many range sums',
    category: 'Problem-solving patterns',
    prompt: 'Return the sum for each inclusive [left, right] query, in query order. Practice building prefix sums once rather than rescanning each range. Do not change any input.',
    example: {
      input: 'rangeSums([3, -1, 4], [[1, 2]])',
      output: '[3]'
    },
    note: 'numbers has 0–1000 integers from -1000 to 1000. There are 0–1000 valid integer-index queries with 0 <= left <= right < numbers.length. Empty numbers has no queries. No queries returns []. Repeated queries produce repeated answers. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
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
    category: 'Problem-solving patterns',
    prompt: 'Return the union of closed [start, end] intervals as merged pairs sorted by start. Touching intervals merge: [1,3] and [3,5] become [1,5]. Practice sorting then sweeping. Do not change any input.',
    example: {
      input: 'mergeIntervals([[6, 8], [1, 4], [4, 5]])',
      output: '[[1, 5], [6, 8]]'
    },
    note: 'At most 1000 pairs, integer endpoints -1000 to 1000, start <= end. Input may be unsorted. Empty returns []. Duplicate, nested, and zero-length intervals are valid. Equal starts use the largest end; output has no touching or overlapping pairs. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
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
    category: 'Problem-solving patterns',
    prompt: 'Given a head node shaped {value, next}, return a new list with values in reverse traversal order. Create every output node as a new object; do not reuse input nodes. Freshly created nodes are self-reviewed; the checks compare values and check that inputs do not change. Practice walking links and prepending nodes. Do not change any input.',
    example: {
      input: 'reverseList({value: 2, next: {value: 8, next: null}})',
      output: '{value: 8, next: {value: 2, next: null}}'
    },
    note: 'The input is null or a finite list with no cycles of at most 1000 nodes. Values are integers -1000 to 1000, including duplicates. null returns null. A one-node list still needs a new node. Values remain unchanged; only their order reverses. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
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
    category: 'Problem-solving patterns',
    prompt: 'Start empty. Process operations in order: {type: "push", value} inserts a number; {type: "pop"} removes and reports the smallest number, or null if empty. Return only pop results, in operation order. Practice an array-backed binary min-heap: every parent is no greater than either child. The heap structure is self-reviewed; the checks compare pop results and check that inputs do not change. Do not change any input.',
    brief: { summary: 'Process heap operations in order, starting empty, and return only the pop results.', rules: [
      '{type: "push", value} inserts a number.',
      '{type: "pop"} removes and reports the smallest number, or null if empty.',
      'Return only pop results, in operation order.',
      'Practice an array-backed binary min-heap: every parent is no greater than either child.',
    ], edgeCases: [
      'The heap structure is self-reviewed; the checks compare pop results and check that inputs do not change.',
      'Do not change any input.',
    ] },
    example: {
      input: 'heapPops([{type: "push", value: 6}, {type: "push", value: 2}, {type: "pop"}])',
      output: '[2]'
    },
    note: 'At most 1000 valid operations. Push values are integers -1000 to 1000. Duplicates are separate entries; tied minimum values produce the same numeric answer, without distinguishing which equal-valued entry came first. Empty operations or only pushes returns []. Pop on empty reports null and leaves it empty. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
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
    category: 'Problem-solving patterns',
    prompt: 'Return all subsets of numbers in depth-first preorder: emit the current subset first, then try each remaining position from left to right. Keep values inside each subset in input order. Practice backtracking: choose, explore, then undo. Do not change any input.',
    example: {
      input: 'subsets([4, 1])',
      output: '[[], [4], [4, 1], [1]]'
    },
    note: '0–10 distinct integers from -1000 to 1000; input order may be unsorted. Empty input returns [[]]. For [a,b], the exact output order is [[],[a],[a,b],[b]]. Each subset must be a separate array. No duplicate input values or malformed inputs are supplied. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Depth-first preorder',
        meaning: 'record the current selection before exploring each next choice and all its later choices'
      },
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
    category: 'Problem-solving patterns',
    prompt: 'Return how many ordered step sequences reach exactly n stairs using steps of size 1 or 2. Practice one-dimensional dynamic programming by reusing counts for smaller destinations. Do not change any input.',
    example: {
      input: 'climbStairs(4)',
      output: '5'
    },
    note: 'n is an integer from 0 to 40. n=0 returns 1: the one empty sequence. Step order matters, so [1,2] and [2,1] are different ways. Return an exact integer; JavaScript numbers can store every answer in this range exactly. No invalid n is supplied. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
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
    category: 'Problem-solving patterns',
    prompt: 'Return the fewest coins needed to total amount exactly, or -1 if impossible. Each listed denomination can be used any number of times. Practice dynamic programming over smaller amounts. Do not change any input.',
    example: {
      input: 'coinChange([1, 3, 4], 6)',
      output: '2'
    },
    note: 'amount is an integer 0–1000. coins contains 0–20 integers from 1 to 1000, possibly unsorted or repeated. Repeated denominations do not limit supply. Amount zero returns 0 even with no coins; positive amount with no coins returns -1. Ties return the same count; no coin sequence is returned. Checks verify behavior and visible input preservation; the requested approach and costs are self-reviewed.',
    vocabulary: [
      {
        term: 'Greedy',
        meaning: 'choosing the locally best-looking option at each step without comparing complete alternatives'
      },
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
