import test from 'node:test'
import assert from 'node:assert/strict'
import { fadingSkills, mapWeeks, progressAt, skillThenAndNow } from '../src/skill-growth.ts'
import { monthLookBack } from '../src/month-look-back.ts'
import { getAllJourneys } from '../src/learning.ts'
import { buildTrail } from '../src/trail-map.ts'

const day = 86_400_000
// Friday 23 October 2026, noon local time.
const now = new Date(2026, 9, 23, 12).getTime()
const record = (repId, daysAgo, hintCount = 0, extra = {}) => ({
  id: `${repId}-${daysAgo}`,
  repId,
  completedAt: new Date(now - daysAgo * day).toISOString(),
  plan: `plan for ${repId}`,
  code: '',
  explanation: '',
  hintCount,
  ...extra,
})
// Arrays: guided with hints, independent without, recall without after the three-day delay.
const arrays = [record('sum-positive-numbers', 40, 2), record('count-even-numbers', 38), record('count-above-threshold', 33)]

test('a retained skill pairs its first guided attempt with the recall that held', () => {
  const progress = getAllJourneys(arrays, now).find(item => item.journey.id === 'arrays')
  const growth = skillThenAndNow(progress, arrays)
  assert.equal(growth.first.repId, 'sum-positive-numbers')
  assert.equal(growth.first.plan, 'plan for sum-positive-numbers')
  assert.equal(growth.latest.repId, 'count-above-threshold')
  assert.equal(growth.days, 7)
  const guidedOnly = getAllJourneys(arrays.slice(0, 1), now).find(item => item.journey.id === 'arrays')
  assert.equal(skillThenAndNow(guidedOnly, arrays.slice(0, 1)), null)
})

test('a retained skill fades once its spaced review is due, and a fresh review restores it', () => {
  const fading = fadingSkills(arrays, now)
  assert.equal(fading.get('arrays').repId, 'sum-matching-prices')
  assert.equal(fading.get('arrays').heldDays, 33)
  // Seven days after the recall the first review is due; before then nothing fades.
  assert.equal(fadingSkills(arrays, now - 30 * day).size, 0)
  const reviewed = [...arrays, record('sum-matching-prices', 1)]
  assert.equal(fadingSkills(reviewed, now).has('arrays'), false)
})

test('the map over time steps week by week from the first attempt, ending today', () => {
  const weeks = mapWeeks(arrays, new Date(now))
  assert.equal(weeks.at(-1), now)
  assert.ok(weeks.length >= 6 && weeks.length <= 7)
  for (const end of weeks.slice(0, -1)) assert.equal(new Date(end).getDay(), 0)
  assert.deepEqual(mapWeeks([], new Date(now)), [])
  // Each week shows only the evidence recorded by then.
  const early = progressAt(arrays, now - 39 * day).find(item => item.journey.id === 'arrays')
  assert.ok(early.guided && !early.independent && !early.retained)
})

test('the month looks back at skills moved, badges earned, fewer mistakes, and reps now done cleanly', () => {
  const history = [
    record('declare-variables', 50, 2, { mistakes: ['off-by-one', 'off-by-one'] }),
    record('basic-types', 45, 1, { mistakes: ['off-by-one'] }),
    record('declare-variables', 10, 0),
    ...arrays.map(item => ({ ...item, completedAt: new Date(Date.parse(item.completedAt) + 25 * day).toISOString() })),
  ]
  const look = monthLookBack(history, now)
  assert.equal(look.attempts, 4)
  assert.equal(look.previousAttempts, 2)
  assert.deepEqual(look.skills, [{ title: 'Work through arrays', to: 'Retained' }])
  assert.ok(look.badges.length > 0)
  assert.deepEqual(look.fewerMistakes, [{ label: 'Off-by-one', before: 2, now: 0 }])
  assert.deepEqual(look.nowClean, ['declare-variables'])
})

test('trail nodes carry first completion and recall opening times', () => {
  const trail = buildTrail('typescript', {
    completed: id => id === 'declare-variables',
    inProgress: () => false,
    recallReady: () => true,
    lessonChecked: () => false,
    completedAt: id => (id === 'declare-variables' ? 1234 : undefined),
  })
  const node = trail.stages.flatMap(stage => stage.nodes).find(item => item.kind === 'rep' && item.repId === 'declare-variables')
  assert.equal(node.completedAt, 1234)
})
