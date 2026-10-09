import type { RepDepth } from './rep-depth.ts'

export const dsaAdvancedDepth: Record<string, RepDepth> = {
  'algo-prefix-sums': {
    reasoning: 'A prefix at position k totals exactly the first k items. Subtraction cancels the items outside the requested range.',
    trace: '[3,-1,4] gives prefixes [0,3,2,6]; query [1,2] is 6-3=3. Query [0,0] uses 3-0=3; with no queries the result is [].',
    traceSteps: {
      code: ['function rangeSums(numbers: number[], queries: [number, number][]): number[] {', '  const prefix = [0]', '  for (const value of numbers) prefix.push(prefix[prefix.length - 1] + value)', '  return queries.map(([left, right]) => prefix[right + 1] - prefix[left])', '}'],
      input: 'numbers = [3, -1, 4, 2], queries = [[1, 2], [0, 3]]',
      steps: [
        {
          line: 1,
          vars: {
            numbers: '[3,-1,4,2]'
          },
          structure: {
            kind: 'table',
            name: 'prefix',
            cells: [
              [0, null, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4']
          },
          note: 'prefix[k] will be the total of the first k numbers. The empty prefix totals 0.'
        },
        {
          line: 2,
          vars: {
            value: 3
          },
          structure: {
            kind: 'table',
            name: 'prefix',
            cells: [
              [0, 3, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            current: [0, 1],
            reads: [
              [0, 0]
            ]
          },
          note: 'prefix[1] = prefix[0] + 3 = 3.'
        },
        {
          line: 2,
          vars: {
            value: -1
          },
          structure: {
            kind: 'table',
            name: 'prefix',
            cells: [
              [0, 3, 2, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            current: [0, 2],
            reads: [
              [0, 1]
            ]
          },
          note: 'prefix[2] = prefix[1] + -1 = 2.'
        },
        {
          line: 2,
          vars: {
            value: 4
          },
          structure: {
            kind: 'table',
            name: 'prefix',
            cells: [
              [0, 3, 2, 6, null]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            current: [0, 3],
            reads: [
              [0, 2]
            ]
          },
          note: 'prefix[3] = prefix[2] + 4 = 6.'
        },
        {
          line: 2,
          vars: {
            value: 2
          },
          structure: {
            kind: 'table',
            name: 'prefix',
            cells: [
              [0, 3, 2, 6, 8]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            current: [0, 4],
            reads: [
              [0, 3]
            ]
          },
          note: 'prefix[4] = prefix[3] + 2 = 8.'
        },
        {
          line: 3,
          vars: {
            query: '[1,2]',
            answer: 3
          },
          structure: {
            kind: 'table',
            name: 'prefix',
            cells: [
              [0, 3, 2, 6, 8]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            reads: [
              [0, 3],
              [0, 1]
            ]
          },
          note: 'Query [1, 2] reads prefix[3] = 6 and prefix[1] = 3. The numbers inside the range total 6 − 3 = 3.'
        },
        {
          line: 3,
          vars: {
            query: '[0,3]',
            answer: 8,
            result: '[3,8]'
          },
          structure: {
            kind: 'table',
            name: 'prefix',
            cells: [
              [0, 3, 2, 6, 8]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            reads: [
              [0, 4],
              [0, 0]
            ]
          },
          note: 'Query [0, 3] reads prefix[4] = 8 and prefix[0] = 0: 8 − 0 = 8. Return [3, 8].'
        }
      ]
    },
    alternative: 'Scanning each range is O(nq) worst case. Prefix sums use O(n+q) time and O(n) auxiliary space, excluding answers.',
    counterexample: 'Subtracting the prefix at right instead of right+1 loses the last value: [5], [0,0] would return 0.',
    transfer: 'Answer rectangle sums in a grid. Define which borders your two-dimensional prefix includes.'
  },
  'algo-merge-intervals': {
    reasoning: 'Sorted starts ensure that once the next start exceeds the current end, no later interval can join the current group.',
    trace: '[1,4], [4,5], [6,8]: equality extends the first group to [1,5]; 6 starts a new group.',
    traceSteps: {
      code: ['function mergeIntervals(intervals: [number, number][]): [number, number][] {', '  const sorted = intervals.map(pair => [...pair] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1])', '  const merged: [number, number][] = []', '  for (const [start, end] of sorted) {', '    const last = merged[merged.length - 1]', '    if (last && start <= last[1]) last[1] = Math.max(last[1], end)', '    else merged.push([start, end])', '  }', '  return merged', '}'],
      input: 'intervals = [[6, 8], [1, 4], [4, 5]]',
      steps: [
        {
          line: 0,
          vars: {

          },
          structure: {
            kind: 'array',
            values: ['[6,8]', '[1,4]', '[4,5]']
          },
          note: 'The intervals arrive unsorted. Touching ends such as 4 and 4 count as overlapping.'
        },
        {
          line: 1,
          vars: {

          },
          structure: {
            kind: 'array',
            values: ['[1,4]', '[4,5]', '[6,8]']
          },
          note: 'Sort a copy by start. Now an interval can only overlap the group just before it.'
        },
        {
          line: 6,
          vars: {
            current: '[1,4]',
            merged: '[[1,4]]'
          },
          structure: {
            kind: 'array',
            values: ['[1,4]', '[4,5]', '[6,8]'],
            pointers: {
              current: 0
            }
          },
          note: 'The first interval has no group to join, so it starts one: merged = [[1,4]].'
        },
        {
          line: 5,
          vars: {
            current: '[4,5]',
            merged: '[[1,5]]'
          },
          structure: {
            kind: 'array',
            values: ['[1,4]', '[4,5]', '[6,8]'],
            pointers: {
              current: 1
            },
            dimmed: [0]
          },
          note: 'Start 4 ≤ last end 4: they touch, so extend the group to max(4, 5) = 5. merged = [[1,5]].'
        },
        {
          line: 6,
          vars: {
            current: '[6,8]',
            merged: '[[1,5],[6,8]]'
          },
          structure: {
            kind: 'array',
            values: ['[1,4]', '[4,5]', '[6,8]'],
            pointers: {
              current: 2
            },
            dimmed: [0, 1]
          },
          note: 'Start 6 > last end 5: a gap, so [6,8] starts a new group.'
        },
        {
          line: 8,
          vars: {
            result: '[[1,5],[6,8]]'
          },
          structure: {
            kind: 'array',
            values: ['[1,4]', '[4,5]', '[6,8]'],
            dimmed: [0, 1, 2]
          },
          note: 'All intervals are placed. Return the merged groups.'
        }
      ]
    },
    alternative: 'Repeatedly rescanning for any overlapping pair avoids sorting but can require O(n³) comparisons in the worst case. Sorting and sweeping takes O(n log n) time and O(n) copy/output space.',
    counterexample: 'Replacing the end with the next end turns [1,9],[2,3] into [1,3] and loses coverage.',
    transfer: 'Merge meeting slots with a required gap. Decide whether equal endpoints still count as overlap.'
  },
  'algo-linked-list-reverse': {
    reasoning: 'After each visit, the new list contains fresh nodes for the visited prefix in reverse order. Keeping a separate cursor preserves the original links.',
    trace: 'Visit 2: new list 2. Visit 8: new list 8→2; the input remains 2→8. For null, there are no visits and the result stays null. A singleton creates one fresh node.',
    traceSteps: {
      code: ['type ListNode = { value: number; next: ListNode | null }; function reverseList(head: ListNode | null): ListNode | null {', '  let reversed: ListNode | null = null', '  for (let node = head; node; node = node.next) {', '    reversed = { value: node.value, next: reversed }', '  }', '  return reversed', '}'],
      input: 'head = {value: 1, next: {value: 2, next: {value: 3, next: null}}}',
      steps: [
        {
          line: 0,
          vars: {

          },
          structure: {
            kind: 'state',
            entries: [
              ['input list', '1 → 2 → 3 → null'],
              ['reversed', 'null']
            ],
            events: ['visit 1', 'visit 2', 'visit 3']
          },
          note: 'The input list is 1 → 2 → 3. We will build a new list; the input is never changed.'
        },
        {
          line: 1,
          vars: {

          },
          structure: {
            kind: 'state',
            entries: [
              ['input list', '1 → 2 → 3 → null'],
              ['reversed', 'null']
            ],
            events: ['visit 1', 'visit 2', 'visit 3']
          },
          note: 'The new list starts empty (null).'
        },
        {
          line: 3,
          vars: {
            node: 1
          },
          structure: {
            kind: 'state',
            entries: [
              ['input list', '1 → 2 → 3 → null'],
              ['reversed', '1 → null']
            ],
            events: ['visit 1', 'visit 2', 'visit 3'],
            eventIndex: 0
          },
          note: 'Visit 1: make a fresh node whose next is the list built so far, so 1 lands at the front. New list: 1 → null.'
        },
        {
          line: 3,
          vars: {
            node: 2
          },
          structure: {
            kind: 'state',
            entries: [
              ['input list', '1 → 2 → 3 → null'],
              ['reversed', '2 → 1 → null']
            ],
            events: ['visit 1', 'visit 2', 'visit 3'],
            eventIndex: 1
          },
          note: 'Visit 2: make a fresh node whose next is the list built so far, so 2 lands at the front. New list: 2 → 1 → null.'
        },
        {
          line: 3,
          vars: {
            node: 3
          },
          structure: {
            kind: 'state',
            entries: [
              ['input list', '1 → 2 → 3 → null'],
              ['reversed', '3 → 2 → 1 → null']
            ],
            events: ['visit 1', 'visit 2', 'visit 3'],
            eventIndex: 2
          },
          note: 'Visit 3: make a fresh node whose next is the list built so far, so 3 lands at the front. New list: 3 → 2 → 1 → null.'
        },
        {
          line: 5,
          vars: {
            result: '{"value":3,"next":{"value":2,"next":{"value":1,"next":null}}}'
          },
          structure: {
            kind: 'state',
            entries: [
              ['input list', '1 → 2 → 3 → null'],
              ['reversed', '3 → 2 → 1 → null']
            ],
            events: ['visit 1', 'visit 2', 'visit 3'],
            eventIndex: 2
          },
          note: 'The input is used up. Return the new list, whose front is the last node visited.'
        }
      ]
    },
    alternative: 'Collecting values then building backwards also takes O(n) time, but uses an extra O(n) array besides output nodes. Direct prepending needs O(1) auxiliary space besides output.',
    counterexample: 'Reversing input next links produces the right values but breaks the caller’s original list. Returning the input singleton also violates fresh allocation.',
    transfer: 'Reverse only a selected segment while preserving the whole original list. Which untouched nodes also need copying?'
  },
  'algo-min-heap': {
    reasoning: 'Parent-child ordering places a minimum at the root. Push only disturbs an ancestor route; root replacement only disturbs a descendant route.',
    trace: 'Push 6 then 2: [6] becomes [2,6]. Pop reports 2 and leaves [6]; the next pop reports 6, then null.',
    traceSteps: {
      code: ['type HeapOperation = { type: \'push\'; value: number } | { type: \'pop\' }; function heapPops(operations: HeapOperation[]): (number | null)[] {', '  const heap: number[] = [], out: (number | null)[] = []', '  const swap = (a: number, b: number) => { [heap[a], heap[b]] = [heap[b], heap[a]] }', '  for (const op of operations) {', '    if (op.type === \'push\') {', '      heap.push(op.value)', '      for (let i = heap.length - 1, p = (i - 1) >> 1; i > 0 && heap[p] > heap[i]; i = p, p = (i - 1) >> 1) swap(i, p)', '    } else if (!heap.length) out.push(null)', '    else {', '      out.push(heap[0]); const last = heap.pop()!', '      if (heap.length) { heap[0] = last; for (let i = 0, c = 1; c < heap.length; i = c, c = 2 * i + 1) { if (c + 1 < heap.length && heap[c + 1] < heap[c]) c++; if (heap[i] <= heap[c]) break; swap(i, c) } }', '    }', '  }', '  return out', '}'],
      input: 'operations = [{type: "push",value: 5},{type: "push",value: 2},{type: "push",value: 8},{type: "pop"},{type: "pop"}]',
      steps: [
        {
          line: 5,
          vars: {
            op: 'push 5',
            out: '[]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 5
            },
            current: 'h0',
            visited: []
          },
          note: 'Push 5. The heap array is [5]; the tree has a single node, so there is nothing to compare.'
        },
        {
          line: 5,
          vars: {
            op: 'push 2',
            out: '[]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 5,
              children: [
                {
                  id: 'h1',
                  value: 2
                }
              ]
            },
            current: 'h1',
            visited: []
          },
          note: 'Push 2 at the end, as the left child of 5. A parent must not be larger than its child, and 5 > 2.'
        },
        {
          line: 6,
          vars: {
            op: 'push 2',
            out: '[]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 2,
              children: [
                {
                  id: 'h1',
                  value: 5
                }
              ]
            },
            current: 'h0',
            visited: []
          },
          note: 'Sift up: swap 2 with its parent. The smallest value is now the root.'
        },
        {
          line: 5,
          vars: {
            op: 'push 8',
            out: '[]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 2,
              children: [
                {
                  id: 'h1',
                  value: 5
                },
                {
                  id: 'h2',
                  value: 8
                }
              ]
            },
            current: 'h2',
            visited: []
          },
          note: 'Push 8 as the right child. Its parent 2 is smaller, so it stays put.'
        },
        {
          line: 9,
          vars: {
            op: 'pop',
            out: '[2]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 8,
              children: [
                {
                  id: 'h1',
                  value: 5
                }
              ]
            },
            current: 'h0',
            visited: []
          },
          note: 'Pop: report the root, 2. Move the last item, 8, up to the root. Now the root is larger than its child 5.'
        },
        {
          line: 10,
          vars: {
            op: 'pop',
            out: '[2]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 5,
              children: [
                {
                  id: 'h1',
                  value: 8
                }
              ]
            },
            current: 'h0',
            visited: []
          },
          note: 'Sift down: swap 8 with its smaller child, 5. Both heap rules hold again.'
        },
        {
          line: 9,
          vars: {
            op: 'pop',
            out: '[2,5]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 8
            },
            current: 'h0',
            visited: []
          },
          note: 'Pop again: report 5, move the last item, 8, to the root. It has no children, so we are done.'
        },
        {
          line: 13,
          vars: {
            result: '[2,5]',
            out: '[2,5]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'h0',
              value: 8
            },
            current: 'h0',
            visited: []
          },
          note: 'All operations are processed. Return the popped values: [2, 5].'
        }
      ]
    },
    alternative: 'Keeping a sorted array also passes output checks, but insertion/removal can cost O(n). A heap takes O(log n) per nonempty operation and O(n) storage.',
    counterexample: 'Treating the array as a stack returns 6 after pushing 2 then 6, while a min-heap must return 2.',
    transfer: 'Keep the largest k values from a stream. Explain why removing the smallest retained value helps.'
  },
  'algo-subsets': {
    reasoning: 'Choosing only later positions generates every selection once. Recording before children gives the required preorder; undo restores the parent selection.',
    trace: '[4,1]: record []; choose 4, record [4]; choose 1, record [4,1]; undo twice; choose 1, record [1]. Empty input records [] once and has no children, producing [[]].',
    traceSteps: {
      code: ['function subsets(numbers: number[]): number[][] {', '  const result: number[][] = [], current: number[] = []', '  function explore(start: number) {', '    result.push([...current])', '    for (let i = start; i < numbers.length; i++) {', '      current.push(numbers[i]); explore(i + 1); current.pop()', '    }', '  }', '  explore(0)', '  return result', '}'],
      input: 'numbers = [4, 1, 7]',
      steps: [
        {
          line: 3,
          vars: {
            current: '[]',
            emitted: 1
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      children: [
                        {
                          id: 'n012',
                          value: 7
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  children: [
                    {
                      id: 'n12',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7
                }
              ]
            },
            current: 'root',
            visited: []
          },
          note: 'Emit the empty subset first. Each child below adds one later number.'
        },
        {
          line: 3,
          vars: {
            current: '[4]',
            emitted: 2
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      children: [
                        {
                          id: 'n012',
                          value: 7
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  children: [
                    {
                      id: 'n12',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7
                }
              ]
            },
            current: 'n0',
            visited: ['root']
          },
          note: 'Choose 4 and explore: emit [4].'
        },
        {
          line: 3,
          vars: {
            current: '[4,1]',
            emitted: 3
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      note: '[4,1]',
                      children: [
                        {
                          id: 'n012',
                          value: 7
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  children: [
                    {
                      id: 'n12',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7
                }
              ]
            },
            current: 'n01',
            visited: ['root', 'n0']
          },
          note: 'Choose 1 and explore: emit [4,1].'
        },
        {
          line: 3,
          vars: {
            current: '[4,1,7]',
            emitted: 4
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      note: '[4,1]',
                      children: [
                        {
                          id: 'n012',
                          value: 7,
                          note: '[4,1,7]'
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  children: [
                    {
                      id: 'n12',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7
                }
              ]
            },
            current: 'n012',
            visited: ['root', 'n0', 'n01']
          },
          note: 'Choose 7 and explore: emit [4,1,7]. Nothing later remains, so this branch ends and the choice is undone.'
        },
        {
          line: 3,
          vars: {
            current: '[4,7]',
            emitted: 5
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      note: '[4,1]',
                      children: [
                        {
                          id: 'n012',
                          value: 7,
                          note: '[4,1,7]'
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7,
                      note: '[4,7]'
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  children: [
                    {
                      id: 'n12',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7
                }
              ]
            },
            current: 'n02',
            visited: ['root', 'n0', 'n01', 'n012']
          },
          note: 'Choose 7 and explore: emit [4,7]. Nothing later remains, so this branch ends and the choice is undone.'
        },
        {
          line: 3,
          vars: {
            current: '[1]',
            emitted: 6
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      note: '[4,1]',
                      children: [
                        {
                          id: 'n012',
                          value: 7,
                          note: '[4,1,7]'
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7,
                      note: '[4,7]'
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  note: '[1]',
                  children: [
                    {
                      id: 'n12',
                      value: 7
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7
                }
              ]
            },
            current: 'n1',
            visited: ['root', 'n0', 'n01', 'n012', 'n02']
          },
          note: 'Choose 1 and explore: emit [1].'
        },
        {
          line: 3,
          vars: {
            current: '[1,7]',
            emitted: 7
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      note: '[4,1]',
                      children: [
                        {
                          id: 'n012',
                          value: 7,
                          note: '[4,1,7]'
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7,
                      note: '[4,7]'
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  note: '[1]',
                  children: [
                    {
                      id: 'n12',
                      value: 7,
                      note: '[1,7]'
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7
                }
              ]
            },
            current: 'n12',
            visited: ['root', 'n0', 'n01', 'n012', 'n02', 'n1']
          },
          note: 'Choose 7 and explore: emit [1,7]. Nothing later remains, so this branch ends and the choice is undone.'
        },
        {
          line: 3,
          vars: {
            current: '[7]',
            emitted: 8
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      note: '[4,1]',
                      children: [
                        {
                          id: 'n012',
                          value: 7,
                          note: '[4,1,7]'
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7,
                      note: '[4,7]'
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  note: '[1]',
                  children: [
                    {
                      id: 'n12',
                      value: 7,
                      note: '[1,7]'
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7,
                  note: '[7]'
                }
              ]
            },
            current: 'n2',
            visited: ['root', 'n0', 'n01', 'n012', 'n02', 'n1', 'n12']
          },
          note: 'Choose 7 and explore: emit [7]. Nothing later remains, so this branch ends and the choice is undone.'
        },
        {
          line: 9,
          vars: {
            result: '[[],[4],[4,1],[4,1,7],[4,7],[1],[1,7],[7]]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'root',
              value: '[]',
              note: '[]',
              children: [
                {
                  id: 'n0',
                  value: 4,
                  note: '[4]',
                  children: [
                    {
                      id: 'n01',
                      value: 1,
                      note: '[4,1]',
                      children: [
                        {
                          id: 'n012',
                          value: 7,
                          note: '[4,1,7]'
                        }
                      ]
                    },
                    {
                      id: 'n02',
                      value: 7,
                      note: '[4,7]'
                    }
                  ]
                },
                {
                  id: 'n1',
                  value: 1,
                  note: '[1]',
                  children: [
                    {
                      id: 'n12',
                      value: 7,
                      note: '[1,7]'
                    }
                  ]
                },
                {
                  id: 'n2',
                  value: 7,
                  note: '[7]'
                }
              ]
            },
            visited: ['root', 'n0', 'n01', 'n012', 'n02', 'n1', 'n12', 'n2']
          },
          note: 'All 8 subsets are emitted in depth-first order. Return them.'
        }
      ]
    },
    alternative: 'Bit masks generate the same subsets but need a separate ordering rule. Backtracking output copying costs O(n·2^n) time and output space; the working route is O(n).',
    counterexample: 'Saving the same mutable selection reference repeatedly lets later undo operations empty all recorded results.',
    transfer: 'Allow repeated input values but emit unique subsets. Decide how sorting changes the requested order.'
  },
  'algo-climb-stairs': {
    reasoning: 'Every nonempty route ends in one or two. These disjoint groups contribute the counts for n-1 and n-2; no route is counted twice.',
    trace: 'Counts for destinations 0,1,2,3,4 are 1,1,2,3,5. At 4, three routes end in 1 and two end in 2.',
    traceSteps: {
      code: ['function climbStairs(n: number): number {', '  const ways: number[] = [1, 1]', '  for (let i = 2; i <= n; i++) {', '    ways[i] = ways[i - 1] + ways[i - 2]', '  }', '  return ways[n]', '}'],
      input: 'n = 4',
      steps: [
        {
          line: 0,
          vars: {
            n: 4
          },
          structure: {
            kind: 'table',
            name: 'ways',
            cells: [
              [null, null, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4']
          },
          note: 'ways[i] will hold how many ordered step sequences reach exactly i stairs. Nothing is filled yet.'
        },
        {
          line: 1,
          vars: {
            n: 4
          },
          structure: {
            kind: 'table',
            name: 'ways',
            cells: [
              [1, 1, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4']
          },
          note: 'Base cases: one way to stand at 0 (take no steps) and one way to reach 1 (a single 1-step).'
        },
        {
          line: 3,
          vars: {
            i: 2,
            'ways[2]': 2
          },
          structure: {
            kind: 'table',
            name: 'ways',
            cells: [
              [1, 1, 2, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            current: [0, 2],
            reads: [
              [0, 1],
              [0, 0]
            ]
          },
          note: 'The last step was a 1-step (from stair 1, 1 way) or a 2-step (from stair 0, 1 way): 1 + 1 = 2.'
        },
        {
          line: 3,
          vars: {
            i: 3,
            'ways[3]': 3
          },
          structure: {
            kind: 'table',
            name: 'ways',
            cells: [
              [1, 1, 2, 3, null]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            current: [0, 3],
            reads: [
              [0, 2],
              [0, 1]
            ]
          },
          note: 'The last step was a 1-step (from stair 2, 2 ways) or a 2-step (from stair 1, 1 way): 2 + 1 = 3.'
        },
        {
          line: 3,
          vars: {
            i: 4,
            'ways[4]': 5
          },
          structure: {
            kind: 'table',
            name: 'ways',
            cells: [
              [1, 1, 2, 3, 5]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            current: [0, 4],
            reads: [
              [0, 3],
              [0, 2]
            ]
          },
          note: 'The last step was a 1-step (from stair 3, 3 ways) or a 2-step (from stair 2, 2 ways): 3 + 2 = 5.'
        },
        {
          line: 5,
          vars: {
            result: 5
          },
          structure: {
            kind: 'table',
            name: 'ways',
            cells: [
              [1, 1, 2, 3, 5]
            ],
            colLabels: ['0', '1', '2', '3', '4'],
            reads: [
              [0, 4]
            ]
          },
          note: 'Return ways[4] = 5.'
        }
      ]
    },
    alternative: 'A full table takes O(n) time and O(n) space. Two saved counts take O(n) time and O(1) space. Naive recursion repeats work exponentially.',
    counterexample: 'Using zero ways for zero stairs removes the valid [2] route when calculating two stairs.',
    transfer: 'Count routes when some stairs are blocked. Which states should become zero and how does the start behave?'
  },
  'algo-coin-change': {
    reasoning: 'An optimal nonzero solution has a last coin. Removing it leaves an optimal smaller solution, or replacing that prefix would improve the whole answer.',
    trace: 'For [1,3,4], amount 6: using 1 gives 3 coins, 3 gives 2, and 4 gives 3. Choose 2, representing 3+3. For [4,6], amount 7, every last-coin choice leaves an unreachable amount, so return -1.',
    traceSteps: {
      code: ['function coinChange(coins: number[], amount: number): number {', '  const fewest: number[] = new Array(amount + 1).fill(Infinity)', '  fewest[0] = 0', '  for (let total = 1; total <= amount; total++) {', '    for (const coin of coins) if (coin <= total) fewest[total] = Math.min(fewest[total], fewest[total - coin] + 1)', '  }', '  return fewest[amount] === Infinity ? -1 : fewest[amount]', '}'],
      input: 'coins = [1, 3, 4], amount = 6',
      steps: [
        {
          line: 1,
          vars: {
            amount: 6
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [null, null, null, null, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6']
          },
          note: 'fewest[t] will hold the fewest coins that total exactly t. Every amount starts as "not reached yet" (shown as –).'
        },
        {
          line: 2,
          vars: {
            amount: 6
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, null, null, null, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6']
          },
          note: 'Zero needs zero coins: fewest[0] = 0.'
        },
        {
          line: 4,
          vars: {
            total: 1,
            'fewest[1]': 1
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, 1, null, null, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6'],
            current: [0, 1],
            reads: [
              [0, 0]
            ]
          },
          note: 'Try each coin that fits: coin 1 gives fewest[0] + 1 = 1. Keep the smallest: 1.'
        },
        {
          line: 4,
          vars: {
            total: 2,
            'fewest[2]': 2
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, 1, 2, null, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6'],
            current: [0, 2],
            reads: [
              [0, 1]
            ]
          },
          note: 'Try each coin that fits: coin 1 gives fewest[1] + 1 = 2. Keep the smallest: 2.'
        },
        {
          line: 4,
          vars: {
            total: 3,
            'fewest[3]': 1
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, 1, 2, 1, null, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6'],
            current: [0, 3],
            reads: [
              [0, 2],
              [0, 0]
            ]
          },
          note: 'Try each coin that fits: coin 1 gives fewest[2] + 1 = 3; coin 3 gives fewest[0] + 1 = 1. Keep the smallest: 1.'
        },
        {
          line: 4,
          vars: {
            total: 4,
            'fewest[4]': 1
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, 1, 2, 1, 1, null, null]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6'],
            current: [0, 4],
            reads: [
              [0, 3],
              [0, 1],
              [0, 0]
            ]
          },
          note: 'Try each coin that fits: coin 1 gives fewest[3] + 1 = 2; coin 3 gives fewest[1] + 1 = 2; coin 4 gives fewest[0] + 1 = 1. Keep the smallest: 1.'
        },
        {
          line: 4,
          vars: {
            total: 5,
            'fewest[5]': 2
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, 1, 2, 1, 1, 2, null]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6'],
            current: [0, 5],
            reads: [
              [0, 4],
              [0, 2],
              [0, 1]
            ]
          },
          note: 'Try each coin that fits: coin 1 gives fewest[4] + 1 = 2; coin 3 gives fewest[2] + 1 = 3; coin 4 gives fewest[1] + 1 = 2. Keep the smallest: 2.'
        },
        {
          line: 4,
          vars: {
            total: 6,
            'fewest[6]': 2
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, 1, 2, 1, 1, 2, 2]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6'],
            current: [0, 6],
            reads: [
              [0, 5],
              [0, 3],
              [0, 2]
            ]
          },
          note: 'Try each coin that fits: coin 1 gives fewest[5] + 1 = 3; coin 3 gives fewest[3] + 1 = 2; coin 4 gives fewest[2] + 1 = 3. Keep the smallest: 2 (the greedy 4 + 1 + 1 would use 3).'
        },
        {
          line: 6,
          vars: {
            result: 2
          },
          structure: {
            kind: 'table',
            name: 'fewest',
            cells: [
              [0, 1, 2, 1, 1, 2, 2]
            ],
            colLabels: ['0', '1', '2', '3', '4', '5', '6'],
            reads: [
              [0, 6]
            ]
          },
          note: 'fewest[6] is finite, so return 2 (coins 3 + 3).'
        }
      ]
    },
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
