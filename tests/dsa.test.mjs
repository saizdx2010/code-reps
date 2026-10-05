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
  for (const rep of dsaReps) assert.ok(ids.includes(rep.id))
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
