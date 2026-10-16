import { scopedKey, profileRegistryKey, parseProfiles } from './profiles.ts'
import { isPlainObject } from './guards.ts'
import { maxEntriesPerRequest, maxValueLength, requestBatchBytes, storageKeyAllowed } from '../server/storage-keys.mjs'
const journalKey = 'code-reps:pending-writes:v1'
const serverModeKey = 'code-reps:server-mode:v1'
// Set while the browser copy is being copied to an empty server over several requests, so an interrupted copy resumes.
export const migrationKey = 'code-reps:migrating:v1'
type Entries = Record<string, string | null>
type Environment = {
  storage: Storage
  request: (url: string, options?: RequestInit) => Promise<Response>
  onError: () => void
}
// These browser-only keys never reach the server.
export const keyAllowed = (key: string) => storageKeyAllowed(key) && key !== journalKey && key !== serverModeKey && key !== migrationKey
const validEntries = (value: unknown, nullable = false): value is Entries =>
  isPlainObject(value) &&
  Object.entries(value).every(
    ([key, entry]) => keyAllowed(key) && ((nullable && entry === null) || (typeof entry === 'string' && entry.length <= maxValueLength)),
  )

/**
 * Splits entries into requests the server accepts: at most `maxEntriesPerRequest` keys, and a new request once one
 * reaches `requestBatchBytes`. Sizes are upper bounds (three UTF-8 bytes per JSON character), so no batch is undercounted.
 */
export function requestBatches<T extends string | null>(entries: Record<string, T>): Record<string, T>[] {
  const batches: Record<string, T>[] = []
  let batch: Record<string, T> = {}
  let keys = 0
  let bytes = 0
  for (const [key, value] of Object.entries(entries)) {
    const size = 3 * (JSON.stringify(key).length + JSON.stringify(value).length + 2)
    if (keys && (keys === maxEntriesPerRequest || bytes + size > requestBatchBytes)) {
      batches.push(batch)
      batch = {}
      keys = 0
      bytes = 0
    }
    batch[key] = value
    keys++
    bytes += size
  }
  if (keys) batches.push(batch)
  return batches
}

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
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('Pending local saves could not be read. Your browser copy has been kept.')
    }
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
  const sendBatch = async (entries: Entries) => {
    const response = await environment.request('/api/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error('Could not save to the local server. Your browser copy is kept; retry saving or download a backup.')
    const remaining = journal()
    for (const [key, value] of Object.entries(entries)) if (remaining[key] === value) delete remaining[key]
    saveJournal(remaining)
  }
  const send = async (entries: Entries) => {
    for (const batch of requestBatches(entries)) await sendBatch(batch)
  }
  const loadState = async (failure: string) => {
    const response = await environment.request('/api/state', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error(failure)
    const { entries } = (await response.json()) as { entries: unknown }
    if (!validEntries(entries)) throw new Error('The local server returned invalid progress. Your browser copy has been kept.')
    return entries as Record<string, string>
  }
  /**
   * Copies the browser copy, which already holds any pending writes, to the server. A fresh copy claims an empty server
   * with /api/migrate, so two tabs cannot both seed it; a resumed one adds only the keys the server lacks.
   */
  const migrate = async (local: Record<string, string>, fresh: boolean) => {
    environment.storage.setItem(migrationKey, 'true')
    const batches = requestBatches(local)
    if (fresh) {
      const migrated = await environment.request('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: batches.shift() }),
        signal: AbortSignal.timeout(5000),
      })
      if (!migrated.ok) throw new Error('Could not migrate browser progress. Your browser copy has been kept.')
      const result = (await migrated.json()) as { migrated?: unknown; entries: unknown }
      if (!validEntries(result.entries)) throw new Error('The migration returned invalid progress. Your browser copy has been kept.')
      if (result.migrated === false) {
        // Another tab or browser seeded the server first; pending writes still replay below.
        environment.storage.removeItem(migrationKey)
        return result.entries as Record<string, string>
      }
    }
    for (const batch of batches) await sendBatch(batch)
    environment.storage.removeItem(migrationKey)
    return loadState('Could not migrate browser progress. Your browser copy has been kept.')
  }
  // Saves made while an earlier request is in flight merge into one follow-up request, so a slow server sees one PATCH rather than a backlog.
  let queued: Entries | null = null
  const enqueue = (entries: Entries) => {
    if (queued) {
      Object.assign(queued, entries)
      return
    }
    queued = { ...entries }
    pending = pending
      .then(() => {
        const batch = queued!
        queued = null
        return send(batch)
      })
      .catch((error: unknown) => {
        pendingError = error instanceof Error ? error : new Error('Could not save to the local server.')
        issue = pendingError.message
        environment.onError()
      })
  }
  async function flushStorage() {
    await pending
    if (Object.keys(journal()).length)
      throw pendingError ?? new Error('Local saves are waiting for the server. Retry saving or download a backup.')
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
        if (environment.storage.getItem(serverModeKey) === 'true')
          throw new Error('Local server unavailable. Your browser copy has been kept.')
        initializedSuccessfully = true
        return
      }
      let { entries } = (await response.json()) as { entries: unknown }
      if (!validEntries(entries)) throw new Error('The local server returned invalid progress. Your browser copy has been kept.')
      serverReady = true
      environment.storage.setItem(serverModeKey, 'true')
      // An empty server is a new or replaced data folder, never a reason to drop the browser copy.
      const resuming = environment.storage.getItem(migrationKey) === 'true'
      if (!Object.keys(entries).length || resuming) {
        const local = cachedEntries()
        const missing = Object.fromEntries(Object.entries(local).filter(([key]) => !resuming || !(key in (entries as Entries))))
        if (Object.keys(missing).length) entries = await migrate(missing, !resuming)
        else environment.storage.removeItem(migrationKey)
      }
      const waiting = journal()
      if (Object.keys(waiting).length) {
        await send(waiting)
        entries = await loadState('Recovered saves could not be loaded. Your browser copy has been kept.')
      }
      // Writes made while startup was waiting on the server are newer than its copy, and are already queued to send.
      const newer = journal()
      const before = cachedEntries()
      try {
        for (const [key, value] of Object.entries(entries as Entries))
          if (!(key in newer)) environment.storage.setItem(key, value as string)
        for (const key of Object.keys(before)) if (!(key in (entries as Entries)) && !(key in newer)) environment.storage.removeItem(key)
      } catch (error) {
        for (const key of Object.keys(cachedEntries())) if (!(key in before)) environment.storage.removeItem(key)
        for (const [key, value] of Object.entries(before)) environment.storage.setItem(key, value)
        throw error
      }
      initializedSuccessfully = true
    } catch (error) {
      issue =
        error instanceof Error && (error.name === 'TypeError' || error.name === 'TimeoutError' || error.name === 'AbortError')
          ? 'Local server unavailable. Your browser copy has been kept.'
          : error instanceof Error
            ? error.message
            : 'Local progress could not load. Your browser copy has been kept.'
      environment.onError()
    }
  }
  async function retryStorage() {
    await pending
    if (!serverReady || !initializedSuccessfully) {
      await initializeStorage()
      if (issue) throw new Error(issue)
    }
    const waiting = journal()
    if (Object.keys(waiting).length) enqueue(waiting)
    await flushStorage()
  }
  return {
    initializeStorage,
    flushStorage,
    retryStorage,
    isServerReady: () => serverReady,
    storageIssue: () => issue,
    localStore: {
      getItem: (key: string) => environment.storage.getItem(key),
      setEntries,
      setItem: (key: string, value: string) => setEntries({ [key]: value }),
      removeItem: (key: string) => setEntries({ [key]: null }),
    },
  }
}

