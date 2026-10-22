import assert from 'node:assert/strict'
import test from 'node:test'
import { changedVariables, pickScore, pickTarget, predictionMatches, predictionScore } from '../src/trace-predict.ts'

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

const table = (
  current,
  cells = [
    [0, 0],
    [0, null],
  ],
) => ({ kind: 'table', cells, current })
const tree = current => ({
  kind: 'tree',
  root: {
    id: 'a',
    value: 8,
    children: [
      { id: 'b', value: 3 },
      { id: 'c', value: 10 },
    ],
  },
  current,
})
const at = structure => ({ line: 0, vars: {}, note: '', structure })

test('a pick target is the next table cell or tree node, only when it moved and the drawing kept its shape', () => {
  assert.deepEqual(pickTarget(at(table([1, 1])), at(table([1, 0]))), { kind: 'cell', answer: '1,1' })
  assert.equal(pickTarget(at(table([1, 1])), at(table([1, 1]))), null, 'the same cell again is not a prediction')
  assert.equal(
    pickTarget(
      at(
        table(
          [1, 1],
          [
            [0, 0, 0],
            [0, 0, null],
          ],
        ),
      ),
      at(table([1, 0])),
    ),
    null,
    'a reshaped table',
  )
  assert.equal(pickTarget(at(table([1, 1]))), null, 'the first step')
  assert.deepEqual(pickTarget(at(tree('b')), at(tree('a'))), { kind: 'node', answer: 'b' })
  assert.equal(pickTarget(at(tree('a')), at(tree('a'))), null)
  assert.equal(pickTarget(at(tree('z')), at(tree('a'))), null, 'a node the previous drawing does not have')
  assert.equal(pickTarget(at({ kind: 'stack', values: [1] }), at({ kind: 'stack', values: [] })), null)
})

test('the pick score counts revealed steps with a pick', () => {
  const trace = [at(table([0, 1])), at(table([1, 0])), at(table([1, 1])), at(table([1, 1]))]
  assert.deepEqual(pickScore(trace, new Set([1, 2, 3]), { 1: '1,0', 2: '0,0' }), { matched: 1, total: 2 })
  assert.deepEqual(pickScore(trace, new Set([1]), {}), { matched: 0, total: 0 })
  assert.deepEqual(pickScore(trace, new Set([3]), { 3: '1,1' }), { matched: 0, total: 0 }, 'no target on an unchanged step')
})
