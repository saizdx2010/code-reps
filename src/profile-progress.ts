import type { PortableRecord } from './portability.ts'
import { DAY_MS } from './dates.ts'

// Calendar dates use the learner's current local timezone, rather than 24-hour gaps.
function dayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
}

export function profileProgress(history: PortableRecord[], now = new Date()) {
  const today = dayNumber(now)
  const records = history.filter(record => {
    const date = new Date(record.completedAt)
    return Number.isFinite(date.getTime()) && date.getTime() <= now.getTime()
  })
  const completed = new Set(records.map(record => record.repId))
  const days = [...new Set(records.map(record => dayNumber(new Date(record.completedAt))))].sort((a, b) => a - b)
  let longestStreak = 0
  let run = 0
  for (let index = 0; index < days.length; index++) {
    run = index > 0 && days[index] === days[index - 1] + 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
  }
  let currentStreak = 0
  let cursor = days.includes(today) ? today : today - 1
  const activeDays = new Set(days)
  while (activeDays.has(cursor)) {
    currentStreak++
    cursor--
  }
  return { currentStreak, longestStreak, practiceDays: days.length, completedReps: completed.size, attempts: records.length }
}

export type CalendarDay = { date: string; count: number; future: boolean }

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/**
 * Completed attempts per local calendar day for the last `weeks` weeks, as week columns that start on Sunday. The last
 * column holds today; its later days are marked `future`. Repeated attempts on one day all count.
 */
export function activityCalendar(history: PortableRecord[], now = new Date(), weeks = 20) {
  const counts = new Map<string, number>()
  for (const record of history) {
    const date = new Date(record.completedAt)
    if (!Number.isFinite(date.getTime()) || date.getTime() > now.getTime()) continue
    const key = localDate(date)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - (weeks - 1) * 7)
  const columns: CalendarDay[][] = []
  let total = 0,
    activeDays = 0,
    busiest: CalendarDay | undefined
  for (let week = 0; week < weeks; week++) {
    const column: CalendarDay[] = []
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + weekday)
      const key = localDate(date)
      const future = dayNumber(date) > dayNumber(now)
      const day = { date: key, count: future ? 0 : (counts.get(key) ?? 0), future }
      total += day.count
      if (day.count) activeDays++
      if (day.count && (!busiest || day.count > busiest.count)) busiest = day
      column.push(day)
    }
    columns.push(column)
  }
  return { weeks: columns, total, activeDays, busiest }
}

/** Intensity bands for the calendar: none, one, two, three or four, and five or more attempts. */
export const activityLevel = (count: number) => (count >= 5 ? 4 : count >= 3 ? 3 : count)
