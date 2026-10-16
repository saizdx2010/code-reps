import type { PortableRecord } from './portability.ts'
import type { PracticeAction } from './practice.ts'
import { attemptKinds, dayNumber } from './profile-progress.ts'

/** Reviews in a day's plan, alongside one new rep. */
export const todayReviewLimit = 2

export type TodayItem = {
  repId: string
  kind: 'new' | 'review'
  done: boolean
  /** How to open an item that is still to do. */
  action?: PracticeAction
}

/**
 * Today's plan: one new rep and up to two due reviews. An item is done when an attempt for it was completed today, so
 * the plan is recalculated from saved attempts rather than stored, and starts again at local midnight. Nothing is locked.
 */
export function todayPlan(
  history: PortableRecord[],
  plan: { next: PracticeAction | null; recommended: PracticeAction | null; due: PracticeAction[] },
  now = new Date(),
) {
  const today = dayNumber(now)
  const kinds = attemptKinds(history, now)
  const doneToday = history
    .filter(record => kinds.has(record.id) && dayNumber(new Date(record.completedAt)) === today)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
  const doneIds = (kind: 'new' | 'review') => [
    ...new Set(doneToday.filter(record => kinds.get(record.id) === kind).map(record => record.repId)),
  ]
  const dueIds = new Set(plan.due.map(action => action.repId))
  const items: TodayItem[] = []
  const [newDone] = doneIds('new')
  const fresh = [plan.next, plan.recommended].find(action => action && action.mode !== 'review' && !dueIds.has(action.repId))
  if (newDone) items.push({ repId: newDone, kind: 'new', done: true })
  else if (fresh) items.push({ repId: fresh.repId, kind: 'new', done: false, action: fresh })
  const reviews: TodayItem[] = doneIds('review')
    .filter(repId => repId !== newDone)
    .slice(0, todayReviewLimit)
    .map(repId => ({ repId, kind: 'review', done: true }))
  for (const action of plan.due) {
    if (reviews.length >= todayReviewLimit) break
    if (!reviews.some(item => item.repId === action.repId) && !items.some(item => item.repId === action.repId))
      reviews.push({ repId: action.repId, kind: 'review', done: false, action })
  }
  items.push(...reviews)
  const done = items.filter(item => item.done).length
  return {
    items,
    done,
    complete: items.length > 0 && done === items.length,
    /** Due reviews beyond the plan, for a quiet "see all" link. */
    moreDue: plan.due.filter(action => !items.some(item => item.repId === action.repId)).length,
    /** A lone, untouched new rep only repeats the next-practice panel, so the plan stays hidden. */
    shown: items.length > 1 || done > 0 || items.some(item => item.kind === 'review'),
  }
}
