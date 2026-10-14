import assert from 'node:assert/strict'
import test from 'node:test'
import { reps } from '../src/rep.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { repDepth } from '../src/rep-depth.ts'
import { runRep } from '../src/runner.ts'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'

const ids = ['grid-open-neighbours', 'grid-count-rooms', 'grid-fewest-steps']

for (const id of ids) {
  test(`grid rep preserves its input and its checks detect mutation: ${id}`, () => {
    const rep = reps.find(rep => rep.id === id)
    assert.equal(rep.preserveInput, true)
    const mutating = dsaSolutions[id].replace(/\{/, '{ g.push(\'\');')
    assert.ok(runRep(mutating, id).some(check => !check.passed && /mutat|chang/i.test(check.message ?? check.actual ?? '')), 'mutating input must fail')
  })
}

test('grid journey has distinct evidence tasks and a three-day delay', () => {
  const journey = journeys.find(journey => journey.id === 'grids')
  assert.deepEqual([journey.guided, journey.independent, journey.recall], ids)
  assert.equal(journey.delayDays, 3)
  assert.equal(recallVariants.grids[0], journey.recall)
  for (const id of ids.slice(1)) {
    const rep = reps.find(rep => rep.id === id)
    assert.doesNotMatch(rep.prompt + rep.planPrompt + rep.starter, /\bBFS\b|\bDFS\b|flood fill|breadth.first|depth.first/i)
  }
})

test('checks reject diagonal rooms, unordered neighbours, and Manhattan-only routes', () => {
  const wrong = {
    'grid-open-neighbours': dsaSolutions['grid-open-neighbours'].replace('[[r-1,c],[r,c+1],[r+1,c],[r,c-1]]', '[[r,c-1],[r+1,c],[r,c+1],[r-1,c]]'),
    'grid-count-rooms': dsaSolutions['grid-count-rooms'].replace('[[y-1,x],[y+1,x],[y,x-1],[y,x+1]]', '[[y-1,x],[y+1,x],[y,x-1],[y,x+1],[y+1,x+1],[y-1,x-1]]'),
    'grid-fewest-steps': "function fewestSteps(g) { let s,e; for(let r=0;r<g.length;r++) for(let c=0;c<g[r].length;c++) { if(g[r][c]==='S')s=[r,c];if(g[r][c]==='E')e=[r,c] } return s&&e?Math.abs(s[0]-e[0])+Math.abs(s[1]-e[1]):-1 }",
  }
  for (const [id, source] of Object.entries(wrong)) assert.ok(runRep(source, id).some(check => !check.passed), id)
})

test('grid table snapshots show inspection order and each distance update', () => {
  const inspection = repDepth['grid-open-neighbours'].traceSteps.steps
  assert.deepEqual(inspection.map(step => step.structure.current).filter(Boolean), [[0,2],[1,1],[0,0]])
  const distance = repDepth['grid-fewest-steps'].traceSteps.steps
  assert.deepEqual(distance.slice(0,5).map(step => step.structure.current), [[0,0],[1,0],[1,1],[1,2],[0,2]])
  for (const [index, step] of distance.slice(0,5).entries()) {
    const [r,c] = step.structure.current
    assert.equal(step.structure.cells[r][c], index)
    assert.deepEqual(step.structure.reads ?? [], index ? [distance[index-1].structure.current] : [])
    assert.equal(step.structure.cells[0][1], '#')
  }
  assert.equal(distance.at(-1).vars.result, 4)
})
