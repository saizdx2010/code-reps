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
  {
    id: 'concurrent-writes',
    title: 'Concurrent writes: lost updates and version checks',
    summary:
      'See how two writes based on the same read lose a change, and prevent it with version numbers, conditional requests, and compare-and-set.',
    prerequisites: ['databases'],
    objectives: [
      'Explain how read, modify, and write loses an update when two clients interleave.',
      'Refuse a stale write with a version number or an If-Match tag, and choose between 409, 412, and 428.',
      'Decide what a client does after a refusal: read again, combine the changes, and try again.',
    ],
    sections: [
      {
        title: 'How an update gets lost',
        body: 'Most edits are read, modify, write: load the record, change it in memory, save it. When two clients do this at the same time, both read version 3 and both save, and the second save replaces the first without anyone noticing. Every request succeeded, yet one change is gone, because the server stores whatever arrives last ("last write wins").',
      },
      {
        title: 'A version number makes a stale write visible',
        body: 'Store a version with each record and increase it on every accepted change. A client sends back the version it read, and the server accepts the write only if that is still the current version; otherwise it answers 409 Conflict with the current version. This is optimistic concurrency: nothing is locked while people work, and the rare collision is caught when they save. In SQL the check and the write are one statement, such as `UPDATE products SET price = ?, version = version + 1 WHERE id = ? AND version = ?`, and zero changed rows means a conflict.',
      },
      {
        title: 'HTTP spells it with ETags',
        body: 'A response can carry an ETag that names one version of a resource, and a client sends it back in an If-Match header. The server answers 412 Precondition Failed when the tag no longer matches, and can demand the header with 428 Precondition Required so that no client updates without saying what it saw. `If-Match: *` means "only if it exists". A weak tag, written `W/"v7"`, only promises that two versions are equivalent, so If-Match never accepts it.',
      },
      {
        title: 'After a refusal',
        body: 'A refused write is information, not a failure to hide. The client reads the record again, shows or combines the other change, and tries again with the new version; resending the same change with the new version just brings the lost update back. Some values avoid the read altogether: compare-and-set changes a value only if it still holds what you expect, and an increment done by the database itself (`count = count + 1`) cannot lose a concurrent increment.',
      },
    ],
    example:
      'stored at version 3: price 40\n\nA reads version 3, wants price 35\nB reads version 3, wants price 45\nA saves, expecting 3 → accepted, now version 4\nB saves, expecting 3 → 409 Conflict, current version 4\nB reads version 4, sees 35, saves expecting 4 → accepted, version 5',
    walkthrough: [
      'Both clients read version 3, so both plan changes from price 40.',
      'A saves first; the versions match, so the change is stored and the version becomes 4.',
      'B still expects version 3, so the server refuses with 409 and reports version 4.',
      'B reads again, sees price 35, decides its change still applies, and saves against version 4.',
    ],
    mistakes: [
      'Checking the version in one query and writing in another, so a write can slip in between.',
      'Comparing values instead of versions, so a change that was later undone looks like no change.',
      'Resending a refused change with the new version without looking at what changed.',
      'Accepting a weak ETag in If-Match, or treating a missing If-Match as permission.',
    ],
    questions: [
      q(
        'lost-update-stock-v1',
        'Two clients both read stock 10. One sells 2 and saves 8; the other sells 3 and saves 7. With no version check, what is stored?',
        '',
        ['5', '7', '8'],
        1,
        'Last write wins: the second save stores 7 and the first sale is lost. The correct stock is 5.',
      ),
      q(
        'stale-version-409-v1',
        'A record is at version 4. An update says it was based on version 3. What should the server do?',
        '',
        ['Apply it and move to version 5', 'Refuse it with 409 Conflict', 'Apply it without changing the version'],
        1,
        'Version 3 is out of date, so the update was made without seeing the latest change. Refusing lets the client read version 4 and decide again.',
      ),
      q(
        'if-match-required-428-v1',
        'An API requires If-Match on updates. A client sends PUT without it. Which status fits?',
        '',
        ['412 Precondition Failed', '428 Precondition Required', '409 Conflict'],
        1,
        '428 says the request must be conditional. 412 is for a condition that was sent but did not hold.',
      ),
      q(
        'blind-retry-v1',
        'A save is refused because the version changed. The client at once resends the same change with the new version. What goes wrong?',
        '',
        ['Nothing: that is the fix', 'It replaces the other change without anyone seeing it', 'The server refuses it again'],
        1,
        'Resending blindly with the new version brings the lost update back. Read the record again and decide how the two changes combine first.',
      ),
    ],
    repIds: ['backend-versioned-update', 'backend-if-match', 'backend-lost-updates', 'backend-compare-and-set', 'backend-replay-writes'],
    related: ['databases', 'optimistic-updates'],
  },
  {
    id: 'background-jobs',
    title: 'Background jobs: queues, retries, and dead letters',
    summary:
      'Move slow work out of the request, retry failures with growing waits, give up into a dead-letter list, and make handlers safe to run twice.',
    prerequisites: ['retries', 'idempotency'],
    objectives: [
      'Decide when work belongs in a background job and what the request returns meanwhile.',
      'Retry a failed job with exponential backoff up to a limit, and send permanent failures and exhausted jobs to a dead-letter list.',
      'Explain at-least-once delivery and make a handler safe when the same job or message arrives twice.',
    ],
    sections: [
      {
        title: 'Move slow work out of the request',
        body: 'Some work is too slow or too unreliable to finish while a client waits: sending email, building a report, calling another service. The request records a job and answers at once, often with 202 Accepted and a way to check progress, and a worker process runs the job later. The job table or queue is the hand-off between them, so a job survives a restart.',
      },
      {
        title: 'Retry with growing waits, then give up',
        body: 'Failures are temporary (a timeout, a busy service) or permanent (invalid data, a deleted record). Retry only temporary ones, waiting longer each time, such as 1, 2, 4, then 8 seconds up to a cap, so a struggling service has room to recover. After a set number of attempts, or at once for a permanent error, move the job to a dead-letter list, where a person can inspect it, fix the cause, and queue it again. A job that retries forever hides the problem and wastes work.',
      },
      {
        title: 'Leases make a stopped worker recoverable',
        body: 'A worker claims a job with a lease: it is "mine until 12:00:30". If the worker stops, the lease runs out and another worker claims the job. The cost is that a job can run twice: the first worker may have finished the work and stopped just before marking it done. Queues that work this way promise at-least-once delivery; exactly-once is something the handler has to build.',
      },
      {
        title: 'Make the handler safe to repeat',
        body: 'Give each job or message an ID and record which IDs have been applied, in the same transaction as the work where possible, so a repeat is recognized and skipped. Prefer effects that are naturally repeatable, such as "set status to shipped" rather than "add one shipment". The outbox pattern does the same for events: save the event with the data change, publish it afterwards in order, and let consumers skip events they have already seen.',
      },
    ],
    example:
      'policy: 4 attempts, base 1 s, cap 10 s\n\nattempt 1 at 0 s → timeout → retry at 1 s\nattempt 2 at 1 s → timeout → retry at 3 s\nattempt 3 at 3 s → timeout → retry at 7 s\nattempt 4 at 7 s → timeout → dead letter after 4 attempts',
    walkthrough: [
      'Attempt 1 fails with a temporary error, so the job waits the base delay of 1 second.',
      'Each later failure doubles the wait: 2 seconds, then 4.',
      'Attempt 4 is the last one the policy allows, so its failure sends the job to the dead letters.',
      'A permanent error at any attempt would have gone there at once.',
    ],
    mistakes: [
      'Retrying permanent errors, which only repeats the failure and delays the alert.',
      'Retrying at once without a wait, so every worker keeps calling a service that is already struggling.',
      'Assuming a job runs exactly once, so a repeat sends the email or adds the amount twice.',
      'Dropping failed jobs silently instead of keeping them where a person can see them.',
    ],
    questions: [
      q(
        'job-permanent-error-v1',
        'A job fails because the customer record it needs was deleted. What should the worker do?',
        '',
        ['Retry with backoff', 'Move it to the dead letters now', 'Retry at once'],
        1,
        'The error is permanent: no retry can bring the record back. A dead letter lets a person decide what to do.',
      ),
      q(
        'job-backoff-third-v1',
        'With a base wait of 2 seconds that doubles after each failure, how long does the worker wait after the third failure?',
        '',
        ['6 seconds', '8 seconds', '16 seconds'],
        1,
        'The waits are 2, 4, then 8 seconds: the base times 2 to the power (failures - 1).',
      ),
      q(
        'job-lease-expired-v1',
        'A worker takes a lease on a job and then stops. What happens when the lease runs out?',
        '',
        ['The job is lost', 'Another worker can claim and run it again', 'The job is marked done'],
        1,
        'An expired lease makes the job available again, which is how a stopped worker is recovered, and why a job can run more than once.',
      ),
      q(
        'job-at-least-once-v1',
        'A queue promises at-least-once delivery. What must a message handler assume?',
        '',
        ['Each message arrives exactly once', 'A message may arrive more than once', 'Messages may be skipped'],
        1,
        'At-least-once means no message is lost, but repeats happen. The handler must recognize and skip a message it has already applied.',
      ),
    ],
    repIds: ['backend-job-failure', 'backend-claim-job', 'backend-dedupe-deliveries', 'backend-outbox-relay', 'backend-queue-simulation'],
    related: ['retries', 'idempotency', 'concurrent-writes'],
  },
]
