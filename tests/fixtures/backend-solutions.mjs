// Independent implementations of the Backend track's service contracts; no production helper is reused.
export const backendSolutions = {
  'backend-split-target': `
function splitTarget(target: string) {
  const mark = target.indexOf('?')
  const path = mark === -1 ? target : target.slice(0, mark)
  const query = mark === -1 ? '' : target.slice(mark + 1)
  return { path: path === '' ? '/' : path, query }
}`,
  'backend-decode-query': `
function decodeQuery(query: string) {
  const pairs: [string, string][] = []
  for (const piece of query.split('&')) {
    if (piece === '') continue
    const at = piece.indexOf('=')
    const rawName = at === -1 ? piece : piece.slice(0, at)
    const rawValue = at === -1 ? '' : piece.slice(at + 1)
    if (rawName === '') continue
    try {
      pairs.push([decodeURIComponent(rawName.replace(/\\+/g, ' ')), decodeURIComponent(rawValue.replace(/\\+/g, ' '))])
    } catch {
      return { ok: false, error: 'MALFORMED_QUERY' }
    }
  }
  return { ok: true, pairs }
}`,
  'backend-request-line': `
function parseRequestLine(line: string) {
  const parts = line.split(' ')
  if (parts.length !== 3 || parts.some(part => part === '')) return { ok: false, status: 400, error: 'MALFORMED_LINE' }
  const [method, target, version] = parts
  if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(method))
    return { ok: false, status: 501, error: 'UNKNOWN_METHOD' }
  if (!target.startsWith('/')) return { ok: false, status: 400, error: 'BAD_TARGET' }
  if (version !== 'HTTP/1.1' && version !== 'HTTP/1.0') return { ok: false, status: 505, error: 'UNSUPPORTED_VERSION' }
  const mark = target.indexOf('?')
  return {
    ok: true,
    method,
    path: mark === -1 ? target : target.slice(0, mark),
    query: mark === -1 ? '' : target.slice(mark + 1),
    version,
  }
}`,
  'backend-header-value': `
function headerValue(headers: [string, string][], name: string) {
  const wanted = name.toLowerCase()
  let found = false
  const values: string[] = []
  for (const [key, value] of headers) {
    if (key.toLowerCase() !== wanted) continue
    found = true
    const trimmed = value.trim()
    if (trimmed) values.push(trimmed)
  }
  return found ? values.join(', ') : null
}`,
  'backend-read-json-body': `
function readJsonBody(request: { method: string; headers: [string, string][]; body: string }) {
  const fail = (status: number, error: string) => ({ ok: false, status, error })
  if (request.method === 'GET' || request.method === 'HEAD')
    return request.body === '' ? { ok: true, data: null } : fail(400, 'BODY_NOT_ALLOWED')
  const types = request.headers.filter(([name]) => name.toLowerCase() === 'content-type')
  if (types.length !== 1 || types[0][1].split(';')[0].trim().toLowerCase() !== 'application/json')
    return fail(415, 'UNSUPPORTED_MEDIA_TYPE')
  if (request.body.length > 1000) return fail(413, 'BODY_TOO_LARGE')
  let data: unknown
  try {
    data = JSON.parse(request.body)
  } catch {
    return fail(400, 'INVALID_JSON')
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return fail(400, 'NOT_AN_OBJECT')
  return { ok: true, data }
}`,
  'backend-match-route': `
function matchRoute(pattern: string, path: string) {
  const want = pattern.split('/')
  const got = path.split('/')
  if (want.length !== got.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) {
      if (!got[i]) return null
      params[want[i].slice(1)] = got[i]
    } else if (want[i] !== got[i]) return null
  }
  return params
}`,
  'backend-route-request': `
type Route = { method: string; pattern: string; name: string }
function routeRequest(routes: Route[], method: string, path: string) {
  const got = path.split('/')
  const match = (pattern: string) => {
    const want = pattern.split('/')
    if (want.length !== got.length) return null
    const params: Record<string, string> = {}
    for (let i = 0; i < want.length; i++) {
      if (want[i].startsWith(':')) {
        if (!got[i]) return null
        params[want[i].slice(1)] = got[i]
      } else if (want[i] !== got[i]) return null
    }
    return params
  }
  const matching = routes.map(route => ({ route, params: match(route.pattern) })).filter(item => item.params !== null)
  const pick = (wanted: string) => matching.find(item => item.route.method === wanted)
  const found = pick(method) ?? (method === 'HEAD' ? pick('GET') : undefined)
  if (found) return { status: 200, route: found.route.name, params: found.params }
  if (!matching.length) return { status: 404 }
  const allow = new Set(matching.map(item => item.route.method))
  if (allow.has('GET')) allow.add('HEAD')
  return { status: 405, allow: [...allow].sort() }
}`,
  'backend-normalize-path': `
function normalizePath(path: string) {
  const kept: string[] = []
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      if (!kept.length) return null
      kept.pop()
    } else kept.push(segment)
  }
  return '/' + kept.join('/')
}`,
  'backend-build-path': `
function buildPath(pattern: string, params: Record<string, unknown>) {
  const parts: string[] = []
  for (const segment of pattern.split('/')) {
    if (!segment.startsWith(':')) {
      parts.push(segment)
      continue
    }
    const value = params[segment.slice(1)]
    if (typeof value !== 'string' || value === '' || value === '.' || value === '..') return null
    parts.push(encodeURIComponent(value))
  }
  return parts.join('/')
}`,
  'backend-route-specificity': `
function pickRoute(patterns: string[], path: string) {
  const got = path.split('/')
  const rank = (segment: string) => (segment === '*' ? 0 : segment.startsWith(':') ? 1 : 2)
  const match = (pattern: string) => {
    const want = pattern.split('/')
    const wild = want[want.length - 1] === '*'
    const fixed = wild ? want.slice(0, -1) : want
    if (wild ? got.length <= fixed.length : got.length !== fixed.length) return null
    const params: Record<string, string> = {}
    for (let i = 0; i < fixed.length; i++) {
      if (fixed[i].startsWith(':')) {
        if (!got[i]) return null
        params[fixed[i].slice(1)] = got[i]
      } else if (fixed[i] !== got[i]) return null
    }
    if (wild) {
      const rest = got.slice(fixed.length).join('/')
      if (!rest) return null
      params['*'] = rest
    }
    return params
  }
  const moreSpecific = (a: string, b: string) => {
    const x = a.split('/')
    const y = b.split('/')
    for (let i = 0; i < Math.min(x.length, y.length); i++)
      if (rank(x[i]) !== rank(y[i])) return rank(x[i]) > rank(y[i])
    return false
  }
  let best: { pattern: string; params: Record<string, string> } | null = null
  for (const pattern of patterns) {
    const params = match(pattern)
    if (params && (!best || moreSpecific(pattern, best.pattern))) best = { pattern, params }
  }
  return best
}`,
  'backend-versioned-update': `
type StoredRecord = { id: string; version: number; data: Record<string, unknown> }
function applyUpdate(record: StoredRecord, update: { expectedVersion: number; changes: Record<string, unknown> }) {
  if (update.expectedVersion !== record.version) return { ok: false, status: 409, currentVersion: record.version }
  const data: Record<string, unknown> = { ...record.data }
  for (const [field, value] of Object.entries(update.changes)) {
    if (value === null) delete data[field]
    else data[field] = value
  }
  return { ok: true, record: { id: record.id, version: record.version + 1, data } }
}`,
  'backend-if-match': `
function conditionalPut(current: { etag: string; value: string } | null, ifMatch: string | null, value: string) {
  if (ifMatch === null) return { status: 428 }
  const header = ifMatch.trim()
  const matches =
    current !== null &&
    (header === '*' || header.split(',').some(tag => !tag.trim().startsWith('W/') && tag.trim() === current.etag))
  if (!matches) return { status: 412 }
  const next = Number(current.etag.slice(2, -1)) + 1
  return { status: 200, resource: { etag: '"v' + next + '"', value } }
}`,
  'backend-lost-updates': `
function lostUpdates(events: { client: string; type: 'read' | 'write' }[]) {
  const lastRead = new Map<string, number>()
  let author: string | null = null
  let writtenAt = -1
  const lost: number[] = []
  events.forEach((event, position) => {
    if (event.type === 'read') {
      lastRead.set(event.client, position)
      return
    }
    const read = lastRead.get(event.client)
    if (author !== null && author !== event.client && (read === undefined || writtenAt > read)) lost.push(position)
    author = event.client
    writtenAt = position
  })
  return lost
}`,
  'backend-compare-and-set': `
function compareAndSet(store: Record<string, string>, key: string, expected: string | null, next: string | null) {
  const current = Object.hasOwn(store, key) ? store[key] : null
  if (current !== expected) return { ok: false, current }
  const copy: Record<string, string> = { ...store }
  if (next === null) delete copy[key]
  else copy[key] = next
  return { ok: true, store: copy }
}`,
  'backend-replay-writes': `
type Event = { client: string; type: 'read' } | { client: string; type: 'write'; value: string }
function replayWrites(initial: { value: string; version: number }, events: Event[]) {
  let { value, version } = initial
  const known = new Map<string, number>()
  const refused: number[] = []
  events.forEach((event, position) => {
    if (event.type === 'read') known.set(event.client, version)
    else if (known.get(event.client) === version) {
      value = event.value
      version += 1
      known.set(event.client, version)
    } else refused.push(position)
  })
  return { value, version, refused }
}`,
}
