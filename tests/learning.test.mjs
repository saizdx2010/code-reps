import assert from 'node:assert/strict'
import test from 'node:test'
import { getArrayJourney } from '../src/learning.ts'

const record = (repId, day, hintCount = 0) => ({ repId, completedAt: `2026-09-${String(day).padStart(2, '0')}T00:00:00.000Z`, hintCount })
const at = (day) => Date.parse(`2026-09-${String(day).padStart(2, '0')}T00:00:00.000Z`)

test('guides a learner from first rep to delayed recall', () => {
  assert.equal(getArrayJourney([], at(25)).nextRepId, 'sum-positive-numbers')
  assert.equal(getArrayJourney([record('sum-positive-numbers', 20)], at(25)).nextRepId, 'count-even-numbers')
  const independent = getArrayJourney([record('count-even-numbers', 21), record('sum-positive-numbers', 20)], at(22))
  assert.equal(independent.stage, 'independent')
  assert.equal(independent.nextRepId, null)
  assert.equal(independent.recallAt, at(24))
  assert.equal(getArrayJourney([record('sum-positive-numbers', 20), record('count-even-numbers', 21)], at(24)).nextRepId, 'count-above-threshold')
})

test('hints and early recall do not establish independence or retention', () => {
  const guided = record('sum-positive-numbers', 20)
  assert.equal(getArrayJourney([guided, record('count-even-numbers', 21, 1)], at(25)).stage, 'practising')
  const independent = record('count-even-numbers', 21)
  assert.equal(getArrayJourney([guided, independent, record('count-above-threshold', 22)], at(25)).stage, 'independent')
  assert.equal(getArrayJourney([guided, independent, record('count-above-threshold', 24, 1)], at(25)).stage, 'independent')
  assert.equal(getArrayJourney([guided, independent, record('count-above-threshold', 24)], at(25)).stage, 'retained')
})

test('a rep completed before guided work does not establish independence', () => {
  assert.equal(getArrayJourney([record('count-even-numbers', 19), record('sum-positive-numbers', 20)], at(25)).stage, 'practising')
})
