import test from 'node:test'
import assert from 'node:assert/strict'
import { repLevel, repLevelLabels, repLevels, stageLevelRange } from '../src/rep-levels.ts'
import { reps } from '../src/rep.ts'

test('every rep in the registry has a difficulty level', () => {
  const missing = reps.map(rep => rep.id).filter(id => repLevel(id) === undefined)
  assert.deepEqual(missing, [], `Add these reps to repLevels in src/rep-levels.ts: ${missing.join(', ')}`)
})

test('the level map lists no unknown rep ids', () => {
  const registryIds = new Set(reps.map(rep => rep.id))
  const unknown = Object.keys(repLevels).filter(id => !registryIds.has(id))
  assert.deepEqual(unknown, [], `Remove or rename these ids in src/rep-levels.ts: ${unknown.join(', ')}`)
})

test('every level is 1, 2, or 3 and has a label', () => {
  for (const [id, level] of Object.entries(repLevels)) {
    assert.ok([1, 2, 3].includes(level), `${id} has invalid level ${level}`)
    assert.ok(repLevelLabels[level], `${id} has no label`)
  }
  assert.deepEqual(Object.values(repLevelLabels), ['Beginner', 'Intermediate', 'Advanced'])
})

test('stage level ranges name one label or the lowest and highest levels', () => {
  assert.equal(stageLevelRange(['declare-variables', 'loop-while']), 'Beginner')
  assert.equal(stageLevelRange(['declare-variables', 'most-frequent-number']), 'Beginner–Intermediate')
  assert.equal(stageLevelRange(['algo-graph-reachable', 'declare-variables']), 'Beginner–Advanced')
  assert.equal(stageLevelRange([]), undefined)
  assert.equal(stageLevelRange(['not-a-rep']), undefined)
})
