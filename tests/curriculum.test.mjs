import test from 'node:test'
import assert from 'node:assert/strict'
import { repPracticeContext, pathApplications, repCurriculumRole, repCurriculumEvidence } from '../src/curriculum.ts'
import { getAllJourneys } from '../src/learning.ts'
import { paths } from '../src/path.ts'
import { capstones } from '../src/fluency.ts'

test('authored path applications link to existing project milestones', () => {
  for (const [pathId, applications] of Object.entries(pathApplications)) {
    assert.ok(paths.some(path => path.id === pathId))
    for (const application of applications) {
      assert.ok(application.reason.trim())
      assert.ok(capstones.some(project => project.milestones.some(milestone => milestone.repId === application.repId)))
    }
  }
})

test('curriculum roles and recall availability preserve evidence distinctions', () => {
  assert.equal(repCurriculumRole('sum-positive-numbers'), 'Guided')
  assert.equal(repCurriculumRole('count-even-numbers'), 'Independent')
  assert.equal(repCurriculumRole('count-above-threshold'), 'Recall')
  assert.equal(repCurriculumRole('frontend-directory'), 'Application')
  const now = Date.parse('2026-10-06T12:00:00Z')
  assert.match(repCurriculumEvidence('count-above-threshold', getAllJourneys([], now)), /independent practice/)
  const history = [
    { repId: 'sum-positive-numbers', completedAt: '2026-10-05T10:00:00Z', hintCount: 0 },
    { repId: 'count-even-numbers', completedAt: '2026-10-05T12:00:00Z', hintCount: 0 },
    { repId: 'count-above-threshold', completedAt: '2026-10-06T10:00:00Z', hintCount: 0 },
  ]
  const progress = getAllJourneys(history, now)
  assert.match(repCurriculumEvidence('count-above-threshold', progress), /Recall available/)
  assert.equal(progress[0].stage, 'independent')
})

test('daily recommendation context names the skill and a concrete journey successor', () => {
  assert.match(repPracticeContext('sum-positive-numbers').reason, /Skill: Work through arrays\./)
  assert.match(repPracticeContext('sum-positive-numbers').afterward, /Count even numbers/)
  assert.match(repPracticeContext('count-even-numbers').afterward, /without hints.*3 days/)
  assert.match(repPracticeContext('backend-validate-user').reason, /Skill: Validate data at a boundary\./)
  assert.match(repPracticeContext('declare-variables').reason, /Skill: Values, types, and functions\./)
  assert.match(repPracticeContext('count-above-threshold').afterward, /skill evidence/)
})

test('completion evidence says what an attempt counts as, in journey terms, from saved history only', async () => {
  const { completionEvidence } = await import('../src/curriculum.ts')
  const { getAllJourneys, journeys } = await import('../src/learning.ts')
  const journey = journeys[0]
  const at = day => new Date(Date.UTC(2026, 9, day)).toISOString()
  const progress = records => getAllJourneys(records, Date.parse(at(10)))
  const done = (repId, day, hintCount = 0) => ({ repId, completedAt: at(day), hintCount })
  // A guided rep points to the independent one, whatever the hint count.
  assert.match(completionEvidence(journey.guided, 2, progress([done(journey.guided, 1, 2)])), /^Guided practice done/)
  // Hints make an independent attempt practice.
  const hinted = completionEvidence(journey.independent, 1, progress([done(journey.guided, 1), done(journey.independent, 2, 1)]))
  assert.match(hinted, /practice, not independent evidence/)
  // Hint-free after the guided rep is independent and names when recall opens.
  const independent = completionEvidence(journey.independent, 0, progress([done(journey.guided, 1), done(journey.independent, 2)]))
  assert.match(independent, /independent\. Recall opens /)
  // Hint-free without the guided rep does not claim independence.
  assert.match(completionEvidence(journey.independent, 0, progress([done(journey.independent, 2)])), /To count as independent, finish /)
  // Recall only claims retention when the records show it.
  const early = completionEvidence(
    journey.recall,
    0,
    progress([done(journey.guided, 1), done(journey.independent, 2), done(journey.recall, 3)]),
  )
  assert.doesNotMatch(early, /retained/)
  const later = progress([done(journey.guided, 1), done(journey.independent, 2), done(journey.recall, 2 + journey.delayDays + 1)])
  assert.match(completionEvidence(journey.recall, 0, later), /retained/)
  // Reps outside a journey add nothing beyond the attempt's own facts.
  assert.equal(completionEvidence('declare-variables', 0, progress([])), undefined)
})
