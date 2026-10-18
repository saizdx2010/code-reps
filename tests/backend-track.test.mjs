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
