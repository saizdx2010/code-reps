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

test('linked-list journey and binary search tree practice checks reject characteristic mistakes', () => {
  const mistakes = {
    'list-merge-sorted': [
      // Stops when either list runs out.
      'function mergeSorted(a, b) { const out = { value: 0, next: null }; let t = out; while (a && b) { if (a.value <= b.value) { t = t.next = { value: a.value, next: null }; a = a.next } else { t = t.next = { value: b.value, next: null }; b = b.next } } return out.next }',
      // Advances both cursors on a tie and loses one value.
      'function mergeSorted(a, b) { const out = { value: 0, next: null }; let t = out; while (a || b) { if (!b || (a && a.value < b.value)) { t = t.next = { value: a.value, next: null }; a = a.next } else if (!a || b.value < a.value) { t = t.next = { value: b.value, next: null }; b = b.next } else { t = t.next = { value: a.value, next: null }; a = a.next; b = b.next } } return out.next }',
      // Appends the second list after the first without merging.
      'function mergeSorted(a, b) { const values = []; for (let p = a; p; p = p.next) values.push(p.value); for (let p = b; p; p = p.next) values.push(p.value); return values.reduceRight((next, value) => ({ value, next }), null) }',
    ],
    'list-split-at-first': [
      // Splits at the last match.
      'function splitAtTrack(head, track) { const values = []; for (let p = head; p; p = p.next) values.push(p.value); const i = values.lastIndexOf(track); const build = list => list.reduceRight((next, value) => ({ value, next }), null); return i < 0 ? { before: build(values), from: null } : { before: build(values.slice(0, i)), from: build(values.slice(i)) } }',
      // Treats track 0 as missing.
      'function splitAtTrack(head, track) { const values = []; for (let p = head; p; p = p.next) values.push(p.value); const i = track ? values.indexOf(track) : -1; const build = list => list.reduceRight((next, value) => ({ value, next }), null); return i < 0 ? { before: build(values), from: null } : { before: build(values.slice(0, i)), from: build(values.slice(i)) } }',
    ],
    'list-rotate-route': [
      // Rotates left instead of right.
      'function rotateRoute(head, k) { const values = []; for (let p = head; p; p = p.next) values.push(p.value); if (!values.length) return null; const cut = k % values.length; return [...values.slice(cut), ...values.slice(0, cut)].reduceRight((next, value) => ({ value, next }), null) }',
      // Forgets the modulo.
      'function rotateRoute(head, k) { const values = []; for (let p = head; p; p = p.next) values.push(p.value); if (!values.length) return null; const cut = Math.max(0, values.length - k); return [...values.slice(cut), ...values.slice(0, cut)].reduceRight((next, value) => ({ value, next }), null) }',
    ],
    'bst-insert-value': [
      // Adds a duplicate node for an existing time.
      'function insertTime(root, time) { if (root === null) return { value: time, left: null, right: null }; return time < root.value ? { ...root, left: insertTime(root.left, time) } : { ...root, right: insertTime(root.right, time) } }',
      // Changes the caller’s nodes.
      'function insertTime(root, time) { if (root === null) return { value: time, left: null, right: null }; if (time < root.value) root.left = insertTime(root.left, time); else if (time > root.value) root.right = insertTime(root.right, time); return root }',
      // Attaches at the first free child on the correct side of the root.
      'function insertTime(root, time) { if (root === null) return { value: time, left: null, right: null }; if (time === root.value) return root; const side = time < root.value ? "left" : "right"; const copy = n => n && { value: n.value, left: copy(n.left), right: copy(n.right) }; const out = copy(root); let n = out[side]; if (!n) { out[side] = { value: time, left: null, right: null }; return out } while (n.left && n.right) n = n.left; if (!n.left) n.left = { value: time, left: null, right: null }; else n.right = { value: time, left: null, right: null }; return out }',
    ],
    'bst-range-values': [
      // Excludes the end value.
      'function bookingsBetween(root, start, end) { const values = []; const walk = n => { if (!n) return; walk(n.left); if (n.value >= start && n.value < end) values.push(n.value); walk(n.right) }; walk(root); return values }',
      // Visits in pre-order, so values are not sorted.
      'function bookingsBetween(root, start, end) { const values = []; const walk = n => { if (!n) return; if (n.value >= start && n.value <= end) values.push(n.value); walk(n.left); walk(n.right) }; walk(root); return values }',
      // Skips the left subtree of every out-of-range node.
      'function bookingsBetween(root, start, end) { const values = []; const walk = n => { if (!n) return; const inside = n.value >= start && n.value <= end; if (inside) walk(n.left); if (inside) values.push(n.value); if (n.value < end) walk(n.right) }; walk(root); return values }',
    ],
    'bst-nearest-slot': [
      // Breaks ties toward the later booking.
      'function nearestBooking(root, time) { let best = null; for (let n = root; n; n = time < n.value ? n.left : n.right) { if (best === null || Math.abs(n.value - time) <= Math.abs(best - time)) best = n.value; if (n.value === time) break } return best }',
      // Returns only the floor value.
      'function nearestBooking(root, time) { let best = null; for (let n = root; n; ) { if (n.value <= time) { best = n.value; n = n.right } else n = n.left } return best ?? (root ? root.value : null) }',
    ],
  }
  for (const [id, codes] of Object.entries(mistakes))
    for (const code of codes)
      assert.ok(
        runRep(code, id).some(check => !check.passed),
        `${id} accepted: ${code.slice(0, 80)}`,
      )
})

test('linked-list journey references allocate fresh nodes', () => {
  for (const [id, name, extra] of [
    ['list-merge-sorted', 'mergeSorted', null],
    ['list-split-at-first', 'splitAtTrack', 4],
    ['list-rotate-route', 'rotateRoute', 1],
  ]) {
    const solve = new Function(`${compileSolution(dsaSolutions[id], name)}\nreturn ${name}`)()
    const tail = { value: 4, next: null }
    const head = { value: 1, next: tail }
    const inputs = new Set([head, tail])
    const result = solve(head, extra)
    const heads = id === 'list-split-at-first' ? [result.before, result.from] : [result]
    for (const start of heads) for (let p = start; p; p = p.next) assert.ok(!inputs.has(p), `${id} reused an input node`)
    assert.equal(head.next, tail)
  }
})

test('the linked-list journey is distinct and keeps earlier list reps as practice', () => {
  const journey = journeys.find(journey => journey.id === 'linked-lists')
  assert.deepEqual([journey.guided, journey.independent, journey.recall], ['list-merge-sorted', 'list-split-at-first', 'list-rotate-route'])
  assert.deepEqual(journey.practice, ['list-insert-sorted', 'list-remove-value'])
  assert.equal(recallVariants['linked-lists'][0], journey.recall)
  assert.deepEqual(recallVariants['binary-search-trees'].slice(0, 3), ['bst-check-order', 'bst-latest-at-or-before', 'bst-search-path'])
})
