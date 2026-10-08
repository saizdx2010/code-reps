import { pathApplications, repCurriculumRole, stageCoveredByFoundations } from './curriculum.ts'
import { skillsForRep } from './knowledge.ts'
import { paths } from './path.ts'
import { reps } from './rep.ts'

export type TrailNodeState = 'done' | 'next' | 'draft' | 'later' | 'open'
export type TrailNode =
  | { kind: 'lesson'; id: string; skillId: string; title: string; state: 'done' | 'open' }
  | { kind: 'rep'; id: string; repId: string; title: string; role: string; state: TrailNodeState }
  | { kind: 'project'; id: string; repId: string; title: string; reason: string; state: 'done' | 'open' }
export type TrailStage = { title: string; description: string; nodes: TrailNode[]; covered: boolean; done: number; total: number; current: boolean }
export type TrailInput = {
  completed: (repId: string) => boolean
  inProgress: (repId: string) => boolean
  recallReady: (repId: string) => boolean
  lessonChecked: (skillId: string) => boolean
  skipStages?: number
}

/** Interleave lessons before the first rep that needs them, mark each rep's state, and end with project milestones. */
export function buildTrail(pathId: string, input: TrailInput): { stages: TrailStage[]; nextRepId?: string; done: number; total: number } {
  const path = paths.find(item => item.id === pathId) ?? paths[0]
  const placed = new Set<string>()
  let nextRepId: string | undefined
  const stages = path.stages.slice(input.skipStages ?? 0).map((stage): TrailStage => {
    const covered = stageCoveredByFoundations(path.id, stage.repIds)
    const nodes: TrailNode[] = []
    for (const repId of stage.repIds) {
      const rep = reps.find(item => item.id === repId)
      if (!rep) continue
      const lesson = skillsForRep(repId).find(skill => !placed.has(skill.id))
      if (lesson && !covered) {
        placed.add(lesson.id)
        nodes.push({ kind: 'lesson', id: `lesson:${lesson.id}`, skillId: lesson.id, title: lesson.title, state: input.lessonChecked(lesson.id) ? 'done' : 'open' })
      }
      let state: TrailNodeState = input.completed(repId) ? 'done' : !input.recallReady(repId) ? 'later' : input.inProgress(repId) ? 'draft' : 'open'
      if (!nextRepId && state !== 'done' && state !== 'later') { nextRepId = repId; state = 'next' }
      nodes.push({ kind: 'rep', id: `rep:${repId}`, repId, title: rep.title, role: repCurriculumRole(repId), state })
    }
    const repNodes = nodes.filter(node => node.kind === 'rep')
    return { title: stage.title, description: stage.description, nodes, covered, done: repNodes.filter(node => node.state === 'done').length, total: repNodes.length, current: repNodes.some(node => node.state === 'next') }
  })
  const projects = (pathApplications[path.id] ?? []).flatMap((application): TrailNode[] => {
    const rep = reps.find(item => item.id === application.repId)
    return rep ? [{ kind: 'project', id: `project:${rep.id}`, repId: rep.id, title: rep.title, reason: application.reason, state: input.completed(rep.id) ? 'done' : 'open' }] : []
  })
  if (projects.length) stages.push({ title: 'Apply this path in a project', description: 'Use these skills together in a larger task.', nodes: projects, covered: false, done: projects.filter(node => node.state === 'done').length, total: projects.length, current: false })
  const repIds = [...new Set(path.stages.slice(input.skipStages ?? 0).flatMap(stage => stage.repIds))]
  return { stages, nextRepId, done: repIds.filter(id => input.completed(id)).length, total: repIds.length }
}
