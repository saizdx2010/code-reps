import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyFluency, parseFluency, recurringReviews, skillEvidence, weeklyPlan, relatedHelp } from '../src/fluency.ts'
import { validateKnowledge } from '../src/knowledge-validation.ts'
import { reps } from '../src/rep.ts'
import { parseBackup } from '../src/portability.ts'
const day = (n) => new Date(Date.UTC(2026,0,n)).toISOString()
const record = (repId,n,hintCount=0,extra={}) => ({id:`${repId}-${n}`,repId,completedAt:day(n),hintCount,plan:'plan',code:'code',explanation:'explanation',...extra})
const retained = [record('sum-positive-numbers',1),record('count-even-numbers',2),record('count-above-threshold',5)]
test('knowledge references, prerequisite graph, questions, projects and recall variants are valid',()=>{
  assert.deepEqual(validateKnowledge(new Set(reps.map(r=>r.id))),[])
})
test('recurring recalls rotate only after the scheduled independent evidence and expand intervals',()=>{
  assert.equal(recurringReviews(retained,Date.parse(day(11)))[0].due,false)
  assert.equal(recurringReviews(retained,Date.parse(day(12)))[0].due,true)
  const early=recurringReviews([...retained,record('sum-matching-prices',8)],Date.parse(day(12)))[0]
  assert.equal(early.successes,0)
  const first=recurringReviews([...retained,record('sum-matching-prices',12)],Date.parse(day(25)))[0]
  assert.equal(first.repId,'count-open-tickets'); assert.equal(first.interval,14);assert.equal(first.due,false)
  const second=recurringReviews([...retained,record('sum-matching-prices',12),record('count-open-tickets',26)],Date.parse(day(26)))[0]
  assert.equal(second.successes,2);assert.equal(second.interval,28)
})
test('hinted or difficult scheduled reviews shorten the interval without claiming independence',()=>{
  const hinted=recurringReviews([...retained,record('sum-matching-prices',12,1)],Date.parse(day(15)))[0]
  assert.equal(hinted.successes,0);assert.equal(hinted.interval,3);assert.equal(hinted.repId,'sum-matching-prices');assert.equal(hinted.due,true)
  const difficult=recurringReviews([...retained,record('sum-matching-prices',12,0,{difficulty:'edge-cases',confidence:'confident'})],Date.parse(day(15)))[0]
  assert.equal(difficult.successes,0);assert.equal(difficult.interval,3)
})
test('learning state validates actual authored answers and preserves valid notes and judgments in backup',()=>{
  const state=emptyFluency();state.answers['values:return']={choice:1,correct:true,answeredAt:day(1)}
  state.notes=[{id:'n',title:'Return',body:'Return sends a value to the caller.',skillId:'values',repId:'write-functions',kind:'note',updatedAt:day(1)}]
  assert.deepEqual(parseFluency(state),state)
  const backup=parseBackup(JSON.stringify({format:'code-reps-backup',version:1,learnerStart:null,history:[],drafts:{},learning:state}),new Set(reps.map(r=>r.id)))
  assert.deepEqual(backup.learning,state)
  assert.throws(()=>parseFluency({...state,answers:{'values:return':{choice:0,correct:true,answeredAt:day(1)}}}),/answer/i)
  assert.throws(()=>parseFluency({...state,goal:{...state.goal,days:[1,1]}}))
  assert.throws(()=>parseFluency({...state,notes:[...state.notes,...state.notes]}),/Duplicate/)
})
test('skill evidence separates authored predictions, code checks and self-assessment',()=>{
  const state=emptyFluency();state.answers['arrays:scan']={choice:1,correct:true,answeredAt:day(1)}
  const evidence=skillEvidence('arrays',[...retained,record('count-open-tickets',12,1)],state)
  assert.equal(evidence.lessonCorrect,1);assert.equal(evidence.attempts.length,4);assert.equal(evidence.independent.length,3);assert.ok(evidence.retained);assert.equal(evidence.selfReview,undefined)
})
test('weekly planning respects local weekdays, budgets and unique practice tasks',()=>{
  const goal={pathId:'typescript',minutes:20,days:[1,3]}
  const sessions=weeklyPlan(goal,[{repId:'a',reason:'due'},{repId:'a',reason:'again'},{repId:'b',reason:'new'}],new Date(2026,0,5,10))
  assert.equal(sessions.length,2);assert.deepEqual(sessions.map(s=>s.date.getDay()),[1,3]);assert.deepEqual(sessions.map(s=>s.action.repId),['a','b']);assert.equal(sessions[0].minutes,20)
  assert.deepEqual(weeklyPlan({...goal,days:[]},[],new Date()),[])
})
test('failure references connect boundary checks to authored knowledge',()=>{
  assert.equal(relatedHelp('backend-ticket-handler',['Rejects invalid query'])[0].id,'validation')
  assert.equal(relatedHelp('count-words',['Handles whitespace'])[0].id,'text')
})

