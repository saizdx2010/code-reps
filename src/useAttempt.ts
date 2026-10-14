import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { attemptKey, freshAttempt, historyKey, readAttempt, readHistory, saveAttempt, selectedRepKey } from './attempt-store'
import type { Attempt } from './attempt-store'
import { repIndex as reps } from './catalog-index'
import type { RepSummary } from './catalog-index'
import { flushStorage, localStore, retryStorage, storageIssue } from './local-store'
import { savedMessage } from './save-status'
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

  useEffect(() => {
    const pendingSave = saveGenerationRef
    const generation = ++pendingSave.current
    const timer = window.setTimeout(() => {
      try {
        saveAttempt(repId, attempt)
        void flushStorage()
          .then(() => {
            if (generation === pendingSave.current) setSaveState(savedMessage())
          })
          .catch(() => {
            if (generation === pendingSave.current) setSaveState('Could not save to the local server; download a backup')
          })
      } catch {
        setSaveState('Could not save on this device')
      }
    }, 300)
    return () => {
      window.clearTimeout(timer)
      pendingSave.current++
    }
  }, [attempt, repId])

  useEffect(() => {
    const onError = () => setSaveState(storageIssue() || 'Local server save failed; download a backup')
    window.addEventListener('code-reps-storage-error', onError)
    return () => window.removeEventListener('code-reps-storage-error', onError)
  }, [])
  useEffect(() => {
    const saveDraft = (event?: Event) => {
      const { repId, attempt } = latestWork.current
      try {
        saveAttempt(repId, attempt)
      } catch {
        event?.preventDefault()
        setSaveState('Could not save on this device; download a backup')
      }
    }
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') saveDraft()
    }
    window.addEventListener('code-reps-save-current', saveDraft)
    window.addEventListener('pagehide', saveDraft)
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => {
      window.removeEventListener('code-reps-save-current', saveDraft)
      window.removeEventListener('pagehide', saveDraft)
      document.removeEventListener('visibilitychange', saveWhenHidden)
    }
  }, [])

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
    } catch {
      setSaveState('Could not save on this device')
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
    if (completing.current || attempt.completedAt) return false
    completing.current = true
    const completedAt = new Date().toISOString()
    const completed = { ...attempt, completedAt }
    const record = { ...completed, code: completed.code ?? '', id: crypto.randomUUID(), repId }
    const nextHistory = [record, ...history]
    try {
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
    } catch {
      setSaveState('Could not save on this device')
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
