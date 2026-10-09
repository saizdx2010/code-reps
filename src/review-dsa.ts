import type { RepDepth } from './rep-depth.ts'

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
    'traceSteps': {"code": ["type NestedNumber = number | NestedNumber[]; function recursiveSum(items: NestedNumber[]): number {", "  let total = 0", "  for (const item of items) {", "    if (Array.isArray(item)) total += recursiveSum(item)", "    else total += item", "  }", "  return total", "}"], "input": "items = [1, [2, [], [-3]], 4]", "steps": [{"line": 1, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 0"}], "event": "call"}, "note": "The first call starts on the whole list with an empty total."}, {"line": 4, "vars": {"total": 1}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}]}, "note": "The number 1 is not a list, so it is added directly. No new frame is pushed."}, {"line": 3, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 0"}], "event": "call"}, "note": "The nested list [2, [], [-3]] is a smaller version of the task, so a new frame is pushed on top."}, {"line": 3, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([])", "locals": "total = 0"}], "event": "call"}, "note": "The middle call has added 2, then pushes a frame for the empty list."}, {"line": 6, "vars": {"total": 0}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([])", "locals": "total = 0", "returns": 0}], "event": "return"}, "note": "The base case: an empty list has nothing to loop over and returns 0. The frame is popped."}, {"line": 3, "vars": {"total": -3}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([-3])", "locals": "total = 0"}], "event": "call"}, "note": "Back in the middle call, 0 is added, and the next list [-3] gets its own frame."}, {"line": 6, "vars": {"total": -3}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = 2"}, {"call": "recursiveSum([-3])", "locals": "total = -3", "returns": -3}], "event": "return"}, "note": "The deepest call adds -3 and returns it. The frame is popped."}, {"line": 6, "vars": {"total": -1}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 1"}, {"call": "recursiveSum([2, [], [-3]])", "locals": "total = -1", "returns": -1}], "event": "return"}, "note": "The middle call finishes 2 + 0 + -3 = -1 and returns it. Its frame is popped."}, {"line": 6, "vars": {"result": 4, "total": 4}, "structure": {"kind": "calls", "frames": [{"call": "recursiveSum([1, [2, [], [-3]], 4])", "locals": "total = 4", "returns": 4}], "event": "return"}, "note": "The outer call adds -1, then 4, to reach 4 and returns the answer. The stack is empty again."}]}
  },
  'algo-tree-depth': {
    'reasoning': 'A leaf contributes one node. Each parent contributes one plus its largest child depth because a route follows a single child, not all siblings. Null has no nodes and returns zero.',
    'trace': 'For a root with a leaf child and another child containing a leaf, child depths are 1 and 2. The root returns 1 + max(1, 2) = 3, even if its value is zero.',
    'alternative': 'A breadth-first traversal can count whole levels instead. Both visit O(n) nodes; recursive traversal needs O(d) call depth, while a level queue may hold O(n) nodes in a wide tree.',
    'counterexample': 'Adding sibling depths measures something else: a root with two leaves has depth 2, not 3. Counting edges gives 0 for a leaf, but this contract counts nodes.',
    'transfer': 'Self-review: return the values along a deepest route. Define a tie rule for equal-depth routes before changing the implementation.',
    'traceSteps': {"code": ["type TreeNode = {value: number; children: TreeNode[]}; function treeDepth(root: TreeNode | null): number {", "  if (root === null) return 0", "  let deepest = 0", "  for (const child of root.children) {", "    deepest = Math.max(deepest, treeDepth(child))", "  }", "  return 1 + deepest", "}"], "input": "root = {value: 0, children: [{value: 7, children: []}, {value: 2, children: [{value: 3, children: []}]}]}", "steps": [{"line": 2, "vars": {"node": 0, "deepest": 0}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "root", "visited": []}, "note": "Start at the root, node 0, with no child depth yet."}, {"line": 4, "vars": {"node": 7}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "a", "visited": []}, "note": "The first loop pass calls treeDepth on child 7."}, {"line": 6, "vars": {"node": 7, "depth": 1}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "a", "visited": ["a"]}, "note": "Node 7 has no children, so deepest stays 0 and it returns 1 + 0 = 1."}, {"line": 4, "vars": {"node": 0, "deepest": 1}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "root", "visited": ["a"]}, "note": "Back at the root, deepest becomes max(0, 1) = 1."}, {"line": 4, "vars": {"node": 3}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3}]}]}, "current": "c", "visited": ["a"]}, "note": "The second child, node 2, calls treeDepth on its own child, node 3."}, {"line": 6, "vars": {"node": 3, "depth": 1}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "children": [{"id": "c", "value": 3, "note": "depth 1"}]}]}, "current": "c", "visited": ["a", "c"]}, "note": "Node 3 is a leaf and returns 1."}, {"line": 6, "vars": {"node": 2, "depth": 2}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "note": "depth 2", "children": [{"id": "c", "value": 3, "note": "depth 1"}]}]}, "current": "b", "visited": ["a", "c", "b"]}, "note": "Node 2 adds itself to its deepest child: 1 + 1 = 2."}, {"line": 6, "vars": {"result": 3, "node": 0, "deepest": 2}, "structure": {"kind": "tree", "root": {"id": "root", "value": 0, "note": "depth 3", "children": [{"id": "a", "value": 7, "note": "depth 1"}, {"id": "b", "value": 2, "note": "depth 2", "children": [{"id": "c", "value": 3, "note": "depth 1"}]}]}, "current": "root", "visited": ["a", "c", "b"]}, "note": "The root takes the larger child depth, max(1, 2) = 2, and adds itself: 3."}]}
  },
  'algo-graph-reachable': {
    'reasoning': 'Validate endpoints before accepting equality. Every queued node is reachable from start. Marking nodes when queued prevents repeated discovery; exploring all reachable nodes finds target or exhausts the queue.',
    'trace': 'For [[1], [0], []], start 0, target 2: queue [0], discover 1, then explore 1. Its neighbor 0 is already seen. The queue ends without 2, so return false.',
    'alternative': 'Depth-first search with a stack also answers reachability but explores in a different order. BFS with a head index visits O(V + E) reachable nodes and listed edges, using O(V) extra space; repeatedly shifting an array can add copying work.',
    'counterexample': 'Returning true for start === target before validation accepts an empty graph with 0, 0. Treating connections as undirected incorrectly allows node 1 to reach 0 in [[1], []].',
    'transfer': 'Self-review: return the minimum number of connections instead of a boolean. Explain why BFS order matters and define the unreachable result.',
    'traceSteps': {"code": ["function graphReachable(graph: number[][], start: number, target: number): boolean {", "  if (start < 0 || target < 0 || start >= graph.length || target >= graph.length) return false", "  const queue = [start], seen = new Set([start])", "  let found = false", "  for (let head = 0; head < queue.length; head++) {", "    const node = queue[head]", "    if (node === target) { found = true; break }", "    for (const next of graph[node]) if (!seen.has(next)) { seen.add(next); queue.push(next) }", "  }", "  return found", "}"], "input": "graph = [[1], [0], []], start = 0, target = 2", "steps": [{"line": 1, "vars": {"start": 0, "target": 2}, "note": "Both endpoints are valid nodes, so the search can begin."}, {"line": 2, "vars": {"seen": "{0}"}, "structure": {"kind": "array", "values": [0]}, "note": "Discover the start before exploring it. The queue holds [0]."}, {"line": 5, "vars": {"head": 0, "node": 0, "seen": "{0}"}, "structure": {"kind": "array", "values": [0], "pointers": {"head": 0}}, "note": "Explore node 0, the front of the queue. It is not the target."}, {"line": 7, "vars": {"head": 0, "node": 0, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "pointers": {"head": 0}}, "note": "Node 0 links to unseen node 1, so mark it seen and add it to the back of the queue."}, {"line": 5, "vars": {"head": 1, "node": 1, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "pointers": {"head": 1}, "dimmed": [0]}, "note": "Node 0 is finished (dimmed). Explore node 1 next; it is not the target."}, {"line": 7, "vars": {"head": 1, "node": 1, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "pointers": {"head": 1}, "dimmed": [0]}, "note": "Node 1 links back to node 0, which is already seen, so nothing is queued. This stops the cycle."}, {"line": 9, "vars": {"result": false, "seen": "{0, 1}"}, "structure": {"kind": "array", "values": [0, 1], "dimmed": [0, 1]}, "note": "Every queued node has been explored without meeting node 2, so return false."}]}
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
    'transfer': 'Allow duplicates and require the first matching index. Explain why finding any match is no longer enough.',
    'traceSteps': {
      'code': [
        'function sortedIndex(numbers: number[], target: number): number {',
        '  let left = 0, right = numbers.length - 1',
        '  while (left <= right) {',
        '    const middle = Math.floor((left + right) / 2)',
        '    if (numbers[middle] === target) return middle',
        '    if (numbers[middle] < target) left = middle + 1',
        '    else right = middle - 1',
        '  }',
        '  return -1',
        '}'
      ],
      'input': 'numbers = [-3, 0, 4, 9], target = 4',
      'steps': [
        { 'line': 1, 'vars': { 'left': 0, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 0, 'right': 3 } }, 'note': 'Both pointers start at the ends of the sorted array, so the interval covers indices 0 to 3.' },
        { 'line': 2, 'vars': { 'left': 0, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 0, 'right': 3 } }, 'note': 'The interval still has positions, so the loop runs.' },
        { 'line': 3, 'vars': { 'left': 0, 'right': 3, 'middle': 1 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 0, 'right': 3, 'middle': 1 } }, 'note': 'The middle index is 1, and the value there is 0.' },
        { 'line': 5, 'vars': { 'left': 2, 'right': 3, 'middle': 1 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3 }, 'dimmed': [0, 1] }, 'note': 'Zero is less than the target 4, so left moves to index 2. Indices 0 and 1 are out of the interval.' },
        { 'line': 2, 'vars': { 'left': 2, 'right': 3 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3 }, 'dimmed': [0, 1] }, 'note': 'Indices 2 and 3 remain, so the loop continues.' },
        { 'line': 3, 'vars': { 'left': 2, 'right': 3, 'middle': 2 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3, 'middle': 2 }, 'dimmed': [0, 1] }, 'note': 'The new middle index is 2, and the value there is 4.' },
        { 'line': 4, 'vars': { 'left': 2, 'right': 3, 'middle': 2, 'result': 2 }, 'structure': { 'kind': 'array', 'values': [-3, 0, 4, 9], 'pointers': { 'left': 2, 'right': 3, 'middle': 2 }, 'dimmed': [0, 1] }, 'note': 'The value 4 matches the target, so the function returns index 2.' }
      ]
    }
  },
  'sort-score-records': {
    'reasoning': 'Comparing score first and name only on a score tie implements precedence. Returning equality for both matching keys preserves order with a stable sort.',
    'trace': 'Records z and a with score 0 and blank names remain z then a despite their IDs.',
    'alternative': 'Insertion into a copied list can preserve ties explicitly but takes quadratic time; stable built-in sorting is shorter. Sorting cost depends on the implementation, plus name comparisons.',
    'counterexample': 'Sorting scores as text puts 10 before 2. Using IDs as a third key reverses z and a on a complete tie.',
    'transfer': 'Self-review: change score to descending while retaining ascending names. Which comparison changes?'
  },
  'kth-smallest-copy': {
    'reasoning': 'Sorting a copy puts every occurrence at its numeric rank; position k minus one is therefore the requested occurrence. The copy preserves caller order.',
    'trace': '[2,2,9] has ranks 1=2, 2=2, 3=9; rank 4 returns null.',
    'alternative': 'Selection can avoid fully sorting but is more complex; sorting a copy uses O(n) storage with sorting time depending on the implementation.',
    'counterexample': 'Deduplicating [2,2,9] makes rank 2 equal 9 instead of 2.',
    'transfer': 'Self-review: request the kth distinct value. Define absent-rank behavior again.'
  },
  'flatten-nested-numbers': {
    'reasoning': 'Visiting children in their stored order and appending only numbers preserves the full left-to-right sequence. Empty arrays append nothing. Work is O(e) for all entries, with output and nesting storage.',
    'trace': '[0,[-1,0]] appends 0, then -1, then 0; repeated values survive.',
    'alternative': 'An explicit work stack avoids recursive calls but must reverse pushes to preserve order. Both inspect every entry.',
    'counterexample': 'Pushing children in forward order then popping yields [2,1] for [1,2].',
    'transfer': 'Self-review: return each value with its nesting level. Decide the outer level.'
  },
  'count-object-leaves': {
    'reasoning': 'Each property is either one primitive occurrence or a container whose contributions are combined. Null must be classified before other objects. Every property is visited once, O(p) time.',
    'trace': '{a:0,b:null,c:{}} contributes 1+1+0=2.',
    'alternative': 'An explicit stack avoids recursive call depth while using pending-object storage; recursion mirrors the object shape.',
    'counterexample': 'typeof null is object; treating null as a container throws instead of counting it.',
    'transfer': 'Self-review: also allow arrays. Decide whether array positions and empty arrays contribute.'
  },
  'tree-depth-sum': {
    'reasoning': 'A node contributes only at the requested depth. Combining all children at one less remaining depth includes each qualifying node once, O(n) time at worst with O(h) recursive depth.',
    'trace': 'Root 9 with children 2 and -3 gives -1 at depth 1; depth 2 has no nodes and gives 0.',
    'alternative': 'Level-order traversal stores a whole frontier but makes depth boundaries explicit; recursive traversal stores only a call path.',
    'counterexample': 'Returning the largest child value for children 2 and -3 gives 2 instead of -1.',
    'transfer': 'Self-review: total every level into an array. Define the null-tree result.'
  },
  'tree-value-path': {
    'reasoning': 'A successful child route can be prefixed with the current value; failed children contribute no route. Uniqueness removes tie-breaking. Each node is inspected at most once; path copying can add O(nh) work.',
    'trace': 'Searching 4 under root -1 explores 2→3 unsuccessfully, then returns [-1,4]; 2 and 3 never enter the successful route.',
    'alternative': 'An iterative frontier with copied paths avoids recursive calls but stores multiple paths. Parent links reduce copying at the cost of bookkeeping.',
    'counterexample': 'Keeping a global route without removing failed nodes yields [-1,2,3,4] instead of [-1,4].',
    'transfer': 'Self-review: allow duplicate values and return the first route in child order. Define first precisely.'
  },
  'graph-shortest-hops': {
    'reasoning': 'Breadth-first discovery processes nondecreasing hop counts, so a node’s first discovered distance is minimal. Marking on discovery avoids cycles. Time O(V+E), storage O(V).',
    'trace': 'From 0 in [[1,3],[2],[3],[]], both 1 and 3 have distance 1; the longer 0→1→2→3 route cannot improve 3.',
    'alternative': 'Repeated edge relaxation can also find distances but revisits edges; plain depth-first first-match search does not guarantee shortest routes.',
    'counterexample': 'First-match depth-first traversal may report 3 for the direct-edge example, whose answer is 1.',
    'transfer': 'Self-review: edges now have positive costs. Decide whether discovery order still guarantees the cheapest route.'
  },
  'graph-connected-groups': {
    'reasoning': 'Starting a traversal only from an unseen node counts one new component. Traversal marks exactly its connected group, preventing duplicate counts. Time O(V+E), storage O(V).',
    'trace': '[[0,1,1],[0,0],[2]] visits 0 and 1 together despite repeated edges, then counts isolated self-linked 2: total 2.',
    'alternative': 'Union-find combines endpoints and counts distinct representatives; traversal is easier to trace for this small adjacency contract.',
    'counterexample': 'Counting neighborless nodes alone misses a separate pair: [[1],[0],[3],[2]] has 2 groups despite no empty lists.',
    'transfer': 'Self-review: allow directed edges. Define weak versus strong connectivity before changing checks.'
  },
  'simplify-file-path': {
    'reasoning': 'The saved names represent the normalized prefix. A name extends it; a parent removes its latest name; a current-directory or empty segment leaves it unchanged. O(c) time and storage for c characters.',
    'trace': '/a/b/../../c saves a,b, removes b, removes a, then saves c, returning /c.',
    'alternative': 'Repeated string replacement is harder to bound and can confuse literal dot names; a segment stack states the parent rule directly.',
    'counterexample': 'Treating every dot-prefixed name as special loses .hidden and ... from /.../.hidden/.',
    'transfer': 'Self-review: support relative paths. Decide whether unmatched parent segments must remain.'
  },
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
  },
  'sort-score-records': {
    'plan': [
      'Which rule wins when scores differ? What should happen when both keys match?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Comparing score first and name only on a score tie implements precedence. Returning equality for both matching keys preserves order with a stable sort. Records z and a with score 0 and blank names remain z then a despite their IDs.'
  },
  'kth-smallest-copy': {
    'plan': [
      'How do duplicates affect rank? What should happen when the requested position is absent?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Sorting a copy puts every occurrence at its numeric rank; position k minus one is therefore the requested occurrence. The copy preserves caller order. [2,2,9] has ranks 1=2, 2=2, 3=9; rank 4 returns null.'
  },
  'flatten-nested-numbers': {
    'plan': [
      'What is the output order across nested boundaries? What contribution does an empty list make?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Visiting children in their stored order and appending only numbers preserves the full left-to-right sequence. Empty arrays append nothing. Work is O(e) for all entries, with output and nesting storage. [0,[-1,0]] appends 0, then -1, then 0; repeated values survive.'
  },
  'count-object-leaves': {
    'plan': [
      'Which supplied values count even when falsy? What does an empty nested object contribute?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Each property is either one primitive occurrence or a container whose contributions are combined. Null must be classified before other objects. Every property is visited once, O(p) time. {a:0,b:null,c:{}} contributes 1+1+0=2.'
  },
  'tree-depth-sum': {
    'plan': [
      'Which nodes qualify at depth zero? How do absent branches affect the total?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'A node contributes only at the requested depth. Combining all children at one less remaining depth includes each qualifying node once, O(n) time at worst with O(h) recursive depth. Root 9 with children 2 and -3 gives -1 at depth 1; depth 2 has no nodes and gives 0.'
  },
  'tree-value-path': {
    'plan': [
      'What should the route contain when root is target? How will absent targets differ from an empty route?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'A successful child route can be prefixed with the current value; failed children contribute no route. Uniqueness removes tie-breaking. Each node is inspected at most once; path copying can add O(nh) work. Searching 4 under root -1 explores 2→3 unsuccessfully, then returns [-1,4]; 2 and 3 never enter the successful route.'
  },
  'graph-shortest-hops': {
    'plan': [
      'What is being minimized? Which endpoint rules apply before considering a zero-hop route?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Breadth-first discovery processes nondecreasing hop counts, so a node’s first discovered distance is minimal. Marking on discovery avoids cycles. Time O(V+E), storage O(V). From 0 in [[1,3],[2],[3],[]], both 1 and 3 have distance 1; the longer 0→1→2→3 route cannot improve 3.'
  },
  'graph-connected-groups': {
    'plan': [
      'How are isolated nodes counted? When do two apparently separate routes belong to the same group?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'Starting a traversal only from an unseen node counts one new component. Traversal marks exactly its connected group, preventing duplicate counts. Time O(V+E), storage O(V). [[0,1,1],[0,0],[2]] visits 0 and 1 together despite repeated edges, then counts isolated self-linked 2: total 2.'
  },
  'simplify-file-path': {
    'plan': [
      'Which segments are special? What happens when a parent segment appears with no remaining name?',
      'Name a boundary before coding.'
    ],
    'explanation': [
      'Explain why your result matches the contract and preserves input.',
      'State time and storage costs; passing checks does not prove the implementation approach.'
    ],
    'example': 'The saved names represent the normalized prefix. A name extends it; a parent removes its latest name; a current-directory or empty segment leaves it unchanged. O(c) time and storage for c characters. /a/b/../../c saves a,b, removes b, removes a, then saves c, returning /c.'
  },
}
