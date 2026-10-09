import type { Rep } from './rep.ts'
import type { RepDepth } from './rep-depth.ts'

// Pure event traces: no live requests, timers, or browser integration are assessed.
export const asyncReps: Rep[] = [
  {
    id: 'search-request-state', title: 'Keep search results consistent', category: 'Practical concepts',
    context: 'A search screen receives results and errors in a different order from the requests. Implement its written display policy.',
    prompt: 'Implement searchState(events) and return the final display state. Start: {status: "idle", items: [], error: null}. start(id): make id current; return loading with empty items and no error. resolve(id) for the current id: return ready with its items (an empty list is still ready); the request ends. reject(id) for the current id: return error with empty items and its message (an empty message is still an error); the request ends. cancel(id) for the current id: return idle with empty items and no error; the request ends. Any other id, or any event after its request ended: no effect.',
    example: { input: 'searchState([{kind: "start", id: "A"}, {kind: "start", id: "B"}, {kind: "resolve", id: "B", items: ["Bo"]}, {kind: "reject", id: "A", message: "Offline"}])', output: '{status: "ready", items: ["Bo"], error: null}' },
    note: 'At most 200 events. Every start has a unique nonempty ID; IDs are compared exactly. Items and messages are strings, preserved without normalization; an empty message is allowed. Events may arrive without a matching start or after completion or cancellation. Do not change input arrays or objects. This trace does not run a real search request.',
    vocabulary: [{ term: 'Display policy', meaning: 'the required state a person sees after an event' }, { term: 'Settled request', meaning: 'work that has ended with a result, error, or cancellation' }],
    planPrompt: 'Describe which events may change the screen, and name a case where the screen must stay unchanged.',
    starter: `type SearchEvent = {kind: 'start' | 'cancel'; id: string} | {kind: 'resolve'; id: string; items: string[]} | {kind: 'reject'; id: string; message: string}
type SearchState = {status: 'idle' | 'loading' | 'ready' | 'error'; items: string[]; error: string | null}
function searchState(events: SearchEvent[]): SearchState {
  return {status: 'idle', items: [], error: null}
}
`,
    functionName: 'searchState', preserveInput: true,
    hints: ['Separate who may update the screen from what the screen displays.', 'Keep a current request ID. Ignore events that do not match it.', 'After a matching resolve, reject, or cancel, remove ownership so a duplicate cannot change the settled state.'],
    checks: [
      { name: 'No events means idle', input: [[]], expected: {status: 'idle', items: [], error: null} },
      { name: 'A pending request is loading', input: [[{kind: 'start', id: 'A'}]], expected: {status: 'loading', items: [], error: null} },
      { name: 'Obsolete errors cannot replace current results', input: [[{kind: 'start', id: 'A'}, {kind: 'start', id: 'B'}, {kind: 'resolve', id: 'B', items: ['Bo']}, {kind: 'reject', id: 'A', message: 'Offline'}]], expected: {status: 'ready', items: ['Bo'], error: null} },
      { name: 'Empty results are ready, not loading', input: [[{kind: 'start', id: 'A'}, {kind: 'resolve', id: 'A', items: []}]], expected: {status: 'ready', items: [], error: null} },
      { name: 'Failure preserves an empty error message', input: [[{kind: 'start', id: 'A'}, {kind: 'reject', id: 'A', message: ''}]], expected: {status: 'error', items: [], error: ''} },
      { name: 'Cancel ignores late success', input: [[{kind: 'start', id: 'A'}, {kind: 'cancel', id: 'A'}, {kind: 'resolve', id: 'A', items: ['late']}]], expected: {status: 'idle', items: [], error: null} },
      { name: 'Settled success ignores duplicate failure and cancellation', input: [[{kind: 'start', id: 'A'}, {kind: 'resolve', id: 'A', items: [' Ada ', '']}, {kind: 'reject', id: 'A', message: 'duplicate'}, {kind: 'cancel', id: 'A'}]], expected: {status: 'ready', items: [' Ada ', ''], error: null} },
      { name: 'Unmatched events are ignored', input: [[{kind: 'resolve', id: 'X', items: ['stray']}, {kind: 'reject', id: 'Y', message: 'stray'}, {kind: 'cancel', id: 'Z'}]], expected: {status: 'idle', items: [], error: null} },
      { name: 'New start clears prior results and old cancellation is ignored', input: [[{kind: 'start', id: 'A'}, {kind: 'resolve', id: 'A', items: ['old']}, {kind: 'start', id: 'B'}, {kind: 'cancel', id: 'A'}]], expected: {status: 'loading', items: [], error: null} },
      { name: 'Settled failure rejects late success', input: [[{kind: 'start', id: 'A'}, {kind: 'reject', id: 'A', message: 'Offline'}, {kind: 'resolve', id: 'A', items: ['late']}]], expected: {status: 'error', items: [], error: 'Offline'} },
      { name: 'Handles the 200-event limit', input: [Array.from({length: 100}, (_, index) => [{kind: 'start', id: String(index)}, {kind: 'resolve', id: String(index), items: [String(index)]}]).flat()], expected: {status: 'ready', items: ['99'], error: null} },
      { name: 'Retry clears a previous error', input: [[{kind: 'start', id: 'A'}, {kind: 'reject', id: 'A', message: 'Offline'}, {kind: 'start', id: 'a'}, {kind: 'resolve', id: 'a', items: ['new']}]], expected: {status: 'ready', items: ['new'], error: null} },
    ],
  },
  {
    id: 'preview-slot-results', title: 'Recall ownership across preview slots', category: 'Practical concepts',
    context: 'A document screen has several independently loaded previews. Replacing or removing one preview must not disturb another.',
    prompt: 'Implement previewSlots(events). select creates or replaces one slot with {slot, status: "loading", url: null} and its load token. loaded changes that slot to ready with the exact URL only if the token belongs to its pending selection; that load then ends. remove deletes the slot, including any pending load. Unmatched or already-ended loaded events have no effect. Return remaining slots in the order they were first selected. Replacing a present slot keeps its position; selecting a removed slot puts it at the end.',
    example: { input: 'previewSlots([{kind: "select", slot: "cover", token: "A"}, {kind: "select", slot: "detail", token: "B"}, {kind: "loaded", slot: "cover", token: "A", url: "cover.png"}])', output: '[{slot: "cover", status: "ready", url: "cover.png"}, {slot: "detail", status: "loading", url: null}]' },
    note: 'At most 200 events. Slot names and tokens are nonempty strings compared exactly; each select token is globally unique. URLs are opaque strings, including empty text: do not parse or normalize them. loaded may arrive after removal or replacement or without a select. Removing an absent slot does nothing. Do not change supplied arrays or objects. No real images are loaded.',
    vocabulary: [{ term: 'Slot', meaning: 'a named place that displays one preview' }, { term: 'Load token', meaning: 'an identity for one particular selection and its result' }],
    planPrompt: 'Restate the output ordering and explain what must happen when one preview changes while another is still loading.',
    starter: `type PreviewEvent = {kind: 'select'; slot: string; token: string} | {kind: 'loaded'; slot: string; token: string; url: string} | {kind: 'remove'; slot: string}
type PreviewSlot = {slot: string; status: 'loading' | 'ready'; url: string | null}
function previewSlots(events: PreviewEvent[]): PreviewSlot[] {
  return []
}
`,
    functionName: 'previewSlots', preserveInput: true,
    hints: ['Track each slot independently rather than having one current token for the whole screen.', 'An insertion-ordered Map can keep a slot in place on replacement and move it to the end after deletion and reinsertion.', 'Store the pending token with each slot. Clear it on an accepted load, and return only the public fields.'],
    checks: [
      { name: 'No selected slots', input: [[]], expected: [] },
      { name: 'Slots complete independently', input: [[{kind: 'select', slot: 'cover', token: 'A'}, {kind: 'select', slot: 'detail', token: 'B'}, {kind: 'loaded', slot: 'cover', token: 'A', url: 'cover.png'}]], expected: [{slot: 'cover', status: 'ready', url: 'cover.png'}, {slot: 'detail', status: 'loading', url: null}] },
      { name: 'Replacement ignores older load and keeps position', input: [[{kind: 'select', slot: 'z', token: 'A'}, {kind: 'select', slot: 'a', token: 'B'}, {kind: 'select', slot: 'z', token: 'C'}, {kind: 'loaded', slot: 'z', token: 'A', url: 'old'}, {kind: 'loaded', slot: 'z', token: 'C', url: ' new '}]], expected: [{slot: 'z', status: 'ready', url: ' new '}, {slot: 'a', status: 'loading', url: null}] },
      { name: 'Removed slot cannot be recreated by a late load', input: [[{kind: 'select', slot: 'cover', token: 'A'}, {kind: 'remove', slot: 'cover'}, {kind: 'loaded', slot: 'cover', token: 'A', url: 'late'}]], expected: [] },
      { name: 'Reselection moves to the end and rejects removed token', input: [[{kind: 'select', slot: 'cover', token: 'A'}, {kind: 'select', slot: 'detail', token: 'B'}, {kind: 'remove', slot: 'cover'}, {kind: 'select', slot: 'cover', token: 'C'}, {kind: 'loaded', slot: 'cover', token: 'A', url: 'late'}]], expected: [{slot: 'detail', status: 'loading', url: null}, {slot: 'cover', status: 'loading', url: null}] },
      { name: 'Wrong slot and unknown removal are harmless', input: [[{kind: 'remove', slot: 'missing'}, {kind: 'select', slot: 'cover', token: 'A'}, {kind: 'select', slot: 'detail', token: 'B'}, {kind: 'loaded', slot: 'detail', token: 'A', url: 'wrong'}, {kind: 'loaded', slot: 'missing', token: 'X', url: 'stray'}]], expected: [{slot: 'cover', status: 'loading', url: null}, {slot: 'detail', status: 'loading', url: null}] },
      { name: 'Empty URL is ready and duplicate loads are ignored', input: [[{kind: 'select', slot: '__proto__', token: 'A'}, {kind: 'loaded', slot: '__proto__', token: 'A', url: ''}, {kind: 'loaded', slot: '__proto__', token: 'A', url: 'duplicate'}]], expected: [{slot: '__proto__', status: 'ready', url: ''}] },
      { name: 'Handles 200 events without merging exact slot names', input: [Array.from({length: 100}, (_, index) => [{kind: 'select', slot: index%2===0?'cover':'Cover', token: String(index)}, {kind: 'loaded', slot: index%2===0?'cover':'Cover', token: String(index), url: String(index)}]).flat()], expected: [{slot: 'cover', status: 'ready', url: '98'}, {slot: 'Cover', status: 'ready', url: '99'}] },
      { name: 'Replacing ready content clears its URL', input: [[{kind: 'select', slot: 'cover', token: 'A'}, {kind: 'loaded', slot: 'cover', token: 'A', url: 'old'}, {kind: 'select', slot: 'cover', token: 'B'}]], expected: [{slot: 'cover', status: 'loading', url: null}] },
    ],
  },
  {
    id: 'refresh-report-state', title: 'Refresh a report without losing its data', category: 'Practical concepts',
    context: 'A dashboard keeps its last report visible during refresh and after refresh failure. Apply that display policy to a recorded event sequence.',
    prompt: 'Implement reportState(initial, events). Start with {value: initial, pending: false, error: null}. refresh makes its ID current, sets pending to true, and clears error while keeping value. A current resolve replaces value and ends the refresh with pending false and no error. A current reject ends the refresh with its error message while keeping value. A current cancel ends the refresh with no error while keeping value. Ignore events for another ID or an already-ended refresh. Return the final state.',
    example: { input: 'reportState("yesterday", [{kind: "refresh", id: "A"}, {kind: "reject", id: "A", message: "Offline"}])', output: '{value: "yesterday", pending: false, error: "Offline"}' },
    note: 'initial is a string or null; null means no report yet. At most 200 events. Every refresh ID is unique and nonempty, compared exactly. Values and error messages are exact strings, including empty text. Events can be unmatched or late. Do not mutate inputs. This is a display-policy trace, not a live cache or network test.',
    vocabulary: [{ term: 'Refresh', meaning: 'requesting a newer value while an earlier value may still be displayed' }, { term: 'Stale data', meaning: 'a previous result that may no longer reflect the source' }],
    planPrompt: 'Explain which events keep the previous value and which replace it. Name a case that separates this policy from clearing data on every start.',
    starter: `type ReportEvent = {kind: 'refresh' | 'cancel'; id: string} | {kind: 'resolve'; id: string; value: string} | {kind: 'reject'; id: string; message: string}
type ReportState = {value: string | null; pending: boolean; error: string | null}
function reportState(initial: string | null, events: ReportEvent[]): ReportState {
  return {value: initial, pending: false, error: null}
}
`,
    functionName: 'reportState', preserveInput: true,
    hints: ['Keep the last accepted value separate from pending work and the latest refresh error.', 'Track the active refresh ID; a new refresh changes ownership but keeps the value.', 'Accept only a matching terminal event, then clear ownership. Failure and cancellation keep data but have different error output.'],
    checks: [
      { name: 'No refresh preserves initial null', input: [null, []], expected: {value: null, pending: false, error: null} },
      { name: 'Pending refresh preserves prior report', input: ['old', [{kind: 'refresh', id: 'A'}]], expected: {value: 'old', pending: true, error: null} },
      { name: 'Failure preserves data and reports the error', input: ['old', [{kind: 'refresh', id: 'A'}, {kind: 'reject', id: 'A', message: 'Offline'}]], expected: {value: 'old', pending: false, error: 'Offline'} },
      { name: 'Obsolete failure cannot end a newer refresh', input: ['old', [{kind: 'refresh', id: 'A'}, {kind: 'refresh', id: 'B'}, {kind: 'reject', id: 'A', message: 'old error'}]], expected: {value: 'old', pending: true, error: null} },
      { name: 'Latest success wins over old success and duplicate failure', input: ['old', [{kind: 'refresh', id: 'A'}, {kind: 'refresh', id: 'B'}, {kind: 'resolve', id: 'B', value: ' new '}, {kind: 'resolve', id: 'A', value: 'late'}, {kind: 'reject', id: 'B', message: 'duplicate'}]], expected: {value: ' new ', pending: false, error: null} },
      { name: 'Cancel retains data and rejects late success', input: ['old', [{kind: 'refresh', id: 'A'}, {kind: 'cancel', id: 'A'}, {kind: 'resolve', id: 'A', value: 'late'}]], expected: {value: 'old', pending: false, error: null} },
      { name: 'Retry clears error and accepts an empty value', input: [null, [{kind: 'refresh', id: 'A'}, {kind: 'reject', id: 'A', message: ''}, {kind: 'refresh', id: 'B'}, {kind: 'cancel', id: 'A'}, {kind: 'resolve', id: 'B', value: ''}]], expected: {value: '', pending: false, error: null} },
      { name: 'Unmatched results do nothing', input: ['', [{kind: 'resolve', id: 'A', value: 'stray'}, {kind: 'reject', id: 'B', message: 'stray'}, {kind: 'cancel', id: 'C'}]], expected: {value: '', pending: false, error: null} },
      { name: 'Settled failure rejects late success', input: ['old', [{kind: 'refresh', id: 'A'}, {kind: 'reject', id: 'A', message: 'Offline'}, {kind: 'resolve', id: 'A', value: 'late'}]], expected: {value: 'old', pending: false, error: 'Offline'} },
      { name: 'Handles the 200-event limit', input: [null, Array.from({length: 100}, (_, index) => [{kind: 'refresh', id: String(index)}, {kind: 'resolve', id: String(index), value: String(index)}]).flat()], expected: {value: '99', pending: false, error: null} },
      { name: 'Empty failure message is still an error', input: [null, [{kind: 'refresh', id: 'A'}, {kind: 'reject', id: 'A', message: ''}]], expected: {value: null, pending: false, error: ''} },
    ],
  },
]

