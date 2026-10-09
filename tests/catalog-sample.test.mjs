import test from 'node:test'
import assert from 'node:assert/strict'
import { startHereReps } from '../src/catalog-sample.ts'
import { repLevel } from '../src/rep-levels.ts'
import { reps } from '../src/rep.ts'
import { foundationsPathId } from '../src/curriculum.ts'
import { paths } from '../src/path.ts'

const items = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id }))
const levels = { a: 3, b: 1, c: 2, d: 1, e: 2, f: undefined }
const level = id => levels[id]
const none = () => false

test('path reps come first in path order, skipping finished and unknown ids', () => {
  const picked = startHereReps(items, { pathRepIds: ['e', 'missing', 'c', 'a', 'b'], isDone: item => item.id === 'a', level, limit: 3 })
  assert.deepEqual(picked.map(item => item.id), ['e', 'c', 'b'])
})

test('falls back to the easiest unfinished reps, keeping catalog order for ties', () => {
  const picked = startHereReps(items, { pathRepIds: ['a'], isDone: item => item.id === 'b', level, limit: 4 })
  assert.deepEqual(picked.map(item => item.id), ['a', 'd', 'c', 'e'])
})

test('unplaced reps sort after every placed level', () => {
  const picked = startHereReps(items, { pathRepIds: [], isDone: none, level, limit: 6 })
  assert.equal(picked.at(-1).id, 'f')
})

test('returns no duplicates and no more than the limit', () => {
  const picked = startHereReps(items, { pathRepIds: ['a', 'a', 'b'], isDone: none, level })
  assert.equal(picked.length, 4)
  assert.equal(new Set(picked.map(item => item.id)).size, 4)
})

test('returns nothing when every candidate is finished', () => {
  assert.deepEqual(startHereReps(items, { pathRepIds: ['a'], isDone: () => true, level }), [])
})

test('the real Foundations sample starts with unfinished path reps and no finished rep', () => {
  const foundations = paths.find(path => path.id === foundationsPathId)
  const pathRepIds = foundations.stages.flatMap(stage => stage.repIds)
  const finished = new Set(pathRepIds.slice(0, 2))
  const picked = startHereReps(reps, { pathRepIds, isDone: item => finished.has(item.id), level: repLevel })
  assert.equal(picked.length, 4)
  assert.ok(picked.every(item => !finished.has(item.id)))
  assert.equal(picked[0].id, pathRepIds[2])
})
