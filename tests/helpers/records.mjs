/** ISO timestamp for midnight UTC on a calendar day; month is 1-based. */
export const utcDay = (year, month, day) => new Date(Date.UTC(year, month - 1, day)).toISOString()

/** A completed-attempt record with the fields journey and evidence rules read. */
export const completion = (repId, completedAt, hintCount = 0, extra = {}) => ({ repId, completedAt, hintCount, ...extra })
