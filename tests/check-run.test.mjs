import assert from 'node:assert/strict'
import test from 'node:test'
import { startCheckRun } from '../src/check-run.ts'

function setup(overrides = {}) {
  const results = [],
    errors = []
  let scheduled,
    terminated = 0,
    cleared = 0,
    sent
  const worker = {
    onmessage: null,
    onerror: null,
    postMessage: message => {
      sent = message
    },
    terminate: () => {
      terminated++
    },
  }
  const options = {
    createWorker: () => worker,
    onResults: value => results.push(value),
    onError: value => errors.push(value),
    schedule: (callback, ms) => {
      assert.equal(ms, delays.length ? 5000 : 30000)
      delays.push(ms)
      scheduled = callback
      return 1
    },
    clearTimer: id => {
      assert.equal(id, 1)
      cleared++
    },
    ...overrides,
  }
  const delays = []
  const cancel = startCheckRun('saved solution', 'rep-id', options)
  // The worker reports that it has loaded before the five-second check limit begins; the load allowance is cleared.
  worker.onmessage?.({ data: { ready: true } })
  if (delays.length === 2) cleared = 0
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
  run.cancel()
  run.cancel()
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
  const construction = setup({
    createWorker: () => {
      throw new Error('unavailable')
    },
  })
  assert.match(construction.errors[0], /could not start/)
  const worker = {
    onmessage: null,
    onerror: null,
    postMessage: () => {
      throw new Error('send failed')
    },
    terminate: () => {
      worker.terminated = true
    },
  }
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
  for (const data of [
    null,
    undefined,
    'done',
    {},
    { error: '' },
    { error: 42 },
    { results: null },
    { results: {} },
    { results: [null] },
    { results: new Array(1) },
    { results: [{ name: 'Example', passed: 'true' }] },
    { results: [{ name: 'Example', passed: true, actual: {} }] },
  ]) {
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

test('SQLite comparison tables and located errors pass through; malformed or oversized ones are refused', () => {
  const side = { columns: ['name', 'total'], total: 3, before: 0, after: 0, rows: [{ n: 1, cells: ['Di', 450], wrong: [[1, 500]] }] }
  const table = {
    label: 'Rows',
    ordered: true,
    expected: { ...side, rows: [{ n: 1, cells: ['Di', 500] }] },
    received: { ...side, rows: [...side.rows, { n: 2, cells: ['Cy', null], mark: 'extra' }] },
    totals: { expected: 3, received: 4 },
    first: 'First difference: row 1, total — expected 500, received 450.',
  }
  const sqlError = { message: 'near "FORM": syntax error', line: 2, column: 1, source: 'FORM customers', length: 4 }
  const run = setup()
  const results = [{ name: 'Rows', passed: false, message: 'Some values differ.', tables: [table], sqlError, plan: ['SCAN users'] }]
  run.worker.onmessage({ data: { results } })
  assert.deepEqual(run.results, [results])
  const unread = setup()
  unread.worker.onmessage({ data: { results: [{ name: 'Rows', passed: false, tables: [{ ...table, expected: null }] }] } })
  assert.equal(unread.results.length, 1)
  for (const bad of [
    { tables: [{ ...table, expected: { ...side, rows: [{ n: 1, cells: [{ nested: true }] }] } }] },
    { tables: [{ ...table, received: { ...side, rows: Array.from({ length: 41 }, (_, n) => ({ n, cells: [] })) } }] },
    { tables: [{ ...table, received: { ...side, rows: [{ n: 1, cells: [], mark: 'odd' }] } }] },
    { tables: [{ ...table, received: { ...side, columns: [1] } }] },
    { tables: [{ ...table, totals: undefined }] },
    { tables: [{ ...table, label: undefined }] },
    { tables: [{ ...table, ordered: 'yes' }] },
    { sqlError: { line: 2 } },
    { plan: 'SCAN users' },
    { plan: [1] },
    { sqlError: { message: 'x', column: -1 } },
  ]) {
    const broken = setup()
    broken.worker.onmessage({ data: { results: [{ name: 'Rows', passed: false, ...bad }] } })
    assert.deepEqual(broken.results, [])
    assert.match(broken.errors[0], /could not be read/)
  }
})

test('a SQLite run reports when its engine has loaded', () => {
  let ready = 0
  const worker = { onmessage: null, onerror: null, postMessage() {}, terminate() {} }
  startCheckRun('code', 'rep-id', {
    createWorker: () => worker,
    onResults() {},
    onError() {},
    schedule: () => 1,
    clearTimer() {},
    usesSqlite: true,
    onReady: () => ready++,
  })
  assert.equal(ready, 0)
  worker.onmessage({ data: { ready: true } })
  assert.equal(ready, 1)
})

test('the SQLite rep gets a separate load allowance, then the usual five seconds after the engine is ready', () => {
  const delays = [],
    errors = []
  let callback
  const worker = { onmessage: null, onerror: null, postMessage() {}, terminate() {} }
  startCheckRun('code', 'sqlite-stock-transfer', {
    createWorker: () => worker,
    onResults() {},
    onError: value => errors.push(value),
    schedule: (run, ms) => {
      delays.push(ms)
      callback = run
      return 1
    },
    clearTimer() {},
    usesSqlite: true,
  })
  worker.onmessage({ data: { ready: true } })
  assert.deepEqual(delays, [30000, 5000])
  callback()
  assert.match(errors[0], /took too long/)
})

test('every rep gets a load allowance, so a slow worker start is not reported as an endless loop', () => {
  const delays = [],
    errors = []
  let callback
  const worker = { onmessage: null, onerror: null, postMessage() {}, terminate() {} }
  startCheckRun('code', 'rep-id', {
    createWorker: () => worker,
    onResults() {},
    onError: value => errors.push(value),
    schedule: (run, ms) => {
      delays.push(ms)
      callback = run
      return 1
    },
    clearTimer() {},
  })
  assert.deepEqual(delays, [30000])
  callback()
  assert.match(errors[0], /could not load in time.*code is still here/)
})

test('a run names the rep content chunk, so the worker loads only that chunk', () => {
  const run = setup({ source: 'sql-reps' })
  try {
    assert.deepEqual(run.sent(), { code: 'saved solution', repId: 'rep-id', source: 'sql-reps' })
  } finally {
    run.cancel()
  }
})
