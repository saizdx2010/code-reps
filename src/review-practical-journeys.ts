import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

const scrollEvents = ['0: y 0', '40: y 4', '80: y 8', '120: y 12', '160: y 16', '200: y 20']
const scrollState = (windowEnd: number | null, kept: string | null, reports: string, eventIndex?: number) => ({
  kind: 'state' as const,
  entries: [
    ['window ends', windowEnd],
    ['kept', kept],
    ['reports', reports],
  ] as [string, string | number | null][],
  events: scrollEvents,
  ...(eventIndex === undefined ? {} : { eventIndex }),
})

export const practicalJourneyDepth: Record<string, RepDepth> = {
  'autosave-debounce': {
    reasoning:
      'Only one pending save exists at a time, and every edit replaces it, so the text saved after a pause is always the latest. Checking the due time before handling each event places each save at the moment it would really happen, even when the next event is much later. A blur flushes early so leaving the field never loses work, and comparing with the last saved text skips requests that would store nothing new.',
    trace:
      'With wait 400: a at 0 is due at 400. ab arrives at 1000, after the due time, so a is saved at 400 first. ab is due at 1400, but abc at 1200 replaces it and is due at 1600. No events remain, so abc is saved at 1600.',
    alternative:
      'A maximum wait, which forces a save after, say, 5 seconds of continuous typing, protects long sessions where the writer never pauses. Saving on every keystroke with idempotent writes is simpler but sends far more requests. Comparing against the last saved text needs that text in memory; a hash or version number is a cheaper stand-in for large documents.',
    counterexample:
      'Saving when the next event arrives instead of at the due time records a at 1000 instead of 400. Forgetting to clear the pending text after a skipped save makes a later blur save it again. Treating a blur like an edit restarts the wait instead of saving immediately.',
    transfer:
      'Add a maximum wait so typing that never pauses still saves every 2000 milliseconds. Decide which due time wins when both are pending. This changed contract is self-reviewed.',
  },
  'scroll-report-throttle': {
    reasoning:
      'A window guarantees at most one report per interval. Reporting immediately when no window is open keeps the first movement responsive, and the kept value guarantees the last movement in a window is reported when it ends. Because a trailing report opens a new window, closing windows must loop: one closing can open another that has also ended by the time the next event arrives.',
    trace:
      'Scrolling every 40 milliseconds with an interval of 100 reports at 0 immediately. The window ends at 100 with 8 kept, so 8 is reported at 100. The next window ends at 200 with 16 kept. The event at 200 arrives after that window ends, so 16 is reported first and 20 is kept. When the events stop, 20 is reported at 300.',
    traceSteps: {
      code: [
        'function scrollReports(events: { at: number; y: number }[], interval: number): { at: number; y: number }[] {',
        '  const reports: { at: number; y: number }[] = []',
        '  let windowEnd: number | null = null, kept: number | null = null',
        '  for (const event of [...events, { at: Infinity, y: 0 }]) {',
        '    while (windowEnd !== null && windowEnd <= event.at) {',
        '      if (kept === null) windowEnd = null',
        '      else { reports.push({ at: windowEnd, y: kept }); kept = null; windowEnd += interval }',
        '    }',
        '    if (event.at === Infinity) break',
        '    if (windowEnd === null) { reports.push({ at: event.at, y: event.y }); windowEnd = event.at + interval }',
        '    else kept = event.y',
        '  }',
        '  return reports',
        '}',
      ],
      input:
        'events = [{ at: 0, y: 0 }, { at: 40, y: 4 }, { at: 80, y: 8 }, { at: 120, y: 12 }, { at: 160, y: 16 }, { at: 200, y: 20 }], interval = 100',
      steps: [
        {
          line: 9,
          vars: { at: 0 },
          structure: scrollState(100, null, '0 @ 0', 0),
          note: 'No window is open, so the first position is reported immediately and a window runs until 100.',
        },
        {
          line: 10,
          vars: { at: 80 },
          structure: scrollState(100, '8', '0 @ 0', 2),
          note: '40 and 80 fall inside the window. Only the latest is kept: 8 replaced 4.',
        },
        {
          line: 6,
          vars: { at: 120, windowEnd: 200 },
          structure: scrollState(200, null, '0 @ 0, 8 @ 100', 3),
          note: 'Before handling 120, the window that ended at 100 closes. 8 was kept, so it is reported at 100 and a new window runs until 200.',
        },
        {
          line: 10,
          vars: { at: 160 },
          structure: scrollState(200, '16', '0 @ 0, 8 @ 100', 4),
          note: '120 and 160 are inside the new window; 16 is kept.',
        },
        {
          line: 6,
          vars: { at: 200, windowEnd: 300 },
          structure: scrollState(300, null, '0 @ 0, 8 @ 100, 16 @ 200', 5),
          note: 'The event at 200 arrives exactly when the window ends, so the window closes first and reports 16 at 200.',
        },
        {
          line: 10,
          vars: { at: 200 },
          structure: scrollState(300, '20', '0 @ 0, 8 @ 100, 16 @ 200', 5),
          note: 'The event at 200 now falls inside the window that just opened, so 20 is kept rather than reported.',
        },
        {
          line: 6,
          vars: { windowEnd: 400 },
          structure: scrollState(400, null, '0 @ 0, 8 @ 100, 16 @ 200, 20 @ 300'),
          note: 'After the last event, a sentinel at time Infinity closes every remaining window. Closing at 300 reports the last position, 20.',
        },
        {
          line: 12,
          vars: { result: '[{"at":0,"y":0},{"at":100,"y":8},{"at":200,"y":16},{"at":300,"y":20}]' },
          structure: scrollState(null, null, '0 @ 0, 8 @ 100, 16 @ 200, 20 @ 300'),
          note: 'The window ending at 400 has nothing kept, so it closes and the loop stops. Four reports for six events, and the final position was not lost.',
        },
      ],
    },
    alternative:
      'A leading-only throttle, as in Keep leading throttle events, is simpler but drops the last position, which is exactly what a resume feature needs. A trailing-only debounce reports nothing while the reader scrolls continuously. requestAnimationFrame-based throttling ties the rate to screen refreshes rather than a fixed interval.',
    counterexample:
      'Closing at most one window per event misses the case where a trailing report opens a window that has also ended. Reporting the event at 200 immediately, because it lands on the boundary, sends two reports at 200. Forgetting the final close loses 20.',
    transfer:
      'Report immediately when the reader jumps more than 1000 pixels, even inside a window. Decide what happens to the kept value and the current window when that happens. This changed contract is self-reviewed.',
  },
  'payment-resubmit': {
    reasoning:
      'The server and the client know different things. The server remembers the first amount for every key it has seen, which makes repeats safe: a repeat with the same amount is replayed and never charges again. The client only knows what responses it received, so a key stays unconfirmed when its latest attempt was lost or timed out, even if the server actually charged it.',
    trace:
      'For a timeout on k1 for 500, the server charges 500 but the client hears nothing. The retry with the same key reaches the server, which replays the stored result without charging. The client now knows k1 succeeded, so it is no longer unconfirmed, and the total charged is still 500.',
    alternative:
      'Generating a new key for every retry is simpler to code but charges twice whenever a timeout hides a success. Asking the server for the status of a key before retrying avoids a duplicate request but adds a round trip and still needs idempotency if the status call itself times out.',
    counterexample:
      'Treating a timeout like a lost request skips the server’s charge and reports 0 for a single timed-out payment. Charging again on a replay doubles the total. Removing a key from unconfirmed only when its attempt was “processed” and charged misses that a conflict response also tells the client what happened.',
    transfer:
      'Let keys expire 24 hours after the server first sees them. Decide what a retry after expiry does and how the client should choose a retry window. This changed contract is self-reviewed.',
  },
  'quote-cache-retry': {
    reasoning:
      'The cache is fresh while the request time is strictly before its fetch time plus ttl, so a request exactly at expiry fetches again. Retries consume outcomes in order until one succeeds or the attempts run out. A failure never changes the cache, so serving a stale price leaves the old fetch time in place, and the next request after expiry tries again rather than trusting the stale value as fresh.',
    trace:
      'With ttl 100 and one attempt, outcomes 5, null, 6: at 0 fetch 5. At 150 the cache has expired and the try fails, so return stale:5 and keep fetch time 0. At 160 the cache is still expired, so fetch again and get 6.',
    alternative:
      'Stale-while-revalidate returns the stale price immediately and refreshes in the background, which is faster for users but needs real asynchronous work. Exponential backoff between retries, as in Calculate bounded retry delays, protects a struggling upstream service; this model retries instantly. A circuit breaker would stop trying for a while after repeated failures.',
    counterexample:
      'Using <= for freshness serves cache:10 at exactly 100 instead of fetching. Updating the fetch time when serving stale makes the next request return cache:5 instead of trying again. Testing the price with if (price) treats a free quote of 0 as a failure.',
    transfer:
      'Stop serving a stale price once it is more than 1000 time units old, and return failed instead. Decide which time you compare and how the label changes. This changed contract is self-reviewed.',
  },
}

