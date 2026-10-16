import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution, loopLimitMs, loopStoppedMessage } from '../src/compile-solution.ts'
import { decodeFiles, encodeFiles } from '../src/project-files.ts'
import { domReps } from '../src/dom-reps.ts'
import { domSolutions } from './fixtures/dom-solutions.mjs'
import { runFrame } from './helpers/frame.mjs'

const run = (code, name, options) => new Function(`${compileSolution(code, name, false, options)}\nreturn ${name}`)()

test('a single-file solution may export its function', () => {
  const code = `export function double(n: number) { return n * 2 }
export default double
export { double as twice }`
  assert.equal(run(code, 'double')(4), 8)
  assert.equal(run('export const triple = (n: number) => n * 3', 'triple')(2), 6)
})

test('guarded loops keep their behavior, labels, and async waits', async () => {
  const code = `function count(n: number) {
  let total = 0
  outer: for (let i = 0; i < n; i++) {
    for (const x of [1, 2, 3]) { if (x === 3) continue outer; total += x }
  }
  let k = 2
  do { total++; k-- } while (k > 0)
  for (const key in { a: 1 }) total += key.length
  while (total < 100) total += 50
  return total
}`
  assert.equal(run(code, 'count', { guardLoops: true })(3), run(code, 'count')(3))
  const waits = `async function waits() { let n = 0; while (n < 2) { await new Promise(r => setTimeout(r, ${loopLimitMs / 2 + 50})); n++ } return n }`
  assert.equal(await run(waits, 'waits', { guardLoops: true })(), 2)
})

test('a loop that never ends stops with a clear message instead of freezing the page', () => {
  delete globalThis.__codeRepsLoopStopped
  const spin = run('function spin() { while (true) {} }', 'spin', { guardLoops: true })
  const started = Date.now()
  assert.throws(() => spin(), { message: loopStoppedMessage })
  assert.ok(Date.now() - started < loopLimitMs + 1000)
  // Later loops stop at once, so the remaining checks finish quickly.
  const again = Date.now()
  assert.throws(() => spin(), { message: loopStoppedMessage })
  assert.ok(Date.now() - again < 100)
  delete globalThis.__codeRepsLoopStopped
})

test('frontend checks report an endless loop as a failure and keep running', () => {
  const rep = domReps[0]
  const reference = domSolutions[rep.id]
  const code = `${reference}\nwhile (true) {}`
  const started = Date.now()
  const { report } = runFrame(code, rep)
  assert.ok(Date.now() - started < loopLimitMs + 2000)
  const text = JSON.stringify(report)
  assert.match(text, /loop ran for more than/)
  // A fresh frame starts unstopped: the reference still passes.
  const { report: clean } = runFrame(reference, rep)
  assert.ok(
    clean.results.every(result => result.passed),
    JSON.stringify(clean),
  )
})

test('project entries must be real file names, not inherited object keys', () => {
  const code = encodeFiles({ entry: 'toString', files: { 'main.ts': 'export function solve() { return 1 }' } })
  assert.throws(() => decodeFiles(code), /valid entry/)
})

test('loops in every file of a multi-file project are guarded', () => {
  const project = helper =>
    encodeFiles({
      entry: 'index.ts',
      files: {
        'index.ts': `import { total } from './helper'\nexport function sum(values: number[]) { return total(values) }`,
        'helper.ts': helper,
      },
    })
  const working = project('export function total(values: number[]) { let sum = 0; for (const value of values) sum += value; return sum }')
  assert.equal(run(working, 'sum', { guardLoops: true })([1, 2, 3]), 6)
  assert.equal(run(working, 'sum')([1, 2, 3]), 6)
  delete globalThis.__codeRepsLoopStopped
  const endless = project('export function total(values: number[]) { while (true) {} }')
  assert.throws(() => run(endless, 'sum', { guardLoops: true })([1]), { message: loopStoppedMessage })
  delete globalThis.__codeRepsLoopStopped
})
