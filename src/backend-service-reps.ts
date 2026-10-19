import type { Rep } from './rep-types.ts'

// Backend track service reps. Handlers are pure functions over request-shaped values: the checks call them
// directly, with no live server, sockets, or clock. Keep rep IDs and check names stable once shipped.

const jsonPadding = (length: number) => '{"a":1}' + ' '.repeat(length - 7)

const orderRoutes = [
  { method: 'GET', pattern: '/orders', name: 'list' },
  { method: 'POST', pattern: '/orders', name: 'create' },
  { method: 'GET', pattern: '/orders/new', name: 'new-form' },
  { method: 'GET', pattern: '/orders/:id', name: 'show' },
  { method: 'DELETE', pattern: '/orders/:id', name: 'remove' },
  { method: 'POST', pattern: '/orders/:id/cancel', name: 'cancel' },
]

export const backendServiceReps: Rep[] = [
  {
    id: 'backend-split-target',
    title: 'Split a request target',
    category: 'Backend services',
    format: 'backend',
    context:
      'A server reads the target from the first line of a request, such as /orders?status=open. Before it can choose what to run, it needs the path and the query as separate pieces.',
    prompt:
      'Implement splitTarget(target). Return {path, query}. path is the text before the first "?" and query is the text after it. When there is no "?", query is "". When the text before the first "?" is empty, path is "/". Do not decode or change any characters.',
    brief: {
      summary: 'Implement splitTarget(target) and return {path, query}.',
      rules: [
        'path is the text before the first "?" and query is the text after it.',
        'When there is no "?", query is "".',
        'When the text before the first "?" is empty, path is "/".',
      ],
      edgeCases: ['A later "?" belongs to the query.', 'Do not decode or change any characters.'],
    },
    example: { input: 'splitTarget("/orders?status=open")', output: '{path: "/orders", query: "status=open"}' },
    note: 'target is a string of at most 200 printable ASCII characters and never contains "#". A target may end with "?", which gives an empty query. These are strings passed to your function, not a live HTTP request. Checks cover a target without a query, an empty query, a second "?", and a target with no path.',
    vocabulary: [
      { term: 'Request target', meaning: 'the path and optional query after the method in a request, such as /orders?status=open' },
      { term: 'Path', meaning: 'the part of a target that names the resource, such as /orders' },
    ],
    planPrompt: 'Where is the first "?" in /search?q=a?b, and what are the two pieces? What does a target with no "?" return?',
    starter:
      'function splitTarget(target: string): { path: string; query: string } {\n  // Split at the first "?".\n  return { path: target, query: "" }\n}\n',
    functionName: 'splitTarget',
    preserveInput: true,
    hints: [
      'Find the position of the first "?"; indexOf returns -1 when there is none.',
      'With a position, the path is the text before it and the query is the text after it. Without one, the whole target is the path.',
      'Use slice on each side of that one position so a later "?" stays inside the query, then replace an empty path with "/".',
    ],
    checks: [
      { name: 'Splits the example', input: ['/orders?status=open'], expected: { path: '/orders', query: 'status=open' } },
      { name: 'Returns an empty query when there is no "?"', input: ['/orders/42'], expected: { path: '/orders/42', query: '' } },
      { name: 'Keeps the root path', input: ['/'], expected: { path: '/', query: '' } },
      { name: 'Returns an empty query after a trailing "?"', input: ['/orders?'], expected: { path: '/orders', query: '' } },
      { name: 'Splits only at the first "?"', input: ['/search?q=a?b'], expected: { path: '/search', query: 'q=a?b' } },
      { name: 'Uses "/" when the path is empty', input: ['?page=2'], expected: { path: '/', query: 'page=2' } },
      { name: 'Uses "/" for a lone "?"', input: ['?'], expected: { path: '/', query: '' } },
      {
        name: 'Leaves encoded text as it is',
        input: ['/files/a%20b?name=x%3Fy'],
        expected: { path: '/files/a%20b', query: 'name=x%3Fy' },
      },
      {
        name: 'Keeps several pairs together',
        input: ['/orders?status=open&page=2'],
        expected: { path: '/orders', query: 'status=open&page=2' },
      },
    ],
  },
  {
    id: 'backend-decode-query',
    title: 'Decode a query string',
    category: 'Backend services',
    format: 'backend',
    context:
      'A search endpoint receives the raw query after the "?", such as q=red+wine&tag=gift&tag=sale. A name can appear more than once and values may contain escapes, so the server decodes the query into a list of pairs before reading any filter.',
    prompt:
      'Implement decodeQuery(query). Split query at every "&" and skip empty pieces. Split each piece at its first "=": the name is before it and the value after it, or the value is "" when the piece has no "=". Skip a piece whose name is empty without decoding it. In each remaining name and value, replace every "+" with a space, then decode percent-escapes with decodeURIComponent. Return {ok: true, pairs}, where pairs lists [name, value] in their original order, keeping repeated names. If any name or value has a malformed escape, return {ok: false, error: "MALFORMED_QUERY"}.',
    brief: {
      summary: 'Implement decodeQuery(query) and return its name-value pairs in order.',
      rules: [
        'Split query at every "&" and skip empty pieces.',
        'Split each piece at its first "=": the name is before it and the value after it, or the value is "" when the piece has no "=".',
        'In each name and value, replace every "+" with a space, then decode percent-escapes with decodeURIComponent.',
        'Return {ok: true, pairs}, where pairs lists [name, value] in their original order, keeping repeated names.',
      ],
      edgeCases: [
        'Skip a piece whose name is empty, such as "=x", without decoding it.',
        'If any name or value has a malformed escape, return {ok: false, error: "MALFORMED_QUERY"}.',
      ],
    },
    example: {
      input: 'decodeQuery("q=red+wine&tag=gift&tag=sale")',
      output: '{ok: true, pairs: [["q", "red wine"], ["tag", "gift"], ["tag", "sale"]]}',
    },
    note: 'query is the text after the first "?" (it never starts with "?") and has at most 200 characters. "%2B" decodes to a literal "+", and "%26" decodes to a literal "&" that does not split pairs. decodeURIComponent throws for a malformed escape such as "%G1" or a lone "%E0". These are strings passed to your function, not a live HTTP request.',
    vocabulary: [
      { term: 'Percent-encoding', meaning: 'writing a character as % and two hex digits, such as %20 for a space' },
      { term: 'Repeated parameter', meaning: 'a query name that appears more than once, such as tag=a&tag=b' },
    ],
    planPrompt:
      'Take a&b=1+2&&b=%2B and write each step: the pieces, the name and value of each, and the decoded pairs. Where would a malformed escape stop you?',
    starter:
      'type Decoded = { ok: true; pairs: [string, string][] } | { ok: false; error: "MALFORMED_QUERY" }\n\nfunction decodeQuery(query: string): Decoded {\n  // Split into pairs, then decode each name and value.\n  return { ok: true, pairs: [] }\n}\n',
    functionName: 'decodeQuery',
    preserveInput: true,
    hints: [
      'Settle the structure before you decode anything: an escape can stand for a character that would otherwise split the text.',
      'Within a piece only the first "=" separates name from value; any later "=" is part of the value.',
      'decodeURIComponent throws a URIError for a malformed escape, so catch it and return the error result.',
    ],
    checks: [
      {
        name: 'Decodes the example',
        input: ['q=red+wine&tag=gift&tag=sale'],
        expected: {
          ok: true,
          pairs: [
            ['q', 'red wine'],
            ['tag', 'gift'],
            ['tag', 'sale'],
          ],
        },
      },
      { name: 'Returns no pairs for an empty query', input: [''], expected: { ok: true, pairs: [] } },
      {
        name: 'Gives an empty value to a name without "="',
        input: ['flag&x='],
        expected: {
          ok: true,
          pairs: [
            ['flag', ''],
            ['x', ''],
          ],
        },
      },
      { name: 'Splits only at the first "="', input: ['expr=a=b'], expected: { ok: true, pairs: [['expr', 'a=b']] } },
      {
        name: 'Skips empty pieces',
        input: ['&a=1&&b=2&'],
        expected: {
          ok: true,
          pairs: [
            ['a', '1'],
            ['b', '2'],
          ],
        },
      },
      {
        name: 'Decodes "+" as a space and "%2B" as a plus',
        input: ['sum=1+2&op=%2B'],
        expected: {
          ok: true,
          pairs: [
            ['sum', '1 2'],
            ['op', '+'],
          ],
        },
      },
      {
        name: 'Keeps an escaped "&" inside its value',
        input: ['brand=A%26W&size=2'],
        expected: {
          ok: true,
          pairs: [
            ['brand', 'A&W'],
            ['size', '2'],
          ],
        },
      },
      {
        name: 'Decodes names too',
        input: ['first+name=Ada&caf%C3%A9=yes'],
        expected: {
          ok: true,
          pairs: [
            ['first name', 'Ada'],
            ['café', 'yes'],
          ],
        },
      },
      {
        name: 'Keeps repeated names in order',
        input: ['tag=b&tag=a&tag=b'],
        expected: {
          ok: true,
          pairs: [
            ['tag', 'b'],
            ['tag', 'a'],
            ['tag', 'b'],
          ],
        },
      },
      { name: 'Skips a piece with an empty name without decoding it', input: ['=%zz&a=1'], expected: { ok: true, pairs: [['a', '1']] } },
      { name: 'Rejects a malformed escape in a value', input: ['a=%G1'], expected: { ok: false, error: 'MALFORMED_QUERY' } },
      { name: 'Rejects an incomplete escape in a name', input: ['a%2=1'], expected: { ok: false, error: 'MALFORMED_QUERY' } },
      { name: 'Rejects an escape that is not valid text', input: ['q=%E0'], expected: { ok: false, error: 'MALFORMED_QUERY' } },
      { name: 'Rejects even after valid pairs', input: ['a=1&b=%'], expected: { ok: false, error: 'MALFORMED_QUERY' } },
    ],
  },
  {
    id: 'backend-request-line',
    title: 'Parse a request line',
    category: 'Backend services',
    format: 'backend',
    context:
      'The first line of every HTTP/1 request names the method, the target, and the protocol version, such as GET /orders?status=open HTTP/1.1. A strict server reads it exactly and answers anything else with a precise error.',
    prompt:
      'Implement parseRequestLine(line). A valid line has exactly three non-empty parts separated by single spaces: method, target, and version. Return {ok: true, method, path, query, version}, where path is the target before its first "?" and query is the text after it ("" when there is no "?"). Otherwise return {ok: false, status, error}, checking in this order: a line without exactly three non-empty parts gives 400 "MALFORMED_LINE"; a method other than GET, HEAD, POST, PUT, PATCH, DELETE, or OPTIONS gives 501 "UNKNOWN_METHOD"; a target that does not start with "/" gives 400 "BAD_TARGET"; a version other than HTTP/1.1 or HTTP/1.0 gives 505 "UNSUPPORTED_VERSION".',
    brief: {
      summary: 'Implement parseRequestLine(line) and return {ok: true, method, path, query, version} or {ok: false, status, error}.',
      rules: [
        'A valid line has exactly three non-empty parts separated by single spaces: method, target, and version.',
        'path is the target before its first "?" and query is the text after it ("" when there is no "?").',
        'Not exactly three non-empty parts gives 400 "MALFORMED_LINE".',
        'A method other than GET, HEAD, POST, PUT, PATCH, DELETE, or OPTIONS gives 501 "UNKNOWN_METHOD".',
        'A target that does not start with "/" gives 400 "BAD_TARGET".',
        'A version other than HTTP/1.1 or HTTP/1.0 gives 505 "UNSUPPORTED_VERSION".',
      ],
      edgeCases: ['Check in the order listed; the first failure wins.', 'Methods and versions match exactly, including letter case.'],
    },
    example: {
      input: 'parseRequestLine("GET /orders?status=open HTTP/1.1")',
      output: '{ok: true, method: "GET", path: "/orders", query: "status=open", version: "HTTP/1.1"}',
    },
    note: 'line has at most 300 printable ASCII characters and no line break. Real servers also accept other target forms, such as a full URL sent to a proxy or * for OPTIONS; this contract accepts only targets that start with "/". These are strings passed to your function, not a live HTTP request.',
    vocabulary: [
      { term: 'Request line', meaning: 'the first line of a request, holding the method, the target, and the protocol version' },
      { term: 'HTTP method', meaning: 'the word at the start of a request that names the action, such as GET or POST' },
    ],
    planPrompt: 'List the four checks in order with their statuses. Which response does BREW coffee HTTP/1.1 get, and why not 400?',
    starter:
      'type Line =\n  | { ok: true; method: string; path: string; query: string; version: string }\n  | { ok: false; status: number; error: string }\n\nfunction parseRequestLine(line: string): Line {\n  // Check the shape, method, target, and version in order.\n  return { ok: false, status: 400, error: "MALFORMED_LINE" }\n}\n',
    functionName: 'parseRequestLine',
    preserveInput: true,
    hints: [
      'Split on a single space and check the number of parts, and that none is empty, before reading any of them.',
      'Keep the allowed methods and versions in small lists and compare exactly, so "get" and "http/1.1" do not match.',
      'After the version passes, split the target at its first "?" for path and query.',
    ],
    checks: [
      {
        name: 'Parses the example',
        input: ['GET /orders?status=open HTTP/1.1'],
        expected: { ok: true, method: 'GET', path: '/orders', query: 'status=open', version: 'HTTP/1.1' },
      },
      {
        name: 'Parses a target without a query',
        input: ['DELETE /orders/42 HTTP/1.0'],
        expected: { ok: true, method: 'DELETE', path: '/orders/42', query: '', version: 'HTTP/1.0' },
      },
      {
        name: 'Keeps a later "?" in the query',
        input: ['GET /search?q=a?b HTTP/1.1'],
        expected: { ok: true, method: 'GET', path: '/search', query: 'q=a?b', version: 'HTTP/1.1' },
      },
      {
        name: 'Accepts OPTIONS',
        input: ['OPTIONS /orders HTTP/1.1'],
        expected: { ok: true, method: 'OPTIONS', path: '/orders', query: '', version: 'HTTP/1.1' },
      },
      {
        name: 'Rejects two spaces in a row',
        input: ['GET  /orders HTTP/1.1'],
        expected: { ok: false, status: 400, error: 'MALFORMED_LINE' },
      },
      { name: 'Rejects a missing version', input: ['GET /orders'], expected: { ok: false, status: 400, error: 'MALFORMED_LINE' } },
      {
        name: 'Rejects an extra part',
        input: ['GET /orders HTTP/1.1 extra'],
        expected: { ok: false, status: 400, error: 'MALFORMED_LINE' },
      },
      { name: 'Rejects a trailing space', input: ['GET / HTTP/1.1 '], expected: { ok: false, status: 400, error: 'MALFORMED_LINE' } },
      { name: 'Rejects an empty line', input: [''], expected: { ok: false, status: 400, error: 'MALFORMED_LINE' } },
      { name: 'Matches methods exactly', input: ['get / HTTP/1.1'], expected: { ok: false, status: 501, error: 'UNKNOWN_METHOD' } },
      {
        name: 'Checks the method before the target',
        input: ['BREW coffee HTTP/1.1'],
        expected: { ok: false, status: 501, error: 'UNKNOWN_METHOD' },
      },
      {
        name: 'Rejects a target without a leading "/"',
        input: ['GET orders HTTP/1.1'],
        expected: { ok: false, status: 400, error: 'BAD_TARGET' },
      },
      {
        name: 'Rejects a target that starts with "?"',
        input: ['GET ?page=2 HTTP/1.1'],
        expected: { ok: false, status: 400, error: 'BAD_TARGET' },
      },
      {
        name: 'Checks the target before the version',
        input: ['GET orders HTTP/2'],
        expected: { ok: false, status: 400, error: 'BAD_TARGET' },
      },
      {
        name: 'Rejects an unsupported version',
        input: ['GET / HTTP/2'],
        expected: { ok: false, status: 505, error: 'UNSUPPORTED_VERSION' },
      },
      {
        name: 'Matches the version exactly',
        input: ['GET / http/1.1'],
        expected: { ok: false, status: 505, error: 'UNSUPPORTED_VERSION' },
      },
    ],
  },
  {
    id: 'backend-header-value',
    title: 'Read a header in any letter case',
    category: 'Backend services',
    format: 'backend',
    context:
      'Some servers hand a handler the raw header list the client sent: each entry is a name and a value, names can be in any letter case, and the same header can arrive more than once.',
    prompt:
      'Implement headerValue(headers, name). headers is an array of [name, value] pairs in the order they arrived. A header matches when its name equals name after converting both to lowercase. Trim spaces and tabs from both ends of each matching value and leave out values that are then empty. Return null when no header matches; otherwise join the remaining values with ", " in arrival order, which gives "" when every matching value was empty. Do not change headers.',
    brief: {
      summary: 'Implement headerValue(headers, name) for a list of [name, value] pairs.',
      rules: [
        'A header matches when its name equals name after converting both to lowercase.',
        'Trim spaces and tabs from both ends of each matching value and leave out values that are then empty.',
        'Join the remaining values with ", " in arrival order.',
      ],
      edgeCases: [
        'Return null when no header matches.',
        'Return "" when headers matched but every matching value was empty.',
        'Do not change headers.',
      ],
    },
    example: {
      input: 'headerValue([["Accept", "text/html"], ["ACCEPT", " application/json "]], "accept")',
      output: '"text/html, application/json"',
    },
    note: 'Names and values contain printable ASCII characters and tabs, with no line breaks; headers has at most 50 pairs. Real servers treat a few headers, such as Set-Cookie, differently when they repeat; here every header combines the same way. These are arrays passed to your function, not a live HTTP request.',
    vocabulary: [
      { term: 'Header', meaning: 'a named line of extra information in a request or response, such as Content-Type' },
      { term: 'Case-insensitive', meaning: 'treating uppercase and lowercase letters as the same when comparing' },
    ],
    planPrompt:
      'For [["X-Tag", "a"], ["x-tag", "  "], ["X-TAG", "b"]], which values match "x-tag" and what is returned? What is returned for a name that never appears?',
    starter:
      'function headerValue(headers: [string, string][], name: string): string | null {\n  // Collect every matching value.\n  return null\n}\n',
    functionName: 'headerValue',
    preserveInput: true,
    hints: [
      'Compare lowercase copies of both names; never change the pairs themselves.',
      'Keep two facts apart: whether any header matched, and which trimmed values were not empty.',
      'Return null only when nothing matched; joining an empty list of values gives "".',
    ],
    checks: [
      {
        name: 'Joins the example in arrival order',
        input: [
          [
            ['Accept', 'text/html'],
            ['ACCEPT', ' application/json '],
          ],
          'accept',
        ],
        expected: 'text/html, application/json',
      },
      {
        name: 'Finds a header in another letter case',
        input: [[['Content-Type', 'application/json']], 'content-type'],
        expected: 'application/json',
      },
      { name: 'Matches a lookup name written in capitals', input: [[['x-request-id', 'abc']], 'X-Request-ID'], expected: 'abc' },
      { name: 'Returns null when nothing matches', input: [[['Accept', '*/*']], 'Authorization'], expected: null },
      { name: 'Returns null for no headers', input: [[], 'accept'], expected: null },
      {
        name: 'Leaves out empty values',
        input: [
          [
            ['X-Tag', ' a '],
            ['x-tag', '\t '],
            ['X-TAG', 'b'],
          ],
          'x-tag',
        ],
        expected: 'a, b',
      },
      { name: 'Returns an empty string when every match is empty', input: [[['X-Debug', '  ']], 'x-debug'], expected: '' },
      { name: 'Keeps the case of values', input: [[['X-Mode', 'Fast']], 'x-mode'], expected: 'Fast' },
      { name: 'Does not match a longer name', input: [[['Content-Type-Options', 'nosniff']], 'content-type'], expected: null },
      {
        name: 'Ignores other headers between matches',
        input: [
          [
            ['Accept', 'a'],
            ['Host', 'x'],
            ['accept', 'b'],
          ],
          'ACCEPT',
        ],
        expected: 'a, b',
      },
    ],
  },
  {
    id: 'backend-read-json-body',
    title: 'Accept a JSON body only when declared',
    category: 'Backend services',
    format: 'backend',
    context:
      'An endpoint that creates orders accepts JSON. Clients sometimes send a form, forget the Content-Type header, send broken JSON, or attach a body to a GET, and each case deserves a different response.',
    prompt:
      'Implement readJsonBody(request). request has method, headers (an array of [name, value] pairs), and body (a string). Return {ok: true, data} or {ok: false, status, error}, checking in this order. GET and HEAD must have an empty body (status 400, error "BODY_NOT_ALLOWED"); for them return {ok: true, data: null}. For other methods, the Content-Type media type must be "application/json" (status 415, error "UNSUPPORTED_MEDIA_TYPE"). The body must have at most 1000 characters (status 413, error "BODY_TOO_LARGE"). It must parse with JSON.parse (status 400, error "INVALID_JSON") into an object that is not null or an array (status 400, error "NOT_AN_OBJECT"). Then return the parsed object as data.',
    brief: {
      summary: 'Implement readJsonBody(request) and return {ok: true, data} or {ok: false, status, error}.',
      rules: [
        'GET and HEAD must have an empty body (status 400, error "BODY_NOT_ALLOWED"); for them return {ok: true, data: null}.',
        'For other methods, the Content-Type media type must be "application/json" (status 415, error "UNSUPPORTED_MEDIA_TYPE").',
        'The body must have at most 1000 characters (status 413, error "BODY_TOO_LARGE").',
        'It must parse with JSON.parse (status 400, error "INVALID_JSON") into an object that is not null or an array (status 400, error "NOT_AN_OBJECT").',
      ],
      edgeCases: [
        'Check in the order listed; the first failure wins.',
        'The media type is the text before the first ";" in the Content-Type value, trimmed and lowercased.',
        'A missing or repeated Content-Type header is unsupported.',
      ],
    },
    example: {
      input: 'readJsonBody({method: "POST", headers: [["Content-Type", "application/json; charset=utf-8"]], body: \'{"sku":"A-7"}\'})',
      output: '{ok: true, data: {sku: "A-7"}}',
    },
    note: 'method is uppercase text such as GET or POST. Header names match without regard to letter case. body has at most 5000 characters. The data is parsed but not yet validated: checking its fields is a separate step. These are objects passed to your function, not a live HTTP request.',
    vocabulary: [
      { term: 'Media type', meaning: 'the kind of content a body holds, such as application/json, named by the Content-Type header' },
      { term: 'Unsupported media type', meaning: 'a 415 response: the server does not accept the kind of body that was sent' },
    ],
    planPrompt:
      'List the checks in order with their statuses. Which response does a 2000-character body of broken JSON sent as text/plain get, and why?',
    starter:
      'type Request = { method: string; headers: [string, string][]; body: string }\ntype BodyResult =\n  | { ok: true; data: Record<string, unknown> | null }\n  | { ok: false; status: number; error: string }\n\nfunction readJsonBody(request: Request): BodyResult {\n  // Check the method, media type, size, and JSON in order.\n  return { ok: false, status: 400, error: "INVALID_JSON" }\n}\n',
    functionName: 'readJsonBody',
    preserveInput: true,
    hints: [
      'Write the checks as early returns in the stated order, so the first failure decides the response.',
      'Find the Content-Type headers by comparing lowercase names, make sure there is exactly one, and read the text before ";" from it.',
      'Measure the body before you parse it, and catch the error JSON.parse throws. typeof null is "object", so test null and arrays separately.',
    ],
    checks: [
      {
        name: 'Parses the example',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json; charset=utf-8']], body: '{"sku":"A-7"}' }],
        expected: { ok: true, data: { sku: 'A-7' } },
      },
      { name: 'Accepts a GET with no body', input: [{ method: 'GET', headers: [], body: '' }], expected: { ok: true, data: null } },
      {
        name: 'Rejects a GET with a body',
        input: [{ method: 'GET', headers: [['Content-Type', 'application/json']], body: '{}' }],
        expected: { ok: false, status: 400, error: 'BODY_NOT_ALLOWED' },
      },
      {
        name: 'Rejects a HEAD with a body before anything else',
        input: [{ method: 'HEAD', headers: [['Content-Type', 'text/plain']], body: 'x' }],
        expected: { ok: false, status: 400, error: 'BODY_NOT_ALLOWED' },
      },
      {
        name: 'Reads Content-Type in any letter case',
        input: [{ method: 'PUT', headers: [['content-TYPE', ' Application/JSON ']], body: '{"a":1}' }],
        expected: { ok: true, data: { a: 1 } },
      },
      {
        name: 'Rejects a form body',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/x-www-form-urlencoded']], body: 'a=1' }],
        expected: { ok: false, status: 415, error: 'UNSUPPORTED_MEDIA_TYPE' },
      },
      {
        name: 'Rejects a missing Content-Type',
        input: [{ method: 'POST', headers: [['Accept', 'application/json']], body: '{}' }],
        expected: { ok: false, status: 415, error: 'UNSUPPORTED_MEDIA_TYPE' },
      },
      {
        name: 'Rejects a repeated Content-Type',
        input: [
          {
            method: 'POST',
            headers: [
              ['Content-Type', 'application/json'],
              ['content-type', 'application/json'],
            ],
            body: '{}',
          },
        ],
        expected: { ok: false, status: 415, error: 'UNSUPPORTED_MEDIA_TYPE' },
      },
      {
        name: 'Does not accept a lookalike media type',
        input: [{ method: 'PATCH', headers: [['Content-Type', 'application/json-patch+json']], body: '[]' }],
        expected: { ok: false, status: 415, error: 'UNSUPPORTED_MEDIA_TYPE' },
      },
      {
        name: 'Checks the media type before the size',
        input: [{ method: 'POST', headers: [['Content-Type', 'text/plain']], body: jsonPadding(1001) }],
        expected: { ok: false, status: 415, error: 'UNSUPPORTED_MEDIA_TYPE' },
      },
      {
        name: 'Accepts a body of exactly 1000 characters',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: jsonPadding(1000) }],
        expected: { ok: true, data: { a: 1 } },
      },
      {
        name: 'Rejects a body of 1001 characters',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: jsonPadding(1001) }],
        expected: { ok: false, status: 413, error: 'BODY_TOO_LARGE' },
      },
      {
        name: 'Checks the size before parsing',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: '{' + ' '.repeat(1000) }],
        expected: { ok: false, status: 413, error: 'BODY_TOO_LARGE' },
      },
      {
        name: 'Rejects broken JSON',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: '{"a":' }],
        expected: { ok: false, status: 400, error: 'INVALID_JSON' },
      },
      {
        name: 'Rejects an empty POST body as invalid JSON',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: '' }],
        expected: { ok: false, status: 400, error: 'INVALID_JSON' },
      },
      {
        name: 'Rejects an array',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: '[1,2]' }],
        expected: { ok: false, status: 400, error: 'NOT_AN_OBJECT' },
      },
      {
        name: 'Rejects null',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: 'null' }],
        expected: { ok: false, status: 400, error: 'NOT_AN_OBJECT' },
      },
      {
        name: 'Rejects a JSON string',
        input: [{ method: 'POST', headers: [['Content-Type', 'application/json']], body: '"hi"' }],
        expected: { ok: false, status: 400, error: 'NOT_AN_OBJECT' },
      },
    ],
  },
  {
    id: 'backend-match-route',
    title: 'Match a path pattern',
    category: 'Backend services',
    format: 'backend',
    context:
      'A router compares each request path with route patterns such as /orders/:id. A segment that starts with ":" is a path parameter: it matches any one segment and hands its text to the handler.',
    prompt:
      'Implement matchRoute(pattern, path). Split both at every "/". They match when they have the same number of segments and, at each position, the pattern segment either equals the path segment exactly or is a parameter: a segment that starts with ":", which matches any non-empty path segment. Return an object that maps each parameter name, without the ":", to its path segment ({} when the pattern has no parameters), or null when they do not match. Do not decode segments.',
    brief: {
      summary: 'Implement matchRoute(pattern, path) and return the parameters or null.',
      rules: [
        'Split both at every "/"; they need the same number of segments.',
        'At each position the pattern segment equals the path segment exactly, or is a parameter: a segment that starts with ":", which matches any non-empty path segment.',
        'Return an object that maps each parameter name, without the ":", to its path segment ({} when the pattern has no parameters), or null when they do not match.',
      ],
      edgeCases: ['A trailing "/" makes an extra, empty segment.', 'Do not decode segments.'],
    },
    example: { input: 'matchRoute("/orders/:id", "/orders/42")', output: '{id: "42"}' },
    note: 'pattern and path both start with "/" and have at most 200 characters. Parameter names are letters and digits, unique within a pattern. Literal segments compare exactly, including letter case. These are strings passed to your function, not a live router.',
    vocabulary: [
      { term: 'Route pattern', meaning: 'a path with placeholders, such as /orders/:id, that many concrete paths can match' },
      { term: 'Path parameter', meaning: 'a placeholder segment such as :id that captures the matching part of the path' },
    ],
    planPrompt:
      'Split /users/:id/orders and /users/7/orders into segments side by side. Which pairs must be equal, and what does :id capture? What happens with /users/7/orders/?',
    starter:
      'function matchRoute(pattern: string, path: string): Record<string, string> | null {\n  // Compare the segments position by position.\n  return null\n}\n',
    functionName: 'matchRoute',
    preserveInput: true,
    hints: [
      'Splitting "/orders/42" at "/" gives ["", "orders", "42"]; compare the two lists position by position.',
      'Different segment counts can never match, so check the lengths before anything else.',
      'For a ":" segment, reject an empty path segment and otherwise record it under the name; any other segment must be equal.',
    ],
    checks: [
      { name: 'Matches the example', input: ['/orders/:id', '/orders/42'], expected: { id: '42' } },
      { name: 'Matches a literal pattern with no parameters', input: ['/health', '/health'], expected: {} },
      {
        name: 'Captures two parameters',
        input: ['/users/:userId/orders/:orderId', '/users/7/orders/42'],
        expected: { userId: '7', orderId: '42' },
      },
      { name: 'Compares literal segments exactly', input: ['/orders/:id', '/Orders/42'], expected: null },
      { name: 'Rejects a longer path', input: ['/orders/:id', '/orders/42/items'], expected: null },
      { name: 'Rejects a shorter path', input: ['/orders/:id', '/orders'], expected: null },
      { name: 'Treats a trailing slash as an extra segment', input: ['/orders', '/orders/'], expected: null },
      { name: 'Does not fill a parameter with an empty segment', input: ['/orders/:id', '/orders/'], expected: null },
      { name: 'Rejects a different literal after a parameter', input: ['/users/:id/orders', '/users/7/invoices'], expected: null },
      { name: 'Matches the root path', input: ['/', '/'], expected: {} },
      { name: 'Keeps encoded text in a parameter', input: ['/files/:name', '/files/a%20b'], expected: { name: 'a%20b' } },
    ],
  },
  {
    id: 'backend-route-request',
    title: 'Choose 404 or 405',
    category: 'Backend services',
    format: 'backend',
    context:
      'A router holds a list of routes, each a method, a pattern, and a handler name. For a request it must pick the handler, or say whether the path does not exist at all (404) or exists but not for this method (405).',
    prompt:
      'Implement routeRequest(routes, method, path). Each route has method, pattern, and name. A pattern matches a path when both split at "/" into the same number of segments and each pattern segment equals the path segment exactly or starts with ":", a parameter that matches any non-empty segment. Return {status: 200, route: name, params} for the first route in list order whose method equals method and whose pattern matches path; params maps each parameter name without ":" to its segment. A HEAD request with no matching HEAD route uses the first matching GET route instead. When no route answers but some patterns match the path, return {status: 405, allow}, where allow lists the methods of those routes once each, plus "HEAD" when "GET" is among them, sorted alphabetically. Otherwise return {status: 404}. Do not change routes.',
    brief: {
      summary: 'Implement routeRequest(routes, method, path) and return 200 with the handler, 405 with the allowed methods, or 404.',
      rules: [
        'A pattern matches a path when both split at "/" into the same number of segments and each pattern segment equals the path segment exactly or starts with ":", a parameter that matches any non-empty segment.',
        'Return {status: 200, route: name, params} for the first route in list order whose method equals method and whose pattern matches path; params maps each parameter name without ":" to its segment.',
        'A HEAD request with no matching HEAD route uses the first matching GET route instead.',
        'When no route answers but some patterns match the path, return {status: 405, allow}: the methods of those routes once each, plus "HEAD" when "GET" is among them, sorted alphabetically.',
        'Otherwise return {status: 404}.',
      ],
      edgeCases: ['Methods compare exactly, including letter case.', 'Do not change routes.'],
    },
    example: {
      input:
        'routeRequest([{method: "GET", pattern: "/orders/:id", name: "show"}, {method: "DELETE", pattern: "/orders/:id", name: "remove"}], "PUT", "/orders/42")',
      output: '{status: 405, allow: ["DELETE", "GET", "HEAD"]}',
    },
    note: 'routes has at most 50 entries. Patterns and paths start with "/" and have at most 200 characters, and segments are not decoded. A real 405 response sends allow as an Allow header; here it is a field. These are values passed to your function, not a live router.',
    vocabulary: [
      { term: 'Not Found (404)', meaning: 'the response when no resource exists at the requested path' },
      {
        term: 'Method Not Allowed (405)',
        meaning: 'the response when the path exists but not for this method; it lists the methods that would work',
      },
    ],
    planPrompt:
      'With GET /orders and POST /orders registered, predict the result for PUT /orders, HEAD /orders, and GET /customers, and say which question decides each one.',
    starter:
      'type Route = { method: string; pattern: string; name: string }\ntype Routed =\n  | { status: 200; route: string; params: Record<string, string> }\n  | { status: 405; allow: string[] }\n  | { status: 404 }\n\nfunction routeRequest(routes: Route[], method: string, path: string): Routed {\n  // Match the path first, then the method.\n  return { status: 404 }\n}\n',
    functionName: 'routeRequest',
    preserveInput: true,
    hints: [
      'First collect the routes whose patterns match the path, in list order; the method only chooses among those.',
      'Look for the request method first; only a HEAD request falls back to GET, and only after no HEAD route matched.',
      'No answer but some matching patterns means 405. A Set removes repeated methods; add HEAD when GET is in it, then sort.',
    ],
    checks: [
      {
        name: 'Routes the request to the matching handler',
        input: [orderRoutes, 'GET', '/orders/42'],
        expected: { status: 200, route: 'show', params: { id: '42' } },
      },
      {
        name: 'Returns empty params for a literal route',
        input: [orderRoutes, 'POST', '/orders'],
        expected: { status: 200, route: 'create', params: {} },
      },
      {
        name: 'An earlier literal route wins',
        input: [orderRoutes, 'GET', '/orders/new'],
        expected: { status: 200, route: 'new-form', params: {} },
      },
      {
        name: 'An earlier parameter route wins',
        input: [
          [
            { method: 'GET', pattern: '/orders/:id', name: 'show' },
            { method: 'GET', pattern: '/orders/new', name: 'new-form' },
          ],
          'GET',
          '/orders/new',
        ],
        expected: { status: 200, route: 'show', params: { id: 'new' } },
      },
      {
        name: 'Answers 405 with the allowed methods',
        input: [orderRoutes, 'PUT', '/orders/42'],
        expected: { status: 405, allow: ['DELETE', 'GET', 'HEAD'] },
      },
      {
        name: 'Lists each method once',
        input: [orderRoutes, 'PATCH', '/orders/new'],
        expected: { status: 405, allow: ['DELETE', 'GET', 'HEAD'] },
      },
      {
        name: 'Does not add HEAD without GET',
        input: [orderRoutes, 'GET', '/orders/42/cancel'],
        expected: { status: 405, allow: ['POST'] },
      },
      {
        name: 'Answers HEAD with a GET route',
        input: [orderRoutes, 'HEAD', '/orders'],
        expected: { status: 200, route: 'list', params: {} },
      },
      {
        name: 'Prefers a HEAD route over GET',
        input: [
          [
            { method: 'GET', pattern: '/status', name: 'status' },
            { method: 'HEAD', pattern: '/status', name: 'status-head' },
          ],
          'HEAD',
          '/status',
        ],
        expected: { status: 200, route: 'status-head', params: {} },
      },
      {
        name: 'Matches methods exactly',
        input: [orderRoutes, 'get', '/orders'],
        expected: { status: 405, allow: ['GET', 'HEAD', 'POST'] },
      },
      { name: 'Answers 404 when no pattern matches', input: [orderRoutes, 'GET', '/customers'], expected: { status: 404 } },
      { name: 'Treats a trailing slash as a different path', input: [orderRoutes, 'GET', '/orders/'], expected: { status: 404 } },
      { name: 'Answers 404 with no routes', input: [[], 'GET', '/'], expected: { status: 404 } },
    ],
  },
  {
    id: 'backend-normalize-path',
    title: 'Clean a path before routing',
    category: 'Backend services',
    format: 'backend',
    context:
      'Before matching routes, a server cleans the request path so that /orders//42/ and /orders/./42 reach the same handler, and so that ".." can never climb above the root to reach files or routes it should not.',
    prompt:
      'Implement normalizePath(path). Split path at every "/" and walk the segments in order: skip empty segments and ".", let ".." remove the last kept segment, and keep every other segment. If a ".." has no kept segment to remove, return null. Otherwise return "/" followed by the kept segments joined with "/", which is "/" when none are kept. Do not decode segments, so "%2e%2e" is an ordinary segment.',
    brief: {
      summary: 'Implement normalizePath(path) and return the cleaned path or null.',
      rules: [
        'Split path at every "/" and walk the segments in order.',
        'Skip empty segments and ".", let ".." remove the last kept segment, and keep every other segment.',
        'Return "/" followed by the kept segments joined with "/", which is "/" when none are kept.',
      ],
      edgeCases: ['If a ".." has no kept segment to remove, return null.', 'Do not decode segments, so "%2e%2e" is an ordinary segment.'],
    },
    example: { input: 'normalizePath("/orders//42/./items/../")', output: '"/orders/42"' },
    note: 'path starts with "/" and has at most 200 printable ASCII characters. Only "." and ".." are special; "..." and "..b" are ordinary segments. Real servers also decide whether to decode before cleaning; this contract cleans the raw text. These are strings passed to your function, not a live server.',
    vocabulary: [
      { term: 'Dot segment', meaning: 'a path segment that is exactly "." (this level) or ".." (one level up)' },
      { term: 'Path traversal', meaning: 'using ".." in a path to reach something outside the place a server meant to serve' },
    ],
    planPrompt: 'Walk /a/b/../../.. one segment at a time and write the kept list after each step. Where do you return null?',
    starter: 'function normalizePath(path: string): string | null {\n  // Walk the segments and keep a list.\n  return path\n}\n',
    functionName: 'normalizePath',
    preserveInput: true,
    hints: [
      'Keep the cleaned segments in a list that grows and shrinks as you walk, like a stack.',
      'An empty segment comes from a doubled or trailing "/"; it and "." add nothing.',
      'Before removing for "..", check the list is not empty; an empty list means the path tried to climb above the root.',
    ],
    checks: [
      { name: 'Cleans the example', input: ['/orders//42/./items/../'], expected: '/orders/42' },
      { name: 'Keeps a clean path unchanged', input: ['/orders/42'], expected: '/orders/42' },
      { name: 'Drops repeated and trailing slashes', input: ['/orders//42/'], expected: '/orders/42' },
      { name: 'Drops "." segments', input: ['/a/./b/.'], expected: '/a/b' },
      { name: 'Removes the segment before ".."', input: ['/a/b/../c'], expected: '/a/c' },
      { name: 'Climbs more than one level', input: ['/a/b/c/../../d'], expected: '/a/d' },
      { name: 'Returns the root when everything is removed', input: ['/a/..'], expected: '/' },
      { name: 'Keeps the root', input: ['/'], expected: '/' },
      { name: 'Turns a run of slashes into the root', input: ['////'], expected: '/' },
      { name: 'Rejects climbing above the root', input: ['/..'], expected: null },
      { name: 'Rejects climbing above the root later in the path', input: ['/a/../../b'], expected: null },
      { name: 'Treats longer dot runs as ordinary segments', input: ['/.../..b/x'], expected: '/.../..b/x' },
      { name: 'Does not decode escaped dots', input: ['/files/%2e%2e/secret'], expected: '/files/%2e%2e/secret' },
    ],
  },
  {
    id: 'backend-build-path',
    title: 'Fill in a path pattern',
    category: 'Backend services',
    format: 'backend',
    context:
      'A server builds links to its own routes, such as /files/:name, from values that users typed. A value like "a/b" or ".." must not change which resource the link names.',
    prompt:
      'Implement buildPath(pattern, params). Split pattern at every "/". Replace each segment that starts with ":" with the value params has under that name (without the ":"), encoded with encodeURIComponent; keep every other segment. Join the segments with "/". Return null if a parameter value is missing or is not a non-empty string, or if it is "." or "..". Ignore params the pattern does not use. Do not change params.',
    brief: {
      summary: 'Implement buildPath(pattern, params) and return the path or null.',
      rules: [
        'Replace each segment that starts with ":" with the value params has under that name (without the ":"), encoded with encodeURIComponent.',
        'Keep every other segment, and join the segments with "/".',
        'Ignore params the pattern does not use.',
      ],
      edgeCases: [
        'Return null if a parameter value is missing or is not a non-empty string.',
        'Return null if a value is "." or "..": encoding leaves dots unchanged.',
        'Do not change params.',
      ],
    },
    example: { input: 'buildPath("/files/:name", {name: "a/b"})', output: '"/files/a%2Fb"' },
    note: 'pattern starts with "/" and has at most 200 characters, with parameter names of letters and digits. params is a plain object whose values may be of any JSON type. encodeURIComponent leaves letters, digits, and - _ . ! ~ * \' ( ) unchanged and escapes everything else. These are values passed to your function, not a live router.',
    vocabulary: [
      { term: 'Reverse routing', meaning: 'building a path from a route pattern and values, the opposite of matching' },
      {
        term: 'encodeURIComponent',
        meaning: 'a function that escapes every character with special meaning in a URL part, including / ? # and &',
      },
    ],
    planPrompt:
      'Build /files/:name for the names "report.pdf", "a/b", "..", and "". Which ones change shape, and what do you return for each?',
    starter:
      'function buildPath(pattern: string, params: Record<string, unknown>): string | null {\n  // Replace each parameter segment with its encoded value.\n  return pattern\n}\n',
    functionName: 'buildPath',
    preserveInput: true,
    hints: [
      'Work segment by segment so that a value can only ever fill the one segment its parameter names.',
      'Before encoding, check the value is a string, is not empty, and is not "." or "..".',
      'encodeURIComponent turns "/" into "%2F", which keeps "a/b" inside one segment.',
    ],
    checks: [
      { name: 'Encodes a slash so it stays in one segment', input: ['/files/:name', { name: 'a/b' }], expected: '/files/a%2Fb' },
      { name: 'Fills a plain value', input: ['/orders/:id', { id: '42' }], expected: '/orders/42' },
      {
        name: 'Fills several parameters',
        input: ['/users/:userId/orders/:orderId', { userId: '7', orderId: '42' }],
        expected: '/users/7/orders/42',
      },
      { name: 'Encodes spaces and question marks', input: ['/search/:term', { term: 'red wine?' }], expected: '/search/red%20wine%3F' },
      { name: 'Encodes text outside ASCII', input: ['/tags/:tag', { tag: 'café' }], expected: '/tags/caf%C3%A9' },
      { name: 'Ignores extra params', input: ['/orders/:id', { id: '1', page: '2' }], expected: '/orders/1' },
      { name: 'Leaves a pattern without parameters unchanged', input: ['/health', {}], expected: '/health' },
      { name: 'Keeps a dot inside a longer value', input: ['/files/:name', { name: 'v1.2' }], expected: '/files/v1.2' },
      { name: 'Returns null for a missing value', input: ['/orders/:id', {}], expected: null },
      { name: 'Returns null for an empty value', input: ['/orders/:id', { id: '' }], expected: null },
      { name: 'Returns null for a number', input: ['/orders/:id', { id: 42 }], expected: null },
      { name: 'Returns null for "."', input: ['/files/:name', { name: '.' }], expected: null },
      { name: 'Returns null for ".."', input: ['/files/:name', { name: '..' }], expected: null },
      { name: 'Does not treat inherited names as values', input: ['/x/:constructor', {}], expected: null },
    ],
  },
  {
    id: 'backend-route-specificity',
    title: 'Pick the most specific route',
    category: 'Backend services',
    format: 'backend',
    context:
      'Some routers do not care about the order routes were added in. When several patterns match a path, they pick the most specific one, so /orders/new wins over /orders/:id and both win over a catch-all such as /files/*.',
    prompt:
      'Implement pickRoute(patterns, path). Split patterns and path at every "/". A segment is a literal, a parameter (it starts with ":"), or a wildcard (exactly "*", only ever the last segment of a pattern). A pattern without a wildcard matches when it has as many segments as the path and each literal equals its path segment exactly and each parameter gets a non-empty segment. A pattern ending in "*" matches when its segments before "*" match the start of the path by the same rules and the rest of the path, joined with "/", is not empty. When several patterns match, choose the most specific: compare them segment by segment from the left, and at the first position where their kinds differ, a literal beats a parameter and a parameter beats a wildcard. When their kinds never differ, the pattern listed first wins. Return {pattern, params}, where params maps each parameter name without ":" to its segment and "*" to the rest of the path, or null when no pattern matches.',
    brief: {
      summary: 'Implement pickRoute(patterns, path) and return the most specific matching pattern with its params, or null.',
      rules: [
        'A segment is a literal, a parameter (it starts with ":"), or a wildcard (exactly "*", only ever the last segment of a pattern).',
        'Without a wildcard, a pattern matches when it has as many segments as the path, each literal equals its segment exactly, and each parameter gets a non-empty segment.',
        'A pattern ending in "*" matches when its segments before "*" match the start of the path by the same rules and the rest of the path, joined with "/", is not empty.',
        'Of several matches, compare segment by segment from the left: at the first position where their kinds differ, a literal beats a parameter and a parameter beats a wildcard. When their kinds never differ, the pattern listed first wins.',
        'Return {pattern, params}, where params maps each parameter name without ":" to its segment and "*" to the rest of the path, or null when no pattern matches.',
      ],
      edgeCases: ['Do not decode segments.', 'Do not change patterns.'],
    },
    example: { input: 'pickRoute(["/orders/:id", "/orders/new"], "/orders/new")', output: '{pattern: "/orders/new", params: {}}' },
    note: 'patterns has at most 50 entries; every pattern and path starts with "/" and has at most 200 characters. Parameter names are letters and digits, unique within a pattern. These are strings passed to your function, not a live router.',
    vocabulary: [
      { term: 'Wildcard segment', meaning: 'a final * in a route pattern that matches the whole rest of a path' },
      { term: 'Specificity', meaning: 'how narrowly a route pattern describes paths; a more specific pattern wins when several match' },
    ],
    planPrompt: 'For /users/me/profile, which of /users/:id/profile and /users/me/:tab wins, and at which segment is it decided?',
    starter:
      'function pickRoute(patterns: string[], path: string): { pattern: string; params: Record<string, string> } | null {\n  // Find every match, then keep the most specific.\n  return null\n}\n',
    functionName: 'pickRoute',
    preserveInput: true,
    hints: [
      'Split the job in two: decide whether one pattern matches and what it captures, then decide which of two matching patterns is more specific.',
      'Give each segment kind a rank so that comparing two patterns is a walk from the left until the ranks differ.',
      'Replace the current best only when the new match is strictly more specific; that keeps the first-listed pattern on a tie.',
    ],
    checks: [
      {
        name: 'Prefers a literal over a parameter',
        input: [['/orders/:id', '/orders/new'], '/orders/new'],
        expected: { pattern: '/orders/new', params: {} },
      },
      {
        name: 'Uses the parameter when the literal does not match',
        input: [['/orders/:id', '/orders/new'], '/orders/42'],
        expected: { pattern: '/orders/:id', params: { id: '42' } },
      },
      {
        name: 'Prefers a parameter over a wildcard',
        input: [['/files/*', '/files/:name'], '/files/a.txt'],
        expected: { pattern: '/files/:name', params: { name: 'a.txt' } },
      },
      {
        name: 'Uses the wildcard for deeper paths',
        input: [['/files/*', '/files/:name'], '/files/docs/a.txt'],
        expected: { pattern: '/files/*', params: { '*': 'docs/a.txt' } },
      },
      {
        name: 'Prefers a literal over a wildcard',
        input: [['/static/*', '/static/app.js'], '/static/app.js'],
        expected: { pattern: '/static/app.js', params: {} },
      },
      {
        name: 'Decides at the first difference from the left',
        input: [['/users/:id/profile', '/users/me/:tab'], '/users/me/profile'],
        expected: { pattern: '/users/me/:tab', params: { tab: 'profile' } },
      },
      {
        name: 'An earlier literal outweighs later literals',
        input: [['/a/:x/c/d', '/a/b/:y/:z'], '/a/b/c/d'],
        expected: { pattern: '/a/b/:y/:z', params: { y: 'c', z: 'd' } },
      },
      {
        name: 'A wildcard after a parameter beats an earlier wildcard',
        input: [['/a/*', '/a/:x/*'], '/a/b/c'],
        expected: { pattern: '/a/:x/*', params: { x: 'b', '*': 'c' } },
      },
      {
        name: 'Keeps list order for equally specific patterns',
        input: [['/items/:id', '/items/:sku'], '/items/9'],
        expected: { pattern: '/items/:id', params: { id: '9' } },
      },
      { name: 'Does not let a wildcard match nothing', input: [['/files/*'], '/files/'], expected: null },
      { name: 'Does not let a wildcard match a missing segment', input: [['/files/*'], '/files'], expected: null },
      { name: 'Prefers the root over a catch-all', input: [['/*', '/'], '/'], expected: { pattern: '/', params: {} } },
      { name: 'Returns null when nothing matches', input: [['/orders/:id'], '/customers/1'], expected: null },
    ],
  },
  {
    id: 'backend-versioned-update',
    title: 'Reject a stale write',
    category: 'Backend services',
    format: 'backend',
    context:
      'Two people open the same product, both edit it, and both save. Without a check, the second save quietly replaces the first. Each stored record carries a version number, and every update names the version it was based on.',
    prompt:
      'Implement applyUpdate(record, update). record has id, version, and data (an object); update has expectedVersion and changes (an object). If expectedVersion is not equal to record.version, return {ok: false, status: 409, currentVersion: record.version}. Otherwise return {ok: true, record} with a new record: the same id, the version increased by 1, and data with each change applied, where a change whose value is null removes that field and any other value sets it. Do not change the inputs.',
    brief: {
      summary: 'Implement applyUpdate(record, update) and return the new record or a conflict.',
      rules: [
        'If expectedVersion is not equal to record.version, return {ok: false, status: 409, currentVersion: record.version}.',
        'Otherwise return {ok: true, record} with a new record: the same id and the version increased by 1.',
        'Apply each change to data: a change whose value is null removes that field, and any other value sets it.',
      ],
      edgeCases: [
        'An empty set of changes still counts as an update.',
        'Only top-level fields change: a nested object replaces the old value whole.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input: 'applyUpdate({id: "p1", version: 3, data: {name: "Lamp", price: 40}}, {expectedVersion: 3, changes: {price: 35}})',
      output: '{ok: true, record: {id: "p1", version: 4, data: {name: "Lamp", price: 35}}}',
    },
    note: 'version and expectedVersion are whole numbers from 0. data and changes are plain objects with at most 20 fields, holding JSON values. These are values passed to your function, not a live database.',
    vocabulary: [
      { term: 'Lost update', meaning: 'a change silently replaced by another write that was based on older data' },
      {
        term: 'Optimistic concurrency',
        meaning: 'letting writes go ahead without locks and refusing any write based on an out-of-date version',
      },
    ],
    planPrompt:
      'Two editors both read version 3. Editor A saves first, then editor B. Write what each save returns and the version the record ends at.',
    starter:
      'type StoredRecord = { id: string; version: number; data: { [field: string]: unknown } }\ntype Update = { expectedVersion: number; changes: { [field: string]: unknown } }\n\nfunction applyUpdate(record: StoredRecord, update: Update) {\n  // Compare the versions, then build the new record.\n  return { ok: true, record }\n}\n',
    functionName: 'applyUpdate',
    preserveInput: true,
    hints: [
      'Compare the two version numbers first: a mismatch means the update was based on data that has changed since.',
      'Build the new data on a copy, so the stored record is untouched.',
      'Walk the changes: remove the field for null, set it for anything else, then return the copy with the version plus 1.',
    ],
    checks: [
      {
        name: 'Applies an update based on the current version',
        input: [
          { id: 'p1', version: 3, data: { name: 'Lamp', price: 40 } },
          { expectedVersion: 3, changes: { price: 35 } },
        ],
        expected: { ok: true, record: { id: 'p1', version: 4, data: { name: 'Lamp', price: 35 } } },
      },
      {
        name: 'Refuses an update based on an older version',
        input: [
          { id: 'p1', version: 3, data: { price: 40 } },
          { expectedVersion: 2, changes: { price: 35 } },
        ],
        expected: { ok: false, status: 409, currentVersion: 3 },
      },
      {
        name: 'Refuses an update based on a later version',
        input: [
          { id: 'p1', version: 3, data: { price: 40 } },
          { expectedVersion: 4, changes: { price: 35 } },
        ],
        expected: { ok: false, status: 409, currentVersion: 3 },
      },
      {
        name: 'Removes a field set to null',
        input: [
          { id: 'p1', version: 1, data: { name: 'Lamp', note: 'old' } },
          { expectedVersion: 1, changes: { note: null } },
        ],
        expected: { ok: true, record: { id: 'p1', version: 2, data: { name: 'Lamp' } } },
      },
      {
        name: 'Adds a new field',
        input: [
          { id: 'p1', version: 1, data: { name: 'Lamp' } },
          { expectedVersion: 1, changes: { color: 'red' } },
        ],
        expected: { ok: true, record: { id: 'p1', version: 2, data: { name: 'Lamp', color: 'red' } } },
      },
      {
        name: 'Keeps values that are zero, false, or empty',
        input: [
          { id: 'p1', version: 1, data: { stock: 5 } },
          { expectedVersion: 1, changes: { stock: 0, featured: false, label: '' } },
        ],
        expected: { ok: true, record: { id: 'p1', version: 2, data: { stock: 0, featured: false, label: '' } } },
      },
      {
        name: 'Counts an empty set of changes as an update',
        input: [
          { id: 'p1', version: 3, data: { name: 'Lamp' } },
          { expectedVersion: 3, changes: {} },
        ],
        expected: { ok: true, record: { id: 'p1', version: 4, data: { name: 'Lamp' } } },
      },
      {
        name: 'Starts from version 0',
        input: [
          { id: 'p2', version: 0, data: {} },
          { expectedVersion: 0, changes: { name: 'Desk' } },
        ],
        expected: { ok: true, record: { id: 'p2', version: 1, data: { name: 'Desk' } } },
      },
      {
        name: 'Replaces a nested object whole',
        input: [
          { id: 'p1', version: 1, data: { size: { w: 1, h: 2 } } },
          { expectedVersion: 1, changes: { size: { w: 3 } } },
        ],
        expected: { ok: true, record: { id: 'p1', version: 2, data: { size: { w: 3 } } } },
      },
      {
        name: 'Ignores a null change for a missing field',
        input: [
          { id: 'p1', version: 1, data: { name: 'Lamp' } },
          { expectedVersion: 1, changes: { gone: null } },
        ],
        expected: { ok: true, record: { id: 'p1', version: 2, data: { name: 'Lamp' } } },
      },
    ],
  },
  {
    id: 'backend-if-match',
    title: 'Update only if the tag still matches',
    category: 'Backend services',
    format: 'backend',
    context:
      'HTTP has a version check built in. A response carries an ETag naming the version of a resource, and a client that wants to change it sends that tag back in an If-Match header. The server makes the change only if the tag still matches.',
    prompt:
      'Implement conditionalPut(current, ifMatch, value). current is the stored resource {etag, value}, or null when none exists, and ifMatch is the If-Match header value or null. If ifMatch is null, return {status: 428}. If ifMatch, trimmed, is exactly "*", it matches any existing resource. Otherwise split it at commas and trim each tag: it matches when one tag equals current.etag exactly, and a weak tag (one that starts with W/) never matches. Without a match, including whenever current is null, return {status: 412}. With a match, return {status: 200, resource: {etag, value}}, where etag is current.etag with its number increased by 1. Do not change the inputs.',
    brief: {
      summary: 'Implement conditionalPut(current, ifMatch, value) and return 428, 412, or 200 with the new resource.',
      rules: [
        'If ifMatch is null, return {status: 428}.',
        'If ifMatch, trimmed, is exactly "*", it matches any existing resource.',
        'Otherwise split it at commas and trim each tag: it matches when one tag equals current.etag exactly, and a weak tag (one that starts with W/) never matches.',
        'Without a match, including whenever current is null, return {status: 412}.',
        'With a match, return {status: 200, resource: {etag, value}}, where etag is current.etag with its number increased by 1.',
      ],
      edgeCases: ['A "*" inside a list is an ordinary tag.', 'Do not change the inputs.'],
    },
    example: {
      input: 'conditionalPut({etag: \'"v7"\', value: "draft"}, \'"v7"\', "final")',
      output: '{status: 200, resource: {etag: \'"v8"\', value: "final"}}',
    },
    note: 'A stored tag is the letter v and a whole number inside double quotes, such as "v7", and the quotes are part of the tag, so v7 written without them never matches. Header tags are compared as written. A real server also returns the new tag in an ETag header; here it is a field. These are values passed to your function, not a live server.',
    vocabulary: [
      { term: 'ETag', meaning: 'a response header that names one version of a resource' },
      { term: 'Precondition', meaning: 'a condition a request asks the server to check before acting, such as If-Match' },
    ],
    planPrompt: 'The stored tag is "v7". What does each If-Match get: missing, "v7", "v6", a list holding "v6" and "v7", W/"v7", and *?',
    starter:
      'type Resource = { etag: string; value: string }\ntype Put = { status: 428 } | { status: 412 } | { status: 200; resource: Resource }\n\nfunction conditionalPut(current: Resource | null, ifMatch: string | null, value: string): Put {\n  // Decide between 428, 412, and 200.\n  return { status: 412 }\n}\n',
    functionName: 'conditionalPut',
    preserveInput: true,
    hints: [
      'Handle the missing header first: without it the server cannot tell which version the client saw.',
      'Compare whole tags, quotes included, and skip any that start with W/.',
      'For the new tag, take the number between "v and the closing quote, add 1, and write it back in the same form.',
    ],
    checks: [
      {
        name: 'Updates when the tag matches',
        input: [{ etag: '"v7"', value: 'draft' }, '"v7"', 'final'],
        expected: { status: 200, resource: { etag: '"v8"', value: 'final' } },
      },
      { name: 'Requires an If-Match header', input: [{ etag: '"v7"', value: 'draft' }, null, 'final'], expected: { status: 428 } },
      { name: 'Requires the header even when nothing exists', input: [null, null, 'final'], expected: { status: 428 } },
      { name: 'Refuses an out-of-date tag', input: [{ etag: '"v7"', value: 'draft' }, '"v6"', 'final'], expected: { status: 412 } },
      {
        name: 'Accepts a match anywhere in a list',
        input: [{ etag: '"v7"', value: 'draft' }, ' "v6" ,  "v7" ', 'final'],
        expected: { status: 200, resource: { etag: '"v8"', value: 'final' } },
      },
      { name: 'Never matches a weak tag', input: [{ etag: '"v7"', value: 'draft' }, 'W/"v7"', 'final'], expected: { status: 412 } },
      { name: 'Compares tags with their quotes', input: [{ etag: '"v7"', value: 'draft' }, 'v7', 'final'], expected: { status: 412 } },
      {
        name: 'Matches any existing resource with *',
        input: [{ etag: '"v3"', value: 'draft' }, ' * ', 'final'],
        expected: { status: 200, resource: { etag: '"v4"', value: 'final' } },
      },
      { name: 'Refuses * when nothing exists', input: [null, '*', 'final'], expected: { status: 412 } },
      { name: 'Refuses a tag when nothing exists', input: [null, '"v1"', 'final'], expected: { status: 412 } },
      {
        name: 'Treats * inside a list as an ordinary tag',
        input: [{ etag: '"v1"', value: 'draft' }, '"v0", *', 'final'],
        expected: { status: 412 },
      },
      {
        name: 'Reads every digit of the number',
        input: [{ etag: '"v19"', value: 'draft' }, '"v19"', 'final'],
        expected: { status: 200, resource: { etag: '"v20"', value: 'final' } },
      },
    ],
  },
  {
    id: 'backend-lost-updates',
    title: 'Spot lost updates in a log',
    category: 'Backend services',
    format: 'backend',
    context:
      'A team suspects that edits to a shared document are disappearing. The server stores every write without a version check, so the last write wins. The request log shows which writes replaced a change their author had never read.',
    prompt:
      'Implement lostUpdates(events). Each event is {client, type: "read"} or {client, type: "write"}, in the order the server handled them, and every write is stored. A write replaces an unseen change when the stored value it replaces was written by a different client after this client\'s last read, or by a different client at any time if this client has never read. The value stored before the first write is never an unseen change. Return the positions (from 0) of the writes that replace an unseen change, in order. Do not change the input.',
    brief: {
      summary: 'Implement lostUpdates(events) and return the positions of writes that replace an unseen change.',
      rules: [
        'Events are {client, type: "read"} or {client, type: "write"}, in the order the server handled them; every write is stored.',
        "A write replaces an unseen change when the stored value it replaces was written by a different client after this client's last read.",
        'If this client has never read, any stored value written by a different client is unseen.',
        'Return the positions (from 0) of those writes, in order.',
      ],
      edgeCases: ['The value stored before the first write is never an unseen change.', 'Do not change the input.'],
    },
    example: {
      input:
        'lostUpdates([{client: "A", type: "read"}, {client: "B", type: "read"}, {client: "A", type: "write"}, {client: "B", type: "write"}])',
      output: '[3]',
    },
    note: 'Client names are non-empty text and compare exactly; events has at most 200 entries. A read sees every write handled before it. These are values passed to your function, not a live server.',
    vocabulary: [
      { term: 'Last write wins', meaning: 'storing whichever write arrives last, without checking what it replaces' },
      { term: 'Interleaving', meaning: 'the order in which steps from different requests happen to mix' },
    ],
    planPrompt:
      'For the example, write after each event who wrote the stored value, at which position, and when each client last read. Which write replaces something its author never saw?',
    starter:
      'type Event = { client: string; type: "read" | "write" }\n\nfunction lostUpdates(events: Event[]): number[] {\n  // Track who wrote the stored value and when each client last read.\n  return []\n}\n',
    functionName: 'lostUpdates',
    preserveInput: true,
    hints: [
      "Two facts decide each write: who wrote the value being replaced, and when, compared with this client's last read.",
      "Remember the author and position of the latest write, and each client's latest read position in a Map.",
      "A write counts when the stored value has an author, the author is someone else, and its position is after this client's last read or the client never read.",
    ],
    checks: [
      {
        name: 'Finds the write that replaced an unread change',
        input: [
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'read' },
            { client: 'A', type: 'write' },
            { client: 'B', type: 'write' },
          ],
        ],
        expected: [3],
      },
      { name: 'Ignores a write that replaces the starting value', input: [[{ client: 'A', type: 'write' }]], expected: [] },
      {
        name: 'Ignores a client replacing its own write',
        input: [
          [
            { client: 'A', type: 'read' },
            { client: 'A', type: 'write' },
            { client: 'A', type: 'write' },
          ],
        ],
        expected: [],
      },
      {
        name: 'Ignores a change the writer read',
        input: [
          [
            { client: 'A', type: 'write' },
            { client: 'B', type: 'read' },
            { client: 'B', type: 'write' },
          ],
        ],
        expected: [],
      },
      {
        name: 'Counts any other change when the writer never read',
        input: [
          [
            { client: 'A', type: 'write' },
            { client: 'B', type: 'write' },
          ],
        ],
        expected: [1],
      },
      {
        name: 'Counts only the write that replaced the change',
        input: [
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'write' },
            { client: 'A', type: 'write' },
            { client: 'A', type: 'write' },
          ],
        ],
        expected: [2],
      },
      {
        name: 'Uses the latest read',
        input: [
          [
            { client: 'B', type: 'read' },
            { client: 'A', type: 'write' },
            { client: 'B', type: 'read' },
            { client: 'B', type: 'write' },
          ],
        ],
        expected: [],
      },
      {
        name: 'Finds several in one log',
        input: [
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'read' },
            { client: 'C', type: 'read' },
            { client: 'A', type: 'write' },
            { client: 'B', type: 'write' },
            { client: 'C', type: 'write' },
          ],
        ],
        expected: [4, 5],
      },
      { name: 'Handles an empty log', input: [[]], expected: [] },
      {
        name: 'Reads alone change nothing',
        input: [
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'read' },
          ],
        ],
        expected: [],
      },
    ],
  },
  {
    id: 'backend-compare-and-set',
    title: 'Compare and set a value',
    category: 'Backend services',
    format: 'backend',
    context:
      'A small key-value store offers one safe write: change a key only if it still holds the value you expect. Callers use it to update shared values without locking them.',
    prompt:
      'Implement compareAndSet(store, key, expected, next). store maps keys to text values. The current value of key is store[key] when store has key as its own property, and null otherwise. If the current value is not equal to expected, return {ok: false, current}. Otherwise return {ok: true, store} with a new store in which key holds next, or from which key is removed when next is null. Do not change store.',
    brief: {
      summary: 'Implement compareAndSet(store, key, expected, next).',
      rules: [
        'The current value of key is store[key] when store has key as its own property, and null otherwise.',
        'If the current value is not equal to expected, return {ok: false, current}.',
        'Otherwise return {ok: true, store} with a new store in which key holds next, or from which key is removed when next is null.',
      ],
      edgeCases: ['An empty string is a value, not a missing key.', 'Keys and values compare exactly.', 'Do not change store.'],
    },
    example: { input: 'compareAndSet({count: "1"}, "count", "1", "2")', output: '{ok: true, store: {count: "2"}}' },
    note: 'store has at most 50 keys; expected and next are text or null. These are values passed to your function, not a live store.',
    vocabulary: [
      { term: 'Compare-and-set', meaning: 'writing a value only if the current value is still the one you expect' },
      { term: 'Atomic', meaning: 'done as one step that nothing else can interrupt' },
    ],
    planPrompt:
      'For an empty store, what do compareAndSet with expected null and expected "x" each return? Then what happens if you expect null for a key that holds ""?',
    starter:
      'function compareAndSet(store: Record<string, string>, key: string, expected: string | null, next: string | null) {\n  // Read the current value, compare, then build the new store.\n  return { ok: false, current: null }\n}\n',
    functionName: 'compareAndSet',
    preserveInput: true,
    hints: [
      'Work out the current value first, using Object.hasOwn so a name such as toString counts as missing.',
      'Compare with ===, so null and "" stay different.',
      'Copy the store before setting or deleting the key.',
    ],
    checks: [
      {
        name: 'Sets a value that still matches',
        input: [{ count: '1' }, 'count', '1', '2'],
        expected: { ok: true, store: { count: '2' } },
      },
      { name: 'Refuses an out-of-date expectation', input: [{ count: '2' }, 'count', '1', '2'], expected: { ok: false, current: '2' } },
      { name: 'Creates a missing key when null is expected', input: [{}, 'a', null, 'x'], expected: { ok: true, store: { a: 'x' } } },
      { name: 'Refuses to create a key that exists', input: [{ a: 'x' }, 'a', null, 'y'], expected: { ok: false, current: 'x' } },
      { name: 'Removes a key when next is null', input: [{ a: 'x', b: 'y' }, 'a', 'x', null], expected: { ok: true, store: { b: 'y' } } },
      { name: 'Refuses when a value is expected for a missing key', input: [{}, 'a', 'x', 'y'], expected: { ok: false, current: null } },
      { name: 'Treats an empty string as a value', input: [{ a: '' }, 'a', null, 'v'], expected: { ok: false, current: '' } },
      { name: 'Treats inherited names as missing', input: [{}, 'toString', null, 'v'], expected: { ok: true, store: { toString: 'v' } } },
      { name: 'Compares values exactly', input: [{ a: 'X' }, 'a', 'x', 'y'], expected: { ok: false, current: 'X' } },
      {
        name: 'Allows setting the same value again',
        input: [{ a: 'x', b: 'y' }, 'a', 'x', 'x'],
        expected: { ok: true, store: { a: 'x', b: 'y' } },
      },
    ],
  },
  {
    id: 'backend-replay-writes',
    title: 'Replay concurrent edits with versions',
    category: 'Backend services',
    format: 'backend',
    context:
      'Several clients edit one shared setting. Each reads it, works for a while, and writes back. The server keeps a version number, so a write based on an older read is refused and that client has to read again.',
    prompt:
      'Implement replayWrites(initial, events). initial is {value, version}. Process events in order. A read event {client, type: "read"} records the current version as that client\'s known version. A write event {client, type: "write", value} is accepted when the client\'s known version equals the current version: the value is stored, the version increases by 1, and the client\'s known version becomes the new version. Otherwise the write is refused and changes nothing, which includes a client that has never read. Return {value, version, refused}, where refused lists the positions (from 0) of refused writes, in order. Do not change the inputs.',
    brief: {
      summary: 'Implement replayWrites(initial, events) and return {value, version, refused}.',
      rules: [
        'A read event {client, type: "read"} records the current version as that client\'s known version.',
        'A write event {client, type: "write", value} is accepted when the client\'s known version equals the current version.',
        "An accepted write stores the value, increases the version by 1, and sets the client's known version to the new version.",
        'Otherwise the write is refused and changes nothing, which includes a client that has never read.',
        'refused lists the positions (from 0) of refused writes, in order.',
      ],
      edgeCases: ["A refused write leaves the client's known version as it was.", 'Do not change the inputs.'],
    },
    example: {
      input:
        'replayWrites({value: "light", version: 1}, [{client: "A", type: "read"}, {client: "B", type: "read"}, {client: "A", type: "write", value: "dark"}, {client: "B", type: "write", value: "blue"}])',
      output: '{value: "dark", version: 2, refused: [3]}',
    },
    note: 'Client names are non-empty text and compare exactly; values are text. events has at most 100 entries. These are values passed to your function, not a live server.',
    vocabulary: [
      { term: 'Version number', meaning: 'a counter stored with a record that increases with every accepted change' },
      {
        term: 'Read-modify-write',
        meaning: 'reading a value, changing it in your code, and writing it back, which can lose changes made in between',
      },
    ],
    planPrompt:
      "Trace the example in a table with a row per event: the stored value, the current version, and each client's known version. Which row refuses a write, and why?",
    starter:
      'type Event = { client: string; type: "read" } | { client: string; type: "write"; value: string }\n\nfunction replayWrites(initial: { value: string; version: number }, events: Event[]) {\n  // Track each client\'s known version as you go.\n  return { value: initial.value, version: initial.version, refused: [] as number[] }\n}\n',
    functionName: 'replayWrites',
    preserveInput: true,
    hints: [
      'Keep a Map from each client to the version that client last saw.',
      'A write needs a known version, and that version must equal the current one at the moment of the write.',
      "After an accepted write, update both the current version and the writer's known version; a refused write changes neither.",
    ],
    checks: [
      {
        name: 'Refuses the second of two writes based on the same read',
        input: [
          { value: 'light', version: 1 },
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'read' },
            { client: 'A', type: 'write', value: 'dark' },
            { client: 'B', type: 'write', value: 'blue' },
          ],
        ],
        expected: { value: 'dark', version: 2, refused: [3] },
      },
      {
        name: 'Accepts edits that take turns',
        input: [
          { value: 'light', version: 1 },
          [
            { client: 'A', type: 'read' },
            { client: 'A', type: 'write', value: 'dark' },
            { client: 'B', type: 'read' },
            { client: 'B', type: 'write', value: 'blue' },
          ],
        ],
        expected: { value: 'blue', version: 3, refused: [] },
      },
      {
        name: 'Refuses a write from a client that never read',
        input: [{ value: 'light', version: 1 }, [{ client: 'A', type: 'write', value: 'dark' }]],
        expected: { value: 'light', version: 1, refused: [0] },
      },
      {
        name: 'Lets a client write again after its own write',
        input: [
          { value: 'light', version: 1 },
          [
            { client: 'A', type: 'read' },
            { client: 'A', type: 'write', value: 'dark' },
            { client: 'A', type: 'write', value: 'blue' },
          ],
        ],
        expected: { value: 'blue', version: 3, refused: [] },
      },
      {
        name: 'Keeps refusing until the client reads again',
        input: [
          { value: 'light', version: 1 },
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'read' },
            { client: 'A', type: 'write', value: 'dark' },
            { client: 'B', type: 'write', value: 'blue' },
            { client: 'B', type: 'write', value: 'green' },
            { client: 'B', type: 'read' },
            { client: 'B', type: 'write', value: 'green' },
          ],
        ],
        expected: { value: 'green', version: 3, refused: [3, 4] },
      },
      {
        name: 'A read records the version at that moment',
        input: [
          { value: 'light', version: 1 },
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'read' },
            { client: 'B', type: 'write', value: 'blue' },
            { client: 'A', type: 'read' },
            { client: 'A', type: 'write', value: 'dark' },
          ],
        ],
        expected: { value: 'dark', version: 3, refused: [] },
      },
      {
        name: 'Refuses a stale write after a change was undone',
        input: [
          { value: 'light', version: 1 },
          [
            { client: 'A', type: 'read' },
            { client: 'B', type: 'read' },
            { client: 'B', type: 'write', value: 'dark' },
            { client: 'B', type: 'write', value: 'light' },
            { client: 'A', type: 'write', value: 'blue' },
          ],
        ],
        expected: { value: 'light', version: 3, refused: [4] },
      },
      { name: 'Handles an empty log', input: [{ value: 'light', version: 7 }, []], expected: { value: 'light', version: 7, refused: [] } },
      {
        name: 'Starts from the given version',
        input: [
          { value: 'light', version: 7 },
          [
            { client: 'A', type: 'read' },
            { client: 'A', type: 'write', value: 'dark' },
          ],
        ],
        expected: { value: 'dark', version: 8, refused: [] },
      },
    ],
  },
]
