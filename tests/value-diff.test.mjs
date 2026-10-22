import assert from 'node:assert/strict'
import test from 'node:test'
import { describeDifference } from '../src/value-diff.ts'

const diff = (expected, actual) => describeDifference(JSON.stringify(expected), JSON.stringify(actual) ?? 'undefined')

test('lists name extra and missing items at the end by index', () => {
  assert.equal(diff(['Ann', 'Bo'], ['Ann', 'Bo', 'bo']), '1 extra item at index 2: "bo".')
  assert.equal(diff([1], [1, 2, 3]), '2 extra items from index 1: [2,3].')
  assert.equal(diff([1, 2, 3], [1, 2]), '1 item missing at index 2: 3.')
  assert.equal(diff([1, 2, 3], []), '3 items missing from index 0: [1,2,3].')
})

test('lists of the same length name the first differing item and count the rest', () => {
  assert.equal(diff([1, 2, 3], [1, 5, 3]), 'Item 1 differs: 2 expected, 5 received.')
  assert.equal(diff([1, 2, 3], [0, 5, 3]), 'Item 0 differs: 1 expected, 0 received (and 1 more).')
  assert.equal(diff([1, 2, 3], [3, 1, 2]), 'Same items, in a different order.')
  assert.equal(diff([1, 2], [3, 1, 2]), 'Expected 2 items, received 3; the first difference is at index 0.')
})

test('numbers say how far off and in which direction', () => {
  assert.equal(diff(6, 3), 'Expected 6, received 3: 3 less than expected.')
  assert.equal(diff(2, 2.5), 'Expected 2, received 2.5: 0.5 more than expected.')
  assert.equal(diff(0.3, 0.1 + 0.2), 'Expected 0.3, received 0.30000000000000004: they differ only by floating-point rounding.')
})

test('text names the first differing character, case, edges, and length', () => {
  assert.equal(diff('Ann Lee', 'Ann lee'), 'Same letters, different capitalization.')
  assert.equal(diff('Ann', ' Ann '), 'Same text apart from spaces at the start or end.')
  assert.equal(diff('cat', 'cut'), 'Differs at character 2: "a" expected, "u" received.')
  assert.equal(diff('cat', 'cats'), '1 extra character at the end: "s".')
  assert.equal(diff('cats', 'ca'), '2 characters missing at the end: "ts".')
})

test('objects name missing and unexpected keys before differing values', () => {
  assert.equal(diff({ total: 6 }, { count: 6 }), 'Key “total” is missing; “count” was not expected.')
  assert.equal(diff({ a: 1, b: 2 }, { a: 1 }), 'Key “b” is missing.')
  assert.equal(diff({ total: 6, items: 2 }, { total: 3, items: 2 }), 'Key “total”: 6 expected, 3 received.')
})

test('a different kind of value, or no value, is named plainly', () => {
  assert.equal(diff(3, '3'), 'Expected a number, received text: "3".')
  assert.equal(diff([1], null), 'Expected a list, received null: null.')
  assert.equal(diff(true, false), 'Expected true, received false.')
  assert.equal(diff(3, undefined), 'Received undefined: the function returned no value.')
})

test('values that are not JSON, or read back the same, get no sentence', () => {
  assert.equal(describeDifference('not json', '3'), null)
  assert.equal(describeDifference('{"a":1,"b":2}', '{"b":2,"a":1}'), null)
  assert.equal(describeDifference('null', 'null'), null)
})

test('long values are shortened so the sentence stays short', () => {
  const sentence = diff(['x'], ['x', 'a'.repeat(80)])
  assert.ok(sentence.length < 70, sentence)
  assert.ok(sentence.endsWith('….'))
})
