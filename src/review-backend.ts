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
}
