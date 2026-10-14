import assert from 'node:assert/strict'
import test from 'node:test'
import { changedVariables, predictionMatches, predictionScore } from '../src/trace-predict.ts'

const steps = [
  { line: 0, vars: { sum: 0 }, note: 'start' },
  { line: 1, vars: { sum: 2, i: 0 }, note: 'add' },
  { line: 1, vars: { sum: 2, i: 1 }, note: 'skip' },
  { line: 2, vars: { sum: 2, i: 1 }, note: 'no change' },
  { line: 3, vars: { result: '[1, 2]' }, note: 'return' },
]

test('changed variables include new names and changed values, but nothing on the first step', () => {
  assert.deepEqual(changedVariables(steps[0]), [])
  assert.deepEqual(changedVariables(steps[1], steps[0]), ['sum', 'i'])
  assert.deepEqual(changedVariables(steps[2], steps[1]), ['i'])
  assert.deepEqual(changedVariables(steps[3], steps[2]), [])
})

test('predictions match leniently on spacing, quotes, and case, but not on value', () => {
  assert.equal(predictionMatches('2', 2), true)
  assert.equal(predictionMatches(' [1,2] ', '[1, 2]'), true)
  assert.equal(predictionMatches('"Done"', 'done'), true)
  assert.equal(predictionMatches('TRUE', true), true)
  assert.equal(predictionMatches('3', 2), false)
  assert.equal(predictionMatches('', 2), false)
  assert.equal(predictionMatches('   ', ''), false)
  assert.equal(predictionMatches('null', null), true)
})

test('the score counts only revealed steps with changed variables', () => {
  const guesses = { 1: { sum: '2', i: '1' }, 2: { i: '1' }, 4: { result: '[1,2]' } }
  assert.deepEqual(predictionScore(steps, new Set(), guesses), { matched: 0, total: 0 })
  assert.deepEqual(predictionScore(steps, new Set([1]), guesses), { matched: 1, total: 2 })
  assert.deepEqual(predictionScore(steps, new Set([1, 2, 3, 4]), guesses), { matched: 3, total: 4 })
  assert.deepEqual(predictionScore(steps, new Set([4]), {}), { matched: 0, total: 1 })
})
