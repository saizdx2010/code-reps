import { byCompletedAt, DAY_MS } from './dates.ts'
import { isDateString } from './guards.ts'

export type LearnerStart = 'new' | 'returning'

type LearningRecord = {
  repId: string
  completedAt: string
  hintCount: number
}

type Journey = { id: string; title: string; guided: string; independent: string; recall: string; practice?: string[]; delayDays: number }

export const journeys: Journey[] = [
  {
    id: 'arrays',
    title: 'Work through arrays',
    guided: 'sum-positive-numbers',
    independent: 'count-even-numbers',
    recall: 'count-above-threshold',
    practice: ['sum-in-range', 'adjacent-rise-count'],
    delayDays: 3,
  },
  {
    id: 'text',
    title: 'Work through words',
    guided: 'count-words',
    independent: 'first-long-word',
    recall: 'count-long-words',
    practice: ['last-matching-word', 'word-length-span'],
    delayDays: 3,
  },
  {
    id: 'lookup',
    title: 'Count and remember',
    guided: 'has-duplicate',
    independent: 'most-frequent-number',
    recall: 'first-repeated-number',
    practice: ['shared-number-count', 'singleton-number-list'],
    delayDays: 3,
  },
  {
    id: 'stacks',
    title: 'Match what came before',
    guided: 'valid-parentheses',
    independent: 'balanced-brackets',
    recall: 'simplify-file-path',
    practice: ['undo-word-actions', 'erase-text-markers'],
    delayDays: 3,
  },
  {
    id: 'request-ownership',
    title: 'Keep asynchronous results current',
    guided: 'latest-request',
    independent: 'search-request-state',
    recall: 'preview-slot-results',
    delayDays: 3,
  },
  {
    id: 'async',
    title: 'Await, coordinate, and cancel local work',
    guided: 'await-local-records',
    independent: 'settle-local-panels',
    recall: 'cancel-local-export',
    delayDays: 3,
  },
  {
    id: 'resource-ownership',
    title: 'Own and clean up shared resources',
    guided: 'shared-resource',
    independent: 'subscription-cleanup',
    recall: 'room-leases',
    delayDays: 3,
  },
  {
    id: 'validation',
    title: 'Validate data at a boundary',
    guided: 'backend-validate-user',
    independent: 'validate-stock-adjustment',
    recall: 'parse-delivery-window',
    delayDays: 3,
  },
  {
    id: 'typescript-boundaries',
    title: 'Narrow and reuse types',
    guided: 'guard-contact-input',
    independent: 'typed-record-lookup',
    recall: 'sensor-import-report',
    practice: ['exhaustive-delivery-label', 'generic-prefix-copy'],
    delayDays: 3,
  },
  {
    id: 'state-modeling',
    title: 'Model valid browser states',
    guided: 'task-state-label',
    independent: 'saved-record-status',
    recall: 'catalog-request-summary',
    delayDays: 3,
  },
  {
    id: 'control-flow',
    title: 'Repeat work and choose by condition',
    guided: 'loop-with-for',
    independent: 'shipping-cost-tiers',
    recall: 'countdown-labels',
    delayDays: 3,
  },
  {
    id: 'interface-logic',
    title: 'Derive what the interface shows',
    guided: 'frontend-sort-table',
    independent: 'group-items-by-heading',
    recall: 'filter-chip-summary',
    delayDays: 3,
  },
  {
    id: 'request-response',
    title: 'Read requests and shape responses',
    guided: 'backend-query-filters',
    independent: 'parse-sort-param',
    recall: 'page-response-envelope',
    delayDays: 3,
  },
  {
    id: 'queues',
    title: 'Apply first-in-first-out order',
    guided: 'ds-queue-operations',
    independent: 'ticket-service-times',
    recall: 'parcel-loading-turns',
    delayDays: 3,
  },
  {
    id: 'two-pointers',
    title: 'Coordinate positions in sorted data',
    guided: 'algo-sorted-pair',
    independent: 'sorted-offset-squares',
    recall: 'reading-run-summary',
    delayDays: 3,
  },
  {
    id: 'sorting',
    title: 'Order and rank values',
    guided: 'algo-insertion-sort',
    independent: 'sort-score-records',
    recall: 'closest-value-gap',
    delayDays: 3,
  },
  {
    id: 'windows',
    title: 'Slide a window across a sequence',
    guided: 'algo-window-sum',
    independent: 'count-unique-windows',
    recall: 'shortest-run-reaching-target',
    delayDays: 3,
  },
  {
    id: 'binary-search',
    title: 'Search ordered values and answers',
    guided: 'algo-binary-search',
    independent: 'first-insertion-point',
    recall: 'smallest-daily-capacity',
    delayDays: 3,
  },
  {
    id: 'recursion',
    title: 'Work through nested structures',
    guided: 'algo-recursive-sum',
    independent: 'flatten-nested-numbers',
    recall: 'count-object-leaves',
    delayDays: 3,
  },
  {
    id: 'trees',
    title: 'Explore tree routes and levels',
    guided: 'algo-tree-depth',
    independent: 'tree-depth-sum',
    recall: 'tree-value-path',
    practice: ['tree-value-depth', 'tree-leaf-count'],
    delayDays: 3,
  },
  {
    id: 'binary-search-trees',
    title: 'Search ordered trees',
    guided: 'bst-search-path',
    independent: 'bst-latest-at-or-before',
    recall: 'bst-check-order',
    practice: ['bst-insert-value', 'bst-range-values'],
    delayDays: 3,
  },
  {
    id: 'linked-lists',
    title: 'Rebuild linked lists',
    guided: 'list-merge-sorted',
    independent: 'list-split-at-first',
    recall: 'list-rotate-route',
    practice: ['list-insert-sorted', 'list-remove-value'],
    delayDays: 3,
  },
  {
    id: 'heaps',
    title: 'Keep the smallest next',
    guided: 'algo-min-heap',
    independent: 'heap-merge-log-streams',
    recall: 'heap-rooms-needed',
    practice: ['heap-kth-largest-stream', 'top-k-frequent-tags'],
    delayDays: 3,
  },
  {
    id: 'dynamic-programming',
    title: 'Build answers from smaller answers',
    guided: 'dp-garage-paths',
    independent: 'dp-stall-revenue',
    recall: 'dp-tag-edits',
    practice: ['longest-shared-sequence', 'algo-climb-stairs'],
    delayDays: 3,
  },
  {
    id: 'string-building',
    title: 'Build and compare text',
    guided: 'text-run-length',
    independent: 'text-anagram-groups',
    recall: 'text-normalized-palindrome',
    practice: ['text-wrap-column', 'first-unique-character'],
    delayDays: 3,
  },
  {
    id: 'timing-policies',
    title: 'Time updates deliberately',
    guided: 'debounce-schedule',
    independent: 'autosave-debounce',
    recall: 'scroll-report-throttle',
    delayDays: 3,
  },
  {
    id: 'reliable-requests',
    title: 'Repeat requests safely',
    guided: 'idempotent-ledger',
    independent: 'payment-resubmit',
    recall: 'quote-cache-retry',
    practice: ['cache-freshness', 'retry-backoff'],
    delayDays: 3,
  },
  {
    id: 'fresh-debugging',
    title: 'Debug unfamiliar code',
    guided: 'debug-date-range-filter',
    independent: 'debug-invoice-rounding',
    recall: 'debug-reducer-mutation',
    practice: ['debug-stale-handlers', 'debug-cart-total'],
    delayDays: 3,
  },
  {
    id: 'dom-widgets',
    title: 'Build composite widgets',
    guided: 'dom-reorder-list',
    independent: 'dom-modal-dialog',
    recall: 'dom-combobox',
    delayDays: 3,
  },
  {
    id: 'suggested-code',
    title: 'Review suggested code',
    guided: 'ai-empty-input-suggestion',
    independent: 'ai-invented-api',
    recall: 'ai-expose-wrong-median',
    delayDays: 3,
  },
  {
    id: 'grids',
    title: 'Move through a grid',
    guided: 'grid-open-neighbours',
    independent: 'grid-count-rooms',
    recall: 'grid-fewest-steps',
    delayDays: 3,
  },
  {
    id: 'graphs',
    title: 'Explore graph connections',
    guided: 'algo-graph-reachable',
    independent: 'graph-shortest-hops',
    recall: 'graph-connected-groups',
    practice: ['graph-reachable-count', 'graph-incoming-counts'],
    delayDays: 3,
  },
  {
    id: 'find-the-bug',
    title: 'Find and fix faulty code',
    guided: 'expose-page-bugs',
    independent: 'repair-range-label',
    recall: 'expose-overlap-bugs',
    delayDays: 3,
  },
  {
    id: 'maintenance',
    title: 'Maintain unfamiliar code',
    guided: 'fix-quote-bug',
    independent: 'maintain-library-fines',
    recall: 'maintain-room-booking',
    delayDays: 3,
  },
  {
    id: 'sql-reading',
    title: 'Read rows precisely',
    guided: 'sql-filter-sort',
    independent: 'sql-recent-open-tickets',
    recall: 'sql-catalog-page',
    practice: ['sql-distinct-cities', 'sql-line-totals'],
    delayDays: 3,
  },
  {
    id: 'sql-filtering',
    title: 'Filter precisely',
    guided: 'sql-filter-groups',
    independent: 'sql-members-to-text',
    recall: 'sql-search-articles',
    practice: ['sql-price-band', 'sql-code-pattern'],
    delayDays: 3,
  },
  {
    id: 'sql-summarizing',
    title: 'Summarize groups of rows',
    guided: 'sql-count-by-status',
    independent: 'sql-busy-days',
    recall: 'sql-month-spenders',
    practice: ['sql-ratings-summary', 'sql-count-visitors'],
    delayDays: 3,
  },
  {
    id: 'sql-joining',
    title: 'Combine tables',
    guided: 'sql-join-orders',
    independent: 'sql-june-returns',
    recall: 'sql-authors-latest',
    practice: ['sql-customers-without-orders', 'sql-team-totals'],
    delayDays: 3,
  },
  {
    id: 'sql-subqueries',
    title: 'Ask in steps',
    guided: 'sql-above-average',
    independent: 'sql-free-rooms',
    recall: 'sql-strong-months',
    practice: ['sql-category-average', 'sql-students-without-work'],
    delayDays: 3,
  },
  {
    id: 'sql-schema-design',
    title: 'Design a schema',
    guided: 'sql-create-products',
    independent: 'sql-create-memberships',
    recall: 'sql-create-shifts',
    practice: ['sql-default-values', 'sql-strict-types'],
    delayDays: 3,
  },
  {
    id: 'dom-interactions',
    title: 'Build accessible interactions',
    guided: 'dom-disclosure',
    independent: 'dom-live-search',
    recall: 'dom-accordion',
    delayDays: 3,
  },
]

