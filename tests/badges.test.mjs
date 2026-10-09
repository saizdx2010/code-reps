import test from 'node:test'
import assert from 'node:assert/strict'
import { profileBadges } from '../src/badges.ts'
import { firstPath, paths } from '../src/path.ts'

const now = new Date(2026, 9, 5, 12)
const at = day => new Date(2026, 9, day, 10)
const record = (repId, date, id = `${repId}-${+date}`) => ({ id, repId, completedAt: date.toISOString(), hintCount: 2 })
const byId = (badges, id) => badges.find(badge => badge.id === id)
const stage = firstPath.stages[0]
const stageIds = [...new Set(stage.repIds)]

test('an empty profile has no earned badges and a stable catalog', () => {
  const badges = profileBadges([], now)
  assert.equal(badges.some(badge => badge.earned), false)
  assert.equal(new Set(badges.map(badge => badge.id)).size, badges.length)
  assert.ok(badges.every(badge => badge.total >= 1 && badge.rule && badge.repId))
  for (const path of paths) assert.ok(byId(badges, `${path.id}:path`))
})

test('first rep is earned by any completed attempt, dated at the earliest completion', () => {
  const badge = byId(profileBadges([record('basic-types', at(4)), record('basic-types', at(2))], now), 'first-rep')
  assert.equal(badge.earned, true)
  assert.equal(badge.earnedAt, at(2).toISOString())
  assert.equal(badge.repId, 'basic-types')
})

test('repeats do not inflate stage progress', () => {
  const history = [0, 1, 2].map(n => record(stageIds[0], at(1 + n), `r${n}`))
  const badge = byId(profileBadges(history, now), 'typescript:stage:0')
  assert.equal(badge.completed, 1)
  assert.equal(badge.earned, stageIds.length === 1)
})

test('stage and path badges need every distinct rep, allow hints, and date the last first-completion', () => {
  const history = stageIds.map((id, index) => record(id, at(1 + index)))
  const badges = profileBadges(history, now)
  const earned = byId(badges, 'typescript:stage:0')
  assert.equal(earned.earned, true)
  assert.equal(earned.earnedAt, at(stageIds.length).toISOString())
  assert.equal(byId(badges, 'typescript:path').earned, false)
  const partial = byId(profileBadges(history.slice(1), now), 'typescript:stage:0')
  assert.equal(partial.earned, false)
  assert.equal(partial.earnedAt, undefined)
  assert.equal(partial.repId, stageIds[0])
  const all = [...new Set(firstPath.stages.flatMap(item => [...item.repIds]))].map(id => record(id, at(3)))
  assert.equal(byId(profileBadges(all, now), 'typescript:path').earned, true)
})

test('invalid and future dates never count', () => {
  const history = [{ id: 'x', repId: 'basic-types', completedAt: 'bad', hintCount: 0 }, record('write-functions', at(9))]
  const badges = profileBadges(history, now)
  assert.equal(badges.some(badge => badge.earned), false)
  assert.equal(byId(badges, 'first-rep').earnedAt, undefined)
})

test('badges derive from the history given, so profiles stay separate', () => {
  const a = profileBadges(stageIds.map(id => record(id, at(1))), now)
  const b = profileBadges([], now)
  assert.equal(byId(a, 'typescript:stage:0').earned, true)
  assert.equal(byId(b, 'typescript:stage:0').earned, false)
  assert.deepEqual(profileBadges(stageIds.map(id => record(id, at(1))), now), a)
})

test('stages made only of Foundations reps are not repeated in other paths', () => {
  const ids = profileBadges([], now).map(badge => badge.id)
  const foundations = new Set(firstPath.stages.flatMap(item => [...item.repIds]))
  for (const path of paths.slice(1)) path.stages.forEach((item, index) => {
    assert.equal(ids.includes(`${path.id}:stage:${index}`), !item.repIds.every(id => foundations.has(id)))
  })
})
