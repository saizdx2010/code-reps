import { parseSessions } from './practice-sessions.ts'
import type { SessionState } from './practice-sessions.ts'
import { parseFluency } from './fluency.ts'
import type { FluencyState } from './fluency.ts'
export type PortableAttempt = {
  plan: string
  code: string
  explanation: string
  hintCount: number
  difficulty?: string
  confidence?: string
  completedAt?: string
}

export type PortableRecord = PortableAttempt & { id: string; repId: string; completedAt: string }

export type Backup = {
  format: 'code-reps-backup'
  version: 1
  exportedAt: string
  learnerStart: 'new' | 'returning' | null
  history: PortableRecord[]
  drafts: Record<string, PortableAttempt>
  sessions?: SessionState
  learning?: FluencyState
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function attempt(value: unknown): value is PortableAttempt {
  if (!object(value)) return false
  return typeof value.plan === 'string' && value.plan.length <= 100_000 &&
    typeof value.code === 'string' && value.code.length <= 100_000 &&
    typeof value.explanation === 'string' && value.explanation.length <= 100_000 &&
    Number.isInteger(value.hintCount) && Number(value.hintCount) >= 0 && Number(value.hintCount) <= 100 &&
    (value.difficulty === undefined || ['none', 'wording', 'approach', 'typescript', 'edge-cases'].includes(String(value.difficulty))) &&
    (value.confidence === undefined || ['need-practice', 'getting-there', 'confident'].includes(String(value.confidence))) &&
    (value.completedAt === undefined ||
      (typeof value.completedAt === 'string' && Number.isFinite(Date.parse(value.completedAt))))
}

export function parseBackup(text: string, knownRepIds: Set<string>): Backup {
  if (text.length > 2_000_000) throw new Error('This backup is too large to import.')
  let raw: unknown
  try { raw = JSON.parse(text) } catch { throw new Error('This file is not valid JSON.') }
  if (!object(raw) || raw.format !== 'code-reps-backup' || raw.version !== 1 ||
      !Array.isArray(raw.history) || !object(raw.drafts) ||
      !(raw.learnerStart === null || raw.learnerStart === 'new' || raw.learnerStart === 'returning')) {
    throw new Error('This is not a supported Code Reps backup.')
  }
  if (raw.history.length > 10_000 || Object.keys(raw.drafts).length > knownRepIds.size) {
    throw new Error('This backup has too many attempts.')
  }
  const history: PortableRecord[] = []
  for (const item of raw.history) {
    if (!object(item) || !attempt(item)) throw new Error('This backup contains an invalid completed attempt.')
    const entry = item as Record<string, unknown>
    if (typeof entry.id !== 'string' || typeof entry.repId !== 'string' ||
        !knownRepIds.has(entry.repId) || typeof entry.completedAt !== 'string' || !Number.isFinite(Date.parse(entry.completedAt))) {
      throw new Error('This backup contains an invalid completed attempt.')
    }
    history.push(item as PortableRecord)
  }
  const drafts: Record<string, PortableAttempt> = {}
  for (const [id, value] of Object.entries(raw.drafts)) {
    if (!knownRepIds.has(id) || !attempt(value)) throw new Error('This backup contains an invalid draft.')
    drafts[id] = value
  }
  return { format: 'code-reps-backup', version: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    learnerStart: raw.learnerStart, history, drafts, ...(raw.sessions === undefined ? {} : { sessions: parseSessions(raw.sessions, knownRepIds) }), ...(raw.learning === undefined ? {} : { learning: parseFluency(raw.learning) }) }
}

export function mergeHistory<T extends { id: string }>(current: T[], imported: T[]): T[] {
  const seen = new Set<string>()
  return [...current, ...imported].filter((record) => {
    if (seen.has(record.id)) return false
    seen.add(record.id)
    return true
  })
}
