import assert from 'node:assert/strict'
import test from 'node:test'
import { reps } from '../src/rep.ts'
import { runRep } from '../src/runner.ts'
import { testingJourneyReps } from '../src/testing-journey-reps.ts'
import { exposeOverlapSolution, exposePageSolution } from './fixtures/testing-journey-solutions.mjs'

const failed = (code, id) => runRep(code, id).filter(result => !result.passed).map(result => result.name)
const rep = id => reps.find(item => item.id === id)

test('the find-the-bug journey ships three distinct reps', () => {
  assert.deepEqual(testingJourneyReps.map(item => item.id), ['expose-page-bugs', 'repair-range-label', 'expose-overlap-bugs'])
  assert.deepEqual(testingJourneyReps.map(item => item.format), ['backend', 'debug', 'backend'])
})

test('expose reps state that the checks do not prove a case table is complete', () => {
  for (const id of ['expose-page-bugs', 'expose-overlap-bugs']) assert.match(rep(id).note, /do not establish that your table is complete/)
})

test('unmodified starters fail their checks', () => {
  assert.ok(failed(rep('expose-page-bugs').starter, 'expose-page-bugs').length >= 4)
  assert.ok(failed(rep('expose-overlap-bugs').starter, 'expose-overlap-bugs').length >= 5)
  assert.ok(failed(rep('repair-range-label').starter, 'repair-range-label').length >= 6)
})

test('an empty case table exposes none of the supplied variants', () => {
  const page = failed(exposePageSolution('const cases: { items: number[]; page: number; size: number; expected: number[] }[] = []'), 'expose-page-bugs')
  assert.equal(page.length, 4)
  const overlap = failed(exposeOverlapSolution('const cases: { a: Interval; b: Interval; expected: boolean }[] = []'), 'expose-overlap-bugs')
  assert.equal(overlap.length, 5)
})

test('shortcuts do not satisfy the checks, and weak tables miss named variants', () => {
  assert.ok(failed('function exposes(variant: string): boolean { return true }', 'expose-page-bugs').includes('Your cases accept the correct version'))
  const noInputCheck = exposePageSolution().replace(/\n    if \(JSON\.stringify\(copy\).*\n/, '\n')
  assert.notEqual(noInputCheck, exposePageSolution())
  assert.deepEqual(failed(noInputCheck, 'expose-page-bugs'), ['Exposes the version that removes items from its input'])
  const evenOnly = exposePageSolution('const cases = [{ items: [1, 2, 3, 4], page: 1, size: 2, expected: [1, 2] }, { items: [1, 2, 3, 4], page: 2, size: 2, expected: [3, 4] }]')
  assert.ok(failed(evenOnly, 'expose-page-bugs').includes('Exposes the version that drops a short last page'))
  const noOrder = exposeOverlapSolution('const cases: { a: Interval; b: Interval; expected: boolean }[] = [{ a: [1, 5], b: [3, 8], expected: true }, { a: [1, 5], b: [5, 9], expected: false }, { a: [3, 3], b: [1, 5], expected: false }, { a: [1, 5], b: [1, 3], expected: true }]')
  assert.deepEqual(failed(noOrder, 'expose-overlap-bugs'), ['Exposes variant-b'])
})

test('range label repair rejects each reported fault', () => {
  const faulty = {
    noPlusOne: 'function rangeLabel(total: number, page: number, size: number) { if (total === 0) return "No results"; const start = (page - 1) * size; if (page < 1 || size < 1 || start >= total) return "Page out of range"; return `Showing ${start}-${Math.min(page * size, total)} of ${total}` }',
    noCap: 'function rangeLabel(total: number, page: number, size: number) { if (total === 0) return "No results"; const start = (page - 1) * size + 1; if (page < 1 || size < 1 || start > total) return "Page out of range"; return `Showing ${start}-${page * size} of ${total}` }',
    emptyLast: 'function rangeLabel(total: number, page: number, size: number) { if (page < 1 || size < 1) return "Page out of range"; if (total === 0) return "No results"; const start = (page - 1) * size + 1; if (start > total) return "Page out of range"; return `Showing ${start}-${Math.min(page * size, total)} of ${total}` }',
  }
  for (const [name, code] of Object.entries(faulty)) assert.ok(failed(code, 'repair-range-label').length > 0, name)
})
