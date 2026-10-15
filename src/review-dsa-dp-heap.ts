import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

const garage = (cells: (number | null)[][], current?: [number, number], reads?: [number, number][]) => ({
  kind: 'table' as const,
  name: 'ways',
  cells,
  rowLabels: ['row 0', 'row 1', 'row 2'],
  colLabels: ['col 0', 'col 1', 'col 2'],
  ...(current ? { current } : {}),
  ...(reads ? { reads } : {}),
})
const stalls = (best: (number | null)[], current?: number, reads: number[] = []) => ({
  kind: 'table' as const,
  name: 'best',
  cells: [best],
  colLabels: ['stall 0', 'stall 1', 'stall 2', 'stall 3', 'stall 4'],
  ...(current === undefined ? {} : { current: [0, current] as [number, number] }),
  ...(reads.length ? { reads: reads.map(column => [0, column] as [number, number]) } : {}),
})
const edits = (cells: (number | null)[][], current?: [number, number], reads?: [number, number][]) => ({
  kind: 'table' as const,
  name: 'd',
  cells,
  rowLabels: ['i = 0', 'i = 1', 'i = 2'],
  colLabels: ['j = 0', 'j = 1', 'j = 2'],
  ...(current ? { current } : {}),
  ...(reads ? { reads } : {}),
})
const _ = null

