const journalKey = 'code-reps:pending-writes:v1'
const serverModeKey = 'code-reps:server-mode:v1'
type Entries = Record<string, string | null>
type Environment = {
  storage: Storage
  request: (url: string, options?: RequestInit) => Promise<Response>
  onError: () => void
}
const keyAllowed = (key: string) => /^code-reps:[a-z0-9:-]+$/.test(key) && key.length < 160 && key !== journalKey && key !== serverModeKey
const validEntries = (value: unknown, nullable = false): value is Entries =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key, entry]) => keyAllowed(key) && ((nullable && entry === null) || (typeof entry === 'string' && entry.length <= 1_000_000))))

export function createLocalStore(environment: Environment) {
  let serverReady = false
  let issue = ''
  let initializedSuccessfully = false
  let pending = Promise.resolve()
  let pendingError: Error | null = null
  const journal = (): Entries => {
    const raw = environment.storage.getItem(journalKey)
    if (!raw) return {}
    let parsed: unknown
    try { parsed = JSON.parse(raw) }
    catch { throw new Error('Pending local saves could not be read. Your browser copy has been kept.') }
    if (!validEntries(parsed, true)) throw new Error('Pending local saves could not be read. Your browser copy has been kept.')
    return parsed
  }
  const saveJournal = (entries: Entries) => {
    if (Object.keys(entries).length) environment.storage.setItem(journalKey, JSON.stringify(entries))
    else environment.storage.removeItem(journalKey)
  }
  const cachedEntries = (): Record<string, string> => {
    const entries: Record<string, string> = {}
    for (let index = 0; index < environment.storage.length; index++) {
      const key = environment.storage.key(index)
      if (key && keyAllowed(key)) {
        const value = environment.storage.getItem(key)
        if (value !== null) entries[key] = value
      }
    }
    return entries
  }
  const send = async (entries: Entries) => {
    const response = await environment.request('/api/entries', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }), signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error('Could not save to the local server. Your browser copy is kept; retry saving or download a backup.')
    const remaining = journal()
    for (const [key, value] of Object.entries(entries)) if (remaining[key] === value) delete remaining[key]
    saveJournal(remaining)
  }
  const enqueue = (entries: Entries) => {
    pending = pending.then(() => send(entries)).catch((error: unknown) => {
      pendingError = error instanceof Error ? error : new Error('Could not save to the local server.')
      issue = pendingError.message
      environment.onError()
    })
  }
  async function flushStorage() {
    await pending
    if (Object.keys(journal()).length) throw pendingError ?? new Error('Local saves are waiting for the server. Retry saving or download a backup.')
    if (!initializedSuccessfully && issue) throw new Error(issue)
    pendingError = null
    issue = ''
  }
  function setEntries(entries: Entries) {
    if (!validEntries(entries, true)) throw new Error('Invalid saved entries.')
    const before = Object.fromEntries(Object.keys(entries).map(key => [key, environment.storage.getItem(key)]))
    const originalJournal = environment.storage.getItem(journalKey)
    const shouldSync = serverReady || environment.storage.getItem(serverModeKey) === 'true'
    try {
      if (shouldSync) saveJournal({ ...journal(), ...entries })
      for (const [key, value] of Object.entries(entries)) {
        if (value === null) environment.storage.removeItem(key)
        else environment.storage.setItem(key, value)
      }
    } catch (error) {
      // Remove newly added values before restoring the old cache to free quota.
      for (const [key, value] of Object.entries(before)) if (value === null) environment.storage.removeItem(key)
      for (const [key, value] of Object.entries(before)) if (value !== null) environment.storage.setItem(key, value)
      if (originalJournal === null) environment.storage.removeItem(journalKey)
      else environment.storage.setItem(journalKey, originalJournal)
      throw error
    }
    if (serverReady) enqueue(entries)
  }
  async function initializeStorage() {
    serverReady = false
    initializedSuccessfully = false
    issue = ''
    try {
      const response = await environment.request('/api/state', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        if (environment.storage.getItem(serverModeKey) === 'true') throw new Error('Local server unavailable. Your browser copy has been kept.')
        initializedSuccessfully = true
        return
      }
      let { entries } = await response.json() as { entries: unknown }
      if (!validEntries(entries)) throw new Error('The local server returned invalid progress. Your browser copy has been kept.')
      serverReady = true
      environment.storage.setItem(serverModeKey, 'true')
      const waiting = journal()
      if (Object.keys(waiting).length) {
        await send(waiting)
        const refreshed = await environment.request('/api/state', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
        if (!refreshed.ok) throw new Error('Recovered saves could not be loaded. Your browser copy has been kept.')
        entries = (await refreshed.json() as { entries: unknown }).entries
        if (!validEntries(entries)) throw new Error('The local server returned invalid progress. Your browser copy has been kept.')
      } else if (Object.keys(entries).length === 0) {
        const legacy = cachedEntries()
        if (Object.keys(legacy).length) {
          const migrated = await environment.request('/api/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: legacy }), signal: AbortSignal.timeout(5000) })
          if (!migrated.ok) throw new Error('Could not migrate browser progress. Your browser copy has been kept.')
          entries = (await migrated.json() as { entries: unknown }).entries
          if (!validEntries(entries)) throw new Error('The migration returned invalid progress. Your browser copy has been kept.')
        }
      }
      const before = cachedEntries()
      try {
        for (const [key, value] of Object.entries(entries)) environment.storage.setItem(key, value as string)
        for (const key of Object.keys(before)) if (!(key in entries)) environment.storage.removeItem(key)
      } catch (error) {
        for (const key of Object.keys(cachedEntries())) if (!(key in before)) environment.storage.removeItem(key)
        for (const [key, value] of Object.entries(before)) environment.storage.setItem(key, value)
        throw error
      }
      initializedSuccessfully = true
    } catch (error) {
      issue = error instanceof Error && (error.name === 'TypeError' || error.name === 'TimeoutError' || error.name === 'AbortError') ? 'Local server unavailable. Your browser copy has been kept.' : error instanceof Error ? error.message : 'Local progress could not load. Your browser copy has been kept.'
      environment.onError()
    }
  }
  async function retryStorage() {
    await pending
    if (!serverReady || !initializedSuccessfully) { await initializeStorage(); if (issue) throw new Error(issue) }
    const waiting = journal()
    if (Object.keys(waiting).length) enqueue(waiting)
    await flushStorage()
  }
  return {
    initializeStorage, flushStorage, retryStorage,
    isServerReady: () => serverReady, storageIssue: () => issue,
    localStore: {
      getItem: (key: string) => environment.storage.getItem(key), setEntries,
      setItem: (key: string, value: string) => setEntries({ [key]: value }),
      removeItem: (key: string) => setEntries({ [key]: null }),
    },
  }
}

const storage = createLocalStore({
  get storage() { return localStorage },
  request: (url, options) => fetch(url, options),
  onError: () => window.dispatchEvent(new Event('code-reps-storage-error')),
})
export const { initializeStorage, flushStorage, retryStorage, isServerReady, storageIssue, localStore } = storage
