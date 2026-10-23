import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { backendServiceReps } from '../src/backend-service-reps.ts'
import { paths } from '../src/path.ts'
import {
  consoleExamples,
  consoleParts,
  consoleRoutes,
  contractDecodeQuery,
  contractHeaderValue,
  contractMatchRoute,
  contractNormalizePath,
  contractReadJsonBody,
  contractRequestLine,
  contractRouteRequest,
  contractSplitTarget,
  readRequest,
  requestConsole,
  runRequest,
} from '../src/request-console.ts'
import { backendSolutions } from './fixtures/backend-solutions.mjs'

const compile = (source, name) => compileSolution(source, name)
const reference = Object.fromEntries(consoleParts.map(part => [part.id, backendSolutions[part.repId]]))
const send = (text, sources = reference) => {
  const framed = readRequest(text)
  assert.ok(framed.ok, framed.problem)
  return requestConsole(sources, compile)(framed.request)
}
const example = id => consoleExamples.find(item => item.id === id).text

const contracts = {
  'backend-request-line': contractRequestLine,
  'backend-split-target': contractSplitTarget,
  'backend-decode-query': contractDecodeQuery,
  'backend-header-value': contractHeaderValue,
  'backend-read-json-body': contractReadJsonBody,
  'backend-normalize-path': contractNormalizePath,
  'backend-match-route': contractMatchRoute,
  'backend-route-request': contractRouteRequest,
}

test('the console’s contract model passes every authored check of every part', () => {
  for (const part of consoleParts) {
    const rep = backendServiceReps.find(item => item.id === part.repId)
    assert.ok(rep, part.repId)
    assert.equal(rep.functionName, part.functionName, `${part.id} calls the rep’s own function`)
    for (const check of rep.checks) {
      const input = structuredClone(check.input)
      assert.deepEqual(contracts[part.repId](...input), check.expected, `${part.repId}: ${check.name}`)
      assert.deepEqual(input, check.input, `${part.repId}: ${check.name} leaves its input unchanged`)
    }
  }
})

test('every part is a rep on the Backend track’s first two request stages, in pipeline order', () => {
  const backend = paths.find(path => path.id === 'backend')
  const fed = backend.stages.filter(stage => stage.title === 'What a request is' || stage.title === 'Route a request')
  const stageRepIds = fed.flatMap(stage => stage.repIds)
  assert.ok(consoleParts.every(part => stageRepIds.includes(part.repId)))
  assert.deepEqual(
    consoleParts.map(part => part.id),
    ['line', 'target', 'query', 'headers', 'body', 'path', 'match', 'route'],
  )
  // Left out on purpose: reverse routing builds paths rather than reading them, and specificity is a second router.
  assert.deepEqual(
    stageRepIds.filter(id => !consoleParts.some(part => part.repId === id)),
    ['backend-build-path', 'backend-route-specificity'],
  )
})

test('the framing splits the request line, header pairs, and body, and keeps inputs inside the contracts', () => {
  assert.deepEqual(readRequest('POST /orders HTTP/1.1\r\nContent-Type:  application/json \r\nX-Tag:\r\n\r\n{"a":1}\n'), {
    ok: true,
    request: {
      line: 'POST /orders HTTP/1.1',
      headers: [
        ['Content-Type', '  application/json '],
        ['X-Tag', ''],
      ],
      body: '{"a":1}\n',
    },
  })
  assert.deepEqual(readRequest('GET / HTTP/1.1'), { ok: true, request: { line: 'GET / HTTP/1.1', headers: [], body: '' } })
  // An empty request is still a request line, which the learner's parseRequestLine answers.
  assert.deepEqual(readRequest(''), { ok: true, request: { line: '', headers: [], body: '' } })
  assert.match(readRequest('GET / HTTP/1.1\nno colon here').problem, /Line 2 is not a header/)
  assert.match(readRequest('GET / HTTP/1.1\n: empty name').problem, /Line 2 is not a header/)
  assert.match(readRequest('GET / HTTP/1.1\nBad Name: x').problem, /no spaces in the name/)
  assert.match(readRequest('GET /café HTTP/1.1').problem, /printable ASCII/)
  assert.match(readRequest('GET /a#b HTTP/1.1').problem, /Leave out "#"/)
  assert.match(readRequest(`GET /${'a'.repeat(200)} HTTP/1.1`).problem, /200 characters/)
  assert.match(readRequest(`GET / HTTP/1.1\n${'X-A: 1\n'.repeat(51)}`).problem, /at most 50 headers/)
  assert.match(readRequest(`POST / HTTP/1.1\n\n${'x'.repeat(5001)}`).problem, /5000 characters/)
})

