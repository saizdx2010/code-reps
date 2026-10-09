import { paths } from './path.ts'
import { skillById, skillsForRep } from './knowledge.ts'
import { repLevel, repLevelLabels, type RepLevel } from './rep-levels.ts'
import { reps } from './rep.ts'

// Guidance is derived from authored levels, path order, and linked lessons. It is a planning aid:
// nothing here gates access, and nothing infers proficiency from how quickly a learner works.

export type GuidanceLesson = { id: string; title: string }
export type GuidanceRep = { id: string; title: string; level?: RepLevel }
export type ReadinessCheckpoint = { message: string; bridgeRep?: GuidanceRep; lesson?: GuidanceLesson }
export type RepGuidance = {
  level?: RepLevel
  effort: string
  lessons: GuidanceLesson[]
  priorReps: GuidanceRep[]
  checkpoint?: ReadinessCheckpoint
}

const effortByLevel: Record<RepLevel, string> = { 1: '10–20 minutes', 2: '20–40 minutes', 3: '40–60 minutes' }
const longerFormats = new Set(['frontend', 'backend', 'refactor'])

/** A rough range for a first attempt. Longer for project-style formats; it never changes with learner speed. */
export function effortRange(repId: string): string {
  const level = repLevel(repId)
  const format = reps.find(rep => rep.id === repId)?.format
  const base = level ? effortByLevel[level] : '15–40 minutes'
  return format && longerFormats.has(format) && level !== 3 ? `${base}, plus time to build` : base
}

const summary = (id: string): GuidanceRep => ({ id, title: reps.find(rep => rep.id === id)?.title ?? id, level: repLevel(id) })

/** The first path listing the rep, with the reps before it in order and its stage. */
function pathPosition(repId: string) {
  for (const path of paths) {
    const ordered = path.stages.flatMap(stage => [...stage.repIds] as string[])
    const index = ordered.indexOf(repId)
    if (index >= 0) return { before: ordered.slice(0, index), stage: path.stages.find(stage => (stage.repIds as readonly string[]).includes(repId))! }
  }
  return undefined
}

/**
 * Lessons linked to the rep (and the lessons those need), the nearest earlier unfinished reps in the same
 * stage, and a readiness checkpoint when the level is two or more above anything completed so far.
 */
export function getRepGuidance(repId: string, completedRepIds: Iterable<string>): RepGuidance {
  const completed = new Set(completedRepIds)
  const level = repLevel(repId)
  const lessons = new Map<string, GuidanceLesson>()
  const linked = skillsForRep(repId)
  for (const skill of linked) {
    for (const id of [...skill.prerequisites, skill.id]) {
      const found = skillById(id)
      if (found) lessons.set(found.id, { id: found.id, title: found.title })
    }
  }
  const position = pathPosition(repId)
  const stageIds = position ? (position.stage.repIds as readonly string[]) : []
  const priorInStage = stageIds.slice(0, stageIds.indexOf(repId)).filter(id => !completed.has(id))
  const priorReps = priorInStage.slice(-2).map(summary)

  let checkpoint: ReadinessCheckpoint | undefined
  const highest = Math.max(0, ...[...completed].map(id => repLevel(id) ?? 0))
  if (level && level >= 2 && level - highest >= 2) {
    const bridgeId = (position?.before ?? []).filter(id => !completed.has(id) && (repLevel(id) ?? 3) < level)
      .sort((a, b) => (repLevel(b) ?? 0) - (repLevel(a) ?? 0))[0]
    const lesson = [...lessons.values()].find(item => linked.every(skill => skill.id !== item.id)) ?? [...lessons.values()][0]
    checkpoint = {
      message: `This is ${repLevelLabels[level]} work, ${highest ? `and the highest level you have finished is ${repLevelLabels[highest as RepLevel]}` : 'and you have not finished a rep yet'}. Skim the lesson or try a nearer step first if the task looks unfamiliar. You can also continue with this rep now.`,
      bridgeRep: bridgeId ? summary(bridgeId) : undefined,
      lesson,
    }
  }
  return { level, effort: effortRange(repId), lessons: [...lessons.values()], priorReps, checkpoint }
}
