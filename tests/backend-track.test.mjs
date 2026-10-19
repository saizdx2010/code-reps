import assert from 'node:assert/strict'
import test from 'node:test'
import { runAsyncRep } from '../src/runner.ts'
import { reps } from '../src/rep.ts'
import { paths } from '../src/path.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { backendServiceReps } from '../src/backend-service-reps.ts'
import { backendSolutions } from './fixtures/backend-solutions.mjs'

const failed = async (id, code) => (await runAsyncRep(code, id)).filter(result => !result.passed).map(result => result.name)
const solution = id => backendSolutions[id]

/** Each mutant names the authored check that must catch it, so a check that stops testing its rule fails here. */
async function assertCaught(id, mutants) {
  assert.deepEqual(await failed(id, solution(id)), [], `${id} reference`)
  for (const [code, check] of mutants) {
    assert.notEqual(code, solution(id), `${id}: a mutant for "${check}" did not change the reference`)
    assert.ok((await failed(id, code)).includes(check), `${id}: "${check}" did not catch ${code}`)
  }
}

test('backend service reps are pure handler functions on the Backend track with references and journeys', () => {
  const backend = paths.find(path => path.id === 'backend')
  const placed = new Set(backend.stages.flatMap(stage => stage.repIds))
  for (const rep of backendServiceReps) {
    assert.equal(rep.format, 'backend', rep.id)
    assert.equal(rep.category, 'Backend services', rep.id)
    assert.ok(rep.functionName, rep.id)
    assert.ok(placed.has(rep.id), `${rep.id} is on the Backend track`)
    assert.ok(backendSolutions[rep.id], `${rep.id} needs a reference solution`)
    assert.match(rep.note, /not a live|no live|directly/i, `${rep.id} says what its checks do not establish`)
  }
  assert.equal(backend.stages[0].title, 'What a request is')
  assert.equal(reps.find(rep => rep.id === backend.stages[0].repIds[0]).id, 'backend-split-target')
  const journey = journeys.find(item => item.id === 'request-anatomy')
  assert.deepEqual(recallVariants[journey.id], [journey.recall, journey.independent, journey.guided])
})

test('B1 target and query checks catch first-mark, decode-order, plus, and empty-name mistakes', async () => {
  const split = solution('backend-split-target')
  await assertCaught('backend-split-target', [
    [split.replace("target.indexOf('?')", "target.lastIndexOf('?')"), 'Splits only at the first "?"'],
    [split.replace("path === '' ? '/' : path", 'path'), 'Uses "/" when the path is empty'],
    [split.replace('target.slice(mark + 1)', 'decodeURIComponent(target.slice(mark + 1))'), 'Leaves encoded text as it is'],
    [split.replace('target.slice(mark + 1)', 'target.slice(mark)'), 'Splits the example'],
  ])
  const decode = solution('backend-decode-query')
  await assertCaught('backend-decode-query', [
    [decode.replace("query.split('&')", "decodeURIComponent(query).split('&')"), 'Keeps an escaped "&" inside its value'],
    [decode.replace("piece.indexOf('=')", "piece.lastIndexOf('=')"), 'Splits only at the first "="'],
    [decode.replaceAll(".replace(/\\+/g, ' ')", ''), 'Decodes "+" as a space and "%2B" as a plus'],
    [
      decode.replace(
        "[decodeURIComponent(rawName.replace(/\\+/g, ' ')), decodeURIComponent(rawValue.replace(/\\+/g, ' '))]",
        "[decodeURIComponent(rawName).replace(/\\+/g, ' '), decodeURIComponent(rawValue).replace(/\\+/g, ' ')]",
      ),
      'Decodes "+" as a space and "%2B" as a plus',
    ],
    [decode.replace("if (rawName === '') continue", ''), 'Skips a piece with an empty name without decoding it'],
    [decode.replace('decodeURIComponent(rawName', '(rawName'), 'Decodes names too'],
    [decode.replace("return { ok: false, error: 'MALFORMED_QUERY' }", 'continue'), 'Rejects a malformed escape in a value'],
    [
      `function decodeQuery(query: string) {
  return { ok: true, pairs: [...new URLSearchParams(query)].filter(([name]) => name !== '') }
}`,
      'Rejects a malformed escape in a value',
    ],
  ])
})

