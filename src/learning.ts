import { browserStateGuides } from './browser-state-reps.ts'
import { dsaGuides } from './dsa-reps.ts'
import { practicalGuides } from './practical-concepts.ts'
import { fluencyGuides } from './fluency-reps.ts'
import { validationGuides } from './validation-reps.ts'
import { appGuides } from './app-reps.ts'
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
  { id: 'sorting', title: 'Order and rank values', guided: 'algo-insertion-sort', independent: 'sort-score-records', recall: 'kth-smallest-copy', delayDays: 3 },
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

export const reflectionGuides: Record<string, { plan: string[]; explanation: string[]; example: string }> = {
  ...practicalGuides,
  ...dsaGuides,
  ...fluencyGuides,
  ...validationGuides,
  ...appGuides,
  ...browserStateGuides,
  'project-team-directory': { plan: ['Separate selection from rendering.', 'Keep all request states explicit.', 'Use safe text and keyboard-operable controls.'], explanation: ['Trace an interaction across modules.', 'Review accessibility manually.', 'Explain why integration checks alone do not prove module design.'], example: 'I keep filtering in the data module and DOM work in the rendering module. The input listener obtains a fresh selection and renders original labels as text. I test all states and separately review focus and layout.' },
  'project-ticket-api': { plan: ['Validate the method before the query.', 'Normalize trusted fields in the query module.', 'Filter before calculating total and page.'], explanation: ['Trace invalid and valid requests across modules.', 'Explain response shapes and unchanged input.', 'Discuss where database integration would belong.'], example: 'I reject unsupported methods first, ask the query module for trusted values, then filter and slice tickets in the handler. Integration checks verify responses; I review module responsibilities separately.' },
  'debug-cart-total': {
    plan: ["Trace quantities, sold-out items, and repeated discount application in the draft.", "Repair the subtotal rules before applying the discount.", "Preserve the input objects."],
    explanation: ["Explain each bug and the regression case that exposes it.", "Distinguish integer cents from floating-point currency values."],
    example: "I count only available items at priceCents times quantity, subtract the discount once, then clamp to zero. This fixes the quantity, sold-out, and repeated-discount bugs. One pass uses O(n) time and O(1) extra space.",
  },
  'frontend-directory': {
    plan: ["Choose loading before error before loaded content.", "Build labelled controls and a list using safe text insertion.", "Update the filtered list on input without mutating people."],
    explanation: ["Explain state precedence, query normalization, and original-label preservation.", "Review keyboard focus and all four states in the preview yourself.", "Passing interaction checks does not establish visual or accessibility quality."],
    example: "I render loading or error first, wiring Retry to the supplied callback. For loaded data I create a labelled input and rerender the list on input events, using textContent for names. Filtering visits the people and processes their name text; rendering work scales with the visible output. I separately review keyboard access and layout.",
  },
  'read-batch-labels': {
    plan: ["Write predictions before running checks.", "Trace raw, trimmed label, seen, and output for every iteration.", "Compare blank input and case-sensitive names."],
    explanation: ["Explain how trimming happens before duplicate detection.", "Explain why first-seen order is preserved and case variants remain distinct.", "Review whether your trace predicted the result without calling the supplied collector."],
    example: "For repeat, the first raw label becomes Ada, Bo is then added, and the final Ada is already seen. Empty produces no output; blank keeps only Bo; case keeps Ada and ada separately. I wrote the predictions before checking them. The collector scans input and stores accepted labels, with additional work for trimming each string.",
  },
  'backend-ticket-handler': {
    plan: ["Validate method before query shape and optional fields.", "Filter by status and normalized search before counting.", "Page the filtered list and preserve source objects."],
    explanation: ["Explain the 405 and 400 responses and the defaults.", "Explain why total is measured before pagination.", "State that these are parsed request objects, not live HTTP or URL-parser checks."],
    example: "I reject unsupported methods, validate optional query fields without coercion, then filter in input order. I calculate total before slicing the requested page. Invalid queries always return the same 400 error contract. Filtering takes a pass plus title-search work; output and the filtered array use extra space proportional to their sizes.",
  },
  'refactor-stock-summary': {
    plan: ["Run the existing behavior checks before changing the working code.", "Replace unclear names and duplicated conditions.", "Preserve zero-unit IDs, duplicates, order, and source data."],
    explanation: ["Compare the original three scans with your revised structure.", "Explain why the new names clarify the response fields.", "Review structure yourself: passing checks alone does not prove the code improved."],
    example: "I use descriptive ids, units, and valueCents accumulators and update all three during one pass over available products. Zero units still keep an ID, and duplicates stay duplicated. Both versions are O(n) time; one pass reduces repeated logic. The IDs array uses O(n) output space. I assess readability separately from passing checks.",
  },
  'declare-variables': {
    plan: ["Name the fixed greeting and the combined message.", "Keep the trailing space in the greeting."],
    explanation: ["Check your use of const and let yourself; output checks cannot establish it.", "Explain what happens with an empty name."],
    example: "The greeting stays the same, so I use const. I store the combined greeting and name in message using let. The checks verify the output, while I review the declarations myself.",
  },
  'basic-types': {
    plan: ["Identify the string, number, and boolean inputs.", "Match the punctuation and spacing in the example."],
    explanation: ["Explain how each value becomes part of the sentence.", "Show that false and zero are preserved."],
    example: "I combine all three inputs into one template string. False and zero are values to display, not reasons to skip a field.",
  },
  'create-objects': {
    plan: ["Create a person with both supplied properties.", "Read the properties to build the sentence."],
    explanation: ["Review your object and Person type yourself; output checks cannot prove their use.", "Explain the difference between a property and a local variable."],
    example: "I create a Person object from name and age, then read person.name and person.age. The sentence checks do not prove that I used an object or checked its type.",
  },
  'make-arrays': {
    plan: ["Handle an empty array before reading its first item.", "Use the first index."],
    explanation: ["Explain why an empty string is still a valid first item.", "Describe the time and extra storage used."],
    example: "I return null only when length is zero; otherwise I return index 0. Reading the length and first item takes O(1) time and extra space.",
  },
  'write-functions': {
    plan: ["Identify price and quantity as inputs.", "Return their product."],
    explanation: ["Explain the difference between returning and printing.", "Describe zero quantity."],
    example: "I return price multiplied by quantity. Zero quantity gives zero. This uses a fixed number of arithmetic operations and O(1) extra space.",
  },
  'use-conditions': {
    plan: ["Handle scores outside 0 through 100 first.", "Check the highest grade band first, then each lower band."],
    explanation: ["Explain why 90 is A while 89.9 is B.", "Describe which branch handles scores below 60."],
    example: "I return Invalid for scores outside 0 through 100 before any grade check. Then I test 90, 80, 70, and 60 in that order, so each band is one branch. Scores below 60 reach the final return. The checks verify labels at the boundaries; I review my branch order myself.",
  },
  'loop-with-for': {
    plan: ["Start the total at zero.", "Decide where the loop starts and whether it includes n."],
    explanation: ["Explain why the loop includes n itself.", "Explain what happens when n is zero."],
    example: "I start total at 0 and count i from 1 through n, adding each value. For 0 the loop body never runs, so total stays 0. The loop does n additions, which is O(n) time and O(1) extra space. A formula would also work, but this rep practises the loop.",
  },
  'loop-while': {
    plan: ["Write the condition that keeps the loop running.", "Predict the steps for 9 by hand."],
    explanation: ["Explain why Math.floor keeps each value whole.", "Explain why an input of 1 returns 0 without special handling."],
    example: "I keep steps at 0 and loop while value is greater than 1. Each pass sets value to Math.floor(value / 2) and adds one step. For 9 the values are 4, 2, and 1, so there are three steps. Each pass lowers the value, so the loop ends in O(log n) time with O(1) extra space.",
  },
  'string-basics': {
    plan: ["Trim the name before splitting it.", "Decide what an empty name returns."],
    explanation: ["Explain why one or more spaces separate words.", "Explain how slice(0, 1) behaves on an empty word."],
    example: "I trim the name, split it on runs of whitespace, take the first character of each word, uppercase it, and join the letters. An empty name becomes one empty word, so the result is an empty string. The checks verify the output; I review the splitting rule myself.",
  },
  'object-update': {
    plan: ["Name the one field that changes.", "Decide how the received task stays unchanged."],
    explanation: ["Explain why the spread creates a new object.", "Explain what the input check detects."],
    example: "I create updated with { ...task, done }, so every existing field is copied and done is replaced. I return updated and never assign to task. The checks compare the returned object and also detect changes to the supplied object. This copy is shallow, which is enough for these primitive fields.",
  },
  'first-unique-character': {
    plan: ["Count occurrences or compare first and last positions.", "Search in original order.", "Handle empty input and repeated characters."],
    explanation: ["Explain zero-based indices and case-sensitive comparison.", "State the cost of your chosen approach."],
    example: "I count characters, then scan from index 0 for the first count of one. I return -1 if none qualifies. For the stated basic Latin input, this takes O(n) expected time and O(k) space for k distinct characters.",
  },
  'missing-number': {
    plan: ["Use the array length to identify the full range.", "Compare the expected range with the supplied values.", "Consider missing zero and missing n."],
    explanation: ["State the assumption that exactly one value is missing and none repeats.", "Explain your chosen time and storage costs."],
    example: "I subtract the supplied sum from n * (n + 1) / 2. The contract guarantees one missing value and no duplicates. One scan takes O(n) time and O(1) extra space.",
  },
  'verify-generated-code': {
    plan: ["Trace the draft with a blank first label.", "Find the first useful label in original order.", "Consider an empty list and only blank labels."],
    explanation: ["Describe actual versus expected output before the repair.", "Explain trimming and the no-match result."],
    example: "The draft returns a blank first label without inspecting later labels. I scan in order, trim each label, and return the first nonempty result. Otherwise I return null. Cost depends on the labels visited and their lengths.",
  },
  'frontend-visible-items': {
    plan: ["Normalize the query once.", "Keep only active matching items.", "Preserve original labels and order."],
    explanation: ["Explain why an empty normalized query matches every active label.", "Account for the work to process label text."],
    example: "I trim and lowercase the query, compare it with lowercase active labels, and return the original labels. This avoids changing display text. The scan visits every item and performs string processing for each active label.",
  },
  'frontend-view-state': {
    plan: ["Choose loading before other states.", "Check nonempty error next.", "Use count only when loading and error are absent."],
    explanation: ["Explain conflicting inputs such as loading with an error.", "Explain why an empty error string is ignored."],
    example: "I check loading, then a nonempty error, then zero count. Everything else is ready. Explicit precedence prevents an unfinished request from appearing empty. The function uses O(1) time and space.",
  },
  'backend-validate-user': {
    plan: ["Reject null, arrays, and primitive values before field access.", "Validate name and integer age including both bounds.", "Return a new normalized result."],
    explanation: ["Explain why TypeScript alone cannot validate an unknown request.", "Describe what happens for missing fields and wrong types."],
    example: "I check object shape before reading fields, require a trimmed nonblank name and an integer age from 0 through 120, and return a new object. Invalid input returns null. Name trimming requires work proportional to its length.",
  },
  'backend-page-results': {
    plan: ["Clamp page and size before calculating the offset.", "Use the normalized size for both offset and end.", "Consider empty input and a page past the end."],
    explanation: ["Explain one-based pages versus zero-based array indices.", "Show how you preserve the input."],
    example: "I normalize page and size, calculate (page - 1) * size, and return a slice. Slice leaves the input unchanged. The result holds at most three IDs, so copying it has bounded time and extra space.",
  },
  'interview-frontend': {
    plan: ["Restate which tasks qualify and how ties work.", "Order a new array by descending priority.", "Return titles without changing any input objects."],
    explanation: ["Explain filtering, stable ties, and mutation prevention.", "Discuss sorting cost and a possible larger-data tradeoff."],
    example: "I filter unfinished tasks into a new array, sort it by descending priority, and map to titles. Stable sorting preserves ties. For m unfinished tasks among n inputs, typical comparison sorting costs O(n + m log m) time and the copied data uses O(m) space.",
  },
  'interview-backend': {
    plan: ["Restate the deliberately small email and role contract.", "Check shape and types before normalization.", "Consider missing sides, repeated @, and invalid roles."],
    explanation: ["Explain what this contract leaves unchecked, including internal spaces.", "Distinguish validation from normalization."],
    example: "I reject invalid shapes and roles, trim the email, and require exactly one @ with nonblank text on each side. I lowercase valid email text. This is not complete email validation and allows internal spaces under the stated rules. String processing scales with email length.",
  },
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
