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
]
