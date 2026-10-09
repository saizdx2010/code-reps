import type { Rep } from './rep.ts'
import type { RepDepth } from './rep-depth.ts'

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
    'hints': ['An array declared with const can still receive items.', 'Spread into a new array before changing it.', 'Use const copy: number[] = [...numbers], copy.push(extra), then return copy[copy.length - 1].'],
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
    'hints': ['A Set keeps one copy of each numeric value.', 'Adding an existing value and deleting a missing value are allowed.', 'Use new Set<number>(numbers), then add(extra), delete(removed), and return size.'],
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
    'hints': ['A map associates a key with a value; setting a key again replaces its value.', 'Zero is a stored value, not a missing entry.', 'Create a Map from entries, set(key, value), then return map.get(query) ?? null. You can also check has(query) first.'],
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
    'hints': ['Last in, first out means the most recently pushed item leaves first.', 'Copy before pushing and popping. Peek does not remove an item.', 'Use [...numbers], push(extra), pop(), then return stack[stack.length - 1] ?? null.'],
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
    'hints': ['A queue removes the oldest item, rather than the newest.', 'push appends; shift removes the first item.', 'Copy, push(extra), shift(), then return queue[0] ?? null.'],
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
    'hints': ['Track the remaining interval with inclusive left and right indices.', 'Use Math.floor((left + right) / 2); discard the middle too when it does not match.', 'While left <= right, return middle on equality; use left = middle + 1 for a smaller middle value, otherwise right = middle - 1. Return -1 after exhaustion.'],
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

