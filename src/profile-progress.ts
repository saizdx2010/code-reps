import type { PortableRecord } from './portability.ts'
import { DAY_MS } from './dates.ts'
import { journeys } from './learning.ts'

// Calendar dates use the learner's current local timezone, rather than 24-hour gaps.
export function dayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
}

/** A streak carries over at most one missed day in any seven: two carried-over days are at least this far apart. */
const restSpacing = 7
const recallRepIds = new Set(journeys.map(journey => journey.recall))

/** Completed records with a real date that is not in the future, oldest first. */
function validRecords(history: PortableRecord[], now: Date) {
  return history
    .filter(record => {
      const time = Date.parse(record.completedAt)
      return Number.isFinite(time) && time <= now.getTime()
    })
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
}

/**
 * Whether each completed attempt was new practice or a review: a journey's recall rep, or a rep completed before.
 * Keyed by record id.
 */
export function attemptKinds(history: PortableRecord[], now = new Date()) {
  const kinds = new Map<string, 'new' | 'review'>()
  const seen = new Set<string>()
  for (const record of validRecords(history, now)) {
    kinds.set(record.id, recallRepIds.has(record.repId) || seen.has(record.repId) ? 'review' : 'new')
    seen.add(record.repId)
  }
  return kinds
}

export type RhythmDay = {
  /** Local midnight of the day. */
  date: Date
  /** New practice wins over reviews on the same day; a rest day is a missed day the current streak carried over. */
  kind: 'new' | 'review' | 'rest' | 'none'
  today: boolean
}

/**
 * Practice days, the forgiving streak, and the last seven days.
 * Any completed attempt makes a practice day, reviews included. A streak counts practice days and carries over a single
 * missed day when it is followed by practice (or by today, still open) and no other carried-over day falls within seven
 * days of it. Two missed days in a row end the streak. Nothing is stored: everything comes from completed attempts.
 */
export function profileProgress(history: PortableRecord[], now = new Date()) {
  const today = dayNumber(now)
  const records = validRecords(history, now)
  const kinds = attemptKinds(records, now)
  const dayKinds = new Map<number, 'new' | 'review'>()
  for (const record of records) {
    const day = dayNumber(new Date(record.completedAt))
    if (dayKinds.get(day) !== 'new') dayKinds.set(day, kinds.get(record.id) ?? 'new')
  }
  const practiced = (day: number) => dayKinds.has(day)
  const streakEndingAt = (end: number) => {
    let length = 0
    const rests: number[] = []
    for (let cursor = end; ; cursor--) {
      if (practiced(cursor)) length++
      else if (practiced(cursor - 1) && (rests.length === 0 || rests[rests.length - 1] - cursor >= restSpacing)) rests.push(cursor)
      else break
    }
    return { length, rests }
  }
  // Today stays open: a streak that reached yesterday is still active until today ends.
  const current = streakEndingAt(practiced(today) ? today : today - 1)
  let longestStreak = current.length
  for (const day of dayKinds.keys()) longestStreak = Math.max(longestStreak, streakEndingAt(day).length)
  const week: RhythmDay[] = Array.from({ length: 7 }, (_, index) => {
    const day = today - 6 + index
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index)
    return { date, kind: dayKinds.get(day) ?? (current.rests.includes(day) ? 'rest' : 'none'), today: day === today }
  })
  return {
    currentStreak: current.length,
    /** Missed days the current streak carried over. */
    restDays: current.rests.length,
    longestStreak,
    /** Practice days among the last seven, today included. */
    recentDays: week.filter(day => day.kind === 'new' || day.kind === 'review').length,
    week,
    practiceDays: dayKinds.size,
    completedReps: new Set(records.map(record => record.repId)).size,
    attempts: records.length,
  }
}
