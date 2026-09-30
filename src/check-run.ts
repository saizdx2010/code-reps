import type { TestResult } from './runner.types'

type WorkerMessage = { results?: TestResult[]; error?: string }
type CheckWorker = Pick<Worker, 'onmessage' | 'onerror' | 'postMessage' | 'terminate'>
type RunOptions = {
  createWorker: () => CheckWorker
  onResults: (results: TestResult[]) => void
  onError: (message: string) => void
  schedule: (callback: () => void, milliseconds: number) => number
  clearTimer: (id: number) => void
}

/** One run owns its worker and timer. Disposed runs cannot publish stale feedback. */
export function startCheckRun(code: string, repId: string, options: RunOptions): () => void {
  let worker: CheckWorker | undefined
  let timer: number | undefined
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    if (timer !== undefined) options.clearTimer(timer)
    worker?.terminate()
  }
  try {
    worker = options.createWorker()
    worker.onmessage = event => {
      const data = event.data as WorkerMessage
      if (disposed) return
      dispose()
      if (data.error) options.onError(data.error)
      else options.onResults(data.results ?? [])
    }
    worker.onerror = () => {
      if (disposed) return
      dispose()
      options.onError('The checks could not run. Your code is still here; try running them again.')
    }
    timer = options.schedule(() => {
      if (disposed) return
      dispose()
      options.onError('The checks took too long and were stopped. Check for an endless loop, then run again.')
    }, 5000)
    worker.postMessage({ code, repId })
  } catch {
    dispose()
    options.onError('The checks could not start. Your code is still here; try running them again.')
  }
  return dispose
}
