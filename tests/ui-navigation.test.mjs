import assert from 'node:assert/strict'
import test from 'node:test'
import { navigationArea, navigationSections, readRoute, routeHash, sectionView } from '../src/ui-navigation.ts'
import { runRep } from '../src/runner.ts'

test('exercise bookmarks, library, and every product page round-trip', () => {
  for (const view of ['sessions', 'home', 'catalog', 'paths', 'learn', 'progress', 'skillmap', 'history', 'knowledge', 'projects', 'interview', 'notebook', 'assessment', 'plan']) {
    assert.deepEqual(readRoute(routeHash({ view }), ['one']), { view })
  }
  assert.deepEqual(readRoute(routeHash({ view: 'workspace', repId: 'one' }), ['one']), { view: 'workspace', repId: 'one' })
})

test('every tool has one navigation home while legacy lessons and exercises stay reachable', () => {
  for (const [area, pages] of Object.entries(navigationSections)) {
    for (const page of pages) assert.equal(navigationArea(page.view), area)
  }
  assert.equal(navigationArea('workspace'), 'library')
  assert.equal(navigationArea('learn'), 'library')
  assert.deepEqual(Object.keys(navigationSections), ['trail', 'library', 'progress'])
  assert.equal(navigationSections.trail[0].view, 'home')
  for (const view of ['history', 'sessions', 'notebook']) {
    assert.equal(navigationArea(view), 'progress')
    assert.equal(sectionView(view), 'history')
  }
  assert.equal(sectionView('learn'), 'knowledge')
  const pages = Object.values(navigationSections).flat()
  assert.equal(new Set(pages.map(page => page.view)).size, pages.length)
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
