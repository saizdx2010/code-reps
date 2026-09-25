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
  { id: 'stacks', title: 'Match what came before', guided: 'valid-parentheses', independent: 'balanced-brackets', recall: 'remove-adjacent-pairs', delayDays: 3 },
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

export const reflectionGuides: Record<string, { plan: string[]; explanation: string[]; example: string }> = {
  'sum-positive-numbers': {
    plan: ['Start with a total of zero.', 'Visit each number and add only values greater than zero.', 'Consider an empty array and values at zero.'],
    explanation: ['Say why zero and negative values are skipped.', 'Describe the number of visits and the extra storage used.'],
    example: 'I visit each number once and add it only if it is positive. An empty array leaves the total at zero. This takes O(n) time and O(1) extra space.',
  },
  'count-even-numbers': {
    plan: ['Start a count at zero.', 'Check each value with the remainder operator.', 'Remember that zero and negative even numbers count.'],
    explanation: ['Explain why a remainder of zero means even.', 'Describe the number of visits and the extra storage used.'],
    example: 'I visit every number and increase a count when number % 2 is zero. Zero and negative even numbers work the same way. This takes O(n) time and O(1) extra space.',
  },
  'count-above-threshold': {
    plan: ['Choose an initial count.', 'Compare every value with the threshold.', 'Consider values equal to the threshold and an empty array.'],
    explanation: ['Explain why equal values are excluded.', 'Describe the number of visits and the extra storage used.'],
    example: 'I count each value strictly greater than the threshold. Equal values do not count. One pass takes O(n) time and O(1) extra space.',
  },
}
