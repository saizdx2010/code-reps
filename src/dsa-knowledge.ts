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
    'repIds': ['ds-stack-operations', 'ds-queue-operations', 'remaining-actions'],
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
    'repIds': ['algo-sorted-pair', 'sorted-offset-squares', 'reading-run-summary', 'algo-window-sum', 'algo-binary-search'],
    'related': ['arrays', 'lookup', 'complexity']
  }]
