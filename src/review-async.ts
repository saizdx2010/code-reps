import type { RepDepth } from './rep-depth.ts'

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
