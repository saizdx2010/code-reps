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
  const cyclic = {}
  cyclic.self = cyclic
  assert.equal(sameValue(cyclic, { self: {} }), false)
})

test('an unfilled array slot never matches an authored value', () => {
  assert.equal(sameValue(new Array(2), ['a', 'b']), false)
  const partly = ['a']
  partly.length = 2
  assert.equal(sameValue(partly, ['a', 'b']), false)
  assert.equal(sameValue(['a', 'b'], ['a', 'b']), true)
})

test('negative zero matches zero, as JSON has one zero', () => {
  assert.equal(sameValue(-0, 0), true)
  assert.equal(sameValue([0, -0], [-0, 0]), true)
  assert.equal(sameValue(Number.NaN, Number.NaN), true)
  assert.equal(sameValue(0, false), false)
})
