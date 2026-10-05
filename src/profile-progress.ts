import { paths } from './path.ts'
import type { PortableRecord } from './portability.ts'

// Calendar dates use the learner's current local timezone, rather than 24-hour gaps.
function dayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
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
  while (activeDays.has(cursor)) { currentStreak++; cursor-- }
  const badges = paths.map(path => {
    const ids = [...new Set(path.stages.flatMap(stage => [...stage.repIds]))]
    const count = ids.filter(id => completed.has(id)).length
    return { id: path.id, title: path.title, completed: count, total: ids.length, earned: count === ids.length }
  })
  return { currentStreak, longestStreak, practiceDays: days.length, completedReps: completed.size, attempts: records.length, badges }
}
