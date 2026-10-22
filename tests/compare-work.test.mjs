import assert from 'node:assert/strict'
import test from 'node:test'
import { earlierWork, lineDiff, sharedShare, sideBySide } from '../src/compare-work.ts'
import { journeys } from '../src/learning.ts'

const rec = (id, repId, completedAt, plan = 'p', explanation = 'e') => ({
  id,
  repId,
  completedAt,
  plan,
  code: '',
  explanation,
  hintCount: 0,
})

test('then and now finds the first earlier same-rep attempt and the first attempt at the journey step before', () => {
  const arrays = journeys.find(journey => journey.id === 'arrays')
  const history = [
    rec('g1', arrays.guided, '2026-10-01T10:00:00.000Z'),
    rec('i1', arrays.independent, '2026-10-02T10:00:00.000Z'),
    rec('i2', arrays.independent, '2026-10-05T10:00:00.000Z'),
    rec('r1', arrays.recall, '2026-10-08T10:00:00.000Z'),
    rec('r2', arrays.recall, '2026-10-12T10:00:00.000Z'),
    rec('later', arrays.independent, '2026-10-20T10:00:00.000Z'),
  ]
  const found = earlierWork(arrays.recall, '2026-10-12T10:00:00.000Z', history)
  assert.deepEqual(
    found.map(item => [item.record.id, item.relation]),
    [
      ['r1', 'same'],
      ['i1', 'related'],
    ],
  )
  assert.equal(found[1].journeyTitle, arrays.title)
  assert.deepEqual(
    found.map(item => item.days),
    [4, 10],
  )
  assert.deepEqual(
    earlierWork(arrays.independent, '2026-10-02T10:00:00.000Z', history).map(item => item.record.id),
    ['g1'],
    'the current attempt itself is never earlier work',
  )
  assert.deepEqual(earlierWork(arrays.guided, '2026-10-01T10:00:00.000Z', history), [])
  assert.deepEqual(earlierWork(arrays.recall, 'not a date', history), [])
})

test('the line comparison ignores spacing, semicolons, comments, and blank lines', () => {
  const reference = 'function f(n: number) {\n  let total = 0\n  for (const x of [n]) total += x\n  return total\n}'
  const yours = '// my version\nfunction f(n:number){\n\n  let total=0;\n  return total\n}'
  const diff = lineDiff(yours, reference)
  assert.deepEqual(
    diff.map(line => line.side),
    ['both', 'both', 'reference', 'both', 'both'],
  )
  assert.equal(diff[2].text, '  for (const x of [n]) total += x')
  assert.deepEqual(sharedShare(diff), { shared: 4, reference: 5 })
})

test('the line comparison keeps order and marks lines that exist on only one side', () => {
  const diff = lineDiff('a()\nb()\nc()', 'a()\nx()\nc()')
  assert.deepEqual(
    diff.map(line => `${line.side}:${line.text}`),
    ['both:a()', 'yours:b()', 'reference:x()', 'both:c()'],
  )
  assert.deepEqual(lineDiff('', ''), [])
  assert.deepEqual(sharedShare(lineDiff('', 'a()')), { shared: 0, reference: 1 })
})

test('side by side keeps each version whole and marks lines found in only one', () => {
  const then = 'function f(xs) {\n  let n = 0\n  for (const x of xs) n++\n  return n\n}'
  const now = 'function f(xs) {\n  return xs.length\n}'
  const { then: before, now: after } = sideBySide(then, now)
  assert.deepEqual(
    before.map(line => `${line.changed ? '*' : ' '}${line.text.trim()}`),
    [' function f(xs) {', '*let n = 0', '*for (const x of xs) n++', '*return n', ' }'],
  )
  assert.deepEqual(
    after.map(line => `${line.changed ? '*' : ' '}${line.text.trim()}`),
    [' function f(xs) {', '*return xs.length', ' }'],
  )
  assert.deepEqual(sideBySide('a()', 'a();'), { then: [{ text: 'a()', changed: false }], now: [{ text: 'a();', changed: false }] })
})

test('then and now counts calendar days, so last night and this morning are a day apart', () => {
  const night = new Date(2026, 9, 21, 23, 0).toISOString()
  const morning = new Date(2026, 9, 22, 8, 0).toISOString()
  const history = [{ id: 'n', repId: 'count-words', completedAt: night, plan: '', code: '', explanation: '', hintCount: 0 }]
  assert.equal(earlierWork('count-words', morning, history)[0].days, 1)
})
