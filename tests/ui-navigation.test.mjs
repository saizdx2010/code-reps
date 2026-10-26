import assert from 'node:assert/strict'
import test from 'node:test'
import { navigationArea, navigationSections, readRoute, routeHash, sectionView } from '../src/ui-navigation.ts'
import { runAsyncRep, runRep } from '../src/runner.ts'
import { hubTabs, isHubTab, learningPageTitles } from '../src/learning-pages.ts'

test('exercise bookmarks, library, and every product page round-trip', () => {
  for (const view of [
    'sessions',
    'home',
    'catalog',
    'paths',
    'learn',
    'progress',
    'skillmap',
    'history',
    'knowledge',
    'projects',
    'interview',
    'notebook',
    'assessment',
    'mistakes',
    'stuck',
    'patterns',
    'plan',
    'first-weeks',
  ]) {
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
  assert.deepEqual(
    navigationSections.trail.map(page => page.label),
    ['Your trail', 'All tracks'],
  )
  assert.deepEqual(
    navigationSections.library.map(page => page.label),
    ['Exercises', 'Lessons', 'Projects'],
  )
  assert.deepEqual(
    navigationSections.progress.map(page => page.label),
    ['Skills', 'Journal'],
  )
  // Old routes resolve and highlight the page that now holds them.
  const homes = {
    mistakes: 'history',
    stuck: 'history',
    patterns: 'knowledge',
    skillmap: 'progress',
    plan: 'progress',
    assessment: 'progress',
    'first-weeks': 'progress',
    finished: 'progress',
    interview: 'projects',
  }
  for (const [view, home] of Object.entries(homes)) assert.equal(sectionView(view), home)
  assert.equal(navigationArea('interview'), 'library')
  assert.equal(navigationArea('mistakes'), 'progress')
  const pages = Object.values(navigationSections).flat()
  assert.equal(new Set(pages.map(page => page.view)).size, pages.length)
})

test('unknown exercises and malformed bookmarks recover without throwing', () => {
  assert.deepEqual(readRoute('#/practice/missing', ['one']), { view: 'catalog' })
  assert.deepEqual(readRoute('#/practice/%E0%A4%A', ['one']), { view: 'catalog' })
  assert.deepEqual(readRoute('#/missing', ['one']), { view: 'home' })
  assert.deepEqual(readRoute('', ['one']), { view: 'home' })
})

test('learning hub tabs are routable pages with a title each', () => {
  assert.deepEqual([...hubTabs].sort(), Object.keys(learningPageTitles).sort())
  for (const tab of hubTabs) {
    assert.equal(isHubTab(tab), true)
    assert.deepEqual(readRoute(routeHash({ view: tab }), ['one']), { view: tab })
  }
  for (const view of ['home', 'catalog', 'workspace', 'history', 'learn', 'progress']) assert.equal(isHubTab(view), false)
})

test('failed checks expose structured expected and actual feedback', () => {
  const result = runRep('function mostFrequent() { return 123 }', 'most-frequent-number')[0]
  assert.equal(result.passed, false)
  assert.equal(result.expected, '4')
  assert.equal(result.actual, '123')
  assert.match(result.input, /mostFrequent/)
  const thrown = runRep('function mostFrequent() { throw new Error("Try again") }', 'most-frequent-number')[0]
  assert.equal(thrown.message, 'Your code threw an error: Try again')
})

test('a check whose code throws still shows the input and the expected value, in the worker path too', async () => {
  const code = 'function mostFrequent(numbers: number[]) { if (numbers.length === 0) throw new Error("empty"); return numbers[0] }'
  for (const results of [runRep(code, 'most-frequent-number'), await runAsyncRep(code, 'most-frequent-number')]) {
    const empty = results.find(result => !result.passed && result.message?.includes('empty'))
    assert.ok(empty, 'the empty-array check fails with the thrown message')
    assert.equal(empty.message, 'Your code threw an error: empty')
    assert.equal(empty.input, 'mostFrequent([])')
    assert.equal(empty.expected, 'null')
    assert.equal(empty.actual, undefined)
  }
  const [bare] = await runAsyncRep('function mostFrequent() { throw "nope" }', 'most-frequent-number')
  assert.equal(bare.message, 'Your code threw an error.')
  assert.match(bare.input, /^mostFrequent\(/)
})

test('each lesson has its own address, and unknown lessons fall back to the lessons page', () => {
  assert.deepEqual(readRoute('#/knowledge/arrays', []), { view: 'knowledge', skillId: 'arrays' })
  assert.equal(routeHash({ view: 'knowledge', skillId: 'arrays' }), '#/knowledge/arrays')
  assert.deepEqual(readRoute(routeHash({ view: 'knowledge', skillId: 'values' }), []), { view: 'knowledge', skillId: 'values' })
  assert.deepEqual(readRoute('#/knowledge/not-a-lesson', []), { view: 'knowledge' })
  assert.deepEqual(readRoute('#/knowledge/%E0%A4%A', []), { view: 'knowledge' })
  assert.equal(routeHash({ view: 'knowledge' }), '#/knowledge')
})

test('a finished track has its own address under Progress; without a track it opens Skills', () => {
  assert.equal(routeHash({ view: 'finished', pathId: 'typescript' }), '#/finished/typescript')
  assert.deepEqual(readRoute('#/finished/typescript', []), { view: 'finished', pathId: 'typescript' })
  assert.deepEqual(readRoute('#/finished', []), { view: 'progress' })
  // The page itself says when an id names no track, so an old bookmark still lands somewhere that explains it.
  assert.deepEqual(readRoute('#/finished/not-a-track', []), { view: 'finished', pathId: 'not-a-track' })
  assert.equal(navigationArea('finished'), 'progress')
})
