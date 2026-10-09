import type { Rep } from './rep.ts'

export const dsaReps: Rep[] = [{
    'id': 'ds-array-operations',
    'title': 'Copy, append, and read an array',
    'category': 'Collection basics',
    'prompt': 'Create a new number array containing all supplied values followed by extra. Return its last value. Practise declaring number[], copying with spread, appending with push, and reading by index.',
    'example': {
      'input': 'appendAndRead([4, 7], 0)',
      'output': '0'
    },
    'note': 'numbers contains at most 100 integers from -1000 to 1000; extra has the same range. Do not change numbers. Checks verify the returned value and unchanged input; review the requested operations yourself.',
    'vocabulary': [{
        'term': 'Copy',
        'meaning': 'a separate array with the same values'
      }, {
        'term': 'Index',
        'meaning': 'a position starting at zero'
      }],
    'planPrompt': 'Which array can you change safely? What is the last index after appending?',
    'starter': 'function appendAndRead(numbers: number[], extra: number): number {\n  // Write your solution here.\n  return 0\n}\n',
    'functionName': 'appendAndRead',
    'preserveInput': true,
    'hints': ['An array declared with const can still receive items.', 'Make your own copy first, so the caller keeps the original numbers.', 'Add the extra value to the end of your copy. After adding, the last position is one less than the copy’s length.'],
    'checks': [{
        'name': 'Appends to an existing list',
        'input': [[4, 7], 9],
        'expected': 9
      }, {
        'name': 'Starts from empty',
        'input': [[], 5],
        'expected': 5
      }, {
        'name': 'Keeps zero',
        'input': [[4], 0],
        'expected': 0
      }, {
        'name': 'Keeps a negative value',
        'input': [[1], -2],
        'expected': -2
      }]
  }, {
    'id': 'ds-set-operations',
    'title': 'Create and update a set',
    'category': 'Collection basics',
    'prompt': 'Create a Set<number> from numbers, add extra, delete removed, and return the number of remaining distinct values. Apply those operations in that order.',
    'example': {
      'input': 'updateDistinct([2, 2, 3], 4, 2)',
      'output': '2'
    },
    'note': 'At most 100 integers, each from -1000 to 1000. extra and removed use the same range. Equality is numeric; do not change numbers. Practise new Set, add, delete, and size; checks verify behavior, not API choice.',
    'vocabulary': [{
        'term': 'Set',
        'meaning': 'a collection of distinct values'
      }, {
        'term': 'Membership',
        'meaning': 'whether a collection contains a value'
      }],
    'planPrompt': 'What happens when extra equals removed? What does deleting an absent value do?',
    'starter': 'function updateDistinct(numbers: number[], extra: number, removed: number): number {\n  // Write your solution here.\n  return 0\n}\n',
    'functionName': 'updateDistinct',
    'preserveInput': true,
    'hints': ['A Set keeps one copy of each numeric value.', 'Adding an existing value and deleting a missing value are allowed.', 'Build a Set from the input, add the extra value first, then remove the other value. Report how many distinct values remain.'],
    'checks': [{
        'name': 'Adds then removes',
        'input': [[2, 2, 3], 4, 2],
        'expected': 2
      }, {
        'name': 'Empty then same add and delete',
        'input': [[], 5, 5],
        'expected': 0
      }, {
        'name': 'Adding existing value',
        'input': [[1, 1], 1, 9],
        'expected': 1
      }, {
        'name': 'Deleting missing value',
        'input': [[0, -2], 3, 9],
        'expected': 3
      }]
  }, {
    'id': 'ds-map-operations',
    'title': 'Set, overwrite, and read a map',
    'category': 'Collection basics',
    'prompt': 'Create a Map<string, number> from entries in order. Set key to value, then return the value associated with query, or null when query is absent. Later entries overwrite earlier values for the same key.',
    'example': {
      'input': 'updateLookup([["a", 2]], "a", 0, "a")',
      'output': '0'
    },
    'note': 'entries has at most 100 [string, integer] pairs. Strings contain at most 20 ASCII characters and are case-sensitive, with no trimming; empty strings are valid. Integers are -1000 to 1000. Preserve entries. Practise new Map, set, get, and has; API choice is self-reviewed.',
    'vocabulary': [{
        'term': 'Map',
        'meaning': 'a collection associating keys with values'
      }, {
        'term': 'Key',
        'meaning': 'the value used to look up an associated value'
      }],
    'planPrompt': 'Which write wins for a repeated key? How will you preserve a stored zero?',
    'starter': 'function updateLookup(entries: [string, number][], key: string, value: number, query: string): number | null {\n  // Write your solution here.\n  return null\n}\n',
    'functionName': 'updateLookup',
    'preserveInput': true,
    'hints': ['A map associates a key with a value; setting a key again replaces its value.', 'Zero is a stored value, not a missing entry.', 'Build the map from the entries in order, apply the one write, then look up the query. Only a key that was never stored should give null.'],
    'checks': [{
        'name': 'Overwrites with zero',
        'input': [[['a', 2]], 'a', 0, 'a'],
        'expected': 0
      }, {
        'name': 'Missing query',
        'input': [[], 'a', 2, 'b'],
        'expected': null
      }, {
        'name': 'Last entry wins',
        'input': [[['a', 1], ['a', 3]], 'b', 4, 'a'],
        'expected': 3
      }, {
        'name': 'Empty key',
        'input': [[['', -2]], 'x', 4, ''],
        'expected': -2
      }, {
        'name': 'Case-sensitive keys',
        'input': [[['A', 8]], 'a', 2, 'A'],
        'expected': 8
      }]
  }, {
    'id': 'ds-stack-operations',
    'title': 'Push, pop, and peek a stack',
    'category': 'Stacks & queues',
    'prompt': 'Treat numbers as a stack whose top is its last item. Copy it, push extra, pop once, then return the remaining top without removing it. Return null if no item remains.',
    'example': {
      'input': 'stackTop([4, 7], 9)',
      'output': '7'
    },
    'note': 'At most 100 integers from -1000 to 1000; extra has the same range. Preserve numbers. Practise a typed array, push, pop, and peeking by index. Checks do not prove that you used a stack.',
    'vocabulary': [{
        'term': 'Stack',
        'meaning': 'a collection where the last added item leaves first'
      }, {
        'term': 'Peek',
        'meaning': 'read the next item without removing it'
      }],
    'planPrompt': 'Which value leaves first? How do you distinguish an empty stack from a top value of zero?',
    'starter': 'function stackTop(numbers: number[], extra: number): number | null {\n  // Write your solution here.\n  return null\n}\n',
    'functionName': 'stackTop',
    'preserveInput': true,
    'hints': ['Last in, first out means the most recently pushed item leaves first.', 'Copy before pushing and popping. Peek does not remove an item.', 'Make a copy, put the extra value on top, take one value off the top, then read what is on top now. If the stack is empty, the answer is null.'],
    'checks': [{
        'name': 'Returns previous top',
        'input': [[4, 7], 9],
        'expected': 7
      }, {
        'name': 'Empty after pop',
        'input': [[], 9],
        'expected': null
      }, {
        'name': 'Keeps zero',
        'input': [[0], 3],
        'expected': 0
      }, {
        'name': 'Uses last not first',
        'input': [[1, -2, 8], 6],
        'expected': 8
      }]
  }, {
    'id': 'ds-queue-operations',
    'title': 'Enqueue, dequeue, and peek a queue',
    'category': 'Stacks & queues',
    'prompt': 'Treat numbers as a queue whose front is its first item. Copy it, enqueue extra at the back, dequeue once from the front, then return the remaining front without removing it. Return null when no item remains.',
    'example': {
      'input': 'queueFront([4, 7], 9)',
      'output': '7'
    },
    'note': 'At most 100 integers from -1000 to 1000; extra has the same range. Preserve numbers. For this small introduction, use an array with push and shift. Checks verify behavior; operations are self-reviewed.',
    'vocabulary': [{
        'term': 'Queue',
        'meaning': 'a collection where the first added item leaves first'
      }, {
        'term': 'Enqueue',
        'meaning': 'add an item at the back'
      }, {
        'term': 'Dequeue',
        'meaning': 'remove an item from the front'
      }],
    'planPrompt': 'Trace empty and one-item queues. Which end is used for adding and removing?',
    'starter': 'function queueFront(numbers: number[], extra: number): number | null {\n  // Write your solution here.\n  return null\n}\n',
    'functionName': 'queueFront',
    'preserveInput': true,
    'hints': ['A queue removes the oldest item, rather than the newest.', 'Adding happens at the back of the line; removing happens at the front.', 'Make a copy, add the extra value at the back, remove one item from the front, then look at the new front. If no item remains, the answer is null.'],
    'checks': [{
        'name': 'First in leaves first',
        'input': [[4, 7], 9],
        'expected': 7
      }, {
        'name': 'Empty queue returns to empty',
        'input': [[], 9],
        'expected': null
      }, {
        'name': 'Enqueued value becomes front',
        'input': [[4], 9],
        'expected': 9
      }, {
        'name': 'Keeps zero',
        'input': [[4, 0], 3],
        'expected': 0
      }, {
        'name': 'Distinguishes stack order',
        'input': [[1, 2, 3], 4],
        'expected': 2
      }]
  }, {
    'id': 'algo-sorted-pair',
    'title': 'Find a pair in sorted numbers',
    'category': 'Algorithm techniques',
    'prompt': 'Return true if two different positions in numbers sum to target, otherwise false. numbers is sorted in ascending order; duplicate values are allowed. Practise moving a left and right pointer toward each other.',
    'example': {
      'input': 'hasSortedPair([1, 3, 5, 8], 11)',
      'output': 'true'
    },
    'note': 'At most 100 integers from -1000 to 1000; target is -2000 to 2000. Preserve numbers. Empty and one-item inputs return false. Behavior checks do not prove two pointers or linear time; review those separately.',
    'vocabulary': [{
        'term': 'Pointer',
        'meaning': 'an index marking a current position'
      }, {
        'term': 'Sorted',
        'meaning': 'arranged in a defined order'
      }],
    'planPrompt': 'Why does sorted order justify each move? Why must the two positions stay different?',
    'starter': 'function hasSortedPair(numbers: number[], target: number): boolean {\n  // Write your solution here.\n  return false\n}\n',
    'functionName': 'hasSortedPair',
    'preserveInput': true,
    'hints': ['Sorted order lets you discard candidates after comparing a sum.', 'If the sum is too small, increase the left pointer. If too large, decrease the right pointer.', 'Start at the two ends and continue only while left < right; return true on equality, otherwise false after they meet.'],
    'checks': [{
        'name': 'Finds inner and outer pair',
        'input': [[1, 3, 5, 8], 11],
        'expected': true
      }, {
        'name': 'Empty input',
        'input': [[], 0],
        'expected': false
      }, {
        'name': 'Cannot reuse one position',
        'input': [[3], 6],
        'expected': false
      }, {
        'name': 'Uses duplicate positions',
        'input': [[3, 3], 6],
        'expected': true
      }, {
        'name': 'No pair',
        'input': [[1, 2, 4], 8],
        'expected': false
      }, {
        'name': 'Includes negative values',
        'input': [[-5, -2, 0, 3], -2],
        'expected': true
      }]
  }, {
    'id': 'algo-window-sum',
    'title': 'Find the largest fixed-window sum',
    'category': 'Algorithm techniques',
    'prompt': 'Return the largest sum of any k consecutive items. k is a positive integer. Return null if numbers has fewer than k items. Practise maintaining a running sum as a fixed-size window moves.',
    'example': {
      'input': 'largestWindowSum([2, -1, 4, 3], 2)',
      'output': '7'
    },
    'note': 'numbers has at most 100 integers from -1000 to 1000; k is 1 to 101. Preserve numbers. Values may all be negative. Behavior checks do not prove a sliding-window approach or complexity.',
    'vocabulary': [{
        'term': 'Window',
        'meaning': 'a consecutive portion of a sequence'
      }, {
        'term': 'Running sum',
        'meaning': 'a total updated as items enter or leave'
      }],
    'planPrompt': 'What does your running sum represent? How will initialization handle all-negative inputs?',
    'starter': 'function largestWindowSum(numbers: number[], k: number): number | null {\n  // Write your solution here.\n  return null\n}\n',
    'functionName': 'largestWindowSum',
    'preserveInput': true,
    'hints': ['Form a complete first window before choosing a best sum.', 'Each move removes one outgoing item and adds one incoming item.', 'Sum the first k values, initialize best from that sum, then update sum += numbers[right] - numbers[right - k] and compare with best.'],
    'checks': [{
        'name': 'Moves the window',
        'input': [[2, -1, 4, 3], 2],
        'expected': 7
      }, {
        'name': 'Empty input',
        'input': [[], 1],
        'expected': null
      }, {
        'name': 'Too few items',
        'input': [[1, 2], 3],
        'expected': null
      }, {
        'name': 'All negative',
        'input': [[-5, -2, -7], 2],
        'expected': -7
      }, {
        'name': 'One-item windows',
        'input': [[0, -1, 4], 1],
        'expected': 4
      }, {
        'name': 'Whole array',
        'input': [[2, -1, 4], 3],
        'expected': 5
      }, {
        'name': 'Best window first',
        'input': [[9, 2, -8], 2],
        'expected': 11
      }]
  }, {
    'id': 'algo-binary-search',
    'title': 'Search sorted numbers',
    'category': 'Algorithm techniques',
    'prompt': 'Return the index of target in a strictly increasing number array, or -1 when it is absent. Practise binary search: inspect the middle of the remaining interval and discard the half that cannot contain target.',
    'example': {
      'input': 'sortedIndex([-3, 0, 4, 9], 4)',
      'output': '2'
    },
    'note': 'At most 100 distinct integers from -1000 to 1000 in ascending order; target uses the same range. Preserve numbers. Empty input returns -1. Checks verify the index, not logarithmic time or a particular search approach.',
    'vocabulary': [{
        'term': 'Binary search',
        'meaning': 'search by repeatedly discarding half a sorted interval'
      }, {
        'term': 'Interval',
        'meaning': 'the positions still being considered'
      }],
    'planPrompt': 'How does every iteration shrink the interval? What represents an exhausted interval?',
    'starter': 'function sortedIndex(numbers: number[], target: number): number {\n  // Write your solution here.\n  return 0\n}\n',
    'functionName': 'sortedIndex',
    'preserveInput': true,
    'hints': ['Track the remaining interval with inclusive left and right indices.', 'Use Math.floor((left + right) / 2); discard the middle too when it does not match.', 'Keep going while the interval still has a position. Return the middle index when its value matches. If the middle value is less than target, set left to middle + 1; otherwise set right to middle - 1. Return -1 once the interval is empty.'],
    'checks': [{
        'name': 'Finds middle',
        'input': [[-3, 0, 4, 9], 4],
        'expected': 2
      }, {
        'name': 'Empty input',
        'input': [[], 0],
        'expected': -1
      }, {
        'name': 'First value',
        'input': [[1, 3, 5], 1],
        'expected': 0
      }, {
        'name': 'Last value',
        'input': [[1, 3, 5], 5],
        'expected': 2
      }, {
        'name': 'Absent between values',
        'input': [[1, 3, 5], 4],
        'expected': -1
      }, {
        'name': 'One matching item',
        'input': [[0], 0],
        'expected': 0
      }, {
        'name': 'Below range',
        'input': [[1, 3], 0],
        'expected': -1
      }, {
        'name': 'Above range',
        'input': [[1, 3], 4],
        'expected': -1
      }]
  },
  {
    'id': 'algo-insertion-sort',
    'title': 'Insert numbers into sorted order',
    'category': 'Algorithm techniques',
    'prompt': 'Return a new array containing every number in ascending numeric order, including duplicates. Practise insertion sort: grow an ordered portion by placing each next value where it belongs.',
    'example': {
      'input': 'insertionSort([3, 1, 3, -2])',
      'output': '[-2, 1, 3, 3]'
    },
    'note': 'At most 100 integers from -1000 to 1000. Do not change numbers, even if already sorted. Empty input returns a new empty array. Equal values are all retained; their order is indistinguishable for numbers. Review insertion sort and the separate returned array yourself; checks verify values and visible input mutation.',
    'vocabulary': [
      {
        'term': 'Insertion',
        'meaning': 'placing an item into its correct position'
      },
      {
        'term': 'Sorted prefix',
        'meaning': 'the beginning portion already in order'
      }
    ],
    'planPrompt': 'What stays ordered after each insertion? How will you keep duplicates and preserve the caller array?',
    'starter': 'function insertionSort(numbers: number[]): number[] {\n  // Write your solution here.\n  return []\n}\n',
    'functionName': 'insertionSort',
    'preserveInput': true,
    'hints': [
      'Start by identifying which part of the array is already ordered.',
      'Compare the next value with values before it; decide which values need more room.',
      'Keep the value being inserted safe while moving larger values in a copy. Check where it belongs when it is smaller than every earlier value.'
    ],
    'checks': [
      {
        'name': 'Mixed order and duplicates',
        'input': [[3, 1, 3, -2]],
        'expected': [-2, 1, 3, 3]
      },
      {
        'name': 'Empty input',
        'input': [[]],
        'expected': []
      },
      {
        'name': 'Single zero',
        'input': [[0]],
        'expected': [0]
      },
      {
        'name': 'Already sorted',
        'input': [[-2, 0, 4]],
        'expected': [-2, 0, 4]
      },
      {
        'name': 'Reverse order',
        'input': [[4, 3, 2, 1]],
        'expected': [1, 2, 3, 4]
      },
      {
        'name': 'All equal',
        'input': [[2, 2, 2]],
        'expected': [2, 2, 2]
      },
      {
        'name': 'Numeric not text order',
        'input': [[10, 2, -1000, 1000]],
        'expected': [-1000, 2, 10, 1000]
      },
      {
        'name': 'Maximum length',
        'input': [Array.from({ length: 100 }, (_, i) => 99 - i)],
        'expected': Array.from({ length: 100 }, (_, i) => i)
      }
    ]
  },
  {
    'id': 'algo-merge-sorted',
    'title': 'Merge two ordered lists',
    'category': 'Algorithm techniques',
    'prompt': 'Return a new ascending array containing every value from left and right. Both inputs are already sorted. Practise comparing the next unused value in each list instead of sorting again.',
    'example': {
      'input': 'mergeSorted([1, 3], [2, 3, 4])',
      'output': '[1, 2, 3, 3, 4]'
    },
    'note': 'Each input has at most 100 integers from -1000 to 1000 in nondecreasing order. Preserve both arrays. Empty lists contribute no values; two empty lists return a new empty array. Keep all duplicates. On equality, take the left value first in your practice approach; numeric output checks cannot distinguish equal-value order.',
    'vocabulary': [
      {
        'term': 'Merge',
        'meaning': 'combine ordered lists into one ordered list'
      },
      {
        'term': 'Cursor',
        'meaning': 'an index pointing to the next unused item'
      }
    ],
    'planPrompt': 'Why is the next unused value enough to compare? What happens when one list runs out?',
    'starter': 'function mergeSorted(left: number[], right: number[]): number[] {\n  // Write your solution here.\n  return []\n}\n',
    'functionName': 'mergeSorted',
    'preserveInput': true,
    'hints': [
      'The inputs already provide useful ordering.',
      'Track the unused portion of each list and consider its smallest remaining item.',
      'Once one list is exhausted, decide how to keep every item in the other list without reading beyond an end.'
    ],
    'checks': [
      {
        'name': 'Interleaved with a tie',
        'input': [[1, 3], [2, 3, 4]],
        'expected': [1, 2, 3, 3, 4]
      },
      {
        'name': 'Both empty',
        'input': [[], []],
        'expected': []
      },
      {
        'name': 'Left empty',
        'input': [[], [-2, 0]],
        'expected': [-2, 0]
      },
      {
        'name': 'Right empty',
        'input': [[1, 2], []],
        'expected': [1, 2]
      },
      {
        'name': 'Left finishes first',
        'input': [[1], [2, 3, 4]],
        'expected': [1, 2, 3, 4]
      },
      {
        'name': 'Right finishes first',
        'input': [[2, 3, 4], [1]],
        'expected': [1, 2, 3, 4]
      },
      {
        'name': 'Repeated limits',
        'input': [[-1000, 0, 1000], [-1000, 1000]],
        'expected': [-1000, -1000, 0, 1000, 1000]
      },
      {
        'name': 'Both maximum lengths',
        'input': [Array(100).fill(0), Array(100).fill(0)],
        'expected': Array(200).fill(0)
      }
    ]
  },
  {
    'id': 'algo-recursive-sum',
    'title': 'Sum numbers inside nested lists',
    'category': 'Algorithm techniques',
    'prompt': 'Return the sum of every number inside items, including numbers in nested arrays. Practise recursion: let a smaller nested list solve the same task. Give an empty list a clear base case.',
    'example': {
      'input': 'recursiveSum([1, [2, [], [-3]], 4])',
      'output': '4'
    },
    'note': 'items contains only integers from -1000 to 1000 and nested arrays, with no cycles or shared arrays. At most 100 entries across all arrays and at most 10 array levels including items. Preserve every array. Empty arrays contribute 0. Repeated numbers each contribute; cancellation and zero are valid. Checks do not prove recursion; review the base case and smaller calls yourself.',
    'vocabulary': [
      {
        'term': 'Recursion',
        'meaning': 'solving a task by calling the same function on a smaller part'
      },
      {
        'term': 'Base case',
        'meaning': 'a case that finishes without another recursive call'
      }
    ],
    'planPrompt': 'What ends a call? How do a number and a nested array contribute differently?',
    'starter': 'type NestedNumber = number | NestedNumber[]\n\nfunction recursiveSum(items: NestedNumber[]): number {\n  // Write your solution here.\n  return 0\n}\n',
    'functionName': 'recursiveSum',
    'preserveInput': true,
    'hints': [
      'Trace an empty list before a list containing numbers.',
      'A nested list has the same kind of task as the outer list.',
      'Make sure each smaller result contributes once, and that a number is handled without making another recursive call.'
    ],
    'checks': [
      {
        'name': 'Mixed nesting',
        'input': [[1, [2, [], [-3]], 4]],
        'expected': 4
      },
      {
        'name': 'Empty outer list',
        'input': [[]],
        'expected': 0
      },
      {
        'name': 'Only nested empties',
        'input': [[[], [[]]]],
        'expected': 0
      },
      {
        'name': 'Repeated and zero values',
        'input': [[2, [2, 0]]],
        'expected': 4
      },
      {
        'name': 'Negative total',
        'input': [[-2, [-3]]],
        'expected': -5
      },
      {
        'name': 'Cancellation',
        'input': [[1000, [-1000]]],
        'expected': 0
      },
      {
        'name': 'Flat list',
        'input': [[1, 2, 3]],
        'expected': 6
      },
      {
        'name': 'Ten array levels',
        'input': [[[[[[[[[[7]]]]]]]]]],
        'expected': 7
      },
      {
        'name': 'Maximum entries',
        'input': [Array(100).fill(1000)],
        'expected': 100000
      }
    ]
  },
  {
    'id': 'algo-tree-depth',
    'title': 'Find the deepest tree level',
    'category': 'Algorithm techniques',
    'prompt': 'Return the maximum number of nodes on a route from the root to a leaf. A leaf has no children. A missing tree (null) has depth 0; a root alone has depth 1. Practise solving the same depth task for each child.',
    'example': {
      'input': 'treeDepth({value: 5, children: [{value: 0, children: []}]})',
      'output': '2'
    },
    'note': 'A node has {value: number, children: TreeNode[]}. Trees have at most 100 nodes, at most 10 levels, integer values from -1000 to 1000, no cycles, and no shared nodes. Preserve all nodes and child arrays. Values do not affect depth. Equal-depth branches give the same numeric result; return the depth, not a chosen branch. Checks do not prove recursion.',
    'vocabulary': [
      {
        'term': 'Root',
        'meaning': 'the starting node of a tree'
      },
      {
        'term': 'Leaf',
        'meaning': 'a node with no children'
      },
      {
        'term': 'Depth',
        'meaning': 'the number of nodes on the longest root-to-leaf route here'
      }
    ],
    'planPrompt': 'What does an empty tree return? How do child depths determine the parent depth?',
    'starter': 'type TreeNode = { value: number; children: TreeNode[] }\n\nfunction treeDepth(root: TreeNode | null): number {\n  // Write your solution here.\n  return 0\n}\n',
    'functionName': 'treeDepth',
    'preserveInput': true,
    'hints': [
      'Draw a root alone and then a root with one child.',
      'Only one child route is followed at a time when measuring depth.',
      'Compare child results rather than adding them; remember the current node also occupies a level.'
    ],
    'checks': [
      {
        'name': 'No tree',
        'input': [null],
        'expected': 0
      },
      {
        'name': 'Root alone',
        'input': [
          {
            'value': 0,
            'children': []
          }
        ],
        'expected': 1
      },
      {
        'name': 'One child',
        'input': [
          {
            'value': 5,
            'children': [
              {
                'value': 0,
                'children': []
              }
            ]
          }
        ],
        'expected': 2
      },
      {
        'name': 'Unequal branches',
        'input': [
          {
            'value': 1,
            'children': [
              {
                'value': 9,
                'children': []
              },
              {
                'value': -2,
                'children': [
                  {
                    'value': 3,
                    'children': []
                  }
                ]
              }
            ]
          }
        ],
        'expected': 3
      },
      {
        'name': 'Tied branches',
        'input': [
          {
            'value': 1000,
            'children': [
              {
                'value': -1000,
                'children': []
              },
              {
                'value': 1000,
                'children': []
              }
            ]
          }
        ],
        'expected': 2
      },
      {
        'name': 'Ten levels',
        'input': [
          {
            'value': 0,
            'children': [
              {
                'value': 0,
                'children': [
                  {
                    'value': 0,
                    'children': [
                      {
                        'value': 0,
                        'children': [
                          {
                            'value': 0,
                            'children': [
                              {
                                'value': 0,
                                'children': [
                                  {
                                    'value': 0,
                                    'children': [
                                      {
                                        'value': 0,
                                        'children': [
                                          {
                                            'value': 0,
                                            'children': [
                                              {
                                                'value': 0,
                                                'children': []
                                              }
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        'expected': 10
      },
      {
        'name': 'Wide maximum node count',
        'input': [
          {
            'value': 0,
            'children': Array.from({ length: 99 }, () => ({ value: 0, children: [] }))
          }
        ],
        'expected': 2
      }
    ]
  },
  {
    'id': 'algo-graph-reachable',
    'title': 'Follow connections to a destination',
    'category': 'Algorithm techniques',
    'prompt': 'Return whether target can be reached from start by following directed connections in graph. graph is an adjacency list: graph[i] lists the nodes you can visit directly from node i. Practise breadth-first search (BFS), visiting pending nodes in the order they were discovered.',
    'example': {
      'input': 'graphReachable([[1], [2], []], 0, 2)',
      'output': 'true'
    },
    'note': 'graph contains 0 to 100 nodes identified by indices 0 to graph.length - 1. Each list contains at most 100 valid node indices; duplicates, self-links, and cycles are allowed. start and target are integers from -1 to 100. Return false if either is outside the graph, including an empty graph. A valid node reaches itself without any connection. Preserve graph and its nested arrays. Route ties do not matter: return only a boolean. Checks do not prove BFS or queue order.',
    'vocabulary': [
      {
        'term': 'Adjacency list',
        'meaning': 'a list of outgoing neighbors for each node'
      },
      {
        'term': 'BFS',
        'meaning': 'exploring discovered nodes in first-in, first-out order'
      },
      {
        'term': 'Visited',
        'meaning': 'a node already discovered, which need not be queued again'
      }
    ],
    'planPrompt': 'What makes a node valid? How will you avoid repeating work around a cycle and handle start equal to target?',
    'starter': 'function graphReachable(graph: number[][], start: number, target: number): boolean {\n  // Write your solution here.\n  return false\n}\n',
    'functionName': 'graphReachable',
    'preserveInput': true,
    'hints': [
      'Trace a valid start equal to target, then an invalid start equal to target.',
      'Keep track of discovered nodes so a cycle cannot cause endless work.',
      'A queue separates discovering a neighbor from exploring its connections; decide when to mark a neighbor discovered.'
    ],
    'checks': [
      {
        'name': 'Indirect route',
        'input': [[[1], [2], []], 0, 2],
        'expected': true
      },
      {
        'name': 'Empty graph',
        'input': [[], 0, 0],
        'expected': false
      },
      {
        'name': 'Valid node reaches itself',
        'input': [[[]], 0, 0],
        'expected': true
      },
      {
        'name': 'Invalid equal endpoints',
        'input': [[[]], 1, 1],
        'expected': false
      },
      {
        'name': 'Negative start',
        'input': [[[]], -1, 0],
        'expected': false
      },
      {
        'name': 'Invalid target',
        'input': [[[]], 0, 1],
        'expected': false
      },
      {
        'name': 'Direction matters',
        'input': [[[1], []], 1, 0],
        'expected': false
      },
      {
        'name': 'Disconnected cycle',
        'input': [[[1], [0], []], 0, 2],
        'expected': false
      },
      {
        'name': 'Self links and repeated neighbors',
        'input': [[[0, 1, 1], [0, 2], []], 0, 2],
        'expected': true
      },
      {
        'name': 'Branch beyond dead end',
        'input': [[[1, 2], [], [3], []], 0, 3],
        'expected': true
      },
      {
        'name': 'Maximum length chain',
        'input': [Array.from({ length: 100 }, (_, i) => i < 99 ? [i + 1] : []), 0, 99],
        'expected': true
      },
      {
        'name': 'Maximum repeated neighbors',
        'input': [[Array(100).fill(1), []], 0, 1],
        'expected': true
      }
    ]
  }]