export const dsaDepth: Record<string, RepDepth> = {

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
    'traceSteps': {
      'code': [
        'type NestedNumber = number | NestedNumber[]; function recursiveSum(items: NestedNumber[]): number {',
        '  let total = 0',
        '  for (const item of items) {',
        '    if (Array.isArray(item)) total += recursiveSum(item)',
        '    else total += item',
        '  }',
        '  return total',
        '}'
      ],
      'input': 'items = [1, [2, [], [-3]], 4]',
      'steps': [
        {
          'line': 1,
          'vars': {
            'total': 0
          },
          'note': 'Start the outer call with an empty total.'
        },
        {
          'line': 4,
          'vars': {
            'total': 1
          },
          'note': 'The outer number 1 contributes directly.'
        },
        {
          'line': 6,
          'vars': {
            'total': 0,
            'call': '[]'
          },
          'note': 'An empty nested list has no iterations and returns 0.'
        },
        {
          'line': 6,
          'vars': {
            'total': -3,
            'call': '[-3]'
          },
          'note': 'The deepest number contributes -3.'
        },
        {
          'line': 3,
          'vars': {
            'total': 0,
            'nestedSum': -1
          },
          'note': 'The middle call returns -1; the outer total becomes 1 + -1 = 0.'
        },
        {
          'line': 6,
          'vars': {
            'result': 4,
            'total': 4
          },
          'note': 'Add the final outer 4 and return 4.'
        }
      ]
    }
  },
  'algo-tree-depth': {
    'reasoning': 'A leaf contributes one node. Each parent contributes one plus its largest child depth because a route follows a single child, not all siblings. Null has no nodes and returns zero.',
    'trace': 'For a root with a leaf child and another child containing a leaf, child depths are 1 and 2. The root returns 1 + max(1, 2) = 3, even if its value is zero.',
    'alternative': 'A breadth-first traversal can count whole levels instead. Both visit O(n) nodes; recursive traversal needs O(d) call depth, while a level queue may hold O(n) nodes in a wide tree.',
    'counterexample': 'Adding sibling depths measures something else: a root with two leaves has depth 2, not 3. Counting edges gives 0 for a leaf, but this contract counts nodes.',
    'transfer': 'Self-review: return the values along a deepest route. Define a tie rule for equal-depth routes before changing the implementation.',
    'traceSteps': {
      'code': [
        'type TreeNode = {value: number; children: TreeNode[]}; function treeDepth(root: TreeNode | null): number {',
        '  if (root === null) return 0',
        '  let deepest = 0',
        '  for (const child of root.children) {',
        '    deepest = Math.max(deepest, treeDepth(child))',
        '  }',
        '  return 1 + deepest',
        '}'
      ],
      'input': 'root = {value: 0, children: [{value: 7, children: []}, {value: 2, children: [{value: 3, children: []}]}]}',
      'steps': [
        {
          'line': 2,
          'vars': {
            'deepest': 0,
            'node': 0
          },
          'note': 'The root begins with no child depth.'
        },
        {
          'line': 6,
          'vars': {
            'node': 7,
            'depth': 1
          },
          'note': 'The first child is a leaf and returns 1.'
        },
        {
          'line': 4,
          'vars': {
            'node': 0,
            'deepest': 1
          },
          'note': 'The root records the first child depth.'
        },
        {
          'line': 6,
          'vars': {
            'node': 3,
            'depth': 1
          },
          'note': 'The grandchild is also a leaf.'
        },
        {
          'line': 6,
          'vars': {
            'node': 2,
            'depth': 2
          },
          'note': 'The second child adds itself to the grandchild depth.'
        },
        {
          'line': 6,
          'vars': {
            'result': 3,
            'node': 0,
            'deepest': 2
          },
          'note': 'The root adds one to the larger child depth.'
        }
      ]
    }
  },
  'algo-graph-reachable': {
    'reasoning': 'Validate endpoints before accepting equality. Every queued node is reachable from start. Marking nodes when queued prevents repeated discovery; exploring all reachable nodes finds target or exhausts the queue.',
    'trace': 'For [[1], [0], []], start 0, target 2: queue [0], discover 1, then explore 1. Its neighbor 0 is already seen. The queue ends without 2, so return false.',
    'alternative': 'Depth-first search with a stack also answers reachability but explores in a different order. BFS with a head index visits O(V + E) reachable nodes and listed edges, using O(V) extra space; repeatedly shifting an array can add copying work.',
    'counterexample': 'Returning true for start === target before validation accepts an empty graph with 0, 0. Treating connections as undirected incorrectly allows node 1 to reach 0 in [[1], []].',
    'transfer': 'Self-review: return the minimum number of connections instead of a boolean. Explain why BFS order matters and define the unreachable result.',
    'traceSteps': {
      'code': [
        'function graphReachable(graph: number[][], start: number, target: number): boolean {',
        '  if (start < 0 || target < 0 || start >= graph.length || target >= graph.length) return false',
        '  const queue = [start], seen = new Set([start])',
        '  let found = false',
        '  for (let head = 0; head < queue.length; head++) {',
        '    const node = queue[head]',
        '    if (node === target) { found = true; break }',
        '    for (const next of graph[node]) if (!seen.has(next)) { seen.add(next); queue.push(next) }',
        '  }',
        '  return found',
        '}'
      ],
      'input': 'graph = [[1], [0], []], start = 0, target = 2',
      'steps': [
        {
          'line': 1,
          'vars': {
            'start': 0,
            'target': 2
          },
          'note': 'Both endpoints are valid.'
        },
        {
          'line': 2,
          'vars': {
            'queue': '[0]',
            'seen': '{0}'
          },
          'note': 'Discover the start before exploring it.'
        },
        {
          'line': 5,
          'vars': {
            'head': 0,
            'node': 0
          },
          'note': 'Explore node 0.'
        },
        {
          'line': 7,
          'vars': {
            'queue': '[0, 1]',
            'seen': '{0, 1}'
          },
          'note': 'Discover and enqueue node 1 once.'
        },
        {
          'line': 7,
          'vars': {
            'head': 1,
            'node': 1,
            'queue': '[0, 1]'
          },
          'note': 'Node 1 points back to seen node 0; enqueue nothing.'
        },
        {
          'line': 9,
          'vars': {
            'result': false
          },
          'note': 'The queue is exhausted; node 2 is unreachable.'
        }
      ]
    }
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
    'transfer': 'Return whether a requested number is present after the updates. Practise has and distinguish membership from size.'
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
    'transfer': 'Allow duplicates and require the first matching index. Explain why finding any match is no longer enough.'
  }
}

export const dsaGuides = {

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
  }
}
