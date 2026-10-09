import { asyncRepDepth, asyncGuides } from './review-async.ts'
import type { RepDepth } from './rep-depth.ts'
import type { LessonDepth } from './lesson-depth.ts'

export const practicalRepDepth: Record<string, RepDepth> = {
  ...asyncRepDepth,
  "closure-counters": {
    "reasoning": "Each call to the factory creates its own count. The returned function keeps that count between calls. The trace calls counters in the supplied order.",
    "trace": "Starts [0,10] create two environments. Calls [0,0,1,0] produce [1,2,11,3]; counter 1 does not affect counter 0.",
    "alternative": "A class can also encapsulate a count; a closure needs no public object field. A global variable would share state unintentionally. Creating k counters and processing n calls takes O(k+n) time and O(k) working state.",
    "counterexample": "A global count produces 12 for the final call instead of 3. Recreating a counter on every call loses its previous value.",
    "transfer": "Let each counter support reset. Decide which callbacks must share the same binding."
  },
  "reference-groups": {
    "reasoning": "Identity is preserved when each selection reuses an object created once for its pool position.",
    "trace": "Pool [7,7] creates A and B. Indices [0,1,0] select A,B,A; the Set contains two references.",
    "alternative": "A Set of indices happens to give the same count here but does not practise object identity. A Set of IDs changes the contract. O(k+n) time and O(k+n) storage bounds include construction and selection.",
    "counterexample": "Deduplicating IDs returns 1 for [7,7] selected at [0,1]. Constructing an object per selection returns 3 for one repeated index.",
    "transfer": "Group records by business ID instead. Explain why equality rules now differ."
  },
  "event-loop-order": {
    "reasoning": "The current script finishes first. Queued microtasks run next, followed by timer tasks.",
    "trace": "Encounter A,T,P,B: A and B execute now, P at the checkpoint, T in a later task, producing A,B,P,T.",
    "alternative": "Three filter passes are clear and O(n); three queues also take O(n) and avoid repeated scans. A priority sort may cost more and must preserve within-kind order.",
    "counterexample": "Returning encounter order puts T before B. Sorting labels alphabetically loses queue order.",
    "transfer": "Allow a microtask to enqueue another microtask. Which queue is drained before the first timer?"
  },
  "promise-outcomes": {
    "reasoning": "The discriminant determines which payload exists. Recording both branches retains partial success without inventing defaults.",
    "trace": "Fulfilled 0 is appended to values; rejected Offline to errors; fulfilled 4 yields {values:[0,4], errors:[Offline]}.",
    "alternative": "Two filter/map pipelines are readable; one loop collects both results without intermediate arrays. Both are O(n) time with O(n) output storage.",
    "counterexample": "if (outcome.value) drops zero and does not narrow rejected records safely.",
    "transfer": "Change the contract to fail the whole batch on any rejection. Compare that policy with Promise.all."
  },
  "singleton-owner": {
    "reasoning": "Each owner caches one reference. Reference-keyed bookkeeping assigns the same identity number to repeated access and distinct numbers across owners.",
    "trace": "Accesses 0,0,1,0,1 see A,A,B,A,B, so identities are 1,1,2,1,2.",
    "alternative": "A global singleton is shorter but violates separate owners; explicitly passing instances also makes sharing visible. Construction plus n accesses costs O(k+n) with O(k) owner and identity state.",
    "counterexample": "Creating {} on every getter call produces 1,2,3 rather than 1,1,2. A single global object merges distinct owners.",
    "transfer": "Allow an owner to reset after logout. Decide when the old resource must be disposed."
  },
  "pubsub-trace": {
    traceSteps: {"code": ["function deliveries(events: BusEvent[]): string[] {", "  const topics = new Map<string, string[]>(), out: string[] = []", "  for (const e of events) {", "    const list = topics.get(e.topic) ?? []", "    topics.set(e.topic, list)", "    if (e.kind === 'subscribe' && !list.includes(e.listener)) list.push(e.listener)", "    else if (e.kind === 'unsubscribe') { const i = list.indexOf(e.listener); if (i >= 0) list.splice(i, 1) }", "    else if (e.kind === 'publish') for (const l of list) out.push(`${l}:${e.value}`)", "  }", "  return out", "}"], "input": "events = [{kind: \"subscribe\", topic: \"x\", listener: \"A\"}, {kind: \"subscribe\", topic: \"x\", listener: \"B\"}, {kind: \"unsubscribe\", topic: \"x\", listener: \"A\"}, {kind: \"subscribe\", topic: \"x\", listener: \"A\"}, {kind: \"publish\", topic: \"x\", value: \"1\"}]", "steps": [{"line": 1, "vars": {}, "structure": {"kind": "state", "entries": [["listeners on x", "[]"], ["deliveries", "[]"]], "events": ["subscribe x A", "subscribe x B", "unsubscribe x A", "subscribe x A", "publish x \"1\""]}, "note": "No topics and no deliveries yet. Five events are still to come."}, {"line": 5, "vars": {"event": "subscribe A"}, "structure": {"kind": "state", "entries": [["listeners on x", "[A]"], ["deliveries", "[]"]], "events": ["subscribe x A", "subscribe x B", "unsubscribe x A", "subscribe x A", "publish x \"1\""], "eventIndex": 0}, "note": "A joins topic x."}, {"line": 5, "vars": {"event": "subscribe B"}, "structure": {"kind": "state", "entries": [["listeners on x", "[A, B]"], ["deliveries", "[]"]], "events": ["subscribe x A", "subscribe x B", "unsubscribe x A", "subscribe x A", "publish x \"1\""], "eventIndex": 1}, "note": "B joins after A, so the order is A then B."}, {"line": 6, "vars": {"event": "unsubscribe A"}, "structure": {"kind": "state", "entries": [["listeners on x", "[B]"], ["deliveries", "[]"]], "events": ["subscribe x A", "subscribe x B", "unsubscribe x A", "subscribe x A", "publish x \"1\""], "eventIndex": 2}, "note": "A is removed from x."}, {"line": 5, "vars": {"event": "subscribe A"}, "structure": {"kind": "state", "entries": [["listeners on x", "[B, A]"], ["deliveries", "[]"]], "events": ["subscribe x A", "subscribe x B", "unsubscribe x A", "subscribe x A", "publish x \"1\""], "eventIndex": 3}, "note": "Re-subscribing places A last, behind B."}, {"line": 7, "vars": {"event": "publish 1"}, "structure": {"kind": "state", "entries": [["listeners on x", "[B, A]"], ["deliveries", "[\"B:1\",\"A:1\"]"]], "events": ["subscribe x A", "subscribe x B", "unsubscribe x A", "subscribe x A", "publish x \"1\""], "eventIndex": 4}, "note": "Publishing walks the current listeners in order: B first, then A."}, {"line": 9, "vars": {"result": "[\"B:1\",\"A:1\"]"}, "structure": {"kind": "state", "entries": [["listeners on x", "[B, A]"], ["deliveries", "[\"B:1\",\"A:1\"]"]], "events": ["subscribe x A", "subscribe x B", "unsubscribe x A", "subscribe x A", "publish x \"1\""], "eventIndex": 4}, "note": "Return the deliveries in registration order."}]},
    "reasoning": "A topic-specific ordered registration set represents exactly the current subscribers; publishing reads only that set.",
    "trace": "A subscribes to x, receives x:1, then unsubscribes. Publishing x:2 adds no delivery. Remove and re-add A after B produces B:v,A:v.",
    "alternative": "A direct observer list is enough for one subject; topic routing is useful for multiple event names. Processing cost includes every delivery, O(n+d) expected with maps/sets, and output storage is O(d).",
    "counterexample": "One global listener set sends x events to y listeners. Allowing duplicate registration emits A:0 twice.",
    "transfer": "Let a callback unsubscribe another callback during publication. Define snapshot versus live delivery before implementing it."
  },
  "injected-clock": {
    "reasoning": "A single clock read per decision gives the comparison one defined timestamp. Injection makes equality and call count observable without real time.",
    "trace": "Deadline 100 compares with 99,100,101, yielding false,true,true and exactly three total clock calls.",
    "alternative": "Passing a timestamp directly is simpler for a pure calculation; a callback models code that obtains time at the decision boundary. Both use O(n) time for the trace and O(n) output storage.",
    "counterexample": "Using > marks time 100 as unexpired. Calling now twice can consume two fake values and make one decision inconsistent.",
    "transfer": "Inject a stock repository instead of a clock. What minimal methods does the caller actually need?"
  },
  "debounce-schedule": {
    traceSteps: {"code": ["function debounceSchedule(events: {at: number; value: string}[], wait: number): {at: number; value: string}[] {", "  const out: {at: number; value: string}[] = []", "  let pending: {at: number; value: string} | null = null", "  for (const e of events) {", "    if (pending && e.at >= pending.at) out.push(pending)", "    pending = {at: e.at + wait, value: e.value}", "  }", "  if (pending) out.push(pending)", "  return out", "}"], "input": "events = [{at: 0, value: \"A\"}, {at: 60, value: \"B\"}, {at: 160, value: \"C\"}], wait = 100", "steps": [{"line": 2, "vars": {"wait": 100}, "structure": {"kind": "state", "entries": [["pending", "none"], ["emitted", "[]"]], "events": ["0: A", "60: B", "160: C"]}, "note": "Nothing is pending. This example has an event exactly at a deadline."}, {"line": 5, "vars": {"event": "0: A"}, "structure": {"kind": "state", "entries": [["pending", "A due at 100"], ["emitted", "[]"]], "events": ["0: A", "60: B", "160: C"], "eventIndex": 0}, "note": "A arrives at 0, so it is pending and due at 0 + 100."}, {"line": 5, "vars": {"event": "60: B"}, "structure": {"kind": "state", "entries": [["pending", "B due at 160"], ["emitted", "[]"]], "events": ["0: A", "60: B", "160: C"], "eventIndex": 1}, "note": "B arrives at 60, before A is due at 100, so B replaces A. A is never emitted."}, {"line": 4, "vars": {"event": "160: C"}, "structure": {"kind": "state", "entries": [["pending", "B due at 160"], ["emitted", "[{\"at\":160,\"value\":\"B\"}]"]], "events": ["0: A", "60: B", "160: C"], "eventIndex": 2}, "note": "C arrives at 160, exactly when B is due. The rule is >=, so B is emitted first."}, {"line": 5, "vars": {"event": "160: C"}, "structure": {"kind": "state", "entries": [["pending", "C due at 260"], ["emitted", "[{\"at\":160,\"value\":\"B\"}]"]], "events": ["0: A", "60: B", "160: C"], "eventIndex": 2}, "note": "Then C starts a new wait, due at 160 + 100."}, {"line": 7, "vars": {"event": "end"}, "structure": {"kind": "state", "entries": [["pending", "none"], ["emitted", "[{\"at\":160,\"value\":\"B\"},{\"at\":260,\"value\":\"C\"}]"]], "events": ["0: A", "60: B", "160: C"], "eventIndex": 2}, "note": "After the last event, the pending C is emitted at 260."}, {"line": 8, "vars": {"result": "[{\"at\":160,\"value\":\"B\"},{\"at\":260,\"value\":\"C\"}]"}, "structure": {"kind": "state", "entries": [["pending", "none"], ["emitted", "[{\"at\":160,\"value\":\"B\"},{\"at\":260,\"value\":\"C\"}]"]], "events": ["0: A", "60: B", "160: C"], "eventIndex": 2}, "note": "Return both emissions."}]},
    "reasoning": "The pending record is always the latest event not yet emitted. Testing its deadline before replacement preserves the explicit equality policy.",
    "trace": "At 60, A’s deadline 100 has not arrived, so replace it with B at 160. At 200, emit B and schedule C at 300.",
    "alternative": "A real implementation uses a replaceable timer; this trace uses timestamps to test the policy deterministically. A scan costs O(n) time and O(1) working state apart from output.",
    "counterexample": "Using > at the deadline drops A when B arrives exactly at 100; the contract requires A first.",
    "transfer": "Add a cancel event or a maximum wait. Specify whether an event at that boundary is processed before or after a scheduled emission."
  },
  "leading-throttle": {
    "reasoning": "The last accepted timestamp anchors the suppression window, so each emitted pair is separated by at least window.",
    "trace": "With [5,14,15] and window 10, 5 is accepted, 14 suppressed, and 15 accepted; 14 does not move the anchor.",
    "alternative": "Fixed interval buckets produce different boundaries; a trailing throttle also keeps pending state. This leading-only scan is O(n) time and O(1) extra working space.",
    "counterexample": "Updating the anchor for 14 suppresses 15 incorrectly. A falsy check for the last timestamp mishandles zero.",
    "transfer": "Add a trailing emission containing the latest suppressed value. Define what happens when it shares a timestamp with a new event."
  },
  "latest-request": {
    "reasoning": "Ownership, rather than arrival time, controls which result can update state. Clearing on start is an explicit policy of this exercise.",
    "trace": "A starts, B replaces A, B resolves to new, and A’s later old payload is ignored. Cancelling A afterward cannot clear B.",
    "alternative": "Abort saves supported work; an identity guard still protects visible state. Some products keep stale content while loading, but this exercise deliberately clears it. The scan uses O(n) time and O(1) state.",
    "counterexample": "Applying every resolve displays old after new. Clearing on any cancel erases a newer request’s result.",
    "transfer": "Keep stale data while reloading and display an error only for the current request. Specify the precedence rules."
  },
  "websocket-gate": {
    "reasoning": "A send is accepted only while the connection is open. The state guard prevents disconnected sends from entering the output.",
    "trace": "early arrives disconnected and is dropped; open permits ok; close makes late ineligible.",
    "alternative": "Queuing sends is possible but needs bounds and replay semantics. This dropping model has O(n) processing time and O(1) state plus sent-message output.",
    "counterexample": "Accepting sends after construction assumes connection completion. Recording send output still does not prove server receipt.",
    "transfer": "Queue at most five messages while connecting. Decide what to drop and whether replaying a command needs an idempotency key."
  },
  "choose-live-transport": {
    "reasoning": "The precedence matches the strongest required capability; the serverPush flag must not override twoWay.",
    "trace": "true,true selects websocket; false,true selects sse; false,false selects polling.",
    "alternative": "Real selection also considers proxies, authentication, traffic and operational support. An HTTP action plus SSE can be enough when same-connection bidirectionality is not required. This decision takes O(1) time and space.",
    "counterexample": "Checking serverPush first returns sse for true,true and fails the same-connection requirement.",
    "transfer": "Add an infrastructure constraint that forbids persistent connections. How does that change the feasible choices?"
  },
  "shared-resource": {
    "reasoning": "The set equals current ownership, so duplicate operations cannot corrupt a numeric count. Only transitions across zero change the resource lifetime.",
    "trace": "A opens, B joins, A leaves with B still active, and B’s departure closes. A second release does nothing.",
    "alternative": "A plain refCount is smaller but needs exactly-once release handles. A set of IDs supports this exercise’s idempotent named leases. O(n) expected time and O(k) state for k active consumers.",
    "counterexample": "Closing on every release breaks B’s active connection when A leaves. Decrementing unknown releases makes the count negative.",
    "transfer": "Change the account while consumers are active. Decide whether their leases migrate or must reacquire a newly scoped resource."
  },
  "cache-freshness": {
    "reasoning": "An entry must satisfy both identity and freshness; neither alone establishes a hit.",
    "trace": "Key a with value 0 and expiry 10 returns 0 at time 9 but null at time 10.",
    "alternative": "A Map improves repeated key lookup compared with this O(n) scan, at the cost of stored indexing. Stale-while-revalidate is another policy and must label stale results separately. This function uses O(1) working memory.",
    "counterexample": "Using <= serves expired data at 10. A truthy value test drops a valid cached zero.",
    "transfer": "Cache a query by account and filter. Define an unambiguous composite key and invalidation after a write."
  },
  "retry-backoff": {
    "reasoning": "Each delay is the exponential sequence clamped at cap, so growth cannot produce a scheduled delay above the permitted limit.",
    "trace": "100 doubles to 200 then 400; the next 800 is clamped to 500 and later delays remain 500.",
    "alternative": "A fixed delay is simpler but can retry too aggressively during sustained failure. Iteratively clamping avoids unnecessary large powers. The sequence costs O(n) time and O(n) output space.",
    "counterexample": "Starting at base*2 skips the initial 100. Applying the cap only at the end leaves intermediate delays above it.",
    "transfer": "Add bounded jitter with an injected random source, and stop after a maximum number of eligible attempts."
  },
  "idempotent-ledger": {
    "reasoning": "The first recorded payload fixes each key’s operation. Subsequent matching deliveries have no additional effect and mismatches cannot replace it.",
    "trace": "K:5 contributes 5, its retry contributes 0, K:9 records a conflict, and L:5 contributes 5 for total 10.",
    "alternative": "A Set only records that a key occurred and cannot detect changed payloads. A durable server needs atomic storage and an explicit scope. This model costs O(n) expected time and O(k) key state plus conflicts.",
    "counterexample": "Checking map.get(key) for truthiness loses the zero operation. Replacing K’s stored amount on conflict lets later retries change meaning.",
    "transfer": "Include account and endpoint in the key scope, and handle concurrent requests with one durable transaction."
  },
  "optimistic-balance": {
    "reasoning": "Each operation contributes at most once: either tentatively in pending or permanently in confirmed. Failure removes only its own tentative contribution.",
    "trace": "Initial 10 plus A:2 and B:3 displays 15. B success makes confirmed 13 while A remains pending. A failure leaves confirmed and displayed at 13.",
    "alternative": "A single rollback snapshot is simpler for one isolated operation but wrong for concurrent independent changes. A map makes ownership explicit. O(n+k) expected processing with O(k) operation state; output is constant size.",
    "counterexample": "Restoring A’s initial snapshot after B succeeds resets 13 to 10 and erases B. Not remembering settled IDs lets a reused ID apply twice.",
    "transfer": "Handle replacing a title rather than adding a number. Define conflict ordering and reconciliation against a server version."
  },
  "subscription-cleanup": {
    "reasoning": "Cleanup belongs to an owner, so disposing one owner cannot remove another’s registration to the same topic.",
    "trace": "A:x, B:x, A:y produce counts 1,2,3. Disposing A removes its two registrations and leaves B:x at count 1.",
    "alternative": "Nested sets avoid ambiguous concatenated keys; filtering a registration list is simpler but repeatedly scans it. Map/set bookkeeping uses O(n) expected time and O(k) active registration state plus output.",
    "counterexample": "Clearing all listeners on A disposal removes B incorrectly. Joining owner and topic with a colon merges (a:b,c) with (a,b:c).",
    "transfer": "Give each registration an unsubscribe handle so one owner can release one topic without disposing all of them."
  },
  "room-leases": {
    "reasoning": "Each room owns an independent membership set; only a genuine positive-to-zero transition reports it as emptied.",
    "trace": "A and B occupy x, A occupies y. A leaves x but B remains; A leaves y and emits y; B leaves x and emits x.",
    "alternative": "A single total user count cannot identify which room becomes empty. Nested sets give expected O(n) processing and O(k) live membership state plus output.",
    "counterexample": "Emitting on every leave from an empty room falsely reports absent room z. A global set removes A from both rooms at once.",
    "transfer": "Add a disconnect event that removes one user from every room. State the output ordering when multiple rooms become empty."
  }
}

