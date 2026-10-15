import type { Rep } from './rep-types.ts'

// Timing policies (debounce → autosave → throttled scroll reports) and reliable requests (idempotent ledger →
// payment resubmits → cached quotes with retries). Each rep computes a deterministic policy trace from authored
// events; it does not establish real timer, browser, or network behavior.

type Edit = { at: number; kind: 'edit'; text: string } | { at: number; kind: 'blur' }
const edit = (at: number, text: string): Edit => ({ at, kind: 'edit', text })
const blur = (at: number): Edit => ({ at, kind: 'blur' })
const saved = (at: number, text: string) => ({ at, text })
const scroll = (at: number, y: number) => ({ at, y })
const attempt = (key: string, amount: number, outcome: 'lost' | 'processed' | 'timeout') => ({ key, amount, outcome })

export const practicalJourneyReps: Rep[] = [
  {
    id: 'autosave-debounce',
    title: 'Autosave after typing pauses',
    category: 'Practical concepts',
    context:
      'A notes editor saves a draft once the writer pauses, rather than after every keystroke. Leaving the field saves straight away so nothing is lost, and saving the same text twice wastes a request.',
    prompt:
      'Return the saves as {at, text} entries. An edit makes its text pending, due at the edit’s time plus wait, replacing any earlier pending text. When any event arrives at or after the pending due time, that save happens at the due time first. A blur saves the pending text at the blur’s time; a blur with nothing pending does nothing. After the last event, a pending save happens at its due time. Skip any save whose text equals the most recently saved text, starting from savedText; a skipped save still clears the pending text.',
    brief: {
      summary: 'Implement autosaves(events, wait, savedText) and return the saves as {at, text} entries.',
      rules: [
        'An edit makes its text pending, due at the edit’s time plus wait, replacing any earlier pending text.',
        'When any event arrives at or after the pending due time, that save happens at the due time first.',
        'A blur saves the pending text at the blur’s time; a blur with nothing pending does nothing.',
        'After the last event, a pending save happens at its due time.',
      ],
      edgeCases: [
        'Skip any save whose text equals the most recently saved text, starting from savedText.',
        'A skipped save still clears the pending text.',
      ],
    },
    example: {
      input: "autosaves([{at: 0, kind: 'edit', text: 'H'}, {at: 100, kind: 'edit', text: 'Hi'}, {at: 900, kind: 'blur'}], 500, '')",
      output: "[{at: 600, text: 'Hi'}]",
    },
    note: 'Times are integers from 0 to 1000000 in nondecreasing order; wait is a positive integer. savedText is the text already stored before the first event. This is a deterministic policy model, not real timers. Do not change events.',
    vocabulary: [
      { term: 'Pending save', meaning: 'text waiting to be saved once its due time arrives' },
      { term: 'Blur', meaning: 'the moment focus leaves a field' },
      { term: 'Due time', meaning: 'the time at which a pending save happens if nothing replaces it' },
    ],
    planPrompt:
      'Name the state you must remember between events. Predict the saves for a blur during a pause, an edit exactly at the due time, and an edit that restores the saved text.',
    starter:
      "type Edit = { at: number; kind: 'edit'; text: string } | { at: number; kind: 'blur' }\nfunction autosaves(events: Edit[], wait: number, savedText: string): { at: number; text: string }[] {\n  // Write your solution here.\n  return []\n}\n",
    functionName: 'autosaves',
    preserveInput: true,
    hints: [
      'Track the pending text, its due time, and the last saved text.',
      'Before handling each event, check whether the pending save is already due by then.',
      'Write one helper that saves at a given time unless the text matches the last saved text, and always clears the pending text.',
    ],
    checks: [
      {
        name: 'Saves the latest text after a pause',
        input: [[edit(0, 'H'), edit(100, 'Hi'), blur(900)], 500, ''],
        expected: [saved(600, 'Hi')],
      },
      { name: 'No events', input: [[], 500, 'draft'], expected: [] },
      {
        name: 'Blur saves straight away',
        input: [[edit(0, 'Note'), blur(200)], 500, ''],
        expected: [saved(200, 'Note')],
      },
      { name: 'Blur with nothing pending', input: [[blur(50)], 500, ''], expected: [] },
      {
        name: 'An edit exactly at the due time saves first',
        input: [[edit(0, 'A'), edit(500, 'AB')], 500, ''],
        expected: [saved(500, 'A'), saved(1000, 'AB')],
      },
      {
        name: 'Restoring the saved text skips the save',
        input: [[edit(0, 'draft!'), edit(100, 'draft')], 300, 'draft'],
        expected: [],
      },
      {
        name: 'A skipped save still clears the pending text',
        input: [[edit(0, 'same'), blur(100), blur(200)], 500, 'same'],
        expected: [],
      },
      {
        name: 'Saves twice across two pauses',
        input: [[edit(0, 'a'), edit(1000, 'ab'), edit(1200, 'abc')], 400, ''],
        expected: [saved(400, 'a'), saved(1600, 'abc')],
      },
    ],
  },
  {
    id: 'scroll-report-throttle',
    title: 'Report scroll position at a steady rate',
    category: 'Practical concepts',
    context:
      'A reading app reports the scroll position so it can resume later. Reporting every scroll event floods the connection, but dropping the last position would resume in the wrong place.',
    prompt:
      'Return the reports as {at, y} entries. When no window is open, report an event at its own time and open a window lasting interval from that time. Events inside an open window are not reported straight away; only the latest is kept. When a window ends, report the kept position at the window’s end time and open a new window from then, if a position was kept; otherwise the window simply closes. An event exactly at a window’s end arrives after that window ends. After the last event, keep closing windows until nothing is kept.',
    brief: {
      summary: 'Implement scrollReports(events, interval) and return the reports as {at, y} entries.',
      rules: [
        'When no window is open, report an event at its own time and open a window lasting interval from that time.',
        'Events inside an open window are not reported straight away; only the latest is kept.',
        'When a window ends, report the kept position at the window’s end time and open a new window from then, if a position was kept; otherwise the window simply closes.',
        'After the last event, keep closing windows until nothing is kept.',
      ],
      edgeCases: ['An event exactly at a window’s end arrives after that window ends.'],
    },
    example: {
      input: 'scrollReports([{at: 0, y: 10}, {at: 30, y: 40}, {at: 60, y: 80}], 100)',
      output: '[{at: 0, y: 10}, {at: 100, y: 80}]',
    },
    note: 'Times are integers from 0 to 1000000 in nondecreasing order; interval is a positive integer; y is an integer. This is a deterministic policy model, not real timers. Do not change events.',
    vocabulary: [
      { term: 'Window', meaning: 'a period after a report during which no new report is sent straight away' },
      { term: 'Trailing report', meaning: 'a report sent when a window ends, carrying the latest kept value' },
    ],
    planPrompt:
      'Name the state you need between events. Predict the reports for one event, two events far apart, and an event exactly at a window’s end.',
    starter:
      'function scrollReports(events: { at: number; y: number }[], interval: number): { at: number; y: number }[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'scrollReports',
    preserveInput: true,
    hints: [
      'Remember when the current window ends, if one is open, and the latest kept position.',
      'Before handling an event, close every window that has ended by the event’s time. Closing one may report and open another.',
      'An event with no open window is reported at once; an event inside a window replaces the kept position.',
    ],
    checks: [
      {
        name: 'Reports the first and the latest position',
        input: [[scroll(0, 10), scroll(30, 40), scroll(60, 80)], 100],
        expected: [scroll(0, 10), scroll(100, 80)],
      },
      { name: 'No events', input: [[], 100], expected: [] },
      { name: 'One event', input: [[scroll(5, 1)], 100], expected: [scroll(5, 1)] },
      {
        name: 'Events far apart are each reported at once',
        input: [[scroll(0, 1), scroll(500, 2)], 100],
        expected: [scroll(0, 1), scroll(500, 2)],
      },
      {
        name: 'An event at a window’s end with nothing kept',
        input: [[scroll(0, 1), scroll(100, 2)], 100],
        expected: [scroll(0, 1), scroll(100, 2)],
      },
      {
        name: 'An event at a window’s end after a kept position',
        input: [[scroll(0, 1), scroll(50, 2), scroll(100, 3)], 100],
        expected: [scroll(0, 1), scroll(100, 2), scroll(200, 3)],
      },
      {
        name: 'A trailing report opens a window that later closes empty',
        input: [[scroll(0, 1), scroll(10, 2), scroll(250, 3)], 100],
        expected: [scroll(0, 1), scroll(100, 2), scroll(250, 3)],
      },
      {
        name: 'Steady scrolling reports once per interval',
        input: [[scroll(0, 0), scroll(40, 4), scroll(80, 8), scroll(120, 12), scroll(160, 16), scroll(200, 20)], 100],
        expected: [scroll(0, 0), scroll(100, 8), scroll(200, 16), scroll(300, 20)],
      },
    ],
  },
  {
    id: 'payment-resubmit',
    title: 'Resubmit a payment safely after a timeout',
    category: 'Practical concepts',
    context:
      'A checkout sends each payment with an idempotency key. Some requests never reach the server; others are processed but their response is lost, so the client cannot tell whether the card was charged and resubmits with the same key.',
    prompt:
      'Process the attempts in order and return {charged, results, unconfirmed}. An attempt with outcome "lost" never reaches the server: its result is "none". Any other attempt reaches the server, which charges the first amount it sees for a key and returns "charged". A later attempt with the same key and amount is answered "replayed" without charging; one with a different amount is answered "conflict" without charging. charged is the total amount charged. unconfirmed lists, in order of first appearance, the keys whose final attempt was "lost" or "timeout", because the client never learned what happened.',
    brief: {
      summary: 'Implement settlePayments(attempts) and return {charged, results, unconfirmed}.',
      rules: [
        'A "lost" attempt never reaches the server: its result is "none".',
        'Otherwise the server charges the first amount it sees for a key and returns "charged".',
        'A later attempt with the same key and amount is answered "replayed"; a different amount is answered "conflict". Neither charges.',
        'charged is the total amount charged.',
      ],
      edgeCases: [
        'A "timeout" attempt reaches the server, but its response is lost on the way back.',
        'unconfirmed lists, in order of first appearance, the keys whose final attempt was "lost" or "timeout".',
      ],
    },
    example: {
      input: "settlePayments([{key: 'k1', amount: 500, outcome: 'timeout'}, {key: 'k1', amount: 500, outcome: 'processed'}])",
      output: "{charged: 500, results: ['charged', 'replayed'], unconfirmed: []}",
    },
    note: 'attempts has 0 to 1000 entries. Keys are nonempty strings; amounts are integers from 1 to 1000000. outcome is "lost", "processed", or "timeout". Do not change attempts.',
    vocabulary: [
      { term: 'Idempotency key', meaning: 'an identifier that lets a server recognize a repeat of the same operation' },
      { term: 'Timeout', meaning: 'giving up on waiting for a response, without knowing whether the request succeeded' },
      { term: 'Replay', meaning: 'answering a repeated request with the stored result instead of doing the work again' },
    ],
    planPrompt:
      'For a timeout followed by a retry, write what the server has done and what the client knows after each attempt. Which outcome leaves the server unchanged?',
    starter:
      "type Attempt = { key: string; amount: number; outcome: 'lost' | 'processed' | 'timeout' }\nfunction settlePayments(attempts: Attempt[]): { charged: number; results: string[]; unconfirmed: string[] } {\n  // Write your solution here.\n  return { charged: 0, results: [], unconfirmed: [] }\n}\n",
    functionName: 'settlePayments',
    preserveInput: true,
    hints: [
      'Separate what the server remembers from what the client learned. A timeout changes the first but not the second.',
      'The server needs the first amount for every key it has seen; the client needs the outcome of each key’s latest attempt.',
      'Use a Map from key to charged amount for the server, and a Map from key to the latest outcome, in first-appearance order, for unconfirmed.',
    ],
    checks: [
      {
        name: 'A retry after a timeout is replayed, not charged twice',
        input: [[attempt('k1', 500, 'timeout'), attempt('k1', 500, 'processed')]],
        expected: { charged: 500, results: ['charged', 'replayed'], unconfirmed: [] },
      },
      {
        name: 'A lost attempt does not reserve the key',
        input: [[attempt('k1', 500, 'lost'), attempt('k1', 500, 'processed')]],
        expected: { charged: 500, results: ['none', 'charged'], unconfirmed: [] },
      },
      {
        name: 'A changed amount is a conflict',
        input: [[attempt('k1', 500, 'processed'), attempt('k1', 700, 'processed')]],
        expected: { charged: 500, results: ['charged', 'conflict'], unconfirmed: [] },
      },
      { name: 'No attempts', input: [[]], expected: { charged: 0, results: [], unconfirmed: [] } },
      {
        name: 'A final timeout leaves the payment unconfirmed even though it was charged',
        input: [[attempt('k1', 300, 'timeout')]],
        expected: { charged: 300, results: ['charged'], unconfirmed: ['k1'] },
      },
      {
        name: 'Unconfirmed keys keep first-appearance order',
        input: [[attempt('b', 1, 'lost'), attempt('a', 2, 'timeout'), attempt('b', 1, 'lost'), attempt('c', 3, 'processed')]],
        expected: { charged: 5, results: ['none', 'charged', 'none', 'charged'], unconfirmed: ['b', 'a'] },
      },
      {
        name: 'A later success confirms an earlier timeout',
        input: [[attempt('a', 9, 'timeout'), attempt('b', 4, 'processed'), attempt('a', 9, 'processed')]],
        expected: { charged: 13, results: ['charged', 'charged', 'replayed'], unconfirmed: [] },
      },
      {
        name: 'A conflict after a timeout still confirms the key',
        input: [[attempt('a', 9, 'timeout'), attempt('a', 8, 'processed')]],
        expected: { charged: 9, results: ['charged', 'conflict'], unconfirmed: [] },
      },
    ],
  },
  {
    id: 'quote-cache-retry',
    title: 'Serve a cached quote with retries',
    category: 'Practical concepts',
    context:
      'A shipping page shows a price quote from a slow upstream service. It caches the last good quote, retries a failed fetch a few times, and would rather show an old price than an error.',
    prompt:
      'Return one label per request time. If a cached quote exists and the request time is less than its fetch time plus ttl, return "cache:" plus the price. Otherwise fetch, trying up to maxAttempts times; each try uses the next outcome in outcomes, where a number is a price and null is a failure, and a missing outcome counts as a failure. On the first success, cache that price with the request time as its fetch time and return "fresh:" plus the price. If every try fails, return "stale:" plus the cached price when one exists, without changing its fetch time, or "failed" when none does.',
    brief: {
      summary: 'Implement quoteLabels(requests, ttl, maxAttempts, outcomes) and return one label per request time.',
      rules: [
        'A cached quote is used while the request time is less than its fetch time plus ttl: return "cache:" plus the price.',
        'Otherwise try fetching up to maxAttempts times. Each try uses the next outcome: a number is a price, null is a failure, and a missing outcome counts as a failure.',
        'On the first success, cache the price with the request time as its fetch time and return "fresh:" plus the price.',
        'If every try fails, return "stale:" plus the cached price when one exists, or "failed" when none does.',
      ],
      edgeCases: [
        'A stale answer does not change the cached fetch time.',
        'Retries happen at the request time; there is no delay in this model.',
      ],
    },
    example: {
      input: 'quoteLabels([0, 50, 120], 100, 2, [42, null, 45])',
      output: "['fresh:42', 'cache:42', 'fresh:45']",
    },
    note: 'requests has 0 to 1000 integer times from 0 to 1000000 in nondecreasing order. ttl and maxAttempts are positive integers. outcomes has 0 to 1000 entries, each a nonnegative integer price or null. Outcomes are used only by tries, in order. Do not change the arrays.',
    vocabulary: [
      { term: 'Cache', meaning: 'a stored copy of a result, reused to avoid asking again' },
      { term: 'Time to live (TTL)', meaning: 'how long a cached value counts as fresh' },
      { term: 'Stale value', meaning: 'a cached value older than its time to live' },
    ],
    planPrompt:
      'List the state you keep between requests. Predict the labels when a request lands exactly at fetch time plus ttl and when every retry fails with an old price cached.',
    starter:
      'function quoteLabels(requests: number[], ttl: number, maxAttempts: number, outcomes: (number | null)[]): string[] {\n  // Write your solution here.\n  return []\n}\n',
    functionName: 'quoteLabels',
    preserveInput: true,
    hints: [
      'Keep the cached price and its fetch time, plus how many outcomes have been used.',
      'Freshness uses a strict comparison: a request exactly at fetch time plus ttl must fetch again.',
      'A failure leaves the cache exactly as it was, so a later request may serve the same stale price again.',
    ],
    checks: [
      {
        name: 'Fresh, then cached, then refreshed',
        input: [[0, 50, 120], 100, 2, [42, null, 45]],
        expected: ['fresh:42', 'cache:42', 'fresh:45'],
      },
      { name: 'No requests', input: [[], 100, 3, [1]], expected: [] },
      { name: 'Exactly at expiry fetches again', input: [[0, 100], 100, 1, [10, 11]], expected: ['fresh:10', 'fresh:11'] },
      { name: 'A retry succeeds', input: [[0], 100, 3, [null, null, 7]], expected: ['fresh:7'] },
      { name: 'Every try fails with nothing cached', input: [[0], 100, 2, [null, null]], expected: ['failed'] },
      {
        name: 'Every try fails with an old price cached',
        input: [[0, 200, 250], 100, 2, [30, null, null, null, 31]],
        expected: ['fresh:30', 'stale:30', 'fresh:31'],
      },
      { name: 'Missing outcomes count as failures', input: [[0, 500], 100, 3, [8]], expected: ['fresh:8', 'stale:8'] },
      { name: 'A price of zero is still a price', input: [[0, 10], 100, 1, [0]], expected: ['fresh:0', 'cache:0'] },
      {
        name: 'A stale answer keeps the old fetch time',
        input: [[0, 150, 160], 100, 1, [5, null, 6]],
        expected: ['fresh:5', 'stale:5', 'fresh:6'],
      },
    ],
  },
]
