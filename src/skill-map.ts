import { paths } from './path.ts'
import { repIndex as reps } from './catalog-index.ts'
import { getAllJourneys } from './learning.ts'
import type { JourneyProgress } from './learning.ts'
import type { PortableRecord } from './portability.ts'

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
type SkillStage = { title: string; nodes: SkillNode[] }
type SkillMap = { stages: SkillStage[]; counts: Record<SkillState, number>; total: number }

export const skillStateLabels: Record<SkillState, string> = {
  untouched: 'Not started',
  practiced: 'Guided',
  independent: 'Independent',
  retained: 'Retained',
  due: 'Review due',
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

/** Evidence rank: a due review is still independent evidence, so it is never a step down or up. */
const stateRank: Record<SkillState, number> = { untouched: 0, practiced: 1, independent: 2, due: 2, retained: 3 }
const shownState = (state: SkillState) => (state === 'due' ? 'independent' : state)

export type SkillStep = { id: string; title: string; from: SkillState; to: 'independent' | 'retained' }

/** Session key for a step the skill map should replay once; a due review still matches its Independent step. */
export const skillStepKey = (id: string, state: SkillState) => `${id}:${shownState(state)}`
export function parseStepKeys(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

/**
 * The skills that one completed attempt moved up to Independent or Retained, worked out by comparing the journeys
 * without and with that record. Guided is not a step: hinted work earns completion, not a level.
 */
export function skillSteps(history: PortableRecord[], recordId: string, now = Date.now()): SkillStep[] {
  const record = history.find(item => item.id === recordId)
  if (!record) return []
  // Only the attempts up to that moment: a later record never makes an earlier one look like a step.
  const earlier = history.filter(item => item.id !== recordId && Date.parse(item.completedAt) <= Date.parse(record.completedAt))
  const before = getAllJourneys(earlier, now)
  return getAllJourneys([...earlier, record], now).flatMap((after, index) => {
    const from = skillState(before[index])
    const to = shownState(skillState(after))
    if (stateRank[to] <= stateRank[from] || (to !== 'independent' && to !== 'retained')) return []
    return [{ id: after.journey.id, title: after.journey.title, from: shownState(from), to }]
  })
}

function skillNode(progress: JourneyProgress): SkillNode {
  const state = skillState(progress)
  const { journey } = progress
  const next =
    state === 'untouched'
      ? { repId: journey.guided, mode: 'start' as const, actionLabel: 'Start guided rep' }
      : state === 'practiced'
        ? { repId: journey.independent, mode: 'review' as const, actionLabel: 'Try without hints' }
        : state === 'due'
          ? { repId: journey.recall, mode: 'review' as const, actionLabel: 'Start fresh recall' }
          : { repId: null, mode: 'start' as const, actionLabel: '' }
  return {
    id: journey.id,
    title: journey.title,
    state,
    ...next,
    recallAt: progress.recallAt === null ? null : new Date(progress.recallAt).toISOString(),
  }
}

/** The skills of one track in trail order. A skill appears once, in the first stage that uses one of its reps. Unknown tracks fall back to the first track; journeys with no rep in the track are ignored. */
export function buildSkillMap(pathId: string, progress: JourneyProgress[]): SkillMap {
  const path = paths.find(item => item.id === pathId) ?? paths[0]
  const known = new Set(reps.map(rep => rep.id))
  const placed = new Set<string>()
  const stages = path.stages
    .map((stage): SkillStage => {
      const repIds = new Set(stage.repIds.filter(id => known.has(id)))
      const nodes = progress
        .filter(
          item =>
            !placed.has(item.journey.id) && [item.journey.guided, item.journey.independent, item.journey.recall].some(id => repIds.has(id)),
        )
        .map(item => {
          placed.add(item.journey.id)
          return skillNode(item)
        })
      return { title: stage.title, nodes }
    })
    .filter(stage => stage.nodes.length > 0)
  const counts: Record<SkillState, number> = { untouched: 0, practiced: 0, independent: 0, retained: 0, due: 0 }
  for (const node of stages.flatMap(stage => stage.nodes)) counts[node.state]++
  return { stages, counts, total: placed.size }
}