test('B1 request line, header, and body checks catch order, case, and boundary mistakes', async () => {
  const line = solution('backend-request-line')
  await assertCaught('backend-request-line', [
    [line.replace("line.split(' ')", 'line.trim().split(/ +/)'), 'Rejects two spaces in a row'],
    [line.replace("line.split(' ')", 'line.trim().split(/ +/)'), 'Rejects a trailing space'],
    [line.replace('.includes(method)', '.includes(method.toUpperCase())'), 'Matches methods exactly'],
    [line.replace("'PATCH', 'DELETE', 'OPTIONS'", "'PATCH', 'DELETE'"), 'Accepts OPTIONS'],
    [
      line
        .replace("if (!target.startsWith('/')) return { ok: false, status: 400, error: 'BAD_TARGET' }\n", '')
        .replace(
          'const [method, target, version] = parts\n',
          "const [method, target, version] = parts\n  if (!target.startsWith('/')) return { ok: false, status: 400, error: 'BAD_TARGET' }\n",
        ),
      'Checks the method before the target',
    ],
    [
      line.replace(
        "version !== 'HTTP/1.1' && version !== 'HTTP/1.0'",
        "version.toUpperCase() !== 'HTTP/1.1' && version.toUpperCase() !== 'HTTP/1.0'",
      ),
      'Matches the version exactly',
    ],
    [line.replace("target.startsWith('/')", 'target.length > 0'), 'Rejects a target without a leading "/"'],
  ])
  const header = solution('backend-header-value')
  await assertCaught('backend-header-value', [
    [header.replace('key.toLowerCase() !== wanted', 'key !== name'), 'Finds a header in another letter case'],
    [header.replace('const trimmed = value.trim()', 'const trimmed = value'), 'Joins the example in arrival order'],
    [header.replace('if (trimmed) values.push(trimmed)', 'values.push(trimmed)'), 'Leaves out empty values'],
    [
      header.replace("return found ? values.join(', ') : null", "return values.length ? values.join(', ') : null"),
      'Returns an empty string when every match is empty',
    ],
    [header.replace('key.toLowerCase() !== wanted', '!key.toLowerCase().startsWith(wanted)'), 'Does not match a longer name'],
    [header.replace("values.join(', ')", "values.join(',')"), 'Joins the example in arrival order'],
    [
      header.replace('if (trimmed) values.push(trimmed)', 'if (trimmed) values.splice(0, values.length, trimmed)'),
      'Ignores other headers between matches',
    ],
  ])
  const body = solution('backend-read-json-body')
  await assertCaught('backend-read-json-body', [
    [
      body.replace("request.body === '' ? { ok: true, data: null } : fail(400, 'BODY_NOT_ALLOWED')", '{ ok: true, data: null }'),
      'Rejects a GET with a body',
    ],
    [
      body.replace("if (request.method === 'GET' || request.method === 'HEAD')", "if (request.method === 'GET')"),
      'Rejects a HEAD with a body before anything else',
    ],
    [body.replace("name.toLowerCase() === 'content-type'", "name === 'Content-Type'"), 'Reads Content-Type in any letter case'],
    [body.replace(".trim().toLowerCase() !== 'application/json'", " !== 'application/json'"), 'Reads Content-Type in any letter case'],
    [body.replace('types.length !== 1 ||', 'types.length === 0 ||'), 'Rejects a repeated Content-Type'],
    [
      body.replace(
        ".split(';')[0].trim().toLowerCase() !== 'application/json'",
        ".trim().toLowerCase().startsWith('application/json') === false",
      ),
      'Does not accept a lookalike media type',
    ],
    [
      body.replace(".split(';')[0].trim().toLowerCase() !== 'application/json'", ".trim().toLowerCase() !== 'application/json'"),
      'Parses the example',
    ],
    [body.replace('request.body.length > 1000', 'request.body.length >= 1000'), 'Accepts a body of exactly 1000 characters'],
    [body.replace('request.body.length > 1000', 'request.body.length > 1001'), 'Rejects a body of 1001 characters'],
    [
      body
        .replace("  if (request.body.length > 1000) return fail(413, 'BODY_TOO_LARGE')\n", '')
        .replace(
          "  if (typeof data !== 'object'",
          "  if (request.body.length > 1000) return fail(413, 'BODY_TOO_LARGE')\n  if (typeof data !== 'object'",
        ),
      'Checks the size before parsing',
    ],
    [
      body.replace("typeof data !== 'object' || data === null || Array.isArray(data)", "typeof data !== 'object' || Array.isArray(data)"),
      'Rejects null',
    ],
    [
      body.replace("typeof data !== 'object' || data === null || Array.isArray(data)", "typeof data !== 'object' || data === null"),
      'Rejects an array',
    ],
    [
      body.replace(
        '  const types = request.headers',
        "  if (request.body.length > 1000) return fail(413, 'BODY_TOO_LARGE')\n  const types = request.headers",
      ),
      'Checks the media type before the size',
    ],
  ])
})

