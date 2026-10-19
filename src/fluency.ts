import { migratePathId, paths } from './path.ts'
import { skillIndex as skills } from './catalog-index.ts'
import { getAllJourneys } from './learning.ts'
import type { PortableRecord } from './portability.ts'
import { isDateString, isPlainObject } from './guards.ts'
import { byCompletedAt, DAY_MS } from './dates.ts'
import { formatDate } from './ui-copy.ts'
export type Judgment = 'not-yet' | 'with-help' | 'independent'
export type SelfReview = {
  understanding: Judgment
  approach: Judgment
  implementation: Judgment
  explanation: Judgment
  evidence: string
  updatedAt: string
}
export type LearningNote = {
  id: string
  title: string
  body: string
  skillId: string
  repId: string
  kind: 'note' | 'mistake' | 'question'
  updatedAt: string
}
export type InterviewRound = {
  id: string
  repId: string
  startedAt: string
  endedAt?: string
  minutes: number
  clarification: string
  debrief: string
}
export type FluencyState = {
  version: 1
  goal: { pathId: string; minutes: number; days: number[] }
  answers: Record<string, { choice: number; correct: boolean; answeredAt: string; response?: string }>
  reviews: Record<string, SelfReview>
  notes: LearningNote[]
  noteDraft?: LearningNote
  bookmarks: string[]
  diagnosticStartedAt?: string
  rounds: InterviewRound[]
}
export const fluencyKey = 'code-reps:fluency:v1'
export const emptyFluency = (): FluencyState => ({
  version: 1,
  goal: { pathId: 'typescript', minutes: 20, days: [1, 3, 5] },
  answers: {},
  reviews: {},
  notes: [],
  bookmarks: [],
  rounds: [],
})
const text = (x: unknown, max = 20_000): x is string => typeof x === 'string' && x.length <= max
const judgments = ['not-yet', 'with-help', 'independent']
const pathIds = new Set<string>(paths.map(path => path.id))
const skillIds = new Set(skills.map(s => s.id))
// Keep old answer contracts readable without counting them as current lesson evidence.
const retiredQuestions = new Map<string, { optionCount: number; answer: number; completion?: true; answerText?: string }>([
  ['frontend:derive', { optionCount: 3, answer: 0 }],
  ['event-loop:prediction-2', { optionCount: 3, answer: 0 }],
])
const questionIds = new Set(skills.flatMap(s => s.questions.map(q => `${s.id}:${q.id}`)))
export function parseFluency(raw: unknown): FluencyState {
  if (JSON.stringify(raw)?.length > 900_000)
    throw new Error('Learning data is full. Export your profile and remove older notes or rounds before adding more.')
  if (
    isPlainObject(raw) &&
    isPlainObject(raw.goal) &&
    typeof raw.goal.pathId === 'string' &&
    migratePathId(raw.goal.pathId) !== raw.goal.pathId
  )
    raw = { ...raw, goal: { ...raw.goal, pathId: migratePathId(raw.goal.pathId) } }
  if (
    !isPlainObject(raw) ||
    raw.version !== 1 ||
    !isPlainObject(raw.goal) ||
    !text(raw.goal.pathId, 60) ||
    !pathIds.has(raw.goal.pathId) ||
    !Number.isInteger(raw.goal.minutes) ||
    Number(raw.goal.minutes) < 5 ||
    Number(raw.goal.minutes) > 120 ||
    !Array.isArray(raw.goal.days) ||
    raw.goal.days.length > 7 ||
    raw.goal.days.some(d => !Number.isInteger(d) || d < 0 || d > 6) ||
    new Set(raw.goal.days).size !== raw.goal.days.length ||
    !isPlainObject(raw.answers) ||
    !isPlainObject(raw.reviews) ||
    !Array.isArray(raw.notes) ||
    raw.notes.length > 1000 ||
    !Array.isArray(raw.bookmarks) ||
    raw.bookmarks.some(id => !skillIds.has(id)) ||
    !Array.isArray(raw.rounds) ||
    raw.rounds.length > 1000 ||
    (raw.diagnosticStartedAt !== undefined && !isDateString(raw.diagnosticStartedAt, 100))
  )
    throw new Error('Learning data is invalid. Your saved copy has been kept.')
  for (const [id, answer] of Object.entries(raw.answers)) {
    const [sid, qid] = id.split(':')
    const question = skills.find(s => s.id === sid)?.questions.find(q => q.id === qid) ?? retiredQuestions.get(id)
    if (
      (!questionIds.has(id) && !retiredQuestions.has(id)) ||
      !isPlainObject(answer) ||
      (answer.response !== undefined && !text(answer.response, 300)) ||
      !Number.isInteger(answer.choice) ||
      Number(answer.choice) < 0 ||
      Number(answer.choice) >= question!.optionCount ||
      answer.correct !==
        (question!.completion
          ? typeof answer.response === 'string' && answer.response.trim() === question!.answerText
          : answer.choice === question!.answer) ||
      !isDateString(answer.answeredAt, 100)
    )
      throw new Error('Invalid lesson answer.')
  }
  for (const [id, review] of Object.entries(raw.reviews))
    if (
      !skillIds.has(id) ||
      !isPlainObject(review) ||
      !['understanding', 'approach', 'implementation', 'explanation'].every(k => judgments.includes(String(review[k]))) ||
      !text(review.evidence) ||
      !isDateString(review.updatedAt, 100)
    )
      throw new Error('Invalid self-review.')
  for (const note of [...raw.notes, ...(raw.noteDraft === undefined ? [] : [raw.noteDraft])])
    if (
      !isPlainObject(note) ||
      !text(note.id, 80) ||
      !text(note.title, 120) ||
      !text(note.body) ||
      !text(note.skillId, 60) ||
      (note.skillId && !skillIds.has(note.skillId)) ||
      !text(note.repId, 100) ||
      !['note', 'mistake', 'question'].includes(String(note.kind)) ||
      !isDateString(note.updatedAt, 100)
    )
      throw new Error('Invalid notebook entry.')
  for (const round of raw.rounds)
    if (
      !isPlainObject(round) ||
      !text(round.id, 80) ||
      !['interview-frontend', 'interview-backend'].includes(String(round.repId)) ||
      !isDateString(round.startedAt, 100) ||
      (round.endedAt !== undefined &&
        (!isDateString(round.endedAt, 100) || Date.parse(String(round.endedAt)) < Date.parse(String(round.startedAt)))) ||
      !Number.isInteger(round.minutes) ||
      Number(round.minutes) < 5 ||
      Number(round.minutes) > 120 ||
      !text(round.clarification) ||
      !text(round.debrief)
    )
      throw new Error('Invalid interview round.')
  if (new Set(raw.notes.map(n => n.id)).size !== raw.notes.length || new Set(raw.rounds.map(r => r.id)).size !== raw.rounds.length)
    throw new Error('Duplicate learning records.')
  return raw as unknown as FluencyState
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
/** `theirs` with each key that changed between `base` and `mine` set (or removed) as in `mine`. */
function mergeRecord<T>(base: Record<string, T>, mine: Record<string, T>, theirs: Record<string, T>): Record<string, T> {
  const merged = { ...theirs }
  for (const key of new Set([...Object.keys(base), ...Object.keys(mine)])) {
    if (same(base[key], mine[key])) continue
    if (key in mine) merged[key] = mine[key]
    else delete merged[key]
  }
  return merged
}
/** The same merge for records with IDs: entries this tab added lead, as new entries do, and the rest keep `theirs` order. */
function mergeById<T extends { id: string }>(base: T[], mine: T[], theirs: T[]): T[] {
  const byId = (list: T[]) => Object.fromEntries(list.map(item => [item.id, item]))
  const merged = mergeRecord(byId(base), byId(mine), byId(theirs))
  const known = new Set([...base, ...theirs].map(item => item.id))
  const added = mine.filter(item => !known.has(item.id))
  return [...added, ...theirs.filter(item => item.id in merged).map(item => merged[item.id])]
}
/**
 * Applies the changes one tab made (from `base`, the state it loaded, to `mine`) onto `theirs`, a copy another tab saved
 * meanwhile, so neither tab's lesson answers, reviews, notes, rounds, or bookmarks are lost.
 */
export function mergeFluency(base: FluencyState, mine: FluencyState, theirs: FluencyState): FluencyState {
  const field = <K extends keyof FluencyState>(key: K) => (same(base[key], mine[key]) ? theirs[key] : mine[key])
  const added = mine.bookmarks.filter(id => !base.bookmarks.includes(id))
  const removed = new Set(base.bookmarks.filter(id => !mine.bookmarks.includes(id)))
  const merged: FluencyState = {
    ...theirs,
    goal: field('goal'),
    noteDraft: field('noteDraft'),
    diagnosticStartedAt: field('diagnosticStartedAt'),
    answers: mergeRecord(base.answers, mine.answers, theirs.answers),
    reviews: mergeRecord(base.reviews, mine.reviews, theirs.reviews),
    notes: mergeById(base.notes, mine.notes, theirs.notes),
    rounds: mergeById(base.rounds, mine.rounds, theirs.rounds),
    bookmarks: [...new Set([...theirs.bookmarks.filter(id => !removed.has(id)), ...added])],
  }
  if (merged.noteDraft === undefined) delete merged.noteDraft
  if (merged.diagnosticStartedAt === undefined) delete merged.diagnosticStartedAt
  return merged
}
export const recallVariants: Record<string, string[]> = {
  async: ['cancel-local-export', 'settle-local-panels', 'await-local-records'],
  'typescript-boundaries': ['sensor-import-report'],
  grids: ['grid-fewest-steps', 'grid-count-rooms', 'grid-open-neighbours'],
  windows: ['shortest-run-reaching-target', 'count-unique-windows', 'algo-window-sum', 'quiet-sensor-span'],
  queues: ['parcel-loading-turns', 'ticket-service-times', 'remaining-actions'],
  'two-pointers': ['reading-run-summary', 'sorted-offset-squares', 'algo-sorted-pair', 'shared-seat-occurrences'],
  sorting: ['closest-value-gap', 'sort-score-records', 'algo-merge-sorted', 'dispatch-priority-order', 'kth-smallest-copy'],
  'binary-search': ['smallest-daily-capacity', 'first-insertion-point', 'algo-binary-search', 'first-affordable-edition'],
  recursion: ['count-object-leaves', 'flatten-nested-numbers', 'algo-recursive-sum', 'nested-parcel-load'],
  trees: ['tree-value-path', 'tree-depth-sum', 'algo-tree-depth', 'terminal-folder-paths'],
  'binary-search-trees': ['bst-check-order', 'bst-latest-at-or-before', 'bst-search-path', 'bst-nearest-slot'],
  'linked-lists': ['list-rotate-route', 'list-split-at-first', 'list-merge-sorted', 'algo-linked-list-reverse'],
  heaps: ['heap-rooms-needed', 'heap-merge-log-streams', 'algo-min-heap'],
  'dynamic-programming': ['dp-tag-edits', 'dp-stall-revenue', 'dp-garage-paths', 'algo-coin-change'],
  'string-building': ['text-normalized-palindrome', 'text-anagram-groups', 'text-run-length'],
  'timing-policies': ['scroll-report-throttle', 'autosave-debounce', 'debounce-schedule', 'leading-throttle'],
  'reliable-requests': ['quote-cache-retry', 'payment-resubmit', 'idempotent-ledger'],
  'fresh-debugging': ['debug-reducer-mutation', 'debug-invoice-rounding', 'debug-date-range-filter'],
  'dom-widgets': ['dom-combobox', 'dom-modal-dialog', 'dom-reorder-list', 'dom-tabs'],
  'suggested-code': ['ai-expose-wrong-median', 'ai-invented-api', 'ai-empty-input-suggestion', 'verify-generated-code'],
  graphs: ['graph-connected-groups', 'graph-shortest-hops', 'algo-graph-reachable', 'broadcast-unreached-stations'],
  'state-modeling': ['catalog-request-summary', 'saved-record-status', 'task-state-label'],
  validation: ['validate-import-batch', 'parse-delivery-window', 'validate-stock-adjustment'],
  'request-ownership': ['refresh-report-state', 'preview-slot-results', 'search-request-state'],
  'resource-ownership': ['subscription-cleanup', 'room-leases', 'shared-resource'],
  arrays: ['sum-matching-prices', 'count-open-tickets', 'count-above-threshold', 'count-record-highs'],
  text: ['first-label-ending', 'count-label-prefix', 'count-long-words'],
  lookup: ['first-duplicate-label', 'count-statuses', 'first-repeated-number', 'first-pair-to-target'],
  stacks: ['remaining-actions', 'simplify-file-path', 'remove-adjacent-pairs'],
  'control-flow': ['countdown-labels', 'batch-slot-labels', 'inspection-run-summary'],
  'interface-logic': ['filter-chip-summary', 'selection-action-state', 'navigation-window'],
  'request-response': ['page-response-envelope', 'conditional-resource-response', 'retry-response-policy'],
  'dom-interactions': ['dom-accordion', 'dom-live-search', 'dom-disclosure'],
  'find-the-bug': ['expose-overlap-bugs', 'expose-stock-bugs', 'expose-access-bugs'],
  maintenance: ['maintain-room-booking'],
  'sql-reading': ['sql-catalog-page', 'sql-recent-open-tickets', 'sql-filter-sort'],
  'sql-filtering': ['sql-search-articles', 'sql-members-to-text', 'sql-filter-groups'],
  'sql-summarizing': ['sql-month-spenders', 'sql-busy-days', 'sql-count-by-status'],
  'sql-joining': ['sql-authors-latest', 'sql-june-returns', 'sql-join-orders'],
  'sql-subqueries': ['sql-strong-months', 'sql-free-rooms', 'sql-above-average'],
  'sql-schema-design': ['sql-create-shifts', 'sql-create-memberships', 'sql-create-products'],
  'sql-changing-data': ['sql-archive-orders', 'sql-upsert-stock', 'sql-update-scope'],
  'sql-window-functions': ['sql-top-two-per-region', 'sql-running-balance', 'sql-rank-scores'],
  'sql-indexes': ['sql-index-join', 'sql-composite-index', 'sql-index-lookup'],
  'sql-migrations': ['sql-migrate-status-codes', 'sql-rebuild-table', 'sql-add-column'],
  'request-anatomy': ['backend-read-json-body', 'backend-decode-query', 'backend-split-target'],
  routing: ['backend-route-specificity', 'backend-route-request', 'backend-match-route'],
  'concurrent-writes': ['backend-replay-writes', 'backend-if-match', 'backend-versioned-update'],
  'background-jobs': ['backend-queue-simulation', 'backend-claim-job', 'backend-job-failure'],
  'rate-limiting': ['backend-limit-callers', 'backend-sliding-log', 'backend-token-bucket'],
  'api-evolution': ['backend-downgrade-response', 'backend-classify-change', 'backend-choose-version'],
  'ci-output': ['devops-failing-step', 'devops-first-error', 'devops-exit-meaning'],
  'service-config': ['devops-config-drift', 'devops-validate-env', 'devops-read-port'],
  semver: ['devops-satisfies-range', 'devops-next-version', 'devops-compare-versions'],
  'ci-pipelines': ['devops-skip-unchanged', 'devops-cache-key', 'devops-job-waves'],
  'container-images': ['devops-multistage-rebuild', 'devops-image-tags', 'devops-layer-rebuild'],
  'deploy-strategies': ['devops-canary-verdict', 'devops-percent-rollout', 'devops-rolling-batches'],
  'service-health': ['devops-graceful-drain', 'devops-probe-thresholds', 'devops-health-endpoints'],
  'cron-schedules': ['devops-cron-next-zone', 'devops-cron-matches', 'devops-cron-field'],
}
export function recurringReviews(history: PortableRecord[], now = Date.now()) {
  return getAllJourneys(history, now).flatMap(state => {
    if (!state.retained) return []
    const variants = recallVariants[state.journey.id]
    let anchor = Date.parse(state.retained.completedAt)
    let interval = 7
    let successes = 0
    let nextIndex = 0
    const evidence: PortableRecord[] = []
    for (const record of [...history].filter(r => variants.includes(r.repId) && isDateString(r.completedAt)).sort(byCompletedAt)) {
      const at = Date.parse(record.completedAt)
      if (at < anchor + interval * DAY_MS || record.repId !== variants[nextIndex]) continue
      evidence.push(record)
      anchor = at
      if (!record.hintCount && record.confidence !== 'need-practice' && (!record.difficulty || record.difficulty === 'none')) {
        successes++
        interval = Math.min(60, interval * 2)
        nextIndex = (nextIndex + 1) % variants.length
      } else interval = 3
    }
    const dueAt = anchor + interval * DAY_MS
    return [
      {
        skillId: state.journey.id,
        title: state.journey.title,
        repId: variants[nextIndex],
        dueAt,
        due: now >= dueAt,
        interval,
        successes,
        evidence,
        reason: `Your last scheduled recall was ${formatDate(anchor)}. ${interval} days allow a gap before testing the skill again. ${successes ? 'Independent recalls increased the interval.' : 'Try a different application without hints.'}`,
      },
    ]
  })
}
export function skillEvidence(skillId: string, history: PortableRecord[], state: FluencyState) {
  const skill = skills.find(s => s.id === skillId)!
  const attempts = history.filter(r => skill.repIds.includes(r.repId))
  const independent = attempts.filter(r => !r.hintCount)
  const lesson = skill.questions.map(q => state.answers[`${skill.id}:${q.id}`])
  const journey = getAllJourneys(history).find(s => s.journey.id === skillId)
  return {
    attempts,
    independent,
    lessonCorrect: lesson.filter(a => a?.correct).length,
    lessonTotal: lesson.length,
    retained: journey?.retained,
    selfReview: state.reviews[skillId],
  }
}
export const diagnosticRepIds = ['write-functions', 'count-even-numbers', 'backend-validate-user', 'repair-visible-count']
export const rubrics = {
  understanding: [
    'Explain the concept in your own words.',
    'Predict an unfamiliar example before executing it.',
    'Name a boundary or common misconception.',
  ],
  approach: [
    'Restate the contract and assumptions.',
    'Describe steps and a useful invariant.',
    'Compare an alternative and its tradeoffs.',
  ],
  implementation: ['Pass the behavioral checks.', 'Preserve inputs when required.', 'Solve a related unfamiliar task without hints.'],
  explanation: [
    'Trace a concrete input through your code.',
    'Explain why the boundary cases work.',
    'State time and space costs and the limits of the solution.',
  ],
} as const
export const capstones = [
  {
    id: 'frontend-project',
    title: 'A reliable team directory',
    brief:
      'Combine filtering, request states, safe rendering, and keyboard interaction. Complete each milestone, then integrate those decisions in the browser implementation.',
    milestones: [
      { title: 'Derive visible data', repId: 'frontend-visible-items' },
      { title: 'Define request-state precedence', repId: 'frontend-view-state' },
      { title: 'Build the focused browser feature', repId: 'frontend-directory' },
      { title: 'Integrate the multi-file project', repId: 'project-team-directory' },
    ],
    review: [
      'Try loading, error, empty, ready, and no search matches.',
      'Use only the keyboard to search and retry.',
      'Explain why display labels remain unchanged.',
      'Discuss how an older network response could overwrite newer state.',
    ],
  },
  {
    id: 'backend-project',
    title: 'A predictable ticket API',
    brief:
      'Combine trusted paging input, stable page boundaries, filtering, and predictable response shapes. Finish with the ticket request handler.',
    milestones: [
      { title: 'Validate paging input', repId: 'validate-page-query' },
      { title: 'Repair and test page boundaries', repId: 'debug-page-offset' },
      { title: 'Build the focused request handler', repId: 'backend-ticket-handler' },
      { title: 'Integrate the multi-file project', repId: 'project-ticket-api' },
    ],
    review: [
      'Trace malformed input, empty data, and a page past the end.',
      'Explain why filtering precedes paging.',
      'Distinguish matching total from page length.',
      'Describe what would change with persistent data and concurrent writes.',
    ],
  },
] as const
export function weeklyPlan(goal: FluencyState['goal'], candidates: { repId: string; reason: string; mode?: string }[], now = new Date()) {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    return d
  })
  const unique = candidates.filter((candidate, index) => candidates.findIndex(c => c.repId === candidate.repId) === index)
  return dates.filter(d => goal.days.includes(d.getDay())).map((date, i) => ({ date, minutes: goal.minutes, action: unique[i] ?? null }))
}
export function relatedHelp(repId: string, failedNames: string[]) {
  const matching = skills.filter(s => s.repIds.includes(repId))
  const names = failedNames.join(' ').toLowerCase()
  const extra = /empty|blank|whitespace|trim|case/.test(names)
    ? skills.find(s => s.id === 'text')
    : /page|query|invalid|null|integer/.test(names)
      ? skills.find(s => s.id === 'validation')
      : /input|mutat|preserv/.test(names)
        ? skills.find(s => s.id === 'arrays')
        : undefined
  return [...new Map([...(extra ? [extra] : []), ...matching].map(s => [s.id, s])).values()].slice(0, 3)
}

// The two-part puzzle intentionally has no recallVariants entry: adapting the same
// log is not a distinct delayed application and must not establish retention.
