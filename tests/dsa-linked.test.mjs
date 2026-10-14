import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { runRep } from '../src/runner.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'

// tests/content.test.mjs runs each reference against its authored checks.
test('linked-list and binary search tree checks reject characteristic mistakes', () => {
  const mistakes = {
    'list-insert-sorted': [
      // Drops a value larger than every node.
      'function insertSorted(head, value) { if (!head) return { value, next: null }; const out = { value: 0, next: null }; let t = out; let done = false; for (let p = head; p; p = p.next) { if (!done && value < p.value) { t = t.next = { value, next: null }; done = true } t = t.next = { value: p.value, next: null } } return out.next }',
      // Prepends while copying, reversing the values.
      'function insertSorted(head, value) { let out = null; let done = false; for (let p = head; p; p = p.next) { if (!done && value < p.value) { out = { value, next: out }; done = true } out = { value: p.value, next: out } } return done ? out : { value, next: out } }',
      // Relinks the caller’s nodes.
      'function insertSorted(head, value) { if (!head || value < head.value) return { value, next: head }; let p = head; while (p.next && p.next.value <= value) p = p.next; p.next = { value, next: p.next }; return head }',
    ],
    'list-remove-value': [
      // Keeps a matching head.
      'function removeValue(head, value) { if (!head) return null; const out = { value: head.value, next: null }; let t = out; for (let p = head.next; p; p = p.next) if (p.value !== value) t = t.next = { value: p.value, next: null }; return out }',
      // Skips only one of two adjacent matches.
      'function removeValue(head, value) { const out = { value: 0, next: null }; let t = out; for (let p = head; p; p = p.next) { if (p.value === value) { p = p.next; if (!p) break } t = t.next = { value: p.value, next: null } } return out.next }',
      // Stops at a zero value.
      'function removeValue(head, value) { const out = { value: 0, next: null }; let t = out; for (let p = head; p && p.value; p = p.next) if (p.value !== value) t = t.next = { value: p.value, next: null }; return out.next }',
    ],
    'bst-search-path': [
      // Searches every node depth-first.
      'function searchPath(root, target) { const path = []; const walk = n => { if (!n) return false; path.push(n.value); return n.value === target || walk(n.left) || walk(n.right) }; const found = walk(root); return { path, found } }',
      // Stops at a zero-valued node.
      'function searchPath(root, target) { const path = []; let n = root; while (n && n.value) { path.push(n.value); if (n.value === target) return { path, found: true }; n = target < n.value ? n.left : n.right } return { path, found: false } }',
    ],
    'bst-latest-at-or-before': [
      // Returns the first node at or before time on the path.
      'function latestAtOrBefore(root, time) { for (let n = root; n; n = time < n.value ? n.left : n.right) if (n.value <= time) return n.value; return null }',
      // Treats a booking at midnight as no booking.
      'function latestAtOrBefore(root, time) { let best = null; for (let n = root; n; ) { if (n.value <= time) { best = n.value; n = n.right } else n = n.left } return best || null }',
      // Uses a strict comparison.
      'function latestAtOrBefore(root, time) { let best = null; for (let n = root; n; ) { if (n.value < time) { best = n.value; n = n.right } else n = n.left } return best }',
    ],
    'bst-insert-copy': [
      // Attaches the leaf to the caller’s node.
      'function insertCopy(root, value) { const leaf = { value, left: null, right: null }; if (!root) return leaf; let p = root; for (;;) { if (p.value === value) return root; const side = value < p.value ? "left" : "right"; if (!p[side]) { p[side] = leaf; return root } p = p[side] } }',
      // Adds a duplicate to the right of an equal value.
      'function insertCopy(root, value) { if (!root) return { value, left: null, right: null }; return value < root.value ? { ...root, left: insertCopy(root.left, value) } : { ...root, right: insertCopy(root.right, value) } }',
      // Returns the new leaf instead of the whole tree.
      'function insertCopy(root, value) { const leaf = { value, left: null, right: null }; return leaf }',
    ],
    'bst-check-order': [
      // Compares each node only with its direct children.
      'function isOrdered(root) { if (!root) return true; if (root.left && root.left.value >= root.value) return false; if (root.right && root.right.value <= root.value) return false; return isOrdered(root.left) && isOrdered(root.right) }',
      // Allows equal values.
      'function isOrdered(root, low = -Infinity, high = Infinity) { if (!root) return true; if (root.value < low || root.value > high) return false; return isOrdered(root.left, low, root.value) && isOrdered(root.right, root.value, high) }',
      // Uses the value limits as strict sentinels.
      'function isOrdered(root, low = -1000, high = 1000) { if (!root) return true; if (root.value <= low || root.value >= high) return false; return isOrdered(root.left, low, root.value) && isOrdered(root.right, root.value, high) }',
    ],
  }
  for (const [id, codes] of Object.entries(mistakes))
    for (const code of codes)
      assert.ok(
        runRep(code, id).some(check => !check.passed),
        `${id} accepted: ${code.slice(0, 80)}`,
      )
})

test('linked-list references allocate fresh nodes and leave input links unchanged', () => {
  for (const [id, name, extra] of [
    ['list-insert-sorted', 'insertSorted', 3],
    ['list-remove-value', 'removeValue', 9],
  ]) {
    const solve = new Function(`${compileSolution(dsaSolutions[id], name)}\nreturn ${name}`)()
    const tail = { value: 4, next: null }
    const head = { value: 1, next: tail }
    const inputs = new Set([head, tail])
    const result = solve(head, extra)
    for (let p = result; p; p = p.next) assert.ok(!inputs.has(p), `${id} reused an input node`)
    assert.equal(head.next, tail)
    assert.equal(tail.next, null)
  }
})

test('the binary search tree journey has distinct guided, independent, and recall reps', () => {
  const journey = journeys.find(journey => journey.id === 'binary-search-trees')
  assert.deepEqual([journey.guided, journey.independent, journey.recall], ['bst-search-path', 'bst-latest-at-or-before', 'bst-check-order'])
  assert.equal(recallVariants['binary-search-trees'][0], journey.recall)
})

test('linked lists form a journey in trail order, and BST insertion is optional practice before recall', () => {
  const lists = journeys.find(journey => journey.id === 'linked-lists')
  assert.deepEqual([lists.guided, lists.independent, lists.recall], ['algo-linked-list-reverse', 'list-insert-sorted', 'list-remove-value'])
  assert.equal(recallVariants['linked-lists'][0], lists.recall)
  const trees = journeys.find(journey => journey.id === 'binary-search-trees')
  assert.deepEqual(trees.practice, ['bst-insert-copy'])
  assert.ok(!recallVariants['binary-search-trees'].includes('bst-insert-copy'))
})