export const arrayJourney = journeys[0]

type JourneyStage = 'learning' | 'practising' | 'independent' | 'retained'

const chronologicalRecords = (records: LearningRecord[]) => records.filter(record => isDateString(record.completedAt)).sort(byCompletedAt)

export function getJourney(journey: Journey, records: LearningRecord[], now = Date.now()) {
  return journeyFrom(journey, chronologicalRecords(records), now)
}

/** Journey evidence from records already filtered to valid dates and sorted oldest first. */
function journeyFrom(journey: Journey, chronological: LearningRecord[], now: number) {
  const guided = chronological.find(record => record.repId === journey.guided)
  const independent =
    guided &&
    chronological.find(
      record =>
        record.repId === journey.independent && record.hintCount === 0 && Date.parse(record.completedAt) >= Date.parse(guided.completedAt),
    )
  const recallAt = independent && Date.parse(independent.completedAt) + journey.delayDays * DAY_MS
  const retained =
    recallAt &&
    chronological.find(record => record.repId === journey.recall && record.hintCount === 0 && Date.parse(record.completedAt) >= recallAt)
  const stage: JourneyStage = retained ? 'retained' : independent ? 'independent' : guided ? 'practising' : 'learning'
  const nextRepId = !guided ? journey.guided : !independent ? journey.independent : !retained && now >= recallAt! ? journey.recall : null
  const practiced = chronological.filter(record => journey.practice?.includes(record.repId) && record.hintCount === 0)
  return {
    stage,
    guided,
    independent,
    practiced,
    retained,
    recallAt: recallAt ?? null,
    nextRepId,
    recallDue: Boolean(independent && !retained && now >= recallAt!),
  }
}

export const getArrayJourney = (records: LearningRecord[], now = Date.now()) => getJourney(arrayJourney, records, now)
export type JourneyProgress = ReturnType<typeof getJourney> & { journey: Journey }
// Sorted once for every journey, rather than once per journey.
export const getAllJourneys = (records: LearningRecord[], now = Date.now()): JourneyProgress[] => {
  const chronological = chronologicalRecords(records)
  return journeys.map(journey => ({ journey, ...journeyFrom(journey, chronological, now) }))
}

// One evidence ladder everywhere: Not started, Guided, Independent, Retained. Review due is shown as an overlay.
export const stageLabels: Record<JourneyStage, string> = {
  learning: 'Not started',
  practising: 'Guided',
  independent: 'Independent',
  retained: 'Retained',
}

// Related parts share a parser; they are practice, not independent or recall evidence.
export const puzzlePractice = ['puzzle-parse-part-one', 'puzzle-adapt-part-two'] as const
