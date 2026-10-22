import assert from 'node:assert/strict'
import test from 'node:test'
import { reps } from '../src/rep.ts'
import { repDepth } from '../src/rep-depth.ts'
import { runRep } from '../src/runner.ts'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'

const ids = ['life-count-neighbours', 'life-next-cell', 'life-next-generation']
const failing = (source, id) => runRep(source, id).filter(check => !check.passed)

test('the Game of Life parts pass with their references and fail with their starters', () => {
  for (const id of ids) {
    const rep = reps.find(item => item.id === id)
    assert.deepEqual(failing(dsaSolutions[id], id), [], id)
    // A true-or-false answer passes some checks by chance; board answers should fail most.
    const floor = id === 'life-next-cell' ? 1 : rep.checks.length / 2
    assert.ok(failing(rep.starter, id).length >= floor, `${id} starter passes too many checks`)
  }
})

test('board reps keep their input, and their checks detect mutation', () => {
  for (const id of ['life-count-neighbours', 'life-next-generation']) {
    assert.equal(reps.find(item => item.id === id).preserveInput, true)
    const mutating = dsaSolutions[id].replace(/\{/, "{ g.push('');")
    assert.ok(
      failing(mutating, id).some(check => /chang|mutat/i.test(check.message ?? '')),
      id,
    )
  }
})

test('checks catch the plausible mistakes: counting the cell, wrapping edges, one-sided rules, and in-place updates', () => {
  const wrong = {
    'life-count-neighbours': [
      // Counts the cell itself.
      dsaSolutions['life-count-neighbours'].replace('(y!==r||x!==c)&&', ''),
      // Wraps columns around the edge.
      "function countNeighbours(g:string[], p:[number,number]) { const [r,c]=p; if(r<0||c<0||r>=g.length||c>=(g[0]?.length??0)) return 0; const w=g[0].length; let n=0; for(const y of [r-1,r,r+1]) for(const dx of [-1,0,1]) { const x=(c+dx+w)%w; if((y!==r||dx!==0)&&y>=0&&y<g.length&&g[y][x]==='#') n++ } return n }",
    ],
    'life-next-cell': [
      'function nextCell(alive:boolean, n:number) { return n===2 || n===3 }',
      'function nextCell(alive:boolean, n:number) { return alive ? n<=3 : n===3 }',
    ],
    'life-next-generation': [
      // Updates the board it is reading, row by row.
      "function nextGeneration(g:string[]) { const b=g.map(row=>row.split('')); for(let r=0;r<b.length;r++) for(let c=0;c<b[r].length;c++) { let n=0; for(let y=r-1;y<=r+1;y++) for(let x=c-1;x<=c+1;x++) if((y!==r||x!==c)&&b[y]?.[x]==='#') n++; b[r][c]=(n===3||(b[r][c]==='#'&&n===2))?'#':'.' } return b.map(row=>row.join('')) }",
      // Wraps rows and columns.
      "function nextGeneration(g:string[]) { const h=g.length, w=g[0]?.length??0; return g.map((row,r)=>Array.from(row,(ch,c)=>{ let n=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if((dy||dx)&&g[(r+dy+h)%h][(c+dx+w)%w]==='#') n++; return (n===3||(ch==='#'&&n===2))?'#':'.' }).join('')) }",
    ],
  }
  for (const [id, sources] of Object.entries(wrong))
    for (const [index, source] of sources.entries()) assert.ok(failing(source, id).length, `${id} mistake ${index + 1} passes`)
})

test('the next-generation trace fills the new board cell by cell from the old one', () => {
  const steps = repDepth['life-next-generation'].traceSteps.steps
  assert.deepEqual(steps.map(step => step.structure.current).filter(Boolean), [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ])
  assert.deepEqual(
    steps.at(-1).structure.cells.map(row => row.join('')),
    ['...', '###', '...'],
  )
})
