import type { Skill } from './knowledge.ts'
import { q } from './knowledge-question.ts'

// Backend track lessons for the service stages. Checked questions keep their IDs and answer contracts once shipped.
export const backendSkills: Skill[] = [
  {
    id: 'http-request-anatomy',
    title: 'What a request is: method, target, headers, and body',
    summary: 'Read the parts of an HTTP request a server receives, and turn each one from raw text into a value you can check.',
    prerequisites: [],
    objectives: [
      'Name the parts of a request: method, target (path and query), headers, and body.',
      'Split a target at its first ?, then split and decode a query string in that order.',
      'Read headers without regard to letter case, and parse a body only when Content-Type says what it is.',
    ],
    sections: [
      {
        title: 'A request is text with a fixed shape',
        body: 'A client sends a request line, header lines, a blank line, and an optional body. The request line holds the method (GET, POST, PUT, PATCH, DELETE, and a few more), the target, and the protocol version, as in `GET /orders?status=open HTTP/1.1`. Server frameworks usually parse this text for you, but every value they hand over still started as text from someone else, so treat it as untrusted. In these reps a request arrives as a string or an already separated object and your function is called directly: there is no live server.',
      },
      {
        title: 'The target holds a path and a query',
        body: 'The target splits at its first `?`. Before it is the path, which names the resource; after it is the query, which carries options such as filters and pages. A query is a list of name=value pairs joined by `&`. Characters that would break that syntax are percent-encoded: `%20` is a space, `%26` is `&`, and in a query string `+` also means a space while `%2B` is a literal plus. Split first and decode last, or an encoded `&` would split a value in two. A name can repeat, as in `tag=a&tag=b`, so a query is a list, not a single map.',
      },
      {
        title: 'Headers are named lines, and names ignore case',
        body: 'Each header is a name and a value, as in `Content-Type: application/json`. Names compare without regard to letter case, so `Content-Type`, `content-type`, and `CONTENT-TYPE` are one header. Values keep their case, and the spaces around them are not part of the value. A header can be sent more than once; for most headers the copies combine, in arrival order, into one comma-separated value.',
      },
      {
        title: 'The body means what Content-Type says',
        body: 'A body is just bytes; the Content-Type header says how to read them. `application/json; charset=utf-8` has a media type, `application/json`, followed by parameters after `;`. Parse a body as JSON only when its media type says JSON, and answer what you cannot handle precisely: 415 Unsupported Media Type for a type you do not accept, 413 Content Too Large for a body over your limit, and 400 Bad Request for JSON that does not parse. GET and HEAD requests normally carry no body. A parsed body is still unchecked data: validating its fields comes next.',
      },
    ],
    example:
      'POST /orders?notify=email&tag=gift+wrap HTTP/1.1\nContent-Type: application/json; charset=utf-8\n\n{"sku":"A-7","quantity":2}',
    walkthrough: [
      'The method is POST and the target is /orders?notify=email&tag=gift+wrap.',
      'Split at the first ?: the path is /orders and the query is notify=email&tag=gift+wrap.',
      'Split the query at &, then each pair at its first =, then decode: tag is "gift wrap".',
      'Content-Type is found without regard to case; its media type before ; is application/json.',
      'Only then is the body parsed: sku "A-7" and quantity 2, which still need validating.',
    ],
    mistakes: [
      'Decoding the whole target before splitting, so an encoded & or = changes the structure.',
      'Looking up a header with one exact spelling, such as headers["Content-Type"].',
      'Parsing every body as JSON without checking Content-Type, or treating a parsed body as already valid.',
      'Keeping only the last value of a repeated query name without deciding that on purpose.',
    ],
    questions: [
      q(
        'first-question-mark-v1',
        'Which part of the target /search?q=a?b is the query?',
        '',
        ['q=a', 'q=a?b', 'a?b'],
        1,
        'The target splits at its first ?, so everything after it, including the second ?, belongs to the query.',
      ),
      q(
        'plus-means-space-v1',
        'In a query string, what does tag=red+wine decode to?',
        '',
        ['red+wine', 'red wine', 'redwine'],
        1,
        'In query strings + stands for a space. A client that means a literal plus sends %2B.',
      ),
      q(
        'header-name-case-v1',
        'A client sends content-type: application/json. A server looks up Content-Type. Should it find the header?',
        '',
        ['Yes: header names ignore letter case', 'No: the letter case differs', 'Only if the value is lowercase too'],
        0,
        'HTTP header names are case-insensitive, so every lookup must compare names without regard to case. Values keep their case.',
      ),
      q(
        'unsupported-json-415-v1',
        'An API accepts only JSON. A POST arrives with Content-Type: text/plain. Which status fits best?',
        '',
        ['400 Bad Request', '415 Unsupported Media Type', '413 Content Too Large'],
        1,
        '415 tells the client the server does not accept that kind of body, so it knows to change the Content-Type rather than the content.',
      ),
    ],
    repIds: ['backend-split-target', 'backend-decode-query', 'backend-request-line', 'backend-header-value', 'backend-read-json-body'],
    related: ['http', 'validation'],
  },
  {
    id: 'http-routing',
    title: 'Route a request: patterns, parameters, 404, and 405',
    summary: 'Match a request path against route patterns, read its path parameters, and answer precisely when no route fits.',
    prerequisites: ['http-request-anatomy'],
    objectives: [
      'Match a path against a pattern segment by segment and read its parameters.',
      'Choose between 404 Not Found and 405 Method Not Allowed, and list the allowed methods.',
      'Decide which route wins when several match, and build and clean paths so a value cannot change their structure.',
    ],
    sections: [
      {
        title: 'A route pairs a method and a pattern with a handler',
        body: 'A router holds a list of routes. Each has a method, a path pattern, and the handler to run. A pattern is a path whose segments are literal text, such as `orders`, or parameters, such as `:id`, that match any one non-empty segment and capture it. `GET /orders/:id` matches `/orders/42` and captures id "42"; it does not match `/orders` or `/orders/42/items`, because the number of segments differs. Path parameters arrive as text, so converting and validating them comes next, exactly as for query values.',
      },
      {
        title: '404 and 405 mean different things',
        body: 'When no route pattern matches the path, the resource does not exist: 404 Not Found. When a pattern matches but none of its routes accepts the method, the resource exists but not for that action: 405 Method Not Allowed, with an Allow header that lists the methods that would work. Many routers answer HEAD with the GET handler and send only the headers, so HEAD appears in Allow whenever GET does. The difference tells a client whether to fix the path or the method.',
      },
      {
        title: 'When several routes match',
        body: 'A path can match more than one pattern: `/orders/new` matches both `/orders/new` and `/orders/:id`. Some routers try routes in the order they were added and take the first match, so a literal route must come before a parameter route that would swallow it. Others rank matches by specificity, reading segments from the left: a literal beats a parameter, and a parameter beats a catch-all wildcard such as `/files/*`. Know which rule your router uses before you add a route.',
      },
      {
        title: 'Paths are cleaned and built, not glued together',
        body: 'On the way in, clean a path before matching it: drop empty and `.` segments, let `..` remove the segment before it, and reject a path that would climb above the root rather than quietly fixing it. On the way out, never build a path by gluing text together: a name of `a/b` becomes two segments, and `..` climbs a level. Encode each value with `encodeURIComponent`, which turns `/` into `%2F`, and refuse `.` and `..`, which encoding leaves unchanged.',
      },
    ],
    example:
      'GET    /orders      → list\nPOST   /orders      → create\nGET    /orders/:id  → show\nDELETE /orders/:id  → remove\n\nGET /orders/42   → 200 show, id "42"\nPUT /orders/42   → 405, Allow: DELETE, GET, HEAD\nGET /customers   → 404',
    walkthrough: [
      'GET /orders/42: /orders/:id matches with id "42", and its GET route answers.',
      'PUT /orders/42: the same pattern matches, but there is no PUT route, so the answer is 405.',
      'Allow lists DELETE and GET from the matching routes, plus HEAD because GET is there.',
      'GET /customers: no pattern has a customers segment, so the answer is 404.',
    ],
    mistakes: [
      'Answering 404 when the path exists but the method does not, which sends the client looking for the wrong fix.',
      'Adding /orders/:id before /orders/new in a first-match router, so "new" is read as an ID.',
      'Letting a trailing slash or an empty segment fill a parameter.',
      'Building paths from unencoded values, so "/" or ".." changes which resource the path names.',
    ],
    questions: [
      q(
        'route-404-405-v1',
        'Routes exist for GET and DELETE on /orders/:id. A client sends PATCH /orders/42. Which status fits?',
        '',
        ['404 Not Found', '405 Method Not Allowed', '400 Bad Request'],
        1,
        'The path matches a pattern, so the resource exists; only the method is not supported. 405 with Allow: DELETE, GET, HEAD tells the client what would work.',
      ),
      q(
        'route-segment-count-v1',
        'Does the pattern /orders/:id match the path /orders/42/items?',
        '',
        ['Yes, with id "42/items"', 'Yes, with id "42"', 'No: the segment counts differ'],
        2,
        'A parameter matches exactly one segment. /orders/42/items has one more segment than the pattern, so it needs its own route.',
      ),
      q(
        'route-first-match-v1',
        'A first-match router lists GET /orders/:id before GET /orders/new. What does GET /orders/new run?',
        '',
        ['The new-order form', 'show, with id "new"', 'Nothing: 404 Not Found'],
        1,
        'The first route that matches wins, and :id matches the segment "new". List the literal route first, or use a router that ranks literals above parameters.',
      ),
      q(
        'route-encode-slash-v1',
        'A link is built for /files/:name with name "a/b". Which path keeps the name in one segment?',
        '',
        ['/files/a/b', '/files/a%2Fb', '/files/a_b'],
        1,
        'encodeURIComponent turns / into %2F, so the value stays one segment instead of adding a level. Replacing characters, as in a_b, changes the name itself.',
      ),
    ],
    repIds: ['backend-match-route', 'backend-route-request', 'backend-normalize-path', 'backend-build-path', 'backend-route-specificity'],
    related: ['http-request-anatomy', 'http'],
  },
]
