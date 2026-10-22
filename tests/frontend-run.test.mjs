import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { startFrontendRun } from '../src/frontend-run.ts'
import { compileSolution } from '../src/compile-solution.ts'
import { richReps } from '../src/rich-reps.ts'

const rep = richReps.find(item => item.format === 'frontend')
function setup() {
  const dom = new JSDOM('<!doctype html><body></body>')
  const window = dom.window
  let timeout
  window.setTimeout = callback => {
    timeout = callback
    return 1
  }
  window.clearTimeout = () => {}
  const results = [],
    errors = []
  const cancel = startFrontendRun(
    rep.starter,
    rep,
    value => results.push(value),
    value => errors.push(value),
    {
      document: window.document,
      window,
      token: 'correct-token',
      // The app compiles in the practice worker; Node has no Worker, so this compiles synchronously.
      compile: (code, item) => compileSolution(code, item.functionName, item.reactPreview, { guardLoops: true }),
    },
  )
  const frame = window.document.querySelector('iframe')
  const send = (data, source = frame.contentWindow) => window.dispatchEvent(new window.MessageEvent('message', { source, data }))
  return { dom, window, frame, send, cancel, results, errors, timeout: () => timeout() }
}

test('frontend transport accepts only the matching frame and token, then cleans up', () => {
  const run = setup()
  try {
    assert.equal(run.frame.getAttribute('sandbox'), 'allow-scripts')
    assert.equal(run.frame.getAttribute('aria-hidden'), 'true')
    assert.equal(run.frame.tabIndex, -1)
    const results = rep.checks.map(check => ({ name: check.name, passed: true }))
    run.send({ token: 'correct-token', results }, run.window)
    run.send({ token: 'wrong-token', results })
    assert.equal(run.results.length, 0)
    run.send({ token: 'correct-token', results })
    assert.deepEqual(run.results, [results])
    assert.equal(run.window.document.querySelector('iframe'), null)
  } finally {
    run.cancel()
    run.dom.window.close()
  }
})

test('cancelled frontend checks ignore late messages and timeouts', () => {
  const run = setup()
  try {
    const source = run.frame.contentWindow
    run.cancel()
    run.send({ token: 'correct-token', error: 'Old run' }, source)
    run.timeout()
    assert.deepEqual(run.errors, [])
    assert.deepEqual(run.results, [])
    assert.equal(run.window.document.querySelector('iframe'), null)
  } finally {
    run.dom.window.close()
  }
})

test('frontend timeout and malformed feedback yield recoverable errors', () => {
  const timed = setup()
  try {
    timed.timeout()
    assert.match(timed.errors[0], /did not finish/)
    assert.equal(timed.window.document.querySelector('iframe'), null)
  } finally {
    timed.dom.window.close()
  }
  const malformed = setup()
  try {
    malformed.send({ token: 'correct-token', results: [] })
    assert.match(malformed.errors[0], /incomplete feedback/)
  } finally {
    malformed.cancel()
    malformed.dom.window.close()
  }
})

function frameless(compile) {
  const dom = new JSDOM('<!doctype html><body></body>')
  const errors = []
  const cancel = startFrontendRun(
    rep.starter,
    rep,
    () => {},
    value => errors.push(value),
    {
      document: dom.window.document,
      window: dom.window,
      token: 'correct-token',
      compile,
    },
  )
  return { dom, errors, cancel }
}

test('frontend checks start the frame once the worker has compiled the code', async () => {
  let finish
  const run = frameless(() => new Promise(resolve => (finish = resolve)))
  try {
    assert.equal(run.dom.window.document.querySelector('iframe'), null)
    finish(compileSolution(rep.starter, rep.functionName, rep.reactPreview, { guardLoops: true }))
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.ok(run.dom.window.document.querySelector('iframe'))
    assert.deepEqual(run.errors, [])
  } finally {
    run.cancel()
    run.dom.window.close()
  }
})

test('a failed or stale compile reports once and never starts a frame', async () => {
  const failed = frameless(() => Promise.reject(new Error('The compiler could not load. Your code is still here; try again.')))
  try {
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(failed.errors, ['The compiler could not load. Your code is still here; try again.'])
    assert.equal(failed.dom.window.document.querySelector('iframe'), null)
  } finally {
    failed.dom.window.close()
  }
  let finish
  const cancelled = frameless(() => new Promise(resolve => (finish = resolve)))
  try {
    cancelled.cancel()
    finish('function late() {}')
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(cancelled.errors, [])
    assert.equal(cancelled.dom.window.document.querySelector('iframe'), null)
  } finally {
    cancelled.dom.window.close()
  }
})
