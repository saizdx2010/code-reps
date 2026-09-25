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
  'count-words': {
    plan: ['Handle empty or whitespace-only text.', 'Separate words on runs of whitespace.', 'Count the resulting words.'],
    explanation: ['Explain why repeated spaces do not create extra words.', 'Describe the time and storage used.'],
    example: 'I trim the text first. If it is empty, I return zero; otherwise I split on whitespace and count the pieces. The scan takes O(n) time and the split uses O(n) extra space.',
  },
  'first-long-word': {
    plan: ['Visit words in their given order.', 'Compare each length with the minimum.', 'Return null if none qualifies.'],
    explanation: ['Explain why the first qualifying word is returned.', 'Describe the worst-case scan.'],
    example: 'I scan left to right and return the first word whose length meets the minimum. If there is none, I return null. The scan takes O(n) time and O(1) extra space.',
  },
  'count-long-words': {
    plan: ['Start a count at zero.', 'Check every word against the minimum length.', 'Include words exactly at the minimum.'],
    explanation: ['Explain how empty input and exact-length words behave.', 'Describe the time and storage used.'],
    example: 'I visit each word and count it when its length is at least the minimum. An empty list keeps the count at zero. This takes O(n) time and O(1) extra space.',
  },
  'has-duplicate': {
    plan: ['Remember values already visited.', 'Check before adding a value.', 'Return false when the scan ends without a repeat.'],
    explanation: ['Explain why a set helps with repeat detection.', 'Describe the time and storage used.'],
    example: 'I scan the array with a set of seen values. If a value is already in the set, I return true. Otherwise I add it and continue. This is O(n) expected time and O(n) extra space.',
  },
  'most-frequent-number': {
    plan: ['Count occurrences with a map.', 'Handle empty input.', 'Resolve equal counts by choosing the smaller number.'],
    explanation: ['Explain when the best number changes.', 'Describe the time and storage used.'],
    example: 'I count each number in a map, then choose the highest count and smaller number on a tie. Empty input returns null. This takes O(n) expected time and O(n) extra space.',
  },
  'first-repeated-number': {
    plan: ['Scan left to right with a set of seen numbers.', 'Return as soon as one appears again.', 'Return null if none repeats.'],
    explanation: ['Explain why the second occurrence decides the answer.', 'Describe the time and storage used.'],
    example: 'I check each number against a set before adding it. The first number already present is the answer. If the scan ends, I return null. This takes O(n) expected time and O(n) extra space.',
  },
  'valid-parentheses': {
    plan: ['Track unmatched opening parentheses.', 'Reject a closing one when nothing is open.', 'Accept only when none remain.'],
    explanation: ['Explain early rejection and the final check.', 'Describe the time and storage used.'],
    example: 'I increase a count for each opening parenthesis and decrease it for each closing one. A negative count fails immediately; zero at the end succeeds. This takes O(n) time and O(1) space.',
  },
  'balanced-brackets': {
    plan: ['Push opening brackets onto a stack.', 'Match each closing bracket against the most recent opening.', 'Require an empty stack at the end.'],
    explanation: ['Explain why matching counts alone are insufficient.', 'Describe the time and storage used.'],
    example: 'I push openings and compare each closing bracket with the top of the stack. A mismatch fails, and an empty stack at the end succeeds. This takes O(n) time and O(n) space.',
  },
  'remove-adjacent-pairs': {
    plan: ['Use a stack for characters not yet removed.', 'Pop the top when it equals the next character.', 'Join the remaining characters.'],
    explanation: ['Explain why a new pair can form after removal.', 'Describe the time and storage used.'],
    example: 'I compare each character with the last saved one, removing a match or saving a nonmatch. The stack naturally exposes newly adjacent characters. This takes O(n) time and O(n) space.',
  },
  'repair-visible-count': {
    plan: ['Trace one active and one inactive item through the original condition.', 'Identify the reversed condition.', 'Keep the rest of the loop.'],
    explanation: ['Name the bug and why the correction works.', 'Explain the scan cost.'],
    example: 'The condition used !item.active, so it counted inactive items. I changed it to item.active. The loop visits each item once, using O(n) time and O(1) extra space.',
  },
  'read-unique-names': {
    plan: ['Read what the loop adds to names.', 'Check what slice(1) returns.', 'Preserve the loop and return the complete result.'],
    explanation: ['Describe what the set and array each do.', 'Explain why the first name was lost.'],
    example: 'The set prevents duplicates while names preserves first-seen order. slice(1) removed the first kept name, so I return names directly. The loop uses O(n) expected time and O(n) space.',
  },
  'transform-active-labels': {
    plan: ['Skip inactive users.', 'Trim each active name and skip an empty result.', 'Uppercase names and keep the input order.'],
    explanation: ['Explain why trim comes before the empty check.', 'Describe the output and scan cost.'],
    example: 'I visit each user, skip inactive ones, trim the name, and add its uppercase form only when it is nonempty. This preserves order and takes O(n) visits plus the work to process each name.',
  },
}
