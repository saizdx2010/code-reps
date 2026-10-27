import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptyFluency, mergeFluency, parseFluency } from '../src/fluency.ts'
import { dueQuestions, revisitDays } from '../src/question-revisit.ts'

// Local dates, so calendar days match what the learner sees.
const at = (day, hour = 9) => new Date(2026, 10, day, hour).toISOString()
const now = (day, hour = 9) => new Date(2026, 10, day, hour).getTime()
const missed = (day, extra = {}) => ({ choice: 0, correct: false, answeredAt: at(day), ...extra })

test('a missed first prediction comes back after a few calendar days, the earliest miss first', () => {
  assert.equal(revisitDays, 3)
  const answers = {
    'control-flow:branch': missed(2),
    'values:return': missed(1, { choice: 2 }),
    'values:const': { choice: 1, correct: true, answeredAt: at(1) },
  }
  assert.deepEqual(dueQuestions(answers, now(3)), [])
  // Calendar days, not hours: a miss late in the evening is due on the third morning after.
  const evening = { 'values:return': missed(1, { answeredAt: at(1, 22) }) }
  assert.deepEqual(dueQuestions(evening, now(4, 7)), [{ skillId: 'values', questionId: 'return', missedAt: at(1, 22) }])
  assert.deepEqual(
    dueQuestions(answers, now(5)).map(q => `${q.skillId}:${q.questionId}`),
    ['values:return', 'control-flow:branch'],
  )
})

test('a right answer on the revisit ends it; a wrong one brings it back after the same gap', () => {
  assert.deepEqual(dueQuestions({ 'values:return': missed(1, { revisit: { correct: true, at: at(4) } }) }, now(20)), [])
  const again = { 'values:return': missed(1, { revisit: { correct: false, at: at(4) } }) }
  assert.deepEqual(dueQuestions(again, now(6)), [])
  assert.equal(dueQuestions(again, now(7)).length, 1)
})

test('retired and unknown questions never come back', () => {
  assert.deepEqual(dueQuestions({ 'frontend:derive': missed(1), 'values:gone': missed(1) }, now(20)), [])
})

test('learning data keeps a valid revisit, rejects a malformed one, and merges it with other tabs', () => {
  const state = { ...emptyFluency(), answers: { 'values:return': missed(1, { revisit: { correct: false, at: at(4) } }) } }
  assert.deepEqual(parseFluency(structuredClone(state)).answers['values:return'].revisit, { correct: false, at: at(4) })
  for (const revisit of [null, 'yes', { correct: 'no', at: at(4) }, { correct: true }, { correct: true, at: 'soon' }])
    assert.throws(() => parseFluency({ ...state, answers: { 'values:return': missed(1, { revisit }) } }), /Invalid lesson answer/)
  // The revisit is saved on the answer itself, so a note saved in another tab keeps it.
  const base = { ...emptyFluency(), answers: { 'values:return': missed(1) } }
  const mine = { ...base, answers: { 'values:return': missed(1, { revisit: { correct: true, at: at(4) } }) } }
  const theirs = { ...base, bookmarks: ['values'] }
  const merged = mergeFluency(base, mine, theirs)
  assert.deepEqual(merged.answers['values:return'].revisit, { correct: true, at: at(4) })
  assert.deepEqual(merged.bookmarks, ['values'])
  // The first prediction is still the evidence.
  assert.equal(merged.answers['values:return'].correct, false)
})
