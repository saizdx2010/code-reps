import assert from 'node:assert/strict'
import test from 'node:test'
import { migratePathId, paths, retiredPathIds } from '../src/path.ts'
import { foundationsPathId, pathApplications, trackGroups } from '../src/curriculum.ts'
import { emptyFluency, parseFluency } from '../src/fluency.ts'
import { reps } from '../src/rep.ts'

// Every rep that belonged to any path before the Foundations + three-track restructure.
const previouslyPlaced = ["declare-variables","basic-types","create-objects","make-arrays","write-functions","sum-positive-numbers","count-even-numbers","count-above-threshold","first-long-word","has-duplicate","most-frequent-number","first-unique-character","count-words","missing-number","valid-parentheses","balanced-brackets","count-long-words","first-repeated-number","remove-adjacent-pairs","repair-visible-count","read-unique-names","transform-active-labels","task-state-label","saved-record-status","catalog-request-summary","frontend-visible-items","frontend-view-state","frontend-directory","backend-validate-user","validate-stock-adjustment","parse-delivery-window","project-team-directory","promise-outcomes","latest-request","search-request-state","preview-slot-results","debug-cart-total","ds-array-operations","ds-set-operations","ds-map-operations","ds-stack-operations","ds-queue-operations","algo-sorted-pair","algo-window-sum","algo-binary-search","closure-counters","reference-groups","event-loop-order","singleton-owner","pubsub-trace","injected-clock","debounce-schedule","leading-throttle","websocket-gate","choose-live-transport","shared-resource","subscription-cleanup","cache-freshness","retry-backoff","idempotent-ledger","optimistic-balance","refresh-report-state","room-leases","read-batch-labels","backend-ticket-handler","refactor-stock-summary","verify-generated-code","validate-import-batch","backend-page-results","interview-frontend","interview-backend","project-ticket-api"]

test('the trail is Foundations plus three tracks', () => {
  assert.deepEqual(paths.map(path => path.id), ['typescript', 'algorithms-data-structures', 'frontend', 'backend'])
  assert.equal(foundationsPathId, 'typescript')
  assert.deepEqual(trackGroups.flatMap(group => group.pathIds), ['algorithms-data-structures', 'frontend', 'backend'])
})

test('every rep from the old nine paths still appears in a path or its project capstone', () => {
  const placed = new Set([...paths.flatMap(path => path.stages.flatMap(stage => stage.repIds)), ...Object.values(pathApplications).flatMap(list => list.map(item => item.repId))])
  assert.deepEqual(previouslyPlaced.filter(id => !placed.has(id)), [])
  for (const id of placed) assert.ok(reps.some(rep => rep.id === id), id)
})

test('reps are not duplicated across tracks except interview capstones and Foundations stage links', () => {
  const owners = new Map()
  for (const path of paths.filter(path => path.id !== foundationsPathId)) for (const id of new Set(path.stages.flatMap(stage => stage.repIds))) owners.set(id, [...(owners.get(id) ?? []), path.id])
  const shared = [...owners].filter(([, list]) => list.length > 1).map(([id]) => id)
  assert.deepEqual(shared, ['interview-backend'])
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
