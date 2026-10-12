import { parseSessions } from './practice-sessions.ts'
import { backupLimitLabel, backupTextLimit, parseBackup } from './portability.ts'
import { parseFluency } from './fluency.ts'
import { isPlainObject } from './guards.ts'
type ProfileBackup = { format: 'code-reps-profile'; version: 1; name: string; exportedAt: string; entries: Record<string, string> }
export function parseProfileBackup(text: string, repIds: Set<string>): ProfileBackup {
  if (text.length > backupTextLimit) throw new Error(`Profile file exceeds the local import limit of ${backupLimitLabel}.`)
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('Profile file is not valid JSON.') }
  if (!isPlainObject(value)) throw new Error('This is not a valid local profile export.')
  const raw = value as Record<string, unknown>
  if (raw.format !== 'code-reps-profile' || raw.version !== 1 ||
      typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 60 ||
      !isPlainObject(raw.entries) || Object.keys(raw.entries).length > 1000) {
    throw new Error('This is not a valid local profile export.')
  }
  const entries = raw.entries as Record<string, string>
  const allowed = new Set([
    'history:v1', 'learner-start:v1', 'fluency:v1', 'sessions:v1', 'selected-rep', 'split-width',
    ...Array.from(repIds, id => `attempt:${id}:v1`),
  ])
  if (Object.entries(entries).some(([key, entry]) => !allowed.has(key) || typeof entry !== 'string' || entry.length > 1_000_000)) {
    throw new Error('This profile contains unsupported or invalid entries.')
  }
  let history, drafts
  try {
    history = JSON.parse(entries['history:v1'] ?? '[]')
    drafts = Object.fromEntries(Array.from(repIds).flatMap(id => {
      const draft = entries[`attempt:${id}:v1`]
      return draft ? [[id, JSON.parse(draft)]] : []
    }))
  } catch { throw new Error('Profile contains unreadable learner records.') }
  const learnerStart = entries['learner-start:v1'] ?? null
  parseBackup(JSON.stringify({ format: 'code-reps-backup', version: 1, learnerStart, history, drafts }), repIds)
  if (entries['sessions:v1'] !== undefined) parseSessions(JSON.parse(entries['sessions:v1']), repIds)
  if (entries['fluency:v1']) parseFluency(JSON.parse(entries['fluency:v1']))
  if (entries['selected-rep'] && !repIds.has(entries['selected-rep'])) throw new Error('Profile refers to an unknown selected exercise.')
  const splitWidth = entries['split-width']
  if (splitWidth && (Number(splitWidth) < 25 || Number(splitWidth) > 60 || !Number.isFinite(Number(splitWidth)))) {
    throw new Error('Invalid workspace preference.')
  }
  const exportedAt = typeof raw.exportedAt === 'string' ? raw.exportedAt : ''
  return { format: 'code-reps-profile', version: 1, name: raw.name.trim(), exportedAt, entries }
}
