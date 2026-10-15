import assert from 'node:assert/strict'
import test from 'node:test'
import { bundleReactFrame } from '../scripts/react-frame-bundle.mjs'
import { reactReps } from '../src/react-reps.ts'
import { reflectionGuides } from '../src/reflection-guides.ts'
import { repDepth } from '../src/rep-depth.ts'
import { reactSolution, reactSolutions } from './fixtures/react-solution.mjs'
import { runFrame } from './helpers/frame.mjs'
const runtime = await bundleReactFrame()
const rep = reactReps.find(item => item.id === 'react-channel-counter')
function run(code, mode = 'checks') {
  const { report, value } = runFrame(code, rep, { mode, runtime }, window => window.document.querySelector('#exercise-root').textContent)
  return { report, text: value }
}
test('the channel counter compiles TSX and passes all six checks', () => {
  assert.ok(reflectionGuides[rep.id] && repDepth[rep.id])
  const { report } = run(reactSolution)
  assert.equal(report.error, undefined)
  assert.equal(report.results.length, 6)
  assert.ok(
    report.results.every(result => result.passed),
    JSON.stringify(report),
  )
})
test('React preview renders the actual component', () => {
  assert.equal(run(reactSolution, 'preview').text, 'north: 0Reset')
})
test('React starter does not satisfy the contract', () => {
  assert.ok(run(rep.starter).report.results.some(result => !result.passed))
})
for (const [name, mutate] of [
  [
    'missing cleanup',
    code =>
      code.replace(
        '() => source.subscribe(channel, value => setTotal(previous => previous + value))',
        '() => { source.subscribe(channel, value => setTotal(previous => previous + value)) }',
      ),
  ],
  ['missing dependency', code => code.replace('[channel, source]', '[]')],
  ['stale state', code => code.replace('previous => previous + value', 'total + value')],
  ['broken reset', code => code.replace('setTotal(0)', 'setTotal(1)')],
])
  test(`checks reject ${name}`, () => {
    const { report } = run(mutate(reactSolution))
    assert.ok(
      report.results.some(result => !result.passed),
      JSON.stringify(report),
    )
  })

const failures = (id, code) => {
  const { report } = runFrame(
    code,
    reactReps.find(item => item.id === id),
    { runtime },
  )
  assert.equal(report.error, undefined, JSON.stringify(report))
  return Array.from(report.results)
    .filter(result => !result.passed)
    .map(result => result.name)
}

test('every React rep passes with its reference, fails with its starter, and has a review', () => {
  for (const item of reactReps) {
    assert.ok(reflectionGuides[item.id] && repDepth[item.id], item.id)
    assert.deepEqual(failures(item.id, reactSolutions[item.id]), [], item.id)
    assert.ok(failures(item.id, item.starter).length > 0, `${item.id}: starter passes`)
  }
})

for (const [id, name, mutate] of [
  ['react-row-keys', 'position keys', code => code.replace('key={task.id}', 'key={tasks.indexOf(task)}')],
  ['react-row-keys', 'title keys', code => code.replace('key={task.id}', 'key={task.title}')],
  ['react-stale-request', 'no stale flag', code => code.replace('if (current) setAnswer', 'setAnswer')],
  ['react-stale-request', 'requests only once', code => code.replace('[query, source]', '[]')],
  ['react-stale-request', 'singular status missing', code => code.replace("results.length === 1 ? ' result for ' : ", '')],
])
  test(`React checks reject ${name}`, () => {
    const code = mutate(reactSolutions[id])
    assert.notEqual(code, reactSolutions[id])
    assert.ok(failures(id, code).length > 0)
  })
