import type { TestResult } from './runner.types'

type CheckWorker = Pick<Worker, 'onmessage' | 'onmessageerror' | 'onerror' | 'postMessage' | 'terminate'>
type RunOptions = {
  createWorker: () => CheckWorker
  onResults: (results: TestResult[]) => void
  onError: (message: string) => void
  schedule: (callback: () => void, milliseconds: number) => number
  clearTimer: (id: number) => void
}

function isTestResult(value: unknown): value is TestResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Record<string, unknown>
  return typeof result.name === 'string' && typeof result.passed === 'boolean'
    && ['message', 'input', 'expected', 'actual'].every(key => result[key] === undefined || typeof result[key] === 'string')
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
      if (disposed) return
      dispose()
      const data: unknown = event.data
      if (data && typeof data === 'object') {
        const reply = data as Record<string, unknown>
        if (typeof reply.error === 'string' && reply.error.trim()) {
          options.onError(reply.error)
          return
        }
        if (reply.error === undefined && Array.isArray(reply.results) && Array.from(reply.results).every(isTestResult)) {
          options.onResults(reply.results)
          return
        }
      }
      options.onError('The check results could not be read. Your code is still here; try running them again.')
    }
    worker.onmessageerror = () => {
      if (disposed) return
      dispose()
      options.onError('The check results could not be read. Your code is still here; try running them again.')
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
