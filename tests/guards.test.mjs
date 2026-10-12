import test from 'node:test'
import assert from 'node:assert/strict'
import { isDateString, isPlainObject } from '../src/guards.ts'
import { byCompletedAt, DAY_MS } from '../src/dates.ts'

test('plain-object guard rejects null, arrays and primitives', () => {
  assert.equal(isPlainObject({}), true)
  assert.equal(isPlainObject(Object.create(null)), true)
  for (const value of [null, undefined, [], 'text', 0, false]) assert.equal(isPlainObject(value), false)
})

test('date-string guard requires a parseable string within the optional length cap', () => {
  assert.equal(isDateString('2026-10-06T12:00:00.000Z'), true)
  assert.equal(isDateString('2026-10-06T12:00:00.000Z', 24), true)
  assert.equal(isDateString('2026-10-06T12:00:00.000Z', 23), false)
  for (const value of ['never', '', 1_759_752_000_000, null, undefined]) assert.equal(isDateString(value), false)
})

test('completed-at ordering is oldest first and keeps equal times in place', () => {
  const records = [{ id: 'b', completedAt: '2026-10-02T00:00:00Z' }, { id: 'a', completedAt: '2026-10-01T00:00:00Z' }, { id: 'c', completedAt: '2026-10-02T00:00:00Z' }]
  assert.deepEqual([...records].sort(byCompletedAt).map(r => r.id), ['a', 'b', 'c'])
  assert.deepEqual([...records].sort((a, b) => byCompletedAt(b, a)).map(r => r.id), ['b', 'c', 'a'])
  assert.equal(DAY_MS, 24 * 60 * 60 * 1000)
})
