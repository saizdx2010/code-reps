import type { LessonDepth } from './lesson-depth.ts'
import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Post-attempt reviews for the Backend track's service reps. Keep these out of independent and recall prompts.
export const backendDepth: Record<string, RepDepth> = {
  'backend-split-target': {
    reasoning:
      'A target has one structural separator, the first "?", so the whole task is to find that one position. Everything before it names the resource and everything after it is the query, including any later "?", which the query syntax allows. Leaving the text undecoded keeps this function about structure only; decoding is a separate step with its own failure cases.',
    trace:
      'For "/search?q=a?b", indexOf("?") is 7. slice(0, 7) is "/search" and slice(8) is "q=a?b", so the second "?" stays in the query. For "?page=2" the position is 0, the path slice is "", and the rule replaces it with "/". For "/orders?" the query slice after position 7 is "".',
    alternative:
      'target.split("?") splits at every "?", so the query would need the later parts joined back with "?"; one indexOf and two slices say "first" directly. new URL(target, "http://x") also splits a target, but it normalizes the path, resolving segments such as "/a/../b", and percent-encodes some characters, so it changes text this contract says to keep.',
    counterexample:
      'const [path, query] = target.split("?") passes the example but returns query "q=a" for "/search?q=a?b", silently dropping "?b". Forgetting the empty-path rule returns path "" for "?page=2", which no route can match.',
    transfer:
      'Some clients send a fragment by mistake, as in "/docs?page=2#intro". Decide whether "#intro" belongs to the query, is dropped, or makes the target invalid, and how that interacts with an encoded "%23" inside a value. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-decode-query': {
    reasoning:
      'A query has two layers: structure (& between pairs, the first = inside a pair) and encoding (+ and %XX inside each name and value). Splitting the raw text first means an escaped & or = can never act as a separator, and decoding each piece afterwards restores the characters the client meant. A list of pairs keeps repeated names and their order, which a plain object would lose.',
    trace:
      'For "brand=A%26W&size=2+XL&=%zz", splitting at & gives "brand=A%26W", "size=2+XL", and "=%zz". The first splits at its first = into "brand" and "A%26W", which decodes to "A&W". The second becomes "size" and "2 XL" once + turns into a space. The third has an empty name, so it is skipped before its malformed value is decoded. Result: [["brand", "A&W"], ["size", "2 XL"]].',
    alternative:
      'new URLSearchParams(query) does the splitting and + handling for you and is the usual choice in production code. It differs from this contract in two ways: it keeps pairs with an empty name, and it leaves a malformed escape such as "%G1" as literal text instead of reporting it, so a strict API still needs its own check. Collecting values into an object of arrays makes lookups easier but loses the order across different names.',
    counterexample:
      'Calling decodeURIComponent on the whole query before splitting turns "brand=A%26W&size=2" into "brand=A&W&size=2", which produces a stray pair named "W". Replacing + after decoding turns "op=%2B" into a space instead of a plus.',
    transfer:
      'A filter API wants one value per name and must reject a request that repeats a name, such as tag=a&tag=b. Decide whether that rule belongs inside the decoder or in a later step that reads the pairs, and which error the client sees. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-request-line': {
    reasoning:
      'Each rule reads one part, so the checks follow the parts in a fixed order and the first failure decides the response. The shape check comes first because nothing can be read safely from a line without exactly three parts. A method the server does not know is 501 Not Implemented rather than 400, because the line itself is well formed; an unsupported protocol version has its own code, 505.',
    trace:
      'For "BREW coffee HTTP/1.1", splitting on single spaces gives three non-empty parts, so the shape passes. BREW is not an allowed method, so the answer is 501 UNKNOWN_METHOD, even though "coffee" would also fail the target rule. For "GET  /orders HTTP/1.1", the double space produces four parts, one of them empty, so the answer is 400 MALFORMED_LINE before the method is read.',
    alternative:
      'One regular expression can check the whole shape, but a single "no match" merges three different failures and cannot return 501 or 505 without extra work. Splitting on runs of whitespace tolerates double spaces, which a strict parser refuses: when two servers disagree about a lenient parse, an attacker can make them see different requests.',
    counterexample:
      'line.trim().split(/ +/) accepts "GET  /orders HTTP/1.1" and "GET / HTTP/1.1 " and returns results, but the contract requires 400 for both. Uppercasing the method before checking accepts "get", which the contract rejects with 501.',
    transfer:
      'The server must also accept the absolute form "GET http://shop.example/orders HTTP/1.1" that clients send to a proxy. Decide how the path and query are found, which hosts are allowed, and what a target with neither form gets. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-header-value': {
    reasoning:
      'HTTP header names are case-insensitive, so the only safe comparison lowercases both sides. A header can arrive several times, and for list-style headers the copies mean one comma-separated value in arrival order. Tracking "did anything match" separately from "which values were not empty" keeps the difference between a header sent empty ("") and a header never sent (null).',
    trace:
      'For [["X-Tag", " a "], ["x-tag", a tab and a space], ["Host", "h"], ["X-TAG", "b"]] and name "x-tag", the first pair matches and contributes "a"; the second matches, so a match is recorded, but its trimmed value is empty and left out; Host does not match; the last contributes "b". Result: "a, b". For [["X-Debug", "  "]] a match is recorded with no values, so the join gives "".',
    alternative:
      'Building a lowercase-keyed lookup once makes many lookups cheap, and frameworks do exactly that; scanning the list per lookup is fine for a few dozen headers. The Fetch API Headers object also matches names without regard to case and joins repeats with ", ", but it follows its own rules for edge cases such as empty values, so check them before relying on it.',
    counterexample:
      'Comparing names with === finds "Content-Type" only when the client used that exact case, so a request that sent "content-type" looks as if it has no header. Returning null when every matching value is empty tells the caller the header was missing, which hides a client sending an empty Authorization header.',
    transfer:
      'Set-Cookie must never be joined, because cookie values can contain commas. Change the function to return an array of values for that one name and decide what every other name returns. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-read-json-body': {
    reasoning:
      'Each check guards the next: a GET has no body to read, the media type says whether the text is JSON at all, the size limit protects the parser from huge input, and only then is JSON.parse called. Returning the first failure in that order gives the client the most useful status: 415 means change the Content-Type, 413 means send less, and 400 means fix the JSON. A successful parse proves only the shape; the fields inside are validated later.',
    trace:
      'A PUT with headers [["content-TYPE", " Application/JSON "]] and body {"a":1} finds exactly one Content-Type, takes the text before ";", and trims and lowercases it to "application/json". The body has 7 characters, so it is parsed into {a: 1}. The same request sent as text/plain with a 1001-character body stops at 415 before the size is considered. With application/json and "{" followed by 1000 spaces, the size check returns 413 and JSON.parse never runs.',
    alternative:
      'A framework body parser applies the same checks with a configured limit and returns similar statuses; writing them out shows the order and makes every limit visible. A real server would check Content-Length before reading, to reject a large body without buffering it; here the body is already a string, so its length stands in for the size.',
    counterexample:
      'startsWith("application/json") accepts "application/json-patch+json", a different format with its own meaning. Testing typeof data === "object" alone lets null through, because typeof null is "object", and the handler later crashes reading a field of null.',
    transfer:
      'The endpoint must also accept application/x-www-form-urlencoded bodies and give handlers the same data shape. Decide how a form value such as quantity=2 becomes data, what happens to repeated names, and whether numbers stay text. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-match-route': {
    reasoning:
      'A pattern and a path line up segment by segment, so a match is a statement about every position: the counts agree, every literal is equal, and every parameter has text to capture. Checking the count first rules out longer and shorter paths before any position is read, and requiring a non-empty segment stops a trailing slash from filling a parameter with nothing.',
    trace:
      'For "/users/:id/orders" and "/users/7/orders", both split into four segments. Position 0 is "" against "", position 1 "users" against "users", position 2 ":id" captures "7", and position 3 "orders" equals "orders", so the result is {id: "7"}. For "/orders/:id" and "/orders/", the counts agree at three, but position 2 of the path is "", so the parameter cannot match and the result is null.',
    alternative:
      'Compiling each pattern into a regular expression, such as ^/orders/([^/]+)$, is how many routers match quickly, with capture groups holding the parameters. It needs care to escape literal characters such as "." and to name the groups. The segment loop is easier to read and to extend with one rule per segment kind.',
    counterexample:
      'Testing "/orders/:id" with path.startsWith("/orders/") also accepts "/orders/42/items" and "/orders/". Skipping the empty-segment check returns {id: ""} for "/orders/", so a handler looks up an order with no ID.',
    transfer:
      'Some routers accept an optional parameter such as /archive/:year? that matches both /archive and /archive/2026. Decide how the segment counts compare and what params holds when the segment is absent. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-route-request': {
    reasoning:
      'Routing asks two questions in order: which patterns match the path, and which of those routes accepts the method. Answering the first once, in list order, makes the rest simple: the first route with the method wins, HEAD may borrow a GET route, and when nothing answers, the presence or absence of matching patterns separates 405 from 404. Allow comes from the same matching routes, so it never names a method that would not work.',
    trace:
      'For PATCH /orders/new the matching routes are new-form (GET /orders/new), show (GET /orders/:id), and remove (DELETE /orders/:id); cancel has four segments and list has two. None is PATCH and the request is not HEAD, so the answer is 405. The methods GET, GET, DELETE become the set GET and DELETE, HEAD joins because GET is present, and sorting gives ["DELETE", "GET", "HEAD"].',
    alternative:
      'A router can index routes by method first and look up the path second, which is fast with many routes, but a 405 then needs a second pass over the other methods. Building the matching list once answers both questions. Ranking routes by specificity instead of list order is the other common design, and it removes the need to list literal routes first.',
    counterexample:
      'Looking only for a route with the same method and otherwise answering 404 turns PUT /orders/42 into 404, which tells the client that order 42 does not exist. Adding HEAD to Allow every time lists HEAD for /orders/42/cancel, where only POST exists.',
    transfer:
      'An OPTIONS request with no OPTIONS route should get 204 and the Allow list instead of 405. Decide where that rule fits in the order of checks and whether OPTIONS itself appears in Allow. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-normalize-path': {
    reasoning:
      'The kept segments behave like a stack: a normal segment is pushed, ".." pops, and empty and "." segments do nothing. Each ".." can only remove what an earlier segment added, so the result never names anything above the root, and an attempt to climb higher is refused instead of quietly clamped, so a hostile path cannot pass for a harmless one.',
    trace:
      'For "/orders//42/./items/../", the segments are "", "orders", "", "42", ".", "items", "..", "". The kept list becomes [orders], stays the same for the empty segment, becomes [orders, 42], stays for ".", grows to [orders, 42, items], loses items at "..", and ignores the final empty segment, giving "/orders/42". For "/a/../../b", "a" is kept, the first ".." removes it, and the second finds the list empty, so the result is null.',
    alternative:
      'new URL(path, "http://x").pathname also resolves dot segments, but it clamps at the root instead of refusing, so "/../etc" becomes "/etc", and it keeps empty segments. That is the rule browsers use for links; a server that serves files usually wants the refusal. Rejecting every path that contains ".." is stricter and simpler, but it also refuses paths that clean up harmlessly.',
    counterexample:
      'Ignoring a ".." when the list is empty turns "/../secret" into "/secret", which hides the attempt and may serve something meant to be unreachable. Decoding first turns "%2e%2e" into "..", a different contract and a classic source of traversal bugs when one layer decodes and another cleans.',
    transfer:
      'A static file server maps the cleaned path onto a folder. Decide whether to clean before or after decoding, and what to do with a segment that decodes to "/" or "..". This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-build-path': {
    reasoning:
      'Each parameter fills only the one segment it names, and encodeURIComponent keeps its value inside that segment: "/" becomes %2F, "?" becomes %3F, and "#" becomes %23. Dots are the exception, because the encoding leaves them alone and a whole segment of "." or ".." is a path step, so those two values are refused. Checking the type first means inherited properties and non-string values never reach the encoder.',
    trace:
      'For "/files/:name" with {name: "a/b"}, the segments are "", "files", and ":name". ":name" looks up "a/b", a non-empty string that is not a dot segment, and encodes it as "a%2Fb", so the result "/files/a%2Fb" still has three segments. With {name: ".."} the value passes the type check but is a dot segment, so the result is null. With {} and ":constructor", the inherited value is a function, not a string, so the result is null.',
    alternative:
      'A template string such as `/files/${encodeURIComponent(name)}` is fine for one known route, but a general builder has to find parameters segment by segment. encodeURI instead of encodeURIComponent leaves "/" and "?" unescaped: it is meant for whole URLs, not single values.',
    counterexample:
      'Replacing ":name" with the raw value builds "/files/a/b", which names a different, deeper resource. Testing `name in params` instead of the value type accepts {} for ":constructor" and builds a path from the text of a function.',
    transfer:
      'The builder should also accept a query object and append ?key=value pairs. Decide how keys and values are encoded, which order the pairs use, and what an empty object adds. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-route-specificity': {
    reasoning:
      'Specificity compares segment kinds from the left, because the leftmost segments decide which part of an API a path belongs to. Ranking wildcard below parameter below literal turns the rule into a walk that stops at the first different rank. Two patterns that both match a path cannot differ in literal text at the same position, only in kind, so the walk is always meaningful, and identical kind sequences fall back to list order.',
    trace:
      'For "/a/b/c/d", both "/a/:x/c/d" and "/a/b/:y/:z" match. Position 2 compares ":x", a parameter, with "b", a literal, so "/a/b/:y/:z" wins there, although the other pattern has more literals in total; its params are {y: "c", z: "d"}. For "/a/b/c", "/a/*" and "/a/:x/*" both match; at position 2 a wildcard meets a parameter, so "/a/:x/*" wins with {x: "b", "*": "c"}.',
    alternative:
      'Counting literals and taking the pattern with the most is simpler, but it prefers "/a/:x/c/d" above, against the left-to-right rule routers document. A tree of segments (a trie) that tries literals, then parameters, then wildcards at each level finds the same answer without comparing pairs, and is how fast routers work.',
    counterexample:
      'Replacing the best match on a tie as well returns "/items/:sku" for two equally specific patterns instead of the one listed first. Letting a wildcard match an empty rest returns "/files/*" for "/files/", where the contract says nothing matches.',
    transfer:
      'Add typed parameters such as /orders/:id(number) that match only digits. Decide where a typed parameter ranks between a plain parameter and a literal, and how /orders/new routes. This changed contract is self-reviewed, not checked by the original cases.',
  },
}

export const backendGuides: Record<string, ReflectionGuide> = {
  'backend-split-target': {
    plan: [
      'Find the first "?" and handle the case with none.',
      'Take the text on each side without decoding it.',
      'Replace an empty path with "/".',
    ],
    explanation: [
      'Trace a target with two "?" marks.',
      'Explain the two different ways the query can be empty.',
      'Say what this function does not check, such as encoding.',
    ],
    example:
      'I look for the first "?" with indexOf. Without one, the whole target is the path and the query is "". With one, the path is the text before it and the query is everything after it, so a later "?" stays in the query. An empty path becomes "/". The work is one scan of the target. The checks call the function with strings; they do not parse a real request.',
  },
  'backend-decode-query': {
    plan: [
      'Split into pieces at &, then each piece at its first =.',
      'Skip empty pieces and empty names before decoding.',
      'Replace + with a space, decode, and turn a thrown error into the error result.',
    ],
    explanation: [
      'Trace a value that contains %26.',
      'Explain why + is replaced before decoding.',
      'Explain why the result is a list rather than an object.',
    ],
    example:
      'I split the raw query at every &, skip empty pieces, and split each piece at its first =. A piece with an empty name is skipped. For the rest I replace + with a space and call decodeURIComponent on the name and value inside try/catch, returning MALFORMED_QUERY if it throws. Pairs keep their order and repeats. The work is linear in the query length. The checks pass strings directly; they do not test a real URL parser.',
  },
  'backend-request-line': {
    plan: [
      'Split on single spaces and require exactly three non-empty parts.',
      'Check the method, then the target, then the version, each exactly.',
      'Split the target at its first "?" for the result.',
    ],
    explanation: [
      'Trace a line that breaks two rules and name the response.',
      'Explain why an unknown method is 501 rather than 400.',
      'Explain why extra spaces are rejected rather than tolerated.',
    ],
    example:
      'I split the line on single spaces and return 400 unless there are exactly three non-empty parts. Then I compare the method with the allowed list (501), check that the target starts with "/" (400), and compare the version with HTTP/1.1 and HTTP/1.0 (505). Finally I split the target at its first "?". The work is linear in the line length. The checks pass strings; they do not read bytes from a socket.',
  },
  'backend-header-value': {
    plan: [
      'Lowercase both names before comparing.',
      'Trim each matching value and keep only the non-empty ones.',
      'Return null only when nothing matched.',
    ],
    explanation: [
      'Trace a header sent twice in different letter cases.',
      'Explain the difference between "" and null in the result.',
      'Say why a prefix match would be wrong.',
    ],
    example:
      'I lowercase the wanted name once and scan the pairs in order. For each pair whose lowercase name matches, I record that something matched and keep the trimmed value if it is not empty. I return null when nothing matched, or the kept values joined with ", ". The scan is linear in the number of headers, and the input is not changed. The checks call the function directly, not through a server.',
  },
  'backend-read-json-body': {
    plan: [
      'Write the checks in order with their statuses.',
      'Find exactly one Content-Type and read the media type before ";".',
      'Check the size before parsing; reject null, arrays, and other non-objects after.',
    ],
    explanation: [
      'Trace a request that breaks two rules and name the response.',
      'Explain why the size check comes before JSON.parse.',
      'Say what the parsed data still has not proved.',
    ],
    example:
      'GET and HEAD return data null when the body is empty and 400 otherwise. For other methods I collect the Content-Type headers by lowercase name and require exactly one whose media type, trimmed and lowercased, is application/json (415). A body over 1000 characters is 413. JSON.parse runs inside try/catch (400), and the result must be a non-null, non-array object (400). The work is linear in the body. The checks call the function directly; real body streaming and Content-Length are not tested.',
  },
  'backend-match-route': {
    plan: [
      'Split both strings at "/" and compare the counts.',
      'Walk the positions: equal literals, non-empty parameters.',
      'Return the captured names, {}, or null.',
    ],
    explanation: [
      'Trace a path with a trailing slash.',
      'Explain why a parameter cannot capture an empty segment.',
      'Say what the matcher does not do, such as decoding.',
    ],
    example:
      'I split both strings at "/" and return null unless they have the same number of segments. At each position a ":" segment captures a non-empty path segment under its name, and any other segment must be equal. A full walk returns the captures, which is {} for a literal pattern. The work is linear in the path length. The checks call the function directly; they do not run a router or decode segments.',
  },
  'backend-route-request': {
    plan: [
      'Collect the routes whose patterns match the path, in list order.',
      'Pick the first with the method; let HEAD fall back to GET.',
      'Return 405 with a sorted Allow list, or 404.',
    ],
    explanation: [
      'Trace a request whose path matches two patterns but whose method matches neither.',
      'Explain why HEAD appears in Allow only with GET.',
      'Say why list order decides between /orders/new and /orders/:id.',
    ],
    example:
      'I match every route pattern against the path and keep the matching routes in list order. The first whose method equals the request method answers with 200 and its params; a HEAD request without a HEAD route takes the first GET route. If none answers, matching routes mean 405 with their methods deduplicated, HEAD added when GET is present, and sorted; no matching route means 404. The work is the number of routes times the path length. The checks pass values directly, not real requests.',
  },
  'backend-normalize-path': {
    plan: [
      'Walk the segments and keep a list.',
      'Skip "" and "."; remove one for "..", refusing an empty list.',
      'Join the list behind a single "/".',
    ],
    explanation: [
      'Trace a path that climbs back to the root.',
      'Explain why climbing above the root returns null rather than "/".',
      'Say why escaped dots are not special here.',
    ],
    example:
      'I split the path at "/", skip empty segments and ".", remove the last kept segment for "..", returning null when there is none, and keep every other segment. The result is "/" plus the kept segments joined with "/". The work is linear in the path. The checks pass strings directly; they do not open files or decode escapes.',
  },
  'backend-build-path': {
    plan: [
      'Work segment by segment.',
      'Check each value: a non-empty string that is not "." or "..".',
      'Encode with encodeURIComponent and join.',
    ],
    explanation: [
      'Trace a value that contains "/".',
      'Explain why dots need their own rule.',
      'Say why the value type is checked before the value is used.',
    ],
    example:
      'I split the pattern at "/". Each ":" segment looks up its name in params, and the value must be a non-empty string other than "." or "..", or I return null. Valid values are encoded with encodeURIComponent so they stay one segment, other segments stay as written, and the parts are joined with "/". The work is linear in the pattern and values. The checks pass values directly, not real links.',
  },
  'backend-route-specificity': {
    plan: [
      'Write a matcher for literals, parameters, and a final wildcard.',
      'Rank the kinds: wildcard, then parameter, then literal.',
      'Keep the best match, replacing it only when strictly more specific.',
    ],
    explanation: [
      'Trace two matches that differ at the second segment.',
      'Explain why counting literals is a different rule.',
      'Say what the wildcard captures and when it would capture nothing.',
    ],
    example:
      'For each pattern I match the segments before an optional final "*", requiring equal counts without a wildcard and a non-empty rest with one, and capture the parameters and the rest. I keep the best match so far and replace it only when a left-to-right walk finds a position where the new pattern has the higher kind rank. The work is the number of patterns times the path length. The checks pass strings directly, not a live router.',
  },
}

export const backendLessonDepth: Record<string, LessonDepth> = {
  'http-request-anatomy': {
    title: 'Split first, decode last',
    code: "const query = 'brand=A%26W&size=2'\n// Decode first: 'brand=A&W&size=2' splits into three pieces.\n// Split first: ['brand=A%26W', 'size=2'], then decode each value.\ndecodeURIComponent('A%26W') // 'A&W'",
    reasoning:
      'Percent-encoding exists so that a value can contain the characters that give a query its structure: & between pairs and = inside a pair. That structure is visible only in the raw text. Decoding first turns %26 back into a real &, and the next split cannot tell it from a separator, so the brand A&W becomes a pair named brand with value A plus a stray piece W. Splitting first and decoding each piece keeps every escaped character inside its value.',
    challenge:
      'A client sends total=1%2B1. Predict the decoded value when + is replaced with a space before decoding, then when it is replaced after decoding. Which order matches what the client meant?',
    answer:
      'Replacing + first finds no + in "1%2B1", and decoding then gives "1+1", which is what the client meant: %2B is how a literal plus is sent. Replacing after decoding turns that literal plus into a space and gives "1 1". The rule is the same as for &: undo the syntax (+ for space) before decoding the escapes that protect literal characters.',
  },
  'http-routing': {
    title: 'A matching pattern decides 404 versus 405',
    code: 'routes: GET /orders/:id, DELETE /orders/:id\n\nGET    /orders/42  → 200 (pattern and method match)\nPATCH  /orders/42  → 405, Allow: DELETE, GET, HEAD\nGET    /order/42   → 404 (no pattern matches)',
    reasoning:
      'The router asks two questions in order: does any pattern match the path, and does any of those routes accept the method? The first is about the resource and the second about the action, so each failure gets its own status. Answering 404 for an unsupported method claims the resource does not exist, and a client may then try other paths instead of another method; the Allow list turns a 405 into instructions.',
    challenge:
      'A team adds GET /orders/:id/items. Predict the response to POST /orders/42/items, then to GET /orders/42/items/ with a trailing slash, using the segment rules in this lesson.',
    answer:
      'POST /orders/42/items matches the new pattern, but only GET is registered for it, so the answer is 405 with Allow: GET, HEAD. With a trailing slash the path has one more, empty segment, so no pattern matches and the answer is 404, unless the server cleans the path first by dropping empty segments, in which case the GET route answers.',
  },
}
