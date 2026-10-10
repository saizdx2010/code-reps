import { paths } from './path.ts'
import { repIndex as reps } from './catalog-index.ts'
import type { JourneyProgress } from './learning.ts'

/** One recorded state per skill, derived only from existing journey evidence. */
export type SkillState = 'untouched' | 'practiced' | 'independent' | 'retained' | 'due'
export type SkillNode = {
  id: string
  title: string
  state: SkillState
  /** The next useful rep for this skill, or null while waiting for a recall break or after recall is recorded. */
  repId: string | null
  /** Independent and recall reps open as hint-free attempts, like Progress; the guided rep opens normally. */
  mode: 'start' | 'review'
  actionLabel: string
  recallAt: string | null
}
export type SkillStage = { title: string; nodes: SkillNode[] }
export type SkillMap = { stages: SkillStage[]; counts: Record<SkillState, number>; total: number }

export const skillStateLabels: Record<SkillState, string> = {
  untouched: 'Not started', practiced: 'Practiced', independent: 'Independent', retained: 'Retained', due: 'Review due',
}
export const skillStateMeaning: Record<SkillState, string> = {
  untouched: 'No completed rep recorded for this skill.',
  practiced: 'A guided rep is completed, but no hint-free related rep is recorded yet.',
  independent: 'A related rep was solved without hints. Fresh recall comes after a break.',
  retained: 'A fresh recall rep was solved without hints after the break.',
  due: 'Independent work is recorded and the break has passed. A fresh recall is ready.',
}

/** Precedence follows the evidence chain: retained, then due recall, independent, practiced. */
export function skillState(progress: JourneyProgress): SkillState {
  if (progress.retained) return 'retained'
  if (progress.independent) return progress.recallDue ? 'due' : 'independent'
  return progress.guided ? 'practiced' : 'untouched'
}

function skillNode(progress: JourneyProgress): SkillNode {
  const state = skillState(progress)
  const { journey } = progress
  const next = state === 'untouched' ? { repId: journey.guided, mode: 'start' as const, actionLabel: 'Start guided rep' }
    : state === 'practiced' ? { repId: journey.independent, mode: 'review' as const, actionLabel: 'Try without hints' }
      : state === 'due' ? { repId: journey.recall, mode: 'review' as const, actionLabel: 'Start fresh recall' }
        : { repId: null, mode: 'start' as const, actionLabel: '' }
  return { id: journey.id, title: journey.title, state, ...next, recallAt: progress.recallAt === null ? null : new Date(progress.recallAt).toISOString() }
}

/** The skills of one track in trail order. A skill appears once, in the first stage that uses one of its reps. Unknown tracks fall back to the first track; journeys with no rep in the track are ignored. */
export function buildSkillMap(pathId: string, progress: JourneyProgress[]): SkillMap {
  const path = paths.find(item => item.id === pathId) ?? paths[0]
  const known = new Set(reps.map(rep => rep.id))
  const placed = new Set<string>()
  const stages = path.stages.map((stage): SkillStage => {
    const repIds = new Set(stage.repIds.filter(id => known.has(id)))
    const nodes = progress.filter(item => !placed.has(item.journey.id) && [item.journey.guided, item.journey.independent, item.journey.recall].some(id => repIds.has(id)))
      .map(item => { placed.add(item.journey.id); return skillNode(item) })
    return { title: stage.title, nodes }
  }).filter(stage => stage.nodes.length > 0)
  const counts: Record<SkillState, number> = { untouched: 0, practiced: 0, independent: 0, retained: 0, due: 0 }
  for (const node of stages.flatMap(stage => stage.nodes)) counts[node.state]++
  return { stages, counts, total: placed.size }
}
