// Stage and track text lives in src/path-text.ts, which loads after the trail's structure.
type PathStage = { title: string; repIds: readonly string[] }

export const firstPath = {
  id: 'typescript',
  title: 'Foundations',
  stages: [
    {
      title: 'Learn the language',
      repIds: ['declare-variables', 'basic-types', 'create-objects', 'make-arrays', 'write-functions'],
    },
    {
      title: 'Make decisions and repeat',
      repIds: ['pass-or-retry', 'use-conditions', 'loop-with-for', 'loop-while', 'string-basics', 'object-update'],
    },
    {
      title: 'Work through arrays',
      repIds: ['sum-positive-numbers', 'count-even-numbers', 'count-above-threshold', 'first-long-word'],
    },
    {
      title: 'Count and remember',
      repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character'],
    },
    {
      title: 'Handle text and gaps',
      repIds: ['count-words', 'missing-number'],
    },
    {
      title: 'Match openings and closings',
      repIds: ['valid-parentheses', 'balanced-brackets'],
    },
    {
      title: 'Calculate shipping on your own',
      repIds: ['shipping-cost-tiers'],
    },
    {
      title: 'Recall in a new setting',
      repIds: ['count-long-words', 'first-repeated-number', 'remove-adjacent-pairs', 'countdown-labels'],
    },
    {
      title: 'Read and repair code',
      repIds: ['repair-visible-count', 'read-unique-names', 'transform-active-labels', 'verify-generated-code'],
    },
    {
      title: 'TypeScript boundaries',
      repIds: ['guard-contact-input', 'exhaustive-delivery-label', 'generic-prefix-copy', 'typed-record-lookup', 'sensor-import-report'],
    },
    {
      title: 'How JavaScript runs',
      repIds: ['function-returns-function', 'closure-counters', 'reference-groups', 'promise-outcomes', 'event-loop-order'],
    },
  ] satisfies readonly PathStage[],
} as const

