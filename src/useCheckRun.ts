import { useEffect, useRef, useState } from 'react'
import { startCheckRun } from './check-run'
import type { Rep } from './rep-types'
import type { TestResult } from './runner.types'

/**
 * Owns one rep's check run: its results, error, and notice. Only the latest run may report; stopping or
 * replacing a run cancels it, so a stale worker or frame cannot overwrite newer feedback.
 */
export function useCheckRun() {
  const [results, setResults] = useState<TestResult[] | null>(null)
  // The last run's results after the code changed. Kept only as a reference for the learner; never a pass.
  const [staleResults, setStaleResults] = useState<TestResult[] | null>(null)
  const [runError, setRunError] = useState('')
  const [running, setRunning] = useState(false)
  // A SQLite rep's engine loads before its checks run; the drawer says so instead of "Running checks".
  const [loadingEngine, setLoadingEngine] = useState(false)
  const [runNotice, setRunNotice] = useState('')
  const cancelRunRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const activeRun = cancelRunRef
    return () => activeRun.current?.()
  }, [])

  function stop() {
    cancelRunRef.current?.()
    cancelRunRef.current = null
    setRunning(false)
    setLoadingEngine(false)
  }

  /** Stops checks at the learner's request. The draft is untouched. */
  function cancel() {
    stop()
    setRunNotice('Checks stopped. Your code is unchanged; run again when you are ready.')
  }

  /** Clears every result for a new rep or attempt. */
  function reset() {
    stop()
    setResults(null)
    setStaleResults(null)
    setRunError('')
    setRunNotice('')
  }

  /**
   * Edited code makes the verdict obsolete: stop any run and clear the results, so nothing stale counts as a pass.
   * The last results stay visible as an out-of-date reference, so the failing input is still there while it is fixed.
   */
  function invalidate() {
    if (running || results || runError) setRunNotice('Your code changed. Run checks again to check this version.')
    if (results) setStaleResults(results)
    stop()
    setResults(null)
    setRunError('')
  }

  function run(code: string, rep: Rep, repId: string) {
    reset()
    setRunning(true)
    if (rep.format === 'frontend') {
      let cancelled = false
      let cancelFrame = () => {}
      cancelRunRef.current = () => {
        cancelled = true
        cancelFrame()
      }
      void import('./frontend-run')
        .then(({ startFrontendRun }) => {
          if (cancelled) return
          cancelFrame = startFrontendRun(
            code,
            rep,
            nextResults => {
              setRunning(false)
              setResults(nextResults)
            },
            message => {
              setRunning(false)
              setRunError(message)
            },
          )
        })
        .catch(() => {
          if (!cancelled) {
            setRunning(false)
            setRunError('Browser checks could not load. Your code is still here; try again.')
          }
        })
      return
    }
    setLoadingEngine(Boolean(rep.sql))
    cancelRunRef.current = startCheckRun(code, repId, {
      createWorker: () => new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' }),
      schedule: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
      clearTimer: id => window.clearTimeout(id),
      usesSqlite: Boolean(rep.sql),
      onReady: () => setLoadingEngine(false),
      onResults: nextResults => {
        setRunning(false)
        setLoadingEngine(false)
        setResults(nextResults)
      },
      onError: message => {
        setRunning(false)
        setLoadingEngine(false)
        setRunError(message)
      },
    })
  }

  function clearResults() {
    setResults(null)
    setStaleResults(null)
  }

  return { results, staleResults, runError, running, loadingEngine, runNotice, run, stop, cancel, reset, invalidate, clearResults }
}
