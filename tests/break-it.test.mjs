import assert from 'node:assert/strict'
import test from 'node:test'
import { caughtBugs, describeInput, followsRules, formatTries, maxTries, readInput, readTries, readTriesValue } from '../src/break-it.ts'
import { breakItReps } from '../src/break-it-reps.ts'
import { catalogTopic } from '../src/catalog-labels.ts'
import { startCheckRun } from '../src/check-run.ts'
import { compileSolution } from '../src/compile-solution.ts'
import { getAllJourneys } from '../src/learning.ts'
import { paths } from '../src/path.ts'
import { parseBackup } from '../src/portability.ts'
import { reps } from '../src/rep.ts'
import { runBreakIt } from '../src/run-rep.ts'
import { runAsyncRep, runRep } from '../src/runner.ts'
import { breakPageCountTries, referencePageCount } from './fixtures/break-it-solutions.mjs'
import { failedChecks } from './helpers/checks.mjs'

const rep = reps.find(item => item.id === 'break-page-count')
const task = rep.breakIt
const load = code => new Function(`${compileSolution(code, rep.functionName)}\nreturn ${rep.functionName}`)()
const suspect = load(task.suspect)
const contract = load(task.contract)
const variants = Object.fromEntries(task.bugs.map(bug => [bug.id, load(bug.variant)]))
/** A table the page would send: inputs only, before the worker fills in the answers. */
const table = (...inputs) => formatTries(inputs.map(input => ({ input, suspect: '', contract: '', caught: [] })))
// Every input up to 60 items and 12 per page, plus a few large ones near the hunt's limit.
const grid = [
  ...Array.from({ length: 61 }, (_, items) => Array.from({ length: 12 }, (_, index) => [items, index + 1])).flat(),
  [999_999, 1],
  [1_000_000, 1],
  [1_000_000, 3],
  [1_000_000, 1_000_000],
  [999_999, 1_000_000],
]

test('the hunt ships as one Break it rep in the Library, outside every track and journey', () => {
  assert.deepEqual(
    breakItReps.map(item => item.id),
    ['break-page-count'],
  )
  assert.equal(rep.format, 'break')
  assert.equal(catalogTopic(rep), 'Testing with cases')
  assert.ok(!paths.some(path => path.stages.some(stage => stage.repIds.includes(rep.id))))
  assert.ok(!getAllJourneys([], Date.now()).some(({ journey }) => [journey.guided, journey.independent, journey.recall].includes(rep.id)))
})

test('the authored contract agrees with an independent page count', () => {
  for (const [items, perPage] of grid) assert.equal(contract(items, perPage), referencePageCount(items, perPage), `${items}, ${perPage}`)
})

test('each bug is a one-bug variant: it is wrong only where the suspect is, and together they explain every wrong answer', () => {
  const wrong = solve => grid.filter(([items, perPage]) => solve(items, perPage) !== contract(items, perPage)).map(String)
  const suspectWrong = wrong(suspect)
  const variantWrong = Object.fromEntries(Object.entries(variants).map(([id, solve]) => [id, wrong(solve)]))
  for (const [id, inputs] of Object.entries(variantWrong)) {
    assert.ok(inputs.length > 0, `${id} is never wrong`)
    for (const input of inputs) assert.ok(suspectWrong.includes(input), `${id} is wrong at ${input} where the suspect is right`)
  }
  assert.deepEqual([...new Set(Object.values(variantWrong).flat())].sort(), [...suspectWrong].sort())
  // The two bugs never share an input, so one try can catch only one of them.
  assert.deepEqual(
    variantWrong['no-items'].filter(input => variantWrong['full-last-page'].includes(input)),
    [],
  )
  // The authored contract text: no items means no pages, and an exactly full last page is not followed by an empty one.
  assert.ok(variantWrong['no-items'].every(input => input.startsWith('0,')))
  assert.ok(
    variantWrong['full-last-page'].every(input => {
      const [items, perPage] = input.split(',').map(Number)
      return items > perPage && items % perPage === 0
    }),
  )
})

test('the reference table catches both bugs; the starter, weak tables, and red herrings do not', () => {
  assert.deepEqual(failedChecks(breakPageCountTries, rep.id), [])
  assert.deepEqual(failedChecks(rep.starter, rep.id), ['Catches bug 1', 'Catches bug 2'])
  assert.deepEqual(failedChecks(table([7, 3], [1, 1], [5, 5], [23, 10]), rep.id), ['Catches bug 1', 'Catches bug 2'])
  assert.deepEqual(failedChecks(table([0, 5]), rep.id), ['Catches bug 2'])
  assert.deepEqual(failedChecks(table([6, 3]), rep.id), ['Catches bug 1'])
})

