import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'
import { reps } from '../src/rep.ts'
import { journeys } from '../src/learning.ts'
import { skills } from '../src/knowledge.ts'
import { paths } from '../src/path.ts'

const pointerSolutions = {
  'sorted-offset-squares': `function squareOffsets(offsets: number[]): number[] {
    const result = new Array<number>(offsets.length)
    let left = 0, right = offsets.length - 1
    for (let write = result.length - 1; write >= 0; write--) {
      const a = offsets[left] * offsets[left], b = offsets[right] * offsets[right]
      if (a >= b) { result[write] = a; left++ }
      else { result[write] = b; right-- }
    }
    return result
  }`,
  'reading-run-summary': `function summarizeReadings(readings: number[]): {value:number;count:number}[] {
    const result: {value:number;count:number}[] = []
    let write = -1
    for (let read = 0; read < readings.length; read++) {
      if (write >= 0 && result[write].value === readings[read]) result[write].count++
      else { result.push({value:readings[read],count:1}); write++ }
    }
    return result
  }`,
}

test('two-pointer review approaches satisfy every authored boundary', () => {
  for (const [id, code] of Object.entries(pointerSolutions)) {
    assert.ok(runRep(code, id).every(result => result.passed), id)
    assert.equal(reps.find(rep => rep.id === id).preserveInput, true)
  }
})

test('two-pointer tasks reject correct output accompanied by input mutation', () => {
  for (const [id, code] of Object.entries(pointerSolutions)) {
    const input = id === 'sorted-offset-squares' ? 'offsets' : 'readings'
    const mutated = code.replace('return result', `${input}.fill(999); return result`)
    assert.ok(runRep(mutated, id).some(result => !result.passed), id)
  }
})

test('two-pointers journey is linked to its lesson and algorithm stage', () => {
  const journey = journeys.find(item => item.id === 'two-pointers')
  assert.deepEqual(journey, { id: 'two-pointers', title: 'Coordinate positions in sorted data', guided: 'algo-sorted-pair', independent: 'sorted-offset-squares', recall: 'reading-run-summary', delayDays: 3 })
  const ids = [journey.guided, journey.independent, journey.recall]
  const lesson = skills.find(skill => skill.id === 'array-techniques')
  const stage = paths.flatMap(path => path.stages).find(stage => stage.title === 'Search sorted data and scan windows')
  for (const id of ids) {
    assert.ok(lesson.repIds.includes(id), id)
    assert.ok(stage.repIds.includes(id), id)
  }
})
