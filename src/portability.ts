import { parseSessions } from './practice-sessions.ts'
import type { SessionState } from './practice-sessions.ts'
import { parseFluency } from './fluency.ts'
import type { FluencyState } from './fluency.ts'
import { isDifficulty } from './attempt-labels.ts'
import { normalizeMistakes } from './mistakes.ts'
import { isDateString, isPlainObject } from './guards.ts'
import { maxValueLength } from '../server/storage-keys.mjs'
export type PortableAttempt = {
  plan: string
  code: string
  explanation: string
  hintCount: number
  difficulty?: string
  confidence?: string
  /** Self-reported mistake tag IDs (see mistakes.ts). Optional; older attempts omit it. */
  mistakes?: string[]
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

/**
 * The largest backup or profile file, in characters, that import accepts. Export uses the same limit, so a file it
 * writes can always be read back. A year of daily practice with reviews stays at a few million characters.
 */
export const backupTextLimit = 20_000_000
export const backupLimitLabel = '20 MB'
export const backupTooLargeMessage = `This backup is larger than the ${backupLimitLabel} Code Reps can restore, so it was not downloaded. Your saved work is unchanged.`

export class BackupTooLargeError extends Error {
  constructor() {
    super(backupTooLargeMessage)
  }
}

export class UnrestorableBackupError extends Error {
  constructor(reason: string) {
    super(`This backup would not restore (${reason}), so it was not downloaded. Your saved work is unchanged.`)
  }
}

/**
 * Serializes a backup or profile export and reads it back with `parse`, the matching import, so a file that would not
 * restore is refused rather than written.
 */
export function backupFileText(value: unknown, parse: (text: string) => unknown): string {
  const text = JSON.stringify(value, null, 2)
  if (text.length > backupTextLimit) throw new BackupTooLargeError()
  try {
    parse(text)
  } catch (error) {
    throw new UnrestorableBackupError(error instanceof Error ? error.message.replace(/\.$/, '') : 'it failed validation')
  }
  return text
}

// Editors do not limit text, so a field may be as long as any saved value; the file limit bounds the whole backup.
const text = (value: unknown) => typeof value === 'string' && value.length <= maxValueLength

function attempt(value: unknown): value is PortableAttempt {
  if (!isPlainObject(value)) return false
  return (
    text(value.plan) &&
    text(value.code) &&
    text(value.explanation) &&
    Number.isInteger(value.hintCount) &&
    Number(value.hintCount) >= 0 &&
    Number(value.hintCount) <= 100 &&
    (value.difficulty === undefined || isDifficulty(value.difficulty)) &&
    (value.confidence === undefined || ['need-practice', 'getting-there', 'confident'].includes(String(value.confidence))) &&
    (value.mistakes === undefined ||
      (Array.isArray(value.mistakes) &&
        value.mistakes.length <= 50 &&
        value.mistakes.every(tag => typeof tag === 'string' && tag.length <= 80))) &&
    (value.completedAt === undefined || isDateString(value.completedAt))
  )
}

/** Drops unknown tag IDs from an attempt without touching anything else about it. */
function withKnownMistakes<T extends PortableAttempt>(value: T): T {
  if (value.mistakes === undefined) return value
  const { mistakes: _dropped, ...rest } = value
  const tags = normalizeMistakes(value.mistakes)
  return (tags ? { ...rest, mistakes: tags } : rest) as T
}

export function parseBackup(text: string, knownRepIds: Set<string>): Backup {
  if (text.length > backupTextLimit) throw new Error('This backup is too large to import.')
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (
    !isPlainObject(raw) ||
    raw.format !== 'code-reps-backup' ||
    raw.version !== 1 ||
    !Array.isArray(raw.history) ||
    !isPlainObject(raw.drafts) ||
    !(raw.learnerStart === null || raw.learnerStart === 'new' || raw.learnerStart === 'returning')
  ) {
    throw new Error('This is not a supported Code Reps backup.')
  }
  if (raw.history.length > 10_000 || Object.keys(raw.drafts).length > knownRepIds.size) {
    throw new Error('This backup has too many attempts.')
  }
  const history: PortableRecord[] = []
  for (const item of raw.history) {
    if (!isPlainObject(item) || !attempt(item)) throw new Error('This backup contains an invalid completed attempt.')
    const entry = item as Record<string, unknown>
    if (
      typeof entry.id !== 'string' ||
      typeof entry.repId !== 'string' ||
      !knownRepIds.has(entry.repId) ||
      !isDateString(entry.completedAt)
    ) {
      throw new Error('This backup contains an invalid completed attempt.')
    }
    history.push(withKnownMistakes(item as PortableRecord))
  }
  const drafts: Record<string, PortableAttempt> = {}
  for (const [id, value] of Object.entries(raw.drafts)) {
    if (!knownRepIds.has(id) || !attempt(value)) throw new Error('This backup contains an invalid draft.')
    drafts[id] = withKnownMistakes(value)
  }
  return {
    format: 'code-reps-backup',
    version: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    learnerStart: raw.learnerStart,
    history,
    drafts,
    ...(raw.sessions === undefined ? {} : { sessions: parseSessions(raw.sessions, knownRepIds) }),
    ...(raw.learning === undefined ? {} : { learning: parseFluency(raw.learning) }),
  }
}

export function mergeHistory<T extends { id: string }>(current: T[], imported: T[]): T[] {
  const seen = new Set<string>()
  return [...current, ...imported].filter(record => {
    if (seen.has(record.id)) return false
    seen.add(record.id)
    return true
  })
}
