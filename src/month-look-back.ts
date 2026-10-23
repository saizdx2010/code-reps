import { profileBadges } from './badges.ts'
import { DAY_MS } from './dates.ts'
import { getAllJourneys } from './learning.ts'
import { mistakeTags, normalizeMistakes } from './mistakes.ts'
import type { PortableRecord } from './portability.ts'
import { skillState } from './skill-map.ts'

// A look back over the last thirty days, built only from completed attempts: what moved, what was earned, which tagged
// mistakes came up less, and which reps went cleanly after hints before. It compares the learner only with themselves
// and is not a measure of skill.

export const monthDays = 30

const rank = { untouched: 0, practiced: 1, independent: 2, due: 2, retained: 3 } as const

export function monthLookBack(history: PortableRecord[], now: number) {
  const start = now - monthDays * DAY_MS
  const valid = history.filter(record => {
    const time = Date.parse(record.completedAt)
    return Number.isFinite(time) && time <= now
  })
  const within = (from: number, to: number) =>
    valid.filter(record => Date.parse(record.completedAt) > from && Date.parse(record.completedAt) <= to)
  const month = within(start, now)
  const previous = within(start - monthDays * DAY_MS, start)
  const before = getAllJourneys(
    valid.filter(record => Date.parse(record.completedAt) <= start),
    start,
  )
  const skills = getAllJourneys(valid, now).flatMap((after, index) => {
    const from = skillState(before[index])
    const to = skillState(after)
    return rank[to] > rank[from] && rank[to] >= 2
      ? [{ title: after.journey.title, to: to === 'retained' ? 'Retained' : 'Independent' }]
      : []
  })
  const badges = profileBadges(valid, new Date(now)).filter(
    badge => badge.earned && badge.earnedAt && Date.parse(badge.earnedAt) > start && Date.parse(badge.earnedAt) <= now,
  )
  const tagCounts = (records: PortableRecord[]) => {
    const counts = new Map<string, number>()
    for (const tag of records.flatMap(record => normalizeMistakes(record.mistakes) ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    return counts
  }
  const nowTags = tagCounts(month)
  const beforeTags = tagCounts(previous)
  const fewerMistakes = mistakeTags
    .filter(tag => (beforeTags.get(tag.id) ?? 0) > (nowTags.get(tag.id) ?? 0))
    .map(tag => ({ label: tag.label, before: beforeTags.get(tag.id)!, now: nowTags.get(tag.id) ?? 0 }))
  // A rep once finished only with hints, now finished without any.
  const nowClean = [
    ...new Set(
      month
        .filter(record => record.hintCount === 0)
        .filter(record =>
          valid.some(
            earlier =>
              earlier.repId === record.repId &&
              earlier.hintCount > 0 &&
              Date.parse(earlier.completedAt) < Date.parse(record.completedAt) &&
              !valid.some(
                clean =>
                  clean.repId === record.repId && clean.hintCount === 0 && Date.parse(clean.completedAt) < Date.parse(record.completedAt),
              ),
          ),
        )
        .map(record => record.repId),
    ),
  ]
  return {
    from: new Date(start).toISOString(),
    attempts: month.length,
    previousAttempts: previous.length,
    practiceDays: new Set(month.map(record => new Date(record.completedAt).toDateString())).size,
    skills,
    badges: badges.map(badge => badge.name),
    fewerMistakes,
    nowClean,
  }
}

export type MonthLookBack = ReturnType<typeof monthLookBack>
