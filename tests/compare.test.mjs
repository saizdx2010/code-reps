import assert from 'node:assert/strict'
import test from 'node:test'
import { sameValue } from '../src/compare.ts'

test('compares authored arrays and objects by value', () => {
  assert.equal(sameValue([{ name: 'Ada', score: 2 }], [{ score: 2, name: 'Ada' }]), true)
  assert.equal(sameValue(['Ada'], ['Bo']), false)
  assert.equal(sameValue([1, 2], [1]), false)
  assert.equal(sameValue({ a: 1 }, { a: 1, b: 2 }), false)
})

test('handles unusual user output without looping', () => {
  const cyclic = {}; cyclic.self = cyclic
  assert.equal(sameValue(cyclic, { self: {} }), false)
})
