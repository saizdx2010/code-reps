// Difficulty is kept beside the rep catalog rather than inside each rep, so content branches never edit this map.
// Every rep in the registry needs an entry; tests/rep-levels.test.mjs names any missing or unknown IDs.

export type RepLevel = 1 | 2 | 3
export type RepLevelLabel = 'Beginner' | 'Intermediate' | 'Advanced'

export const repLevelLabels: Record<RepLevel, RepLevelLabel> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }

export const repLevels: Record<string, RepLevel> = {
  // Beginner: language basics, control flow, and introductory collection operations.
  'declare-variables': 1,
  'basic-types': 1,
  'create-objects': 1,
  'make-arrays': 1,
  'write-functions': 1,
  'use-conditions': 1,
  'loop-with-for': 1,
  'loop-while': 1,
  'string-basics': 1,
  'object-update': 1,
  'ds-array-operations': 1,
  'ds-set-operations': 1,
  'ds-map-operations': 1,
  'ds-stack-operations': 1,
  'ds-queue-operations': 1,
  'sum-positive-numbers': 1,
  'count-even-numbers': 1,
  'count-above-threshold': 1,
  'count-words': 1,
  'first-long-word': 1,
  'count-long-words': 1,
  'has-duplicate': 1,
  'first-repeated-number': 1,
  'missing-number': 1,
  'repair-visible-count': 1,
  'read-unique-names': 1,
  'choose-live-transport': 1,
  'sum-matching-prices': 1,
  'count-open-tickets': 1,
  'count-statuses': 1,

  // Intermediate: typical journeys, frontend and backend reps, techniques, validation, and async policies.
  'closure-counters': 2,
  'reference-groups': 2,
  'promise-outcomes': 2,
  'singleton-owner': 2,
  'pubsub-trace': 2,
  'injected-clock': 2,
  'leading-throttle': 2,
  'websocket-gate': 2,
  'shared-resource': 2,
  'cache-freshness': 2,
  'retry-backoff': 2,
  'idempotent-ledger': 2,
  'subscription-cleanup': 2,
  'room-leases': 2,
  'frontend-visible-items': 2,
  'frontend-view-state': 2,
  'frontend-sort-table': 2,
  'frontend-form-errors': 2,
  'frontend-pagination-controls': 2,
  'frontend-directory': 2,
  'backend-validate-user': 2,
  'backend-page-results': 2,
  'backend-query-filters': 2,
  'backend-rate-limit': 2,
  'backend-error-response': 2,
  'backend-ticket-handler': 2,
  'validate-stock-adjustment': 2,
  'parse-delivery-window': 2,
  'validate-page-query': 2,
  'most-frequent-number': 2,
  'first-unique-character': 2,
  'first-duplicate-label': 2,
  'first-label-ending': 2,
  'count-label-prefix': 2,
  'balanced-brackets': 2,
  'valid-parentheses': 2,
  'remove-adjacent-pairs': 2,
  'remaining-actions': 2,
  'cancel-adjacent-ids': 2,
  'transform-active-labels': 2,
  'derive-task-summary': 2,
  'task-state-label': 2,
  'saved-record-status': 2,
  'catalog-request-summary': 2,
  'verify-generated-code': 2,
  'debug-cart-total': 2,
  'debug-page-offset': 2,
  'read-batch-labels': 2,
  'refactor-stock-summary': 2,
  'algo-sorted-pair': 2,
  'algo-window-sum': 2,
  'algo-binary-search': 2,
  'algo-insertion-sort': 2,
  'algo-merge-sorted': 2,

  // Advanced: recursion, trees, graphs, batch validation, harder async state, projects, and interviews.
  'event-loop-order': 3,
  'debounce-schedule': 3,
  'latest-request': 3,
  'search-request-state': 3,
  'preview-slot-results': 3,
  'refresh-report-state': 3,
  'optimistic-balance': 3,
  'validate-import-batch': 3,
  'algo-recursive-sum': 3,
  'algo-tree-depth': 3,
  'algo-graph-reachable': 3,
  'interview-frontend': 3,
  'interview-backend': 3,
  'project-team-directory': 3,
  'project-ticket-api': 3,
  // Added with recall chains and interview-level patterns.
  'shipping-cost-tiers': 1,
  'countdown-labels': 1,
  'group-items-by-heading': 2,
  'filter-chip-summary': 2,
  'parse-sort-param': 2,
  'page-response-envelope': 2,
  'ticket-service-times': 2,
  'parcel-loading-turns': 2,
  'sort-score-records': 2,
  'kth-smallest-copy': 2,
  'simplify-file-path': 2,
  'algo-prefix-sums': 2,
  'algo-merge-intervals': 2,
  'algo-climb-stairs': 2,
  'flatten-nested-numbers': 3,
  'count-object-leaves': 3,
  'tree-depth-sum': 3,
  'tree-value-path': 3,
  'graph-shortest-hops': 3,
  'graph-connected-groups': 3,
  'algo-linked-list-reverse': 3,
  'algo-min-heap': 3,
  'algo-subsets': 3,
  'algo-coin-change': 3,
  // Accessible DOM interactions.
  'dom-disclosure': 2,
  'dom-accessible-form': 2,
  'dom-live-search': 2,
  'dom-tabs': 3,
}

/** The level for a rep, or undefined when the rep has not been placed yet. */
export function repLevel(id: string): RepLevel | undefined {
  return Object.hasOwn(repLevels, id) ? repLevels[id] : undefined
}

/** The visible label for a rep, or undefined when it has no level yet. */
export function repLevelLabel(id: string): RepLevelLabel | undefined {
  const level = repLevel(id)
  return level && repLevelLabels[level]
}

/** One label when a stage's reps share a level, otherwise the lowest to highest label. */
export function stageLevelRange(repIds: readonly string[]): string | undefined {
  const levels = repIds.map(repLevel).filter((level): level is RepLevel => level !== undefined)
  if (!levels.length) return undefined
  const low = Math.min(...levels) as RepLevel
  const high = Math.max(...levels) as RepLevel
  return low === high ? repLevelLabels[low] : `${repLevelLabels[low]}–${repLevelLabels[high]}`
}
