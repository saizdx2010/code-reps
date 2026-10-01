import test from 'node:test'
import assert from 'node:assert/strict'
import { practicalSkills, practicalReps } from '../src/practical-concepts.ts'
import { skills } from '../src/knowledge.ts'
import { paths } from '../src/path.ts'
import { runRep } from '../src/runner.ts'
import { emptyFluency, parseFluency, recurringReviews } from '../src/fluency.ts'
import { getJourney, journeys } from '../src/learning.ts'

// Check the learner-facing path and saved evidence contracts, not only record presence.
test('practical path includes every new rep and retains the beginner default', () => {
  const path = paths.find(path => path.id === 'practical-concepts')
  assert.equal(skills[0].id, 'values')
  assert.deepEqual(path.stages.flatMap(stage => stage.repIds).sort(), practicalReps.map(rep => rep.id).sort())
  for (const skill of practicalSkills) {
    assert.equal(skill.questions.length, 2)
    assert.ok(skill.repIds.length)
    for (const id of skill.repIds) assert.ok(practicalReps.some(rep => rep.id === id))
  }
  assert.ok(skills.find(skill => skill.id === 'async').repIds.includes('promise-outcomes'))
})

test('new goal, lesson answers, bookmarks, and self-review survive learning-state validation', () => {
  const state = emptyFluency()
  state.goal.pathId = 'practical-concepts'
  const skill = practicalSkills.find(skill => skill.id === 'websockets')
  const question = skill.questions[0]
  const now = '2026-10-01T00:00:00Z'
  state.answers[`${skill.id}:${question.id}`] = {choice: question.answer, correct: true, answeredAt: now}
  state.bookmarks = [skill.id]
  state.reviews[skill.id] = {understanding: 'independent', approach: 'with-help', implementation: 'not-yet', explanation: 'with-help', evidence: 'I traced OPEN and CLOSED sends.', updatedAt: now}
  assert.deepEqual(parseFluency(JSON.parse(JSON.stringify(state))), state)
})

const misconceptions = {
  'leading-throttle': 'function throttleTimes(times, window) { let last = -Infinity; return times.filter(t => { const accept = t-last >= window; last = t; return accept }) }',
  'cache-freshness': 'function freshValue(entries,key,now) { const e=entries.find(e=>e.key===key); return e && now<=e.expiresAt ? e.value : null }',
  'websocket-gate': 'function socketMessages(events) { return events.filter(e=>e.kind==="send").map(e=>e.text) }',
  'latest-request': 'function visibleResponse(events) { let value=null; for(const e of events) { if(e.kind==="start" || e.kind==="cancel")value=null;else value=e.value } return value }',
  'shared-resource': 'function resourceActions(events) { return events.map(e=>e.kind==="acquire"?"open":"close") }',
  'idempotent-ledger': 'function ledger(requests) { return {total:requests.reduce((sum,r)=>sum+r.amount,0),conflicts:[]} }',
  'optimistic-balance': 'function optimisticBalance(initial,events) { let value=initial; for(const e of events){if(e.kind==="begin")value+=e.delta;else if(e.kind==="fail")value=initial} return {confirmed:value,displayed:value} }',
}
for (const [id, code] of Object.entries(misconceptions)) {
  test(`checks expose a plausible misconception: ${id}`, () => {
    assert.ok(runRep(code, id).some(result => !result.passed))
  })
}

test('ownership recall requires a gap and starts recurring review after retained evidence', () => {
  const journey = journeys.find(journey => journey.id === 'resource-ownership')
  const at = day => Date.parse(`2026-10-${String(day).padStart(2,'0')}T00:00:00Z`)
  const record = (repId, day, hintCount=0) => ({repId, completedAt: new Date(at(day)).toISOString(), hintCount})
  const history = [record(journey.guided,1), record(journey.independent,2)]
  assert.equal(getJourney(journey,[...history,record(journey.recall,3)],at(5)).stage,'independent')
  assert.equal(getJourney(journey,[...history,record(journey.recall,5,1)],at(5)).stage,'independent')
  const retained = [...history,record(journey.recall,5)]
  assert.equal(getJourney(journey,retained,at(5)).stage,'retained')
  const review = recurringReviews(retained,at(12)).find(review => review.skillId === journey.id)
  assert.equal(review.due,true)
  assert.equal(review.repId,'subscription-cleanup')
})
