import type { RepDepth, TraceTreeNode } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

const insertState = (copy: string, inserted: boolean, eventIndex?: number) => ({
  kind: 'state' as const,
  entries: [
    ['copy', copy],
    ['inserted', inserted],
  ] as [string, string | boolean][],
  events: ['2', '4', '6'],
  ...(eventIndex === undefined ? {} : { eventIndex }),
})

// The search tree from bst-search-path, drawn with its children in left-to-right order.
// 10 has only a right child (14), and 14 only a left child (13); the first step note says so.
const searchTree = (notes: Record<string, string> = {}): TraceTreeNode => {
  const at = (id: string, value: number, children?: TraceTreeNode[]): TraceTreeNode => ({
    id,
    value,
    ...(notes[id] ? { note: notes[id] } : {}),
    ...(children ? { children } : {}),
  })
  return at('n8', 8, [at('n3', 3, [at('n1', 1), at('n6', 6, [at('n4', 4), at('n7', 7)])]), at('n10', 10, [at('n14', 14, [at('n13', 13)])])])
}

// The invalid tree from the bst-check-order trace: 6 sits in the left subtree of 5.
const orderTree = (notes: Record<string, string> = {}): TraceTreeNode => {
  const at = (id: string, value: number, children?: TraceTreeNode[]): TraceTreeNode => ({
    id,
    value,
    ...(notes[id] ? { note: notes[id] } : {}),
    ...(children ? { children } : {}),
  })
  return at('n5', 5, [at('n3', 3, [at('n1', 1), at('n6', 6)]), at('n8', 8)])
}