test('B2 routing checks catch segment-count, empty-parameter, 404/405, HEAD, and specificity mistakes', async () => {
  const match = solution('backend-match-route')
  await assertCaught('backend-match-route', [
    [match.replace('if (want.length !== got.length) return null', 'if (want.length > got.length) return null'), 'Rejects a longer path'],
    [match.replace('      if (!got[i]) return null\n', ''), 'Does not fill a parameter with an empty segment'],
    [match.replace('want[i] !== got[i]', 'want[i].toLowerCase() !== got[i].toLowerCase()'), 'Compares literal segments exactly'],
    [
      match.replace('params[want[i].slice(1)] = got[i]', 'params[want[i].slice(1)] = decodeURIComponent(got[i])'),
      'Keeps encoded text in a parameter',
    ],
    [
      match
        .replace("pattern.split('/')", "pattern.split('/').filter(Boolean)")
        .replace("path.split('/')", "path.split('/').filter(Boolean)"),
      'Treats a trailing slash as an extra segment',
    ],
  ])
  const route = solution('backend-route-request')
  await assertCaught('backend-route-request', [
    [route.replace("(method === 'HEAD' ? pick('GET') : undefined)", 'undefined'), 'Answers HEAD with a GET route'],
    [
      route.replace(
        "pick(method) ?? (method === 'HEAD' ? pick('GET') : undefined)",
        "(method === 'HEAD' ? pick('GET') ?? pick('HEAD') : pick(method))",
      ),
      'Prefers a HEAD route over GET',
    ],
    [
      route.replace(
        "const allow = new Set(matching.map(item => item.route.method))\n  if (allow.has('GET')) allow.add('HEAD')\n  return { status: 405, allow: [...allow].sort() }",
        "const allow = matching.map(item => item.route.method)\n  if (allow.includes('GET')) allow.push('HEAD')\n  return { status: 405, allow: allow.sort() }",
      ),
      'Lists each method once',
    ],
    [route.replace("if (allow.has('GET')) allow.add('HEAD')", "allow.add('HEAD')"), 'Does not add HEAD without GET'],
    [route.replace('if (!matching.length) return { status: 404 }', 'return { status: 404 }'), 'Answers 405 with the allowed methods'],
    [route.replace('allow: [...allow].sort()', 'allow: [...allow]'), 'Answers 405 with the allowed methods'],
    [route.replace('item.route.method === wanted', 'item.route.method.toUpperCase() === wanted.toUpperCase()'), 'Matches methods exactly'],
    [route.replace('matching.find(item', 'matching.findLast(item'), 'An earlier literal route wins'],
    [route.replace('        if (!got[i]) return null\n', ''), 'Treats a trailing slash as a different path'],
  ])
  const clean = solution('backend-normalize-path')
  await assertCaught('backend-normalize-path', [
    [clean.replace('if (!kept.length) return null', 'if (!kept.length) continue'), 'Rejects climbing above the root'],
    [clean.replace("path.split('/')", "decodeURIComponent(path).split('/')"), 'Does not decode escaped dots'],
    [clean.replace("segment === '' || segment === '.'", "segment === ''"), 'Drops "." segments'],
    [clean.replace("if (segment === '..') {", "if (segment.startsWith('..')) {"), 'Treats longer dot runs as ordinary segments'],
    [clean.replace("segment === '' || segment === '.'", "segment === '.'"), 'Drops repeated and trailing slashes'],
  ])
  const build = solution('backend-build-path')
  await assertCaught('backend-build-path', [
    [build.replace('parts.push(encodeURIComponent(value))', 'parts.push(value)'), 'Encodes a slash so it stays in one segment'],
    [build.replace('parts.push(encodeURIComponent(value))', 'parts.push(encodeURI(value))'), 'Encodes a slash so it stays in one segment'],
    [build.replace(" || value === '.' || value === '..'", ''), 'Returns null for ".."'],
    [build.replace(" || value === '.' || value === '..'", " || value === '..'"), 'Returns null for "."'],
    [
      build
        .replace("typeof value !== 'string' || value === ''", "value === undefined || value === ''")
        .replace('encodeURIComponent(value)', 'encodeURIComponent(String(value))'),
      'Returns null for a number',
    ],
    [
      build
        .replace("typeof value !== 'string' || value === ''", "value === undefined || value === ''")
        .replace('encodeURIComponent(value)', 'encodeURIComponent(String(value))'),
      'Does not treat inherited names as values',
    ],
    [build.replace(" || value === '.' || value === '..'", " || value.includes('.')"), 'Keeps a dot inside a longer value'],
  ])
  const pick = solution('backend-route-specificity')
  await assertCaught('backend-route-specificity', [
    [
      pick.replace('    return false\n  }\n  let best', '    return true\n  }\n  let best'),
      'Keeps list order for equally specific patterns',
    ],
    [pick.replace('      if (!rest) return null\n', ''), 'Does not let a wildcard match nothing'],
    [
      pick.replace("(segment === '*' ? 0 : segment.startsWith(':') ? 1 : 2)", "(segment === '*' ? 1 : segment.startsWith(':') ? 0 : 2)"),
      'Prefers a parameter over a wildcard',
    ],
    [
      pick.replace('got.length <= fixed.length', 'got.length < fixed.length').replace('      if (!rest) return null\n', ''),
      'Does not let a wildcard match a missing segment',
    ],
    [
      pick.replace(
        '    for (let i = 0; i < Math.min(x.length, y.length); i++)\n      if (rank(x[i]) !== rank(y[i])) return rank(x[i]) > rank(y[i])\n    return false',
        '    const literals = (list: string[]) => list.filter(segment => rank(segment) === 2).length\n    return literals(x) > literals(y)',
      ),
      'An earlier literal outweighs later literals',
    ],
  ])
})

