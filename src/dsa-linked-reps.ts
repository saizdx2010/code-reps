import type { Rep } from './rep-types.ts'

type ListNode = { value: number; next: ListNode | null }
type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }

/** Builds a {value, next} list so checks read as value sequences. */
function list(...values: number[]): ListNode | null {
  return values.reduceRight<ListNode | null>((next, value) => ({ value, next }), null)
}
/** A binary tree node; omitted children are null. */
function node(value: number, left: TreeNode | null = null, right: TreeNode | null = null): TreeNode {
  return { value, left, right }
}

//          8
//        /   \
//       3     10
//      / \      \
//     1   6      14
//        / \    /
//       4   7  13
const searchTree = () => node(8, node(3, node(1), node(6, node(4), node(7))), node(10, null, node(14, node(13))))
//         540
//       /     \
//     480     600
//    /  \     /  \
//  420  510 570  660
const bookingTree = () => node(540, node(480, node(420), node(510)), node(600, node(570), node(660)))

const listNote =
  'The input is null or a finite list with no cycles of at most 1000 nodes. Values are integers from -1000 to 1000, including duplicates. Checks verify values and visible input preservation; creating fresh nodes and your costs are self-reviewed.'
const treeShape =
  'Nodes are {value, left, right}, with null for a missing child. Trees have at most 1000 nodes, no cycles or shared nodes, and may be unbalanced.'

