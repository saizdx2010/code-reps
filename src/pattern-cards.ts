// Pattern cards: read a short, unlabeled contract and choose the tool that fits it best. Answers are kept only for the
// current page visit; recognizing a tool is not coding evidence and never changes skill progress.

export const patternTools = {
  'hash-lookup': 'Map or set lookup',
  'two-pointers': 'Two pointers from both ends',
  'sliding-window': 'Sliding window',
  'binary-search': 'Binary search',
  stack: 'Stack',
  bfs: 'Breadth-first search for fewest steps',
  'flood-fill': 'Flood fill from each unvisited cell',
  heap: 'Heap (priority queue)',
  'prefix-sums': 'Prefix sums',
  'sort-and-sweep': 'Sort, then sweep in order',
  backtracking: 'Backtracking',
  'dynamic-programming': 'Dynamic programming',
  'monotonic-stack': 'Monotonic stack',
  'topological-order': 'Topological order',
} as const

export type PatternTool = keyof typeof patternTools

export type PatternCard = {
  id: string
  /** The problem as a learner would meet it, without naming a technique. */
  contract: string
  choices: [PatternTool, PatternTool, PatternTool]
  answer: PatternTool
  /** The fact in the contract that decides the choice. */
  signal: string
  /** Why the most tempting other choice does not fit as well. */
  nearMiss: string
  /** An existing rep that applies the tool. */
  repId: string
}

