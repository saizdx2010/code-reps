import { firstPath, paths } from './path.ts'
import { skillSummaryById as skillById, skillSummariesForRep as skillsForRep } from './skill-index.ts'
import { repLevel, repLevelLabels, type RepLevel } from './rep-levels.ts'
import { repIndex as reps } from './catalog-index.ts'

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

// Four bands per level, picked by how much the learner has to read and satisfy: brief words plus eight per check.
// A long brief with many checks takes longer than a short one at the same level. It never changes with learner speed.
const effortBands: Record<RepLevel, readonly [string, string, string, string]> = {
  1: ['10–20 minutes', '15–30 minutes', '20–40 minutes', '30–50 minutes'],
  2: ['15–30 minutes', '20–40 minutes', '30–50 minutes', '45–75 minutes'],
  3: ['30–45 minutes', '40–60 minutes', '50–75 minutes', '60–90 minutes'],
}
const effortLoadLimits = [100, 150, 300] as const
const longerFormats = new Set(['frontend', 'backend', 'refactor'])

/** Reading and checking load: words in the brief plus eight per check. */
export function effortLoad(entry: { briefWords: number; checkTotal: number }): number {
  return entry.briefWords + 8 * entry.checkTotal
}

/** A rough range for a first attempt. Longer for project-style formats; it never changes with learner speed. */
export function effortRange(repId: string): string {
  const level = repLevel(repId)
  const entry = reps.find(rep => rep.id === repId)
  if (!level) return '15–40 minutes'
  const load = entry ? effortLoad(entry) : 0
  const band = effortLoadLimits.filter(limit => load >= limit).length
  const base = effortBands[level][band]
  return entry?.format && longerFormats.has(entry.format) && level !== 3 ? `${base}, plus time to build` : base
}

const summary = (id: string): GuidanceRep => ({ id, title: reps.find(rep => rep.id === id)?.title ?? id, level: repLevel(id) })

/** The first path listing the rep, with the reps before it in order and its stage. */
function pathPosition(repId: string) {
  for (const path of paths) {
    const ordered = path.stages.flatMap(stage => [...stage.repIds] as string[])
    const index = ordered.indexOf(repId)
    if (index >= 0) return { path, ordered, before: ordered.slice(0, index), stage: path.stages.find(stage => (stage.repIds as readonly string[]).includes(repId))! }
  }
  return undefined
}

/**
 * Lessons linked to the rep (and the lessons those need), the nearest earlier unfinished reps in the same
 * stage, and a readiness checkpoint. The checkpoint appears when the level is two or more above anything
 * completed so far, or when the rep is Intermediate or above in a track where no Beginner rep is finished.
 * It is a suggestion; the learner can always continue.
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
  const jump = level !== undefined && level >= 2 && level - highest >= 2
  // Foundations is the start of the trail, so only the tracks need a Beginner rep finished first.
  const track = position && position.path.id !== firstPath.id ? position : undefined
  const trackBeginners = track ? track.ordered.filter(id => repLevel(id) === 1) : []
  const trackGap = level !== undefined && level >= 2 && !!track && !trackBeginners.some(id => completed.has(id))
  if (level && (jump || trackGap)) {
    const bridgeId = jump
      ? (position?.before ?? []).filter(id => !completed.has(id) && (repLevel(id) ?? 3) < level).sort((a, b) => (repLevel(b) ?? 0) - (repLevel(a) ?? 0))[0]
      : trackBeginners[0]
    const lesson = [...lessons.values()].find(item => linked.every(skill => skill.id !== item.id)) ?? [...lessons.values()][0]
    const progress = jump
      ? (highest ? `and the highest level you have finished is ${repLevelLabels[highest as RepLevel]}` : 'and you have not finished a rep yet')
      : `and you have not finished a Beginner rep in ${track!.path.title} yet`
    checkpoint = {
      message: `This is ${repLevelLabels[level]} work, ${progress}. Skim the lesson or try a nearer step first if the task looks unfamiliar. You can also continue with this rep now.`,
      bridgeRep: bridgeId ? summary(bridgeId) : undefined,
      lesson,
    }
  }
  return { level, effort: effortRange(repId), lessons: [...lessons.values()], priorReps, checkpoint }
}
