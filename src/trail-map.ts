import { pathApplications, pathExternalProjects, repCurriculumRole, stageHomeTrack } from './curriculum.ts'
import { skillSummariesForRep as skillsForRep } from './skill-index.ts'
import { paths } from './path.ts'
import { repIndex as reps } from './catalog-index.ts'

type TrailNodeState = 'done' | 'next' | 'draft' | 'later' | 'open'
export type TrailNode =
  | { kind: 'lesson'; id: string; skillId: string; title: string; state: 'done' | 'open' }
  | {
      kind: 'rep'
      id: string
      repId: string
      title: string
      role: string
      state: TrailNodeState
      inProgress: boolean
      /** When the rep was first completed (ms), for the walked part of the line. */
      completedAt?: number
      /** When a recall rep that is waiting opens (ms). */
      recallAt?: number
    }
  | { kind: 'project'; id: string; repId: string; title: string; reason: string; state: 'done' | 'open' }
  /** A self-reviewed project outside Code Reps: shown on the trail, never counted, never marked done. */
  | { kind: 'external'; id: string; projectId: string; title: string; reason: string; state: 'open' }
export type TrailStage = {
  title: string
  /** Fixed text for a stage the trail adds itself, such as projects; authored stages take theirs from src/path-text.ts. */
  description?: string
  nodes: TrailNode[]
  covered: boolean
  /** The track that owns this stage's reps, when the stage is a link to it. */
  coveredBy?: { id: string; title: string }
  done: number
  total: number
  current: boolean
  /** When a finished stage was finished: the latest of its reps' first completions. */
  finishedAt?: number
}
type TrailInput = {
  completed: (repId: string) => boolean
  /** A rep's first completion time (ms), which dates a finished stage and the walked part of the line. */
  completedAt?: (repId: string) => number | undefined
  inProgress: (repId: string) => boolean
  recallReady: (repId: string) => boolean
  lessonChecked: (skillId: string) => boolean
  skipStages?: number
  /** The recommended rep. When it is on this trail and available, it is the trail's next node, so the two never disagree. */
  focusRepId?: string
  /** When a waiting recall rep opens (ms), when known. */
  recallAt?: (repId: string) => number | undefined
}

/** Interleave lessons before the first rep that needs them, mark each rep's state, and end with project milestones. */
export function buildTrail(pathId: string, input: TrailInput): { stages: TrailStage[]; nextRepId?: string; done: number; total: number } {
  const path = paths.find(item => item.id === pathId) ?? paths[0]
  const placed = new Set<string>()
  const available = (repId: string) => !input.completed(repId) && input.recallReady(repId)
  const shown = path.stages.slice(input.skipStages ?? 0).flatMap(stage => stage.repIds)
  const nextRepId: string | undefined =
    input.focusRepId && shown.includes(input.focusRepId) && available(input.focusRepId) ? input.focusRepId : shown.find(available)
  let nextMarked = false
  const stages = path.stages.slice(input.skipStages ?? 0).map((stage): TrailStage => {
    const home = stageHomeTrack(path.id, stage.repIds)
    const covered = Boolean(home)
    const nodes: TrailNode[] = []
    for (const repId of stage.repIds) {
      const rep = reps.find(item => item.id === repId)
      if (!rep) continue
      const lesson = skillsForRep(repId).find(skill => !placed.has(skill.id))
      if (lesson && !covered) {
        placed.add(lesson.id)
        nodes.push({
          kind: 'lesson',
          id: `lesson:${lesson.id}`,
          skillId: lesson.id,
          title: lesson.title,
          state: input.lessonChecked(lesson.id) ? 'done' : 'open',
        })
      }
      const inProgress = input.inProgress(repId)
      const isNext = !nextMarked && repId === nextRepId
      if (isNext) nextMarked = true
      const state: TrailNodeState = input.completed(repId)
        ? 'done'
        : !input.recallReady(repId)
          ? 'later'
          : isNext
            ? 'next'
            : inProgress
              ? 'draft'
              : 'open'
      const completedAt = state === 'done' ? input.completedAt?.(repId) : undefined
      const recallAt = state === 'later' ? input.recallAt?.(repId) : undefined
      nodes.push({
        kind: 'rep',
        id: `rep:${repId}`,
        repId,
        title: rep.title,
        role: repCurriculumRole(repId),
        state,
        inProgress,
        ...(completedAt === undefined ? {} : { completedAt }),
        ...(recallAt === undefined ? {} : { recallAt }),
      })
    }
    const repNodes = nodes.filter(node => node.kind === 'rep')
    const finishedAt =
      repNodes.every(node => node.state === 'done') && Math.max(0, ...repNodes.map(node => input.completedAt?.(node.repId) ?? 0))
    return {
      title: stage.title,
      nodes,
      covered,
      ...(home ? { coveredBy: { id: home, title: paths.find(item => item.id === home)!.title } } : {}),
      done: repNodes.filter(node => node.state === 'done').length,
      total: repNodes.length,
      current: repNodes.some(node => node.state === 'next'),
      ...(finishedAt ? { finishedAt } : {}),
    }
  })
  const projects = (pathApplications[path.id] ?? []).flatMap((application): TrailNode[] => {
    const rep = reps.find(item => item.id === application.repId)
    return rep
      ? [
          {
            kind: 'project',
            id: `project:${rep.id}`,
            repId: rep.id,
            title: rep.title,
            reason: application.reason,
            state: input.completed(rep.id) ? 'done' : 'open',
          },
        ]
      : []
  })
  const external = (pathExternalProjects[path.id] ?? []).map((project): TrailNode => ({
    kind: 'external',
    id: `external:${project.projectId}`,
    projectId: project.projectId,
    title: project.title,
    reason: project.reason,
    state: 'open',
  }))
  if (projects.length || external.length)
    stages.push({
      title: 'Apply this track in a project',
      description: 'Use these skills together in a larger task.',
      nodes: [...projects, ...external],
      covered: false,
      done: projects.filter(node => node.state === 'done').length,
      total: projects.length,
      current: false,
    })
  const repIds = [...new Set(path.stages.slice(input.skipStages ?? 0).flatMap(stage => stage.repIds))]
  return { stages, nextRepId, done: repIds.filter(id => input.completed(id)).length, total: repIds.length }
}
