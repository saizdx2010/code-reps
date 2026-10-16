import { attemptKey, historyKey, learnerStartKey, readAttempt, readHistory } from './attempt-store.ts'
import type { Attempt, AttemptRecord } from './attempt-store.ts'
import { repIndex as reps } from './catalog-index.ts'
import { parseFluency } from './fluency.ts'
import type { FluencyState } from './fluency.ts'
import type { LearnerStart } from './learning.ts'
import { flushStorage, localStore } from './local-store.ts'
import { BackupTooLargeError, UnrestorableBackupError, backupFileText, mergeHistory, parseBackup } from './portability.ts'
import type { Backup } from './portability.ts'
import { emptySessions } from './practice-sessions.ts'
import type { usePracticeSessions } from './usePracticeSessions.ts'

type Sessions = ReturnType<typeof usePracticeSessions>
export const backupDownloaded = 'Backup downloaded to this device.'
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
    const text = backupFileText(backup, text => parseBackup(text, new Set(reps.map(item => item.id))))
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `code-reps-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    return backupDownloaded
  } catch (error) {
    return error instanceof BackupTooLargeError || error instanceof UnrestorableBackupError
      ? error.message
      : 'The backup could not be created on this device.'
  }
}

/** What a chosen backup would add to this profile, read without writing anything. */
export type BackupPreview = {
  backup: Backup
  fileName: string
  attempts: number
  newAttempts: number
  newNotes: number
  draftsToFill: number
}

/** A chosen backup awaiting confirmation, and the one-time receipt after a merge. */
export type RestoreFlow = {
  pending: BackupPreview | null
  profileName: string
  onConfirm: () => void
  onCancel: () => void
  receipt: string
  onDismissReceipt: () => void
}

/** Reads and validates a backup file and counts what merging it would add. Throws the same learner-facing errors as a restore. */
export async function previewBackup(
  file: File,
  { history, learning }: Pick<ImportTargets, 'history' | 'learning'>,
): Promise<BackupPreview> {
  const backup = parseBackup(await file.text(), new Set(reps.map(item => item.id)))
  return {
    backup,
    fileName: file.name,
    attempts: backup.history.length,
    newAttempts: mergeHistory(history, backup.history).length - history.length,
    newNotes: backup.learning ? mergeHistory(learning.notes, backup.learning.notes).length - learning.notes.length : 0,
    draftsToFill: Object.keys(backup.drafts).filter(id => localStore.getItem(attemptKey(id)) === null).length,
  }
}

/**
 * Merges a backup checked by previewBackup into this profile without overwriting newer local work, then reloads the app.
 * Throws with a learner-facing message, leaving saved work untouched, when a save fails.
 */
export async function applyBackup(backup: Backup, { learnerStart, history, learning, sessions }: ImportTargets) {
  await sessions.flush()
  sessions.verifyRevision()
  // The saved history may include completions another tab recorded after this one loaded.
  const merged = mergeHistory(mergeHistory(readHistory(), history), backup.history).sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
  )
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
