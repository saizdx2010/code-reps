import type { Skill } from './knowledge.ts'

export const dsaSkills: Skill[] = [{
    'id': 'collection-operations',
    'title': 'Use collections before solving problems',
    'summary': 'Declare arrays, sets, and maps; practise their operations and distinguish absence from stored values.',
    'prerequisites': ['values'],
    'objectives': ['Create typed collections and read their contents.', 'Distinguish array order, set membership, and map associations.', 'Copy caller-owned arrays before updating them.'],
    'sections': [{
        'title': 'An ordered array',
        'body': 'const values: number[] = [] declares an empty array of numbers. push adds at the end; pop removes and returns the last item, or undefined when empty. values.length counts items. values[index] reads a zero-based position. Spread, [...values], creates a separate shallow array: nested objects would still share references. const prevents reassignment of the name, not changes to the array.'
      }, {
        'title': 'Distinct values in a set',
        'body': 'const seen = new Set<number>() creates an empty set. add(value) inserts a value; has(value) checks membership; delete(value) removes it; size counts distinct values. Adding the same number twice keeps one member. Deleting an absent member is allowed. Use for...of to visit values in insertion order. A set does not offer array-style indexing.'
      }, {
        'title': 'Associated values in a map',
        'body': 'const counts = new Map<string, number>() associates text keys with numbers. set(key, value) creates or replaces an association; get(key) reads it; has(key) distinguishes presence; delete(key) removes it; size counts keys. for (const [key, value] of counts) visits entries in insertion order. A missing get returns undefined. A stored zero is still present: use ?? rather than || when defaulting only missing values.'
      }, {
        'title': 'Choose by the question',
        'body': 'Use an array when position and repeated values matter, a set for distinct membership, and a map for values associated with keys. Copying n array items takes O(n) time and space. Sets and maps store their distinct members or keys; access is efficient on average, without a universal worst-case constant-time promise. Output checks cannot establish which API you used: inspect your implementation after checking.'
      }],
    'example': 'const values: number[] = [0, 2]\nconst copy = [...values]\ncopy.push(2) // [0, 2, 2]\nconst seen = new Set<number>(copy) // {0, 2}\nconst scores = new Map<string, number>()\nscores.set("Ada", 0)\nscores.get("Ada") ?? null // 0',
    'walkthrough': ['The copy has a separate array identity; values remains [0, 2].', 'Appending keeps repeated values in the array.', 'Constructing a set keeps only the two distinct numbers.', 'The map stores zero for Ada; reading a missing key would produce undefined instead.'],
    'mistakes': ['Using array.length on a Set instead of size.', 'Using map[key] rather than get(key).', 'Using || null and discarding a legitimate zero.', 'Mutating the original array through a second name pointing at it.'],
    'questions': [{
        'id': 'set-size-v1',
        'prompt': 'What is the final size?',
        'code': 'const seen = new Set([2, 2])\nseen.add(3)\nseen.delete(2)',
        'options': ['0', '1', '2'],
        'answer': 1,
        'explanation': 'Only 3 remains. Repeated 2 was one member.'
      }, {
        'id': 'map-zero-v1',
        'prompt': 'What does this expression return?',
        'code': 'const scores = new Map([["Ada", 0]])\nscores.get("Ada") ?? null',
        'options': ['null', '0', 'undefined'],
        'answer': 1,
        'explanation': 'Nullish coalescing keeps zero; only null and undefined trigger the fallback.'
      }],
    'repIds': ['ds-array-operations', 'ds-set-operations', 'ds-map-operations'],
    'related': ['arrays', 'lookup', 'stacks', 'queues']
  }, {
    'id': 'queues',
    'title': 'Stack and queue operations',
    'summary': 'Trace last-in, first-out and first-in, first-out before applying them to a larger task.',
    'prerequisites': ['collection-operations'],
    'objectives': ['Trace push, pop, enqueue, dequeue, and peek.', 'Handle an empty structure without discarding zero.', 'Explain the cost of an array-backed queue.'],
    'sections': [{
        'title': 'A stack serves the newest item',
        'body': 'An array can be a stack: push adds at its end, pop removes from that end, and stack[stack.length - 1] peeks without removing. Last in, first out suits unfinished nested work and undo. An empty pop or peek yields undefined; translate that to null only when your contract asks for it.'
      }, {
        'title': 'A queue serves the oldest item',
        'body': 'For a small queue, push adds at the back and shift removes the front. queue[0] peeks at the next item. First in, first out suits a waiting line: an earlier arrival is served before a later one. TypeScript has no built-in Queue class; here we use a typed array.'
      }, {
        'title': 'Operations have costs',
        'body': 'Copy the input when it belongs to the caller. An array shift can move the remaining items, so repeated dequeue operations can be costly. A head index can avoid shifting on every removal, but consumed entries still occupy storage until you reclaim them. Introduce that implementation after the ordering behavior is understood.'
      }],
    'example': 'const stack: number[] = [4, 7]\nstack.push(9)\nstack.pop() // 9\nconst queue: number[] = [4, 7]\nqueue.push(9)\nqueue.shift() // 4',
    'walkthrough': ['Both structures start with 4 then 7 and receive 9.', 'The stack removes the most recent value, 9; its new top is 7.', 'The queue removes the oldest value, 4; its new front is 7.', 'With only [4] initially, push 9 then pop leaves 4, while push 9 then shift leaves 9.'],
    'mistakes': ['Using pop when a task needs first-in, first-out.', 'Treating zero at the front as an empty queue.', 'Assuming repeated shift operations always take constant time.'],
    'questions': [{
        'id': 'fifo-v1',
        'prompt': 'What remains after this dequeue?',
        'code': 'const queue = [4]\nqueue.push(9)\nqueue.shift()',
        'options': ['[4]', '[9]', '[]'],
        'answer': 1,
        'explanation': '4 arrived first and leaves first; 9 remains.'
      }, {
        'id': 'empty-peek-v1',
        'prompt': 'What does this peek return?',
        'code': 'const stack: number[] = []\nstack[stack.length - 1] ?? null',
        'options': ['0', 'undefined', 'null'],
        'answer': 2,
        'explanation': 'The read is undefined; the explicit fallback converts absence to null.'
      }],
    'repIds': ['ds-stack-operations', 'ds-queue-operations', 'remaining-actions', 'ticket-service-times', 'parcel-loading-turns'],
    'related': ['collection-operations', 'stacks', 'complexity']
  }, {
    'id': 'array-techniques',
    'title': 'Two pointers, windows, and binary search',
    'summary': 'Use ordering or a maintained interval to avoid repeating work.',
    'prerequisites': ['arrays', 'collection-operations'],
    'objectives': ['Justify two-pointer moves using sorted order.', 'Maintain the sum of exactly k consecutive values.', 'Shrink a binary-search interval on every unsuccessful comparison.'],
    'sections': [{
        'title': 'Two pointers',
        'body': 'For a sorted pair-sum task, start at the left and right ends. A sum below the target means the left value cannot work with any remaining partner, so move left forward. A sum above the target similarly discards the right value. Stop when they meet: two different positions are required. Each move discards a position, giving O(n) time and O(1) extra space.'
      }, {
        'title': 'A fixed-size window',
        'body': 'First sum k consecutive values. When the window moves one place, subtract the outgoing value and add the incoming one. Initialize the best sum from a real complete window, not zero: all values may be negative. Each value enters and leaves at most once, so the scan takes O(n) time and O(1) extra space. This fixed-size rule does not by itself justify variable-size windows with negative values.'
      }, {
        'title': 'Binary search',
        'body': 'Binary search needs sorted input. Keep an inclusive interval [left, right], read its middle, and compare with the target. On a mismatch, set left to middle + 1 or right to middle - 1. Excluding the middle makes progress even for a two-item interval. An exhausted interval has left > right. Each step approximately halves the candidates: O(log n) comparisons and O(1) extra space. Finding the first of duplicate values needs a different boundary rule.'
      }, {
        'title': 'Explain before optimizing',
        'body': 'A simple scan or nested loop can be a useful baseline. Compare it with the optimized approach and identify the assumption that makes skipping work safe. Behavioral checks establish returned results on authored inputs; they do not establish the algorithm, its complexity, or independent understanding.'
      }],
    'example': '// Binary search for 4 in [1, 3, 5]:\n// left=0, right=2, middle=1: value 3 < 4\n// left=2, right=2, middle=2: value 5 > 4\n// left=2, right=1: interval exhausted, return -1',
    'walkthrough': ['Sorted order allows discarding 1 and 3 after inspecting 3.', 'Inspecting 5 discards the last remaining candidate.', 'left exceeds right, so absence is established.', 'The original array is never changed.'],
    'mistakes': ['Applying the sorted pair strategy to an unsorted array.', 'Initializing a maximum window sum to zero.', 'Keeping the middle in a failed search interval and looping forever.', 'Claiming passing output checks proves logarithmic time.'],
    'questions': [{
        'id': 'negative-window-v1',
        'prompt': 'What is the largest sum of two consecutive values?',
        'code': '[-5, -2, -7]',
        'options': ['0', '-7', '-9'],
        'answer': 1,
        'explanation': 'The complete windows sum to -7 and -9. Zero is not a window sum.'
      }, {
        'id': 'search-progress-v1',
        'prompt': 'If the middle value is below target, which update discards it?',
        'code': '// Inclusive [left, right] interval',
        'options': ['left = middle', 'right = middle - 1', 'left = middle + 1'],
        'answer': 2,
        'explanation': 'The middle does not match and every value to its left is too small. Exclude it to guarantee progress.'
      }],
    'repIds': ['algo-sorted-pair', 'sorted-offset-squares', 'reading-run-summary', 'algo-window-sum', 'count-unique-windows', 'shortest-run-reaching-target', 'algo-binary-search', 'first-insertion-point', 'smallest-daily-capacity'],
    'related': ['arrays', 'lookup', 'complexity']
  }]

