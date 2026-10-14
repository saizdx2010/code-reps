import assert from 'node:assert/strict'
import test from 'node:test'
import { recallVariants } from '../src/fluency.ts'
import { validateKnowledge } from '../src/knowledge-validation.ts'
import { getArrayJourney, getJourney, journeys } from '../src/learning.ts'
import { reps } from '../src/rep.ts'
import { paths } from '../src/path.ts'
import { coreLessons } from '../src/ai-era-reps.ts'
import { completion, utcDay } from './helpers/records.mjs'

const record = (repId, day, hintCount = 0) => completion(repId, utcDay(2026, 9, day), hintCount)
const at = day => Date.parse(utcDay(2026, 9, day))

test('guides a learner from first rep to delayed recall', () => {
  assert.equal(getArrayJourney([], at(25)).nextRepId, 'sum-positive-numbers')
  assert.equal(getArrayJourney([record('sum-positive-numbers', 20)], at(25)).nextRepId, 'count-even-numbers')
  const independent = getArrayJourney([record('count-even-numbers', 21), record('sum-positive-numbers', 20)], at(22))
  assert.equal(independent.stage, 'independent')
  assert.equal(independent.nextRepId, null)
  assert.equal(independent.recallAt, at(24))
  assert.equal(
    getArrayJourney([record('sum-positive-numbers', 20), record('count-even-numbers', 21)], at(24)).nextRepId,
    'count-above-threshold',
  )
})

test('hints and early recall do not establish independence or retention', () => {
  const guided = record('sum-positive-numbers', 20)
  assert.equal(getArrayJourney([guided, record('count-even-numbers', 21, 1)], at(25)).stage, 'practising')
  const independent = record('count-even-numbers', 21)
  assert.equal(getArrayJourney([guided, independent, record('count-above-threshold', 22)], at(25)).stage, 'independent')
  assert.equal(getArrayJourney([guided, independent, record('count-above-threshold', 24, 1)], at(25)).stage, 'independent')
  assert.equal(getArrayJourney([guided, independent, record('count-above-threshold', 24)], at(25)).stage, 'retained')
})

test('a rep completed before guided work does not establish independence', () => {
  assert.equal(getArrayJourney([record('count-even-numbers', 19), record('sum-positive-numbers', 20)], at(25)).stage, 'practising')
})

test('every journey has distinct playable reps and delayed evidence rules', () => {
  const ids = new Set(reps.map(rep => rep.id))
  assert.equal(ids.size, reps.length)
  for (const journey of journeys) {
    assert.equal(new Set([journey.guided, journey.independent, journey.recall]).size, 3)
    for (const id of [journey.guided, journey.independent, journey.recall]) {
      assert.ok(ids.has(id), `${journey.id}: ${id}`)
      assert.ok(reps.find(rep => rep.id === id).checks.length >= 3)
    }
    const records = [record(journey.guided, 20), record(journey.independent, 21), record(journey.recall, 24)]
    assert.equal(getJourney(journey, records, at(25)).stage, 'retained')
    assert.equal(getJourney(journey, [records[0], records[1], record(journey.recall, 23)], at(25)).stage, 'independent')
  }
})

test('every path and new lesson points to playable content', () => {
  const ids = new Set(reps.map(rep => rep.id))
  assert.equal(new Set(paths.map(path => path.id)).size, paths.length)
  for (const path of paths) {
    const repIds = path.stages.flatMap(stage => stage.repIds)
    assert.ok(repIds.length > 0, path.id)
    assert.equal(new Set(repIds).size, repIds.length, `${path.id} repeats a rep`)
    for (const id of repIds) assert.ok(ids.has(id), `${path.id}: ${id}`)
    for (const field of ['title', 'body', 'example', 'explanation', 'next']) {
      assert.ok(path.introduction[field].trim(), `${path.id} introduction needs ${field}`)
    }
  }
  for (const lesson of coreLessons) {
    const rep = reps.find(item => item.id === lesson.repId)
    assert.ok(rep, lesson.repId)
    assert.ok(rep.checks.length >= 3, lesson.repId)
  }
})

