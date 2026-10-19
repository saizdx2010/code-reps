import { firstPath, paths } from './path.ts'
import type { PortableRecord } from './portability.ts'
import { plural } from './ui-copy.ts'
import { evidenceBadges } from './evidence-badges.ts'
import { stageHomeTrack } from './curriculum.ts'

/** The path shape badges read. Passing a changed catalog shows how badges follow a path edit. */
type BadgeCatalog = readonly { id: string; title: string; stages: readonly { title: string; repIds: readonly string[] }[] }[]

/** Completion badges (first rep, stage, track) are round; evidence badges (independence, retention, rhythm) are square. */
type BadgeKind = 'first' | 'stage' | 'path' | 'evidence'
export type Badge = {
  id: string
  kind: BadgeKind
  name: string
  rule: string
  earned: boolean
  completed: number
  total: number
  /** Latest first-completion among the required reps; absent when not earned. */
  earnedAt?: string
  /** Path to open for supporting work. */
  pathId?: string
  /** A rep that is the supporting work: the next unfinished rep, or the first one once earned. */
  repId: string
  /** What earned it, in a sentence, for an earned evidence badge. */
  detail?: string
}

// Completed attempts only: unfinished drafts and ended sessions never become PortableRecords.
// Invalid and future dates are ignored, and each rep counts once at its earliest valid completion.
function firstCompletions(history: PortableRecord[], now: Date) {
  const first = new Map<string, number>()
  for (const record of history) {
    const time = Date.parse(record.completedAt)
    if (!Number.isFinite(time) || time > now.getTime()) continue
    const known = first.get(record.repId)
    if (known === undefined || time < known) first.set(record.repId, time)
  }
  return first
}

function build(first: Map<string, number>, base: Pick<Badge, 'id' | 'kind' | 'name' | 'rule' | 'pathId'>, repIds: string[]): Badge {
  const completed = repIds.filter(id => first.has(id)).length
  const earned = repIds.length > 0 && completed === repIds.length
  const next = repIds.find(id => !first.has(id)) ?? repIds[0]
  return {
    ...base,
    earned,
    completed,
    total: repIds.length,
    repId: next,
    earnedAt: earned ? new Date(Math.max(...repIds.map(id => first.get(id)!))).toISOString() : undefined,
  }
}

/**
 * Badges are derived from the current path definitions on every render; nothing is awarded or stored.
 * A required rep added to an earned stage stops its badge showing as earned, with the completed count kept,
 * and a rep removed from a path stops being required. Completed attempts keep counting either way.
 */
export function profileBadges(history: PortableRecord[], now = new Date(), catalog: BadgeCatalog = paths): Badge[] {
  const first = firstCompletions(history, now)
  const badges: Badge[] = []
  const starter = firstPath.stages[0].repIds[0]
  // "Any rep" has no fixed rep list, so its progress is capped at one.
  const earliest = first.size ? Math.min(...first.values()) : undefined
  const earliestId = [...first].find(([, time]) => time === earliest)?.[0]
  badges.push({
    id: 'first-rep',
    kind: 'first',
    name: 'First rep',
    rule: 'Complete any one rep.',
    earned: first.size > 0,
    completed: Math.min(first.size, 1),
    total: 1,
    earnedAt: earliest === undefined ? undefined : new Date(earliest).toISOString(),
    repId: earliestId ?? starter,
  })
  for (const path of catalog) {
    path.stages.forEach((stage, index) => {
      const ids = [...new Set<string>(stage.repIds)]
      // A stage made only of another track's reps (Foundations, or SQL in Backend) is earned in that track, not repeated.
      if (stageHomeTrack(path.id, ids)) return
      badges.push(
        build(
          first,
          {
            id: `${path.id}:stage:${index}`,
            kind: 'stage',
            name: stage.title,
            rule: `Complete all ${ids.length} ${plural(ids.length, 'rep')} in “${stage.title}” (${path.title}).`,
            pathId: path.id,
          },
          ids,
        ),
      )
    })
    const ids = [...new Set(path.stages.flatMap(stage => [...stage.repIds]))]
    badges.push(
      build(
        first,
        {
          id: `${path.id}:path`,
          kind: 'path',
          name: `${path.title} track`,
          rule: `Complete every rep in the ${path.title} track.`,
          pathId: path.id,
        },
        ids,
      ),
    )
  }
  return [...badges, ...evidenceBadges(history, now)]
}

/** Earned badges the learner has not been shown yet, given the badge IDs already acknowledged in this session. */
export function unacknowledgedBadges(badges: Badge[], acknowledged: readonly string[]): Badge[] {
  const known = new Set(acknowledged)
  return badges.filter(badge => badge.earned && !known.has(badge.id))
}
