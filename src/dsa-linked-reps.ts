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
]
