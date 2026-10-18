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
}
