import { dsaPlanPrompts } from './dsa-plan-prompts.ts'
import { starter } from './rep-starter.ts'
import type { Rep } from './rep.ts'

// Grid applications: neighbours, connected rooms, and shortest routes.
const gridApplications: Rep[] = [
  {
    id: 'grid-fewest-steps',
    title: 'Guide the warehouse robot',
    category: 'Algorithm applications',
    prompt:
      "A warehouse robot starts at 'S' and must reach 'E'. Return the fewest moves needed, or -1 when no route exists or either endpoint is missing. Each move goes up, right, down, or left to '.' or 'E'; '#' is a wall. No diagonal moves. Empty grids and zero-width rows return -1. 'S' and 'E' are distinct cells, so start equal to end is outside the contract. Coordinates are [row, col]. Do not mutate grid.",
    example: { input: 'fewestSteps(["S#E", "..."])', output: '4' },
    note: "grid contains 0 to 30 equal-length rows, each 0 to 30 ASCII characters. Ragged rows and other characters are outside the contract. Allowed characters: '.', '#', 'S', 'E'. At most one S and one E; missing endpoints are allowed.",
    vocabulary: [
      { term: 'Grid', meaning: 'a rectangular map indexed first by row, then by column' },
      { term: 'Move', meaning: 'one step between cells sharing a side' },
    ],
    planPrompt: dsaPlanPrompts['grid-fewest-steps'],
    starter: starter('function fewestSteps(grid: string[]): number', '-1'),
    functionName: 'fewestSteps',
    preserveInput: true,
    hints: [
      'Compare the required move count with straight-line distance when a wall blocks the way.',
      'Keep separate distance information for cells so revisits cannot repeat forever.',
      'Explore cells in increasing move count using a queue; mark each cell when first discovered. Its first distance is minimal because moves have equal cost.',
    ],
    checks: [
      { name: 'Short route beats detour', input: [['S..E', '....']], expected: 3 },
      { name: 'Detour', input: [['S#E', '...']], expected: 4 },
      { name: 'Choose shortest', input: [['S..', '.#.', '..E']], expected: 4 },
      { name: 'Unreachable', input: [['S#E']], expected: -1 },
      { name: 'Diagonal forbidden', input: [['S#', '#E']], expected: -1 },
      { name: 'Single row', input: [['S..E']], expected: 3 },
      { name: 'Single column', input: [['S', '.', '.', 'E']], expected: 3 },
      { name: 'Adjacent endpoints no dots', input: [['SE']], expected: 1 },
      { name: 'One start cell', input: [['S']], expected: -1 },
      { name: 'One end cell', input: [['E']], expected: -1 },
      { name: 'One open cell', input: [['.']], expected: -1 },
      { name: 'No open cells', input: [['#']], expected: -1 },
      { name: 'Empty', input: [[]], expected: -1 },
      { name: 'Zero width', input: [['', '']], expected: -1 },
      { name: 'Missing end', input: [['S..']], expected: -1 },
      { name: 'Missing start', input: [['..E']], expected: -1 },
      { name: 'Maximum route', input: [['S............................E', ...Array(29).fill('#'.repeat(30))]], expected: 29 },
    ],
  },
  {
    id: 'grid-count-rooms',
    title: 'Count rooms in a floor plan',
    category: 'Algorithm applications',
    prompt:
      "A floor plan uses '.' for floor and '#' for walls. Return the number of separate rooms: two floor cells belong to the same room when a route of up, right, down, or left moves through floor cells connects them. Diagonal contact does not connect rooms. Empty grids, zero-width rows, and maps with no floor return 0. Coordinates are [row, col]. Do not mutate grid.",
    example: { input: 'countRooms(["..#.", ".##.", "#..."])', output: '2' },
    note: "grid contains 0 to 30 equal-length rows, each 0 to 30 ASCII characters. Ragged rows and other characters are outside the contract. Allowed characters: '.' and '#'.",
    vocabulary: [
      { term: 'Grid', meaning: 'a rectangular map indexed first by row, then by column' },
      { term: 'Region', meaning: 'floor cells linked by side-to-side routes' },
    ],
    planPrompt: dsaPlanPrompts['grid-count-rooms'],
    starter: starter('function countRooms(grid: string[]): number', '0'),
    functionName: 'countRooms',
    preserveInput: true,
    hints: [
      'Compare a connected corridor with isolated floor cells.',
      'Keep a separate record of floor cells already accounted for, without writing into the input.',
      'Scan every cell; from each unseen dot explore its whole room using a queue or stack and count that room once.',
    ],
    checks: [
      { name: 'Several rooms', input: [['..#.', '.##.', '#...']], expected: 2 },
      { name: 'Diagonal separation', input: [['.#', '#.']], expected: 2 },
      { name: 'One open cell', input: [['.']], expected: 1 },
      { name: 'No open cells', input: [['#']], expected: 0 },
      { name: 'All walls', input: [['##', '##']], expected: 0 },
      { name: 'Empty', input: [[]], expected: 0 },
      { name: 'Zero width', input: [['', '']], expected: 0 },
      { name: 'Single row', input: [['..#.#..']], expected: 3 },
      { name: 'Single column', input: [['.', '.', '#', '.']], expected: 2 },
      { name: 'Cycle', input: [['...', '.#.', '...']], expected: 1 },
      { name: 'Maximum open map', input: [Array(30).fill('.'.repeat(30))], expected: 1 },
    ],
  },
  {
    id: 'grid-open-neighbours',
    title: 'Inspect open neighbours',
    category: 'Algorithm applications',
    prompt:
      "Return the coordinates of open ('.') cells immediately next to position, in the fixed order up, right, down, left, omitting walls and out-of-bounds cells. Coordinates are [row, col]. The origin may be a wall. An out-of-bounds origin, empty grid, or zero-width rows returns []. No diagonals. Do not mutate grid or position.",
    example: { input: 'openNeighbours(["...", ".#.", "..."], [1, 1])', output: '[[0, 1], [1, 2], [2, 1], [1, 0]]' },
    note: "grid contains 0 to 30 equal-length rows, each 0 to 30 ASCII characters. Ragged rows and other characters are outside the contract. Allowed characters: '.' and '#'. position contains integers from -1 to 30.",
    vocabulary: [
      { term: 'Grid', meaning: 'a rectangular map indexed first by row, then by column' },
      { term: 'Bounds', meaning: 'the valid row and column positions inside a map' },
    ],
    planPrompt: dsaPlanPrompts['grid-open-neighbours'],
    starter: starter('function openNeighbours(grid: string[], position: [number, number]): [number, number][]', '[]'),
    functionName: 'openNeighbours',
    preserveInput: true,
    hints: [
      'Changing the row moves vertically; changing the column moves horizontally.',
      'Validate the origin first, then check each candidate against both dimensions before reading its character.',
      'Consider offsets [-1,0], [0,1], [1,0], [0,-1] in that order; append only in-bounds dots.',
    ],
    checks: [
      {
        name: 'Maximum map bottom right',
        input: [Array(30).fill('.'.repeat(30)), [29, 29]],
        expected: [
          [28, 29],
          [29, 28],
        ],
      },
      {
        name: 'Four in order',
        input: [
          ['...', '.#.', '...'],
          [1, 1],
        ],
        expected: [
          [0, 1],
          [1, 2],
          [2, 1],
          [1, 0],
        ],
      },
      {
        name: 'Top left',
        input: [
          ['..', '..'],
          [0, 0],
        ],
        expected: [
          [0, 1],
          [1, 0],
        ],
      },
      {
        name: 'Walls',
        input: [
          ['###', '#.#', '###'],
          [1, 1],
        ],
        expected: [],
      },
      { name: 'One open cell', input: [['.'], [0, 0]], expected: [] },
      { name: 'One wall cell', input: [['#'], [0, 0]], expected: [] },
      { name: 'Empty', input: [[], [0, 0]], expected: [] },
      {
        name: 'Zero width',
        input: [
          ['', ''],
          [0, 0],
        ],
        expected: [],
      },
      {
        name: 'Single row',
        input: [['...'], [0, 1]],
        expected: [
          [0, 2],
          [0, 0],
        ],
      },
      {
        name: 'Single column',
        input: [
          ['.', '.', '.'],
          [1, 0],
        ],
        expected: [
          [0, 0],
          [2, 0],
        ],
      },
      { name: 'Negative coordinate', input: [['..'], [-1, 0]], expected: [] },
      { name: 'Outside column', input: [['..'], [0, 2]], expected: [] },
      { name: 'Outside row', input: [['..'], [1, 0]], expected: [] },
      {
        name: 'No diagonals',
        input: [
          ['.#', '#.'],
          [0, 0],
        ],
        expected: [],
      },
    ],
  },
]

