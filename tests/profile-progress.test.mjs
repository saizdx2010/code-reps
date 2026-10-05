import test from 'node:test'
import assert from 'node:assert/strict'
import { profileProgress } from '../src/profile-progress.ts'
import { paths } from '../src/path.ts'

const record = (repId, date) => ({ id: `${repId}-${date}`, repId, completedAt: new Date(date).toISOString(), hintCount: 1 })
const now = new Date(2026, 9, 5, 12)
const at = day => new Date(2026, 9, day, 10)

test('streaks count local calendar days once, tolerate today, and retain longest streak', () => {
  const history = [1, 2, 3, 4].map(day => record('write-functions', at(day)))
  history.push(record('basic-types', at(4)))
  assert.equal(profileProgress(history, now).currentStreak, 4)
  assert.equal(profileProgress(history, new Date(2026, 9, 6, 12)).currentStreak, 0)
  assert.equal(profileProgress(history, now).longestStreak, 4)
  assert.equal(profileProgress(history, now).practiceDays, 4)
  assert.equal(profileProgress(history, now).completedReps, 2)
})

test('path badges require every distinct rep, and allow hinted completion', () => {
  const path = paths[0]
  const ids = [...new Set(path.stages.flatMap(stage => stage.repIds))]
  const history = ids.map(id => record(id, at(4)))
  assert.equal(profileProgress(history, now).badges[0].earned, true)
  assert.equal(profileProgress(history.slice(1), now).badges[0].earned, false)
})

test('empty, invalid, and future records do not earn activity', () => {
  const summary = profileProgress([{ repId: 'write-functions', completedAt: 'bad' }, record('basic-types', at(6))], now)
  assert.equal(summary.currentStreak, 0)
  assert.equal(summary.completedReps, 0)
  assert.equal(summary.badges.some(badge => badge.earned), false)
})
