const prefix = 'code-reps:'
let serverReady = false
let pending = Promise.resolve()
export const isServerReady = () => serverReady

function localEntries() {
  const entries: Record<string, string> = {}
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index)
    if (key?.startsWith(prefix)) {
      const value = localStorage.getItem(key)
      if (value !== null) entries[key] = value
    }
  }
  return entries
}

export async function initializeStorage() {
  try {
    const response = await fetch('/api/state', { cache: 'no-store' })
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return
    let { entries } = await response.json() as { entries: Record<string, string> }
    if (!entries || typeof entries !== 'object') return
    if (Object.keys(entries).length === 0) {
      const legacy = localEntries()
      if (Object.keys(legacy).length) {
        const migrated = await fetch('/api/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: legacy }) })
        if (!migrated.ok) throw new Error('Could not migrate browser data.')
        entries = (await migrated.json() as { entries: Record<string, string> }).entries
      }
    }
    for (const key of Object.keys(localEntries())) localStorage.removeItem(key)
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    serverReady = true
  } catch {
    window.dispatchEvent(new Event('code-reps-storage-error'))
  }
}

export const localStore = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem(key: string, value: string) {
    localStorage.setItem(key, value)
    if (serverReady && key.startsWith(prefix)) {
      pending = pending.then(async () => {
        const response = await fetch('/api/entry', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
        if (!response.ok) throw new Error('Could not save to local server.')
      }).catch(() => { window.dispatchEvent(new Event('code-reps-storage-error')) })
    }
  },
  removeItem(key: string) {
    localStorage.removeItem(key)
    if (serverReady && key.startsWith(prefix)) {
      pending = pending.then(async () => {
        const response = await fetch('/api/entry', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
        if (!response.ok) throw new Error('Could not remove saved entry.')
      }).catch(() => { window.dispatchEvent(new Event('code-reps-storage-error')) })
    }
  },
}
