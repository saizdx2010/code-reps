import { sameValue } from './compare.ts'
import { stageRewards } from './toy-rewards.ts'

// The Request console (src/RequestConsole.tsx) sends a raw HTTP request through the learner's own saved solutions to
// eight Backend reps, in the order a server reads a request, and compares every answer with the rep's written contract,
// modelled below. The first part that is not lit, throws, or disagrees stops the request there: a later part never
// receives input that the contract would not have produced, and a missing part is never filled in with this model.
// It runs in the practice worker and records nothing: the console is play, not evidence.

export const consoleReward = stageRewards.find(reward => reward.toyId === 'request-console')!

const functionNames = {
  line: 'parseRequestLine',
  target: 'splitTarget',
  query: 'decodeQuery',
  headers: 'headerValue',
  body: 'readJsonBody',
  path: 'normalizePath',
  match: 'matchRoute',
  route: 'routeRequest',
} as const
export type PartId = keyof typeof functionNames
export const consoleParts = consoleReward.parts.map(part => ({
  ...part,
  id: part.id as PartId,
  functionName: functionNames[part.id as PartId],
}))
/** The learner's saved source for each lit part. */
export type ConsoleSources = Partial<Record<PartId, string>>

/** The sample service's routes, in the order routeRequest tries them. */
export const consoleRoutes = [
  { method: 'GET', pattern: '/orders', name: 'list-orders' },
  { method: 'POST', pattern: '/orders', name: 'create-order' },
  { method: 'GET', pattern: '/orders/:id', name: 'show-order' },
  { method: 'DELETE', pattern: '/orders/:id', name: 'cancel-order' },
  { method: 'GET', pattern: '/users/:userId/orders', name: 'user-orders' },
  { method: 'GET', pattern: '/health', name: 'health' },
]
type ConsoleRoute = (typeof consoleRoutes)[number]

export const consoleExamples = [
  {
    id: 'list',
    label: 'List open orders',
    text: 'GET /orders?status=open&tag=gift&tag=sale HTTP/1.1\nHost: shop.local\nAccept: text/html\naccept:  application/json \n',
  },
  {
    id: 'create',
    label: 'Create an order',
    text: 'POST /orders HTTP/1.1\nHost: shop.local\nContent-Type: application/json; charset=utf-8\n\n{"sku":"A-7","quantity":2}',
  },
  { id: 'untidy', label: 'An untidy path', text: 'GET /orders//42/./items/.. HTTP/1.1\nHost: shop.local\n' },
  {
    id: 'method',
    label: 'The wrong method',
    text: 'PUT /orders/42 HTTP/1.1\nHost: shop.local\nContent-Type: application/json\n\n{"status":"paid"}',
  },
  {
    id: 'json',
    label: 'Broken JSON',
    text: 'POST /orders HTTP/1.1\nHost: shop.local\nContent-Type: application/json\n\n{"sku":',
  },
  { id: 'climb', label: 'A path above the root', text: 'GET /files/../../secret HTTP/1.1\nHost: shop.local\n' },
  { id: 'escape', label: 'A broken escape', text: 'GET /orders?q=%G1 HTTP/1.1\nHost: shop.local\n' },
] as const

export type RawRequest = { line: string; headers: [string, string][]; body: string }

/**
 * Splits the typed text into the request line, header pairs, and body. This framing is the console's own; it keeps
 * every input inside the limits the parts' contracts state, so a part is never judged on a case its contract leaves open.
 */
