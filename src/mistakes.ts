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

export type MistakeTagId = typeof mistakeTags[number]['id']
const known = new Set<string>(mistakeTags.map(tag => tag.id))
export const mistakeLabel = (id: string) => mistakeTags.find(tag => tag.id === id)?.label ?? id
export const isMistakeTag = (value: unknown): value is MistakeTagId => typeof value === 'string' && known.has(value)

/** Keeps known tag IDs once each, in catalog order. Anything else (unknown IDs, non-strings, non-arrays) is dropped. Returns undefined when no tag remains. */
export function normalizeMistakes(value: unknown): MistakeTagId[] | undefined {
  if (!Array.isArray(value)) return undefined
  const present = new Set(value.filter(isMistakeTag))
  const tags = mistakeTags.map(tag => tag.id).filter(id => present.has(id))
  return tags.length ? tags : undefined
}

export type MistakeSource = { id: string; repId: string; completedAt: string; mistakes?: unknown }
export type MistakeOccurrence = { attemptId: string; repId: string; completedAt: string }
export type MistakeTrend = 'new' | 'more' | 'fewer' | 'same' | 'none'
export type MistakeGroup = { id: MistakeTagId; label: string; total: number; recent: number; earlier: number; trend: MistakeTrend; occurrences: MistakeOccurrence[] }

const day = 86_400_000
export const trendWindowDays = 14

/**
 * Groups self-reported tags by ID. "Recent" is the last 14 days; "earlier" is the 14 days before that.
 * Occurrences are newest first, limited to `limit` per tag. Unused tags are omitted; groups sort by total, then recency.
 */
export function summarizeMistakes(history: MistakeSource[], now: number, limit = 5): MistakeGroup[] {
  const recentStart = now - trendWindowDays * day
  const earlierStart = recentStart - trendWindowDays * day
  const groups = new Map<MistakeTagId, MistakeOccurrence[]>()
  for (const record of history) {
    const time = Date.parse(record.completedAt)
    const tags = normalizeMistakes(record.mistakes)
    if (!tags || !Number.isFinite(time)) continue
    for (const id of tags) groups.set(id, [...(groups.get(id) ?? []), { attemptId: record.id, repId: record.repId, completedAt: record.completedAt }])
  }
  return mistakeTags.flatMap(({ id, label }) => {
    const all = [...(groups.get(id) ?? [])].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    if (!all.length) return []
    const at = (item: MistakeOccurrence) => Date.parse(item.completedAt)
    const recent = all.filter(item => at(item) > recentStart && at(item) <= now).length
    const earlier = all.filter(item => at(item) > earlierStart && at(item) <= recentStart).length
    const older = all.filter(item => at(item) <= earlierStart).length
    const trend: MistakeTrend = recent === 0 && earlier === 0 ? 'none' : earlier === 0 && older === 0 ? 'new' : recent > earlier ? 'more' : recent < earlier ? 'fewer' : 'same'
    return [{ id, label, total: all.length, recent, earlier, trend, occurrences: all.slice(0, limit) }]
  }).sort((a, b) => b.total - a.total || Date.parse(b.occurrences[0].completedAt) - Date.parse(a.occurrences[0].completedAt))
}
