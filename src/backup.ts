import { attemptKey, historyKey, learnerStartKey, readAttempt } from './attempt-store.ts'
import type { Attempt, AttemptRecord } from './attempt-store.ts'
import { repIndex as reps } from './catalog-index.ts'
import { parseFluency } from './fluency.ts'
import type { FluencyState } from './fluency.ts'
import type { LearnerStart } from './learning.ts'
import { flushStorage, localStore } from './local-store.ts'
import { BackupTooLargeError, backupFileText, mergeHistory, parseBackup } from './portability.ts'
import type { Backup } from './portability.ts'
import { emptySessions } from './practice-sessions.ts'
import type { usePracticeSessions } from './usePracticeSessions.ts'

type Sessions = ReturnType<typeof usePracticeSessions>
type LearnerWork = {
  /** The open rep's attempt, which may be newer than its saved draft. */
  attempt: Attempt
  repId: string
  learnerStart: LearnerStart | null
  history: AttemptRecord[]
  learning: FluencyState
}
type ExportSources = LearnerWork & { sessions: Pick<Sessions, 'backup'> }
type ImportTargets = Omit<LearnerWork, 'attempt' | 'repId'> & { sessions: Sessions }

/** Downloads every saved draft, completed attempt, and learning record. Returns the notice to show the learner. */
export function downloadBackup({ attempt, repId, learnerStart, history, learning, sessions }: ExportSources) {
  try {
    const drafts: Backup['drafts'] = {}
    for (const item of reps) {
      const saved = localStore.getItem(attemptKey(item.id))
      const draft = readAttempt(item)
      if (saved && draft.code !== undefined) drafts[item.id] = { ...draft, code: draft.code }
    }
    if (attempt.code !== undefined) drafts[repId] = { ...attempt, code: attempt.code }
    const backup: Backup = {
      format: 'code-reps-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      learnerStart,
      history,
      drafts,
      learning,
      sessions: sessions.backup(),
    }
    // Refuses, rather than writes, a file that import would reject.
    const url = URL.createObjectURL(new Blob([backupFileText(backup)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `code-reps-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'Backup downloaded to this device.'
  } catch (error) {
    return error instanceof BackupTooLargeError ? error.message : 'The backup could not be created on this device.'
  }
}

/**
 * Merges a backup into this profile without overwriting newer local work, then reloads the app.
 * Throws with a learner-facing message, leaving saved work untouched, when the file is invalid or a save fails.
 */
export async function restoreBackup(file: File, { learnerStart, history, learning, sessions }: ImportTargets) {
  await sessions.flush()
  sessions.verifyRevision()
  const backup = parseBackup(await file.text(), new Set(reps.map(item => item.id)))
  const merged = mergeHistory(history, backup.history).sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
  const updates: [string, string][] = [[historyKey, JSON.stringify(merged)]]
  for (const [id, draft] of Object.entries(backup.drafts)) {
    const key = attemptKey(id)
    if (localStore.getItem(key) === null) updates.push([key, JSON.stringify(draft)])
  }
  if (!learnerStart && backup.learnerStart) updates.push([learnerStartKey, backup.learnerStart])
  if (backup.learning) {
    const current = learning
    const incoming = backup.learning
    updates.push([
      'code-reps:fluency:v1',
      JSON.stringify(
        parseFluency({
          ...incoming,
          ...current,
          answers: { ...incoming.answers, ...current.answers },
          reviews: { ...incoming.reviews, ...current.reviews },
          notes: mergeHistory(current.notes, incoming.notes),
          rounds: mergeHistory(current.rounds, incoming.rounds),
          bookmarks: [...new Set([...current.bookmarks, ...incoming.bookmarks])],
        }),
      ),
    ])
  }
  sessions.verifyRevision()
  if (backup.sessions || sessions.state.records.length) {
    await sessions.importRecords(backup.sessions ?? emptySessions(), Object.fromEntries(updates))
  } else localStore.setEntries(Object.fromEntries(updates))
  await flushStorage()
  window.location.reload()
}