export const dsaDpHeapDepth: Record<string, RepDepth> = {
  'dp-garage-paths': {
    reasoning:
      'Every route into an open cell arrives from the cell above or the cell to its left, and those two groups of routes never overlap. So a cell’s count is the sum of its two neighbours’ counts, and a blocked cell is reached by no routes. Filling the table row by row, left to right, guarantees both neighbours are final before a cell needs them, and each cell is computed once.',
    trace:
      'In a 3 × 3 floor with a car in the center, the top row and left column each hold 1. The center is 0. Cell (1, 2) is 1 + 0 = 1, cell (2, 1) is 0 + 1 = 1, and the finish is 1 + 1 = 2.',
    traceSteps: {
      code: [
        'function garageRoutes(grid: number[][]): number {',
        '  const rows = grid.length, cols = grid[0].length',
        '  const ways: number[][] = grid.map(row => row.map(() => 0))',
        '  for (let r = 0; r < rows; r++) {',
        '    for (let c = 0; c < cols; c++) {',
        '      if (grid[r][c] === 1) ways[r][c] = 0',
        '      else if (r === 0 && c === 0) ways[r][c] = 1',
        '      else ways[r][c] = (r > 0 ? ways[r - 1][c] : 0) + (c > 0 ? ways[r][c - 1] : 0)',
        '    }',
        '  }',
        '  return ways[rows - 1][cols - 1]',
        '}',
      ],
      input: 'grid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]',
      steps: [
        {
          line: 2,
          vars: { rows: 3, cols: 3 },
          structure: garage([
            [_, _, _],
            [_, _, _],
            [_, _, _],
          ]),
          note: 'ways[r][c] will hold how many routes reach that bay. The car sits in the center bay, row 1 column 1.',
        },
        {
          line: 6,
          vars: { r: 0, c: 0, 'ways[0][0]': 1 },
          structure: garage(
            [
              [1, _, _],
              [_, _, _],
              [_, _, _],
            ],
            [0, 0],
          ),
          note: 'The start is open, so exactly one route reaches it: the empty route.',
        },
        {
          line: 7,
          vars: { r: 0, c: 2, 'ways[0][2]': 1 },
          structure: garage(
            [
              [1, 1, 1],
              [_, _, _],
              [_, _, _],
            ],
            [0, 2],
            [[0, 1]],
          ),
          note: 'In the top row nothing is above, so each bay copies its left neighbour: one route, all moves right.',
        },
        {
          line: 7,
          vars: { r: 1, c: 0, 'ways[1][0]': 1 },
          structure: garage(
            [
              [1, 1, 1],
              [1, _, _],
              [_, _, _],
            ],
            [1, 0],
            [[0, 0]],
          ),
          note: 'The left column has nothing to its left, so it copies the bay above.',
        },
        {
          line: 5,
          vars: { r: 1, c: 1, 'ways[1][1]': 0 },
          structure: garage(
            [
              [1, 1, 1],
              [1, 0, _],
              [_, _, _],
            ],
            [1, 1],
          ),
          note: 'The center holds a car. No route may pass through it, so it contributes 0 to every later bay.',
        },
        {
          line: 7,
          vars: { r: 1, c: 2, 'ways[1][2]': 1 },
          structure: garage(
            [
              [1, 1, 1],
              [1, 0, 1],
              [_, _, _],
            ],
            [1, 2],
            [
              [0, 2],
              [1, 1],
            ],
          ),
          note: 'From above: 1 route. From the left: 0, because that bay is blocked. 1 + 0 = 1.',
        },
        {
          line: 7,
          vars: { r: 2, c: 0, 'ways[2][0]': 1 },
          structure: garage(
            [
              [1, 1, 1],
              [1, 0, 1],
              [1, _, _],
            ],
            [2, 0],
            [[1, 0]],
          ),
          note: 'The left column again copies the bay above.',
        },
        {
          line: 7,
          vars: { r: 2, c: 1, 'ways[2][1]': 1 },
          structure: garage(
            [
              [1, 1, 1],
              [1, 0, 1],
              [1, 1, _],
            ],
            [2, 1],
            [
              [1, 1],
              [2, 0],
            ],
          ),
          note: 'From above: 0, the blocked center. From the left: 1. So 0 + 1 = 1.',
        },
        {
          line: 7,
          vars: { r: 2, c: 2, 'ways[2][2]': 2 },
          structure: garage(
            [
              [1, 1, 1],
              [1, 0, 1],
              [1, 1, 2],
            ],
            [2, 2],
            [
              [1, 2],
              [2, 1],
            ],
          ),
          note: 'The finish adds the route around the right side (1) and the route along the bottom (1): 2 routes.',
        },
        {
          line: 10,
          vars: { result: 2 },
          structure: garage([
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 2],
          ]),
          note: 'Nine bays, each filled once from at most two earlier answers. Listing every route would repeat shared prefixes.',
        },
      ],
    },
    alternative:
      'A recursive count from the finish, asking how many routes reach the bay above and the bay to the left, is the same idea read backwards. Without memoization it recomputes shared bays and grows exponentially; with a memo it matches the table. Keeping only one row of counts reduces storage from O(rows × cols) to O(cols).',
    counterexample:
      'Starting the table at 0 everywhere and never seeding the start gives 0 for every floor. Treating an off-grid neighbour as 1 instead of 0 overcounts the top row. Returning 1 for a blocked start, because the grid is 1 × 1, ignores the car parked there.',
    transfer:
      'Allow diagonal moves down and to the right as well, or give each bay a toll and ask for the cheapest route. Decide which neighbours feed a cell and whether you add or take the minimum. This changed contract is self-reviewed.',
  },
  'dp-stall-revenue': {
    reasoning:
      'For the stalls up to position i, the best total either skips stall i, which leaves the best total up to i - 1, or takes it, which adds its revenue to the best total up to i - 2 because stall i - 1 must stay empty. Every valid choice of stalls falls into exactly one of those cases, so the larger of the two is the best total for that prefix.',
    trace:
      'For [2, 7, 9, 3, 1] the best totals are 2, 7, 11, 11, 12. At stall 2, taking 9 + 2 = 11 beats skipping (7). At stall 4, taking 1 + 11 = 12 beats skipping (11).',
    traceSteps: {
      code: [
        'function bestRevenue(revenues: number[]): number {',
        '  const best: number[] = []',
        '  for (let i = 0; i < revenues.length; i++) {',
        '    const skip = i > 0 ? best[i - 1] : 0',
        '    const take = revenues[i] + (i > 1 ? best[i - 2] : 0)',
        '    best[i] = Math.max(skip, take)',
        '  }',
        '  return revenues.length ? best[revenues.length - 1] : 0',
        '}',
      ],
      input: 'revenues = [2, 7, 9, 3, 1]',
      steps: [
        {
          line: 1,
          vars: { length: 5 },
          structure: stalls([_, _, _, _, _]),
          note: 'best[i] will hold the most revenue from stalls 0 to i with no two neighbours rented. The revenues are 2, 7, 9, 3, and 1.',
        },
        {
          line: 5,
          vars: { i: 0, 'revenues[i]': 2, skip: 0, take: 2, 'best[0]': 2 },
          structure: stalls([2, _, _, _, _], 0),
          note: 'With only one stall, renting it is better than renting nothing.',
        },
        {
          line: 5,
          vars: { i: 1, 'revenues[i]': 7, skip: 2, take: 7, 'best[1]': 7 },
          structure: stalls([2, 7, _, _, _], 1, [0]),
          note: 'Taking stall 1 rules out stall 0, so it earns 7 alone. That beats skipping it and keeping 2.',
        },
        {
          line: 5,
          vars: { i: 2, 'revenues[i]': 9, skip: 7, take: 11, 'best[2]': 11 },
          structure: stalls([2, 7, 11, _, _], 2, [1, 0]),
          note: 'Taking 9 adds it to the best total two stalls back (2): 11. Skipping keeps 7. Take it.',
        },
        {
          line: 5,
          vars: { i: 3, 'revenues[i]': 3, skip: 11, take: 10, 'best[3]': 11 },
          structure: stalls([2, 7, 11, 11, _], 3, [2, 1]),
          note: 'Taking 3 gives 3 + 7 = 10, less than skipping (11). The best total does not have to use the current stall.',
        },
        {
          line: 5,
          vars: { i: 4, 'revenues[i]': 1, skip: 11, take: 12, 'best[4]': 12 },
          structure: stalls([2, 7, 11, 11, 12], 4, [3, 2]),
          note: 'Taking 1 adds it to best[2] = 11, giving 12. That beats skipping (11).',
        },
        {
          line: 7,
          vars: { result: 12 },
          structure: stalls([2, 7, 11, 11, 12]),
          note: 'Stalls 0, 2, and 4 earn 2 + 9 + 1 = 12. Renting the highest stall first happens to work here, but fails on [2, 3, 2].',
        },
      ],
    },
    alternative:
      'Only the two previous totals are ever read, so two variables replace the array and storage drops to O(1). Trying every subset of stalls is correct but costs O(2^n). Comparing the sum of even positions with the sum of odd positions fails for [10, 1, 1, 10], where the best choice skips two stalls in a row.',
    counterexample:
      'Renting the highest remaining stall and blocking its neighbours returns 3 for [2, 3, 2] instead of 4. Taking the larger of the even-position and odd-position sums returns 11 instead of 20 for [10, 1, 1, 10].',
    transfer:
      'Arrange the stalls in a circle, so the first and last are neighbours. Decide how to split the problem so the first and last are never both chosen. This changed contract is self-reviewed.',
  },
  'dp-tag-edits': {
    reasoning:
      'd[i][j] is the fewest edits that turn the first i characters of from into the first j characters of to. If the last characters already match, no edit is needed for them, so the answer equals d[i - 1][j - 1]. Otherwise the last edit was a replacement, a deletion, or an insertion, which leaves the subproblem d[i - 1][j - 1], d[i - 1][j], or d[i][j - 1] respectively; the best is one more than the smallest of those.',
    trace:
      'For ab and ba: the first row and column are 0, 1, 2 because turning a prefix into an empty string, or the reverse, takes one edit per character. d[1][1] compares a with b: 1. d[1][2] matches a with a: 1. d[2][1] matches b with b: 1. d[2][2] compares b with a: 1 + min(1, 1, 1) = 2.',
    traceSteps: {
      code: [
        'function tagEdits(from: string, to: string): number {',
        '  const d: number[][] = []',
        '  for (let i = 0; i <= from.length; i++) {',
        '    d[i] = [i]',
        '    for (let j = 1; j <= to.length; j++) {',
        '      if (i === 0) d[i][j] = j',
        '      else if (from[i - 1] === to[j - 1]) d[i][j] = d[i - 1][j - 1]',
        '      else d[i][j] = 1 + Math.min(d[i - 1][j - 1], d[i - 1][j], d[i][j - 1])',
        '    }',
        '  }',
        '  return d[from.length][to.length]',
        '}',
      ],
      input: "from = 'ab', to = 'ba'",
      steps: [
        {
          line: 1,
          vars: { from: 'ab', to: 'ba' },
          structure: edits([
            [_, _, _],
            [_, _, _],
            [_, _, _],
          ]),
          note: 'Row i is the first i characters of from: "", "a", "ab". Column j is the first j characters of to: "", "b", "ba". d[i][j] is the fewest edits between those two prefixes.',
        },
        {
          line: 5,
          vars: { i: 0, 'd[0]': '[0,1,2]' },
          structure: edits(
            [
              [0, 1, 2],
              [_, _, _],
              [_, _, _],
            ],
            [0, 2],
            [[0, 1]],
          ),
          note: 'From an empty prefix, reaching j characters takes j insertions.',
        },
        {
          line: 3,
          vars: { i: 1, 'd[1][0]': 1 },
          structure: edits(
            [
              [0, 1, 2],
              [1, _, _],
              [_, _, _],
            ],
            [1, 0],
          ),
          note: 'Turning "a" into an empty prefix takes one deletion.',
        },
        {
          line: 7,
          vars: { i: 1, j: 1, 'd[1][1]': 1 },
          structure: edits(
            [
              [0, 1, 2],
              [1, 1, _],
              [_, _, _],
            ],
            [1, 1],
            [
              [0, 0],
              [0, 1],
              [1, 0],
            ],
          ),
          note: '"a" against "b": the last characters differ, so one edit plus the best of replace (0), delete (1), or insert (1): 1.',
        },
        {
          line: 6,
          vars: { i: 1, j: 2, 'd[1][2]': 1 },
          structure: edits(
            [
              [0, 1, 2],
              [1, 1, 1],
              [_, _, _],
            ],
            [1, 2],
            [[0, 1]],
          ),
          note: '"a" against "ba": both end in a, so no edit is needed for them. The answer is "" against "b": 1.',
        },
        {
          line: 3,
          vars: { i: 2, 'd[2][0]': 2 },
          structure: edits(
            [
              [0, 1, 2],
              [1, 1, 1],
              [2, _, _],
            ],
            [2, 0],
          ),
          note: 'Turning "ab" into an empty prefix takes two deletions.',
        },
        {
          line: 6,
          vars: { i: 2, j: 1, 'd[2][1]': 1 },
          structure: edits(
            [
              [0, 1, 2],
              [1, 1, 1],
              [2, 1, _],
            ],
            [2, 1],
            [[1, 0]],
          ),
          note: '"ab" against "b": both end in b, so the answer is "a" against "": 1.',
        },
        {
          line: 7,
          vars: { i: 2, j: 2, 'd[2][2]': 2 },
          structure: edits(
            [
              [0, 1, 2],
              [1, 1, 1],
              [2, 1, 2],
            ],
            [2, 2],
            [
              [1, 1],
              [1, 2],
              [2, 1],
            ],
          ),
          note: '"ab" against "ba": b and a differ. All three neighbours are 1, so this cell is 1 + 1 = 2.',
        },
        {
          line: 10,
          vars: { result: 2 },
          structure: edits([
            [0, 1, 2],
            [1, 1, 1],
            [2, 1, 2],
          ]),
          note: 'Two edits: delete the leading a and insert an a at the end, or replace both characters.',
        },
      ],
    },
    alternative:
      'A recursive version that asks the same three questions is correct but repeats subproblems exponentially; a memo keyed by i and j makes it O(n × m) like the table. Since each row reads only the row above, two rows are enough, cutting storage to O(m). Counting characters that differ position by position ignores insertions and deletions entirely.',
    counterexample:
      'Comparing positions one to one gives 6 for bug-fix and bugfix, because every character after the hyphen is shifted. Counting the characters of one tag that are missing from the other gives 0 for ab and ba. Lowercasing both tags first returns 0 for Beta and beta, but case counts here.',
    transfer:
      'Allow swapping two adjacent characters as a single edit, so ab and ba are one edit apart. Decide which extra earlier cell the swap reads and when it applies. This changed contract is self-reviewed.',
  },
  'heap-merge-log-streams': {
    reasoning:
      'Each stream is already in order, so the next entry of the timeline is always the first unread entry of some stream. Taking the smallest of those candidates, with ties going to the earlier stream, and then advancing only that stream keeps the timeline ordered and stable. A min-priority queue holds one candidate per stream, so each step costs O(log k) for k streams.',
    trace:
      'For x [10], y [1, 2, 3, 11], z [0, 10, 12]: the queue starts with 10 (x), 1 (y), and 0 (z). Take 0 from z, then 1, 2, 3 from y. At 10 both x and z have a candidate, and x comes first because it appears earlier in streams. Then 11 from y and 12 from z.',
    alternative:
      'Flattening every entry with its stream position and sorting by time, then position, is shorter and also correct, at O(n log n) for n timestamps. Comparing the front of every stream at each step is O(n × k). The priority queue costs O(n log k) and only needs one candidate per stream in memory, which matters when streams are long or arrive incrementally.',
    counterexample:
      'Sorting with a comparator that only compares at lets ties come out in any order the sort chooses, and breaking ties by name puts alpha before zeta. Calling streams[i].times.shift() to advance changes the caller’s arrays.',
    transfer:
      'Return only the first 100 entries of the timeline, or merge streams that arrive one entry at a time. Decide what the queue must hold and when you can stop. This changed contract is self-reviewed.',
  },
  'heap-rooms-needed': {
    reasoning:
      'Processing meetings in start order, the only room worth checking is the one that frees up soonest: if even that room is still busy, every room is busy. Reusing that room when its end is at or before the new start, and opening a room otherwise, never opens a room that could have been avoided. A min-priority queue of end times reads and replaces that earliest end in O(log k).',
    trace:
      'For [0, 30], [5, 10], [10, 12], [15, 20]: open a room ending at 30. At 5 the earliest end is 30, so open a second room. At 10 the earliest end is 10, so reuse it and the ends become 12 and 30. At 15 the earliest end is 12, so reuse it again. Two rooms were opened.',
    traceSteps: {
      code: [
        'function roomsNeeded(meetings: [number, number][]): number {',
        '  const byStart = [...meetings].sort((a, b) => a[0] - b[0])',
        '  const endings: number[] = []',
        '  let most = 0',
        '  for (const [start, end] of byStart) {',
        '    if (endings.length > 0 && endings[0] <= start) endings.shift()',
        '    let i = 0',
        '    while (i < endings.length && endings[i] <= end) i++',
        '    endings.splice(i, 0, end)',
        '    most = Math.max(most, endings.length)',
        '  }',
        '  return most',
        '}',
      ],
      input: 'meetings = [[0, 30], [15, 20], [5, 10], [10, 12]]',
      steps: [
        {
          line: 1,
          vars: { byStart: '[[0,30],[5,10],[10,12],[15,20]]' },
          structure: { kind: 'array', values: [] },
          note: 'Sort a copy by start time. endings lists the end time of each room in use, earliest first, like a min-priority queue.',
        },
        {
          line: 8,
          vars: { start: 0, end: 30, most: 1 },
          structure: { kind: 'array', values: [30], pointers: { earliest: 0 } },
          note: 'No room exists yet, so open one. It is busy until 30.',
        },
        {
          line: 8,
          vars: { start: 5, end: 10, most: 2 },
          structure: { kind: 'array', values: [10, 30], pointers: { earliest: 0 } },
          note: 'The earliest room frees at 30, after 5, so every room is busy. Open a second room; its end, 10, becomes the earliest.',
        },
        {
          line: 5,
          vars: { start: 10, freed: 10 },
          structure: { kind: 'array', values: [30], pointers: { earliest: 0 } },
          note: 'The earliest room frees at 10 and this meeting starts at 10. The end is excluded, so that room is free: reuse it.',
        },
        {
          line: 8,
          vars: { start: 10, end: 12, most: 2 },
          structure: { kind: 'array', values: [12, 30], pointers: { earliest: 0 } },
          note: 'The reused room is now busy until 12. Still only two rooms in total.',
        },
        {
          line: 8,
          vars: { start: 15, end: 20, most: 2 },
          structure: { kind: 'array', values: [20, 30], pointers: { earliest: 0 } },
          note: '12 is at or before 15, so reuse that room again and record its new end, 20.',
        },
        {
          line: 11,
          vars: { result: 2 },
          structure: { kind: 'array', values: [20, 30] },
          note: 'Two rooms were ever needed. A binary heap would remove and insert each end in O(log k) instead of shifting the array.',
        },
      ],
    },
    alternative:
      'Sorting start times and end times separately and sweeping both with two pointers counts the meetings in progress at each start; its peak is the answer, in O(n log n) with no queue. Checking every pair of meetings for overlap does not give a room count, because three meetings can overlap pairwise without all overlapping at once.',
    counterexample:
      'Treating a meeting that starts exactly when another ends as an overlap returns 2 for [1, 5] and [5, 10]. Skipping the sort and placing meetings in input order returns 3 for [9, 10], [4, 9], [4, 17]: the room ending at 10 looks busy at 4 because [4, 9] has not been placed before it. Counting how many meetings overlap each meeting overstates the peak when those meetings never overlap each other.',
    transfer:
      'Return which room each meeting is assigned to, numbering rooms in the order they open. Decide what the queue must store besides end times. This changed contract is self-reviewed.',
  },
  'heap-kth-largest-stream': {
    reasoning:
      'Only the k highest scores so far can ever be the cutoff, and the cutoff is the lowest of them. Keeping exactly those k scores in a min-priority queue makes the cutoff its smallest element. A new score joins the queue; if the queue then holds k + 1 scores, removing the smallest restores the invariant.',
    trace:
      'For [4, 5, 8, 2, 10, 9] and k = 3: after 4, 5, 8 the queue holds {4, 5, 8} and the cutoff is 4. 2 joins and is removed at once. 10 joins and pushes 4 out, so the cutoff is 5. 9 joins and pushes 5 out, so the cutoff is 8.',
    alternative:
      'Sorting all scores so far after every arrival is correct but costs O(n² log n) over the whole stream. Keeping a sorted array of the top k costs O(k) per insert, which is fine for small k. The priority queue costs O(log k) per score and O(k) memory however long the stream is.',
    counterexample:
      'Removing duplicates before counting returns null for [5, 5, 5] with k = 2, because only one distinct score exists. Keeping a max-priority queue of everything and reading its top returns the highest score, not the kth. Returning 0 instead of null before k scores arrive is indistinguishable from a real score of 0.',
    transfer:
      'Report the median score after each arrival instead. Decide how two priority queues split the scores and which one holds the answer. This changed contract is self-reviewed.',
  },
}