test('B4 concurrent-write checks catch stale writes, falsy fields, weak tags, unseen changes, and value-only comparisons', async () => {
  const update = solution('backend-versioned-update')
  await assertCaught('backend-versioned-update', [
    [
      update.replace('update.expectedVersion !== record.version', 'update.expectedVersion < record.version'),
      'Refuses an update based on a later version',
    ],
    [
      update.replace('if (value === null) delete data[field]', 'if (!value) delete data[field]'),
      'Keeps values that are zero, false, or empty',
    ],
    [
      update.replace('const data: Record<string, unknown> = { ...record.data }', 'const data: Record<string, unknown> = record.data'),
      'Removes a field set to null',
    ],
    [
      update.replace('if (value === null) delete data[field]\n    else data[field] = value', 'data[field] = value'),
      'Removes a field set to null',
    ],
    [update.replace('version: record.version + 1', 'version: record.version'), 'Applies an update based on the current version'],
    [
      update.replace(
        'for (const [field, value] of Object.entries(update.changes)) {',
        'for (const [field, value] of Object.entries(update.changes)) {\n    if (typeof value === "object" && value !== null && typeof data[field] === "object") { data[field] = { ...(data[field] as object), ...value }; continue }',
      ),
      'Replaces a nested object whole',
    ],
  ])
  const put = solution('backend-if-match')
  await assertCaught('backend-if-match', [
    [
      put.replace('if (ifMatch === null) return { status: 428 }', 'if (ifMatch === null) return { status: 412 }'),
      'Requires an If-Match header',
    ],
    [
      put.replace(
        '  if (ifMatch === null) return { status: 428 }\n',
        '  if (ifMatch === null) return current === null ? { status: 412 } : { status: 428 }\n',
      ),
      'Requires the header even when nothing exists',
    ],
    [put.replace("!tag.trim().startsWith('W/') && tag.trim() === current.etag", 'tag.includes(current.etag)'), 'Never matches a weak tag'],
    [
      put.replace('tag.trim() === current.etag', "tag.trim().replaceAll('\"', '') === current.etag.replaceAll('\"', '')"),
      'Compares tags with their quotes',
    ],
    [put.replace("header === '*' ||", "header.includes('*') ||"), 'Treats * inside a list as an ordinary tag'],
    [
      put
        .replace("current !== null &&\n    (header === '*' ||", "(header === '*' ||")
        .replace('tag.trim() === current.etag', 'tag.trim() === current?.etag'),
      'Refuses * when nothing exists',
    ],
    [put.replace('Number(current.etag.slice(2, -1)) + 1', 'Number(current.etag.at(-2)) + 1'), 'Reads every digit of the number'],
    [put.replace("header.split(',').some(tag =>", '[header].some(tag =>'), 'Accepts a match anywhere in a list'],
  ])
  const lost = solution('backend-lost-updates')
  await assertCaught('backend-lost-updates', [
    [
      lost.replace('author !== null && author !== event.client &&', 'author !== event.client &&'),
      'Ignores a write that replaces the starting value',
    ],
    [lost.replace('author !== null && author !== event.client &&', 'author !== null &&'), 'Ignores a client replacing its own write'],
    [
      lost.replace('(read === undefined || writtenAt > read)', '(read !== undefined && writtenAt > read)'),
      'Counts any other change when the writer never read',
    ],
    [
      lost
        .replace(
          'let author: string | null = null',
          'let author: string | null = null\n  const writes: { client: string; at: number }[] = []',
        )
        .replace(
          'if (author !== null && author !== event.client && (read === undefined || writtenAt > read)) lost.push(position)',
          'if (writes.some(w => w.client !== event.client && (read === undefined || w.at > read))) lost.push(position)\n    writes.push({ client: event.client, at: position })',
        ),
      'Counts only the write that replaced the change',
    ],
    [
      lost.replace(
        "if (event.type === 'read') {\n      lastRead.set(event.client, position)",
        "if (event.type === 'read') {\n      if (!lastRead.has(event.client)) lastRead.set(event.client, position)",
      ),
      'Uses the latest read',
    ],
  ])
  const cas = solution('backend-compare-and-set')
  await assertCaught('backend-compare-and-set', [
    [cas.replace('Object.hasOwn(store, key) ? store[key] : null', 'store[key] ?? null'), 'Treats inherited names as missing'],
    [cas.replace('Object.hasOwn(store, key) ? store[key] : null', 'store[key] || null'), 'Treats an empty string as a value'],
    [
      cas.replace('const copy: Record<string, string> = { ...store }', 'const copy: Record<string, string> = store'),
      'Sets a value that still matches',
    ],
    [
      cas.replace('if (next === null) delete copy[key]\n  else copy[key] = next', 'copy[key] = next as string'),
      'Removes a key when next is null',
    ],
    [
      cas.replace('if (current !== expected)', 'if (current !== null && expected !== null && current !== expected)'),
      'Refuses to create a key that exists',
    ],
    [cas.replace('if (current !== expected)', 'if (current?.toLowerCase() !== expected?.toLowerCase())'), 'Compares values exactly'],
  ])
  const replay = solution('backend-replay-writes')
  await assertCaught('backend-replay-writes', [
    [replay.replace('      known.set(event.client, version)\n    } else', '    } else'), 'Lets a client write again after its own write'],
    [
      replay.replace('known.get(event.client) === version', '(known.get(event.client) ?? version) === version'),
      'Refuses a write from a client that never read',
    ],
    [
      replay
        .replace('const known = new Map<string, number>()', 'const known = new Map<string, string>()')
        .replace("if (event.type === 'read') known.set(event.client, version)", "if (event.type === 'read') known.set(event.client, value)")
        .replace('known.get(event.client) === version', 'known.get(event.client) === value')
        .replace('      known.set(event.client, version)\n', '      known.set(event.client, value)\n'),
      'Refuses a stale write after a change was undone',
    ],
    [
      replay.replace(
        '} else refused.push(position)',
        '} else {\n      refused.push(position)\n      known.set(event.client, version)\n    }',
      ),
      'Keeps refusing until the client reads again',
    ],
    [
      replay.replace(
        "if (event.type === 'read') known.set(event.client, version)",
        "if (event.type === 'read' && !known.has(event.client)) known.set(event.client, version)",
      ),
      'A read records the version at that moment',
    ],
  ])
})

