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

const mergeState = (a: string, b: string, merged: string) => ({
  kind: 'state' as const,
  entries: [
    ['a', a],
    ['b', b],
    ['merged', merged],
  ] as [string, string][],
})

// The bst-insert-value trace tree: 540 with children 480 and 600; withNew adds 500 as 480's right child.
const insertTree = (notes: Record<string, string> = {}, withNew = false): TraceTreeNode => {
  const at = (id: string, value: number, children?: TraceTreeNode[]): TraceTreeNode => ({
    id,
    value,
    ...(notes[id] ? { note: notes[id] } : {}),
    ...(children ? { children } : {}),
  })
  return at('n540', 540, [at('n480', 480, withNew ? [at('n500', 500)] : undefined), at('n600', 600)])
}

// The booking tree from bst-range-values: 540 over 480 (420, 510) and 600 (570, 660).
const rangeTree = (notes: Record<string, string> = {}): TraceTreeNode => {
  const at = (id: string, value: number, children?: TraceTreeNode[]): TraceTreeNode => ({
    id,
    value,
    ...(notes[id] ? { note: notes[id] } : {}),
    ...(children ? { children } : {}),
  })
  return at('n540', 540, [at('n480', 480, [at('n420', 420), at('n510', 510)]), at('n600', 600, [at('n570', 570), at('n660', 660)])])
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
  'list-merge-sorted': {
    reasoning:
      'Both inputs are sorted, so the smallest value not yet copied is always one of the two front values. Copying the smaller one and advancing only that cursor keeps the result sorted, and every value is copied exactly once because each step advances exactly one cursor. When one cursor is null, the other list’s remaining values are already in order.',
    trace:
      'For 1 → 4 → 5 and 2 → 4: take 1, take 2, then the fronts tie at 4 and either may go first, then take the other 4, then b is empty, so copy 5. The result is 1 → 2 → 4 → 4 → 5.',
    traceSteps: {
      code: [
        'type ListNode = { value: number; next: ListNode | null }',
        'function mergeSorted(a: ListNode | null, b: ListNode | null): ListNode | null {',
        '  const placeholder: ListNode = { value: 0, next: null }',
        '  let tail = placeholder',
        '  while (a !== null || b !== null) {',
        '    const takeA = b === null || (a !== null && a.value <= b.value)',
        '    const value = takeA ? a!.value : b!.value',
        '    if (takeA) a = a!.next',
        '    else b = b!.next',
        '    tail = tail.next = { value, next: null }',
        '  }',
        '  return placeholder.next',
        '}',
      ],
      input: 'a = {value: 1, next: {value: 4, next: {value: 5, next: null}}}, b = {value: 2, next: {value: 4, next: null}}',
      steps: [
        {
          line: 3,
          vars: { a: 1, b: 2 },
          structure: mergeState('1 → 4 → 5', '2 → 4', '(empty)'),
          note: 'Two cursors start at the heads. The merged copy starts after a placeholder node, so the first append needs no special case.',
        },
        {
          line: 9,
          vars: { takeA: true, value: 1 },
          structure: mergeState('4 → 5', '2 → 4', '1'),
          note: '1 is smaller than 2, so copy 1 into a new node and move only cursor a forward.',
        },
        {
          line: 9,
          vars: { takeA: false, value: 2 },
          structure: mergeState('4 → 5', '4', '1 → 2'),
          note: '2 is smaller than 4, so this time b supplies the value and only b moves.',
        },
        {
          line: 9,
          vars: { takeA: true, value: 4 },
          structure: mergeState('5', '4', '1 → 2 → 4'),
          note: 'The front values tie at 4. Taking a first is one valid choice; the other 4 follows on the next step.',
        },
        {
          line: 9,
          vars: { takeA: false, value: 4 },
          structure: mergeState('5', '(empty)', '1 → 2 → 4 → 4'),
          note: '4 is smaller than 5, so copy b’s 4. Cursor b is now null.',
        },
        {
          line: 9,
          vars: { takeA: true, value: 5 },
          structure: mergeState('(empty)', '(empty)', '1 → 2 → 4 → 4 → 5'),
          note: 'With b empty, takeA is true, so the rest of a is copied in order. Both cursors are now null and the loop ends.',
        },
        {
          line: 11,
          vars: {
            result: '{"value":1,"next":{"value":2,"next":{"value":4,"next":{"value":4,"next":{"value":5,"next":null}}}}}',
          },
          structure: mergeState('(empty)', '(empty)', '1 → 2 → 4 → 4 → 5'),
          note: 'Return the node after the placeholder. Every node is new; both inputs still read as they did before the call.',
        },
      ],
    },
    alternative:
      'Copying both lists into one array, sorting it, and relinking is short but costs O((n + m) log(n + m)) and ignores the order you were given. A recursive merge reads naturally but uses one call frame per value. Relinking the input nodes would avoid new allocations, but this contract forbids changing caller-owned nodes.',
    counterexample:
      'Stopping the loop when either list runs out drops the other list’s tail: 6 and 1 → 3 → 5 → 7 → 9 would lose 7 and 9. Comparing with < and then always taking b on a tie is fine for numbers, but advancing both cursors on a tie loses one of the equal values.',
    transfer:
      'Merge three sorted lists, or merge while removing duplicate values. Decide how many front values you compare at each step and what a tie now means. This changed contract is self-reviewed.',
  },
  'list-split-at-first': {
    reasoning:
      'A single flag records whether the first match has been seen. Before it flips, each value is appended to the first copy; from the match onward, every value goes to the second copy. Because the flag never flips back, a later repeat of the track stays in the second part.',
    trace:
      'For 1 → 3 → 2 → 3 → 4 and track 3: 1 goes to before. 3 flips the flag, so 3, 2, 3, and 4 all go to from. The second 3 does not start a third part.',
    alternative:
      'Walking once to find the position and then copying two ranges is equally O(n) but walks the prefix twice. A recursive version can return both parts from the rest of the list and prepend the current value to one of them, at the cost of O(n) call frames.',
    counterexample:
      'Splitting at the last match instead of the first gives before = 1 → 3 → 2 for the repeated case. Testing the match with if (node.value) skips a track whose ID is 0. Returning the input node as from passes a value check but shares nodes with the caller.',
    transfer:
      'Split into three parts around a track, or split at the first track whose ID is greater than a limit. Decide whether the matching node belongs to the earlier or later part. This changed contract is self-reviewed.',
  },
  'list-rotate-route': {
    reasoning:
      'Rotating by the length changes nothing, so k can be reduced modulo the length first. After that, the new first stop is at position length minus k. Copying from there to the end and then from the head up to that position produces each stop exactly once, in the required order, in O(n) time regardless of how large k was.',
    trace:
      'For 1 → 2 → 3 → 4 → 5 and k = 7: the length is 5 and 7 modulo 5 is 2, so skip 3 stops and start at 4. Copy 4, 5, wrap to the head, then copy 1, 2, 3. The result is 4 → 5 → 1 → 2 → 3.',
    traceSteps: {
      code: [
        'type ListNode = { value: number; next: ListNode | null }',
        'function rotateRoute(head: ListNode | null, k: number): ListNode | null {',
        '  let length = 0',
        '  for (let p = head; p !== null; p = p.next) length++',
        '  if (head === null) return null',
        '  let cursor: ListNode = head',
        '  for (let i = 0; i < length - (k % length); i++) cursor = cursor.next ?? head',
        '  const placeholder: ListNode = { value: 0, next: null }',
        '  let tail = placeholder',
        '  for (let i = 0; i < length; i++) {',
        '    tail = tail.next = { value: cursor.value, next: null }',
        '    cursor = cursor.next ?? head',
        '  }',
        '  return placeholder.next',
        '}',
      ],
      input: 'head = {value: 1, next: {value: 2, next: {value: 3, next: {value: 4, next: {value: 5, next: null}}}}}, k = 7',
      steps: [
        {
          line: 3,
          vars: { length: 5, k: 7 },
          structure: { kind: 'array', values: [1, 2, 3, 4, 5] },
          note: 'Count the stops first. The array shows the route by position; the nodes themselves are never changed.',
        },
        {
          line: 6,
          vars: { 'k % length': 2, skip: 3 },
          structure: { kind: 'array', values: [1, 2, 3, 4, 5], pointers: { cursor: 3 } },
          note: 'Rotating by 5 changes nothing, so 7 behaves like 2. The last two stops move to the front, so skip three stops and start at 4.',
        },
        {
          line: 10,
          vars: { copy: '4' },
          structure: { kind: 'array', values: [1, 2, 3, 4, 5], pointers: { cursor: 3 } },
          note: 'Copy the cursor’s value into a new node at the tail of the result.',
        },
        {
          line: 10,
          vars: { copy: '4 → 5' },
          structure: { kind: 'array', values: [1, 2, 3, 4, 5], pointers: { cursor: 4 }, dimmed: [3] },
          note: 'Copy 5. These two copies are the stops that moved to the front.',
        },
        {
          line: 11,
          vars: { copy: '4 → 5' },
          structure: { kind: 'array', values: [1, 2, 3, 4, 5], pointers: { cursor: 0 }, dimmed: [3, 4] },
          note: '5 has no next stop, so the cursor wraps around to the head instead of becoming null.',
        },
        {
          line: 10,
          vars: { copy: '4 → 5 → 1 → 2 → 3' },
          structure: { kind: 'array', values: [1, 2, 3, 4, 5], pointers: { cursor: 2 }, dimmed: [0, 1, 2, 3, 4] },
          note: 'Copy 1, 2, and 3 the same way. After five copies every stop appears exactly once.',
        },
        {
          line: 13,
          vars: {
            result: '{"value":4,"next":{"value":5,"next":{"value":1,"next":{"value":2,"next":{"value":3,"next":null}}}}}',
          },
          structure: { kind: 'array', values: [4, 5, 1, 2, 3] },
          note: 'Return the new route. The loops ran 5 + 3 + 5 times, the same as they would for k = 1000002.',
        },
      ],
    },
    alternative:
      'Copying the values into an array and slicing it at length minus k is simple and also O(n), but stores the values twice. An in-place rotation would close the list into a ring and break it at the new tail, which is O(1) extra space but changes caller-owned nodes, so this contract rules it out.',
    counterexample:
      'Rotating one step at a time, k times, gives the right answer but takes a million passes for k = 1000000. Forgetting the modulo makes length - k negative when k is larger than the length. Dividing by the length before checking for an empty route computes k % 0, which is NaN.',
    transfer:
      'Rotate left instead, so the first k stops move to the end. Decide how the start position changes and whether the modulo step still applies. This changed contract is self-reviewed.',
  },
  'bst-insert-value': {
    reasoning:
      'A later search for time follows the same comparisons as this insertion, so placing time at the missing child where the search ends keeps every subtree’s ordering intact. Only nodes on that path have a child that changes, so only they need new versions; every subtree off the path can be shared because nothing inside it changes.',
    trace:
      'Inserting 500 into 540 with children 480 and 600: 500 < 540 goes left, 500 > 480 goes right to a missing child, so 500 becomes 480’s right child. Returning up, a new 480 holds the new child, and a new 540 holds the new 480. The 600 subtree is reused.',
    traceSteps: {
      code: [
        'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }',
        'function insertTime(root: TreeNode | null, time: number): TreeNode | null {',
        '  if (root === null) return { value: time, left: null, right: null }',
        '  if (time < root.value) return { ...root, left: insertTime(root.left, time) }',
        '  if (time > root.value) return { ...root, right: insertTime(root.right, time) }',
        '  return root',
        '}',
      ],
      input: 'root = {value: 540, left: {value: 480, left: null, right: null}, right: {value: 600, left: null, right: null}}, time = 500',
      steps: [
        {
          line: 2,
          vars: { time: 500 },
          structure: { kind: 'tree', root: insertTree(), current: 'n540' },
          note: 'Start at the root. Insertion follows exactly the route a later search for 500 would take.',
        },
        {
          line: 3,
          vars: { compared: 540 },
          structure: { kind: 'tree', root: insertTree({ n540: '500 < 540' }), current: 'n480', visited: ['n540'] },
          note: '500 is smaller than 540, so it belongs in the left subtree. The 600 subtree will not change.',
        },
        {
          line: 4,
          vars: { compared: 480 },
          structure: {
            kind: 'tree',
            root: insertTree({ n540: '500 < 540', n480: '500 > 480' }),
            current: 'n480',
            visited: ['n540', 'n480'],
          },
          note: '500 is larger than 480, so go right. 480 has no right child, so the next call receives null.',
        },
        {
          line: 2,
          vars: { root: null },
          structure: {
            kind: 'tree',
            root: insertTree({ n540: '500 < 540', n480: '500 > 480', n500: 'new' }, true),
            current: 'n500',
            visited: ['n540', 'n480'],
          },
          note: 'A search for 500 would fall off the tree here, so this is where 500 goes: a new one-node tree that becomes the right child of 480.',
        },
        {
          line: 4,
          vars: { copied: 480 },
          structure: {
            kind: 'tree',
            root: insertTree({ n540: '500 < 540', n480: 'copied', n500: 'new' }, true),
            current: 'n480',
            visited: ['n540', 'n480', 'n500'],
          },
          note: 'Returning up, a new 480 node holds the new right child. The original 480 node is untouched.',
        },
        {
          line: 3,
          vars: {
            result:
              '{"value":540,"left":{"value":480,"left":null,"right":{"value":500,"left":null,"right":null}},"right":{"value":600,"left":null,"right":null}}',
          },
          structure: {
            kind: 'tree',
            root: insertTree({ n540: 'copied', n480: 'copied', n500: 'new', n600: 'shared' }, true),
            current: 'n540',
            visited: ['n540', 'n480', 'n500'],
          },
          note: 'A new root holds the new left subtree and shares the unchanged 600 subtree. Two nodes were copied and one was created.',
        },
      ],
    },
    alternative:
      'Changing the tree in place by attaching a node to the existing 480 is O(1) extra space, but other readers would see the change. Rebuilding the whole tree from its sorted values plus time copies every node and may produce a different shape. Path copying costs O(h) new nodes for a tree of height h.',
    counterexample:
      'Attaching the new node to the first node with a missing child on the correct side, rather than following the comparisons all the way down, can put 500 under 600. Adding a second 570 node for an existing time breaks the unique-values rule. Mutating root.left passes value checks but changes the caller’s tree.',
    transfer:
      'Delete a value instead of inserting one. Decide what replaces a node with two children and which nodes must be copied. This changed contract is self-reviewed.',
  },
  'bst-range-values': {
    reasoning:
      'An in-order visit lists a binary search tree’s values in increasing order. A node at or below start has nothing in range in its left subtree, and a node at or above end has nothing in range in its right subtree, so those sides can be skipped without missing a value. The remaining visit still runs in order, so no sorting is needed.',
    trace:
      'For 500 to 560: at 540 visit left; at 480 skip its left side because 480 ≤ 500, then go right to 510 and keep it. Back at 540, keep it, then visit 600 and its left child 570. 570 and 600 are above 560, so their right sides are skipped. The answer is [510, 540].',
    traceSteps: {
      code: [
        'type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null }',
        'function bookingsBetween(root: TreeNode | null, start: number, end: number): number[] {',
        '  const found: number[] = []',
        '  const visit = (node: TreeNode | null): void => {',
        '    if (node === null) return',
        '    if (node.value > start) visit(node.left)',
        '    if (node.value >= start && node.value <= end) found.push(node.value)',
        '    if (node.value < end) visit(node.right)',
        '  }',
        '  visit(root)',
        '  return found',
        '}',
      ],
      input:
        'root = {value: 540, left: {value: 480, left: {value: 420, left: null, right: null}, right: {value: 510, left: null, right: null}}, right: {value: 600, left: {value: 570, left: null, right: null}, right: {value: 660, left: null, right: null}}}, start = 500, end = 560',
      steps: [
        {
          line: 5,
          vars: { start: 500, end: 560, found: '[]' },
          structure: { kind: 'tree', root: rangeTree(), current: 'n540' },
          note: '540 is above start, so its left subtree may hold values in range. Visit it first to keep increasing order.',
        },
        {
          line: 7,
          vars: { at: 480, found: '[]' },
          structure: { kind: 'tree', root: rangeTree({ n480: 'skip left' }), current: 'n480', visited: ['n540'] },
          note: '480 is not above 500, so nothing to its left can be in range: 420 is never visited. 480 itself is too early, so go right.',
        },
        {
          line: 6,
          vars: { at: 510, found: '[510]' },
          structure: {
            kind: 'tree',
            root: rangeTree({ n480: 'skip left', n510: 'keep' }),
            current: 'n510',
            visited: ['n540', 'n480'],
          },
          note: '510 is between 500 and 560, so it is the first value found. Its missing children return at once.',
        },
        {
          line: 6,
          vars: { at: 540, found: '[510,540]' },
          structure: {
            kind: 'tree',
            root: rangeTree({ n480: 'skip left', n510: 'keep', n540: 'keep' }),
            current: 'n540',
            visited: ['n540', 'n480', 'n510'],
          },
          note: 'Back at 540 after its whole left side: 540 is in range and comes after 510, so the list stays in order.',
        },
        {
          line: 5,
          vars: { at: 600, found: '[510,540]' },
          structure: {
            kind: 'tree',
            root: rangeTree({ n480: 'skip left', n510: 'keep', n540: 'keep' }),
            current: 'n600',
            visited: ['n540', 'n480', 'n510'],
          },
          note: '540 is below 560, so its right side may help. 600 is above start, so visit its left child 570 first.',
        },
        {
          line: 7,
          vars: { at: 570, found: '[510,540]' },
          structure: {
            kind: 'tree',
            root: rangeTree({ n480: 'skip left', n510: 'keep', n540: 'keep', n570: 'skip right', n600: 'skip right' }),
            current: 'n570',
            visited: ['n540', 'n480', 'n510', 'n600', 'n570'],
          },
          note: '570 and 600 are both past 560, so neither is kept and neither right side is visited: 660 is never compared.',
        },
        {
          line: 10,
          vars: { result: '[510,540]' },
          structure: {
            kind: 'tree',
            root: rangeTree({ n480: 'skip left', n510: 'keep', n540: 'keep', n570: 'skip right', n600: 'skip right' }),
            visited: ['n540', 'n480', 'n510', 'n600', 'n570'],
          },
          note: 'Five of seven nodes were visited. The values are already in increasing order, so no sort is needed.',
        },
      ],
    },
    alternative:
      'Listing every value in order and filtering afterwards is simpler and still correct, but always costs O(n). Pruning visits only the nodes on the boundary routes plus the k values returned, which is O(h + k). A sorted array with two binary searches answers the same question, but inserts into it are costly.',
    counterexample:
      'Keeping a node only when value > start drops an exact boundary value such as 600 in [600, 600]. Skipping the left side of every node outside the range misses 510 under 480 for the range 500 to 560. Visiting right before left produces decreasing order.',
    transfer:
      'Count the bookings in a range instead of listing them, or return only the first three. Decide which subtrees you can still skip and when you can stop early. This changed contract is self-reviewed.',
  },
  'bst-nearest-slot': {
    reasoning:
      'The nearest value is either the largest value at or before time or the smallest value at or after it, and both lie on the route a search for time follows. Comparing each node on that route with the best so far, and breaking ties toward the smaller value, therefore finds the answer in O(h) without visiting other nodes.',
    trace:
      'For 525: 540 is 15 away and becomes the best. Go left to 480, 45 away, so keep 540. Go right to 510, also 15 away; the tie goes to the smaller value, so 510 becomes the best. 510 has no right child, so return 510.',
    alternative:
      'An in-order traversal followed by a linear scan for the smallest distance is easy to check but O(n). Finding the floor and the ceiling with two separate searches and then comparing them is also O(h) and makes the tie rule very explicit.',
    counterexample:
      'Stopping at the first node whose distance is smaller than its parent’s returns 540 for 525 and ignores the tie rule. Breaking ties toward the later value returns 540 instead of 510. Using if (best) treats a booking at midnight as no answer.',
    transfer:
      'Return the two nearest bookings, or the nearest one that is at least 30 minutes away. Decide whether one route is still enough. This changed contract is self-reviewed.',
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
  'list-merge-sorted': {
    plan: [
      'What should happen when one list runs out before the other?',
      'Predict the result for two empty lists and for lists that share a value.',
    ],
    explanation: [
      'Explain why the next smallest value is always one of the two front values.',
      'Show that every returned node is new and both inputs are unchanged; checks cannot establish fresh nodes.',
      'State time and storage costs in terms of both list lengths.',
    ],
    example:
      'I keep a cursor in each list and append a fresh copy of the smaller front value to a tail that starts at a placeholder, advancing only that cursor. When one cursor is null, the loop keeps taking from the other. That is O(n + m) time and O(n + m) storage for the copy.',
  },
  'list-split-at-first': {
    plan: [
      'Predict both parts when the first track matches, the last track matches, the track repeats, and the track is absent.',
      'Name the value of each part when the playlist is empty.',
    ],
    explanation: [
      'Explain how your code decides which part receives each value, and why a repeated track does not start a third part.',
      'Show that every returned node is new and the input links are unchanged.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I walk the playlist once with a flag that turns on at the first matching track. Values before it are appended to one copy and values from it onward to another, each with its own placeholder and tail. An absent track leaves from as null. That is O(n) time and O(n) storage.',
  },
  'list-rotate-route': {
    plan: [
      'Predict the result for k = 0, k equal to the number of stops, and k one more than it.',
      'Name the stop that ends up first in general.',
    ],
    explanation: [
      'Explain why only k modulo the number of stops matters, and how you avoid dividing by zero.',
      'Explain how your cost stays the same for k = 1 and k = 1000000.',
      'Show that every returned node is new and the input links are unchanged.',
    ],
    example:
      'I count the stops, return null for an empty route, and reduce k modulo the length. The stop at position length - k starts the result: I copy from there to the end, then from the head up to that position. That is O(n) time however large k is, and O(n) storage for the copy.',
  },
  'bst-insert-value': {
    plan: [
      'Predict where 500 goes in a tree rooted at 540 whose left child is 480.',
      'Name the nodes on the path and the subtrees that never change.',
    ],
    explanation: [
      'Explain why the insertion point keeps every subtree in order.',
      'Explain which nodes you create, which you reuse, and why the caller’s tree is unchanged.',
      'State time and storage costs in terms of the tree’s height.',
    ],
    example:
      'I follow the search route for the new time. A missing child becomes a new one-node tree; on the way back up, each node on the route is copied with its new child, and subtrees off the route are reused. An existing time returns the tree unchanged. That is O(h) time and O(h) new nodes.',
  },
  'bst-range-values': {
    plan: [
      'Predict the answer for a range holding one value exactly, a range between two values, and a range where start is greater than end.',
      'Name a node whose left subtree you never need to visit.',
    ],
    explanation: [
      'Explain why your output is already in increasing order.',
      'Explain which subtrees you skip and why skipping them cannot miss a value.',
      'State time and storage costs; checks compare values, not visits.',
    ],
    example:
      'I visit left, node, right, so values come out in increasing order. I visit a node’s left side only when its value is above start and its right side only when its value is below end, and keep the node when it lies in the range. That is O(h + k) time for k results and O(h) stack space.',
  },
  'bst-nearest-slot': {
    plan: [
      'Predict the answer for an exact match, a time halfway between two bookings, and a time before every booking.',
      'Write down the tie rule before coding.',
    ],
    explanation: [
      'Explain why the nearest value must lie on the search route for time.',
      'Explain how your comparison applies the tie rule and handles a booking at midnight.',
      'State time and storage costs for your approach.',
    ],
    example:
      'I walk the search route for time, keeping the closest value so far and replacing it when a node is closer, or equally close and smaller. An exact match ends the walk. That is O(h) time and O(1) extra space.',
  },
}