test('retired lesson answers remain readable without completing replacement questions', () => {
  const state = emptyFluency()
  for (const id of ['frontend:derive', 'event-loop:prediction-2']) {
    state.answers[id] = { choice: 0, correct: true, answeredAt: day(1) }
  }
  assert.deepEqual(parseFluency(state), state)
  for (const id of ['frontend', 'event-loop']) {
    assert.equal(skillEvidence(id, [], state).lessonCorrect, 0)
  }
  assert.throws(() => parseFluency({ ...state, answers: {
    'event-loop:prediction-2': { choice: 1, correct: true, answeredAt: day(1) },
  } }), /answer/i)
  assert.throws(() => parseFluency({ ...state, answers: {
    'frontend:unknown': { choice: 0, correct: true, answeredAt: day(1) },
  } }), /answer/i)
})

test('retired adjacent-ID recall stays playable but cannot advance scheduled stack evidence', () => {
  assert.ok(reps.some(rep => rep.id === 'cancel-adjacent-ids'))
  const base = [record('valid-parentheses', 1), record('balanced-brackets', 2), record('simplify-file-path', 5), record('remaining-actions', 12)]
  const review = recurringReviews([...base, record('cancel-adjacent-ids', 26)], Date.parse(day(26))).find(item => item.skillId === 'stacks')
  assert.equal(review.repId, 'simplify-file-path')
  assert.equal(review.successes, 1)
  assert.equal(review.due, true)
  const next = recurringReviews([...base, record('simplify-file-path', 26)], Date.parse(day(26))).find(item => item.skillId === 'stacks')
  assert.equal(next.successes, 2)
  assert.equal(next.repId, 'remove-adjacent-pairs')
})

test('new DSA journeys schedule recurring recall without accepting early or hinted success', () => {
  const chains = [
    ['windows', 'algo-window-sum', 'count-unique-windows', 'shortest-run-reaching-target'],
    ['queues', 'ds-queue-operations', 'ticket-service-times', 'parcel-loading-turns'],
    ['two-pointers', 'algo-sorted-pair', 'sorted-offset-squares', 'reading-run-summary'],
    ['sorting', 'algo-insertion-sort', 'sort-score-records', 'kth-smallest-copy'],
    ['binary-search', 'algo-binary-search', 'first-insertion-point', 'smallest-daily-capacity'],
    ['recursion', 'algo-recursive-sum', 'flatten-nested-numbers', 'count-object-leaves'],
    ['trees', 'algo-tree-depth', 'tree-depth-sum', 'tree-value-path'],
    ['graphs', 'algo-graph-reachable', 'graph-shortest-hops', 'graph-connected-groups'],
  ]
  for (const [skill, guided, independent, recall] of chains) {
    const base = [record(guided, 1), record(independent, 2), record(recall, 5)]
    const review = history => recurringReviews(history, Date.parse(day(12))).find(item => item.skillId === skill)
    assert.equal(review(base).repId, recall)
    assert.equal(review([...base, record(recall, 11)]).successes, 0)
    assert.equal(review([...base, record(recall, 12, 1)]).successes, 0)
    assert.equal(review([...base, record(recall, 12)]).repId, independent)
    assert.equal(review([...base, record(recall, 12)]).interval, 14)
  }
})
