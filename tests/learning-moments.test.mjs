import assert from 'node:assert/strict'
import test from 'node:test'
import { skillSteps } from '../src/skill-map.ts'
import { personalBest, recallHeldDays } from '../src/personal-best.ts'
import { todayPlan } from '../src/today-plan.ts'

const day = 86_400_000
const t0 = Date.parse('2026-01-01T12:00:00Z')
const at = n => new Date(t0 + n * day).toISOString()
let serial = 0
const rec = (repId, n, hintCount = 0) => ({ id: `r${++serial}`, repId, completedAt: at(n), hintCount })
const later = t0 + 60 * day

test('a hint-free independent rep after the guided rep moves the skill up to Independent', () => {
  const guided = rec('sum-positive-numbers', 0, 2)
  const independent = rec('count-even-numbers', 1)
  const history = [guided, independent]
  assert.deepEqual(skillSteps(history, independent.id, later), [
    { id: 'arrays', title: 'Work through arrays', from: 'practiced', to: 'independent' },
  ])
  // Guided is not a step up, even though the skill moved from Not started.
  assert.deepEqual(skillSteps(history, guided.id, later), [])
})

test('a hinted independent attempt and a repeat at the same level are not step-ups', () => {
  const hinted = rec('count-even-numbers', 1, 1)
  assert.deepEqual(skillSteps([rec('sum-positive-numbers', 0), hinted], hinted.id, later), [])
  const again = rec('count-even-numbers', 2)
  const history = [rec('sum-positive-numbers', 0), rec('count-even-numbers', 1), again]
  assert.deepEqual(skillSteps(history, again.id, later), [])
})

test('a hint-free recall after the break moves the skill from Independent (or Review due) to Retained', () => {
  const recall = rec('count-above-threshold', 6)
  const history = [rec('sum-positive-numbers', 0), rec('count-even-numbers', 1), recall]
  assert.deepEqual(skillSteps(history, recall.id, later), [
    { id: 'arrays', title: 'Work through arrays', from: 'independent', to: 'retained' },
  ])
  assert.deepEqual(skillSteps(history, 'missing', later), [])
})

test('personal best: recall held needs a hint-free recall at least two weeks after independence', () => {
  const recall = rec('count-above-threshold', 1 + recallHeldDays)
  const history = [rec('sum-positive-numbers', 0), rec('count-even-numbers', 1), recall]
  assert.deepEqual(personalBest(history, recall.id, later), { kind: 'recall', days: recallHeldDays })
  const soon = rec('count-above-threshold', 5)
  // Too soon for "held", and the previous attempt on the skill used no hints, so there is nothing true to say.
  assert.equal(personalBest([rec('sum-positive-numbers', 0), rec('count-even-numbers', 1), soon], soon.id, later), null)
})

test('personal best: no hints this time when the previous attempt on the skill used hints', () => {
  const guided = rec('sum-positive-numbers', 0, 2)
  const independent = rec('count-even-numbers', 1)
  assert.deepEqual(personalBest([guided, independent], independent.id, later), { kind: 'no-hints', previousHints: 2, scope: 'skill' })
  // A first attempt has nothing to compare with.
  assert.equal(personalBest([guided], guided.id, later), null)
  // Outside a journey, only the same rep counts.
  const first = rec('basic-types', 0, 1)
  const second = rec('basic-types', 2)
  assert.deepEqual(personalBest([first, second], second.id, later), { kind: 'no-hints', previousHints: 1, scope: 'rep' })
  assert.equal(personalBest([rec('make-arrays', 0, 3), second], second.id, later), null)
})

test('personal best: fewer hints only on a repeat that still used some, and never on a tie or worse', () => {
  const first = rec('basic-types', 0, 3)
  const better = rec('basic-types', 1, 1)
  assert.deepEqual(personalBest([first, better], better.id, later), {
    kind: 'fewer-hints',
    hints: 1,
    previousHints: 3,
    previousAt: first.completedAt,
  })
  const tie = rec('basic-types', 2, 1)
  assert.equal(personalBest([first, better, tie], tie.id, later), null)
  const worse = rec('basic-types', 3, 2)
  assert.equal(personalBest([first, better, tie, worse], worse.id, later), null)
})

test('personal best ignores invalid and future dates', () => {
  const future = rec('basic-types', 400)
  assert.equal(personalBest([rec('basic-types', 0, 2), future], future.id, later), null)
  const current = rec('basic-types', 2)
  assert.equal(personalBest([{ ...rec('basic-types', 0, 2), completedAt: 'bad' }, current], current.id, later), null)
})

const action = (repId, mode = 'start') => ({ repId, mode, reason: '' })

test("today's plan: one new rep and up to two due reviews, done as attempts are completed today", () => {
  const now = new Date(t0 + 10 * day)
  const plan = {
    next: action('count-above-threshold', 'review'),
    recommended: action('make-arrays'),
    due: [action('count-above-threshold', 'review'), action('balanced-brackets', 'review'), action('first-long-word', 'review')],
  }
  const empty = todayPlan([], plan, now)
  assert.deepEqual(
    empty.items.map(item => [item.repId, item.kind, item.done]),
    [
      ['make-arrays', 'new', false],
      ['count-above-threshold', 'review', false],
      ['balanced-brackets', 'review', false],
    ],
  )
  assert.equal(empty.done, 0)
  assert.equal(empty.moreDue, 1)
  assert.equal(empty.shown, true)

  // A new rep finished today, and one review done: the review leaves the due list once it is completed.
  const history = [rec('make-arrays', 10), { ...rec('count-words', 5) }, rec('count-words', 10)]
  const after = todayPlan(history, { ...plan, recommended: action('create-objects'), due: plan.due.slice(1) }, now)
  assert.deepEqual(
    after.items.map(item => [item.repId, item.kind, item.done]),
    [
      ['make-arrays', 'new', true],
      ['count-words', 'review', true],
      ['balanced-brackets', 'review', false],
    ],
  )
  assert.equal(after.done, 2)
  assert.equal(after.complete, false)
})

test("today's plan is complete when everything is done, resets at midnight, and hides when it only repeats the panel", () => {
  const now = new Date(t0 + 10 * day)
  const plan = { next: action('create-objects'), recommended: action('create-objects'), due: [] }
  const done = todayPlan([rec('make-arrays', 10)], plan, now)
  assert.equal(done.complete, true)
  assert.equal(done.shown, true)
  const tomorrow = todayPlan([rec('make-arrays', 10)], plan, new Date(t0 + 11 * day))
  assert.deepEqual(
    tomorrow.items.map(item => [item.repId, item.done]),
    [['create-objects', false]],
  )
  assert.equal(tomorrow.shown, false)
  assert.equal(todayPlan([], { next: null, recommended: null, due: [] }, now).items.length, 0)
})
