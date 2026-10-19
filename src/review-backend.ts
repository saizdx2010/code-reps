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
  'backend-versioned-update': {
    reasoning:
      'The version is a promise about what the client saw: an update naming version 3 says "I made this change to version 3". If the record has moved on, applying the change would silently replace whatever happened in between, so the only safe answers are to apply it to exactly that version or to refuse it with the current version so the client can look again. Building the new record on a copy keeps the stored one intact whichever way the decision goes.',
    trace:
      'Record p1 is at version 3 with price 40. Editor A sends expectedVersion 3 with price 35: the versions match, so data becomes {name: "Lamp", price: 35} and the version becomes 4. Editor B, who also read version 3, sends expectedVersion 3 with price 45: the record is now at 4, so B gets {ok: false, status: 409, currentVersion: 4} and price 35 survives.',
    alternative:
      "Locking the record while someone edits it (pessimistic concurrency) prevents conflicts instead of detecting them, but a lock held across a person's editing session blocks everyone else and needs a timeout when the editor walks away. Version checks cost nothing until two writes actually collide, which is why web APIs usually choose them.",
    counterexample:
      "Removing every field whose new value is falsy, as in `if (!value) delete data[key]`, drops a stock of 0 and a featured flag of false. Spreading changes into the stored data object instead of a copy changes the caller's record even when the update is refused.",
    transfer:
      'Allow an update to say "apply only these fields if nobody changed them", using a version per field instead of one per record. Decide what a client gets back when one field is stale and another is not. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-if-match': {
    reasoning:
      'If-Match turns an update into a conditional one: change the resource only if it is still the version this tag names. A missing header means the client did not say which version it saw, so a server that requires conditional updates answers 428 instead of guessing. Comparing whole strong tags, quotes included, is the rule HTTP sets for If-Match, because a weak tag only promises that two versions are equivalent, not identical.',
    trace:
      'With the stored tag "v7", the header \' "v6" ,  "v7" \' splits into two pieces; trimming gives "v6" and "v7", and the second equals the stored tag, so the answer is 200. The number between "v and the closing quote is 7, so the new tag is "v8". The header W/"v7" starts with W/, so it never matches and the answer is 412. With no stored resource, "*" has nothing to match, so the answer is 412 too.',
    alternative:
      'A server can compare a version number in the request body instead, as the previous rep did; If-Match keeps the check in HTTP itself, so caches, proxies, and client libraries understand it. Some APIs accept updates without If-Match and fall back to last write wins, which is simpler for clients but brings back lost updates.',
    counterexample:
      'header.includes(current.etag) accepts W/"v7", because the weak tag contains "v7". Building the new tag with current.etag + 1 or by adding to the last character gives "v7"1 or turns "v9" into "v:" instead of "v10".',
    transfer:
      'Support If-None-Match: * on create, so a client can say "only if nothing exists yet". Decide the status for an existing resource and how it differs from If-Match. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-lost-updates': {
    reasoning:
      "A change is lost when it is replaced by someone who never saw it. Only the write being replaced matters, so it is enough to remember who made the latest write and when, and each client's latest read. A write that replaces its own author's value, the starting value, or a value written before its author's last read loses nothing that author did not know about.",
    trace:
      "In the example A reads at 0 and B reads at 1. A writes at 2, replacing the starting value, so nothing is lost and A now owns the stored value from position 2. B writes at 3: the stored value was written by A at position 2, after B's last read at 1, so position 3 replaced an unseen change and the result is [3].",
    alternative:
      "Comparing every pair of writes finds the same answer but costs O(n²) and can count a change twice once it has already been lost. Tracking only the latest write and each client's latest read is one pass. A version-checked server, as in the other reps of this stage, would refuse position 3 instead of reporting it afterwards.",
    counterexample:
      'Counting a write whenever any other client wrote since the writer\'s last read reports the second A write in "A read, B write, A write, A write" again, although B\'s change was already lost at the first one. Treating "never read" as "read at the start" misses "A write, B write", where B replaced A\'s change without ever reading it.',
    transfer:
      'Report, for each lost update, whose change was replaced and by whom, so the team can contact both. Decide what to report when several changes were replaced in a row. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-compare-and-set': {
    reasoning:
      'Compare-and-set folds the check and the write into one operation: the value changes only if it still equals what the caller expected, so two callers that read the same value cannot both succeed. Treating a missing key as null gives the same operation a create-only form (expect null) and a delete form (next null), and Object.hasOwn keeps names such as toString from counting as stored values.',
    trace:
      'For {a: ""} with key "a", expected null, and next "v", the store has "a" as its own property, so the current value is "", which is not null, and the answer is {ok: false, current: ""}. For {} with key "toString", the store has no own property of that name, so the current value is null, it matches, and the new store is {toString: "v"}.',
    alternative:
      'Version numbers detect a change even when a value went from x to y and back to x, which compare-and-set cannot see (the "ABA" case); compare-and-set is simpler when the value itself is what matters. An operation such as "add 1" done by the store itself needs no expected value at all, because it cannot lose a concurrent increment.',
    counterexample:
      'store[key] ?? null reads toString from Object.prototype, so the current value is a function and an expected null never matches. store[key] || null turns "" into null, so a create-only call overwrites an empty value it should have refused.',
    transfer:
      'Add a version to every key and make compare-and-set compare versions instead of values. Decide what a caller passes for a key that does not exist yet and how a delete changes the version. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-replay-writes': {
    reasoning:
      "The server holds one fact per client, the version that client last saw, and one fact about the record, its current version. A write is safe exactly when those two agree, because then nothing has been accepted since the client looked. Updating the writer's known version after an accepted write matches what a real response does (it returns the new version), so a client can make several changes in a row without reading in between.",
    trace:
      'In "Keeps refusing until the client reads again", A and B both read version 1. A writes "dark" at 2: 1 equals 1, so the version becomes 2 and A knows 2. B writes at 3 with known version 1, which is refused, and again at 4, refused again because a refusal leaves B at 1. B reads at 5 and learns 2, so its write at 6 is accepted: the value is "green", the version 3, and refused [3, 4].',
    alternative:
      'Comparing values instead of versions ("accept if the value is still what I read") accepts A\'s write in "Refuses a stale write after a change was undone", because B changed the value and then changed it back, so it looks untouched; versions see that two changes happened. Merging changes automatically, as collaborative editors do, avoids refusals altogether but needs a rule for every kind of conflict.',
    counterexample:
      'Forgetting to update the writer\'s known version after an accepted write refuses A\'s second write in "Lets a client write again after its own write". Treating a client that never read as knowing version 0, or the initial version, accepts its write.',
    transfer:
      'Make a refused client retry automatically: read again, then write again, at most twice. Decide whether the retry should resend the same value or ask the client, and what the log shows. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-job-failure': {
    reasoning:
      'The decision has two parts that must stay in order: whether to try again at all, then when. A permanent error ends the job whatever the attempt count, because no retry can fix it; a temporary one is retried until the attempt limit. Doubling the wait from the base delay gives a struggling service room to recover, and the cap keeps a job from waiting so long that nobody notices it is still pending.',
    trace:
      'With base 1000, cap 60000, and now 5000, the job that just made its second attempt waits 1000 × 2^(2 - 1) = 2000, so runAt is 7000. After attempt 8 the doubled wait would be 128000, so the cap of 60000 applies. With maxAttempts 5, attempt 4 still retries after 8000, and attempt 5 goes to the dead letters with TOO_MANY_ATTEMPTS; a retryable flag of false at attempt 5 reports PERMANENT_ERROR instead.',
    alternative:
      'A fixed delay between attempts is simpler and fine for a single slow job, but when many jobs fail at once they all retry together. Adding a random part to each delay ("jitter") spreads those retries out and is common in production; this contract leaves it out so the checks can be exact.',
    counterexample:
      'Using 2 ** attempts makes the first wait twice the base: attempts 1 gives 2000 instead of 1000. Checking the attempt limit before the error type reports TOO_MANY_ATTEMPTS for a permanent error at the last attempt, which hides that retrying could never have helped.',
    transfer:
      'Some errors say how long to wait, as a Retry-After value from another service. Decide how that value combines with the backoff and the cap, and what happens when it is longer than the cap. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-claim-job': {
    reasoning:
      "A job is safe to hand out when it is due and nobody holds a live lease on it. An expired lease means its worker stopped without finishing, so the job becomes available again, which is how work survives a crash, and also why the same job can run twice. Choosing the smallest runAt with the list position as tie-breaker gives every worker the same answer for the same table, and copying only the chosen job leaves the caller's table unchanged.",
    trace:
      'At now 100 with jobs a (runAt 200, no lease) and b (runAt 50, no lease), a is not due, b is, so b is chosen: its lease becomes {worker: "w1", until: 1100} and its attempts go from 0 to 1, while a is copied unchanged. A job leased by w2 until 100 is available at now 100, because the lease ends at or before now, so w1 takes it and its attempts go up again.',
    alternative:
      'In a database the claim is one statement that updates the earliest available row and returns it, often with row locking that skips rows another worker is updating, so two workers never claim the same job at once. A message broker does the same with a visibility timeout: a received message is hidden for a while and reappears if it is not acknowledged.',
    counterexample:
      'Treating a lease as expired only when until is before now (until < now) keeps a job leased until 100 blocked at now 100. Letting the lease holder claim its own live lease again hands the same job to the same worker twice while the first attempt may still be running.',
    transfer:
      'Let a worker extend its lease while a long job is still running ("heartbeat"). Decide which checks the extension needs so a worker whose lease already ran out cannot take the job back from its new holder. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-dedupe-deliveries': {
    reasoning:
      'With at-least-once delivery the message ID, not its content, is what identifies a message: a repeat is the same message sent again, even if a bug or a retry changed its body. Adding each ID to the set as soon as its message is applied catches repeats inside the batch as well as ones from before, so every message changes a balance at most once.',
    trace:
      'For m2, m1, m2, m1 with m1 already processed: m2 is new, so a1 becomes 1 and m2 joins the set. m1 is in the set, so it is skipped. The second m2 was just added, so it is skipped too, as is the second m1. Skipped is [m1, m2, m1] and processedIds is [m1, m2].',
    alternative:
      'Keying on the content (account and amount) instead of the ID wrongly merges two different deposits of the same amount and lets a changed repeat through. In a database the processed IDs live in a table with a unique key, written in the same transaction as the balance change, so a crash cannot apply the change without recording the ID.',
    counterexample:
      'Checking only the given processedIds, without adding new IDs as you go, applies the second m1 in "Applies a message once and skips its repeat" and doubles the balance. Pushing new IDs onto the processedIds argument changes the caller\'s array.',
    transfer:
      'The processed-ID list cannot grow forever. Decide how long an ID must be kept, given how late a redelivery can arrive, and what happens to a message whose ID was already removed. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-outbox-relay': {
    reasoning:
      'Events are published in id order, the order they were saved, so consumers see "placed" before "paid". Stopping at the first failure keeps that order: publishing row 3 after row 2 failed would deliver events out of order. A failed event stays unpublished and is tried again on the next run, so nothing is skipped, and the price is that an event can be published twice if the relay stops between publishing and saving publishedAt.',
    trace:
      'Rows 3, 1, and 2 are unpublished. Sorted by id they are 1, 2, 3, and batchSize 2 keeps 1 and 2. Attempt 1 uses results[0], true, so row 1 gets publishedAt 7; attempt 2 uses results[1], true, so row 2 does too. Row 3 waits for the next run. The rows come back in their original order: 3 unchanged, then 1 and 2 published.',
    alternative:
      'Publishing every unpublished row and skipping only the failures delivers more per run but breaks the order consumers rely on. Publishing directly from the request handler, without an outbox, can lose the event when the service stops after saving the order but before publishing, or announce an order whose transaction then rolled back.',
    counterexample:
      'Sorting ids as text puts 10 before 9, so "Sorts ids as numbers" publishes row 10 first. Continuing after a failure publishes rows 2 and 3 in "Does not try rows after a failure" while row 1 is still waiting.',
    transfer:
      'Let events for different orders be published independently, so one stuck order does not hold up the others, while events for the same order stay in order. Decide what the relay needs to know about each row and where it stops. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-queue-simulation': {
    reasoning:
      'The worker always runs the entry with the smallest run time, so the clock only moves forward, and the queue order breaks ties so the same input always gives the same history. Each failure is decided exactly as in the retry policy: permanent ends it, too many attempts ends it, anything else schedules a later entry. Because a waiting retry does not block the worker, other jobs finish in the meantime.',
    trace:
      'In "Breaks a time tie by the order jobs were queued", b and a both fail at time 0. b\'s retry is queued first, for 100, then a\'s, also for 100. At 100 the tie goes to b, which was queued earlier, so b completes, then a. The result is completed [b, a], finishedAt 100, even though a comes first alphabetically.',
    alternative:
      'A priority queue (heap) ordered by run time and queue order finds the next entry in O(log n) instead of scanning; with at most 50 jobs and a few attempts each, a scan is clear and fast enough. Advancing the clock in fixed steps, such as every 100 ms, would also work but wastes steps and can misplace runs between ticks.',
    counterexample:
      'Breaking ties by job ID completes a before b in the tie case. Running jobs strictly in their original order, waiting for each retry before moving on, finishes "Runs other work while a retry waits" as [a, b] at time 100 instead of [b, a].',
    transfer:
      'Add a second worker, so two entries can run at the same time. Decide how the clock and the tie-break work when both workers are free, and whether the history can still be reproduced exactly. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-token-bucket': {
    reasoning:
      'The bucket stores two facts, how many tokens it has and when it last gained one, and every other fact follows from the time that has passed. Adding only whole intervals and moving the refill time by exactly those intervals keeps the long-run rate at one token per interval, however the requests are spaced. A full bucket has nothing to work toward, so its refill time restarts at now, and the capacity caps how large a burst can be.',
    trace:
      'An empty bucket refilled at 0, with refillMs 1000, gets a request at 1500: one whole interval has passed, so it gains one token and the refill time moves to 1000, not 1500. The request spends the token. A request at 1999 finds no new whole interval since 1000, so it is refused with retryAfterMs 1000 + 1000 - 1999 = 1. With {tokens: 2, updatedAt: 0}, capacity 3, and now 1300, the bucket fills exactly, so the refill time becomes 1300 before a token is spent.',
    alternative:
      'Storing tokens as a fraction (adding elapsed / refillMs each time) gives the same long-run rate without tracking a refill time, but fractions bring rounding and a less obvious "next token" time. A leaky bucket, which queues requests and lets them out at a steady rate, smooths traffic instead of refusing it; the token bucket refuses at once and allows bursts.',
    counterexample:
      'Setting updatedAt to now on every refill throws away the 500 ms of progress at 1500, so the next token arrives at 2500 instead of 2000. Measuring retryAfterMs from now instead of the refill time ("refillMs - 0") tells the caller at 999 to wait 1000 ms when 1 ms is enough.',
    transfer:
      'Let some requests cost more than one token, such as a bulk export costing 5. Decide what a request that needs more tokens than the capacity gets, and how retryAfterMs counts several missing tokens. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-sliding-log': {
    reasoning:
      'A sliding window counts exactly the requests in the last windowMs milliseconds, so the allowance holds over every period of that length, not only over aligned slots. When the count is at or over the limit, the count drops below the limit only after count - limit + 1 of the oldest times have left, and the last of those to leave is the one at index count - limit in sorted order.',
    trace:
      'For times [1100, 1200, 1300, 1400] at now 1500 with limit 2 and windowMs 1000, all four are later than 500, so the count is 4. Three must leave for the count to reach 1. Sorted, the third oldest is at index 4 - 2 = 2, which is 1300; it leaves the window at 2300, so retryAfterMs is 2300 - 1500 = 800.',
    alternative:
      'A fixed window needs one counter per slot instead of every time, but allows the boundary burst that "Counts requests across a fixed-window boundary" refuses. Blending the previous and current window counts approximates a sliding window with two numbers, at the cost of assuming requests were spread evenly.',
    counterexample:
      'Including a time exactly windowMs old (t >= now - windowMs) refuses the request at 1800 for a time at 800, which the contract says has left. Always waiting for the oldest time gives 600 instead of 800 when the count is over the limit, so the caller is refused again when it comes back.',
    transfer:
      'Store only the accepted times and drop those older than the window on each call, so the list cannot grow without limit. Decide whether a refused request should be stored, and what the list looks like after a long burst. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-limit-response': {
    reasoning:
      'The response has to be safe to follow literally. Retry-After takes whole seconds, so rounding a wait up guarantees that a client which waits that long finds the limit open; rounding down sends it back too early. A minimum of 1 keeps a refusal from ever saying "retry now". The limit headers turn the same decision into early guidance, and the remainder never goes below 0 even if a limiter reports a negative one.',
    trace:
      'A refusal with retryAfterMs 1200 is 1.2 seconds, which rounds up to 2, so the headers are RateLimit-Limit "10", RateLimit-Remaining "0", and Retry-After "2". With retryAfterMs 1000 the wait is exactly 1 second, and with 0 it would be 0 seconds but the minimum makes it "1". An allowed request with remaining -2 reports "0".',
    alternative:
      "Retry-After can also hold an HTTP date, which is precise but depends on the client's clock agreeing with the server's; a number of seconds does not. Some APIs send the reset time of the window instead of a wait, which suits fixed windows but says little for a token bucket.",
    counterexample:
      'Math.round(1200 / 1000) gives 1, so a client that waits one second is refused again. Leaving the number unconverted puts 2 rather than "2" in the headers, which a real HTTP library would turn into text anyway but this contract checks.',
    transfer:
      'Add a RateLimit-Reset header that says, in whole seconds, when the allowance will be full again. Decide what it means for a token bucket and how it should round. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-sliding-counter': {
    reasoning:
      "The sliding window ending at now overlaps the previous fixed window for start + windowMs - now milliseconds, so, if the previous window's requests were spread evenly, that share of its count still applies. Multiplying before dividing keeps the arithmetic exact for whole numbers, and rounding down gives the caller the benefit of the doubt for a fraction of a request.",
    trace:
      'At now 1250 with windowMs 1000, the current window started at 1000, and the last 1000 ms still reach 750 ms into the previous window. With previousCount 10 that is 10 × 750 / 1000 = 7.5, rounded down to 7, plus currentCount 3 gives used 10, below the limit of 12. At now 2000 the whole previous window still applies, so previousCount 10 alone reaches a limit of 10 and the request is refused.',
    alternative:
      "Keeping every request time is exact but costs memory per request; two counters cost the same for one request or a million, which is why large services use this estimate. Its weakness is uneven traffic: if all of the previous window's requests came at its very end, the estimate counts too few of them.",
    counterexample:
      'Weighting by the part of the current window that has passed (now - start) instead of what is left counts almost none of the previous window at its start, when it should count all of it. Dividing before multiplying, as Math.floor(previousCount / windowMs) × remaining, rounds most counts down to 0.',
    transfer:
      'Turn the estimate into a Retry-After: when refused, find how long until enough of the previous window has slid out for used to fall below the limit. Decide how currentCount affects that answer. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-limit-callers': {
    reasoning:
      "Each key's bucket is independent, so the whole problem is the single-bucket rule applied with a map from key to bucket. A key's first request finds a full bucket, refills are computed from the stored refill time so partial progress carries across requests, and a refusal saves the refilled bucket without spending, so a caller who keeps asking does not push its own next token further away.",
    trace:
      'With capacity 1 and refillMs 1000, k1 is allowed at 0 and its bucket is empty with refill time 0. At 300 no whole interval has passed, so it is refused with 1000 - 300 = 700; at 600 the same bucket gives 400. At 1000 one interval has passed, the bucket fills to 1, its refill time becomes 1000 because it is full, and the request is allowed.',
    alternative:
      'One global bucket for all keys is simpler but lets one busy caller refuse everyone else. A real gateway keeps these buckets in a shared store, such as an in-memory database, so several gateway servers agree; the refill rule is the same, but each update must be atomic.',
    counterexample:
      'Starting a new key with an empty bucket refuses k2\'s first request in "Starts a new key full at its first request". Spending a token on refused requests as well pushes the 1000 ms request in "Refused requests spend nothing" into a refusal.',
    transfer:
      "Give some keys a larger capacity, such as paid plans, using a table of limits by key. Decide what an unknown key gets and whether changing a key's capacity affects tokens it already has. This changed contract is self-reviewed, not checked by the original cases.",
  },
  'backend-choose-version': {
    reasoning:
      'Two places can name a version, so the function first reads each one on its own terms, then combines them with a fixed precedence: two different answers are a conflict, one answer wins, and no answer means the documented default. Only after that is the result checked against the supported list, so a client that sent a contradictory request hears about the contradiction rather than about one half of it.',
    trace:
      'For "/v3/orders" with Api-Version "v2", the first segment "v3" matches the pattern, so the path names v3 and the route is "/orders"; the header names v2. They differ, so the answer is VERSION_CONFLICT even though v3 is also unsupported. For "/v2" the path names v2 and nothing is left after it, so the route is "/". For "/v2x/orders" the pattern fails at "x", so no version is named and the default v1 applies to the whole path.',
    alternative:
      'Content negotiation, such as Accept: application/vnd.shop.v2+json, keeps versions out of URLs but is harder to try in a browser. Path versions are easy to see and cache but make every route repeat the version. Choosing the newest version as the default is simpler for new clients but silently changes old ones whenever a version ships.',
    counterexample:
      'A pattern without the end anchor, /^v[0-9]+/, reads "v2x" as v2 and routes "/v2x/orders" as "/orders". Treating a blank header as present makes "/v2/orders" with Api-Version "  " a conflict between "v2" and "".',
    transfer:
      'Accept the header value as a bare number too, so "2" means "v2". Decide whether "02" or "v02" should match, and what a conflict means when both forms are used. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-classify-change': {
    reasoning:
      'A change can only break the side that reads the field. Clients read responses, so anything that takes information away from them, or changes its type, breaks them; the server reads requests, so anything that asks clients for more than they send breaks them. Each field gets one verdict, and any breaking difference outweighs a compatible one because a single broken client is enough.',
    trace:
      'For a request where gift goes from not required to required and sku from required to not required, gift now demands something old clients never sent, so it is breaking, while sku now asks for less, so it is compatible. For a response where rating goes from an optional number to an always-present string, the required change alone would be compatible, but the type change is breaking, so rating is breaking.',
    alternative:
      'A schema tool can compare whole OpenAPI documents and also catch changes such as a narrowed list of allowed values. Comparing only type and required keeps the rules visible, but misses those, so a real review still reads the diff. Treating every change as breaking is safe but forces a new version for harmless additions.',
    counterexample:
      'Using the response rules for requests calls a new required request field compatible, which "A new required request field is breaking" refuses. Skipping the sort returns ["region", "area"] when the names arrive in that order.',
    transfer:
      'Add an enum: a field may list its allowed values. Decide whether adding a value or removing one is breaking for a response, and then for a request. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-deprecation-headers': {
    reasoning:
      'Three instants split time into three periods, and each period has one response. Turning every time into milliseconds first makes the comparison independent of how the text was written, including its offset, and the boundaries are half-open: the deprecation date and the sunset date each start their own period.',
    trace:
      'With a sunset of 2026-06-01T07:00:00+07:00, Date.parse gives the same instant as 2026-06-01T00:00:00Z. A request at 2026-05-31T23:30:00Z is earlier, so it still gets 200 with Sunset "Mon, 01 Jun 2026 00:00:00 GMT"; a request at 2026-06-01T00:00:00Z is not earlier, so it gets 410 with only Link. Deprecation for 2026-03-01T00:00:00Z is 1772323200000 / 1000, written "@1772323200".',
    alternative:
      'An API gateway can add these headers to every response of a route from configuration, which keeps handlers unchanged but hides the schedule from code review. Returning 404 after the sunset is common but tells clients less than 410 Gone, which says the endpoint existed and was removed on purpose.',
    counterexample:
      'Comparing the ISO text instead of instants treats "2026-06-01T07:00:00+07:00" as later than "2026-06-01T00:00:00Z", so "Reaches a sunset given with an offset" still answers 200. Using > instead of >= for the sunset answers 200 at the exact sunset time.',
    transfer:
      'Start sending the Sunset header 30 days before the deprecation date as an early notice. Decide what the response looks like in that window and how the boundaries behave at exactly 30 days. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-webhook-deliveries': {
    reasoning:
      'Two different problems need two different memories. A retry repeats a delivery, so a set of delivery IDs catches it however the rest of the data looks. Reordering delivers an older change late, so a last-applied sequence per resource catches it even though its delivery ID is new. Recording every delivery ID, applied or skipped, makes a retried stale delivery a duplicate too.',
    trace:
      'For d2 (sequence 2), then d1 (sequence 1), then d1 again on order-7: d2 is new and order-7 has no sequence yet, so it is applied and the last sequence becomes 2. d1 is new but 1 is not greater than 2, so it is skipped as STALE and its ID is remembered. The second d1 is found in the seen set and skipped as DUPLICATE before its sequence is looked at.',
    alternative:
      'A receiver can hold early deliveries and apply them only when the missing sequence numbers arrive, which keeps every intermediate status but needs a buffer and a timeout for numbers that never come. Skipping older changes keeps only the latest status, which suits a status field but not a log of events. Many receivers also store the IDs in a database with a unique constraint so repeats are caught after a restart.',
    counterexample:
      'Checking the sequence before the delivery ID reports the second d1 as STALE instead of DUPLICATE. Keeping one sequence counter for all resources skips order-1 sequence 4 after order-2 sequence 2 for the wrong reason, and skips order-2 entirely if order-1 is ahead.',
    transfer:
      'Keep the seen delivery IDs only for the last 24 hours, with an arrival time on each delivery. Decide what happens when a retry arrives after an ID has been forgotten, and whether the sequence check still protects you. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-downgrade-response': {
    reasoning:
      "Each change was made on top of the previous version, so it can only be undone from the version right after it. Undoing newest first walks the body back one release at a time, and each undo sees exactly the shape that change produced. Changes released on or before the pinned date are part of the client's version and are left alone.",
    trace:
      'With changes 2024-06-01 rename name→fullName and 2025-01-15 rename fullName→displayName, a body {id: 7, displayName: "Ada"} pinned at 2023-12-31 undoes 2025-01-15 first: displayName moves back to fullName. Then 2024-06-01 moves fullName back to name, giving {id: 7, name: "Ada"}. Pinned at 2024-07-01, only the 2025 change is newer, so the result is {id: 7, fullName: "Ada"}.',
    alternative:
      'Keeping one handler per version avoids the undo chain, but every fix then has to be made in each copy. Translating only between neighbouring versions, as here, means each change is written once and old clients get every later fix. Some teams instead stop supporting versions older than a cut-off date, which shortens the chain.',
    counterexample:
      'Undoing oldest first tries to rename fullName to name before fullName exists, then renames displayName to fullName, leaving {id: 7, fullName: "Ada"} for a client that expects name. Using >= pinned also undoes a change released on the pinned date, which "Keeps a change released on the pinned date" refuses.',
    transfer:
      'Add a change kind that moved a field into a nested object, such as address.city from city. Decide how to undo it, and what happens if a later change renames something inside that object. This changed contract is self-reviewed, not checked by the original cases.',
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
  'backend-versioned-update': {
    plan: [
      'Compare expectedVersion with the stored version.',
      'On a match, copy the data and apply each change.',
      'Return the copy with the version plus 1, or 409 with the current version.',
    ],
    explanation: [
      'Trace two updates based on the same version.',
      'Explain why null removes a field but 0 and false do not.',
      'Say what the version check does not cover, such as merging the two changes.',
    ],
    example:
      'I compare expectedVersion with record.version and return 409 with the current version when they differ. Otherwise I copy data, delete each field whose change is null, set every other changed field, and return a new record with the same id and the version plus 1. The work is linear in the number of fields, and the input is not changed. The checks call the function directly, not a database.',
  },
  'backend-if-match': {
    plan: [
      'Return 428 when the header is missing.',
      'Decide whether * or one strong tag in the list matches.',
      'Return 412 without a match, or 200 with the next tag.',
    ],
    explanation: [
      'Trace a header that lists an old tag and the current one.',
      'Explain why a weak tag never matches.',
      'Explain the difference between 428 and 412.',
    ],
    example:
      'A null header gets 428. A trimmed "*" matches when a resource exists; otherwise I split the header at commas, trim each tag, skip tags that start with W/, and look for one equal to the stored tag. No match, or no resource, gets 412. A match gets 200 and a new tag with the number after v increased by 1. The work is linear in the header. The checks call the function directly, not a server.',
  },
  'backend-lost-updates': {
    plan: [
      'Remember who wrote the stored value, and at which position.',
      "Remember each client's latest read.",
      "Count a write when it replaces another client's value that it never read.",
    ],
    explanation: [
      "Trace a log where one client writes twice after another client's write.",
      'Explain why replacing your own write loses nothing.',
      'Say how a version check would have changed this log.',
    ],
    example:
      "I walk the log once, keeping each client's latest read position and the author and position of the latest write. A write counts when the stored value has an author, the author is another client, and the client has never read or read before that write. Then the writer becomes the stored value's author. The work is linear in the log. The checks call the function directly; they do not run concurrent requests.",
  },
  'backend-compare-and-set': {
    plan: [
      "Find the current value, null when the key is not the store's own.",
      'Compare it with expected exactly.',
      'Copy the store, then set or remove the key.',
    ],
    explanation: [
      'Trace a create-only call (expected null) for a key that holds "".',
      'Explain why inherited names count as missing.',
      'Say what compare-and-set cannot notice that a version number can.',
    ],
    example:
      'I read the current value with Object.hasOwn, so missing and inherited keys are null, and compare it with expected using ===. A mismatch returns the current value. A match copies the store and sets the key to next, or deletes it when next is null. The work is linear in the store size because of the copy. The checks call the function directly, not a real store.',
  },
  'backend-replay-writes': {
    plan: [
      'Keep the current value and version, and a map of known versions.',
      'Record the current version on each read.',
      "Accept a write only when the writer's known version is current.",
    ],
    explanation: [
      'Trace two clients that read the same version and both write.',
      "Explain why an accepted write updates its writer's known version.",
      'Explain why comparing values instead of versions would be wrong.',
    ],
    example:
      "I keep the stored value, the current version, and a map from client to the version it last saw. A read stores the current version for that client. A write is accepted only when the client has a known version equal to the current one; then I store the value, add 1 to the version, and update the writer's known version. Otherwise I record its position as refused. The work is linear in the log. The checks call the function directly, not a live server.",
  },
  'backend-job-failure': {
    plan: [
      'Check the error type first, then the attempt limit.',
      'Work out the wait: base times 2 to the power attempts minus 1.',
      'Cap the wait and add it to now.',
    ],
    explanation: [
      'Trace the first, second, and capped retry times.',
      'Explain why a permanent error ignores the attempt count.',
      'Say what the contract leaves out, such as random jitter.',
    ],
    example:
      'A false retryable flag returns PERMANENT_ERROR. Otherwise, attempts at or above maxAttempts returns TOO_MANY_ATTEMPTS. Otherwise the wait is baseDelayMs × 2^(attempts - 1), capped by maxDelayMs, and runAt is now plus that wait. The work is constant. The checks call the function with fixed times; they do not run a queue.',
  },
  'backend-claim-job': {
    plan: [
      'Define availability: due by now, and no lease or an expired one.',
      'Find the available job with the smallest runAt, earliest in the list on a tie.',
      'Return a new array with only that job leased and counted.',
    ],
    explanation: [
      'Trace a job whose lease ends exactly now.',
      'Explain why an expired lease can make a job run twice.',
      'Say what a real database adds so two workers cannot claim at once.',
    ],
    example:
      'I scan the jobs once, keeping the first available job with the smallest runAt, where available means runAt <= now and the lease is null or ends at or before now. With none, I return null and the jobs unchanged. Otherwise I map the jobs, copying the chosen one with attempts + 1 and a lease until now + leaseMs. The work is linear in the jobs. The checks call the function directly; they do not run workers at the same time.',
  },
  'backend-dedupe-deliveries': {
    plan: [
      'Load the processed IDs into a Set.',
      'Apply a new ID and add it at once; skip anything already in the Set.',
      'Return a copied, extended ID list.',
    ],
    explanation: [
      'Trace a batch with a repeat inside it and one from before.',
      'Explain why the ID, not the content, decides a repeat.',
      'Say where the processed IDs must be saved in a real handler.',
    ],
    example:
      "I put processedIds in a Set. For each message, an ID already in the Set is skipped; otherwise I add the amount to its account's balance, add the ID to the Set, and remember it for the result. processedIds in the result is a copy of the given list followed by the new IDs. The work is linear in the messages. The checks call the function directly, not a queue.",
  },
  'backend-outbox-relay': {
    plan: [
      'Pick the unpublished rows, sorted by id, up to batchSize.',
      'Publish in order, using one result per attempt, and stop at the first failure.',
      'Copy the rows in their original order with the new times.',
    ],
    explanation: [
      'Trace a run that stops in the middle of a batch.',
      'Explain why the relay stops instead of skipping a failed row.',
      'Explain how an event can be published twice.',
    ],
    example:
      'I filter rows with publishedAt null, sort a copy by numeric id, and keep the first batchSize. For attempt n I read results[n - 1]: true publishes the row at now, anything else stops the loop. Then I map the original rows, copying the published ones with publishedAt set. The work is O(n log n) for the sort. The checks call the function directly; they do not use a real broker.',
  },
  'backend-queue-simulation': {
    plan: [
      'Queue every job at time 0 with an increasing order number.',
      'Repeatedly run the entry with the smallest run time, then order number.',
      'Apply the retry policy to each failure and record the result.',
    ],
    explanation: [
      'Trace a tie between two retries at the same time.',
      'Explain why other jobs finish while a retry waits.',
      'Explain how finishedAt is decided.',
    ],
    example:
      'I keep a list of entries {id, runAt, attempts, order}, starting with every job at time 0. Each step removes the entry with the smallest runAt, then order, moves the clock to its runAt if later, and reads its outcome. ok completes it; permanent or the last allowed attempt adds a dead letter; otherwise I queue a new entry with the next order and the backed-off time. finishedAt is the clock after the last attempt. The checks call the function directly, not a real queue.',
  },
  'backend-token-bucket': {
    plan: [
      'Count the whole intervals since the last refill.',
      'Refill up to capacity and move the refill time by those intervals, or to now when full.',
      'Spend a token, or work out the wait for the next one.',
    ],
    explanation: [
      'Trace a request halfway between two tokens.',
      'Explain why the refill time does not jump to now every time.',
      'Say what capacity and the refill interval each control.',
    ],
    example:
      'added is Math.floor((now - updatedAt) / refillMs), and tokens is the smaller of capacity and the old tokens plus added. The refill time becomes now when the bucket is full, or else moves forward by added intervals. With a token I spend it and allow; without one I refuse with the time until updatedAt + refillMs. The work is constant. The checks pass times in directly; no clock or server runs.',
  },
  'backend-sliding-log': {
    plan: [
      'Keep the times inside (now - windowMs, now].',
      'Allow when the count is below the limit, with what remains.',
      'When refused, wait for the time at index count - limit, sorted, to leave.',
    ],
    explanation: [
      'Trace a request just after a fixed-window boundary.',
      'Explain the edge at exactly windowMs ago.',
      'Explain why more than one time may need to leave.',
    ],
    example:
      'I filter times to t > now - windowMs and t <= now and sort them. Below the limit I allow and report limit - count - 1 remaining. Otherwise I refuse; the count falls below the limit once the time at index count - limit has left, at that time plus windowMs. The work is O(n log n) for the sort. The checks pass times in directly, not a running server.',
  },
  'backend-limit-response': {
    plan: [
      'Build RateLimit-Limit and RateLimit-Remaining as text.',
      'Return 200 when allowed.',
      'Return 429 with Retry-After rounded up and at least 1 when refused.',
    ],
    explanation: ['Trace a 1200 ms wait.', 'Explain why Retry-After rounds up.', 'Say what the remaining header shows on a refusal.'],
    example:
      'I set RateLimit-Limit to String(limit) and RateLimit-Remaining to String(Math.max(0, remaining)) when allowed or "0" when refused. Allowed requests get 200. Refused ones get 429 and Retry-After set to String(Math.max(1, Math.ceil(retryAfterMs / 1000))). The work is constant. The checks call the function directly, not a real HTTP stack.',
  },
  'backend-sliding-counter': {
    plan: [
      'Find the start of the current fixed window.',
      'Work out how much of the previous window the sliding window still covers.',
      'Add that share of the previous count to the current count, rounded down.',
    ],
    explanation: [
      'Trace the estimate at the start and near the end of a window.',
      'Explain why multiplying before dividing matters.',
      'Say what the estimate assumes about the previous window.',
    ],
    example:
      'start is Math.floor(now / windowMs) × windowMs, and the sliding window still covers start + windowMs - now milliseconds of the previous window. used is currentCount plus Math.floor(previousCount × that overlap / windowMs), and the request is allowed when used is below the limit. The work is constant. The checks pass counts and times in directly; real traffic need not be spread evenly.',
  },
  'backend-limit-callers': {
    plan: [
      "Keep a bucket per key, full at the key's first request.",
      'Refill from the stored refill time by whole intervals.',
      'Spend a token or report the wait, saving the bucket either way.',
    ],
    explanation: [
      'Trace one key that is refused twice before a token arrives.',
      'Explain why keys never affect each other.',
      'Explain why a refused request spends nothing.',
    ],
    example:
      "I keep a Map from key to {tokens, refilledAt}, creating a full bucket at a key's first request. For each request I add whole intervals up to capacity, move the refill time by those intervals or to the request time when full, and then either spend a token or refuse with refilledAt + refillMs - at, saving the bucket in both cases. The work is linear in the requests. The checks pass the requests directly, not through a gateway.",
  },
  'backend-choose-version': {
    plan: [
      'Read a version from the first path segment, and the route path that remains.',
      'Read a version from a non-blank Api-Version header.',
      'Refuse a conflict, choose the named or default version, then check it is supported.',
    ],
    explanation: [
      'Trace a request whose path and header disagree.',
      'Explain why a request with no version gets the default and not the newest.',
      'Say why "v2x" is not a version.',
    ],
    example:
      'I take the first segment and test it against /^v[0-9]+$/; if it matches, the route is the rest of the path or "/". I find Api-Version by lowercased name and ignore a blank value. Two different versions give VERSION_CONFLICT; otherwise I use the named version or the fallback and return UNKNOWN_VERSION if it is not supported. The work is linear in the headers. The checks call the function directly, not a running server.',
  },
  'backend-classify-change': {
    plan: [
      'Collect and sort every field name from both sides.',
      'Decide for each field whether it was added, removed, or changed.',
      'Apply the rules for the side that reads the field, and let any breaking difference win.',
    ],
    explanation: [
      'Trace a field that is added as required to a request, then to a response.',
      'Explain why a type change breaks in both directions.',
      'Say what this check cannot see, such as changed meanings.',
    ],
    example:
      'I sort the union of field names. A field only in after is breaking for a request when it is required and compatible otherwise; a field only in before is breaking for a response and compatible for a request. For a field in both, a type change is breaking, and a required change is breaking when it asks more of the reader. Unchanged fields are skipped. The work is O(n log n) for the sort. The checks compare field lists, not real clients.',
  },
  'backend-deprecation-headers': {
    plan: [
      'Turn the three times into instants.',
      'Find the period now falls in: before deprecation, deprecated, or after sunset.',
      'Build the headers for that period.',
    ],
    explanation: [
      'Trace a request at the exact sunset time.',
      'Explain why the times must be compared as instants and not as text.',
      'Say what each of the three headers tells a client.',
    ],
    example:
      'I parse now, deprecatedAt, and sunsetAt with Date.parse. Before the deprecation I return 200 with no headers; at or after the sunset I return 410 with only Link; between them I return 200 with Deprecation "@" and the seconds, Sunset from toUTCString, and Link. The work is constant. The checks pass now in directly; no clock is read and no server runs.',
  },
  'backend-webhook-deliveries': {
    plan: [
      'Skip a delivery ID seen earlier as a duplicate.',
      'Skip a sequence not newer than the last applied for its resource as stale.',
      'Otherwise apply the status and remember the sequence.',
    ],
    explanation: [
      'Trace an older change that arrives after a newer one.',
      'Explain why a new delivery ID can still be stale.',
      'Say why sequences are kept per resource.',
    ],
    example:
      'I keep a Set of seen delivery IDs and a Map from resource to its last applied sequence. For each delivery, a seen ID is a DUPLICATE; otherwise I record the ID, and a sequence at or below the stored one is STALE. Anything else updates the state, the stored sequence, and the applied list. The work is linear in the deliveries. The checks pass a list of deliveries, not live webhook requests.',
  },
  'backend-downgrade-response': {
    plan: [
      'Keep the changes released after the pinned date.',
      'Sort them newest first.',
      'Undo each on a copy of the body: rename back, delete an added field, restore a removed one.',
    ],
    explanation: [
      'Trace two renames of the same field for a client pinned before both.',
      'Explain why the order of undoing matters.',
      'Say why a change on the pinned date stays.',
    ],
    example:
      'I copy the body, keep the changes whose version is later than pinned, and sort them newest first. A rename moves the value of to back to from when to is present; an add deletes the field; a remove sets the field to its old value. The work is O(c log c) for the sort plus the number of changes. The checks call the function directly, not a live API.',
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
  'concurrent-writes': {
    title: 'Make the check and the write one step',
    code: '-- Two steps: another write can land between them\nSELECT version FROM products WHERE id = 1;  -- 3\nUPDATE products SET price = 35 WHERE id = 1;\n\n-- One step: the database checks and writes together\nUPDATE products SET price = 35, version = version + 1\nWHERE id = 1 AND version = 3;  -- 0 rows changed means a conflict',
    reasoning:
      "A version check only protects a write if nothing can happen between the check and the write. Reading the version, comparing it in application code, and then updating leaves a gap in which another request can save. Putting the expected version in the UPDATE's WHERE clause makes the database do both at once: the row changes only if it still has version 3, and the number of changed rows says whether it did.",
    challenge:
      'Two requests run the two-step version at the same time against version 3. Describe an order of their four statements that loses an update, then say what each request sees with the one-step version.',
    answer:
      'If both SELECT statements run first, both see version 3 and both pass the check; both UPDATE statements then run, and the second replaces the first. With the one-step UPDATE, the first request changes one row and moves the record to version 4; the second finds no row with version 3, changes zero rows, and reports a conflict instead.',
  },
  'background-jobs': {
    title: 'Record the work and the message ID together',
    code: "BEGIN;\n  INSERT INTO processed (message_id) VALUES ('m-17');  -- fails if seen before\n  UPDATE accounts SET balance = balance + 500 WHERE id = 'a1';\nCOMMIT;",
    reasoning:
      'A handler that applies a message and then records its ID in a separate step can stop between the two; the message is delivered again, the ID is missing, and the work happens twice. Recording the ID in the same transaction as the work makes them succeed or fail together: either both are saved, and a repeat hits the unique ID and is skipped, or neither is, and the repeat does the work for the first time.',
    challenge:
      'A teammate moves the INSERT after COMMIT, as its own statement. Describe where the worker could stop so that 500 is added twice, then where it could stop without any harm.',
    answer:
      'If the worker stops after COMMIT but before the separate INSERT, the balance has changed but no ID was recorded, so the redelivered message passes the check and adds 500 again. Stopping before COMMIT is harmless: the transaction rolls back, nothing was applied, and the redelivery applies it once.',
  },
  'rate-limiting': {
    title: 'Refill from the last refill, not the last request',
    code: 'capacity 1, one token per 1000 ms, empty at 0\n\nrequest at 1500 → one token; count the next one from 1000\nnext token at 2000\n\nmistake: count from the request at 1500\nnext token at 2500',
    reasoning:
      'A token bucket promises one token per interval over the long run. Each refill adds only whole tokens, so the time since the last whole token is progress toward the next one. Moving the refill time to the request time throws that progress away: a caller who always arrives halfway between tokens gets one every 1500 ms instead of every 1000 ms. When the bucket is full there is no next token to work toward, so the refill time moves to now.',
    challenge:
      'A bucket with capacity 2 and one token per 1000 ms is empty at 0. Requests arrive at 1500, 2600, and 3100. Predict each decision with the correct rule, then with the "refill from the last request" mistake.',
    answer:
      'With the correct rule all three are allowed: 1500 gains one token and counts from 1000, 2600 gains one and counts from 2000, and 3100 gains one and counts from 3000. With the mistake, 1500 and 2600 are allowed but restart the count at their own times, so at 3100 only 500 ms have passed and the request is refused.',
  },
  'api-evolution': {
    title: 'The reader decides whether a change breaks',
    code: 'response: add "currency" (always present) → compatible\nrequest:  add "currency" (required)       → breaking\n\nresponse: "email" always present → may be missing → breaking\nrequest:  "email" required → optional            → compatible',
    reasoning:
      'The same edit to a field list can be safe or breaking depending on who reads the field. A response is read by clients, so it may give them more but never less: removing a field, changing its type, or letting it go missing breaks them. A request is read by the server, so it may ask clients for less but never more: a new required field or a field that becomes required breaks every client that does not send it.',
    challenge:
      'A team renames the response field "zip" to "postalCode" in one release. Classify that release as the field rules would, then propose a way to ship the rename without breaking existing clients.',
    answer:
      'The rules see two changes: "zip" removed, which is breaking for a response, and "postalCode" added, which is compatible. One safe path is to send both fields for a while, announce the deprecation of "zip" with a sunset date, and remove it only in a new version; or keep "zip" for clients pinned to older versions by undoing the rename for them.',
  },
}
