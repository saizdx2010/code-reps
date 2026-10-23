import { skillIndex } from './catalog-index.ts'
import type { LearningNote } from './fluency.ts'
import { getAllJourneys } from './learning.ts'
import { paths } from './path.ts'
import type { PortableRecord } from './portability.ts'
import { buildSkillMap } from './skill-map.ts'
import { trackRepIds } from './stage-closeout.ts'

// A finished track, worked out from saved attempts: when it started and finished, the first and last reps, and the skill
// evidence it holds now. Finishing means every required rep is completed at least once, hints included; independence
// and retention are separate evidence, reported from the skill journeys.

type TrackSkill = { id: string; title: string; state: 'independent' | 'retained' }
export type TrackFinish = {
  pathId: string
  title: string
  repCount: number
  /** The first completion of any rep in the track. */
  first: PortableRecord
  /** The completion that finished the track: the latest of each rep's first completion. */
  last: PortableRecord
  /** Calendar days from the first completion to the finish, both counted. */
  days: number
  /** Days with a completed attempt at one of the track's reps, between the first completion and the finish. */
  practiceDays: number
  /** The track's skills that are Independent or Retained now; a due review counts as Independent. */
  skills: TrackSkill[]
  skillTotal: number
}

const DAY = 86_400_000
const calendarDay = (time: number) => {
  const date = new Date(time)
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY
}

/** Each rep's earliest valid completion, as badges count them: invalid and future dates are left out. */
function firstCompletions(history: PortableRecord[], now: number) {
  const first = new Map<string, PortableRecord>()
  for (const record of history) {
    const time = Date.parse(record.completedAt)
    if (!Number.isFinite(time) || time > now) continue
    const known = first.get(record.repId)
    if (!known || time < Date.parse(known.completedAt)) first.set(record.repId, record)
  }
  return first
}

const pathById = (pathId: string) => paths.find(path => path.id === pathId)

/** How many of a track's required reps are completed. */
export function trackProgress(pathId: string, history: PortableRecord[], now = Date.now()) {
  const path = pathById(pathId)
  const ids = path ? trackRepIds(path) : []
  const first = firstCompletions(history, now)
  return { done: ids.filter(id => first.has(id)).length, total: ids.length }
}

/** The finished track, or null while any required rep is still to complete. */
export function trackFinish(pathId: string, history: PortableRecord[], now = Date.now()): TrackFinish | null {
  const path = pathById(pathId)
  if (!path) return null
  const ids = trackRepIds(path)
  const first = firstCompletions(history, now)
  if (!ids.length || !ids.every(id => first.has(id))) return null
  const finishing = ids.map(id => first.get(id)!).sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
  const start = Date.parse(finishing[0].completedAt)
  const end = Date.parse(finishing.at(-1)!.completedAt)
  const inTrack = new Set<string>(ids)
  const days = new Set(
    history
      .filter(record => inTrack.has(record.repId))
      .map(record => Date.parse(record.completedAt))
      .filter(time => time >= start && time <= end)
      .map(calendarDay),
  )
  const map = buildSkillMap(path.id, getAllJourneys(history, now))
  const skills = map.stages.flatMap(stage =>
    stage.nodes.flatMap((node): TrackSkill[] =>
      node.state === 'retained' || node.state === 'independent' || node.state === 'due'
        ? [{ id: node.id, title: node.title, state: node.state === 'retained' ? 'retained' : 'independent' }]
        : [],
    ),
  )
  return {
    pathId: path.id,
    title: path.title,
    repCount: ids.length,
    first: finishing[0],
    last: finishing.at(-1)!,
    days: calendarDay(end) - calendarDay(start) + 1,
    practiceDays: days.size,
    skills,
    skillTotal: map.total,
  }
}

/** Finished tracks, most recently finished first. */
export function finishedTracks(history: PortableRecord[], now = Date.now()): TrackFinish[] {
  return paths
    .flatMap(path => trackFinish(path.id, history, now) ?? [])
    .sort((a, b) => Date.parse(b.last.completedAt) - Date.parse(a.last.completedAt))
}

/** Notebook entries linked to a track: written about one of its reps, or about a lesson that one of its reps practices. */
export function trackNotes(pathId: string, notes: readonly LearningNote[]): LearningNote[] {
  const path = pathById(pathId)
  if (!path) return []
  const repIds = new Set<string>(trackRepIds(path))
  const lessons = new Set(skillIndex.filter(skill => skill.repIds.some(id => repIds.has(id))).map(skill => skill.id))
  return notes.filter(note => (note.skillId && lessons.has(note.skillId)) || (note.repId && repIds.has(note.repId)))
}
