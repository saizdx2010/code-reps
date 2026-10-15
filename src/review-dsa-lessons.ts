import type { LessonDepth } from './lesson-depth.ts'

export const dsaLessonDepth: Record<string, LessonDepth> = {
  'recognize-the-pattern': {
    title: 'A familiar shape can hide a broken assumption',
    code: '// Daily costs [4, -3, 1], budget 3\n// A draft discards the first 4 immediately.\n// But the first two costs total 1.',
    reasoning:
      'With negative values, a run that is too expensive now may become affordable after extension. For budget 3, discarding the first 4 before seeing -3 loses the valid length-two run [4, -3]. Positive-cost shrinking relies on an assumption that this contract does not provide.',
    challenge:
      'For costs [4, -3, 1] and budget 3, predict the longest affordable run. Explain why a positive-cost shrinking rule can miss it. Then distinguish finding that longest run from answering many supplied range-total questions. Discuss before revealing.',
    answer:
      'The longest run has length 3: all three costs total 2, within budget 3. The shrinking draft drops the first 4 too early and can only find the length-two run [-3, 1]. It discards a start that later becomes affordable, so its invariant is false. Prefix sums answer supplied ranges by subtraction even with negative values; prefix sums alone do not locate a longest affordable run without additional searching or structure. State a new invariant before choosing an algorithm. This discussion is self-reviewed, not checked implementation evidence.',
  },
  'collection-operations': {
    title: 'Presence is different from truthiness',
    code: 'const counts = new Map([["Ada", 0]])\nconst result = counts.get("Ada") || null',
    reasoning:
      'A map can hold zero. || uses truthiness, so it loses this legitimate stored value. ?? tests only null or undefined; has explicitly checks membership.',
    challenge:
      'Repair the expression, then predict the result for an absent key and for Ada. Explain why this map cannot store undefined under its declared value type.',
    answer:
      'Use counts.get("Ada") ?? null. Ada returns 0; a missing key returns null. The map’s number value type excludes undefined, so a missing get is unambiguous here.',
  },
  queues: {
    title: 'Same input, different removal policy',
    code: 'const first = [1, 2, 3]\nconst second = [...first]\nfirst.pop()\nsecond.shift()',
    reasoning:
      'The stack removes 3 and leaves [1, 2]. The queue removes 1 and leaves [2, 3]. Copying makes the updates independent; a second reference to first would share the mutation.',
    challenge: 'Replace the copy with const second = first. Predict the final array after both operations and explain the shared identity.',
    answer:
      'Both names refer to the same array. pop leaves [1, 2], then shift leaves [2]. Both names now observe [2]. This is separate from choosing FIFO or LIFO.',
  },
  'array-techniques': {
    title: 'Skipping candidates needs a reason',
    code: '// Sorted values [1, 2, 4], target 8\n// left=0, right=2: sum 5\n// left=1, right=2: sum 6\n// left=2, right=2: stop',
    reasoning:
      'At each step the largest remaining partner still makes the left value too small. Discarding that left value cannot remove a solution. Stopping when indices meet prevents reusing the same position.',
    challenge: 'Find an unsorted input where this movement rule misses a valid pair. Explain which assumption fails.',
    answer:
      '[4, 1, 3], target 4: 4+3 is too large so right moves to 1; 4+1 is too large so right moves to 0, and the algorithm misses positions 1 and 2 (1+3). The rightmost item was not the largest remaining value, so discarding it was unjustified.',
  },
  'sorting-basics': {
    title: 'Equal values reveal whether a sort is stable',
    code: 'const records = [{ id: "a", score: 2 }, { id: "b", score: 2 }, { id: "c", score: 1 }]\nconst sorted = [...records].sort((x, y) => x.score - y.score)',
    reasoning:
      'The comparator returns zero for a and b, so a stable sort keeps a before b. Copying first leaves records in its original order. An insertion step that shifts past equal neighbours would swap a and b even though the comparator calls them equal.',
    challenge:
      'Predict the ids in sorted. Then change the comparator to (x, y) => x.score - y.score || y.id.localeCompare(x.id) and predict again.',
    answer:
      'The first result is c, a, b. With the tie-break, equal scores are ordered by id descending, giving c, b, a. The original records array is unchanged in both cases.',
  },
  'recursion-basics': {
    title: 'A missing base case never stops',
    code: 'function depth(value: unknown): number {\n  return 1 + Math.max(...(value as unknown[]).map(depth))\n}',
    reasoning:
      'Every call maps over its children, but a plain number has no children to map and an empty list produces Math.max() of nothing, which is -Infinity. Nothing answers directly, so the function cannot return a sensible depth. A base case must handle non-arrays and empty lists before the recursive step.',
    challenge: 'Repair depth so numbers have depth 0 and [] has depth 1. Then predict depth([1, [2, []]]).',
    answer:
      'Return 0 when !Array.isArray(value), and 1 + Math.max(0, ...value.map(depth)) otherwise. The result for [1, [2, []]] is 3: the outer list, the inner list, and the empty list each add one level.',
  },
  'linked-lists': {
    title: 'An append without a tail pointer loses the copy',
    code: '// Draft copy of 1 -> 2 -> 3:\nlet result = null\nfor (let current = head; current !== null; current = current.next) {\n  result = { value: current.value, next: result }\n}\nreturn result',
    reasoning:
      'Each new node is placed in front of the result built so far, so the last value visited ends up first. The draft returns 3 -> 2 -> 1: a correct reversal, but not a copy. Keeping the original order means attaching each new node after the last one, which needs a reference to that last node. A placeholder node before the head lets the very first append use the same code as every other.',
    challenge:
      'Repair the draft so it returns a fresh copy in the original order without walking the copy again for each value. Predict the result for an empty list. Then explain why returning head itself would pass a value comparison but break the contract. Discuss before revealing the answer.',
    answer:
      'Start with const placeholder = { value: 0, next: null } and let tail = placeholder. For each input node, create { value: current.value, next: null }, set tail.next to it, and move tail to it. Return placeholder.next, which is null for an empty list. Each value is copied once: O(n) time and O(n) storage. Returning head gives equal values but shares every node with the caller, so a later change to either list shows up in both. Checks compare values, so fresh nodes remain self-reviewed.',
  },
  trees: {
    title: 'A shorter sibling must not replace the deepest route',
    code: '//     6\n//    / \\\n//   2   9\n//   |\n//   4\n// Draft: start best=0; for each child set best=depth(child);\n// then return 1 + best.',
    reasoning:
      'With children visited left to right, the subtree at 2 returns node-count depth 2, but the later leaf 9 returns 1. Assignment forgets the deeper earlier result and returns 2 instead of 3. Keep best equal to the maximum depth among children processed so far. It starts at 0, so a leaf correctly returns 1. Descending to children terminates on these finite, acyclic trees.',
    challenge:
      'Repair the update without changing the children. Predict maximum node-count depth for null and for a root alone. Then explain how a queue-based alternative would count levels and what happens to recursive stack space on a chain of n nodes. Discuss before revealing the answer.',
    answer:
      'Use best = Math.max(best, depth(child)); return 1 + best for a real node, and return 0 for null. The diagram returns 3; null returns 0; a lone root returns 1. A BFS alternative increments a count after each complete nonempty level, not after each individual node. Both traverse n nodes in O(n) time. Recursion uses O(h) call frames, which becomes O(n) on a chain and may exceed the runtime stack; an explicit stack avoids recursive calls. Queue storage depends on the widest level when old entries are reclaimed. This discussion is self-reviewed, not evidence of independent coding.',
  },
  'binary-search-trees': {
    title: 'Checking only children accepts an invalid tree',
    code: '//      5\n//     / \\\n//    3   8\n//     \\\n//      6\n// Draft: valid if left.value < node.value < right.value at every node.',
    reasoning:
      'At node 5, the children 3 and 8 are in order. At node 3, its right child 6 is larger, which is also in order. The draft accepts the tree, but 6 is in the left subtree of 5, so a search for 6 would go right from 5 and never find it. Every ancestor adds a limit: moving left from a node sets an upper limit and moving right sets a lower one. A correct check compares each node with all of those limits, not only with its parent.',
    challenge:
      'Describe the allowed range for each of the four nodes and find the first one outside its range. Then predict what an in-order traversal of the tree produces and explain how that sequence also reveals the problem. Discuss before revealing the answer.',
    answer:
      'The ranges are 5: (-∞, ∞), 3: (-∞, 5), 6: (3, 5), and 8: (5, ∞). 6 is outside (3, 5), so the tree is invalid. An in-order traversal gives 3, 6, 5, 8; a valid tree would be strictly increasing, and 6 followed by 5 is a decrease. Both checks visit each node once: O(n) time and O(h) stack space for a tree of height h. This discussion is self-reviewed, not evidence of independent coding.',
  },
  graphs: {
    title: 'One traversal cannot count disconnected groups',
    code: 'const graph = [[1], [0], [], [4], [3]]\n// 0 -- 1     2     3 -- 4\n// One traversal starting at 0 visits only {0, 1}.',
    reasoning:
      'Reciprocal edges make this an undirected graph. A traversal cannot cross between disconnected groups, so finding {0,1} says nothing about nodes 2, 3, or 4. Scan all node indices with a shared visited set. Each unseen seed starts exactly one new group; its traversal marks the entire group, so subsequent members do not count again. The isolated node 2 still exists and contributes a group.',
    challenge:
      'Predict the group count and describe the visited set after seeds 0, 2, and 3. Explain why resetting visited for each seed overcounts. Then remove the reverse edge 1 -> 0: why must you decide on a new definition before applying this group rule? Discuss before revealing the answer.',
    answer:
      'There are 3 groups. Visited grows to {0,1}, then {0,1,2}, then {0,1,2,3,4}. Keeping it across seeds skips 1 and 4; resetting it would count every node as a fresh seed, giving 5. Removing 1 -> 0 violates the reciprocal-edge contract. Directed graphs distinguish weak connectivity (ignore direction) from strong connectivity (every member reaches every other); neither should be silently substituted. Here the weak group {0,1} would split into two strongly connected groups. This transfer changes the contract and remains self-reviewed; the existing rep checks cover undirected groups.',
  },
  'dynamic-programming': {
    title: 'A greedy rule looks like a recurrence until it fails',
    code: '// Stalls [2, 3, 2]; never rent two neighbours.\n// Greedy: rent the highest stall, block its neighbours.\n//   rent 3 -> neighbours blocked -> total 3\n// Recurrence: best[i] = max(best[i - 1], revenue[i] + best[i - 2])\n//   best = [2, 3, 4] -> total 4',
    reasoning:
      'The greedy rule commits to one stall before it knows what that choice costs: renting 3 blocks both 2s, which together are worth more. The recurrence never commits early. At each stall it keeps both possibilities, skip or take, and compares their best totals, which are already final because they describe shorter prefixes. A local rule is only safe when you can prove that the locally best choice is always part of some best overall answer; here it is not.',
    challenge:
      'Write the state, recurrence, and base cases for counting the ways to climb n stairs taking 1, 2, or 3 steps at a time. Then explain why you add cases here instead of taking a maximum, and predict the count for n = 4. Discuss before revealing the answer.',
    answer:
      'ways[i] is the number of ordered step sequences that reach exactly stair i. The last step was 1, 2, or 3 stairs, so ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3], with ways[0] = 1 and negative stairs contributing 0. The cases are disjoint because they differ in their last step, so they add. ways: 1, 1, 2, 4, 7, so n = 4 has 7 sequences. This discussion is self-reviewed, not evidence of independent coding.',
  },
  heaps: {
    title: 'A heap is ordered by level, not left to right',
    code: '// Min-heap array: [1, 3, 8, 5, 4]\n//        1\n//      /   \\\n//     3     8\n//    / \\\n//   5   4\n// Is the array sorted? No. Is the top the minimum? Yes.',
    reasoning:
      'The heap rule only compares each parent with its own children: 1 ≤ 3 and 8, and 3 ≤ 5 and 4. It says nothing about 8 versus 5, or 5 versus 4, so the array is not sorted. That weaker rule is exactly why adding and removing are cheap: an update only repairs one path from a leaf to the root, about log₂ n swaps, instead of shifting everything into sorted order. Reading the minimum is still O(1) because the root is smaller than everything below it.',
    challenge:
      'Remove the top of [1, 3, 8, 5, 4] and write the array after each swap. Then add 2 and do the same. Which values moved, and why did 8 never move? Discuss before revealing the answer.',
    answer:
      'Removing 1 moves the last value, 4, to the top: [4, 3, 8, 5]. Its smaller child is 3, so swap: [3, 4, 8, 5]. 4 is now at index 1 with child 5, which is larger, so stop. Adding 2 appends it at index 4: [3, 4, 8, 5, 2]. Its parent at index 1 is 4, so swap: [3, 2, 8, 5, 4]; its parent 3 is larger, so swap again: [2, 3, 8, 5, 4]. 8 never moved because neither repair path passed through the right subtree. This discussion is self-reviewed, not evidence of independent coding.',
  },
}