export const dsaDpHeapGuides: Record<string, ReflectionGuide> = {
  'dp-garage-paths': {
    plan: [
      'How can a route arrive at a cell? Write what a cell’s count depends on.',
      'Name what the top row, the left column, and a blocked cell hold.',
    ],
    explanation: [
      'Explain why adding the two neighbours’ counts never counts a route twice.',
      'Explain the order you filled the table in and why each neighbour was ready when you needed it.',
      'State time and storage costs; checks compare counts, not whether a table was used.',
    ],
    example:
      'I fill a table the same size as the grid, row by row and left to right. A blocked cell holds 0, the open start holds 1, and every other cell holds the count above plus the count to its left, using 0 off the edge. The answer is the bottom-right cell. That is O(rows × cols) time and storage.',
  },
  'dp-stall-revenue': {
    plan: ['Predict the answer for an empty row, one stall, two stalls, and [4, 1, 1, 4].', 'Name the decision made at each stall.'],
    explanation: [
      'Explain why the best total for a prefix depends only on the two previous best totals.',
      'Give an input where choosing the highest stall first fails.',
      'State time and storage costs for your approach.',
    ],
    example:
      'For each stall I take the larger of skipping it, which keeps the best total so far, and taking it, which adds its revenue to the best total two stalls back. Two variables carry those totals. That is O(n) time and O(1) extra space.',
  },
  'dp-tag-edits': {
    plan: [
      'Predict the answer when one tag is empty, when both are equal, and for ab versus ba.',
      'Write what a smaller version of the question looks like.',
    ],
    explanation: [
      'Explain what each table cell means and which earlier cells it reads.',
      'Explain why matching last characters need no edit, and which three edits the other case compares.',
      'State time and storage costs in terms of both tag lengths.',
    ],
    example:
      'd[i][j] holds the fewest edits between the first i characters of from and the first j of to. The first row and column count insertions and deletions. Equal last characters copy the diagonal; otherwise I take one more than the smallest of the diagonal, above, and left cells. That is O(n × m) time and storage.',
  },
  'heap-merge-log-streams': {
    plan: [
      'At any moment, which entries could be the next one in the timeline?',
      'Write the tie rule and predict the result for an empty stream list.',
    ],
    explanation: [
      'Explain why the next entry is always one of the streams’ first unread entries.',
      'Explain how your code applies the tie rule and why it does not change the input arrays.',
      'State time and storage costs in terms of the total entries and the number of streams.',
    ],
    example:
      'I put the first timestamp of each nonempty stream into a min-priority queue keyed by time and then stream position. I repeatedly remove the smallest, append it, and add that stream’s next timestamp by index. That is O(n log k) time for n entries and k streams, and O(k) extra space besides the output.',
  },
  'heap-rooms-needed': {
    plan: [
      'Predict the answer for back-to-back meetings, three identical meetings, and no meetings.',
      'Name the one room worth checking when a meeting starts.',
    ],
    explanation: [
      'Explain why checking only the room that frees up soonest is enough.',
      'Explain how your code treats a meeting that starts exactly when another ends.',
      'State time and storage costs; checks compare counts, not the queue you used.',
    ],
    example:
      'I sort a copy of the meetings by start and keep the end times of rooms in use in a min-priority queue. For each meeting, if the earliest end is at or before its start, I remove it; then I add the meeting’s end. The queue’s largest size is the answer. That is O(n log n) time and O(n) space.',
  },
  'heap-kth-largest-stream': {
    plan: [
      'Predict the answers for k = 1, for repeated scores, and when k is larger than the number of scores.',
      'Name which of the scores you keep can be the cutoff.',
    ],
    explanation: [
      'Explain why you never need more than k scores to answer.',
      'Explain how repeated scores and the early null entries are handled.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I keep the k highest scores so far in a min-priority queue. Each new score is added, and when the queue holds more than k, I remove the smallest. While fewer than k scores have arrived I record null; otherwise I record the queue’s smallest. That is O(n log k) time and O(k) space.',
  },
}
