import assert from 'node:assert/strict'
import test from 'node:test'
import { bundleReactFrame } from '../scripts/react-frame-bundle.mjs'
import { reactReps } from '../src/react-reps.ts'
import { reflectionGuides } from '../src/reflection-guides.ts'
import { repDepth } from '../src/rep-depth.ts'
import { reactSolution } from './fixtures/react-solution.mjs'
import { runFrame } from './helpers/frame.mjs'
const runtime = await bundleReactFrame()
const rep = reactReps[0]
function run(code, mode = 'checks') {
  const { report, value } = runFrame(code, rep, { mode, runtime }, window => window.document.querySelector('#exercise-root').textContent)
  return { report, text: value }
}
test('one complete React rep compiles TSX and passes all six checks', () => {
  assert.equal(reactReps.length, 1)
  assert.ok(reflectionGuides[rep.id] && repDepth[rep.id])
  const { report } = run(reactSolution)
  assert.equal(report.error, undefined)
  assert.equal(report.results.length, 6)
  assert.ok(report.results.every(result => result.passed), JSON.stringify(report))
})
test('React preview renders the actual component', () => {
  assert.equal(run(reactSolution, 'preview').text, 'north: 0Reset')
})
test('React starter does not satisfy the contract', () => {
  assert.ok(run(rep.starter).report.results.some(result => !result.passed))
})
for (const [name, mutate] of [
  ['missing cleanup', code => code.replace('() => source.subscribe(channel, value => setTotal(previous => previous + value))', '() => { source.subscribe(channel, value => setTotal(previous => previous + value)) }')],
  ['missing dependency', code => code.replace('[channel, source]', '[]')],
  ['stale state', code => code.replace('previous => previous + value', 'total + value')],
  ['broken reset', code => code.replace('setTotal(0)', 'setTotal(1)')],
]) test(`checks reject ${name}`, () => {
  const { report } = run(mutate(reactSolution))
  assert.ok(report.results.some(result => !result.passed), JSON.stringify(report))
})
