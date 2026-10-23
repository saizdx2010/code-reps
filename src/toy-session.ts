import { startPracticeWorker } from './practice-worker'

/** How long one run of the learner's code may take before the toy stops the worker, as for check runs. */
export const toyRunLimitMs = 5000
/** How long a new worker may take to load (it brings the TypeScript compiler) before the toy gives up on it. */
export const toyLoadLimitMs = 30_000

/** The toys the practice worker runs: the Game of Life and the Request console. */
export type ToyKind = 'life' | 'request-console'

/**
 * One worker for an open toy, which runs the learner's saved sources there and never on the page. A run that throws
 * comes back as the toy's own error result; a run that takes too long, or a worker that fails to load, stops the worker
 * and every waiting run with `{ error }`. The next run starts a fresh worker. Closing settles waiting runs with an
 * empty error, which the toy ignores.
 */
export function toySession<Input, Result>(kind: ToyKind, sources: Record<string, string>, noun = 'toy') {
  let worker: Worker | undefined
  let nextId = 0
  const pending = new Map<number, { resolve: (result: Result | { error: string }) => void; timer?: number }>()
  const stop = (message = '') => {
    worker?.terminate()
    worker = undefined
    for (const [id, request] of pending) {
      window.clearTimeout(request.timer)
      request.resolve({ error: message })
      pending.delete(id)
    }
  }
  const start = () => {
    const created = startPracticeWorker()
    created.onmessage = (event: MessageEvent<{ toy?: { id: number; started?: true; result?: Result } }>) => {
      const reply = event.data.toy
      const request = reply && pending.get(reply.id)
      if (!reply || !request) return
      // Loading the worker does not count against the learner's code: the limit starts when the run starts.
      if (reply.started) {
        window.clearTimeout(request.timer)
        request.timer = window.setTimeout(
          () => stop(`Your code ran for more than ${toyRunLimitMs / 1000} seconds, so the ${noun} stopped it.`),
          toyRunLimitMs,
        )
        return
      }
      if (!reply.result) return
      window.clearTimeout(request.timer)
      pending.delete(reply.id)
      request.resolve(reply.result)
    }
    created.onerror = () => stop(`The ${noun} could not start its worker. Reload to try again; your saved work is unchanged.`)
    return created
  }
  return {
    run(input: Input): Promise<Result | { error: string }> {
      worker ??= start()
      const id = ++nextId
      return new Promise(resolve => {
        const timer = window.setTimeout(
          () => stop(`The ${noun}’s worker did not start. Reload to try again; your saved work is unchanged.`),
          toyLoadLimitMs,
        )
        pending.set(id, { resolve, timer })
        worker!.postMessage({ toy: { id, kind, sources, input } })
      })
    },
    close: () => stop(),
  }
}
