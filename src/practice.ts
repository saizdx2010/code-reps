import { migratePathId, paths } from './path.ts'
import { recurringReviews } from './fluency.ts'
import { reps } from './rep.ts'
import { foundations } from './foundations.ts'
import { getAllJourneys } from './learning.ts'
import type { LearnerStart } from './learning.ts'
import type { PortableAttempt, PortableRecord } from './portability.ts'

export type PracticeAction = { repId: string; reason: string; mode: 'start' | 'resume' | 'review' | 'retry' }
const delay = 3 * 86_400_000

export function attemptStatus(repId: string, attempt?: PortableAttempt) {
  const rep = reps.find(item => item.id === repId)
  if (attempt?.completedAt) return 'Completed'
  if (attempt && rep && (attempt.plan.trim() || attempt.code !== rep.starter || attempt.explanation.trim() || attempt.hintCount > 0)) return 'In progress'
  return 'Not started'
}

function difficultyReason(record: PortableRecord) {
  const reasons: Record<string, string> = {
    wording: 'You marked the wording as difficult.', approach: 'You marked finding an approach as difficult.',
    typescript: 'You marked writing TypeScript as difficult.', 'edge-cases': 'You marked edge cases as difficult.',
  }
  return reasons[record.difficulty ?? ''] ?? (record.hintCount > 0 ? 'You used hints on your last attempt.' : 'You wanted more practice on your last attempt.')
}

/** The first uncompleted rep that follows `repId` in its path's stage order, or undefined at the end of the path. */
export function nextRepInPath(pathId: string, repId: string, completed: (id: string) => boolean) {
  const path = paths.find(item => item.id === migratePathId(pathId))
  const repIds: string[] = [...new Set(path?.stages.flatMap(stage => stage.repIds) ?? [])]
  const index = repIds.indexOf(repId)
  if (index < 0) return undefined
  return repIds.slice(index + 1).find(id => reps.some(rep => rep.id === id) && !completed(id))
}

export function getPracticePlan(drafts: Record<string, PortableAttempt>, history: PortableRecord[], learnerStart: LearnerStart | null, selectedRepId: string, now = Date.now(), goalPathId = 'typescript') {
  const status = (id: string) => attemptStatus(id, drafts[id])
  const progress = getAllJourneys(history, now)
  const latest = new Map<string, PortableRecord>()
  for (const record of history) {
    if (!reps.some(rep => rep.id === record.repId) || !Number.isFinite(Date.parse(record.completedAt))) continue
    const previous = latest.get(record.repId)
    if (!previous || Date.parse(record.completedAt) > Date.parse(previous.completedAt)) latest.set(record.repId, record)
  }
  const unfinished: PracticeAction[] = reps.filter(rep => status(rep.id) === 'In progress')
    .sort((a, b) => Number(b.id === selectedRepId) - Number(a.id === selectedRepId))
    .map(rep => ({ repId: rep.id, mode: 'resume', reason: 'Continue your saved plan, code, and explanation.' }))
  const recalls: PracticeAction[] = progress.filter(state => state.recallDue).map(state => ({
    repId: state.journey.recall, mode: status(state.journey.recall) === 'In progress' ? 'resume' : 'review',
    reason: `You solved the related problem without hints on ${new Date(state.independent!.completedAt).toLocaleDateString()}. ${status(state.journey.recall) === 'In progress' ? 'Continue your saved recall attempt.' : 'Try this different problem from a fresh start.'}`,
  }))
  const journeyIds = new Set(progress.flatMap(({ journey }) => [journey.guided, journey.independent, journey.recall]))
  const reviews: PracticeAction[] = [...latest.values()]
    .filter(record => !journeyIds.has(record.repId) && status(record.repId) !== 'In progress' && now - Date.parse(record.completedAt) >= delay &&
      (record.hintCount > 0 || record.confidence !== 'confident' || Boolean(record.difficulty && record.difficulty !== 'none')))
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
    .map(record => ({ repId: record.repId, mode: 'review', reason: `${difficultyReason(record)} At least three days have passed; try again from the starter.` }))
  const recurring: PracticeAction[] = recurringReviews(history, now).filter(review => review.due).map(review => ({ repId: review.repId, mode: status(review.repId) === 'In progress' ? 'resume' : 'review', reason: review.reason }))
  const due = [...new Map([...recalls, ...recurring, ...reviews].map(action => [action.repId, action])).values()]
  const foundation = learnerStart === 'new' ? foundations.find(lesson => status(lesson.repId) !== 'Completed') : undefined
  const nextJourney = progress.find(state => state.nextRepId)
  const nextId = nextJourney?.nextRepId
  const journeyAction: PracticeAction | undefined = nextId ? {
    repId: nextId, mode: status(nextId) === 'Completed' ? 'retry' : 'start',
    reason: status(nextId) === 'Completed' ? 'This completion has not established independence. Try again without hints after guided practice.' : nextJourney.stage === 'practising' ? 'Your guided rep is complete. Try this related problem without hints.' : 'Build this skill with a guided rep before independent practice.',
  } : undefined
  const available = reps.find(rep => status(rep.id) === 'Not started' && (learnerStart !== 'returning' || !foundations.some(lesson => lesson.repId === rep.id)) &&
    !progress.some(state => state.journey.recall === rep.id && !state.recallDue && !state.retained))
  const recallAvailable = (id: string) => !progress.some(state => state.journey.recall === id && !state.recallDue && !state.retained)
  const goalPath = paths.find(path => path.id === migratePathId(goalPathId)) ?? paths[0]
  const goalIds: readonly string[] = goalPath.stages.flatMap(stage => stage.repIds).filter(id => learnerStart !== 'returning' || goalPath.id !== 'typescript' || !foundations.some(lesson => lesson.repId === id))
  const goalDraft = unfinished.find(action => goalIds.includes(action.repId))
  const goalRepId = goalIds.find(id => status(id) !== 'Completed' && recallAvailable(id))
  const goalAction: PracticeAction | undefined = goalRepId ? { repId: goalRepId, mode: status(goalRepId) === 'In progress' ? 'resume' : 'start', reason: `Build toward your selected learning goal: ${goalPath.title}.` } : undefined
  const goalJourney = progress.find(state => state.nextRepId === state.journey.independent && goalIds.includes(state.nextRepId) && status(state.nextRepId) === 'Completed')
  const independenceAction: PracticeAction | undefined = goalJourney?.nextRepId ? { repId: goalJourney.nextRepId, mode: 'retry', reason: 'This completion has not established independence. Try again without hints after guided practice.' } : undefined
  const next: PracticeAction | null = recalls[0] ?? recurring[0] ?? goalDraft ?? reviews[0] ?? independenceAction ?? goalAction ??
    unfinished[0] ?? (foundation ? { repId: foundation.repId, mode: 'start', reason: 'Build a TypeScript foundation before the problem-solving journeys.' } : undefined) ??
    journeyAction ?? (available ? { repId: available.id, mode: 'start', reason: 'Try a new application of your skills. Start with a plan, then write and check your solution.' } : null)
  return { next, unfinished, due, progress }
}
