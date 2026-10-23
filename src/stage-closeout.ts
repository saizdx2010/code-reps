import { getAllJourneys } from './learning.ts'
import { paths } from './path.ts'
import type { PortableRecord } from './portability.ts'
import { buildSkillMap } from './skill-map.ts'

// What one completed attempt closed: a whole track, or a stage of the learner's goal track. It is worked out by comparing
// the reps completed before and after that record, as skillSteps does, so reopening the finished rep shows the same
// block and nothing is stored. Completion counts finished reps, hints included; skill evidence is reported separately.

type ClosedSkill = { id: string; title: string; state: 'independent' | 'retained' }
type Stage = { title: string; repIds: readonly string[] }
export type Closeout =
  | { kind: 'track'; pathId: string; title: string; repCount: number }
  | {
      kind: 'stage'
      pathId: string
      title: string
      /** The stage's number on the learner's trail; absent for a stage a returning learner skips. */
      number?: number
      repCount: number
      /** The stage's skills that are Independent or Retained as of this attempt; a due review counts as Independent. */
      skills: ClosedSkill[]
      /** The stage's other skills, still Guided or not started. */
      pending: number
      /** The next stage and the rep to start it with: its first rep not yet completed. */
      next?: { number?: number; title: string; repId: string }
    }

/** Every rep a track requires, once each, as its completion badge counts them. */
export const trackRepIds = (path: { stages: readonly Stage[] }) => [...new Set(path.stages.flatMap(stage => stage.repIds))]

/**
 * The track or goal-track stage that the record finished, or null. A track takes precedence (the goal track first), so
 * the completion panel shows one block, never both. `skipStages` numbers stages as the trail does for returning learners.
 */
export function closeout(history: PortableRecord[], recordId: string, goalPathId: string, skipStages = 0): Closeout | null {
  const record = history.find(item => item.id === recordId)
  const time = record ? Date.parse(record.completedAt) : NaN
  if (!record || !Number.isFinite(time)) return null
  // Only the attempts up to that moment: a later record never makes an earlier one look like the finish.
  const earlier = history.filter(item => item.id !== recordId && Date.parse(item.completedAt) <= time)
  const before = new Set(earlier.map(item => item.repId))
  // A rep completed before closed nothing new.
  if (before.has(record.repId)) return null
  const after = new Set(before).add(record.repId)
  const closes = (repIds: readonly string[]) => repIds.includes(record.repId) && repIds.every(id => after.has(id))
  const goal = paths.find(path => path.id === goalPathId) ?? paths[0]
  for (const path of [goal, ...paths.filter(path => path !== goal)]) {
    const ids = trackRepIds(path)
    if (closes(ids)) return { kind: 'track', pathId: path.id, title: path.title, repCount: ids.length }
  }
  const stages: readonly Stage[] = goal.stages
  const index = stages.findIndex(stage => closes(stage.repIds))
  if (index < 0) return null
  const stage = stages[index]
  const number = (at: number) => (at >= skipStages ? at - skipStages + 1 : undefined)
  const nodes =
    buildSkillMap(goal.id, getAllJourneys([...earlier, record], time)).stages.find(item => item.title === stage.title)?.nodes ?? []
  const skills = nodes.flatMap((node): ClosedSkill[] =>
    node.state === 'retained' || node.state === 'independent' || node.state === 'due'
      ? [{ id: node.id, title: node.title, state: node.state === 'retained' ? 'retained' : 'independent' }]
      : [],
  )
  const following = stages[index + 1]
  return {
    kind: 'stage',
    pathId: goal.id,
    title: stage.title,
    ...(number(index) ? { number: number(index) } : {}),
    repCount: new Set(stage.repIds).size,
    skills,
    pending: nodes.length - skills.length,
    ...(following
      ? {
          next: {
            ...(number(index + 1) ? { number: number(index + 1) } : {}),
            title: following.title,
            repId: following.repIds.find(id => !after.has(id)) ?? following.repIds[0],
          },
        }
      : {}),
  }
}
