import assert from 'node:assert/strict'
import test from 'node:test'
import { getAllJourneys } from '../src/learning.ts'
import { formatWarmup, parseWarmup, pickWarmup, warmupPosition } from '../src/warmup.ts'

const day = 86_400_000
const now = Date.parse('2026-10-14T12:00:00.000Z')
const rec = (repId, daysAgo, extra = {}) => ({
  id: `${repId}-${daysAgo}`,
  repId,
  completedAt: new Date(now - daysAgo * day).toISOString(),
  plan: '',
  code: '',
  explanation: '',
  hintCount: 0,
  ...extra,
})
const none = () => false

test('a warm-up picks Beginner reps finished at least a day ago, least recent first, across topics', () => {
  const history = [
    rec('declare-variables', 10),
    rec('make-arrays', 9),
    rec('sum-positive-numbers', 5),
    rec('count-words', 3),
    rec('algo-binary-search', 20),
    rec('string-basics', 0.5),
    rec('declare-variables', 2),
  ]
  const picked = pickWarmup(history, getAllJourneys(history, now), none, now)
  // declare-variables was redone two days ago, so make-arrays is now the least recent; topics differ before repeating.
  assert.deepEqual(picked, ['make-arrays', 'sum-positive-numbers', 'count-words'])
  assert.ok(!picked.includes('algo-binary-search'), 'Intermediate reps are not warm-ups')
  assert.ok(!picked.includes('string-basics'), 'reps finished today are not warm-ups')
})

test('a warm-up fills from the same topic when needed and skips drafts and recall reps that are not ready', () => {
  const history = [rec('declare-variables', 6), rec('make-arrays', 5), rec('basic-types', 4), rec('sum-positive-numbers', 4)]
  assert.deepEqual(pickWarmup(history, [], none, now), ['declare-variables', 'sum-positive-numbers', 'make-arrays'])
  assert.deepEqual(
    pickWarmup(history, [], id => id === 'declare-variables', now),
    ['make-arrays', 'sum-positive-numbers', 'basic-types'],
  )
  const waiting = [{ journey: { recall: 'basic-types' }, recallDue: false, retained: false }]
  assert.ok(!pickWarmup(history, waiting, none, now).includes('basic-types'), 'a recall rep that is not ready is never a warm-up')
  const due = [{ journey: { recall: 'basic-types' }, recallDue: true, retained: false }]
  assert.ok(pickWarmup(history, due, id => id !== 'basic-types', now).includes('basic-types'))
  assert.deepEqual(pickWarmup([], [], none, now), [])
})

test('the stored warm-up round-trips and reports each rep position and the next one', () => {
  const ids = ['make-arrays', 'count-words', 'sum-positive-numbers']
  assert.deepEqual(parseWarmup(formatWarmup(ids)), ids)
  assert.deepEqual(parseWarmup(''), [])
  assert.deepEqual(parseWarmup('make-arrays,not-a-rep'), ['make-arrays'])
  assert.deepEqual(warmupPosition(ids, 'make-arrays'), { index: 0, total: 3, next: 'count-words' })
  assert.deepEqual(warmupPosition(ids, 'sum-positive-numbers'), { index: 2, total: 3, next: undefined })
  assert.equal(warmupPosition(ids, 'has-duplicate'), undefined)
})

test('a Today set round-trips its kinds and drops unknown reps; reviews warm up before the new rep', async () => {
  const { formatSet, parseSet } = await import('../src/warmup.ts')
  const { setOrder } = await import('../src/today-plan.ts')
  const items = [
    { repId: 'create-objects', kind: 'new', done: false },
    { repId: 'count-above-threshold', kind: 'review', done: false },
    { repId: 'declare-variables', kind: 'review', done: true },
  ]
  const set = setOrder(items)
  assert.deepEqual(set, [
    { repId: 'count-above-threshold', kind: 'review' },
    { repId: 'create-objects', kind: 'new' },
  ])
  assert.equal(formatSet(set), 'r:count-above-threshold,n:create-objects')
  assert.deepEqual(parseSet(formatSet(set)), set)
  assert.deepEqual(parseSet('r:not-a-rep,n:create-objects'), [{ repId: 'create-objects', kind: 'new' }])
  assert.deepEqual(parseSet(''), [])
})