test('B5 background-job checks catch backoff, lease, duplicate, ordering, and tie-break mistakes', async () => {
  const fail = solution('backend-job-failure')
  await assertCaught('backend-job-failure', [
    [fail.replace('2 ** (job.attempts - 1)', '2 ** job.attempts'), 'Waits the base delay after the first attempt'],
    [fail.replace('job.attempts >= policy.maxAttempts', 'job.attempts > policy.maxAttempts'), 'Gives up at the last allowed attempt'],
    [
      fail
        .replace("  if (!error.retryable) return { action: 'dead-letter', reason: 'PERMANENT_ERROR' }\n", '')
        .replace(
          "return { action: 'dead-letter', reason: 'TOO_MANY_ATTEMPTS' }",
          "return { action: 'dead-letter', reason: 'TOO_MANY_ATTEMPTS' }\n  if (!error.retryable) return { action: 'dead-letter', reason: 'PERMANENT_ERROR' }",
        ),
      'Reports a permanent error before the attempt limit',
    ],
    [
      fail.replace('Math.min(policy.maxDelayMs, ', '(').replace(' * 2 ** (job.attempts - 1))', ' * 2 ** (job.attempts - 1))'),
      'Caps a long wait',
    ],
    [
      fail.replace("  if (!error.retryable) return { action: 'dead-letter', reason: 'PERMANENT_ERROR' }\n", ''),
      'Stops at once for a permanent error',
    ],
  ])
  const claim = solution('backend-claim-job')
  await assertCaught('backend-claim-job', [
    [claim.replace('job.lease.until <= now', 'job.lease.until < now'), 'Reclaims a job whose lease ran out'],
    [
      claim.replace(
        'job.lease === null || job.lease.until <= now',
        'job.lease === null || job.lease.until <= now || job.lease.worker === worker',
      ),
      'Does not let a worker reclaim its own live lease',
    ],
    [claim.replace('job.runAt <= now &&', ''), 'Skips a job that is not due yet'],
    [claim.replace('job.runAt <= now', 'job.runAt < now'), 'Takes a job due exactly now'],
    [claim.replace('job.runAt < jobs[chosen].runAt', 'job.runAt <= jobs[chosen].runAt'), 'Breaks a tie by position in the list'],
    [
      claim.replace('(chosen === -1 || job.runAt < jobs[chosen].runAt)', 'chosen === -1'),
      'Picks the earliest runAt, not the first in the list',
    ],
    [claim.replace('attempts: job.attempts + 1, ', ''), 'Claims a waiting job'],
  ])
  const dedupe = solution('backend-dedupe-deliveries')
  await assertCaught('backend-dedupe-deliveries', [
    [dedupe.replace('    seen.add(message.id)\n', ''), 'Applies a message once and skips its repeat'],
    [dedupe.replace('const seen = new Set(processedIds)', 'const seen = new Set<string>()'), 'Skips a message processed before'],
    [dedupe.replace('processedIds: [...processedIds, ...applied]', 'processedIds: applied'), 'Totals several accounts'],
    [
      dedupe
        .replace('const seen = new Set(processedIds)', 'const seen = new Set(processedIds)\n  const keys = new Set<string>()')
        .replace(
          'if (seen.has(message.id)) {',
          'const key = message.id + message.account + message.amount\n    if (seen.has(message.id) && keys.has(key)) {',
        )
        .replace('    seen.add(message.id)\n', '    seen.add(message.id)\n    keys.add(key)\n'),
      'Skips a repeat even when its content differs',
    ],
    [
      dedupe
        .replace('seen.has(message.id)', 'seen.has(message.id.toLowerCase())')
        .replace('seen.add(message.id)', 'seen.add(message.id.toLowerCase())'),
      'Compares IDs exactly',
    ],
    [
      dedupe.replace(
        'balances[message.account] = (balances[message.account] ?? 0) + message.amount',
        'if (message.amount) balances[message.account] = (balances[message.account] ?? 0) + message.amount',
      ),
      'Counts a zero amount as applied',
    ],
  ])
  const relay = solution('backend-outbox-relay')
  await assertCaught('backend-outbox-relay', [
    [
      relay.replace(
        '    if (results[index] !== true) break\n    published.push(row.id)',
        '    if (results[index] === true) published.push(row.id)',
      ),
      'Does not try rows after a failure',
    ],
    [relay.replace('.sort((a, b) => a.id - b.id)', '.sort((a, b) => String(a.id).localeCompare(String(b.id)))'), 'Sorts ids as numbers'],
    [relay.replace('.slice(0, batchSize)', ''), 'Publishes at most batchSize rows'],
    [relay.replace('results[index] !== true', 'results[index] === false'), 'Treats a missing result as a failure'],
    [relay.replace('.filter(row => row.publishedAt === null)', ''), 'Skips rows that are already published'],
    [relay.replace('.sort((a, b) => a.id - b.id)', ''), 'Publishes in id order and stops at a failure'],
  ])
  const queue = solution('backend-queue-simulation')
  await assertCaught('backend-queue-simulation', [
    [
      queue.replace('(a.runAt === b.runAt && a.order < b.order)', '(a.runAt === b.runAt && a.id < b.id)'),
      'Breaks a time tie by the order jobs were queued',
    ],
    [queue.replace('runAt: clock + Math.min', 'runAt: Math.min'), 'Waits for the earliest retry'],
    [queue.replace('attempts >= policy.maxAttempts', 'attempts > policy.maxAttempts'), 'Gives up after the last attempt'],
    [
      queue.replace('Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempts - 1))', 'policy.baseDelayMs * 2 ** (attempts - 1)'),
      'Caps a long wait',
    ],
    [queue.replace('2 ** (attempts - 1)', '2 ** attempts'), 'Runs other work while a retry waits'],
    [
      queue.replace("outcomes[entry.id]?.[attempts - 1] ?? 'ok'", "outcomes[entry.id]?.[attempts - 1] ?? 'retryable'"),
      'Treats a missing outcome as ok',
    ],
    [
      `function runQueue(jobIds: string[], outcomes: Record<string, string[]>, policy: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number }) {
  const completed: string[] = []
  const deadLetters: { id: string; reason: string; attempts: number }[] = []
  let clock = 0
  for (const id of jobIds) {
    for (let attempts = 1; ; attempts++) {
      const outcome = outcomes[id]?.[attempts - 1] ?? 'ok'
      if (outcome === 'ok') { completed.push(id); break }
      if (outcome === 'permanent') { deadLetters.push({ id, reason: 'PERMANENT_ERROR', attempts }); break }
      if (attempts >= policy.maxAttempts) { deadLetters.push({ id, reason: 'TOO_MANY_ATTEMPTS', attempts }); break }
      clock += Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempts - 1))
    }
  }
  return { completed, deadLetters, finishedAt: clock }
}`,
      'Runs other work while a retry waits',
    ],
  ])
})