test('DSA applications require unhinted independence and delayed unhinted recall', () => {
  for (const id of ['sorting', 'windows', 'recursion', 'trees', 'graphs', 'stacks']) {
    const journey = journeys.find(item => item.id === id)
    assert.ok(journey, id)
    const guided = record(journey.guided, 20)
    const independent = record(journey.independent, 21)
    assert.equal(getJourney(journey, [guided, record(journey.independent, 21, 1)], at(25)).stage, 'practising')
    assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 23)], at(25)).stage, 'independent')
    assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 24, 1)], at(25)).stage, 'independent')
    assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 24)], at(25)).stage, 'retained')
  }
})

test('optional practice is playable, unique, and separate from evidence and recall variants', () => {
  const ids = new Set(reps.map(rep => rep.id))
  for (const journey of journeys) {
    const practice = journey.practice ?? []
    assert.equal(new Set(practice).size, practice.length)
    const reserved = [journey.guided, journey.independent, journey.recall, ...(recallVariants[journey.id] ?? [])]
    for (const id of practice) {
      assert.ok(ids.has(id), id)
      assert.ok(!reserved.includes(id), id)
    }
  }
  const allRecallVariants = new Set(Object.values(recallVariants).flat())
  for (const id of ['arrays', 'text', 'lookup', 'stacks']) {
    const practice = journeys.find(journey => journey.id === id).practice
    assert.equal(practice.length, 2)
    for (const repId of practice) assert.ok(!allRecallVariants.has(repId), repId)
  }
})

test('practice exposes chronological hint-free records without gating stage or recall', () => {
  for (const journey of journeys.filter(journey => journey.practice?.length)) {
    const base = [record(journey.guided, 20), record(journey.independent, 21)]
    // A journey with one practice rep repeats it, which must order and filter the same way.
    const second = journey.practice[1] ?? journey.practice[0]
    const extra = [
      record(journey.practice[0], 23),
      record(second, 22, 1),
      record(second, 22),
      { ...record(journey.practice[0], 23), completedAt: 'invalid' },
    ]
    const before = getJourney(journey, base, at(25))
    const after = getJourney(journey, [...base, ...extra], at(25))
    assert.deepEqual(after.practiced, [extra[2], extra[0]])
    const { practiced: _ignoredBefore, ...beforeEvidence } = before
    const { practiced: _ignoredAfter, ...afterEvidence } = after
    assert.deepEqual(afterEvidence, beforeEvidence)
    assert.equal(getJourney(journey, extra, at(25)).stage, 'learning')
    assert.equal(getJourney(journey, [...base, record(journey.recall, 24)], at(25)).stage, 'retained')
  }
  assert.deepEqual(getJourney({ ...journeys[0], practice: undefined }, [], at(25)).practiced, [])
})

test('knowledge validation accepts the catalog and rejects missing, duplicate, and overlapping practice targets', () => {
  const journey = journeys[0]
  const original = journey.practice
  const ids = new Set(reps.map(rep => rep.id))
  // References, the prerequisite graph, questions, projects, and recall variants are valid as authored.
  assert.deepEqual(validateKnowledge(ids), [])
  try {
    journey.practice = [
      'missing-practice',
      journey.guided,
      journey.independent,
      journey.recall,
      recallVariants[journey.id][0],
      'missing-practice',
    ]
    const problems = validateKnowledge(ids)
    assert.ok(problems.includes('arrays: duplicate practice reps'))
    assert.ok(problems.includes('arrays: missing practice rep missing-practice'))
    for (const id of [journey.guided, journey.independent, journey.recall, recallVariants[journey.id][0]])
      assert.ok(problems.includes(`arrays: practice overlaps evidence rep ${id}`))
  } finally {
    journey.practice = original
  }
})
