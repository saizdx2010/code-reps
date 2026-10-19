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
    id: 'http-authorization',
    title: 'Authorization: who may do what',
    summary:
      'Decide, on every request, whether this person may take this action on this record: a session that still counts, a role that grants the action, and an ownership check for the record itself.',
    prerequisites: ['http-routing'],
    objectives: [
      'Tell authentication from authorization, and choose between 401, 403, and 404 for a refusal.',
      'Decide whether a session still counts from its revocation, its age, and its last use.',
      "Check a role's permissions and a record's owner on the server for every request, including list endpoints.",
    ],
    sections: [
      {
        title: 'Two questions on every request',
        body: 'Authentication answers "who is this?": a sign-in creates a session, and each request carries its ID. Authorization answers "may they do this?": given who it is, the server decides whether this action on this record is allowed. A request with no valid session gets 401 Unauthorized, despite the name, because the server does not know who is asking. A known user who may not take the action gets 403 Forbidden.',
      },
      {
        title: 'A session stops counting',
        body: 'A session record is only useful while it still counts. It stops when the person signs out (the record is revoked), when it reaches an absolute lifetime measured from sign-in, and when it goes unused for longer than an idle timeout measured from its last use. Checking these on the server, against a time passed in rather than read from the clock, keeps the rule testable.',
      },
      {
        title: 'Roles grant actions, and nothing else does',
        body: 'A permission table lists what each role may do, such as viewer: notes:read and editor: notes:*. The safe default is to deny: an action is allowed only when some role the user holds grants it, and a role the table does not know grants nothing. A wildcard grant such as notes:* covers every verb on its own resource, and only that resource.',
      },
      {
        title: 'Check the record, not just the role',
        body: "Two members with the same role must still not reach each other's notes, so the server compares the record's owner with the user on every request that names a record, including a list. Answering 404 to someone who may not know a record exists keeps its existence private; 403 fits when they may see it but not change it, such as a note shared with them for reading. The browser can hide buttons, but only the server's check decides.",
      },
    ],
    example:
      'note n1: owner m1, shared with m2\n\nm1 edits n1   → 200 (owner)\nm2 reads n1   → 200 (shared for reading)\nm2 edits n1   → 403 (may see it, may not change it)\nm3 reads n1   → 404 (does not learn it exists)\nno session    → 401 (nobody to check)',
    walkthrough: [
      'Without a session there is no user to check, so the answer is 401 before anything else.',
      'm1 owns n1, so every action on it is allowed.',
      'm2 was given read access, so reading succeeds and editing is refused with 403.',
      'm3 has no connection to n1; answering 404 keeps the note looking like one that does not exist.',
    ],
    mistakes: [
      'Answering 403 when there is no session, or 401 when the user is known but not allowed.',
      'Checking only the role, so any member can open any note by changing the ID in the URL.',
      'Filtering a list in the browser, or reporting a total that counts notes the user cannot see.',
      'Treating a role that is missing from the permission table as allowed.',
    ],
    questions: [
      q(
        'authz-no-session-401-v1',
        'A request to delete a note arrives without any session. Which status fits?',
        '',
        ['401 Unauthorized', '403 Forbidden', '404 Not Found'],
        0,
        'Without a session the server does not know who is asking, so it cannot decide; 401 says to sign in first.',
      ),
      q(
        'authz-role-missing-v1',
        'A user\'s only role is "guest", and the permission table has no entry for guest. They ask to read notes. What should the server answer?',
        '',
        ['200, because no rule forbids it', '403, because nothing grants it', '401, because the role is unknown'],
        1,
        'Deny by default: an action is allowed only when a role grants it. The user is known, so the refusal is 403, not 401.',
      ),
      q(
        'authz-hide-existence-v1',
        'Member m3 asks for note n1, which belongs to m1 and is not shared with m3. Which answer keeps the note private?',
        '',
        ['403 Forbidden', '404 Not Found', '200 with an empty body'],
        1,
        '403 confirms that n1 exists. 404 gives the same answer as for a note that does not exist.',
      ),
      q(
        'authz-session-idle-v1',
        'A session was created 2 hours ago and last used 45 minutes ago. The idle timeout is 30 minutes and the absolute lifetime is 8 hours. Does it still count?',
        '',
        ['Yes, it is under 8 hours old', 'No, it has been idle too long', 'Yes, idle time only matters after 8 hours'],
        1,
        'Both limits apply. It is young enough, but 45 minutes without use is past the 30-minute idle timeout.',
      ),
    ],
    repIds: ['backend-session-state', 'backend-role-permission', 'backend-owner-access', 'backend-visible-notes', 'backend-loan-access'],
    related: ['http-routing', 'http'],
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
  {
    id: 'rate-limiting',
    title: 'Rate limits: windows and token buckets',
    summary:
      'Limit how often each caller may make requests, compare fixed windows, sliding windows, and token buckets, and answer 429 with a useful Retry-After.',
    prerequisites: ['http'],
    objectives: [
      'Explain what a rate limit protects and choose a key, such as an API key, to count each caller separately.',
      'Compare fixed windows, sliding windows, and token buckets, including bursts at window boundaries.',
      'Answer a limited request with 429 Too Many Requests and a Retry-After a client can follow.',
    ],
    sections: [
      {
        title: 'Why limit request rates',
        body: "A rate limit caps how many requests one caller may make in a period, so one busy client cannot slow the service for everyone and a runaway loop is stopped early. Each limit needs a key that names the caller: an API key, an account, or, for anonymous traffic, the client address. Counts are kept per key, so callers never use up each other's allowance.",
      },
      {
        title: 'Windows count requests',
        body: 'A fixed window counts requests in slots that start at fixed times, such as each whole minute. It is cheap, one counter per slot, but a caller can send a full allowance at the end of one slot and another at the start of the next: twice the limit within a few seconds. A sliding window counts the requests in the last N seconds from now, which removes that boundary burst. Keeping every request time is exact; blending the previous and current fixed-window counts is a cheaper estimate.',
      },
      {
        title: 'A token bucket allows controlled bursts',
        body: 'A token bucket holds up to a capacity of tokens and gains one each refill interval. Each request spends one token, and a request that finds the bucket empty is refused. The capacity sets the largest burst and the interval sets the long-run rate. Only the token count and the time of the last refill are stored, and refilling from the elapsed time on each request means no timer is needed.',
      },
      {
        title: 'Tell the caller when to come back',
        body: 'A refused request gets 429 Too Many Requests. A Retry-After header says how many seconds to wait; round up, so a client that waits exactly that long is not refused again. Many APIs also report the limit and the remaining allowance on every response, so well-behaved clients slow down before they reach it. Times in these reps are passed in as milliseconds, so the rules can be checked exactly.',
      },
    ],
    example:
      'capacity 3, one token per 1000 ms, full at 0 ms\n\n0 ms    → allowed (2 left)\n0 ms    → allowed (1 left)\n0 ms    → allowed (0 left)\n400 ms  → refused, next token at 1000 ms, Retry-After 1\n1000 ms → allowed (0 left)',
    walkthrough: [
      'The bucket starts with 3 tokens, so a burst of three requests at 0 ms is allowed.',
      'At 400 ms no new token has been added yet, so the request is refused.',
      'The next token arrives at 1000 ms; the 600 ms wait rounds up to a Retry-After of 1 second.',
      'At 1000 ms one token has been added, and the request spends it.',
    ],
    mistakes: [
      'Using one shared counter for every caller, so one busy client blocks the rest.',
      'Forgetting the boundary burst of a fixed window when the limit protects something fragile.',
      'Rounding Retry-After down, so a client that follows it is refused again.',
      'Refilling a token bucket from the last request instead of the last refill, which loses part of an interval each time.',
    ],
    questions: [
      q(
        'fixed-window-burst-v1',
        'A fixed window allows 100 requests per minute, counted from each whole minute. What is the most a caller can send within 2 seconds around 12:01:00?',
        '',
        ['100', '200', '102'],
        1,
        'A caller can send 100 just before 12:01:00 and another 100 just after, because the count resets at the boundary.',
      ),
      q(
        'token-bucket-burst-v1',
        'A token bucket has capacity 5 and gains one token per second. It has been idle for a minute. How many requests arriving together are allowed?',
        '',
        ['1', '5', '60'],
        1,
        'Tokens stop at the capacity, so an idle bucket holds 5 and allows a burst of 5.',
      ),
      q(
        'retry-after-round-v1',
        'The next request will be allowed in 1200 ms. What Retry-After should a 429 send, in seconds?',
        '',
        ['1', '2', '1.2'],
        1,
        'Retry-After takes whole seconds. Rounding 1.2 down to 1 would send the client back too early, so round up to 2.',
      ),
      q(
        'rate-limit-key-v1',
        'Which key gives each signed-in caller their own allowance?',
        '',
        ['The request path', "The caller's API key", 'The current minute'],
        1,
        'Counting by API key keeps callers apart. A path or time key would make everyone share one allowance.',
      ),
    ],
    repIds: ['backend-token-bucket', 'backend-sliding-log', 'backend-limit-response', 'backend-sliding-counter', 'backend-limit-callers'],
    related: ['http', 'background-jobs'],
  },
  {
    id: 'api-evolution',
    title: 'Evolve an API without breaking clients',
    summary:
      'Change requests and responses while existing apps keep working: choose a version per request, tell compatible changes from breaking ones, announce deprecations, and accept webhook deliveries only when they are signed, recent, new, and in order.',
    prerequisites: ['http-routing'],
    objectives: [
      'Choose a response shape from a version in the path or a header, with a documented default and a clear error for an unknown version.',
      'Decide whether a field change to a request or a response is compatible or breaking for clients that cannot update yet.',
      'Announce a deprecation and a sunset date, and apply webhook deliveries once each and in sequence order.',
      'Check that a webhook delivery is signed with the shared secret and recent before acting on it.',
    ],
    sections: [
      {
        title: 'Clients update on their own schedule',
        body: 'A web page updates when you deploy, but a phone app, a partner integration, or a script someone wrote last year keeps sending the requests it was built with. Once an API has clients, every change has to be checked against them: will a client that has not changed still work? Versioning, compatibility rules, and deprecation dates are the tools for answering yes.',
      },
      {
        title: 'A version chooses the shape',
        body: 'A request can name the version it wants in the path, as in /v2/orders, or in a header such as Api-Version: v2. A request that names none gets a documented default, usually the oldest supported version, so clients written before versioning keep working. A version the server does not know gets a clear 400 error rather than a guess, and a request that names two different versions is refused instead of picking one silently. Some APIs name versions by release date and keep each client on its own date, undoing newer changes, newest first, before answering.',
      },
      {
        title: 'Compatible or breaking depends on who reads the field',
        body: 'The side that reads a field is the side a change can break. Clients read responses, so removing a response field, changing its type, or letting a field that was always present go missing is breaking, while adding a field is compatible as long as clients ignore fields they do not know. The server reads requests, so adding a required request field breaks every client that does not send it, while adding an optional one is compatible. Changing a type is breaking in both directions.',
      },
      {
        title: 'Deprecate before you remove, and expect repeats',
        body: 'Before removing an endpoint, announce it: from the deprecation date, responses carry a Deprecation header, a Sunset header with the date it stops working, and a Link to its replacement; from the sunset date it answers 410 Gone. Webhooks run the other way, from a provider to you. Providers retry deliveries that were not acknowledged and do not promise their order, so a receiver skips a delivery ID it has already seen and skips a change whose sequence number is not newer than the last one applied for that resource. Before any of that, it checks who sent the delivery: the provider signs the signing time and the raw body with a shared secret (an HMAC), and the receiver computes the same signature, compares it in constant time, and refuses a signing time more than a few minutes from now, so a captured delivery cannot be sent again later.',
      },
    ],
    example:
      'response fields before: id (string, always), total (number, always)\nresponse fields after:  id (string, always), total (string, always), currency (string, always)\n\ntotal    → type changed      → breaking\ncurrency → added              → compatible\nid       → unchanged',
    walkthrough: [
      'Collect every field name from both lists: currency, id, and total.',
      'total changed from number to string; a client doing arithmetic on it breaks, so it is breaking.',
      'currency is new; clients that ignore unknown fields keep working, so it is compatible.',
      'id is the same on both sides, so it is not reported.',
    ],
    mistakes: [
      'Giving requests without a version the newest shape, which changes the answer for every old client at once.',
      'Judging a request change by the response rules: a new required request field is breaking, not compatible.',
      'Removing an endpoint on its sunset date without having sent Deprecation and Sunset headers before it.',
      'Applying webhook deliveries in arrival order, so a late older change overwrites a newer one.',
    ],
    questions: [
      q(
        'version-default-v1',
        'An API documents v1 as its default and v2 as its newest version. A request names no version. Which shape should it get?',
        '',
        ['v2, the newest', 'v1, the documented default', 'A 400 error asking for a version'],
        1,
        'The default exists so requests written before versioning keep getting the shape they were built for.',
      ),
      q(
        'response-field-removed-v1',
        'Which change to a response can break an existing client?',
        '',
        ['Adding a new field', 'Removing a field', 'Making a sometimes-missing field always present'],
        1,
        'A client that reads the removed field gets nothing. Clients ignore new fields, and a field that is always present is still there for them.',
      ),
      q(
        'request-field-required-v1',
        'Which change to a request body can break an existing client?',
        '',
        ['Adding an optional field', 'Adding a required field', 'No longer reading a field'],
        1,
        'Existing clients do not send the new field, so the server rejects their requests. An optional field or an ignored field leaves them working.',
      ),
      q(
        'webhook-stale-sequence-v1',
        'A webhook for order 7 with sequence 5 arrives after sequence 6 was applied. Its delivery ID is new. What should the receiver do?',
        '',
        ['Apply it, because its delivery ID is new', 'Skip it as stale', 'Skip it as a duplicate delivery'],
        1,
        'A new delivery ID means it is not a repeat, but sequence 5 is older than the change already applied, so applying it would undo newer data.',
      ),
      q(
        'webhook-signature-time-v1',
        'A delivery has a correct signature, but it was signed two hours ago and the tolerance is 5 minutes. What should the receiver do?',
        '',
        ['Accept it, because the signature matches', 'Refuse it as stale', 'Accept it once and remember its signature'],
        1,
        'The signature proves the provider sent it once, not that it was sent now. Refusing old signing times stops a captured delivery from being replayed later.',
      ),
    ],
    repIds: [
      'backend-choose-version',
      'backend-classify-change',
      'backend-deprecation-headers',
      'backend-webhook-deliveries',
      'backend-verify-signature',
      'backend-downgrade-response',
    ],
    related: ['http-routing', 'background-jobs'],
  },
]
