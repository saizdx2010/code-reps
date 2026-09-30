import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { richReps } from '../src/rich-reps.ts'
import { runRep } from '../src/runner.ts'
import { buildFrontendFrame, previewScenarios } from '../src/frontend-frame.ts'
import { richSolutions } from './fixtures/rich-solutions.mjs'

const frontend = richReps.find(rep => rep.format === 'frontend')
function frame(code, mode = 'checks', scenario) {
  let report
  const dom = new JSDOM(buildFrontendFrame(code, frontend, 'test-token', mode, scenario), {
    runScripts: 'dangerously', beforeParse(window) { window.postMessage = data => { report = data } },
  })
  return { dom, report }
}

test('each rich format has a reference solution and its full authored contract passes', () => {
  assert.deepEqual(Object.keys(richSolutions).sort(), richReps.map(rep => rep.id).sort())
  for (const rep of richReps) {
    if (rep.format === 'frontend') {
      const { dom, report } = frame(richSolutions[rep.id])
      try { assert.ok(report.results.every(result => result.passed), JSON.stringify(report)) }
      finally { dom.window.close() }
    } else assert.deepEqual(runRep(richSolutions[rep.id], rep.id).filter(result => !result.passed), [])
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
    const { dom, report } = frame(code)
    try { assert.ok(report.results.some(result => !result.passed), 'An incomplete interface must fail') }
    finally { dom.window.close() }
  }
})

test('frontend checks detect input mutation and report each failing starter case', () => {
  const mutating = richSolutions[frontend.id].replace('root.replaceChildren()', 'state.people.reverse(); root.replaceChildren()')
  const { dom, report } = frame(mutating)
  try { assert.ok(report.results.some(result => result.message?.includes('changed its input'))) }
  finally { dom.window.close() }
  const starter = frame(frontend.starter)
  try { assert.equal(starter.report.results.length, frontend.checks.length); assert.ok(starter.report.results.some(result => !result.passed)) }
  finally { starter.dom.window.close() }
})

test('interactive preview supports search changes and retry feedback', () => {
  const ready = frame(richSolutions[frontend.id], 'preview', previewScenarios.ready)
  try {
    const input = ready.dom.window.document.querySelector('input')
    input.value = ' AD '
    input.dispatchEvent(new ready.dom.window.Event('input', { bubbles: true }))
    assert.deepEqual([...ready.dom.window.document.querySelectorAll('li')].map(item => item.textContent), ['Ada', 'Adam'])
  } finally { ready.dom.window.close() }
  const error = frame(richSolutions[frontend.id], 'preview', previewScenarios.error)
  try {
    error.dom.window.document.querySelector('button').click()
    assert.match(error.dom.window.document.body.textContent, /Retry requested 1 time/)
  } finally { error.dom.window.close() }
})

test('frame generation escapes script-closing text and exposes runtime errors safely', () => {
  const escaped = frame(richSolutions[frontend.id] + '\nconst example = "</script><script>throw 42</script>"')
  try { assert.equal(escaped.dom.window.document.querySelectorAll('script').length, 1); assert.ok(escaped.report.results.every(result => result.passed)) }
  finally { escaped.dom.window.close() }
  const error = frame('function mountDirectory() { throw new Error("Repair this") }', 'preview')
  try { assert.equal(error.report.error, 'Repair this'); assert.equal(error.dom.window.document.querySelector('[role="alert"]').textContent, 'Repair this') }
  finally { error.dom.window.close() }
})

test('worker runner directs frontend exercises to browser interaction checks', () => {
  assert.throws(() => runRep(frontend.starter, frontend.id), /browser interaction checks/)
})
