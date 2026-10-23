import type { FluencyState, NextUp } from './fluency.ts'
import type { PortableRecord } from './portability.ts'

// The daily loop's saved parts, kept small because Trail needs them at startup: the weekly target and the rep chosen for
// next time. The week against the target (week-progress.ts) and what today held (today-plan.ts) are recalculated from
// attempts, so a missed day never has to be repaired.

/** Practice days a week, when the learner has not chosen a number: their practice days, or three. */
export function weeklyTarget(goal: FluencyState['goal']) {
  if (goal.weekly) return goal.weekly
  return Math.min(7, Math.max(1, goal.days.length || 3))
}

/** The chosen next rep, until an attempt at it is completed after it was chosen; a rep no longer in the catalog is dropped. */
export function plannedNext(nextUp: NextUp | undefined, history: PortableRecord[], known: (repId: string) => boolean) {
  if (!nextUp || !known(nextUp.repId)) return null
  const chosen = Date.parse(nextUp.setAt)
  const finished = history.some(record => record.repId === nextUp.repId && Date.parse(record.completedAt) >= chosen)
  return finished ? null : nextUp
}

/** The longest note to a future self. */
export const nextNoteLimit = 280
