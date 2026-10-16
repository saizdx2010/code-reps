import type { PortableRecord } from './portability.ts'
import { DAY_MS } from './dates.ts'
import { getJourney, journeys } from './learning.ts'

/** A recall counts as "held" once at least this many days separate it from the skill's first hint-free rep. */
export const recallHeldDays = 14

export type PersonalBest =
  | { kind: 'recall'; days: number }
  | { kind: 'no-hints'; previousHints: number; scope: 'skill' | 'rep' }
  | { kind: 'fewer-hints'; hints: number; previousHints: number; previousAt: string }

/**
 * At most one honest note about growth for one completed attempt, compared only with the learner's own earlier
 * attempts. In priority order:
 * - recall held: a skill's recall rep solved without hints, at least two weeks after its first hint-free rep;
 * - no hints: a hint-free attempt whose previous attempt on the same skill (or rep, outside a skill) used hints;
 * - fewer hints: a repeat of the same rep with fewer hints than last time, but still at least one.
 * First attempts, ties, worse attempts, and invalid or future dates never produce a note. Nothing is stored.
 */
export function personalBest(history: PortableRecord[], recordId: string, now = Date.now()): PersonalBest | null {
  const valid = history.filter(record => {
    const time = Date.parse(record.completedAt)
    return Number.isFinite(time) && time <= now
  })
  const record = valid.find(item => item.id === recordId)
  if (!record) return null
  const at = Date.parse(record.completedAt)
  const earlier = valid
    .filter(item => item.id !== record.id && Date.parse(item.completedAt) < at)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
  const journey = journeys.find(item => [item.guided, item.independent, item.recall, ...(item.practice ?? [])].includes(record.repId))
  if (journey?.recall === record.repId && record.hintCount === 0) {
    const independent = getJourney(journey, earlier, at).independent
    const days = independent ? Math.floor((at - Date.parse(independent.completedAt)) / DAY_MS) : 0
    if (days >= recallHeldDays) return { kind: 'recall', days }
  }
  if (record.hintCount === 0) {
    const scope = journey ? [journey.guided, journey.independent, journey.recall, ...(journey.practice ?? [])] : [record.repId]
    const previous = earlier.filter(item => scope.includes(item.repId)).at(-1)
    return previous && previous.hintCount > 0
      ? { kind: 'no-hints', previousHints: previous.hintCount, scope: journey ? 'skill' : 'rep' }
      : null
  }
  const previous = earlier.filter(item => item.repId === record.repId).at(-1)
  return previous && previous.hintCount > record.hintCount
    ? { kind: 'fewer-hints', hints: record.hintCount, previousHints: previous.hintCount, previousAt: previous.completedAt }
    : null
}
