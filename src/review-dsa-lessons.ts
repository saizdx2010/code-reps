import type { LessonDepth } from './lesson-depth.ts'

export const dsaLessonDepth: Record<string, LessonDepth> = {
  'collection-operations': {
    'title': 'Presence is different from truthiness',
    'code': 'const counts = new Map([["Ada", 0]])\nconst result = counts.get("Ada") || null',
    'reasoning': 'A map can hold zero. || uses truthiness, so it loses this legitimate stored value. ?? tests only null or undefined; has explicitly checks membership.',
    'challenge': 'Repair the expression, then predict the result for an absent key and for Ada. Explain why this map cannot store undefined under its declared value type.',
    'answer': 'Use counts.get("Ada") ?? null. Ada returns 0; a missing key returns null. The map’s number value type excludes undefined, so a missing get is unambiguous here.'
  },
  'queues': {
    'title': 'Same input, different removal policy',
    'code': 'const first = [1, 2, 3]\nconst second = [...first]\nfirst.pop()\nsecond.shift()',
    'reasoning': 'The stack removes 3 and leaves [1, 2]. The queue removes 1 and leaves [2, 3]. Copying makes the updates independent; a second reference to first would share the mutation.',
    'challenge': 'Replace the copy with const second = first. Predict the final array after both operations and explain the shared identity.',
    'answer': 'Both names refer to the same array. pop leaves [1, 2], then shift leaves [2]. Both names now observe [2]. This is separate from choosing FIFO or LIFO.'
  },
  'array-techniques': {
    'title': 'Skipping candidates needs a reason',
    'code': '// Sorted values [1, 2, 4], target 8\n// left=0, right=2: sum 5\n// left=1, right=2: sum 6\n// left=2, right=2: stop',
    'reasoning': 'At each step the largest remaining partner still makes the left value too small. Discarding that left value cannot remove a solution. Stopping when indices meet prevents reusing the same position.',
    'challenge': 'Find an unsorted input where this movement rule misses a valid pair. Explain which assumption fails.',
    'answer': '[4, 1, 3], target 4: 4+3 is too large so right moves to 1; 4+1 is too large so right moves to 0, and the algorithm misses positions 1 and 2 (1+3). The rightmost item was not the largest remaining value, so discarding it was unjustified.'
  },
  'sorting-basics': {
    'title': 'Equal values reveal whether a sort is stable',
    'code': 'const records = [{ id: "a", score: 2 }, { id: "b", score: 2 }, { id: "c", score: 1 }]\nconst sorted = [...records].sort((x, y) => x.score - y.score)',
    'reasoning': 'The comparator returns zero for a and b, so a stable sort keeps a before b. Copying first leaves records in its original order. An insertion step that shifts past equal neighbours would swap a and b even though the comparator calls them equal.',
    'challenge': 'Predict the ids in sorted. Then change the comparator to (x, y) => x.score - y.score || y.id.localeCompare(x.id) and predict again.',
    'answer': 'The first result is c, a, b. With the tie-break, equal scores are ordered by id descending, giving c, b, a. The original records array is unchanged in both cases.'
  },
  'recursion-basics': {
    'title': 'A missing base case never stops',
    'code': 'function depth(value: unknown): number {\n  return 1 + Math.max(...(value as unknown[]).map(depth))\n}',
    'reasoning': 'Every call maps over its children, but a plain number has no children to map and an empty list produces Math.max() of nothing, which is -Infinity. Nothing answers directly, so the function cannot return a sensible depth. A base case must handle non-arrays and empty lists before the recursive step.',
    'challenge': 'Repair depth so numbers have depth 0 and [] has depth 1. Then predict depth([1, [2, []]]).',
    'answer': 'Return 0 when !Array.isArray(value), and 1 + Math.max(0, ...value.map(depth)) otherwise. The result for [1, [2, []]] is 3: the outer list, the inner list, and the empty list each add one level.'
  },
  trees: {
    title: 'A shorter sibling must not replace the deepest route',
    code: '//     6\n//    / \\\n//   2   9\n//   |\n//   4\n// Draft: start best=0; for each child set best=depth(child);\n// then return 1 + best.',
    reasoning: 'With children visited left to right, the subtree at 2 returns node-count depth 2, but the later leaf 9 returns 1. Assignment forgets the deeper earlier result and returns 2 instead of 3. Keep best equal to the maximum depth among children processed so far. It starts at 0, so a leaf correctly returns 1. Descending to children terminates on these finite, acyclic trees.',
    challenge: 'Repair the update without changing the children. Predict maximum node-count depth for null and for a root alone. Then explain how a queue-based alternative would count levels and what happens to recursive stack space on a chain of n nodes. Discuss before revealing the answer.',
    answer: 'Use best = Math.max(best, depth(child)); return 1 + best for a real node, and return 0 for null. The diagram returns 3; null returns 0; a lone root returns 1. A BFS alternative increments a count after each complete nonempty level, not after each individual node. Both traverse n nodes in O(n) time. Recursion uses O(h) call frames, which becomes O(n) on a chain and may exceed the runtime stack; an explicit stack avoids recursive calls. Queue storage depends on the widest level when old entries are reclaimed. This discussion is self-reviewed, not evidence of independent coding.'
  },
  graphs: {
    title: 'One traversal cannot count disconnected groups',
    code: 'const graph = [[1], [0], [], [4], [3]]\n// 0 -- 1     2     3 -- 4\n// One traversal starting at 0 visits only {0, 1}.',
    reasoning: 'Reciprocal edges make this an undirected graph. A traversal cannot cross between disconnected groups, so finding {0,1} says nothing about nodes 2, 3, or 4. Scan all node indices with a shared visited set. Each unseen seed starts exactly one new group; its traversal marks the entire group, so subsequent members do not count again. The isolated node 2 still exists and contributes a group.',
    challenge: 'Predict the group count and describe the visited set after seeds 0, 2, and 3. Explain why resetting visited for each seed overcounts. Then remove the reverse edge 1 -> 0: why must you decide on a new definition before applying this group rule? Discuss before revealing the answer.',
    answer: 'There are 3 groups. Visited grows to {0,1}, then {0,1,2}, then {0,1,2,3,4}. Keeping it across seeds skips 1 and 4; resetting it would count every node as a fresh seed, giving 5. Removing 1 -> 0 violates the reciprocal-edge contract. Directed graphs distinguish weak connectivity (ignore direction) from strong connectivity (every member reaches every other); neither should be silently substituted. Here the weak group {0,1} would split into two strongly connected groups. This transfer changes the contract and remains self-reviewed; the existing rep checks cover undirected groups.'
  }
}
