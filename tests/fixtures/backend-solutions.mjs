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
  'backend-job-failure': `
function afterFailure(job: { id: string; attempts: number }, error: { retryable: boolean }, now: number, policy: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number }) {
  if (!error.retryable) return { action: 'dead-letter', reason: 'PERMANENT_ERROR' }
  if (job.attempts >= policy.maxAttempts) return { action: 'dead-letter', reason: 'TOO_MANY_ATTEMPTS' }
  const wait = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (job.attempts - 1))
  return { action: 'retry', runAt: now + wait }
}`,
  'backend-claim-job': `
type Job = { id: string; runAt: number; attempts: number; lease: { worker: string; until: number } | null }
function claimJob(jobs: Job[], worker: string, now: number, leaseMs: number) {
  const available = (job: Job) => job.runAt <= now && (job.lease === null || job.lease.until <= now)
  let chosen = -1
  jobs.forEach((job, index) => {
    if (available(job) && (chosen === -1 || job.runAt < jobs[chosen].runAt)) chosen = index
  })
  if (chosen === -1) return { jobId: null, jobs }
  return {
    jobId: jobs[chosen].id,
    jobs: jobs.map((job, index) =>
      index === chosen ? { ...job, attempts: job.attempts + 1, lease: { worker, until: now + leaseMs } } : job,
    ),
  }
}`,
  'backend-dedupe-deliveries': `
function applyMessages(messages: { id: string; account: string; amount: number }[], processedIds: string[]) {
  const seen = new Set(processedIds)
  const balances: Record<string, number> = {}
  const skipped: string[] = []
  const applied: string[] = []
  for (const message of messages) {
    if (seen.has(message.id)) {
      skipped.push(message.id)
      continue
    }
    seen.add(message.id)
    applied.push(message.id)
    balances[message.account] = (balances[message.account] ?? 0) + message.amount
  }
  return { balances, skipped, processedIds: [...processedIds, ...applied] }
}`,
  'backend-outbox-relay': `
type Row = { id: number; event: string; publishedAt: number | null }
function relayOutbox(rows: Row[], results: boolean[], now: number, batchSize: number) {
  const batch = rows.filter(row => row.publishedAt === null).sort((a, b) => a.id - b.id).slice(0, batchSize)
  const published: number[] = []
  for (const [index, row] of batch.entries()) {
    if (results[index] !== true) break
    published.push(row.id)
  }
  const done = new Set(published)
  return { published, rows: rows.map(row => (done.has(row.id) ? { ...row, publishedAt: now } : row)) }
}`,
  'backend-queue-simulation': `
type Outcome = 'ok' | 'retryable' | 'permanent'
function runQueue(jobIds: string[], outcomes: Record<string, Outcome[]>, policy: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number }) {
  let order = 0
  const queue = jobIds.map(id => ({ id, runAt: 0, attempts: 0, order: order++ }))
  const completed: string[] = []
  const deadLetters: { id: string; reason: string; attempts: number }[] = []
  let clock = 0
  while (queue.length) {
    let next = 0
    for (let i = 1; i < queue.length; i++) {
      const a = queue[i]
      const b = queue[next]
      if (a.runAt < b.runAt || (a.runAt === b.runAt && a.order < b.order)) next = i
    }
    const entry = queue.splice(next, 1)[0]
    clock = Math.max(clock, entry.runAt)
    const attempts = entry.attempts + 1
    const outcome = outcomes[entry.id]?.[attempts - 1] ?? 'ok'
    if (outcome === 'ok') completed.push(entry.id)
    else if (outcome === 'permanent') deadLetters.push({ id: entry.id, reason: 'PERMANENT_ERROR', attempts })
    else if (attempts >= policy.maxAttempts) deadLetters.push({ id: entry.id, reason: 'TOO_MANY_ATTEMPTS', attempts })
    else
      queue.push({
        id: entry.id,
        runAt: clock + Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempts - 1)),
        attempts,
        order: order++,
      })
  }
  return { completed, deadLetters, finishedAt: clock }
}`,
  'backend-token-bucket': `
function takeToken(bucket: { tokens: number; updatedAt: number }, now: number, capacity: number, refillMs: number) {
  const added = Math.floor((now - bucket.updatedAt) / refillMs)
  const tokens = Math.min(capacity, bucket.tokens + added)
  const updatedAt = tokens === capacity ? now : bucket.updatedAt + added * refillMs
  if (tokens >= 1) return { allowed: true, bucket: { tokens: tokens - 1, updatedAt }, retryAfterMs: 0 }
  return { allowed: false, bucket: { tokens, updatedAt }, retryAfterMs: updatedAt + refillMs - now }
}`,
  'backend-sliding-log': `
function slidingLimit(times: number[], now: number, limit: number, windowMs: number) {
  const counted = times.filter(t => t > now - windowMs && t <= now).sort((a, b) => a - b)
  if (counted.length < limit) return { allowed: true, remaining: limit - counted.length - 1, retryAfterMs: 0 }
  return { allowed: false, remaining: 0, retryAfterMs: counted[counted.length - limit] + windowMs - now }
}`,
  'backend-limit-response': `
function limitResponse(decision: { allowed: boolean; remaining: number; retryAfterMs: number }, limit: number) {
  const headers: Record<string, string> = {
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(decision.allowed ? Math.max(0, decision.remaining) : 0),
  }
  if (decision.allowed) return { status: 200, headers }
  return { status: 429, headers: { ...headers, 'Retry-After': String(Math.max(1, Math.ceil(decision.retryAfterMs / 1000))) } }
}`,
  'backend-sliding-counter': `
function slidingEstimate(previousCount: number, currentCount: number, now: number, windowMs: number, limit: number) {
  const start = Math.floor(now / windowMs) * windowMs
  const overlap = start + windowMs - now
  const used = currentCount + Math.floor((previousCount * overlap) / windowMs)
  return { allowed: used < limit, used }
}`,
  'backend-limit-callers': `
function limitRequests(requests: { key: string; at: number }[], capacity: number, refillMs: number) {
  const buckets = new Map<string, { tokens: number; refilledAt: number }>()
  return requests.map(({ key, at }) => {
    const bucket = buckets.get(key) ?? { tokens: capacity, refilledAt: at }
    const added = Math.floor((at - bucket.refilledAt) / refillMs)
    const tokens = Math.min(capacity, bucket.tokens + added)
    const refilledAt = tokens === capacity ? at : bucket.refilledAt + added * refillMs
    if (tokens >= 1) {
      buckets.set(key, { tokens: tokens - 1, refilledAt })
      return { allowed: true, retryAfterMs: 0 }
    }
    buckets.set(key, { tokens, refilledAt })
    return { allowed: false, retryAfterMs: refilledAt + refillMs - at }
  })
}`,
  'backend-choose-version': `
function chooseVersion(path: string, headers: [string, string][], supported: string[], fallback: string) {
  const segment = path.split('/')[1] ?? ''
  const fromPath = /^v[0-9]+$/.test(segment) ? segment : null
  const route = fromPath === null ? path : path.slice(fromPath.length + 1) || '/'
  const header = headers.find(([name]) => name.toLowerCase() === 'api-version')
  const fromHeader = header && header[1].trim() !== '' ? header[1].trim() : null
  if (fromPath !== null && fromHeader !== null && fromPath !== fromHeader) return { ok: false, status: 400, error: 'VERSION_CONFLICT' }
  const version = fromPath ?? fromHeader ?? fallback
  if (!supported.includes(version)) return { ok: false, status: 400, error: 'UNKNOWN_VERSION' }
  return { ok: true, version, path: route }
}`,
  'backend-classify-change': `
type Field = { type: string; required: boolean }
function classifyChanges(direction: 'request' | 'response', before: Record<string, Field>, after: Record<string, Field>) {
  const breaking: string[] = []
  const compatible: string[] = []
  const names = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  for (const name of names) {
    const old = Object.hasOwn(before, name) ? before[name] : undefined
    const now = Object.hasOwn(after, name) ? after[name] : undefined
    let breaks: boolean
    if (!old) breaks = direction === 'request' && now!.required
    else if (!now) breaks = direction === 'response'
    else if (old.type === now.type && old.required === now.required) continue
    else breaks = old.type !== now.type || (direction === 'response' ? old.required && !now.required : !old.required && now.required)
    if (breaks) breaking.push(name)
    else compatible.push(name)
  }
  return { breaking, compatible }
}`,
  'backend-deprecation-headers': `
function deprecationResponse(policy: { deprecatedAt: string; sunsetAt: string; successor: string }, now: string) {
  const at = Date.parse(now)
  const deprecated = Date.parse(policy.deprecatedAt)
  const sunset = Date.parse(policy.sunsetAt)
  const link = '<' + policy.successor + '>; rel="successor-version"'
  if (at < deprecated) return { status: 200, headers: {} }
  if (at >= sunset) return { status: 410, headers: { Link: link } }
  return {
    status: 200,
    headers: { Deprecation: '@' + deprecated / 1000, Sunset: new Date(sunset).toUTCString(), Link: link },
  }
}`,
  'backend-webhook-deliveries': `
function applyDeliveries(deliveries: { deliveryId: string; resource: string; sequence: number; status: string }[]) {
  const seen = new Set<string>()
  const last = new Map<string, number>()
  const state: Record<string, string> = {}
  const applied: string[] = []
  const skipped: { deliveryId: string; reason: string }[] = []
  for (const delivery of deliveries) {
    if (seen.has(delivery.deliveryId)) {
      skipped.push({ deliveryId: delivery.deliveryId, reason: 'DUPLICATE' })
      continue
    }
    seen.add(delivery.deliveryId)
    if (delivery.sequence <= (last.get(delivery.resource) ?? 0)) {
      skipped.push({ deliveryId: delivery.deliveryId, reason: 'STALE' })
      continue
    }
    last.set(delivery.resource, delivery.sequence)
    state[delivery.resource] = delivery.status
    applied.push(delivery.deliveryId)
  }
  return { state, applied, skipped }
}`,
  'backend-downgrade-response': `
type Change =
  | { version: string; kind: 'rename'; from: string; to: string }
  | { version: string; kind: 'add'; field: string }
  | { version: string; kind: 'remove'; field: string; value: unknown }
function downgrade(body: Record<string, unknown>, pinned: string, changes: Change[]) {
  const result: Record<string, unknown> = { ...body }
  const newer = changes.filter(change => change.version > pinned).sort((a, b) => (a.version < b.version ? 1 : -1))
  for (const change of newer) {
    if (change.kind === 'rename') {
      if (Object.hasOwn(result, change.to)) {
        result[change.from] = result[change.to]
        delete result[change.to]
      }
    } else if (change.kind === 'add') delete result[change.field]
    else result[change.field] = change.value
  }
  return result
}`,
}