export const paths = [
  firstPath,
  {
    id: 'algorithms-data-structures',
    title: 'Problem solving',
    stages: [
      {
        title: 'Use collections',
        repIds: ['ds-array-operations', 'ds-set-operations', 'ds-map-operations'],
      },
      {
        title: 'Apply arrays and text',
        repIds: [
          'sum-positive-numbers',
          'count-even-numbers',
          'count-above-threshold',
          'count-words',
          'first-long-word',
          'count-long-words',
        ],
      },
      {
        title: 'Apply maps and sets',
        repIds: ['has-duplicate', 'most-frequent-number', 'first-unique-character', 'first-repeated-number'],
      },
      {
        title: 'Build and compare text',
        repIds: ['text-run-length', 'text-anagram-groups', 'text-normalized-palindrome', 'text-wrap-column'],
      },
      {
        title: 'Stack and queue operations',
        repIds: ['ds-stack-operations', 'ds-queue-operations', 'ticket-service-times', 'parcel-loading-turns'],
      },
      {
        title: 'Apply stacks',
        repIds: ['valid-parentheses', 'balanced-brackets', 'remove-adjacent-pairs', 'simplify-file-path'],
      },
      {
        title: 'Search sorted data and scan windows',
        repIds: [
          'algo-sorted-pair',
          'sorted-offset-squares',
          'reading-run-summary',
          'algo-window-sum',
          'count-unique-windows',
          'shortest-run-reaching-target',
          'algo-binary-search',
          'first-insertion-point',
          'smallest-daily-capacity',
        ],
      },
      {
        title: 'Sort and merge',
        repIds: ['algo-insertion-sort', 'algo-merge-sorted', 'sort-score-records', 'kth-smallest-copy', 'closest-value-gap'],
      },
      {
        title: 'Recursion',
        repIds: ['algo-recursive-sum', 'flatten-nested-numbers', 'count-object-leaves'],
      },
      {
        title: 'Trees and graphs',
        repIds: [
          'algo-tree-depth',
          'tree-depth-sum',
          'tree-value-depth',
          'tree-leaf-count',
          'tree-value-path',
          'algo-graph-reachable',
          'graph-reachable-count',
          'graph-incoming-counts',
          'graph-shortest-hops',
          'graph-connected-groups',
        ],
      },
      {
        title: 'Binary search trees',
        repIds: [
          'bst-search-path',
          'bst-insert-value',
          'bst-latest-at-or-before',
          'bst-range-values',
          'bst-check-order',
          'bst-nearest-slot',
        ],
      },
      {
        title: 'Grids',
        repIds: ['grid-open-neighbours', 'grid-count-rooms', 'grid-fewest-steps'],
      },
      {
        title: 'Solve a two-part puzzle',
        repIds: ['puzzle-parse-part-one', 'puzzle-adapt-part-two'],
      },
      {
        title: 'Ranges and linked structures',
        repIds: [
          'algo-prefix-sums',
          'algo-merge-intervals',
          'algo-linked-list-reverse',
          'list-insert-sorted',
          'list-remove-value',
          'algo-min-heap',
        ],
      },
      {
        title: 'Rebuild linked lists',
        repIds: ['list-merge-sorted', 'list-split-at-first', 'list-rotate-route'],
      },
      {
        title: 'Heaps and priority queues',
        repIds: ['heap-merge-log-streams', 'heap-rooms-needed', 'heap-kth-largest-stream'],
      },
      {
        title: 'Backtracking and dynamic programming',
        repIds: ['algo-subsets', 'algo-climb-stairs', 'algo-coin-change'],
      },
      {
        title: 'Fill tables of smaller answers',
        repIds: ['dp-garage-paths', 'dp-stall-revenue', 'dp-tag-edits'],
      },
      {
        title: 'Harder patterns',
        repIds: ['next-warmer-day', 'top-k-frequent-tags', 'course-order', 'longest-shared-sequence'],
      },
      {
        title: 'Interview round',
        repIds: ['interview-backend'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'pattern-recognition',
    title: 'Pattern Recognition',
    stages: [
      {
        title: 'Name the pattern first',
        repIds: ['algo-sorted-pair'],
      },
      {
        title: 'Decide which tool fits',
        repIds: [
          'has-duplicate',
          'valid-parentheses',
          'algo-window-sum',
          'most-frequent-number',
          'simplify-file-path',
          'count-unique-windows',
        ],
      },
      {
        title: 'Find your way across a floor plan',
        repIds: ['grid-open-neighbours', 'grid-count-rooms', 'grid-fewest-steps'],
      },
      {
        title: 'Solve a two-part puzzle',
        repIds: ['puzzle-parse-part-one', 'puzzle-adapt-part-two'],
      },
      {
        title: 'Choose under pressure',
        repIds: ['next-warmer-day', 'top-k-frequent-tags', 'algo-prefix-sums', 'course-order', 'longest-shared-sequence', 'algo-subsets'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    stages: [
      {
        title: 'Show one state',
        repIds: ['frontend-screen-message'],
      },
      {
        title: 'Show empty or not',
        repIds: ['frontend-list-summary'],
      },
      {
        title: 'Model valid states',
        repIds: ['task-state-label', 'saved-record-status', 'catalog-request-summary'],
      },
      {
        title: 'Decide what the screen shows',
        repIds: ['frontend-visible-items', 'frontend-view-state'],
      },
      {
        title: 'Build interface logic',
        repIds: [
          'frontend-sort-table',
          'frontend-form-errors',
          'frontend-pagination-controls',
          'group-items-by-heading',
          'filter-chip-summary',
        ],
      },
      {
        title: 'Render with React',
        repIds: ['react-channel-counter', 'react-row-keys', 'react-stale-request'],
      },
      {
        title: 'Build accessible interactions',
        repIds: [
          'dom-disclosure',
          'dom-form-fields',
          'dom-form-errors',
          'dom-form-submit',
          'dom-accessible-form',
          'dom-live-search',
          'dom-tabs',
          'dom-accordion',
        ],
      },
      {
        title: 'Build composite widgets',
        repIds: ['dom-reorder-list', 'dom-modal-dialog', 'dom-combobox'],
      },
      {
        title: 'Build one connected browser feature',
        repIds: [
          'connected-note-state',
          'connected-note-render',
          'connected-note-input',
          'connected-note-save',
          'connected-note-recover',
          'connected-note-test',
          'connected-note-independent',
        ],
      },
      {
        title: 'Keep async updates current',
        repIds: [
          'debounce-schedule',
          'autosave-debounce',
          'leading-throttle',
          'scroll-report-throttle',
          'latest-request',
          'search-request-state',
          'preview-slot-results',
          'refresh-report-state',
        ],
      },
      {
        title: 'Keep live connections correct',
        repIds: ['websocket-gate', 'choose-live-transport', 'pubsub-trace', 'subscription-cleanup'],
      },
      {
        title: 'Apply it to real code',
        repIds: ['debug-cart-total', 'debug-stale-handlers', 'frontend-directory'],
      },
      {
        title: 'Interview round',
        repIds: ['interview-frontend'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'sql',
    title: 'SQL',
    stages: [
      {
        title: 'Read a table',
        repIds: [
          'sql-select-columns',
          'sql-filter-sort',
          'sql-distinct-cities',
          'sql-line-totals',
          'sql-recent-open-tickets',
          'sql-catalog-page',
        ],
      },
      {
        title: 'Filter precisely',
        repIds: ['sql-filter-groups', 'sql-price-band', 'sql-code-pattern', 'sql-members-to-text', 'sql-search-articles'],
      },
      {
        title: 'Summarize',
        repIds: ['sql-count-by-status', 'sql-ratings-summary', 'sql-count-visitors', 'sql-busy-days', 'sql-month-spenders'],
      },
      {
        title: 'Combine tables',
        repIds: ['sql-join-orders', 'sql-customers-without-orders', 'sql-team-totals', 'sql-june-returns', 'sql-authors-latest'],
      },
      {
        title: 'Ask in steps',
        repIds: ['sql-above-average', 'sql-category-average', 'sql-students-without-work', 'sql-free-rooms', 'sql-strong-months'],
      },
      {
        title: 'Design a schema',
        repIds: ['sql-create-products', 'sql-default-values', 'sql-strict-types', 'sql-create-memberships', 'sql-create-shifts'],
      },
      {
        title: 'Change data safely',
        repIds: [
          'sql-update-scope',
          'sql-delete-scope',
          'sql-upsert-stock',
          'sqlite-customer-totals',
          'sqlite-stock-transfer',
          'sqlite-restock-upsert',
          'sql-archive-orders',
        ],
      },
      {
        title: 'Rank and run totals',
        repIds: ['sql-rank-scores', 'sql-competition-rank', 'sql-day-over-day', 'sql-running-balance', 'sql-top-two-per-region'],
      },
      {
        title: 'Make it fast',
        repIds: ['sql-index-lookup', 'sql-index-sort', 'sql-covering-index', 'sql-composite-index', 'sql-index-join'],
      },
      {
        title: 'Evolve a schema',
        repIds: ['sql-add-column', 'sql-rename-column', 'sql-split-name', 'sql-rebuild-table', 'sql-migrate-status-codes'],
      },
      {
        title: 'Bring it together',
        repIds: ['sql-capstone-report', 'sql-interview-repeat-customers'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'backend',
    title: 'Backend',
    stages: [
      {
        title: 'What a request is',
        repIds: ['backend-split-target', 'backend-decode-query', 'backend-request-line', 'backend-header-value', 'backend-read-json-body'],
      },
      {
        title: 'Check one value',
        repIds: ['backend-check-quantity'],
      },
      {
        title: 'Route a request',
        repIds: [
          'backend-match-route',
          'backend-route-request',
          'backend-normalize-path',
          'backend-build-path',
          'backend-route-specificity',
        ],
      },
      {
        title: 'Handle untrusted input',
        repIds: ['backend-validate-user', 'validate-stock-adjustment', 'parse-delivery-window'],
      },
      {
        title: 'Validate a whole batch',
        repIds: ['validate-import-batch'],
      },
      {
        title: 'Return predictable results',
        repIds: ['backend-page-results', 'backend-ticket-handler'],
      },
      {
        title: 'Shape requests and responses',
        repIds: ['backend-query-filters', 'backend-error-response', 'parse-sort-param', 'page-response-envelope'],
      },
      {
        title: 'Query and change local data',
        repIds: ['sqlite-stock-transfer', 'sqlite-customer-totals', 'sqlite-restock-upsert'],
      },
      {
        title: 'Handle concurrent writes',
        repIds: [
          'backend-versioned-update',
          'backend-if-match',
          'backend-lost-updates',
          'backend-compare-and-set',
          'backend-replay-writes',
        ],
      },
      {
        title: 'Stay reliable',
        repIds: [
          'cache-freshness',
          'retry-backoff',
          'idempotent-ledger',
          'payment-resubmit',
          'quote-cache-retry',
          'optimistic-balance',
          'shared-resource',
          'room-leases',
          'singleton-owner',
          'injected-clock',
          'backend-rate-limit',
        ],
      },
      {
        title: 'Run background jobs',
        repIds: [
          'backend-job-failure',
          'backend-claim-job',
          'backend-dedupe-deliveries',
          'backend-outbox-relay',
          'backend-queue-simulation',
        ],
      },
      {
        title: 'Limit request rates',
        repIds: [
          'backend-token-bucket',
          'backend-sliding-log',
          'backend-limit-response',
          'backend-sliding-counter',
          'backend-limit-callers',
        ],
      },
      {
        title: 'Evolve an API',
        repIds: [
          'backend-choose-version',
          'backend-classify-change',
          'backend-deprecation-headers',
          'backend-webhook-deliveries',
          'backend-downgrade-response',
        ],
      },
      {
        title: 'Read and improve code',
        repIds: ['read-batch-labels', 'refactor-stock-summary'],
      },
      {
        title: 'Review suggested code',
        repIds: ['ai-empty-input-suggestion', 'ai-invented-api', 'ai-expose-wrong-median'],
      },
      {
        title: 'Debug in fresh contexts',
        repIds: ['debug-date-range-filter', 'debug-invoice-rounding', 'debug-reducer-mutation'],
      },
      {
        title: 'Find bugs with your own cases',
        repIds: ['expose-page-bugs', 'repair-range-label', 'expose-overlap-bugs'],
      },
      {
        title: 'Maintain unfamiliar code',
        repIds: [
          'read-shipping-quote',
          'reproduce-quote-bug',
          'fix-quote-bug',
          'adapt-quote-rule',
          'maintain-library-fines',
          'maintain-room-booking',
        ],
      },
      {
        title: 'Interview round',
        repIds: ['interview-backend'],
      },
    ] satisfies readonly PathStage[],
  },
  {
    id: 'devops',
    title: 'DevOps',
    stages: [
      {
        title: 'Read CI output',
        repIds: ['devops-exit-meaning', 'devops-first-error', 'devops-step-outcomes', 'devops-error-annotations', 'devops-failing-step'],
      },
      {
        title: 'Check configuration',
        repIds: ['devops-read-port', 'devops-validate-env', 'devops-mask-secrets', 'devops-parse-dotenv', 'devops-config-drift'],
      },
      {
        title: 'Work with versions',
        repIds: [
          'devops-compare-versions',
          'devops-next-version',
          'devops-sort-versions',
          'devops-lockfile-diff',
          'devops-satisfies-range',
        ],
      },
      {
        title: 'Run pipelines',
        repIds: ['devops-job-waves', 'devops-cache-key', 'devops-cache-restore', 'devops-pipeline-duration', 'devops-skip-unchanged'],
      },
      {
        title: 'Build container images',
        repIds: ['devops-layer-rebuild', 'devops-image-tags', 'devops-dockerignore', 'devops-tag-cleanup', 'devops-multistage-rebuild'],
      },
      {
        title: 'Deploy safely',
        repIds: [
          'devops-rolling-batches',
          'devops-percent-rollout',
          'devops-blue-green',
          'devops-canary-schedule',
          'devops-canary-verdict',
        ],
      },
      {
        title: 'Keep instances healthy',
        repIds: [
          'devops-health-endpoints',
          'devops-probe-thresholds',
          'devops-restart-backoff',
          'devops-liveness-restart',
          'devops-graceful-drain',
        ],
      },
      {
        title: 'Schedule jobs',
        repIds: ['devops-cron-field', 'devops-cron-matches', 'devops-local-to-utc', 'devops-cron-next-utc', 'devops-cron-next-zone'],
      },
      {
        title: 'Watch a service',
        repIds: ['devops-percentile', 'devops-error-budget', 'devops-route-latency', 'devops-burn-alert', 'devops-alert-hysteresis'],
      },
    ] satisfies readonly PathStage[],
  },
] as const

/** Paths that were merged into the current Foundations and tracks. Saved goals that name one still need a home. */
export const retiredPathIds: Record<string, (typeof paths)[number]['id']> = {
  'typescript-browser': 'frontend',
  'practical-concepts': 'frontend',
  'real-world': 'backend',
  'ai-era': 'typescript',
  interviews: 'algorithms-data-structures',
}

export function migratePathId(id: string): string {
  return Object.hasOwn(retiredPathIds, id) ? retiredPathIds[id] : id
}

export type PathId = (typeof paths)[number]['id']

/** Shown on All tracks; the text lives in src/path-introductions.ts, which loads with that page. */
export type PathIntroduction = {
  title: string
  body: string
  example: string
  explanation: string
  next: string
}
