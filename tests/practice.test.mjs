import { paths } from '../src/path.ts'
import { journeys } from '../src/learning.ts'
import assert from 'node:assert/strict'
import test from 'node:test'
import { getPracticePlan, attemptStatus, nextRepInPath, practiceWritingPrompts } from '../src/practice.ts'
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
  const history = [record('backend-page-results', { difficulty: 'edge-cases' })]
  const plan = getPracticePlan({}, history, 'returning', '', now)
  assert.equal(plan.due.length, 1)
  assert.equal(plan.next.repId, 'backend-page-results')
  assert.match(plan.next.reason, /edge cases/)
})

test('latest evidence wins even if history is not sorted', () => {
  const history = [record('backend-page-results', { hintCount: 2 }), record('backend-page-results', { id: 'new', completedAt: '2026-09-29T12:00:00Z' })]
  assert.equal(getPracticePlan({}, history, 'returning', '', now).due.length, 0)
})

test('guided validation follows journey evidence instead of a duplicate generic review', () => {
  const plan = getPracticePlan({}, [record('backend-validate-user', { difficulty: 'edge-cases' })], 'returning', '', now)
  assert.equal(plan.due.length, 0)
  const validation = plan.progress.find(state => state.journey.id === 'validation')
  assert.equal(validation.stage, 'practising')
  assert.equal(validation.nextRepId, 'validate-stock-adjustment')
})

test('an unfinished retry is resumed instead of being reset or duplicated as a due review', () => {
  const history = [record('backend-page-results', { confidence: 'need-practice' })]
  const drafts = { 'backend-page-results': draft('backend-page-results', { code: 'work in progress' }) }
  const before = structuredClone(drafts)
  const plan = getPracticePlan(drafts, history, 'returning', '', now, 'backend')
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
  const history = [record('backend-page-results', { confidence: 'need-practice', completedAt: '2026-09-29T12:00:00Z' }), { ...record('backend-page-results'), repId: 'removed-rep' }, record('interview-backend', { completedAt: 'invalid' })]
  assert.equal(getPracticePlan({}, history, 'new', '', now).due.length, 0)
})

test('a finished catalog without due work has no arbitrary recommendation', () => {
  const drafts = Object.fromEntries(reps.map(rep => [rep.id, draft(rep.id, { completedAt: old })]))
  const history = reps.map(rep => record(rep.id))
  // Complete independent and recall evidence in order, beyond the review delay.
  for (const item of history) if (journeys.some(journey => journey.independent === item.repId)) item.completedAt = '2026-09-21T12:00:00Z'
  for (const item of history) if (journeys.some(journey => journey.recall === item.repId)) item.completedAt = '2026-09-25T12:00:00Z'
  const plan = getPracticePlan(drafts, history, 'new', '', now)
  assert.equal(plan.next, null)
  assert.equal(plan.recommended, null)
})

test('a selected backend goal changes new practice without hiding saved work', () => {
  const plan = getPracticePlan({}, [], 'returning', 'sum-positive-numbers', Date.now(), 'backend')
  assert.equal(plan.next.repId, 'backend-validate-user')
  assert.match(plan.next.reason, /goal/)
  const saved = { 'sum-positive-numbers': { plan: 'Resume my plan', code: '', explanation: '', hintCount: 0 } }
  const withOtherDraft = getPracticePlan(saved, [], 'returning', 'sum-positive-numbers', Date.now(), 'backend')
  assert.equal(withOtherDraft.next.repId, 'backend-validate-user')
  assert.equal(withOtherDraft.unfinished[0].mode, 'resume')
})


test('selected practical path cannot recommend recall before its independent evidence and delay', () => {
  const journey = journeys.find(journey => journey.id === 'request-ownership')
  const preceding = paths.find(path => path.id === 'frontend').stages.flatMap(stage => stage.repIds).filter(id => !['preview-slot-results', 'refresh-report-state'].includes(id))
  const drafts = Object.fromEntries(preceding.map(id => [id, draft(id, {completedAt: old})]))
  const history = [record(journey.guided), record(journey.independent, {completedAt: '2026-09-29T12:00:00Z'})]
  const plan = getPracticePlan(drafts, history, 'returning', '', now, 'frontend')
  assert.equal(plan.next.repId, 'refresh-report-state')
  assert.notEqual(plan.next.repId, journey.recall)
})

