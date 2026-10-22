import { catalogTopic } from './catalog-labels.ts'
import type { JourneyProgress } from './learning.ts'
import type { PortableRecord } from './portability.ts'
import { repLevel } from './rep-levels.ts'
import { repSummaryById } from './rep-index.ts'
import { DAY_MS } from './dates.ts'

// A warm-up is three short Beginner reps the learner has already finished, started fresh. It is an ordinary set of
// attempts: completing one records practice like any other completion and grants no extra evidence.

export const warmupSize = 3

/**
 * Picks Beginner reps finished at least a day ago, the least recently practiced first, preferring different topics.
 * Unfinished drafts and recall reps that are not ready yet are left out, so a warm-up never spends an early recall.
 */
export function pickWarmup(
  history: PortableRecord[],
  progress: JourneyProgress[],
  inProgress: (repId: string) => boolean,
  now: number,
  size = warmupSize,
): string[] {
  const latest = new Map<string, number>()
  for (const record of history) {
    const time = Date.parse(record.completedAt)
    if (!Number.isFinite(time) || time > now) continue
    latest.set(record.repId, Math.max(latest.get(record.repId) ?? 0, time))
  }
  const waitingRecall = new Set(progress.filter(state => !state.recallDue && !state.retained).map(state => state.journey.recall))
  const candidates = [...latest]
    .filter(
      ([repId, time]) =>
        repSummaryById.has(repId) && repLevel(repId) === 1 && now - time >= DAY_MS && !inProgress(repId) && !waitingRecall.has(repId),
    )
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([repId]) => repId)
  const topic = (repId: string) => catalogTopic(repSummaryById.get(repId)!)
  const picked: string[] = []
  for (const repId of candidates) if (picked.length < size && !picked.some(id => topic(id) === topic(repId))) picked.push(repId)
  for (const repId of candidates) if (picked.length < size && !picked.includes(repId)) picked.push(repId)
  return picked
}

/** The warm-up stored as a session preference: rep IDs joined by commas, or empty when none is running. */
export const parseWarmup = (value: string) => value.split(',').filter(id => repSummaryById.has(id))
export const formatWarmup = (ids: string[]) => ids.join(',')

/** Where the current rep sits in a running warm-up, and the rep after it. */
export function warmupPosition(ids: string[], repId: string) {
  const index = ids.indexOf(repId)
  return index < 0 ? undefined : { index, total: ids.length, next: ids[index + 1] }
}

// Today as a set: the Today plan's open items in one run, warm-up reviews first, then the main (new) rep. Like a warm-up
// it is a session preference, so it never enters backups; each completion is an ordinary attempt.
export type SetItem = { repId: string; kind: 'review' | 'new' }
export const formatSet = (items: SetItem[]) => items.map(item => `${item.kind === 'new' ? 'n' : 'r'}:${item.repId}`).join(',')
export const parseSet = (value: string): SetItem[] =>
  value
    .split(',')
    .map(part => ({ kind: part.startsWith('n:') ? ('new' as const) : ('review' as const), repId: part.slice(2) }))
    .filter(item => repSummaryById.has(item.repId))