export const practicalLessonDepth: Record<string, LessonDepth> = {
  "closures": {
    "title": "A returned function keeps its own variables.",
    "code": "function makeCounter() {\n  let count = 0\n  return () => ++count\n}\nconst a = makeCounter(), b = makeCounter()\na() // 1\na() // 2\nb() // 1",
    "reasoning": "Each call to the factory creates its own count. The returned function keeps that count between calls. The trace calls counters in the supplied order.",
    "challenge": "If two callbacks returned by one factory both read count, do they share it? What changes when the factory runs twice?",
    "answer": "Functions returned by one factory call share its count. Calling the factory again creates a separate count."
  },
  "reference-identity": {
    "title": "Equal fields do not make objects the same.",
    "code": "const original = { meta: { score: 1 } }\nconst alias = original\nconst copy = { ...original }\nalias === original // true\ncopy === original // false\ncopy.meta === original.meta // true",
    "reasoning": "Identity is preserved when each selection reuses an object created once for its pool position.",
    "challenge": "After copy.meta.score = 9 in the example, what is original.meta.score?",
    "answer": "It is 9 because the nested meta object is shared. Copy meta too before changing it."
  },
  "event-loop": {
    "title": "Microtasks run before the next timer task.",
    "code": "console.log(\"A\")\nsetTimeout(() => console.log(\"timer\"), 0)\nPromise.resolve().then(() => console.log(\"promise\"))\nconsole.log(\"B\")\n// A, B, promise, timer",
    "reasoning": "The current script finishes first. Queued microtasks run next, followed by timer tasks.",
    "challenge": "Can a long chain of microtasks make a zero-delay timer wait?",
    "answer": "Yes. Each new microtask runs before the next timer task. A chain that never ends can keep the timer waiting."
  },
  "singleton": {
    "title": "Each owner shares its own instance.",
    "code": "function createOwner() {\n  let shared: object | undefined\n  return () => shared ??= {}\n}\nconst get = createOwner()\nget() === get() // true\ncreateOwner()() === get() // false",
    "reasoning": "Each owner caches one reference. Reference-keyed bookkeeping assigns the same identity number to repeated access and distinct numbers across owners.",
    "challenge": "What breaks if two accounts share a socket whose URL was captured for the first account?",
    "answer": "The second account uses the wrong resource. Scope ownership by account and dispose the old instance when that boundary changes."
  },
  "events": {
    "title": "Only current listeners receive a publish.",
    "code": "const stop = bus.subscribe(\"stock\", value => console.log(value))\nbus.publish(\"stock\", 3) // listener receives 3\nstop()\nbus.publish(\"stock\", 4) // no delivery to this registration",
    "reasoning": "A topic-specific ordered registration set represents exactly the current subscribers; publishing reads only that set.",
    "challenge": "Should a subscriber added during publish receive that same event?",
    "answer": "It depends on the authored policy. Snapshot delivery excludes registrations added mid-publication; document and test that choice."
  },
  "dependency-injection": {
    "title": "A supplied clock makes time decisions testable.",
    "code": "function expired(deadline: number, now: () => number) {\n  return now() >= deadline\n}\nexpired(100, () => 100) // true\nexpired(100, Date.now) // uses a real clock",
    "reasoning": "A single clock read per decision gives the comparison one defined timestamp. Injection makes equality and call count observable without real time.",
    "challenge": "Can an injected dependency still mutate state?",
    "answer": "Yes. Injection makes dependency choice explicit; side effects depend on the supplied implementation."
  },
  "debouncing": {
    "title": "Debounce waits for a quiet period.",
    "code": "// Quiet period: 100 ms; trailing only.\n// Events: A at 0, B at 60, C at 200.\n// Emit B at 160, C at 300.\n// A is replaced before its deadline.",
    "reasoning": "The pending record is always the latest event not yet emitted. Testing its deadline before replacement preserves the explicit equality policy.",
    "challenge": "How would a leading debounce differ from this example?",
    "answer": "It may invoke immediately at the beginning of a burst. Combining leading and trailing behavior needs a separate contract and checks."
  },
  "throttling": {
    "title": "Throttle measures from the last accepted event.",
    "code": "// Leading throttle, window 100 ms.\n// Inputs at 0, 60, 100, 150, 200.\n// Accepted at 0, 100, 200.\n// Rejected events do not move the window.",
    "reasoning": "The last accepted timestamp anchors the suppression window, so each emitted pair is separated by at least window.",
    "challenge": "Why might a debounce never run during continuous typing while a throttle does?",
    "answer": "The debounce keeps resetting its quiet-period deadline. A throttle permits new executions once the previous accepted window ends."
  },
  "request-ownership": {
    "title": "Only the current request may update its screen.",
    "code": "let current = 0\nasync function load(url: string) {\n  const mine = ++current\n  const data = await fetch(url).then(r => r.json())\n  if (mine === current) show(data)\n}\n// Also handle HTTP errors, failures, and cleanup in real code.",
    "reasoning": "Ownership, rather than arrival time, controls which result can update state. A pending owner ends on settlement. Ownership is scoped to the surface: one search screen can have one owner, while several preview slots need separate owners. Clearing data on start and preserving it during refresh are different display contracts.",
    "challenge": "Cover starts load A, then detail starts load B. Can one global current token safely allow both previews to complete? Explain how removal and duplicate completion should affect ownership.",
    "answer": "No: B would obsolete A even though the slots are independent. Each slot needs its own pending identity. Removing a slot removes that ownership; accepting its result ends the load so duplicates are ignored. Unsupported cancellation may leave work running, but the ownership check can still reject its obsolete result."
  },
  "websockets": {
    "title": "A send needs an open connection.",
    "code": "const socket = new WebSocket(\"wss://example.test/live\")\nsocket.addEventListener(\"open\", () => {\n  socket.send(JSON.stringify({ type: \"subscribe\", room: \"stock\" }))\n})\n// Dispose the connection and listeners when its owner ends.",
    "reasoning": "A send is accepted only while the connection is open. The state guard prevents disconnected sends from entering the output.",
    "challenge": "If send returns, has the server necessarily processed the message?",
    "answer": "No. Local transport acceptance is not an application-level acknowledgment; design a reply or acknowledgment when required."
  },
  "live-transports": {
    "title": "Choose a transport from the required directions.",
    "code": "const stream = new EventSource(\"/updates\")\nstream.addEventListener(\"message\", event => {\n  console.log(event.data)\n})\n// stream.close() stops this owner’s stream.\n// A separate POST can send a user action.",
    "reasoning": "The precedence matches the strongest required capability; the serverPush flag must not override twoWay.",
    "challenge": "If an SSE stream reconnects with a last event ID, are missed messages always recovered?",
    "answer": "No. Recovery requires a server that retains and replays events for that ID; IDs alone do not create a replay store."
  },
  "resource-ownership": {
    "title": "Close a shared resource when its last consumer leaves.",
    "code": "// acquire A: 0 → 1, open resource\n// acquire B: 1 → 2, keep resource\n// release A: 2 → 1, keep resource\n// release B: 1 → 0, close resource",
    "reasoning": "The set equals current ownership, so duplicate operations cannot corrupt a numeric count. Only transitions across zero change the resource lifetime.",
    "challenge": "Why should closing a shared connection intentionally cancel a pending reconnect?",
    "answer": "The owner has ended. Reconnecting would create work without a live consumer and can reopen a logged-out session."
  },
  "caching": {
    "title": "A cached value is usable only before expiry.",
    "code": "const entry = { value: 0, expiresAt: 100 }\nconst now = 100\nconst hit = now < entry.expiresAt // false\n// value 0 is valid data, not a cache miss.",
    "reasoning": "An entry must satisfy both identity and freshness; neither alone establishes a hit.",
    "challenge": "Can a fresh TTL entry still differ from the server?",
    "answer": "Yes. The server may change before expiry. TTL is a freshness policy, not a guarantee of immediate consistency."
  },
  "retries": {
    "title": "Retry delays grow only up to the cap.",
    "code": "// Base 100 ms, cap 500 ms, no jitter.\n// Failure indices 0,1,2,3 produce 100,200,400,500.\n// Success resets the next index to 0.",
    "reasoning": "Each delay is the exponential sequence clamped at cap, so growth cannot produce a scheduled delay above the permitted limit.",
    "challenge": "With base 100 ms and cap 500 ms, what are the delays for failure indices 3 and 4? Why do they stop growing?",
    "answer": "Both delays are 500 ms. The cap limits each delay even when doubling would produce a larger value."
  },
  "idempotency": {
    "title": "Repeating the same request must not repeat its effect.",
    "code": "// key K, amount 5: apply +5 and store result\n// retry key K, amount 5: return stored outcome, add nothing\n// key K, amount 9: conflict, add nothing\n// key L, amount 5: a different operation, apply +5",
    "reasoning": "The first recorded payload fixes each key’s operation. Subsequent matching deliveries have no additional effect and mismatches cannot replace it.",
    "challenge": "Why can a timeout still require an idempotency key on retry?",
    "answer": "The server may have committed the first request before the client timed out. The same logical key lets the retry reuse that result."
  },
  "optimistic-updates": {
    "title": "Failed changes remove only their own pending contribution.",
    "code": "// Confirmed balance 10.\n// Pending A:+2 and B:+3 → display 15.\n// B succeeds → confirmed 13, pending A:+2 → display 15.\n// A fails → confirmed 13, pending empty → display 13.",
    "reasoning": "Each operation contributes at most once: either tentatively in pending or permanently in confirmed. Failure removes only its own tentative contribution.",
    "challenge": "Why is a ledger of deltas insufficient for two concurrent edits replacing the same title?",
    "answer": "Replacement is not additive and order matters. Use versions, a defined ordering, or reconciliation with the authoritative server result."
  }
}

