import assert from 'node:assert/strict'
import test from 'node:test'
import { readRoute, routeHash } from '../src/ui-navigation.ts'
import { runRep } from '../src/runner.ts'

test('exercise bookmarks, library, and every product page round-trip', () => {
  for (const view of ['home', 'catalog', 'paths', 'learn', 'progress', 'history']) {
    assert.deepEqual(readRoute(routeHash({ view }), ['one']), { view })
  }
  assert.deepEqual(readRoute(routeHash({ view: 'workspace', repId: 'one' }), ['one']), { view: 'workspace', repId: 'one' })
})

test('unknown exercises and malformed bookmarks recover without throwing', () => {
  assert.deepEqual(readRoute('#/practice/missing', ['one']), { view: 'catalog' })
  assert.deepEqual(readRoute('#/practice/%E0%A4%A', ['one']), { view: 'catalog' })
  assert.deepEqual(readRoute('#/missing', ['one']), { view: 'home' })
  assert.deepEqual(readRoute('', ['one']), { view: 'home' })
})

test('failed checks expose structured expected and actual feedback', () => {
  const result = runRep('function mostFrequent() { return 123 }', 'most-frequent-number')[0]
  assert.equal(result.passed, false)
  assert.equal(result.expected, '4')
  assert.equal(result.actual, '123')
  assert.match(result.input, /mostFrequent/)
  const thrown = runRep('function mostFrequent() { throw new Error("Try again") }', 'most-frequent-number')[0]
  assert.equal(thrown.message, 'Try again')
})
