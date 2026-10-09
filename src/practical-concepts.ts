import { asyncReps, asyncRepDepth, asyncGuides } from './async-reps.ts'
import type { Skill } from './knowledge.ts'
import type { Rep } from './rep.ts'
import type { RepDepth } from './rep-depth.ts'
import type { LessonDepth } from './lesson-depth.ts'

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
        "id": "prediction-2",
        "prompt": "What happens to a microtask queued by a microtask?",
        "code": "",
        "options": [
          "It runs during the draining checkpoint",
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
        "term": "Closures and private state",
        "meaning": "Keep a function connected to the variables where it was created."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Reference equality and shallow copies",
        "meaning": "Distinguish the same object from different objects with equal fields."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Event loop and microtasks",
        "meaning": "Predict synchronous work, promise callbacks, and timer tasks."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Promises and asynchronous work",
        "meaning": "Handle fulfilled and rejected outcomes explicitly."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Singleton and scoped shared instances",
        "meaning": "Share one instance within an explicitly chosen owner and lifetime."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Observer, pub/sub, and subscriptions",
        "meaning": "Deliver events to current subscribers without coupling every producer to every consumer."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Dependency injection",
        "meaning": "Pass a service or policy into the code that needs it."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Debouncing",
        "meaning": "Wait for a quiet period before using the latest event."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Throttling",
        "meaning": "Limit execution frequency while a stream of events continues."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Cancellation and race conditions",
        "meaning": "Apply a response only while its request still owns the current state."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "WebSockets and connection state",
        "meaning": "Exchange messages over a persistent two-way connection with explicit lifecycle state."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Polling and server-sent events",
        "meaning": "Choose between periodic requests, one-way server updates, and bidirectional messages."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Cleanup, reference counting, and shared connections",
        "meaning": "Keep a shared resource alive while consumers own it and release it after the last consumer leaves."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Caching and freshness",
        "meaning": "Reuse a stored result only while its key and freshness policy permit it."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Retries and reconnect backoff",
        "meaning": "Retry eligible failures with a bound and an increasing delay."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Idempotency and safe repeated requests",
        "meaning": "Prevent repeated delivery of one logical operation from repeating its effect."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Optimistic updates and rollback",
        "meaning": "Show a tentative change while preserving a correct confirmed baseline."
      }
    ],
    "planPrompt": "State the required behavior, trace a boundary case, and describe the state you need before coding.",
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
        "term": "Ownership",
        "meaning": "the responsibility for keeping work active and disposing it"
      }
    ],
    "planPrompt": "Describe who owns the work and trace a duplicate or absent operation before coding.",
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
        "term": "Ownership",
        "meaning": "the responsibility for keeping work active and disposing it"
      }
    ],
    "planPrompt": "Describe who owns the work and trace a duplicate or absent operation before coding.",
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

