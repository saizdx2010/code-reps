import { paths } from './path.ts'
import { skills, knowledgeGroups } from './knowledge.ts'
import { journeys, getAllJourneys } from './learning.ts'
import type { PortableRecord } from './portability.ts'
export type Judgment = 'not-yet' | 'with-help' | 'independent'
export type SelfReview = { understanding: Judgment; approach: Judgment; implementation: Judgment; explanation: Judgment; evidence: string; updatedAt: string }
export type LearningNote = { id: string; title: string; body: string; skillId: string; repId: string; kind: 'note' | 'mistake' | 'question'; updatedAt: string }
export type InterviewRound = { id: string; repId: string; startedAt: string; endedAt?: string; minutes: number; clarification: string; debrief: string }
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
export const emptyFluency = (): FluencyState => ({ version: 1, goal: { pathId: 'typescript', minutes: 20, days: [1, 3, 5] }, answers: {}, reviews: {}, notes: [], bookmarks: [], rounds: [] })
const obj = (x: unknown): x is Record<string, unknown> => Boolean(x && typeof x === 'object' && !Array.isArray(x))
const text = (x: unknown, max = 20_000): x is string => typeof x === 'string' && x.length <= max
const date = (x: unknown) => text(x, 100) && Number.isFinite(Date.parse(x))
const judgments = ['not-yet', 'with-help', 'independent']
const pathIds = new Set<string>(paths.map(path => path.id))
const skillIds = new Set(skills.map(s => s.id))
// Keep old answer contracts readable without counting them as current lesson evidence.
const retiredQuestions = new Map([
  ['frontend:derive', { options: ['Source items and the current query', 'An unrelated saved copy', 'A mutation of the source array'], answer: 0, completion: false }],
  ['event-loop:prediction-2', { options: ['It runs during the draining checkpoint', 'It always waits behind the next timer', 'It runs synchronously inside queueMicrotask'], answer: 0, completion: false }],
])
const questionIds = new Set(skills.flatMap(s => s.questions.map(q => `${s.id}:${q.id}`)))
export function parseFluency(raw: unknown): FluencyState {
  if (JSON.stringify(raw)?.length > 900_000) throw new Error('Learning data is full. Export your profile and remove older notes or rounds before adding more.')
  if (!obj(raw) || raw.version !== 1 || !obj(raw.goal) || !text(raw.goal.pathId, 60) || !pathIds.has(raw.goal.pathId) || !Number.isInteger(raw.goal.minutes) || Number(raw.goal.minutes) < 5 || Number(raw.goal.minutes) > 120 || !Array.isArray(raw.goal.days) || raw.goal.days.length > 7 || raw.goal.days.some(d => !Number.isInteger(d) || d < 0 || d > 6) || new Set(raw.goal.days).size !== raw.goal.days.length || !obj(raw.answers) || !obj(raw.reviews) || !Array.isArray(raw.notes) || raw.notes.length > 1000 || !Array.isArray(raw.bookmarks) || raw.bookmarks.some(id => !skillIds.has(id)) || !Array.isArray(raw.rounds) || raw.rounds.length > 1000 || (raw.diagnosticStartedAt !== undefined && !date(raw.diagnosticStartedAt))) throw new Error('Learning data is invalid. Your saved copy has been kept.')
  for (const [id, answer] of Object.entries(raw.answers)) {
    const [sid, qid] = id.split(':'); const question = skills.find(s => s.id === sid)?.questions.find(q => q.id === qid) ?? retiredQuestions.get(id)
    if ((!questionIds.has(id) && !retiredQuestions.has(id)) || !obj(answer) || (answer.response !== undefined && !text(answer.response, 300)) || !Number.isInteger(answer.choice) || Number(answer.choice) < 0 || Number(answer.choice) >= question!.options.length || answer.correct !== (question!.completion ? typeof answer.response === 'string' && answer.response.trim() === question!.options[question!.answer] : answer.choice === question!.answer) || !date(answer.answeredAt)) throw new Error('Invalid lesson answer.')
  }
  for (const [id, review] of Object.entries(raw.reviews)) if (!skillIds.has(id) || !obj(review) || !['understanding', 'approach', 'implementation', 'explanation'].every(k => judgments.includes(String(review[k]))) || !text(review.evidence) || !date(review.updatedAt)) throw new Error('Invalid self-review.')
  for (const note of [...raw.notes, ...(raw.noteDraft === undefined ? [] : [raw.noteDraft])]) if (!obj(note) || !text(note.id, 80) || !text(note.title, 120) || !text(note.body) || !text(note.skillId, 60) || (note.skillId && !skillIds.has(note.skillId)) || !text(note.repId, 100) || !['note', 'mistake', 'question'].includes(String(note.kind)) || !date(note.updatedAt)) throw new Error('Invalid notebook entry.')
  for (const round of raw.rounds) if (!obj(round) || !text(round.id, 80) || !['interview-frontend', 'interview-backend'].includes(String(round.repId)) || !date(round.startedAt) || (round.endedAt !== undefined && (!date(round.endedAt) || Date.parse(String(round.endedAt)) < Date.parse(String(round.startedAt)))) || !Number.isInteger(round.minutes) || Number(round.minutes) < 5 || Number(round.minutes) > 120 || !text(round.clarification) || !text(round.debrief)) throw new Error('Invalid interview round.')
  if (new Set(raw.notes.map(n => n.id)).size !== raw.notes.length || new Set(raw.rounds.map(r => r.id)).size !== raw.rounds.length) throw new Error('Duplicate learning records.')
  return raw as unknown as FluencyState
}
export const recallVariants: Record<string, string[]> = {
  'state-modeling': ['catalog-request-summary', 'saved-record-status', 'task-state-label'],
  validation: ['validate-import-batch', 'parse-delivery-window', 'validate-stock-adjustment'],
  'request-ownership': ['refresh-report-state', 'preview-slot-results', 'search-request-state'],
  'resource-ownership': ['subscription-cleanup', 'room-leases', 'shared-resource'],
  arrays: ['sum-matching-prices', 'count-open-tickets', 'count-above-threshold'],
  text: ['first-label-ending', 'count-label-prefix', 'count-long-words'],
  lookup: ['first-duplicate-label', 'count-statuses', 'first-repeated-number'],
  stacks: ['remaining-actions', 'cancel-adjacent-ids', 'remove-adjacent-pairs'],
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
    for (const record of [...history].filter(r => variants.includes(r.repId) && Number.isFinite(Date.parse(r.completedAt))).sort((a,b) => Date.parse(a.completedAt)-Date.parse(b.completedAt))) {
      const at = Date.parse(record.completedAt)
      if (at < anchor + interval * 86_400_000 || record.repId !== variants[nextIndex]) continue
      evidence.push(record)
      anchor = at
      if (!record.hintCount && record.confidence !== 'need-practice' && (!record.difficulty || record.difficulty === 'none')) {
        successes++; interval = Math.min(60, interval * 2); nextIndex = (nextIndex + 1) % variants.length
      } else interval = 3
    }
    const dueAt = anchor + interval * 86_400_000
    return [{ skillId: state.journey.id, title: state.journey.title, repId: variants[nextIndex], dueAt, due: now >= dueAt, interval, successes, evidence,
      reason: `Your last scheduled recall was ${new Date(anchor).toLocaleDateString()}. ${interval} days allow a gap before testing the skill again. ${successes ? 'Independent recalls increased the interval.' : 'Try a different application without hints.'}` }]
  })
}
export function skillEvidence(skillId: string, history: PortableRecord[], state: FluencyState) {
  const skill = skills.find(s => s.id === skillId)!
  const attempts = history.filter(r => skill.repIds.includes(r.repId))
  const independent = attempts.filter(r => !r.hintCount)
  const lesson = skill.questions.map(q => state.answers[`${skill.id}:${q.id}`])
  const journey = getAllJourneys(history).find(s => s.journey.id === skillId)
  return { attempts, independent, lessonCorrect: lesson.filter(a => a?.correct).length, lessonTotal: lesson.length, retained: journey?.retained, selfReview: state.reviews[skillId] }
}
export const diagnosticRepIds = ['write-functions', 'count-even-numbers', 'backend-validate-user', 'repair-visible-count']
export const rubrics = {
  understanding: ['Explain the concept in your own words.', 'Predict an unfamiliar example before executing it.', 'Name a boundary or common misconception.'],
  approach: ['Restate the contract and assumptions.', 'Describe steps and a useful invariant.', 'Compare an alternative and its tradeoffs.'],
  implementation: ['Pass the behavioral checks.', 'Preserve inputs when required.', 'Solve a related unfamiliar task without hints.'],
  explanation: ['Trace a concrete input through your code.', 'Explain why the boundary cases work.', 'State time and space costs and the limits of the solution.'],
} as const
export const capstones = [
  { id: 'frontend-project', title: 'A reliable team directory', brief: 'Combine filtering, request states, safe rendering, and keyboard interaction. Complete each milestone, then integrate those decisions in the browser implementation.', milestones: [ { title: 'Derive visible data', repId: 'frontend-visible-items' }, { title: 'Define request-state precedence', repId: 'frontend-view-state' }, { title: 'Build the focused browser feature', repId: 'frontend-directory' }, { title: 'Integrate the multi-file project', repId: 'project-team-directory' } ], review: ['Try loading, error, empty, ready, and no search matches.', 'Use only the keyboard to search and retry.', 'Explain why display labels remain unchanged.', 'Discuss how an older network response could overwrite newer state.'] },
  { id: 'backend-project', title: 'A predictable ticket API', brief: 'Combine trusted paging input, stable page boundaries, filtering, and predictable response shapes. Finish with the ticket request handler.', milestones: [ { title: 'Validate paging input', repId: 'validate-page-query' }, { title: 'Repair and test page boundaries', repId: 'debug-page-offset' }, { title: 'Build the focused request handler', repId: 'backend-ticket-handler' }, { title: 'Integrate the multi-file project', repId: 'project-ticket-api' } ], review: ['Trace malformed input, empty data, and a page past the end.', 'Explain why filtering precedes paging.', 'Distinguish matching total from page length.', 'Describe what would change with persistent data and concurrent writes.'] },
] as const
export function weeklyPlan(goal: FluencyState['goal'], candidates: { repId: string; reason: string; mode?: string }[], now = new Date()) {
  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() + i); return d })
  const unique = candidates.filter((candidate, index) => candidates.findIndex(c => c.repId === candidate.repId) === index)
  return dates.filter(d => goal.days.includes(d.getDay())).map((date, i) => ({ date, minutes: goal.minutes, action: unique[i] ?? null }))
}
export function relatedHelp(repId: string, failedNames: string[]) {
  const matching = skills.filter(s => s.repIds.includes(repId))
  const names = failedNames.join(' ').toLowerCase()
  const extra = /empty|blank|whitespace|trim|case/.test(names) ? skills.find(s => s.id === 'text') : /page|query|invalid|null|integer/.test(names) ? skills.find(s => s.id === 'validation') : /input|mutat|preserv/.test(names) ? skills.find(s => s.id === 'arrays') : undefined
  return [...new Map([...(extra ? [extra] : []), ...matching].map(s => [s.id, s])).values()].slice(0, 3)
}
export function validateKnowledge(repIds: Set<string>) {
  const problems: string[] = []
  if (new Set(skills.map(s=>s.id)).size !== skills.length) problems.push('Duplicate skill IDs')
  for (const skill of skills) {
    if (!skill.sections.length || !skill.objectives.length || !skill.example || !skill.walkthrough.length || !skill.questions.length) problems.push(`${skill.id}: incomplete lesson`)
    for (const id of [...skill.prerequisites, ...skill.related]) if (!skillIds.has(id)) problems.push(`${skill.id}: missing skill ${id}`)
    for (const id of skill.repIds) if (!repIds.has(id)) problems.push(`${skill.id}: missing rep ${id}`)
    if (new Set(skill.questions.map(q=>q.id)).size !== skill.questions.length) problems.push(`${skill.id}: duplicate question`)
    for (const q of skill.questions) if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length || !q.explanation) problems.push(`${skill.id}: invalid question ${q.id}`)
  }
  const groupedIds = knowledgeGroups.flatMap(group => group.skillIds)
  if (new Set(groupedIds).size !== groupedIds.length || groupedIds.length !== skills.length || groupedIds.some(id => !skillIds.has(id))) problems.push('Knowledge groups must contain every skill exactly once')
  const visit = (id: string, stack: Set<string>) => {
    if (stack.has(id)) { problems.push(`${id}: prerequisite cycle`); return }
    for (const dep of skills.find(s=>s.id===id)?.prerequisites ?? []) visit(dep, new Set([...stack, id]))
  }
  skills.forEach(s=>visit(s.id, new Set()))
  for (const journey of journeys) if (!recallVariants[journey.id]?.every(id => repIds.has(id))) problems.push(`${journey.id}: missing recall variants`)
  for (const project of capstones) for (const m of project.milestones) if (!repIds.has(m.repId)) problems.push(`${project.id}: missing milestone`)
  return problems
}
