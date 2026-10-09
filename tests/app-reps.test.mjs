import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'
import { appReps } from '../src/app-reps.ts'
import { appSolutions } from './fixtures/app-solutions.mjs'

test('app reps all have an independent reference solution', () => {
  assert.deepEqual(appReps.map(rep => rep.id).sort(), Object.keys(appSolutions).sort())
})

test('app rep checks reject common contract mistakes', () => {
  const s = appSolutions
  const mutants = [
    ['frontend-sort-table', s['frontend-sort-table'].replace('rows.map(', 'rows.map(').replace('return keyed.map(item => item.row)', 'return direction === "desc" ? keyed.map(item => item.row) : keyed.map(item => item.row)').replace('a.index - b.index', 'sign * (a.index - b.index)')],
    ['frontend-sort-table', s['frontend-sort-table'].replace('row.name.toLowerCase()', 'row.name')],
    ['frontend-sort-table', s['frontend-sort-table'].replace('const keyed = rows.map', 'rows.sort(() => 0); const keyed = rows.map').replace('rows.map((row, index)', 'rows.reverse().map((row, index)')],
    ['frontend-sort-table', s['frontend-sort-table'].replace('row.qty}', 'String(row.qty)}')],
    ['frontend-form-errors', s['frontend-form-errors'].replace("else if (!/^[0-9]+$/.test(age)) errors.age = 'Age must be a whole number'\n  else if", 'else if')],
    ['frontend-form-errors', s['frontend-form-errors'].replace("const age = values.age.trim()", "const age = values.age")],
    ['frontend-form-errors', s['frontend-form-errors'].replace('name.length > 20', 'name.length >= 20')],
    ['frontend-form-errors', s['frontend-form-errors'].replace('parts.length !== 2', 'parts.length < 2')],
    ['frontend-pagination-controls', s['frontend-pagination-controls'].replace('if (gap === 2) out.push(n - 1)\n      else if (gap > 2)', 'if (gap > 1)')],
    ['frontend-pagination-controls', s['frontend-pagination-controls'].replace('Math.min(total, Math.max(1, current))', 'current')],
    ['backend-query-filters', s['backend-query-filters'].replace("return v.trim() === '' ? null : v.trim()", 'return v.trim()')],
    ['backend-query-filters', s['backend-query-filters'].replace('limitValue < 1', 'limitValue < 0')],
    ['backend-query-filters', s['backend-query-filters'].replace("if (typeof v !== 'string') return undefined", "if (typeof v !== 'string') return null")],
    ['backend-query-filters', s['backend-query-filters'].replace("tag === null ? null : tag.toLowerCase()", 'tag')],
    ['backend-rate-limit', s['backend-rate-limit'].replace('t >= start && t <= now', 't > now - windowMs && t <= now')],
    ['backend-rate-limit', s['backend-rate-limit'].replace('t >= start && t <= now', 't >= start')],
    ['backend-rate-limit', s['backend-rate-limit'].replace('t >= start &&', 't > start &&')],
    ['backend-rate-limit', s['backend-rate-limit'].replace('count < limit', 'count <= limit')],
    ['backend-error-response', s['backend-error-response'].replace("Object.hasOwn(error, 'code')", "'code' in error").replace("known.get(code)", "({toString: [418, 'x']} as any)[code] ?? known.get(code)")],
    ['backend-error-response', s['backend-error-response'].replace("message: entry[1]", "message: (error as any).message ?? entry[1]")],
    ['backend-error-response', s['backend-error-response'].replace("typeof code === 'string' ? known.get(code) : undefined", "known.get(String(code).toUpperCase())")],
  ]
  for (const [index, [id, code]] of mutants.entries()) assert.ok(runRep(code, id).some(result => !result.passed), `mutant ${index} of ${id} escaped the checks`)
})

test('app reps are not solved by their starter code', () => {
  for (const rep of appReps) assert.ok(runRep(rep.starter, rep.id).some(result => !result.passed), `${rep.id}: starter passes`)
})

test('journey app reps reject common contract mistakes', () => {
  const s = appSolutions
  const mutants = [
    ['group-items-by-heading', s['group-items-by-heading'].replace('item.heading.trim()', 'item.heading.trim().toLowerCase()')],
    ['group-items-by-heading', s['group-items-by-heading'].replace('if (!heading) continue', '')],
    ['filter-chip-summary', s['filter-chip-summary'].replace('seen.has(name.toLowerCase())', 'seen.has(name)').replace('seen.add(name.toLowerCase())', 'seen.add(name)')],
    ['filter-chip-summary', s['filter-chip-summary'].replace('distinct.length - maxChips', 'selected.length - maxChips')],
    ['parse-sort-param', s['parse-sort-param'].replace("if (!text) return {ok: true, sort: {field: 'title', direction: 'asc'}}", "if (!text) return {ok: false, error: 'INVALID_SORT'}")],
    ['parse-sort-param', s['parse-sort-param'].replace("fields.includes(field)", "fields.includes(field.toLowerCase())")],
    ['page-response-envelope', s['page-response-envelope'].replace('Math.ceil(totalItems / pageSize)', 'Math.floor(totalItems / pageSize)')],
    ['page-response-envelope', s['page-response-envelope'].replace('page < totalPages ? link(page + 1)', 'true ? link(page + 1)')],
  ]
  for (const [index, [id, code]] of mutants.entries()) assert.ok(runRep(code, id).some(result => !result.passed), `mutant ${index} of ${id} escaped the checks`)
})