export const dsaLinkedDepth: Record<string, RepDepth> = {
  'list-insert-sorted': {
    reasoning:
      'The copy is built front to back, so after each input node it holds exactly the values visited so far, plus the new value once it has been placed. Placing the new value before the first strictly greater input value keeps the order nondecreasing; if none is greater, it belongs at the end.',
    trace:
      'For 2 → 4 → 6 and value 5: copy 2, copy 4, then 6 is the first greater value, so append 5 before copying 6. For an empty list the loop never runs, so the value is appended afterwards.',
    traceSteps: {
      code: [
        'type ListNode = { value: number; next: ListNode | null }',
        'function insertSorted(head: ListNode | null, value: number): ListNode | null {',
        '  const placeholder: ListNode = { value: 0, next: null }',
        '  let tail = placeholder',
        '  const append = (v: number) => (tail = tail.next = { value: v, next: null })',
        '  let inserted = false',
        '  for (let current = head; current !== null; current = current.next) {',
        '    if (!inserted && value < current.value) { append(value); inserted = true }',
        '    append(current.value)',
        '  }',
        '  if (!inserted) append(value)',
        '  return placeholder.next',
        '}',
      ],
      input: 'head = {value: 2, next: {value: 4, next: {value: 6, next: null}}}, value = 5',
      steps: [
        {
          line: 5,
          vars: { value: 5 },
          structure: insertState('(empty)', false),
          note: 'The placeholder sits before the real head of the copy, so appending the first node needs no special case.',
        },
        {
          line: 8,
          vars: { current: 2 },
          structure: insertState('2', false, 0),
          note: '5 is not smaller than 2, so copy 2 into a new node and attach it at the tail.',
        },
        {
          line: 8,
          vars: { current: 4 },
          structure: insertState('2 → 4', false, 1),
          note: '5 is not smaller than 4 either. The input nodes are only read, never relinked.',
        },
        {
          line: 7,
          vars: { current: 6 },
          structure: insertState('2 → 4 → 5', true, 2),
          note: '6 is the first value greater than 5, so 5 goes in now, before 6 is copied.',
        },
        {
          line: 8,
          vars: { current: 6 },
          structure: insertState('2 → 4 → 5 → 6', true, 2),
          note: 'Then copy 6. inserted stops 5 from being added again later.',
        },
        {
          line: 10,
          vars: { inserted: true },
          structure: insertState('2 → 4 → 5 → 6', true, 2),
          note: 'The loop has ended. 5 was already placed, so nothing is appended at the end.',
        },
        {
          line: 11,
          vars: { result: '{"value":2,"next":{"value":4,"next":{"value":5,"next":{"value":6,"next":null}}}}' },
          structure: insertState('2 → 4 → 5 → 6', true, 2),
          note: 'Return the node after the placeholder. Every returned node is new; the input still reads 2 → 4 → 6.',
        },
      ],
    },
    alternative:
      'Recursion can copy the list: insert into the rest, then prepend a fresh node. It reads naturally but uses O(n) call frames. Mutating the input by relinking one node is O(1) extra space after finding the position, but this contract forbids changing caller-owned nodes. Either way, finding the position is O(n).',
    counterexample:
      'Returning a list that reuses the input nodes after the insertion point passes value checks but shares nodes with the caller. Forgetting the empty list returns null instead of a one-node list, and forgetting the end case drops a value larger than every input value.',
    transfer:
      'Insert several sorted values in one pass, or keep the list in nonincreasing order instead. Decide where equal values go and whether that is observable. This changed contract is self-reviewed.',
  },
  'list-remove-value': {
    reasoning:
      'After each input node, the copy holds exactly the non-matching values visited so far, in order. The placeholder makes the first kept node an ordinary append, so a matching head needs no special branch.',
    trace:
      'For 1 → 2 → 2 → 2 → 5 removing 2: keep 1, skip three 2s, keep 5, giving 1 → 5. For 4 → 4 removing 4, nothing is kept, so placeholder.next is still null.',
    alternative:
      'A recursive copy returns the rest of the result and prepends the current value only when it does not match. Building an array of kept values and then linking it is easy to check but stores the values twice.',
    counterexample:
      'Advancing past only one node after a match can be correct in a copy, but in an in-place version it skips the second of two adjacent matches. Returning the original head when it matches leaves the removed value in the result.',
    transfer:
      'Remove only the first match, or remove values in a range. Decide what happens when the head is removed and when nothing matches. This changed contract is self-reviewed.',
  },
  'bst-search-path': {
    reasoning:
      'The ordering rule means a target smaller than a node can only be in its left subtree, and a larger target only in its right subtree. Each comparison therefore discards one whole subtree, and the search ends at the target or at a missing child where it would have to be.',
    trace:
      'Searching for 5: 5 < 8 goes left to 3, 5 > 3 goes right to 6, 5 < 6 goes left to 4, and 5 > 4 goes right to a missing child. The path is [8, 3, 6, 4] and found is false. Nodes 1, 7, 10, 13, and 14 are never compared.',
    traceSteps: {
      code: [
        'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }',
        'function searchPath(root: TreeNode | null, target: number): { path: number[]; found: boolean } {',
        '  const path: number[] = []',
        '  let current = root',
        '  while (current !== null) {',
        '    path.push(current.value)',
        '    if (target === current.value) return { path, found: true }',
        '    current = target < current.value ? current.left : current.right',
        '  }',
        '  return { path, found: false }',
        '}',
      ],
      input:
        'root = {value: 8, left: {value: 3, left: {value: 1, left: null, right: null}, right: {value: 6, left: {value: 4, left: null, right: null}, right: {value: 7, left: null, right: null}}}, right: {value: 10, left: null, right: {value: 14, left: {value: 13, left: null, right: null}, right: null}}}, target = 5',
      steps: [
        {
          line: 3,
          vars: { target: 5, path: '[]' },
          structure: { kind: 'tree', root: searchTree(), current: 'n8' },
          note: 'Start at the root. Smaller values are always to the left of a node, larger values to the right. Here 10 has only a right child, 14, and 14 only a left child, 13.',
        },
        {
          line: 7,
          vars: { compared: 8, path: '[8]' },
          structure: { kind: 'tree', root: searchTree({ n8: '5 < 8' }), current: 'n3', visited: ['n8'] },
          note: '5 is smaller than 8, so it can only be in the left subtree. The whole right side, 10, 14, and 13, is ruled out.',
        },
        {
          line: 7,
          vars: { compared: 3, path: '[8,3]' },
          structure: { kind: 'tree', root: searchTree({ n8: '5 < 8', n3: '5 > 3' }), current: 'n6', visited: ['n8', 'n3'] },
          note: '5 is larger than 3, so go right. Node 1 is never visited.',
        },
        {
          line: 7,
          vars: { compared: 6, path: '[8,3,6]' },
          structure: {
            kind: 'tree',
            root: searchTree({ n8: '5 < 8', n3: '5 > 3', n6: '5 < 6' }),
            current: 'n4',
            visited: ['n8', 'n3', 'n6'],
          },
          note: '5 is smaller than 6, so go left to 4.',
        },
        {
          line: 7,
          vars: { compared: 4, path: '[8,3,6,4]', current: null },
          structure: {
            kind: 'tree',
            root: searchTree({ n8: '5 < 8', n3: '5 > 3', n6: '5 < 6', n4: '5 > 4' }),
            visited: ['n8', 'n3', 'n6', 'n4'],
          },
          note: '5 is larger than 4, but 4 has no right child. If 5 were in the tree, it would have to be exactly there.',
        },
        {
          line: 9,
          vars: { result: '{"path":[8,3,6,4],"found":false}' },
          structure: {
            kind: 'tree',
            root: searchTree({ n8: '5 < 8', n3: '5 > 3', n6: '5 < 6', n4: '5 > 4' }),
            visited: ['n8', 'n3', 'n6', 'n4'],
          },
          note: 'The loop ends at a missing child, so 5 is absent. Four of the nine nodes were compared.',
        },
      ],
    },
    alternative:
      'A recursive search is equally clear and uses O(h) call frames for a tree of height h. Searching every node also finds the target, but it costs O(n) and does not produce the search path the contract asks for.',
    counterexample:
      'Testing the target with if (current.value) instead of current !== null stops at a node whose value is 0. Moving right on equality instead of stopping walks past the target and reports it as missing.',
    transfer:
      'Return the depth at which the search ended, or the last node compared. Decide how each answer differs for a found and a missing target. This changed contract is self-reviewed.',
  },
  'bst-latest-at-or-before': {
    reasoning:
      'A node at or before time is a valid answer, and any better answer must be larger, so it can only be in that node’s right subtree. A node after time cannot be the answer, and neither can anything to its right, so only its left subtree can help. Keeping the best valid answer seen so far along one path finds the largest value at or before time.',
    trace:
      'For time 515: 540 is after it, so go left to 480. 480 is at or before 515, so it becomes the best answer; go right to 510. 510 is also at or before 515 and larger, so it replaces 480. 510 has no right child, so return 510.',
    alternative:
      'An in-order traversal lists the values in sorted order, and the last value at or before time is the answer. That visits every node in O(n) time, while following one path costs O(h). A sorted array with binary search gives the same answer, but keeping it sorted under inserts is costly.',
    counterexample:
      'Stopping at the first node at or before time returns 480 instead of 510 for time 515. Using if (best) to test for an answer treats a booking at midnight, value 0, as no booking.',
    transfer:
      'Find the earliest booking at or after a time instead. Decide which subtree to discard at each node and how equality is handled. This changed contract is self-reviewed.',
  },
  'bst-check-order': {
    reasoning:
      'Every ancestor limits the values below it: moving left from a node sets an upper limit, and moving right sets a lower one. Passing that open range down, and narrowing it at each step, checks each node against all its ancestors at once rather than only its parent.',
    trace:
      'For 5 with left child 3, whose right child is 6: 5 is within (-∞, ∞). 3 is within (-∞, 5). 6 must be within (3, 5), but 6 ≥ 5, so the tree is invalid, even though 6 > 3 looks correct for its parent.',
    traceSteps: {
      code: [
        'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }',
        'function isOrdered(root: TreeNode | null): boolean {',
        '  const within = (node: TreeNode | null, low: number, high: number): boolean => {',
        '    if (node === null) return true',
        '    if (node.value <= low || node.value >= high) return false',
        '    return within(node.left, low, node.value) && within(node.right, node.value, high)',
        '  }',
        '  return within(root, -Infinity, Infinity)',
        '}',
      ],
      input:
        'root = {value: 5, left: {value: 3, left: {value: 1, left: null, right: null}, right: {value: 6, left: null, right: null}}, right: {value: 8, left: null, right: null}}',
      steps: [
        {
          line: 7,
          vars: { low: '-Infinity', high: 'Infinity' },
          structure: { kind: 'tree', root: orderTree({ n5: '(-∞, ∞)' }), current: 'n5' },
          note: 'The root may hold any value, so its allowed range is open on both sides.',
        },
        {
          line: 4,
          vars: { value: 5, low: '-Infinity', high: 'Infinity' },
          structure: { kind: 'tree', root: orderTree({ n5: '(-∞, ∞)' }), current: 'n5', visited: ['n5'] },
          note: '5 is inside its range. Next, check the left subtree, where everything must be below 5.',
        },
        {
          line: 4,
          vars: { value: 3, low: '-Infinity', high: 5 },
          structure: { kind: 'tree', root: orderTree({ n5: '(-∞, ∞)', n3: '(-∞, 5)' }), current: 'n3', visited: ['n5', 'n3'] },
          note: '3 is below 5, so it is valid. Its own children inherit the upper limit 5 as well as the new limit 3.',
        },
        {
          line: 4,
          vars: { value: 1, low: '-Infinity', high: 3 },
          structure: {
            kind: 'tree',
            root: orderTree({ n5: '(-∞, ∞)', n3: '(-∞, 5)', n1: '(-∞, 3)' }),
            current: 'n1',
            visited: ['n5', 'n3', 'n1'],
          },
          note: '1 is inside (-∞, 3). Its missing children return true.',
        },
        {
          line: 4,
          vars: { value: 6, low: 3, high: 5 },
          structure: {
            kind: 'tree',
            root: orderTree({ n5: '(-∞, ∞)', n3: '(-∞, 5)', n1: '(-∞, 3)', n6: '(3, 5): fails' }),
            current: 'n6',
            visited: ['n5', 'n3', 'n1', 'n6'],
          },
          note: '6 is greater than its parent 3, which looks fine, but it is also in the left subtree of 5. 6 ≥ 5, so it returns false.',
        },
        {
          line: 5,
          vars: { left: false },
          structure: {
            kind: 'tree',
            root: orderTree({ n5: '(-∞, ∞)', n3: '(-∞, 5)', n1: '(-∞, 3)', n6: '(3, 5): fails' }),
            current: 'n5',
            visited: ['n5', 'n3', 'n1', 'n6'],
          },
          note: 'false travels back up. && stops early, so the right subtree, 8, is never checked.',
        },
        {
          line: 7,
          vars: { result: false },
          structure: {
            kind: 'tree',
            root: orderTree({ n5: '(-∞, ∞)', n3: '(-∞, 5)', n1: '(-∞, 3)', n6: '(3, 5): fails' }),
            visited: ['n5', 'n3', 'n1', 'n6'],
          },
          note: 'The tree is not a binary search tree, even though every parent and child pair is in order.',
        },
      ],
    },
    alternative:
      'An in-order traversal of a valid tree produces strictly increasing values, so comparing each value with the previous one also works. Both visit every node once, in O(n) time and O(h) stack space. Computing the minimum and maximum of every subtree separately repeats work and can cost O(n²) on a chain.',
    counterexample:
      'Comparing each node only with its direct children accepts 5 with left child 3 whose right child is 6. Starting the range at -1000 and 1000 with strict comparisons rejects a valid tree that contains -1000 or 1000. Using < instead of <= lets equal values through.',
    transfer:
      'Allow equal values, but only in right subtrees. Decide how each range bound changes and which comparison becomes inclusive. This changed contract is self-reviewed.',
  },
}

