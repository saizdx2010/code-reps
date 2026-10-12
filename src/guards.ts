// Shape checks shared by stored-data and backup validation.
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A string `Date.parse` accepts, optionally capped at `maxLength` characters. */
export const isDateString = (value: unknown, maxLength = Infinity): value is string =>
  typeof value === 'string' && value.length <= maxLength && Number.isFinite(Date.parse(value))