test('B6 rate-limit checks catch refill, window-edge, rounding, weighting, and per-key mistakes', async () => {
  const bucket = solution('backend-token-bucket')
  await assertCaught('backend-token-bucket', [
    [
      bucket.replace('tokens === capacity ? now : bucket.updatedAt + added * refillMs', 'added > 0 ? now : bucket.updatedAt'),
      'Keeps the time toward the next token',
    ],
    [bucket.replace('tokens === capacity ? now : ', ''), 'Spends a token from a full bucket'],
    [bucket.replace('Math.min(capacity, bucket.tokens + added)', 'bucket.tokens + added'), 'Stops refilling at capacity'],
    [
      bucket.replace('Math.floor((now - bucket.updatedAt) / refillMs)', 'Math.round((now - bucket.updatedAt) / refillMs)'),
      'Refuses one millisecond before a token arrives',
    ],
    [bucket.replace('retryAfterMs: updatedAt + refillMs - now', 'retryAfterMs: refillMs'), 'Measures the wait from the last refill'],
    [bucket.replace('tokens === capacity ? now', 'tokens === capacity && added > 0 ? now'), 'Spends a token from a full bucket'],
    [bucket.replace('tokens === capacity ? now', 'tokens > capacity ? now'), 'Starts the refill time again when the bucket fills exactly'],
  ])
  const slide = solution('backend-sliding-log')
  await assertCaught('backend-sliding-log', [
    [slide.replace('t > now - windowMs', 't >= now - windowMs'), 'Drops a time exactly one window old'],
    [slide.replace('counted[counted.length - limit]', 'counted[0]'), 'Waits for several times when the count is over the limit'],
    [slide.replace('.sort((a, b) => a - b)', ''), 'Sorts times before choosing'],
    [slide.replace(' && t <= now', ''), 'Ignores times later than now'],
    [
      slide.replace('t > now - windowMs && t <= now', 't >= Math.floor(now / windowMs) * windowMs && t <= now'),
      'Counts requests across a fixed-window boundary',
    ],
    [
      slide.replace('remaining: limit - counted.length - 1', 'remaining: limit - counted.length'),
      'Allows a request and reports what remains',
    ],
  ])
  const response = solution('backend-limit-response')
  await assertCaught('backend-limit-response', [
    [
      response.replace('Math.ceil(decision.retryAfterMs / 1000)', 'Math.round(decision.retryAfterMs / 1000)'),
      'Rounds the wait up to whole seconds',
    ],
    [
      response.replace('Math.max(1, Math.ceil(decision.retryAfterMs / 1000))', 'Math.ceil(decision.retryAfterMs / 1000)'),
      'Asks for at least one second',
    ],
    [response.replace('Math.ceil(decision.retryAfterMs / 1000)', 'Math.floor(decision.retryAfterMs / 1000) + 1'), 'Keeps an exact second'],
    [response.replace('Math.max(0, decision.remaining)', 'decision.remaining'), 'Never reports a negative remainder'],
    [
      response.replace('decision.allowed ? Math.max(0, decision.remaining) : 0', 'Math.max(0, decision.remaining)'),
      'Reports zero remaining when refused',
    ],
    [
      response.replace(
        'String(Math.max(1, Math.ceil(decision.retryAfterMs / 1000)))',
        'Math.max(1, Math.ceil(decision.retryAfterMs / 1000)) as unknown as string',
      ),
      'Rounds the wait up to whole seconds',
    ],
  ])
  const counter = solution('backend-sliding-counter')
  await assertCaught('backend-sliding-counter', [
    [
      counter.replace('const overlap = start + windowMs - now', 'const overlap = now - start'),
      'Counts the whole previous window at the start',
    ],
    [
      counter.replace('Math.floor((previousCount * overlap) / windowMs)', 'Math.round((previousCount * overlap) / windowMs)'),
      'Rounds the estimate down',
    ],
    [counter.replace('used < limit', 'used <= limit'), 'Refuses when the estimate reaches the limit'],
    [
      counter.replace('Math.floor((previousCount * overlap) / windowMs)', 'Math.floor(previousCount / windowMs) * overlap'),
      'Weights the previous count',
    ],
    [
      counter
        .replace('Math.floor(now / windowMs) * windowMs', 'Math.floor(now / 1000) * 1000')
        .replace('start + windowMs - now', 'start + 1000 - now')
        .replace('/ windowMs)', '/ 1000)'),
      'Uses the supplied window size',
    ],
  ])
  const callers = solution('backend-limit-callers')
  await assertCaught('backend-limit-callers', [
    [
      callers.replace('{ tokens: capacity, refilledAt: at }', '{ tokens: 0, refilledAt: at }'),
      'Starts a new key full at its first request',
    ],
    [
      callers.replace(
        '    buckets.set(key, { tokens, refilledAt })\n    return { allowed: false',
        '    buckets.set(key, { tokens, refilledAt: at })\n    return { allowed: false',
      ),
      'Refused requests spend nothing',
    ],
    [
      callers.replace('tokens === capacity ? at : bucket.refilledAt + added * refillMs', 'added > 0 ? at : bucket.refilledAt'),
      'Keeps the time toward the next token across requests',
    ],
    [
      callers.replace('Math.min(capacity, bucket.tokens + added)', 'bucket.tokens + added'),
      'Stops refilling at capacity after a long pause',
    ],
    [
      callers
        .replace('buckets.get(key)', 'buckets.get(key.toLowerCase())')
        .replaceAll('buckets.set(key,', 'buckets.set(key.toLowerCase(),'),
      'Compares keys exactly',
    ],
    [
      callers.replace('buckets.get(key) ??', "buckets.get('all') ??").replaceAll('buckets.set(key,', "buckets.set('all',"),
      'Gives each key its own bucket',
    ],
  ])
})