const storage = createLocalStore({
  get storage() {
    return localStorage
  },
  request: (url, options) => fetch(url, options),
  onError: () => window.dispatchEvent(new Event('code-reps-storage-error')),
})
export const { initializeStorage, flushStorage, retryStorage, isServerReady, storageIssue } = storage
export const rawLocalStore = storage.localStore
let activeProfile = 'default'
export const getActiveProfile = () => activeProfile
export function activateProfile(id: string) {
  scopedKey(id, 'code-reps:test')
  activeProfile = id
}
function requireActiveProfile() {
  const registry = rawLocalStore.getItem(profileRegistryKey)
  if (registry && !parseProfiles(registry).profiles.some(profile => profile.id === activeProfile))
    throw new Error('This profile was removed in another tab. Reload and choose a remaining profile.')
}
export const localStore = {
  getItem: (key: string) => rawLocalStore.getItem(scopedKey(activeProfile, key)),
  setItem: (key: string, value: string) => {
    requireActiveProfile()
    rawLocalStore.setItem(scopedKey(activeProfile, key), value)
  },
  removeItem: (key: string) => {
    requireActiveProfile()
    rawLocalStore.removeItem(scopedKey(activeProfile, key))
  },
  setEntries: (entries: Entries) => {
    requireActiveProfile()
    rawLocalStore.setEntries(Object.fromEntries(Object.entries(entries).map(([key, value]) => [scopedKey(activeProfile, key), value])))
  },
}
