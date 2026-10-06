export const sessionsKey = 'code-reps:sessions:v1'
export const sessionLimit = 1000
export const reflectionLimit = 2000
export type PracticeSession = {
  id: string
  repId: string
  startedAt: string
  endedAt?: string
  reflection: string
  hintCount: number
  difficulty?: 'none' | 'wording' | 'approach' | 'typescript' | 'edge-cases'
  attemptId?: string
}
export type SessionState = { version: 1; revision: string; records: PracticeSession[] }
export const emptySessions = (): SessionState => ({ version: 1, revision: '', records: [] })
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const identity = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(value)
const date = (value: unknown): value is string => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value))

export function parseSessions(value: unknown, repIds: Set<string>): SessionState {
  if (!object(value) || value.version !== 1 || typeof value.revision !== 'string' || (value.revision !== '' && !identity(value.revision)) || !Array.isArray(value.records)) throw new Error('Practice history is invalid. Your saved copy has been kept.')
  if (value.records.length > sessionLimit || new TextEncoder().encode(JSON.stringify(value)).byteLength > 800_000) throw new Error('Practice history is full. Export a backup and remove records before adding more.')
  const records = value.records.map((record): PracticeSession => {
    if (!object(record) || !identity(record.id) || typeof record.repId !== 'string' || !repIds.has(record.repId) || !date(record.startedAt) || typeof record.reflection !== 'string' || record.reflection.length > reflectionLimit || !Number.isInteger(record.hintCount) || Number(record.hintCount) < 0 || Number(record.hintCount) > 100 ||
      (record.endedAt !== undefined && (!date(record.endedAt) || Date.parse(record.endedAt) < Date.parse(record.startedAt) || !record.reflection.trim())) ||
      (record.difficulty !== undefined && !['none', 'wording', 'approach', 'typescript', 'edge-cases'].includes(String(record.difficulty))) || (record.attemptId !== undefined && !identity(record.attemptId))) throw new Error('Practice history contains an invalid session. Your work has been kept.')
    return { id: record.id, repId: record.repId, startedAt: record.startedAt, reflection: record.reflection, hintCount: Number(record.hintCount),
      ...(record.endedAt === undefined ? {} : { endedAt: record.endedAt as string }), ...(record.difficulty === undefined ? {} : { difficulty: record.difficulty as PracticeSession['difficulty'] }), ...(record.attemptId === undefined ? {} : { attemptId: record.attemptId as string }) }
  })
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('Practice history contains duplicate session IDs.')
  return { version: 1, revision: value.revision, records }
}

export function mergeSessions(current: SessionState, incoming: SessionState, repIds: Set<string>): SessionState {
  // A repeated import must not overwrite a locally edited reflection or change its work link.
  const existing = new Set(current.records.map(record => record.id))
  return parseSessions({ version: 1, revision: crypto.randomUUID(), records: [...current.records, ...incoming.records.filter(record => !existing.has(record.id))] }, repIds)
}

export function finishSession(record: PracticeSession, endedAt: string): PracticeSession {
  if (record.endedAt) throw new Error('This session has already ended.')
  if (!record.reflection.trim()) throw new Error('Add what you learned or where you got stuck before ending the session.')
  return { ...record, endedAt }
}

export function assertSessionRevision(expected: string | null, current: string | null) {
  if (expected !== current) throw new Error('Practice history changed in another tab. Your reflection is kept here. Reload session records before saving again.')
}
