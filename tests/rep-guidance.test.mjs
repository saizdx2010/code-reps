import test from 'node:test'
import assert from 'node:assert/strict'
import { effortLoad, effortRange, getRepGuidance } from '../src/rep-guidance.ts'
import { repLevel } from '../src/rep-levels.ts'
import { reps } from '../src/rep.ts'
import { paths } from '../src/path.ts'
import { repIndex } from '../src/catalog-index.ts'

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

test('effort follows brief length and check count, so heavy Beginner reps do not promise the lightest range', () => {
  const light = getRepGuidance('write-functions', []).effort
  assert.equal(light, '10–20 minutes')
  for (const id of ['shipping-cost-tiers', 'countdown-labels', 'use-conditions']) {
    const effort = getRepGuidance(id, []).effort
    assert.notEqual(effort, light, id)
    assert.match(effort, /minutes/)
  }
  assert.equal(getRepGuidance('shipping-cost-tiers', []).effort, '20–40 minutes')
})

test('effort rises with load inside a level and stays a range of minutes', () => {
  const bands = repIndex.filter(rep => repLevel(rep.id) === 2).map(rep => ({ load: effortLoad(rep), effort: effortRange(rep.id).split(',')[0] }))
  assert.ok(bands.every(band => Number.isFinite(band.load)) && new Set(bands.map(band => band.effort)).size > 1)
  const start = effort => Number(effort.match(/^\d+/)[0])
  for (const a of bands) for (const b of bands) if (a.load <= b.load) assert.ok(start(a.effort) <= start(b.effort), `${a.load} before ${b.load}`)
  for (const { effort } of bands) assert.match(effort, /^\d+–\d+ minutes$/)
})

test('effort wording stays guidance and ignores what the learner has finished', () => {
  for (const rep of reps) assert.equal(getRepGuidance(rep.id, []).effort, getRepGuidance(rep.id, reps.map(item => item.id)).effort, rep.id)
})

function trackOf(id) {
  return paths.find(path => path.id === id)
}
const trackReps = path => path.stages.flatMap(stage => [...stage.repIds])

test('a track opens with a Beginner bridge rep', () => {
  for (const id of ['frontend', 'backend']) {
    const first = trackReps(trackOf(id))[0]
    assert.equal(repLevel(first), 1, `${id} should open at Beginner`)
  }
})

test('an Intermediate track rep raises a non-blocking checkpoint until a Beginner rep of that track is done', () => {
  for (const [trackId, bridge] of [['frontend', 'frontend-screen-message'], ['backend', 'backend-check-quantity']]) {
    const target = trackReps(trackOf(trackId)).find(id => repLevel(id) === 2)
    const beginnerElsewhere = reps.map(rep => rep.id).find(id => repLevel(id) === 1 && !trackReps(trackOf(trackId)).includes(id))
    const guidance = getRepGuidance(target, [beginnerElsewhere])
    assert.ok(guidance.checkpoint, `${trackId}: finished work in another track does not count`)
    assert.match(guidance.checkpoint.message, /continue with this rep now/)
    assert.match(guidance.checkpoint.message, new RegExp(trackOf(trackId).title))
    assert.equal(guidance.checkpoint.bridgeRep.id, bridge)
    assert.equal(getRepGuidance(target, [bridge]).checkpoint, undefined, `${trackId}: finishing the bridge clears it`)
  }
})

test('the track rule skips Foundations, Beginner reps and reps the learner has already reached', () => {
  const foundationsIntermediate = trackReps(paths[0]).find(id => repLevel(id) === 2)
  assert.equal(getRepGuidance(foundationsIntermediate, ['write-functions']).checkpoint, undefined)
  assert.equal(getRepGuidance('frontend-screen-message', []).checkpoint, undefined)
  assert.equal(getRepGuidance('backend-check-quantity', []).checkpoint, undefined)
})