test('reference solutions carry each example through every part to the response the contracts give', () => {
  const responses = Object.fromEntries(consoleExamples.map(item => [item.id, send(item.text)]))
  for (const [id, result] of Object.entries(responses)) {
    assert.ok(result.response, `${id} is answered`)
    assert.ok(
      result.steps.every(step => step.state === 'agrees'),
      `${id}: ${JSON.stringify(result.steps.find(step => step.state !== 'agrees'))}`,
    )
  }
  assert.deepEqual(responses.list.response, {
    status: 200,
    by: 'route',
    handler: 'list-orders',
    received: {
      params: {},
      query: [
        ['status', 'open'],
        ['tag', 'gift'],
        ['tag', 'sale'],
      ],
      headers: [
        ['host', 'shop.local'],
        ['accept', 'text/html, application/json'],
      ],
      body: null,
    },
  })
  assert.equal(responses.list.steps.length, consoleParts.length)
  assert.deepEqual(responses.create.response.received.body, { sku: 'A-7', quantity: 2 })
  assert.deepEqual(responses.untidy.response.received.params, { id: '42' })
  assert.deepEqual(responses.method.response, { status: 405, error: 'METHOD_NOT_ALLOWED', by: 'route', allow: ['DELETE', 'GET', 'HEAD'] })
  assert.deepEqual(responses.json.response, { status: 400, error: 'INVALID_JSON', by: 'body' })
  assert.deepEqual(responses.climb.response, { status: 400, error: 'BAD_PATH', by: 'path' })
  assert.deepEqual(responses.escape.response, { status: 400, error: 'MALFORMED_QUERY', by: 'query' })
  // A request answered early reaches no later part.
  assert.deepEqual(
    responses.escape.steps.map(step => step.part),
    ['line', 'target', 'query'],
  )
  assert.deepEqual(send('GET / HTTP/2').response, { status: 505, error: 'UNSUPPORTED_VERSION', by: 'line' })
  assert.deepEqual(send('GET /missing HTTP/1.1').response, { status: 404, error: 'NOT_FOUND', by: 'route' })
  // Every pattern is asked whether it matches; the call names the pattern and the cleaned path.
  const match = responses.untidy.steps.find(step => step.part === 'match')
  assert.equal(match.calls.length, consoleRoutes.length)
  assert.equal(match.calls[2].call, 'matchRoute("/orders/:id", "/orders/42")')
  assert.equal(match.calls[2].output, '{"id":"42"}')
})

test('an unlit part stops the request there, and no later part runs or is filled in', () => {
  let laterCalls = 0
  const parts = {
    line: (...args) => contractRequestLine(...args),
    target: (...args) => contractSplitTarget(...args),
    headers: () => laterCalls++,
    body: () => laterCalls++,
    path: () => laterCalls++,
    match: () => laterCalls++,
    route: () => laterCalls++,
  }
  const result = runRequest(readRequest(example('list')).request, parts)
  assert.deepEqual(
    result.steps.map(step => [step.part, step.state]),
    [
      ['line', 'agrees'],
      ['target', 'agrees'],
      ['query', 'unlit'],
    ],
  )
  assert.equal(result.response, undefined)
  assert.equal(laterCalls, 0)
  // Without the first part, nothing runs at all.
  assert.deepEqual(runRequest(readRequest(example('list')).request, {}), { steps: [{ part: 'line', state: 'unlit' }] })
})

test('the first part that disagrees with its contract is reported with both values, and the request stops there', () => {
  const lastMark = `function splitTarget(target: string) {
  const mark = target.lastIndexOf('?')
  return mark < 0 ? { path: target || '/', query: '' } : { path: target.slice(0, mark) || '/', query: target.slice(mark + 1) }
}`
  const result = send('GET /search?q=a?b HTTP/1.1', { ...reference, target: lastMark })
  const last = result.steps.at(-1)
  assert.equal(result.response, undefined)
  assert.deepEqual(
    result.steps.map(step => [step.part, step.state]),
    [
      ['line', 'agrees'],
      ['target', 'differs'],
    ],
  )
  assert.deepEqual(last.calls, [
    {
      call: 'splitTarget("/search?q=a?b")',
      output: '{"path":"/search?q=a","query":"b"}',
      expected: '{"path":"/search","query":"q=a?b"}',
      agrees: false,
    },
  ])
  // Headers are asked one name at a time; the disagreeing call is the last one listed.
  const firstOnly =
    'function headerValue(headers: [string, string][], name: string) { const found = headers.find(([key]) => key.toLowerCase() === name.toLowerCase()); return found ? found[1].trim() : null }'
  const headers = send(example('list'), { ...reference, headers: firstOnly }).steps.at(-1)
  assert.equal(headers.state, 'differs')
  assert.deepEqual(
    headers.calls.map(call => [call.call, call.agrees]),
    [
      ['headerValue(headers, "host")', true],
      ['headerValue(headers, "accept")', false],
    ],
  )
  assert.equal(headers.calls[1].output, '"text/html"')
  assert.equal(headers.calls[1].expected, '"text/html, application/json"')
})

test('a part that throws, changes its input, or cannot be prepared stops the request with a reason', () => {
  const throwing = send(example('list'), { ...reference, query: 'function decodeQuery(query: string) { throw new Error("boom") }' })
  assert.deepEqual(throwing.steps.at(-1), { part: 'query', state: 'threw', calls: [], error: 'Your decodeQuery threw an error: boom' })
  // The answer is right, but the request it was handed lost a header.
  const mutating = send(example('create'), {
    ...reference,
    body: "function readJsonBody(request: { headers: [string, string][] }) { request.headers.pop(); return { ok: true, data: { sku: 'A-7', quantity: 2 } } }",
  })
  assert.equal(mutating.steps.at(-1).state, 'differs')
  assert.equal(mutating.steps.at(-1).calls[0].changedInput, true)
  const missing = send(example('list'), { ...reference, line: 'const parseRequestLine = 3' })
  assert.deepEqual(missing.steps, [
    { part: 'line', state: 'threw', calls: [], error: 'Your saved parseRequestLine does not define a function named parseRequestLine.' },
  ])
})
