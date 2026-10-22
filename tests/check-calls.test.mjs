import assert from 'node:assert/strict'
import test from 'node:test'
import { judgeCalls, noCalls, surprisesFirst, verdictSentence } from '../src/check-calls.ts'

const results = [
  { name: 'example', passed: true },
  { name: 'empty', passed: true },
  { name: 'tie', passed: false },
  { name: 'negative', passed: true },
]

test('no calls means no verdict', () => {
  assert.equal(noCalls({ checks: {} }), true)
  assert.equal(judgeCalls({ checks: {} }, results), null)
  assert.equal(judgeCalls({ overall: 'all', checks: {} }, []), null)
})

test('the overall call holds when its prediction matches whether every check passed', () => {
  const all = judgeCalls({ overall: 'all', checks: {} }, results)
  assert.deepEqual(all.overall, { call: 'all', held: false })
  assert.equal(verdictSentence(all, results), 'You said every check would pass. Surprise: 1 failed.')
  const some = judgeCalls({ overall: 'some', checks: {} }, results)
  assert.equal(verdictSentence(some, results), 'You said some checks would fail: called it.')
  const green = results.map(result => ({ ...result, passed: true }))
  assert.equal(
    verdictSentence(judgeCalls({ overall: 'some', checks: {} }, green), green),
    'You said some checks would fail. Surprise: they all passed.',
  )
})

test('per-check calls count holds and surprises, ignoring names the run does not have', () => {
  const verdict = judgeCalls({ checks: { example: 'pass', tie: 'pass', empty: 'fail', gone: 'pass' } }, results)
  assert.deepEqual(verdict.byName, { example: 'held', empty: 'surprise', tie: 'surprise' })
  assert.equal(verdict.called, 3)
  assert.equal(verdict.held, 1)
  assert.equal(verdictSentence(verdict, results), 'You called 1 of 3 correctly. 2 surprises: look at these first.')
  assert.equal(verdictSentence(judgeCalls({ checks: { example: 'pass' } }, results), results), 'You called 1 of 1 correctly.')
})

test('surprises sort first and the rest keep their order', () => {
  const verdict = judgeCalls({ checks: { example: 'pass', negative: 'fail' } }, results)
  assert.deepEqual(
    surprisesFirst(results, verdict).map(result => result.name),
    ['negative', 'example', 'empty', 'tie'],
  )
  assert.equal(surprisesFirst(results, null), results)
})
