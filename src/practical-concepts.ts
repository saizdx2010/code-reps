import { asyncReps } from './async-reps.ts'
import type { Skill } from './knowledge.ts'
import type { Rep } from './rep.ts'

// Deterministic exercises teach policy; they do not establish live integration behavior.
export const practicalSkills: Skill[] = [
  {
    "id": "closures",
    "title": "Closures and private state",
    "summary": "Keep a function connected to the variables where it was created.",
    "prerequisites": [
      "values"
    ],
    "objectives": [
      "Trace independent factory environments and shared callback bindings.",
      "Explain captured bindings versus frozen values and global state."
    ],
    "sections": [
      {
        "title": "A function remembers its environment",
        "body": "A closure combines a function with access to its surrounding lexical environment. Returning the function does not remove that access. Each factory call can create a separate local variable; callbacks from the same call can share it."
      },
      {
        "title": "Live bindings, not frozen snapshots",
        "body": "A captured variable can change. A callback reads its current binding when called. To preserve an earlier value, deliberately capture a separate value. Closures are useful for private counters and unsubscribe handles; keeping one alive can also keep referenced data alive."
      }
    ],
    "example": "function makeCounter() {\n  let count = 0\n  return () => ++count\n}\nconst a = makeCounter(), b = makeCounter()\na() // 1\na() // 2\nb() // 1",
    "walkthrough": [
      "The first call creates the local count for a.",
      "The second creates a different count for b.",
      "Calls through a update only its own binding."
    ],
    "mistakes": [
      "Using one global counter for every factory call.",
      "Assuming a callback captures a frozen value."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "What does b() return?",
        "code": "const a = makeCounter(), b = makeCounter(); a(); a(); b();",
        "options": [
          "1",
          "3",
          "0"
        ],
        "answer": 0,
        "explanation": "Each factory call has its own count."
      },
      {
        "id": "prediction-2",
        "prompt": "What does read() return?",
        "code": "let n = 1; const read = () => n; n = 4; read();",
        "options": [
          "1",
          "4",
          "undefined"
        ],
        "answer": 1,
        "explanation": "The closure reads the current binding."
      }
    ],
    "repIds": [
      "closure-counters"
    ],
    "related": [
      "values",
      "testing"
    ]
  },
  {
    "id": "reference-identity",
    "title": "Reference equality and shallow copies",
    "summary": "Distinguish the same object from different objects with equal fields.",
    "prerequisites": [
      "values",
      "lookup"
    ],
    "objectives": [
      "Predict equality for aliases, object literals, and shallow copies.",
      "Choose reference identity or business IDs for deduplication."
    ],
    "sections": [
      {
        "title": "Identity differs from content",
        "body": "For objects, === compares identity. Two object literals with the same fields are distinct. A Set or Map also distinguishes those references. Primitive strings compare by value. Use a stable record ID when business identity is the intended comparison."
      },
      {
        "title": "Shallow copying",
        "body": "Object spread creates a new outer object but retains references to nested objects. Mutating a nested object through the copy can change the original. Copy the changed path for immutable updates; do not assume every value can be safely copied with JSON."
      }
    ],
    "example": "const original = { meta: { score: 1 } }\nconst alias = original\nconst copy = { ...original }\nalias === original // true\ncopy === original // false\ncopy.meta === original.meta // true",
    "walkthrough": [
      "alias points to the original object.",
      "copy is new at the outer level.",
      "meta still points to the shared nested object."
    ],
    "mistakes": [
      "Using === to compare record content.",
      "Treating spread as a deep copy."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Are these equal?",
        "code": "({ id: 1 }) === ({ id: 1 })",
        "options": [
          "true",
          "false",
          "Only in TypeScript"
        ],
        "answer": 1,
        "explanation": "Separate object literals have separate identities."
      },
      {
        "id": "prediction-2",
        "prompt": "Which reference is still shared?",
        "code": "const copy = { ...original }",
        "options": [
          "The outer object",
          "Nested object properties",
          "None"
        ],
        "answer": 1,
        "explanation": "Spread copies property values, including nested references."
      }
    ],
    "repIds": [
      "reference-groups"
    ],
    "related": [
      "values",
      "lookup",
      "testing"
    ]
  },
  {
    "id": "event-loop",
    "title": "Event loop and microtasks",
    "summary": "Predict synchronous work, promise callbacks, and timer tasks.",
    "prerequisites": [
      "async"
    ],
    "objectives": [
      "Predict synchronous, microtask, and timer ordering in one script turn.",
      "Explain why queued microtasks can delay timers and rendering."
    ],
    "sections": [
      {
        "title": "Finish the current stack",
        "body": "JavaScript runs the current synchronous call stack before queued callbacks. A zero-delay timer schedules a later task; it does not interrupt running code. Browser scheduling is different from predicting the duration of a network request."
      },
      {
        "title": "Drain microtasks",
        "body": "Promise reactions and queueMicrotask callbacks use the microtask queue. At a microtask checkpoint the browser drains it, including newly queued microtasks, before the next task. Repeatedly creating microtasks can delay rendering. This lesson models one script turn and simple queued callbacks, not every browser or Node scheduling rule."
      }
    ],
    "example": "console.log(\"A\")\nsetTimeout(() => console.log(\"timer\"), 0)\nPromise.resolve().then(() => console.log(\"promise\"))\nconsole.log(\"B\")\n// A, B, promise, timer",
    "walkthrough": [
      "A logs on the current stack.",
      "The callbacks are queued; B still logs immediately.",
      "The promise reaction runs before the timer task."
    ],
    "mistakes": [
      "Assuming zero delay means immediate execution.",
      "Assuming await blocks the whole browser."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "What is the order in the example?",
        "code": "",
        "options": [
          "A, timer, promise, B",
          "A, B, promise, timer",
          "promise, A, B, timer"
        ],
        "answer": 1,
        "explanation": "Synchronous work finishes, then the microtask, then the timer."
      },
      {
        "id": "microtask-followup-v2",
        "prompt": "What happens to a microtask queued by a microtask?",
        "code": "",
        "options": [
          "It runs after the current script finishes",
          "It always waits behind the next timer",
          "It runs synchronously inside queueMicrotask"
        ],
        "answer": 0,
        "explanation": "Newly queued microtasks are drained before the next task."
      }
    ],
    "repIds": [
      "event-loop-order"
    ],
    "related": [
      "async",
      "testing"
    ]
  },
  {
    "id": "singleton",
    "title": "Singleton and scoped shared instances",
    "summary": "Share one instance within an explicitly chosen owner and lifetime.",
    "prerequisites": [
      "closures",
      "reference-identity"
    ],
    "objectives": [
      "Identify the scope and lifetime of a shared instance.",
      "Compare cached creation with explicit injection and disposal."
    ],
    "sections": [
      {
        "title": "One within a scope",
        "body": "A singleton gives consumers one shared instance in a chosen scope. A module can hold a cached instance and create it on first access. It does not make one global instance across browser tabs, workers, server processes, or duplicate module copies."
      },
      {
        "title": "Choose the lifetime",
        "body": "Sharing a socket can avoid duplicate connections, but a socket for one account must not silently serve another. A singleton introduces shared state and can complicate tests. Dependency injection and explicit owners often make reset and disposal easier. Sharing creation alone does not solve cleanup or reconnection."
      }
    ],
    "example": "function createOwner() {\n  let shared: object | undefined\n  return () => shared ??= {}\n}\nconst get = createOwner()\nget() === get() // true\ncreateOwner()() === get() // false",
    "walkthrough": [
      "createOwner creates one cache binding.",
      "First access creates the instance.",
      "Further access through that owner reuses it.",
      "A separate owner has a separate cache."
    ],
    "mistakes": [
      "Creating an instance in every consumer.",
      "Assuming a module cache crosses processes.",
      "Sharing account-specific state without an account boundary."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "How many instances does one owner create after three accesses?",
        "code": "",
        "options": [
          "1",
          "3",
          "0"
        ],
        "answer": 0,
        "explanation": "Lazy creation fills the owner cache once."
      },
      {
        "id": "prediction-2",
        "prompt": "Does a module singleton guarantee one instance across tabs?",
        "code": "",
        "options": [
          "Yes",
          "No",
          "Only with const"
        ],
        "answer": 1,
        "explanation": "Tabs have separate JavaScript environments."
      }
    ],
    "repIds": [
      "singleton-owner"
    ],
    "related": [
      "closures",
      "reference-identity",
      "testing"
    ]
  },
  {
    "id": "events",
    "title": "Observer, pub/sub, and subscriptions",
    "summary": "Deliver events to current subscribers without coupling every producer to every consumer.",
    "prerequisites": [
      "closures",
      "lookup"
    ],
    "objectives": [
      "Trace topic routing, duplicate registration, and unsubscribe behavior.",
      "Distinguish observer and pub/sub from replay and delivery guarantees."
    ],
    "sections": [
      {
        "title": "Observer and pub/sub",
        "body": "With an observer, a subject knows its listeners and notifies them about changes. Publish/subscribe often routes messages through named topics or a broker, letting producers publish without knowing consumers. Neither term guarantees asynchronous delivery, persistence, or exactly-once delivery; those are separate contracts."
      },
      {
        "title": "Subscribe and unsubscribe",
        "body": "A subscription registers a listener; unsubscribe removes that registration. Define ordering, duplicate registrations, and behavior when listeners change during delivery. A synchronous bus can use a snapshot of listeners for each publication. Forgotten subscriptions keep callbacks and captured data reachable."
      }
    ],
    "example": "const stop = bus.subscribe(\"stock\", value => console.log(value))\nbus.publish(\"stock\", 3) // listener receives 3\nstop()\nbus.publish(\"stock\", 4) // no delivery to this registration",
    "walkthrough": [
      "The topic routes stock messages.",
      "The listener remains registered until stop runs.",
      "Unsubscribing affects later publications."
    ],
    "mistakes": [
      "Assuming pub/sub stores events for later listeners.",
      "Forgetting unsubscribe.",
      "Leaving duplicate registration semantics unspecified."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Who receives an event published before they subscribe?",
        "code": "No event replay is configured.",
        "options": [
          "All future subscribers",
          "Only listeners already registered",
          "Nobody can ever subscribe afterward"
        ],
        "answer": 1,
        "explanation": "A live bus does not imply replay."
      },
      {
        "id": "prediction-2",
        "prompt": "What breaks producer-to-consumer coupling in topic pub/sub?",
        "code": "",
        "options": [
          "The topic routing layer",
          "Global mutable UI state",
          "Calling every screen directly"
        ],
        "answer": 0,
        "explanation": "The producer publishes to a topic instead of naming each consumer."
      }
    ],
    "repIds": [
      "pubsub-trace"
    ],
    "related": [
      "closures",
      "lookup",
      "testing"
    ]
  },
  {
    "id": "dependency-injection",
    "title": "Dependency injection",
    "summary": "Pass a service or policy into the code that needs it.",
    "prerequisites": [
      "values",
      "testing"
    ],
    "objectives": [
      "Pass a narrow dependency instead of constructing it secretly.",
      "Use a fake clock to test equality and call counts."
    ],
    "sections": [
      {
        "title": "Make dependencies visible",
        "body": "Dependency injection means supplying a dependency from outside rather than constructing or finding it secretly inside a function. A clock, repository, or formatter can be a function parameter or constructor argument. You do not need a framework or container."
      },
      {
        "title": "Separate policy from mechanism",
        "body": "A real clock can be replaced with a deterministic fake in a test. Keep the contract narrow: ask for the capability you need. Injection does not automatically make code pure, correct, or secure; the injected implementation can still have side effects."
      }
    ],
    "example": "function expired(deadline: number, now: () => number) {\n  return now() >= deadline\n}\nexpired(100, () => 100) // true\nexpired(100, Date.now) // uses a real clock",
    "walkthrough": [
      "expired does not create its own clock.",
      "A fake clock makes equality reproducible.",
      "The caller chooses the mechanism."
    ],
    "mistakes": [
      "Hardcoding Date.now inside a boundary-sensitive test.",
      "Introducing a container for a single parameter."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Which dependency is injected in the example?",
        "code": "",
        "options": [
          "The now callback",
          "The boolean result",
          "The deadline comparison"
        ],
        "answer": 0,
        "explanation": "The caller supplies the time source."
      },
      {
        "id": "prediction-2",
        "prompt": "What is a fake clock useful for?",
        "code": "",
        "options": [
          "Testing exact time boundaries",
          "Making every function pure",
          "Preventing all network failures"
        ],
        "answer": 0,
        "explanation": "The test can choose a repeatable timestamp."
      }
    ],
    "repIds": [
      "injected-clock"
    ],
    "related": [
      "values",
      "testing"
    ]
  },
  {
    "id": "debouncing",
    "title": "Debouncing",
    "summary": "Wait for a quiet period before using the latest event.",
    "prerequisites": [
      "closures",
      "async"
    ],
    "objectives": [
      "Trace replacement of pending work during a quiet period.",
      "State trailing, equality, cancellation, and stale-response policies."
    ],
    "sections": [
      {
        "title": "Latest after quiet",
        "body": "A trailing debounce replaces pending work when another event arrives before the quiet period ends. Search-as-you-type often uses it to avoid a request for every keystroke. Clear the previous timeout and schedule the latest value."
      },
      {
        "title": "Boundary and cleanup",
        "body": "Decide leading versus trailing behavior and what happens at exact timer boundaries. Cancelling a debounce on unmount prevents later work; flushing runs the pending work immediately. Debouncing reduces starts but does not stop older requests from completing, so response ownership still matters."
      }
    ],
    "example": "// Quiet period: 100 ms; trailing only.\n// Events: A at 0, B at 60, C at 200.\n// Emit B at 160, C at 300.\n// A is replaced before its deadline.",
    "walkthrough": [
      "A schedules a deadline at 100.",
      "B arrives before 100 and replaces A with deadline 160.",
      "No later event interrupts B before 160."
    ],
    "mistakes": [
      "Confusing debounce with a periodic throttle.",
      "Debouncing starts but ignoring stale responses."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "What is emitted for events at 0 and 60 with wait 100?",
        "code": "No more events arrive.",
        "options": [
          "Both at their original times",
          "Only the latest at 160",
          "Only the first at 100"
        ],
        "answer": 1,
        "explanation": "The second event resets the quiet-period deadline."
      },
      {
        "id": "prediction-2",
        "prompt": "Does debouncing guarantee response order?",
        "code": "",
        "options": [
          "Yes",
          "No",
          "Only with a long wait"
        ],
        "answer": 1,
        "explanation": "Already-started requests can still finish out of order."
      }
    ],
    "repIds": [
      "debounce-schedule"
    ],
    "related": [
      "closures",
      "async",
      "testing"
    ]
  },
  {
    "id": "throttling",
    "title": "Throttling",
    "summary": "Limit execution frequency while a stream of events continues.",
    "prerequisites": [
      "debouncing"
    ],
    "objectives": [
      "Trace leading-only acceptance windows without moving them on rejected events.",
      "Compare throttling with debouncing and trailing policies."
    ],
    "sections": [
      {
        "title": "An execution window",
        "body": "A leading throttle executes the first event immediately, then suppresses events for a window measured from that execution. Unlike a trailing debounce it can continue emitting during a long stream. Scroll or pointer updates can benefit when every intermediate event is unnecessary."
      },
      {
        "title": "Choose the policy",
        "body": "A throttle may be leading, trailing, or both. Fixed wall-clock buckets differ from a window anchored to the last accepted event. State exact equality behavior. For visual work, requestAnimationFrame can align updates with rendering; it is not a universal replacement for time-based throttling."
      }
    ],
    "example": "// Leading throttle, window 100 ms.\n// Inputs at 0, 60, 100, 150, 200.\n// Accepted at 0, 100, 200.\n// Rejected events do not move the window.",
    "walkthrough": [
      "Accept the first event at 0.",
      "60 is less than 100 after the last accepted event.",
      "100 reaches the boundary and opens the next window."
    ],
    "mistakes": [
      "Moving the window on rejected events.",
      "Assuming every throttle emits the last value."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Which times are accepted in the example?",
        "code": "",
        "options": [
          "0, 100, 200",
          "0, 60, 100, 150, 200",
          "Only 0"
        ],
        "answer": 0,
        "explanation": "Acceptance is spaced at least 100 ms apart."
      },
      {
        "id": "prediction-2",
        "prompt": "What happens to a suppressed event in a leading-only throttle?",
        "code": "",
        "options": [
          "It must run later",
          "It is discarded",
          "It resets the quiet period"
        ],
        "answer": 1,
        "explanation": "No trailing invocation is scheduled."
      }
    ],
    "repIds": [
      "leading-throttle"
    ],
    "related": [
      "debouncing",
      "testing"
    ]
  },
  {
    "id": "request-ownership",
    "title": "Cancellation and race conditions",
    "summary": "Apply a response only while its request still owns the current state.",
    "prerequisites": [
      "async"
    ],
    "objectives": [
      "Reject responses and cancellations from obsolete request owners.",
      "Explain what AbortController can stop and what it cannot undo."
    ],
    "sections": [
      {
        "title": "Completion order can differ",
        "body": "Starting request A before B does not guarantee A completes first. An older response must not overwrite the newer selection. Give each request an identity, and apply results only for the current owner. A mounted flag alone does not distinguish two requests in the same mounted view."
      },
      {
        "title": "Abort is cooperative",
        "body": "AbortController supplies a signal to supported operations such as fetch. Aborting can stop work and reading a response, but it does not guarantee the server undoes a write. Promises have no universal cancel method. Keep ownership guards for obsolete results and handle intentional cancellation separately from ordinary failure."
      },
      {
        "title": "Ownership ends and has a scope",
        "body": "The search, preview, and refresh exercises allow a pending request to settle once. After accepting success, failure, or cancellation, remove its pending ownership so a duplicate callback cannot change the settled display. The guided visible-response trace is simpler: it keeps current identity after resolve, until replacement or cancellation. Ownership can belong to one search screen or separately to each preview slot. Keeping previous data during refresh is a display policy: it does not allow an old request to replace it. The practice journey uses deterministic event traces; browser cancellation and actual request timing need separate integration checks."
      }
    ],
    "example": "let current = 0\nasync function load(url: string) {\n  const mine = ++current\n  const data = await fetch(url).then(r => r.json())\n  if (mine === current) show(data)\n}\n// Also handle HTTP errors, failures, and cleanup in real code.",
    "walkthrough": [
      "A captures owner 1.",
      "B starts and changes the current owner to 2.",
      "A finishing later cannot own the visible state."
    ],
    "mistakes": [
      "Relying only on completion order.",
      "Treating abort as an undo for server changes."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "A starts, then B starts; B finishes, then A. Which should remain visible?",
        "code": "",
        "options": [
          "A",
          "B",
          "Whichever payload is longer"
        ],
        "answer": 1,
        "explanation": "B is the latest requested owner."
      },
      {
        "id": "prediction-2",
        "prompt": "Does abort guarantee a server-side write is undone?",
        "code": "",
        "options": [
          "Yes",
          "No",
          "Only on POST"
        ],
        "answer": 1,
        "explanation": "The server may already have processed the write."
      }
    ],
    "repIds": [
      "latest-request",
      "search-request-state",
      "preview-slot-results",
      "refresh-report-state"
    ],
    "related": [
      "async",
      "testing"
    ]
  },
  {
    "id": "websockets",
    "title": "WebSockets and connection state",
    "summary": "Exchange messages over a persistent two-way connection with explicit lifecycle state.",
    "prerequisites": [
      "async",
      "events"
    ],
    "objectives": [
      "Gate sends by connection state and validate incoming messages.",
      "Separate transport lifecycle from reconnect, replay, and acknowledgment."
    ],
    "sections": [
      {
        "title": "A persistent two-way channel",
        "body": "A WebSocket supports messages in both directions after the connection opens. Creating one begins connecting; it is not immediately ready for send. readyState distinguishes CONNECTING, OPEN, CLOSING, and CLOSED. Treat incoming data as untrusted and validate the application payload."
      },
      {
        "title": "Transport is not the whole application",
        "body": "The browser WebSocket API does not automatically reconnect or provide application-level acknowledgments, deduplication, or replay. bufferedAmount reports queued outgoing bytes; establish a policy for large queues. On logout or disposal, remove listeners and close the owned connection. A reconnect needs its own state and backoff policy."
      }
    ],
    "example": "const socket = new WebSocket(\"wss://example.test/live\")\nsocket.addEventListener(\"open\", () => {\n  socket.send(JSON.stringify({ type: \"subscribe\", room: \"stock\" }))\n})\n// Dispose the connection and listeners when its owner ends.",
    "walkthrough": [
      "Construction starts connecting.",
      "The open callback runs once the transport is ready.",
      "Only then does this example send a subscription message."
    ],
    "mistakes": [
      "Sending during CONNECTING.",
      "Assuming send proves server processing.",
      "Assuming reconnect is automatic."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Which readyState permits normal sends?",
        "code": "",
        "options": [
          "CONNECTING",
          "OPEN",
          "CLOSED"
        ],
        "answer": 1,
        "explanation": "The connection must be open."
      },
      {
        "id": "prediction-2",
        "prompt": "Does the browser WebSocket constructor provide automatic reconnect?",
        "code": "",
        "options": [
          "Yes",
          "No",
          "Only over wss"
        ],
        "answer": 1,
        "explanation": "The application must implement reconnect policy."
      }
    ],
    "repIds": [
      "websocket-gate"
    ],
    "related": [
      "async",
      "events",
      "testing"
    ]
  },
  {
    "id": "live-transports",
    "title": "Polling and server-sent events",
    "summary": "Choose between periodic requests, one-way server updates, and bidirectional messages.",
    "prerequisites": [
      "http",
      "websockets"
    ],
    "objectives": [
      "Compare polling, one-way SSE, and two-way WebSocket capabilities.",
      "Explain polling overlap and the server responsibility for SSE replay."
    ],
    "sections": [
      {
        "title": "Polling",
        "body": "Polling makes repeated requests for current data. It is easy to start with an ordinary endpoint but trades repeated request work against update delay. Do not start overlapping requests accidentally; schedule the next poll after completion when that is the intended policy. Pause or stop polling when its owner ends."
      },
      {
        "title": "Server-sent events",
        "body": "EventSource receives a server-to-client stream using text/event-stream. It supports reconnection and event IDs, but replay depends on the server honoring those IDs. Client-to-server actions still use a separate request. WebSockets support both directions; neither transport removes authentication, validation, or infrastructure decisions."
      }
    ],
    "example": "const stream = new EventSource(\"/updates\")\nstream.addEventListener(\"message\", event => {\n  console.log(event.data)\n})\n// stream.close() stops this owner’s stream.\n// A separate POST can send a user action.",
    "walkthrough": [
      "EventSource opens a server-to-client stream.",
      "message delivers text from the server.",
      "Closing ends the subscription; actions need a separate request."
    ],
    "mistakes": [
      "Assuming SSE sends client messages on the same stream.",
      "Assuming event IDs guarantee replay without server support."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Which transport supports two-way messages on one connection?",
        "code": "",
        "options": [
          "WebSocket",
          "EventSource",
          "A single GET"
        ],
        "answer": 0,
        "explanation": "WebSocket supports bidirectional messages."
      },
      {
        "id": "prediction-2",
        "prompt": "Can server-only updates use SSE while actions use POST?",
        "code": "",
        "options": [
          "Yes",
          "No",
          "Only without authentication"
        ],
        "answer": 0,
        "explanation": "Separate HTTP requests can carry client actions."
      }
    ],
    "repIds": [
      "choose-live-transport"
    ],
    "related": [
      "http",
      "websockets",
      "testing"
    ]
  },
  {
    "id": "resource-ownership",
    "title": "Cleanup, reference counting, and shared connections",
    "summary": "Keep a shared resource alive while consumers own it and release it after the last consumer leaves.",
    "prerequisites": [
      "singleton",
      "events"
    ],
    "objectives": [
      "Trace first acquisition and final release across several consumers.",
      "Match each subscription, timer, and resource lease with cleanup."
    ],
    "sections": [
      {
        "title": "One owner, several consumers",
        "body": "A shared connection needs an explicit owner. Consumers acquire a lease; releasing one lease should remove that consumer’s listener without closing a connection still needed by others. Reference counting tracks live leases. A set of consumer IDs can avoid duplicate acquire and repeated release corrupting the count."
      },
      {
        "title": "Symmetric cleanup",
        "body": "Every registration or acquisition needs a matching cleanup. Close the resource when the final live lease leaves. Repeated cleanup should be safe; abandoned consumers otherwise retain work. Development remounts can expose missing cleanup. Account changes, connecting sockets, and reconnect timers all need the same ownership boundary."
      }
    ],
    "example": "// acquire A: 0 → 1, open resource\n// acquire B: 1 → 2, keep resource\n// release A: 2 → 1, keep resource\n// release B: 1 → 0, close resource",
    "walkthrough": [
      "First consumer opens the shared resource.",
      "Second consumer reuses it.",
      "Only the last release closes it."
    ],
    "mistakes": [
      "Closing the socket whenever any component unmounts.",
      "Allowing counts to become negative.",
      "Leaving reconnect timers alive after the owner ends."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "A and B share a socket; A leaves. What happens to the socket?",
        "code": "",
        "options": [
          "Close immediately",
          "Keep it for B",
          "Open another for B"
        ],
        "answer": 1,
        "explanation": "B still owns a live lease."
      },
      {
        "id": "prediction-2",
        "prompt": "When should the resource close?",
        "code": "",
        "options": [
          "At the first release",
          "When the last live lease is released",
          "Only on a page refresh"
        ],
        "answer": 1,
        "explanation": "The transition from one live lease to zero ends ownership."
      }
    ],
    "repIds": [
      "shared-resource",
      "subscription-cleanup",
      "room-leases"
    ],
    "related": [
      "singleton",
      "events",
      "testing"
    ]
  },
  {
    "id": "caching",
    "title": "Caching and freshness",
    "summary": "Reuse a stored result only while its key and freshness policy permit it.",
    "prerequisites": [
      "lookup",
      "dependency-injection"
    ],
    "objectives": [
      "Distinguish an absent entry from cached zero and expired data.",
      "Define cache keys, equality at expiry, and invalidation policy."
    ],
    "sections": [
      {
        "title": "Cache keys are part of correctness",
        "body": "A cache stores results to avoid repeated work. Its key must include every input that changes the result, such as account, locale, or filters. Sharing a cache across accounts without identity in the key can show the wrong data. A cache miss differs from a cached falsy value."
      },
      {
        "title": "Freshness and invalidation",
        "body": "A time-to-live sets when an entry becomes stale, but it does not discover a server-side change before that deadline. Define whether equality is expired and whether stale data can be displayed during refresh. Bound storage and invalidate after relevant writes. A cache is an optimization, not the source of truth."
      }
    ],
    "example": "const entry = { value: 0, expiresAt: 100 }\nconst now = 100\nconst hit = now < entry.expiresAt // false\n// value 0 is valid data, not a cache miss.",
    "walkthrough": [
      "Check key identity before reading an entry.",
      "Use an explicit freshness comparison.",
      "At the exact expiry time this policy misses."
    ],
    "mistakes": [
      "Using value || fallback for zero.",
      "Ignoring account identity in keys.",
      "Treating TTL as immediate consistency."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Is an entry fresh at its expiresAt under this policy?",
        "code": "now < expiresAt",
        "options": [
          "Yes",
          "No",
          "Only if the value is truthy"
        ],
        "answer": 1,
        "explanation": "Equality is expired."
      },
      {
        "id": "prediction-2",
        "prompt": "Which information belongs in a cache key when it changes the response?",
        "code": "",
        "options": [
          "Account and filters",
          "Only the page title",
          "Nothing beyond the URL path"
        ],
        "answer": 0,
        "explanation": "All response-changing inputs matter."
      }
    ],
    "repIds": [
      "cache-freshness"
    ],
    "related": [
      "lookup",
      "dependency-injection",
      "testing"
    ]
  },
  {
    "id": "retries",
    "title": "Retries and reconnect backoff",
    "summary": "Retry eligible failures with a bound and an increasing delay.",
    "prerequisites": [
      "async",
      "websockets"
    ],
    "objectives": [
      "Compute a bounded exponential backoff sequence.",
      "Explain eligibility, cancellation, jitter, and safe repeated effects."
    ],
    "sections": [
      {
        "title": "Retry selectively",
        "body": "A retry repeats work after failure. A transient outage may justify it; invalid input or revoked access usually requires another action. Bound attempts, cancel obsolete retries, and ensure repeated writes are safe. A timeout does not establish that the server performed no work."
      },
      {
        "title": "Backoff and jitter",
        "body": "Exponential backoff doubles a base delay after consecutive failures until a cap. Jitter varies delays so many clients do not retry together. Reset the failure sequence after a successful connection, and stop on intentional disposal. Respect service-specific retry guidance, including Retry-After where relevant."
      }
    ],
    "example": "// Base 100 ms, cap 500 ms, no jitter.\n// Failure indices 0,1,2,3 produce 100,200,400,500.\n// Success resets the next index to 0.",
    "walkthrough": [
      "First failure uses the base delay.",
      "Consecutive failures increase the delay.",
      "The cap stops further growth."
    ],
    "mistakes": [
      "Retrying all failures forever.",
      "Reconnecting after logout.",
      "Retrying writes without idempotency."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "What is the delay at index 3 with base 100 and cap 500?",
        "code": "",
        "options": [
          "800",
          "500",
          "300"
        ],
        "answer": 1,
        "explanation": "The exponential delay is capped at 500."
      },
      {
        "id": "prediction-2",
        "prompt": "What does jitter help reduce?",
        "code": "",
        "options": [
          "Many clients retrying at the same moment",
          "All application bugs",
          "The need for cancellation"
        ],
        "answer": 0,
        "explanation": "Spreading delays reduces synchronized retry bursts."
      }
    ],
    "repIds": [
      "retry-backoff"
    ],
    "related": [
      "async",
      "websockets",
      "testing"
    ]
  },
  {
    "id": "idempotency",
    "title": "Idempotency and safe repeated requests",
    "summary": "Prevent repeated delivery of one logical operation from repeating its effect.",
    "prerequisites": [
      "http",
      "retries"
    ],
    "objectives": [
      "Recognize matching retries and conflicts under one operation key.",
      "Explain key scope, durable atomic handling, and timeout uncertainty."
    ],
    "sections": [
      {
        "title": "Same effect when repeated",
        "body": "An idempotent operation has the same intended server effect when repeated as when applied once. Setting a preference to false can be idempotent; incrementing a balance usually is not. Responses need not be byte-for-byte identical. HTTP method semantics and application idempotency keys are related but distinct."
      },
      {
        "title": "Keys need a server contract",
        "body": "A client can reuse one key for retries of the same logical operation. The server must atomically associate that key, operation scope, request fingerprint, and outcome. A repeated key with a different payload should not silently perform another operation. Define expiry and concurrent handling. A browser-side Set alone does not guarantee production exactly-once effects."
      }
    ],
    "example": "// key K, amount 5: apply +5 and store result\n// retry key K, amount 5: return stored outcome, add nothing\n// key K, amount 9: conflict, add nothing\n// key L, amount 5: a different operation, apply +5",
    "walkthrough": [
      "The first key identifies a logical operation.",
      "A matching retry reuses its recorded outcome.",
      "A different payload under that key is rejected."
    ],
    "mistakes": [
      "Generating a fresh key for each retry.",
      "Deduplicating by amount instead of operation.",
      "Assuming a client cache protects concurrent server writes."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "Which key should a retry of the same logical operation use?",
        "code": "",
        "options": [
          "The original key",
          "A new key every time",
          "No key"
        ],
        "answer": 0,
        "explanation": "Reusing the key lets the server recognize the operation."
      },
      {
        "id": "prediction-2",
        "prompt": "What should a different payload under the same key do in this lesson?",
        "code": "",
        "options": [
          "Apply again",
          "Report a conflict",
          "Overwrite the earlier operation"
        ],
        "answer": 1,
        "explanation": "The key must not silently identify a different operation."
      }
    ],
    "repIds": [
      "idempotent-ledger"
    ],
    "related": [
      "http",
      "retries",
      "testing"
    ]
  },
  {
    "id": "optimistic-updates",
    "title": "Optimistic updates and rollback",
    "summary": "Show a tentative change while preserving a correct confirmed baseline.",
    "prerequisites": [
      "request-ownership",
      "idempotency"
    ],
    "objectives": [
      "Separate confirmed state from pending per-operation deltas.",
      "Rollback one failed change without erasing another confirmed change."
    ],
    "sections": [
      {
        "title": "Tentative is not confirmed",
        "body": "An optimistic UI displays a predicted result before a request succeeds. Record the confirmed baseline and identify each pending operation. On success commit it; on failure remove or compensate for it. Show pending and failure feedback so the person can understand what happened."
      },
      {
        "title": "Concurrent changes need ownership",
        "body": "Restoring one old snapshot can erase another successful change. For independent additive changes, derive display as confirmed plus pending deltas. More complex edits need ordering, versions, or reconciliation with server truth. A server may return canonical data that differs from the prediction."
      }
    ],
    "example": "// Confirmed balance 10.\n// Pending A:+2 and B:+3 → display 15.\n// B succeeds → confirmed 13, pending A:+2 → display 15.\n// A fails → confirmed 13, pending empty → display 13.",
    "walkthrough": [
      "Each pending operation has its own identity.",
      "Success moves only that delta into confirmed.",
      "Failure removes only the failing delta."
    ],
    "mistakes": [
      "Rolling back the entire display to one stale snapshot.",
      "Treating a prediction as server confirmation."
    ],
    "questions": [
      {
        "id": "prediction-1",
        "prompt": "What remains after B succeeds and A fails in the example?",
        "code": "",
        "options": [
          "10",
          "13",
          "15"
        ],
        "answer": 1,
        "explanation": "B’s confirmed +3 remains; only A’s tentative +2 is removed."
      },
      {
        "id": "prediction-2",
        "prompt": "What should the UI call an unconfirmed optimistic result?",
        "code": "",
        "options": [
          "Pending",
          "Guaranteed persisted",
          "A cache miss"
        ],
        "answer": 0,
        "explanation": "The predicted change has not been confirmed yet."
      }
    ],
    "repIds": [
      "optimistic-balance"
    ],
    "related": [
      "request-ownership",
      "idempotency",
      "testing"
    ]
  }
]

