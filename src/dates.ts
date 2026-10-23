// Fixed-length day arithmetic and ordering for completed records.
export const DAY_MS = 86_400_000

/** Oldest first; use `(a, b) => byCompletedAt(b, a)` for newest first. */
export const byCompletedAt = (a: { completedAt: string }, b: { completedAt: string }) =>
  Date.parse(a.completedAt) - Date.parse(b.completedAt)

// Calendar dates use the learner's current local timezone, rather than 24-hour gaps.
export function dayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
}
