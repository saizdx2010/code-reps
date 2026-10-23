import type { PortableRecord } from './portability.ts'
import { DAY_MS, dayNumber } from './dates.ts'

// A weekly target instead of a daily streak: this Monday-to-Sunday week against the days the learner aims for, worked
// out from completed attempts.

/** Monday of the local week holding `day`, as a day number. */
const weekStart = (day: number) => day - ((new Date(day * DAY_MS).getUTCDay() + 6) % 7)

/** Local calendar days with a completed attempt, ignoring invalid and future dates. */
function practiceDays(history: PortableRecord[], now: Date) {
  const days = new Set<number>()
  for (const record of history) {
    const time = Date.parse(record.completedAt)
    if (Number.isFinite(time) && time <= now.getTime()) days.add(dayNumber(new Date(time)))
  }
  return days
}

export type WeekDay = { date: Date; practiced: boolean; today: boolean; future: boolean }

/**
 * This Monday-to-Sunday week against the target. A week counts once it reaches the target; `weeksMet` is the run of
 * met weeks ending with this one (if met) or last week, so an unfinished week never breaks the run before it ends.
 */
export function weekProgress(history: PortableRecord[], target: number, now = new Date()) {
  const days = practiceDays(history, now)
  const today = dayNumber(now)
  const start = weekStart(today)
  const count = (from: number) => Array.from({ length: 7 }, (_, index) => from + index).filter(day => days.has(day)).length
  const done = count(start)
  const met = done >= target
  let weeksMet = met ? 1 : 0
  for (let from = start - 7; count(from) >= target; from -= 7) weeksMet++
  const week: WeekDay[] = Array.from({ length: 7 }, (_, index) => ({
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (today - start) + index),
    practiced: days.has(start + index),
    today: start + index === today,
    future: start + index > today,
  }))
  return {
    target,
    done,
    met,
    weeksMet,
    /** Days left in this week, today included. */
    daysLeft: start + 7 - today,
    practicedToday: days.has(today),
    week,
  }
}