export const practicalRepDepth: Record<string, RepDepth> = {
  ...asyncRepDepth,
  "closure-counters": {
    "reasoning": "Each factory invocation owns a binding that survives through its returned function. The trace wrapper preserves call order.",
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
    "reasoning": "The model represents the current script finishing before its microtask checkpoint and the later timer tasks.",
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
    "reasoning": "Every accepted send is preceded by an unmatched open under this model. The state guard prevents disconnected sends from entering the output.",
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
    "title": "Closures and private state: a boundary to explain",
    "code": "function makeCounter() {\n  let count = 0\n  return () => ++count\n}\nconst a = makeCounter(), b = makeCounter()\na() // 1\na() // 2\nb() // 1",
    "reasoning": "Each factory invocation owns a binding that survives through its returned function. The trace wrapper preserves call order.",
    "challenge": "If two callbacks returned by one factory both read count, do they share it? What changes when the factory runs twice?",
    "answer": "Callbacks from one invocation share its environment; a second invocation creates a separate local count."
  },
  "reference-identity": {
    "title": "Reference equality and shallow copies: a boundary to explain",
    "code": "const original = { meta: { score: 1 } }\nconst alias = original\nconst copy = { ...original }\nalias === original // true\ncopy === original // false\ncopy.meta === original.meta // true",
    "reasoning": "Identity is preserved when each selection reuses an object created once for its pool position.",
    "challenge": "After copy.meta.score = 9 in the example, what is original.meta.score?",
    "answer": "It is 9 because the nested meta object is shared. Copy meta too before changing it."
  },
  "event-loop": {
    "title": "Event loop and microtasks: a boundary to explain",
    "code": "console.log(\"A\")\nsetTimeout(() => console.log(\"timer\"), 0)\nPromise.resolve().then(() => console.log(\"promise\"))\nconsole.log(\"B\")\n// A, B, promise, timer",
    "reasoning": "The model represents the current script finishing before its microtask checkpoint and the later timer tasks.",
    "challenge": "Can a long chain of microtasks make a zero-delay timer wait?",
    "answer": "Yes. Microtasks queued during draining are processed before the next task, so an unbounded chain can starve other work."
  },
  "singleton": {
    "title": "Singleton and scoped shared instances: a boundary to explain",
    "code": "function createOwner() {\n  let shared: object | undefined\n  return () => shared ??= {}\n}\nconst get = createOwner()\nget() === get() // true\ncreateOwner()() === get() // false",
    "reasoning": "Each owner caches one reference. Reference-keyed bookkeeping assigns the same identity number to repeated access and distinct numbers across owners.",
    "challenge": "What breaks if two accounts share a socket whose URL was captured for the first account?",
    "answer": "The second account uses the wrong resource. Scope ownership by account and dispose the old instance when that boundary changes."
  },
  "events": {
    "title": "Observer, pub/sub, and subscriptions: a boundary to explain",
    "code": "const stop = bus.subscribe(\"stock\", value => console.log(value))\nbus.publish(\"stock\", 3) // listener receives 3\nstop()\nbus.publish(\"stock\", 4) // no delivery to this registration",
    "reasoning": "A topic-specific ordered registration set represents exactly the current subscribers; publishing reads only that set.",
    "challenge": "Should a subscriber added during publish receive that same event?",
    "answer": "It depends on the authored policy. Snapshot delivery excludes registrations added mid-publication; document and test that choice."
  },
  "dependency-injection": {
    "title": "Dependency injection: a boundary to explain",
    "code": "function expired(deadline: number, now: () => number) {\n  return now() >= deadline\n}\nexpired(100, () => 100) // true\nexpired(100, Date.now) // uses a real clock",
    "reasoning": "A single clock read per decision gives the comparison one defined timestamp. Injection makes equality and call count observable without real time.",
    "challenge": "Can an injected dependency still mutate state?",
    "answer": "Yes. Injection makes dependency choice explicit; side effects depend on the supplied implementation."
  },
  "debouncing": {
    "title": "Debouncing: a boundary to explain",
    "code": "// Quiet period: 100 ms; trailing only.\n// Events: A at 0, B at 60, C at 200.\n// Emit B at 160, C at 300.\n// A is replaced before its deadline.",
    "reasoning": "The pending record is always the latest event not yet emitted. Testing its deadline before replacement preserves the explicit equality policy.",
    "challenge": "How would a leading debounce differ from this example?",
    "answer": "It may invoke immediately at the beginning of a burst. Combining leading and trailing behavior needs a separate contract and checks."
  },
  "throttling": {
    "title": "Throttling: a boundary to explain",
    "code": "// Leading throttle, window 100 ms.\n// Inputs at 0, 60, 100, 150, 200.\n// Accepted at 0, 100, 200.\n// Rejected events do not move the window.",
    "reasoning": "The last accepted timestamp anchors the suppression window, so each emitted pair is separated by at least window.",
    "challenge": "Why might a debounce never run during continuous typing while a throttle does?",
    "answer": "The debounce keeps resetting its quiet-period deadline. A throttle permits new executions once the previous accepted window ends."
  },
  "request-ownership": {
    "title": "Cancellation and race conditions: a boundary to explain",
    "code": "let current = 0\nasync function load(url: string) {\n  const mine = ++current\n  const data = await fetch(url).then(r => r.json())\n  if (mine === current) show(data)\n}\n// Also handle HTTP errors, failures, and cleanup in real code.",
    "reasoning": "Ownership, rather than arrival time, controls which result can update state. A pending owner ends on settlement. Ownership is scoped to the surface: one search screen can have one owner, while several preview slots need separate owners. Clearing data on start and preserving it during refresh are different display contracts.",
    "challenge": "Cover starts load A, then detail starts load B. Can one global current token safely allow both previews to complete? Explain how removal and duplicate completion should affect ownership.",
    "answer": "No: B would obsolete A even though the slots are independent. Each slot needs its own pending identity. Removing a slot removes that ownership; accepting its result ends the load so duplicates are ignored. Unsupported cancellation may leave work running, but the ownership check can still reject its obsolete result."
  },
  "websockets": {
    "title": "WebSockets and connection state: a boundary to explain",
    "code": "const socket = new WebSocket(\"wss://example.test/live\")\nsocket.addEventListener(\"open\", () => {\n  socket.send(JSON.stringify({ type: \"subscribe\", room: \"stock\" }))\n})\n// Dispose the connection and listeners when its owner ends.",
    "reasoning": "Every accepted send is preceded by an unmatched open under this model. The state guard prevents disconnected sends from entering the output.",
    "challenge": "If send returns, has the server necessarily processed the message?",
    "answer": "No. Local transport acceptance is not an application-level acknowledgment; design a reply or acknowledgment when required."
  },
  "live-transports": {
    "title": "Polling and server-sent events: a boundary to explain",
    "code": "const stream = new EventSource(\"/updates\")\nstream.addEventListener(\"message\", event => {\n  console.log(event.data)\n})\n// stream.close() stops this owner’s stream.\n// A separate POST can send a user action.",
    "reasoning": "The precedence matches the strongest required capability; the serverPush flag must not override twoWay.",
    "challenge": "If an SSE stream reconnects with a last event ID, are missed messages always recovered?",
    "answer": "No. Recovery requires a server that retains and replays events for that ID; IDs alone do not create a replay store."
  },
  "resource-ownership": {
    "title": "Cleanup, reference counting, and shared connections: a boundary to explain",
    "code": "// acquire A: 0 → 1, open resource\n// acquire B: 1 → 2, keep resource\n// release A: 2 → 1, keep resource\n// release B: 1 → 0, close resource",
    "reasoning": "The set equals current ownership, so duplicate operations cannot corrupt a numeric count. Only transitions across zero change the resource lifetime.",
    "challenge": "Why does a singleton getter alone fail to solve connection cleanup?",
    "answer": "It controls instance creation but does not record who still uses it, remove their subscriptions, or cancel its reconnect work."
  },
  "caching": {
    "title": "Caching and freshness: a boundary to explain",
    "code": "const entry = { value: 0, expiresAt: 100 }\nconst now = 100\nconst hit = now < entry.expiresAt // false\n// value 0 is valid data, not a cache miss.",
    "reasoning": "An entry must satisfy both identity and freshness; neither alone establishes a hit.",
    "challenge": "Can a fresh TTL entry still differ from the server?",
    "answer": "Yes. The server may change before expiry. TTL is a freshness policy, not a guarantee of immediate consistency."
  },
  "retries": {
    "title": "Retries and reconnect backoff: a boundary to explain",
    "code": "// Base 100 ms, cap 500 ms, no jitter.\n// Failure indices 0,1,2,3 produce 100,200,400,500.\n// Success resets the next index to 0.",
    "reasoning": "Each delay is the exponential sequence clamped at cap, so growth cannot produce a scheduled delay above the permitted limit.",
    "challenge": "Why should closing a shared connection intentionally cancel a pending reconnect?",
    "answer": "The owner has ended. Reconnecting would create work without a live consumer and can reopen a logged-out session."
  },
  "idempotency": {
    "title": "Idempotency and safe repeated requests: a boundary to explain",
    "code": "// key K, amount 5: apply +5 and store result\n// retry key K, amount 5: return stored outcome, add nothing\n// key K, amount 9: conflict, add nothing\n// key L, amount 5: a different operation, apply +5",
    "reasoning": "The first recorded payload fixes each key’s operation. Subsequent matching deliveries have no additional effect and mismatches cannot replace it.",
    "challenge": "Why can a timeout still require an idempotency key on retry?",
    "answer": "The server may have committed the first request before the client timed out. The same logical key lets the retry reuse that result."
  },
  "optimistic-updates": {
    "title": "Optimistic updates and rollback: a boundary to explain",
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
      "Each factory invocation owns a binding that survives through its returned function. The trace wrapper preserves call order.",
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
      "The model represents the current script finishing before its microtask checkpoint and the later timer tasks.",
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
      "Every accepted send is preceded by an unmatched open under this model. The state guard prevents disconnected sends from entering the output.",
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
