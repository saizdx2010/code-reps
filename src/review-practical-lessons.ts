import type { LessonDepth } from './lesson-depth.ts'

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
