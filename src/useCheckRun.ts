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
  const [runError, setRunError] = useState('')
  const [running, setRunning] = useState(false)
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
    setRunError('')
    setRunNotice('')
  }

  /** Edited code makes earlier feedback obsolete: stop any run and say why the results went away. */
  function invalidate() {
    if (running || results || runError) setRunNotice('Your code changed. Run checks again to check this version.')
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
      cancelRunRef.current = () => { cancelled = true; cancelFrame() }
      void import('./frontend-run').then(({ startFrontendRun }) => {
        if (cancelled) return
        cancelFrame = startFrontendRun(code, rep,
          nextResults => { setRunning(false); setResults(nextResults) },
          message => { setRunning(false); setRunError(message) })
      }).catch(() => {
        if (!cancelled) { setRunning(false); setRunError('Browser checks could not load. Your code is still here; try again.') }
      })
      return
    }
    cancelRunRef.current = startCheckRun(code, repId, {
      createWorker: () => new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' }),
      schedule: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
      clearTimer: id => window.clearTimeout(id),
      onResults: nextResults => { setRunning(false); setResults(nextResults) },
      onError: message => { setRunning(false); setRunError(message) },
    })
  }

  return { results, runError, running, runNotice, run, stop, cancel, reset, invalidate, clearResults: () => setResults(null) }
}