test('the worker recomputes every try from its input, crediting a catch only to the bug it exposes', () => {
  const forged = formatTries([
    { input: [7, 3], suspect: '9', contract: '9', caught: ['no-items', 'full-last-page'] },
    { input: [10, 5], suspect: '3', contract: '2', caught: [] },
  ])
  const { results, tries } = runBreakIt(forged, rep)
  assert.deepEqual(tries, [
    { input: [7, 3], suspect: '3', contract: '3', caught: [] },
    { input: [10, 5], suspect: '3', contract: '2', caught: ['full-last-page'] },
  ])
  assert.deepEqual(
    results.map(result => [result.name, result.passed]),
    [
      ['Catches bug 1', false],
      ['Catches bug 2', true],
      ['Every try follows the input rules', true],
    ],
  )
  assert.deepEqual(caughtBugs(task, tries), ['full-last-page'])
})

test('saved inputs outside the contract catch nothing and fail the input-rules check', async () => {
  for (const input of [[5, 0], [-1, 3], [2.5, 1], [1_000_001, 1], [3]]) {
    const saved = formatTries([{ input, suspect: '', contract: '', caught: [] }])
    if (!readTries(saved)) {
      // A non-integer is not a valid saved try at all, so the worker refuses the whole table.
      assert.throws(() => runBreakIt(saved, rep), /could not be read/)
      continue
    }
    const { results, tries } = runBreakIt(saved, rep)
    assert.deepEqual(tries[0].caught, [], String(input))
    assert.equal(results.find(result => result.name === 'Every try follows the input rules')?.passed, false, String(input))
  }
  // The synchronous and asynchronous runners agree, so tests and the worker see the same verdict.
  assert.deepEqual(runRep(breakPageCountTries, rep.id), await runAsyncRep(breakPageCountTries, rep.id))
})

test('the page refuses inputs outside the contract with the rule they break', () => {
  assert.deepEqual(readInput(task, ['10', '5']), { input: [10, 5] })
  assert.deepEqual(readInput(task, [' 0 ', '+1']), { input: [0, 1] })
  assert.deepEqual(readInput(task, ['', '5']), { field: 0, reason: 'Enter a value for items.' })
  assert.deepEqual(readInput(task, ['3', '0']), { field: 1, reason: 'perPage is a whole number ≥ 1.' })
  assert.deepEqual(readInput(task, ['-1', '3']), { field: 0, reason: 'items is a whole number ≥ 0.' })
  for (const text of ['2.5', '1e3', 'ten', '0x10', '9'.repeat(20)])
    assert.deepEqual(readInput(task, [text, '3']), { field: 0, reason: 'items is a whole number ≥ 0.' }, text)
  assert.deepEqual(readInput(task, ['4', '1000001']), { field: 1, reason: 'This hunt takes perPage up to 1,000,000.' })
  assert.ok(followsRules(task, [0, 1]))
  assert.ok(!followsRules(task, [0, 0]))
  assert.equal(describeInput(task, [10, 5]), 'items 10, perPage 5')
})

test('the tries table round-trips as readable JSON, and anything unreadable is reported rather than replaced', () => {
  const tries = readTries(breakPageCountTries)
  assert.equal(formatTries(tries), breakPageCountTries)
  assert.equal(formatTries([]), rep.starter)
  assert.deepEqual(readTries(undefined), [])
  for (const text of ['', 'not json', '{}', '[{"input":[1,1]}]', '[{"input":["1",1],"suspect":"1","contract":"1","caught":[]}]'])
    assert.equal(readTries(text), null, text)
  const tooMany = Array.from({ length: maxTries + 1 }, (_, index) => ({ input: [index, 1], suspect: '', contract: '', caught: [] }))
  assert.equal(readTriesValue(tooMany), null)
  assert.equal(readTriesValue(tooMany.slice(1))?.length, maxTries)
  assert.throws(() => runBreakIt('not json', rep), /could not be read/)
})

test('a hunt draft and a completed hunt pass backup validation unchanged', () => {
  const draft = { plan: 'Try 0 items first.', code: breakPageCountTries, explanation: 'No items still gives one page.', hintCount: 1 }
  const backup = parseBackup(
    JSON.stringify({
      format: 'code-reps-backup',
      version: 1,
      exportedAt: '2026-10-22T10:00:00.000Z',
      learnerStart: null,
      history: [{ ...draft, id: 'hunt-1', repId: rep.id, completedAt: '2026-10-22T10:00:00.000Z' }],
      drafts: { [rep.id]: draft },
    }),
    new Set(reps.map(item => item.id)),
  )
  assert.equal(backup.drafts[rep.id].code, breakPageCountTries)
  assert.equal(backup.history[0].code, breakPageCountTries)
})

test('a check run hands the whole worker reply to its caller, so a hunt can read the recomputed tries', () => {
  const replies = []
  const worker = { postMessage() {}, terminate() {} }
  startCheckRun(breakPageCountTries, rep.id, {
    createWorker: () => worker,
    onResults: (results, reply) => replies.push([results, reply.tries]),
    onError: message => assert.fail(message),
    schedule: () => 1,
    clearTimer() {},
  })
  const reply = runBreakIt(breakPageCountTries, rep)
  worker.onmessage({ data: { ready: true } })
  worker.onmessage({ data: reply })
  assert.deepEqual(replies, [[reply.results, reply.tries]])
})
