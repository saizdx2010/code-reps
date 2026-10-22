import type { ResultTable, TestResult } from './runner.types'

type CheckWorker = Pick<Worker, 'onmessage' | 'onmessageerror' | 'onerror' | 'postMessage' | 'terminate'>
type RunOptions = {
  createWorker: () => CheckWorker
  onResults: (results: TestResult[]) => void
  onError: (message: string) => void
  schedule: (callback: () => void, milliseconds: number) => number
  clearTimer: (id: number) => void
  /** The rep's checks load the bundled SQLite engine first, so a slow load names it. */
  usesSqlite?: boolean
  /** The worker and any engine have loaded; the checks themselves are running now. */
  onReady?: () => void
  /** The rep's content chunk, so the worker loads only that chunk. */
  source?: string
}

const isCell = (value: unknown) => value === null || typeof value === 'string' || typeof value === 'number'
const isText = (value: unknown, limit = 2000) => typeof value === 'string' && value.length <= limit
const isCount = (value: unknown) => Number.isInteger(value) && Number(value) >= 0
const isNames = (value: unknown) => Array.isArray(value) && value.length <= 64 && value.every(name => isText(name, 500))
const isPlain = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/** One side of a SQLite comparison: bounded, plain text and numbers only, so a malformed reply cannot reach the drawer. */
function isShownRows(value: unknown) {
  if (!isPlain(value) || !isNames(value.columns) || !isCount(value.total) || !isCount(value.before) || !isCount(value.after)) return false
  return (
    Array.isArray(value.rows) &&
    value.rows.length <= 40 &&
    value.rows.every(
      row =>
        isPlain(row) &&
        isCount(row.n) &&
        Array.isArray(row.cells) &&
        row.cells.length <= 64 &&
        row.cells.every(isCell) &&
        (row.mark === undefined || row.mark === 'extra' || row.mark === 'missing') &&
        (row.wrong === undefined ||
          (Array.isArray(row.wrong) &&
            row.wrong.length <= 64 &&
            row.wrong.every(cell => Array.isArray(cell) && cell.length === 2 && isCount(cell[0]) && isCell(cell[1])))),
    )
  )
}

function isResultTable(value: unknown): value is ResultTable {
  return (
    isPlain(value) &&
    isText(value.label, 200) &&
    (value.ordered === undefined || typeof value.ordered === 'boolean') &&
    (value.expected === null || isShownRows(value.expected)) &&
    (value.received === null || isShownRows(value.received)) &&
    isPlain(value.totals) &&
    isCount(value.totals.expected) &&
    isCount(value.totals.received) &&
    (value.columnNote === undefined || isText(value.columnNote)) &&
    (value.first === undefined || isText(value.first))
  )
}

const isSqlError = (value: unknown) =>
  isPlain(value) &&
  isText(value.message) &&
  (value.line === undefined || isCount(value.line)) &&
  (value.column === undefined || isCount(value.column)) &&
  (value.length === undefined || isCount(value.length)) &&
  (value.source === undefined || isText(value.source, 20_000))

function isTestResult(value: unknown): value is TestResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Record<string, unknown>
  return (
    typeof result.name === 'string' &&
    typeof result.passed === 'boolean' &&
    ['message', 'input', 'expected', 'actual'].every(key => result[key] === undefined || typeof result[key] === 'string') &&
    (result.tables === undefined || (Array.isArray(result.tables) && result.tables.length <= 10 && result.tables.every(isResultTable))) &&
    (result.sqlError === undefined || isSqlError(result.sqlError)) &&
    (result.plan === undefined || (Array.isArray(result.plan) && result.plan.length <= 50 && result.plan.every(line => isText(line, 500))))
  )
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
    const limit = () => {
      if (timer !== undefined) options.clearTimer(timer)
      timer = options.schedule(() => {
        if (disposed) return
        dispose()
        options.onError('The checks took too long and were stopped. Check for an endless loop, then run again.')
      }, 5000)
    }
    worker.onmessage = event => {
      if (disposed) return
      const data: unknown = event.data
      // The worker reports when its script (and any bundled engine) has loaded; only learner code and checks get the five seconds.
      if (data && typeof data === 'object' && (data as Record<string, unknown>).ready === true) {
        limit()
        options.onReady?.()
        return
      }
      dispose()
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
    // Loading the worker gets a separate allowance so a cold or busy start is not reported as an endless loop.
    timer = options.schedule(() => {
      if (disposed) return
      dispose()
      options.onError(
        options.usesSqlite
          ? 'The SQLite engine could not load in time. Your code is still here; try running the checks again.'
          : 'The checker could not load in time. Your code is still here; try running the checks again.',
      )
    }, 30000)
    worker.postMessage(options.source ? { code, repId, source: options.source } : { code, repId })
  } catch {
    dispose()
    options.onError('The checks could not start. Your code is still here; try running them again.')
  }
  return dispose
}
