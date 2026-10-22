// Owns the practice workers the page starts. A check run uses a fresh worker once and then terminates it, so learner code
// cannot leak state between runs; one spare is started ahead of time so Run does not wait for the worker script to load.
// Frontend reps compile in a separate long-lived worker, which only transforms text and never runs learner code.

const createWorker = () => new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })
/** A practice worker owned by its caller (the Game of Life toy), which terminates it when done. */
export const startPracticeWorker = createWorker

let spare: { worker: Worker; repId: string } | undefined

/** Starts (or retargets) the spare check worker and has it load a rep's content and engine before Run is pressed. */
export function warmCheckWorker(repId: string, source: string) {
  if (typeof Worker === 'undefined') return
  try {
    if (!spare) {
      const worker = createWorker()
      // A spare that fails to load before a run takes it is dropped, so the run starts a new worker instead of waiting.
      worker.onerror = () => {
        worker.terminate()
        if (spare?.worker === worker) spare = undefined
      }
      spare = { worker, repId: '' }
    }
    if (spare.repId !== repId) {
      spare.repId = repId
      spare.worker.postMessage({ prepare: repId, source })
    }
  } catch {
    spare = undefined
  }
}

/** A worker for one check run: the warm spare when there is one, otherwise a new worker. */
export function takeCheckWorker(): Worker {
  const worker = spare?.worker
  spare = undefined
  return worker ?? createWorker()
}

export function releaseSpareWorker() {
  spare?.worker.terminate()
  spare = undefined
}

type Pending = { resolve: (output: string) => void; reject: (error: Error) => void; timer: number }
let compiler: Worker | undefined
let nextId = 0
const pending = new Map<number, Pending>()

function failAll(message: string) {
  compiler?.terminate()
  compiler = undefined
  for (const [id, request] of pending) {
    window.clearTimeout(request.timer)
    request.reject(new Error(message))
    pending.delete(id)
  }
}

function compileWorker(): Worker {
  if (compiler) return compiler
  const worker = createWorker()
  worker.onmessage = (event: MessageEvent) => {
    const reply = (event.data as { compiled?: { id?: unknown; output?: unknown; error?: unknown } } | null)?.compiled
    const request = typeof reply?.id === 'number' ? pending.get(reply.id) : undefined
    if (!reply || !request) return
    pending.delete(reply.id as number)
    window.clearTimeout(request.timer)
    if (typeof reply.output === 'string') request.resolve(reply.output)
    else request.reject(new Error(typeof reply.error === 'string' && reply.error ? reply.error : 'The solution could not be compiled.'))
  }
  worker.onerror = () => failAll('The compiler could not load. Your code is still here; try again.')
  worker.onmessageerror = () => failAll('The compiler reply could not be read. Your code is still here; try again.')
  compiler = worker
  return worker
}

/** Starts the compile worker early, so the first preview or frontend check does not wait for it. */
export function warmCompileWorker() {
  if (typeof Worker === 'undefined') return
  try {
    compileWorker()
  } catch {
    compiler = undefined
  }
}

/** Compiles learner code off the page's main thread, with the same output as `compileSolution`. */
export function compileInWorker(code: string, functionName: string, jsx: boolean, guardLoops: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const worker = compileWorker()
      const id = ++nextId
      // A cold start loads the compiler first; no reply by now means the worker is stuck, so it is replaced.
      const timer = window.setTimeout(() => failAll('The compiler did not respond. Your code is still here; try again.'), 30000)
      pending.set(id, { resolve, reject, timer })
      worker.postMessage({ compile: { id, code, functionName, jsx, guardLoops } })
    } catch {
      reject(new Error('The compiler could not start. Your code is still here; try again.'))
    }
  })
}
