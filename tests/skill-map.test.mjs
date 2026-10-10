import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSkillMap, skillState } from '../src/skill-map.ts'
import { getAllJourneys } from '../src/learning.ts'

const day = 86_400_000
const t0 = Date.parse('2026-01-01T00:00:00Z')
const at = (n) => new Date(t0 + n * day).toISOString()
const rec = (repId, n, hintCount = 0) => ({ repId, completedAt: at(n), hintCount })
const arrays = (records, now = t0 + 30 * day) => buildSkillMap('typescript', getAllJourneys(records, now)).stages.flatMap(s => s.nodes).find(n => n.id === 'arrays')

test('an untouched profile shows every skill as not started with a guided link', () => {
  const map = buildSkillMap('typescript', getAllJourneys([], t0))
  assert.ok(map.total > 0)
  assert.equal(map.counts.untouched, map.total)
  for (const node of map.stages.flatMap(s => s.nodes)) { assert.equal(node.state, 'untouched'); assert.ok(node.repId) }
  assert.equal(arrays([]).repId, 'sum-positive-numbers')
})

test('a hinted completion is practiced, never independent', () => {
  const node = arrays([rec('sum-positive-numbers', 0, 2), rec('count-even-numbers', 1, 1)])
  assert.equal(node.state, 'practiced')
  assert.equal(node.repId, 'count-even-numbers')
  assert.equal(node.mode, 'review')
})

test('a hint-free related rep after guided practice is independent and waits for recall', () => {
  const node = arrays([rec('sum-positive-numbers', 0), rec('count-even-numbers', 1)], t0 + 2 * day)
  assert.equal(node.state, 'independent')
  assert.equal(node.repId, null)
})

test('recall after the break is due, then retained once solved without hints', () => {
  const base = [rec('sum-positive-numbers', 0), rec('count-even-numbers', 1)]
  const due = arrays(base)
  assert.equal(due.state, 'due')
  assert.equal(due.repId, 'count-above-threshold')
  assert.equal(arrays([...base, rec('count-above-threshold', 10, 1)]).state, 'due')
  assert.equal(arrays([...base, rec('count-above-threshold', 5)]).state, 'retained')
})

test('separate profiles are derived independently', () => {
  const a = getAllJourneys([rec('sum-positive-numbers', 0)], t0 + day)
  const b = getAllJourneys([], t0 + day)
  assert.equal(buildSkillMap('typescript', a).counts.practiced, 1)
  assert.equal(buildSkillMap('typescript', b).counts.practiced, 0)
})

test('unknown reps and tracks are ignored', () => {
  const clean = buildSkillMap('typescript', getAllJourneys([], t0))
  const noisy = buildSkillMap('typescript', getAllJourneys([rec('not-a-rep', 0), rec('missing', 1)], t0))
  assert.deepEqual(noisy, clean)
  assert.deepEqual(buildSkillMap('no-such-track', getAllJourneys([], t0)), clean)
  assert.equal(skillState(getAllJourneys([], t0)[0]), 'untouched')
})

test('each skill appears once per track', () => {
  for (const id of ['typescript', 'algorithms-data-structures', 'frontend', 'backend']) {
    const ids = buildSkillMap(id, getAllJourneys([], t0)).stages.flatMap(s => s.nodes.map(n => n.id))
    assert.ok(ids.length > 0)
    assert.equal(new Set(ids).size, ids.length)
  }
})
