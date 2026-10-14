import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const asyncRepDepth: Record<string, RepDepth> = {
  'search-request-state': {
    traceSteps: {
      code: [
        'function searchState(events: SearchEvent[]): SearchState {',
        "  let state: SearchState = {status: 'idle', items: [], error: null}, current: string | null = null",
        '  for (const e of events) {',
        "    if (e.kind === 'start') { current = e.id; state = {status: 'loading', items: [], error: null}; continue }",
        '    if (e.id !== current) continue',
        '    current = null',
        "    if (e.kind === 'resolve') state = {status: 'ready', items: e.items, error: null}",
        "    else if (e.kind === 'reject') state = {status: 'error', items: [], error: e.message}",
        "    else state = {status: 'idle', items: [], error: null}",
        '  }',
        '  return state',
        '}',
      ],
      input:
        'events = [{kind: "start", id: "A"}, {kind: "start", id: "B"}, {kind: "resolve", id: "B", items: ["Bo"]}, {kind: "reject", id: "A", message: "Offline"}]',
      steps: [
        {
          line: 1,
          vars: { status: 'idle' },
          structure: {
            kind: 'state',
            entries: [
              ['current id', 'none'],
              ['status', 'idle'],
              ['items', '[]'],
              ['error', 'null'],
            ],
            events: ['start A', 'start B', 'resolve B [Bo]', 'reject A "Offline"'],
          },
          note: 'Nothing is pending and the screen is idle. The four events are still to come.',
        },
        {
          line: 3,
          vars: { event: 'start A' },
          structure: {
            kind: 'state',
            entries: [
              ['current id', 'A'],
              ['status', 'loading'],
              ['items', '[]'],
              ['error', 'null'],
            ],
            events: ['start A', 'start B', 'resolve B [Bo]', 'reject A "Offline"'],
            eventIndex: 0,
          },
          note: 'start A makes A the current request and shows loading.',
        },
        {
          line: 3,
          vars: { event: 'start B' },
          structure: {
            kind: 'state',
            entries: [
              ['current id', 'B'],
              ['status', 'loading'],
              ['items', '[]'],
              ['error', 'null'],
            ],
            events: ['start A', 'start B', 'resolve B [Bo]', 'reject A "Offline"'],
            eventIndex: 1,
          },
          note: 'start B replaces A as the current request. A is now obsolete.',
        },
        {
          line: 6,
          vars: { event: 'resolve B' },
          structure: {
            kind: 'state',
            entries: [
              ['current id', 'none'],
              ['status', 'ready'],
              ['items', '["Bo"]'],
              ['error', 'null'],
            ],
            events: ['start A', 'start B', 'resolve B [Bo]', 'reject A "Offline"'],
            eventIndex: 2,
          },
          note: 'B is current, so its result is shown. The request ends, so no id is current.',
        },
        {
          line: 4,
          vars: { event: 'reject A' },
          structure: {
            kind: 'state',
            entries: [
              ['current id', 'none'],
              ['status', 'ready'],
              ['items', '["Bo"]'],
              ['error', 'null'],
            ],
            events: ['start A', 'start B', 'resolve B [Bo]', 'reject A "Offline"'],
            eventIndex: 3,
          },
          note: 'A is not the current id, so the failure is ignored. The screen is unchanged.',
        },
        {
          line: 10,
          vars: { result: '{"status":"ready","items":["Bo"],"error":null}' },
          structure: {
            kind: 'state',
            entries: [
              ['current id', 'none'],
              ['status', 'ready'],
              ['items', '["Bo"]'],
              ['error', 'null'],
            ],
            events: ['start A', 'start B', 'resolve B [Bo]', 'reject A "Offline"'],
            eventIndex: 3,
          },
          note: 'Return the final display state: ready with ["Bo"].',
        },
      ],
    },
    reasoning:
      'Only the pending owner can change the display. Ending ownership on a terminal event makes duplicate results harmless. The display state is separate: ready with zero items differs from unresolved loading.',
    trace:
      'A starts, B starts, B resolves to [Bo], A rejects. B gives ready [Bo] and removes pending ownership. A cannot change it. Even a later B cancellation is ignored because B already ended.',
    alternative:
      'A reducer returning a new state per event makes transitions explicit; a loop with local state is shorter for a final-only trace. Both take O(n) event processing plus copying accepted item arrays, and storage for the accepted items. A mounted flag cannot separate A from B.',
    counterexample:
      'Keeping B as owner after B resolves lets a duplicate rejection erase valid results. Using items.length to infer loading mislabels a successful empty response.',
    transfer:
      'Add pagination while a query changes. Decide whether ownership belongs to one page, one query, or both; define whether previous pages remain visible. This extension is self-reviewed.',
  },
  'preview-slot-results': {
    traceSteps: {
      code: [
        "type PreviewEvent = {kind: 'select'; slot: string; token: string} | {kind: 'loaded'; slot: string; token: string; url: string} | {kind: 'remove'; slot: string}",
        "type PreviewSlot = {slot: string; status: 'loading' | 'ready'; url: string | null}",
        'function previewSlots(events: PreviewEvent[]): PreviewSlot[] {',
        "  const slots = new Map<string, {status: PreviewSlot['status']; url: string | null; pending: string | null}>()",
        '  for (const event of events) {',
        "    if (event.kind === 'select') slots.set(event.slot, {status: 'loading', url: null, pending: event.token})",
        "    else if (event.kind === 'remove') slots.delete(event.slot)",
        "    else if (slots.get(event.slot)?.pending === event.token) slots.set(event.slot, {status: 'ready', url: event.url, pending: null})",
        '  }',
        '  return [...slots].map(([slot, {status, url}]) => ({slot, status, url}))',
        '}',
      ],
      input:
        'events = [{kind: "select", slot: "cover", token: "A"}, {kind: "select", slot: "detail", token: "B"}, {kind: "remove", slot: "cover"}, {kind: "loaded", slot: "cover", token: "A", url: "late.png"}, {kind: "select", slot: "cover", token: "C"}, {kind: "loaded", slot: "cover", token: "C", url: "c.png"}]',
      steps: [
        {
          line: 3,
          vars: { slots: 0 },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'none']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
          },
          note: 'Each slot keeps its own pending token. A Map remembers the order slots were inserted.',
        },
        {
          line: 5,
          vars: { slot: 'cover', token: 'A' },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'cover: loading (A)']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
            eventIndex: 0,
          },
          note: 'cover starts loading and waits for token A.',
        },
        {
          line: 5,
          vars: { slot: 'detail', token: 'B' },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'cover: loading (A), detail: loading (B)']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
            eventIndex: 1,
          },
          note: 'detail gets its own token. One global “current request” would wrongly make A stale here.',
        },
        {
          line: 6,
          vars: { slot: 'cover' },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'detail: loading (B)']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
            eventIndex: 2,
          },
          note: 'Removing cover deletes its entry, including the pending token A.',
        },
        {
          line: 7,
          vars: { slot: 'cover', token: 'A', pending: null },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'detail: loading (B)']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
            eventIndex: 3,
          },
          note: 'The late A load finds no cover slot, so it has no effect. It must not recreate cover.',
        },
        {
          line: 5,
          vars: { slot: 'cover', token: 'C' },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'detail: loading (B), cover: loading (C)']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
            eventIndex: 4,
          },
          note: 'cover was removed, so selecting it again inserts it at the end, after detail.',
        },
        {
          line: 7,
          vars: { slot: 'cover', token: 'C', pending: 'C' },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'detail: loading (B), cover: ready c.png']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
            eventIndex: 5,
          },
          note: 'C matches the pending token, so cover becomes ready. set on an existing key keeps its position, and the load ends.',
        },
        {
          line: 9,
          vars: { result: '[{"slot":"detail","status":"loading","url":null},{"slot":"cover","status":"ready","url":"c.png"}]' },
          structure: {
            kind: 'state',
            entries: [['slots (in order)', 'detail: loading (B), cover: ready c.png']],
            events: ['select cover A', 'select detail B', 'remove cover', 'loaded cover A', 'select cover C', 'loaded cover C'],
            eventIndex: 5,
          },
          note: 'Return only the public fields, in Map order. detail is still waiting for B.',
        },
      ],
    },
    reasoning:
      'Ownership and completion are scoped to each slot. Insertion order is a separate requirement: replacing a slot changes its contents, while deleting and reinserting changes its position.',
    trace:
      'Select cover:A, detail:B, remove cover, select cover:C, load cover:A. Output order is detail then cover. A no longer owns cover, so cover remains loading for C while detail still waits for B.',
    alternative:
      'An insertion-ordered Map supports expected constant-time slot lookup, replacement, and deletion. An array with findIndex is straightforward for small inputs but can take O(nk) across n events and k slots. Both need O(k) slot state and output; copied text storage is additional.',
    counterexample:
      'One global token rejects a valid cover:A completion as soon as detail:B starts. A plain object can mishandle a slot named __proto__; sorting slots changes the required order.',
    transfer:
      'Add a failed load with a Retry control for one slot. Define whether retry retains its old URL and how removal affects a retry. Review keyboard and browser behavior separately.',
  },
  'refresh-report-state': {
    reasoning:
      'The accepted report outlives a refresh attempt. Pending ownership controls only who may replace it or report an error; start, failure, and cancellation preserve that report.',
    trace:
      'Initial yesterday; A refreshes, fails Offline, B refreshes, then A resolves late. B is pending, yesterday stays visible, and the old error is cleared. Only a B result can replace the report.',
    alternative:
      'Clearing old data simplifies an initial-loading view but violates this refresh contract. Explicit value, pending, and error fields allow old data with a loading indicator or error. A loop takes O(n) time and constant state apart from retained text.',
    counterexample:
      'Resetting value to null on failure loses a valid previous report. Using value || fallback also loses an accepted empty string. Keeping the settled owner permits duplicate results to change the display.',
    transfer:
      'Change accounts while refreshing. Decide whether old-account data must be cleared even though same-account refresh preserves it. This altered policy needs separate checks.',
  },
}

