import type { Skill } from './knowledge.ts'
import { q } from './knowledge-question.ts'

// Deterministic exercises teach policy; they do not establish live integration behavior.
export const practicalSkills: Skill[] = [
  {
    id: 'closures', title: 'Closures and private state', summary: 'Keep a function connected to the variables where it was created.', prerequisites: ['values'],
    objectives: ['Trace independent factory environments and shared callback bindings.', 'Explain captured bindings versus frozen values and global state.'],
    sections: [
      {
        title: 'A function remembers its environment',
        body: 'A closure combines a function with access to its surrounding lexical environment. Returning the function does not remove that access. Each factory call can create a separate local variable; callbacks from the same call can share it.',
      },
      {
        title: 'Live bindings, not frozen snapshots',
        body: 'A captured variable can change. A callback reads its current binding when called. To preserve an earlier value, deliberately capture a separate value. Closures are useful for private counters and unsubscribe handles; keeping one alive can also keep referenced data alive.',
      },
    ],
    example: 'function makeCounter() {\n  let count = 0\n  return () => ++count\n}\nconst a = makeCounter(), b = makeCounter()\na() // 1\na() // 2\nb() // 1',
    walkthrough: [
      'The first call creates the local count for a.',
      'The second creates a different count for b.',
      'Calls through a update only its own binding.',
    ],
    mistakes: ['Using one global counter for every factory call.', 'Assuming a callback captures a frozen value.'],
    questions: [
      q('prediction-1', 'What does b() return?', 'const a = makeCounter(), b = makeCounter(); a(); a(); b();', ['1', '3', '0'], 0, 'Each factory call has its own count.'),
      q('prediction-2', 'What does read() return?', 'let n = 1; const read = () => n; n = 4; read();', ['1', '4', 'undefined'], 1, 'The closure reads the current binding.'),
    ],
    repIds: ['closure-counters'], related: ['values', 'testing'],
  },
  {
    id: 'reference-identity', title: 'Reference equality and shallow copies', summary: 'Distinguish the same object from different objects with equal fields.',
    prerequisites: ['values', 'lookup'],
    objectives: ['Predict equality for aliases, object literals, and shallow copies.', 'Choose reference identity or business IDs for deduplication.'],
    sections: [
      {
        title: 'Identity differs from content',
        body: 'For objects, === compares identity. Two object literals with the same fields are distinct. A Set or Map also distinguishes those references. Primitive strings compare by value. Use a stable record ID when business identity is the intended comparison.',
      },
      {
        title: 'Shallow copying',
        body: 'Object spread creates a new outer object but retains references to nested objects. Mutating a nested object through the copy can change the original. Copy the changed path for immutable updates; do not assume every value can be safely copied with JSON.',
      },
    ],
    example: 'const original = { meta: { score: 1 } }\nconst alias = original\nconst copy = { ...original }\nalias === original // true\ncopy === original // false\ncopy.meta === original.meta // true',
    walkthrough: ['alias points to the original object.', 'copy is new at the outer level.', 'meta still points to the shared nested object.'],
    mistakes: ['Using === to compare record content.', 'Treating spread as a deep copy.'],
    questions: [
      q('prediction-1', 'Are these equal?', '({ id: 1 }) === ({ id: 1 })', ['true', 'false', 'Only in TypeScript'], 1, 'Separate object literals have separate identities.'),
      q('prediction-2', 'Which reference is still shared?', 'const copy = { ...original }', ['The outer object', 'Nested object properties', 'None'], 1, 'Spread copies property values, including nested references.'),
    ],
    repIds: ['reference-groups'], related: ['values', 'lookup', 'testing'],
  },
  {
    id: 'event-loop', title: 'Event loop and microtasks', summary: 'Predict synchronous work, promise callbacks, and timer tasks.', prerequisites: ['async'],
    objectives: ['Predict synchronous, microtask, and timer ordering in one script turn.', 'Explain why queued microtasks can delay timers and rendering.'],
    sections: [
      {
        title: 'Finish the current stack',
        body: 'JavaScript runs the current synchronous call stack before queued callbacks. A zero-delay timer schedules a later task; it does not interrupt running code. Browser scheduling is different from predicting the duration of a network request.',
      },
      {
        title: 'Drain microtasks',
        body: 'Promise reactions and queueMicrotask callbacks use the microtask queue. At a microtask checkpoint the browser drains it, including newly queued microtasks, before the next task. Repeatedly creating microtasks can delay rendering. This lesson models one script turn and simple queued callbacks, not every browser or Node scheduling rule.',
      },
    ],
    example: 'console.log("A")\nsetTimeout(() => console.log("timer"), 0)\nPromise.resolve().then(() => console.log("promise"))\nconsole.log("B")\n// A, B, promise, timer',
    walkthrough: ['A logs on the current stack.', 'The callbacks are queued; B still logs immediately.', 'The promise reaction runs before the timer task.'],
    mistakes: ['Assuming zero delay means immediate execution.', 'Assuming await blocks the whole browser.'],
    questions: [
      q('prediction-1', 'What is the order in the example?', '', ['A, timer, promise, B', 'A, B, promise, timer', 'promise, A, B, timer'], 1, 'Synchronous work finishes, then the microtask, then the timer.'),
      q('microtask-followup-v2', 'What happens to a microtask queued by a microtask?', '', ['It runs after the current script finishes', 'It always waits behind the next timer', 'It runs synchronously inside queueMicrotask'], 0, 'Newly queued microtasks are drained before the next task.'),
    ],
    repIds: ['event-loop-order'], related: ['async', 'testing'],
  },
  {
    id: 'singleton', title: 'Singleton and scoped shared instances', summary: 'Share one instance within an explicitly chosen owner and lifetime.',
    prerequisites: ['closures', 'reference-identity'],
    objectives: ['Identify the scope and lifetime of a shared instance.', 'Compare cached creation with explicit injection and disposal.'],
    sections: [
      {
        title: 'One within a scope',
        body: 'A singleton gives consumers one shared instance in a chosen scope. A module can hold a cached instance and create it on first access. It does not make one global instance across browser tabs, workers, server processes, or duplicate module copies.',
      },
      {
        title: 'Choose the lifetime',
        body: 'Sharing a socket can avoid duplicate connections, but a socket for one account must not silently serve another. A singleton introduces shared state and can complicate tests. Dependency injection and explicit owners often make reset and disposal easier. Sharing creation alone does not solve cleanup or reconnection.',
      },
    ],
    example: 'function createOwner() {\n  let shared: object | undefined\n  return () => shared ??= {}\n}\nconst get = createOwner()\nget() === get() // true\ncreateOwner()() === get() // false',
    walkthrough: [
      'createOwner creates one cache binding.',
      'First access creates the instance.',
      'Further access through that owner reuses it.',
      'A separate owner has a separate cache.',
    ],
    mistakes: [
      'Creating an instance in every consumer.',
      'Assuming a module cache crosses processes.',
      'Sharing account-specific state without an account boundary.',
    ],
    questions: [
      q('prediction-1', 'How many instances does one owner create after three accesses?', '', ['1', '3', '0'], 0, 'Lazy creation fills the owner cache once.'),
      q('prediction-2', 'Does a module singleton guarantee one instance across tabs?', '', ['Yes', 'No', 'Only with const'], 1, 'Tabs have separate JavaScript environments.'),
    ],
    repIds: ['singleton-owner'], related: ['closures', 'reference-identity', 'testing'],
  },
  {
    id: 'events', title: 'Observer, pub/sub, and subscriptions',
    summary: 'Deliver events to current subscribers without coupling every producer to every consumer.', prerequisites: ['closures', 'lookup'],
    objectives: [
      'Trace topic routing, duplicate registration, and unsubscribe behavior.',
      'Distinguish observer and pub/sub from replay and delivery guarantees.',
    ],
    sections: [
      {
        title: 'Observer and pub/sub',
        body: 'With an observer, a subject knows its listeners and notifies them about changes. Publish/subscribe often routes messages through named topics or a broker, letting producers publish without knowing consumers. Neither term guarantees asynchronous delivery, persistence, or exactly-once delivery; those are separate contracts.',
      },
      {
        title: 'Subscribe and unsubscribe',
        body: 'A subscription registers a listener; unsubscribe removes that registration. Define ordering, duplicate registrations, and behavior when listeners change during delivery. A synchronous bus can use a snapshot of listeners for each publication. Forgotten subscriptions keep callbacks and captured data reachable.',
      },
    ],
    example: 'const stop = bus.subscribe("stock", value => console.log(value))\nbus.publish("stock", 3) // listener receives 3\nstop()\nbus.publish("stock", 4) // no delivery to this registration',
    walkthrough: ['The topic routes stock messages.', 'The listener remains registered until stop runs.', 'Unsubscribing affects later publications.'],
    mistakes: ['Assuming pub/sub stores events for later listeners.', 'Forgetting unsubscribe.', 'Leaving duplicate registration semantics unspecified.'],
    questions: [
      q('prediction-1', 'Who receives an event published before they subscribe?', 'No event replay is configured.', ['All future subscribers', 'Only listeners already registered', 'Nobody can ever subscribe afterward'], 1, 'A live bus does not imply replay.'),
      q('prediction-2', 'What breaks producer-to-consumer coupling in topic pub/sub?', '', ['The topic routing layer', 'Global mutable UI state', 'Calling every screen directly'], 0, 'The producer publishes to a topic instead of naming each consumer.'),
    ],
    repIds: ['pubsub-trace'], related: ['closures', 'lookup', 'testing'],
  },
  {
    id: 'dependency-injection', title: 'Dependency injection', summary: 'Pass a service or policy into the code that needs it.',
    prerequisites: ['values', 'testing'],
    objectives: ['Pass a narrow dependency instead of constructing it secretly.', 'Use a fake clock to test equality and call counts.'],
    sections: [
      {
        title: 'Make dependencies visible',
        body: 'Dependency injection means supplying a dependency from outside rather than constructing or finding it secretly inside a function. A clock, repository, or formatter can be a function parameter or constructor argument. You do not need a framework or container.',
      },
      {
        title: 'Separate policy from mechanism',
        body: 'A real clock can be replaced with a deterministic fake in a test. Keep the contract narrow: ask for the capability you need. Injection does not automatically make code pure, correct, or secure; the injected implementation can still have side effects.',
      },
    ],
    example: 'function expired(deadline: number, now: () => number) {\n  return now() >= deadline\n}\nexpired(100, () => 100) // true\nexpired(100, Date.now) // uses a real clock',
    walkthrough: ['expired does not create its own clock.', 'A fake clock makes equality reproducible.', 'The caller chooses the mechanism.'],
    mistakes: ['Hardcoding Date.now inside a boundary-sensitive test.', 'Introducing a container for a single parameter.'],
    questions: [
      q('prediction-1', 'Which dependency is injected in the example?', '', ['The now callback', 'The boolean result', 'The deadline comparison'], 0, 'The caller supplies the time source.'),
      q('prediction-2', 'What is a fake clock useful for?', '', ['Testing exact time boundaries', 'Making every function pure', 'Preventing all network failures'], 0, 'The test can choose a repeatable timestamp.'),
    ],
    repIds: ['injected-clock'], related: ['values', 'testing'],
  },
  {
    id: 'debouncing', title: 'Debouncing', summary: 'Wait for a quiet period before using the latest event.', prerequisites: ['closures', 'async'],
    objectives: ['Trace replacement of pending work during a quiet period.', 'State trailing, equality, cancellation, and stale-response policies.'],
    sections: [
      {
        title: 'Latest after quiet',
        body: 'A trailing debounce replaces pending work when another event arrives before the quiet period ends. Search-as-you-type often uses it to avoid a request for every keystroke. Clear the previous timeout and schedule the latest value.',
      },
      {
        title: 'Boundary and cleanup',
        body: 'Decide leading versus trailing behavior and what happens at exact timer boundaries. Canceling a debounce on unmount prevents later work; flushing runs the pending work immediately. Debouncing reduces starts but does not stop older requests from completing, so response ownership still matters.',
      },
    ],
    example: '// Quiet period: 100 ms; trailing only.\n// Events: A at 0, B at 60, C at 200.\n// Emit B at 160, C at 300.\n// A is replaced before its deadline.',
    walkthrough: ['A schedules a deadline at 100.', 'B arrives before 100 and replaces A with deadline 160.', 'No later event interrupts B before 160.'],
    mistakes: ['Confusing debounce with a periodic throttle.', 'Debouncing starts but ignoring stale responses.'],
    questions: [
      q('prediction-1', 'What is emitted for events at 0 and 60 with wait 100?', 'No more events arrive.', ['Both at their original times', 'Only the latest at 160', 'Only the first at 100'], 1, 'The second event resets the quiet-period deadline.'),
      q('prediction-2', 'Does debouncing guarantee response order?', '', ['Yes', 'No', 'Only with a long wait'], 1, 'Already-started requests can still finish out of order.'),
    ],
    repIds: ['debounce-schedule'], related: ['closures', 'async', 'testing'],
  },
  {
    id: 'throttling', title: 'Throttling', summary: 'Limit execution frequency while a stream of events continues.', prerequisites: ['debouncing'],
    objectives: ['Trace leading-only acceptance windows without moving them on rejected events.', 'Compare throttling with debouncing and trailing policies.'],
    sections: [
      {
        title: 'An execution window',
        body: 'A leading throttle executes the first event immediately, then suppresses events for a window measured from that execution. Unlike a trailing debounce it can continue emitting during a long stream. Scroll or pointer updates can benefit when every intermediate event is unnecessary.',
      },
      {
        title: 'Choose the policy',
        body: 'A throttle may be leading, trailing, or both. Fixed wall-clock buckets differ from a window anchored to the last accepted event. State exact equality behavior. For visual work, requestAnimationFrame can align updates with rendering; it is not a universal replacement for time-based throttling.',
      },
    ],
    example: '// Leading throttle, window 100 ms.\n// Inputs at 0, 60, 100, 150, 200.\n// Accepted at 0, 100, 200.\n// Rejected events do not move the window.',
    walkthrough: ['Accept the first event at 0.', '60 is less than 100 after the last accepted event.', '100 reaches the boundary and opens the next window.'],
    mistakes: ['Moving the window on rejected events.', 'Assuming every throttle emits the last value.'],
    questions: [
      q('prediction-1', 'Which times are accepted in the example?', '', ['0, 100, 200', '0, 60, 100, 150, 200', 'Only 0'], 0, 'Acceptance is spaced at least 100 ms apart.'),
      q('prediction-2', 'What happens to a suppressed event in a leading-only throttle?', '', ['It must run later', 'It is discarded', 'It resets the quiet period'], 1, 'No trailing invocation is scheduled.'),
    ],
    repIds: ['leading-throttle'], related: ['debouncing', 'testing'],
  },
  {
    id: 'request-ownership', title: 'Cancellation and race conditions', summary: 'Apply a response only while its request still owns the current state.',
    prerequisites: ['async'],
    objectives: ['Reject responses and cancellations from obsolete request owners.', 'Explain what AbortController can stop and what it cannot undo.'],
    sections: [
      {
        title: 'Completion order can differ',
        body: 'Starting request A before B does not guarantee A completes first. An older response must not overwrite the newer selection. Give each request an identity, and apply results only for the current owner. A mounted flag alone does not distinguish two requests in the same mounted view.',
      },
      {
        title: 'Abort is cooperative',
        body: 'AbortController supplies a signal to supported operations such as fetch. Aborting can stop work and reading a response, but it does not guarantee the server undoes a write. Promises have no universal cancel method. Keep ownership guards for obsolete results and handle intentional cancellation separately from ordinary failure.',
      },
      {
        title: 'Ownership ends and has a scope',
        body: 'The search, preview, and refresh exercises allow a pending request to settle once. After accepting success, failure, or cancellation, remove its pending ownership so a duplicate callback cannot change the settled display. The guided visible-response trace is simpler: it keeps current identity after resolve, until replacement or cancellation. Ownership can belong to one search screen or separately to each preview slot. Keeping previous data during refresh is a display policy: it does not allow an old request to replace it. The practice journey uses deterministic event traces; browser cancellation and actual request timing need separate integration checks.',
      },
    ],
    example: 'let current = 0\nasync function load(url: string) {\n  const mine = ++current\n  const data = await fetch(url).then(r => r.json())\n  if (mine === current) show(data)\n}\n// Also handle HTTP errors, failures, and cleanup in real code.',
    walkthrough: ['A captures owner 1.', 'B starts and changes the current owner to 2.', 'A finishing later cannot own the visible state.'],
    mistakes: ['Relying only on completion order.', 'Treating abort as an undo for server changes.'],
    questions: [
      q('prediction-1', 'A starts, then B starts; B finishes, then A. Which should remain visible?', '', ['A', 'B', 'Whichever payload is longer'], 1, 'B is the latest requested owner.'),
      q('prediction-2', 'Does abort guarantee a server-side write is undone?', '', ['Yes', 'No', 'Only on POST'], 1, 'The server may already have processed the write.'),
    ],
    repIds: ['latest-request', 'search-request-state', 'preview-slot-results', 'refresh-report-state'], related: ['async', 'testing'],
  },
  {
    id: 'websockets', title: 'WebSockets and connection state',
    summary: 'Exchange messages over a persistent two-way connection with explicit lifecycle state.', prerequisites: ['async', 'events'],
    objectives: ['Gate sends by connection state and validate incoming messages.', 'Separate transport lifecycle from reconnect, replay, and acknowledgment.'],
    sections: [
      {
        title: 'A persistent two-way channel',
        body: 'A WebSocket supports messages in both directions after the connection opens. Creating one begins connecting; it is not immediately ready for send. readyState distinguishes CONNECTING, OPEN, CLOSING, and CLOSED. Treat incoming data as untrusted and validate the application payload.',
      },
      {
        title: 'Transport is not the whole application',
        body: 'The browser WebSocket API does not automatically reconnect or provide application-level acknowledgments, deduplication, or replay. bufferedAmount reports queued outgoing bytes; establish a policy for large queues. On logout or disposal, remove listeners and close the owned connection. A reconnect needs its own state and backoff policy.',
      },
    ],
    example: 'const socket = new WebSocket("wss://example.test/live")\nsocket.addEventListener("open", () => {\n  socket.send(JSON.stringify({ type: "subscribe", room: "stock" }))\n})\n// Dispose the connection and listeners when its owner ends.',
    walkthrough: [
      'Construction starts connecting.',
      'The open callback runs once the transport is ready.',
      'Only then does this example send a subscription message.',
    ],
    mistakes: ['Sending during CONNECTING.', 'Assuming send proves server processing.', 'Assuming reconnect is automatic.'],
    questions: [
      q('prediction-1', 'Which readyState permits normal sends?', '', ['CONNECTING', 'OPEN', 'CLOSED'], 1, 'The connection must be open.'),
      q('prediction-2', 'Does the browser WebSocket constructor provide automatic reconnect?', '', ['Yes', 'No', 'Only over wss'], 1, 'The application must implement reconnect policy.'),
    ],
    repIds: ['websocket-gate'], related: ['async', 'events', 'testing'],
  },
  {
    id: 'live-transports', title: 'Polling and server-sent events',
    summary: 'Choose between periodic requests, one-way server updates, and bidirectional messages.', prerequisites: ['http', 'websockets'],
    objectives: ['Compare polling, one-way SSE, and two-way WebSocket capabilities.', 'Explain polling overlap and the server responsibility for SSE replay.'],
    sections: [
      {
        title: 'Polling',
        body: 'Polling makes repeated requests for current data. It is easy to start with an ordinary endpoint but trades repeated request work against update delay. Do not start overlapping requests accidentally; schedule the next poll after completion when that is the intended policy. Pause or stop polling when its owner ends.',
      },
      {
        title: 'Server-sent events',
        body: 'EventSource receives a server-to-client stream using text/event-stream. It supports reconnection and event IDs, but replay depends on the server honoring those IDs. Client-to-server actions still use a separate request. WebSockets support both directions; neither transport removes authentication, validation, or infrastructure decisions.',
      },
    ],
    example: 'const stream = new EventSource("/updates")\nstream.addEventListener("message", event => {\n  console.log(event.data)\n})\n// stream.close() stops this owner’s stream.\n// A separate POST can send a user action.',
    walkthrough: [
      'EventSource opens a server-to-client stream.',
      'message delivers text from the server.',
      'Closing ends the subscription; actions need a separate request.',
    ],
    mistakes: ['Assuming SSE sends client messages on the same stream.', 'Assuming event IDs guarantee replay without server support.'],
    questions: [
      q('prediction-1', 'Which transport supports two-way messages on one connection?', '', ['WebSocket', 'EventSource', 'A single GET'], 0, 'WebSocket supports bidirectional messages.'),
      q('prediction-2', 'Can server-only updates use SSE while actions use POST?', '', ['Yes', 'No', 'Only without authentication'], 0, 'Separate HTTP requests can carry client actions.'),
    ],
    repIds: ['choose-live-transport'], related: ['http', 'websockets', 'testing'],
  },
  {
    id: 'resource-ownership', title: 'Cleanup, reference counting, and shared connections',
    summary: 'Keep a shared resource alive while consumers own it and release it after the last consumer leaves.', prerequisites: ['singleton', 'events'],
    objectives: ['Trace first acquisition and final release across several consumers.', 'Match each subscription, timer, and resource lease with cleanup.'],
    sections: [
      {
        title: 'One owner, several consumers',
        body: 'A shared connection needs an explicit owner. Consumers acquire a lease; releasing one lease should remove that consumer’s listener without closing a connection still needed by others. Reference counting tracks live leases. A set of consumer IDs can avoid duplicate acquire and repeated release corrupting the count.',
      },
      {
        title: 'Symmetric cleanup',
        body: 'Every registration or acquisition needs a matching cleanup. Close the resource when the final live lease leaves. Repeated cleanup should be safe; abandoned consumers otherwise retain work. Development remounts can expose missing cleanup. Account changes, connecting sockets, and reconnect timers all need the same ownership boundary.',
      },
    ],
    example: '// acquire A: 0 → 1, open resource\n// acquire B: 1 → 2, keep resource\n// release A: 2 → 1, keep resource\n// release B: 1 → 0, close resource',
    walkthrough: ['First consumer opens the shared resource.', 'Second consumer reuses it.', 'Only the last release closes it.'],
    mistakes: [
      'Closing the socket whenever any component unmounts.',
      'Allowing counts to become negative.',
      'Leaving reconnect timers alive after the owner ends.',
    ],
    questions: [
      q('prediction-1', 'A and B share a socket; A leaves. What happens to the socket?', '', ['Close immediately', 'Keep it for B', 'Open another for B'], 1, 'B still owns a live lease.'),
      q('prediction-2', 'When should the resource close?', '', ['At the first release', 'When the last live lease is released', 'Only on a page refresh'], 1, 'The transition from one live lease to zero ends ownership.'),
    ],
    repIds: ['shared-resource', 'subscription-cleanup', 'room-leases'], related: ['singleton', 'events', 'testing'],
  },
  {
    id: 'caching', title: 'Caching and freshness', summary: 'Reuse a stored result only while its key and freshness policy permit it.',
    prerequisites: ['lookup', 'dependency-injection'],
    objectives: ['Distinguish an absent entry from cached zero and expired data.', 'Define cache keys, equality at expiry, and invalidation policy.'],
    sections: [
      {
        title: 'Cache keys are part of correctness',
        body: 'A cache stores results to avoid repeated work. Its key must include every input that changes the result, such as account, locale, or filters. Sharing a cache across accounts without identity in the key can show the wrong data. A cache miss differs from a cached falsy value.',
      },
      {
        title: 'Freshness and invalidation',
        body: 'A time-to-live sets when an entry becomes stale, but it does not discover a server-side change before that deadline. Define whether equality is expired and whether stale data can be displayed during refresh. Bound storage and invalidate after relevant writes. A cache is an optimization, not the source of truth.',
      },
    ],
    example: 'const entry = { value: 0, expiresAt: 100 }\nconst now = 100\nconst hit = now < entry.expiresAt // false\n// value 0 is valid data, not a cache miss.',
    walkthrough: ['Check key identity before reading an entry.', 'Use an explicit freshness comparison.', 'At the exact expiry time this policy misses.'],
    mistakes: ['Using value || fallback for zero.', 'Ignoring account identity in keys.', 'Treating TTL as immediate consistency.'],
    questions: [
      q('prediction-1', 'Is an entry fresh at its expiresAt under this policy?', 'now < expiresAt', ['Yes', 'No', 'Only if the value is truthy'], 1, 'Equality is expired.'),
      q('prediction-2', 'Which information belongs in a cache key when it changes the response?', '', ['Account and filters', 'Only the page title', 'Nothing beyond the URL path'], 0, 'All response-changing inputs matter.'),
    ],
    repIds: ['cache-freshness'], related: ['lookup', 'dependency-injection', 'testing'],
  },
  {
    id: 'retries', title: 'Retries and reconnect backoff', summary: 'Retry eligible failures with a bound and an increasing delay.',
    prerequisites: ['async', 'websockets'],
    objectives: ['Compute a bounded exponential backoff sequence.', 'Explain eligibility, cancellation, jitter, and safe repeated effects.'],
    sections: [
      {
        title: 'Retry selectively',
        body: 'A retry repeats work after failure. A transient outage may justify it; invalid input or revoked access usually requires another action. Bound attempts, cancel obsolete retries, and ensure repeated writes are safe. A timeout does not establish that the server performed no work.',
      },
      {
        title: 'Backoff and jitter',
        body: 'Exponential backoff doubles a base delay after consecutive failures until a cap. Jitter varies delays so many clients do not retry together. Reset the failure sequence after a successful connection, and stop on intentional disposal. Respect service-specific retry guidance, including Retry-After where relevant.',
      },
    ],
    example: '// Base 100 ms, cap 500 ms, no jitter.\n// Failure indices 0,1,2,3 produce 100,200,400,500.\n// Success resets the next index to 0.',
    walkthrough: ['First failure uses the base delay.', 'Consecutive failures increase the delay.', 'The cap stops further growth.'],
    mistakes: ['Retrying all failures forever.', 'Reconnecting after logout.', 'Retrying writes without idempotency.'],
    questions: [
      q('prediction-1', 'What is the delay at index 3 with base 100 and cap 500?', '', ['800', '500', '300'], 1, 'The exponential delay is capped at 500.'),
      q('prediction-2', 'What does jitter help reduce?', '', ['Many clients retrying at the same moment', 'All application bugs', 'The need for cancellation'], 0, 'Spreading delays reduces synchronized retry bursts.'),
    ],
    repIds: ['retry-backoff'], related: ['async', 'websockets', 'testing'],
  },
  {
    id: 'idempotency', title: 'Idempotency and safe repeated requests',
    summary: 'Prevent repeated delivery of one logical operation from repeating its effect.', prerequisites: ['http', 'retries'],
    objectives: ['Recognize matching retries and conflicts under one operation key.', 'Explain key scope, durable atomic handling, and timeout uncertainty.'],
    sections: [
      {
        title: 'Same effect when repeated',
        body: 'An idempotent operation has the same intended server effect when repeated as when applied once. Setting a preference to false can be idempotent; incrementing a balance usually is not. Responses need not be byte-for-byte identical. HTTP method semantics and application idempotency keys are related but distinct.',
      },
      {
        title: 'Keys need a server contract',
        body: 'A client can reuse one key for retries of the same logical operation. The server must atomically associate that key, operation scope, request fingerprint, and outcome. A repeated key with a different payload should not silently perform another operation. Define expiry and concurrent handling. A browser-side Set alone does not guarantee production exactly-once effects.',
      },
    ],
    example: '// key K, amount 5: apply +5 and store result\n// retry key K, amount 5: return stored outcome, add nothing\n// key K, amount 9: conflict, add nothing\n// key L, amount 5: a different operation, apply +5',
    walkthrough: [
      'The first key identifies a logical operation.',
      'A matching retry reuses its recorded outcome.',
      'A different payload under that key is rejected.',
    ],
    mistakes: [
      'Generating a fresh key for each retry.',
      'Deduplicating by amount instead of operation.',
      'Assuming a client cache protects concurrent server writes.',
    ],
    questions: [
      q('prediction-1', 'Which key should a retry of the same logical operation use?', '', ['The original key', 'A new key every time', 'No key'], 0, 'Reusing the key lets the server recognize the operation.'),
      q('prediction-2', 'What should a different payload under the same key do in this lesson?', '', ['Apply again', 'Report a conflict', 'Overwrite the earlier operation'], 1, 'The key must not silently identify a different operation.'),
    ],
    repIds: ['idempotent-ledger'], related: ['http', 'retries', 'testing'],
  },
  {
    id: 'optimistic-updates', title: 'Optimistic updates and rollback', summary: 'Show a tentative change while preserving a correct confirmed baseline.',
    prerequisites: ['request-ownership', 'idempotency'],
    objectives: ['Separate confirmed state from pending per-operation deltas.', 'Rollback one failed change without erasing another confirmed change.'],
    sections: [
      {
        title: 'Tentative is not confirmed',
        body: 'An optimistic UI displays a predicted result before a request succeeds. Record the confirmed baseline and identify each pending operation. On success commit it; on failure remove or compensate for it. Show pending and failure feedback so the person can understand what happened.',
      },
      {
        title: 'Concurrent changes need ownership',
        body: 'Restoring one old snapshot can erase another successful change. For independent additive changes, derive display as confirmed plus pending deltas. More complex edits need ordering, versions, or reconciliation with server truth. A server may return canonical data that differs from the prediction.',
      },
    ],
    example: '// Confirmed balance 10.\n// Pending A:+2 and B:+3 → display 15.\n// B succeeds → confirmed 13, pending A:+2 → display 15.\n// A fails → confirmed 13, pending empty → display 13.',
    walkthrough: ['Each pending operation has its own identity.', 'Success moves only that delta into confirmed.', 'Failure removes only the failing delta.'],
    mistakes: ['Rolling back the entire display to one stale snapshot.', 'Treating a prediction as server confirmation.'],
    questions: [
      q('prediction-1', 'What remains after B succeeds and A fails in the example?', '', ['10', '13', '15'], 1, 'B’s confirmed +3 remains; only A’s tentative +2 is removed.'),
      q('prediction-2', 'What should the UI call an unconfirmed optimistic result?', '', ['Pending', 'Guaranteed persisted', 'A cache miss'], 0, 'The predicted change has not been confirmed yet.'),
    ],
    repIds: ['optimistic-balance'], related: ['request-ownership', 'idempotency', 'testing'],
  },
]
