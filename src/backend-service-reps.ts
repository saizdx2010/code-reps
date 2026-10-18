import type { Rep } from './rep-types.ts'

// Backend track service reps. Handlers are pure functions over request-shaped values: the checks call them
// directly, with no live server, sockets, or clock. Keep rep IDs and check names stable once shipped.

const jsonPadding = (length: number) => '{"a":1}' + ' '.repeat(length - 7)

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
]