test('goal-path drafts outrank other drafts, while due recall still leads', () => {
  const drafts = { 'sum-positive-numbers': draft('sum-positive-numbers', { plan: 'Other path' }), 'backend-page-results': draft('backend-page-results', { plan: 'Goal' }) }
  assert.equal(getPracticePlan(drafts, [], 'returning', 'sum-positive-numbers', now, 'backend').next.repId, 'backend-page-results')
  const history = [record('sum-positive-numbers'), record('count-even-numbers')]
  assert.equal(getPracticePlan(drafts, history, 'returning', '', now, 'backend').next.repId, 'count-above-threshold')
  const outsideOnly = { 'sum-positive-numbers': drafts['sum-positive-numbers'] }
  const plan = getPracticePlan(outsideOnly, [], 'returning', '', now, 'backend')
  assert.equal(plan.next.repId, 'backend-validate-user')
  assert.equal(plan.unfinished[0].repId, 'sum-positive-numbers')
})

test('daily new-rep choice stays available alongside saved drafts and due recall', () => {
  const drafts = { 'backend-page-results': draft('backend-page-results', { plan: 'Saved work' }) }
  const history = [record('sum-positive-numbers'), record('count-even-numbers')]
  const before = structuredClone(drafts)
  const plan = getPracticePlan(drafts, history, 'returning', '', now, 'backend')
  assert.equal(plan.next.repId, 'count-above-threshold')
  assert.equal(plan.recommended.repId, 'backend-validate-user')
  assert.match(plan.recommended.reason, /Validate data at a boundary/)
  assert.equal(plan.unfinished[0].repId, 'backend-page-results')
  assert.deepEqual(drafts, before)
})

test('daily recommendation advances past a saved goal draft without hiding it', () => {
  const drafts = { 'declare-variables': draft('declare-variables', { plan: 'Keep this draft' }) }
  const plan = getPracticePlan(drafts, [], 'new', '', now)
  assert.equal(plan.next.repId, 'declare-variables')
  assert.notEqual(plan.recommended.repId, 'declare-variables')
  assert.equal(plan.recommended.mode, 'start')
  assert.equal(plan.unfinished[0].repId, 'declare-variables')
})

test('nextRepInPath follows path order and skips completed reps', () => {
  const none = () => false
  assert.equal(nextRepInPath('typescript', 'basic-types', none), 'create-objects')
  assert.equal(nextRepInPath('typescript', 'basic-types', id => id === 'create-objects'), 'make-arrays')
  assert.equal(nextRepInPath('typescript', 'write-functions', none), 'pass-or-retry')
  assert.equal(nextRepInPath('typescript', 'event-loop-order', none), undefined)
  assert.equal(nextRepInPath('typescript', 'not-in-this-path', none), undefined)
})


test('writing guidance scales from existing metadata without changing authored prompts', () => {
  for (const [id, scale, rows] of [['declare-variables', 'sentence', 2], ['sum-positive-numbers', 'focused', 3], ['most-frequent-number', 'reasoned', 5], ['project-team-directory', 'reasoned', 5], ['dom-disclosure', 'reasoned', 5]]) {
    const rep = reps.find(item => item.id === id)
    const before = structuredClone(rep)
    const prompts = practiceWritingPrompts(rep)
    assert.equal(prompts.scale, scale)
    assert.equal(prompts.rows, rows)
    assert.equal(prompts.plan, rep.planPrompt)
    assert.deepEqual(rep, before)
  }
  assert.match(practiceWritingPrompts(reps.find(rep => rep.id === 'declare-variables')).explanation, /one useful sentence/)
  assert.equal(practiceWritingPrompts({ id: 'future-rep', planPrompt: 'Make a plan' }).scale, 'reasoned')
  assert.equal(practiceWritingPrompts({ id: 'declare-variables', format: 'frontend', planPrompt: 'Make a plan' }).scale, 'focused')
})
