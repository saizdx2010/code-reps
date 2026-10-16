import test from 'node:test'
import assert from 'node:assert/strict'
import { breakDays, evidenceBadges, heldDays, stageSkills, steadyDays, steadyWeeks } from '../src/evidence-badges.ts'
import { profileBadges } from '../src/badges.ts'
import { journeys, getAllJourneys } from '../src/learning.ts'
import { buildSkillMap } from '../src/skill-map.ts'

// Local noon on day n after 5 January 2026, a Monday, so weeks line up with the calendar.
const at = n => new Date(2026, 0, 5 + n, 12)
let serial = 0
const rec = (repId, n, hintCount = 0) => ({ id: `r${++serial}`, repId, completedAt: at(n).toISOString(), hintCount })
const now = at(400)
const byId = (badges, id) => badges.find(badge => badge.id === id)
const earned = (history, id, when = now) => byId(evidenceBadges(history, when), id)
const arrays = journeys.find(journey => journey.id === 'arrays')

test('an empty profile earns no evidence badge, and every badge has a rule and a rep to open', () => {
  const badges = evidenceBadges([], now)
  assert.equal(badges.length, 8)
  assert.equal(new Set(badges.map(badge => badge.id)).size, 8)
  assert.ok(badges.every(badge => badge.kind === 'evidence' && !badge.earned && badge.rule && badge.repId))
  // Profile badges list completion badges first, then evidence badges, with no repeated IDs.
  const all = profileBadges([], now)
  assert.equal(new Set(all.map(badge => badge.id)).size, all.length)
  assert.equal(all.at(-1).kind, 'evidence')
})

test('first independent skill needs the guided rep first and a hint-free related rep', () => {
  assert.equal(earned([rec(arrays.independent, 1)], 'first-independent').earned, false)
  assert.equal(earned([rec(arrays.guided, 0, 2), rec(arrays.independent, 1, 1)], 'first-independent').earned, false)
  const independent = rec(arrays.independent, 1)
  const badge = earned([rec(arrays.guided, 0, 2), independent], 'first-independent')
  assert.equal(badge.earned, true)
  assert.equal(badge.earnedAt, independent.completedAt)
  assert.equal(badge.repId, arrays.independent)
  assert.match(badge.detail, /^Work through arrays: /)
})

test('first retained skill and held for a month are earned by hint-free recall, a month needs the full gap', () => {
  const base = [rec(arrays.guided, 0, 2), rec(arrays.independent, 1)]
  const soon = rec(arrays.recall, 1 + arrays.delayDays)
  assert.equal(earned([...base, soon], 'first-retained').earned, true)
  assert.equal(earned([...base, soon], 'held-month').earned, false)
  assert.equal(earned([...base, rec(arrays.recall, heldDays, 0)], 'held-month').earned, false)
  const month = rec(arrays.recall, 1 + heldDays)
  const held = earned([...base, soon, month], 'held-month')
  assert.equal(held.earned, true)
  assert.equal(held.earnedAt, month.completedAt)
  assert.match(held.detail, /recalled 30 days after/)
  // A hinted recall never counts.
  assert.equal(earned([...base, rec(arrays.recall, 1 + heldDays, 1)], 'held-month').earned, false)
})

test('five and ten skills kept count distinct retained skills and date the deciding one', () => {
  const history = journeys
    .slice(0, 10)
    .flatMap((journey, index) => [
      rec(journey.guided, index * 5, 1),
      rec(journey.independent, index * 5 + 1),
      rec(journey.recall, index * 5 + 1 + journey.delayDays),
    ])
  const fifth = history[5 * 3 - 1]
  const five = earned(history, 'five-kept')
  assert.equal(five.earned, true)
  assert.equal(five.earnedAt, fifth.completedAt)
  assert.equal(earned(history, 'ten-kept').earned, true)
  const nine = earned(history.slice(0, 27), 'ten-kept')
  assert.equal(nine.earned, false)
  assert.equal(nine.completed, 9)
})

test('four steady weeks needs enough practice days in consecutive Monday-to-Sunday weeks; reviews count', () => {
  const week = w => Array.from({ length: steadyDays }, (_, d) => rec('basic-types', w * 7 + d * 2))
  const steady = Array.from({ length: steadyWeeks }, (_, w) => week(w)).flat()
  const badge = earned(steady, 'steady-weeks')
  assert.equal(badge.earned, true)
  assert.equal(badge.earnedAt, steady.at(-1).completedAt)
  // A week with too few days breaks the run.
  const gap = [...week(0), ...week(1), rec('basic-types', 14), ...week(3), ...week(4), ...week(5)]
  assert.equal(earned(gap, 'steady-weeks').earned, false)
  assert.equal(earned([...gap, ...week(6)], 'steady-weeks').earned, true)
})

test('welcome back is the first practice day after a break of two weeks or more', () => {
  assert.equal(earned([rec('basic-types', 0), rec('basic-types', breakDays)], 'welcome-back').earned, false)
  const back = rec('make-arrays', breakDays + 1)
  const badge = earned([rec('basic-types', 0), back, rec('basic-types', breakDays + 2)], 'welcome-back')
  assert.equal(badge.earned, true)
  assert.equal(badge.earnedAt, back.completedAt)
  assert.equal(badge.repId, 'make-arrays')
  assert.match(badge.detail, /14 days away/)
})

test('stage, independently needs every skill of one track stage at Independent', () => {
  const stage = buildSkillMap('typescript', getAllJourneys([], now.getTime())).stages.find(item => item.nodes.length >= stageSkills)
  const stageJourneys = stage.nodes.map(node => journeys.find(journey => journey.id === node.id))
  const history = stageJourneys.flatMap((journey, index) => [rec(journey.guided, index * 3, 1), rec(journey.independent, index * 3 + 1)])
  const badge = earned(history, 'stage-independent')
  assert.equal(badge.earned, true)
  assert.equal(badge.earnedAt, history.at(-1).completedAt)
  assert.ok(badge.detail.startsWith(stage.title))
  assert.equal(earned(history.slice(0, -1), 'stage-independent').earned, false)
})

test('invalid and future dates never count', () => {
  const future = [rec(arrays.guided, 500, 2), rec(arrays.independent, 501)]
  assert.equal(earned(future, 'first-independent').earned, false)
  const invalid = [{ ...rec(arrays.guided, 0, 2), completedAt: 'bad' }, rec(arrays.independent, 1)]
  assert.equal(earned(invalid, 'first-independent').earned, false)
})

test('one hint-free rep never earns both first independent skill and stage, independently', () => {
  for (const journey of journeys) {
    const history = [rec(journey.guided, 0, 2), rec(journey.independent, 1)]
    const badges = evidenceBadges(history, now)
    assert.equal(byId(badges, 'first-independent').earned, true, journey.id)
    assert.equal(byId(badges, 'stage-independent').earned, false, journey.id)
  }
})

test('the steady-weeks dates name the Monday it started on in every timezone', t => {
  const original = process.env.TZ
  t.after(() => (original === undefined ? delete process.env.TZ : (process.env.TZ = original)))
  for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Kolkata', 'Pacific/Kiritimati']) {
    process.env.TZ = zone
    const week = w => Array.from({ length: steadyDays }, (_, d) => rec('basic-types', w * 7 + d))
    const badge = earned(Array.from({ length: steadyWeeks }, (_, w) => week(w)).flat(), 'steady-weeks', at(400))
    const monday = at(0).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    assert.ok(badge.detail.includes(`from ${monday} to`), `${zone}: ${badge.detail}`)
  }
})