export const practicalJourneyGuides: Record<string, ReflectionGuide> = {
  'autosave-debounce': {
    plan: [
      'Name the state you must remember between events.',
      'Predict the saves for a blur during a pause, an edit exactly at the due time, and an edit that restores the saved text.',
    ],
    explanation: [
      'Explain how your code decides when a pending save happens and at what time.',
      'Explain how a blur and a skipped save change the pending state.',
      'State what this model leaves out compared with real timers.',
    ],
    example:
      'I keep the pending text, its due time, and the last saved text. Before each event I save the pending text at its due time if the event is at or after it. Edits replace the pending text; a blur saves it at once. A save matching the last saved text is skipped, and every save attempt clears the pending text.',
  },
  'scroll-report-throttle': {
    plan: [
      'Name the state you need between events.',
      'Predict the reports for one event, two events far apart, and an event exactly at a window’s end.',
    ],
    explanation: [
      'Explain why closing windows must repeat before each event.',
      'Explain what happens to an event that lands exactly on a window’s end.',
      'Compare this policy with a leading-only throttle and a debounce.',
    ],
    example:
      'I keep when the current window ends and the latest kept position. Before each event I close every window that has ended: a kept value is reported at the window’s end and opens a new window. Then an event outside any window is reported at once and opens a window; one inside is kept. After the events I close the remaining windows.',
  },
  'payment-resubmit': {
    plan: [
      'For a timeout followed by a retry, write what the server has done and what the client knows after each attempt.',
      'Name the outcome that leaves the server unchanged.',
    ],
    explanation: [
      'Explain why a retry with the same key cannot charge twice.',
      'Explain how you decide which keys are unconfirmed and in what order.',
      'Explain what would go wrong if every retry used a new key.',
    ],
    example:
      'A Map from key to first amount models the server: lost attempts skip it, a new key charges, and a repeat is replayed or a conflict. A second Map records each key’s latest outcome in first-appearance order; keys whose latest outcome was lost or timeout are unconfirmed.',
  },
  'quote-cache-retry': {
    plan: [
      'List the state you keep between requests.',
      'Predict the labels when a request lands exactly at fetch time plus ttl and when every retry fails with an old price cached.',
    ],
    explanation: [
      'Explain your freshness comparison and why it is strict.',
      'Explain why a stale answer does not change the cached fetch time.',
      'State what this model leaves out compared with real network retries.',
    ],
    example:
      'I keep the cached price, its fetch time, and the next outcome index. A request before fetch time plus ttl returns the cached price. Otherwise I try up to maxAttempts outcomes, treating null or a missing outcome as failure; the first price is cached with the request time. If every try fails, I return the stale price or failed.',
  },
}