export const practicalReps: Rep[] = [
  {
    "id": "closure-counters",
    "title": "Build independent counters",
    "category": "Practical concepts",
    "prompt": "Implement makeCounter(start), returning a function that adds one to its private count and returns it. Implement counterTrace(starts, calls): create one counter per start, then call the counter at each index in calls and return the resulting numbers.",
    "example": {
      "input": "counterTrace([0, 10], [0, 0, 1, 0])",
      "output": "[1, 2, 11, 3]"
    },
    "note": "Starts are finite integers; call indices are valid. Empty calls return []. The checks inspect outputs; review your code to confirm state belongs to the returned closure. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Closure",
        "meaning": "A returned function that keeps variables from the place where it was created."
      }
    ],
    "planPrompt": "Where does each counter keep its count? After calling the first counter, what does the second return?",
    "starter": "function makeCounter(start: number): () => number {\n  return () => start\n}\nfunction counterTrace(starts: number[], calls: number[]): number[] {\n  // Create and call the counters.\n  return []\n}",
    "functionName": "counterTrace",
    "preserveInput": true,
    "hints": [
      "Each factory call needs its own local binding.",
      "Increment that binding inside the returned function.",
      "Map starts to counters, then map call indices to their results."
    ],
    "checks": [
      {
        "name": "Separates counters",
        "input": [
          [
            0,
            10
          ],
          [
            0,
            0,
            1,
            0
          ]
        ],
        "expected": [
          1,
          2,
          11,
          3
        ]
      },
      {
        "name": "No calls",
        "input": [
          [
            3
          ],
          []
        ],
        "expected": []
      },
      {
        "name": "Negative start",
        "input": [
          [
            -2
          ],
          [
            0,
            0
          ]
        ],
        "expected": [
          -1,
          0
        ]
      },
      {
        "name": "No counters",
        "input": [
          [],
          []
        ],
        "expected": []
      }
    ]
  },
  {
    "id": "reference-groups",
    "title": "Count distinct referenced objects",
    "category": "Practical concepts",
    "prompt": "Within referenceGroups(pool, indices), create one object {id} for every number in pool. Each index selects that exact object. Return the number of distinct object references selected, even if different pool entries have equal IDs.",
    "example": {
      "input": "referenceGroups([7, 7], [0, 1, 0])",
      "output": "2"
    },
    "note": "Pool values are finite integers; indices are valid. Construct the objects inside the function because the exercise runner copies inputs. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Reference",
        "meaning": "A link to one particular object."
      }
    ],
    "planPrompt": "Which selections point to the same object? How do equal IDs differ from equal references?",
    "starter": "function referenceGroups(pool: number[], indices: number[]): number {\n  return 0\n}",
    "functionName": "referenceGroups",
    "preserveInput": true,
    "hints": [
      "Create the pool objects once.",
      "Select existing references rather than making new objects.",
      "Put the selected references in a Set and return its size."
    ],
    "checks": [
      {
        "name": "Equal IDs remain separate",
        "input": [
          [
            7,
            7
          ],
          [
            0,
            1,
            0
          ]
        ],
        "expected": 2
      },
      {
        "name": "Repeated reference",
        "input": [
          [
            4
          ],
          [
            0,
            0,
            0
          ]
        ],
        "expected": 1
      },
      {
        "name": "Empty selection",
        "input": [
          [
            1
          ],
          []
        ],
        "expected": 0
      },
      {
        "name": "Empty pool",
        "input": [
          [],
          []
        ],
        "expected": 0
      }
    ]
  },
  {
    "id": "event-loop-order",
    "title": "Predict one event-loop turn",
    "category": "Practical concepts",
    "prompt": "Implement turnOrder(entries). Each entry has kind sync, micro, or timer and a label. All entries are encountered during one synchronous script. Return synchronous labels in encounter order, then microtask labels in encounter order, then timer labels in encounter order.",
    "example": {
      "input": "turnOrder([{\"kind\": \"sync\", \"label\": \"A\"}, {\"kind\": \"timer\", \"label\": \"T\"}, {\"kind\": \"micro\", \"label\": \"P\"}, {\"kind\": \"sync\", \"label\": \"B\"}])",
      "output": "[\"A\", \"B\", \"P\", \"T\"]"
    },
    "note": "This is a simplified queue model: callbacks do not enqueue more work; timers have the same delay and none is cancelled. Do not use actual timers. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Microtask",
        "meaning": "Work queued to run after the current script and before the next timer task."
      }
    ],
    "planPrompt": "Which labels belong to each kind of work? What order must each group keep?",
    "starter": "function turnOrder(entries: {kind: 'sync' | 'micro' | 'timer'; label: string}[]): string[] {\n  return []\n}",
    "functionName": "turnOrder",
    "preserveInput": true,
    "hints": [
      "Separate encountered work into three queues.",
      "Preserve order within each kind.",
      "Return sync, micro, and timer labels in that order."
    ],
    "checks": [
      {
        "name": "Synchronous before queued",
        "input": [
          [
            {
              "kind": "sync",
              "label": "A"
            },
            {
              "kind": "timer",
              "label": "T"
            },
            {
              "kind": "micro",
              "label": "P"
            },
            {
              "kind": "sync",
              "label": "B"
            }
          ]
        ],
        "expected": [
          "A",
          "B",
          "P",
          "T"
        ]
      },
      {
        "name": "Empty turn",
        "input": [
          []
        ],
        "expected": []
      },
      {
        "name": "Stable queue order",
        "input": [
          [
            {
              "kind": "micro",
              "label": "P1"
            },
            {
              "kind": "micro",
              "label": "P2"
            },
            {
              "kind": "timer",
              "label": "T"
            }
          ]
        ],
        "expected": [
          "P1",
          "P2",
          "T"
        ]
      },
      {
        "name": "Timers only",
        "input": [
          [
            {
              "kind": "timer",
              "label": "T1"
            },
            {
              "kind": "timer",
              "label": "T2"
            }
          ]
        ],
        "expected": [
          "T1",
          "T2"
        ]
      }
    ]
  },
  {
    "id": "promise-outcomes",
    "title": "Collect settled request outcomes",
    "category": "Practical concepts",
    "prompt": "Implement settledSummary(outcomes). Each outcome is fulfilled with a numeric value, or rejected with a reason string. Return {values, errors}, preserving encounter order within each list. These are the records after Promise.allSettled has completed.",
    "example": {
      "input": "settledSummary([{\"status\": \"fulfilled\", \"value\": 0}, {\"status\": \"rejected\", \"reason\": \"Offline\"}, {\"status\": \"fulfilled\", \"value\": 4}])",
      "output": "{\"values\": [0, 4], \"errors\": [\"Offline\"]}"
    },
    "note": "Values are finite numbers; reasons are strings. This synchronous exercise handles settled records, not promises or network requests. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Fulfilled",
        "meaning": "A promise that finished with a value."
      }
    ],
    "planPrompt": "Where will fulfilled values and rejected reasons go? How will each list keep its input order?",
    "starter": "type Outcome = {status: 'fulfilled'; value: number} | {status: 'rejected'; reason: string}\nfunction settledSummary(outcomes: Outcome[]): {values: number[]; errors: string[]} {\n  return {values: [], errors: []}\n}",
    "functionName": "settledSummary",
    "preserveInput": true,
    "hints": [
      "Use the status discriminant rather than truthiness.",
      "Append each payload to the corresponding result list.",
      "Keep zero values and empty reason strings."
    ],
    "checks": [
      {
        "name": "Keeps both kinds",
        "input": [
          [
            {
              "status": "fulfilled",
              "value": 0
            },
            {
              "status": "rejected",
              "reason": "Offline"
            },
            {
              "status": "fulfilled",
              "value": 4
            }
          ]
        ],
        "expected": {
          "values": [
            0,
            4
          ],
          "errors": [
            "Offline"
          ]
        }
      },
      {
        "name": "No outcomes",
        "input": [
          []
        ],
        "expected": {
          "values": [],
          "errors": []
        }
      },
      {
        "name": "All rejected",
        "input": [
          [
            {
              "status": "rejected",
              "reason": ""
            },
            {
              "status": "rejected",
              "reason": "Timeout"
            }
          ]
        ],
        "expected": {
          "values": [],
          "errors": [
            "",
            "Timeout"
          ]
        }
      }
    ]
  },
  {
    "id": "singleton-owner",
    "title": "Reuse an instance within its owner",
    "category": "Practical concepts",
    "prompt": "Implement makeOwner(), returning a getter that returns the same object every time. Implement ownerTrace(ownerCount, accesses): create ownerCount separate getters; for each owner index in accesses, call its getter and return the object’s first-seen identity number. Assign identity numbers starting at 1 in access order.",
    "example": {
      "input": "ownerTrace(2, [0, 0, 1, 0, 1])",
      "output": "[1, 1, 2, 1, 2]"
    },
    "note": "ownerCount is a nonnegative integer and access indices are valid. Each owner must have its own cache. Output checks cannot prove a particular pattern: inspect makeOwner in self-review. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Singleton",
        "meaning": "One shared instance within a chosen scope."
      }
    ],
    "planPrompt": "Which getter calls must return the same object? When should a new identity number be assigned?",
    "starter": "function makeOwner(): () => object {\n  return () => ({})\n}\nfunction ownerTrace(ownerCount: number, accesses: number[]): number[] {\n  return []\n}",
    "functionName": "ownerTrace",
    "preserveInput": true,
    "hints": [
      "Keep a cache inside each makeOwner invocation.",
      "Call getters and store object references as Map keys.",
      "For a new reference assign the next identity number; reuse its existing number otherwise."
    ],
    "checks": [
      {
        "name": "Reuses each owner",
        "input": [
          2,
          [
            0,
            0,
            1,
            0,
            1
          ]
        ],
        "expected": [
          1,
          1,
          2,
          1,
          2
        ]
      },
      {
        "name": "Access order defines identity",
        "input": [
          3,
          [
            2,
            0,
            2,
            1
          ]
        ],
        "expected": [
          1,
          2,
          1,
          3
        ]
      },
      {
        "name": "No access",
        "input": [
          2,
          []
        ],
        "expected": []
      },
      {
        "name": "No owners",
        "input": [
          0,
          []
        ],
        "expected": []
      }
    ]
  },
  {
    "id": "pubsub-trace",
    "title": "Route events to active subscribers",
    "category": "Practical concepts",
    "prompt": "Implement deliveries(events). An event is subscribe with topic and listener, unsubscribe with topic and listener, or publish with topic and value. Return strings listener:value for each delivery in registration order. Registering the same listener twice on the same topic is a no-op. Unsubscribe is a no-op if absent. Re-subscribing after removal places the listener last.",
    "example": {
      "input": "deliveries([{\"kind\": \"subscribe\", \"topic\": \"x\", \"listener\": \"A\"}, {\"kind\": \"publish\", \"topic\": \"x\", \"value\": \"1\"}, {\"kind\": \"unsubscribe\", \"topic\": \"x\", \"listener\": \"A\"}, {\"kind\": \"publish\", \"topic\": \"x\", \"value\": \"2\"}])",
      "output": "[\"A:1\"]"
    },
    "note": "Topic and listener names are nonempty strings; values are strings. Different topics may use the same listener name. Delivery is synchronous and has no replay. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Topic",
        "meaning": "A named channel for messages."
      },
      {
        "term": "Listener",
        "meaning": "A function registered to receive messages on a topic."
      }
    ],
    "planPrompt": "After an unsubscribe and a re-subscribe, which listener receives the next publish first?",
    "starter": "type BusEvent = {kind: 'subscribe' | 'unsubscribe'; topic: string; listener: string} | {kind: 'publish'; topic: string; value: string}\nfunction deliveries(events: BusEvent[]): string[] {\n  return []\n}",
    "functionName": "deliveries",
    "preserveInput": true,
    "hints": [
      "Track an ordered set of listener names for each topic.",
      "Subscribe adds and unsubscribe removes without creating duplicate registrations.",
      "On publish, append one formatted result for each current listener on that topic."
    ],
    "checks": [
      {
        "name": "Stops delivery after unsubscribe",
        "input": [
          [
            {
              "kind": "subscribe",
              "topic": "x",
              "listener": "A"
            },
            {
              "kind": "publish",
              "topic": "x",
              "value": "1"
            },
            {
              "kind": "unsubscribe",
              "topic": "x",
              "listener": "A"
            },
            {
              "kind": "publish",
              "topic": "x",
              "value": "2"
            }
          ]
        ],
        "expected": [
          "A:1"
        ]
      },
      {
        "name": "Empty bus",
        "input": [
          []
        ],
        "expected": []
      },
      {
        "name": "Topic isolation and duplicate subscription",
        "input": [
          [
            {
              "kind": "subscribe",
              "topic": "x",
              "listener": "A"
            },
            {
              "kind": "subscribe",
              "topic": "x",
              "listener": "A"
            },
            {
              "kind": "subscribe",
              "topic": "y",
              "listener": "B"
            },
            {
              "kind": "publish",
              "topic": "x",
              "value": "0"
            }
          ]
        ],
        "expected": [
          "A:0"
        ]
      },
      {
        "name": "Re-registration moves last",
        "input": [
          [
            {
              "kind": "subscribe",
              "topic": "x",
              "listener": "A"
            },
            {
              "kind": "subscribe",
              "topic": "x",
              "listener": "B"
            },
            {
              "kind": "unsubscribe",
              "topic": "x",
              "listener": "A"
            },
            {
              "kind": "subscribe",
              "topic": "x",
              "listener": "A"
            },
            {
              "kind": "publish",
              "topic": "x",
              "value": "v"
            }
          ]
        ],
        "expected": [
          "B:v",
          "A:v"
        ]
      },
      {
        "name": "Unknown unsubscribe or publish",
        "input": [
          [
            {
              "kind": "unsubscribe",
              "topic": "z",
              "listener": "A"
            },
            {
              "kind": "publish",
              "topic": "z",
              "value": "v"
            }
          ]
        ],
        "expected": []
      }
    ]
  },
  {
    "id": "injected-clock",
    "title": "Check deadlines with an injected clock",
    "category": "Practical concepts",
    "prompt": "Implement isExpired(deadline, now), calling now exactly once and returning true when its value is at least deadline. Implement deadlineTrace(deadlines, clockValues): use a fake clock that returns successive clockValues, call isExpired for each deadline, and return {expired, calls}.",
    "example": {
      "input": "deadlineTrace([100, 100, 100], [99, 100, 101])",
      "output": "{\"expired\": [false, true, true], \"calls\": 3}"
    },
    "note": "Arrays have equal lengths and finite nonnegative numbers. Empty arrays produce {expired:[], calls:0}. Use the injected callback; do not read the actual clock. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Dependency",
        "meaning": "A function or value supplied for another function to use."
      }
    ],
    "planPrompt": "How will you count clock reads? What should happen when the clock equals the deadline?",
    "starter": "function isExpired(deadline: number, now: () => number): boolean {\n  return false\n}\nfunction deadlineTrace(deadlines: number[], clockValues: number[]): {expired: boolean[]; calls: number} {\n  return {expired: [], calls: 0}\n}",
    "functionName": "deadlineTrace",
    "preserveInput": true,
    "hints": [
      "isExpired should obtain one timestamp from now.",
      "The fake clock advances a local index on each call.",
      "Map deadlines through isExpired and report the number of fake-clock calls."
    ],
    "checks": [
      {
        "name": "Checks equality and counts calls",
        "input": [
          [
            100,
            100,
            100
          ],
          [
            99,
            100,
            101
          ]
        ],
        "expected": {
          "expired": [
            false,
            true,
            true
          ],
          "calls": 3
        }
      },
      {
        "name": "Empty clocks",
        "input": [
          [],
          []
        ],
        "expected": {
          "expired": [],
          "calls": 0
        }
      },
      {
        "name": "Zero deadline",
        "input": [
          [
            0
          ],
          [
            0
          ]
        ],
        "expected": {
          "expired": [
            true
          ],
          "calls": 1
        }
      }
    ]
  },
  {
    "id": "debounce-schedule",
    "title": "Compute trailing debounce emissions",
    "category": "Practical concepts",
    "prompt": "Implement debounceSchedule(events, wait). Events have at and value. Emit the latest pending value at its timestamp plus wait unless replaced by an event strictly before that deadline. When an event arrives exactly at a pending deadline, emit the pending value first, then start a new wait for the new event. Return {at,value} emissions, including the final pending emission.",
    "example": {
      "input": "debounceSchedule([{\"at\": 0, \"value\": \"A\"}, {\"at\": 60, \"value\": \"B\"}, {\"at\": 200, \"value\": \"C\"}], 100)",
      "output": "[{\"at\": 160, \"value\": \"B\"}, {\"at\": 300, \"value\": \"C\"}]"
    },
    "note": "Times are nonnegative finite integers in nondecreasing order; wait is a positive finite integer. This is a deterministic scheduling model, not real timers. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Debounce",
        "meaning": "Wait for a quiet period before using the latest event."
      }
    ],
    "planPrompt": "What pending value and deadline must you track? What happens when an event arrives exactly at that deadline?",
    "starter": "function debounceSchedule(events: {at: number; value: string}[], wait: number): {at: number; value: string}[] {\n  return []\n}",
    "functionName": "debounceSchedule",
    "preserveInput": true,
    "hints": [
      "Keep one pending emission with its deadline.",
      "Before replacing it, emit it if the incoming timestamp is at least its deadline.",
      "Set the new deadline to event.at + wait, and emit any pending result at the end."
    ],
    "checks": [
      {
        "name": "Replaces within quiet period",
        "input": [
          [
            {
              "at": 0,
              "value": "A"
            },
            {
              "at": 60,
              "value": "B"
            },
            {
              "at": 200,
              "value": "C"
            }
          ],
          100
        ],
        "expected": [
          {
            "at": 160,
            "value": "B"
          },
          {
            "at": 300,
            "value": "C"
          }
        ]
      },
      {
        "name": "No events",
        "input": [
          [],
          100
        ],
        "expected": []
      },
      {
        "name": "Equality emits previous",
        "input": [
          [
            {
              "at": 0,
              "value": "A"
            },
            {
              "at": 100,
              "value": "B"
            }
          ],
          100
        ],
        "expected": [
          {
            "at": 100,
            "value": "A"
          },
          {
            "at": 200,
            "value": "B"
          }
        ]
      },
      {
        "name": "Same-time latest wins",
        "input": [
          [
            {
              "at": 0,
              "value": "A"
            },
            {
              "at": 0,
              "value": "B"
            }
          ],
          10
        ],
        "expected": [
          {
            "at": 10,
            "value": "B"
          }
        ]
      }
    ]
  },
  {
    "id": "leading-throttle",
    "title": "Keep leading throttle events",
    "category": "Practical concepts",
    "prompt": "Implement throttleTimes(times, window). Accept the first timestamp, then accept only timestamps at least window after the last accepted timestamp. Return accepted timestamps. Rejected timestamps do not move the window; there is no trailing emission.",
    "example": {
      "input": "throttleTimes([0, 60, 100, 150, 200], 100)",
      "output": "[0, 100, 200]"
    },
    "note": "Times are nonnegative finite integers in nondecreasing order; window is a positive finite integer. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Throttle",
        "meaning": "Limit how often events are accepted."
      }
    ],
    "planPrompt": "Which accepted timestamp starts the next window? Does a rejected timestamp change it?",
    "starter": "function throttleTimes(times: number[], window: number): number[] {\n  return []\n}",
    "functionName": "throttleTimes",
    "preserveInput": true,
    "hints": [
      "Keep the timestamp of the last accepted event.",
      "Accept the first event even when it is at zero.",
      "Update the timestamp only after accepting an event."
    ],
    "checks": [
      {
        "name": "Accepts exact boundaries",
        "input": [
          [
            0,
            60,
            100,
            150,
            200
          ],
          100
        ],
        "expected": [
          0,
          100,
          200
        ]
      },
      {
        "name": "No events",
        "input": [
          [],
          10
        ],
        "expected": []
      },
      {
        "name": "Rejected does not shift window",
        "input": [
          [
            5,
            14,
            15
          ],
          10
        ],
        "expected": [
          5,
          15
        ]
      },
      {
        "name": "Duplicate times",
        "input": [
          [
            0,
            0,
            1
          ],
          1
        ],
        "expected": [
          0,
          1
        ]
      }
    ]
  },
  {
    "id": "latest-request",
    "title": "Reject obsolete request results",
    "category": "Practical concepts",
    "prompt": "Implement visibleResponse(events). start establishes the current request ID and clears visible data. cancel removes ownership and clears data only if its ID is current. resolve sets visible data only if its ID is current. Return the final visible string or null.",
    "example": {
      "input": "visibleResponse([{\"kind\": \"start\", \"id\": \"A\"}, {\"kind\": \"start\", \"id\": \"B\"}, {\"kind\": \"resolve\", \"id\": \"B\", \"value\": \"new\"}, {\"kind\": \"resolve\", \"id\": \"A\", \"value\": \"old\"}])",
      "output": "\"new\""
    },
    "note": "Events are start/cancel with id, or resolve with id and value. IDs are unique per start; cancelled IDs are not reused. Events may include late responses for obsolete requests. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Request ID",
        "meaning": "A label used to identify one request."
      }
    ],
    "planPrompt": "Which request may change visible data? Trace a cancellation followed by a late response.",
    "starter": "type RequestEvent = {kind: 'start' | 'cancel'; id: string} | {kind: 'resolve'; id: string; value: string}\nfunction visibleResponse(events: RequestEvent[]): string | null {\n  return null\n}",
    "functionName": "visibleResponse",
    "preserveInput": true,
    "hints": [
      "Keep current request identity separately from visible data.",
      "start replaces the owner; cancel only affects the matching owner.",
      "Accept resolve only when its identity matches current."
    ],
    "checks": [
      {
        "name": "Late old result cannot overwrite",
        "input": [
          [
            {
              "kind": "start",
              "id": "A"
            },
            {
              "kind": "start",
              "id": "B"
            },
            {
              "kind": "resolve",
              "id": "B",
              "value": "new"
            },
            {
              "kind": "resolve",
              "id": "A",
              "value": "old"
            }
          ]
        ],
        "expected": "new"
      },
      {
        "name": "No request",
        "input": [
          []
        ],
        "expected": null
      },
      {
        "name": "Cancelled owner ignores late response",
        "input": [
          [
            {
              "kind": "start",
              "id": "A"
            },
            {
              "kind": "cancel",
              "id": "A"
            },
            {
              "kind": "resolve",
              "id": "A",
              "value": "late"
            }
          ]
        ],
        "expected": null
      },
      {
        "name": "Old cancellation cannot clear new state",
        "input": [
          [
            {
              "kind": "start",
              "id": "A"
            },
            {
              "kind": "start",
              "id": "B"
            },
            {
              "kind": "resolve",
              "id": "B",
              "value": ""
            },
            {
              "kind": "cancel",
              "id": "A"
            }
          ]
        ],
        "expected": ""
      },
      {
        "name": "New start clears previous data",
        "input": [
          [
            {
              "kind": "start",
              "id": "A"
            },
            {
              "kind": "resolve",
              "id": "A",
              "value": "old"
            },
            {
              "kind": "start",
              "id": "B"
            }
          ]
        ],
        "expected": null
      }
    ]
  },
  {
    "id": "websocket-gate",
    "title": "Gate messages by connection state",
    "category": "Practical concepts",
    "prompt": "Implement socketMessages(events). Begin disconnected. open makes the connection open; close makes it disconnected; send records its text only while open. Return the texts actually sent in order. Opening an already-open connection and closing a closed one are no-ops.",
    "example": {
      "input": "socketMessages([{\"kind\": \"send\", \"text\": \"early\"}, {\"kind\": \"open\"}, {\"kind\": \"send\", \"text\": \"ok\"}, {\"kind\": \"close\"}, {\"kind\": \"send\", \"text\": \"late\"}])",
      "output": "[\"ok\"]"
    },
    "note": "Events are open, close, or send with text. A send while disconnected is dropped, not queued. This model does not create a real WebSocket or establish server delivery. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Connection state",
        "meaning": "Whether a connection is open or disconnected."
      }
    ],
    "planPrompt": "When can a send be recorded? Trace a send before opening and another after closing.",
    "starter": "type SocketEvent = {kind: 'open' | 'close'} | {kind: 'send'; text: string}\nfunction socketMessages(events: SocketEvent[]): string[] {\n  return []\n}",
    "functionName": "socketMessages",
    "preserveInput": true,
    "hints": [
      "Keep one open/disconnected state.",
      "Update state on open and close.",
      "Append send text only when state is open."
    ],
    "checks": [
      {
        "name": "Drops disconnected sends",
        "input": [
          [
            {
              "kind": "send",
              "text": "early"
            },
            {
              "kind": "open"
            },
            {
              "kind": "send",
              "text": "ok"
            },
            {
              "kind": "close"
            },
            {
              "kind": "send",
              "text": "late"
            }
          ]
        ],
        "expected": [
          "ok"
        ]
      },
      {
        "name": "No events",
        "input": [
          []
        ],
        "expected": []
      },
      {
        "name": "Reopens connection",
        "input": [
          [
            {
              "kind": "open"
            },
            {
              "kind": "send",
              "text": "A"
            },
            {
              "kind": "close"
            },
            {
              "kind": "open"
            },
            {
              "kind": "send",
              "text": ""
            }
          ]
        ],
        "expected": [
          "A",
          ""
        ]
      },
      {
        "name": "Idempotent state transitions",
        "input": [
          [
            {
              "kind": "open"
            },
            {
              "kind": "open"
            },
            {
              "kind": "send",
              "text": "x"
            },
            {
              "kind": "close"
            },
            {
              "kind": "close"
            }
          ]
        ],
        "expected": [
          "x"
        ]
      }
    ]
  },
  {
    "id": "choose-live-transport",
    "title": "Choose a transport from requirements",
    "category": "Practical concepts",
    "prompt": "Implement chooseTransport(twoWay, serverPush). Return websocket when twoWay is true; otherwise return sse when serverPush is true; otherwise return polling. These booleans describe the exercise’s required capabilities and assume all transports are supported.",
    "example": {
      "input": "chooseTransport(true, true)",
      "output": "\"websocket\""
    },
    "note": "This is a capability-selection exercise, not a universal production recommendation. twoWay means both directions must use the same persistent connection. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Server push",
        "meaning": "The server sends updates without waiting for a new request."
      }
    ],
    "planPrompt": "Which requirement takes priority when both flags are true? What is chosen when both are false?",
    "starter": "function chooseTransport(twoWay: boolean, serverPush: boolean): 'websocket' | 'sse' | 'polling' {\n  return 'polling'\n}",
    "functionName": "chooseTransport",
    "preserveInput": true,
    "hints": [
      "Two-way on one connection requires WebSocket in this contract.",
      "Only after that, check the server-push requirement.",
      "With neither requirement, use polling."
    ],
    "checks": [
      {
        "name": "Bidirectional wins",
        "input": [
          true,
          true
        ],
        "expected": "websocket"
      },
      {
        "name": "One-way push",
        "input": [
          false,
          true
        ],
        "expected": "sse"
      },
      {
        "name": "Periodic refresh",
        "input": [
          false,
          false
        ],
        "expected": "polling"
      },
      {
        "name": "Bidirectional without push flag",
        "input": [
          true,
          false
        ],
        "expected": "websocket"
      }
    ]
  },
  {
    "id": "shared-resource",
    "title": "Track shared connection leases",
    "category": "Practical concepts",
    "prompt": "Implement resourceActions(events). acquire adds a named consumer; release removes it. Duplicate acquire and unknown release are no-ops. Return open on each transition from zero consumers to one and close on each transition from one to zero, in order.",
    "example": {
      "input": "resourceActions([{\"kind\": \"acquire\", \"id\": \"A\"}, {\"kind\": \"acquire\", \"id\": \"B\"}, {\"kind\": \"release\", \"id\": \"A\"}, {\"kind\": \"release\", \"id\": \"B\"}])",
      "output": "[\"open\", \"close\"]"
    },
    "note": "Consumer IDs are nonempty strings. Start with no consumers. An unfinished trace may leave the connection open; do not invent a final close. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Consumer",
        "meaning": "A named user of a shared resource."
      }
    ],
    "planPrompt": "Which consumers are active after each event? Which changes should open or close the resource?",
    "starter": "function resourceActions(events: {kind: 'acquire' | 'release'; id: string}[]): string[] {\n  return []\n}",
    "functionName": "resourceActions",
    "preserveInput": true,
    "hints": [
      "A Set can represent current consumers.",
      "Compare the size before and after each event.",
      "Emit only on zero-to-positive or positive-to-zero transitions."
    ],
    "checks": [
      {
        "name": "Last release closes",
        "input": [
          [
            {
              "kind": "acquire",
              "id": "A"
            },
            {
              "kind": "acquire",
              "id": "B"
            },
            {
              "kind": "release",
              "id": "A"
            },
            {
              "kind": "release",
              "id": "B"
            }
          ]
        ],
        "expected": [
          "open",
          "close"
        ]
      },
      {
        "name": "No owners",
        "input": [
          []
        ],
        "expected": []
      },
      {
        "name": "Duplicate and repeated cleanup",
        "input": [
          [
            {
              "kind": "release",
              "id": "A"
            },
            {
              "kind": "acquire",
              "id": "A"
            },
            {
              "kind": "acquire",
              "id": "A"
            },
            {
              "kind": "release",
              "id": "A"
            },
            {
              "kind": "release",
              "id": "A"
            }
          ]
        ],
        "expected": [
          "open",
          "close"
        ]
      },
      {
        "name": "Reopens after disposal",
        "input": [
          [
            {
              "kind": "acquire",
              "id": "A"
            },
            {
              "kind": "release",
              "id": "A"
            },
            {
              "kind": "acquire",
              "id": "B"
            }
          ]
        ],
        "expected": [
          "open",
          "close",
          "open"
        ]
      }
    ]
  },
  {
    "id": "cache-freshness",
    "title": "Read only fresh cache entries",
    "category": "Practical concepts",
    "prompt": "Implement freshValue(entries, key, now). Return the matching entry’s numeric value only if now is strictly less than expiresAt; return null if absent or expired.",
    "example": {
      "input": "freshValue([{\"key\": \"a\", \"value\": 0, \"expiresAt\": 10}], \"a\", 9)",
      "output": "0"
    },
    "note": "Entries have unique exact string keys, finite numeric values, and nonnegative finite expiry times. now is nonnegative and finite. A cached zero is valid. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Expiry",
        "meaning": "The time when a cached value stops being usable."
      }
    ],
    "planPrompt": "How will you distinguish a missing entry from a value of zero? What happens exactly at expiry?",
    "starter": "function freshValue(entries: {key: string; value: number; expiresAt: number}[], key: string, now: number): number | null {\n  return null\n}",
    "functionName": "freshValue",
    "preserveInput": true,
    "hints": [
      "Find the exact key before checking freshness.",
      "Use now < expiresAt, not <=.",
      "Return the value explicitly even when it is zero."
    ],
    "checks": [
      {
        "name": "Keeps cached zero",
        "input": [
          [
            {
              "key": "a",
              "value": 0,
              "expiresAt": 10
            }
          ],
          "a",
          9
        ],
        "expected": 0
      },
      {
        "name": "Equality is expired",
        "input": [
          [
            {
              "key": "a",
              "value": 3,
              "expiresAt": 10
            }
          ],
          "a",
          10
        ],
        "expected": null
      },
      {
        "name": "Absent key",
        "input": [
          [],
          "a",
          0
        ],
        "expected": null
      },
      {
        "name": "Other keys cannot match",
        "input": [
          [
            {
              "key": "b",
              "value": 8,
              "expiresAt": 100
            }
          ],
          "a",
          0
        ],
        "expected": null
      },
      {
        "name": "Past expiry",
        "input": [
          [
            {
              "key": "a",
              "value": 3,
              "expiresAt": 10
            }
          ],
          "a",
          11
        ],
        "expected": null
      }
    ]
  },
  {
    "id": "retry-backoff",
    "title": "Calculate bounded retry delays",
    "category": "Practical concepts",
    "prompt": "Implement retryDelays(failures, base, cap). For consecutive failure indices starting at zero, return min(cap, base * 2^index). Return one delay for each failure.",
    "example": {
      "input": "retryDelays(5, 100, 500)",
      "output": "[100, 200, 400, 500, 500]"
    },
    "note": "failures is an integer from 0 to 30; base and cap are positive finite integers with base <= cap and cap <= 1000000. This exercise excludes jitter and does not decide which failures are eligible. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Backoff",
        "meaning": "A delay that grows between failed attempts."
      }
    ],
    "planPrompt": "What delay belongs to failure index zero? When does growth reach the cap?",
    "starter": "function retryDelays(failures: number, base: number, cap: number): number[] {\n  return []\n}",
    "functionName": "retryDelays",
    "preserveInput": true,
    "hints": [
      "Start with the base delay for index zero.",
      "Double after each recorded failure.",
      "Clamp every delay to the cap."
    ],
    "checks": [
      {
        "name": "Caps exponential growth",
        "input": [
          5,
          100,
          500
        ],
        "expected": [
          100,
          200,
          400,
          500,
          500
        ]
      },
      {
        "name": "No failures",
        "input": [
          0,
          100,
          500
        ],
        "expected": []
      },
      {
        "name": "Cap equals base",
        "input": [
          3,
          10,
          10
        ],
        "expected": [
          10,
          10,
          10
        ]
      },
      {
        "name": "One failure",
        "input": [
          1,
          7,
          100
        ],
        "expected": [
          7
        ]
      }
    ]
  },
  {
    "id": "idempotent-ledger",
    "title": "Deduplicate logical ledger operations",
    "category": "Practical concepts",
    "prompt": "Implement ledger(requests). Each request has key and integer amount. On the first occurrence of a key, add amount to total and record it. On a repeat with the same amount, add nothing. On a repeat with a different amount, append the key to conflicts and add nothing. Return {total, conflicts}; record every conflicting occurrence in encounter order.",
    "example": {
      "input": "ledger([{\"key\": \"K\", \"amount\": 5}, {\"key\": \"K\", \"amount\": 5}, {\"key\": \"K\", \"amount\": 9}, {\"key\": \"L\", \"amount\": 5}])",
      "output": "{\"total\": 10, \"conflicts\": [\"K\"]}"
    },
    "note": "Keys are nonempty exact strings; amounts are integers from -1000 to 1000. The first amount for each key remains authoritative. This local model does not validate atomic server persistence. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Idempotency key",
        "meaning": "A label that identifies repeated deliveries of the same operation."
      }
    ],
    "planPrompt": "What amount must you remember for each key? How do matching and conflicting repeats affect the total?",
    "starter": "function ledger(requests: {key: string; amount: number}[]): {total: number; conflicts: string[]} {\n  return {total: 0, conflicts: []}\n}",
    "functionName": "ledger",
    "preserveInput": true,
    "hints": [
      "Store the first amount in a Map keyed by operation identity.",
      "Use has to distinguish an absent key from an amount of zero.",
      "Only new keys affect total; mismatched repeats append a conflict."
    ],
    "checks": [
      {
        "name": "Retries and conflicts",
        "input": [
          [
            {
              "key": "K",
              "amount": 5
            },
            {
              "key": "K",
              "amount": 5
            },
            {
              "key": "K",
              "amount": 9
            },
            {
              "key": "L",
              "amount": 5
            }
          ]
        ],
        "expected": {
          "total": 10,
          "conflicts": [
            "K"
          ]
        }
      },
      {
        "name": "Empty ledger",
        "input": [
          []
        ],
        "expected": {
          "total": 0,
          "conflicts": []
        }
      },
      {
        "name": "Zero amount is recorded",
        "input": [
          [
            {
              "key": "Z",
              "amount": 0
            },
            {
              "key": "Z",
              "amount": 1
            }
          ]
        ],
        "expected": {
          "total": 0,
          "conflicts": [
            "Z"
          ]
        }
      },
      {
        "name": "Negative and repeated conflicts",
        "input": [
          [
            {
              "key": "a",
              "amount": -2
            },
            {
              "key": "a",
              "amount": 3
            },
            {
              "key": "a",
              "amount": 3
            },
            {
              "key": "a",
              "amount": -2
            }
          ]
        ],
        "expected": {
          "total": -2,
          "conflicts": [
            "a",
            "a"
          ]
        }
      }
    ]
  },
  {
    "id": "optimistic-balance",
    "title": "Reconcile independent optimistic changes",
    "category": "Practical concepts",
    "prompt": "Implement optimisticBalance(initial, events). begin with id and delta adds one pending operation unless the ID is already pending or settled. succeed moves that pending delta into confirmed and settles its ID. fail removes that pending delta and settles its ID. Unknown or repeated settlements are no-ops. Return {confirmed, displayed}, where displayed is confirmed plus pending deltas.",
    "example": {
      "input": "optimisticBalance(10, [{\"kind\": \"begin\", \"id\": \"A\", \"delta\": 2}, {\"kind\": \"begin\", \"id\": \"B\", \"delta\": 3}, {\"kind\": \"succeed\", \"id\": \"B\"}, {\"kind\": \"fail\", \"id\": \"A\"}])",
      "output": "{\"confirmed\": 13, \"displayed\": 13}"
    },
    "note": "Amounts are finite integers. Operation IDs are nonempty exact strings and may never represent a new operation after settlement. This additive model excludes server-adjusted values and noncommutative edits. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Pending operation",
        "meaning": "A change that has not yet succeeded or failed."
      }
    ],
    "planPrompt": "How do pending changes affect the displayed balance? What changes when one succeeds or fails?",
    "starter": "type ChangeEvent = {kind: 'begin'; id: string; delta: number} | {kind: 'succeed' | 'fail'; id: string}\nfunction optimisticBalance(initial: number, events: ChangeEvent[]): {confirmed: number; displayed: number} {\n  return {confirmed: initial, displayed: initial}\n}",
    "functionName": "optimisticBalance",
    "preserveInput": true,
    "hints": [
      "Keep pending deltas by ID and a set of settled IDs.",
      "Only known pending operations can settle; successful ones update confirmed.",
      "Compute display from confirmed plus remaining pending deltas."
    ],
    "checks": [
      {
        "name": "Failure preserves another success",
        "input": [
          10,
          [
            {
              "kind": "begin",
              "id": "A",
              "delta": 2
            },
            {
              "kind": "begin",
              "id": "B",
              "delta": 3
            },
            {
              "kind": "succeed",
              "id": "B"
            },
            {
              "kind": "fail",
              "id": "A"
            }
          ]
        ],
        "expected": {
          "confirmed": 13,
          "displayed": 13
        }
      },
      {
        "name": "Pending remains tentative",
        "input": [
          10,
          [
            {
              "kind": "begin",
              "id": "A",
              "delta": -2
            }
          ]
        ],
        "expected": {
          "confirmed": 10,
          "displayed": 8
        }
      },
      {
        "name": "No changes",
        "input": [
          0,
          []
        ],
        "expected": {
          "confirmed": 0,
          "displayed": 0
        }
      },
      {
        "name": "Duplicate and reused IDs do not reapply",
        "input": [
          1,
          [
            {
              "kind": "begin",
              "id": "A",
              "delta": 0
            },
            {
              "kind": "begin",
              "id": "A",
              "delta": 8
            },
            {
              "kind": "succeed",
              "id": "A"
            },
            {
              "kind": "succeed",
              "id": "A"
            },
            {
              "kind": "begin",
              "id": "A",
              "delta": 9
            }
          ]
        ],
        "expected": {
          "confirmed": 1,
          "displayed": 1
        }
      },
      {
        "name": "Unknown settlements do nothing",
        "input": [
          5,
          [
            {
              "kind": "succeed",
              "id": "x"
            },
            {
              "kind": "fail",
              "id": "y"
            }
          ]
        ],
        "expected": {
          "confirmed": 5,
          "displayed": 5
        }
      }
    ]
  },
  {
    "id": "subscription-cleanup",
    "title": "Keep subscription cleanup local",
    "category": "Practical concepts",
    "prompt": "Implement listenerCounts(events). listen adds a unique (owner, topic) registration; dispose removes every registration for that owner. Return the active registration count after every event. Duplicate listen is a no-op; dispose of an absent owner is a no-op. Owners may listen again after disposal. Owner and topic are nonempty exact strings and may contain punctuation.",
    "example": {
      "input": "listenerCounts([{\"kind\": \"listen\", \"owner\": \"A\", \"topic\": \"x\"}, {\"kind\": \"listen\", \"owner\": \"B\", \"topic\": \"x\"}, {\"kind\": \"listen\", \"owner\": \"A\", \"topic\": \"y\"}, {\"kind\": \"dispose\", \"owner\": \"A\"}])",
      "output": "[1, 2, 3, 1]"
    },
    "note": "Every event has a kind of listen or dispose, and owner and topic (listen only) are nonempty strings. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Owner",
        "meaning": "The named user responsible for a registration."
      },
      {
        "term": "Registration",
        "meaning": "A stored link between an owner and a topic."
      }
    ],
    "planPrompt": "Which registrations belong to each owner? After disposing one owner, which registrations remain?",
    "starter": "type ListenerEvent = {kind: 'listen'; owner: string; topic: string} | {kind: 'dispose'; owner: string}\nfunction listenerCounts(events: ListenerEvent[]): number[] {\n  return []\n}",
    "functionName": "listenerCounts",
    "preserveInput": true,
    "hints": [
      "Store each owner’s topics separately.",
      "Count a registration only when its owner-topic pair is new.",
      "On disposal subtract that owner’s registrations and remove the owner."
    ],
    "checks": [
      {
        "name": "Disposes only one owner",
        "input": [
          [
            {
              "kind": "listen",
              "owner": "A",
              "topic": "x"
            },
            {
              "kind": "listen",
              "owner": "B",
              "topic": "x"
            },
            {
              "kind": "listen",
              "owner": "A",
              "topic": "y"
            },
            {
              "kind": "dispose",
              "owner": "A"
            }
          ]
        ],
        "expected": [
          1,
          2,
          3,
          1
        ]
      },
      {
        "name": "Duplicate and absent cleanup",
        "input": [
          [
            {
              "kind": "dispose",
              "owner": "A"
            },
            {
              "kind": "listen",
              "owner": "A",
              "topic": "x"
            },
            {
              "kind": "listen",
              "owner": "A",
              "topic": "x"
            },
            {
              "kind": "dispose",
              "owner": "A"
            },
            {
              "kind": "dispose",
              "owner": "A"
            }
          ]
        ],
        "expected": [
          0,
          1,
          1,
          0,
          0
        ]
      },
      {
        "name": "No events",
        "input": [
          []
        ],
        "expected": []
      },
      {
        "name": "Composite identities cannot collide",
        "input": [
          [
            {
              "kind": "listen",
              "owner": "a:b",
              "topic": "c"
            },
            {
              "kind": "listen",
              "owner": "a",
              "topic": "b:c"
            }
          ]
        ],
        "expected": [
          1,
          2
        ]
      }
    ]
  },
  {
    "id": "room-leases",
    "title": "Recall ownership in room membership",
    "category": "Practical concepts",
    "prompt": "Implement emptyRooms(events). enter adds a named user to a named room; leave removes that user only from that room. Duplicate enter and absent leave are no-ops. Return room names whenever a previously occupied room becomes empty. Empty rooms may be occupied again; keep output in event order. Room and user are nonempty exact strings.",
    "example": {
      "input": "emptyRooms([{\"kind\": \"enter\", \"room\": \"x\", \"user\": \"A\"}, {\"kind\": \"enter\", \"room\": \"x\", \"user\": \"B\"}, {\"kind\": \"enter\", \"room\": \"y\", \"user\": \"A\"}, {\"kind\": \"leave\", \"room\": \"x\", \"user\": \"A\"}, {\"kind\": \"leave\", \"room\": \"y\", \"user\": \"A\"}, {\"kind\": \"leave\", \"room\": \"x\", \"user\": \"B\"}])",
      "output": "[\"y\", \"x\"]"
    },
    "note": "Every event has a kind of enter or leave, and room and user are nonempty strings. Do not change supplied arrays or objects.",
    "vocabulary": [
      {
        "term": "Owner",
        "meaning": "A named user who occupies a room."
      },
      {
        "term": "Registration",
        "meaning": "A stored link between a user and a room."
      }
    ],
    "planPrompt": "Which users remain in each room after a leave? When should an empty room be reported?",
    "starter": "function emptyRooms(events: {kind: 'enter' | 'leave'; room: string; user: string}[]): string[] {\n  return []\n}",
    "functionName": "emptyRooms",
    "preserveInput": true,
    "hints": [
      "Determine which membership each event affects.",
      "Detect a transition from occupied to empty, not merely an empty result.",
      "Track rooms independently and ignore duplicate operations."
    ],
    "checks": [
      {
        "name": "Rooms have separate membership",
        "input": [
          [
            {
              "kind": "enter",
              "room": "x",
              "user": "A"
            },
            {
              "kind": "enter",
              "room": "x",
              "user": "B"
            },
            {
              "kind": "enter",
              "room": "y",
              "user": "A"
            },
            {
              "kind": "leave",
              "room": "x",
              "user": "A"
            },
            {
              "kind": "leave",
              "room": "y",
              "user": "A"
            },
            {
              "kind": "leave",
              "room": "x",
              "user": "B"
            }
          ]
        ],
        "expected": [
          "y",
          "x"
        ]
      },
      {
        "name": "Absent leaves do nothing",
        "input": [
          [
            {
              "kind": "leave",
              "room": "z",
              "user": "A"
            }
          ]
        ],
        "expected": []
      },
      {
        "name": "No events",
        "input": [
          []
        ],
        "expected": []
      },
      {
        "name": "Repeated occupancy",
        "input": [
          [
            {
              "kind": "enter",
              "room": "x",
              "user": "A"
            },
            {
              "kind": "enter",
              "room": "x",
              "user": "A"
            },
            {
              "kind": "leave",
              "room": "x",
              "user": "A"
            },
            {
              "kind": "leave",
              "room": "x",
              "user": "A"
            },
            {
              "kind": "enter",
              "room": "x",
              "user": "B"
            },
            {
              "kind": "leave",
              "room": "x",
              "user": "B"
            }
          ]
        ],
        "expected": [
          "x",
          "x"
        ]
      }
    ]
  },
  ...asyncReps,
]
