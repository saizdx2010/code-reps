import type { Rep } from './rep-types.ts'

// Dynamic programming journey (garage routes → stall revenue → tag edits) and heap journey practice
// (merge streams, rooms needed, kth highest). Behavioral checks compare answers only: they cannot establish that
// a table or a heap was used, so the approach stays a self-review point.

const gridNote =
  'grid has 1 to 12 rows of equal length from 1 to 12. Each cell is 0 (open) or 1 (blocked). Do not change grid. Counts stay below 2^31.'

export const dsaDpHeapReps: Rep[] = [
  {
    id: 'dp-garage-paths',
    title: 'Count routes through a parking garage',
    category: 'Algorithm applications',
    context:
      'A parking garage floor is a grid of bays. A cleaning robot starts in the top-left bay, finishes in the bottom-right bay, and may only move one bay right or one bay down at a time. Blocked bays hold parked cars.',
    prompt:
      'Return how many different routes reach the bottom-right cell from the top-left cell, moving only right or down through open cells. A route through a blocked cell does not count. If the start or the finish is blocked, return 0. A 1 × 1 open grid has one route: stay where you are. Practice filling a table where each cell holds the number of routes that reach it.',
    example: { input: 'garageRoutes([[0, 0, 0], [0, 1, 0], [0, 0, 0]])', output: '2' },
    note: gridNote,
    vocabulary: [
      { term: 'Route', meaning: 'one sequence of right and down moves from the start to the finish' },
      { term: 'Subproblem', meaning: 'the same question asked about a smaller part, such as one cell instead of the finish' },
      { term: 'Table', meaning: 'an array that stores the answer to every subproblem so it is computed only once' },
    ],
    planPrompt:
      'How can a route arrive at a cell? Write what a cell’s count depends on, then what the top row, the left column, and a blocked cell hold.',
    starter: 'function garageRoutes(grid: number[][]): number {\n  // Write your solution here.\n  return 0\n}\n',
    functionName: 'garageRoutes',
    preserveInput: true,
    hints: [
      'A route can only enter a cell from the cell above it or the cell to its left.',
      'So the number of routes reaching a cell is the sum of the routes reaching those two neighbours. A blocked cell is reached by no routes.',
      'Fill a table of the same size row by row, left to right, so both neighbours are ready before you need them. The start holds 1 when it is open, and a missing neighbour off the edge contributes 0.',
    ],
    checks: [
      {
        name: 'Routes around a blocked center',
        input: [
          [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
          ],
        ],
        expected: 2,
      },
      {
        name: 'Open 3 × 3 floor',
        input: [
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        ],
        expected: 6,
      },
      {
        name: 'Blocked start',
        input: [
          [
            [1, 0],
            [0, 0],
          ],
        ],
        expected: 0,
      },
      {
        name: 'Blocked finish',
        input: [
          [
            [0, 0],
            [0, 1],
          ],
        ],
        expected: 0,
      },
      { name: 'Single open bay', input: [[[0]]], expected: 1 },
      { name: 'One row', input: [[[0, 0, 0, 0]]], expected: 1 },
      { name: 'One column with a car in it', input: [[[0], [1], [0]]], expected: 0 },
      {
        name: 'Cars cut off every route',
        input: [
          [
            [0, 1],
            [1, 0],
          ],
        ],
        expected: 0,
      },
      {
        name: 'Wider floor with two cars',
        input: [
          [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1],
            [0, 0, 0, 0],
          ],
        ],
        expected: 4,
      },
      { name: 'Large open floor', input: [Array.from({ length: 12 }, () => Array(12).fill(0))], expected: 705432 },
    ],
  },
  {
    id: 'dp-stall-revenue',
    title: 'Choose market stalls for the most revenue',
    category: 'Algorithm applications',
    context:
      'A weekend market rents stalls in one row. Each stall lists the revenue a vendor expects there. Fire rules forbid renting two stalls that stand next to each other.',
    prompt:
      'Return the largest total revenue from a set of stalls in which no two chosen stalls are adjacent. Choosing no stalls is allowed and earns 0. Do not change revenues.',
    example: { input: 'bestRevenue([2, 7, 9, 3, 1])', output: '12' },
    note: 'revenues has 0 to 1000 integers from 0 to 10000. Adjacent means positions next to each other in the array.',
    vocabulary: [
      { term: 'Adjacent', meaning: 'next to each other, with no position in between' },
      { term: 'Total revenue', meaning: 'the sum of the revenues of the chosen stalls' },
    ],
    planPrompt: 'Predict the answer for an empty row, one stall, two stalls, and [4, 1, 1, 4]. What decision is made at each stall?',
    starter: 'function bestRevenue(revenues: number[]): number {\n  // Write your solution here.\n  return 0\n}\n',
    functionName: 'bestRevenue',
    preserveInput: true,
    hints: [
      'Renting the highest stall first and blocking its neighbours does not always work. Try it on [2, 3, 2].',
      'For the stalls up to some position, the best total either skips the last stall or takes it and then cannot use the one before.',
      'Keep the best totals for the two previous prefixes, and update both as you move one stall to the right.',
    ],
    checks: [
      { name: 'Example row', input: [[2, 7, 9, 3, 1]], expected: 12 },
      { name: 'Two far ends beat the middle', input: [[4, 1, 1, 4]], expected: 8 },
      { name: 'Empty row', input: [[]], expected: 0 },
      { name: 'One stall', input: [[5]], expected: 5 },
      { name: 'Two stalls', input: [[6, 7]], expected: 7 },
      { name: 'Every stall earns nothing', input: [[0, 0, 0]], expected: 0 },
      { name: 'Skipping two in a row pays off', input: [[10, 1, 1, 10]], expected: 20 },
      { name: 'Taking every other stall is not always best', input: [[2, 1, 1, 2]], expected: 4 },
      { name: 'The highest stall is not always rented', input: [[2, 3, 2]], expected: 4 },
      { name: 'Longer row', input: [[5, 3, 4, 11, 2, 9, 1]], expected: 25 },
    ],
  },
  {
    id: 'dp-tag-edits',
    title: 'Count the fewest edits between two tags',
    category: 'Algorithm applications',
    context:
      'A release tool warns when a new tag looks like a typo of an existing one. It measures how many single-character edits separate the two tags.',
    prompt:
      'Return the smallest number of edits that turn from into to. One edit inserts one character, deletes one character, or replaces one character with another. Compare characters exactly, including case.',
    example: { input: "tagEdits('kitten', 'sitting')", output: '3' },
    note: 'from and to are strings of 0 to 20 ASCII characters. Every edit costs 1.',
    vocabulary: [
      { term: 'Edit', meaning: 'inserting, deleting, or replacing one character' },
      { term: 'Prefix', meaning: 'the first few characters of a string' },
    ],
    planPrompt: 'Predict the answer when one tag is empty, when both are equal, and for ab versus ba.',
    starter: 'function tagEdits(from: string, to: string): number {\n  // Write your solution here.\n  return 0\n}\n',
    functionName: 'tagEdits',
    hints: [
      'Lining up equal characters and counting the leftovers fails for ab versus ba.',
      'Think about the last character of each prefix: it is either already equal, or one edit makes it so.',
      'Answer the question for every pair of prefix lengths, starting from empty prefixes, and keep each answer for later pairs.',
    ],
    checks: [
      { name: 'Classic example', input: ['kitten', 'sitting'], expected: 3 },
      { name: 'Empty from', input: ['', 'abc'], expected: 3 },
      { name: 'Empty to', input: ['abc', ''], expected: 3 },
      { name: 'Both empty', input: ['', ''], expected: 0 },
      { name: 'Equal tags', input: ['v1.2.0', 'v1.2.0'], expected: 0 },
      { name: 'One deletion', input: ['bug-fix', 'bugfix'], expected: 1 },
      { name: 'One insertion at the end', input: ['release', 'releases'], expected: 1 },
      { name: 'Swapped characters need two edits', input: ['ab', 'ba'], expected: 2 },
      { name: 'Case counts', input: ['Beta', 'beta'], expected: 1 },
      { name: 'Longer tags', input: ['intention', 'execution'], expected: 5 },
    ],
  },
  {
    id: 'heap-merge-log-streams',
    title: 'Merge sorted log streams',
    category: 'Algorithm applications',
    context:
      'Several services each write a log stream whose timestamps are already in order. An incident view needs one combined timeline.',
    prompt:
      'Return one array of {at, name} entries holding every timestamp from every stream, ordered by at. When timestamps are equal, the entry from the stream that appears earlier in streams comes first; equal timestamps within one stream keep their order. Do not change streams.',
    example: {
      input: "mergeStreams([{name: 'api', times: [1, 5]}, {name: 'db', times: [2, 5]}])",
      output: "[{at: 1, name: 'api'}, {at: 2, name: 'db'}, {at: 5, name: 'api'}, {at: 5, name: 'db'}]",
    },
    note: 'streams has 0 to 50 entries with distinct names. Each times array is in nondecreasing order, may be empty, and holds integers from 0 to 1000000. There are at most 5000 timestamps in total.',
    vocabulary: [
      { term: 'Stream', meaning: 'a sequence of entries from one source, already in time order' },
      { term: 'Timeline', meaning: 'all entries from every source in one time order' },
    ],
    planPrompt:
      'At any moment, which entries could be the next one in the timeline? Write the tie rule and predict the result for an empty stream list.',
    starter:
      'type Stream = { name: string; times: number[] }\nfunction mergeStreams(streams: Stream[]): { at: number; name: string }[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'mergeStreams',
    preserveInput: true,
    hints: [
      'Only the first unread timestamp of each stream can be the next entry of the timeline.',
      'Repeatedly take the smallest of those candidates, breaking ties by stream position, then move that stream forward by one.',
      'A min-priority queue keyed by timestamp and then stream position finds the next candidate without rescanning every stream.',
    ],
    checks: [
      {
        name: 'Interleaves two streams',
        input: [
          [
            { name: 'api', times: [1, 5] },
            { name: 'db', times: [2, 5] },
          ],
        ],
        expected: [
          { at: 1, name: 'api' },
          { at: 2, name: 'db' },
          { at: 5, name: 'api' },
          { at: 5, name: 'db' },
        ],
      },
      { name: 'No streams', input: [[]], expected: [] },
      {
        name: 'Empty streams are skipped',
        input: [
          [
            { name: 'a', times: [] },
            { name: 'b', times: [3] },
            { name: 'c', times: [] },
          ],
        ],
        expected: [{ at: 3, name: 'b' }],
      },
      {
        name: 'Ties follow stream order, not name order',
        input: [
          [
            { name: 'zeta', times: [4] },
            { name: 'alpha', times: [4] },
          ],
        ],
        expected: [
          { at: 4, name: 'zeta' },
          { at: 4, name: 'alpha' },
        ],
      },
      {
        name: 'Repeated times within one stream',
        input: [
          [
            { name: 'web', times: [2, 2, 9] },
            { name: 'job', times: [0, 9] },
          ],
        ],
        expected: [
          { at: 0, name: 'job' },
          { at: 2, name: 'web' },
          { at: 2, name: 'web' },
          { at: 9, name: 'web' },
          { at: 9, name: 'job' },
        ],
      },
      {
        name: 'Three streams of different lengths',
        input: [
          [
            { name: 'x', times: [10] },
            { name: 'y', times: [1, 2, 3, 11] },
            { name: 'z', times: [0, 10, 12] },
          ],
        ],
        expected: [
          { at: 0, name: 'z' },
          { at: 1, name: 'y' },
          { at: 2, name: 'y' },
          { at: 3, name: 'y' },
          { at: 10, name: 'x' },
          { at: 10, name: 'z' },
          { at: 11, name: 'y' },
          { at: 12, name: 'z' },
        ],
      },
    ],
  },
  {
    id: 'heap-rooms-needed',
    title: 'Count the meeting rooms a day needs',
    category: 'Algorithm applications',
    context:
      'An office books meetings for one day. Facilities wants to know the fewest rooms that would hold every meeting without moving any of them.',
    prompt:
      'Each meeting is [start, end], where the meeting uses a room from start up to, but not including, end. A meeting that ends at 10 frees its room for a meeting that starts at 10. Return the fewest rooms needed so that no two meetings share a room at the same time. Meetings may arrive in any order. Do not change meetings.',
    example: { input: 'roomsNeeded([[0, 30], [5, 10], [15, 20]])', output: '2' },
    note: 'meetings has 0 to 2000 pairs of integers with 0 <= start < end <= 1440.',
    vocabulary: [
      { term: 'Half-open interval', meaning: 'a range that includes its start but not its end' },
      { term: 'Overlap', meaning: 'two meetings that both use a room at the same moment' },
    ],
    planPrompt: 'Predict the answer for back-to-back meetings, three identical meetings, and no meetings.',
    starter: 'function roomsNeeded(meetings: [number, number][]): number {\n  // Write your solution here.\n  return 0\n}\n',
    functionName: 'roomsNeeded',
    preserveInput: true,
    hints: [
      'Process meetings in start order; whether a room is free depends only on the meetings already placed.',
      'When a meeting starts, the room that frees up soonest is the only one worth checking.',
      'Keep the end times of the rooms in use where the earliest is easy to read and remove. Reuse that room when its end is at or before the new start; otherwise open another room.',
    ],
    checks: [
      {
        name: 'Example day',
        input: [
          [
            [0, 30],
            [5, 10],
            [15, 20],
          ],
        ],
        expected: 2,
      },
      {
        name: 'Unordered meetings that never overlap',
        input: [
          [
            [7, 10],
            [2, 4],
          ],
        ],
        expected: 1,
      },
      { name: 'No meetings', input: [[]], expected: 0 },
      {
        name: 'Back-to-back meetings share a room',
        input: [
          [
            [1, 5],
            [5, 10],
          ],
        ],
        expected: 1,
      },
      {
        name: 'One long meeting beside short ones',
        input: [
          [
            [1, 10],
            [2, 3],
            [4, 5],
            [6, 7],
          ],
        ],
        expected: 2,
      },
      {
        name: 'Identical meetings',
        input: [
          [
            [1, 4],
            [1, 4],
            [1, 4],
          ],
        ],
        expected: 3,
      },
      {
        name: 'Unordered with a shared start',
        input: [
          [
            [9, 10],
            [4, 9],
            [4, 17],
          ],
        ],
        expected: 2,
      },
      {
        name: 'Peak in the middle of the day',
        input: [
          [
            [0, 5],
            [1, 6],
            [2, 7],
            [6, 8],
            [7, 9],
          ],
        ],
        expected: 3,
      },
    ],
  },
  {
    id: 'heap-kth-largest-stream',
    title: 'Track the kth highest score',
    category: 'Algorithm applications',
    context:
      'A live quiz shows a cutoff line: the score a player must beat to reach the top k. The cutoff updates every time a new score arrives.',
    prompt:
      'Return an array with one entry per score. Entry i is the kth highest of the scores up to and including scores[i], counting repeated scores separately, or null while fewer than k scores have arrived. Do not change scores.',
    example: { input: 'cutoffs([4, 5, 8, 2, 10, 9], 3)', output: '[null, null, 4, 4, 5, 8]' },
    note: 'scores has 0 to 2000 integers from -1000 to 1000. k is an integer from 1 to 100.',
    vocabulary: [
      { term: 'kth highest', meaning: 'the value in position k when values are listed from highest to lowest' },
      { term: 'Cutoff', meaning: 'the boundary value a new score must beat' },
    ],
    planPrompt: 'Predict the answers for k = 1, for repeated scores, and when k is larger than the number of scores.',
    starter: 'function cutoffs(scores: number[], k: number): (number | null)[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'cutoffs',
    preserveInput: true,
    hints: [
      'Only the k highest scores so far can ever affect a cutoff.',
      'The cutoff is the lowest of those k scores, so that is the one you need to read and replace quickly.',
      'Keep at most k scores in a min-priority queue. A new score joins; when there are more than k, remove the smallest. Once k scores are held, the smallest is the cutoff.',
    ],
    checks: [
      { name: 'Example stream', input: [[4, 5, 8, 2, 10, 9], 3], expected: [null, null, 4, 4, 5, 8] },
      { name: 'k of one is the running highest', input: [[3, 1, 4, 1, 5], 1], expected: [3, 3, 4, 4, 5] },
      { name: 'Repeated scores count separately', input: [[5, 5, 5], 2], expected: [null, 5, 5] },
      { name: 'No scores', input: [[], 2], expected: [] },
      { name: 'k larger than the stream', input: [[7, 8], 3], expected: [null, null] },
      { name: 'Negative scores', input: [[-5, -1, -3, -2], 2], expected: [null, -5, -3, -2] },
      { name: 'A low score does not move the cutoff', input: [[10, 20, 0, 15], 2], expected: [null, 10, 10, 15] },
    ],
  },
]