export const practicalGuides = {
  ...asyncGuides,
  "closure-counters": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "Each call to the factory creates its own count. The returned function keeps that count between calls. The trace calls counters in the supplied order.",
      "A class can also encapsulate a count; a closure needs no public object field. A global variable would share state unintentionally. Creating k counters and processing n calls takes O(k+n) time and O(k) working state.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Starts [0,10] create two environments. Calls [0,0,1,0] produce [1,2,11,3]; counter 1 does not affect counter 0."
  },
  "reference-groups": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "Identity is preserved when each selection reuses an object created once for its pool position.",
      "A Set of indices happens to give the same count here but does not practise object identity. A Set of IDs changes the contract. O(k+n) time and O(k+n) storage bounds include construction and selection.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Pool [7,7] creates A and B. Indices [0,1,0] select A,B,A; the Set contains two references."
  },
  "event-loop-order": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "The current script finishes first. Queued microtasks run next, followed by timer tasks.",
      "Three filter passes are clear and O(n); three queues also take O(n) and avoid repeated scans. A priority sort may cost more and must preserve within-kind order.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Encounter A,T,P,B: A and B execute now, P at the checkpoint, T in a later task, producing A,B,P,T."
  },
  "promise-outcomes": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "The discriminant determines which payload exists. Recording both branches retains partial success without inventing defaults.",
      "Two filter/map pipelines are readable; one loop collects both results without intermediate arrays. Both are O(n) time with O(n) output storage.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Fulfilled 0 is appended to values; rejected Offline to errors; fulfilled 4 yields {values:[0,4], errors:[Offline]}."
  },
  "singleton-owner": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "Each owner caches one reference. Reference-keyed bookkeeping assigns the same identity number to repeated access and distinct numbers across owners.",
      "A global singleton is shorter but violates separate owners; explicitly passing instances also makes sharing visible. Construction plus n accesses costs O(k+n) with O(k) owner and identity state.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Accesses 0,0,1,0,1 see A,A,B,A,B, so identities are 1,1,2,1,2."
  },
  "pubsub-trace": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "A topic-specific ordered registration set represents exactly the current subscribers; publishing reads only that set.",
      "A direct observer list is enough for one subject; topic routing is useful for multiple event names. Processing cost includes every delivery, O(n+d) expected with maps/sets, and output storage is O(d).",
      "Explain the limits of these deterministic checks."
    ],
    "example": "A subscribes to x, receives x:1, then unsubscribes. Publishing x:2 adds no delivery. Remove and re-add A after B produces B:v,A:v."
  },
  "injected-clock": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "A single clock read per decision gives the comparison one defined timestamp. Injection makes equality and call count observable without real time.",
      "Passing a timestamp directly is simpler for a pure calculation; a callback models code that obtains time at the decision boundary. Both use O(n) time for the trace and O(n) output storage.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Deadline 100 compares with 99,100,101, yielding false,true,true and exactly three total clock calls."
  },
  "debounce-schedule": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "The pending record is always the latest event not yet emitted. Testing its deadline before replacement preserves the explicit equality policy.",
      "A real implementation uses a replaceable timer; this trace uses timestamps to test the policy deterministically. A scan costs O(n) time and O(1) working state apart from output.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "At 60, A’s deadline 100 has not arrived, so replace it with B at 160. At 200, emit B and schedule C at 300."
  },
  "leading-throttle": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "The last accepted timestamp anchors the suppression window, so each emitted pair is separated by at least window.",
      "Fixed interval buckets produce different boundaries; a trailing throttle also keeps pending state. This leading-only scan is O(n) time and O(1) extra working space.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "With [5,14,15] and window 10, 5 is accepted, 14 suppressed, and 15 accepted; 14 does not move the anchor."
  },
  "latest-request": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "Ownership, rather than arrival time, controls which result can update state. Clearing on start is an explicit policy of this exercise.",
      "Abort saves supported work; an identity guard still protects visible state. Some products keep stale content while loading, but this exercise deliberately clears it. The scan uses O(n) time and O(1) state.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "A starts, B replaces A, B resolves to new, and A’s later old payload is ignored. Cancelling A afterward cannot clear B."
  },
  "websocket-gate": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "A send is accepted only while the connection is open. The state guard prevents disconnected sends from entering the output.",
      "Queuing sends is possible but needs bounds and replay semantics. This dropping model has O(n) processing time and O(1) state plus sent-message output.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "early arrives disconnected and is dropped; open permits ok; close makes late ineligible."
  },
  "choose-live-transport": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "The precedence matches the strongest required capability; the serverPush flag must not override twoWay.",
      "Real selection also considers proxies, authentication, traffic and operational support. An HTTP action plus SSE can be enough when same-connection bidirectionality is not required. This decision takes O(1) time and space.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "true,true selects websocket; false,true selects sse; false,false selects polling."
  },
  "shared-resource": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "The set equals current ownership, so duplicate operations cannot corrupt a numeric count. Only transitions across zero change the resource lifetime.",
      "A plain refCount is smaller but needs exactly-once release handles. A set of IDs supports this exercise’s idempotent named leases. O(n) expected time and O(k) state for k active consumers.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "A opens, B joins, A leaves with B still active, and B’s departure closes. A second release does nothing."
  },
  "cache-freshness": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "An entry must satisfy both identity and freshness; neither alone establishes a hit.",
      "A Map improves repeated key lookup compared with this O(n) scan, at the cost of stored indexing. Stale-while-revalidate is another policy and must label stale results separately. This function uses O(1) working memory.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Key a with value 0 and expiry 10 returns 0 at time 9 but null at time 10."
  },
  "retry-backoff": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "Each delay is the exponential sequence clamped at cap, so growth cannot produce a scheduled delay above the permitted limit.",
      "A fixed delay is simpler but can retry too aggressively during sustained failure. Iteratively clamping avoids unnecessary large powers. The sequence costs O(n) time and O(n) output space.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "100 doubles to 200 then 400; the next 800 is clamped to 500 and later delays remain 500."
  },
  "idempotent-ledger": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "The first recorded payload fixes each key’s operation. Subsequent matching deliveries have no additional effect and mismatches cannot replace it.",
      "A Set only records that a key occurred and cannot detect changed payloads. A durable server needs atomic storage and an explicit scope. This model costs O(n) expected time and O(k) key state plus conflicts.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "K:5 contributes 5, its retry contributes 0, K:9 records a conflict, and L:5 contributes 5 for total 10."
  },
  "optimistic-balance": {
    "plan": [
      "Restate the contract and its boundary rules.",
      "Choose state with a meaning you can trace."
    ],
    "explanation": [
      "Each operation contributes at most once: either tentatively in pending or permanently in confirmed. Failure removes only its own tentative contribution.",
      "A single rollback snapshot is simpler for one isolated operation but wrong for concurrent independent changes. A map makes ownership explicit. O(n+k) expected processing with O(k) operation state; output is constant size.",
      "Explain the limits of these deterministic checks."
    ],
    "example": "Initial 10 plus A:2 and B:3 displays 15. B success makes confirmed 13 while A remains pending. A failure leaves confirmed and displayed at 13."
  },
  "subscription-cleanup": {
    "plan": [
      "State the ownership boundary.",
      "Trace duplicate and absent operations."
    ],
    "explanation": [
      "Cleanup belongs to an owner, so disposing one owner cannot remove another’s registration to the same topic.",
      "Nested sets avoid ambiguous concatenated keys; filtering a registration list is simpler but repeatedly scans it. Map/set bookkeeping uses O(n) expected time and O(k) active registration state plus output."
    ],
    "example": "A:x, B:x, A:y produce counts 1,2,3. Disposing A removes its two registrations and leaves B:x at count 1."
  },
  "room-leases": {
    "plan": [
      "State the ownership boundary.",
      "Trace duplicate and absent operations."
    ],
    "explanation": [
      "Each room owns an independent membership set; only a genuine positive-to-zero transition reports it as emptied.",
      "A single total user count cannot identify which room becomes empty. Nested sets give expected O(n) processing and O(k) live membership state plus output."
    ],
    "example": "A and B occupy x, A occupies y. A leaves x but B remains; A leaves y and emits y; B leaves x and emits x."
  }
}