export const dsaLinkedReps: Rep[] = [
  {
    id: 'list-insert-sorted',
    title: 'Insert into a sorted list without changing it',
    category: 'Problem-solving patterns',
    prompt:
      'Given the head of a list shaped {value, next} whose values are in nondecreasing order, return a new list that also contains value, still in nondecreasing order. Create every output node as a new object; do not reuse or change input nodes. Practice walking links and appending to the copy you are building.',
    example: {
      input: 'insertSorted({value: 1, next: {value: 4, next: null}}, 3)',
      output: '{value: 1, next: {value: 3, next: {value: 4, next: null}}}',
    },
    note: `${listNote} value is an integer in the same range. An empty list (null) returns a one-node list.`,
    vocabulary: [
      { term: 'Nondecreasing', meaning: 'each value is greater than or equal to the one before it' },
      { term: 'Tail', meaning: 'the last node of a list' },
      { term: 'Cursor', meaning: 'a variable that points at the node currently being visited' },
    ],
    planPrompt:
      'Where does the new value go when it is smaller than every value, larger than every value, or equal to one? How will you attach nodes to the end of the copy?',
    starter:
      'type ListNode = { value: number; next: ListNode | null }\nfunction insertSorted(head: ListNode | null, value: number): ListNode | null {\n  // Write your solution here.\n  return null\n}\n',
    functionName: 'insertSorted',
    preserveInput: true,
    hints: [
      'Walk the input from the head and copy each value into a new node as you go.',
      'The new value belongs immediately before the first input value that is greater than it. If no value is greater, it goes at the end.',
      'Keep a reference to the last node of the copy so each new node can be attached after it. Insert the new value exactly once, including when the input is empty.',
    ],
    checks: [
      { name: 'Inserts between two values', input: [list(1, 4), 3], expected: list(1, 3, 4) },
      { name: 'Inserts before every value', input: [list(2, 5), -1], expected: list(-1, 2, 5) },
      { name: 'Inserts after every value', input: [list(2, 5), 9], expected: list(2, 5, 9) },
      { name: 'Empty list gets one node', input: [null, 0], expected: list(0) },
      { name: 'Equal values stay together', input: [list(2, 2, 7), 2], expected: list(2, 2, 2, 7) },
      { name: 'Inserts between negative values and zero', input: [list(-3, 0), -1], expected: list(-3, -1, 0) },
      { name: 'Inserts into a one-node list', input: [list(6), 6], expected: list(6, 6) },
    ],
  },
  {
    id: 'list-remove-value',
    title: 'Remove matching values without changing a list',
    category: 'Problem-solving patterns',
    prompt:
      'Given the head of a list shaped {value, next} and a value, return a new list of the other values in their original order. Remove every node equal to value, including the head and adjacent matches. Return null when nothing remains. Create every output node as a new object; do not reuse or change input nodes.',
    example: {
      input: 'removeValue({value: 3, next: {value: 1, next: {value: 3, next: null}}}, 3)',
      output: '{value: 1, next: null}',
    },
    note: `${listNote} value is an integer in the same range and may be absent from the list.`,
    vocabulary: [
      { term: 'Head', meaning: 'the first node of a list' },
      { term: 'Placeholder node', meaning: 'a temporary node placed before the real head to simplify building a list' },
    ],
    planPrompt: 'What should the result be when the head matches, when two matches are adjacent, and when every node matches?',
    starter:
      'type ListNode = { value: number; next: ListNode | null }\nfunction removeValue(head: ListNode | null, value: number): ListNode | null {\n  // Write your solution here.\n  return null\n}\n',
    functionName: 'removeValue',
    preserveInput: true,
    hints: [
      'Visit every input node once; each one is either copied or skipped.',
      'The head of the result is the first node you keep, which may not be the input head.',
      'Attach each kept value after the last kept node. A placeholder node before the real head removes the special case for the first kept node.',
    ],
    checks: [
      { name: 'Removes the head and a later match', input: [list(3, 1, 3), 3], expected: list(1) },
      { name: 'Removes adjacent matches', input: [list(1, 2, 2, 2, 5), 2], expected: list(1, 5) },
      { name: 'Every node removed gives null', input: [list(4, 4), 4], expected: null },
      { name: 'Empty list stays empty', input: [null, 1], expected: null },
      { name: 'No match copies every value', input: [list(1, 0, -1), 9], expected: list(1, 0, -1) },
      { name: 'Removes zero values', input: [list(0, 1, 0), 0], expected: list(1) },
      { name: 'Removes the tail', input: [list(5, 6), 6], expected: list(5) },
    ],
  },
  {
    id: 'bst-search-path',
    title: 'Follow a search path in a binary search tree',
    category: 'Algorithm applications',
    prompt:
      'A binary search tree keeps smaller values in each node’s left subtree and larger values in its right subtree. Starting at root, compare target with each node and move left or right until you find target or reach a missing child. Return {path, found}: path lists the compared values in order, and found says whether target is in the tree. A null root returns {path: [], found: false}. Do not change any node.',
    brief: {
      summary: 'Implement searchPath(root, target) and return {path, found}.',
      rules: [
        'A binary search tree keeps smaller values in each node’s left subtree and larger values in its right subtree.',
        'Start at root and compare target with each node: equal ends the search, a smaller target moves left, and a larger target moves right.',
        'Stop when you find target or reach a missing child.',
        'path lists the compared values in order; found says whether target is in the tree.',
      ],
      edgeCases: ['A null root returns {path: [], found: false}.', 'Do not change any node.'],
    },
    example: {
      input: 'searchPath({value: 8, left: {value: 3, left: null, right: null}, right: {value: 10, left: null, right: null}}, 3)',
      output: '{path: [8, 3], found: true}',
    },
    note: `${treeShape} Values are unique integers from -1000 to 1000 and follow the ordering rule. target is an integer in the same range. Checks compare the path and input preservation.`,
    vocabulary: [
      {
        term: 'Binary search tree',
        meaning: 'a tree where every left-subtree value is smaller and every right-subtree value is larger than its node',
      },
      { term: 'Subtree', meaning: 'a node together with everything below it' },
      { term: 'Search path', meaning: 'the nodes compared, from the root down, while looking for a value' },
    ],
    planPrompt:
      'At each node, which three outcomes are possible? Predict the path for a target smaller than every value and for a missing value between two others.',
    starter:
      'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }\nfunction searchPath(root: TreeNode | null, target: number): { path: number[]; found: boolean } {\n  // Write your solution here.\n  return { path: [], found: false }\n}\n',
    functionName: 'searchPath',
    preserveInput: true,
    hints: [
      'Each comparison rules out one whole subtree, so you never need to look at both children.',
      'A smaller target moves left, a larger target moves right, and an equal value ends the search.',
      'Move a current-node reference down the tree and record each value before deciding where to go. When the current node is null, the path is complete and the target is absent.',
    ],
    checks: [
      { name: 'Finds a value two levels down', input: [searchTree(), 6], expected: { path: [8, 3, 6], found: true } },
      { name: 'Finds the root', input: [searchTree(), 8], expected: { path: [8], found: true } },
      { name: 'Finds a leaf on the right', input: [searchTree(), 13], expected: { path: [8, 10, 14, 13], found: true } },
      { name: 'Missing value stops at a missing child', input: [searchTree(), 5], expected: { path: [8, 3, 6, 4], found: false } },
      { name: 'Smaller than every value', input: [searchTree(), -1000], expected: { path: [8, 3, 1], found: false } },
      { name: 'Larger than every value', input: [searchTree(), 1000], expected: { path: [8, 10, 14], found: false } },
      { name: 'Empty tree', input: [null, 3], expected: { path: [], found: false } },
      {
        name: 'Unbalanced chain',
        input: [node(1, null, node(2, null, node(3, null, node(4)))), 4],
        expected: { path: [1, 2, 3, 4], found: true },
      },
      { name: 'Zero is a real value', input: [node(0, node(-5), node(5)), 0], expected: { path: [0], found: true } },
    ],
  },
  {
    id: 'bst-latest-at-or-before',
    title: 'Find the latest booking at or before a time',
    category: 'Algorithm applications',
    context:
      'A booking screen stores start times, in minutes after midnight, in a binary search tree. When someone asks about a time, it shows the latest booking that starts at or before it.',
    prompt:
      'Return the largest value in the tree that is less than or equal to time. Return null when every value is greater than time or the tree is empty. Do not change any node.',
    example: {
      input: 'latestAtOrBefore(root, 590), where root holds 420, 480, 510, 540, 570, 600, and 660',
      output: '570',
    },
    note: `${treeShape} Every value in a left subtree is smaller than its node and every value in a right subtree is larger. Values are unique integers from 0 to 1439; time is an integer from -1 to 1440.`,
    vocabulary: [
      { term: 'At or before', meaning: 'less than or equal to' },
      { term: 'Minutes after midnight', meaning: 'a time of day written as a number, where 0 is midnight and 540 is 9:00' },
    ],
    planPrompt: 'Predict the answer for a time equal to a booking, a time before every booking, and a time after every booking.',
    starter:
      'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }\nfunction latestAtOrBefore(root: TreeNode | null, time: number): number | null {\n  // Write your solution here.\n  return null\n}\n',
    functionName: 'latestAtOrBefore',
    preserveInput: true,
    hints: [
      'Compare the time with a node to decide which side could still hold a better answer.',
      'A node at or before the time is a possible answer, but a later one may still exist in its right subtree.',
      'Remember the best possible answer while walking down one path. When a node is after the time, only its left subtree can help.',
    ],
    checks: [
      { name: 'Finds a value between bookings', input: [bookingTree(), 590], expected: 570 },
      { name: 'An exact match counts', input: [bookingTree(), 600], expected: 600 },
      { name: 'Before every booking', input: [bookingTree(), 400], expected: null },
      { name: 'After every booking', input: [bookingTree(), 1440], expected: 660 },
      { name: 'Empty tree', input: [null, 500], expected: null },
      { name: 'Finds a later answer in a left subtree’s right side', input: [bookingTree(), 515], expected: 510 },
      { name: 'Midnight is a real booking', input: [node(0, null, node(30)), 10], expected: 0 },
      { name: 'Time before midnight', input: [node(0, null, node(30)), -1], expected: null },
      {
        name: 'Unbalanced tree',
        input: [node(100, node(90, node(80, node(70))), null), 85],
        expected: 80,
      },
    ],
  },
  {
    id: 'bst-check-order',
    title: 'Check a binary search tree’s ordering',
    category: 'Algorithm applications',
    context:
      'A teammate built a tree by hand for a test fixture. Before other tests rely on it as a binary search tree, confirm that it really follows the rule.',
    prompt:
      'Return true if every node’s value is greater than every value in its left subtree and less than every value in its right subtree. Return false otherwise. An empty tree is valid. The ordering is strict: an equal value on either side makes the tree invalid. Do not change any node.',
    example: {
      input: 'isOrdered({value: 5, left: {value: 3, left: null, right: null}, right: {value: 8, left: null, right: null}})',
      output: 'true',
    },
    note: `${treeShape} Values are integers from -1000 to 1000.`,
    vocabulary: [
      { term: 'Strict ordering', meaning: 'smaller or larger, never equal' },
      { term: 'Ancestor', meaning: 'a node above another node on its route from the root' },
    ],
    planPrompt:
      'Predict the result for an empty tree, a single node, and a node whose child has the same value. Then draw one invalid tree that is hard to spot.',
    starter:
      'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }\nfunction isOrdered(root: TreeNode | null): boolean {\n  // Write your solution here.\n  return false\n}\n',
    functionName: 'isOrdered',
    preserveInput: true,
    hints: [
      'Checking each node against only its direct children is not enough.',
      'Every ancestor limits the values allowed below it: going left sets an upper limit, and going right sets a lower one.',
      'Carry the allowed range down as you visit each node, narrowing it at each step, and fail as soon as a value falls outside it.',
    ],
    checks: [
      { name: 'Accepts a valid tree', input: [searchTree()], expected: true },
      { name: 'Empty tree is valid', input: [null], expected: true },
      { name: 'Single node is valid', input: [node(0)], expected: true },
      { name: 'Left-side grandchild above the root', input: [node(5, node(3, node(1), node(6)), node(8))], expected: false },
      { name: 'Right-side grandchild below the root', input: [node(5, node(3), node(8, node(4), node(9)))], expected: false },
      { name: 'Equal left child', input: [node(5, node(5))], expected: false },
      { name: 'Equal right child', input: [node(5, null, node(5))], expected: false },
      {
        name: 'Deep violation of the root’s limit',
        input: [node(10, node(5, node(2), node(8, node(6), node(12))), node(15))],
        expected: false,
      },
      { name: 'Unbalanced valid chain', input: [node(1, null, node(2, null, node(3)))], expected: true },
      { name: 'Extreme values are allowed', input: [node(-1000, null, node(1000))], expected: true },
      { name: 'Negative values', input: [node(-5, node(-10), node(0))], expected: true },
    ],
  },
  {
    id: 'list-merge-sorted',
    title: 'Merge two sorted linked lists',
    category: 'Problem-solving patterns',
    prompt:
      'Given the heads of two lists shaped {value, next}, each already in nondecreasing order, return one new list holding every value from both, still in nondecreasing order. Create every output node as a new object; do not reuse or change input nodes. Practice moving two cursors, one in each list, and always taking the smaller front value.',
    brief: {
      summary: 'Implement mergeSorted(a, b): merge two sorted lists into one new sorted list.',
      rules: [
        'Both inputs are lists shaped {value, next}, each in nondecreasing order.',
        'Return one list holding every value from both, still in nondecreasing order.',
        'Move one cursor through each list and always take the smaller front value.',
      ],
      edgeCases: [
        'Either list, or both, may be empty (null).',
        'Create every output node as a new object; do not reuse or change input nodes.',
      ],
    },
    example: {
      input: 'mergeSorted({value: 1, next: {value: 5, next: null}}, {value: 2, next: null})',
      output: '{value: 1, next: {value: 2, next: {value: 5, next: null}}}',
    },
    note: `${listNote} Either list, or both, may be empty (null). Equal values may come from either list; the result only needs to hold every value in order.`,
    vocabulary: [
      { term: 'Merge', meaning: 'combine two ordered sequences into one ordered sequence' },
      { term: 'Front value', meaning: 'the value at a cursor that has not been copied yet' },
      { term: 'Placeholder node', meaning: 'a temporary node placed before the real head to simplify building a list' },
    ],
    planPrompt:
      'What should happen when one list runs out before the other? Predict the result for two empty lists and for lists that share a value.',
    starter:
      'type ListNode = { value: number; next: ListNode | null }\nfunction mergeSorted(a: ListNode | null, b: ListNode | null): ListNode | null {\n  // Write your solution here.\n  return null\n}\n',
    functionName: 'mergeSorted',
    preserveInput: true,
    hints: [
      'Keep one cursor in each list. At every step, only the two front values can be the next smallest.',
      'Copy the smaller front value into a new node and advance only that cursor. When one cursor reaches null, every remaining value comes from the other list.',
      'Start the result at a placeholder node and keep a reference to its last node, so every copied value is an ordinary append. Return the node after the placeholder.',
    ],
    checks: [
      { name: 'Interleaves two lists', input: [list(1, 4, 5), list(2, 4)], expected: list(1, 2, 4, 4, 5) },
      { name: 'First list empty', input: [null, list(3, 7)], expected: list(3, 7) },
      { name: 'Second list empty', input: [list(-2, 0), null], expected: list(-2, 0) },
      { name: 'Both lists empty', input: [null, null], expected: null },
      { name: 'Every value of one list comes first', input: [list(8, 9), list(1, 2, 3)], expected: list(1, 2, 3, 8, 9) },
      { name: 'Shared values are all kept', input: [list(2, 2), list(2)], expected: list(2, 2, 2) },
      { name: 'Negative and zero values', input: [list(-5, 0, 5), list(-1, 0)], expected: list(-5, -1, 0, 0, 5) },
      { name: 'Lists of different lengths', input: [list(6), list(1, 3, 5, 7, 9)], expected: list(1, 3, 5, 6, 7, 9) },
    ],
  },
  {
    id: 'list-split-at-first',
    title: 'Split a playlist at a track',
    category: 'Problem-solving patterns',
    context:
      'A music app stores a playlist as linked nodes, one track ID per node. "Play from here" splits the playlist so the chosen track and everything after it plays now, and the earlier tracks wait.',
    prompt:
      'Return {before, from}. from is a new list starting at the first node whose value equals track and continuing to the end. before is a new list of the values that come earlier. When track is absent, before holds every value and from is null. Use null for an empty part. Create every output node as a new object; do not reuse or change input nodes.',
    brief: {
      summary: 'Implement splitAtTrack(head, track) and return {before, from}.',
      rules: [
        'from is a new list starting at the first node whose value equals track and running to the end.',
        'before is a new list of the values that come earlier.',
        'Track IDs may repeat: split at the first match only.',
      ],
      edgeCases: [
        'When track is absent, before holds every value and from is null. Use null for any empty part.',
        'Create every output node as a new object; do not reuse or change input nodes.',
      ],
    },
    example: {
      input: 'splitAtTrack({value: 4, next: {value: 9, next: {value: 2, next: null}}}, 9)',
      output: '{before: {value: 4, next: null}, from: {value: 9, next: {value: 2, next: null}}}',
    },
    note: `${listNote} Track IDs may repeat; split at the first match only. track is an integer in the same range.`,
    vocabulary: [
      { term: 'Track ID', meaning: 'a number that identifies one song in the playlist' },
      { term: 'First match', meaning: 'the earliest node whose value equals the one you are looking for' },
    ],
    planPrompt:
      'Predict both parts when the first track matches, when the last track matches, when the track repeats, and when it is absent.',
    starter:
      'type ListNode = { value: number; next: ListNode | null }\nfunction splitAtTrack(head: ListNode | null, track: number): { before: ListNode | null; from: ListNode | null } {\n  // Write your solution here.\n  return { before: null, from: null }\n}\n',
    functionName: 'splitAtTrack',
    preserveInput: true,
    hints: [
      'Every value belongs to exactly one part, and which part depends only on whether the first match has been seen yet.',
      'Once the first match is found, later matches stay in the second part with everything else.',
      'Build two copies at once, each with its own last node, and switch which copy receives values the moment the first match appears.',
    ],
    checks: [
      {
        name: 'Splits in the middle',
        input: [list(4, 9, 2), 9],
        expected: { before: list(4), from: list(9, 2) },
      },
      {
        name: 'First track matches',
        input: [list(7, 1, 3), 7],
        expected: { before: null, from: list(7, 1, 3) },
      },
      {
        name: 'Last track matches',
        input: [list(5, 6, 8), 8],
        expected: { before: list(5, 6), from: list(8) },
      },
      {
        name: 'Repeated track splits at the first match',
        input: [list(1, 3, 2, 3, 4), 3],
        expected: { before: list(1), from: list(3, 2, 3, 4) },
      },
      {
        name: 'Absent track keeps every value before',
        input: [list(1, 2), 5],
        expected: { before: list(1, 2), from: null },
      },
      { name: 'Empty playlist', input: [null, 4], expected: { before: null, from: null } },
      {
        name: 'Track zero is a real track',
        input: [list(-1, 0, 1), 0],
        expected: { before: list(-1), from: list(0, 1) },
      },
    ],
  },
  {
    id: 'list-rotate-route',
    title: 'Rotate a delivery route',
    category: 'Problem-solving patterns',
    context:
      'A courier’s stops are stored as linked nodes in visiting order. When the depot changes, the dispatcher moves the last few stops to the front so the route starts nearer the new depot.',
    prompt:
      'Return a new list where the last k stops have moved, in their original order, to the front. Every other stop follows in its original order. k may be zero or larger than the number of stops; moving every stop to the front leaves the order unchanged, so only k modulo the number of stops matters. Create every output node as a new object; do not reuse or change input nodes.',
    brief: {
      summary: 'Implement rotateRoute(head, k): move the last k stops, in order, to the front.',
      rules: [
        'Every other stop follows in its original order.',
        'Moving every stop to the front leaves the order unchanged, so only k modulo the number of stops matters.',
        'k is an integer from 0 to 1000000.',
      ],
      edgeCases: [
        'k may be zero or larger than the number of stops. An empty route returns null.',
        'Create every output node as a new object; do not reuse or change input nodes.',
      ],
    },
    example: {
      input: 'rotateRoute({value: 1, next: {value: 2, next: {value: 3, next: {value: 4, next: null}}}}, 1)',
      output: '{value: 4, next: {value: 1, next: {value: 2, next: {value: 3, next: null}}}}',
    },
    note: `${listNote} k is an integer from 0 to 1000000. An empty route returns null.`,
    vocabulary: [
      { term: 'Rotate', meaning: 'move items from one end of a sequence to the other while keeping their order' },
      { term: 'Modulo', meaning: 'the remainder after division; 7 modulo 3 is 1' },
    ],
    planPrompt:
      'Predict the result for k = 0, k equal to the number of stops, and k one more than it. Then name the stop that ends up first in general.',
    starter:
      'type ListNode = { value: number; next: ListNode | null }\nfunction rotateRoute(head: ListNode | null, k: number): ListNode | null {\n  // Write your solution here.\n  return null\n}\n',
    functionName: 'rotateRoute',
    preserveInput: true,
    hints: [
      'You cannot know where the last k stops begin until you know how many stops there are.',
      'Reduce k first. Once it is smaller than the length, the stop at position length minus k becomes the new first stop.',
      'Copy from that position to the end, then continue copying from the head up to the position. A large k must not make you walk the list a million times.',
    ],
    checks: [
      { name: 'Moves one stop to the front', input: [list(1, 2, 3, 4), 1], expected: list(4, 1, 2, 3) },
      { name: 'Moves two stops in order', input: [list(1, 2, 3, 4), 2], expected: list(3, 4, 1, 2) },
      { name: 'k of zero keeps the order', input: [list(5, 6, 7), 0], expected: list(5, 6, 7) },
      { name: 'k equal to the length keeps the order', input: [list(5, 6, 7), 3], expected: list(5, 6, 7) },
      { name: 'k larger than the length wraps around', input: [list(5, 6, 7), 4], expected: list(7, 5, 6) },
      { name: 'Very large k', input: [list(1, 2, 3), 1000000], expected: list(3, 1, 2) },
      { name: 'Empty route', input: [null, 3], expected: null },
      { name: 'Single stop', input: [list(9), 5], expected: list(9) },
      { name: 'Repeated and zero stops', input: [list(0, 2, 0, 2), 1], expected: list(2, 0, 2, 0) },
    ],
  },
  {
    id: 'bst-insert-value',
    title: 'Insert a booking time into a binary search tree',
    category: 'Algorithm applications',
    context:
      'The booking screen keeps start times in a binary search tree. A new booking must go where a later search will find it, without disturbing the tree other screens are still reading.',
    prompt:
      'Return the root of a binary search tree that holds every value of root plus time. Place time where a search for it would end at a missing child. If time is already in the tree, return a tree with the same values and shape. Do not change any input node: create new nodes along the path from the root to the new value. Subtrees you do not change may be reused as they are.',
    brief: {
      summary: 'Implement insertTime(root, time): return a binary search tree that also holds time.',
      rules: [
        'Place time where a search for it would end at a missing child.',
        'Do not change any input node: create new nodes along the path from the root to the new value.',
        'Subtrees you do not change may be reused as they are.',
      ],
      edgeCases: [
        'If time is already in the tree, return a tree with the same values and shape.',
        'An empty tree (null) returns a single node.',
      ],
    },
    example: {
      input: 'insertTime({value: 540, left: null, right: null}, 600)',
      output: '{value: 540, left: null, right: {value: 600, left: null, right: null}}',
    },
    note: `${treeShape} Values are unique integers from 0 to 1439 that follow the ordering rule; time is an integer in the same range. An empty tree (null) returns a single node. Checks compare the returned shape and input preservation; reusing unchanged subtrees is allowed but not required.`,
    vocabulary: [
      { term: 'Insertion point', meaning: 'the missing child where a search for the new value ends' },
      { term: 'Path copying', meaning: 'creating new nodes only along the route that changes, and sharing everything else' },
    ],
    planPrompt:
      'Predict where 500 goes in a tree rooted at 540 whose left child is 480. Which nodes are on the path, and which subtrees never change?',
    starter:
      'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }\nfunction insertTime(root: TreeNode | null, time: number): TreeNode | null {\n  // Write your solution here.\n  return root\n}\n',
    functionName: 'insertTime',
    preserveInput: true,
    hints: [
      'The new value goes exactly where a search for it would fall off the tree.',
      'Only the nodes on that search path need new versions; a node off the path can be reused unchanged.',
      'For each node on the path, return a new node with the same value whose child on the search side is the result of inserting into that child. A missing child becomes the new one-node tree.',
    ],
    checks: [
      {
        name: 'Inserts below a left subtree’s right child',
        input: [bookingTree(), 500],
        expected: node(540, node(480, node(420), node(510, node(500))), node(600, node(570), node(660))),
      },
      {
        name: 'Inserts after every booking',
        input: [bookingTree(), 700],
        expected: node(540, node(480, node(420), node(510)), node(600, node(570), node(660, null, node(700)))),
      },
      {
        name: 'Inserts before every booking',
        input: [bookingTree(), 400],
        expected: node(540, node(480, node(420, node(400)), node(510)), node(600, node(570), node(660))),
      },
      { name: 'Existing time keeps the same tree', input: [bookingTree(), 570], expected: bookingTree() },
      { name: 'Empty tree gets one node', input: [null, 540], expected: node(540) },
      { name: 'Midnight is a real time', input: [node(30), 0], expected: node(30, node(0)) },
      {
        name: 'Unbalanced chain',
        input: [node(100, node(90, node(80))), 85],
        expected: node(100, node(90, node(80, null, node(85)))),
      },
    ],
  },
  {
    id: 'bst-range-values',
    title: 'List bookings in a time range',
    category: 'Algorithm applications',
    context:
      'A day view shows only the bookings that start inside the visible hours. The bookings live in a binary search tree of start times.',
    prompt:
      'Return every value in the tree from start to end, inclusive, in increasing order. Return [] when start is greater than end or nothing falls in the range. Do not change any node.',
    example: {
      input: 'bookingsBetween(root, 480, 570), where root holds 420, 480, 510, 540, 570, 600, and 660',
      output: '[480, 510, 540, 570]',
    },
    note: `${treeShape} Values are unique integers from 0 to 1439 that follow the ordering rule; start and end are integers from -1 to 1440. Checks compare the returned values, not how many nodes you visit.`,
    vocabulary: [
      { term: 'Inclusive', meaning: 'a range that contains both of its end values' },
      { term: 'In-order', meaning: 'visiting a left subtree, then the node, then the right subtree' },
    ],
    planPrompt:
      'Predict the answer for a range that holds one value exactly, a range between two values, and a range where start is greater than end.',
    starter:
      'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }\nfunction bookingsBetween(root: TreeNode | null, start: number, end: number): number[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'bookingsBetween',
    preserveInput: true,
    hints: [
      'Some visiting orders produce values in increasing order without sorting afterwards.',
      'A node below start cannot have anything useful in its left subtree; a node above end cannot have anything useful in its right subtree.',
      'Visit left, then the node, then right, but skip a side whenever the node’s value proves that side is entirely outside the range.',
    ],
    checks: [
      { name: 'Lists a middle range', input: [bookingTree(), 480, 570], expected: [480, 510, 540, 570] },
      { name: 'Range between two bookings', input: [bookingTree(), 500, 520], expected: [510] },
      { name: 'One exact booking', input: [bookingTree(), 600, 600], expected: [600] },
      { name: 'Range after every booking', input: [bookingTree(), 700, 800], expected: [] },
      { name: 'Whole day', input: [bookingTree(), -1, 1440], expected: [420, 480, 510, 540, 570, 600, 660] },
      { name: 'Start after end', input: [bookingTree(), 600, 500], expected: [] },
      { name: 'Empty tree', input: [null, 0, 1439], expected: [] },
      { name: 'Midnight is inside the range', input: [node(30, node(0), node(60)), 0, 30], expected: [0, 30] },
    ],
  },
  {
    id: 'bst-nearest-slot',
    title: 'Find the booking nearest a requested time',
    category: 'Algorithm applications',
    context:
      'When someone asks for a time that is already taken, the booking screen suggests the existing booking closest to it so they can join or avoid it.',
    prompt:
      'Return the value in the tree with the smallest distance to time. When two values are equally close, return the smaller one. Return null for an empty tree. Do not change any node.',
    example: {
      input: 'nearestBooking(root, 530), where root holds 420, 480, 510, 540, 570, 600, and 660',
      output: '540',
    },
    note: `${treeShape} Values are unique integers from 0 to 1439 that follow the ordering rule; time is an integer from 0 to 1439.`,
    vocabulary: [
      { term: 'Distance', meaning: 'the absolute difference between two times' },
      { term: 'Tie', meaning: 'two candidates that are equally good by the main rule' },
    ],
    planPrompt: 'Predict the answer for an exact match, a time halfway between two bookings, and a time before every booking.',
    starter:
      'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }\nfunction nearestBooking(root: TreeNode | null, time: number): number | null {\n  // Write your solution here.\n  return null\n}\n',
    functionName: 'nearestBooking',
    preserveInput: true,
    hints: [
      'The closest value is either the largest one at or before time or the smallest one at or after it.',
      'Both candidates lie on the single route a search for time would follow.',
      'Keep the best value seen so far while walking that route, replacing it when a node is closer, or equally close and smaller.',
    ],
    checks: [
      { name: 'Closer to the later booking', input: [bookingTree(), 530], expected: 540 },
      { name: 'Halfway picks the earlier booking', input: [bookingTree(), 525], expected: 510 },
      { name: 'Exact match', input: [bookingTree(), 600], expected: 600 },
      { name: 'Before every booking', input: [bookingTree(), 0], expected: 420 },
      { name: 'After every booking', input: [bookingTree(), 1439], expected: 660 },
      { name: 'Empty tree', input: [null, 500], expected: null },
      { name: 'Tie involving midnight', input: [node(0, null, node(30)), 15], expected: 0 },
      { name: 'Unbalanced chain', input: [node(100, node(90, node(80, node(70)))), 76], expected: 80 },
    ],
  },
]
