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
  }
}
