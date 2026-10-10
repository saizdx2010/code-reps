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
