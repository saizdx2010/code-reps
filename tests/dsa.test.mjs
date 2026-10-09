import assert from 'node:assert/strict'
import test from 'node:test'
import { dsaReps } from '../src/dsa-reps.ts'
import { paths } from '../src/path.ts'
import { runRep } from '../src/runner.ts'

const optimized = {
  'algo-sorted-pair': `function hasSortedPair(numbers: number[], target: number) {
    let left = 0, right = numbers.length - 1
    while (left < right) {
      const sum = numbers[left] + numbers[right]
      if (sum === target) return true
      if (sum < target) left++
      else right--
    }
    return false
  }`,
  'algo-window-sum': `function largestWindowSum(numbers: number[], k: number) {
    if (numbers.length < k) return null
    let sum = 0
    for (let i = 0; i < k; i++) sum += numbers[i]
    let best = sum
    for (let right = k; right < numbers.length; right++) {
      sum += numbers[right] - numbers[right - k]
      best = Math.max(best, sum)
    }
    return best
  }`,
  'algo-binary-search': `function sortedIndex(numbers: number[], target: number) {
    let left = 0, right = numbers.length - 1
    while (left <= right) {
      const middle = Math.floor((left + right) / 2)
      if (numbers[middle] === target) return middle
      if (numbers[middle] < target) left = middle + 1
      else right = middle - 1
    }
    return -1
  }`,
}

test('the combined path introduces operations before related problem solving', () => {
  const path = paths.find(path => path.id === 'algorithms-data-structures')
  const ids = path.stages.flatMap(stage => stage.repIds)
  // New Problem Solving reps are registered now; the supervisor wires their path stages.
  const wiredIds = ['ds-array-operations', 'ds-set-operations', 'ds-map-operations',
    'ds-stack-operations', 'ds-queue-operations', 'algo-sorted-pair', 'algo-window-sum', 'algo-binary-search']
  for (const id of wiredIds) assert.ok(ids.includes(id), id)
  for (const [intro, application] of [
    ['ds-array-operations', 'sum-positive-numbers'],
    ['ds-set-operations', 'has-duplicate'],
    ['ds-map-operations', 'most-frequent-number'],
    ['ds-stack-operations', 'balanced-brackets'],
  ]) assert.ok(ids.indexOf(intro) < ids.indexOf(application))
  assert.equal(new Set(ids).size, ids.length)
})

for (const [id, code] of Object.entries(optimized)) {
  test(`the taught optimized approach satisfies the contract: ${id}`, () => {
    const rep = dsaReps.find(rep => rep.id === id)
    assert.ok(runRep(code, rep.id).every(check => check.passed))
  })
}

test('checks expose collection-order, falsy-value, and algorithm boundary mistakes', () => {
  const mistakes = {
    'ds-set-operations': 'function updateDistinct(numbers, extra, removed) { const set = new Set(numbers); set.delete(removed); set.add(extra); return set.size }',
    'ds-map-operations': 'function updateLookup(entries, key, value, query) { const map = new Map(entries); map.set(key, value); return map.get(query) || null }',
    'ds-queue-operations': 'function queueFront(numbers, extra) { const copy = [...numbers, extra]; copy.pop(); return copy[0] ?? null }',
    'algo-sorted-pair': optimized['algo-sorted-pair'].replace('left < right', 'left <= right'),
    'algo-window-sum': optimized['algo-window-sum'].replace('let best = sum', 'let best = 0'),
    'algo-binary-search': 'function sortedIndex(numbers, target) { return numbers.indexOf(target) || -1 }',
  }
  for (const [id, code] of Object.entries(mistakes)) {
    assert.ok(runRep(code, id).some(check => !check.passed), id)
  }
})

test('new DSA checks expose lost duplicates, skipped nesting, wrong depth, and invalid reachability', () => {
  const mistakes = {
    'algo-insertion-sort': 'function insertionSort(numbers) { return [...new Set(numbers)].sort((a,b) => a-b) }',
    'algo-merge-sorted': 'function mergeSorted(left, right) { return [...new Set([...left, ...right])].sort((a,b) => a-b) }',
    'algo-recursive-sum': 'function recursiveSum(items) { return items.filter(x => typeof x === "number").reduce((a,b) => a+b, 0) }',
    'algo-tree-depth': 'function treeDepth(root) { return root === null ? 0 : 1 + root.children.reduce((sum, child) => sum + treeDepth(child), 0) }',
    'algo-graph-reachable': 'function graphReachable(graph, start, target) { return start === target }',
  }
  for (const [id, code] of Object.entries(mistakes)) {
    assert.ok(runRep(code, id).some(check => !check.passed), id)
  }
})

test('new DSA input preservation includes arrays nested inside trees and graphs', () => {
  const mistakes = {
    'algo-insertion-sort': 'function insertionSort(numbers) { return numbers.sort((a,b) => a-b) }',
    'algo-merge-sorted': 'function mergeSorted(left, right) { const result = [...left, ...right].sort((a,b) => a-b); left.push(0); return result }',
    'algo-recursive-sum': 'function recursiveSum(items) { let sum = 0; for (const x of items) sum += Array.isArray(x) ? recursiveSum(x) : x; items.push(0); return sum }',
    'algo-tree-depth': 'function treeDepth(root) { if (!root) return 0; let depth = 0; for (const child of root.children) depth = Math.max(depth, treeDepth(child)); root.value++; return depth + 1 }',
    'algo-graph-reachable': 'function graphReachable(graph, start, target) { if (graph.length) graph[0].push(0); return false }',
  }
  for (const [id, code] of Object.entries(mistakes)) {
    assert.ok(runRep(code, id).some(check => check.message?.includes('changed its input')), id)
  }
})
