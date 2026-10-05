import assert from 'node:assert/strict'
import test from 'node:test'
import { startCheckRun } from '../src/check-run.ts'

function setup(overrides = {}) {
  const results = [], errors = []
  let scheduled, terminated = 0, cleared = 0, sent
  const worker = { onmessage: null, onerror: null, postMessage: message => { sent = message }, terminate: () => { terminated++ } }
  const options = {
    createWorker: () => worker, onResults: value => results.push(value), onError: value => errors.push(value),
    schedule: (callback, ms) => { assert.equal(ms, 5000); scheduled = callback; return 1 },
    clearTimer: id => { assert.equal(id, 1); cleared++ }, ...overrides,
  }
  const cancel = startCheckRun('saved solution', 'rep-id', options)
  return { worker, cancel, results, errors, timeout: () => scheduled(), counts: () => ({ terminated, cleared }), sent: () => sent }
}

test('a successful check run publishes once and releases its worker and timer', () => {
  const run = setup()
  assert.deepEqual(run.sent(), { code: 'saved solution', repId: 'rep-id' })
  const results = [{ name: 'Example', passed: true }]
  run.worker.onmessage({ data: { results } })
  run.worker.onmessage({ data: { results: [] } })
  run.timeout()
  assert.deepEqual(run.results, [results])
  assert.deepEqual(run.errors, [])
  assert.deepEqual(run.counts(), { terminated: 1, cleared: 1 })
})

test('stopped or superseded runs cannot publish late results or errors', () => {
  const run = setup()
  run.cancel(); run.cancel()
  run.worker.onmessage({ data: { results: [{ name: 'Old code', passed: true }] } })
  run.worker.onerror()
  run.timeout()
  assert.deepEqual(run.results, [])
  assert.deepEqual(run.errors, [])
  assert.deepEqual(run.counts(), { terminated: 1, cleared: 1 })
})

test('timeout terminates an endless run and ignores late feedback', () => {
  const run = setup()
  run.timeout()
  run.worker.onmessage({ data: { results: [] } })
  assert.equal(run.results.length, 0)
  assert.match(run.errors[0], /endless loop/)
  assert.deepEqual(run.counts(), { terminated: 1, cleared: 1 })
})

test('worker execution errors are reported with code-preserving recovery', () => {
  const run = setup()
  run.worker.onerror()
  assert.match(run.errors[0], /code is still here/)
  assert.deepEqual(run.counts(), { terminated: 1, cleared: 1 })
})

test('worker construction and message-send failures do not leave a run active', () => {
  const construction = setup({ createWorker: () => { throw new Error('unavailable') } })
  assert.match(construction.errors[0], /could not start/)
  const worker = { onmessage: null, onerror: null, postMessage: () => { throw new Error('send failed') }, terminate: () => { worker.terminated = true } }
  const send = setup({ createWorker: () => worker })
  assert.match(send.errors[0], /could not start/)
  assert.equal(worker.terminated, true)
  assert.equal(send.counts().cleared, 1)
})

test('authored runner errors appear once without being treated as successful checks', () => {
  const run = setup()
  run.worker.onmessage({ data: { error: 'Define the expected function.' } })
  assert.deepEqual(run.errors, ['Define the expected function.'])
  assert.deepEqual(run.results, [])
})

test('malformed worker replies report recovery and never publish check evidence', () => {
  for (const data of [null, undefined, 'done', {}, { error: '' }, { error: 42 },
    { results: null }, { results: {} }, { results: [null] }, { results: new Array(1) },
    { results: [{ name: 'Example', passed: 'true' }] },
    { results: [{ name: 'Example', passed: true, actual: {} }] }]) {
    const run = setup()
    run.worker.onmessage({ data })
    run.worker.onmessage({ data: { results: [{ name: 'Late', passed: true }] } })
    run.timeout()
    assert.deepEqual(run.results, [])
    assert.equal(run.errors.length, 1)
    assert.match(run.errors[0], /could not be read.*code is still here/)
    assert.deepEqual(run.counts(), { terminated: 1, cleared: 1 })
  }
})

test('unreadable worker messages release resources and cancelled runs ignore them', () => {
  const run = setup()
  run.worker.onmessageerror()
  run.worker.onerror()
  run.timeout()
  assert.equal(run.errors.length, 1)
  assert.match(run.errors[0], /could not be read/)
  assert.deepEqual(run.counts(), { terminated: 1, cleared: 1 })

  const cancelled = setup()
  cancelled.cancel()
  cancelled.worker.onmessageerror()
  assert.deepEqual(cancelled.errors, [])
  assert.deepEqual(cancelled.counts(), { terminated: 1, cleared: 1 })
})

test('structured failed-check feedback is preserved', () => {
  const run = setup()
  const results = [{ name: 'Boundary', passed: false, input: '[]', expected: '0', actual: '1', message: 'Compare the empty case.' }]
  run.worker.onmessage({ data: { results } })
  assert.deepEqual(run.results, [results])
  assert.deepEqual(run.errors, [])
})