export function readRequest(text: string): { ok: true; request: RawRequest } | { ok: false; problem: string } {
  const problem = (message: string) => ({ ok: false as const, problem: message })
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const line = lines[0]
  if (line.length > 300 || !/^[\x20-\x7e]*$/.test(line))
    return problem('Keep the request line to 300 printable ASCII characters, without tabs or accented letters.')
  if (line.includes('#')) return problem('Leave out "#" and what follows it: a client never sends that part, so a target never holds one.')
  if (line.split(' ').some(piece => piece.length > 200)) return problem('Keep the target to 200 characters.')
  const blank = lines.indexOf('', 1)
  const headerLines = lines.slice(1, blank < 0 ? undefined : blank)
  if (headerLines.length > 50) return problem('Send at most 50 headers.')
  const headers: [string, string][] = []
  for (const [index, header] of headerLines.entries()) {
    const colon = header.indexOf(':')
    if (colon < 1 || !/^[\x21-\x7e]+$/.test(header.slice(0, colon)))
      return problem(`Line ${index + 2} is not a header. Write each header as Name: value, with no spaces in the name.`)
    const value = header.slice(colon + 1)
    if (!/^[\x20-\x7e\t]*$/.test(value)) return problem(`Line ${index + 2}: a header value holds printable ASCII characters and tabs only.`)
    headers.push([header.slice(0, colon), value])
  }
  const body = blank < 0 ? '' : lines.slice(blank + 1).join('\n')
  if (body.length > 5000) return problem('Keep the body to 5000 characters.')
  return { ok: true, request: { line, headers, body } }
}

// The contracts, as each rep's prompt states them. tests/request-console.test.mjs runs every authored check against them.

type Line = { ok: true; method: string; path: string; query: string; version: string } | { ok: false; status: number; error: string }
const methods = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const atMark = (target: string) => {
  const mark = target.indexOf('?')
  return mark < 0 ? { path: target, query: '' } : { path: target.slice(0, mark), query: target.slice(mark + 1) }
}

export function contractRequestLine(line: string): Line {
  const parts = line.split(' ')
  if (parts.length !== 3 || parts.includes('')) return { ok: false, status: 400, error: 'MALFORMED_LINE' }
  const [method, target, version] = parts
  if (!methods.includes(method)) return { ok: false, status: 501, error: 'UNKNOWN_METHOD' }
  if (!target.startsWith('/')) return { ok: false, status: 400, error: 'BAD_TARGET' }
  if (version !== 'HTTP/1.1' && version !== 'HTTP/1.0') return { ok: false, status: 505, error: 'UNSUPPORTED_VERSION' }
  return { ok: true, method, ...atMark(target), version }
}

export function contractSplitTarget(target: string) {
  const { path, query } = atMark(target)
  return { path: path || '/', query }
}

type Decoded = { ok: true; pairs: [string, string][] } | { ok: false; error: 'MALFORMED_QUERY' }
export function contractDecodeQuery(query: string): Decoded {
  const pairs: [string, string][] = []
  for (const piece of query.split('&')) {
    const equals = piece.indexOf('=')
    const name = equals < 0 ? piece : piece.slice(0, equals)
    if (!name) continue
    try {
      pairs.push(
        [name, equals < 0 ? '' : piece.slice(equals + 1)].map(text => decodeURIComponent(text.replaceAll('+', ' '))) as [string, string],
      )
    } catch {
      return { ok: false, error: 'MALFORMED_QUERY' }
    }
  }
  return { ok: true, pairs }
}

export function contractHeaderValue(headers: [string, string][], name: string): string | null {
  const values = headers
    .filter(([key]) => key.toLowerCase() === name.toLowerCase())
    .map(([, value]) => value.replace(/^[ \t]+|[ \t]+$/g, ''))
  return values.length ? values.filter(Boolean).join(', ') : null
}

type Body = { ok: true; data: object | null } | { ok: false; status: number; error: string }
export function contractReadJsonBody({ method, headers, body }: { method: string; headers: [string, string][]; body: string }): Body {
  const fail = (status: number, error: string) => ({ ok: false as const, status, error })
  if (method === 'GET' || method === 'HEAD') return body ? fail(400, 'BODY_NOT_ALLOWED') : { ok: true, data: null }
  const types = headers.filter(([key]) => key.toLowerCase() === 'content-type')
  if (types.length !== 1 || types[0][1].split(';')[0].trim().toLowerCase() !== 'application/json')
    return fail(415, 'UNSUPPORTED_MEDIA_TYPE')
  if (body.length > 1000) return fail(413, 'BODY_TOO_LARGE')
  let data: unknown
  try {
    data = JSON.parse(body)
  } catch {
    return fail(400, 'INVALID_JSON')
  }
  return data !== null && typeof data === 'object' && !Array.isArray(data) ? { ok: true, data } : fail(400, 'NOT_AN_OBJECT')
}

