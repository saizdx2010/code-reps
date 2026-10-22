import type { LifeResult, LifeSources, LifeStep } from './life-toy.ts'
import { startPracticeWorker } from './practice-worker'

/** How long one step of the learner's code may run before the toy stops the worker, as for check runs. */
export const lifeStepLimitMs = 5000

/**
 * One worker for an open toy. A step that throws comes back as an error; a step that runs too long, or a worker that
 * fails to load, stops the worker and every waiting step. The next step starts a fresh worker.
 */
export function lifeSession(sources: LifeSources) {
  let worker: Worker | undefined
  let nextId = 0
  const pending = new Map<number, { resolve: (result: LifeResult) => void; timer?: number }>()
  const stop = (message?: string) => {
    worker?.terminate()
    worker = undefined
    for (const [id, request] of pending) {
      window.clearTimeout(request.timer)
      if (message) request.resolve({ error: message })
      pending.delete(id)
    }
  }
  const start = () => {
    const created = startPracticeWorker()
    created.onmessage = (event: MessageEvent<{ life?: { id: number; started?: true; result?: LifeResult } }>) => {
      const reply = event.data.life
      const request = reply && pending.get(reply.id)
      if (!reply || !request) return
      // Loading the worker does not count against the learner's code: the limit starts when the step starts.
      if (reply.started) {
        request.timer = window.setTimeout(
          () => stop(`Your code ran for more than ${lifeStepLimitMs / 1000} seconds, so the toy stopped it.`),
          lifeStepLimitMs,
        )
        return
      }
      if (!reply.result) return
      window.clearTimeout(request.timer)
      pending.delete(reply.id)
      request.resolve(reply.result)
    }
    created.onerror = () => stop('The toy could not start its worker. Reload to try again; your saved work is unchanged.')
    return created
  }
  return {
    step(step: LifeStep): Promise<LifeResult> {
      worker ??= start()
      const id = ++nextId
      return new Promise(resolve => {
        pending.set(id, { resolve })
        worker!.postMessage({ life: { id, sources, step } })
      })
    },
    close: () => stop(),
  }
}
