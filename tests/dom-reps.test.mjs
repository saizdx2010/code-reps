import assert from 'node:assert/strict'
import test from 'node:test'
import { domReps } from '../src/dom-reps.ts'
import { reps } from '../src/rep.ts'
import { reflectionGuides } from '../src/reflection-guides.ts'
import { repDepth } from '../src/rep-depth.ts'
import { domSolutions } from './fixtures/dom-solutions.mjs'
import { frameFailures, runFrame } from './helpers/frame.mjs'

const failed = (rep, code) => frameFailures(code, rep)

test('DOM reps are registered, complete, and have independent reference solutions', () => {
  assert.deepEqual(domReps.map(rep => rep.id).sort(), Object.keys(domSolutions).sort())
  for (const rep of domReps) {
    assert.ok(reps.includes(rep), rep.id)
    assert.equal(rep.format, 'frontend')
    assert.ok(rep.hints.length >= 1 && rep.hints.length <= 3, rep.id)
    assert.ok(
      rep.hints.every(hint => !/[{}`]|=>|\w\(\)|document\./.test(hint)),
      `${rep.id}: hints must not contain code`,
    )
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
    const { value: rendered } = runFrame(
      domSolutions[rep.id],
      rep,
      { mode: 'preview' },
      window => window.document.querySelector('#exercise-root').children.length,
    )
    assert.ok(rendered > 0, rep.id)
  }
})

const mutants = [
  ['dom-form-fields', 'browser validation left on', s => s.replace('form.noValidate = true', '')],
  ['dom-form-fields', 'no label link', s => s.replace('label.htmlFor = field.id', '')],
  ['dom-form-fields', 'label as html', s => s.replace('label.textContent = field.label', 'label.innerHTML = field.label')],
  ['dom-form-errors', 'drop aria-describedby', s => s.replace("row.input.setAttribute('aria-describedby', row.error.id)", '')],
  ['dom-form-errors', 'wrong error id', s => s.replace("row.error.id = row.field.id + '-error'", 'row.error.id = row.field.id')],
  ['dom-form-errors', 'untrimmed validation', s => s.replace("row.input.value.trim() === ''", "row.input.value === ''")],
  ['dom-form-errors', 'stale invalid state', s => s.replace("row.input.removeAttribute('aria-invalid')", '')],
  ['dom-form-errors', 'duplicate errors', s => s.replace('if (!row.error) {', 'if (true) {')],
  ['dom-form-submit', 'focus last invalid', s => s.replace('if (invalid && !first) first = row.input', 'if (invalid) first = row.input')],
  ['dom-form-submit', 'no focus', s => s.replace('first.focus()', '')],
  ['dom-form-submit', 'status left after problem', s => s.replace('status.remove(); first.focus()', 'first.focus()')],
  ['dom-form-submit', 'no success status', s => s.replace("status.textContent = 'Form accepted.'", "status.textContent = ''")],
  ['dom-accessible-form', 'drop aria-describedby', s => s.replace("row.input.setAttribute('aria-describedby', row.error.id)", '')],
  ['dom-accessible-form', 'wrong error id', s => s.replace("row.error.id = row.field.id + '-error'", 'row.error.id = row.field.id')],
  ['dom-accessible-form', 'no label link', s => s.replace('label.htmlFor = field.id', '')],
  [
    'dom-accessible-form',
    'focus last invalid',
    s => s.replace('if (invalid && !first) first = row.input', 'if (invalid) first = row.input'),
  ],
  ['dom-accessible-form', 'no focus', s => s.replace('first.focus()', '')],
  ['dom-accessible-form', 'untrimmed validation', s => s.replace("row.input.value.trim() === ''", "row.input.value === ''")],
  ['dom-accessible-form', 'stale invalid state', s => s.replace("row.input.removeAttribute('aria-invalid')", '')],
  [
    'dom-accessible-form',
    'innerHTML message',
    s => s.replace('row.error.textContent = row.field.message', 'row.error.innerHTML = row.field.message'),
  ],
  ['dom-accessible-form', 'browser validation left on', s => s.replace('form.noValidate = true', '')],
  ['dom-disclosure', 'div instead of button', s => s.replace("document.createElement('button')", "document.createElement('div')")],
  ['dom-disclosure', 'drop aria-expanded', s => s.replace("button.setAttribute('aria-expanded', String(open))", '')],
  ['dom-disclosure', 'aria-controls mismatch', s => s.replace("'aria-controls', 'details-panel'", "'aria-controls', 'other'")],
  ['dom-disclosure', 'panel not hidden', s => s.replace('panel.hidden = !open', '')],
  ['dom-disclosure', 'ignores initial state', s => s.replace('let open = props.open', 'let open = false')],
  [
    'dom-disclosure',
    'rebuilds button',
    s =>
      s.replace(
        "button.addEventListener('click', () => { open = !open; apply() })",
        "button.addEventListener('click', () => { open = !open; const clone = button.cloneNode(true) as HTMLElement; button.replaceWith(clone); apply() })",
      ),
  ],
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
  [
    'dom-live-search',
    'recreated status',
    s => s.replace('status.textContent = matches.length', 'status.replaceWith(status.cloneNode()); status.textContent = matches.length'),
  ],
  ['dom-live-search', 'no label link', s => s.replace("label.htmlFor = 'item-search'", '')],
  ['dom-live-search', 'lowercased labels', s => s.replace('li.textContent = text', 'li.textContent = text.toLowerCase()')],
  ['dom-live-search', 'html insertion', s => s.replace('li.textContent = text', 'li.innerHTML = text')],
  ['dom-accordion', 'div instead of button', s => s.replace("document.createElement('button')", "document.createElement('div')")],
  ['dom-accordion', 'drop aria-expanded', s => s.replace("part.header.setAttribute('aria-expanded', String(isOpen))", '')],
  ['dom-accordion', 'panels stay visible', s => s.replace('part.panel.hidden = !isOpen', '')],
  [
    'dom-accordion',
    'several sections open',
    s =>
      s
        .replace(
          'current = current === section.id ? null : section.id; apply()',
          'section.open = !section.open; current = section.id; apply()',
        )
        .replace('const isOpen = part.section.id === current', 'const isOpen = part.section.id === current || part.section.open === true'),
  ],
  ['dom-accordion', 'open header cannot close', s => s.replace('current === section.id ? null : section.id', 'section.id')],
  ['dom-accordion', 'region role missing', s => s.replace("panel.setAttribute('role', 'region')", '')],
  [
    'dom-accordion',
    'labelledby mismatch',
    s => s.replace("panel.setAttribute('aria-labelledby', header.id)", "panel.setAttribute('aria-labelledby', panel.id)"),
  ],
  [
    'dom-accordion',
    'rebuilds headers',
    s =>
      s.replace(
        'current = current === section.id ? null : section.id; apply()',
        'current = current === section.id ? null : section.id; const clone = header.cloneNode(true) as HTMLElement; header.replaceWith(clone); apply()',
      ),
  ],
  ['dom-accordion', 'html insertion', s => s.replace('panel.textContent = section.content', 'panel.innerHTML = section.content')],
  ['dom-reorder-list', 'focus not restored', s => s.replace('    target.focus()\n', '')],
  [
    'dom-reorder-list',
    'focus stays on a disabled button',
    s => s.replace("row[clicked].disabled ? row[clicked === 'up' ? 'down' : 'up'] : row[clicked]", 'row[clicked]'),
  ],
  ['dom-reorder-list', 'first item can move up', s => s.replace('row.up.disabled = index === 0', 'row.up.disabled = false')],
  [
    'dom-reorder-list',
    'no status message',
    s => s.replace("status.textContent = item.label + ' moved to position '", "status.textContent = '' + ' moved to position '"),
  ],
  ['dom-reorder-list', 'generic button names', s => s.replace("'Move ' + item.label + ' up'", "'Move up'")],
  ['dom-reorder-list', 'html labels', s => s.replace('name.textContent = item.label', 'name.innerHTML = item.label')],
  [
    'dom-modal-dialog',
    'focus not returned',
    s => s.replace('    result.textContent = message\n    open.focus()', '    result.textContent = message'),
  ],
  ['dom-modal-dialog', 'no initial focus', s => s.replace('    dialog.hidden = false\n    confirm.focus()', '    dialog.hidden = false')],
  [
    'dom-modal-dialog',
    'Tab escapes the dialog',
    s => s.replace("event.key === 'Tab' && !event.shiftKey", "event.key === 'Tab ' && !event.shiftKey"),
  ],
  [
    'dom-modal-dialog',
    'Shift+Tab escapes the dialog',
    s => s.replace("event.key === 'Tab' && event.shiftKey", "event.key === 'Tab ' && event.shiftKey"),
  ],
  ['dom-modal-dialog', 'Escape ignored', s => s.replace("event.key === 'Escape'", "event.key === 'Esc'")],
  ['dom-modal-dialog', 'not modal', s => s.replace("dialog.setAttribute('aria-modal', 'true')", '')],
  ['dom-modal-dialog', 'one result for every close', s => s.replace("close('Confirmed.')", "close('Cancelled.')")],
  [
    'dom-combobox',
    'contains instead of starts with',
    s => s.replace('option.toLowerCase().startsWith(query)', 'option.toLowerCase().includes(query)'),
  ],
  ['dom-combobox', 'case-sensitive matching', s => s.replace('option.toLowerCase().startsWith(query)', 'option.startsWith(query)')],
  [
    'dom-combobox',
    'no active descendant',
    s =>
      s.replace(
        "input.setAttribute('aria-activedescendant', 'option-' + matches[active])",
        "input.removeAttribute('aria-activedescendant')",
      ),
  ],
  [
    'dom-combobox',
    'no wrap',
    s => s.replace('(active + step + matches.length) % matches.length', 'Math.min(matches.length - 1, Math.max(0, active + step))'),
  ],
  [
    'dom-combobox',
    'Escape clears the text',
    s =>
      s.replace(
        'event.preventDefault()\n      close()\n    }\n  })',
        "event.preventDefault()\n      input.value = ''\n      close()\n    }\n  })",
      ),
  ],
  ['dom-combobox', 'stays open when empty', s => s.replace('open = matches.length > 0', 'open = true')],
  [
    'dom-combobox',
    'typing keeps the active option',
    s => s.replace('    active = -1\n    open = matches.length > 0', '    open = matches.length > 0'),
  ],
]
test('DOM checks reject common contract mistakes', () => {
  for (const [id, label, mutate] of mutants) {
    const rep = domReps.find(item => item.id === id)
    const code = mutate(domSolutions[id])
    assert.notEqual(code, domSolutions[id], `${id}: mutant "${label}" did not change the solution`)
    assert.ok(failed(rep, code).length > 0, `${id}: mutant "${label}" escaped the checks`)
  }
})
