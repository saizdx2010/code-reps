/** Serializable authored data; executable dependencies are created inside the worker per check. */
export type AsyncFixtureSpec = {
  jobs: { id: string; value: string; error?: string }[]
  abort?: 'before' | 'during'
  events: string[]
}

export function createAsyncFixture(spec: AsyncFixtureSpec) {
  const events: string[] = []
  const controller = new AbortController()
  let active = 0
  let released = false
  if (spec.abort === 'before') controller.abort()
  const fixture = {
    signal: controller.signal,
    fetch: (id: string, signal?: AbortSignal): Promise<string> => {
      events.push(`start:${id}`)
      active++
      const promise = new Promise<string>((resolve, reject) => {
        // No network or wall-clock delay. Settlement happens in a later microtask.
        queueMicrotask(() => {
          active--
          if (spec.abort === 'during') controller.abort()
          if (signal?.aborted) {
            events.push(`abort:${id}`)
            reject(new DOMException('Cancelled', 'AbortError'))
            return
          }
          const job = spec.jobs.find(job => job.id === id)
          if (!job || job.error !== undefined) {
            events.push(`reject:${id}`)
            reject(new Error(job?.error ?? 'Unknown fixture ID'))
          } else {
            events.push(`resolve:${id}`)
            resolve(job.value)
          }
        })
      })
      // Keep abandoned fixture rejections from escaping the check; callers still receive the rejected promise.
      void promise.catch(() => {})
      return promise
    },
    release: () => {
      events.push(active ? 'release:pending' : released ? 'release:duplicate' : 'release')
      released = true
    },
  }
  return { fixture, events }
}
