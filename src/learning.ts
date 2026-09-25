export type LearnerStart = 'new' | 'returning'

export type LearningRecord = {
  repId: string
  completedAt: string
  hintCount: number
}

export const arrayJourney = {
  title: 'Work through arrays',
  guided: 'sum-positive-numbers',
  independent: 'count-even-numbers',
  recall: 'count-above-threshold',
  delayDays: 3,
} as const

export type JourneyStage = 'learning' | 'practising' | 'independent' | 'retained'

export function getArrayJourney(records: LearningRecord[], now = Date.now()) {
  const chronological = [...records].filter((record) => Number.isFinite(Date.parse(record.completedAt)))
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
  const guided = chronological.find((record) => record.repId === arrayJourney.guided)
  const independent = guided && chronological.find((record) =>
    record.repId === arrayJourney.independent && record.hintCount === 0 &&
    Date.parse(record.completedAt) >= Date.parse(guided.completedAt))
  const recallAt = independent && Date.parse(independent.completedAt) + arrayJourney.delayDays * 86_400_000
  const retained = recallAt && chronological.find((record) =>
    record.repId === arrayJourney.recall && record.hintCount === 0 &&
    Date.parse(record.completedAt) >= recallAt)
  const stage: JourneyStage = retained ? 'retained' : independent ? 'independent' : guided ? 'practising' : 'learning'
  const nextRepId = !guided ? arrayJourney.guided : !independent ? arrayJourney.independent :
    !retained && now >= recallAt! ? arrayJourney.recall : null
  return { stage, guided, independent, retained, recallAt: recallAt ?? null, nextRepId,
    recallDue: Boolean(independent && !retained && now >= recallAt!) }
}

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
