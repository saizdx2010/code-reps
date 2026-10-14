import assert from 'node:assert/strict'
import test from 'node:test'
import { earlierWork, lineDiff, sharedShare } from '../src/compare-work.ts'
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

test('earlier work finds the latest earlier same-rep attempt and the journey step before', () => {
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
      ['i2', 'related'],
    ],
  )
  assert.equal(found[1].journeyTitle, arrays.title)
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