test('B7 API evolution checks catch version, compatibility, date, delivery, and undo-order mistakes', async () => {
  const version = solution('backend-choose-version')
  await assertCaught('backend-choose-version', [
    [version.replace('/^v[0-9]+$/', '/^v[0-9]+/'), 'Leaves a lookalike segment in the path'],
    [version.replace('/^v[0-9]+$/', '/^v[0-9]+$/i'), 'Matches only a lowercase v'],
    [version.replace('/^v[0-9]+$/', '/^v[0-9]$/'), 'Reads a version with several digits'],
    [version.replace(" || '/'", ''), 'Routes a bare version to "/"'],
    [version.replace("name.toLowerCase() === 'api-version'", "name === 'Api-Version'"), 'Finds the header in any letter case and trims it'],
    [
      version.replace("header && header[1].trim() !== '' ? header[1].trim() : null", 'header ? header[1].trim() : null'),
      'Treats a blank header as no header',
    ],
    [
      version.replace(
        "if (fromPath !== null && fromHeader !== null && fromPath !== fromHeader) return { ok: false, status: 400, error: 'VERSION_CONFLICT' }\n",
        '',
      ),
      'Reports a conflict before an unknown version',
    ],
    [version.replace('?? fallback', "?? 'v1'"), 'Uses the supplied default'],
    [version.replace('?? fallback', '?? supported[supported.length - 1]'), 'Uses the default when nothing names a version'],
  ])
  const classify = solution('backend-classify-change')
  await assertCaught('backend-classify-change', [
    [classify.replace("breaks = direction === 'response'", 'breaks = false'), 'A removed response field is breaking'],
    [classify.replace("breaks = direction === 'response'", 'breaks = true'), 'A removed request field is compatible'],
    [classify.replace("direction === 'request' && now!.required", 'now!.required'), 'An added response field is compatible'],
    [classify.replace("direction === 'request' && now!.required", 'false'), 'A new required request field is breaking'],
    [classify.replace("direction === 'request' && now!.required", "direction === 'request'"), 'A new optional request field is compatible'],
    [
      classify.replace(
        "(direction === 'response' ? old.required && !now.required : !old.required && now.required)",
        '(!old.required && now.required)',
      ),
      'A response field that may now be missing is breaking',
    ],
    [
      classify.replace(
        "(direction === 'response' ? old.required && !now.required : !old.required && now.required)",
        '(old.required && !now.required)',
      ),
      'Required changes break requests in the other direction',
    ],
    [classify.replace('breaks = old.type !== now.type ||', 'breaks ='), 'A changed request type is breaking'],
    [classify.replace('breaks = old.type !== now.type ||', 'breaks ='), 'A type change outweighs a compatible change'],
    [classify.replace('...Object.keys(after)])].sort()', '...Object.keys(after)])]'), 'Sorts names and leaves unchanged fields out'],
    [
      classify.replace('    else if (old.type === now.type && old.required === now.required) continue\n', ''),
      'Reports nothing for identical fields',
    ],
  ])
  const deprecation = solution('backend-deprecation-headers')
  await assertCaught('backend-deprecation-headers', [
    [
      deprecation
        .replace('const at = Date.parse(now)', 'const at = now')
        .replace('const deprecated = Date.parse(policy.deprecatedAt)', 'const deprecated = policy.deprecatedAt')
        .replace('const sunset = Date.parse(policy.sunsetAt)', 'const sunset = policy.sunsetAt')
        .replace("'@' + deprecated / 1000", "'@' + Date.parse(deprecated) / 1000")
        .replace('new Date(sunset).toUTCString()', 'new Date(Date.parse(sunset)).toUTCString()'),
      'Reaches a sunset given with an offset',
    ],
    [deprecation.replace('at >= sunset', 'at > sunset'), 'Answers 410 Gone from the exact sunset time'],
    [deprecation.replace('at < deprecated', 'at <= deprecated'), 'Starts warning at the exact deprecation time'],
    [deprecation.replace("'@' + deprecated / 1000", "'@' + deprecated"), 'Announces the deprecation in the example'],
    [deprecation.replace('new Date(sunset).toUTCString()', 'new Date(sunset).toISOString()'), 'Announces the deprecation in the example'],
    [
      deprecation.replace('return { status: 410, headers: { Link: link } }', 'return { status: 404, headers: { Link: link } }'),
      'Keeps answering 410 after the sunset',
    ],
    [
      deprecation.replace(
        'return { status: 410, headers: { Link: link } }',
        'return { status: 410, headers: { Sunset: new Date(sunset).toUTCString(), Link: link } }',
      ),
      'Answers 410 Gone from the exact sunset time',
    ],
    [
      deprecation
        .replace('const at = Date.parse(now)', 'const at = Date.parse(now.slice(0, 10))')
        .replace('const deprecated = Date.parse(policy.deprecatedAt)', 'const deprecated = Date.parse(policy.deprecatedAt.slice(0, 10))'),
      'Uses the time of day, not only the date',
    ],
  ])
  const deliveries = solution('backend-webhook-deliveries')
  await assertCaught('backend-webhook-deliveries', [
    [
      deliveries.replace('delivery.sequence <= (last.get', 'delivery.sequence < (last.get'),
      'Skips a new delivery of a sequence already applied',
    ],
    [
      deliveries.replace("      skipped.push({ deliveryId: delivery.deliveryId, reason: 'STALE' })\n      continue\n", ''),
      'Skips an older change that arrives late',
    ],
    [
      deliveries.replaceAll('last.get(delivery.resource)', "last.get('all')").replace('last.set(delivery.resource,', "last.set('all',"),
      'Keeps sequences separate for each resource',
    ],
    [
      deliveries
        .replace('    seen.add(delivery.deliveryId)\n', '')
        .replace(
          '    last.set(delivery.resource, delivery.sequence)\n',
          '    seen.add(delivery.deliveryId)\n    last.set(delivery.resource, delivery.sequence)\n',
        ),
      'Calls a repeat of a skipped delivery a duplicate',
    ],
    [
      deliveries
        .replaceAll('seen.has(delivery.deliveryId)', 'seen.has(delivery.deliveryId.toLowerCase())')
        .replace('seen.add(delivery.deliveryId)', 'seen.add(delivery.deliveryId.toLowerCase())'),
      'Compares delivery IDs exactly',
    ],
    [deliveries.replace('(last.get(delivery.resource) ?? 0)', '(last.get(delivery.resource) ?? 1)'), 'Applies new changes in order'],
    [
      deliveries.replace(
        'delivery.sequence <= (last.get(delivery.resource) ?? 0)',
        'delivery.sequence !== (last.get(delivery.resource) ?? 0) + 1',
      ),
      'Accepts any first sequence for a resource',
    ],
    [
      deliveries.replace(
        "    if (seen.has(delivery.deliveryId)) {\n      skipped.push({ deliveryId: delivery.deliveryId, reason: 'DUPLICATE' })\n      continue\n    }\n    seen.add(delivery.deliveryId)\n",
        '',
      ),
      'Skips the repeated delivery in the example',
    ],
  ])
  const downgrade = solution('backend-downgrade-response')
  await assertCaught('backend-downgrade-response', [
    [downgrade.replace('(a.version < b.version ? 1 : -1)', '(a.version < b.version ? -1 : 1)'), 'Undoes the newest change first'],
    [downgrade.replace('.sort((a, b) => (a.version < b.version ? 1 : -1))', '.reverse()'), 'Handles changes listed newest first'],
    [downgrade.replace('change.version > pinned', 'change.version >= pinned'), 'Keeps a change released on the pinned date'],
    [downgrade.replace('change.version > pinned', 'true'), 'Undoes only the changes after the pinned date'],
    [downgrade.replace('      if (Object.hasOwn(result, change.to)) {\n', '      {\n'), 'Skips a rename whose field is missing'],
    [downgrade.replace('    else result[change.field] = change.value\n', ''), 'Restores a removed field with its old value'],
    [downgrade.replace("} else if (change.kind === 'add') delete result[change.field]", '}'), 'Removes a field added later'],
  ])
  // Undoing on the caller's body changes the input, which the runner reports separately from a wrong result.
  const mutating = downgrade.replace('const result: Record<string, unknown> = { ...body }', 'const result: Record<string, unknown> = body')
  assert.ok((await runAsyncRep(mutating, 'backend-downgrade-response')).some(result => result.message?.includes('changed its input')))
})
