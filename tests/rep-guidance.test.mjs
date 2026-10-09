import test from 'node:test'
import assert from 'node:assert/strict'
import { effortRange, getRepGuidance } from '../src/rep-guidance.ts'
import { repLevel } from '../src/rep-levels.ts'
import { reps } from '../src/rep.ts'
import { paths } from '../src/path.ts'

test('every rep has an effort range and guidance without throwing', () => {
  for (const rep of reps) {
    assert.match(effortRange(rep.id), /minutes/, rep.id)
    assert.ok(getRepGuidance(rep.id, []).effort)
  }
})

test('effort does not depend on what the learner has completed', () => {
  assert.equal(getRepGuidance('count-words', []).effort, getRepGuidance('count-words', ['declare-variables']).effort)
})

test('beginner reps never raise a readiness checkpoint', () => {
  for (const rep of reps.filter(item => repLevel(item.id) === 1)) assert.equal(getRepGuidance(rep.id, []).checkpoint, undefined, rep.id)
})

test('a large jump gets a checkpoint whose optional bridge is a lower-level rep', () => {
  const advanced = reps.map(rep => rep.id).filter(id => repLevel(id) === 3)
  const withBridge = advanced.map(id => ({ id, checkpoint: getRepGuidance(id, []).checkpoint })).filter(item => item.checkpoint?.bridgeRep)
  assert.ok(withBridge.length, 'some advanced rep should offer a bridge')
  for (const { id, checkpoint } of withBridge) assert.ok(checkpoint.bridgeRep.level < 3, id)
})

test('the checkpoint clears once the learner has completed nearby-level work', () => {
  const id = reps.map(rep => rep.id).find(rep => repLevel(rep) === 3)
  const intermediate = reps.map(rep => rep.id).find(rep => repLevel(rep) === 2)
  assert.ok(getRepGuidance(id, []).checkpoint)
  assert.equal(getRepGuidance(id, [intermediate]).checkpoint, undefined)
})

test('prerequisite reps are earlier unfinished reps from the same stage', () => {
  const stage = paths[0].stages[0]
  assert.deepEqual(getRepGuidance(stage.repIds[3], []).priorReps.map(rep => rep.id), [stage.repIds[1], stage.repIds[2]])
  assert.deepEqual(getRepGuidance(stage.repIds[3], [stage.repIds[2]]).priorReps.map(rep => rep.id), [stage.repIds[0], stage.repIds[1]])
  assert.deepEqual(getRepGuidance(stage.repIds[0], []).priorReps, [])
})
