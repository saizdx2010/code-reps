import assert from 'node:assert/strict'
import test from 'node:test'
import { richReps } from '../src/rich-reps.ts'
import { runRep } from '../src/runner.ts'
import { previewScenarios } from '../src/frontend-frame.ts'
import { richSolutions } from './fixtures/rich-solutions.mjs'
import { runFrame } from './helpers/frame.mjs'

const frontend = richReps.find(rep => rep.format === 'frontend')
const frame = (code, options, inspect) => runFrame(code, frontend, options, inspect)

test('each rich format has a reference solution and its full authored contract passes', () => {
  assert.deepEqual(Object.keys(richSolutions).sort(), richReps.map(rep => rep.id).sort())
  for (const rep of richReps) {
    if (rep.format === 'frontend') {
      const { report } = frame(richSolutions[rep.id])
      assert.ok(
        report.results.every(result => result.passed),
        JSON.stringify(report),
      )
    } else
      assert.deepEqual(
        runRep(richSolutions[rep.id], rep.id).filter(result => !result.passed),
        [],
      )
  }
})

test('debugging starts with observable regressions, while refactoring starts with working behavior', () => {
  const debug = richReps.find(rep => rep.format === 'debug')
  const refactor = richReps.find(rep => rep.format === 'refactor')
  assert.ok(runRep(debug.starter, debug.id).some(result => !result.passed))
  assert.ok(runRep(refactor.starter, refactor.id).every(result => result.passed))
})

test('frontend checks reject missing interaction wiring and accessible labelling', () => {
  for (const code of [
    richSolutions[frontend.id].replace("search.addEventListener('input', renderList)", ''),
    richSolutions[frontend.id].replace("label.htmlFor = 'people-search'", ''),
    richSolutions[frontend.id].replace("retry.addEventListener('click', state.retry)", ''),
    richSolutions[frontend.id].replace('item.textContent = person.name', 'item.innerHTML = person.name'),
  ]) {
    const { report } = frame(code)
    assert.ok(
      report.results.some(result => !result.passed),
      'An incomplete interface must fail',
    )
  }
})

test('frontend checks detect input mutation and report each failing starter case', () => {
  const mutating = richSolutions[frontend.id].replace('root.replaceChildren()', 'state.people.reverse(); root.replaceChildren()')
  const { report } = frame(mutating)
  assert.ok(report.results.some(result => result.message?.includes('changed its input')))
  const starter = frame(frontend.starter)
  assert.equal(starter.report.results.length, frontend.checks.length)
  assert.ok(starter.report.results.some(result => !result.passed))
})

test('interactive preview supports search changes and retry feedback', () => {
  frame(richSolutions[frontend.id], { mode: 'preview', scenario: previewScenarios.ready }, window => {
    const input = window.document.querySelector('input')
    input.value = ' AD '
    input.dispatchEvent(new window.Event('input', { bubbles: true }))
    assert.deepEqual(
      [...window.document.querySelectorAll('li')].map(item => item.textContent),
      ['Ada', 'Adam'],
    )
  })
  frame(richSolutions[frontend.id], { mode: 'preview', scenario: previewScenarios.error }, window => {
    window.document.querySelector('button').click()
    assert.match(window.document.body.textContent, /Retry requested 1 time/)
  })
})

test('frame generation escapes script-closing text and exposes runtime errors safely', () => {
  const escaped = frame(
    richSolutions[frontend.id] + '\nconst example = "</script><script>throw 42</script>"',
    {},
    window => window.document.querySelectorAll('script').length,
  )
  assert.equal(escaped.value, 1)
  assert.ok(escaped.report.results.every(result => result.passed))
  const error = frame(
    'function mountDirectory() { throw new Error("Repair this") }',
    { mode: 'preview' },
    window => window.document.querySelector('[role="alert"]').textContent,
  )
  assert.equal(error.report.error, 'Repair this')
  assert.equal(error.value, 'Repair this')
})

test('worker runner directs frontend exercises to browser interaction checks', () => {
  assert.throws(() => runRep(frontend.starter, frontend.id), /browser interaction checks/)
})
