import test from 'node:test'
import assert from 'node:assert/strict'
import { daysAway, rhythmDrop } from '../src/come-back.ts'
import { calendarFile, nextPracticeTime } from '../src/calendar-file.ts'
import { emptyFluency, mergeFluency, parseFluency } from '../src/fluency.ts'

const record = (repId, date) => ({ id: `${repId}-${date.toISOString()}`, repId, completedAt: date.toISOString(), hintCount: 0 })
// Friday 23 October 2026, noon local time.
const now = new Date(2026, 9, 23, 12)
const daysBefore = (days, hour = 10) => new Date(2026, 9, 23 - days, hour)

test('days away count local calendar days since the last practice day', () => {
  assert.equal(daysAway([], now), null)
  assert.equal(daysAway([record('a', daysBefore(0))], now), 0)
  assert.equal(daysAway([record('a', daysBefore(9)), record('b', daysBefore(4, 23))], now), 4)
  // Invalid and future records never count.
  assert.equal(daysAway([{ id: 'x', repId: 'x', completedAt: 'soon', hintCount: 0 }, record('c', new Date(2026, 9, 24))], now), null)
})

test('a slowing rhythm needs a rhythm to lose and some recent practice', () => {
  const before = [16, 18, 20, 22, 25].map((days, index) => record(`b${index}`, daysBefore(days)))
  assert.deepEqual(rhythmDrop([...before, record('r', daysBefore(3))], now), { recent: 1, before: 5, lighterTarget: 1 })
  assert.deepEqual(rhythmDrop([...before, record('r', daysBefore(3)), record('s', daysBefore(10))], now), {
    recent: 2,
    before: 5,
    lighterTarget: 1,
  })
  // No recent practice: that is time away, which Trail's welcome back covers.
  assert.equal(rhythmDrop(before, now), null)
  // Three days before is not yet a rhythm, and a recent half above half the earlier one is not a drop.
  assert.equal(rhythmDrop([...before.slice(2), record('r', daysBefore(3))], now), null)
  const steady = [...before, ...[1, 3, 5].map((days, index) => record(`s${index}`, daysBefore(days)))]
  assert.equal(rhythmDrop(steady, now), null)
})

test('the next practice time is the first chosen day whose time has not passed', () => {
  const goal = { pathId: 'typescript', minutes: 25, days: [1, 5], time: '18:30' }
  assert.equal(nextPracticeTime(goal, now).toString(), new Date(2026, 9, 23, 18, 30).toString())
  assert.equal(nextPracticeTime(goal, new Date(2026, 9, 23, 19)).toString(), new Date(2026, 9, 26, 18, 30).toString())
  assert.equal(nextPracticeTime({ ...goal, days: [] }, now), null)
  // Without a chosen time, evenings at seven.
  assert.equal(nextPracticeTime({ ...goal, time: undefined }, now).getHours(), 19)
})

test('the calendar file repeats weekly on the practice days, escapes text, and folds long lines', () => {
  const goal = { pathId: 'typescript', minutes: 25, days: [5, 1], time: '18:30' }
  const file = calendarFile(goal, { reason: 'Pass interviews; build things, for real', url: 'http://127.0.0.1:4173/#/home', now })
  assert.ok(file.endsWith('\r\n'))
  const lines = file.split('\r\n')
  assert.ok(lines.includes('RRULE:FREQ=WEEKLY;BYDAY=MO,FR'))
  assert.ok(lines.includes('DTSTART:20261023T183000'))
  assert.ok(lines.includes('DURATION:PT25M'))
  assert.ok(lines.includes('TRIGGER:-PT10M'))
  const unfolded = file.replace(/\r\n /g, '')
  assert.match(unfolded, /DESCRIPTION:Why: Pass interviews\\; build things\\, for real\\nOne review counts/)
  for (const line of lines) assert.ok(new TextEncoder().encode(line).length <= 75, line)
  assert.equal(calendarFile({ ...goal, days: [] }, { url: 'x', now }), null)
})

test('learning data accepts a practice time, a reminder choice, and a reason, and rejects bad ones', () => {
  const state = emptyFluency()
  const saved = parseFluency({ ...state, goal: { ...state.goal, time: '07:05', remind: true }, reason: 'Ship my own app.' })
  assert.equal(saved.goal.time, '07:05')
  assert.equal(saved.goal.remind, true)
  assert.equal(saved.reason, 'Ship my own app.')
  for (const time of ['7:05', '24:00', '12:60', 1200])
    assert.throws(() => parseFluency({ ...state, goal: { ...state.goal, time } }), /invalid/)
  assert.throws(() => parseFluency({ ...state, goal: { ...state.goal, remind: 'yes' } }), /invalid/)
  assert.throws(() => parseFluency({ ...state, reason: 'x'.repeat(161) }), /invalid/)
  assert.equal(mergeFluency(state, { ...state, reason: 'Mine' }, state).reason, 'Mine')
  assert.equal('reason' in mergeFluency({ ...state, reason: 'Old' }, state, { ...state, reason: 'Old' }), false)
})

test('a reminder waits for the practice time and stays quiet on a day already practiced', async t => {
  const { startReminders } = await import('../src/reminders.ts')
  const shown = []
  globalThis.Notification = class {
    static permission = 'granted'
    constructor(title, options) {
      shown.push([title, options.body])
    }
  }
  t.after(() => delete globalThis.Notification)
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: new Date(2026, 9, 23, 18) })
  let practiced = false
  const stop = startReminders({
    goal: { pathId: 'typescript', minutes: 20, days: [5], time: '18:30' },
    reason: 'Ship my app.',
    practicedToday: () => practiced,
    now: () => new Date(Date.now()),
  })
  t.mock.timers.tick(29 * 60 * 1000)
  assert.equal(shown.length, 0)
  t.mock.timers.tick(2 * 60 * 1000)
  assert.deepEqual(shown, [['Time for Code Reps', 'Ship my app. One review counts.']])
  // A week later the same time comes round, in steps no longer than six hours; practice that day keeps it quiet.
  practiced = true
  for (let hour = 0; hour < 7 * 24; hour += 6) t.mock.timers.tick(6 * 60 * 60 * 1000)
  assert.equal(shown.length, 1)
  stop()
})
