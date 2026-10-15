import assert from 'node:assert/strict'
import test from 'node:test'
import { pageEntries, searchPalette } from '../src/command-search.ts'
import { navigationSections } from '../src/ui-navigation.ts'

const labels = (query, context = []) =>
  Object.fromEntries(searchPalette(query, context).map(section => [section.group, section.entries.map(entry => entry.label)]))

test('an empty query offers what to continue, pages, and settings, never the whole catalog', () => {
  const continueEntry = { group: 'Continue', label: 'Read an array', target: { kind: 'rep', repId: 'read-array' }, text: '' }
  const setting = { group: 'Settings', label: 'Dark mode', target: { kind: 'action', id: 'theme' }, text: 'theme' }
  const groups = labels('', [continueEntry, setting])
  assert.deepEqual(Object.keys(groups), ['Continue', 'Pages', 'Settings'])
  assert.equal(groups.Pages.length, pageEntries.length)
})

test('words match the start of a word in titles, topics, and lesson vocabulary', () => {
  const closure = labels('closure')
  assert.deepEqual(closure.Lessons, ['Closures and private state'])
  assert.ok(closure.Exercises.includes('Build independent counters'), 'a rep is found through the lesson it practices')
  assert.ok(!closure.Exercises.some(title => /disclosure/i.test(title)), 'a word inside another word does not match')
  assert.ok(!(labels('arr').Lessons ?? []).some(title => /narrowing/i.test(title)))
})

test('titles that start with the query rank first and each group stays short', () => {
  const groups = labels('count')
  assert.ok(groups.Exercises.length <= 8)
  assert.match(groups.Exercises[0], /^Count/)
  assert.deepEqual(labels('no such words here'), {})
})

test('pages are named as the navigation names them', () => {
  for (const [area, items] of Object.entries(navigationSections)) {
    const areaLabel = area[0].toUpperCase() + area.slice(1)
    for (const item of items)
      assert.ok(
        pageEntries.some(page => page.view === item.view && page.label.startsWith(`${areaLabel} › `)),
        item.view,
      )
  }
})