export const dsaLinkedGuides: Record<string, ReflectionGuide> = {
  'list-insert-sorted': {
    plan: [
      'Where does the new value go when it is smaller than every value, larger than every value, or equal to one?',
      'Name the empty-list result before coding.',
    ],
    explanation: [
      'Explain why the new value is inserted exactly once and how the order stays nondecreasing.',
      'Show that every returned node is new and the input links are unchanged; checks cannot establish fresh nodes.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I walk the input with a cursor and append a fresh copy of each value to a tail that starts at a placeholder node. Before copying the first value greater than the new one, I append the new value; if none is greater, I append it after the loop. That is O(n) time and O(n) storage for the copy.',
  },
  'list-remove-value': {
    plan: [
      'What should the result be when the head matches, when two matches are adjacent, and when every node matches?',
      'Name the empty-list result before coding.',
    ],
    explanation: [
      'Explain how your result head is chosen when the input head matches.',
      'Show that every returned node is new and the input links are unchanged; checks cannot establish fresh nodes.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I walk the input once and append a fresh node for each value that does not match, starting from a placeholder so a removed head needs no special case. If nothing is kept, placeholder.next stays null. That is O(n) time and storage proportional to the kept values.',
  },
  'bst-search-path': {
    plan: [
      'At each node, which three outcomes are possible?',
      'Predict the path for a target smaller than every value and for a missing value between two others.',
    ],
    explanation: [
      'Explain why each comparison lets you ignore a whole subtree.',
      'Explain how your loop ends for a found and for a missing target.',
      'State time and storage costs in terms of the tree’s height; checks compare the path, not the cost.',
    ],
    example:
      'I move a current reference from the root, pushing each value onto the path. Equal ends with found true; a smaller target moves left and a larger one moves right. When current becomes null, the target is absent. That is O(h) time for a tree of height h, which is O(n) for a chain.',
  },
  'bst-latest-at-or-before': {
    plan: [
      'Predict the answer for a time equal to a booking, a time before every booking, and a time after every booking.',
      'Name a case where the first valid booking you meet is not the answer.',
    ],
    explanation: [
      'Explain which part of the tree you can ignore after each comparison, and why.',
      'Explain how you tell “no booking” apart from a booking at midnight.',
      'State time and storage costs; checks verify answers, not how many nodes you visited.',
    ],
    example:
      'I walk down from the root with a best answer that starts as null. A node at or before the time becomes the best answer and I move right to look for a later one; a node after the time sends me left. When I reach a missing child, best is the answer. That is O(h) time and O(1) extra space.',
  },
  'bst-check-order': {
    plan: [
      'Predict the result for an empty tree, a single node, and a node whose child has the same value.',
      'Draw an invalid tree where every parent and child pair looks correct.',
    ],
    explanation: [
      'Explain why checking a node against its parent alone is not enough.',
      'Explain how equal values and the extreme values -1000 and 1000 are handled.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I check each node against an open range inherited from its ancestors, starting from (-Infinity, Infinity). Going left narrows the upper limit to the node’s value and going right narrows the lower limit. A value on or outside a limit returns false. Every node is checked once: O(n) time and O(h) stack space.',
  },
}
