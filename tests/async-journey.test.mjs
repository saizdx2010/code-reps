import test from 'node:test'
import assert from 'node:assert/strict'
import { runRep } from '../src/runner.ts'
import { asyncSolutions } from './fixtures/async-solutions.mjs'
import { getJourney, journeys } from '../src/learning.ts'
import { emptyFluency, recurringReviews, skillEvidence } from '../src/fluency.ts'
import { skills } from '../src/knowledge.ts'

const journey = journeys.find(item => item.id === 'request-ownership')
const at = day => Date.parse(`2026-10-${String(day).padStart(2, '0')}T00:00:00Z`)
const record = (repId, day, hintCount = 0) => ({repId, completedAt: new Date(at(day)).toISOString(), hintCount, confidence: 'confident', difficulty: 'none'})

test('async journey rejects hinted independence and early or hinted recall', () => {
  const guided = record(journey.guided, 1)
  assert.equal(getJourney(journey, [guided, record(journey.independent, 2, 1)], at(7)).stage, 'practising')
  const history = [guided, record(journey.independent, 2)]
  assert.equal(getJourney(journey, [...history, record(journey.recall, 4)], at(7)).stage, 'independent')
  assert.equal(getJourney(journey, [...history, record(journey.recall, 5, 1)], at(7)).stage, 'independent')
  const retained = [...history, record(journey.recall, 5)]
  assert.equal(getJourney(journey, retained, at(5)).stage, 'retained')
  assert.ok(skillEvidence(journey.id, retained, emptyFluency()).retained)
  const review = recurringReviews(retained, at(12)).find(item => item.skillId === journey.id)
  assert.equal(review.repId, 'refresh-report-state')
  assert.equal(review.due, true)
  const later = [...retained, record(review.repId, 12)]
  const next = recurringReviews(later, at(26)).find(item => item.skillId === journey.id)
  assert.equal(next.repId, journey.recall)
  assert.equal(next.successes, 1)
})

test('request lesson links every journey stage and refresh application without changing checked questions', () => {
  const skill = skills.find(item => item.id === journey.id)
  for (const id of [journey.guided, journey.independent, journey.recall, 'refresh-report-state']) assert.ok(skill.repIds.includes(id))
  assert.deepEqual(skill.questions.map(q => [q.id, q.answer]), [['prediction-1', 1], ['prediction-2', 1]])
})

const misconceptions = {
  'search-request-state': `function searchState(events) {
    let result = {status: 'idle', items: [], error: null}
    for (const e of events) {
      if(e.kind === 'start') result = {status: 'loading', items: [], error: null}
      if(e.kind === 'resolve') result = {status: 'ready', items: e.items, error: null}
      if(e.kind === 'reject') result = {status: 'error', items: [], error: e.message}
    }
    return result
  }`,
  'preview-slot-results': `function previewSlots(events) {
    let current = null
    const slots = new Map()
    for(const e of events) {
      if(e.kind === 'select') {current = e.token; slots.set(e.slot, {slot:e.slot, status:'loading', url:null})}
      else if(e.kind === 'remove') slots.delete(e.slot)
      else if(e.token === current) slots.set(e.slot, {slot:e.slot, status:'ready', url:e.url})
    }
    return [...slots.values()]
  }`,
  'refresh-report-state': asyncSolutions['refresh-report-state'].replace(' : state.value,', ' : null,'),
}
for (const [id, code] of Object.entries(misconceptions)) {
  test(`checks reject a plausible ownership/display mistake: ${id}`, () => {
    assert.ok(runRep(code, id).some(result => !result.passed))
  })
}

test('settled search owners cannot accept a second terminal event', () => {
  const wrong = asyncSolutions['search-request-state'].replace('owner = null\n        if', 'if')
  assert.ok(runRep(wrong, 'search-request-state').some(result => !result.passed))
})

test('input mutation is reported even with correct final display', () => {
  const wrong = asyncSolutions['search-request-state'].replace('return display', 'events.reverse(); return display')
  assert.ok(runRep(wrong, 'search-request-state').some(result => result.message?.includes('changed its input')))
})
