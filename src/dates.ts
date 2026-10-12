// Fixed-length day arithmetic and ordering for completed records.
export const DAY_MS = 86_400_000

/** Oldest first; use `(a, b) => byCompletedAt(b, a)` for newest first. */
export const byCompletedAt = (a: { completedAt: string }, b: { completedAt: string }) => Date.parse(a.completedAt) - Date.parse(b.completedAt)
