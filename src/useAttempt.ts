import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { attemptKey, freshAttempt, historyKey, readAttempt, readHistory, saveAttempt, selectedRepKey } from './attempt-store'
import type { Attempt } from './attempt-store'
import { repIndex as reps } from './catalog-index'
import type { RepSummary } from './catalog-index'
import { flushStorage, getActiveProfile, localStore, retryStorage, storageIssue } from './local-store'
import { mergeHistory } from './portability'
import { scopedKey } from './profiles'
import { deviceSaveFailure, savedMessage } from './save-status'
import { readRoute } from './ui-navigation'

const repIds = reps.map(rep => rep.id)

function initialRepId() {
  const bookmarked = readRoute(location.hash, repIds).repId
  if (bookmarked) return bookmarked
  try {
    return reps.find(item => item.id === localStore.getItem(selectedRepKey))?.id ?? reps[0].id
  } catch {
    return reps[0].id
  }
}

/**
 * The selected rep's attempt and the completed history, with their saving. Edits save after a short pause and
 * again when the page hides, so switching reps, closing the tab, or a failed save never loses the draft.
 */
export function useAttempt() {
  const [history, setHistory] = useState(readHistory)
  const [repId, setRepId] = useState(initialRepId)
  const rep = reps.find(item => item.id === repId) ?? reps[0]
  const [attempt, setAttempt] = useState(() => readAttempt(rep))
  const latestWork = useRef({ repId, attempt })
  useLayoutEffect(() => {
    latestWork.current = { repId, attempt }
  }, [repId, attempt])
  const completing = useRef(false)
  const [saveState, setSaveState] = useState(storageIssue() || savedMessage())
  const saveGenerationRef = useRef(0)
  // After a profile switch this workspace stays mounted briefly; its saves must not land in the new profile.
  const [profile] = useState(getActiveProfile)
  const ownsProfile = () => getActiveProfile() === profile

  useEffect(() => {
    const pendingSave = saveGenerationRef
    const generation = ++pendingSave.current
    const timer = window.setTimeout(() => {
      if (getActiveProfile() !== profile) return
      try {
        saveAttempt(repId, attempt)
        void flushStorage()
          .then(() => {
            if (generation === pendingSave.current) setSaveState(savedMessage())
          })
          .catch(() => {
            if (generation === pendingSave.current) setSaveState('Could not save to the local server; download a backup')
          })
      } catch (error) {
        setSaveState(deviceSaveFailure(error))
      }
    }, 300)
    return () => {
      window.clearTimeout(timer)
      pendingSave.current++
    }
  }, [attempt, repId, profile])

  useEffect(() => {
    const onError = () => setSaveState(storageIssue() || 'Local server save failed; download a backup')
    window.addEventListener('code-reps-storage-error', onError)
    return () => window.removeEventListener('code-reps-storage-error', onError)
  }, [])
  useEffect(() => {
    const saveDraft = (event?: Event) => {
      if (getActiveProfile() !== profile) return
      const { repId, attempt } = latestWork.current
      try {
        saveAttempt(repId, attempt)
      } catch (error) {
        event?.preventDefault()
        setSaveState(deviceSaveFailure(error))
      }
    }
    // A completion saved in another tab joins this tab's history, so the next save here keeps it.
    const receiveHistory = (event: StorageEvent) => {
      if ((event.key === scopedKey(profile, historyKey) || event.key === null) && getActiveProfile() === profile) setHistory(readHistory())
    }
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') saveDraft()
    }
    window.addEventListener('code-reps-save-current', saveDraft)
    window.addEventListener('pagehide', saveDraft)
    window.addEventListener('storage', receiveHistory)
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => {
      window.removeEventListener('code-reps-save-current', saveDraft)
      window.removeEventListener('pagehide', saveDraft)
      window.removeEventListener('storage', receiveHistory)
      document.removeEventListener('visibilitychange', saveWhenHidden)
    }
  }, [profile])

  function update<K extends keyof Attempt>(key: K, value: Attempt[K]) {
    setAttempt(current => ({ ...current, [key]: value, completedAt: key === 'hintCount' ? current.completedAt : undefined }))
    setSaveState('Saving…')
  }

  /** Saves the open draft, then opens `nextRep`'s saved attempt. */
  function select(nextRep: RepSummary) {
    try {
      saveAttempt(repId, attempt)
      localStore.setItem(selectedRepKey, nextRep.id)
      setSaveState('Saving…')
    } catch (error) {
      setSaveState(deviceSaveFailure(error))
    }
    setRepId(nextRep.id)
    setAttempt(readAttempt(nextRep))
  }

  /** Replaces the open attempt with a blank one; completed attempts stay in history. */
  function restart(starter: string | undefined) {
    setAttempt(freshAttempt(starter))
    setSaveState('Saving…')
  }

  /** Records the open attempt as completed. Returns whether it was saved. */
  function complete() {
    if (completing.current || attempt.completedAt || !ownsProfile()) return false
    completing.current = true
    const completedAt = new Date().toISOString()
    const completed = { ...attempt, completedAt }
    const record = { ...completed, code: completed.code ?? '', id: crypto.randomUUID(), repId }
    try {
      // Read the saved history again: another tab may have recorded a completion since this one loaded.
      const nextHistory = [record, ...mergeHistory(readHistory(), history)]
      // A draft newer than this render's attempt stays the draft instead of being replaced by the completed copy.
      const latest = latestWork.current
      const draft =
        latest.repId !== repId
          ? readAttempt(rep)
          : latest.attempt === attempt || latest.attempt.code === undefined
            ? completed
            : latest.attempt
      localStore.setEntries({ [historyKey]: JSON.stringify(nextHistory), [attemptKey(repId)]: JSON.stringify(draft) })
      setHistory(nextHistory)
      setAttempt(current => (current === attempt ? completed : current))
      setSaveState('Saving…')
      return true
    } catch (error) {
      setSaveState(deviceSaveFailure(error))
      return false
    } finally {
      completing.current = false
    }
  }

  async function retrySaving() {
    setSaveState('Saving…')
    try {
      saveAttempt(repId, attempt)
      await retryStorage()
      setSaveState(savedMessage())
    } catch (error) {
      setSaveState(error instanceof Error ? error.message : 'Could not save; download a backup')
    }
  }

  return { repId, rep, attempt, setAttempt, history, saveState, setSaveState, update, select, restart, complete, retrySaving }
}
