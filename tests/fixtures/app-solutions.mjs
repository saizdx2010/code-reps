// Independent implementations of the authored contracts; no production helper is reused.
export const appSolutions = {
  'frontend-sort-table': `
function sortRows(rows: {name: string; qty: number}[], column: string, direction: string) {
  if (column !== 'name' && column !== 'qty') return rows.slice()
  const sign = direction === 'desc' ? -1 : 1
  const keyed = rows.map((row, index) => ({row, index, key: column === 'name' ? row.name.toLowerCase() : row.qty}))
  keyed.sort((a, b) => (a.key < b.key ? -sign : a.key > b.key ? sign : a.index - b.index))
  return keyed.map(item => item.row)
}`,
  'frontend-form-errors': `
function formErrors(values: {name: string; email: string; age: string}) {
  const errors: Record<string, string> = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Name is required'
  else if (name.length > 20) errors.name = 'Name must be 20 characters or fewer'
  const email = values.email.trim()
  const parts = email.split('@')
  if (!email) errors.email = 'Email is required'
  else if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) errors.email = 'Enter a valid email address'
  const age = values.age.trim()
  if (!age) errors.age = 'Age is required'
  else if (!/^[0-9]+$/.test(age)) errors.age = 'Age must be a whole number'
  else if (Number(age) < 18 || Number(age) > 120) errors.age = 'Age must be between 18 and 120'
  return errors
}`,
  'frontend-pagination-controls': `
function pageButtons(current: number, total: number) {
  if (total < 1) return []
  const page = Math.min(total, Math.max(1, current))
  const shown = [...new Set([1, total, page - 1, page, page + 1])].filter(n => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | string)[] = []
  shown.forEach((n, i) => {
    if (i > 0) {
      const gap = n - shown[i - 1]
      if (gap === 2) out.push(n - 1)
      else if (gap > 2) out.push('...')
    }
    out.push(n)
  })
  return out
}`,
  'backend-query-filters': `
function parseFilters(query: unknown) {
  if (query === null || typeof query !== 'object' || Array.isArray(query)) return {ok: false, error: 'INVALID_QUERY'}
  const q = query as Record<string, unknown>
  const read = (key: string): string | null | undefined => {
    const v = q[key]
    if (v === undefined) return null
    if (typeof v !== 'string') return undefined
    return v.trim() === '' ? null : v.trim()
  }
  const status = read('status')
  if (status === undefined) return {ok: false, error: 'INVALID_STATUS'}
  const statusValue = status === null ? 'all' : status.toLowerCase()
  if (!['open', 'closed', 'all'].includes(statusValue)) return {ok: false, error: 'INVALID_STATUS'}
  const limit = read('limit')
  if (limit === undefined || (limit !== null && !/^[0-9]+$/.test(limit))) return {ok: false, error: 'INVALID_LIMIT'}
  const limitValue = limit === null ? 10 : Number(limit)
  if (limitValue < 1 || limitValue > 50) return {ok: false, error: 'INVALID_LIMIT'}
  const tag = read('tag')
  if (tag === undefined || (tag !== null && tag.length > 20)) return {ok: false, error: 'INVALID_TAG'}
  return {ok: true, filters: {status: statusValue, limit: limitValue, tag: tag === null ? null : tag.toLowerCase()}}
}`,
  'backend-rate-limit': `
function rateLimit(times: number[], now: number, limit: number, windowMs: number) {
  const start = now - (now % windowMs)
  let count = 0
  for (const t of times) if (t >= start && t <= now) count++
  if (count < limit) return {allowed: true, remaining: limit - count - 1, retryAfterMs: 0}
  return {allowed: false, remaining: 0, retryAfterMs: start + windowMs - now}
}`,
  'backend-error-response': `
function errorResponse(error: unknown) {
  const known = new Map([
    ['NOT_FOUND', [404, 'We could not find that item.']],
    ['INVALID_INPUT', [400, 'The request was not valid.']],
    ['UNAUTHENTICATED', [401, 'Please sign in first.']],
    ['FORBIDDEN', [403, 'You do not have access to this.']],
    ['CONFLICT', [409, 'That change conflicts with the current data.']],
  ] as [string, [number, string]][])
  if (error !== null && typeof error === 'object' && Object.hasOwn(error, 'code')) {
    const code = (error as {code: unknown}).code
    const entry = typeof code === 'string' ? known.get(code) : undefined
    if (entry) return {status: entry[0], body: {error: code, message: entry[1]}}
  }
  return {status: 500, body: {error: 'INTERNAL', message: 'Something went wrong. Please try again later.'}}
}`,
  'group-items-by-heading': `
function groupByHeading(items: {heading: string; title: string}[]) {
  const groups = new Map<string, string[]>()
  for (const item of items) {
    const heading = item.heading.trim()
    if (!heading) continue
    if (!groups.has(heading)) groups.set(heading, [])
    groups.get(heading)!.push(item.title)
  }
  return [...groups].map(([heading, titles]) => ({heading, titles}))
}`,
  'filter-chip-summary': `
function chipSummary(selected: string[], maxChips: number) {
  const seen = new Set<string>()
  const distinct: string[] = []
  for (const raw of selected) {
    const name = raw.trim()
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    distinct.push(name)
  }
  return {chips: distinct.slice(0, maxChips), hiddenCount: Math.max(0, distinct.length - maxChips)}
}`,
  'parse-sort-param': `
function parseSort(value: unknown) {
  const fields = ['title', 'createdAt', 'priority']
  if (value === undefined) return {ok: true, sort: {field: 'title', direction: 'asc'}}
  if (typeof value !== 'string') return {ok: false, error: 'INVALID_SORT'}
  const text = value.trim()
  if (!text) return {ok: true, sort: {field: 'title', direction: 'asc'}}
  const descending = text.startsWith('-')
  const field = descending ? text.slice(1) : text
  if (!fields.includes(field)) return {ok: false, error: 'INVALID_SORT'}
  return {ok: true, sort: {field, direction: descending ? 'desc' : 'asc'}}
}`,
  'page-response-envelope': `
function pageEnvelope(totalItems: number, page: number, pageSize: number, path: string) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (page > totalPages) return {ok: false, error: 'PAGE_NOT_FOUND'}
  const link = (target: number) => path + '?page=' + target + '&pageSize=' + pageSize
  return {ok: true, body: {totalItems, totalPages, page, pageSize, links: {self: link(page), prev: page > 1 ? link(page - 1) : null, next: page < totalPages ? link(page + 1) : null}}}
}`,
}
