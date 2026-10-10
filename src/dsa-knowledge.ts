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
  }, {
    'id': 'sorting-basics',
    'title': 'Sort without changing the original',
    'summary': 'Order values by building a sorted portion, merge two sorted lists, and choose comparison rules deliberately.',
    'prerequisites': ['array-techniques', 'collection-operations'],
    'objectives': ['Trace insertion sort and state what is already ordered after each step.', 'Merge two sorted lists by comparing their next unused values.', 'Write a comparator that orders numbers, ties, and records as the contract says.'],
    'sections': [{
        'title': 'Grow a sorted portion',
        'body': 'Insertion sort keeps the left part of a copied array in order. Take the next value, shift larger sorted values one place right, and drop the value into the gap. After step i the first i + 1 values are ordered, though not yet final for the whole array. Shifting only while the neighbour is strictly larger keeps equal values in their original order. Worst-case time is O(n squared); an already-sorted input needs only about n comparisons. Copy first with [...values] when the caller owns the array.'
      }, {
        'title': 'Merge two sorted lists',
        'body': 'Two sorted lists need no new sort. Keep one index in each list, compare the two next unused values, append the smaller, and advance that index. When one list is exhausted, append the rest of the other. Taking the left value on a tie keeps equal values stable. Every value is appended once: O(n + m) time and O(n + m) output space. Neither input is changed.'
      }, {
        'title': 'Say what the order means',
        'body': 'JavaScript sort without a comparator compares values as text, so [10, 9, 1].sort() gives [1, 10, 9]. Pass a comparator such as (a, b) => a - b for numbers: negative puts a first, positive puts b first, zero keeps their relative order (sort is stable). Sort changes the array it is called on, so copy first. For records, compare score, then break ties by name; the contract must name the string rule, such as character codes or case-insensitive. A rank like kth smallest counts duplicate positions separately, so sort a copy and read index k - 1.'
      }, {
        'title': 'Check the claim, not only the output',
        'body': 'Passing checks show results on the authored inputs. They do not show that you implemented insertion sort, kept the input unchanged under every call, or kept ties stable. Inspect your code against those claims after the checks pass.'
      }],
    'example': '// insertionSort([3, 1, 3, -2]) on a copy\n// [3 | 1, 3, -2]  start: first value is a sorted portion\n// [1, 3 | 3, -2]  1 shifts 3 right\n// [1, 3, 3 | -2]  3 is not larger than 3, so it stays\n// [-2, 1, 3, 3]  -2 shifts three values right',
    'walkthrough': ['The bar separates the sorted portion from values not yet placed.', 'Each new value moves left only past strictly larger values, so the equal 3s keep their order.', 'After the last placement the sorted portion is the whole array.', 'The caller\'s array is still [3, 1, 3, -2] because only the copy was shifted.'],
    'mistakes': ['Calling sort() on numbers without a comparator and getting text order.', 'Sorting the caller\'s array in place when the contract says not to change it.', 'Shifting while the neighbour is larger or equal, which reorders equal values.', 'Forgetting to append the leftover tail after one merge input runs out.'],
    'questions': [{
        'id': 'sort-default-order-v1',
        'prompt': 'What does this expression return?',
        'code': '[10, 9, 1].sort()',
        'options': ['[1, 9, 10]', '[1, 10, 9]', '[10, 9, 1]'],
        'answer': 1,
        'explanation': 'Without a comparator the values are compared as text, and "10" comes before "9". Numbers need (a, b) => a - b.'
      }, {
        'id': 'merge-tail-v1',
        'prompt': 'After comparing values, the left list is used up. What must the merge do next?',
        'code': 'left = [1], right = [2, 3, 4]\nresult so far: [1]',
        'options': ['Stop, because the result already has the smallest value', 'Append the rest of right in its existing order', 'Sort the result again'],
        'answer': 1,
        'explanation': 'The remaining right values are sorted and all at least as large as what was taken. Append them; no new sort is needed.'
      }, {
        'id': 'insertion-tie-v1',
        'prompt': 'Which shift rule keeps equal values in their original order?',
        'code': '// moving value into the sorted portion',
        'options': ['Shift while the neighbour is strictly larger', 'Shift while the neighbour is larger or equal', 'Shift every value in the sorted portion'],
        'answer': 0,
        'explanation': 'Stopping at an equal neighbour leaves the earlier equal value in front. Shifting past equals would swap them.'
      }],
    'repIds': ['algo-insertion-sort', 'algo-merge-sorted', 'sort-score-records', 'kth-smallest-copy'],
    'related': ['array-techniques', 'complexity', 'arrays']
  }, {
    'id': 'recursion-basics',
    'title': 'Recursion: a base case and a smaller problem',
    'summary': 'Solve nested data by handling the simplest case directly and letting a smaller copy of the task do the rest.',
    'prerequisites': ['control-flow', 'arrays'],
    'objectives': ['Name the base case and the smaller problem for a recursive function.', 'Trace calls and returns for a nested list.', 'Explain what happens when the base case is missing or the input does not shrink.'],
    'sections': [{
        'title': 'Two parts, always',
        'body': 'A recursive function calls itself. It needs a base case, an input simple enough to answer directly, and a recursive case that passes a smaller or simpler input to the same function and combines the result. For summing a nested list, the base cases are a plain number (answer: itself) and an empty list (answer: 0). The recursive case sums every item of a list, treating each nested list as the same task. If the input never gets closer to a base case, calls never stop.'
      }, {
        'title': 'Trace calls and returns',
        'body': 'Each call waits on the calls it made until they return, so unfinished work is stacked up. Trace by writing the call, the smaller calls it makes, and what each returns. For [1, [2, []]], the outer call adds 1 to the result of the call on [2, []], which adds 2 to the result for [], which is 0. Results combine on the way back: 0, then 2, then 3. Very deep nesting can exhaust the call stack and throw a RangeError, so recursion suits data whose depth is modest.'
      }, {
        'title': 'Nested arrays and objects',
        'body': 'Use Array.isArray(item) to tell a nested list from a number. For objects, loop over Object.values and recurse into values that are objects; null needs its own check because typeof null is "object". Flattening collects numbers into one new array in left-to-right order: build a result, then append what each recursive call returns. Counting leaves counts a primitive as 1 and an empty object as 0. Do not change the input while walking it.'
      }, {
        'title': 'Cost and limits',
        'body': 'When each value is visited once, time is O(n) for n values and the extra stack space is O(depth). A function that makes two recursive calls on nearly the same input can repeat work exponentially; that is a different problem from nested data. Checks show results on authored inputs, not that your function is recursive or terminates on every input.'
      }],
    'example': '// recursiveSum([1, [2, [], [-3]], 4])\n// 1                      -> 1\n// [2, [], [-3]]  -> 2 + 0 + (-3) = -1\n// 4                      -> 4\n// total: 1 + (-1) + 4 = 4',
    'walkthrough': ['Plain numbers are base cases and return themselves.', 'The empty list is a base case and returns 0 without any calls.', 'The nested list [-3] is a smaller copy of the same task and returns -3.', 'Results combine as the calls return, giving 4, and the input arrays are unchanged.'],
    'mistakes': ['Omitting the empty-list base case and indexing past the end.', 'Recursing on the same input, so calls never end.', 'Treating null as an object and reading its properties.', 'Pushing into a shared result in a way that mutates the caller\'s data.'],
    'questions': [{
        'id': 'recursion-base-case-v1',
        'prompt': 'What is the missing base case for summing a list of numbers recursively?',
        'code': 'function total(items: number[]): number {\n  return items[0] + total(items.slice(1))\n}',
        'options': ['An empty list returns 0', 'A list of length 3 returns 3', 'A list with a negative first value returns 0'],
        'answer': 0,
        'explanation': 'Each call shortens the list. Without a stop at the empty list, items[0] becomes undefined and the calls continue until the stack overflows.'
      }, {
        'id': 'recursion-trace-v1',
        'prompt': 'What does this call return?',
        'code': 'recursiveSum([1, [2, []]])',
        'options': ['1', '3', '5'],
        'answer': 1,
        'explanation': 'The empty list contributes 0, the inner list contributes 2 + 0, and the outer call adds 1 to give 3.'
      }, {
        'id': 'recursion-null-leaf-v1',
        'prompt': 'Why check for null before treating a value as a nested object?',
        'code': 'typeof null === "object"',
        'options': ['null is an array', 'typeof reports null as "object", but it has no properties to walk', 'null is slower to read'],
        'answer': 1,
        'explanation': 'A typeof test alone would send null into Object.values and throw. In a leaf count, null is a leaf.'
      }],
    'repIds': ['algo-recursive-sum', 'flatten-nested-numbers', 'count-object-leaves'],
    'related': ['sorting-basics', 'arrays', 'stacks']
  }]
