# Algorithms & Data Structures

The combined path teaches structures and the techniques that use them together. Beginners can start with TypeScript declarations, arrays, and functions. Experienced learners can choose a later stage; stages are guidance, not locks.

## Playable progression

1. **Prepare the language:** values, types, typed arrays, and functions.
2. **Use collections:** declare and copy arrays; add, delete, and read Set members; set, overwrite, and query Map entries. Read the collection-operations lesson first.
3. **Apply arrays and text:** guided scanning, independent work, and distinct delayed recall through the existing journeys.
4. **Apply maps and sets:** membership, counting, tie rules, and lookup recall.
5. **Use stacks and queues:** read the operations lesson, practise LIFO and FIFO, then apply stacks to nesting and cancellation. Queue introductions use a small array-backed implementation and explain the cost of `shift`.
6. **Learn algorithm techniques:** read the techniques lesson, then practise sorted two-pointer pair sums, fixed-size window sums, and binary search.

The three new Knowledge lessons contain worked traces, common mistakes, prediction questions, and separately revealed discussions. Each new rep has progressive hints, boundary checks, an independent reference implementation, and a task-specific post-attempt review.

Operations reps deliberately make the API explicit. Their checks verify outputs and preservation of inputs; learners review declarations and API choices themselves. Algorithm checks likewise do not prove a two-pointer, window, or binary-search implementation or its complexity. The array, lookup, stack, queue, two-pointer, window, binary-search, sorting, recursion, tree, and graph journeys each retain guided → independent → delayed recall evidence. Operations and algorithm reps outside a journey, such as the stack and queue operation introductions, do not establish retained skill when completed alone.

## Next expansion

Keep one combined path while adding complete stages in this order:

- Linked-list representation and traversal, followed by insertion/removal.
- Binary search trees, then introductory dynamic programming.

For each new structure, introduce its representation and operations before a guided application. Follow with a problem without approach clues and a distinct delayed-recall application. Implementing the structure from scratch should follow using it. These future stages are not shown as playable placeholders.

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
