import { dayNumber } from './dates.ts'
import type { PortableRecord } from './portability.ts'

// Coming back: how long since the last practice day, and whether the rhythm has slowed, worked out from completed
// attempts. The bridges out of the app (a calendar file and an in-app reminder) are in calendar-file.ts and reminders.ts.

/** After this many days without a completed attempt, Trail offers a gentle way back in. */
export const awayDays = 3

/** Local calendar days with a completed attempt, ignoring invalid and future dates. */
function practiceDays(history: PortableRecord[], now: Date) {
  const days = new Set<number>()
  for (const record of history) {
    const time = Date.parse(record.completedAt)
    if (Number.isFinite(time) && time <= now.getTime()) days.add(dayNumber(new Date(time)))
  }
  return days
}

/** Whole days since the last practice day, or null before any practice. */
export function daysAway(history: PortableRecord[], now = new Date()) {
  const days = practiceDays(history, now)
  if (!days.size) return null
  return dayNumber(now) - Math.max(...days)
}

/** The span each half of the rhythm comparison covers. */
const rhythmSpan = 14

/**
 * A slowing rhythm: practice days in the last two weeks against the two weeks before. It only speaks when there was a
 * rhythm to lose (four or more days before) and the recent half holds at most half as many, with at least one day, so
 * a learner who has stopped altogether gets the welcome back instead.
 */
export function rhythmDrop(history: PortableRecord[], now = new Date()) {
  const days = practiceDays(history, now)
  const today = dayNumber(now)
  const count = (from: number, to: number) => [...days].filter(day => day > from && day <= to).length
  const recent = count(today - rhythmSpan, today)
  const before = count(today - 2 * rhythmSpan, today - rhythmSpan)
  if (before < 4 || recent === 0 || recent > before / 2) return null
  return {
    recent,
    before,
    /** A lighter weekly target that the recent rhythm already reaches. */
    lighterTarget: Math.max(1, Math.ceil(recent / 2)),
  }
}
