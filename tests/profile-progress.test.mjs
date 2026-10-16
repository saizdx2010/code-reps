import test from 'node:test'
import assert from 'node:assert/strict'
import { attemptKinds, profileProgress } from '../src/profile-progress.ts'

const record = (repId, date, hintCount = 1) => ({ id: `${repId}-${date.toISOString()}`, repId, completedAt: date.toISOString(), hintCount })
const now = new Date(2026, 9, 5, 12)
const at = day => new Date(2026, 9, day, 10)
/** One practice record per listed day of October 2026, each a different rep so every day is new practice. */
const days = list => list.map((day, index) => record(`rep-${index}`, at(day)))

test('streaks count local calendar days once, tolerate today, and retain longest streak', () => {
  const history = [1, 2, 3, 4].map(day => record('write-functions', at(day)))
  history.push(record('basic-types', at(4)))
  assert.equal(profileProgress(history, now).currentStreak, 4)
  assert.equal(profileProgress(history, now).longestStreak, 4)
  assert.equal(profileProgress(history, now).practiceDays, 4)
  assert.equal(profileProgress(history, now).completedReps, 2)
  // One missed day is carried over while today is still open; two missed days end the streak.
  assert.equal(profileProgress(history, new Date(2026, 9, 6, 12)).currentStreak, 4)
  assert.equal(profileProgress(history, new Date(2026, 9, 6, 12)).restDays, 1)
  assert.equal(profileProgress(history, new Date(2026, 9, 7, 12)).currentStreak, 0)
  assert.equal(profileProgress(history, new Date(2026, 9, 7, 12)).longestStreak, 4)
})

test('empty, invalid, and future records do not earn activity', () => {
  const summary = profileProgress([{ repId: 'write-functions', completedAt: 'bad' }, record('basic-types', at(6))], now)
  assert.equal(summary.currentStreak, 0)
  assert.equal(summary.completedReps, 0)
  assert.equal(summary.recentDays, 0)
})

test('the worked examples: one rest day per seven days, never two in a row', () => {
  const on = day => new Date(2026, 9, day, 20)
  // Practice, practice, missed, practice, practice.
  const carried = profileProgress(days([1, 2, 4, 5]), on(5))
  assert.equal(carried.currentStreak, 4)
  assert.equal(carried.restDays, 1)
  // Practice, missed, practice, missed, practice: the second missed day falls within seven days of the first.
  assert.equal(profileProgress(days([1, 3, 5]), on(5)).currentStreak, 2)
  // Practice, practice, missed, missed, practice.
  assert.equal(profileProgress(days([1, 2, 5]), on(5)).currentStreak, 1)
  // Four days in a row with today still open.
  assert.equal(profileProgress(days([1, 2, 3, 4]), on(5)).currentStreak, 4)
  // Rest days seven days apart are both carried over.
  assert.equal(profileProgress(days([1, 3, 4, 5, 6, 7, 8, 9, 11]), on(11)).currentStreak, 9)
  // Rest days six days apart are not: the run stops at the earlier one.
  assert.equal(profileProgress(days([1, 3, 4, 5, 6, 7, 9]), on(9)).currentStreak, 6)
})

test('the longest streak uses the same carry-over rule', () => {
  const history = days([1, 2, 4, 5, 6, 12])
  const summary = profileProgress(history, new Date(2026, 9, 12, 20))
  assert.equal(summary.longestStreak, 5)
  assert.equal(summary.currentStreak, 1)
})

test('the last seven days mark new practice, reviews only, carried-over rest days, and today', () => {
  const history = [
    record('count-words', at(9)),
    record('count-words', at(10)),
    record('sum-positive-numbers', at(11)),
    // A journey's recall rep is a review even the first time.
    record('count-above-threshold', at(13)),
    record('basic-types', at(14)),
  ]
  const summary = profileProgress(history, new Date(2026, 9, 15, 9))
  assert.deepEqual(
    summary.week.map(day => [day.date.getDate(), day.kind, day.today]),
    [
      [9, 'new', false],
      [10, 'review', false],
      [11, 'new', false],
      [12, 'rest', false],
      [13, 'review', false],
      [14, 'new', false],
      [15, 'none', true],
    ],
  )
  assert.equal(summary.recentDays, 5)
  assert.equal(summary.currentStreak, 5)
})

test('attempt kinds: a repeat or a recall rep is a review, the first attempt of anything else is new', () => {
  const first = record('count-words', at(1))
  const again = record('count-words', at(2))
  const recall = record('count-above-threshold', at(3))
  const future = record('basic-types', new Date(2027, 0, 1))
  const kinds = attemptKinds([again, recall, first, future], now)
  assert.equal(kinds.get(first.id), 'new')
  assert.equal(kinds.get(again.id), 'review')
  assert.equal(kinds.get(recall.id), 'review')
  assert.equal(kinds.has(future.id), false)
})