export const patternCards: PatternCard[] = [
  {
    id: 'repeated-badge',
    contract: 'Return true if any two badge numbers in a long, unsorted list are the same.',
    choices: ['two-pointers', 'hash-lookup', 'binary-search'],
    answer: 'hash-lookup',
    signal: 'Each number only needs one question answered: has this value been seen before? A set answers it in one step.',
    nearMiss:
      'Two pointers and binary search both need sorted input. Sorting first works but costs O(n log n) for a question one pass answers.',
    repId: 'has-duplicate',
  },
  {
    id: 'budget-pair',
    contract: 'Prices are sorted from low to high. Say whether two different prices add up to exactly a budget.',
    choices: ['sliding-window', 'heap', 'two-pointers'],
    answer: 'two-pointers',
    signal:
      'Sorted input and a pair: moving the low end up raises the sum and moving the high end down lowers it, so each step rules out a value.',
    nearMiss: 'A sliding window covers a run of neighbours, but the two prices in a pair need not be next to each other.',
    repId: 'algo-sorted-pair',
  },
  {
    id: 'three-day-total',
    contract: 'Find the largest total of any three consecutive daily readings.',
    choices: ['sliding-window', 'sort-and-sweep', 'binary-search'],
    answer: 'sliding-window',
    signal: 'A fixed number of consecutive values: moving one step adds the new day and drops the oldest, so each total updates in O(1).',
    nearMiss: 'Sorting would put large readings together, but it destroys which days were consecutive, which is the whole question.',
    repId: 'algo-window-sum',
  },
  {
    id: 'bracket-order',
    contract: 'Check that every opening bracket in a string is closed by the matching kind, in the right order.',
    choices: ['hash-lookup', 'stack', 'two-pointers'],
    answer: 'stack',
    signal: 'The most recent unclosed bracket must close first. Last in, first out is exactly a stack.',
    nearMiss: 'Counting each kind with a map accepts "([)]", where the counts match but the order is wrong.',
    repId: 'valid-parentheses',
  },
  {
    id: 'first-at-least',
    contract: 'Version numbers are sorted. Find the first position whose value is at least a target, or the length if none is.',
    choices: ['binary-search', 'two-pointers', 'hash-lookup'],
    answer: 'binary-search',
    signal: 'Sorted values split into "below target" then "at least target". Checking the middle discards half the range each time.',
    nearMiss: 'A map finds exact values, but the target may be absent and the question is about a boundary, not equality.',
    repId: 'first-insertion-point',
  },
  {
    id: 'station-hops',
    contract: 'Find the fewest train hops from one station to another, where every hop counts the same.',
    choices: ['flood-fill', 'bfs', 'dynamic-programming'],
    answer: 'bfs',
    signal: 'Equal-cost steps and a minimum count: exploring level by level reaches each station first by its fewest hops.',
    nearMiss: 'Exploring as deep as possible first finds some route, but not necessarily the shortest one.',
    repId: 'graph-shortest-hops',
  },
  {
    id: 'count-rooms',
    contract: 'A floor plan marks open and wall cells. Count how many separate rooms it has.',
    choices: ['bfs', 'prefix-sums', 'flood-fill'],
    answer: 'flood-fill',
    signal: 'Counting connected groups: each unvisited open cell starts a new room, and spreading from it marks the whole room as seen.',
    nearMiss: 'A fewest-steps search measures distances from one start; here no distance is asked for, only how many groups exist.',
    repId: 'grid-count-rooms',
  },
  {
    id: 'urgent-jobs',
    contract: 'Jobs keep arriving with urgency scores. Each time a worker is free, hand out the most urgent waiting job.',
    choices: ['sort-and-sweep', 'heap', 'stack'],
    answer: 'heap',
    signal: 'Repeatedly removing the smallest or largest while new items arrive: a heap keeps that item at the top in O(log n) per change.',
    nearMiss: 'Sorting once is right for a fixed list, but every arrival would need another sort.',
    repId: 'algo-min-heap',
  },
  {
    id: 'many-ranges',
    contract: 'Answer many questions of the form "what is the total from position i to j?" on one list that never changes.',
    choices: ['prefix-sums', 'sliding-window', 'hash-lookup'],
    answer: 'prefix-sums',
    signal: 'Many range totals on fixed data: store running totals once, then each answer is one subtraction.',
    nearMiss:
      'A sliding window helps when the range moves one step at a time with a fixed width; these ranges jump around and vary in size.',
    repId: 'algo-prefix-sums',
  },
  {
    id: 'merge-meetings',
    contract: 'Combine meeting times that overlap into single blocks, and return the blocks in time order.',
    choices: ['two-pointers', 'sort-and-sweep', 'stack'],
    answer: 'sort-and-sweep',
    signal: 'Once meetings are sorted by start, any overlap is with the block just before, so one pass can extend or close it.',
    nearMiss: 'Comparing every pair also finds overlaps, but repeats work and still needs ordering at the end.',
    repId: 'algo-merge-intervals',
  },
  {
    id: 'topping-choices',
    contract: 'List every way to choose some of the given toppings, including choosing none.',
    choices: ['dynamic-programming', 'backtracking', 'bfs'],
    answer: 'backtracking',
    signal: 'Every combination must be written out: decide "include or skip" for each topping and undo the choice before the next branch.',
    nearMiss: 'Dynamic programming is strong at counting combinations, but the contract asks for the combinations themselves.',
    repId: 'algo-subsets',
  },
  {
    id: 'stair-ways',
    contract: 'Count the different ways to climb n stairs if each move is one or two steps.',
    choices: ['backtracking', 'dynamic-programming', 'binary-search'],
    answer: 'dynamic-programming',
    signal: 'The count for n is built from the counts for n − 1 and n − 2, and those smaller answers repeat, so each is stored once.',
    nearMiss: 'Listing every route with backtracking reaches the same count, but the number of routes grows exponentially.',
    repId: 'algo-climb-stairs',
  },
  {
    id: 'warmer-day',
    contract: 'For each day, say how many days you must wait for a warmer temperature, or 0 if none comes.',
    choices: ['heap', 'sliding-window', 'monotonic-stack'],
    answer: 'monotonic-stack',
    signal:
      'Each day waits for the next larger value. Keeping unanswered days on a stack of falling temperatures answers each one when a warmer day arrives.',
    nearMiss: 'A heap finds the warmest day overall, but the question is about the nearest warmer day after each one.',
    repId: 'next-warmer-day',
  },
  {
    id: 'course-dependencies',
    contract: 'Order courses so each comes after its prerequisites, or report that no order exists.',
    choices: ['topological-order', 'bfs', 'sort-and-sweep'],
    answer: 'topological-order',
    signal: 'Dependencies between items: repeatedly take one whose prerequisites are all done. If none is ready, there is a cycle.',
    nearMiss: 'Sorting by course number ignores which course depends on which.',
    repId: 'course-order',
  },
  {
    id: 'fewest-coins',
    contract: 'Find the fewest coins that make an exact amount. Taking the largest coin first does not always work.',
    choices: ['sort-and-sweep', 'dynamic-programming', 'heap'],
    answer: 'dynamic-programming',
    signal: 'The best answer for an amount comes from the best answers for smaller amounts, one per choice of last coin.',
    nearMiss: 'Sorting coins and taking the largest first is the greedy idea the contract already warns can fail.',
    repId: 'algo-coin-change',
  },
  {
    id: 'shortest-run',
    contract: 'All numbers are positive. Find the length of the shortest run of consecutive numbers whose total reaches a target.',
    choices: ['binary-search', 'sliding-window', 'heap'],
    answer: 'sliding-window',
    signal:
      'Positive numbers and a consecutive run: growing the run only raises the total and shrinking it only lowers it, so both ends move forward.',
    nearMiss: 'Binary search on the length can work too, but it re-checks totals that the window keeps for free.',
    repId: 'shortest-run-reaching-target',
  },
  {
    id: 'most-frequent',
    contract: 'Return the number that appears most often, choosing the smaller number on ties.',
    choices: ['stack', 'binary-search', 'hash-lookup'],
    answer: 'hash-lookup',
    signal: 'Counting how often each value appears: a map from value to count does it in one pass.',
    nearMiss: 'A stack keeps order of arrival, which this question does not need.',
    repId: 'most-frequent-number',
  },
  {
    id: 'folder-path',
    contract: 'Simplify a folder path where "." means stay and ".." means go up one folder.',
    choices: ['stack', 'hash-lookup', 'two-pointers'],
    answer: 'stack',
    signal: '".." undoes the most recent folder still on the path: push names and pop on "..".',
    nearMiss: 'Counting folder names with a map loses the order and which folder ".." should remove.',
    repId: 'simplify-file-path',
  },
  {
    id: 'truck-capacity',
    contract: 'Parcels ship in order. Find the smallest daily truck capacity that ships them all within a given number of days.',
    choices: ['dynamic-programming', 'binary-search', 'heap'],
    answer: 'binary-search',
    signal: 'If a capacity works, every larger one works too. Searching that yes/no boundary over capacities halves the range each time.',
    nearMiss: 'Dynamic programming over every way to split days is possible, but the monotonic yes/no question is far cheaper.',
    repId: 'smallest-daily-capacity',
  },
]

/** A fresh order for one visit; `random` is injectable for tests. */
export function shuffledCards(random = Math.random): PatternCard[] {
  const cards = [...patternCards]
  for (let index = cards.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[cards[index], cards[other]] = [cards[other], cards[index]]
  }
  return cards
}
