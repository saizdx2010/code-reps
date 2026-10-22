import assert from 'node:assert/strict'
import test from 'node:test'
import { retroFacts, retroNoteBody, retroQuestions, weeklyRetro } from '../src/retro.ts'

const day = 86_400_000
// A Wednesday at local noon, so day arithmetic never crosses midnight.
const now = new Date(2026, 9, 14, 12)
const at = (daysAgo, hour = 12) => new Date(2026, 9, 14 - daysAgo, hour).toISOString()
const rec = (id, repId, daysAgo, extra = {}) => ({
  id,
  repId,
  completedAt: at(daysAgo),
  plan: '',
  code: '',
  explanation: '',
  hintCount: 0,
  ...extra,
})

test('the weekly retro summarizes the last seven days against the week before', () => {
  const history = [
    rec('a', 'sum-positive-numbers', 1, { hintCount: 2, mistakes: ['off-by-one'], difficulty: 'edge-cases' }),
    rec('b', 'count-words', 2, { mistakes: ['off-by-one', 'missed-empty-case'], difficulty: 'edge-cases' }),
    rec('c', 'count-words', 2, { difficulty: 'none' }),
    rec('d', 'has-duplicate', 10),
    rec('e', 'has-duplicate', 30),
  ]
  const retro = weeklyRetro(history, now.getTime())
  assert.equal(retro.attempts, 3)
  assert.equal(retro.previousAttempts, 1)
  assert.deepEqual(retro.reps, ['sum-positive-numbers', 'count-words'])
  assert.equal(retro.practiceDays, 2)
  assert.equal(retro.unhinted, 2)
  assert.equal(retro.hints, 2)
  assert.deepEqual(retro.topMistake, { label: 'Off-by-one', count: 2 })
  assert.deepEqual(retro.topStuck, { label: 'Handling edge cases', count: 2 })
  assert.match(retroFacts(retro), /3 completed attempts on 2 days; 2 without hints; most tagged mistake: Off-by-one/)
})

test('an empty week has no top answers, and the note keeps only answered questions', () => {
  const retro = weeklyRetro([], now.getTime() + day)
  assert.equal(retro.attempts, 0)
  assert.equal(retro.topMistake, undefined)
  assert.equal(retro.topStuck, undefined)
  const body = retroNoteBody(retro, ['', '  Recursion base cases.  ', ''])
  assert.ok(body.startsWith('Week from '))
  assert.ok(body.endsWith(`${retroQuestions[1]}\nRecursion base cases.`))
  assert.ok(!body.includes(retroQuestions[0]))
})
