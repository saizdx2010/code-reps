import type { RepDepth } from './rep-depth.ts'

export const asyncRuntimeDepth: Record<string, RepDepth> = {
  'await-local-records': {
    reasoning: 'Awaiting inside the loop ensures at most one fetch is pending. A rejection leaves the loop immediately, and finally releases after the awaited work settles. Each successful value is appended without normalization.',
    trace: 'For [a, bad, b], a starts and resolves to " Ada ". bad then starts and rejects Unavailable. b never starts, the result is null, and release is called once with no work pending.',
    alternative: 'A promise chain can preserve the same ordering but makes early failure and cleanup harder to read. Starting all fetches with Promise.all violates this sequential contract. Both successful sequential approaches use O(n) results and O(n) calls.',
    counterexample: 'ids.map(fixture.fetch) starts b before a settles. Returning from catch without cleanup leaves the fixture owned after bad rejects. Empty input exposes cleanup placed only inside the loop.',
    transfer: 'Add a retry limit per record. Decide whether a failed retry stops the whole sequence and whether a cancellation may interrupt retry. This changed contract is self-reviewed.',
  },
  'settle-local-panels': {
    reasoning: 'Creating every promise before awaiting collection lets independent work overlap. Each settled result occupies its original input position, so rejection does not erase another panel. Releasing after all outcomes exist leaves no pending work.',
    trace: 'For [bad, a, b], all three start before the first settlement. bad rejects, a fulfills with " Ada ", b fulfills with empty text. The returned outcomes remain error, ready, ready; release follows every settlement.',
    alternative: 'Promise.allSettled directly represents mixed outcomes. Promise.all over promises individually caught into outcome objects also works. Bare Promise.all rejects on one failure and cannot produce the required panel array. Storage and call count are O(n).',
    counterexample: 'A loop with await produces correct values but its start log proves the panels ran sequentially. Filtering rejected results removes the first position and loses its exact error message.',
    transfer: 'Limit concurrency to two panels while retaining output order. Define how queued work behaves during cancellation; the original checks do not validate this variation.',
  },
  'cancel-local-export': {
    reasoning: 'The pre-abort check prevents unnecessary work. Passing the same signal lets a pending fetch reject cooperatively. Error-name classification preserves the difference between cancellation and failure. finally ends ownership only after settlement.',
    trace: 'For [a, b] with during cancellation, a starts with the signal. The fixture aborts before a settles and rejects AbortError. b never starts. Output is cancelled and the release log appears after abort:a.',
    alternative: 'Extracting one record loader can centralize error handling, but the export still needs one owner for release. Checking only signal.aborted before fetching misses cancellation during an await. Terminating a worker stops execution but does not run learner finally blocks.',
    counterexample: 'Omitting the fetch signal makes a fulfill despite the fixture aborting. Catching every error as cancellation mislabels bad → Unavailable. Releasing before await produces release:pending, even if the final output looks right.',
    transfer: 'Stream export chunks to a consumer. Decide whether cancellation retains completed chunks or rolls them back, and who owns consumer cleanup. This transfer requires separate runtime checks.',
  },
}

export const asyncRuntimeGuides = {
  'await-local-records': { plan: ['State the next-start dependency.', 'Include failure and empty-input cleanup.'], explanation: ['Trace a rejection in the middle.', 'Compare sequential awaiting with starting every promise first.'], example: 'I await one fetch at a time and stop at the first rejection. finally releases once on success, failure, and empty input. The lifecycle checks establish local runtime order, not network timing.' },
  'settle-local-panels': { plan: ['Keep one outcome per position.', 'State when ownership ends.'], explanation: ['Trace a failed panel beside successful ones.', 'Explain why a returned array alone would not prove concurrency.'], example: 'All promises start before collection is awaited. Each failure becomes its own outcome. I release after every promise settles, preserving exact text and input order.' },
  'cancel-local-export': { plan: ['Separate cancellation from failure.', 'Include pre-abort and in-flight abort.'], explanation: ['Trace the signal through one pending fetch.', 'Distinguish cooperative cleanup from stopping a worker.'], example: 'I avoid work when already cancelled, pass the signal to pending work, and classify AbortError separately. finally releases after settlement. Stopping the app runner terminates its worker and cannot promise learner finally execution.' },
}
