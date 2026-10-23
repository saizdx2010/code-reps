import test from 'node:test'
import assert from 'node:assert/strict'
import { plannedNext, weeklyTarget } from '../src/daily-loop.ts'
import { weekProgress } from '../src/week-progress.ts'
import { todayReceipt } from '../src/today-plan.ts'
import { emptyFluency, mergeFluency, parseFluency } from '../src/fluency.ts'

const record = (repId, date, hintCount = 1) => ({ id: `${repId}-${date.toISOString()}`, repId, completedAt: date.toISOString(), hintCount })
// Thursday 22 October 2026, noon local time; that week runs Monday 19 to Sunday 25.
const now = new Date(2026, 9, 22, 12)
const at = (day, hour = 10) => new Date(2026, 9, day, hour)

test('the weekly target comes from the chosen number, then the practice days, then three', () => {
  assert.equal(weeklyTarget({ pathId: 'typescript', minutes: 20, days: [1, 3], weekly: 5 }), 5)
  assert.equal(weeklyTarget({ pathId: 'typescript', minutes: 20, days: [1, 3] }), 2)
  assert.equal(weeklyTarget({ pathId: 'typescript', minutes: 20, days: [] }), 3)
})

test('a week counts practice days from Monday, and met weeks run back without breaking on the open week', () => {
  const history = [
    // Week of 5 October: three days.
    record('a', at(5)),
    record('b', at(6)),
    record('c', at(7)),
    // Week of 12 October: three days, two attempts on one of them.
    record('d', at(12)),
    record('e', at(13)),
    record('f', at(13, 18)),
    record('g', at(16)),
    // This week: Monday and today.
    record('h', at(19)),
    record('i', at(22, 9)),
  ]
  const week = weekProgress(history, 3, now)
  assert.equal(week.done, 2)
  assert.equal(week.met, false)
  // This week is still open, so the run of met weeks before it stands.
  assert.equal(week.weeksMet, 2)
  assert.equal(week.daysLeft, 4)
  assert.equal(week.practicedToday, true)
  assert.deepEqual(
    week.week.map(day => [day.date.getDate(), day.practiced, day.today, day.future]),
    [
      [19, true, false, false],
      [20, false, false, false],
      [21, false, false, false],
      [22, true, true, false],
      [23, false, false, true],
      [24, false, false, true],
      [25, false, false, true],
    ],
  )
  const met = weekProgress([...history, record('j', at(20))], 3, now)
  assert.equal(met.met, true)
  assert.equal(met.weeksMet, 3)
})

test('a missed week ends the run, and invalid or future records never count', () => {
  const history = [record('a', at(5)), record('b', at(6)), record('c', at(7)), record('d', at(20)), record('e', at(23))]
  history.push({ id: 'bad', repId: 'x', completedAt: 'not a date', hintCount: 0 })
  const week = weekProgress(history, 2, now)
  assert.equal(week.done, 1)
  assert.equal(week.weeksMet, 0)
})

test('today lists new reps apart from reviews and counts hint-free attempts', () => {
  const history = [
    record('write-functions', at(20)),
    record('write-functions', at(22, 8), 0),
    record('basic-types', at(22, 9), 2),
    record('basic-types', at(22, 11), 0),
  ]
  assert.deepEqual(todayReceipt(history, now), {
    attempts: 3,
    newReps: 1,
    reviews: 2,
    withoutHints: 2,
    repIds: ['write-functions', 'basic-types'],
  })
  assert.equal(todayReceipt([], now).attempts, 0)
})

test('a chosen rep stays until it is completed after being chosen, and unknown reps are dropped', () => {
  const nextUp = { repId: 'basic-types', note: 'Start with the empty case.', setAt: at(21, 20).toISOString() }
  const known = id => id !== 'retired-rep'
  assert.deepEqual(plannedNext(nextUp, [record('basic-types', at(20))], known), nextUp)
  assert.equal(plannedNext(nextUp, [record('basic-types', at(22))], known), null)
  assert.equal(plannedNext({ ...nextUp, repId: 'retired-rep' }, [], known), null)
  assert.equal(plannedNext(undefined, [], known), null)
})

test('learning data accepts a weekly target and a next rep, rejects bad ones, and merges the next rep across tabs', () => {
  const state = emptyFluency()
  const nextUp = { repId: 'basic-types', note: 'Begin with the brief.', setAt: now.toISOString() }
  const saved = parseFluency({ ...state, goal: { ...state.goal, weekly: 4 }, nextUp })
  assert.equal(saved.goal.weekly, 4)
  assert.deepEqual(saved.nextUp, nextUp)
  // An unknown rep ID still loads: it is ignored where it would be shown.
  assert.equal(parseFluency({ ...state, nextUp: { ...nextUp, repId: 'some-retired-rep' } }).nextUp.repId, 'some-retired-rep')
  for (const weekly of [0, 8, 2.5, '3']) assert.throws(() => parseFluency({ ...state, goal: { ...state.goal, weekly } }), /invalid/)
  for (const bad of [{ ...nextUp, note: 'x'.repeat(281) }, { ...nextUp, repId: '' }, { ...nextUp, setAt: 'soon' }, 'basic-types'])
    assert.throws(() => parseFluency({ ...state, nextUp: bad }), /invalid/)
  const theirs = { ...state, notes: [] }
  assert.deepEqual(mergeFluency(state, { ...state, nextUp }, theirs).nextUp, nextUp)
  const cleared = mergeFluency({ ...state, nextUp }, state, { ...state, nextUp })
  assert.equal('nextUp' in cleared, false)
})