export const asyncGuides: Record<string, ReflectionGuide> = {
  'search-request-state': {
    plan: ['Separate display state from pending request ownership.', 'List start, result, failure, cancellation, and duplicate behavior.'],
    explanation: [
      'Trace an obsolete failure after a newer success.',
      'Explain ready empty results and why terminal events remove ownership.',
    ],
    example:
      'I keep a pending ID and a separate display state. Only the pending request can settle. I clear ownership after settlement, so late or duplicate events cannot change the display.',
  },
  'preview-slot-results': {
    plan: ['Track ownership separately for each slot.', 'Specify replacement and removal ordering.'],
    explanation: [
      'Trace removal and reselection while another slot loads.',
      'Explain token matching, duplicate results, and output order.',
    ],
    example:
      'Each slot keeps its own pending token. Replacing its selection keeps its position; removing it discards ownership. A later selection is appended. A loaded event must match both its slot and pending token.',
  },
  'refresh-report-state': {
    plan: ['Keep accepted data separate from refresh state.', 'List what preserves data and what replaces it.'],
    explanation: ['Trace failure, retry, and a late old result.', 'Distinguish cancellation from failure and null from an empty string.'],
    example:
      'Refresh keeps the accepted report visible and clears the prior error. Only its pending owner may settle. Success replaces the report; failure or cancellation retains it. All terminal events release ownership.',
  },
}
