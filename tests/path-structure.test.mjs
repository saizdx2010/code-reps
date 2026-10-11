import assert from 'node:assert/strict'
import test from 'node:test'
import { firstPath, migratePathId, paths, retiredPathIds } from '../src/path.ts'
import { foundationsPathId, pathApplications, trackGroups } from '../src/curriculum.ts'
import { emptyFluency, parseFluency } from '../src/fluency.ts'
import { journeys } from '../src/learning.ts'
import { catalogTopic } from '../src/catalog-labels.ts'
import { skills } from '../src/knowledge.ts'
import { reps } from '../src/rep.ts'

// Every rep that belonged to any path before the Foundations + three-track restructure.
const previouslyPlaced = ["declare-variables","basic-types","create-objects","make-arrays","write-functions","sum-positive-numbers","count-even-numbers","count-above-threshold","first-long-word","has-duplicate","most-frequent-number","first-unique-character","count-words","missing-number","valid-parentheses","balanced-brackets","count-long-words","first-repeated-number","remove-adjacent-pairs","repair-visible-count","read-unique-names","transform-active-labels","task-state-label","saved-record-status","catalog-request-summary","frontend-visible-items","frontend-view-state","frontend-directory","backend-validate-user","validate-stock-adjustment","parse-delivery-window","project-team-directory","promise-outcomes","latest-request","search-request-state","preview-slot-results","debug-cart-total","ds-array-operations","ds-set-operations","ds-map-operations","ds-stack-operations","ds-queue-operations","algo-sorted-pair","algo-window-sum","algo-binary-search","closure-counters","reference-groups","event-loop-order","singleton-owner","pubsub-trace","injected-clock","debounce-schedule","leading-throttle","websocket-gate","choose-live-transport","shared-resource","subscription-cleanup","cache-freshness","retry-backoff","idempotent-ledger","optimistic-balance","refresh-report-state","room-leases","read-batch-labels","backend-ticket-handler","refactor-stock-summary","verify-generated-code","validate-import-batch","backend-page-results","interview-frontend","interview-backend","project-ticket-api"]

test('the trail is Foundations plus four tracks', () => {
  assert.deepEqual(paths.map(path => path.id), ['typescript', 'algorithms-data-structures', 'pattern-recognition', 'frontend', 'backend'])
  assert.equal(foundationsPathId, 'typescript')
  assert.deepEqual(trackGroups.flatMap(group => group.pathIds), ['algorithms-data-structures', 'pattern-recognition', 'frontend', 'backend'])
})

test('every rep from the old nine paths still appears in a path or its project capstone', () => {
  const placed = new Set([...paths.flatMap(path => path.stages.flatMap(stage => stage.repIds)), ...Object.values(pathApplications).flatMap(list => list.map(item => item.repId))])
  assert.deepEqual(previouslyPlaced.filter(id => !placed.has(id)), [])
  for (const id of placed) assert.ok(reps.some(rep => rep.id === id), id)
})

test('reps are not duplicated across tracks except recognition practice, interview capstones and Foundations stage links', () => {
  const owners = new Map()
  for (const path of paths.filter(path => path.id !== foundationsPathId)) for (const id of new Set(path.stages.flatMap(stage => stage.repIds))) owners.set(id, [...(owners.get(id) ?? []), path.id])
  const shared = [...owners].filter(([, list]) => list.length > 1).map(([id]) => id)
  const recognitionIds = paths.find(path => path.id === 'pattern-recognition').stages.flatMap(stage => stage.repIds)
  assert.deepEqual(shared.sort(), [...recognitionIds, 'interview-backend'].sort())
  for (const id of recognitionIds) assert.deepEqual(owners.get(id), ['algorithms-data-structures', 'pattern-recognition'])
})

test('retired path ids map to current paths, and saved goals migrate safely', () => {
  const ids = new Set(paths.map(path => path.id))
  for (const [retired, current] of Object.entries(retiredPathIds)) {
    assert.ok(!ids.has(retired))
    assert.ok(ids.has(current))
    assert.equal(migratePathId(retired), current)
    const saved = emptyFluency()
    saved.goal.pathId = retired
    assert.equal(parseFluency(JSON.parse(JSON.stringify(saved))).goal.pathId, current)
  }
  assert.equal(migratePathId('backend'), 'backend')
  const unknown = emptyFluency()
  unknown.goal.pathId = 'made-up'
  assert.throws(() => parseFluency(JSON.parse(JSON.stringify(unknown))))
  assert.deepEqual(Object.keys(retiredPathIds).sort(), ['ai-era', 'interviews', 'practical-concepts', 'real-world', 'typescript-browser'])
})

