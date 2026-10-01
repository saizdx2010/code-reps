import { journeys } from '../src/learning.ts'
import assert from 'node:assert/strict'
import test from 'node:test'
import { getPracticePlan, attemptStatus } from '../src/practice.ts'
import { reps } from '../src/rep.ts'

const now = Date.parse('2026-09-30T12:00:00Z')
const old = '2026-09-20T12:00:00Z'
const draft = (id, extra = {}) => ({ plan: '', code: reps.find(rep => rep.id === id).starter, explanation: '', hintCount: 0, ...extra })
const record = (repId, extra = {}) => ({ ...draft(repId), id: `${repId}-old`, repId, completedAt: old, confidence: 'confident', difficulty: 'none', ...extra })

test('new learners start with foundations and returning learners with guided practice', () => {
  assert.equal(getPracticePlan({}, [], 'new', '', now).next.repId, 'declare-variables')
  assert.equal(getPracticePlan({}, [], 'returning', '', now).next.repId, 'sum-positive-numbers')
})

test('unfinished work takes precedence over new content, with the selected draft first', () => {
  const drafts = { 'create-objects': draft('create-objects', { plan: 'Use an object' }), 'count-words': draft('count-words', { hintCount: 1 }) }
  const plan = getPracticePlan(drafts, [], 'new', 'count-words', now)
  assert.equal(plan.next.repId, 'count-words')
  assert.equal(plan.next.mode, 'resume')
  assert.equal(plan.unfinished.length, 2)
  assert.equal(attemptStatus('create-objects', draft('create-objects')), 'Not started')
})

test('all due recalls remain visible, and a saved recall is resumed', () => {
  const history = [record('sum-positive-numbers'), record('count-even-numbers', { completedAt: '2026-09-21T12:00:00Z' }), record('has-duplicate'), record('most-frequent-number', { completedAt: '2026-09-21T12:00:00Z' })]
  const plan = getPracticePlan({ 'count-above-threshold': draft('count-above-threshold', { plan: 'Compare the limit' }) }, history, 'returning', '', now)
  assert.equal(plan.due.length, 2)
  assert.equal(plan.next.repId, 'count-above-threshold')
  assert.equal(plan.next.mode, 'resume')
  assert.match(plan.next.reason, /saved recall/)
})

test('a single difficult review is shown even with confident self-report', () => {
  const history = [record('backend-validate-user', { difficulty: 'edge-cases' })]
  const plan = getPracticePlan({}, history, 'returning', '', now)
  assert.equal(plan.due.length, 1)
  assert.equal(plan.next.repId, 'backend-validate-user')
  assert.match(plan.next.reason, /edge cases/)
})

test('latest evidence wins even if history is not sorted', () => {
  const history = [record('backend-validate-user', { hintCount: 2 }), record('backend-validate-user', { id: 'new', completedAt: '2026-09-29T12:00:00Z' })]
  assert.equal(getPracticePlan({}, history, 'returning', '', now).due.length, 0)
})

test('an unfinished retry is resumed instead of being reset or duplicated as a due review', () => {
  const history = [record('backend-validate-user', { confidence: 'need-practice' })]
  const drafts = { 'backend-validate-user': draft('backend-validate-user', { code: 'work in progress' }) }
  const before = structuredClone(drafts)
  const plan = getPracticePlan(drafts, history, 'returning', '', now)
  assert.equal(plan.due.length, 0)
  assert.equal(plan.next.mode, 'resume')
  assert.deepEqual(drafts, before)
})

test('a hinted independent completion recommends a fresh retry', () => {
  const history = [record('sum-positive-numbers'), record('count-even-numbers', { hintCount: 1, completedAt: '2026-09-21T12:00:00Z' })]
  const drafts = { 'count-even-numbers': draft('count-even-numbers', { completedAt: old, hintCount: 1 }) }
  const plan = getPracticePlan(drafts, history, 'returning', '', now)
  assert.equal(plan.next.mode, 'retry')
  assert.match(plan.next.reason, /without hints/)
})

test('recent difficult attempts wait three days and unknown or invalid records are ignored', () => {
  const history = [record('backend-validate-user', { confidence: 'need-practice', completedAt: '2026-09-29T12:00:00Z' }), { ...record('backend-validate-user'), repId: 'removed-rep' }, record('interview-backend', { completedAt: 'invalid' })]
  assert.equal(getPracticePlan({}, history, 'new', '', now).due.length, 0)
})

test('a finished catalog without due work has no arbitrary recommendation', () => {
  const drafts = Object.fromEntries(reps.map(rep => [rep.id, draft(rep.id, { completedAt: old })]))
  const history = reps.map(rep => record(rep.id))
  // Complete independent and recall evidence in order, beyond the review delay.
  for (const item of history) if (journeys.some(journey => journey.independent === item.repId)) item.completedAt = '2026-09-21T12:00:00Z'
  for (const item of history) if (journeys.some(journey => journey.recall === item.repId)) item.completedAt = '2026-09-25T12:00:00Z'
  assert.equal(getPracticePlan(drafts, history, 'new', '', now).next, null)
})

test('a selected backend goal changes new practice without hiding saved work', () => {
  const plan = getPracticePlan({}, [], 'returning', 'sum-positive-numbers', Date.now(), 'backend')
  assert.equal(plan.next.repId, 'basic-types')
  assert.match(plan.next.reason, /goal/)
  const saved = { 'sum-positive-numbers': { plan: 'Resume my plan', code: '', explanation: '', hintCount: 0 } }
  assert.equal(getPracticePlan(saved, [], 'returning', 'sum-positive-numbers', Date.now(), 'backend').next.mode, 'resume')
})
