import test from 'node:test'
import assert from 'node:assert/strict'
import { validateContentDepth } from '../src/content-depth.ts'
const trace = { code: ['initialize', 'return'], input: '[1]', steps: [
  { line: 0, vars: { total: 0 }, structure: { kind: 'array', values: [1], pointers: { current: 0 } }, note: 'Start' },
  { line: 1, vars: { total: 1 }, note: 'Return' },
] }
function validate(traceSteps) {
  return validateContentDepth(new Set(['demo']), new Set(), { demo: { reasoning: 'Why', trace: 'Prose', alternative: 'Other', counterexample: 'Mistake', transfer: 'Variation', traceSteps } }, {})
}
test('optional trace accepts valid snapshots and preserves prose-only reviews', () => {
  assert.deepEqual(validate(trace), [])
  assert.deepEqual(validate(undefined), [])
  for (const structure of [{ kind: 'stack', values: [] }, { kind: 'map', entries: [['one', 1]] }]) {
    assert.deepEqual(validate({ ...trace, steps: [{ ...trace.steps[0], structure }, trace.steps[1]] }), [])
  }
})
test('trace rejects empty code, short sequences, invalid lines, pointers and notes', () => {
  assert.match(validate({ ...trace, code: [] }).join(), /code must be non-empty/)
  assert.match(validate({ ...trace, code: [' '] }).join(), /code must be non-empty/)
  assert.match(validate({ ...trace, steps: trace.steps.slice(0, 1) }).join(), /at least two/)
  for (const line of [-1, 2, 0.5]) assert.match(validate({ ...trace, steps: [{ ...trace.steps[0], line }, trace.steps[1]] }).join(), /line is out of bounds/)
  for (const current of [-1, 1, 0.5]) assert.match(validate({ ...trace, steps: [{ ...trace.steps[0], structure: { kind: 'array', values: [1], pointers: { current } } }, trace.steps[1]] }).join(), /pointer is out of bounds/)
  assert.match(validate({ ...trace, steps: [{ ...trace.steps[0], note: ' ' }, trace.steps[1]] }).join(), /needs a note/)
})
