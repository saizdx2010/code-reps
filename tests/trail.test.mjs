import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTrail } from '../src/trail-map.ts'
import { foundationsPathId, stageCoveredByFoundations, trackGroups } from '../src/curriculum.ts'
import { paths } from '../src/path.ts'

const fresh = { completed: () => false, inProgress: () => false, recallReady: () => true, lessonChecked: () => false }

test('every path has one home: Foundations or exactly one track group', () => {
  const grouped = trackGroups.flatMap(group => group.pathIds)
  assert.equal(new Set(grouped).size, grouped.length)
  assert.deepEqual([foundationsPathId, ...grouped].sort(), paths.map(path => path.id).sort())
})

test('trail keeps every path rep in order and interleaves each lesson once before its first rep', () => {
  for (const path of paths) {
    const trail = buildTrail(path.id, fresh)
    const nodes = trail.stages.flatMap(stage => stage.nodes)
    const repIds = nodes.filter(node => node.kind === 'rep').map(node => node.repId)
    assert.deepEqual(repIds, path.stages.flatMap(stage => stage.repIds), path.id)
    const lessons = nodes.filter(node => node.kind === 'lesson').map(node => node.skillId)
    assert.equal(new Set(lessons).size, lessons.length, `${path.id} repeats a lesson`)
    assert.equal(trail.total, new Set(repIds).size)
  }
})

test('the first unfinished, available rep is next; recall that is not ready is marked for later', () => {
  const trail = buildTrail('typescript', { ...fresh, completed: id => id === 'declare-variables', recallReady: id => id !== 'basic-types' })
  const reps = trail.stages.flatMap(stage => stage.nodes).filter(node => node.kind === 'rep')
  assert.equal(reps[0].state, 'done')
  assert.equal(reps[1].state, 'later')
  assert.equal(reps[2].state, 'next')
  assert.equal(trail.nextRepId, reps[2].repId)
  assert.equal(trail.done, 1)
  assert.equal(reps.filter(node => node.state === 'next').length, 1)
})

test('returning learners skip the opening Foundations stage', () => {
  const trail = buildTrail('typescript', { ...fresh, skipStages: 1 })
  assert.equal(trail.stages[0].title, paths[0].stages[1].title)
})

test('language refreshers in other tracks are shown as covered by Foundations', () => {
  const dsa = paths.find(path => path.id === 'algorithms-data-structures')
  assert.equal(stageCoveredByFoundations(dsa.id, dsa.stages[0].repIds), true)
  assert.equal(stageCoveredByFoundations(dsa.id, dsa.stages[1].repIds), false)
  assert.equal(stageCoveredByFoundations(foundationsPathId, paths[0].stages[0].repIds), false)
  assert.equal(buildTrail(dsa.id, fresh).stages[0].covered, true)
})

test('project applications end the trail without changing path completion counts', () => {
  const trail = buildTrail('frontend', fresh)
  const last = trail.stages.at(-1)
  assert.ok(last.nodes.every(node => node.kind === 'project'))
  assert.equal(trail.total, new Set(paths.find(path => path.id === 'frontend').stages.flatMap(stage => stage.repIds)).size)
})
