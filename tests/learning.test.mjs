import assert from 'node:assert/strict'
import test from 'node:test'
import { getArrayJourney, getJourney, journeys } from '../src/learning.ts'
import { reps } from '../src/rep.ts'
import { paths } from '../src/path.ts'
import { coreLessons } from '../src/ai-era-reps.ts'

const record = (repId, day, hintCount = 0) => ({ repId, completedAt: `2026-09-${String(day).padStart(2, '0')}T00:00:00.000Z`, hintCount })
const at = (day) => Date.parse(`2026-09-${String(day).padStart(2, '0')}T00:00:00.000Z`)

test('guides a learner from first rep to delayed recall', () => {
  assert.equal(getArrayJourney([], at(25)).nextRepId, 'sum-positive-numbers')
  assert.equal(getArrayJourney([record('sum-positive-numbers', 20)], at(25)).nextRepId, 'count-even-numbers')
  const independent = getArrayJourney([record('count-even-numbers', 21), record('sum-positive-numbers', 20)], at(22))
  assert.equal(independent.stage, 'independent')
  assert.equal(independent.nextRepId, null)
  assert.equal(independent.recallAt, at(24))
  assert.equal(getArrayJourney([record('sum-positive-numbers', 20), record('count-even-numbers', 21)], at(24)).nextRepId, 'count-above-threshold')
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
  const ids = new Set(reps.map((rep) => rep.id))
  assert.equal(ids.size, reps.length)
  for (const journey of journeys) {
    assert.equal(new Set([journey.guided, journey.independent, journey.recall]).size, 3)
    for (const id of [journey.guided, journey.independent, journey.recall]) {
      assert.ok(ids.has(id), `${journey.id}: ${id}`)
      assert.ok(reps.find((rep) => rep.id === id).checks.length >= 3)
    }
    const records = [record(journey.guided, 20), record(journey.independent, 21), record(journey.recall, 24)]
    assert.equal(getJourney(journey, records, at(25)).stage, 'retained')
    assert.equal(getJourney(journey, [records[0], records[1], record(journey.recall, 23)], at(25)).stage, 'independent')
  }
})

test('every path and new lesson points to playable content', () => {
  const ids = new Set(reps.map((rep) => rep.id))
  assert.equal(new Set(paths.map((path) => path.id)).size, paths.length)
  for (const path of paths) {
    const repIds = path.stages.flatMap((stage) => stage.repIds)
    assert.ok(repIds.length > 0, path.id)
    assert.equal(new Set(repIds).size, repIds.length, `${path.id} repeats a rep`)
    for (const id of repIds) assert.ok(ids.has(id), `${path.id}: ${id}`)
    for (const field of ['title', 'body', 'example', 'explanation', 'next']) {
      assert.ok(path.introduction[field].trim(), `${path.id} introduction needs ${field}`)
    }
  }
  for (const lesson of coreLessons) {
    const rep = reps.find((item) => item.id === lesson.repId)
    assert.ok(rep, lesson.repId)
    assert.ok(rep.checks.length >= 3, lesson.repId)
  }
})

test('DSA applications require unhinted independence and delayed unhinted recall', () => {
  for (const id of ['sorting', 'recursion', 'trees', 'graphs', 'stacks']) {
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
