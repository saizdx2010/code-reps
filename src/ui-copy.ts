/** Use the count of the named thing (the total for “1 of 1 rep”). */
export function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}

/** A readable local date shared by Progress and the Journal. */
export function formatDate(value: string | number, includeTime = false): string {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } as const : {}),
  })
}
