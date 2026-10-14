import test from 'node:test'
import assert from 'node:assert/strict'
import { runAsyncRep, runRep } from '../src/runner.ts'
import { asyncSolutions } from './fixtures/async-solutions.mjs'
import { getJourney, journeys } from '../src/learning.ts'

const failures = async (id, code) => (await runAsyncRep(code, id)).filter(result => !result.passed)
for (const id of ['await-local-records', 'settle-local-panels', 'cancel-local-export']) {
  test(`runtime reference and repeat-run isolation: ${id}`, async () => {
    assert.deepEqual(await failures(id, asyncSolutions[id]), [])
    assert.deepEqual(await failures(id, asyncSolutions[id]), [])
    assert.throws(() => runRep(asyncSolutions[id], id), /asynchronous fixture runner/)
  })
}
test('runtime awaits ordinary Promise-returning functions too', async () => {
  assert.ok(
    (await runAsyncRep('async function countVisible(items) { return items.filter(x => x.active).length }', 'repair-visible-count')).every(
      result => result.passed,
    ),
  )
})
test('parallel results may use Promise.all with individually caught failures', async () => {
  const code = `async function loadPanels(ids, fixture) {
    try { return await Promise.all(ids.map(id => fixture.fetch(id).then(value => ({status:'ready', value}), error => ({status:'error', message:error.message})))) }
    finally { fixture.release() }
  }`
  assert.deepEqual(await failures('settle-local-panels', code), [])
})
const wrong = [
  [
    'await-local-records',
    asyncSolutions['await-local-records'].replace('values.push(await fixture.fetch(id))', 'values.push(fixture.fetch(id))'),
  ],
  [
    'settle-local-panels',
    `async function loadPanels(ids, fixture) { try { const out=[]; for(const id of ids) { try { out.push({status:'ready',value:await fixture.fetch(id)}) } catch(e) { out.push({status:'error',message:e.message}) } } return out } finally { fixture.release() } }`,
  ],
  ['settle-local-panels', asyncSolutions['settle-local-panels'].replace('Promise.allSettled', 'Promise.all')],
  ['cancel-local-export', asyncSolutions['cancel-local-export'].replace('fixture.fetch(id, fixture.signal)', 'fixture.fetch(id)')],
  ['cancel-local-export', asyncSolutions['cancel-local-export'].replace("if (fixture.signal.aborted) return {status: 'cancelled'}", '')],
  ['cancel-local-export', asyncSolutions['cancel-local-export'].replace('fixture.release()', '')],
  ['cancel-local-export', asyncSolutions['cancel-local-export'].replace('try {', 'fixture.release(); try {')],
  ['await-local-records', asyncSolutions['await-local-records'].replace('return values', 'ids.reverse(); return values')],
]
for (const [index, [id, code]] of wrong.entries())
  test(`runtime checks reject misconception ${index + 1}: ${id}`, async () => {
    assert.ok((await failures(id, code)).length)
  })
test('runtime journey rejects hinted independence and early or hinted recall', () => {
  const journey = journeys.find(item => item.id === 'async')
  const record = (repId, day, hintCount = 0) => ({ repId, completedAt: `2026-10-0${day}T00:00:00Z`, hintCount })
  const guided = record(journey.guided, 1)
  const independent = record(journey.independent, 2)
  const now = Date.parse('2026-10-07T00:00:00Z')
  assert.equal(getJourney(journey, [guided, { ...independent, hintCount: 1 }], now).stage, 'practising')
  assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 4)], now).stage, 'independent')
  assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 5, 1)], now).stage, 'independent')
  assert.equal(getJourney(journey, [guided, independent, record(journey.recall, 5)], now).stage, 'retained')
})
