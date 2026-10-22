import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { differingCells, lifeSources, lifeStepper, referenceGeneration, settled, startingBoard } from '../src/life-toy.ts'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'

const sources = {
  countNeighbours: dsaSolutions['life-count-neighbours'],
  nextCell: dsaSolutions['life-next-cell'],
  nextGeneration: dsaSolutions['life-next-generation'],
}
const compile = (source, name) => compileSolution(source, name)
const record = (repId, completedAt, code) => ({
  id: `${repId}-${completedAt}`,
  repId,
  completedAt,
  code,
  plan: '',
  explanation: '',
  hintCount: 0,
})

test('the toy uses each part’s latest completed code and reports parts not built yet', () => {
  const history = [
    record('life-count-neighbours', '2026-10-01T10:00:00.000Z', 'old'),
    record('life-count-neighbours', '2026-10-05T10:00:00.000Z', 'new'),
    record('life-next-cell', 'not a date', 'broken date'),
  ]
  assert.deepEqual(lifeSources(history), { countNeighbours: 'new', nextCell: null, nextGeneration: null })
})

test('the reference rules step a blinker and the starting board keeps its size', () => {
  assert.deepEqual(referenceGeneration(['.#.', '.#.', '.#.']), ['...', '###', '...'])
  const board = startingBoard()
  assert.equal(board.length, 12)
  assert.ok(board.every(row => row.length === 20))
  assert.equal(referenceGeneration(board).length, 12)
  assert.deepEqual(differingCells(['#.', '..'], ['..', '.#']), [
    [0, 0],
    [1, 1],
  ])
})

test('a stepper runs the learner’s parts, each in its own scope, and asks them about one cell', () => {
  // Each part defines a helper with the same name; separate scopes keep them apart.
  const step = lifeStepper(
    {
      countNeighbours: `function helper() { return 'count' }\n${sources.countNeighbours}`,
      nextCell: `function helper() { return 'cell' }\n${sources.nextCell}`,
      nextGeneration: `function helper() { return 'generation' }\n${sources.nextGeneration}`,
    },
    compile,
  )
  const result = step({ grid: ['.#.', '.#.', '.#.'], inspect: [1, 0] })
  assert.deepEqual(result.next, ['...', '###', '...'])
  assert.deepEqual(result.differs, [])
  assert.deepEqual(result.inspect, { position: [1, 0], neighbours: 3, next: true })
})

test('a generation that breaks the rules is marked cell by cell', () => {
  const wrapping =
    "function nextGeneration(g:string[]) { const h=g.length, w=g[0]?.length??0; return g.map((row,r)=>Array.from(row,(ch,c)=>{ let n=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if((dy||dx)&&g[(r+dy+h)%h][(c+dx+w)%w]==='#') n++; return (n===3||(ch==='#'&&n===2))?'#':'.' }).join('')) }"
  const result = lifeStepper({ ...sources, nextGeneration: wrapping }, compile)({ grid: ['#..', '#..', '#..'] })
  // The rules give ["...", "##.", "..."]; wrapping both ways fills the board.
  assert.deepEqual(result.next, ['###', '###', '###'])
  assert.equal(result.differs.length, 7)
  assert.ok(result.differs.some(([r, c]) => r === 1 && c === 2))
  assert.ok(!result.differs.some(([r, c]) => r === 1 && c < 2), 'cells that agree are not marked')
})

test('errors, wrong shapes, and missing functions are reported, not thrown', () => {
  const throwing = lifeStepper(
    { ...sources, nextGeneration: 'function nextGeneration(g:string[]): string[] { throw new Error("boom") }' },
    compile,
  )
  assert.match(throwing({ grid: ['#'] }).error, /boom/)
  const shrinking = lifeStepper({ ...sources, nextGeneration: 'function nextGeneration(g:string[]) { return [] }' }, compile)
  assert.match(shrinking({ grid: ['#'] }).error, /same size/)
  assert.throws(() => lifeStepper({ ...sources, nextCell: 'const nextCell = 3' }, compile), /does not define a function named nextCell/)
})

test('a board has settled when it repeats the last board or the one before it', () => {
  assert.equal(settled([['##'], ['##']]), true)
  assert.equal(settled([['.#.'], ['...'], ['.#.']]), true)
  assert.equal(settled([['#'], ['.']]), false)
  assert.equal(settled([['#']]), false)
})
