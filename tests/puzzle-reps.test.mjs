import assert from 'node:assert/strict'
import test from 'node:test'
import { reps } from '../src/rep.ts'
import { repDepth } from '../src/rep-depth.ts'
import { reflectionGuides } from '../src/reflection-guides.ts'
import { puzzlePractice, journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { compileSolution } from '../src/compile-solution.ts'
import { runRep } from '../src/runner.ts'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'

for (const id of puzzlePractice) {
  test(`greenhouse independent reference passes all 12 checks: ${id}`, () => {
    const rep = reps.find(rep => rep.id === id)
    assert.equal(rep.checks.length, 12)
    assert.ok(runRep(dsaSolutions[id], id).every(check => check.passed))
    assert.ok(reflectionGuides[id].plan.length)
    assert.doesNotMatch(rep.prompt, /\b(map|set|sorting|two pointers|sliding window|prefix sums)\b/i)
  })
  test(`greenhouse parsing snapshots match executed intermediate structures: ${id}`, () => {
    const trace = repDepth[id].traceSteps
    const rep = reps.find(rep => rep.id === id)
    const input = '1 4 3\n\n-5 -2 -4\n'
    const code = [...trace.code]
    code[1] += '; snapshots.push([...lines])'
    code[2] += '; snapshots.push(trays.map(tray => JSON.stringify(tray)))'
    code[6] += '; totals.push(result)'
    const execute = new Function(`${compileSolution(code.join('\n'), rep.functionName)}\nconst snapshots = [], totals = []; const result = ${rep.functionName}(arguments[0]); return { snapshots, totals, result }`)
    const actual = execute(input)
    assert.deepEqual(trace.steps.slice(1, 3).map(step => step.structure.values), actual.snapshots)
    assert.deepEqual(trace.steps.slice(3, 5).map(step => step.vars.result), actual.totals)
    assert.equal(trace.steps.at(-1).vars.result, actual.result)
    assert.ok(runRep(trace.code.join('\n'), id).every(check => check.passed))
  })
}

test('greenhouse checks reject lossy and wrong-rule solutions', () => {
  const wrong = [
    ['puzzle-parse-part-one', 'function strongestTotal(input) { return input.split("\\n").reduce((sum,line) => sum + Math.max(0,...(line.match(/-?\\d+/g)||[]).map(Number)),0) }'],
    ['puzzle-adapt-part-two', dsaSolutions['puzzle-adapt-part-two'].replace('>= peak - 2', '> peak - 2')],
    ['puzzle-adapt-part-two', dsaSolutions['puzzle-adapt-part-two'].replace('tray.reduce((count', '[...new Set(tray)].reduce((count')],
    ['puzzle-adapt-part-two', 'function nearPeakCount(input) { const values=(input.match(/-?\\d+/g)||[]).map(Number); return values.filter(value=>value>=Math.max(...values)-2).length }'],
  ]
  for (const [id, source] of wrong) assert.ok(runRep(source, id).some(check => !check.passed), source)
})

test('related puzzle parts never masquerade as independent or retained evidence', () => {
  for (const id of puzzlePractice) {
    assert.ok(!journeys.some(journey => [journey.guided, journey.independent, journey.recall].includes(id)))
    assert.ok(!Object.values(recallVariants).flat().includes(id))
  }
})