// Game of Life parts: three ordinary reps whose saved solutions also run the toy in Library → Projects (src/LifeToy.tsx).
const lifeGridNote =
  "grid contains 0 to 30 equal-length rows, each 0 to 30 ASCII characters: '#' is a live cell and '.' is a dead one. Ragged rows and other characters are outside the contract."
const lifeRules =
  'A live cell with 2 or 3 live neighbours stays alive; with fewer than 2 or more than 3 it dies. A dead cell with exactly 3 live neighbours becomes alive; otherwise it stays dead.'

export const lifeReps: Rep[] = [
  {
    id: 'life-count-neighbours',
    title: 'Count live neighbours',
    category: 'Algorithm applications',
    prompt:
      "Return how many of the eight cells around position are live ('#'), counting diagonals. The cell at position itself is never counted, whether it is live or dead. Cells beyond the edge count as dead: the board does not wrap around. Coordinates are [row, col]. An out-of-bounds position, an empty grid, or zero-width rows return 0. Do not mutate grid or position.",
    example: { input: 'countNeighbours(["##.", ".#.", "..#"], [1, 1])', output: '3' },
    note: `${lifeGridNote} position contains integers from -1 to 30.`,
    vocabulary: [
      { term: 'Neighbour', meaning: 'one of the eight cells touching a cell by a side or a corner' },
      { term: 'Live cell', meaning: "a '#' in the grid" },
      { term: 'Wrap around', meaning: 'treating the left edge as next to the right edge; this board does not' },
    ],
    planPrompt: dsaPlanPrompts['life-count-neighbours'],
    starter: starter('function countNeighbours(grid: string[], position: [number, number]): number', '0'),
    functionName: 'countNeighbours',
    preserveInput: true,
    hints: [
      'The eight neighbours are every combination of a row change and a column change from -1 to 1, except no change at all.',
      'A neighbour outside the rows or the columns counts as dead, so check both ranges before reading it.',
      'Validate the position first; then add one for each in-bounds neighbour that is #, skipping the position itself.',
    ],
    checks: [
      {
        name: 'Counts diagonals too',
        input: [
          ['##.', '.#.', '..#'],
          [1, 1],
        ],
        expected: 3,
      },
      {
        name: 'Never counts the cell itself',
        input: [
          ['###', '###', '###'],
          [1, 1],
        ],
        expected: 8,
      },
      {
        name: 'A dead cell still has neighbours',
        input: [
          ['.#.', '#.#', '.#.'],
          [1, 1],
        ],
        expected: 4,
      },
      {
        name: 'Top-left corner sees three cells',
        input: [
          ['##', '##'],
          [0, 0],
        ],
        expected: 3,
      },
      {
        name: 'Bottom-right corner',
        input: [
          ['...', '.##', '.##'],
          [2, 2],
        ],
        expected: 3,
      },
      { name: 'Edges do not wrap', input: [['#..#'], [0, 0]], expected: 0 },
      { name: 'One cell alone', input: [['#'], [0, 0]], expected: 0 },
      { name: 'Row past the bottom', input: [['##'], [1, 0]], expected: 0 },
      { name: 'Negative position', input: [['##'], [-1, 0]], expected: 0 },
      { name: 'Empty grid', input: [[], [0, 0]], expected: 0 },
      {
        name: 'Zero width',
        input: [
          ['', ''],
          [0, 0],
        ],
        expected: 0,
      },
      { name: 'Largest board, centre', input: [Array(30).fill('#'.repeat(30)), [15, 15]], expected: 8 },
      { name: 'Largest board, corner', input: [Array(30).fill('#'.repeat(30)), [29, 29]], expected: 3 },
    ],
  },
  {
    id: 'life-next-cell',
    title: "Decide a cell's next state",
    category: 'Algorithm applications',
    prompt: `Given whether a cell is alive now and how many of its neighbours are live, return whether it is alive in the next generation. ${lifeRules}`,
    example: { input: 'nextCell(false, 3)', output: 'true' },
    note: 'alive is true or false. neighbours is a whole number from 0 to 8.',
    vocabulary: [
      { term: 'Generation', meaning: 'one snapshot of the board; the next generation follows from it by the rules' },
      { term: 'Survive', meaning: 'stay alive into the next generation' },
      { term: 'Birth', meaning: 'a dead cell becoming alive' },
    ],
    planPrompt: dsaPlanPrompts['life-next-cell'],
    starter: starter('function nextCell(alive: boolean, neighbours: number): boolean', 'false'),
    functionName: 'nextCell',
    hints: [
      'A live cell and a dead cell follow different rules, so decide which case you are in first.',
      'For a live cell, name the two counts that keep it alive; every other count ends it.',
      'A dead cell has exactly one count that brings it to life; check the boundaries 2, 3, and 4 for both cases.',
    ],
    checks: [0, 1, 2, 3, 4, 5, 6, 7, 8].flatMap(neighbours => [
      {
        name: `Live cell with ${neighbours} neighbour${neighbours === 1 ? '' : 's'}`,
        input: [true, neighbours],
        expected: neighbours === 2 || neighbours === 3,
      },
      {
        name: `Dead cell with ${neighbours} neighbour${neighbours === 1 ? '' : 's'}`,
        input: [false, neighbours],
        expected: neighbours === 3,
      },
    ]),
  },
  {
    id: 'life-next-generation',
    title: 'Step the whole board',
    category: 'Algorithm applications',
    brief: {
      summary: 'Return the next generation of the board, computing every cell from the current board at the same moment.',
      rules: [
        'Neighbours are the eight touching cells, including diagonals; cells beyond the edge are dead (no wrap-around).',
        'A live cell with 2 or 3 live neighbours stays alive; with fewer than 2 or more than 3 it dies.',
        'A dead cell with exactly 3 live neighbours becomes alive; otherwise it stays dead.',
        'Each new cell depends only on the current board, never on cells already updated.',
      ],
      edgeCases: ['The board keeps its size: [] returns [], and zero-width rows stay empty strings.', 'Do not mutate grid.'],
    },
    prompt: `Return the next generation of the board. Every cell changes at the same moment: each cell's next state depends only on the current board, never on cells already updated. ${lifeRules} Neighbours are the eight touching cells, including diagonals, and cells beyond the edge are dead (no wrap-around). The board keeps its size; an empty grid returns [] and zero-width rows stay empty strings. Do not mutate grid.`,
    example: { input: 'nextGeneration([".#.", ".#.", ".#."])', output: '["...", "###", "..."]' },
    note: lifeGridNote,
    vocabulary: [
      { term: 'Generation', meaning: 'one snapshot of the board; the next generation follows from it by the rules' },
      { term: 'Simultaneous update', meaning: 'computing every new cell from the old board before any cell changes' },
      { term: 'Blinker', meaning: 'three cells in a line that flip between vertical and horizontal' },
    ],
    planPrompt: dsaPlanPrompts['life-next-generation'],
    starter: starter('function nextGeneration(grid: string[]): string[]', '[]'),
    functionName: 'nextGeneration',
    preserveInput: true,
    hints: [
      'Updating cells in place changes the neighbours of cells you have not reached yet. Where should the new states go?',
      'Build each new row from the original board: count a cell’s live neighbours there, then apply the survival and birth rules.',
      'For every row and column, count live neighbours in grid with edges treated as dead, decide the new character, and join each new row into a string.',
    ],
    checks: [
      { name: 'Vertical blinker turns horizontal', input: [['.#.', '.#.', '.#.']], expected: ['...', '###', '...'] },
      { name: 'Horizontal blinker turns vertical', input: [['...', '###', '...']], expected: ['.#.', '.#.', '.#.'] },
      { name: 'A block stays still', input: [['##', '##']], expected: ['##', '##'] },
      {
        name: 'A beehive stays still',
        input: [['......', '..##..', '.#..#.', '..##..', '......']],
        expected: ['......', '..##..', '.#..#.', '..##..', '......'],
      },
      { name: 'A lone cell dies', input: [['#']], expected: ['.'] },
      { name: 'Overcrowded cells die, corners survive', input: [['###', '###', '###']], expected: ['#.#', '...', '#.#'] },
      { name: 'Isolated corners die', input: [['#.#', '...', '#.#']], expected: ['...', '...', '...'] },
      { name: 'Edges do not wrap', input: [['#..', '#..', '#..']], expected: ['...', '##.', '...'] },
      {
        name: 'A glider moves one step',
        input: [['.#...', '..#..', '###..', '.....', '.....']],
        expected: ['.....', '#.#..', '.##..', '.#...', '.....'],
      },
      { name: 'One row', input: [['.###.']], expected: ['..#..'] },
      { name: 'Empty grid', input: [[]], expected: [] },
      { name: 'Zero width', input: [['', '']], expected: ['', ''] },
      {
        name: 'Largest board',
        input: [Array(30).fill('#'.repeat(30))],
        expected: ['#' + '.'.repeat(28) + '#', ...Array(28).fill('.'.repeat(30)), '#' + '.'.repeat(28) + '#'],
      },
    ],
  },
]

export const dsaGridReps: Rep[] = [...gridApplications, ...lifeReps]
