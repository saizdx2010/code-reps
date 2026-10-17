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
    assert.deepEqual(
      repIds,
      path.stages.flatMap(stage => stage.repIds),
      path.id,
    )
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
  assert.equal(stageCoveredByFoundations(dsa.id, dsa.stages[1].repIds), true)
  assert.equal(stageCoveredByFoundations(dsa.id, dsa.stages[0].repIds), false)
  assert.equal(stageCoveredByFoundations(foundationsPathId, paths[0].stages[0].repIds), false)
  assert.equal(buildTrail(dsa.id, fresh).stages[1].covered, true)
})

test('a Backend stage made of SQL reps links to the SQL track instead of repeating it', () => {
  const backend = buildTrail('backend', fresh)
  const linked = backend.stages.filter(stage => stage.coveredBy)
  assert.deepEqual(
    linked.map(stage => [stage.coveredBy.id, stage.coveredBy.title, stage.covered]),
    [['sql', 'SQL', true]],
  )
  // The SQL track shows the same reps as its own stage, never as a link.
  assert.ok(buildTrail('sql', fresh).stages.every(stage => !stage.coveredBy))
  assert.equal(buildTrail('algorithms-data-structures', fresh).stages[1].coveredBy.title, 'Foundations')
})

test('project applications end the trail without changing path completion counts', () => {
  const trail = buildTrail('frontend', fresh)
  const last = trail.stages.at(-1)
  assert.ok(last.nodes.every(node => node.kind === 'project'))
  assert.equal(trail.total, new Set(paths.find(path => path.id === 'frontend').stages.flatMap(stage => stage.repIds)).size)
})

test('every authored stage has a recap that survives trail derivation', () => {
  for (const path of paths) {
    const trail = buildTrail(path.id, { ...fresh, completed: () => true })
    path.stages.forEach((stage, index) => {
      assert.match(stage.recap, /^You can now .+\.$/)
      assert.equal(trail.stages[index].recap, stage.recap)
      assert.equal(trail.stages[index].done, trail.stages[index].total)
    })
  }
})

test('the recommended rep is the trail node marked next, so the panel and the trail agree', () => {
  const inProgress = id => id === 'basic-types' || id === 'make-arrays'
  const trail = buildTrail('typescript', { ...fresh, inProgress, focusRepId: 'make-arrays' })
  const reps = trail.stages.flatMap(stage => stage.nodes).filter(node => node.kind === 'rep')
  assert.equal(trail.nextRepId, 'make-arrays')
  assert.deepEqual(
    reps.filter(node => node.state === 'next').map(node => node.repId),
    ['make-arrays'],
  )
  assert.equal(reps.find(node => node.repId === 'basic-types').state, 'draft')
  assert.equal(reps.find(node => node.repId === 'make-arrays').inProgress, true)
})

test('a recommendation that is off the trail, done, or not ready leaves the first available rep as next', () => {
  for (const focusRepId of ['not-on-this-trail', 'declare-variables', 'count-above-threshold']) {
    const trail = buildTrail('typescript', {
      ...fresh,
      completed: id => id === 'declare-variables',
      recallReady: id => id !== 'count-above-threshold',
      focusRepId,
    })
    assert.equal(trail.nextRepId, 'basic-types', focusRepId)
  }
})

test('returning learners skip every leading language-basics stage, matching the practice plan', async () => {
  const { returningSkipStages } = await import('../src/curriculum.ts')
  const { foundationRepIds } = await import('../src/catalog-index.ts')
  const { getPracticePlan } = await import('../src/practice.ts')
  const skip = returningSkipStages('typescript')
  assert.ok(skip >= 1)
  assert.ok(paths[0].stages.slice(0, skip).every(stage => stage.repIds.every(id => foundationRepIds.includes(id))))
  assert.equal(returningSkipStages('frontend'), 0)
  const trail = buildTrail('typescript', { ...fresh, skipStages: skip })
  const plan = getPracticePlan({}, [], 'returning', '', Date.now(), 'typescript')
  assert.equal(trail.nextRepId, plan.next.repId)
})
