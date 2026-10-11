import type { RepDepth } from './rep-depth.ts'

export const dsaDepth: Record<string, RepDepth> = {
  'grid-fewest-steps': {
    'reasoning': 'A FIFO frontier processes nondecreasing distances. First discovery of a cell is therefore minimal because every move costs one. Mark on discovery to avoid cycles; separate distance storage preserves the map. O(rows × columns) time and storage.',
    'trace': '["S#E","..."]: distances fill [0,0]=0, [1,0]=1, [1,1]=2, [1,2]=3, [0,2]=4. The wall prevents the apparent two-move route. Return 4.',
    'alternative': 'Repeated distance relaxation also finds the minimum, but may scan the map many times. DFS finds reachability; its first route is not necessarily shortest unless all alternatives are compared.',
    'counterexample': 'Manhattan distance returns 2 for ["S#E","..."], but the answer is 4. Treating only dots as traversable rejects ["SE"], which requires 1 move.',
    'transfer': 'Self-reviewed: some floor cells cost two units to enter. Decide why first FIFO discovery no longer proves minimum cost; original checks cover equal-cost moves only.',
    'traceSteps': {
      'code': [
        'function fewestSteps(grid: string[]): number {',
        '  const h = grid.length, w = grid[0]?.length ?? 0, d = Array.from({length:h}, () => Array<number>(w).fill(-1))',
        '  const q: [number,number][] = []; let result = -1',
        '  for (let r=0;r<h;r++) for (let c=0;c<w;c++) if (grid[r][c] === \'S\') { q.push([r,c]); d[r][c]=0 }',
        '  for (let head=0;head<q.length;head++) {',
        '    const [r,c] = q[head]',
        '    if (grid[r][c] === \'E\') { result=d[r][c]; break }',
        '    for (const [dr,dc] of [[-1,0],[0,1],[1,0],[0,-1]]) {',
        '      const nr=r+dr,nc=c+dc',
        '      if (nr>=0 && nr<h && nc>=0 && nc<w && grid[nr][nc]!==\'#\' && d[nr][nc]===-1) { d[nr][nc]=d[r][c]+1; q.push([nr,nc]) }',
        '    }',
        '  }',
        '  return result',
        '}'
      ],
      'input': 'grid = ["S#E","..."]',
      'steps': [
        {
          'line': 3,
          'vars': {
            'distance': 0
          },
          'structure': {
            'kind': 'table',
            'name': 'distance',
            'cells': [
              [
                0,
                '#',
                null
              ],
              [
                null,
                null,
                null
              ]
            ],
            'current': [
              0,
              0
            ]
          },
          'note': 'Seed S with zero moves.'
        },
        {
          'line': 9,
          'vars': {
            'distance': 1
          },
          'structure': {
            'kind': 'table',
            'name': 'distance',
            'cells': [
              [
                0,
                '#',
                null
              ],
              [
                1,
                null,
                null
              ]
            ],
            'current': [
              1,
              0
            ],
            'reads': [
              [
                0,
                0
              ]
            ]
          },
          'note': 'Discover [1,0] from the previous distance 0; record 1 moves.'
        },
        {
          'line': 9,
          'vars': {
            'distance': 2
          },
          'structure': {
            'kind': 'table',
            'name': 'distance',
            'cells': [
              [
                0,
                '#',
                null
              ],
              [
                1,
                2,
                null
              ]
            ],
            'current': [
              1,
              1
            ],
            'reads': [
              [
                1,
                0
              ]
            ]
          },
          'note': 'Discover [1,1] from the previous distance 1; record 2 moves.'
        },
        {
          'line': 9,
          'vars': {
            'distance': 3
          },
          'structure': {
            'kind': 'table',
            'name': 'distance',
            'cells': [
              [
                0,
                '#',
                null
              ],
              [
                1,
                2,
                3
              ]
            ],
            'current': [
              1,
              2
            ],
            'reads': [
              [
                1,
                1
              ]
            ]
          },
          'note': 'Discover [1,2] from the previous distance 2; record 3 moves.'
        },
        {
          'line': 9,
          'vars': {
            'distance': 4
          },
          'structure': {
            'kind': 'table',
            'name': 'distance',
            'cells': [
              [
                0,
                '#',
                4
              ],
              [
                1,
                2,
                3
              ]
            ],
            'current': [
              0,
              2
            ],
            'reads': [
              [
                1,
                2
              ]
            ]
          },
          'note': 'Discover [0,2] from the previous distance 3; record 4 moves.'
        },
        {
          'line': 12,
          'vars': {
            'result': 4
          },
          'structure': {
            'kind': 'table',
            'name': 'distance',
            'cells': [
              [
                0,
                '#',
                4
              ],
              [
                1,
                2,
                3
              ]
            ]
          },
          'note': 'E is reached at distance 4; all earlier frontier cells have smaller distances.'
        }
      ]
    }
  },
  'grid-count-rooms': {
    'reasoning': 'Scan every cell and start a traversal only at unseen floor. The traversal marks exactly that room, so each room contributes once. A queue or iterative stack works in O(rows × columns) time and storage.',
    'trace': '[".#","#."] contains two isolated dots. Starting at [0,0] cannot reach [1,1] by side moves; the scan later counts the second room. Result 2.',
    'alternative': 'Union-find joins side-adjacent floor cells, then counts distinct roots. It needs more bookkeeping; recursive DFS is concise but can exhaust the call stack on larger maps.',
    'counterexample': 'Counting dots returns 4 for ["..",".."], but all four form one room. Forgetting visited state repeats forever around that square.',
    'transfer': 'Self-reviewed: return room areas in descending order. Decide how to accumulate area and order results; original checks establish only room counts.'
  },
  'grid-open-neighbours': {
    'reasoning': 'Check the origin before considering its four offsets. Each candidate is read only inside both dimensions, and appending in offset order gives the required order. O(1) time and storage.',
    'trace': 'At [0,1] in ["...",".#.","..."]: up is outside, right [0,2] is open, down [1,1] is a wall, left [0,0] is open. Return [[0,2],[0,0]].',
    'alternative': 'Four explicit branches are equally constant-time; an offset list centralizes the order and reduces copied boundary logic.',
    'counterexample': 'Checking column against row count fails on ["..."] at [0,1]. Diagonal offsets incorrectly connect [".#","#."].',
    'transfer': 'Self-reviewed: allow eight directions and define their output order. Original checks do not validate the new adjacency rule.',
    'traceSteps': {
      'code': [
        'function openNeighbours(grid: string[], position: [number, number]): [number, number][] {',
        '  const [r,c] = position, h = grid.length, w = grid[0]?.length ?? 0',
        '  if (r < 0 || r >= h || c < 0 || c >= w) return []',
        '  const result: [number, number][] = []',
        '  for (const [dr,dc] of [[-1,0],[0,1],[1,0],[0,-1]]) {',
        '    const nr = r + dr, nc = c + dc',
        '    if (nr >= 0 && nr < h && nc >= 0 && nc < w && grid[nr][nc] === \'.\') result.push([nr,nc])',
        '  }',
        '  return result',
        '}'
      ],
      'input': 'grid = ["...",".#.","..."], position = [0,1]',
      'steps': [
        {
          'line': 3,
          'vars': {
            'origin': '[0,1]',
            'result': '[]'
          },
          'structure': {
            'kind': 'table',
            'name': 'inspection',
            'cells': [
              [
                null,
                null,
                null
              ],
              [
                null,
                '#',
                null
              ],
              [
                null,
                null,
                null
              ]
            ]
          },
          'note': 'Start with an empty result; # marks the wall. Unfilled cells have not been tested.'
        },
        {
          'line': 6,
          'vars': {
            'result': '[]'
          },
          'structure': {
            'kind': 'table',
            'name': 'inspection',
            'cells': [
              [
                null,
                null,
                null
              ],
              [
                null,
                '#',
                null
              ],
              [
                null,
                null,
                null
              ]
            ]
          },
          'note': 'Up [-1,1] is outside the grid; read no cell.'
        },
        {
          'line': 6,
          'vars': {
            'result': '[[0,2]]'
          },
          'structure': {
            'kind': 'table',
            'name': 'inspection',
            'cells': [
              [
                null,
                null,
                'open'
              ],
              [
                null,
                '#',
                null
              ],
              [
                null,
                null,
                null
              ]
            ],
            'current': [
              0,
              2
            ]
          },
          'note': 'Right [0,2] is inside and open; append it.'
        },
        {
          'line': 6,
          'vars': {
            'result': '[[0,2]]'
          },
          'structure': {
            'kind': 'table',
            'name': 'inspection',
            'cells': [
              [
                null,
                null,
                'open'
              ],
              [
                null,
                'wall',
                null
              ],
              [
                null,
                null,
                null
              ]
            ],
            'current': [
              1,
              1
            ]
          },
          'note': 'Down [1,1] is inside but blocked; append nothing.'
        },
        {
          'line': 6,
          'vars': {
            'result': '[[0,2],[0,0]]'
          },
          'structure': {
            'kind': 'table',
            'name': 'inspection',
            'cells': [
              [
                'open',
                null,
                'open'
              ],
              [
                null,
                'wall',
                null
              ],
              [
                null,
                null,
                null
              ]
            ],
            'current': [
              0,
              0
            ]
          },
          'note': 'Left [0,0] is inside and open; append after right.'
        },
        {
          'line': 8,
          'vars': {
            'result': '[[0,2],[0,0]]'
          },
          'structure': {
            'kind': 'table',
            'name': 'inspection',
            'cells': [
              [
                'open',
                null,
                'open'
              ],
              [
                null,
                'wall',
                null
              ],
              [
                null,
                null,
                null
              ]
            ]
          },
          'note': 'Return right then left; up was outside and down was blocked.'
        }
      ]
    }
  },
'quiet-sensor-span': {
  'reasoning': 'A sliding span tracks exactly its noisy readings. Shrinking until the count is allowed restores validity; the longest valid span ending at each right position includes every possible optimum. O(n) time and O(1) extra storage.',
  'trace': 'For [5,5,6,5], threshold 5 and allowance 0, lengths grow to 2, then the 6 forces the left boundary past it; the final length is 1. Return 2.',
  'alternative': 'Enumerate all starts and extend each span with a noise count: O(n²) time, O(1) storage. This is a useful independent oracle for the stated small limit.',
  'counterexample': 'Using >= marks equality noisy: [5,5], threshold 5, allowance 0 should return 2. Counting all quiet readings ignores gaps.',
  'transfer': 'Self-reviewed: give noisy readings different costs and bound total cost. Decide whether negative costs invalidate shrinking; original checks do not cover this variation.'
},
'shared-seat-occurrences': {
  'reasoning': 'Two positions delimit unmatched suffixes. Discarding the smaller value is safe because the other suffix starts larger; equality consumes one occurrence from each. O(n+m) time with output storage only.',
  'trace': 'Left [0,0,1], right [0]: emit 0 once and exhaust right. The extra left 0 has no matching occurrence.',
  'alternative': 'A frequency map for one list then consumption by the other also works in O(n+m) time, but uses extra count storage.',
  'counterexample': 'A set loses multiplicity: [2,2] and [2,2] require [2,2], not [2].',
  'transfer': 'Self-reviewed: accept unsorted lists and preserve left occurrence order. Decide whether sorting remains appropriate; existing checks do not cover that contract.'
},
'dispatch-priority-order': {
  'reasoning': 'Lexicographic comparison applies urgency before deadline and original position. Including position makes full ties explicit and preserves duplicate identities. Copying protects records and array. O(n log n) comparison-sort work and O(n) storage.',
  'trace': 'A(1,0), B(2,9), C(2,3): urgency puts B and C before A; deadline puts C before B. Return C,B,A.',
  'alternative': 'Repeatedly selecting the best unused index takes O(n²) time and O(n) storage, but provides an independent reference without relying on sort stability.',
  'counterexample': 'Sorting deadline first puts A before C in the example, violating urgency precedence. An ID tie-breaker changes the order of fully tied requests.',
  'transfer': 'Self-reviewed: allow missing deadlines and define their precedence. Explain the new comparator; original checks do not validate it.'
},
'first-affordable-edition': {
  'reasoning': 'Affordability changes only from false to true as costs decrease. A lower-bound search preserves the first true position in its candidate interval; if it ends at length, none qualifies. O(log n) time and O(1) storage.',
  'trace': 'For [9,7,7,3], budget 7: index 2 qualifies but index 1 also qualifies. The boundary is 1, not an arbitrary matching 7.',
  'alternative': 'A left-to-right scan is O(n), O(1) storage and directly expresses the contract. Behavioral checks cannot establish binary search.',
  'counterexample': 'Searching for exact budget fails on [9,3], budget 5: index 1 qualifies without equality. Returning the last qualifying index misses the first.',
  'transfer': 'Self-reviewed: costs are no longer ordered. Explain why the monotone boundary disappears; current checks assume ordered costs.'
},
'nested-parcel-load': {
  'reasoning': 'A call receives the correct depth for its parcel. Numbers contribute weight times depth; arrays sum calls at depth+1. Structural induction gives the total without changing input. O(nodes) time and O(depth) call storage.',
  'trace': 'For [[1],2], the root array has depth 1. Inner array has depth 2, so 1 contributes 3; sibling 2 has depth 2 and contributes 4. Total 7.',
  'alternative': 'An explicit stack of parcel/depth pairs avoids recursion, with O(nodes) work and potentially O(nodes) pending storage.',
  'counterexample': 'A global incrementing depth leaks across siblings: [[1],2] must total 7. Flattening and summing loses all depth factors.',
  'transfer': 'Self-reviewed: arrays carry their own multipliers. Define how ancestor multipliers combine before adapting traversal; original checks do not assess it.'
},
'terminal-folder-paths': {
  'reasoning': 'Depth-first traversal in supplied child order emits terminal paths in the required order. Each branch extends its own prefix, preventing sibling contamination. Time and output storage scale with total returned path length; traversal stack depth is bounded by tree depth.',
  'trace': 'Root r has terminal b and branch a→z. Emit [r,b], then [r,a,z]. No [r,a] is emitted because a has a child.',
  'alternative': 'An explicit stack can carry paths; push children in reverse order to pop them in authored order. It avoids call recursion but retains pending branch state.',
  'counterexample': 'Sorting children changes required order: children b,a must stay b,a. Deduplicating equal names loses distinct terminal paths.',
  'transfer': 'Self-reviewed: only emit terminal paths whose total name length fits a limit. Decide whether pruning is safe; original checks do not cover filtering.'
},
'broadcast-unreached-stations': {
  'reasoning': 'The reached set begins with every seed and is closed under outgoing links. Exploring each newly reached station once terminates despite cycles and reaches exactly the stations with a seed-to-station path. Enumerating all indices gives sorted missing stations. O(V+E) time and O(V) state.',
  'trace': 'For links [[],[0]], seed 0 reaches only 0. Station 1 can send to 0 but cannot receive from it, so return [1].',
  'alternative': 'Repeatedly scan all links from reached sources until no set growth occurs. This fixed-point reference is simpler to audit but may take O(VE) work.',
  'counterexample': 'Treating links as undirected wrongly reaches 1 from seed 0 in [[],[0]]. Starting only from the first seed misses independent broadcast groups.',
  'transfer': 'Self-reviewed: each forwarding hop consumes one minute and delivery has a deadline. Decide what extra distance state is required; original checks do not validate timing.'
},

'parcel-loading-turns': {'reasoning': 'Each waiting cart retains its original identity. Removing one parcel and returning unfinished carts to the back preserves the service order. Stop only when the target reaches zero; other carts can remain.', 'trace': '[2,1,3], target 0: turn 1 leaves cart 0 with 1; turn 2 finishes cart 1; turn 3 leaves cart 2 with 2; turn 4 finishes cart 0. Return 4 even though cart 2 is unfinished.', 'alternative': 'For target count k, earlier or target carts contribute min(count,k) turns and later carts min(count,k-1). Summing is O(n), but requires proving the asymmetric final round. Direct simulation uses O(sum of counts) turns and O(n) storage with a head index; shifting arrays adds movement cost.', 'counterexample': 'Counting complete rounds overcounts later carts: [1,100], target 0 finishes on turn 1, before cart 1 gets a turn. Looking up a count instead of identity confuses equal carts: [2,2,2], target 2 finishes on turn 6.', 'transfer': 'Self-reviewed: let carts remove up to two parcels each turn. Decide whether a turn or a parcel is counted and derive new boundaries; original checks do not validate the changed policy.'},
'ticket-service-times': {'reasoning': 'The desk finish time is the earliest availability for the next ticket. Taking the later of that time and arrival respects both constraints while preserving FIFO order, including ties.', 'trace': 'For arrivals 0,0,10 and durations 2,1,1, starts are 0,2,10 and finishes 2,3,11. The third ticket waits for its arrival, not an invented continuous backlog.', 'alternative': 'An explicit waiting queue and minute-by-minute simulation can reproduce service, but adds idle iterations. One pass uses O(n) time and O(n) output storage with O(1) extra state.', 'counterexample': 'Starting every ticket at arrival overlaps service: arrivals [2,3] with durations [3,1] must start at [2,5], not [2,3]. Sorting equal arrivals by ID also breaks input-order precedence.', 'transfer': 'Self-reviewed: allow unsorted arrivals and choose a tie policy. Explain how you would order tickets and restore output to original input order; current checks do not cover that contract.'},
  'sorted-offset-squares': {
    'reasoning': 'The largest remaining square must come from an endpoint: every interior magnitude is bounded by one of the endpoint magnitudes. Compare their squares, place the larger at the last unfilled output position, and discard only that occurrence. The unfilled prefix then contains exactly the remaining squares. This takes O(n) time and O(n) output storage.',
    'trace': 'For [-3,-1,3], equal endpoint squares are both 9. Write the left 9 at position 2, then the right 9 at position 1, then 1 at position 0. The result is [1,9,9]; equality never removes an occurrence.',
    'alternative': 'Mapping to squares then numerically sorting a new array is simpler to explain and satisfies the output contract. Sorting time depends on the implementation; endpoint selection guarantees linear work. Checks accept both approaches.',
    'counterexample': 'Squaring in input order gives [16,1,0,9] for [-4,-1,0,3], which is not ascending. Dropping equal endpoint squares loses a duplicate for [-3,3].',
    'transfer': 'Self-review: return original offsets ordered by absolute magnitude with ties retaining input order. Decide which endpoint wins a tie; original checks do not validate this variation.'
},
  'reading-run-summary': {
    'reasoning': 'A read position visits each input once, while a write position identifies the last output record. After each visit, records describe exactly the visited prefix. Equal readings extend its final count; a different reading begins a fresh record. Sortedness guarantees all occurrences of one value are consecutive. Work is O(n), with O(d) output storage for d distinct values.',
    'trace': 'For [-1,2,2], read index 0 writes {value:-1,count:1} at output index 0. Index 1 writes {value:2,count:1} at output index 1. Index 2 extends that record to count 2. No final run remains to flush.',
    'alternative': 'A map of counts followed by records also works, but needs separate frequency state and attention to output order. Read/write positions can construct the ordered records directly. Behavioral checks do not establish which approach was used.',
    'counterexample': 'Only emitting a run when its value changes drops the last run: [7,7,7] would return []. Testing the current value by truthiness mishandles [0,0].',
    'transfer': 'Self-review: accept unsorted readings and retain first-seen value order. Explain which sortedness assumption breaks and what additional state you need; these checks do not assess the changed contract.'
},


  'algo-insertion-sort': {
    'reasoning': 'Before each insertion, the prefix is sorted and contains all earlier items. Shifting only larger values makes room without losing duplicates. A copy preserves the input.',
    'trace': 'For [3, 1, 3], save 1, shift the first 3 right, and insert 1 at index 0: [1, 3, 3]. The next 3 needs no shift because equality is allowed.',
    'alternative': 'A numeric sort on a copy is shorter and passes behavior checks but skips insertion practice. Insertion sort takes O(n²) worst-case time, O(n) time when already sorted, and O(n) space for the required copy.',
    'counterexample': 'Shifting equal values is unnecessary; dropping them is incorrect. [2, 2] must return [2, 2]. A default text sort also puts 10 before 2.',
    'transfer': 'Self-review: sort records by score while keeping equal-score records in original order. Which comparison preserves that order?',
    'traceSteps': {
      'code': [
        'function insertionSort(numbers: number[]): number[] {',
        '  const sorted = [...numbers]',
        '  for (let i = 1; i < sorted.length; i++) {',
        '    const value = sorted[i]',
        '    let j = i - 1',
        '    while (j >= 0 && sorted[j] > value) { sorted[j + 1] = sorted[j]; j-- }',
        '    sorted[j + 1] = value',
        '  }',
        '  return sorted',
        '}'
      ],
      'input': 'numbers = [3, 1, 3]',
      'steps': [
        {
          'line': 1,
          'vars': {
            'sorted': '[3, 1, 3]'
          },
          'note': 'Copy the input; the first item is already an ordered prefix.'
        },
        {
          'line': 3,
          'vars': {
            'i': 1,
            'value': 1
          },
          'note': 'Save the next value before shifting.'
        },
        {
          'line': 5,
          'vars': {
            'j': -1,
            'sorted': '[3, 3, 3]'
          },
          'note': 'Move 3 right; the saved 1 is still available.'
        },
        {
          'line': 6,
          'vars': {
            'sorted': '[1, 3, 3]'
          },
          'note': 'Insert 1 at the start.'
        },
        {
          'line': 6,
          'vars': {
            'i': 2,
            'value': 3,
            'sorted': '[1, 3, 3]'
          },
          'note': 'Equality needs no shift; keep the duplicate.'
        },
        {
          'line': 8,
          'vars': {
            'result': '[1, 3, 3]'
          },
          'note': 'Return the separate sorted array.'
        }
      ]
    }
  },
  'algo-merge-sorted': {
    'reasoning': 'The smaller unused head is no greater than any remaining value in either list. Appending it preserves output order. Advancing only its cursor uses each position once.',
    'trace': 'For [1, 3] and [2, 3, 4], append 1, then 2, then the left 3 on equality. The left list is empty, so append the remaining right 3 and 4.',
    'alternative': 'Concatenate and numeric-sort is simple but ignores existing order. A two-cursor merge takes O(n + m) time and O(n + m) output space; sorting usually takes more comparisons.',
    'counterexample': 'Stopping when either list ends loses leftovers: [1] and [2, 3] must yield [1, 2, 3]. A Set would also wrongly remove duplicates.',
    'transfer': 'Self-review: merge timestamped records with left-first ties. Define and inspect the order of equal timestamps, which numeric checks cannot establish.',
    'traceSteps': {
      'code': [
        'function mergeSorted(left: number[], right: number[]): number[] {',
        '  const result: number[] = []',
        '  let a = 0, b = 0',
        '  while (a < left.length || b < right.length) {',
        '    if (b === right.length || (a < left.length && left[a] <= right[b])) result.push(left[a++])',
        '    else result.push(right[b++])',
        '  }',
        '  return result',
        '}'
      ],
      'input': 'left = [1, 3], right = [2, 3, 4]',
      'steps': [
        {
          'line': 2,
          'vars': {
            'a': 0,
            'b': 0
          },
          'note': 'Both cursors start at the first unused position.'
        },
        {
          'line': 4,
          'vars': {
            'a': 1,
            'b': 0,
            'output': '[1]'
          },
          'note': 'Take the smaller left head.'
        },
        {
          'line': 5,
          'vars': {
            'a': 1,
            'b': 1,
            'output': '[1, 2]'
          },
          'note': 'Take the smaller right head.'
        },
        {
          'line': 4,
          'vars': {
            'a': 2,
            'b': 1,
            'output': '[1, 2, 3]'
          },
          'note': 'Take the left head on equality.'
        },
        {
          'line': 5,
          'vars': {
            'a': 2,
            'b': 3,
            'output': '[1, 2, 3, 3, 4]'
          },
          'note': 'The left list is exhausted; consume the right remainder.'
        },
        {
          'line': 7,
          'vars': {
            'result': '[1, 2, 3, 3, 4]'
          },
          'note': 'Return every value, including both equal threes.'
        }
      ]
    }
  },
  'algo-recursive-sum': {
    'reasoning': 'An empty call returns 0. Each number contributes itself; each array contributes its recursively computed sum. Calls descend a finite acyclic structure, so every number is included once and calls terminate.',
    'trace': 'For [1, [2, [], [-3]], 4], [] returns 0 and [-3] returns -3. The middle list returns 2 + 0 - 3 = -1; the outer list returns 1 - 1 + 4 = 4.',
    'alternative': 'An explicit stack avoids recursive calls but requires managing pending items. Both visit O(e) entries; recursion uses O(d) call depth, while a stack can hold O(e) pending entries.',
    'counterexample': 'Adding only top-level numbers returns 5 instead of 4 for the trace. Returning on the first nested list also skips later siblings.',
    'transfer': 'Self-review: count numbers rather than sum them. What should zero and an empty nested array contribute under the new contract?',
    'traceSteps': {"code": ["type NestedNumber = number | NestedNumber[]; function recursiveSum(items: NestedNumber[]): number {", "  let total = 0", "  for (const item of items) {", "    if (Array.isArray(item)) total += recursiveSum(item)", "    else total += item", "  }", "  return total", "}"], "input": "items = [1, [2, [], [-3]], 4]", "steps": [{"line": 1, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 0"}], "event": "call"}, "note": "The first call starts on the whole list with an empty total."}, {"line": 4, "vars": {"total": 1}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}]}, "note": "The number 1 is not a list, so it is added directly. No new frame is pushed."}, {"line": 3, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 0"}], "event": "call"}, "note": "The nested list [2, [], [-3]] is a smaller version of the task, so a new frame is pushed on top."}, {"line": 3, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([])", "locals": "total = 0"}], "event": "call"}, "note": "The middle call has added 2, then pushes a frame for the empty list."}, {"line": 6, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([])", "locals": "total = 0", "returns": 0}], "event": "return"}, "note": "The base case: an empty list has nothing to loop over and returns 0. The frame is popped."}, {"line": 3, "vars": {"total": -3}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([-3])", "locals": "total = 0"}], "event": "call"}, "note": "Back in the middle call, 0 is added, and the next list [-3] gets its own frame."}, {"line": 6, "vars": {"total": -3}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([-3])", "locals": "total = -3", "returns": -3}], "event": "return"}, "note": "The deepest call adds -3 and returns it. The frame is popped."}, {"line": 6, "vars": {"total": -1}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = -1", "returns": -1}], "event": "return"}, "note": "The middle call finishes 2 + 0 + -3 = -1 and returns it. Its frame is popped."}, {"line": 6, "vars": {"result": 4, "total": 4}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 4", "returns": 4}], "event": "return"}, "note": "The outer call adds -1, then 4, to reach 4 and returns the answer. The stack is empty again."}]}
  },
  'algo-tree-depth': {
    'reasoning': 'A leaf contributes one node. Each parent contributes one plus its largest child depth because a route follows a single child, not all siblings. Null has no nodes and returns zero.',
    'trace': 'For a root with a leaf child and another child containing a leaf, child depths are 1 and 2. The root returns 1 + max(1, 2) = 3, even if its value is zero.',
    'alternative': 'A breadth-first traversal can count whole levels instead. Both visit O(n) nodes; recursive traversal needs O(d) call depth, while a level queue may hold O(n) nodes in a wide tree.',
    'counterexample': 'Adding sibling depths measures something else: a root with two leaves has depth 2, not 3. Counting edges gives 0 for a leaf, but this contract counts nodes.',
    'transfer': 'Self-review: return the values along a deepest route. Define a tie rule for equal-depth routes before changing the implementation.',
    'traceSteps': {"code": ["type TreeNode = {value: number; children: TreeNode[]}; function treeDepth(root: TreeNode | null): number {", "  if (root === null) return 0", "  let deepest = 0", "  for (const child of root.children) {", "    deepest = Math.max(deepest, treeDepth(child))", "  }", "  return 1 + deepest", "}"], "input": "root = {value: 0, children: [{value: 7, children: []}, {value: 2, children: [{value: 3, children: []}]}]}", "steps": [{"line": 2, "vars": {"node": 0, "deepest": 0}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "root", "visited": []}, "note": "Start at the root, node 0, with no child depth yet."}, {"line": 4, "vars": {"node": 7}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "a", "visited": []}, "note": "The first loop pass calls treeDepth on child 7."}, {"line": 6, "vars": {"node": 7, "depth": 1}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "a", "visited": ["a"]}, "note": "Node 7 has no children, so deepest stays 0 and it returns 1 + 0 = 1."}, {"line": 4, "vars": {"node": 0, "deepest": 1}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "root", "visited": ["a"]}, "note": "Back at the root, deepest becomes max(0, 1) = 1."}, {"line": 4, "vars": {"node": 3}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "c", "visited": ["a"]}, "note": "The second child, node 2, calls treeDepth on its own child, node 3."}, {"line": 6, "vars": {"node": 3, "depth": 1}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3, "note": "depth 1"}]}]}, "current": "c", "visited": ["a", "c"]}, "note": "Node 3 is a leaf and returns 1."}, {"line": 6, "vars": {"node": 2, "depth": 2}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "note": "depth 2", "children": [{"id": "c", "value": 3, "note": "depth 1"}]}]}, "current": "b", "visited": ["a", "c", "b"]}, "note": "Node 2 adds itself to its deepest child: 1 + 1 = 2."}, {"line": 6, "vars": {"result": 3, "node": 0, "deepest": 2}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "note": "depth 3", "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "note": "depth 2", "children": [{"id": "c", "value": 3, "note": "depth 1"}]}]}, "current": "root", "visited": ["a", "c", "b"]}, "note": "The root takes the larger child depth, max(1, 2) = 2, and adds itself: 3."}]}
  },
  'algo-graph-reachable': {
    'reasoning': 'Validate endpoints before accepting equality. Every queued node is reachable from start. Marking nodes when queued prevents repeated discovery; exploring all reachable nodes finds target or exhausts the queue.',
    'trace': 'For [[1], [0], []], start 0, target 2: queue [0], discover 1, then explore 1. Its neighbor 0 is already seen. The queue ends without 2, so return false.',
    'alternative': 'Depth-first search with a stack also answers reachability but explores in a different order. BFS with a head index visits O(V + E) reachable nodes and listed edges, using O(V) extra space; repeatedly shifting an array can add copying work.',
    'counterexample': 'Returning true for start === target before validation accepts an empty graph with 0, 0. Treating connections as undirected incorrectly allows node 1 to reach 0 in [[1], []].',
    'transfer': 'Self-review: return the minimum number of connections instead of a boolean. Explain why BFS order matters and define the unreachable result.',
    'traceSteps': {"code": ["function graphReachable(graph: number[][], start: number, target: number): boolean {", "  if (start < 0 || target < 0 || start >= graph.length || target >= graph.length) return false", "  const queue = [start], seen = new Set([start])", "  let found = false", "  for (let head = 0; head < queue.length; head++) {", "    const node = queue[head]", "    if (node === target) { found = true; break }", "    for (const next of graph[node]) if (!seen.has(next)) { seen.add(next); queue.push(next) }", "  }", "  return found", "}"], "input": "graph = [[1], [0], []], start = 0, target = 2", "steps": [{"line": 1, "vars": {"start": 0, "target": 2}, "note": "Both endpoints are valid nodes, so the search can begin."}, {"line": 2, "vars": {"seen": "{0}"}, "structure": {"kind": "array", "values": [0]}, "note": "Discover the start before exploring it. The queue holds [0]."}, {"line": 5, "vars": {"head": 0, "node": 0, "seen": "{0}"}, "structure": {"kind": "array", "values": [0], "pointers": {"head": 0}}, "note": "Explore node 0, the front of the queue. It is not the target."}, {"line": 7, "vars": {"head": 0, "node": 0, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "pointers": {"head": 0}}, "note": "Node 0 links to unseen node 1, so mark it seen and add it to the back of the queue."}, {"line": 5, "vars": {"head": 1, "node": 1, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "pointers": {"head": 1}, "dimmed": [0]}, "note": "Node 0 is finished (dimmed). Explore node 1 next; it is not the target."}, {"line": 7, "vars": {"head": 1, "node": 1, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "pointers": {"head": 1}, "dimmed": [0]}, "note": "Node 1 links back to node 0, which is already seen, so nothing is queued. This stops the cycle."}, {"line": 9, "vars": {"result": false, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "dimmed": [0, 1]}, "note": "Every queued node has been explored without meeting node 2, so return false."}]}
  },
  'ds-array-operations': {
    'reasoning': 'Copying preserves the caller’s array; appending creates a last item even for empty input.',
    'trace': '[] becomes [0] when extra is 0. Length is 1, so index 0 returns 0.',
    'alternative': 'Returning extra directly passes the behavior checks but skips the learning goal. Copy and append require O(n) time and space; inspect the code separately.',
    'counterexample': 'Calling numbers.push(extra) changes the input even though the returned value is right.',
    'transfer': 'Return the copied array instead. How would the output contract and checks change?'
  },
  'ds-set-operations': {
    'reasoning': 'Adding before deleting makes removal win when the two supplied values match. A new set leaves the input unchanged.',
    'trace': 'For [], extra 5, removed 5: {} → {5} → {}; size is 0.',
    'alternative': 'An array with duplicate checks can work but repeatedly scans values. A Set stores O(k) distinct values and has efficient average access without a universal O(1) guarantee.',
    'counterexample': 'Deleting before adding returns 1 instead of 0 for [], 5, 5.',
    'transfer': 'Return whether a requested number is present after the updates. Practice has and distinguish membership from size.'
  },
  'ds-map-operations': {
    'reasoning': 'Sequential writes leave the latest value for each key. Checking absence separately preserves zero.',
    'trace': '[(a, 2)] followed by set(a, 0) stores 0; querying b returns null.',
    'alternative': 'A record can represent string keys, but needs care with inherited property names and absence. A Map makes these operations explicit and stores O(k) keys.',
    'counterexample': 'lookup.get(query) || null turns a stored 0 into null.',
    'transfer': 'Delete a key before querying and return both membership and value. Explain why these are different questions.'
  },
  'ds-stack-operations': {
    'reasoning': 'The push and pop cancel each other; the remaining top is the original last item, or absent for empty input.',
    'trace': '[0] → [0, 3] → [0]; peeking returns 0, not null.',
    'alternative': 'Reading the original last item is O(1) and behaviorally equivalent. The requested copy-based practice is O(n) time/space; review operations yourself.',
    'counterexample': 'Reading stack[0] returns 1 rather than 8 for [1, -2, 8].',
    'transfer': 'Model undo: pop an action and report both the removed action and the new top. Define the empty rule for each.',
    'traceSteps': {
      'code': [
        'function stackTop(numbers: number[], extra: number): number | null {',
        '  const stack = [...numbers]',
        '  stack.push(extra)',
        '  stack.pop()',
        '  const top = stack[stack.length - 1] ?? null',
        '  return top',
        '}'
      ],
      'input': 'numbers = [1, -2, 8], extra = 6',
      'steps': [
        { 'line': 0, 'vars': { 'extra': 6 }, 'structure': { 'kind': 'stack', 'values': [1, -2, 8] }, 'note': 'The function receives the caller array and the extra value, and nothing has been changed yet.' },
        { 'line': 1, 'vars': { 'extra': 6, 'stack': '[1, -2, 8]' }, 'structure': { 'kind': 'stack', 'values': [1, -2, 8] }, 'note': 'Spreading creates a new stack, so later pushes and pops leave the array the caller passed unchanged.' },
        { 'line': 2, 'vars': { 'extra': 6, 'stack': '[1, -2, 8, 6]' }, 'structure': { 'kind': 'stack', 'values': [1, -2, 8, 6] }, 'note': 'Push places 6 on top, so it is the next value that a pop removes.' },
        { 'line': 3, 'vars': { 'extra': 6, 'stack': '[1, -2, 8]' }, 'structure': { 'kind': 'stack', 'values': [1, -2, 8] }, 'note': 'Pop removes the most recently pushed value, which exposes the original top 8 again.' },
        { 'line': 4, 'vars': { 'extra': 6, 'stack': '[1, -2, 8]', 'top': 8 }, 'structure': { 'kind': 'stack', 'values': [1, -2, 8] }, 'note': 'Reading the last index peeks at the top without removing it, so top holds 8.' },
        { 'line': 5, 'vars': { 'extra': 6, 'stack': '[1, -2, 8]', 'top': 8, 'result': 8 }, 'structure': { 'kind': 'stack', 'values': [1, -2, 8] }, 'note': 'The top is 8 rather than null, so the function returns it.' }
      ]
    }
  },
  'ds-queue-operations': {
    'reasoning': 'Appending before removing lets an empty input process the new item immediately. The remaining front is the next oldest item.',
    'trace': '[4] → [4, 9] → [9]; peek returns 9. [] → [9] → [] returns null.',
    'alternative': 'Array shift can move O(n) items. A head-index queue avoids repeated shifts but needs a cleanup policy; this single copy/update uses O(n) time and space.',
    'counterexample': 'Using pop on [1, 2, 3, 4] leaves front 1, while dequeue should leave front 2.',
    'transfer': 'Process many arrivals and removals with a head index. Decide when consumed storage should be reclaimed.'
  },
  'algo-sorted-pair': {
    'reasoning': 'If the smallest plus largest candidate is too small, that smallest value cannot pair with any remaining value. The symmetric argument removes the largest when the sum is too large.',
    'trace': '[1, 2, 4], target 8: 1+4=5 moves left; 2+4=6 moves left again; pointers meet, so false. The same 4 cannot be reused.',
    'alternative': 'Nested loops are simpler and work on unsorted arrays but take O(n²) time. Two pointers take O(n) time and O(1) extra space on sorted input.',
    'counterexample': 'Using left <= right permits [3], target 6 to reuse one item incorrectly.',
    'transfer': 'Return original indices for unsorted input. Decide whether sorting or a lookup map preserves the required identity.',
    'traceSteps': {
      'code': [
        'function hasSortedPair(numbers: number[], target: number): boolean {',
        '  let left = 0, right = numbers.length - 1',
        '  while (left < right) {',
        '    const sum = numbers[left] + numbers[right]',
        '    if (sum === target) return true',
        '    if (sum < target) left++',
        '    else right--',
        '  }',
        '  return false',
        '}'
      ],
      'input': 'numbers = [1, 3, 4, 6, 9], target = 13',
      'steps': [
        { 'line': 1, 'vars': { 'left': 0, 'right': 4 }, 'structure': { 'kind': 'array', 'values': [1, 3, 4, 6, 9], 'pointers': { 'left': 0, 'right': 4 } }, 'note': 'Both pointers start at the ends of the sorted array, so each candidate pair has one value from each side.' },
        { 'line': 3, 'vars': { 'left': 0, 'right': 4, 'sum': 10 }, 'structure': { 'kind': 'array', 'values': [1, 3, 4, 6, 9], 'pointers': { 'left': 0, 'right': 4 } }, 'note': 'The ends hold 1 and 9, and their sum of 10 is below the target 13.' },
        { 'line': 5, 'vars': { 'left': 1, 'right': 4, 'sum': 10 }, 'structure': { 'kind': 'array', 'values': [1, 3, 4, 6, 9], 'pointers': { 'left': 1, 'right': 4 }, 'dimmed': [0] }, 'note': 'Nine is the largest value on the right, so 1 cannot reach 13 with any partner and is eliminated.' },
        { 'line': 3, 'vars': { 'left': 1, 'right': 4, 'sum': 12 }, 'structure': { 'kind': 'array', 'values': [1, 3, 4, 6, 9], 'pointers': { 'left': 1, 'right': 4 }, 'dimmed': [0] }, 'note': 'The new pair is 3 and 9, and its sum of 12 is still below the target.' },
        { 'line': 5, 'vars': { 'left': 2, 'right': 4, 'sum': 12 }, 'structure': { 'kind': 'array', 'values': [1, 3, 4, 6, 9], 'pointers': { 'left': 2, 'right': 4 }, 'dimmed': [0, 1] }, 'note': 'The value 3 cannot reach 13 with the largest remaining value, so the left pointer moves past it.' },
        { 'line': 3, 'vars': { 'left': 2, 'right': 4, 'sum': 13 }, 'structure': { 'kind': 'array', 'values': [1, 3, 4, 6, 9], 'pointers': { 'left': 2, 'right': 4 }, 'dimmed': [0, 1] }, 'note': 'The pair 4 and 9 sums to exactly 13, so it satisfies the target.' },
        { 'line': 4, 'vars': { 'left': 2, 'right': 4, 'sum': 13, 'result': true }, 'structure': { 'kind': 'array', 'values': [1, 3, 4, 6, 9], 'pointers': { 'left': 2, 'right': 4 }, 'dimmed': [0, 1] }, 'note': 'The pointers name different positions, so this match does not reuse a value and the function returns true.' }
      ]
    }
  },
  'algo-window-sum': {
    'reasoning': 'Subtracting the outgoing value and adding the incoming value preserves the sum of exactly k consecutive items. Comparing each complete window finds the maximum.',
    'trace': '[-5, -2, -7], k=2: first sum -7; remove -5 and add -7 to get -9. Best stays -7.',
    'alternative': 'Recomputing each window takes O(nk) time and O(1) space. A running sum takes O(n) time and O(1) space; both satisfy these output checks.',
    'counterexample': 'Initializing best to 0 incorrectly returns 0 for [-5, -2], k=2 instead of -7.',
    'transfer': 'Find the shortest window reaching a threshold. Does allowing negative values invalidate a simple grow-and-shrink strategy?',
    'traceSteps': {
      'code': [
        'function largestWindowSum(numbers: number[], k: number): number | null {',
        '  if (numbers.length < k) return null',
        '  let sum = 0',
        '  for (let i = 0; i < k; i++) sum += numbers[i]',
        '  let best = sum',
        '  for (let right = k; right < numbers.length; right++) {',
        '    sum += numbers[right] - numbers[right - k]',
        '    best = Math.max(best, sum)',
        '  }',
        '  return best',
        '}'
      ],
      'input': 'numbers = [2, -1, 4, 3], k = 2',
      'steps': [
        { 'line': 3, 'vars': { 'sum': 1 }, 'structure': { 'kind': 'array', 'values': [2, -1, 4, 3], 'pointers': { 'start': 0, 'end': 1 } }, 'note': 'The first two items form the first complete window, and their sum of 1 is the running total.' },
        { 'line': 4, 'vars': { 'sum': 1, 'best': 1 }, 'structure': { 'kind': 'array', 'values': [2, -1, 4, 3], 'pointers': { 'start': 0, 'end': 1 } }, 'note': 'The first complete window becomes the initial best, so the answer always comes from a real window.' },
        { 'line': 6, 'vars': { 'sum': 3, 'right': 2 }, 'structure': { 'kind': 'array', 'values': [2, -1, 4, 3], 'pointers': { 'start': 1, 'end': 2 }, 'dimmed': [0] }, 'note': 'Adding the incoming 4 and removing the outgoing 2 keeps the sum to exactly two items: 1 + 4 - 2 = 3.' },
        { 'line': 7, 'vars': { 'sum': 3, 'best': 3, 'right': 2 }, 'structure': { 'kind': 'array', 'values': [2, -1, 4, 3], 'pointers': { 'start': 1, 'end': 2 }, 'dimmed': [0] }, 'note': 'The window of -1 and 4 sums to 3, which is larger than the previous best of 1.' },
        { 'line': 6, 'vars': { 'sum': 7, 'best': 3, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [2, -1, 4, 3], 'pointers': { 'start': 2, 'end': 3 }, 'dimmed': [0, 1] }, 'note': 'The incoming 3 is added and the outgoing -1 is removed, which raises the window sum to 7.' },
        { 'line': 7, 'vars': { 'sum': 7, 'best': 7, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [2, -1, 4, 3], 'pointers': { 'start': 2, 'end': 3 }, 'dimmed': [0, 1] }, 'note': 'The window of 4 and 3 sums to 7, the largest complete window seen so far.' },
        { 'line': 9, 'vars': { 'sum': 7, 'best': 7, 'result': 7 }, 'structure': { 'kind': 'array', 'values': [2, -1, 4, 3], 'pointers': { 'start': 2, 'end': 3 }, 'dimmed': [0, 1] }, 'note': 'Every complete window has been compared, so the largest sum is the answer.' }
      ]
    }
  },
  'algo-binary-search': {
    'reasoning': 'Sorted order proves that a target greater than the middle cannot occur to its left, and a smaller target cannot occur to its right. Excluding the middle guarantees progress.',
    'trace': '[1, 3, 5], target 4: middle index 1 has 3, so left becomes 2; index 2 has 5, so right becomes 1. The interval is empty: -1.',
    'alternative': 'A linear indexOf is concise and O(n). Binary search takes O(log n) comparisons and O(1) extra space, but requires sorted input.',
    'counterexample': 'Using left = middle can stall on [1, 3], target 2 because the same middle repeats.',
    'transfer': 'Allow duplicates and require the first matching index. Explain why finding any match is no longer enough.',
    'traceSteps': {
      'code': [
        'function sortedIndex(numbers: number[], target: number): number {',
        '  let left = 0, right = numbers.length - 1',
        '  while (left <= right) {',
        '    const middle = Math.floor((left + right) / 2)',
        '    if (numbers[middle] === target) return middle',
        '    if (numbers[middle] < target) left = middle + 1',
        '    else right = middle - 1',
        '  }',
        '  return -1',
        '}'
      ],
      'input': 'numbers = [-3, 0, 4, 9], target = 4',
      'steps': [
        { 'line': 1, 'vars': { 'left': 0, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 0, 'right': 3 } }, 'note': 'Both pointers start at the ends of the sorted array, so the interval covers indices 0 to 3.' },
        { 'line': 2, 'vars': { 'left': 0, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 0, 'right': 3 } }, 'note': 'The interval still has positions, so the loop runs.' },
        { 'line': 3, 'vars': { 'left': 0, 'right': 3, 'middle': 1 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 0, 'right': 3, 'middle': 1 } }, 'note': 'The middle index is 1, and the value there is 0.' },
        { 'line': 5, 'vars': { 'left': 2, 'right': 3, 'middle': 1 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3 }, 'dimmed': [0, 1] }, 'note': 'Zero is less than the target 4, so left moves to index 2. Indices 0 and 1 are out of the interval.' },
        { 'line': 2, 'vars': { 'left': 2, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3 }, 'dimmed': [0, 1] }, 'note': 'Indices 2 and 3 remain, so the loop continues.' },
        { 'line': 3, 'vars': { 'left': 2, 'right': 3, 'middle': 2 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3, 'middle': 2 }, 'dimmed': [0, 1] }, 'note': 'The new middle index is 2, and the value there is 4.' },
        { 'line': 4, 'vars': { 'left': 2, 'right': 3, 'middle': 2, 'result': 2 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3, 'middle': 2 }, 'dimmed': [0, 1] }, 'note': 'The value 4 matches the target, so the function returns index 2.' }
      ]
    }
  },
  'sort-score-records': {
    'reasoning': 'Comparing score first and name only on a score tie implements precedence. Returning equality for both matching keys preserves order with a stable sort.',
    'trace': 'Records z and a with score 0 and blank names remain z then a despite their IDs.',
    'alternative': 'Insertion into a copied list can preserve ties explicitly but takes quadratic time; stable built-in sorting is shorter. Sorting cost depends on the implementation, plus name comparisons.',
    'counterexample': 'Sorting scores as text puts 10 before 2. Using IDs as a third key reverses z and a on a complete tie.',
    'transfer': 'Self-review: change score to descending while retaining ascending names. Which comparison changes?'
  },
  'kth-smallest-copy': {
    'reasoning': 'Sorting a copy puts every occurrence at its numeric rank; position k minus one is therefore the requested occurrence. The copy preserves caller order.',
    'trace': '[2,2,9] has ranks 1=2, 2=2, 3=9; rank 4 returns null.',
    'alternative': 'Selection can avoid fully sorting but is more complex; sorting a copy uses O(n) storage with sorting time depending on the implementation.',
    'counterexample': 'Deduplicating [2,2,9] makes rank 2 equal 9 instead of 2.',
    'transfer': 'Self-review: request the kth distinct value. Define absent-rank behavior again.'
  },
  'count-unique-windows': {
    'reasoning': 'A window is repeat-free exactly when no label has a count above one. Moving it one step removes one count and adds one, so the number of repeated labels can be updated without re-reading all k items.',
    'trace': '["a","a","b","c","a"], k=3: [a,a,b] repeats; slide: [a,b,c] is clean (count 1); slide: [b,c,a] is clean (count 2).',
    'alternative': 'Building a fresh Set for each window takes O(nk) time and is easy to verify; a frequency map updated per step takes O(n) time with up to k stored labels. Both pass these checks.',
    'counterexample': 'Counting distinct labels in the whole array treats [a,b,a,c], k=3 as having three distinct labels. Windows [a,b,a] and [b,a,c] differ, so the answer is 1, not 2.',
    'transfer': 'Self-review: return the largest number of distinct labels in any window of k. What changes in the bookkeeping, and what no longer matters?'
  },
  'shortest-run-reaching-target': {
    'reasoning': 'With positive numbers, extending a run only raises its total and dropping the oldest item only lowers it. Growing until the total reaches target, then shrinking while it still does, therefore tests every useful start exactly once.',
    'trace': '[2,3,1,2,4,3], target 7: grow to [2,3,1,2] total 8, record 4; shrink to [3,1,2] total 6; grow to [3,1,2,4] total 10, shrink to [2,4] total 6 after recording 3; grow with 3 to [4,3] = 7, record 2.',
    'alternative': 'Trying every start and extending until the target takes O(n squared) time; prefix sums with a search per start take O(n log n). The grow-and-shrink run takes O(n) time and O(1) storage.',
    'counterexample': 'Using > instead of >= misses an exact total: [5] with target 5 returns 0 instead of 1. Shrinking only once per step misses [1,1,9] with target 9.',
    'transfer': 'Self-review: allow zero or negative numbers. Why can giving up the oldest item then lose a better run, and what would you need instead?'
  },
  'first-insertion-point': {
    'reasoning': 'Because the array is ordered, "is this value at least target?" is false for a prefix and true for the rest. Keeping the middle when it answers true, and discarding it when false, converges on the first true position, which is the first of any duplicates. Cost is O(log n) comparisons and O(1) extra space.',
    'trace': '[1, 3, 3, 7], target 3: the interval is 0 to 4. Middle 2 has 3, which is at least 3, so the answer is at index 2 or earlier and the end moves to 2. Middle 1 has 3, so the end moves to 1. Middle 0 has 1, which is below 3, so the start moves to 1. The interval is empty at index 1.',
    'alternative': 'A linear scan for the first value at least target is O(n) and simpler. Binary search needs the sorted precondition but takes O(log n) comparisons.',
    'counterexample': 'Returning as soon as a middle value equals target gives index 2 for [3, 3, 3] instead of 0, and indexOf gives -1 for an absent target where an insertion index is required.',
    'transfer': 'Self-review: return how many values are less than or equal to target. Explain which boundary you search for and how it relates to this one; the original checks do not validate the changed question.'
  },
  'smallest-daily-capacity': {
    'reasoning': 'The answer is not an index, but feasibility is monotonic: if a capacity ships everything in time, any larger capacity does too. The answer therefore lies between the heaviest package and the total weight, and testing the middle capacity with a greedy day count discards half of that range each time.',
    'trace': '[1, 2, 3, 4, 5], 2 days: capacities run from 5 to 15. Capacity 10 needs 2 days (1+2+3+4, then 5), so try lower. Capacity 7 needs 3 days (1+2+3, 4, 5), so go higher. Capacity 8 needs 3 days, capacity 9 needs 2 days (1+2+3, 4+5), so 9 is the smallest.',
    'alternative': 'Trying each capacity from the heaviest package upward is simple but can test up to the total weight. Binary searching the answer space needs only about log of that range, each test costing O(n).',
    'counterexample': 'Using the heaviest package alone fails for [7, 2, 5, 10, 8] over 2 days, which needs 18, and using total divided by days fails the same input because packages cannot be split or reordered.',
    'transfer': 'Self-review: allow each truck to carry at most m packages as well as a weight limit. Which part of the feasibility test changes, and does the monotonic property still hold?'
  },
  'flatten-nested-numbers': {
    'reasoning': 'Visiting children in their stored order and appending only numbers preserves the full left-to-right sequence. Empty arrays append nothing. Work is O(e) for all entries, with output and nesting storage.',
    'trace': '[0,[-1,0]] appends 0, then -1, then 0; repeated values survive.',
    'traceSteps': {
      code: ['type NestedNumber = number | NestedNumber[]; function flattenNumbers(items: NestedNumber[]): number[] {', '  const flat: number[] = []', '  for (const item of items) {', '    if (Array.isArray(item)) flat.push(...flattenNumbers(item))', '    else flat.push(item)', '  }', '  return flat', '}'],
      input: 'items = [4, [2, [], [5]]]',
      steps: [
        {
          line: 1,
          vars: {
            flat: '[]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = []'
              }
            ],
            event: 'call'
          },
          note: 'The outer call starts with an empty result list.'
        },
        {
          line: 4,
          vars: {
            flat: '[4]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              }
            ]
          },
          note: '4 is a number, so it is pushed directly. No new frame.'
        },
        {
          line: 3,
          vars: {
            flat: '[]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              },
              {
                call: 'flattenNumbers([2, [], [5]])',
                locals: 'flat = []'
              }
            ],
            event: 'call'
          },
          note: 'The next item is a list, so a new call handles it. The outer call waits on the stack.'
        },
        {
          line: 4,
          vars: {
            flat: '[2]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              },
              {
                call: 'flattenNumbers([2, [], [5]])',
                locals: 'flat = [2]'
              }
            ]
          },
          note: 'In the middle call, 2 is a number and is pushed.'
        },
        {
          line: 3,
          vars: {
            flat: '[]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              },
              {
                call: 'flattenNumbers([2, [], [5]])',
                locals: 'flat = [2]'
              },
              {
                call: 'flattenNumbers([])',
                locals: 'flat = []'
              }
            ],
            event: 'call'
          },
          note: 'The empty list gets its own call.'
        },
        {
          line: 6,
          vars: {
            flat: '[]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              },
              {
                call: 'flattenNumbers([2, [], [5]])',
                locals: 'flat = [2]'
              },
              {
                call: 'flattenNumbers([])',
                locals: 'flat = []',
                returns: '[]'
              }
            ],
            event: 'return'
          },
          note: 'Nothing to loop over: it returns [], which adds nothing to the caller. The frame is popped.'
        },
        {
          line: 3,
          vars: {
            flat: '[]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              },
              {
                call: 'flattenNumbers([2, [], [5]])',
                locals: 'flat = [2]'
              },
              {
                call: 'flattenNumbers([5])',
                locals: 'flat = []'
              }
            ],
            event: 'call'
          },
          note: 'The last item, [5], gets a call too.'
        },
        {
          line: 6,
          vars: {
            flat: '[5]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              },
              {
                call: 'flattenNumbers([2, [], [5]])',
                locals: 'flat = [2]'
              },
              {
                call: 'flattenNumbers([5])',
                locals: 'flat = [5]',
                returns: '[5]'
              }
            ],
            event: 'return'
          },
          note: '5 is pushed, then [5] is returned and its frame is popped.'
        },
        {
          line: 6,
          vars: {
            flat: '[2,5]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4]'
              },
              {
                call: 'flattenNumbers([2, [], [5]])',
                locals: 'flat = [2,5]',
                returns: '[2,5]'
              }
            ],
            event: 'return'
          },
          note: 'The middle call spreads [5] onto [2] and returns [2, 5]. Popped.'
        },
        {
          line: 6,
          vars: {
            result: '[4,2,5]',
            flat: '[4,2,5]'
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'flattenNumbers([4, [2, [], [5]]])',
                locals: 'flat = [4,2,5]',
                returns: '[4,2,5]'
              }
            ],
            event: 'return'
          },
          note: 'The outer call spreads [2, 5] after 4 and returns [4, 2, 5].'
        }
      ]
    },
    'alternative': 'An explicit work stack avoids recursive calls but must reverse pushes to preserve order. Both inspect every entry.',
    'counterexample': 'Pushing children in forward order then popping yields [2,1] for [1,2].',
    'transfer': 'Self-review: return each value with its nesting level. Decide the outer level.'
  },
  'count-object-leaves': {
    'reasoning': 'Each property is either one primitive occurrence or a container whose contributions are combined. Null must be classified before other objects. Every property is visited once, O(p) time.',
    'trace': '{a:0,b:null,c:{}} contributes 1+1+0=2.',
    'traceSteps': {
      code: ['type NestedObject = { [key: string]: number | string | boolean | null | NestedObject }; function countLeaves(input: NestedObject): number {', '  let leaves = 0', '  for (const value of Object.values(input)) {', '    if (typeof value === \'object\' && value !== null) leaves += countLeaves(value)', '    else leaves++', '  }', '  return leaves', '}'],
      input: 'input = {user: {name: "Ada", note: null}, empty: {}}',
      steps: [
        {
          line: 1,
          vars: {
            leaves: 0
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 0'
              }
            ],
            event: 'call'
          },
          note: 'The outer call starts with zero leaves and walks its two values.'
        },
        {
          line: 3,
          vars: {
            leaves: 0
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 0'
              },
              {
                call: 'countLeaves({name: "Ada", note: null})',
                locals: 'leaves = 0'
              }
            ],
            event: 'call'
          },
          note: 'The value of user is an object, so it is not a leaf. A new call counts inside it.'
        },
        {
          line: 4,
          vars: {
            leaves: 1
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 0'
              },
              {
                call: 'countLeaves({name: "Ada", note: null})',
                locals: 'leaves = 1'
              }
            ]
          },
          note: '"Ada" is a string: a leaf. Count 1.'
        },
        {
          line: 4,
          vars: {
            leaves: 2
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 0'
              },
              {
                call: 'countLeaves({name: "Ada", note: null})',
                locals: 'leaves = 2'
              }
            ]
          },
          note: 'null looks like an object to typeof, but the null check makes it a leaf. Count 2.'
        },
        {
          line: 6,
          vars: {
            leaves: 2
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 0'
              },
              {
                call: 'countLeaves({name: "Ada", note: null})',
                locals: 'leaves = 2',
                returns: 2
              }
            ],
            event: 'return'
          },
          note: 'The inner object is finished: return 2. Popped.'
        },
        {
          line: 3,
          vars: {
            leaves: 2
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 2'
              },
              {
                call: 'countLeaves({})',
                locals: 'leaves = 0'
              }
            ],
            event: 'call'
          },
          note: 'Back in the outer call, 2 is added. The next value, empty, is an object, so it gets its own call.'
        },
        {
          line: 6,
          vars: {
            leaves: 0
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 2'
              },
              {
                call: 'countLeaves({})',
                locals: 'leaves = 0',
                returns: 0
              }
            ],
            event: 'return'
          },
          note: 'An empty object has no values to count: return 0. Popped.'
        },
        {
          line: 6,
          vars: {
            result: 2,
            leaves: 2
          },
          structure: {
            kind: 'calls',
            frames: [
              {
                call: 'countLeaves({user: {name: "Ada", note: null}, empty: {}})',
                locals: 'leaves = 2',
                returns: 2
              }
            ],
            event: 'return'
          },
          note: 'The outer call adds 0 and returns 2.'
        }
      ]
    },
    'alternative': 'An explicit stack avoids recursive call depth while using pending-object storage; recursion mirrors the object shape.',
    'counterexample': 'typeof null is object; treating null as a container throws instead of counting it.',
    'transfer': 'Self-review: also allow arrays. Decide whether array positions and empty arrays contribute.'
  },
  'tree-depth-sum': {
    'reasoning': 'A node contributes only at the requested depth. Combining all children at one less remaining depth includes each qualifying node once, O(n) time at worst with O(h) recursive depth.',
    'trace': 'Root 9 with children 2 and -3 gives -1 at depth 1; depth 2 has no nodes and gives 0.',
    'traceSteps': {
      code: ['type TreeNode = { value: number; children: TreeNode[] }; function sumAtDepth(root: TreeNode | null, depth: number): number {', '  if (root === null) return 0', '  if (depth === 0) return root.value', '  let total = 0', '  for (const child of root.children) total += sumAtDepth(child, depth - 1)', '  return total', '}'],
      input: 'root = {value: 5, children: [{value: 3, children: [{value: 1, children: []}, {value: 6, children: []}]}, {value: 4, children: [{value: 2, children: []}]}]}, depth = 2',
      steps: [
        {
          line: 2,
          vars: {
            node: 5,
            depth: 2
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'r',
            visited: []
          },
          note: 'Start at the root, node 5, asking for depth 2. The depth is not 0, so pass the question to each child with depth 1.'
        },
        {
          line: 2,
          vars: {
            node: 3,
            depth: 1
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'a',
            visited: []
          },
          note: 'Node 3 is asked for depth 1. Still not 0, so ask its children with depth 0.'
        },
        {
          line: 2,
          vars: {
            node: 1,
            depth: 0
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1,
                      note: 'adds 1'
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'c',
            visited: ['c']
          },
          note: 'Node 1 gets depth 0: it is exactly two levels below the root, so it returns its own value, 1.'
        },
        {
          line: 2,
          vars: {
            node: 6,
            depth: 0
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1,
                      note: 'adds 1'
                    },
                    {
                      id: 'd',
                      value: 6,
                      note: 'adds 6'
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'd',
            visited: ['c', 'd']
          },
          note: 'Node 6 also gets depth 0 and returns 6.'
        },
        {
          line: 5,
          vars: {
            node: 3,
            total: 7
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  note: 'sum 7',
                  children: [
                    {
                      id: 'c',
                      value: 1,
                      note: 'adds 1'
                    },
                    {
                      id: 'd',
                      value: 6,
                      note: 'adds 6'
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'a',
            visited: ['c', 'd']
          },
          note: 'Node 3 adds what its children returned: 1 + 6 = 7, and returns that.'
        },
        {
          line: 2,
          vars: {
            node: 2,
            depth: 0
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  note: 'sum 7',
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2,
                      note: 'adds 2'
                    }
                  ]
                }
              ]
            },
            current: 'e',
            visited: ['c', 'd', 'a', 'e']
          },
          note: 'Back at the root, the second child, 4, asks node 2 with depth 0. Node 2 returns its value, 2.'
        },
        {
          line: 5,
          vars: {
            node: 4,
            total: 2
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  note: 'sum 7',
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  note: 'sum 2',
                  children: [
                    {
                      id: 'e',
                      value: 2,
                      note: 'adds 2'
                    }
                  ]
                }
              ]
            },
            current: 'b',
            visited: ['c', 'd', 'a', 'e']
          },
          note: 'Node 4 has only that one child, so its total is 2.'
        },
        {
          line: 5,
          vars: {
            result: 9,
            total: 9
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              note: 'sum 9',
              children: [
                {
                  id: 'a',
                  value: 3,
                  note: 'sum 7',
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  note: 'sum 2',
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'r',
            visited: ['c', 'd', 'a', 'e', 'b']
          },
          note: 'The root adds the answers from its children: 7 + 2 = 9. Nodes outside depth 2 never add their own value.'
        }
      ]
    },
    'alternative': 'Level-order traversal stores a whole frontier but makes depth boundaries explicit; recursive traversal stores only a call path.',
    'counterexample': 'Returning the largest child value for children 2 and -3 gives 2 instead of -1.',
    'transfer': 'Self-review: total every level into an array. Define the null-tree result.'
  },
  'tree-value-path': {
    'reasoning': 'A successful child route can be prefixed with the current value; failed children contribute no route. Uniqueness removes tie-breaking. Each node is inspected at most once; path copying can add O(nh) work.',
    'trace': 'Searching 4 under root -1 explores 2→3 unsuccessfully, then returns [-1,4]; 2 and 3 never enter the successful route.',
    'traceSteps': {
      code: ['type TreeNode = { value: number; children: TreeNode[] }; function pathToValue(root: TreeNode | null, target: number): number[] | null {', '  if (root === null) return null', '  if (root.value === target) return [root.value]', '  for (const child of root.children) {', '    const rest = pathToValue(child, target)', '    if (rest) return [root.value, ...rest]', '  }', '  return null', '}'],
      input: 'root = {value: 5, children: [{value: 3, children: [{value: 1, children: []}, {value: 6, children: []}]}, {value: 4, children: [{value: 2, children: []}]}]}, target = 6',
      steps: [
        {
          line: 2,
          vars: {
            node: 5,
            target: 6
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'r',
            visited: []
          },
          note: 'Is the root, 5, the target 6? No, so search its children, left to right.'
        },
        {
          line: 2,
          vars: {
            node: 3,
            target: 6
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'a',
            visited: []
          },
          note: 'Child 3 is not the target either; search its children.'
        },
        {
          line: 2,
          vars: {
            node: 1,
            target: 6
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'c',
            visited: []
          },
          note: 'Child 1 is not the target.'
        },
        {
          line: 7,
          vars: {
            node: 1,
            rest: null
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1,
                      note: 'dead end'
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'c',
            visited: ['c']
          },
          note: 'Node 1 has no children, so the loop ends and it returns null. This branch does not contain 6.'
        },
        {
          line: 2,
          vars: {
            node: 6,
            target: 6
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  children: [
                    {
                      id: 'c',
                      value: 1,
                      note: 'dead end'
                    },
                    {
                      id: 'd',
                      value: 6,
                      note: '[6]'
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'd',
            visited: ['c']
          },
          note: 'Back in node 3, the next child is 6, which is the target: return the one-item path [6].'
        },
        {
          line: 5,
          vars: {
            node: 3,
            rest: '[6]'
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              children: [
                {
                  id: 'a',
                  value: 3,
                  note: '[3,6]',
                  children: [
                    {
                      id: 'c',
                      value: 1,
                      note: 'dead end'
                    },
                    {
                      id: 'd',
                      value: 6,
                      note: '[6]'
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'a',
            visited: ['c']
          },
          note: 'Node 3 received a path, so it puts its own value in front: [3, 6].'
        },
        {
          line: 5,
          vars: {
            result: '[5,3,6]',
            node: 5
          },
          structure: {
            kind: 'tree',
            root: {
              id: 'r',
              value: 5,
              note: '[5,3,6]',
              children: [
                {
                  id: 'a',
                  value: 3,
                  note: '[3,6]',
                  children: [
                    {
                      id: 'c',
                      value: 1,
                      note: 'dead end'
                    },
                    {
                      id: 'd',
                      value: 6
                    }
                  ]
                },
                {
                  id: 'b',
                  value: 4,
                  children: [
                    {
                      id: 'e',
                      value: 2
                    }
                  ]
                }
              ]
            },
            current: 'r',
            visited: ['c']
          },
          note: 'The root does the same and returns [5, 3, 6]. The unexplored node 4 is never visited.'
        }
      ]
    },
    'alternative': 'An iterative frontier with copied paths avoids recursive calls but stores multiple paths. Parent links reduce copying at the cost of bookkeeping.',
    'counterexample': 'Keeping a global route without removing failed nodes yields [-1,2,3,4] instead of [-1,4].',
    'transfer': 'Self-review: allow duplicate values and return the first route in child order. Define first precisely.'
  },
  'graph-shortest-hops': {
    'reasoning': 'Breadth-first discovery processes nondecreasing hop counts, so a node’s first discovered distance is minimal. Marking on discovery avoids cycles. Time O(V+E), storage O(V).',
    'trace': 'From 0 in [[1,3],[2],[3],[]], both 1 and 3 have distance 1; the longer 0→1→2→3 route cannot improve 3.',
    'traceSteps': {
      code: ['function shortestHops(graph: number[][], start: number, target: number): number | null {', '  if (start < 0 || target < 0 || start >= graph.length || target >= graph.length) return null', '  const hops = new Map([[start, 0]]), queue = [start]', '  for (const node of queue) {', '    if (node === target) return hops.get(node)!', '    for (const next of graph[node]) if (!hops.has(next)) { hops.set(next, hops.get(node)! + 1); queue.push(next) }', '  }', '  return null', '}'],
      input: 'graph = [[1, 2], [3], [3], [4], []], start = 0, target = 4',
      steps: [
        {
          line: 1,
          vars: {
            start: 0,
            target: 4
          },
          note: 'Both endpoints are nodes in the graph. Edges: 0→1, 0→2, 1→3, 2→3, 3→4. Each queue cell reads "node: hops from start".'
        },
        {
          line: 2,
          vars: {
            start: 0
          },
          structure: {
            kind: 'array',
            values: ['0: 0'],
            pointers: {
              node: 0
            }
          },
          note: 'Start at node 0 with 0 hops. The queue holds just that.'
        },
        {
          line: 5,
          vars: {
            node: 0,
            hops: 0
          },
          structure: {
            kind: 'array',
            values: ['0: 0', '1: 1', '2: 1'],
            pointers: {
              node: 0
            },
            dimmed: []
          },
          note: 'Explore node 0 (0 hops). Newly reached: 1 at 1 hops and 2 at 1 hops.'
        },
        {
          line: 5,
          vars: {
            node: 1,
            hops: 1
          },
          structure: {
            kind: 'array',
            values: ['0: 0', '1: 1', '2: 1', '3: 2'],
            pointers: {
              node: 1
            },
            dimmed: [0]
          },
          note: 'Explore node 1 (1 hops). Newly reached: 3 at 2 hops.'
        },
        {
          line: 5,
          vars: {
            node: 2,
            hops: 1
          },
          structure: {
            kind: 'array',
            values: ['0: 0', '1: 1', '2: 1', '3: 2'],
            pointers: {
              node: 2
            },
            dimmed: [0, 1]
          },
          note: 'Explore node 2 (1 hops). Its neighbours already have hop counts, so nothing is added.'
        },
        {
          line: 5,
          vars: {
            node: 3,
            hops: 2
          },
          structure: {
            kind: 'array',
            values: ['0: 0', '1: 1', '2: 1', '3: 2', '4: 3'],
            pointers: {
              node: 3
            },
            dimmed: [0, 1, 2]
          },
          note: 'Explore node 3 (2 hops). Newly reached: 4 at 3 hops.'
        },
        {
          line: 4,
          vars: {
            node: 4,
            result: 3
          },
          structure: {
            kind: 'array',
            values: ['0: 0', '1: 1', '2: 1', '3: 2', '4: 3'],
            pointers: {
              node: 4
            },
            dimmed: [0, 1, 2, 3]
          },
          note: 'Node 4 is the target, reached in 3 hops. Breadth-first order means no shorter route exists. Return 3.'
        }
      ]
    },
    'alternative': 'Repeated edge relaxation can also find distances but revisits edges; plain depth-first first-match search does not guarantee shortest routes.',
    'counterexample': 'First-match depth-first traversal may report 3 for the direct-edge example, whose answer is 1.',
    'transfer': 'Self-review: edges now have positive costs. Decide whether discovery order still guarantees the cheapest route.'
  },
  'graph-connected-groups': {
    'reasoning': 'Starting a traversal only from an unseen node counts one new component. Traversal marks exactly its connected group, preventing duplicate counts. Time O(V+E), storage O(V).',
    'trace': '[[0,1,1],[0,0],[2]] visits 0 and 1 together despite repeated edges, then counts isolated self-linked 2: total 2.',
    'traceSteps': {
      code: ['function connectedGroups(graph: number[][]): number {', '  const seen = new Set<number>()', '  let groups = 0', '  for (let start = 0; start < graph.length; start++) {', '    if (seen.has(start)) continue', '    groups++', '    const queue = [start]; seen.add(start)', '    for (const node of queue) for (const next of graph[node]) if (!seen.has(next)) { seen.add(next); queue.push(next) }', '  }', '  return groups', '}'],
      input: 'graph = [[1], [0], [3], [2], []]',
      steps: [
        {
          line: 1,
          vars: {
            groups: 0
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            dimmed: []
          },
          note: 'Nodes 0 to 4. Edges: 0–1 and 2–3; node 4 has none. Dimmed nodes are already seen. Nothing is seen yet.'
        },
        {
          line: 6,
          vars: {
            start: 0,
            groups: 1
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            pointers: {
              start: 0
            },
            dimmed: [0]
          },
          note: 'Start at 0. It is unseen, so it begins a new group: groups = 1.'
        },
        {
          line: 7,
          vars: {
            start: 0,
            groups: 1
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            pointers: {
              start: 0
            },
            dimmed: [0, 1]
          },
          note: 'Flood outward from 0: its neighbour 1 is marked seen. Node 1 only points back at 0, so this group is finished.'
        },
        {
          line: 4,
          vars: {
            start: 1,
            groups: 1
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            pointers: {
              start: 1
            },
            dimmed: [0, 1]
          },
          note: 'Start = 1 is already seen, so it belongs to an existing group and is skipped.'
        },
        {
          line: 6,
          vars: {
            start: 2,
            groups: 2
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            pointers: {
              start: 2
            },
            dimmed: [0, 1, 2]
          },
          note: 'Start = 2 is unseen: a new group, groups = 2.'
        },
        {
          line: 7,
          vars: {
            start: 2,
            groups: 2
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            pointers: {
              start: 2
            },
            dimmed: [0, 1, 2, 3]
          },
          note: 'Flood outward from 2 and mark 3 as seen. Start = 3 will then be skipped.'
        },
        {
          line: 6,
          vars: {
            start: 4,
            groups: 3
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            pointers: {
              start: 4
            },
            dimmed: [0, 1, 2, 3, 4]
          },
          note: 'Start = 4 is unseen with no neighbours: an isolated node is its own group, groups = 3.'
        },
        {
          line: 9,
          vars: {
            result: 3,
            groups: 3
          },
          structure: {
            kind: 'array',
            values: [0, 1, 2, 3, 4],
            dimmed: [0, 1, 2, 3, 4]
          },
          note: 'Every node is seen. Return the number of groups: 3.'
        }
      ]
    },
    'alternative': 'Union-find combines endpoints and counts distinct representatives; traversal is easier to trace for this small adjacency contract.',
    'counterexample': 'Counting neighborless nodes alone misses a separate pair: [[1],[0],[3],[2]] has 2 groups despite no empty lists.',
    'transfer': 'Self-review: allow directed edges. Define weak versus strong connectivity before changing checks.'
  },
  'simplify-file-path': {
    'reasoning': 'The saved names represent the normalized prefix. A name extends it; a parent removes its latest name; a current-directory or empty segment leaves it unchanged. O(c) time and storage for c characters.',
    'trace': '/a/b/../../c saves a,b, removes b, removes a, then saves c, returning /c.',
    'alternative': 'Repeated string replacement is harder to bound and can confuse literal dot names; a segment stack states the parent rule directly.',
    'counterexample': 'Treating every dot-prefixed name as special loses .hidden and ... from /.../.hidden/.',
    'transfer': 'Self-review: support relative paths. Decide whether unmatched parent segments must remain.'
  },
}

Object.assign(dsaDepth, {
  'puzzle-parse-part-one': {
    reasoning: 'Parse each nonblank line independently so a tray never borrows another tray\'s strongest value. Numeric conversion makes negative values and multi-digit values comparable. After processing k trays, the running sum equals their maxima, including negative maxima.',
    trace: 'For "1 4 3\\n\\n-5 -2 -4\\n", parsing yields [[1,4,3],[-5,-2,-4]]. Peaks are 4 and -2. Their sum is 2.',
    alternative: 'Process one line at a time and discard its numeric readings after computing its contribution. This uses O(w) temporary numeric storage rather than O(n) for all readings. Keeping all trays makes a changed rule easier to explore; both approaches take O(input length) time here.',
    counterexample: 'Starting the maximum at zero makes "-8 -3 -5" contribute 0 instead of -3.',
    transfer: 'Self-reviewed variation: each section gets a different tolerance stated in a header. Decide how to preserve section identity alongside tray readings. Original checks do not validate this changed format.',
    traceSteps: {
      code: [
        'function strongestTotal(input: string): number {',
        '  const lines = input.split(\'\\n\').map(line => line.trim()).filter(Boolean)',
        '  const trays = lines.map(line => line.split(/[ \\t]+/).map(Number))',
        '  let result = 0',
        '  for (const tray of trays) {',
        '    const peak = Math.max(...tray)',
        '    result += peak',
        '  }',
        '  return result',
        '}'
      ],
      input: 'input = "1 4 3\\n\\n-5 -2 -4\\n"',
      steps: [
        {
          line: 0,
          vars: { input: '1 4 3\n\n-5 -2 -4\n' },
          structure: { kind: 'array', values: ['1 4 3', '', '-5 -2 -4', ''] },
          note: 'The raw lines include a blank separator and a final empty line.'
        },
        {
          line: 1,
          vars: {
            lines: 2
          },
          structure: {
            kind: 'array',
            values: ['1 4 3', '-5 -2 -4']
          },
          note: 'Ignore the blank separator and final empty line; two tray lines remain.'
        },
        {
          line: 2,
          vars: {
            trays: 2
          },
          structure: {
            kind: 'array',
            values: ['[1,4,3]', '[-5,-2,-4]']
          },
          note: 'Convert each line separately into numeric readings; tray boundaries remain intact.'
        },
        {
          line: 6,
          vars: {
            peak: 4,
            result: 4
          },
          structure: {
            kind: 'array',
            values: [1, 4, 3]
          },
          note: 'The first tray contributes its maximum, 4.'
        },
        {
          line: 6,
          vars: {
            peak: -2,
            result: 2
          },
          structure: {
            kind: 'array',
            values: [-5, -2, -4]
          },
          note: 'The second tray contributes -2, reducing the sum to 2.'
        },
        {
          line: 8,
          vars: {
            result: 2
          },
          note: 'Return the combined answer after both trays.'
        }
      ]
    }
  }
})

Object.assign(dsaDepth, {
  'puzzle-adapt-part-two': {
    reasoning: 'Parse each nonblank line independently so a tray never borrows another tray\'s strongest value. Numeric conversion makes negative values and multi-digit values comparable. After processing k trays, the running count includes exactly their readings meeting each local inclusive cutoff. Retaining all occurrences preserves duplicates.',
    trace: 'For "1 4 3\\n\\n-5 -2 -4\\n", parsing yields [[1,4,3],[-5,-2,-4]]. Peaks are 4 and -2. Cutoffs are 2 and -4. Two readings qualify on each tray, so return 4.',
    alternative: 'Process one line at a time and discard its numeric readings after computing its contribution. This uses O(w) temporary numeric storage rather than O(n) for all readings. Keeping all trays makes a changed rule easier to explore; both approaches take O(input length) time here.',
    counterexample: 'Using a global strongest reading makes "1 4 3\\n-5 -2 -4" lose the second tray. Using > instead of >= drops -4 at the exact cutoff; a set drops repeated 7s in "7 7 5 4".',
    transfer: 'Self-reviewed variation: each section gets a different tolerance stated in a header. Decide how to preserve section identity alongside tray readings. Original checks do not validate this changed format.',
    traceSteps: {
      code: [
        'function nearPeakCount(input: string): number {',
        '  const lines = input.split(\'\\n\').map(line => line.trim()).filter(Boolean)',
        '  const trays = lines.map(line => line.split(/[ \\t]+/).map(Number))',
        '  let result = 0',
        '  for (const tray of trays) {',
        '    const peak = Math.max(...tray)',
        '    result += tray.filter(value => value >= peak - 2).length',
        '  }',
        '  return result',
        '}'
      ],
      input: 'input = "1 4 3\\n\\n-5 -2 -4\\n"',
      steps: [
        {
          line: 0,
          vars: { input: '1 4 3\n\n-5 -2 -4\n' },
          structure: { kind: 'array', values: ['1 4 3', '', '-5 -2 -4', ''] },
          note: 'The raw lines include a blank separator and a final empty line.'
        },
        {
          line: 1,
          vars: {
            lines: 2
          },
          structure: {
            kind: 'array',
            values: ['1 4 3', '-5 -2 -4']
          },
          note: 'Ignore the blank separator and final empty line; two tray lines remain.'
        },
        {
          line: 2,
          vars: {
            trays: 2
          },
          structure: {
            kind: 'array',
            values: ['[1,4,3]', '[-5,-2,-4]']
          },
          note: 'Convert each line separately into numeric readings; tray boundaries remain intact.'
        },
        {
          line: 6,
          vars: {
            peak: 4,
            result: 2
          },
          structure: {
            kind: 'array',
            values: [1, 4, 3]
          },
          note: 'The first tray contributes two readings: 4 and 3 are at least 2.'
        },
        {
          line: 6,
          vars: {
            peak: -2,
            result: 4
          },
          structure: {
            kind: 'array',
            values: [-5, -2, -4]
          },
          note: 'The second tray contributes two readings: -2 and -4 are at least -4; -5 is excluded.'
        },
        {
          line: 8,
          vars: {
            result: 4
          },
          note: 'Return the combined answer after both trays.'
        }
      ]
    }
  }
})

export const dsaGuides = {
  'grid-fewest-steps': {
    'plan': [
      'What must the result minimize? Name two routes of different lengths and a map with no possible route.',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the movement rules and preserves input.',
      'State time and storage costs; checks do not prove the approach or complexity.'
    ],
    'example': 'A FIFO frontier processes nondecreasing distances. First discovery of a cell is therefore minimal because every move costs one. Mark on discovery to avoid cycles; separate distance storage preserves the map. O(rows × columns) time and storage. ["S#E","..."]: distances fill [0,0]=0, [1,0]=1, [1,1]=2, [1,2]=3, [0,2]=4. The wall prevents the apparent two-move route. Return 4.'
  },
  'grid-count-rooms': {
    'plan': [
      'What makes two floor cells belong to the same room? Name a small map that challenges your counting rule.',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the movement rules and preserves input.',
      'State time and storage costs; checks do not prove the approach or complexity.'
    ],
    'example': 'Scan every cell and start a traversal only at unseen floor. The traversal marks exactly that room, so each room contributes once. A queue or iterative stack works in O(rows × columns) time and storage. [".#","#."] contains two isolated dots. Starting at [0,0] cannot reach [1,1] by side moves; the scan later counts the second room. Result 2.'
  },
  'grid-open-neighbours': {
    'plan': [
      'Which row and column inequalities make a candidate safe to read? How will you preserve the requested order?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the movement rules and preserves input.',
      'State time and storage costs; checks do not prove the approach or complexity.'
    ],
    'example': 'Check the origin before considering its four offsets. Each candidate is read only inside both dimensions, and appending in offset order gives the required order. O(1) time and storage. At [0,1] in ["...",".#.","..."]: up is outside, right [0,2] is open, down [1,1] is a wall, left [0,0] is open. Return [[0,2],[0,0]].'
  },
'quiet-sensor-span': {
  'plan': [
    'Which spans qualify? What boundary would expose treating equality incorrectly?',
    'Name a boundary before coding.'
  ],
  'explanation': [
    'Explain why your result satisfies the ordering, equality, and empty-input rules.',
    'State time and storage costs and explain input preservation. Checks do not prove the technique or independent understanding.'
  ],
  'example': 'A sliding span tracks exactly its noisy readings. Shrinking until the count is allowed restores validity; the longest valid span ending at each right position includes every possible optimum. O(n) time and O(1) extra storage. For [5,5,6,5], threshold 5 and allowance 0, lengths grow to 2, then the 6 forces the left boundary past it; the final length is 1. Return 2.'
},
'shared-seat-occurrences': {
  'plan': [
    'How will you account for repeated seats and an exhausted list?',
    'Name a boundary before coding.'
  ],
  'explanation': [
    'Explain why your result satisfies the ordering, equality, and empty-input rules.',
    'State time and storage costs and explain input preservation. Checks do not prove the technique or independent understanding.'
  ],
  'example': 'Two positions delimit unmatched suffixes. Discarding the smaller value is safe because the other suffix starts larger; equality consumes one occurrence from each. O(n+m) time with output storage only. Left [0,0,1], right [0]: emit 0 once and exhaust right. The extra left 0 has no matching occurrence.'
},
'dispatch-priority-order': {
  'plan': [
    'What decides between two requests? Which ties must preserve order?',
    'Name a boundary before coding.'
  ],
  'explanation': [
    'Explain why your result satisfies the ordering, equality, and empty-input rules.',
    'State time and storage costs and explain input preservation. Checks do not prove the technique or independent understanding.'
  ],
  'example': 'Lexicographic comparison applies urgency before deadline and original position. Including position makes full ties explicit and preserves duplicate identities. Copying protects records and array. O(n log n) comparison-sort work and O(n) storage. A(1,0), B(2,9), C(2,3): urgency puts B and C before A; deadline puts C before B. Return C,B,A.'
},
'first-affordable-edition': {
  'plan': [
    'What distinguishes the first qualifying edition from any qualifying edition?',
    'Name a boundary before coding.'
  ],
  'explanation': [
    'Explain why your result satisfies the ordering, equality, and empty-input rules.',
    'State time and storage costs and explain input preservation. Checks do not prove the technique or independent understanding.'
  ],
  'example': 'Affordability changes only from false to true as costs decrease. A lower-bound search preserves the first true position in its candidate interval; if it ends at length, none qualifies. O(log n) time and O(1) storage. For [9,7,7,3], budget 7: index 2 qualifies but index 1 also qualifies. The boundary is 1, not an arbitrary matching 7.'
},
'nested-parcel-load': {
  'plan': [
    'How is depth defined at the root, and what do empty arrays contribute?',
    'Name a boundary before coding.'
  ],
  'explanation': [
    'Explain why your result satisfies the ordering, equality, and empty-input rules.',
    'State time and storage costs and explain input preservation. Checks do not prove the technique or independent understanding.'
  ],
  'example': 'A call receives the correct depth for its parcel. Numbers contribute weight times depth; arrays sum calls at depth+1. Structural induction gives the total without changing input. O(nodes) time and O(depth) call storage. For [[1],2], the root array has depth 1. Inner array has depth 2, so 1 contributes 3; sibling 2 has depth 2 and contributes 4. Total 7.'
},
'terminal-folder-paths': {
  'plan': [
    'When does a path end, and how will sibling paths stay separate?',
    'Name a boundary before coding.'
  ],
  'explanation': [
    'Explain why your result satisfies the ordering, equality, and empty-input rules.',
    'State time and storage costs and explain input preservation. Checks do not prove the technique or independent understanding.'
  ],
  'example': 'Depth-first traversal in supplied child order emits terminal paths in the required order. Each branch extends its own prefix, preventing sibling contamination. Time and output storage scale with total returned path length; traversal stack depth is bounded by tree depth. Root r has terminal b and branch a→z. Emit [r,b], then [r,a,z]. No [r,a] is emitted because a has a child.'
},
'broadcast-unreached-stations': {
  'plan': [
    'What counts as received, and what should happen when a broadcast returns to a station?',
    'Name a boundary before coding.'
  ],
  'explanation': [
    'Explain why your result satisfies the ordering, equality, and empty-input rules.',
    'State time and storage costs and explain input preservation. Checks do not prove the technique or independent understanding.'
  ],
  'example': 'The reached set begins with every seed and is closed under outgoing links. Exploring each newly reached station once terminates despite cycles and reaches exactly the stations with a seed-to-station path. Enumerating all indices gives sorted missing stations. O(V+E) time and O(V) state. For links [[],[0]], seed 0 reaches only 0. Station 1 can send to 0 but cannot receive from it, so return [1].'
},

'parcel-loading-turns': {'plan': ['How will you distinguish carts with equal counts? Which event ends the counting?', 'Name a boundary before coding.'], 'explanation': ['Explain the FIFO ordering and why your stopping or timing rule satisfies the contract.', 'State time and storage costs and explain input preservation; checks do not establish your approach.'], 'example': 'Each waiting cart retains its original identity. Removing one parcel and returning unfinished carts to the back preserves the service order. Stop only when the target reaches zero; other carts can remain. [2,1,3], target 0: turn 1 leaves cart 0 with 1; turn 2 finishes cart 1; turn 3 leaves cart 2 with 2; turn 4 finishes cart 0. Return 4 even though cart 2 is unfinished.'},
'ticket-service-times': {'plan': ['What determines a start when the desk is busy? What changes when no ticket is waiting?', 'Name a boundary before coding.'], 'explanation': ['Explain the FIFO ordering and why your stopping or timing rule satisfies the contract.', 'State time and storage costs and explain input preservation; checks do not establish your approach.'], 'example': 'The desk finish time is the earliest availability for the next ticket. Taking the later of that time and arrival respects both constraints while preserving FIFO order, including ties. For arrivals 0,0,10 and durations 2,1,1, starts are 0,2,10 and finishes 2,3,11. The third ticket waits for its arrival, not an invented continuous backlog.'},
  'sorted-offset-squares': {
    'plan': [
        'How do negative offsets affect output order? Which boundary will you check before coding?',
        'Name a boundary before coding.'
    ],
    'explanation': [
        'Explain why every occurrence is represented and why input stays unchanged.',
        'Explain your pointer roles and time and storage costs. Passing checks does not prove two pointers or linear time.'
    ],
    'example': 'The largest remaining square must come from an endpoint: every interior magnitude is bounded by one of the endpoint magnitudes. Compare their squares, place the larger at the last unfilled output position, and discard only that occurrence. The unfilled prefix then contains exactly the remaining squares. This takes O(n) time and O(n) output storage. For [-3,-1,3], equal endpoint squares are both 9. Write the left 9 at position 2, then the right 9 at position 1, then 1 at position 0. The result is [1,9,9]; equality never removes an occurrence.'
},
  'reading-run-summary': {
    'plan': [
        'What information must each record retain? What should happen for one reading or for all equal readings?',
        'Name a boundary before coding.'
    ],
    'explanation': [
        'Explain why every occurrence is represented and why input stays unchanged.',
        'Explain your pointer roles and time and storage costs. Passing checks does not prove two pointers or linear time.'
    ],
    'example': 'A read position visits each input once, while a write position identifies the last output record. After each visit, records describe exactly the visited prefix. Equal readings extend its final count; a different reading begins a fresh record. Sortedness guarantees all occurrences of one value are consecutive. Work is O(n), with O(d) output storage for d distinct values. For [-1,2,2], read index 0 writes {value:-1,count:1} at output index 0. Index 1 writes {value:2,count:1} at output index 1. Index 2 extends that record to count 2. No final run remains to flush.'
},


  'algo-insertion-sort': {
    'plan': ['What stays ordered after each insertion? How will you keep duplicates and preserve the caller array?', 'Name a boundary case before coding.'],
    'explanation': [
      'Trace a boundary case and explain why the input stays unchanged.',
      'Review the requested approach and time/space costs yourself; behavior checks do not prove the approach.'
    ],
    'example': 'Before each insertion, the prefix is sorted and contains all earlier items. Shifting only larger values makes room without losing duplicates. A copy preserves the input. For [3, 1, 3], save 1, shift the first 3 right, and insert 1 at index 0: [1, 3, 3]. The next 3 needs no shift because equality is allowed.'
  },
  'algo-merge-sorted': {
    'plan': ['Why is the next unused value enough to compare? What happens when one list runs out?', 'Name a boundary case before coding.'],
    'explanation': [
      'Trace a boundary case and explain why the input stays unchanged.',
      'Review the requested approach and time/space costs yourself; behavior checks do not prove the approach.'
    ],
    'example': 'The smaller unused head is no greater than any remaining value in either list. Appending it preserves output order. Advancing only its cursor uses each position once. For [1, 3] and [2, 3, 4], append 1, then 2, then the left 3 on equality. The left list is empty, so append the remaining right 3 and 4.'
  },
  'algo-recursive-sum': {
    'plan': ['What ends a call? How do a number and a nested array contribute differently?', 'Name a boundary case before coding.'],
    'explanation': [
      'Trace a boundary case and explain why the input stays unchanged.',
      'Review the requested approach and time/space costs yourself; behavior checks do not prove the approach.'
    ],
    'example': 'An empty call returns 0. Each number contributes itself; each array contributes its recursively computed sum. Calls descend a finite acyclic structure, so every number is included once and calls terminate. For [1, [2, [], [-3]], 4], [] returns 0 and [-3] returns -3. The middle list returns 2 + 0 - 3 = -1; the outer list returns 1 - 1 + 4 = 4.'
  },
  'algo-tree-depth': {
    'plan': ['What does an empty tree return? How do child depths determine the parent depth?', 'Name a boundary case before coding.'],
    'explanation': [
      'Trace a boundary case and explain why the input stays unchanged.',
      'Review the requested approach and time/space costs yourself; behavior checks do not prove the approach.'
    ],
    'example': 'A leaf contributes one node. Each parent contributes one plus its largest child depth because a route follows a single child, not all siblings. Null has no nodes and returns zero. For a root with a leaf child and another child containing a leaf, child depths are 1 and 2. The root returns 1 + max(1, 2) = 3, even if its value is zero.'
  },
  'algo-graph-reachable': {
    'plan': ['What makes a node valid? How will you avoid repeating work around a cycle and handle start equal to target?', 'Name a boundary case before coding.'],
    'explanation': [
      'Trace a boundary case and explain why the input stays unchanged.',
      'Review the requested approach and time/space costs yourself; behavior checks do not prove the approach.'
    ],
    'example': 'Validate endpoints before accepting equality. Every queued node is reachable from start. Marking nodes when queued prevents repeated discovery; exploring all reachable nodes finds target or exhausts the queue. For [[1], [0], []], start 0, target 2: queue [0], discover 1, then explore 1. Its neighbor 0 is already seen. The queue ends without 2, so return false.'
  },
  'ds-array-operations': {
    'plan': ['Which array can you change safely? What is the last index after appending?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'Copying preserves the caller’s array; appending creates a last item even for empty input. [] becomes [0] when extra is 0. Length is 1, so index 0 returns 0.'
  },
  'ds-set-operations': {
    'plan': ['What happens when extra equals removed? What does deleting an absent value do?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'Adding before deleting makes removal win when the two supplied values match. A new set leaves the input unchanged. For [], extra 5, removed 5: {} → {5} → {}; size is 0.'
  },
  'ds-map-operations': {
    'plan': ['Which write wins for a repeated key? How will you preserve a stored zero?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'Sequential writes leave the latest value for each key. Checking absence separately preserves zero. [(a, 2)] followed by set(a, 0) stores 0; querying b returns null.'
  },
  'ds-stack-operations': {
    'plan': ['Which value leaves first? How do you distinguish an empty stack from a top value of zero?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'The push and pop cancel each other; the remaining top is the original last item, or absent for empty input. [0] → [0, 3] → [0]; peeking returns 0, not null.'
  },
  'ds-queue-operations': {
    'plan': ['Trace empty and one-item queues. Which end is used for adding and removing?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'Appending before removing lets an empty input process the new item immediately. The remaining front is the next oldest item. [4] → [4, 9] → [9]; peek returns 9. [] → [9] → [] returns null.'
  },
  'algo-sorted-pair': {
    'plan': ['Why does sorted order justify each move? Why must the two positions stay different?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'If the smallest plus largest candidate is too small, that smallest value cannot pair with any remaining value. The symmetric argument removes the largest when the sum is too large. [1, 2, 4], target 8: 1+4=5 moves left; 2+4=6 moves left again; pointers meet, so false. The same 4 cannot be reused.'
  },
  'algo-window-sum': {
    'plan': ['What does your running sum represent? How will initialization handle all-negative inputs?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'Subtracting the outgoing value and adding the incoming value preserves the sum of exactly k consecutive items. Comparing each complete window finds the maximum. [-5, -2, -7], k=2: first sum -7; remove -5 and add -7 to get -9. Best stays -7.'
  },
  'algo-binary-search': {
    'plan': ['How does every iteration shrink the interval? What represents an exhausted interval?', 'Name an empty or missing-value case before coding.'],
    'explanation': ['Trace a boundary case and explain why the input stays unchanged.', 'Review your chosen operations and time/space costs yourself; output checks do not prove an implementation approach.'],
    'example': 'Sorted order proves that a target greater than the middle cannot occur to its left, and a smaller target cannot occur to its right. Excluding the middle guarantees progress. [1, 3, 5], target 4: middle index 1 has 3, so left becomes 2; index 2 has 5, so right becomes 1. The interval is empty: -1.'
  },
  'sort-score-records': {
    'plan': [
      'Which rule wins when scores differ? What should happen when both keys match?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Comparing score first and name only on a score tie implements precedence. Returning equality for both matching keys preserves order with a stable sort. Records z and a with score 0 and blank names remain z then a despite their IDs.'
  },
  'kth-smallest-copy': {
    'plan': [
      'How do duplicates affect rank? What should happen when the requested position is absent?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Sorting a copy puts every occurrence at its numeric rank; position k minus one is therefore the requested occurrence. The copy preserves caller order. [2,2,9] has ranks 1=2, 2=2, 3=9; rank 4 returns null.'
  },
  'count-unique-windows': {
    'plan': [
      'What do you need to remember about the labels currently inside a window? What must change when the window moves one position?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'A window is repeat-free exactly when no label has a count above one. Moving it one step removes one count and adds one. ["a","a","b","c","a"], k=3: [a,a,b] repeats; [a,b,c] and [b,c,a] are clean.'
  },
  'shortest-run-reaching-target': {
    'plan': [
      'When should a run grow, and when may it give up its oldest item? Why does positivity make giving up safe?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'With positive numbers, extending a run only raises its total and dropping the oldest item only lowers it. Grow until the total reaches target, then shrink while it still does. [2,3,1,2,4,3], target 7: the shortest qualifying run is [4,3], length 2.'
  },
  'first-insertion-point': {
    'plan': [
      'Which yes/no question about one value tells you which side of the answer it is on? What index is returned when the answer is "no" everywhere?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Because the array is ordered, "is this value at least target?" is false for a prefix and true for the rest, so the first true position is the first of any duplicates. [1, 3, 3, 7], target 3 gives index 1, and target 8 gives 4.'
  },
  'smallest-daily-capacity': {
    'plan': [
      'What are the smallest and largest capacities worth considering? If one capacity works, what does that tell you about larger ones?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'If a capacity ships everything in time, any larger capacity does too, so the smallest working capacity can be found by halving the range from the heaviest package to the total weight. [1, 2, 3, 4, 5] over 2 days: capacity 8 needs 3 days and 9 needs 2, so the answer is 9.'
  },
  'flatten-nested-numbers': {
    'plan': [
      'What is the output order across nested boundaries? What contribution does an empty list make?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Visiting children in their stored order and appending only numbers preserves the full left-to-right sequence. Empty arrays append nothing. Work is O(e) for all entries, with output and nesting storage. [0,[-1,0]] appends 0, then -1, then 0; repeated values survive.'
  },
  'count-object-leaves': {
    'plan': [
      'Which supplied values count even when falsy? What does an empty nested object contribute?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Each property is either one primitive occurrence or a container whose contributions are combined. Null must be classified before other objects. Every property is visited once, O(p) time. {a:0,b:null,c:{}} contributes 1+1+0=2.'
  },
  'tree-depth-sum': {
    'plan': [
      'Which nodes qualify at depth zero? How do absent branches affect the total?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'A node contributes only at the requested depth. Combining all children at one less remaining depth includes each qualifying node once, O(n) time at worst with O(h) recursive depth. Root 9 with children 2 and -3 gives -1 at depth 1; depth 2 has no nodes and gives 0.'
  },
  'tree-value-path': {
    'plan': [
      'What should the route contain when root is target? How will absent targets differ from an empty route?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'A successful child route can be prefixed with the current value; failed children contribute no route. Uniqueness removes tie-breaking. Each node is inspected at most once; path copying can add O(nh) work. Searching 4 under root -1 explores 2→3 unsuccessfully, then returns [-1,4]; 2 and 3 never enter the successful route.'
  },
  'graph-shortest-hops': {
    'plan': [
      'What is being minimized? Which endpoint rules apply before considering a zero-hop route?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Breadth-first discovery processes nondecreasing hop counts, so a node’s first discovered distance is minimal. Marking on discovery avoids cycles. Time O(V+E), storage O(V). From 0 in [[1,3],[2],[3],[]], both 1 and 3 have distance 1; the longer 0→1→2→3 route cannot improve 3.'
  },
  'graph-connected-groups': {
    'plan': [
      'How are isolated nodes counted? When do two apparently separate routes belong to the same group?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Starting a traversal only from an unseen node counts one new component. Traversal marks exactly its connected group, preventing duplicate counts. Time O(V+E), storage O(V). [[0,1,1],[0,0],[2]] visits 0 and 1 together despite repeated edges, then counts isolated self-linked 2: total 2.'
  },
  'simplify-file-path': {
    'plan': [
      'Which segments are special? What happens when a parent segment appears with no remaining name?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'The saved names represent the normalized prefix. A name extends it; a parent removes its latest name; a current-directory or empty segment leaves it unchanged. O(c) time and storage for c characters. /a/b/../../c saves a,b, removes b, removes a, then saves c, returning /c.'
  },
}

// Post-attempt comparisons for the harder mixed applications.
Object.assign(dsaDepth, {
  'next-warmer-day': {
    'reasoning': 'Unresolved indices have non-increasing temperatures from bottom to top. A strictly warmer new reading resolves every popped day: no earlier intervening reading was warmer, or that day would already have been popped. Each index is pushed and popped once, so time is O(n) and storage O(n). Checks establish results and preserved input, not use of a stack.',
    'trace': 'For [30,30,29,31], days 0 and 1 stay unresolved on equality. Day 2 joins them. Day 3 resolves day 2 with wait 1, day 1 with wait 2, and day 0 with wait 3. Day 3 has no later warmer day: [3,2,1,0].',
    'alternative': 'Scanning every suffix is simple and correct, but costs O(n²) on equal or decreasing readings. A reverse monotonic scan can also find the next warmer index in O(n) with a different invariant.',
    'counterexample': 'Popping on greater-than-or-equal reports wait 1 for the first 30 in [30,30,29,31]; the correct wait is 3. Sorting readings destroys the original day distances.',
    'transfer': 'Self-reviewed: return the next day at least five degrees warmer. Decide whether the same unresolved ordering still supports safe pops; the original checks do not assess this changed threshold.',
    'traceSteps': {
      'input': 'temperatures = [30,30,29,31]',
      'code': ['function nextWarmerDay(temperatures: number[]): number[] {', '  const waits = Array<number>(temperatures.length).fill(0), pending: number[] = []', '  for (let day = 0; day < temperatures.length; day++) {', '    while (pending.length && temperatures[day] > temperatures[pending[pending.length - 1]]) {', '      const earlier = pending.pop()!; waits[earlier] = day - earlier', '    }', '    pending.push(day)', '  }', '  return waits', '}'],
      'steps': [{
          'line': 1,
          'vars': {
            'waits': '[0,0,0,0]',
          },
          'note': 'Initialize waits to zero and an empty unresolved stack.',
          'structure': {
            'kind': 'stack',
            'values': [],
          },
        }, {
          'line': 6,
          'vars': {
            'day': 0,
          },
          'note': 'Push day 0 with temperature 30.',
          'structure': {
            'kind': 'stack',
            'values': [0],
          },
        }, {
          'line': 6,
          'vars': {
            'day': 1,
          },
          'note': 'Equal 30 does not resolve day 0; push day 1.',
          'structure': {
            'kind': 'stack',
            'values': [0, 1],
          },
        }, {
          'line': 6,
          'vars': {
            'day': 2,
          },
          'note': '29 is lower; push day 2.',
          'structure': {
            'kind': 'stack',
            'values': [0, 1, 2],
          },
        }, {
          'line': 4,
          'vars': {
            'day': 3,
            'earlier': 2,
            'waits': '[0,0,1,0]',
          },
          'note': '31 resolves day 2 with a one-day wait.',
          'structure': {
            'kind': 'stack',
            'values': [0, 1],
          },
        }, {
          'line': 4,
          'vars': {
            'day': 3,
            'earlier': 1,
            'waits': '[0,2,1,0]',
          },
          'note': '31 resolves day 1 with a two-day wait.',
          'structure': {
            'kind': 'stack',
            'values': [0],
          },
        }, {
          'line': 4,
          'vars': {
            'day': 3,
            'earlier': 0,
            'waits': '[3,2,1,0]',
          },
          'note': '31 resolves day 0 with a three-day wait.',
          'structure': {
            'kind': 'stack',
            'values': [],
          },
        }, {
          'line': 6,
          'vars': {
            'day': 3,
          },
          'note': 'Push day 3; no later readings remain.',
          'structure': {
            'kind': 'stack',
            'values': [3],
          },
        }, {
          'line': 8,
          'vars': {
            'result': '[3,2,1,0]',
          },
          'note': 'Return waits; unresolved day 3 keeps zero.',
          'structure': {
            'kind': 'stack',
            'values': [3],
          },
        }],
    },
  },
  'top-k-frequent-tags': {
    'reasoning': 'The count map has one entry per exact tag. Every tag enters the bucket indexed by its count. Descending bucket traversal implements frequency precedence, and ASCII lexicographic sorting within a bucket implements ties before truncation. Work is O(n + u log u) in the worst case for n occurrences and u distinct tags (string comparisons cost up to 20 characters), storage O(n + u). Checks do not require buckets.',
    'trace': 'For [web,api,web,api,app], counts are web:2, api:2, app:1. Bucket 2 sorts to [api,web]; bucket 1 is [app]. With k=2, stop after api and web. First arrival does not win a tie.',
    'alternative': 'Sorting all distinct tags by descending count and ascending text is compact and suitable for a one-off request. A bounded heap reduces ranking work to O(u log k), but its eviction comparator must reverse both count and tie priority; sort the final k values for output.',
    'counterexample': 'Returning insertion order from the count map gives [web,api] for the traced input, violating the tie. Sorting only the already selected k tags can keep the wrong tied tag at the cutoff.',
    'transfer': 'Self-reviewed: tags may contain uppercase and accented letters, and comparison is locale-sensitive. Specify normalization and ordering before adapting the comparator; the original checks cover lowercase ASCII only.',
    'traceSteps': {
      'input': 'tags = [\'web\',\'api\',\'web\',\'api\',\'app\'], k = 2',
      'code': ['function topKFrequentTags(tags: string[], k: number): string[] {', '  const counts = new Map<string, number>()', '  for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)', '  const buckets: string[][] = Array.from({length: tags.length + 1}, () => [])', '  for (const [tag, count] of counts) buckets[count].push(tag)', '  const ordered: string[] = []', '  for (let count = tags.length; count > 0; count--) ordered.push(...buckets[count].sort())', '  return ordered.slice(0, k)', '}'],
      'steps': [{
          'line': 1,
          'vars': {
            'k': 2,
          },
          'note': 'Start with an empty count map.',
          'structure': {
            'kind': 'map',
            'entries': [],
          },
        }, {
          'line': 2,
          'vars': {
            'tag': 'web',
          },
          'note': 'Count the first web.',
          'structure': {
            'kind': 'map',
            'entries': [['web', 1]],
          },
        }, {
          'line': 2,
          'vars': {
            'tag': 'api',
          },
          'note': 'Count the first api.',
          'structure': {
            'kind': 'map',
            'entries': [['web', 1], ['api', 1]],
          },
        }, {
          'line': 2,
          'vars': {
            'tag': 'web',
          },
          'note': 'Increment web to two.',
          'structure': {
            'kind': 'map',
            'entries': [['web', 2], ['api', 1]],
          },
        }, {
          'line': 2,
          'vars': {
            'tag': 'api',
          },
          'note': 'Increment api to two.',
          'structure': {
            'kind': 'map',
            'entries': [['web', 2], ['api', 2]],
          },
        }, {
          'line': 2,
          'vars': {
            'tag': 'app',
          },
          'note': 'Count app once.',
          'structure': {
            'kind': 'map',
            'entries': [['web', 2], ['api', 2], ['app', 1]],
          },
        }, {
          'line': 4,
          'vars': {
            'k': 2,
          },
          'note': 'Group by count; keep all tied tags before choosing k.',
          'structure': {
            'kind': 'map',
            'entries': [['2', 'web, api'], ['1', 'app']],
          },
        }, {
          'line': 6,
          'vars': {
            'ordered': '["api","web","app"]',
          },
          'note': 'Visit count 2 before 1; sort tied tags as api then web.',
          'structure': {
            'kind': 'map',
            'entries': [['2', 'api, web'], ['1', 'app']],
          },
        }, {
          'line': 7,
          'vars': {
            'result': '["api","web"]',
          },
          'note': 'Take the first two ranked distinct tags.',
          'structure': {
            'kind': 'map',
            'entries': [['web', 2], ['api', 2], ['app', 1]],
          },
        }],
    },
  },
  'course-order': {
    'reasoning': 'Deduplicated edges contribute exactly once to indegree. A zero-indegree unfinished course has every prerequisite completed. Selecting the smallest eligible ID each time satisfies the deterministic rule, including newly eligible smaller IDs. Removing its outgoing edges preserves the invariant. If no eligible course remains before all finish, the remaining directed graph has a cycle. Scanning IDs each step costs O(V² + E), with O(V + E) storage.',
    'trace': 'For 4 courses and [[2,0],[2,1]], initial counts are [0,0,2,0]. Choose 0, then 1. Course 2 becomes eligible and must precede already-eligible 3. Return [0,1,2,3]. A cycle plus an isolated course still requires [] rather than a partial order.',
    'alternative': 'A min-heap of eligible courses improves selection to O(log V) per course, for O(E + V log V) total. DFS finishing order can find a valid order with cycle tracking, but does not directly guarantee smallest eligible selection at every step.',
    'counterexample': 'A FIFO ready list initialized to [0,1,3] returns [0,1,3,2] on the traced input, which is valid dependency-wise but violates the specified choice. Returning a partial order hides a disconnected cycle.',
    'transfer': 'Self-reviewed: courses now have durations and unlimited parallel workers. Decide how to compute earliest finish times and distinguish that result from a sequential order; original checks do not establish scheduling time.',
    'traceSteps': {
      'input': 'courseCount = 4, prerequisites = [[2,0],[2,1]]',
      'code': ['function courseOrder(courseCount: number, prerequisites: [number, number][]): number[] {', '  const edges = Array.from({length: courseCount}, () => new Set<number>()), degree = Array<number>(courseCount).fill(0)', '  for (const [course, pre] of prerequisites) if (!edges[pre].has(course)) { edges[pre].add(course); degree[course]++ }', '  const done = new Set<number>(), order: number[] = []', '  while (order.length < courseCount) {', '    let next = -1; for (let c = 0; c < courseCount; c++) if (!done.has(c) && degree[c] === 0) { next = c; break }', '    if (next === -1) return []', '    done.add(next); order.push(next)', '    for (const course of edges[next]) degree[course]--', '  }', '  return order', '}'],
      'steps': [{
          'line': 1,
          'vars': {
            'order': '[]',
          },
          'note': 'Initialize remaining prerequisite counts.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 0], ['1', 0], ['2', 0], ['3', 0]],
          },
        }, {
          'line': 2,
          'vars': {
            'course': 2,
            'pre': 0,
          },
          'note': 'Add requirement 0 before 2.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 0], ['1', 0], ['2', 1], ['3', 0]],
          },
        }, {
          'line': 2,
          'vars': {
            'course': 2,
            'pre': 1,
          },
          'note': 'Add requirement 1 before 2.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 0], ['1', 0], ['2', 2], ['3', 0]],
          },
        }, {
          'line': 8,
          'vars': {
            'next': 0,
            'order': '[0]',
          },
          'note': 'Choose 0; course 2 still needs 1.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 'done'], ['1', 0], ['2', 1], ['3', 0]],
          },
        }, {
          'line': 8,
          'vars': {
            'next': 1,
            'order': '[0,1]',
          },
          'note': 'Choose 1; course 2 becomes eligible.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 'done'], ['1', 'done'], ['2', 0], ['3', 0]],
          },
        }, {
          'line': 7,
          'vars': {
            'next': 2,
            'order': '[0,1,2]',
          },
          'note': 'Choose newly eligible 2 before 3.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 'done'], ['1', 'done'], ['2', 'done'], ['3', 0]],
          },
        }, {
          'line': 7,
          'vars': {
            'next': 3,
            'order': '[0,1,2,3]',
          },
          'note': 'Choose 3; every course is complete.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 'done'], ['1', 'done'], ['2', 'done'], ['3', 'done']],
          },
        }, {
          'line': 10,
          'vars': {
            'result': '[0,1,2,3]',
          },
          'note': 'Return the deterministic complete order.',
          'structure': {
            'kind': 'map',
            'entries': [['0', 'done'], ['1', 'done'], ['2', 'done'], ['3', 'done']],
          },
        }],
    },
  },
  'longest-shared-sequence': {
    'reasoning': 'Let dp[i][j] be the longest shared subsequence length of the first i and j characters. Empty prefixes contribute 0. Equal final characters can extend an optimal shorter-prefix sequence by one. If they differ, a common sequence cannot use both final positions together, so the optimum is the larger of dropping either endpoint. Dependencies are already filled row by row. Time O(mn), storage O(mn); passing checks does not prove use of DP.',
    'trace': 'For left=ab and right=ba, dp[1][1]=0 for a versus b; dp[1][2]=1 for matching a; dp[2][1]=1 for matching b; dp[2][2]=max(1,1)=1. Sharing two character counts does not mean both can be used in order.',
    'alternative': 'Memoized recursion over suffix indices has the same O(mn) state count and adds call-stack overhead. Rolling rows reduce storage to O(min(m,n)), but require preserving the previous diagonal before overwriting. Enumerating all subsequences is exponential.',
    'counterexample': 'Counting the minimum occurrences of each letter returns 2 for ab and ba; the answer is 1 because order matters. A longest-common-substring rule returns only 1 for abcde and ace, missing the gapped length 3.',
    'transfer': 'Self-reviewed: return an actual shared sequence and choose the lexicographically smallest among maximum-length answers. Decide how to reconstruct and break ties; the original checks assess only length.',
    'traceSteps': {
      'code': ['function longestSharedSequence(left: string, right: string): number {', '  const dp: number[][] = Array.from({length: left.length + 1}, () => Array<number>(right.length + 1).fill(0))', '  for (let i = 1; i <= left.length; i++) {', '    for (let j = 1; j <= right.length; j++) {', '      dp[i][j] = left[i - 1] === right[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])', '    }', '  }', '  return dp[left.length][right.length]', '}'],
      'input': 'left = \'ab\', right = \'ba\'',
      'steps': [{
          'line': 1,
          'vars': {
            'i': 0,
            'j': 0,
          },
          'note': 'Empty prefixes have zero shared length. Interior zero placeholders await computation.',
          'structure': {
            'kind': 'table',
            'name': 'Shared prefix lengths',
            'cells': [[0, 0, 0], [0, null, null], [0, null, null]],
            'rowLabels': ['empty', 'a', 'ab'],
            'colLabels': ['empty', 'b', 'ba'],
          },
        }, {
          'line': 4,
          'vars': {
            'i': 1,
            'j': 1,
            'value': 0,
          },
          'note': 'a differs from b; both shorter-prefix lengths are zero.',
          'structure': {
            'kind': 'table',
            'name': 'Shared prefix lengths',
            'cells': [[0, 0, 0], [0, 0, null], [0, null, null]],
            'rowLabels': ['empty', 'a', 'ab'],
            'colLabels': ['empty', 'b', 'ba'],
            'current': [1, 1],
            'reads': [[0, 1], [1, 0]],
          },
        }, {
          'line': 4,
          'vars': {
            'i': 1,
            'j': 2,
            'value': 1,
          },
          'note': 'a matches a; extend the diagonal zero to one.',
          'structure': {
            'kind': 'table',
            'name': 'Shared prefix lengths',
            'cells': [[0, 0, 0], [0, 0, 1], [0, null, null]],
            'rowLabels': ['empty', 'a', 'ab'],
            'colLabels': ['empty', 'b', 'ba'],
            'current': [1, 2],
            'reads': [[0, 1]],
          },
        }, {
          'line': 4,
          'vars': {
            'i': 2,
            'j': 1,
            'value': 1,
          },
          'note': 'b matches b; extend the diagonal zero to one.',
          'structure': {
            'kind': 'table',
            'name': 'Shared prefix lengths',
            'cells': [[0, 0, 0], [0, 0, 1], [0, 1, null]],
            'rowLabels': ['empty', 'a', 'ab'],
            'colLabels': ['empty', 'b', 'ba'],
            'current': [2, 1],
            'reads': [[1, 0]],
          },
        }, {
          'line': 4,
          'vars': {
            'i': 2,
            'j': 2,
            'value': 1,
          },
          'note': 'b differs from a; the larger shorter-prefix length is one.',
          'structure': {
            'kind': 'table',
            'name': 'Shared prefix lengths',
            'cells': [[0, 0, 0], [0, 0, 1], [0, 1, 1]],
            'rowLabels': ['empty', 'a', 'ab'],
            'colLabels': ['empty', 'b', 'ba'],
            'current': [2, 2],
            'reads': [[1, 2], [2, 1]],
          },
        }, {
          'line': 7,
          'vars': {
            'result': 1,
          },
          'note': 'Return the full-prefix length one; counts alone would incorrectly give two.',
          'structure': {
            'kind': 'table',
            'name': 'Shared prefix lengths',
            'cells': [[0, 0, 0], [0, 0, 1], [0, 1, 1]],
            'rowLabels': ['empty', 'a', 'ab'],
            'colLabels': ['empty', 'b', 'ba'],
            'current': [2, 2],
          },
        }],
    },
  },
})

Object.assign(dsaGuides, {
  'next-warmer-day': {
    'plan': ['Which later day qualifies first? Explain how equal readings and a final day affect your answer.', 'Name a boundary and a tempting approach that fails it.'],
    'explanation': ['Explain the invariant or subproblem that makes your answer correct.', 'State time and storage costs, the tie or equality rule, and how you preserve input. Checks assess behavior, not the chosen approach.'],
    'example': 'For [30,30,29,31], days 0 and 1 stay unresolved on equality. Day 2 joins them. Day 3 resolves day 2 with wait 1, day 1 with wait 2, and day 0 with wait 3. Day 3 has no later warmer day: [3,2,1,0]. Unresolved indices have non-increasing temperatures from bottom to top. A strictly warmer new reading resolves every popped day: no earlier intervening reading was warmer, or that day would already have been popped. Each index is pushed and popped once, so time is O(n) and storage O(n). Checks establish results and preserved input, not use of a stack.',
  },
  'top-k-frequent-tags': {
    'plan': ['How will you rank equal counts and choose exactly k distinct results without changing the input?', 'Name a boundary and a tempting approach that fails it.'],
    'explanation': ['Explain the invariant or subproblem that makes your answer correct.', 'State time and storage costs, the tie or equality rule, and how you preserve input. Checks assess behavior, not the chosen approach.'],
    'example': 'For [web,api,web,api,app], counts are web:2, api:2, app:1. Bucket 2 sorts to [api,web]; bucket 1 is [app]. With k=2, stop after api and web. First arrival does not win a tie. The count map has one entry per exact tag. Every tag enters the bucket indexed by its count. Descending bucket traversal implements frequency precedence, and ASCII lexicographic sorting within a bucket implements ties before truncation. Work is O(n + u log u) in the worst case for n occurrences and u distinct tags (string comparisons cost up to 20 characters), storage O(n + u). Checks do not require buckets.',
  },
  'course-order': {
    'plan': ['When is a course eligible, how do you choose among eligible courses, and how will you detect an impossible schedule?', 'Name a boundary and a tempting approach that fails it.'],
    'explanation': ['Explain the invariant or subproblem that makes your answer correct.', 'State time and storage costs, the tie or equality rule, and how you preserve input. Checks assess behavior, not the chosen approach.'],
    'example': 'For 4 courses and [[2,0],[2,1]], initial counts are [0,0,2,0]. Choose 0, then 1. Course 2 becomes eligible and must precede already-eligible 3. Return [0,1,2,3]. A cycle plus an isolated course still requires [] rather than a partial order. Deduplicated edges contribute exactly once to indegree. A zero-indegree unfinished course has every prerequisite completed. Selecting the smallest eligible ID each time satisfies the deterministic rule, including newly eligible smaller IDs. Removing its outgoing edges preserves the invariant. If no eligible course remains before all finish, the remaining directed graph has a cycle. Scanning IDs each step costs O(V² + E), with O(V + E) storage.',
  },
  'longest-shared-sequence': {
    'plan': ['What makes a shared sequence valid? Give an example where counting shared letters ignores their order.', 'Name a boundary and a tempting approach that fails it.'],
    'explanation': ['Explain the invariant or subproblem that makes your answer correct.', 'State time and storage costs, the tie or equality rule, and how you preserve input. Checks assess behavior, not the chosen approach.'],
    'example': 'For left=ab and right=ba, dp[1][1]=0 for a versus b; dp[1][2]=1 for matching a; dp[2][1]=1 for matching b; dp[2][2]=max(1,1)=1. Sharing two character counts does not mean both can be used in order. Let dp[i][j] be the longest shared subsequence length of the first i and j characters. Empty prefixes contribute 0. Equal final characters can extend an optimal shorter-prefix sequence by one. If they differ, a common sequence cannot use both final positions together, so the optimum is the larger of dropping either endpoint. Dependencies are already filled row by row. Time O(mn), storage O(mn); passing checks does not prove use of DP.',
  },
})

Object.assign(dsaGuides, {
  'puzzle-parse-part-one': {
    plan: ['State the current output rule and the shared input contract.', 'Name a negative, empty, or repeated-reading boundary before coding.'],
    explanation: [
      'Explain how parsing preserves tray boundaries and how the changed rule affects aggregation.',
      'State time and storage costs; passing checks does not prove parser reuse or independent understanding.'
    ],
    example: 'Parse each nonblank line independently so a tray never borrows another tray\'s strongest value. Numeric conversion makes negative values and multi-digit values comparable. After processing k trays, the running sum equals their maxima, including negative maxima. For "1 4 3\\n\\n-5 -2 -4\\n", parsing yields [[1,4,3],[-5,-2,-4]]. Peaks are 4 and -2. Their sum is 2.'
  }
})

Object.assign(dsaGuides, {
  'puzzle-adapt-part-two': {
    plan: ['State the current output rule and the shared input contract.', 'Name a negative, empty, or repeated-reading boundary before coding.'],
    explanation: [
      'Explain how parsing preserves tray boundaries and how the changed rule affects aggregation.',
      'State time and storage costs; passing checks does not prove parser reuse or independent understanding.'
    ],
    example: 'Parse each nonblank line independently so a tray never borrows another tray\'s strongest value. Numeric conversion makes negative values and multi-digit values comparable. After processing k trays, the running count includes exactly their readings meeting each local inclusive cutoff. Retaining all occurrences preserves duplicates. For "1 4 3\\n\\n-5 -2 -4\\n", parsing yields [[1,4,3],[-5,-2,-4]]. Peaks are 4 and -2. Cutoffs are 2 and -4. Two readings qualify on each tray, so return 4.'
  }
})