export function contractNormalizePath(path: string): string | null {
  const kept: string[] = []
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment !== '..') kept.push(segment)
    else if (kept.pop() === undefined) return null
  }
  return `/${kept.join('/')}`
}

export function contractMatchRoute(pattern: string, path: string): Record<string, string> | null {
  const want = pattern.split('/')
  const got = path.split('/')
  if (want.length !== got.length) return null
  const params: Record<string, string> = {}
  for (const [index, segment] of want.entries()) {
    if (!segment.startsWith(':')) {
      if (segment !== got[index]) return null
    } else if (got[index]) params[segment.slice(1)] = got[index]
    else return null
  }
  return params
}

type Routed = { status: 200; route: string; params: Record<string, string> } | { status: 405; allow: string[] } | { status: 404 }
export function contractRouteRequest(routes: ConsoleRoute[], method: string, path: string): Routed {
  const matching = routes.flatMap(route => {
    const params = contractMatchRoute(route.pattern, path)
    return params ? [{ route, params }] : []
  })
  const pick = (wanted: string) => matching.find(item => item.route.method === wanted)
  const answer = pick(method) ?? (method === 'HEAD' ? pick('GET') : undefined)
  if (answer) return { status: 200, route: answer.route.name, params: answer.params }
  if (!matching.length) return { status: 404 }
  const allow = new Set(matching.map(item => item.route.method))
  if (allow.has('GET')) allow.add('HEAD')
  return { status: 405, allow: [...allow].sort() }
}

// Running the learner's parts.

type Learner = (...args: unknown[]) => unknown
/** One call to a part: what it was asked, what the learner's code answered, and what the contract gives. */
export type ConsoleCall = { call: string; output: string; expected: string; agrees: boolean; changedInput?: true }
export type ConsoleStep =
  | { part: PartId; state: 'agrees' | 'differs'; calls: ConsoleCall[] }
  | { part: PartId; state: 'threw'; calls: ConsoleCall[]; error: string }
  | { part: PartId; state: 'unlit' }
/** What the service sends back: a part's refusal, or the handler the route chose with everything it would receive. */
export type ConsoleResponse =
  | { status: number; error: string; by: PartId; allow?: string[] }
  | {
      status: 200
      by: 'route'
      handler: string
      received: { params: Record<string, string>; query: [string, string][]; headers: [string, string][]; body: object | null }
    }
/** The parts the request reached, in order. Without a response, the last step is where the request stopped. */
export type ConsoleResult = { steps: ConsoleStep[]; response?: ConsoleResponse }

const shownLimit = 2000
/** A value as JSON text, as the check drawer shows it. */
export function showValue(value: unknown): string {
  let text: string
  try {
    text = JSON.stringify(value) ?? String(value)
  } catch {
    text = String(value)
  }
  return text.length > shownLimit ? `${text.slice(0, shownLimit - 1)}…` : text
}
const callText = (name: string, args: unknown[]) => {
  const text = `${name}(${args.map(arg => (typeof arg === 'symbol' ? arg.description : showValue(arg))).join(', ')})`
  return text.length > 400 ? `${text.slice(0, 399)}…` : text
}
// Stand-ins for long arguments in the call text: the request's header list and the service's route table.
const headersName = Symbol('headers')
const routesName = Symbol('routes')

/**
 * Sends one request through the parts, in order. `parts` holds a lit part's compiled function, or the reason it could
 * not be prepared. Every call gets its own copy of its input; a part that changes its input disagrees with its contract.
 */
