import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { recallVariants } from '../src/fluency.ts'
import { getJourney, journeys } from '../src/learning.ts'
import { paths } from '../src/path.ts'
import { reps } from '../src/rep.ts'
import { assertMutantsFail } from './helpers/checks.mjs'

const ids = ['stack-trace-missing-field', 'stack-trace-wrong-caller', 'stack-trace-null-lookup']
const reported = {
  'stack-trace-missing-field': [[{ id: '12', name: 'Plato' }]],
  'stack-trace-wrong-caller': [
    ['Engineer', 'Ada'],
    [8, 5],
  ],
  'stack-trace-null-lookup': [[{ id: 't2', ownerId: 'u9' }], [{ id: 'u1', name: 'Bo' }]],
}

test('each error report is what the starter really throws for the reported input', () => {
  for (const id of ids) {
    const rep = reps.find(item => item.id === id)
    const run = new Function(`${compileSolution(rep.starter, rep.functionName)}\nreturn ${rep.functionName}`)()
    let error
    try {
      run(...structuredClone(reported[id]))
    } catch (caught) {
      error = caught
    }
    assert.ok(error, `${id}: the starter should throw for the reported input`)
    const [message, ...frames] = rep.errorReport.split('\n')
    assert.equal(`${error.name}: ${error.message}`, message, `${id}: message`)
    // Function names in the report appear in the real stack, in the same order.
    const named = frames.map(frame => frame.trim().match(/^at ([\w.]+) \(/)?.[1]).filter(Boolean)
    const stack = error.stack.split('\n').slice(1).join('\n')
    let from = 0
    for (const name of named) {
      const at = stack.indexOf(`at ${name} `, from)
      assert.ok(at >= from, `${id}: frame ${name} missing or out of order`)
      from = at
    }
    // Every line number the report cites exists in the starter.
    const lines = rep.starter.split('\n')
    for (const [, line] of rep.errorReport.matchAll(/solution\.ts:(\d+):\d+/g))
      assert.ok(Number(line) <= lines.length && lines[Number(line) - 1].trim(), `${id}: line ${line}`)
  }
})

test('checks reject repairs that only silence the reported crash', () => {
  assertMutantsFail([
    // Guards the second word but still reads the second word as the last, and crashes on an empty name.
    [
      'stack-trace-missing-field',
      'function badgeLabels(people) { return people.map(p => { const parts = p.name.trim().split(" "); return parts[0][0].toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "") + " " + p.id }) }',
    ],
    // Catches the error and prints a placeholder instead of initials.
    [
      'stack-trace-missing-field',
      'function badgeLabels(people) { return people.map(p => { try { const parts = p.name.trim().split(" "); return parts[0][0].toUpperCase() + parts[1][0].toUpperCase() + " " + p.id } catch { return "? " + p.id } }) }',
    ],
    // Clamps the count in padCell and keeps the shifted widths.
    [
      'stack-trace-wrong-caller',
      'function formatRow(cells, widths) { const pad = (t, w) => t + " ".repeat(Math.max(0, w - t.length)); return cells.map((c, i) => pad(c, widths[i + 1])).join(" | ") }',
    ],
    // Uses || so an empty name becomes Unassigned.
    [
      'stack-trace-null-lookup',
      'function ownerNames(tickets, users) { return tickets.map(t => users.find(u => u.id === t.ownerId)?.name || "Unassigned") }',
    ],
    // Handles the missing user but returns an empty label instead of Unassigned.
    [
      'stack-trace-null-lookup',
      'function ownerNames(tickets, users) { return tickets.map(t => { const u = users.find(x => x.id === t.ownerId); return u ? u.name : "" }) }',
    ],
  ])
})

test('the stack-trace journey is placed in Foundations and requires unhinted, delayed recall', () => {
  const journey = journeys.find(item => item.id === 'stack-traces')
  assert.deepEqual([journey.guided, journey.independent, journey.recall], ids)
  assert.equal(recallVariants['stack-traces'][0], journey.recall)
  const stage = paths.find(path => path.id === 'typescript').stages.find(item => item.title === 'Read an error message')
  assert.deepEqual(stage.repIds, ids)
  const day = 86_400_000
  const at = days => new Date(Date.UTC(2026, 0, 1) + days * day).toISOString()
  const record = (repId, days, hintCount = 0) => ({ repId, completedAt: at(days), hintCount })
  const guided = record(journey.guided, 1)
  const independent = record(journey.independent, 2)
  assert.equal(getJourney(journey, [guided, record(journey.independent, 2, 1)], Date.parse(at(6))).stage, 'practising')
  assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 4)], Date.parse(at(6))).stage, 'independent')
  assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 5)], Date.parse(at(6))).stage, 'retained')
})
