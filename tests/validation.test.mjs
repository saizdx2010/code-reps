import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'
import { journeys, getJourney } from '../src/learning.ts'
import { recurringReviews } from '../src/fluency.ts'
import { validationSolutions } from './fixtures/validation-solutions.mjs'

test('validation checks reject coercion, changed precedence, partial output, and mutation', () => {
  const mutants = [
    ['validate-stock-adjustment', validationSolutions['validate-stock-adjustment'].replace("typeof row.change !== 'number'", 'false').replace('const sku =', 'row.change = Number(row.change); const sku =')],
    ['validate-stock-adjustment', validationSolutions['validate-stock-adjustment'].replace('row.change === 0 || ', '')],
    ['validate-stock-adjustment', validationSolutions['validate-stock-adjustment'].replace('return {sku, change: row.change}', 'row.sku = sku; return {sku, change: row.change}')],
    ['parse-delivery-window', validationSolutions['parse-delivery-window'].replace('request.minutes === undefined ? 20 : request.minutes', 'request.minutes || 20')],
    ['parse-delivery-window', validationSolutions['parse-delivery-window'].replace('request.minutes === undefined ? 20 : request.minutes', 'request.minutes ?? 20')],
    ['parse-delivery-window', validationSolutions['parse-delivery-window'].replace("if (request.mode === 'delivery')", 'if (true)')],
    ['parse-delivery-window', validationSolutions['parse-delivery-window'].replace("if (address.length < 1 || address.length > 80) return fail('INVALID_ADDRESS')", "if (address.length < 1 || address.length > 80) return fail('INVALID_MINUTES')")],
    ['validate-import-batch', validationSolutions['validate-import-batch'].replace('row.id.trim().toLowerCase()', 'row.id.trim()')],
    ['validate-import-batch', validationSolutions['validate-import-batch'].replace("return {ok: false, index, error: 'INVALID_ROW'}", 'return {ok: true, rows}')],
    ['validate-import-batch', validationSolutions['validate-import-batch'].replace('rows.push({id, amount: row.amount})', 'row.id = id; rows.push({id, amount: row.amount})')],
  ]
  for (const [id, code] of mutants) assert.ok(runRep(code, id).some(result => !result.passed), `${id}: incorrect solution escaped authored checks`)
})

test('validation evidence requires ordered, unhinted independent work and a distinct delayed recall', () => {
  const journey = journeys.find(journey => journey.id === 'validation')
  const day = n => new Date(Date.UTC(2026, 9, n)).toISOString()
  const record = (repId, n, hintCount = 0) => ({id: `${repId}-${n}`, repId, completedAt: day(n), hintCount, plan: 'plan', code: 'code', explanation: 'explanation', confidence: 'confident', difficulty: 'none'})
  const guided = record(journey.guided, 1)
  const independent = record(journey.independent, 2)
  const at = n => Date.parse(day(n))
  assert.equal(getJourney(journey, [independent], at(6)).stage, 'learning')
  assert.equal(getJourney(journey, [guided, record(journey.independent, 2, 1)], at(6)).stage, 'practising')
  assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 4)], at(6)).stage, 'independent')
  assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 5, 1)], at(6)).stage, 'independent')
  const retained = [guided, independent, record(journey.recall, 5)]
  assert.equal(getJourney(journey, retained, at(6)).stage, 'retained')
  const review = recurringReviews(retained, at(12)).find(review => review.skillId === 'validation')
  assert.equal(review.repId, 'validate-import-batch')
  assert.equal(review.due, true)
  const completed = recurringReviews([...retained, record(review.repId, 12)], at(13)).find(review => review.skillId === 'validation')
  assert.equal(completed.repId, journey.recall)
  assert.equal(completed.interval, 14)
})
