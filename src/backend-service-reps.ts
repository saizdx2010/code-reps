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
      'type HttpRequest = { method: string; headers: [string, string][]; body: string }\ntype BodyResult =\n  | { ok: true; data: Record<string, unknown> | null }\n  | { ok: false; status: number; error: string }\n\nfunction readJsonBody(request: HttpRequest): BodyResult {\n  // Check the method, media type, size, and JSON in order.\n  return { ok: false, status: 400, error: "INVALID_JSON" }\n}\n',
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
    id: 'backend-session-state',
    title: 'Decide whether a session still counts',
    category: 'Backend services',
    format: 'backend',
    context:
      'After someone signs in, the server keeps a session record and the browser sends its ID with each request. Before doing anything else, the server looks the record up and decides whether it still counts: it may have been signed out, may be too old, or may have gone unused for too long.',
    prompt:
      'Implement checkSession(session, now). session is null when no record matches the request, or {userId, createdAt, lastSeenAt, revoked}, with times in milliseconds. Decide in this order: if session is null, return {status: 401, reason: "missing"}; if revoked is true, return {status: 401, reason: "revoked"}; if now - createdAt is at least 28800000 (8 hours), return {status: 401, reason: "expired"}; if now - lastSeenAt is at least 1800000 (30 minutes), return {status: 401, reason: "idle"}. Otherwise return {status: 200, userId}. Do not change the input.',
    brief: {
      summary: 'Implement checkSession(session, now) and return 401 with a reason, or 200 with the userId.',
      rules: [
        'If session is null, return {status: 401, reason: "missing"}.',
        'If revoked is true, return {status: 401, reason: "revoked"}.',
        'If now - createdAt is at least 28800000 (8 hours), return {status: 401, reason: "expired"}.',
        'If now - lastSeenAt is at least 1800000 (30 minutes), return {status: 401, reason: "idle"}.',
        'Otherwise return {status: 200, userId}. The first rule that applies decides the answer.',
      ],
      edgeCases: [
        'Reaching a limit exactly counts as too late.',
        'The 8-hour limit counts from createdAt, however recently the session was used.',
        'Do not change the input.',
      ],
    },
    example: {
      input: 'checkSession({userId: "m1", createdAt: 0, lastSeenAt: 7000000, revoked: false}, 8000000)',
      output: '{status: 200, userId: "m1"}',
    },
    note: 'Times are whole milliseconds with createdAt <= lastSeenAt <= now. The checks pass session records to your function directly: there is no cookie, no live server, and no clock, because now is always an argument.',
    vocabulary: [
      { term: 'Session', meaning: 'a record the server keeps after sign-in, so later requests can be tied to the same person' },
      { term: 'Idle timeout', meaning: 'how long a session may go unused before it stops counting' },
      { term: 'Absolute lifetime', meaning: 'the longest a session may last from sign-in, however often it is used' },
    ],
    planPrompt:
      'A session started at 0 and was last used at 7000000. Decide the answer at 8000000, at 8800000, and at 28800000, and name the rule each one meets.',
    starter:
      "type Session = { userId: string; createdAt: number; lastSeenAt: number; revoked: boolean }\ntype Decision = { status: 200; userId: string } | { status: 401; reason: 'missing' | 'revoked' | 'expired' | 'idle' }\n\nfunction checkSession(session: Session | null, now: number): Decision {\n  // Check each reason in order, then allow.\n  return { status: 401, reason: 'missing' }\n}\n",
    functionName: 'checkSession',
    preserveInput: true,
    hints: [
      'Write the four reasons in the order the contract lists them; the first one that applies decides the answer.',
      'Both limits use elapsed time: subtract the stored time from now and compare with the limit, counting the limit itself as too late.',
      'Return 401 with "missing" for null, then "revoked", then "expired" measured from createdAt, then "idle" measured from lastSeenAt, and 200 with the userId otherwise.',
    ],
    checks: [
      {
        name: 'Allows an active session',
        input: [{ userId: 'm1', createdAt: 0, lastSeenAt: 7000000, revoked: false }, 8000000],
        expected: { status: 200, userId: 'm1' },
      },
      { name: 'Refuses a request without a session', input: [null, 5000], expected: { status: 401, reason: 'missing' } },
      {
        name: 'Refuses a revoked session',
        input: [{ userId: 'm1', createdAt: 0, lastSeenAt: 1000, revoked: true }, 2000],
        expected: { status: 401, reason: 'revoked' },
      },
      {
        name: 'Ends a session idle for exactly 30 minutes',
        input: [{ userId: 'm1', createdAt: 0, lastSeenAt: 1000, revoked: false }, 1801000],
        expected: { status: 401, reason: 'idle' },
      },
      {
        name: 'Allows a session idle for just under 30 minutes',
        input: [{ userId: 'm1', createdAt: 0, lastSeenAt: 1000, revoked: false }, 1800999],
        expected: { status: 200, userId: 'm1' },
      },
      {
        name: 'Ends a session exactly 8 hours after sign-in',
        input: [{ userId: 'm2', createdAt: 0, lastSeenAt: 28799000, revoked: false }, 28800000],
        expected: { status: 401, reason: 'expired' },
      },
      {
        name: 'Allows a session just under 8 hours old',
        input: [{ userId: 'm2', createdAt: 0, lastSeenAt: 28700000, revoked: false }, 28799999],
        expected: { status: 200, userId: 'm2' },
      },
      {
        name: 'Measures the 8-hour limit from sign-in',
        input: [{ userId: 'm2', createdAt: 0, lastSeenAt: 28000000, revoked: false }, 28900000],
        expected: { status: 401, reason: 'expired' },
      },
      {
        name: 'Measures the idle limit from the last use',
        input: [{ userId: 'm3', createdAt: 0, lastSeenAt: 10000000, revoked: false }, 11000000],
        expected: { status: 200, userId: 'm3' },
      },
      {
        name: 'Reports revoked before expired',
        input: [{ userId: 'm1', createdAt: 0, lastSeenAt: 0, revoked: true }, 30000000],
        expected: { status: 401, reason: 'revoked' },
      },
      {
        name: 'Reports expired before idle',
        input: [{ userId: 'm1', createdAt: 0, lastSeenAt: 0, revoked: false }, 28800000],
        expected: { status: 401, reason: 'expired' },
      },
    ],
  },
  {
    id: 'backend-role-permission',
    title: 'Check what a role allows',
    category: 'Backend services',
    format: 'backend',
    context:
      'A notes service gives each member one or more roles, and a table lists the actions each role allows. Every request names one action, such as "notes:read", and the server answers before it touches any data.',
    prompt:
      'Implement authorize(user, action, permissions). user is null when the request has no valid session, or {id, roles}, where roles is an array of role names. permissions maps a role name to the actions it grants. An action is "<resource>:<verb>", such as "notes:read", and a grant is either an exact action or "<resource>:*", which covers every verb on that resource. Return {status: 401} when user is null. Return {status: 200} when any of the user\'s roles grants the action. Otherwise, including when a role is not in the table or the user has no roles, return {status: 403}. Names are compared exactly, letter case included. Do not change the inputs.',
    brief: {
      summary: 'Implement authorize(user, action, permissions) and return 200, 401, or 403.',
      rules: [
        'Return {status: 401} when user is null.',
        'A grant equal to the action covers it, and a grant "<resource>:*" covers every action that starts with "<resource>:".',
        "Return {status: 200} when any of the user's roles grants the action.",
        'Otherwise return {status: 403}. A role missing from the table grants nothing.',
      ],
      edgeCases: [
        'A wildcard covers only its own resource: "notes:*" does not cover "notes-archive:read".',
        'A bare "*" is not a wildcard grant; it covers only an action named exactly "*".',
        'Names are compared exactly, letter case included.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input: 'authorize({id: "m1", roles: ["viewer"]}, "notes:delete", {viewer: ["notes:read"], editor: ["notes:*"]})',
      output: '{status: 403}',
    },
    note: 'Users, roles, and the permission table are values passed to your function. There is no live server or user directory; the checks call it directly.',
    vocabulary: [
      { term: 'Role', meaning: 'a named group of permissions given to a user, such as editor' },
      { term: 'Permission', meaning: 'one action a role allows, such as notes:edit' },
      { term: 'Deny by default', meaning: 'refusing every action that nothing explicitly allows' },
    ],
    planPrompt:
      'The table gives viewer ["notes:read"] and editor ["notes:*"]. Decide each answer: a viewer reading notes, a viewer deleting notes, an editor deleting notes, an editor reading notes-archive, and a request with no session.',
    starter:
      "type User = { id: string; roles: string[] }\ntype RolePermissions = { [role: string]: string[] }\n\nfunction authorize(user: User | null, action: string, permissions: RolePermissions): { status: 200 | 401 | 403 } {\n  // Allow only what one of the user's roles grants.\n  return { status: 403 }\n}\n",
    functionName: 'authorize',
    preserveInput: true,
    hints: [
      'Keep the two refusals apart: no user at all is 401, while a known user without the permission is 403.',
      'A grant ending in ":*" covers an action when the action starts with the grant minus its "*", colon included.',
      'Loop over the roles, look each one up in the table (a missing role grants nothing), and return 200 as soon as one grant covers the action; otherwise return 403.',
    ],
    checks: [
      {
        name: 'Allows an exact grant',
        input: [{ id: 'm1', roles: ['viewer'] }, 'notes:read', { viewer: ['notes:read'], editor: ['notes:*'] }],
        expected: { status: 200 },
      },
      {
        name: 'Refuses an action no role grants',
        input: [{ id: 'm1', roles: ['viewer'] }, 'notes:delete', { viewer: ['notes:read'], editor: ['notes:*'] }],
        expected: { status: 403 },
      },
      {
        name: 'Answers 401 without a session',
        input: [null, 'notes:read', { viewer: ['notes:read'], editor: ['notes:*'] }],
        expected: { status: 401 },
      },
      {
        name: 'Lets a wildcard cover every verb on its resource',
        input: [{ id: 'm2', roles: ['editor'] }, 'notes:delete', { viewer: ['notes:read'], editor: ['notes:*'] }],
        expected: { status: 200 },
      },
      {
        name: 'Keeps a wildcard to its own resource',
        input: [{ id: 'm2', roles: ['editor'] }, 'notes-archive:read', { viewer: ['notes:read'], editor: ['notes:*'] }],
        expected: { status: 403 },
      },
      {
        name: 'Combines the grants of several roles',
        input: [{ id: 'm3', roles: ['viewer', 'tagger'] }, 'tags:edit', { viewer: ['notes:read'], tagger: ['tags:edit'] }],
        expected: { status: 200 },
      },
      {
        name: 'Ignores a role missing from the table',
        input: [{ id: 'm4', roles: ['guest'] }, 'notes:read', { viewer: ['notes:read'] }],
        expected: { status: 403 },
      },
      {
        name: 'Refuses a user with no roles',
        input: [{ id: 'm5', roles: [] }, 'notes:read', { viewer: ['notes:read'] }],
        expected: { status: 403 },
      },
      {
        name: 'Does not treat a bare "*" as every action',
        input: [{ id: 'm6', roles: ['owner'] }, 'notes:read', { owner: ['*'] }],
        expected: { status: 403 },
      },
      {
        name: 'Compares names with their letter case',
        input: [{ id: 'm1', roles: ['viewer'] }, 'Notes:read', { viewer: ['notes:read'] }],
        expected: { status: 403 },
      },
      {
        name: 'Does not let a requested wildcard match a narrower grant',
        input: [{ id: 'm1', roles: ['viewer'] }, 'notes:*', { viewer: ['notes:read'] }],
        expected: { status: 403 },
      },
    ],
  },
  {
    id: 'backend-owner-access',
    title: 'Let members reach only their own notes',
    category: 'Backend services',
    format: 'backend',
    context:
      'In a notes app, each note belongs to the member who wrote it, and the owner can share a note with other members for reading. A role check alone cannot tell these apart, so on every request the server also checks whether this member may act on this particular note.',
    prompt:
      'Implement noteAccess(user, note, action). user is {id, role}, with role "member" or "admin". note is null when no note has the requested ID, or {id, ownerId, sharedWith}, where sharedWith is an array of member IDs. action is "read", "edit", or "delete". Decide in this order: if note is null, return {status: 404}. If note.ownerId equals user.id, return {status: 200} for any action. If user.role is "admin", return {status: 200} for read and delete and {status: 403} for edit. If sharedWith includes user.id, return {status: 200} for read and {status: 403} otherwise. For anyone else return {status: 404}, so the note looks the same as one that does not exist. Do not change the inputs.',
    brief: {
      summary: 'Implement noteAccess(user, note, action) and return 200, 403, or 404.',
      rules: [
        'If note is null, return {status: 404}.',
        'The owner (note.ownerId equals user.id) may take any action: {status: 200}.',
        "An admin may read and delete any note, but editing someone else's note is {status: 403}.",
        'A member listed in sharedWith may read: {status: 200}; editing or deleting is {status: 403}.',
        'Anyone else gets {status: 404}, the same answer as a note that does not exist.',
      ],
      edgeCases: ['An admin who owns the note follows the owner rule.', 'Do not change the inputs.'],
    },
    example: {
      input: 'noteAccess({id: "m2", role: "member"}, {id: "n1", ownerId: "m1", sharedWith: ["m2"]}, "edit")',
      output: '{status: 403}',
    },
    note: 'Users and notes are values passed to your function; there is no live server or database. A real handler loads the note by ID and makes this decision before reading or changing it.',
    vocabulary: [
      { term: 'Ownership check', meaning: "comparing a record's owner with the user making the request before acting on it" },
      { term: 'Object-level access', meaning: 'deciding access for each record, not only for each kind of action' },
    ],
    planPrompt:
      'Note n1 belongs to m1 and is shared with m2. Decide read, edit, and delete for m1, for m2, for another member m3, and for an admin a1.',
    starter:
      "type User = { id: string; role: 'member' | 'admin' }\ntype Note = { id: string; ownerId: string; sharedWith: string[] }\ntype Action = 'read' | 'edit' | 'delete'\n\nfunction noteAccess(user: User, note: Note | null, action: Action): { status: 200 | 403 | 404 } {\n  // Decide in the order of the rules.\n  return { status: 404 }\n}\n",
    functionName: 'noteAccess',
    preserveInput: true,
    hints: [
      'Answer 404 for a missing note before anything else: there is nothing to act on.',
      'Check the owner before the role, so an admin who wrote the note may still edit it.',
      'After the owner and admin rules, a shared member may only read (403 for the rest), and everyone else gets 404, the same as a missing note.',
    ],
    checks: [
      {
        name: 'Lets the owner edit',
        input: [{ id: 'm1', role: 'member' }, { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] }, 'edit'],
        expected: { status: 200 },
      },
      {
        name: 'Lets the owner delete',
        input: [{ id: 'm1', role: 'member' }, { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] }, 'delete'],
        expected: { status: 200 },
      },
      {
        name: 'Lets a shared member read',
        input: [{ id: 'm2', role: 'member' }, { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] }, 'read'],
        expected: { status: 200 },
      },
      {
        name: 'Refuses a shared member who edits',
        input: [{ id: 'm2', role: 'member' }, { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] }, 'edit'],
        expected: { status: 403 },
      },
      {
        name: 'Refuses a shared member who deletes',
        input: [{ id: 'm2', role: 'member' }, { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] }, 'delete'],
        expected: { status: 403 },
      },
      {
        name: 'Hides the note from other members',
        input: [{ id: 'm3', role: 'member' }, { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] }, 'read'],
        expected: { status: 404 },
      },
      {
        name: 'Hides the note from other members who try to edit',
        input: [{ id: 'm3', role: 'member' }, { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] }, 'edit'],
        expected: { status: 404 },
      },
      { name: 'Answers 404 for a missing note', input: [{ id: 'm1', role: 'member' }, null, 'read'], expected: { status: 404 } },
      {
        name: 'Answers 404 for a missing note to an admin too',
        input: [{ id: 'a1', role: 'admin' }, null, 'delete'],
        expected: { status: 404 },
      },
      {
        name: 'Lets an admin read any note',
        input: [{ id: 'a1', role: 'admin' }, { id: 'n1', ownerId: 'm1', sharedWith: [] }, 'read'],
        expected: { status: 200 },
      },
      {
        name: 'Lets an admin delete any note',
        input: [{ id: 'a1', role: 'admin' }, { id: 'n1', ownerId: 'm1', sharedWith: [] }, 'delete'],
        expected: { status: 200 },
      },
      {
        name: "Refuses an admin who edits someone else's note",
        input: [{ id: 'a1', role: 'admin' }, { id: 'n1', ownerId: 'm1', sharedWith: [] }, 'edit'],
        expected: { status: 403 },
      },
      {
        name: 'Treats an admin who owns the note as its owner',
        input: [{ id: 'a1', role: 'admin' }, { id: 'n2', ownerId: 'a1', sharedWith: [] }, 'edit'],
        expected: { status: 200 },
      },
    ],
  },
  {
    id: 'backend-visible-notes',
    title: 'List only the notes a member may see',
    category: 'Backend services',
    format: 'backend',
    context:
      'The notes list endpoint returns one page of IDs and a total, so the app can show "12 notes". The list has to follow the same rules as opening one note, or it shows titles and counts that a member could never open.',
    prompt:
      'Implement visibleNotes(user, notes). user is {id, role}, with role "member" or "admin"; notes is an array of {id, ownerId, sharedWith}. An admin may see every note. A member may see a note they own or one whose sharedWith includes their id. Return {ids, total}: ids lists the IDs of the notes the user may see, in the given order, and total is how many there are. Notes the user may not see are left out of both, so the answer does not reveal how many other notes exist. Do not change the inputs.',
    brief: {
      summary: 'Implement visibleNotes(user, notes) and return {ids, total} for the notes the user may see.',
      rules: [
        'An admin may see every note.',
        'A member may see a note they own or one whose sharedWith includes their id.',
        'ids keeps the given order, and total counts only the notes the user may see.',
      ],
      edgeCases: ['An empty list returns {ids: [], total: 0}.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'visibleNotes({id: "m2", role: "member"}, [{id: "n1", ownerId: "m1", sharedWith: ["m2"]}, {id: "n2", ownerId: "m1", sharedWith: []}, {id: "n3", ownerId: "m2", sharedWith: []}])',
      output: '{ids: ["n1", "n3"], total: 2}',
    },
    note: 'Notes are an array passed to your function, not a live database. A real endpoint filters in its query (for example WHERE owner_id = ? OR ...) before paging, which these reps do not cover.',
    vocabulary: [
      { term: 'Row-level filtering', meaning: 'limiting a list to the rows the requesting user may see, before counting or paging' },
    ],
    planPrompt:
      'Three notes: n1 by m1 shared with m2, n2 by m1, n3 by m2. Write the ids and total for m1, for m2, for m3, and for an admin.',
    starter:
      "type User = { id: string; role: 'member' | 'admin' }\ntype Note = { id: string; ownerId: string; sharedWith: string[] }\n\nfunction visibleNotes(user: User, notes: Note[]): { ids: string[]; total: number } {\n  // Keep the notes this user may see.\n  return { ids: [], total: notes.length }\n}\n",
    functionName: 'visibleNotes',
    preserveInput: true,
    hints: [
      'Write one test that says whether this user may see one note, using the same rules as opening it.',
      'Filter with that test first, then count what is left; counting the whole list tells a member how many hidden notes exist.',
      'Return the filtered IDs in their original order and their count as total; an admin passes the test for every note.',
    ],
    checks: [
      {
        name: 'Shows a member their own and shared notes',
        input: [
          { id: 'm2', role: 'member' },
          [
            { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] },
            { id: 'n2', ownerId: 'm1', sharedWith: [] },
            { id: 'n3', ownerId: 'm2', sharedWith: [] },
          ],
        ],
        expected: { ids: ['n1', 'n3'], total: 2 },
      },
      {
        name: 'Counts only the visible notes',
        input: [
          { id: 'm3', role: 'member' },
          [
            { id: 'n1', ownerId: 'm1', sharedWith: ['m2'] },
            { id: 'n2', ownerId: 'm1', sharedWith: [] },
          ],
        ],
        expected: { ids: [], total: 0 },
      },
      {
        name: 'Shows an admin every note',
        input: [
          { id: 'a1', role: 'admin' },
          [
            { id: 'n1', ownerId: 'm1', sharedWith: [] },
            { id: 'n2', ownerId: 'm2', sharedWith: [] },
          ],
        ],
        expected: { ids: ['n1', 'n2'], total: 2 },
      },
      {
        name: 'Keeps the given order',
        input: [
          { id: 'm1', role: 'member' },
          [
            { id: 'n9', ownerId: 'm1', sharedWith: [] },
            { id: 'n4', ownerId: 'm2', sharedWith: ['m1'] },
            { id: 'n7', ownerId: 'm1', sharedWith: [] },
          ],
        ],
        expected: { ids: ['n9', 'n4', 'n7'], total: 3 },
      },
      { name: 'Returns nothing for an empty list', input: [{ id: 'm1', role: 'member' }, []], expected: { ids: [], total: 0 } },
      {
        name: 'Matches shared members by exact id',
        input: [{ id: 'm1', role: 'member' }, [{ id: 'n5', ownerId: 'm2', sharedWith: ['m10', 'M1'] }]],
        expected: { ids: [], total: 0 },
      },
    ],
  },
  {
    id: 'backend-loan-access',
    title: 'Decide who may view or renew a loan',
    category: 'Backend services',
    format: 'backend',
    context:
      "A library app lists book loans. Members use it to check and renew their own loans; librarians use it at the desk to look up and renew anyone's. Renewing has limits, and a member cannot renew a loan that is already overdue.",
    prompt:
      'Implement decideLoan(actor, loan, action, now). actor is {id, role}, with role "member" or "librarian". loan is null when no loan has the requested ID, or {id, memberId, dueAt, renewals}, with dueAt in milliseconds. action is "view" or "renew". If loan is null, return {status: 404}. A member whose id is not loan.memberId gets {status: 404} for either action. Viewing is {status: 200} for the loan\'s member and for any librarian. When the loan\'s member renews: if now is at or after dueAt, return {status: 403, reason: "overdue"}; otherwise, if renewals is 2 or more, return {status: 403, reason: "limit"}; otherwise {status: 200}. When a librarian renews: if renewals is 3 or more, return {status: 403, reason: "limit"}; otherwise {status: 200}, even when the loan is overdue. Do not change the inputs.',
    brief: {
      summary: 'Implement decideLoan(actor, loan, action, now) and return 200, 403 with a reason, or 404.',
      rules: [
        'A missing loan is {status: 404}, and so is any loan of another member when the actor is a member.',
        "The loan's member and any librarian may view it: {status: 200}.",
        'A member renewing their loan gets {status: 403, reason: "overdue"} at or after dueAt, then {status: 403, reason: "limit"} with 2 or more renewals, and {status: 200} otherwise.',
        'A librarian renewing gets {status: 403, reason: "limit"} with 3 or more renewals and {status: 200} otherwise, even for an overdue loan.',
      ],
      edgeCases: ['The role decides which renewal rules apply.', 'Do not change the inputs.'],
    },
    example: {
      input: 'decideLoan({id: "m1", role: "member"}, {id: "L1", memberId: "m1", dueAt: 5000, renewals: 1}, "renew", 4000)',
      output: '{status: 200}',
    },
    note: 'Actors and loans are values passed to your function, and now is an argument, not the machine clock. There is no live server or library database; the checks call the function directly.',
    vocabulary: [
      { term: 'Borrower', meaning: 'the member a loan belongs to' },
      { term: 'Renewal limit', meaning: 'the most times a loan may be extended' },
    ],
    planPrompt:
      'Loan L1 belongs to m1, is due at 5000, and has 2 renewals. Decide m1 viewing, m1 renewing at 4000, m2 viewing, and a librarian renewing at 6000.',
    starter:
      "type Actor = { id: string; role: 'member' | 'librarian' }\ntype Loan = { id: string; memberId: string; dueAt: number; renewals: number }\ntype Decision = { status: 200 } | { status: 404 } | { status: 403; reason: 'overdue' | 'limit' }\n\nfunction decideLoan(actor: Actor, loan: Loan | null, action: 'view' | 'renew', now: number): Decision {\n  // Decide who may act on this loan, then apply the renewal rules.\n  return { status: 404 }\n}\n",
    functionName: 'decideLoan',
    preserveInput: true,
    hints: [
      'Settle whether this actor may know about the loan at all before looking at the action.',
      "Viewing needs only that first decision; renewing then follows the rules for the actor's role.",
      'For a member, check overdue before the renewal count; for a librarian, only the count of 3 matters.',
    ],
    checks: [
      {
        name: 'Lets a member renew their loan',
        input: [{ id: 'm1', role: 'member' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 1 }, 'renew', 4000],
        expected: { status: 200 },
      },
      {
        name: 'Lets a member view their loan',
        input: [{ id: 'm1', role: 'member' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 2 }, 'view', 9000],
        expected: { status: 200 },
      },
      {
        name: "Hides another member's loan",
        input: [{ id: 'm2', role: 'member' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 0 }, 'view', 4000],
        expected: { status: 404 },
      },
      {
        name: "Refuses to renew another member's loan as if it did not exist",
        input: [{ id: 'm2', role: 'member' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 0 }, 'renew', 4000],
        expected: { status: 404 },
      },
      {
        name: 'Answers 404 for a missing loan',
        input: [{ id: 'k1', role: 'librarian' }, null, 'view', 4000],
        expected: { status: 404 },
      },
      {
        name: 'Refuses a member renewing at the due time',
        input: [{ id: 'm1', role: 'member' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 0 }, 'renew', 5000],
        expected: { status: 403, reason: 'overdue' },
      },
      {
        name: 'Refuses a member at the renewal limit',
        input: [{ id: 'm1', role: 'member' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 2 }, 'renew', 4000],
        expected: { status: 403, reason: 'limit' },
      },
      {
        name: 'Reports overdue before the limit',
        input: [{ id: 'm1', role: 'member' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 2 }, 'renew', 6000],
        expected: { status: 403, reason: 'overdue' },
      },
      {
        name: "Lets a librarian view anyone's loan",
        input: [{ id: 'k1', role: 'librarian' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 0 }, 'view', 4000],
        expected: { status: 200 },
      },
      {
        name: 'Lets a librarian renew an overdue loan',
        input: [{ id: 'k1', role: 'librarian' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 2 }, 'renew', 6000],
        expected: { status: 200 },
      },
      {
        name: 'Refuses a librarian at three renewals',
        input: [{ id: 'k1', role: 'librarian' }, { id: 'L1', memberId: 'm1', dueAt: 5000, renewals: 3 }, 'renew', 4000],
        expected: { status: 403, reason: 'limit' },
      },
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
      'type EditEvent = { client: string; type: "read" | "write" }\n\nfunction lostUpdates(events: EditEvent[]): number[] {\n  // Track who wrote the stored value and when each client last read.\n  return []\n}\n',
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
      'type EditEvent = { client: string; type: "read" } | { client: string; type: "write"; value: string }\n\nfunction replayWrites(initial: { value: string; version: number }, events: EditEvent[]) {\n  // Track each client\'s known version as you go.\n  return { value: initial.value, version: initial.version, refused: [] as number[] }\n}\n',
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
  {
    id: 'backend-job-failure',
    title: 'Decide what happens to a failed job',
    category: 'Backend services',
    format: 'backend',
    context:
      'A background worker sends emails and builds reports outside the request that asked for them. When a job fails, the worker either schedules another attempt later or moves the job to a dead-letter list for a person to look at.',
    prompt:
      'Implement afterFailure(job, error, now, policy). job.attempts counts the attempts made so far, including the one that just failed. If error.retryable is false, return {action: "dead-letter", reason: "PERMANENT_ERROR"}. Otherwise, if job.attempts is at least policy.maxAttempts, return {action: "dead-letter", reason: "TOO_MANY_ATTEMPTS"}. Otherwise return {action: "retry", runAt}, where runAt is now plus the smaller of policy.maxDelayMs and policy.baseDelayMs times 2 to the power (job.attempts - 1). Do not change the inputs.',
    brief: {
      summary: 'Implement afterFailure(job, error, now, policy) and return a retry time or a dead letter.',
      rules: [
        'If error.retryable is false, return {action: "dead-letter", reason: "PERMANENT_ERROR"}.',
        'Otherwise, if job.attempts is at least policy.maxAttempts, return {action: "dead-letter", reason: "TOO_MANY_ATTEMPTS"}.',
        'Otherwise return {action: "retry", runAt}, where runAt is now plus the smaller of policy.maxDelayMs and policy.baseDelayMs times 2 to the power (job.attempts - 1).',
      ],
      edgeCases: ['job.attempts includes the attempt that just failed.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'afterFailure({id: "j1", attempts: 2}, {retryable: true, message: "timeout"}, 5000, {maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 60000})',
      output: '{action: "retry", runAt: 7000}',
    },
    note: 'attempts is at least 1; maxAttempts, baseDelayMs, and maxDelayMs are positive whole numbers; now is in milliseconds. Real queues often add a random amount to each delay so retries spread out; this contract adds none so the checks can be exact. These are values passed to your function, not a live queue or clock.',
    vocabulary: [
      { term: 'Dead-letter list', meaning: 'a place for jobs that will not be retried, kept for a person to inspect' },
      { term: 'Exponential backoff', meaning: 'waiting twice as long after each failure, up to a limit' },
    ],
    planPrompt:
      'With a base of 1000 and a cap of 60000, list the wait after attempts 1 to 8. At which attempt does the cap start to matter?',
    starter:
      'type Job = { id: string; attempts: number }\ntype Policy = { maxAttempts: number; baseDelayMs: number; maxDelayMs: number }\ntype Decision = { action: "retry"; runAt: number } | { action: "dead-letter"; reason: string }\n\nfunction afterFailure(job: Job, error: { retryable: boolean; message: string }, now: number, policy: Policy): Decision {\n  // Choose between retry and dead letter, in the stated order.\n  return { action: "retry", runAt: now }\n}\n',
    functionName: 'afterFailure',
    preserveInput: true,
    hints: [
      'Decide between retry and dead letter first, in the stated order; only a retry needs a time.',
      'The first failure waits exactly the base delay, so the power is attempts minus 1.',
      'Cap the delay with Math.min before adding it to now.',
    ],
    checks: [
      {
        name: 'Doubles the wait after the second attempt',
        input: [
          { id: 'j1', attempts: 2 },
          { retryable: true, message: 'timeout' },
          5000,
          { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'retry', runAt: 7000 },
      },
      {
        name: 'Waits the base delay after the first attempt',
        input: [
          { id: 'j1', attempts: 1 },
          { retryable: true, message: 'timeout' },
          5000,
          { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'retry', runAt: 6000 },
      },
      {
        name: 'Caps a long wait',
        input: [
          { id: 'j1', attempts: 8 },
          { retryable: true, message: 'busy' },
          0,
          { maxAttempts: 10, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'retry', runAt: 60000 },
      },
      {
        name: 'Keeps a wait equal to the cap',
        input: [
          { id: 'j1', attempts: 3 },
          { retryable: true, message: 'busy' },
          100,
          { maxAttempts: 10, baseDelayMs: 1000, maxDelayMs: 4000 },
        ],
        expected: { action: 'retry', runAt: 4100 },
      },
      {
        name: 'Retries one attempt before the limit',
        input: [
          { id: 'j1', attempts: 4 },
          { retryable: true, message: 'timeout' },
          0,
          { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'retry', runAt: 8000 },
      },
      {
        name: 'Gives up at the last allowed attempt',
        input: [
          { id: 'j1', attempts: 5 },
          { retryable: true, message: 'timeout' },
          0,
          { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'dead-letter', reason: 'TOO_MANY_ATTEMPTS' },
      },
      {
        name: 'Gives up after one attempt when only one is allowed',
        input: [
          { id: 'j1', attempts: 1 },
          { retryable: true, message: 'timeout' },
          0,
          { maxAttempts: 1, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'dead-letter', reason: 'TOO_MANY_ATTEMPTS' },
      },
      {
        name: 'Stops at once for a permanent error',
        input: [
          { id: 'j1', attempts: 1 },
          { retryable: false, message: 'record deleted' },
          0,
          { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'dead-letter', reason: 'PERMANENT_ERROR' },
      },
      {
        name: 'Reports a permanent error before the attempt limit',
        input: [
          { id: 'j1', attempts: 5 },
          { retryable: false, message: 'record deleted' },
          0,
          { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 60000 },
        ],
        expected: { action: 'dead-letter', reason: 'PERMANENT_ERROR' },
      },
    ],
  },
  {
    id: 'backend-claim-job',
    title: 'Claim the next job with a lease',
    category: 'Backend services',
    format: 'backend',
    context:
      'Several workers share one job table. A worker claims a job by taking a lease on it for a while. If that worker stops before finishing, its lease runs out and another worker can claim the same job, so every job runs at least once and sometimes more than once.',
    prompt:
      'Implement claimJob(jobs, worker, now, leaseMs). Each job has id, runAt, attempts, and lease, which is null or {worker, until}. A job is available when runAt is at or before now and it has no lease or its lease.until is at or before now. Choose the available job with the smallest runAt, breaking ties by the earlier position in jobs. Return {jobId, jobs}, where jobs is a new array in which the chosen job has lease {worker, until: now + leaseMs} and attempts increased by 1, and every other job is unchanged. When no job is available, return {jobId: null, jobs} with the jobs unchanged. Do not change the inputs.',
    brief: {
      summary: 'Implement claimJob(jobs, worker, now, leaseMs) and return the claimed job ID with the updated jobs.',
      rules: [
        'A job is available when runAt is at or before now and it has no lease or its lease.until is at or before now.',
        'Choose the available job with the smallest runAt, breaking ties by the earlier position in jobs.',
        'Return {jobId, jobs}, where the chosen job has lease {worker, until: now + leaseMs} and attempts increased by 1, and every other job is unchanged.',
        'When no job is available, return {jobId: null, jobs} with the jobs unchanged.',
      ],
      edgeCases: ['A live lease blocks every worker, including the one that holds it.', 'Do not change the inputs.'],
    },
    example: {
      input: 'claimJob([{id: "a", runAt: 0, attempts: 0, lease: null}], "w1", 100, 30000)',
      output: '{jobId: "a", jobs: [{id: "a", runAt: 0, attempts: 1, lease: {worker: "w1", until: 30100}}]}',
    },
    note: 'Times are whole milliseconds; leaseMs is positive; jobs has at most 100 entries. A real job table does this with one atomic database update so two workers cannot claim the same job at once; here one call stands for that update. These are values passed to your function, not a live queue.',
    vocabulary: [
      { term: 'Lease', meaning: 'a claim on a job that lasts until a set time, after which others may take it' },
      {
        term: 'At-least-once delivery',
        meaning: 'a promise that each job or message is handed out until it is done, so it may arrive more than once',
      },
    ],
    planPrompt:
      'At now = 100, which of these is available: a job due at 200; one leased until 500; one leased until 100; one due at 50 with no lease? Which one is claimed?',
    starter:
      'type Lease = { worker: string; until: number }\ntype Job = { id: string; runAt: number; attempts: number; lease: Lease | null }\n\nfunction claimJob(jobs: Job[], worker: string, now: number, leaseMs: number): { jobId: string | null; jobs: Job[] } {\n  // Find the earliest available job and lease it.\n  return { jobId: null, jobs }\n}\n',
    functionName: 'claimJob',
    preserveInput: true,
    hints: [
      'Write the availability test on its own: due by now, and either no lease or an expired one.',
      'Scan once, keeping the best available job so far; a later job replaces it only with a strictly smaller runAt.',
      'Build the result with map, replacing only the chosen job with a copy that has the new lease and attempts.',
    ],
    checks: [
      {
        name: 'Claims a waiting job',
        input: [[{ id: 'a', runAt: 0, attempts: 0, lease: null }], 'w1', 100, 30000],
        expected: { jobId: 'a', jobs: [{ id: 'a', runAt: 0, attempts: 1, lease: { worker: 'w1', until: 30100 } }] },
      },
      {
        name: 'Skips a job that is not due yet',
        input: [[{ id: 'a', runAt: 200, attempts: 0, lease: null }], 'w1', 100, 1000],
        expected: { jobId: null, jobs: [{ id: 'a', runAt: 200, attempts: 0, lease: null }] },
      },
      {
        name: 'Takes a job due exactly now',
        input: [[{ id: 'a', runAt: 100, attempts: 2, lease: null }], 'w1', 100, 1000],
        expected: { jobId: 'a', jobs: [{ id: 'a', runAt: 100, attempts: 3, lease: { worker: 'w1', until: 1100 } }] },
      },
      {
        name: 'Skips a job with a live lease',
        input: [[{ id: 'a', runAt: 0, attempts: 1, lease: { worker: 'w2', until: 500 } }], 'w1', 100, 1000],
        expected: { jobId: null, jobs: [{ id: 'a', runAt: 0, attempts: 1, lease: { worker: 'w2', until: 500 } }] },
      },
      {
        name: 'Reclaims a job whose lease ran out',
        input: [[{ id: 'a', runAt: 0, attempts: 1, lease: { worker: 'w2', until: 100 } }], 'w1', 100, 1000],
        expected: { jobId: 'a', jobs: [{ id: 'a', runAt: 0, attempts: 2, lease: { worker: 'w1', until: 1100 } }] },
      },
      {
        name: 'Does not let a worker reclaim its own live lease',
        input: [[{ id: 'a', runAt: 0, attempts: 1, lease: { worker: 'w1', until: 500 } }], 'w1', 100, 1000],
        expected: { jobId: null, jobs: [{ id: 'a', runAt: 0, attempts: 1, lease: { worker: 'w1', until: 500 } }] },
      },
      {
        name: 'Picks the earliest runAt, not the first in the list',
        input: [
          [
            { id: 'b', runAt: 50, attempts: 0, lease: null },
            { id: 'a', runAt: 10, attempts: 0, lease: null },
          ],
          'w1',
          100,
          1000,
        ],
        expected: {
          jobId: 'a',
          jobs: [
            { id: 'b', runAt: 50, attempts: 0, lease: null },
            { id: 'a', runAt: 10, attempts: 1, lease: { worker: 'w1', until: 1100 } },
          ],
        },
      },
      {
        name: 'Breaks a tie by position in the list',
        input: [
          [
            { id: 'z', runAt: 10, attempts: 0, lease: null },
            { id: 'a', runAt: 10, attempts: 0, lease: null },
          ],
          'w1',
          100,
          1000,
        ],
        expected: {
          jobId: 'z',
          jobs: [
            { id: 'z', runAt: 10, attempts: 1, lease: { worker: 'w1', until: 1100 } },
            { id: 'a', runAt: 10, attempts: 0, lease: null },
          ],
        },
      },
      { name: 'Returns null for an empty table', input: [[], 'w1', 100, 1000], expected: { jobId: null, jobs: [] } },
    ],
  },
  {
    id: 'backend-dedupe-deliveries',
    title: 'Skip a message delivered twice',
    category: 'Backend services',
    format: 'backend',
    context:
      'A queue delivers balance changes at least once, so the same message can arrive again after a retry or a worker restart. The handler keeps the IDs it has applied and skips any message it has already seen.',
    prompt:
      "Implement applyMessages(messages, processedIds). Each message has id, account, and amount. Apply a message when its id is not in processedIds and has not appeared earlier in messages: add its amount to its account's balance. Skip every other message, even if its account or amount differs, and list its id in skipped. Return {balances, skipped, processedIds}, where balances maps each account that received an applied message to its total, skipped lists skipped ids in arrival order, and processedIds is a new array: the given ids followed by the newly applied ids in order. Do not change the inputs.",
    brief: {
      summary: 'Implement applyMessages(messages, processedIds) and return {balances, skipped, processedIds}.',
      rules: [
        "Apply a message when its id is not in processedIds and has not appeared earlier in messages: add its amount to its account's balance.",
        'Skip every other message, even if its account or amount differs, and list its id in skipped, in arrival order.',
        'balances maps each account that received an applied message to its total.',
        'processedIds is a new array: the given ids followed by the newly applied ids in order.',
      ],
      edgeCases: ['A message with amount 0 still counts as applied.', 'Do not change the inputs.'],
    },
    example: {
      input: 'applyMessages([{id: "m1", account: "a1", amount: 500}, {id: "m1", account: "a1", amount: 500}], [])',
      output: '{balances: {a1: 500}, skipped: ["m1"], processedIds: ["m1"]}',
    },
    note: 'Amounts are whole numbers and may be negative; IDs and accounts are non-empty text compared exactly. messages has at most 200 entries. These are values passed to your function, not a live queue.',
    vocabulary: [
      { term: 'Idempotent consumer', meaning: 'a message handler that gives the same result when a message is delivered more than once' },
      { term: 'Message ID', meaning: 'a unique name given to a message when it is sent, used to recognize repeats' },
    ],
    planPrompt:
      'For messages m1, m2, m1 (with a different amount), and m3, with m3 already processed, write what happens to each and the final processedIds.',
    starter:
      'type Message = { id: string; account: string; amount: number }\n\nfunction applyMessages(messages: Message[], processedIds: string[]) {\n  // Apply each message once.\n  return { balances: {}, skipped: [] as string[], processedIds }\n}\n',
    functionName: 'applyMessages',
    preserveInput: true,
    hints: [
      'Put the processed IDs in a Set so each check is quick.',
      'Add an ID to the Set as soon as you apply its message, so a repeat later in the same batch is caught.',
      'Copy processedIds and append the new IDs in order, instead of pushing onto the array you were given.',
    ],
    checks: [
      {
        name: 'Applies a message once and skips its repeat',
        input: [
          [
            { id: 'm1', account: 'a1', amount: 500 },
            { id: 'm1', account: 'a1', amount: 500 },
          ],
          [],
        ],
        expected: { balances: { a1: 500 }, skipped: ['m1'], processedIds: ['m1'] },
      },
      {
        name: 'Skips a message processed before',
        input: [[{ id: 'm9', account: 'a1', amount: 100 }], ['m9']],
        expected: { balances: {}, skipped: ['m9'], processedIds: ['m9'] },
      },
      {
        name: 'Skips a repeat even when its content differs',
        input: [
          [
            { id: 'm1', account: 'a1', amount: 500 },
            { id: 'm1', account: 'a2', amount: 900 },
          ],
          [],
        ],
        expected: { balances: { a1: 500 }, skipped: ['m1'], processedIds: ['m1'] },
      },
      {
        name: 'Totals several accounts',
        input: [
          [
            { id: 'm1', account: 'a1', amount: 500 },
            { id: 'm2', account: 'a2', amount: 300 },
            { id: 'm3', account: 'a1', amount: -200 },
          ],
          ['m0'],
        ],
        expected: { balances: { a1: 300, a2: 300 }, skipped: [], processedIds: ['m0', 'm1', 'm2', 'm3'] },
      },
      {
        name: 'Counts a zero amount as applied',
        input: [[{ id: 'm1', account: 'a1', amount: 0 }], []],
        expected: { balances: { a1: 0 }, skipped: [], processedIds: ['m1'] },
      },
      {
        name: 'Lists skipped messages in arrival order',
        input: [
          [
            { id: 'm2', account: 'a1', amount: 1 },
            { id: 'm1', account: 'a1', amount: 1 },
            { id: 'm2', account: 'a1', amount: 1 },
            { id: 'm1', account: 'a1', amount: 1 },
          ],
          ['m1'],
        ],
        expected: { balances: { a1: 1 }, skipped: ['m1', 'm2', 'm1'], processedIds: ['m1', 'm2'] },
      },
      { name: 'Handles an empty batch', input: [[], ['m1']], expected: { balances: {}, skipped: [], processedIds: ['m1'] } },
      {
        name: 'Compares IDs exactly',
        input: [
          [
            { id: 'm1', account: 'a1', amount: 5 },
            { id: 'M1', account: 'a1', amount: 5 },
          ],
          [],
        ],
        expected: { balances: { a1: 10 }, skipped: [], processedIds: ['m1', 'M1'] },
      },
    ],
  },
  {
    id: 'backend-outbox-relay',
    title: 'Publish events from an outbox',
    category: 'Backend services',
    format: 'backend',
    context:
      'A service saves an order and, in the same database transaction, an "order placed" event in an outbox table. A relay later publishes the unpublished events to other services in order. If publishing fails, it stops and tries again on its next run, so an event can be published more than once but is never skipped.',
    prompt:
      "Implement relayOutbox(rows, results, now, batchSize). Each row has id (a whole number), event, and publishedAt (null, or the time it was published). Take the unpublished rows in increasing id order, at most batchSize of them, and publish them one at a time: the n-th publish attempt succeeds when results[n - 1] is true, and fails when it is false or missing. On success set that row's publishedAt to now; stop at the first failure. Return {published, rows}, where published lists the published ids in order and rows is a new array, in the original order, with the updated rows. Do not change the inputs.",
    brief: {
      summary: 'Implement relayOutbox(rows, results, now, batchSize) and return {published, rows}.',
      rules: [
        'Take the unpublished rows (publishedAt null) in increasing id order, at most batchSize of them.',
        'Publish them one at a time: the n-th attempt succeeds when results[n - 1] is true, and fails when it is false or missing.',
        "On success set that row's publishedAt to now; stop at the first failure.",
        'Return {published, rows}: the published ids in order, and a new array of rows in the original order.',
      ],
      edgeCases: ['Rows after a failure are not attempted, even if a later result is true.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'relayOutbox([{id: 2, event: "placed", publishedAt: null}, {id: 1, event: "placed", publishedAt: null}], [true, false], 900, 10)',
      output: '{published: [1], rows: [{id: 2, event: "placed", publishedAt: null}, {id: 1, event: "placed", publishedAt: 900}]}',
    },
    note: 'ids are unique whole numbers; batchSize is at least 1; rows has at most 100 entries. A real relay that publishes an event and then fails to save publishedAt publishes it again on its next run, which is why consumers skip repeats. These are values passed to your function, not a live broker.',
    vocabulary: [
      { term: 'Outbox', meaning: 'a table where a service saves events in the same transaction as its data, to publish them afterwards' },
      { term: 'Relay', meaning: 'a process that reads saved events and passes them on to other services' },
    ],
    planPrompt:
      'Rows 3, 1, and 2 are unpublished and row 4 is published. With batchSize 2 and results [true, true, true], which rows are published, and in what order?',
    starter:
      'type Row = { id: number; event: string; publishedAt: number | null }\n\nfunction relayOutbox(rows: Row[], results: boolean[], now: number, batchSize: number) {\n  // Publish the oldest unpublished rows in order.\n  return { published: [] as number[], rows }\n}\n',
    functionName: 'relayOutbox',
    preserveInput: true,
    hints: [
      'Select the unpublished rows, sort a copy of them by id, and keep the first batchSize.',
      'Walk that list with a counter for the attempt number; a false or missing result ends the walk.',
      'Collect the published ids in a Set, then map the original rows, copying those with a new publishedAt.',
    ],
    checks: [
      {
        name: 'Publishes in id order and stops at a failure',
        input: [
          [
            { id: 2, event: 'placed', publishedAt: null },
            { id: 1, event: 'placed', publishedAt: null },
          ],
          [true, false],
          900,
          10,
        ],
        expected: {
          published: [1],
          rows: [
            { id: 2, event: 'placed', publishedAt: null },
            { id: 1, event: 'placed', publishedAt: 900 },
          ],
        },
      },
      {
        name: 'Publishes everything when every attempt succeeds',
        input: [
          [
            { id: 1, event: 'placed', publishedAt: null },
            { id: 2, event: 'paid', publishedAt: null },
          ],
          [true, true],
          5,
          10,
        ],
        expected: {
          published: [1, 2],
          rows: [
            { id: 1, event: 'placed', publishedAt: 5 },
            { id: 2, event: 'paid', publishedAt: 5 },
          ],
        },
      },
      {
        name: 'Does not try rows after a failure',
        input: [
          [
            { id: 1, event: 'placed', publishedAt: null },
            { id: 2, event: 'paid', publishedAt: null },
            { id: 3, event: 'shipped', publishedAt: null },
          ],
          [false, true, true],
          5,
          10,
        ],
        expected: {
          published: [],
          rows: [
            { id: 1, event: 'placed', publishedAt: null },
            { id: 2, event: 'paid', publishedAt: null },
            { id: 3, event: 'shipped', publishedAt: null },
          ],
        },
      },
      {
        name: 'Publishes at most batchSize rows',
        input: [
          [
            { id: 3, event: 'shipped', publishedAt: null },
            { id: 1, event: 'placed', publishedAt: null },
            { id: 2, event: 'paid', publishedAt: null },
          ],
          [true, true, true],
          7,
          2,
        ],
        expected: {
          published: [1, 2],
          rows: [
            { id: 3, event: 'shipped', publishedAt: null },
            { id: 1, event: 'placed', publishedAt: 7 },
            { id: 2, event: 'paid', publishedAt: 7 },
          ],
        },
      },
      {
        name: 'Skips rows that are already published',
        input: [
          [
            { id: 1, event: 'placed', publishedAt: 3 },
            { id: 2, event: 'paid', publishedAt: null },
          ],
          [true],
          9,
          1,
        ],
        expected: {
          published: [2],
          rows: [
            { id: 1, event: 'placed', publishedAt: 3 },
            { id: 2, event: 'paid', publishedAt: 9 },
          ],
        },
      },
      {
        name: 'Treats a missing result as a failure',
        input: [
          [
            { id: 1, event: 'placed', publishedAt: null },
            { id: 2, event: 'paid', publishedAt: null },
          ],
          [true],
          4,
          10,
        ],
        expected: {
          published: [1],
          rows: [
            { id: 1, event: 'placed', publishedAt: 4 },
            { id: 2, event: 'paid', publishedAt: null },
          ],
        },
      },
      {
        name: 'Sorts ids as numbers',
        input: [
          [
            { id: 10, event: 'paid', publishedAt: null },
            { id: 9, event: 'placed', publishedAt: null },
          ],
          [true, false],
          1,
          10,
        ],
        expected: {
          published: [9],
          rows: [
            { id: 10, event: 'paid', publishedAt: null },
            { id: 9, event: 'placed', publishedAt: 1 },
          ],
        },
      },
      { name: 'Handles an empty outbox', input: [[], [true], 1, 10], expected: { published: [], rows: [] } },
    ],
  },
  {
    id: 'backend-queue-simulation',
    title: 'Replay a job queue with retries',
    category: 'Backend services',
    format: 'backend',
    context:
      'Before changing a retry policy, a team replays a day of job outcomes through it to see which jobs finish, which end in the dead letters, and how long the queue takes to drain.',
    prompt:
      'Implement runQueue(jobIds, outcomes, policy). All jobs are queued at time 0 in the order of jobIds. One worker repeatedly runs the queued job with the smallest run time; ties go to the job that was queued earlier, and a retried job counts as queued when its retry is scheduled. The clock moves forward to a job\'s run time when that is later, and running takes no time. Attempt n of a job has the outcome outcomes[id][n - 1], or "ok" when that entry or the whole list is missing. "ok" completes the job. "permanent" moves it to the dead letters with reason "PERMANENT_ERROR". "retryable" moves it to the dead letters with reason "TOO_MANY_ATTEMPTS" once it has had policy.maxAttempts attempts, and otherwise queues it again for the current time plus the smaller of policy.maxDelayMs and policy.baseDelayMs times 2 to the power (attempts - 1). Return {completed, deadLetters, finishedAt}: the completed job IDs in completion order, the dead letters as {id, reason, attempts} in the order they were added, and the clock after the last attempt (0 when there are no jobs). Do not change the inputs.',
    brief: {
      summary: 'Implement runQueue(jobIds, outcomes, policy) and return {completed, deadLetters, finishedAt}.',
      rules: [
        'All jobs are queued at time 0 in the order of jobIds. One worker repeatedly runs the queued job with the smallest run time; ties go to the job queued earlier, and a retry counts as queued when it is scheduled.',
        "The clock moves forward to a job's run time when that is later, and running takes no time.",
        'Attempt n of a job has the outcome outcomes[id][n - 1], or "ok" when that entry or the whole list is missing.',
        '"ok" completes the job. "permanent" moves it to the dead letters with reason "PERMANENT_ERROR".',
        '"retryable" moves it to the dead letters with reason "TOO_MANY_ATTEMPTS" once it has had policy.maxAttempts attempts, and otherwise queues it again for the current time plus the smaller of policy.maxDelayMs and policy.baseDelayMs times 2 to the power (attempts - 1).',
        'Return the completed job IDs in completion order, the dead letters as {id, reason, attempts} in the order they were added, and finishedAt, the clock after the last attempt (0 when there are no jobs).',
      ],
      edgeCases: ['Do not change the inputs.'],
    },
    example: {
      input: 'runQueue(["a", "b"], {a: ["retryable", "ok"]}, {maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000})',
      output: '{completed: ["b", "a"], deadLetters: [], finishedAt: 100}',
    },
    note: 'Job IDs are unique non-empty text; each outcomes list has at most 10 entries; policy values are positive whole numbers. jobIds has at most 50 entries. These are values passed to your function, not a live queue or clock.',
    vocabulary: [
      { term: 'Job queue', meaning: 'a list of work waiting to run, taken in a set order by workers' },
      { term: 'Retry policy', meaning: 'the rules for how many times and how long after a failure a job runs again' },
    ],
    planPrompt:
      'Trace the example as a table with one row per attempt: the time, the job, its outcome, and what is queued afterwards. Why does b finish before a?',
    starter:
      'type Outcome = "ok" | "retryable" | "permanent"\ntype Policy = { maxAttempts: number; baseDelayMs: number; maxDelayMs: number }\n\nfunction runQueue(jobIds: string[], outcomes: Record<string, Outcome[]>, policy: Policy) {\n  // Keep a list of queued entries and run the earliest one until none are left.\n  return { completed: [] as string[], deadLetters: [] as { id: string; reason: string; attempts: number }[], finishedAt: 0 }\n}\n',
    functionName: 'runQueue',
    preserveInput: true,
    hints: [
      'Keep each queued entry as {id, runAt, attempts, order}, where order is a counter that grows each time something is queued.',
      'To choose the next entry, compare runAt first and order second; remove it from the list before running it.',
      'After a retryable failure, either add a dead letter or queue a new entry with the next order number and the backed-off run time.',
    ],
    checks: [
      {
        name: 'Runs other work while a retry waits',
        input: [['a', 'b'], { a: ['retryable', 'ok'] }, { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: ['b', 'a'], deadLetters: [], finishedAt: 100 },
      },
      {
        name: 'Runs jobs in queue order when all succeed',
        input: [['x', 'y', 'z'], {}, { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: ['x', 'y', 'z'], deadLetters: [], finishedAt: 0 },
      },
      {
        name: 'Gives up after the last attempt',
        input: [['a'], { a: ['retryable', 'retryable', 'retryable'] }, { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: [], deadLetters: [{ id: 'a', reason: 'TOO_MANY_ATTEMPTS', attempts: 3 }], finishedAt: 300 },
      },
      {
        name: 'Stops at once for a permanent error',
        input: [['a'], { a: ['permanent'] }, { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: [], deadLetters: [{ id: 'a', reason: 'PERMANENT_ERROR', attempts: 1 }], finishedAt: 0 },
      },
      {
        name: 'Waits for the earliest retry',
        input: [
          ['a', 'b'],
          { a: ['retryable', 'ok'], b: ['retryable', 'retryable', 'ok'] },
          { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 1000 },
        ],
        expected: { completed: ['a', 'b'], deadLetters: [], finishedAt: 300 },
      },
      {
        name: 'Breaks a time tie by the order jobs were queued',
        input: [['b', 'a'], { a: ['retryable', 'ok'], b: ['retryable', 'ok'] }, { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: ['b', 'a'], deadLetters: [], finishedAt: 100 },
      },
      {
        name: 'Caps a long wait',
        input: [['a'], { a: ['retryable', 'retryable', 'retryable', 'ok'] }, { maxAttempts: 5, baseDelayMs: 400, maxDelayMs: 1000 }],
        expected: { completed: ['a'], deadLetters: [], finishedAt: 2200 },
      },
      {
        name: 'Mixes completions and dead letters',
        input: [
          ['a', 'b', 'c'],
          { a: ['permanent'], b: ['retryable', 'ok'], c: ['ok'] },
          { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 },
        ],
        expected: { completed: ['c', 'b'], deadLetters: [{ id: 'a', reason: 'PERMANENT_ERROR', attempts: 1 }], finishedAt: 100 },
      },
      {
        name: 'Gives up after one attempt when only one is allowed',
        input: [['a'], { a: ['retryable'] }, { maxAttempts: 1, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: [], deadLetters: [{ id: 'a', reason: 'TOO_MANY_ATTEMPTS', attempts: 1 }], finishedAt: 0 },
      },
      {
        name: 'Treats a missing outcome as ok',
        input: [['a'], { a: [] }, { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: ['a'], deadLetters: [], finishedAt: 0 },
      },
      {
        name: 'Handles an empty queue',
        input: [[], {}, { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 }],
        expected: { completed: [], deadLetters: [], finishedAt: 0 },
      },
    ],
  },
  {
    id: 'backend-token-bucket',
    title: 'Refill a token bucket',
    category: 'Backend services',
    format: 'backend',
    context:
      'An API lets each caller send short bursts but limits the steady rate. A token bucket stores up to a set number of tokens, gains one at a fixed interval, and spends one per request. Instead of a timer, the bucket refills from the time that has passed whenever a request arrives.',
    prompt:
      'Implement takeToken(bucket, now, capacity, refillMs). bucket is {tokens, updatedAt}. First refill: added is the number of whole refillMs intervals from updatedAt to now, tokens becomes the smaller of capacity and bucket.tokens + added, and updatedAt becomes now if the bucket is now full, or else bucket.updatedAt + added × refillMs, so time toward the next token is kept. Then, with at least 1 token, return {allowed: true, bucket: {tokens: tokens - 1, updatedAt}, retryAfterMs: 0}. Otherwise return {allowed: false, bucket: {tokens, updatedAt}, retryAfterMs: updatedAt + refillMs - now}. Do not change the bucket you were given.',
    brief: {
      summary: 'Implement takeToken(bucket, now, capacity, refillMs) and return {allowed, bucket, retryAfterMs}.',
      rules: [
        'Refill first: added is the number of whole refillMs intervals from updatedAt to now, and tokens becomes the smaller of capacity and bucket.tokens + added.',
        'updatedAt becomes now if the bucket is now full, or else bucket.updatedAt + added × refillMs, so time toward the next token is kept.',
        'With at least 1 token, return {allowed: true, bucket: {tokens: tokens - 1, updatedAt}, retryAfterMs: 0}.',
        'Otherwise return {allowed: false, bucket: {tokens, updatedAt}, retryAfterMs: updatedAt + refillMs - now}.',
      ],
      edgeCases: ['A full bucket gains nothing, so its refill time starts again at now.', 'Do not change the bucket you were given.'],
    },
    example: {
      input: 'takeToken({tokens: 0, updatedAt: 0}, 1500, 3, 1000)',
      output: '{allowed: true, bucket: {tokens: 0, updatedAt: 1000}, retryAfterMs: 0}',
    },
    note: 'Times are whole milliseconds with now at or after updatedAt; capacity and refillMs are positive whole numbers, and bucket.tokens is between 0 and capacity. These are values passed to your function, not a live server or clock.',
    vocabulary: [
      {
        term: 'Token bucket',
        meaning: 'a limiter that holds up to a set number of tokens, adds one at a steady rate, and spends one per request',
      },
      { term: 'Burst', meaning: 'many requests arriving close together' },
    ],
    planPrompt:
      'An empty bucket was last refilled at 0, with capacity 3 and one token per 1000 ms. What does takeToken return at 999, 1500, and 10000, and what is updatedAt each time?',
    starter:
      'type Bucket = { tokens: number; updatedAt: number }\n\nfunction takeToken(bucket: Bucket, now: number, capacity: number, refillMs: number): { allowed: boolean; bucket: Bucket; retryAfterMs: number } {\n  // Refill from the time that passed, then try to spend a token.\n  return { allowed: false, bucket, retryAfterMs: 0 }\n}\n',
    functionName: 'takeToken',
    preserveInput: true,
    hints: [
      'Count whole intervals with Math.floor; a part of an interval adds no token yet.',
      'Move updatedAt forward by exactly the intervals you counted, not to now, unless the bucket is full.',
      'A refused request waits until the next whole interval after the new updatedAt.',
    ],
    checks: [
      {
        name: 'Keeps the time toward the next token',
        input: [{ tokens: 0, updatedAt: 0 }, 1500, 3, 1000],
        expected: { allowed: true, bucket: { tokens: 0, updatedAt: 1000 }, retryAfterMs: 0 },
      },
      {
        name: 'Spends a token from a full bucket',
        input: [{ tokens: 3, updatedAt: 0 }, 500, 3, 1000],
        expected: { allowed: true, bucket: { tokens: 2, updatedAt: 500 }, retryAfterMs: 0 },
      },
      {
        name: 'Refuses one millisecond before a token arrives',
        input: [{ tokens: 0, updatedAt: 0 }, 999, 3, 1000],
        expected: { allowed: false, bucket: { tokens: 0, updatedAt: 0 }, retryAfterMs: 1 },
      },
      {
        name: 'Adds a token exactly at the interval',
        input: [{ tokens: 0, updatedAt: 0 }, 1000, 3, 1000],
        expected: { allowed: true, bucket: { tokens: 0, updatedAt: 1000 }, retryAfterMs: 0 },
      },
      {
        name: 'Adds several tokens at once',
        input: [{ tokens: 0, updatedAt: 0 }, 2500, 5, 1000],
        expected: { allowed: true, bucket: { tokens: 1, updatedAt: 2000 }, retryAfterMs: 0 },
      },
      {
        name: 'Stops refilling at capacity',
        input: [{ tokens: 1, updatedAt: 0 }, 10000, 3, 1000],
        expected: { allowed: true, bucket: { tokens: 2, updatedAt: 10000 }, retryAfterMs: 0 },
      },
      {
        name: 'Starts the refill time again when the bucket fills exactly',
        input: [{ tokens: 2, updatedAt: 0 }, 1300, 3, 1000],
        expected: { allowed: true, bucket: { tokens: 2, updatedAt: 1300 }, retryAfterMs: 0 },
      },
      {
        name: 'Measures the wait from the last refill',
        input: [{ tokens: 0, updatedAt: 400 }, 900, 3, 1000],
        expected: { allowed: false, bucket: { tokens: 0, updatedAt: 400 }, retryAfterMs: 500 },
      },
      {
        name: 'Works with a capacity of one',
        input: [{ tokens: 0, updatedAt: 0 }, 1000, 1, 1000],
        expected: { allowed: true, bucket: { tokens: 0, updatedAt: 1000 }, retryAfterMs: 0 },
      },
    ],
  },
  {
    id: 'backend-sliding-log',
    title: 'Limit with a sliding window',
    category: 'Backend services',
    format: 'backend',
    context:
      'A fixed window lets a caller send a full allowance just before it resets and another just after. A sliding window counts the requests in the last stretch of time ending now, so the allowance holds over any period of that length.',
    prompt:
      "Implement slidingLimit(times, now, limit, windowMs). times holds the caller's earlier accepted request times. Count the times t with now - windowMs < t <= now. If the count is less than limit, return {allowed: true, remaining: limit - count - 1, retryAfterMs: 0}. Otherwise return {allowed: false, remaining: 0, retryAfterMs}, where retryAfterMs is how long until enough counted times have left the window for the count to drop below limit: sort the counted times from oldest, take the one at position count - limit (from 0), and return that time + windowMs - now. Do not change times.",
    brief: {
      summary: 'Implement slidingLimit(times, now, limit, windowMs) and return {allowed, remaining, retryAfterMs}.',
      rules: [
        'Count the earlier times t with now - windowMs < t <= now.',
        'If the count is less than limit, return {allowed: true, remaining: limit - count - 1, retryAfterMs: 0}.',
        'Otherwise return {allowed: false, remaining: 0, retryAfterMs}: sort the counted times from oldest, take the one at position count - limit (from 0), and return that time + windowMs - now.',
      ],
      edgeCases: [
        'A time exactly windowMs before now has left the window.',
        'Times may be in any order; times after now are ignored.',
        'Do not change times.',
      ],
    },
    example: { input: 'slidingLimit([1000, 1500], 1800, 3, 1000)', output: '{allowed: true, remaining: 0, retryAfterMs: 0}' },
    note: 'Times are whole milliseconds; limit and windowMs are positive whole numbers; times has at most 500 entries. The count can be above limit when the limit was lowered, which is why more than one time may need to leave. These are values passed to your function, not a live server or clock.',
    vocabulary: [
      { term: 'Sliding window', meaning: 'a span of time that always ends now, such as the last 60 seconds' },
      { term: 'Boundary burst', meaning: 'up to twice the allowance sent around the moment a fixed window resets' },
    ],
    planPrompt:
      'With limit 2 and windowMs 1000, a caller sent requests at 1900 and 1950. What does a request at 2050 get, and how would a fixed window that resets at 2000 answer instead?',
    starter:
      'function slidingLimit(times: number[], now: number, limit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterMs: number } {\n  // Count the times inside the window that ends now.\n  return { allowed: true, remaining: limit - 1, retryAfterMs: 0 }\n}\n',
    functionName: 'slidingLimit',
    preserveInput: true,
    hints: [
      'Filter the times into the window first; the left edge is excluded and now is included.',
      'When refused, the count must fall to limit - 1, so count - limit + 1 of the oldest times have to leave.',
      'Sort a copy of the counted times; the last of those that must leave is at index count - limit.',
    ],
    checks: [
      {
        name: 'Allows a request and reports what remains',
        input: [[1000, 1500], 1800, 3, 1000],
        expected: { allowed: true, remaining: 0, retryAfterMs: 0 },
      },
      {
        name: 'Allows the first request with no history',
        input: [[], 0, 2, 1000],
        expected: { allowed: true, remaining: 1, retryAfterMs: 0 },
      },
      {
        name: 'Drops a time exactly one window old',
        input: [[800], 1800, 1, 1000],
        expected: { allowed: true, remaining: 0, retryAfterMs: 0 },
      },
      {
        name: 'Counts a time just inside the window',
        input: [[801], 1800, 1, 1000],
        expected: { allowed: false, remaining: 0, retryAfterMs: 1 },
      },
      {
        name: 'Waits for the oldest time to leave',
        input: [[1200, 1300, 1500], 1600, 3, 1000],
        expected: { allowed: false, remaining: 0, retryAfterMs: 600 },
      },
      {
        name: 'Sorts times before choosing',
        input: [[1500, 1200, 1300], 1600, 3, 1000],
        expected: { allowed: false, remaining: 0, retryAfterMs: 600 },
      },
      {
        name: 'Waits for several times when the count is over the limit',
        input: [[1100, 1200, 1300, 1400], 1500, 2, 1000],
        expected: { allowed: false, remaining: 0, retryAfterMs: 800 },
      },
      {
        name: 'Counts requests across a fixed-window boundary',
        input: [[1900, 1950], 2050, 2, 1000],
        expected: { allowed: false, remaining: 0, retryAfterMs: 850 },
      },
      { name: 'Ignores times later than now', input: [[1900], 1500, 1, 1000], expected: { allowed: true, remaining: 0, retryAfterMs: 0 } },
    ],
  },
  {
    id: 'backend-limit-response',
    title: 'Answer 429 with Retry-After',
    category: 'Backend services',
    format: 'backend',
    context:
      'Once a limiter has decided, the API has to tell the caller. Well-behaved clients read the limit headers to slow down early, and when they are refused they wait for the number of seconds the server suggests.',
    prompt:
      'Implement limitResponse(decision, limit). decision has allowed, remaining, and retryAfterMs. Every response has the headers RateLimit-Limit, which is limit, and RateLimit-Remaining, which is decision.remaining when allowed (or 0 if that is negative) and 0 when refused; header values are text. An allowed request gets {status: 200, headers}. A refused one gets {status: 429, headers}, where headers also has Retry-After: retryAfterMs in whole seconds, rounded up, and at least 1. Do not change the inputs.',
    brief: {
      summary: 'Implement limitResponse(decision, limit) and return {status, headers}.',
      rules: [
        'Every response has RateLimit-Limit (limit) and RateLimit-Remaining: decision.remaining when allowed (or 0 if that is negative), and 0 when refused.',
        'An allowed request gets {status: 200, headers}.',
        'A refused one gets {status: 429, headers}, where headers also has Retry-After: retryAfterMs in whole seconds, rounded up, and at least 1.',
      ],
      edgeCases: ['Header values are text, such as "5".', 'Do not change the inputs.'],
    },
    example: {
      input: 'limitResponse({allowed: false, remaining: 0, retryAfterMs: 1200}, 10)',
      output: '{status: 429, headers: {"RateLimit-Limit": "10", "RateLimit-Remaining": "0", "Retry-After": "2"}}',
    },
    note: 'limit is a positive whole number; remaining and retryAfterMs are whole numbers. Header names are written exactly as shown. Several RateLimit header formats are in use; this contract uses these three. These are values passed to your function, not a live server.',
    vocabulary: [
      { term: 'Too Many Requests (429)', meaning: 'the response that says a caller has gone over its rate limit' },
      { term: 'Retry-After', meaning: 'a response header that says how many seconds to wait before trying again' },
    ],
    planPrompt: 'What Retry-After do waits of 1, 1000, 1001, and 0 milliseconds give? Why is rounding down a problem for the client?',
    starter:
      'type Decision = { allowed: boolean; remaining: number; retryAfterMs: number }\n\nfunction limitResponse(decision: Decision, limit: number): { status: number; headers: Record<string, string> } {\n  // Build the headers every response shares, then add Retry-After when refused.\n  return { status: 200, headers: {} }\n}\n',
    functionName: 'limitResponse',
    preserveInput: true,
    hints: [
      'Build the two shared headers first, turning numbers into text with String.',
      'Math.ceil turns milliseconds into whole seconds without sending the client back early.',
      'Math.max gives both lower bounds: 0 for remaining and 1 for Retry-After.',
    ],
    checks: [
      {
        name: 'Rounds the wait up to whole seconds',
        input: [{ allowed: false, remaining: 0, retryAfterMs: 1200 }, 10],
        expected: { status: 429, headers: { 'RateLimit-Limit': '10', 'RateLimit-Remaining': '0', 'Retry-After': '2' } },
      },
      {
        name: 'Reports what remains on an allowed request',
        input: [{ allowed: true, remaining: 4, retryAfterMs: 0 }, 5],
        expected: { status: 200, headers: { 'RateLimit-Limit': '5', 'RateLimit-Remaining': '4' } },
      },
      {
        name: 'Reports zero remaining on the last allowed request',
        input: [{ allowed: true, remaining: 0, retryAfterMs: 0 }, 5],
        expected: { status: 200, headers: { 'RateLimit-Limit': '5', 'RateLimit-Remaining': '0' } },
      },
      {
        name: 'Never reports a negative remainder',
        input: [{ allowed: true, remaining: -2, retryAfterMs: 0 }, 5],
        expected: { status: 200, headers: { 'RateLimit-Limit': '5', 'RateLimit-Remaining': '0' } },
      },
      {
        name: 'Rounds one millisecond up to one second',
        input: [{ allowed: false, remaining: 0, retryAfterMs: 1 }, 5],
        expected: { status: 429, headers: { 'RateLimit-Limit': '5', 'RateLimit-Remaining': '0', 'Retry-After': '1' } },
      },
      {
        name: 'Keeps an exact second',
        input: [{ allowed: false, remaining: 0, retryAfterMs: 1000 }, 5],
        expected: { status: 429, headers: { 'RateLimit-Limit': '5', 'RateLimit-Remaining': '0', 'Retry-After': '1' } },
      },
      {
        name: 'Rounds just past a second up',
        input: [{ allowed: false, remaining: 0, retryAfterMs: 1001 }, 5],
        expected: { status: 429, headers: { 'RateLimit-Limit': '5', 'RateLimit-Remaining': '0', 'Retry-After': '2' } },
      },
      {
        name: 'Asks for at least one second',
        input: [{ allowed: false, remaining: 0, retryAfterMs: 0 }, 5],
        expected: { status: 429, headers: { 'RateLimit-Limit': '5', 'RateLimit-Remaining': '0', 'Retry-After': '1' } },
      },
      {
        name: 'Reports zero remaining when refused',
        input: [{ allowed: false, remaining: 3, retryAfterMs: 59999 }, 60],
        expected: { status: 429, headers: { 'RateLimit-Limit': '60', 'RateLimit-Remaining': '0', 'Retry-After': '60' } },
      },
    ],
  },
  {
    id: 'backend-sliding-counter',
    title: 'Estimate a sliding window from two counts',
    category: 'Backend services',
    format: 'backend',
    context:
      'Keeping every request time for every caller costs memory. Many limiters keep only two numbers per caller, the counts for the current and previous fixed windows, and estimate the sliding window by counting the part of the previous window that still falls inside it.',
    prompt:
      'Implement slidingEstimate(previousCount, currentCount, now, windowMs, limit). Fixed windows start at 0, windowMs, 2 × windowMs, and so on, and start is Math.floor(now / windowMs) × windowMs. currentCount counts the accepted requests in the window that starts at start, and previousCount those in the window before it. The sliding window is the windowMs milliseconds ending at now, which still covers start + windowMs - now milliseconds of the previous window. Let used be currentCount plus previousCount × (start + windowMs - now) / windowMs, rounded down to a whole number. Return {allowed: used < limit, used}.',
    brief: {
      summary: 'Implement slidingEstimate(previousCount, currentCount, now, windowMs, limit) and return {allowed, used}.',
      rules: [
        'Fixed windows start at 0, windowMs, 2 × windowMs, and so on, and start is Math.floor(now / windowMs) × windowMs.',
        'The sliding window ending at now still covers start + windowMs - now milliseconds of the previous window.',
        'used is currentCount plus previousCount × (start + windowMs - now) / windowMs, rounded down to a whole number.',
        'Return {allowed: used < limit, used}.',
      ],
      edgeCases: ['At the exact start of a window the whole previous count still applies.', 'A used value equal to limit is refused.'],
    },
    example: { input: 'slidingEstimate(10, 3, 1250, 1000, 12)', output: '{allowed: true, used: 10}' },
    note: "All values are whole numbers; windowMs and limit are positive. The estimate assumes the previous window's requests were spread evenly; real traffic may not be. These are values passed to your function, not a live server or clock.",
    vocabulary: [
      { term: 'Window counter', meaning: 'a single count of requests kept for each fixed window' },
      { term: 'Weighted estimate', meaning: 'a count that includes only the share of an older count that still applies' },
    ],
    planPrompt: 'With windowMs 1000 and previousCount 10, how much of the previous count applies at now 2000, 2250, and 2999?',
    starter:
      'function slidingEstimate(previousCount: number, currentCount: number, now: number, windowMs: number, limit: number): { allowed: boolean; used: number } {\n  // Weight the previous count by how much of it the sliding window still covers.\n  return { allowed: currentCount < limit, used: currentCount }\n}\n',
    functionName: 'slidingEstimate',
    preserveInput: true,
    hints: [
      'Find where the current fixed window starts, then how many milliseconds of the previous window the last windowMs still reaches.',
      'Multiply before dividing, so whole-number inputs give an exact result before rounding down.',
      'Compare used with limit using <, so reaching the limit refuses the request.',
    ],
    checks: [
      { name: 'Weights the previous count', input: [10, 3, 1250, 1000, 12], expected: { allowed: true, used: 10 } },
      { name: 'Counts the whole previous window at the start', input: [10, 0, 2000, 1000, 10], expected: { allowed: false, used: 10 } },
      { name: 'Counts almost none of it at the end', input: [10, 4, 2999, 1000, 5], expected: { allowed: true, used: 4 } },
      { name: 'Rounds the estimate down', input: [3, 0, 1500, 1000, 2], expected: { allowed: true, used: 1 } },
      { name: 'Refuses when the estimate reaches the limit', input: [4, 3, 1500, 1000, 5], expected: { allowed: false, used: 5 } },
      { name: 'Allows one below the limit', input: [4, 2, 1500, 1000, 5], expected: { allowed: true, used: 4 } },
      {
        name: 'Uses the current count alone with no previous requests',
        input: [0, 7, 3400, 1000, 8],
        expected: { allowed: true, used: 7 },
      },
      { name: 'Keeps whole-number precision', input: [999, 0, 1667, 1000, 1000], expected: { allowed: true, used: 332 } },
      { name: 'Uses the supplied window size', input: [6, 1, 100, 60, 7], expected: { allowed: true, used: 3 } },
    ],
  },
  {
    id: 'backend-limit-callers',
    title: 'Limit many callers with token buckets',
    category: 'Backend services',
    format: 'backend',
    context:
      'An API gateway sees requests from many callers, each identified by an API key. Every key has its own token bucket, so a busy caller runs out of tokens without affecting anyone else.',
    prompt:
      "Implement limitRequests(requests, capacity, refillMs). requests is a list of {key, at} in order of time. Each key has its own bucket, which starts full, with capacity tokens and its refill time at the key's first request. For each request, refill that key's bucket: whole refillMs intervals since its refill time each add a token, up to capacity; the refill time moves forward by those whole intervals, or to the request time if the bucket is now full. Then spend a token if there is one and return {allowed: true, retryAfterMs: 0}; otherwise return {allowed: false, retryAfterMs}, the time until the bucket's next token. Return one result per request, in order. Do not change requests.",
    brief: {
      summary: 'Implement limitRequests(requests, capacity, refillMs) and return one {allowed, retryAfterMs} per request.',
      rules: [
        "Each key has its own bucket, which starts full, with capacity tokens and its refill time at the key's first request.",
        'Refill before each request: whole refillMs intervals since the refill time each add a token, up to capacity.',
        'The refill time moves forward by those whole intervals, or to the request time if the bucket is now full.',
        "Spend a token if there is one and return {allowed: true, retryAfterMs: 0}; otherwise return {allowed: false, retryAfterMs}, the time until the bucket's next token.",
      ],
      edgeCases: ['A refused request spends nothing.', 'Do not change requests.'],
    },
    example: {
      input: 'limitRequests([{key: "k1", at: 0}, {key: "k1", at: 0}, {key: "k2", at: 0}], 1, 1000)',
      output: '[{allowed: true, retryAfterMs: 0}, {allowed: false, retryAfterMs: 1000}, {allowed: true, retryAfterMs: 0}]',
    },
    note: 'Keys are non-empty text compared exactly; times are whole milliseconds that never decrease; capacity and refillMs are positive whole numbers. requests has at most 200 entries. These are values passed to your function, not a live gateway or clock.',
    vocabulary: [
      { term: 'Rate-limit key', meaning: 'the name a limiter counts requests under, such as an API key' },
      { term: 'Refill interval', meaning: 'how often a token bucket gains one token' },
    ],
    planPrompt:
      'With capacity 2 and one token per 1000 ms, key k1 sends requests at 0, 0, 1500, 1999, and 2000. Trace its tokens and refill time after each one.',
    starter:
      'type CallerRequest = { key: string; at: number }\n\nfunction limitRequests(requests: CallerRequest[], capacity: number, refillMs: number): { allowed: boolean; retryAfterMs: number }[] {\n  // Keep one bucket per key.\n  return requests.map(() => ({ allowed: true, retryAfterMs: 0 }))\n}\n',
    functionName: 'limitRequests',
    preserveInput: true,
    hints: [
      'Keep a Map from key to {tokens, refilledAt}; a key with no entry yet gets a full bucket at its first request time.',
      'Refill from the stored refill time, moving it by whole intervals so part of an interval is not lost.',
      'A refused request still saves the refilled bucket, but spends nothing.',
    ],
    checks: [
      {
        name: 'Gives each key its own bucket',
        input: [
          [
            { key: 'k1', at: 0 },
            { key: 'k1', at: 0 },
            { key: 'k2', at: 0 },
          ],
          1,
          1000,
        ],
        expected: [
          { allowed: true, retryAfterMs: 0 },
          { allowed: false, retryAfterMs: 1000 },
          { allowed: true, retryAfterMs: 0 },
        ],
      },
      {
        name: 'Allows a burst up to the capacity',
        input: [
          [
            { key: 'k1', at: 0 },
            { key: 'k1', at: 0 },
            { key: 'k1', at: 0 },
          ],
          2,
          1000,
        ],
        expected: [
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
          { allowed: false, retryAfterMs: 1000 },
        ],
      },
      {
        name: 'Keeps the time toward the next token across requests',
        input: [
          [
            { key: 'k1', at: 0 },
            { key: 'k1', at: 0 },
            { key: 'k1', at: 1500 },
            { key: 'k1', at: 1999 },
            { key: 'k1', at: 2000 },
          ],
          2,
          1000,
        ],
        expected: [
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
          { allowed: false, retryAfterMs: 1 },
          { allowed: true, retryAfterMs: 0 },
        ],
      },
      {
        name: 'Starts a new key full at its first request',
        input: [
          [
            { key: 'k1', at: 0 },
            { key: 'k2', at: 5000 },
            { key: 'k2', at: 5000 },
          ],
          2,
          1000,
        ],
        expected: [
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
        ],
      },
      {
        name: 'Refused requests spend nothing',
        input: [
          [
            { key: 'k1', at: 0 },
            { key: 'k1', at: 300 },
            { key: 'k1', at: 600 },
            { key: 'k1', at: 1000 },
          ],
          1,
          1000,
        ],
        expected: [
          { allowed: true, retryAfterMs: 0 },
          { allowed: false, retryAfterMs: 700 },
          { allowed: false, retryAfterMs: 400 },
          { allowed: true, retryAfterMs: 0 },
        ],
      },
      {
        name: 'Stops refilling at capacity after a long pause',
        input: [
          [
            { key: 'k1', at: 0 },
            { key: 'k1', at: 0 },
            { key: 'k1', at: 60000 },
            { key: 'k1', at: 60000 },
            { key: 'k1', at: 60000 },
          ],
          2,
          1000,
        ],
        expected: [
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
          { allowed: false, retryAfterMs: 1000 },
        ],
      },
      {
        name: 'Compares keys exactly',
        input: [
          [
            { key: 'k1', at: 0 },
            { key: 'K1', at: 0 },
          ],
          1,
          1000,
        ],
        expected: [
          { allowed: true, retryAfterMs: 0 },
          { allowed: true, retryAfterMs: 0 },
        ],
      },
      { name: 'Handles no requests', input: [[], 1, 1000], expected: [] },
    ],
  },
  {
    id: 'backend-choose-version',
    title: 'Choose a response version',
    category: 'Backend services',
    format: 'backend',
    context:
      'An API changed the shape of its responses, but apps built against the first shape are still in use. Each request may name the version it wants, in the path or in a header, and a request that names none gets the documented default, so existing clients keep working.',
    prompt:
      'Implement chooseVersion(path, headers, supported, fallback). path starts with "/". The path names a version when its first segment is a lowercase "v" followed by one or more digits, such as "/v2/orders"; the route path is then the rest of the path, or "/" if nothing is left. The header names a version when an Api-Version header (name in any letter case) has a value that is not empty after trimming; the version is that trimmed value. If both name a version and they differ, return {ok: false, status: 400, error: "VERSION_CONFLICT"}. Otherwise the version is the one named, or fallback when neither names one. If that version is not in supported, return {ok: false, status: 400, error: "UNKNOWN_VERSION"}. Otherwise return {ok: true, version, path}, where path is the route path. Do not change the inputs.',
    brief: {
      summary:
        'Implement chooseVersion(path, headers, supported, fallback) and return {ok: true, version, path} or {ok: false, status, error}.',
      rules: [
        'The path names a version when its first segment is a lowercase "v" followed by digits, as in "/v2/orders"; the route path is the rest, or "/" if nothing is left.',
        'The header names a version when Api-Version (name in any letter case) has a value that is not empty after trimming.',
        'If both name a version and they differ, return {ok: false, status: 400, error: "VERSION_CONFLICT"}.',
        'Otherwise use the named version, or fallback when neither names one. A version not in supported gives {ok: false, status: 400, error: "UNKNOWN_VERSION"}.',
        'Return {ok: true, version, path} with the route path.',
      ],
      edgeCases: [
        'A segment such as "v2x" or "V2" is not a version, so it stays in the route path.',
        'Check for a conflict before checking whether the version is supported.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input: 'chooseVersion("/v2/orders/7", [], ["v1", "v2"], "v1")',
      output: '{ok: true, version: "v2", path: "/orders/7"}',
    },
    note: 'Headers are [name, value] pairs, and Api-Version appears at most once. Versions are compared exactly, and fallback is always in supported. These are values passed to your function, not a live server.',
    vocabulary: [
      { term: 'API version', meaning: 'a name for one shape of an API, so a client can ask for the shape it was built against' },
      { term: 'Default version', meaning: 'the version a request gets when it does not name one' },
    ],
    planPrompt:
      'With supported ["v1", "v2"] and fallback "v1", what do "/v2", "/v2x/orders", and "/v3/orders" with an Api-Version header of "v2" each return?',
    starter:
      'type Header = [string, string]\n\nfunction chooseVersion(path: string, headers: Header[], supported: string[], fallback: string) {\n  // Read a version from the path and from the Api-Version header, then decide.\n  return { ok: true, version: fallback, path }\n}\n',
    functionName: 'chooseVersion',
    preserveInput: true,
    hints: [
      'The first segment is the text between the first and second "/". Test it with a pattern anchored at both ends.',
      'Find the header by comparing lowercased names, and treat a blank value as no header at all.',
      'Decide in order: a conflict, then the named or default version, then whether it is supported.',
    ],
    checks: [
      {
        name: 'Reads the version from the path',
        input: ['/v2/orders/7', [], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v2', path: '/orders/7' },
      },
      {
        name: 'Reads the version from a header',
        input: ['/orders', [['Api-Version', 'v2']], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v2', path: '/orders' },
      },
      {
        name: 'Uses the default when nothing names a version',
        input: ['/orders', [['Accept', 'application/json']], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v1', path: '/orders' },
      },
      {
        name: 'Uses the supplied default',
        input: ['/orders', [], ['v1', 'v2', 'v3'], 'v3'],
        expected: { ok: true, version: 'v3', path: '/orders' },
      },
      {
        name: 'Finds the header in any letter case and trims it',
        input: ['/orders', [['api-VERSION', ' v2 ']], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v2', path: '/orders' },
      },
      {
        name: 'Rejects an unknown version in the path',
        input: ['/v3/orders', [], ['v1', 'v2'], 'v1'],
        expected: { ok: false, status: 400, error: 'UNKNOWN_VERSION' },
      },
      {
        name: 'Rejects an unknown version in the header',
        input: ['/orders', [['Api-Version', '2']], ['v1', 'v2'], 'v1'],
        expected: { ok: false, status: 400, error: 'UNKNOWN_VERSION' },
      },
      {
        name: 'Accepts a path and header that agree',
        input: ['/v2/orders', [['Api-Version', 'v2']], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v2', path: '/orders' },
      },
      {
        name: 'Reports a conflict before an unknown version',
        input: ['/v3/orders', [['Api-Version', 'v2']], ['v1', 'v2'], 'v1'],
        expected: { ok: false, status: 400, error: 'VERSION_CONFLICT' },
      },
      {
        name: 'Leaves a lookalike segment in the path',
        input: ['/v2x/orders', [], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v1', path: '/v2x/orders' },
      },
      {
        name: 'Matches only a lowercase v',
        input: ['/V2/orders', [], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v1', path: '/V2/orders' },
      },
      {
        name: 'Reads a version with several digits',
        input: ['/v10/items', [], ['v9', 'v10'], 'v9'],
        expected: { ok: true, version: 'v10', path: '/items' },
      },
      { name: 'Routes a bare version to "/"', input: ['/v2', [], ['v1', 'v2'], 'v1'], expected: { ok: true, version: 'v2', path: '/' } },
      {
        name: 'Treats a blank header as no header',
        input: ['/v2/orders', [['Api-Version', '  ']], ['v1', 'v2'], 'v1'],
        expected: { ok: true, version: 'v2', path: '/orders' },
      },
    ],
  },
  {
    id: 'backend-classify-change',
    title: 'Spot a breaking change',
    category: 'Backend services',
    format: 'backend',
    context:
      'Apps built against an API keep running after the API changes, often for months. Before a change ships, the team compares the old and new field lists for a request or a response and asks, field by field, whether any existing client would stop working.',
    prompt:
      'Implement classifyChanges(direction, before, after). direction is "response" (the server sends it and clients read it) or "request" (clients send it and the server reads it). before and after map each field name to {type, required}; for a response, required means the field is always present. Compare every field that appears in either. For a response, a field that was removed, changed type, or went from required to not required is breaking; a field that was added, or went from not required to required, is compatible. For a request, a field that was added as required, changed type, or went from not required to required is breaking; a field that was added as not required, was removed, or went from required to not required is compatible. A field with any breaking difference is breaking. Return {breaking, compatible}, each a list of field names sorted with the default sort; unchanged fields appear in neither. Do not change the inputs.',
    brief: {
      summary: 'Implement classifyChanges(direction, before, after) and return {breaking, compatible}.',
      rules: [
        'Response (clients read it): removed, changed type, or required → not required is breaking; added, or not required → required, is compatible.',
        'Request (clients send it): added as required, changed type, or not required → required is breaking; added as not required, removed, or required → not required is compatible.',
        'A field with any breaking difference is breaking.',
        'Return both lists sorted with the default sort; unchanged fields appear in neither.',
      ],
      edgeCases: ['For a response, required means the field is always present.', 'Do not change the inputs.'],
    },
    example: {
      input:
        'classifyChanges("response", {id: {type: "string", required: true}, total: {type: "number", required: true}}, {id: {type: "string", required: true}, total: {type: "string", required: true}, currency: {type: "string", required: true}})',
      output: '{breaking: ["total"], compatible: ["currency"]}',
    },
    note: 'Field names are lowercase letters and underscores; types are names such as "string" or "number" compared exactly. Clients are assumed to ignore response fields they do not know, and the server to ignore request fields it does not read. These are values passed to your function, not a live API or real clients.',
    vocabulary: [
      { term: 'Breaking change', meaning: 'a change that makes a client written for the old API stop working' },
      { term: 'Compatible change', meaning: 'a change that existing clients can keep working through without being updated' },
    ],
    planPrompt:
      'Adding a required field is safe in one direction and breaking in the other. Which is which, and why does it depend on who reads the field?',
    starter:
      "type Field = { type: string; required: boolean }\n\nfunction classifyChanges(direction: 'request' | 'response', before: Record<string, Field>, after: Record<string, Field>) {\n  // Compare every field name from either side.\n  return { breaking: [] as string[], compatible: [] as string[] }\n}\n",
    functionName: 'classifyChanges',
    preserveInput: true,
    hints: [
      'Collect the field names from both objects without repeats, and sort them before you look at each one.',
      'Ask who reads the field: the side that reads it is the one a change can break.',
      'A field missing from before was added, one missing from after was removed, and one in both may differ in type or in required.',
    ],
    checks: [
      {
        name: 'Classifies the example',
        input: [
          'response',
          { id: { type: 'string', required: true }, total: { type: 'number', required: true } },
          {
            id: { type: 'string', required: true },
            total: { type: 'string', required: true },
            currency: { type: 'string', required: true },
          },
        ],
        expected: { breaking: ['total'], compatible: ['currency'] },
      },
      {
        name: 'A removed response field is breaking',
        input: [
          'response',
          { id: { type: 'string', required: true }, nickname: { type: 'string', required: false } },
          { id: { type: 'string', required: true } },
        ],
        expected: { breaking: ['nickname'], compatible: [] },
      },
      {
        name: 'An added response field is compatible',
        input: [
          'response',
          { id: { type: 'string', required: true } },
          { id: { type: 'string', required: true }, status: { type: 'string', required: true } },
        ],
        expected: { breaking: [], compatible: ['status'] },
      },
      {
        name: 'A response field that may now be missing is breaking',
        input: ['response', { email: { type: 'string', required: true } }, { email: { type: 'string', required: false } }],
        expected: { breaking: ['email'], compatible: [] },
      },
      {
        name: 'A response field that is now always present is compatible',
        input: ['response', { email: { type: 'string', required: false } }, { email: { type: 'string', required: true } }],
        expected: { breaking: [], compatible: ['email'] },
      },
      {
        name: 'A changed request type is breaking',
        input: ['request', { quantity: { type: 'number', required: true } }, { quantity: { type: 'string', required: true } }],
        expected: { breaking: ['quantity'], compatible: [] },
      },
      {
        name: 'A new required request field is breaking',
        input: [
          'request',
          { sku: { type: 'string', required: true } },
          { sku: { type: 'string', required: true }, warehouse: { type: 'string', required: true } },
        ],
        expected: { breaking: ['warehouse'], compatible: [] },
      },
      {
        name: 'A new optional request field is compatible',
        input: [
          'request',
          { sku: { type: 'string', required: true } },
          { sku: { type: 'string', required: true }, note: { type: 'string', required: false } },
        ],
        expected: { breaking: [], compatible: ['note'] },
      },
      {
        name: 'A removed request field is compatible',
        input: [
          'request',
          { sku: { type: 'string', required: true }, coupon: { type: 'string', required: true } },
          { sku: { type: 'string', required: true } },
        ],
        expected: { breaking: [], compatible: ['coupon'] },
      },
      {
        name: 'Required changes break requests in the other direction',
        input: [
          'request',
          { gift: { type: 'boolean', required: false }, sku: { type: 'string', required: true } },
          { gift: { type: 'boolean', required: true }, sku: { type: 'string', required: false } },
        ],
        expected: { breaking: ['gift'], compatible: ['sku'] },
      },
      {
        name: 'A type change outweighs a compatible change',
        input: ['response', { rating: { type: 'number', required: false } }, { rating: { type: 'string', required: true } }],
        expected: { breaking: ['rating'], compatible: [] },
      },
      {
        name: 'Sorts names and leaves unchanged fields out',
        input: [
          'response',
          { zone: { type: 'string', required: true }, id: { type: 'string', required: true }, city: { type: 'string', required: true } },
          {
            id: { type: 'string', required: true },
            city: { type: 'string', required: true },
            region: { type: 'string', required: true },
            area: { type: 'string', required: true },
          },
        ],
        expected: { breaking: ['zone'], compatible: ['area', 'region'] },
      },
      {
        name: 'Reports nothing for identical fields',
        input: ['request', { sku: { type: 'string', required: true } }, { sku: { type: 'string', required: true } }],
        expected: { breaking: [], compatible: [] },
      },
    ],
  },
  {
    id: 'backend-deprecation-headers',
    title: 'Announce a deprecation and a sunset',
    category: 'Backend services',
    format: 'backend',
    context:
      'An old endpoint is being retired. From its deprecation date every response warns clients and names the replacement, and from its sunset date the endpoint stops answering with data. Announcing both dates early gives client teams time to move.',
    prompt:
      'Implement deprecationResponse(policy, now). policy is {deprecatedAt, sunsetAt, successor}; deprecatedAt, sunsetAt, and now are ISO 8601 times with a "Z" or a ±HH:MM offset. Compare them as instants. Before deprecatedAt, return {status: 200, headers: {}}. From deprecatedAt until just before sunsetAt, return {status: 200, headers} with three headers: Deprecation is "@" followed by deprecatedAt in whole seconds since 1970-01-01T00:00:00Z; Sunset is sunsetAt as an HTTP date in GMT, such as "Tue, 01 Sep 2026 00:00:00 GMT"; and Link is the successor in angle brackets followed by ; rel="successor-version", such as </v2/orders>; rel="successor-version". From sunsetAt on, return {status: 410, headers} with only the Link header. Do not change the inputs.',
    brief: {
      summary: 'Implement deprecationResponse(policy, now) and return {status, headers}.',
      rules: [
        'Compare deprecatedAt, sunsetAt, and now as instants; they are ISO 8601 times with "Z" or a ±HH:MM offset.',
        'Before deprecatedAt: {status: 200, headers: {}}.',
        'From deprecatedAt until just before sunsetAt: status 200 with Deprecation ("@" and deprecatedAt in whole seconds since 1970-01-01T00:00:00Z), Sunset (sunsetAt as an HTTP date in GMT, such as "Tue, 01 Sep 2026 00:00:00 GMT"), and Link.',
        'Link is the successor in angle brackets followed by ; rel="successor-version", such as </v2/orders>; rel="successor-version".',
        'From sunsetAt on: {status: 410, headers} with only Link.',
      ],
      edgeCases: [
        'The deprecation date and the sunset date each start their period.',
        'A time with an offset still gives a Sunset date in GMT.',
        'Do not change the inputs.',
      ],
    },
    example: {
      input:
        'deprecationResponse({deprecatedAt: "2026-03-01T00:00:00Z", sunsetAt: "2026-09-01T00:00:00Z", successor: "/v2/orders"}, "2026-05-10T08:00:00Z")',
      output:
        "{status: 200, headers: {Deprecation: '@1772323200', Sunset: 'Tue, 01 Sep 2026 00:00:00 GMT', Link: '</v2/orders>; rel=\"successor-version\"'}}",
    },
    note: 'Times are whole seconds, and sunsetAt is after deprecatedAt. The HTTP date format is the one Date.prototype.toUTCString produces. now is passed in, so your function never reads a clock; these are values passed to your function, not a live server.',
    vocabulary: [
      { term: 'Deprecation', meaning: 'a notice that something still works but will be removed, so clients should move away from it' },
      { term: 'Sunset', meaning: 'the date after which a deprecated endpoint stops working' },
    ],
    planPrompt:
      'For a deprecation at 2026-03-01T00:00:00Z and a sunset at 2026-09-01T00:00:00Z, what should requests at 2026-02-28T23:59:59Z, at exactly the deprecation, and at exactly the sunset get?',
    starter:
      'type Policy = { deprecatedAt: string; sunsetAt: string; successor: string }\n\nfunction deprecationResponse(policy: Policy, now: string): { status: number; headers: Record<string, string> } {\n  // Turn the three times into instants, then pick the period now falls in.\n  return { status: 200, headers: {} }\n}\n',
    functionName: 'deprecationResponse',
    preserveInput: true,
    hints: [
      'Date.parse turns each ISO time into milliseconds since 1970, which compares correctly whatever offset the text used.',
      'Comparing the text itself goes wrong as soon as two times use different offsets.',
      'Divide milliseconds by 1000 for the Deprecation value, and build Sunset from a Date made from those milliseconds.',
    ],
    checks: [
      {
        name: 'Announces the deprecation in the example',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v2/orders' },
          '2026-05-10T08:00:00Z',
        ],
        expected: {
          status: 200,
          headers: { Deprecation: '@1772323200', Sunset: 'Tue, 01 Sep 2026 00:00:00 GMT', Link: '</v2/orders>; rel="successor-version"' },
        },
      },
      {
        name: 'Sends no headers before the deprecation',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v2/orders' },
          '2026-02-28T23:59:59Z',
        ],
        expected: { status: 200, headers: {} },
      },
      {
        name: 'Starts warning at the exact deprecation time',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v2/orders' },
          '2026-03-01T00:00:00Z',
        ],
        expected: {
          status: 200,
          headers: { Deprecation: '@1772323200', Sunset: 'Tue, 01 Sep 2026 00:00:00 GMT', Link: '</v2/orders>; rel="successor-version"' },
        },
      },
      {
        name: 'Still answers one second before the sunset',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v2/orders' },
          '2026-08-31T23:59:59Z',
        ],
        expected: {
          status: 200,
          headers: { Deprecation: '@1772323200', Sunset: 'Tue, 01 Sep 2026 00:00:00 GMT', Link: '</v2/orders>; rel="successor-version"' },
        },
      },
      {
        name: 'Answers 410 Gone from the exact sunset time',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v2/orders' },
          '2026-09-01T00:00:00Z',
        ],
        expected: { status: 410, headers: { Link: '</v2/orders>; rel="successor-version"' } },
      },
      {
        name: 'Keeps answering 410 after the sunset',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v2/orders' },
          '2027-01-15T09:00:00Z',
        ],
        expected: { status: 410, headers: { Link: '</v2/orders>; rel="successor-version"' } },
      },
      {
        name: 'Uses the time of day, not only the date',
        input: [
          { deprecatedAt: '2026-03-01T12:30:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v2/orders' },
          '2026-03-01T12:29:59Z',
        ],
        expected: { status: 200, headers: {} },
      },
      {
        name: 'Writes Deprecation for a time within a day',
        input: [{ deprecatedAt: '2026-03-01T12:30:00Z', sunsetAt: '2026-09-01T00:00:00Z', successor: '/v3/items' }, '2026-03-01T12:30:00Z'],
        expected: {
          status: 200,
          headers: { Deprecation: '@1772368200', Sunset: 'Tue, 01 Sep 2026 00:00:00 GMT', Link: '</v3/items>; rel="successor-version"' },
        },
      },
      {
        name: 'Compares times with different offsets as instants',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-06-01T07:00:00+07:00', successor: '/v2/orders' },
          '2026-05-31T23:30:00Z',
        ],
        expected: {
          status: 200,
          headers: { Deprecation: '@1772323200', Sunset: 'Mon, 01 Jun 2026 00:00:00 GMT', Link: '</v2/orders>; rel="successor-version"' },
        },
      },
      {
        name: 'Reaches a sunset given with an offset',
        input: [
          { deprecatedAt: '2026-03-01T00:00:00Z', sunsetAt: '2026-06-01T07:00:00+07:00', successor: '/v2/orders' },
          '2026-06-01T00:00:00Z',
        ],
        expected: { status: 410, headers: { Link: '</v2/orders>; rel="successor-version"' } },
      },
    ],
  },
  {
    id: 'backend-webhook-deliveries',
    title: 'Apply webhook deliveries once and in order',
    category: 'Backend services',
    format: 'backend',
    context:
      'A payment provider tells your service about order changes by calling your webhook endpoint. It retries a delivery that was not acknowledged, so the same delivery can arrive twice, and deliveries can overtake each other, so an older change can arrive after a newer one. Each delivery carries its own ID and a sequence number that grows with each change to the same order.',
    prompt:
      'Implement applyDeliveries(deliveries). Each delivery is {deliveryId, resource, sequence, status}, in arrival order. Process them in order. A delivery whose deliveryId arrived earlier in the list is skipped with reason "DUPLICATE". Otherwise, if its sequence is not greater than the last sequence applied for the same resource, it is skipped with reason "STALE". Otherwise apply it: the resource\'s status becomes the delivery\'s status and its last applied sequence becomes this sequence. Return {state, applied, skipped}: state maps each resource to its applied status, applied lists the applied delivery IDs in order, and skipped lists {deliveryId, reason} in order. Do not change deliveries.',
    brief: {
      summary: 'Implement applyDeliveries(deliveries) and return {state, applied, skipped}.',
      rules: [
        'Process deliveries in arrival order.',
        'A deliveryId that arrived earlier in the list is skipped as "DUPLICATE", whether the earlier one was applied or skipped.',
        'Otherwise, a sequence not greater than the last one applied for the same resource is skipped as "STALE".',
        "Otherwise apply it: set the resource's status and remember its sequence.",
        'Return {state, applied, skipped}, with applied and skipped in processing order.',
      ],
      edgeCases: ['Sequences are counted separately for each resource.', 'Do not change deliveries.'],
    },
    example: {
      input:
        'applyDeliveries([{deliveryId: "d1", resource: "order-7", sequence: 1, status: "paid"}, {deliveryId: "d1", resource: "order-7", sequence: 1, status: "paid"}])',
      output: '{state: {"order-7": "paid"}, applied: ["d1"], skipped: [{deliveryId: "d1", reason: "DUPLICATE"}]}',
    },
    note: 'deliveryId and resource are non-empty text compared exactly; sequence is a positive whole number; there are at most 500 deliveries. Verifying who sent a delivery is a separate step that this rep leaves out. These are values passed to your function, not a live webhook endpoint.',
    vocabulary: [
      { term: 'Webhook', meaning: 'a request another service sends to your endpoint to tell you something changed' },
      { term: 'Delivery ID', meaning: 'an ID that stays the same each time the sender retries the same delivery' },
      { term: 'Sequence number', meaning: 'a number that grows with each change, so a receiver can tell older changes from newer ones' },
    ],
    planPrompt:
      'Order 7 receives sequence 1 (paid), then sequence 3 (shipped), then sequence 2 (packed), then sequence 3 again under its first delivery ID. What is applied, what is skipped, and why?',
    starter:
      'type Delivery = { deliveryId: string; resource: string; sequence: number; status: string }\n\nfunction applyDeliveries(deliveries: Delivery[]) {\n  // Remember which deliveries arrived and the last sequence applied per resource.\n  return { state: {} as Record<string, string>, applied: [] as string[], skipped: [] as { deliveryId: string; reason: string }[] }\n}\n',
    functionName: 'applyDeliveries',
    preserveInput: true,
    hints: [
      'Keep a Set of delivery IDs you have seen and a Map from resource to its last applied sequence.',
      'Check for a repeated delivery ID first, and record every ID you see, applied or not.',
      'A resource with no applied sequence yet accepts any positive sequence.',
    ],
    checks: [
      {
        name: 'Skips the repeated delivery in the example',
        input: [
          [
            { deliveryId: 'd1', resource: 'order-7', sequence: 1, status: 'paid' },
            { deliveryId: 'd1', resource: 'order-7', sequence: 1, status: 'paid' },
          ],
        ],
        expected: { state: { 'order-7': 'paid' }, applied: ['d1'], skipped: [{ deliveryId: 'd1', reason: 'DUPLICATE' }] },
      },
      {
        name: 'Applies new changes in order',
        input: [
          [
            { deliveryId: 'd1', resource: 'order-7', sequence: 1, status: 'paid' },
            { deliveryId: 'd2', resource: 'order-7', sequence: 2, status: 'packed' },
            { deliveryId: 'd3', resource: 'order-7', sequence: 3, status: 'shipped' },
          ],
        ],
        expected: { state: { 'order-7': 'shipped' }, applied: ['d1', 'd2', 'd3'], skipped: [] },
      },
      {
        name: 'Skips an older change that arrives late',
        input: [
          [
            { deliveryId: 'd1', resource: 'order-7', sequence: 1, status: 'paid' },
            { deliveryId: 'd3', resource: 'order-7', sequence: 3, status: 'shipped' },
            { deliveryId: 'd2', resource: 'order-7', sequence: 2, status: 'packed' },
          ],
        ],
        expected: { state: { 'order-7': 'shipped' }, applied: ['d1', 'd3'], skipped: [{ deliveryId: 'd2', reason: 'STALE' }] },
      },
      {
        name: 'Skips a new delivery of a sequence already applied',
        input: [
          [
            { deliveryId: 'd1', resource: 'order-7', sequence: 4, status: 'paid' },
            { deliveryId: 'd9', resource: 'order-7', sequence: 4, status: 'refunded' },
          ],
        ],
        expected: { state: { 'order-7': 'paid' }, applied: ['d1'], skipped: [{ deliveryId: 'd9', reason: 'STALE' }] },
      },
      {
        name: 'Keeps sequences separate for each resource',
        input: [
          [
            { deliveryId: 'a5', resource: 'order-1', sequence: 5, status: 'shipped' },
            { deliveryId: 'b2', resource: 'order-2', sequence: 2, status: 'paid' },
            { deliveryId: 'a4', resource: 'order-1', sequence: 4, status: 'packed' },
          ],
        ],
        expected: {
          state: { 'order-1': 'shipped', 'order-2': 'paid' },
          applied: ['a5', 'b2'],
          skipped: [{ deliveryId: 'a4', reason: 'STALE' }],
        },
      },
      {
        name: 'Accepts any first sequence for a resource',
        input: [[{ deliveryId: 'd7', resource: 'order-3', sequence: 7, status: 'packed' }]],
        expected: { state: { 'order-3': 'packed' }, applied: ['d7'], skipped: [] },
      },
      {
        name: 'Calls a repeat of a skipped delivery a duplicate',
        input: [
          [
            { deliveryId: 'd2', resource: 'order-7', sequence: 2, status: 'packed' },
            { deliveryId: 'd1', resource: 'order-7', sequence: 1, status: 'paid' },
            { deliveryId: 'd1', resource: 'order-7', sequence: 1, status: 'paid' },
          ],
        ],
        expected: {
          state: { 'order-7': 'packed' },
          applied: ['d2'],
          skipped: [
            { deliveryId: 'd1', reason: 'STALE' },
            { deliveryId: 'd1', reason: 'DUPLICATE' },
          ],
        },
      },
      {
        name: 'Compares delivery IDs exactly',
        input: [
          [
            { deliveryId: 'd1', resource: 'order-7', sequence: 1, status: 'paid' },
            { deliveryId: 'D1', resource: 'order-7', sequence: 2, status: 'packed' },
          ],
        ],
        expected: { state: { 'order-7': 'packed' }, applied: ['d1', 'D1'], skipped: [] },
      },
      { name: 'Handles no deliveries', input: [[]], expected: { state: {}, applied: [], skipped: [] } },
    ],
  },
  {
    id: 'backend-verify-signature',
    title: 'Check that a webhook came from its sender',
    category: 'Backend services',
    format: 'backend',
    context:
      'Anyone who knows your webhook address can send it a request, so a provider signs each delivery. It shares a signing secret with you once, then sends a header holding the time it signed and an HMAC of that time and the raw body. Your receiver computes the same HMAC and acts only on a delivery whose signature matches and whose time is recent.',
    prompt:
      'Implement the async function verifyWebhook(secret, header, body, now). header is the signature header text, or null when it is missing. It is a comma-separated list of key=value pieces, with spaces around a piece ignored: one t piece holds the signing time in whole seconds (digits only), and one or more v1 pieces hold signatures; other keys are ignored. If the header is null, has no t, has more than one t, has a t that is not all digits, or has no v1, return {ok: false, reason: "malformed"}. Otherwise, if now and t differ by more than 300 seconds in either direction, return {ok: false, reason: "stale"}. Otherwise compute the HMAC-SHA256 of the text t + "." + body with secret as the key, written as lowercase hex, using the hmacHex helper in the starter. Return {ok: true} if any v1 equals it, comparing with a function that takes the same time wherever two strings first differ; otherwise return {ok: false, reason: "mismatch"}.',
    brief: {
      summary: 'Implement async verifyWebhook(secret, header, body, now) and return {ok: true} or {ok: false, reason}.',
      rules: [
        'Split the header at commas and trim each piece; read t (exactly one, digits only) and every v1, and ignore other keys.',
        'A missing header, a missing or repeated t, a t that is not all digits, or no v1 gives {ok: false, reason: "malformed"}.',
        'If now and t differ by more than 300 seconds, either way, return {ok: false, reason: "stale"}.',
        'Sign t + "." + body with the secret using hmacHex (HMAC-SHA256 as lowercase hex). Return {ok: true} if any v1 equals the result, else {ok: false, reason: "mismatch"}.',
        'Compare signatures with a function whose time does not depend on where two strings first differ.',
      ],
      edgeCases: [
        'Exactly 300 seconds apart is still recent.',
        'The body is checked exactly as received: a re-formatted copy of the same JSON does not match.',
        'Signatures are lowercase hex; an uppercase copy does not match.',
      ],
    },
    example: {
      input:
        'await verifyWebhook("sample-secret-1", "t=1760000000,v1=b25e066a…a47c8a", \'{"event":"order.paid","order":"o-7"}\', 1760000100)',
      output: '{ok: true}',
    },
    note: 'The secret and signatures are sample values. hmacHex uses the Web Crypto API that browsers and Node provide. The checks call your function directly with header text, not a live webhook request, and they cannot measure timing: whether your comparison takes the same time wherever strings differ is self-reviewed.',
    vocabulary: [
      { term: 'HMAC', meaning: 'a code computed from a message and a secret key; only someone with the key can produce the same code' },
      { term: 'Signing secret', meaning: 'the value a sender and receiver both keep, used to sign and check deliveries' },
      { term: 'Timestamp tolerance', meaning: 'how far a signed time may be from now before a delivery is refused as old' },
      { term: 'Constant-time comparison', meaning: 'comparing two values in a way that takes the same time wherever they first differ' },
    ],
    planPrompt:
      'A delivery was signed at t = 1000 and arrives with now = 1250, then again with now = 1301. Say what you check, in order, for each arrival, and which answer each one gets if the signature is correct.',
    starter:
      "type Verdict = { ok: true } | { ok: false; reason: 'malformed' | 'stale' | 'mismatch' }\n\nasync function hmacHex(secret: string, text: string): Promise<string> {\n  const encoder = new TextEncoder()\n  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])\n  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(text))\n  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('')\n}\n\nasync function verifyWebhook(secret: string, header: string | null, body: string, now: number): Promise<Verdict> {\n  // Read t and v1 from the header, check the time, then compare signatures.\n  return { ok: false, reason: 'malformed' }\n}\n",
    functionName: 'verifyWebhook',
    hints: [
      'Parse the header completely before deciding anything: collect the t values and the v1 values, and stop with "malformed" if the shape is wrong.',
      'Check the time before computing the signature, and measure the gap both ways with Math.abs.',
      'Sign the time and the body together, then compare with a loop that visits every character and combines the differences, returning only at the end.',
    ],
    checks: [
      {
        name: 'Accepts a valid signature',
        input: [
          'sample-secret-1',
          't=1760000000,v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: true },
      },
      {
        name: 'Accepts any matching v1 while secrets are rotated',
        input: [
          'sample-secret-1',
          't=1760000000,v1=464875bdc17219580d7a2d32828b4c45455573f8c29eaf4f0945d9aa52b5c553,v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: true },
      },
      {
        name: 'Refuses a body changed after signing',
        input: [
          'sample-secret-1',
          't=1760000000,v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a',
          '{"event": "order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'mismatch' },
      },
      {
        name: 'Refuses a signature made with another secret',
        input: [
          'sample-secret-1',
          't=1760000000,v1=464875bdc17219580d7a2d32828b4c45455573f8c29eaf4f0945d9aa52b5c553',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'mismatch' },
      },
      {
        name: 'Signs the time together with the body',
        input: [
          'sample-secret-1',
          't=1760000000,v1=21e33ead4708f9762a81a4d7084ef309001a66ed5dbf1fc50e5c8042f94ac71d',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'mismatch' },
      },
      {
        name: 'Refuses a time changed after signing',
        input: [
          'sample-secret-1',
          't=1760000001,v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'mismatch' },
      },
      {
        name: 'Accepts a time exactly 300 seconds old',
        input: [
          'sample-secret-1',
          't=1759999700,v1=c719bfa0b4c114e2c428293603798fd473f8228092170e5138d6d81944418bdf',
          '{"event":"order.paid","order":"o-7"}',
          1760000000,
        ],
        expected: { ok: true },
      },
      {
        name: 'Refuses a time 301 seconds old',
        input: [
          'sample-secret-1',
          't=1759999699,v1=b518a428c2d055d58979d8827f0485ee76ac599d1b3a5d0693c0c73436e4b5ab',
          '{"event":"order.paid","order":"o-7"}',
          1760000000,
        ],
        expected: { ok: false, reason: 'stale' },
      },
      {
        name: 'Refuses a time 301 seconds ahead',
        input: [
          'sample-secret-1',
          't=1760000301,v1=b4efb4d7ac2252a2597c4941521986acaaac24b59c2c7ff78ddf39be1bdd7e3e',
          '{"event":"order.paid","order":"o-7"}',
          1760000000,
        ],
        expected: { ok: false, reason: 'stale' },
      },
      {
        name: 'Accepts a time 300 seconds ahead',
        input: [
          'sample-secret-1',
          't=1760000300,v1=be1c671be716990e65b3c3e8a4c0d65785573182ae27ef9789343e57b8c4eb22',
          '{"event":"order.paid","order":"o-7"}',
          1760000000,
        ],
        expected: { ok: true },
      },
      {
        name: 'Checks the time before the signature',
        input: [
          'sample-secret-1',
          't=1759999000,v1=464875bdc17219580d7a2d32828b4c45455573f8c29eaf4f0945d9aa52b5c553',
          '{"event":"order.paid","order":"o-7"}',
          1760000000,
        ],
        expected: { ok: false, reason: 'stale' },
      },
      {
        name: 'Reports a missing header as malformed',
        input: ['sample-secret-1', null, '{"event":"order.paid","order":"o-7"}', 1760000100],
        expected: { ok: false, reason: 'malformed' },
      },
      {
        name: 'Requires a time',
        input: [
          'sample-secret-1',
          'v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'malformed' },
      },
      {
        name: 'Requires a signature',
        input: ['sample-secret-1', 't=1760000000', '{"event":"order.paid","order":"o-7"}', 1760000100],
        expected: { ok: false, reason: 'malformed' },
      },
      {
        name: 'Refuses a time that is not a whole number',
        input: [
          'sample-secret-1',
          't=1760000000.5,v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'malformed' },
      },
      {
        name: 'Refuses two times',
        input: [
          'sample-secret-1',
          't=1760000000,t=1760000000,v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'malformed' },
      },
      {
        name: 'Ignores spaces and other keys',
        input: [
          'sample-secret-1',
          ' t=1760000000 , v0=abc , v1=b25e066ad291b0bcf8944a04e902ef4f4dbc167b20084d10b9218a6cfea47c8a ',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: true },
      },
      {
        name: 'Compares signatures as lowercase hex',
        input: [
          'sample-secret-1',
          't=1760000000,v1=B25E066AD291B0BCF8944A04E902EF4F4DBC167B20084D10B9218A6CFEA47C8A',
          '{"event":"order.paid","order":"o-7"}',
          1760000100,
        ],
        expected: { ok: false, reason: 'mismatch' },
      },
      {
        name: 'Signs an empty body',
        input: ['sample-secret-1', 't=1760000000,v1=9791c2211ebdca656130550c28dff418dde1d2610e4a2ef42a808df2ff0d52b7', '', 1760000100],
        expected: { ok: true },
      },
    ],
  },
  {
    id: 'backend-downgrade-response',
    title: 'Answer a client pinned to an older version',
    category: 'Backend services',
    format: 'backend',
    context:
      "Some APIs name each version by the date it was released and let every client stay on the version it was built against. The service builds each response in the newest shape, then undoes, one at a time, every change released after the client's version, so an old client still gets the shape it expects.",
    prompt:
      'Implement downgrade(body, pinned, changes). body is a response in the newest shape, an object of field names to values. pinned is the client\'s version and every change has a version; versions are dates written "YYYY-MM-DD". A change is {version, kind: "rename", from, to} (that version renamed field from to to), {version, kind: "add", field} (it added field), or {version, kind: "remove", field, value} (it removed field, which always held value). Undo every change whose version is later than pinned, newest first: undo a rename by moving the value of to back to from, only if to is present; undo an add by deleting field; undo a remove by setting field to value. Changes can be listed in any order, and no two share a version. Return the result as a new object. Do not change body or changes.',
    brief: {
      summary: 'Implement downgrade(body, pinned, changes) and return the response in the shape of the pinned version.',
      rules: [
        'A change is a rename {from, to}, an add {field}, or a remove {field, value}, each with a "YYYY-MM-DD" version.',
        'Undo every change whose version is later than pinned, newest first.',
        'Undo a rename by moving the value of to back to from, only if to is present; undo an add by deleting field; undo a remove by setting field to value.',
        'Return a new object.',
      ],
      edgeCases: [
        "A change released on the pinned date is part of the client's version, so it stays.",
        'Changes can be listed in any order.',
        'Do not change body or changes.',
      ],
    },
    example: {
      input: 'downgrade({id: 7, fullName: "Ada"}, "2024-01-01", [{version: "2024-06-01", kind: "rename", from: "name", to: "fullName"}])',
      output: '{id: 7, name: "Ada"}',
    },
    note: 'Field values are text, numbers, booleans, or null. No two changes share a version, and changes has at most 50 entries. These are values passed to your function, not a live API.',
    vocabulary: [
      { term: 'Pinned version', meaning: 'the API version a client was built against and keeps receiving' },
      { term: 'Version change', meaning: 'one recorded difference between an API version and the one before it' },
    ],
    planPrompt:
      'Which changes does a client pinned to a given date need undone, and in what order must you undo them when one change builds on another?',
    starter:
      "type Change =\n  | { version: string; kind: 'rename'; from: string; to: string }\n  | { version: string; kind: 'add'; field: string }\n  | { version: string; kind: 'remove'; field: string; value: unknown }\n\nfunction downgrade(body: Record<string, unknown>, pinned: string, changes: Change[]) {\n  // Return the response in the shape of the pinned version.\n  return body\n}\n",
    functionName: 'downgrade',
    preserveInput: true,
    hints: [
      'Dates written "YYYY-MM-DD" compare correctly as text.',
      'Work out which changes the client has not seen, and put them in the order you will undo them.',
      'Copy the body before changing anything.',
    ],
    checks: [
      {
        name: 'Undoes a rename for an older client',
        input: [{ id: 7, fullName: 'Ada' }, '2024-01-01', [{ version: '2024-06-01', kind: 'rename', from: 'name', to: 'fullName' }]],
        expected: { id: 7, name: 'Ada' },
      },
      {
        name: 'Keeps a change released on the pinned date',
        input: [{ id: 7, fullName: 'Ada' }, '2024-06-01', [{ version: '2024-06-01', kind: 'rename', from: 'name', to: 'fullName' }]],
        expected: { id: 7, fullName: 'Ada' },
      },
      {
        name: 'Removes a field added later',
        input: [{ id: 7, currency: 'EUR', total: 1200 }, '2024-12-31', [{ version: '2025-02-01', kind: 'add', field: 'currency' }]],
        expected: { id: 7, total: 1200 },
      },
      {
        name: 'Restores a removed field with its old value',
        input: [{ id: 7 }, '2024-12-31', [{ version: '2025-03-01', kind: 'remove', field: 'taxIncluded', value: false }]],
        expected: { id: 7, taxIncluded: false },
      },
      {
        name: 'Undoes the newest change first',
        input: [
          { id: 7, displayName: 'Ada' },
          '2023-12-31',
          [
            { version: '2024-06-01', kind: 'rename', from: 'name', to: 'fullName' },
            { version: '2025-01-15', kind: 'rename', from: 'fullName', to: 'displayName' },
          ],
        ],
        expected: { id: 7, name: 'Ada' },
      },
      {
        name: 'Handles changes listed newest first',
        input: [
          { id: 7, contact: 'ada@example.com' },
          '2023-12-31',
          [
            { version: '2025-05-01', kind: 'rename', from: 'email', to: 'contact' },
            { version: '2024-02-01', kind: 'add', field: 'email' },
          ],
        ],
        expected: { id: 7 },
      },
      {
        name: 'Undoes only the changes after the pinned date',
        input: [
          { id: 7, displayName: 'Ada', currency: 'EUR' },
          '2024-07-01',
          [
            { version: '2025-01-15', kind: 'rename', from: 'fullName', to: 'displayName' },
            { version: '2024-06-01', kind: 'rename', from: 'name', to: 'fullName' },
            { version: '2025-02-01', kind: 'add', field: 'currency' },
          ],
        ],
        expected: { id: 7, fullName: 'Ada' },
      },
      {
        name: 'Skips a rename whose field is missing',
        input: [{ id: 7 }, '2024-01-01', [{ version: '2024-06-01', kind: 'rename', from: 'name', to: 'fullName' }]],
        expected: { id: 7 },
      },
      {
        name: 'Returns the same fields when nothing is newer',
        input: [{ id: 7, total: 1200 }, '2026-01-01', []],
        expected: { id: 7, total: 1200 },
      },
    ],
  },
]
