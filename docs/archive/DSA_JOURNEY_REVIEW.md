# Sorting, recursion, tree, and graph journey review

> **Archived 2026-10-12.** Historical record, not current behavior. Its fixes shipped; this is editorial review, not learner evidence.

Scope: the `sorting`, `recursion`, `trees`, and `graphs` journeys in `src/learning.ts`. For each, the lesson in `src/dsa-knowledge.ts`, the guided, independent, and recall reps, their hints, checks, and `src/review-dsa.ts` entries were read. Questions: how steep is each stage change, is recall a genuinely distinct application, do prompts or lessons leak the solution, and do the checks match the written contract.

Method limits: this is an editorial review plus an automated scan of every authored check input against the stated size, range, uniqueness, and reciprocity limits (no violations found). It is not learner evidence; difficulty judgments are the reviewer's, not observed completion data.

## Summary of changes

| Journey | Finding | Fix |
| --- | --- | --- |
| Sorting | Recall (`kth-smallest-copy`) was the guided result plus an index, and the lesson stated the method | New recall `closest-value-gap`; lesson sentence removed; old rep kept as a later recall variant |
| Recursion | Lesson stated the recall rep's counting rule | Sentence removed; no rep change |
| Trees | Independent to recall jumps from level sums to returning a route with dead ends | Two practice reps: `tree-value-depth` (search with not-found) and `tree-leaf-count`; new lesson section on searching |
| Graphs | Independent to recall adds an outer loop and shared visited set; direction reading is only tested implicitly | Two practice reps: `graph-reachable-count` (one traversal, count distinct) and `graph-incoming-counts` (direction) |

Repointing a journey's recall rep means a learner who earlier completed `kth-smallest-copy` as sorting recall no longer shows the journey as retained until they complete `closest-value-gap`. Their old attempt stays in history, and `kth-smallest-copy` remains a scheduled recall variant. Practice reps never gate a stage.

## Sorting (`algo-insertion-sort` → `sort-score-records` → `kth-smallest-copy`)

- **Difficulty transition.** Guided is a hand-written insertion sort on numbers (level 2). The independent rep changes the data (records), the comparison (two keys, ASCII string order), and introduces stability in one step. That is a real but manageable jump, since the lesson teaches comparators and stability and the guided note already raises stable equal values. No bridge added.
- **Recall distinctness.** Weak. `kthSmallest` is `sorted copy [k - 1]` with a null guard, which is the guided rep with one index. The lesson also said "sort a copy and read index k - 1", so recall could be answered from the lesson sentence. Replaced with `closest-value-gap` (smallest absolute difference between any two values): learners must see that ordering makes the closest values neighbours, an idea neither earlier rep exercises. A brute-force pairwise solution is allowed; the checks do not require sorting, and the trap is comparing only input neighbours.
- **Leaks.** Prompts and hints are clean (hint 3 of `sort-score-records` names the ID-tie case only as the last hint). The lesson sentence was the only leak and was shortened to "A rank counts duplicate positions separately."
- **Contract and check match.** Ranges, maximum lengths, the `k` up to 101 case, and input-mutation checks match the notes. No mismatch found.
- **Residual risk.** `closest-value-gap` is still a sorting-adjacent task; it tests the application, not that the learner chose sorting.

## Recursion (`algo-recursive-sum` → `flatten-nested-numbers` → `count-object-leaves`)

- **Difficulty transition.** Guided to independent keeps the same nested-array shape and changes the combine step from adding to concatenating in order. That is a small step, appropriate for the first independent attempt after a named-recursion guided rep. Independent to recall changes the container (plain objects, `Object.values`) and adds the `typeof null === "object"` trap; the lesson question `recursion-null-leaf-v1` prepares it. A reasonable, moderate step. No bridge added.
- **Recall distinctness.** Acceptable. It is not the previous answer with new values: container type, the leaf definition, and falsy leaves all change. The decision to count rather than collect is small, so it remains the least distant recall of the four.
- **Leaks.** The lesson said "Counting leaves counts a primitive as 1 and an empty object as 0", which restates the recall contract's answer. Removed. The recall hints (null is a leaf, trace falsy values) follow the prompt and are progressive.
- **Contract and check match.** The 100-property and 10-level limits are each tested. No mismatch found.

## Trees (`algo-tree-depth` → `tree-depth-sum` → `tree-value-path`)

- **Difficulty transition.** Guided to independent adds one new idea: pass a level down while combining child results (top-down), rather than returning a number up. Fine. Independent to recall is the steep step. `pathToValue` needs three things the earlier reps never ask for: search that may fail in a branch, a distinct not-found result that parents must react to, and a result that grows on the way back (the route). The lesson gave one sentence about it. Added `tree-value-depth` (search returning depth or -1, tests a dead-end branch and a legitimate depth 0) and `tree-leaf-count` (second recursive aggregate with the root-alone and null boundaries), plus a lesson section "Search for a value". These are optional practice reps listed between the independent and recall reps on the Trail; they never gate recall.
- **Recall distinctness.** Genuine: returns a route, not a number, and requires a not-found value. Not solvable from the previous answers.
- **Leaks.** No prompt leaks. Hint 3 of `tree-value-path` names "a match in a later sibling after a deeper dead end", acceptable as the final hint.
- **Contract and check match.** Unique values (required by the route rep) hold in every check; sizes and levels stay within 100 nodes and 10 levels. No mismatch found.

## Graphs (`algo-graph-reachable` → `graph-shortest-hops` → `graph-connected-groups`)

- **Difficulty transition.** Guided names BFS and teaches the visited set; independent adds distance without naming the technique. Good. Independent to recall switches from directed to undirected, drops a start node, and requires an outer loop with one shared visited set. The lesson explains the idea in a paragraph, but no earlier rep asks for a count of distinct visited nodes. Added `graph-reachable-count` (single traversal, return the size of the visited set; the one-way edge check makes direction matter) and `graph-incoming-counts` (read adjacency direction without traversal). Both are optional practice.
- **Recall distinctness.** Genuine for the outer-loop component count. The lesson's last section does describe the algorithm at idea level ("scan every node; count a new group when unvisited"); that is kept because the checked lesson objective is to explain why group counting needs every node. Treat a hint-free pass as evidence of applying a taught pattern, not of discovering it.
- **Leaks.** Prompts do not name a technique except in the guided rep. Hints are clean.
- **Contract and check match.** The reciprocal-edge requirement of `graph-connected-groups` is satisfied by every check input (verified by script). Maximum node and neighbour counts are covered. No mismatch found.

## What this review does not establish

- It does not show learners can now make each transition; that needs completion and hint data.
- Passing checks does not prove a particular approach (sorting, BFS, recursion) was used; the self-review guides remain responsible for that.
- The Indonesian glosses for three new vocabulary terms were authored here and were not reviewed by a native speaker.
