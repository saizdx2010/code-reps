import type { Rep } from './rep-types.ts'

// Deterministic exercises teach policy; they do not establish live integration behavior.
export const practicalReps: Rep[] = [
  {
    id: 'closure-counters',
    title: 'Build independent counters',
    category: 'Practical concepts',
    prompt:
      'Implement makeCounter(start), returning a function that adds one to its private count and returns it. Implement counterTrace(starts, calls): create one counter per start, then call the counter at each index in calls and return the resulting numbers.',
    example: { input: 'counterTrace([0, 10], [0, 0, 1, 0])', output: '[1, 2, 11, 3]' },
    note: 'Starts are finite integers; call indices are valid. Empty calls return []. The checks inspect outputs; review your code to confirm state belongs to the returned closure. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Closure', meaning: 'A returned function that keeps variables from the place where it was created.' }],
    planPrompt: 'Where does each counter keep its count? After calling the first counter, what does the second return?',
    starter:
      'function makeCounter(start: number): () => number {\n  return () => start\n}\nfunction counterTrace(starts: number[], calls: number[]): number[] {\n  // Create and call the counters.\n  return []\n}',
    functionName: 'counterTrace',
    preserveInput: true,
    hints: [
      'Each factory call needs its own local binding.',
      'Increment that binding inside the returned function.',
      'Map starts to counters, then map call indices to their results.',
    ],
    checks: [
      {
        name: 'Separates counters',
        input: [
          [0, 10],
          [0, 0, 1, 0],
        ],
        expected: [1, 2, 11, 3],
      },
      { name: 'No calls', input: [[3], []], expected: [] },
      { name: 'Negative start', input: [[-2], [0, 0]], expected: [-1, 0] },
      { name: 'No counters', input: [[], []], expected: [] },
    ],
  },
  {
    id: 'reference-groups',
    title: 'Count distinct referenced objects',
    category: 'Practical concepts',
    prompt:
      'Within referenceGroups(pool, indices), create one object {id} for every number in pool. Each index selects that exact object. Return the number of distinct object references selected, even if different pool entries have equal IDs.',
    example: { input: 'referenceGroups([7, 7], [0, 1, 0])', output: '2' },
    note: 'Pool values are finite integers; indices are valid. Construct the objects inside the function because the exercise runner copies inputs. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Reference', meaning: 'A link to one particular object.' }],
    planPrompt: 'Which selections point to the same object? How do equal IDs differ from equal references?',
    starter: 'function referenceGroups(pool: number[], indices: number[]): number {\n  return 0\n}',
    functionName: 'referenceGroups',
    preserveInput: true,
    hints: [
      'Create the pool objects once.',
      'Select existing references rather than making new objects.',
      'Put the selected references in a Set and return its size.',
    ],
    checks: [
      {
        name: 'Equal IDs remain separate',
        input: [
          [7, 7],
          [0, 1, 0],
        ],
        expected: 2,
      },
      { name: 'Repeated reference', input: [[4], [0, 0, 0]], expected: 1 },
      { name: 'Empty selection', input: [[1], []], expected: 0 },
      { name: 'Empty pool', input: [[], []], expected: 0 },
    ],
  },
  {
    id: 'event-loop-order',
    title: 'Predict one event-loop turn',
    category: 'Practical concepts',
    prompt:
      'Implement turnOrder(entries). Each entry has kind sync, micro, or timer and a label. All entries are encountered during one synchronous script. Return synchronous labels in encounter order, then microtask labels in encounter order, then timer labels in encounter order.',
    example: {
      input:
        'turnOrder([{"kind": "sync", "label": "A"}, {"kind": "timer", "label": "T"}, {"kind": "micro", "label": "P"}, {"kind": "sync", "label": "B"}])',
      output: '["A", "B", "P", "T"]',
    },
    note: 'This is a simplified queue model: callbacks do not enqueue more work; timers have the same delay and none is canceled. Do not use actual timers. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Microtask', meaning: 'Work queued to run after the current script and before the next timer task.' }],
    planPrompt: 'Which labels belong to each kind of work? What order must each group keep?',
    starter: "function turnOrder(entries: {kind: 'sync' | 'micro' | 'timer'; label: string}[]): string[] {\n  return []\n}",
    functionName: 'turnOrder',
    preserveInput: true,
    hints: [
      'Separate encountered work into three queues.',
      'Preserve order within each kind.',
      'Return sync, micro, and timer labels in that order.',
    ],
    checks: [
      {
        name: 'Synchronous before queued',
        input: [
          [
            { kind: 'sync', label: 'A' },
            { kind: 'timer', label: 'T' },
            { kind: 'micro', label: 'P' },
            { kind: 'sync', label: 'B' },
          ],
        ],
        expected: ['A', 'B', 'P', 'T'],
      },
      { name: 'Empty turn', input: [[]], expected: [] },
      {
        name: 'Stable queue order',
        input: [
          [
            { kind: 'micro', label: 'P1' },
            { kind: 'micro', label: 'P2' },
            { kind: 'timer', label: 'T' },
          ],
        ],
        expected: ['P1', 'P2', 'T'],
      },
      {
        name: 'Timers only',
        input: [
          [
            { kind: 'timer', label: 'T1' },
            { kind: 'timer', label: 'T2' },
          ],
        ],
        expected: ['T1', 'T2'],
      },
    ],
  },
  {
    id: 'promise-outcomes',
    title: 'Collect settled request outcomes',
    category: 'Practical concepts',
    prompt:
      'Implement settledSummary(outcomes). Each outcome is fulfilled with a numeric value, or rejected with a reason string. Return {values, errors}, preserving encounter order within each list. These are the records after Promise.allSettled has completed.',
    example: {
      input:
        'settledSummary([{"status": "fulfilled", "value": 0}, {"status": "rejected", "reason": "Offline"}, {"status": "fulfilled", "value": 4}])',
      output: '{"values": [0, 4], "errors": ["Offline"]}',
    },
    note: 'Values are finite numbers; reasons are strings. This synchronous exercise handles settled records, not promises or network requests. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Fulfilled', meaning: 'A promise that finished with a value.' }],
    planPrompt: 'Where will fulfilled values and rejected reasons go? How will each list keep its input order?',
    starter:
      "type Outcome = {status: 'fulfilled'; value: number} | {status: 'rejected'; reason: string}\nfunction settledSummary(outcomes: Outcome[]): {values: number[]; errors: string[]} {\n  return {values: [], errors: []}\n}",
    functionName: 'settledSummary',
    preserveInput: true,
    hints: [
      'Use the status discriminant rather than truthiness.',
      'Append each payload to the corresponding result list.',
      'Keep zero values and empty reason strings.',
    ],
    checks: [
      {
        name: 'Keeps both kinds',
        input: [
          [
            { status: 'fulfilled', value: 0 },
            { status: 'rejected', reason: 'Offline' },
            { status: 'fulfilled', value: 4 },
          ],
        ],
        expected: { values: [0, 4], errors: ['Offline'] },
      },
      { name: 'No outcomes', input: [[]], expected: { values: [], errors: [] } },
      {
        name: 'All rejected',
        input: [
          [
            { status: 'rejected', reason: '' },
            { status: 'rejected', reason: 'Timeout' },
          ],
        ],
        expected: { values: [], errors: ['', 'Timeout'] },
      },
      {
        name: 'Keeps order within each list when kinds alternate',
        input: [
          [
            { status: 'rejected', reason: 'A' },
            { status: 'fulfilled', value: -3 },
            { status: 'rejected', reason: 'B' },
            { status: 'fulfilled', value: 0.5 },
          ],
        ],
        expected: { values: [-3, 0.5], errors: ['A', 'B'] },
      },
    ],
  },
  {
    id: 'singleton-owner',
    title: 'Reuse an instance within its owner',
    category: 'Practical concepts',
    prompt:
      'Implement makeOwner(), returning a getter that returns the same object every time. Implement ownerTrace(ownerCount, accesses): create ownerCount separate getters; for each owner index in accesses, call its getter and return the object’s first-seen identity number. Assign identity numbers starting at 1 in access order.',
    example: { input: 'ownerTrace(2, [0, 0, 1, 0, 1])', output: '[1, 1, 2, 1, 2]' },
    note: 'ownerCount is a nonnegative integer and access indices are valid. Each owner must have its own cache. Output checks cannot prove a particular pattern: inspect makeOwner in self-review. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Singleton', meaning: 'One shared instance within a chosen scope.' }],
    planPrompt: 'Which getter calls must return the same object? When should a new identity number be assigned?',
    starter:
      'function makeOwner(): () => object {\n  return () => ({})\n}\nfunction ownerTrace(ownerCount: number, accesses: number[]): number[] {\n  return []\n}',
    functionName: 'ownerTrace',
    preserveInput: true,
    hints: [
      'Keep a cache inside each makeOwner invocation.',
      'Call getters and store object references as Map keys.',
      'For a new reference assign the next identity number; reuse its existing number otherwise.',
    ],
    checks: [
      { name: 'Reuses each owner', input: [2, [0, 0, 1, 0, 1]], expected: [1, 1, 2, 1, 2] },
      { name: 'Access order defines identity', input: [3, [2, 0, 2, 1]], expected: [1, 2, 1, 3] },
      { name: 'No access', input: [2, []], expected: [] },
      { name: 'No owners', input: [0, []], expected: [] },
    ],
  },
  {
    id: 'pubsub-trace',
    title: 'Route events to active subscribers',
    category: 'Practical concepts',
    prompt:
      'Implement deliveries(events). An event is subscribe with topic and listener, unsubscribe with topic and listener, or publish with topic and value. Return strings listener:value for each delivery in registration order. Registering the same listener twice on the same topic is a no-op. Unsubscribe is a no-op if absent. Re-subscribing after removal places the listener last.',
    example: {
      input:
        'deliveries([{"kind": "subscribe", "topic": "x", "listener": "A"}, {"kind": "publish", "topic": "x", "value": "1"}, {"kind": "unsubscribe", "topic": "x", "listener": "A"}, {"kind": "publish", "topic": "x", "value": "2"}])',
      output: '["A:1"]',
    },
    note: 'Topic and listener names are nonempty strings; values are strings. Different topics may use the same listener name. Delivery is synchronous and has no replay. Do not change supplied arrays or objects.',
    vocabulary: [
      { term: 'Topic', meaning: 'A named channel for messages.' },
      { term: 'Listener', meaning: 'A function registered to receive messages on a topic.' },
    ],
    planPrompt: 'After an unsubscribe and a re-subscribe, which listener receives the next publish first?',
    starter:
      "type BusEvent = {kind: 'subscribe' | 'unsubscribe'; topic: string; listener: string} | {kind: 'publish'; topic: string; value: string}\nfunction deliveries(events: BusEvent[]): string[] {\n  return []\n}",
    functionName: 'deliveries',
    preserveInput: true,
    hints: [
      'Track an ordered set of listener names for each topic.',
      'Subscribe adds and unsubscribe removes without creating duplicate registrations.',
      'On publish, append one formatted result for each current listener on that topic.',
    ],
    checks: [
      {
        name: 'Stops delivery after unsubscribe',
        input: [
          [
            { kind: 'subscribe', topic: 'x', listener: 'A' },
            { kind: 'publish', topic: 'x', value: '1' },
            { kind: 'unsubscribe', topic: 'x', listener: 'A' },
            { kind: 'publish', topic: 'x', value: '2' },
          ],
        ],
        expected: ['A:1'],
      },
      { name: 'Empty bus', input: [[]], expected: [] },
      {
        name: 'Topic isolation and duplicate subscription',
        input: [
          [
            { kind: 'subscribe', topic: 'x', listener: 'A' },
            { kind: 'subscribe', topic: 'x', listener: 'A' },
            { kind: 'subscribe', topic: 'y', listener: 'B' },
            { kind: 'publish', topic: 'x', value: '0' },
          ],
        ],
        expected: ['A:0'],
      },
      {
        name: 'Re-registration moves last',
        input: [
          [
            { kind: 'subscribe', topic: 'x', listener: 'A' },
            { kind: 'subscribe', topic: 'x', listener: 'B' },
            { kind: 'unsubscribe', topic: 'x', listener: 'A' },
            { kind: 'subscribe', topic: 'x', listener: 'A' },
            { kind: 'publish', topic: 'x', value: 'v' },
          ],
        ],
        expected: ['B:v', 'A:v'],
      },
      {
        name: 'Unknown unsubscribe or publish',
        input: [
          [
            { kind: 'unsubscribe', topic: 'z', listener: 'A' },
            { kind: 'publish', topic: 'z', value: 'v' },
          ],
        ],
        expected: [],
      },
    ],
  },
  {
    id: 'injected-clock',
    title: 'Check deadlines with an injected clock',
    category: 'Practical concepts',
    prompt:
      'Implement isExpired(deadline, now), calling now exactly once and returning true when its value is at least deadline. Implement deadlineTrace(deadlines, clockValues): use a fake clock that returns successive clockValues, call isExpired for each deadline, and return {expired, calls}.',
    example: { input: 'deadlineTrace([100, 100, 100], [99, 100, 101])', output: '{"expired": [false, true, true], "calls": 3}' },
    note: 'Arrays have equal lengths and finite nonnegative numbers. Empty arrays produce {expired:[], calls:0}. Use the injected callback; do not read the actual clock. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Dependency', meaning: 'A function or value supplied for another function to use.' }],
    planPrompt: 'How will you count clock reads? What should happen when the clock equals the deadline?',
    starter:
      'function isExpired(deadline: number, now: () => number): boolean {\n  return false\n}\nfunction deadlineTrace(deadlines: number[], clockValues: number[]): {expired: boolean[]; calls: number} {\n  return {expired: [], calls: 0}\n}',
    functionName: 'deadlineTrace',
    preserveInput: true,
    hints: [
      'isExpired should obtain one timestamp from now.',
      'The fake clock advances a local index on each call.',
      'Map deadlines through isExpired and report the number of fake-clock calls.',
    ],
    checks: [
      {
        name: 'Checks equality and counts calls',
        input: [
          [100, 100, 100],
          [99, 100, 101],
        ],
        expected: { expired: [false, true, true], calls: 3 },
      },
      { name: 'Empty clocks', input: [[], []], expected: { expired: [], calls: 0 } },
      { name: 'Zero deadline', input: [[0], [0]], expected: { expired: [true], calls: 1 } },
      {
        name: 'Each deadline reads the next clock value',
        input: [
          [5, 1, 9],
          [4, 4, 9],
        ],
        expected: { expired: [false, true, true], calls: 3 },
      },
    ],
  },
  {
    id: 'debounce-schedule',
    title: 'Compute trailing debounce emissions',
    category: 'Practical concepts',
    prompt:
      'Implement debounceSchedule(events, wait). Events have at and value. Emit the latest pending value at its timestamp plus wait unless replaced by an event strictly before that deadline. When an event arrives exactly at a pending deadline, emit the pending value first, then start a new wait for the new event. Return {at,value} emissions, including the final pending emission.',
    example: {
      input: 'debounceSchedule([{"at": 0, "value": "A"}, {"at": 60, "value": "B"}, {"at": 200, "value": "C"}], 100)',
      output: '[{"at": 160, "value": "B"}, {"at": 300, "value": "C"}]',
    },
    note: 'Times are nonnegative finite integers in nondecreasing order; wait is a positive finite integer. This is a deterministic scheduling model, not real timers. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Debounce', meaning: 'Wait for a quiet period before using the latest event.' }],
    planPrompt: 'What pending value and deadline must you track? What happens when an event arrives exactly at that deadline?',
    starter:
      'function debounceSchedule(events: {at: number; value: string}[], wait: number): {at: number; value: string}[] {\n  return []\n}',
    functionName: 'debounceSchedule',
    preserveInput: true,
    hints: [
      'Keep one pending emission with its deadline.',
      'Before replacing it, emit it if the incoming timestamp is at least its deadline.',
      'Set the new deadline to event.at + wait, and emit any pending result at the end.',
    ],
    checks: [
      {
        name: 'Replaces within quiet period',
        input: [
          [
            { at: 0, value: 'A' },
            { at: 60, value: 'B' },
            { at: 200, value: 'C' },
          ],
          100,
        ],
        expected: [
          { at: 160, value: 'B' },
          { at: 300, value: 'C' },
        ],
      },
      { name: 'No events', input: [[], 100], expected: [] },
      {
        name: 'Equality emits previous',
        input: [
          [
            { at: 0, value: 'A' },
            { at: 100, value: 'B' },
          ],
          100,
        ],
        expected: [
          { at: 100, value: 'A' },
          { at: 200, value: 'B' },
        ],
      },
      {
        name: 'Same-time latest wins',
        input: [
          [
            { at: 0, value: 'A' },
            { at: 0, value: 'B' },
          ],
          10,
        ],
        expected: [{ at: 10, value: 'B' }],
      },
    ],
  },
  {
    id: 'leading-throttle',
    title: 'Keep leading throttle events',
    category: 'Practical concepts',
    prompt:
      'Implement throttleTimes(times, window). Accept the first timestamp, then accept only timestamps at least window after the last accepted timestamp. Return accepted timestamps. Rejected timestamps do not move the window; there is no trailing emission.',
    example: { input: 'throttleTimes([0, 60, 100, 150, 200], 100)', output: '[0, 100, 200]' },
    note: 'Times are nonnegative finite integers in nondecreasing order; window is a positive finite integer. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Throttle', meaning: 'Limit how often events are accepted.' }],
    planPrompt: 'Which accepted timestamp starts the next window? Does a rejected timestamp change it?',
    starter: 'function throttleTimes(times: number[], window: number): number[] {\n  return []\n}',
    functionName: 'throttleTimes',
    preserveInput: true,
    hints: [
      'Keep the timestamp of the last accepted event.',
      'Accept the first event even when it is at zero.',
      'Update the timestamp only after accepting an event.',
    ],
    checks: [
      { name: 'Accepts exact boundaries', input: [[0, 60, 100, 150, 200], 100], expected: [0, 100, 200] },
      { name: 'No events', input: [[], 10], expected: [] },
      { name: 'Rejected does not shift window', input: [[5, 14, 15], 10], expected: [5, 15] },
      { name: 'Duplicate times', input: [[0, 0, 1], 1], expected: [0, 1] },
    ],
  },
  {
    id: 'latest-request',
    title: 'Reject obsolete request results',
    category: 'Practical concepts',
    prompt:
      'Implement visibleResponse(events). start establishes the current request ID and clears visible data. cancel removes ownership and clears data only if its ID is current. resolve sets visible data only if its ID is current. Return the final visible string or null.',
    example: {
      input:
        'visibleResponse([{"kind": "start", "id": "A"}, {"kind": "start", "id": "B"}, {"kind": "resolve", "id": "B", "value": "new"}, {"kind": "resolve", "id": "A", "value": "old"}])',
      output: '"new"',
    },
    note: 'Events are start/cancel with id, or resolve with id and value. IDs are unique per start; canceled IDs are not reused. Events may include late responses for obsolete requests. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Request ID', meaning: 'A label used to identify one request.' }],
    planPrompt: 'Which request may change visible data? Trace a cancellation followed by a late response.',
    starter:
      "type RequestEvent = {kind: 'start' | 'cancel'; id: string} | {kind: 'resolve'; id: string; value: string}\nfunction visibleResponse(events: RequestEvent[]): string | null {\n  return null\n}",
    functionName: 'visibleResponse',
    preserveInput: true,
    hints: [
      'Keep current request identity separately from visible data.',
      'start replaces the owner; cancel only affects the matching owner.',
      'Accept resolve only when its identity matches current.',
    ],
    checks: [
      {
        name: 'Late old result cannot overwrite',
        input: [
          [
            { kind: 'start', id: 'A' },
            { kind: 'start', id: 'B' },
            { kind: 'resolve', id: 'B', value: 'new' },
            { kind: 'resolve', id: 'A', value: 'old' },
          ],
        ],
        expected: 'new',
      },
      { name: 'No request', input: [[]], expected: null },
      {
        name: 'Cancelled owner ignores late response',
        input: [
          [
            { kind: 'start', id: 'A' },
            { kind: 'cancel', id: 'A' },
            { kind: 'resolve', id: 'A', value: 'late' },
          ],
        ],
        expected: null,
      },
      {
        name: 'Old cancellation cannot clear new state',
        input: [
          [
            { kind: 'start', id: 'A' },
            { kind: 'start', id: 'B' },
            { kind: 'resolve', id: 'B', value: '' },
            { kind: 'cancel', id: 'A' },
          ],
        ],
        expected: '',
      },
      {
        name: 'New start clears previous data',
        input: [
          [
            { kind: 'start', id: 'A' },
            { kind: 'resolve', id: 'A', value: 'old' },
            { kind: 'start', id: 'B' },
          ],
        ],
        expected: null,
      },
    ],
  },
  {
    id: 'websocket-gate',
    title: 'Gate messages by connection state',
    category: 'Practical concepts',
    prompt:
      'Implement socketMessages(events). Begin disconnected. open makes the connection open; close makes it disconnected; send records its text only while open. Return the texts actually sent in order. Opening an already-open connection and closing a closed one are no-ops.',
    example: {
      input:
        'socketMessages([{"kind": "send", "text": "early"}, {"kind": "open"}, {"kind": "send", "text": "ok"}, {"kind": "close"}, {"kind": "send", "text": "late"}])',
      output: '["ok"]',
    },
    note: 'Events are open, close, or send with text. A send while disconnected is dropped, not queued. This model does not create a real WebSocket or establish server delivery. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Connection state', meaning: 'Whether a connection is open or disconnected.' }],
    planPrompt: 'When can a send be recorded? Trace a send before opening and another after closing.',
    starter:
      "type SocketEvent = {kind: 'open' | 'close'} | {kind: 'send'; text: string}\nfunction socketMessages(events: SocketEvent[]): string[] {\n  return []\n}",
    functionName: 'socketMessages',
    preserveInput: true,
    hints: ['Keep one open/disconnected state.', 'Update state on open and close.', 'Append send text only when state is open.'],
    checks: [
      {
        name: 'Drops disconnected sends',
        input: [
          [
            { kind: 'send', text: 'early' },
            { kind: 'open' },
            { kind: 'send', text: 'ok' },
            { kind: 'close' },
            { kind: 'send', text: 'late' },
          ],
        ],
        expected: ['ok'],
      },
      { name: 'No events', input: [[]], expected: [] },
      {
        name: 'Reopens connection',
        input: [[{ kind: 'open' }, { kind: 'send', text: 'A' }, { kind: 'close' }, { kind: 'open' }, { kind: 'send', text: '' }]],
        expected: ['A', ''],
      },
      {
        name: 'Idempotent state transitions',
        input: [[{ kind: 'open' }, { kind: 'open' }, { kind: 'send', text: 'x' }, { kind: 'close' }, { kind: 'close' }]],
        expected: ['x'],
      },
    ],
  },
  {
    id: 'choose-live-transport',
    title: 'Choose a transport from requirements',
    category: 'Practical concepts',
    prompt:
      'Implement chooseTransport(twoWay, serverPush). Return websocket when twoWay is true; otherwise return sse when serverPush is true; otherwise return polling. These booleans describe the exercise’s required capabilities and assume all transports are supported.',
    example: { input: 'chooseTransport(true, true)', output: '"websocket"' },
    note: 'This is a capability-selection exercise, not a universal production recommendation. twoWay means both directions must use the same persistent connection. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Server push', meaning: 'The server sends updates without waiting for a new request.' }],
    planPrompt: 'Which requirement takes priority when both flags are true? What is chosen when both are false?',
    starter: "function chooseTransport(twoWay: boolean, serverPush: boolean): 'websocket' | 'sse' | 'polling' {\n  return 'polling'\n}",
    functionName: 'chooseTransport',
    preserveInput: true,
    hints: [
      'Two-way on one connection requires WebSocket in this contract.',
      'Only after that, check the server-push requirement.',
      'With neither requirement, use polling.',
    ],
    checks: [
      { name: 'Bidirectional wins', input: [true, true], expected: 'websocket' },
      { name: 'One-way push', input: [false, true], expected: 'sse' },
      { name: 'Periodic refresh', input: [false, false], expected: 'polling' },
      { name: 'Bidirectional without push flag', input: [true, false], expected: 'websocket' },
    ],
  },
  {
    id: 'shared-resource',
    title: 'Track shared connection leases',
    category: 'Practical concepts',
    prompt:
      'Implement resourceActions(events). acquire adds a named consumer; release removes it. Duplicate acquire and unknown release are no-ops. Return open on each transition from zero consumers to one and close on each transition from one to zero, in order.',
    example: {
      input:
        'resourceActions([{"kind": "acquire", "id": "A"}, {"kind": "acquire", "id": "B"}, {"kind": "release", "id": "A"}, {"kind": "release", "id": "B"}])',
      output: '["open", "close"]',
    },
    note: 'Consumer IDs are nonempty strings. Start with no consumers. An unfinished trace may leave the connection open; do not invent a final close. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Consumer', meaning: 'A named user of a shared resource.' }],
    planPrompt: 'Which consumers are active after each event? Which changes should open or close the resource?',
    starter: "function resourceActions(events: {kind: 'acquire' | 'release'; id: string}[]): string[] {\n  return []\n}",
    functionName: 'resourceActions',
    preserveInput: true,
    hints: [
      'A Set can represent current consumers.',
      'Compare the size before and after each event.',
      'Emit only on zero-to-positive or positive-to-zero transitions.',
    ],
    checks: [
      {
        name: 'Last release closes',
        input: [
          [
            { kind: 'acquire', id: 'A' },
            { kind: 'acquire', id: 'B' },
            { kind: 'release', id: 'A' },
            { kind: 'release', id: 'B' },
          ],
        ],
        expected: ['open', 'close'],
      },
      { name: 'No owners', input: [[]], expected: [] },
      {
        name: 'Duplicate and repeated cleanup',
        input: [
          [
            { kind: 'release', id: 'A' },
            { kind: 'acquire', id: 'A' },
            { kind: 'acquire', id: 'A' },
            { kind: 'release', id: 'A' },
            { kind: 'release', id: 'A' },
          ],
        ],
        expected: ['open', 'close'],
      },
      {
        name: 'Reopens after disposal',
        input: [
          [
            { kind: 'acquire', id: 'A' },
            { kind: 'release', id: 'A' },
            { kind: 'acquire', id: 'B' },
          ],
        ],
        expected: ['open', 'close', 'open'],
      },
    ],
  },
  {
    id: 'cache-freshness',
    title: 'Read only fresh cache entries',
    category: 'Practical concepts',
    prompt:
      'Implement freshValue(entries, key, now). Return the matching entry’s numeric value only if now is strictly less than expiresAt; return null if absent or expired.',
    example: { input: 'freshValue([{"key": "a", "value": 0, "expiresAt": 10}], "a", 9)', output: '0' },
    note: 'Entries have unique exact string keys, finite numeric values, and nonnegative finite expiry times. now is nonnegative and finite. A cached zero is valid. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Expiry', meaning: 'The time when a cached value stops being usable.' }],
    planPrompt: 'How will you distinguish a missing entry from a value of zero? What happens exactly at expiry?',
    starter:
      'function freshValue(entries: {key: string; value: number; expiresAt: number}[], key: string, now: number): number | null {\n  return null\n}',
    functionName: 'freshValue',
    preserveInput: true,
    hints: [
      'Find the exact key before checking freshness.',
      'Use now < expiresAt, not <=.',
      'Return the value explicitly even when it is zero.',
    ],
    checks: [
      { name: 'Keeps cached zero', input: [[{ key: 'a', value: 0, expiresAt: 10 }], 'a', 9], expected: 0 },
      { name: 'Equality is expired', input: [[{ key: 'a', value: 3, expiresAt: 10 }], 'a', 10], expected: null },
      { name: 'Absent key', input: [[], 'a', 0], expected: null },
      { name: 'Other keys cannot match', input: [[{ key: 'b', value: 8, expiresAt: 100 }], 'a', 0], expected: null },
      { name: 'Past expiry', input: [[{ key: 'a', value: 3, expiresAt: 10 }], 'a', 11], expected: null },
    ],
  },
  {
    id: 'retry-backoff',
    title: 'Calculate bounded retry delays',
    category: 'Practical concepts',
    prompt:
      'Implement retryDelays(failures, base, cap). For consecutive failure indices starting at zero, return min(cap, base * 2^index). Return one delay for each failure.',
    example: { input: 'retryDelays(5, 100, 500)', output: '[100, 200, 400, 500, 500]' },
    note: 'failures is an integer from 0 to 30; base and cap are positive finite integers with base <= cap and cap <= 1000000. This exercise excludes jitter and does not decide which failures are eligible. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Backoff', meaning: 'A delay that grows between failed attempts.' }],
    planPrompt: 'What delay belongs to failure index zero? When does growth reach the cap?',
    starter: 'function retryDelays(failures: number, base: number, cap: number): number[] {\n  return []\n}',
    functionName: 'retryDelays',
    preserveInput: true,
    hints: ['Start with the base delay for index zero.', 'Double after each recorded failure.', 'Clamp every delay to the cap.'],
    checks: [
      { name: 'Caps exponential growth', input: [5, 100, 500], expected: [100, 200, 400, 500, 500] },
      { name: 'No failures', input: [0, 100, 500], expected: [] },
      { name: 'Cap equals base', input: [3, 10, 10], expected: [10, 10, 10] },
      { name: 'One failure', input: [1, 7, 100], expected: [7] },
    ],
  },
  {
    id: 'idempotent-ledger',
    title: 'Deduplicate logical ledger operations',
    category: 'Practical concepts',
    prompt:
      'Implement ledger(requests). Each request has key and integer amount. On the first occurrence of a key, add amount to total and record it. On a repeat with the same amount, add nothing. On a repeat with a different amount, append the key to conflicts and add nothing. Return {total, conflicts}; record every conflicting occurrence in encounter order.',
    example: {
      input: 'ledger([{"key": "K", "amount": 5}, {"key": "K", "amount": 5}, {"key": "K", "amount": 9}, {"key": "L", "amount": 5}])',
      output: '{"total": 10, "conflicts": ["K"]}',
    },
    note: 'Keys are nonempty exact strings; amounts are integers from -1000 to 1000. The first amount for each key remains authoritative. This local model does not validate atomic server persistence. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Idempotency key', meaning: 'A label that identifies repeated deliveries of the same operation.' }],
    planPrompt: 'What amount must you remember for each key? How do matching and conflicting repeats affect the total?',
    starter:
      'function ledger(requests: {key: string; amount: number}[]): {total: number; conflicts: string[]} {\n  return {total: 0, conflicts: []}\n}',
    functionName: 'ledger',
    preserveInput: true,
    hints: [
      'Store the first amount in a Map keyed by operation identity.',
      'Use has to distinguish an absent key from an amount of zero.',
      'Only new keys affect total; mismatched repeats append a conflict.',
    ],
    checks: [
      {
        name: 'Retries and conflicts',
        input: [
          [
            { key: 'K', amount: 5 },
            { key: 'K', amount: 5 },
            { key: 'K', amount: 9 },
            { key: 'L', amount: 5 },
          ],
        ],
        expected: { total: 10, conflicts: ['K'] },
      },
      { name: 'Empty ledger', input: [[]], expected: { total: 0, conflicts: [] } },
      {
        name: 'Zero amount is recorded',
        input: [
          [
            { key: 'Z', amount: 0 },
            { key: 'Z', amount: 1 },
          ],
        ],
        expected: { total: 0, conflicts: ['Z'] },
      },
      {
        name: 'Negative and repeated conflicts',
        input: [
          [
            { key: 'a', amount: -2 },
            { key: 'a', amount: 3 },
            { key: 'a', amount: 3 },
            { key: 'a', amount: -2 },
          ],
        ],
        expected: { total: -2, conflicts: ['a', 'a'] },
      },
    ],
  },
  {
    id: 'optimistic-balance',
    title: 'Reconcile independent optimistic changes',
    category: 'Practical concepts',
    prompt:
      'Implement optimisticBalance(initial, events). begin with id and delta adds one pending operation unless the ID is already pending or settled. succeed moves that pending delta into confirmed and settles its ID. fail removes that pending delta and settles its ID. Unknown or repeated settlements are no-ops. Return {confirmed, displayed}, where displayed is confirmed plus pending deltas.',
    example: {
      input:
        'optimisticBalance(10, [{"kind": "begin", "id": "A", "delta": 2}, {"kind": "begin", "id": "B", "delta": 3}, {"kind": "succeed", "id": "B"}, {"kind": "fail", "id": "A"}])',
      output: '{"confirmed": 13, "displayed": 13}',
    },
    note: 'Amounts are finite integers. Operation IDs are nonempty exact strings and may never represent a new operation after settlement. This additive model excludes server-adjusted values and noncommutative edits. Do not change supplied arrays or objects.',
    vocabulary: [{ term: 'Pending operation', meaning: 'A change that has not yet succeeded or failed.' }],
    planPrompt: 'How do pending changes affect the displayed balance? What changes when one succeeds or fails?',
    starter:
      "type ChangeEvent = {kind: 'begin'; id: string; delta: number} | {kind: 'succeed' | 'fail'; id: string}\nfunction optimisticBalance(initial: number, events: ChangeEvent[]): {confirmed: number; displayed: number} {\n  return {confirmed: initial, displayed: initial}\n}",
    functionName: 'optimisticBalance',
    preserveInput: true,
    hints: [
      'Keep pending deltas by ID and a set of settled IDs.',
      'Only known pending operations can settle; successful ones update confirmed.',
      'Compute display from confirmed plus remaining pending deltas.',
    ],
    checks: [
      {
        name: 'Failure preserves another success',
        input: [
          10,
          [
            { kind: 'begin', id: 'A', delta: 2 },
            { kind: 'begin', id: 'B', delta: 3 },
            { kind: 'succeed', id: 'B' },
            { kind: 'fail', id: 'A' },
          ],
        ],
        expected: { confirmed: 13, displayed: 13 },
      },
      {
        name: 'Pending remains tentative',
        input: [10, [{ kind: 'begin', id: 'A', delta: -2 }]],
        expected: { confirmed: 10, displayed: 8 },
      },
      { name: 'No changes', input: [0, []], expected: { confirmed: 0, displayed: 0 } },
      {
        name: 'Duplicate and reused IDs do not reapply',
        input: [
          1,
          [
            { kind: 'begin', id: 'A', delta: 0 },
            { kind: 'begin', id: 'A', delta: 8 },
            { kind: 'succeed', id: 'A' },
            { kind: 'succeed', id: 'A' },
            { kind: 'begin', id: 'A', delta: 9 },
          ],
        ],
        expected: { confirmed: 1, displayed: 1 },
      },
      {
        name: 'Unknown settlements do nothing',
        input: [
          5,
          [
            { kind: 'succeed', id: 'x' },
            { kind: 'fail', id: 'y' },
          ],
        ],
        expected: { confirmed: 5, displayed: 5 },
      },
    ],
  },
  {
    id: 'subscription-cleanup',
    title: 'Keep subscription cleanup local',
    category: 'Practical concepts',
    prompt:
      'Implement listenerCounts(events). listen adds a unique (owner, topic) registration; dispose removes every registration for that owner. Return the active registration count after every event. Duplicate listen is a no-op; dispose of an absent owner is a no-op. Owners may listen again after disposal. Owner and topic are nonempty exact strings and may contain punctuation.',
    example: {
      input:
        'listenerCounts([{"kind": "listen", "owner": "A", "topic": "x"}, {"kind": "listen", "owner": "B", "topic": "x"}, {"kind": "listen", "owner": "A", "topic": "y"}, {"kind": "dispose", "owner": "A"}])',
      output: '[1, 2, 3, 1]',
    },
    note: 'Every event has a kind of listen or dispose, and owner and topic (listen only) are nonempty strings. Do not change supplied arrays or objects.',
    vocabulary: [
      { term: 'Owner', meaning: 'The named user responsible for a registration.' },
      { term: 'Registration', meaning: 'A stored link between an owner and a topic.' },
    ],
    planPrompt: 'Which registrations belong to each owner? After disposing one owner, which registrations remain?',
    starter:
      "type ListenerEvent = {kind: 'listen'; owner: string; topic: string} | {kind: 'dispose'; owner: string}\nfunction listenerCounts(events: ListenerEvent[]): number[] {\n  return []\n}",
    functionName: 'listenerCounts',
    preserveInput: true,
    hints: [
      'Store each owner’s topics separately.',
      'Count a registration only when its owner-topic pair is new.',
      'On disposal subtract that owner’s registrations and remove the owner.',
    ],
    checks: [
      {
        name: 'Disposes only one owner',
        input: [
          [
            { kind: 'listen', owner: 'A', topic: 'x' },
            { kind: 'listen', owner: 'B', topic: 'x' },
            { kind: 'listen', owner: 'A', topic: 'y' },
            { kind: 'dispose', owner: 'A' },
          ],
        ],
        expected: [1, 2, 3, 1],
      },
      {
        name: 'Duplicate and absent cleanup',
        input: [
          [
            { kind: 'dispose', owner: 'A' },
            { kind: 'listen', owner: 'A', topic: 'x' },
            { kind: 'listen', owner: 'A', topic: 'x' },
            { kind: 'dispose', owner: 'A' },
            { kind: 'dispose', owner: 'A' },
          ],
        ],
        expected: [0, 1, 1, 0, 0],
      },
      { name: 'No events', input: [[]], expected: [] },
      {
        name: 'Composite identities cannot collide',
        input: [
          [
            { kind: 'listen', owner: 'a:b', topic: 'c' },
            { kind: 'listen', owner: 'a', topic: 'b:c' },
          ],
        ],
        expected: [1, 2],
      },
    ],
  },
  {
    id: 'room-leases',
    title: 'Recall ownership in room membership',
    category: 'Practical concepts',
    prompt:
      'Implement emptyRooms(events). enter adds a named user to a named room; leave removes that user only from that room. Duplicate enter and absent leave are no-ops. Return room names whenever a previously occupied room becomes empty. Empty rooms may be occupied again; keep output in event order. Room and user are nonempty exact strings.',
    example: {
      input:
        'emptyRooms([{"kind": "enter", "room": "x", "user": "A"}, {"kind": "enter", "room": "x", "user": "B"}, {"kind": "enter", "room": "y", "user": "A"}, {"kind": "leave", "room": "x", "user": "A"}, {"kind": "leave", "room": "y", "user": "A"}, {"kind": "leave", "room": "x", "user": "B"}])',
      output: '["y", "x"]',
    },
    note: 'Every event has a kind of enter or leave, and room and user are nonempty strings. Do not change supplied arrays or objects.',
    vocabulary: [
      { term: 'Owner', meaning: 'A named user who occupies a room.' },
      { term: 'Registration', meaning: 'A stored link between a user and a room.' },
    ],
    planPrompt: 'Which users remain in each room after a leave? When should an empty room be reported?',
    starter: "function emptyRooms(events: {kind: 'enter' | 'leave'; room: string; user: string}[]): string[] {\n  return []\n}",
    functionName: 'emptyRooms',
    preserveInput: true,
    hints: [
      'Determine which membership each event affects.',
      'Detect a transition from occupied to empty, not merely an empty result.',
      'Track rooms independently and ignore duplicate operations.',
    ],
    checks: [
      {
        name: 'Rooms have separate membership',
        input: [
          [
            { kind: 'enter', room: 'x', user: 'A' },
            { kind: 'enter', room: 'x', user: 'B' },
            { kind: 'enter', room: 'y', user: 'A' },
            { kind: 'leave', room: 'x', user: 'A' },
            { kind: 'leave', room: 'y', user: 'A' },
            { kind: 'leave', room: 'x', user: 'B' },
          ],
        ],
        expected: ['y', 'x'],
      },
      { name: 'Absent leaves do nothing', input: [[{ kind: 'leave', room: 'z', user: 'A' }]], expected: [] },
      { name: 'No events', input: [[]], expected: [] },
      {
        name: 'Repeated occupancy',
        input: [
          [
            { kind: 'enter', room: 'x', user: 'A' },
            { kind: 'enter', room: 'x', user: 'A' },
            { kind: 'leave', room: 'x', user: 'A' },
            { kind: 'leave', room: 'x', user: 'A' },
            { kind: 'enter', room: 'x', user: 'B' },
            { kind: 'leave', room: 'x', user: 'B' },
          ],
        ],
        expected: ['x', 'x'],
      },
    ],
  },
]
