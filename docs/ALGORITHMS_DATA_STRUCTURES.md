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

Operations reps deliberately make the API explicit. Their checks verify outputs and preservation of inputs; learners review declarations and API choices themselves. Algorithm checks likewise do not prove a two-pointer, window, or binary-search implementation or its complexity. Existing array, lookup, and stack journeys retain their guided → independent → delayed recall evidence. The new operations and algorithm reps have no retention journey yet, so completing them alone does not establish retained skill.

## Next expansion

Keep one combined path while adding complete stages in this order:

- Queue applications and fresh independent/recall tasks for the new techniques.
- Linked-list representation and traversal, followed by insertion/removal; recursion with explicit base cases.
- Sorting, tree representation, traversals, and binary search trees.
- Graph representation and breadth/depth-first traversal, then introductory dynamic programming.

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

The stacks journey now uses `simplify-file-path` for its distinct delayed
application. `cancel-adjacent-ids` remains playable for saved-attempt compatibility
but no longer advances recurring stack recall. Earlier adjacent-pair journey
completions remain saved; the current retention rule requires the new path task.
These registrations do not place new reps into track stages; path wiring is
maintained separately. Automated checks verify contracts and evidence timing,
not learner transfer or learning effectiveness.