export function runRequest(request: RawRequest, parts: Partial<Record<PartId, Learner | string>>): ConsoleResult {
  const steps: ConsoleStep[] = []
  // Runs one part's calls and returns the contract's answers, which equal the learner's when every call agrees.
  function run<T>(part: PartId, calls: { args: unknown[]; contract: (...args: never[]) => T }[]): T[] | undefined {
    const solve = parts[part]
    const name = functionNames[part]
    if (!solve) return void steps.push({ part, state: 'unlit' })
    if (typeof solve === 'string') return void steps.push({ part, state: 'threw', calls: [], error: solve })
    const done: ConsoleCall[] = []
    const answers: T[] = []
    for (const { args, contract } of calls) {
      const input = args.map(arg => (arg === headersName ? request.headers : arg === routesName ? consoleRoutes : arg))
      const expected = (contract as (...values: unknown[]) => T)(...structuredClone(input))
      const given = structuredClone(input)
      let output: unknown
      try {
        output = solve(...given)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return void steps.push({ part, state: 'threw', calls: done, error: `Your ${name} threw an error: ${message}` })
      }
      const changed = !sameValue(given, input)
      const agrees = !changed && sameValue(output, expected)
      done.push({
        call: callText(name, args),
        output: showValue(output),
        expected: showValue(expected),
        agrees,
        ...(changed ? { changedInput: true as const } : {}),
      })
      if (!agrees) return void steps.push({ part, state: 'differs', calls: done })
      answers.push(expected)
    }
    steps.push({ part, state: 'agrees', calls: done })
    return answers
  }

  const [line] = run('line', [{ args: [request.line], contract: contractRequestLine }]) ?? []
  if (!line) return { steps }
  if (!line.ok) return { steps, response: { status: line.status, error: line.error, by: 'line' } }
  // A line the contract accepts has exactly three parts, so its middle part is the target.
  const [target] = run('target', [{ args: [request.line.split(' ')[1]], contract: contractSplitTarget }]) ?? []
  if (!target) return { steps }
  const [query] = run('query', [{ args: [target.query], contract: contractDecodeQuery }]) ?? []
  if (!query) return { steps }
  if (!query.ok) return { steps, response: { status: 400, error: query.error, by: 'query' } }
  const names = [...new Set(request.headers.map(([name]) => name.toLowerCase()))]
  const values = run(
    'headers',
    names.map(name => ({ args: [headersName, name], contract: contractHeaderValue })),
  )
  if (!values) return { steps }
  const [body] =
    run('body', [{ args: [{ method: line.method, headers: request.headers, body: request.body }], contract: contractReadJsonBody }]) ?? []
  if (!body) return { steps }
  if (!body.ok) return { steps, response: { status: body.status, error: body.error, by: 'body' } }
  const [path] = run('path', [{ args: [target.path], contract: contractNormalizePath }]) ?? []
  if (path === undefined) return { steps }
  // The contract gives no status for a path that climbs above the root; the console answers 400.
  if (path === null) return { steps, response: { status: 400, error: 'BAD_PATH', by: 'path' } }
  if (
    !run(
      'match',
      consoleRoutes.map(route => ({ args: [route.pattern, path], contract: contractMatchRoute })),
    )
  )
    return { steps }
  const [routed] = run('route', [{ args: [routesName, line.method, path], contract: contractRouteRequest }]) ?? []
  if (!routed) return { steps }
  if (routed.status === 404) return { steps, response: { status: 404, error: 'NOT_FOUND', by: 'route' } }
  if (routed.status === 405) return { steps, response: { status: 405, error: 'METHOD_NOT_ALLOWED', by: 'route', allow: routed.allow } }
  return {
    steps,
    response: {
      status: 200,
      by: 'route',
      handler: routed.route,
      received: {
        params: routed.params,
        query: query.pairs,
        headers: names.map((name, index) => [name, values[index] ?? '']),
        body: body.data,
      },
    },
  }
}

/**
 * Prepares the lit parts from the learner's sources. `compile` turns one source into JavaScript that defines the named
 * function (src/compile-solution.ts in the worker). Each part runs in its own scope, so the parts' helpers never clash.
 */
export function requestConsole(sources: ConsoleSources, compile: (source: string, functionName: string) => string) {
  const parts: Partial<Record<PartId, Learner | string>> = {}
  for (const { id, functionName } of consoleParts) {
    const source = sources[id]
    if (!source) continue
    try {
      const solve: unknown = new Function(
        `${compile(source, functionName)}\nreturn typeof ${functionName} === 'function' ? ${functionName} : undefined`,
      )()
      parts[id] =
        typeof solve === 'function' ? (solve as Learner) : `Your saved ${functionName} does not define a function named ${functionName}.`
    } catch (error) {
      parts[id] = `Your saved ${functionName} could not run: ${error instanceof Error ? error.message : String(error)}`
    }
  }
  return (request: RawRequest) => runRequest(request, parts)
}
