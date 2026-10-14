# Algorithms & Data Structures

The combined path teaches structures and the techniques that use them together. Beginners can start with TypeScript declarations, arrays, and functions. Experienced learners can choose a later stage; stages are guidance, not locks.

## Playable progression

1. **Prepare the language:** values, types, typed arrays, and functions.
2. **Use collections:** declare and copy arrays; add, delete, and read Set members; set, overwrite, and query Map entries. Read the collection-operations lesson first.
3. **Apply arrays and text:** guided scanning, independent work, and distinct delayed recall through the existing journeys.
4. **Apply maps and sets:** membership, counting, tie rules, and lookup recall.
5. **Use stacks and queues:** read the operations lesson, practice LIFO and FIFO, then apply stacks to nesting and cancellation. Queue introductions use a small array-backed implementation and explain the cost of `shift`.
6. **Learn algorithm techniques:** read the techniques lesson, then practice sorted two-pointer pair sums, fixed-size window sums, and binary search.
7. **Sort, recurse, and explore structures:** sorting and merging, recursion, trees and graphs, binary search trees, and grids. Each has a journey; sorting, recursion, trees, binary search trees, and graphs also have lessons.
8. **Ranges, linked structures, and choices:** prefix sums, merged intervals, linked-list reversal, insertion, and removal, a min-heap, subsets, and introductory dynamic programming, followed by harder patterns and an interview round. Linked lists have a lesson.

`src/path.ts` owns the exact stage order and rep lists.

The three new Knowledge lessons contain worked traces, common mistakes, prediction questions, and separately revealed discussions. Each new rep has progressive hints, boundary checks, an independent reference implementation, and a task-specific post-attempt review.

Operations reps deliberately make the API explicit. Their checks verify outputs and preservation of inputs; learners review declarations and API choices themselves. Algorithm checks likewise do not prove a two-pointer, window, or binary-search implementation or its complexity. The array, lookup, stack, queue, two-pointer, window, binary-search, sorting, recursion, tree, and graph journeys each retain guided → independent → delayed recall evidence. Operations and algorithm reps outside a journey, such as the stack and queue operation introductions, do not establish retained skill when completed alone.

## Next expansion

Heaps, backtracking, and dynamic programming have playable reps (`src/dsa-advanced-reps.ts`), but each is an application without a journey. Linked lists now have a journey after the `linked-lists` lesson: guided `algo-linked-list-reverse`, independent `list-insert-sorted`, and recall `list-remove-value`, in trail order. Binary search trees have a lesson and a journey in `src/dsa-linked-reps.ts`: guided `bst-search-path`, independent `bst-latest-at-or-before`, and recall `bst-check-order`, which needs whole-subtree limits rather than the search itself. `bst-insert-copy`, insertion that copies only the search path, is optional practice before that recall. Keep one combined path while extending them in this order:

- Independent and delayed-recall applications for the existing heap, backtracking, and dynamic-programming reps, added only when practice shows a specific gap.

For each new structure, introduce its representation and operations before a guided application. Follow with a problem without approach clues and a distinct delayed-recall application. Implementing the structure from scratch should follow using it. Future stages are not shown as playable placeholders.

## Verification limits

Reference and regression tests validate authored behavior and important mistakes. Content validation checks coverage and links. Browser tests exercise discovery and a new rep through the existing editor/worker loop. These checks do not establish learner comprehension, retention effectiveness, assistive-technology support, or cross-platform/offline behavior.

## Independent applications and delayed recall

Sorting, recursion, trees, and graphs now have authored three-stage journeys in
`src/learning.ts`, with recurring variants in `src/fluency.ts`. Independent tasks
apply the skill to record ordering, flattening, level totals, and shortest routes.
After at least three days, recall uses ranked selection, object leaf counting,
tree routes, and connected groups. Hinted independence and early or hinted recall
remain practice evidence rather than retention.

Queues, two pointers, sliding windows, and binary search also have authored
three-stage journeys in `src/learning.ts`. Queues guide `ds-queue-operations`, then
apply FIFO order to `ticket-service-times`, and recalls `parcel-loading-turns`. Two
pointers guide `algo-sorted-pair`, then apply the technique to `sorted-offset-squares`,
and recalls `reading-run-summary`. Windows guide `algo-window-sum`, then count
`count-unique-windows`, and recalls `shortest-run-reaching-target`. Binary search guides
`algo-binary-search`, then finds `first-insertion-point`, and recalls
`smallest-daily-capacity`. Checks verify outputs and unchanged input. They do not
establish that the learner used a queue, two pointers, a window, or binary search, or
the time bound of that technique; the post-attempt review covers those points.

The stacks journey now uses `simplify-file-path` for its distinct delayed
application. `cancel-adjacent-ids` remains playable for saved-attempt compatibility
but no longer advances recurring stack recall. Earlier adjacent-pair journey
completions remain saved; the current retention rule requires the new path task.
These registrations do not place new reps into track stages; path wiring is
maintained separately. Automated checks verify contracts and evidence timing,
not learner transfer or learning effectiveness.

## Pattern Recognition

The companion **Pattern Recognition** track starts with **Recognize the pattern**: “See the shape, then solve the problem.” Its story-based questions ask learners to choose and justify a tool from the contract, including misleading similarities. Then an opening rep and interleaved existing problems invite a written choice before coding, without technique labels in stage titles. Existing rep titles, hints, and completion evidence remain shared with Problem solving; this introductory slice is not a blind assessment or a new measure of independence or retention.

The **Find your way across a floor plan** stage adds the `grids` journey: ordered open neighbours, independent room counting, and a warehouse robot's fewest moves after three days. Rectangular ASCII maps use side moves only and remain unchanged. Bounds inspection and shortest-route reviews include step-by-step grid tables. A new recognition question compares shortest-route candidates; recognition remains separate from coding independence.

**Harder patterns** adds `next-warmer-day` (strictly warmer future readings),
`top-k-frequent-tags` (frequency ranking with ASCII ties), `course-order`
(smallest eligible course first, duplicate requirements counted once), and
`longest-shared-sequence` (ordered, possibly gapped character matches). Each has
boundary checks, an independent reference, and a post-attempt visual trace.
**Choose under pressure** interleaves these with earlier range-total and selection
tasks in Pattern Recognition. Three new recognition questions compare future
reading, dependency, and shared-sequence candidates with near-misses. These four
applications have no new journey or recall evidence; recognition and completion
remain separate from independent and retained fluency.

The **Solve a two-part puzzle** stage uses an original greenhouse lamp log. Both function reps parse the same newline-separated tray readings; part 1 sums local maxima and part 2 counts occurrences within two units of each local maximum. Reviews show text becoming grouped numeric readings. The related part 2 encourages parser reuse and is adaptation practice, not a distinct delayed-recall task or retained-fluency claim. A recognition question contrasts preserving tray boundaries and duplicates with lossy shapes.