// Appended together to keep parallel lesson additions independent.
dsaSkills.push({
  id: 'trees',
  title: 'Trees: routes, levels, and child results',
  summary: 'Read a branching structure and combine smaller results without changing its nodes.',
  prerequisites: ['arrays', 'control-flow'],
  objectives: ['Identify roots, children, leaves, and subtrees.', 'Distinguish node-count depth from zero-based levels.', 'Trace recursive child results and compare depth-first with breadth-first traversal.'],
  sections: [{
    title: 'A tree describes a hierarchy',
    body: 'A node holds a value and a children array. The root is the starting node; a child is one step below its parent; a leaf has no children. A subtree is a node together with all its descendants. These reps use finite rooted trees with no cycles or shared child nodes, not necessarily binary trees. Depth and level-sum trees may contain repeated values; the route rep requires unique values. Zero is valid data, not an absent node. Read the diagram in the worked example from top to bottom.'
  }, {
    title: 'Count nodes or edges deliberately',
    body: 'For maximum depth, the existing rep counts nodes on the longest root-to-leaf route: null has depth 0 and a lone root has depth 1. For a level sum, the root is at level (depth) 0 and each edge adds 1. A root with one child therefore has maximum node-count depth 2, but its child is at level 1. Always state the convention before calculating.'
  }, {
    title: 'Solve the same smaller question',
    body: 'Recursion means a function calls itself on a smaller part. For maximum depth, an absent tree returns 0; a real node returns 1 plus the largest child depth, using 0 when there are no children. Each call moves to a descendant, so a finite tree eventually reaches leaves. For a level sum, carry the level or decrease the requested remaining depth; add only values at the requested level. Keep caller-owned nodes and child arrays unchanged.'
  }, {
    title: 'Choose the visiting order',
    body: 'Depth-first search finishes a child subtree before moving to its sibling. Recursion keeps unfinished work on the call stack; an explicit stack is an alternative that avoids deep recursive calls. Breadth-first search uses a queue to visit one level before the next. For an n-node tree of height h, depth-first traversal takes O(n) time and O(h) working stack space; breadth-first traversal needs working queue space proportional to the widest level when consumed entries are reclaimed. A skewed tree can make h equal n. Path output needs additional storage. For the route rep, unique values mean at most one route matches. Return its values including both endpoints; no match or a null root returns null.'
  }],
  example: '// Values (each position is a separate node):\n//       5          level 0\n//      / \\         \n//     0   8        level 1\n//    / \\          \n//   2   3          level 2\n// Node-count depths: leaves=1, node 0=2, root=3.\n// Sum at level 1: 0 + 8 = 8.\n// First route to value 3: [5, 0, 3].',
  walkthrough: ['Leaves 2, 3, and 8 each have no children, so each returns depth 1.', 'Node 0 combines its child depths: 1 + max(1, 1) = 2. Its zero value does not make it absent.', 'Root 5 combines depths 2 and 1: 1 + max(2, 1) = 3, rather than adding both branches.', 'At level 1 only nodes 0 and 8 contribute. At level 3 no nodes contribute, so the sum is 0.', 'Depth-first child-order search visits 5, 0, 2, 3 before 8; breadth-first order is 5, 0, 8, 2, 3.'],
  mistakes: ['Adding child depths instead of taking their maximum.', 'Mixing zero-based levels with node-count maximum depth.', 'Treating a zero-valued node as missing.', 'Assuming every tree has two children or is balanced.', 'Changing children with sort, shift, or splice while traversing.'],
  questions: [{
    id: 'trees-node-depth-v1',
    prompt: 'Using node-count maximum depth, what depth does this tree have?',
    code: '// 7\n// |\n// 0\n// |\n// 4',
    options: ['2', '3', '11'],
    answer: 1,
    explanation: 'The longest route contains three nodes. Two counts its edges; summing values does not measure depth.'
  }, {
    id: 'trees-level-sum-v1',
    prompt: 'With the root at level 0, what is the sum at level 1?',
    code: '//     4\n//    / \\\n//   0  -2\n//   |\n//   9',
    options: ['11', '9', '-2'],
    answer: 2,
    explanation: 'Only 0 and -2 are at level 1. The 9 is at level 2; the root is at level 0.'
  }],
  repIds: ['algo-tree-depth', 'tree-depth-sum', 'tree-value-path'],
  related: ['graphs', 'stacks', 'queues', 'complexity']
}, {
  id: 'graphs',
  title: 'Graphs: connections, discovery, and shortest hops',
  summary: 'Follow adjacency lists safely through cycles and distinguish reachability, shortest routes, and connected groups.',
  prerequisites: ['collection-operations', 'queues'],
  objectives: ['Read directed and undirected adjacency lists.', 'Use visited membership to avoid rediscovering nodes.', 'Explain why BFS finds shortest unweighted routes and why group counting needs every node.'],
  sections: [{
    title: 'Nodes and edges',
    body: 'A graph contains nodes (vertices) and connections (edges). In these reps, a node is an array index: graph[i] lists outgoing neighbors of node i. A directed edge 0 -> 1 allows travel from 0 to 1, not automatically back. An undirected edge is represented in both neighbor lists. Unlike these rooted trees, graphs may have cycles, self-links, duplicate edges, and disconnected nodes. An empty neighbor list means a node has no outgoing edges; it does not mean the node is absent.'
  }, {
    title: 'Separate discovery from processing',
    body: 'Breadth-first search (BFS) starts by marking the valid start visited and placing it in a queue. Remove the oldest pending node, inspect its outgoing neighbors, and mark each unseen neighbor visited before enqueueing it. Visited means already discovered, even if not yet processed. This prevents duplicate pending work when two routes meet, and stops cycles and self-links from continuing forever. Use a Set of node indices, not a test of their numeric truthiness: node 0 is valid.'
  }, {
    title: 'Reachability and shortest hops',
    body: 'Reachability asks whether any route exists; depth-first search can answer it too. Shortest hops counts edges, with every edge costing one. BFS processes distance 0, then 1, then 2, so the first discovery of a node gives its minimum hop count. Carry a distance with each queue entry or process complete levels. DFS may encounter a longer route first. BFS does not solve arbitrary weighted shortest paths. Validate endpoints first: a valid start reaches itself in zero hops; invalid endpoints return false for reachability and null for shortest hops. An unreachable valid target also returns null for shortest hops.'
  }, {
    title: 'Count all connected groups',
    body: 'The connected-groups rep uses reciprocal, undirected edges. Scan every node; when it is not visited, count a new group and traverse from it using one shared visited set. An isolated node counts as its own group, and an empty graph has zero groups. One traversal from one start cannot count disconnected groups. For V nodes and E neighbor entries, traversal takes O(V + E) time and O(V) working storage with a queue head index instead of repeated array shifts. That bound includes duplicate neighbor entries. Do not change the input graph. Recognition answers and behavioral checks do not establish which traversal the learner implemented.'
  }],
  example: '// Directed edges:\n// 0 --> 1 --> 3\n// |           ^\n// +---> 2 ----+     4 (isolated)\nconst graph = [[1, 2], [3], [3], [], []]\n// Queue entries are [node, distance].\n// Start: [[0, 0]], visited={0}\n// Process 0: [[1, 1], [2, 1]], visited={0,1,2}\n// Process 1: [[2, 1], [3, 2]], visited={0,1,2,3}\n// Process 2: 3 is already discovered; do not enqueue again.\n// Minimum hops 0 -> 3: 2. Hops 0 -> 4: null.',
  walkthrough: ['Index 4 exists even though graph[4] is empty. It cannot be reached from 0.', 'Processing 0 discovers 1 and 2 at distance 1 in neighbor-list order.', 'Processing 1 discovers 3 at distance 2; processing 2 does not duplicate it.', 'There is no edge out of 3, so 3 cannot reach 0 in this directed graph.', 'If every depicted edge were made reciprocal, scanning all nodes would find two undirected groups: {0,1,2,3} and {4}.'],
  mistakes: ['Assuming an outgoing edge also allows reverse travel.', 'Forgetting visited membership on a cycle or self-link.', 'Enqueueing a neighbor before checking and recording discovery.', 'Using the first DFS route as the shortest unweighted route.', 'Counting only the group containing node 0.', 'Returning zero for an invalid endpoint before validating it.'],
  questions: [{
    id: 'graphs-directed-reachability-v1',
    prompt: 'Can node 2 reach node 0 by following the directed edges?',
    code: 'const graph = [[1], [2], []]\n// 0 -> 1 -> 2',
    options: ['Yes, because all nodes are connected in the drawing', 'No, node 2 has no outgoing edges', 'Yes, every edge works in both directions'],
    answer: 1,
    explanation: 'Adjacency lists here contain outgoing edges only. No route leaves 2 toward 0.'
  }, {
    id: 'graphs-bfs-shortest-hops-v1',
    prompt: 'What is the minimum hop count from 0 to 3?',
    code: 'const graph = [[1, 3], [2], [3], [0]]\n// 0 -> 1 -> 2 -> 3\n// 0 ----------> 3 -> 0',
    options: ['1', '3', 'No route, because there is a cycle'],
    answer: 0,
    explanation: 'The direct edge reaches 3 in one hop. BFS discovers it while processing 0; a visited set handles the cycle.'
  }],
  repIds: ['algo-graph-reachable', 'graph-shortest-hops', 'graph-connected-groups'],
  related: ['trees', 'lookup', 'queues', 'complexity']
})
