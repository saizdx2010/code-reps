import assert from 'node:assert/strict'
import test from 'node:test'
import { recallVariants } from '../src/fluency.ts'
import { reps } from '../src/rep.ts'
import { runRep } from '../src/runner.ts'
import { recallThinSolutions as solutions } from './fixtures/recall-thin-solutions.mjs'

const expected = {
  'control-flow': ['countdown-labels', 'batch-slot-labels', 'inspection-run-summary'],
  'interface-logic': ['filter-chip-summary', 'selection-action-state', 'navigation-window'],
  'request-response': ['page-response-envelope', 'conditional-resource-response', 'retry-response-policy'],
  'find-the-bug': ['expose-overlap-bugs', 'expose-stock-bugs', 'expose-access-bugs'],
}

test('thin journeys retain their existing first variant and append fresh tasks', () => {
  for (const [journey, ids] of Object.entries(expected)) assert.deepEqual(recallVariants[journey], ids)
})

test('new recall starters do not solve their tasks', () => {
  for (const id of Object.keys(solutions)) {
    const rep = reps.find(item => item.id === id)
    assert.ok(runRep(rep.starter, id).some(result => !result.passed), id)
    assert.deepEqual(runRep(solutions[id], id).filter(result => !result.passed), [], id)
  }
})

test('new function checks reject boundary and precedence mistakes', () => {
  const faults = [
    ['batch-slot-labels', 'remaining > 0', 'remaining >= 0'],
    ['inspection-run-summary', 'value > limit', 'value >= limit'],
    ['selection-action-state', 'selected.some(row => row.locked)', 'rows.some(row => row.locked)'],
    ['navigation-window', 'const center=Math.min(total,Math.max(1,current))', 'const center=current'],
    ['conditional-resource-response', 'requestedRevision === revision', 'requestedRevision?.trim().toLowerCase() === revision.toLowerCase()'],
    ['retry-response-policy', 'attempt >= maximum', 'attempt > maximum'],
  ]
  for (const [id, before, after] of faults) {
    assert.ok(solutions[id].includes(before), id)
    // The batch mutant would loop forever at zero; stop after its extra empty batch.
    const code = id === 'batch-slot-labels'
      ? solutions[id].replace(before, after).replace('remaining -= count;', 'if (count === 0) break; remaining -= count;')
      : solutions[id].replace(before, after)
    assert.ok(runRep(code, id).some(result => !result.passed), id)
  }
})

test('bug case references detect changed input, and empty tables miss faults', () => {
  for (const id of ['expose-stock-bugs', 'expose-access-bugs']) {
    const noMutationCheck = solutions[id].replace(' || JSON.stringify(copy) !== JSON.stringify(c.value)', '')
    assert.notEqual(noMutationCheck, solutions[id])
    assert.deepEqual(runRep(noMutationCheck, id).filter(result => !result.passed).map(result => result.name), ['Exposes variant-d'])
    const empty = solutions[id].replace(/const cases:[^\n]+/, 'const cases: { value: any[]; argument: number; expected: any }[] = []')
    assert.equal(runRep(empty, id).filter(result => !result.passed).length, 4)
  }
})