export const asyncRepDepth: Record<string, RepDepth> = {
  'search-request-state': {
    reasoning: 'Only the pending owner can change the display. Ending ownership on a terminal event makes duplicate results harmless. The display state is separate: ready with zero items differs from unresolved loading.',
    trace: 'A starts, B starts, B resolves to [Bo], A rejects. B gives ready [Bo] and removes pending ownership. A cannot change it. Even a later B cancellation is ignored because B already ended.',
    alternative: 'A reducer returning a new state per event makes transitions explicit; a loop with local state is shorter for a final-only trace. Both take O(n) event processing plus copying accepted item arrays, and storage for the accepted items. A mounted flag cannot separate A from B.',
    counterexample: 'Keeping B as owner after B resolves lets a duplicate rejection erase valid results. Using items.length to infer loading mislabels a successful empty response.',
    transfer: 'Add pagination while a query changes. Decide whether ownership belongs to one page, one query, or both; define whether previous pages remain visible. This extension is self-reviewed.',
  },
  'preview-slot-results': {
    reasoning: 'Ownership and completion are scoped to each slot. Insertion order is a separate requirement: replacing a slot changes its contents, while deleting and reinserting changes its position.',
    trace: 'Select cover:A, detail:B, remove cover, select cover:C, load cover:A. Output order is detail then cover. A no longer owns cover, so cover remains loading for C while detail still waits for B.',
    alternative: 'An insertion-ordered Map supports expected constant-time slot lookup, replacement, and deletion. An array with findIndex is straightforward for small inputs but can take O(nk) across n events and k slots. Both need O(k) slot state and output; copied text storage is additional.',
    counterexample: 'One global token rejects a valid cover:A completion as soon as detail:B starts. A plain object can mishandle a slot named __proto__; sorting slots changes the required order.',
    transfer: 'Add a failed load with a Retry control for one slot. Define whether retry retains its old URL and how removal affects a retry. Review keyboard and browser behavior separately.',
  },
  'refresh-report-state': {
    reasoning: 'The accepted report outlives a refresh attempt. Pending ownership controls only who may replace it or report an error; start, failure, and cancellation preserve that report.',
    trace: 'Initial yesterday; A refreshes, fails Offline, B refreshes, then A resolves late. B is pending, yesterday stays visible, and the old error is cleared. Only a B result can replace the report.',
    alternative: 'Clearing old data simplifies an initial-loading view but violates this refresh contract. Explicit value, pending, and error fields allow old data with a loading indicator or error. A loop takes O(n) time and constant state apart from retained text.',
    counterexample: 'Resetting value to null on failure loses a valid previous report. Using value || fallback also loses an accepted empty string. Keeping the settled owner permits duplicate results to change the display.',
    transfer: 'Change accounts while refreshing. Decide whether old-account data must be cleared even though same-account refresh preserves it. This altered policy needs separate checks.',
  },
}

export const asyncGuides = {
  'search-request-state': { plan: ['Separate display state from pending request ownership.', 'List start, result, failure, cancellation, and duplicate behavior.'], explanation: ['Trace an obsolete failure after a newer success.', 'Explain ready empty results and why terminal events remove ownership.'], example: 'I keep a pending ID and a separate display state. Only the pending request can settle. I clear ownership after settlement, so late or duplicate events cannot change the display.' },
  'preview-slot-results': { plan: ['Track ownership separately for each slot.', 'Specify replacement and removal ordering.'], explanation: ['Trace removal and reselection while another slot loads.', 'Explain token matching, duplicate results, and output order.'], example: 'Each slot keeps its own pending token. Replacing its selection keeps its position; removing it discards ownership. A later selection is appended. A loaded event must match both its slot and pending token.' },
  'refresh-report-state': { plan: ['Keep accepted data separate from refresh state.', 'List what preserves data and what replaces it.'], explanation: ['Trace failure, retry, and a late old result.', 'Distinguish cancellation from failure and null from an empty string.'], example: 'Refresh keeps the accepted report visible and clears the prior error. Only its pending owner may settle. Success replaces the report; failure or cancellation retains it. All terminal events release ownership.' },
}
