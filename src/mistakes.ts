import { byCompletedAt, DAY_MS } from './dates.ts'

// Self-reported mistake tags. IDs are stored on attempts and in backups: never rename or reuse one.
export const mistakeTags = [
  { id: 'off-by-one', label: 'Off-by-one' },
  { id: 'mutated-input', label: 'Mutated the input' },
  { id: 'missed-empty-case', label: 'Missed the empty case' },
  { id: 'wrong-boundary-condition', label: 'Wrong boundary condition' },
  { id: 'misread-contract', label: 'Misread the contract' },
  { id: 'type-or-null-handling', label: 'Type or null handling' },
  { id: 'other', label: 'Something else' },
] as const

type MistakeTagId = (typeof mistakeTags)[number]['id']

/**
 * Lessons that address each tag, by knowledge skill ID, with one practice habit. A suggestion only: tags are
 * self-reported, and revisiting a lesson does not establish that the mistake is fixed.
 */
export const mistakeHelp: Record<MistakeTagId, { lessons: string[]; habit: string }> = {
  'off-by-one': {
    lessons: ['control-flow', 'array-techniques'],
    habit: 'Trace the first and last loop turns by hand and say which index each one reads.',
  },
  'mutated-input': {
    lessons: ['reference-identity', 'sorting-basics'],
    habit: 'Copy before sorting, splicing, or pushing, and check the input after a run.',
  },
  'missed-empty-case': { lessons: ['arrays', 'testing'], habit: 'Write the empty input and its expected result in your plan first.' },
  'wrong-boundary-condition': {
    lessons: ['testing', 'array-techniques'],
    habit: 'Name the values just below, at, and just above each limit, and decide which side each belongs to.',
  },
  'misread-contract': {
    lessons: ['validation', 'testing'],
    habit: 'Restate the rules in your own words, in order, before planning.',
  },
  'type-or-null-handling': {
    lessons: ['typescript-boundaries', 'values'],
    habit: 'Ask what each value can be, including null, undefined, and zero, before reading from it.',
  },
  other: { lessons: [], habit: 'Write one sentence in the Notebook about what went wrong, so you notice it next time.' },
}
const known = new Set<string>(mistakeTags.map(tag => tag.id))
const isMistakeTag = (value: unknown): value is MistakeTagId => typeof value === 'string' && known.has(value)

/** Keeps known tag IDs once each, in catalog order. Anything else (unknown IDs, non-strings, non-arrays) is dropped. Returns undefined when no tag remains. */
export function normalizeMistakes(value: unknown): MistakeTagId[] | undefined {
  if (!Array.isArray(value)) return undefined
  const present = new Set(value.filter(isMistakeTag))
  const tags = mistakeTags.map(tag => tag.id).filter(id => present.has(id))
  return tags.length ? tags : undefined
}

type MistakeSource = { id: string; repId: string; completedAt: string; mistakes?: unknown }
type MistakeOccurrence = { attemptId: string; repId: string; completedAt: string }
export type MistakeTrend = 'new' | 'more' | 'fewer' | 'same' | 'none'
type MistakeGroup = {
  id: MistakeTagId
  label: string
  total: number
  recent: number
  earlier: number
  trend: MistakeTrend
  occurrences: MistakeOccurrence[]
}

export const trendWindowDays = 14

/**
 * Groups self-reported tags by ID. "Recent" is the last 14 days; "earlier" is the 14 days before that.
 * Occurrences are newest first, limited to `limit` per tag. Unused tags are omitted; groups sort by total, then recency.
 */
export function summarizeMistakes(history: MistakeSource[], now: number, limit = 5): MistakeGroup[] {
  const recentStart = now - trendWindowDays * DAY_MS
  const earlierStart = recentStart - trendWindowDays * DAY_MS
  const groups = new Map<MistakeTagId, MistakeOccurrence[]>()
  for (const record of history) {
    const time = Date.parse(record.completedAt)
    const tags = normalizeMistakes(record.mistakes)
    if (!tags || !Number.isFinite(time)) continue
    for (const id of tags)
      groups.set(id, [...(groups.get(id) ?? []), { attemptId: record.id, repId: record.repId, completedAt: record.completedAt }])
  }
  return mistakeTags
    .flatMap(({ id, label }) => {
      const all = [...(groups.get(id) ?? [])].sort((a, b) => byCompletedAt(b, a))
      if (!all.length) return []
      const at = (item: MistakeOccurrence) => Date.parse(item.completedAt)
      const recent = all.filter(item => at(item) > recentStart && at(item) <= now).length
      const earlier = all.filter(item => at(item) > earlierStart && at(item) <= recentStart).length
      const older = all.filter(item => at(item) <= earlierStart).length
      const trend: MistakeTrend =
        recent === 0 && earlier === 0
          ? 'none'
          : earlier === 0 && older === 0
            ? 'new'
            : recent > earlier
              ? 'more'
              : recent < earlier
                ? 'fewer'
                : 'same'
      return [{ id, label, total: all.length, recent, earlier, trend, occurrences: all.slice(0, limit) }]
    })
    .sort((a, b) => b.total - a.total || Date.parse(b.occurrences[0].completedAt) - Date.parse(a.occurrences[0].completedAt))
}
