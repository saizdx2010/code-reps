import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { domReps } from '../src/dom-reps.ts'
import { reps } from '../src/rep.ts'
import { buildFrontendFrame } from '../src/frontend-frame.ts'
import { reflectionGuides } from '../src/learning.ts'
import { repDepth } from '../src/rep-depth.ts'
import { domSolutions } from './fixtures/dom-solutions.mjs'

function run(code, rep, mode = 'checks') {
  let report
  const dom = new JSDOM(buildFrontendFrame(code, rep, 'test-token', mode), { runScripts: 'dangerously', beforeParse(window) { window.postMessage = data => { report = data } } })
  return { dom, report }
}
function failed(rep, code) {
  const { dom, report } = run(code, rep)
  try { return report.error ? [report.error] : Array.from(report.results).filter(result => !result.passed).map(result => result.name) }
  finally { dom.window.close() }
}

test('DOM reps are registered, complete, and have independent reference solutions', () => {
  assert.deepEqual(domReps.map(rep => rep.id).sort(), Object.keys(domSolutions).sort())
  for (const rep of domReps) {
    assert.ok(reps.includes(rep), rep.id)
    assert.equal(rep.format, 'frontend')
    assert.ok(rep.hints.length >= 1 && rep.hints.length <= 3, rep.id)
    assert.ok(rep.hints.every(hint => !/[{}`]|=>|\w\(\)|document\./.test(hint)), `${rep.id}: hints must not contain code`)
    assert.ok(rep.vocabulary.length >= 2 && rep.checks.length >= 7 && rep.domPreview, rep.id)
    assert.match(rep.note, /not screen-reader output/, `${rep.id}: state the limits of DOM checks`)
    assert.ok(reflectionGuides[rep.id] && repDepth[rep.id], rep.id)
  }
})

test('every reference solution passes its full authored contract', () => {
  for (const rep of domReps) assert.deepEqual(failed(rep, domSolutions[rep.id]), [], rep.id)
})

test('starter code does not pass its checks', () => {
  for (const rep of domReps) assert.ok(failed(rep, rep.starter).length > 0, `${rep.id}: starter passes`)
})

test('previews mount the authored props without the directory scenarios', () => {
  for (const rep of domReps) {
    const { dom } = run(domSolutions[rep.id], rep, 'preview')
    try { assert.ok(dom.window.document.querySelector('#exercise-root').children.length > 0, rep.id) } finally { dom.window.close() }
  }
})

const mutants = [
  ['dom-accessible-form', 'drop aria-describedby', s => s.replace("row.input.setAttribute('aria-describedby', row.error.id)", '')],
  ['dom-accessible-form', 'wrong error id', s => s.replace("row.error.id = row.field.id + '-error'", "row.error.id = row.field.id")],
  ['dom-accessible-form', 'no label link', s => s.replace('label.htmlFor = field.id', '')],
  ['dom-accessible-form', 'focus last invalid', s => s.replace('if (invalid && !first) first = row.input', 'if (invalid) first = row.input')],
  ['dom-accessible-form', 'no focus', s => s.replace('first.focus()', '')],
  ['dom-accessible-form', 'untrimmed validation', s => s.replace("row.input.value.trim() === ''", "row.input.value === ''")],
  ['dom-accessible-form', 'stale invalid state', s => s.replace("row.input.removeAttribute('aria-invalid')", '')],
  ['dom-accessible-form', 'innerHTML message', s => s.replace('row.error.textContent = row.field.message', 'row.error.innerHTML = row.field.message')],
  ['dom-accessible-form', 'browser validation left on', s => s.replace('form.noValidate = true', '')],
  ['dom-disclosure', 'div instead of button', s => s.replace("document.createElement('button')", "document.createElement('div')")],
  ['dom-disclosure', 'drop aria-expanded', s => s.replace("button.setAttribute('aria-expanded', String(open))", '')],
  ['dom-disclosure', 'aria-controls mismatch', s => s.replace("'aria-controls', 'details-panel'", "'aria-controls', 'other'")],
  ['dom-disclosure', 'panel not hidden', s => s.replace('panel.hidden = !open', '')],
  ['dom-disclosure', 'ignores initial state', s => s.replace('let open = props.open', 'let open = false')],
  ['dom-disclosure', 'rebuilds button', s => s.replace("button.addEventListener('click', () => { open = !open; apply() })", "button.addEventListener('click', () => { open = !open; const clone = button.cloneNode(true) as HTMLElement; button.replaceWith(clone); apply() })")],
  ['dom-tabs', 'all tabs tabbable', s => s.replace('tab.tabIndex = index === selected ? 0 : -1', 'tab.tabIndex = 0')],
  ['dom-tabs', 'no wrap right', s => s.replace('current === last ? 0 : current + 1', 'Math.min(last, current + 1)')],
  ['dom-tabs', 'no wrap left', s => s.replace('current === 0 ? last : current - 1', 'Math.max(0, current - 1)')],
  ['dom-tabs', 'drop aria-selected', s => s.replace("tab.setAttribute('aria-selected', String(index === selected))", '')],
  ['dom-tabs', 'arrows do not focus', s => s.replace('select(next[event.key], true)', 'select(next[event.key], false)')],
  ['dom-tabs', 'missing labelledby', s => s.replace("panel.setAttribute('aria-labelledby', tab.id)", '')],
  ['dom-tabs', 'no End key', s => s.replace('End: last', 'End: 0')],
  ['dom-tabs', 'no Home key', s => s.replace('Home: 0,', 'Home: last,')],
  ['dom-tabs', 'panels stay visible', s => s.replace('panels[index].hidden = index !== selected', '')],
  ['dom-live-search', 'no aria-live', s => s.replace("status.setAttribute('aria-live', 'polite')", '')],
  ['dom-live-search', 'assertive', s => s.replace("'aria-live', 'polite'", "'aria-live', 'assertive'")],
  ['dom-live-search', 'no empty state', s => s.replace('if (matches.length === 0) list.after(empty)', 'if (false) list.after(empty)')],
  ['dom-live-search', 'plural for one', s => s.replace("(matches.length === 1 ? ' result' : ' results')", "' results'")],
  ['dom-live-search', 'untrimmed query', s => s.replace('input.value.trim().toLowerCase()', 'input.value.toLowerCase()')],
  ['dom-live-search', 'case sensitive', s => s.replace('item.toLowerCase().includes(query)', 'item.includes(query)')],
  ['dom-live-search', 'recreated status', s => s.replace('status.textContent = matches.length', 'status.replaceWith(status.cloneNode()); status.textContent = matches.length')],
  ['dom-live-search', 'no label link', s => s.replace("label.htmlFor = 'item-search'", '')],
  ['dom-live-search', 'lowercased labels', s => s.replace('li.textContent = text', 'li.textContent = text.toLowerCase()')],
  ['dom-live-search', 'html insertion', s => s.replace('li.textContent = text', 'li.innerHTML = text')],
]
test('DOM checks reject common contract mistakes', () => {
  for (const [id, label, mutate] of mutants) {
    const rep = domReps.find(item => item.id === id)
    const code = mutate(domSolutions[id])
    assert.notEqual(code, domSolutions[id], `${id}: mutant "${label}" did not change the solution`)
    assert.ok(failed(rep, code).length > 0, `${id}: mutant "${label}" escaped the checks`)
  }
})