test('structured briefs keep the full contract and early plan prompts stay short', async () => {
  const words = text => text.split(/\s+/).filter(Boolean).length
  const flat = rep => [rep.brief?.summary, ...(rep.brief?.rules ?? []), ...(rep.brief?.edgeCases ?? [])].join(' ')
  for (const rep of reps.filter(item => item.brief)) {
    const numbers = rep.prompt.match(/\d[\d.:]*/g) ?? []
    for (const value of numbers) assert.ok(flat(rep).includes(value), `${rep.id} brief lost ${value}`)
    assert.ok(rep.brief.rules.length >= 3, `${rep.id} needs a short rules list`)
  }
  for (const id of firstPath.stages.flatMap(stage => stage.repIds)) {
    const rep = reps.find(item => item.id === id)
    assert.ok(words(rep.planPrompt) <= words(rep.prompt) + words(rep.note), `${id} plan prompt is longer than its brief`)
  }
})

test('every rep whose prompt and note exceed 120 words has a structured brief', () => {
  const words = text => text.split(/\s+/).filter(Boolean).length
  const missing = reps.filter(rep => words(rep.prompt) + words(rep.note) > 120 && !rep.brief).map(rep => rep.id)
  assert.deepEqual(missing, [])
})

test('recognition practice reuses valid tasks with mixed journeys and unlabeled stages', () => {
  const path = paths.find(path => path.id === 'pattern-recognition')
  const mixed = path.stages[1].repIds
  assert.ok(mixed.length >= 5 && mixed.length <= 6)
  const journeyFor = id => journeys.find(journey => [journey.guided, journey.independent, journey.recall, ...(journey.practice ?? [])].includes(id))?.id
  assert.ok(new Set(mixed.map(journeyFor)).size >= 3)
  mixed.forEach((id, index) => {
    assert.ok(journeyFor(id), id)
    if (index) assert.notEqual(journeyFor(id), journeyFor(mixed[index - 1]))
  })
  for (const stage of path.stages) {
    // Here map means a geographic floor plan, not the Map lookup technique.
    const title = stage.title === 'Find your way through a map' ? stage.title.replace('a map', 'a floor plan') : stage.title
    assert.doesNotMatch(title, /\b(window\w*|stack\w*|maps?|sets?|pointer\w*|binary|BFS|DFS)\b/i)
    for (const id of stage.repIds) assert.ok(reps.some(rep => rep.id === id), id)
  }
  const grids = path.stages.at(-1)
  assert.equal(grids.title, 'Find your way through a map')
  assert.deepEqual(grids.repIds, ['grid-open-neighbours', 'grid-count-rooms', 'grid-fewest-steps'])
  assert.ok(grids.description && grids.recap)
  const lesson = skills.find(skill => skill.id === 'recognize-the-pattern')
  assert.ok(path.introduction.body.includes(lesson.title))
  assert.ok(lesson.questions.length >= 6)
  assert.equal(new Set(lesson.questions.map(question => question.id)).size, lesson.questions.length)
  for (const question of lesson.questions) {
    assert.doesNotMatch(question.prompt, /\b(sliding window|stack|map|set|two pointers|binary search|BFS|DFS|backtracking|dynamic programming|prefix sums?|heap)\b/i)
    assert.ok(question.options[question.answer])
  }
  const problem = paths.find(item => item.id === 'algorithms-data-structures')
  for (const id of path.stages.flatMap(stage => stage.repIds)) {
    const rep = reps.find(item => item.id === id)
    if (rep.category.startsWith('Algorithm ') || rep.category === 'Problem-solving patterns') {
      assert.equal(catalogTopic(rep), id === 'simplify-file-path' ? 'Stacks and queues' : problem.stages.find(stage => stage.repIds.includes(id)).title)
    }
  }
})
