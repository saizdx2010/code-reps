export type LearnerStart = 'new' | 'returning'

export type LearningRecord = {
  repId: string
  completedAt: string
  hintCount: number
}

export type Journey = { id: string; title: string; guided: string; independent: string; recall: string; delayDays: number }

export const journeys: Journey[] = [
  { id: 'arrays', title: 'Work through arrays', guided: 'sum-positive-numbers', independent: 'count-even-numbers', recall: 'count-above-threshold', delayDays: 3 },
  { id: 'text', title: 'Work through words', guided: 'count-words', independent: 'first-long-word', recall: 'count-long-words', delayDays: 3 },
  { id: 'lookup', title: 'Count and remember', guided: 'has-duplicate', independent: 'most-frequent-number', recall: 'first-repeated-number', delayDays: 3 },
  { id: 'stacks', title: 'Match what came before', guided: 'valid-parentheses', independent: 'balanced-brackets', recall: 'simplify-file-path', delayDays: 3 },
  { id: 'request-ownership', title: 'Keep asynchronous results current', guided: 'latest-request', independent: 'search-request-state', recall: 'preview-slot-results', delayDays: 3 },
  { id: 'resource-ownership', title: 'Own and clean up shared resources', guided: 'shared-resource', independent: 'subscription-cleanup', recall: 'room-leases', delayDays: 3 },
  { id: 'validation', title: 'Validate data at a boundary', guided: 'backend-validate-user', independent: 'validate-stock-adjustment', recall: 'parse-delivery-window', delayDays: 3 },
  { id: 'state-modeling', title: 'Model valid browser states', guided: 'task-state-label', independent: 'saved-record-status', recall: 'catalog-request-summary', delayDays: 3 },
  { id: 'control-flow', title: 'Repeat work and choose by condition', guided: 'loop-with-for', independent: 'shipping-cost-tiers', recall: 'countdown-labels', delayDays: 3 },
  { id: 'interface-logic', title: 'Derive what the interface shows', guided: 'frontend-sort-table', independent: 'group-items-by-heading', recall: 'filter-chip-summary', delayDays: 3 },
  { id: 'request-response', title: 'Read requests and shape responses', guided: 'backend-query-filters', independent: 'parse-sort-param', recall: 'page-response-envelope', delayDays: 3 },
  { id: 'sorting', title: 'Order and rank values', guided: 'algo-insertion-sort', independent: 'sort-score-records', recall: 'kth-smallest-copy', delayDays: 3 },
  { id: 'windows', title: 'Slide a window across a sequence', guided: 'algo-window-sum', independent: 'count-unique-windows', recall: 'shortest-run-reaching-target', delayDays: 3 },
  { id: 'binary-search', title: 'Search ordered values and answers', guided: 'algo-binary-search', independent: 'first-insertion-point', recall: 'smallest-daily-capacity', delayDays: 3 },
  { id: 'recursion', title: 'Work through nested structures', guided: 'algo-recursive-sum', independent: 'flatten-nested-numbers', recall: 'count-object-leaves', delayDays: 3 },
  { id: 'trees', title: 'Explore tree routes and levels', guided: 'algo-tree-depth', independent: 'tree-depth-sum', recall: 'tree-value-path', delayDays: 3 },
  { id: 'graphs', title: 'Explore graph connections', guided: 'algo-graph-reachable', independent: 'graph-shortest-hops', recall: 'graph-connected-groups', delayDays: 3 },
]

export const arrayJourney = journeys[0]

export type JourneyStage = 'learning' | 'practising' | 'independent' | 'retained'

export function getJourney(journey: Journey, records: LearningRecord[], now = Date.now()) {
  const chronological = [...records].filter((record) => Number.isFinite(Date.parse(record.completedAt)))
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
  const guided = chronological.find((record) => record.repId === journey.guided)
  const independent = guided && chronological.find((record) =>
    record.repId === journey.independent && record.hintCount === 0 &&
    Date.parse(record.completedAt) >= Date.parse(guided.completedAt))
  const recallAt = independent && Date.parse(independent.completedAt) + journey.delayDays * 86_400_000
  const retained = recallAt && chronological.find((record) =>
    record.repId === journey.recall && record.hintCount === 0 &&
    Date.parse(record.completedAt) >= recallAt)
  const stage: JourneyStage = retained ? 'retained' : independent ? 'independent' : guided ? 'practising' : 'learning'
  const nextRepId = !guided ? journey.guided : !independent ? journey.independent :
    !retained && now >= recallAt! ? journey.recall : null
  return { stage, guided, independent, retained, recallAt: recallAt ?? null, nextRepId,
    recallDue: Boolean(independent && !retained && now >= recallAt!) }
}

export const getArrayJourney = (records: LearningRecord[], now = Date.now()) => getJourney(arrayJourney, records, now)
export type JourneyProgress = ReturnType<typeof getJourney> & { journey: Journey }
export const getAllJourneys = (records: LearningRecord[], now = Date.now()): JourneyProgress[] =>
  journeys.map((journey) => ({ journey, ...getJourney(journey, records, now) }))

export const stageLabels: Record<JourneyStage, string> = {
  learning: 'Learning', practising: 'Practising', independent: 'Independent', retained: 'Retained',
}
