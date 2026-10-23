import { byCompletedAt, DAY_MS } from './dates.ts'
import { recurringReviews } from './fluency.ts'
import { getAllJourneys } from './learning.ts'
import type { JourneyProgress } from './learning.ts'
import type { PortableRecord } from './portability.ts'

// How skills grow and fade over time, worked out from completed attempts for the skill map: a skill's first attempt
// beside its retained one, retained skills whose next spaced review is due, and the map as it stood in earlier weeks.

/** Completed records with a real date that is not after `at`, oldest first. */
const until = (history: PortableRecord[], at: number) => history.filter(record => Date.parse(record.completedAt) <= at).sort(byCompletedAt)

/** The saved attempt behind a journey's evidence record (journeys keep only rep, date, and hints). */
const saved = (history: PortableRecord[], evidence?: { repId: string; completedAt: string }) =>
  evidence && history.find(record => record.repId === evidence.repId && record.completedAt === evidence.completedAt)

export type ThenAndNow = { first: PortableRecord; latest: PortableRecord; days: number }

/** For a retained skill: its first guided attempt and the recall that retained it, with the days between them. */
export function skillThenAndNow(progress: JourneyProgress, history: PortableRecord[]): ThenAndNow | null {
  const first = saved(history, progress.guided)
  const latest = saved(history, progress.retained || undefined)
  if (!first || !latest) return null
  return { first, latest, days: Math.round((Date.parse(latest.completedAt) - Date.parse(first.completedAt)) / DAY_MS) }
}

export type Fading = { repId: string; dueAt: number; lastHeld: number; heldDays: number }

/**
 * Retained skills whose next spaced review is due, keyed by skill: the evidence is still recorded, but the skill has
 * not been used for a while. `lastHeld` is the latest hint-free completion of any of the skill's reps.
 */
export function fadingSkills(history: PortableRecord[], now = Date.now()) {
  const fading = new Map<string, Fading>()
  const journeys = new Map(getAllJourneys(history, now).map(state => [state.journey.id, state.journey]))
  for (const review of recurringReviews(history, now)) {
    if (!review.due) continue
    const journey = journeys.get(review.skillId)!
    const reps = new Set([
      journey.guided,
      journey.independent,
      journey.recall,
      review.repId,
      ...review.evidence.map(record => record.repId),
    ])
    const lastHeld = Math.max(
      ...history.filter(record => reps.has(record.repId) && record.hintCount === 0).map(record => Date.parse(record.completedAt)),
    )
    fading.set(review.skillId, { repId: review.repId, dueAt: review.dueAt, lastHeld, heldDays: Math.floor((now - lastHeld) / DAY_MS) })
  }
  return fading
}

/** The end of each week (Sunday, last moment) from the first completed attempt's week to now, at most a year back. */
export function mapWeeks(history: PortableRecord[], now = new Date()) {
  const times = history.map(record => Date.parse(record.completedAt)).filter(time => Number.isFinite(time) && time <= now.getTime())
  if (!times.length) return []
  const first = new Date(Math.min(...times))
  const end = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + ((7 - date.getDay()) % 7), 23, 59, 59, 999)
  const weeks: number[] = []
  for (let week = end(first); week.getTime() < now.getTime() && weeks.length < 52; week.setDate(week.getDate() + 7))
    weeks.push(week.getTime())
  return [...weeks.slice(-51), now.getTime()]
}

/** Every journey as it stood at `at`, from the attempts completed by then. */
export const progressAt = (history: PortableRecord[], at: number) => getAllJourneys(until(history, at), at)
