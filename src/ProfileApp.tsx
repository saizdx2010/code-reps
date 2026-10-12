import { Button } from './Button'
import { Input, Select } from './Input'
import { parseProfileBackup } from './profile-backup'
import { repIndex as reps } from './catalog-index'
import { useRef, useState } from 'react'
import App from './App'
import { activateProfile, flushStorage, rawLocalStore } from './local-store'
import { legacyMigration, parseProfiles, profilePrefix, profileRegistryKey } from './profiles'
import type { LocalProfile } from './profiles'
import './fluency.css'
import { useAppMotion } from './useAppMotion'
const sessionKey = 'code-reps:active-profile'
const profileLimitMessage = 'This installation supports up to 50 profiles.'
function cachedEntries() {
  const entries: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('code-reps:')) entries[key] = localStorage.getItem(key)!
  }
  return entries
}
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const registryValue = (profiles: LocalProfile[]) => JSON.stringify({ version: 1, profiles })
export default function ProfileApp() {
  useAppMotion()
  const [initial] = useState(() => {
    try {
      const raw = rawLocalStore.getItem(profileRegistryKey)
      const registry = parseProfiles(raw)
      if (!raw) rawLocalStore.setEntries({ ...legacyMigration(cachedEntries()), [profileRegistryKey]: JSON.stringify(registry) })
      let selected: string | null = null
      try { selected = sessionStorage.getItem(sessionKey) } catch { /* A default works without session storage. */ }
      const id = registry.profiles.some(p => p.id === selected) ? selected! : registry.profiles[0].id
      activateProfile(id)
      return { profiles: registry.profiles, id, error: '' }
    } catch (error) {
      return { profiles: [] as LocalProfile[], id: '', error: error instanceof Error ? error.message : 'Profiles could not load.' }
    }
  })
  const [profiles, setProfiles] = useState(initial.profiles)
  const [active, setActive] = useState(initial.id)
  const [message, setMessage] = useState(initial.error)
  const [busy, setBusy] = useState('')
  const [name, setName] = useState('')
  const [deleteRequested, setDeleteRequested] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const current = profiles.find(p => p.id === active)
  function readCurrentProfiles() { return parseProfiles(rawLocalStore.getItem(profileRegistryKey)).profiles }
  function saveProfiles(next: LocalProfile[]) {
    rawLocalStore.setItem(profileRegistryKey, registryValue(next))
    setProfiles(next)
  }
  async function saveCurrent() {
    if (!window.dispatchEvent(new Event('code-reps-save-current', { cancelable: true }))) {
      throw new Error('Current work could not be saved. Keep this profile open and export a backup.')
    }
    await flushStorage()
  }
  /** Run one profile action with a busy label, reporting its error or the fallback message. */
  async function withBusy(label: string, failure: string, action: () => Promise<void>) {
    setBusy(label)
    try { await action() }
    catch (error) { setMessage(error instanceof Error ? error.message : failure) }
    finally { setBusy('') }
  }
  /** Open a profile's workspace on Home and remember it for this browser session. */
  function enterProfile(id: string) {
    activateProfile(id)
    setActive(id)
    try { sessionStorage.setItem(sessionKey, id) } catch { /* Optional session preference. */ }
    location.hash = '#/home'
  }
  async function switchTo(id: string) {
    setMessage('')
    await withBusy('Switching profile…', 'Could not switch profiles.', async () => {
      await saveCurrent()
      const fresh = readCurrentProfiles()
      if (!fresh.some(p => p.id === id)) throw new Error('That profile was removed.')
      setProfiles(fresh)
      enterProfile(id)
      setDeleteRequested(false)
    })
  }
  async function create() {
    if (!name.trim()) return
    await withBusy('Creating profile…', 'Could not create profile.', async () => {
      await saveCurrent()
      const fresh = readCurrentProfiles()
      if (fresh.length >= 50) throw new Error(profileLimitMessage)
      const next = { id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString() }
      saveProfiles([...fresh, next])
      await flushStorage()
      enterProfile(next.id)
      setName('')
      setMessage('Profile created.')
    })
  }
  function rename() {
    try {
      saveProfiles(readCurrentProfiles().map(p => p.id === active ? { ...p, name: name.trim() } : p))
      setName('')
      setMessage('Profile renamed.')
    } catch (error) { setMessage(String(error)) }
  }
  async function remove() {
    await withBusy('Deleting profile…', 'Could not delete profile.', async () => {
      await saveCurrent()
      const fresh = readCurrentProfiles()
      if (fresh.length <= 1) throw new Error('Keep at least one local profile.')
      const remaining = fresh.filter(p => p.id !== active)
      const prefix = profilePrefix(active)
      const deletes = Object.fromEntries(Object.keys(cachedEntries()).filter(k => k.startsWith(prefix)).map(k => [k, null]))
      rawLocalStore.setEntries({ ...deletes, [profileRegistryKey]: registryValue(remaining) })
      await flushStorage()
      setProfiles(remaining)
      enterProfile(remaining[0].id)
      setDeleteRequested(false)
      setMessage('Profile deleted from this installation. Automatic backups may retain earlier copies.')
    })
  }
  async function exportProfile() {
    await withBusy('Exporting profile…', 'Could not export profile.', async () => {
      await saveCurrent()
      const prefix = profilePrefix(active)
      const entries = Object.fromEntries(Object.entries(cachedEntries())
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, v]) => [k.slice(prefix.length), v]))
      const backup = { format: 'code-reps-profile', version: 1, name: current?.name, exportedAt: new Date().toISOString(), entries }
      download(backup, `code-reps-profile-${active}.json`)
      setMessage('Full profile exported, including notes, assessments, preferences, and attempts.')
    })
  }
  async function importProfile(file: File) {
    await withBusy('Importing profile…', 'Could not import profile.', async () => {
      const value = parseProfileBackup(await file.text(), new Set(reps.map(r => r.id)))
      await saveCurrent()
      const fresh = readCurrentProfiles()
      if (fresh.length >= 50) throw new Error(profileLimitMessage)
      const profile = { id: crypto.randomUUID(), name: value.name, createdAt: new Date().toISOString() }
      const entries = Object.fromEntries(Object.entries(value.entries).map(([k, v]) => [profilePrefix(profile.id) + k, v as string]))
      rawLocalStore.setEntries({ ...entries, [profileRegistryKey]: registryValue([...fresh, profile]) })
      await flushStorage()
      setProfiles([...fresh, profile])
      enterProfile(profile.id)
      setMessage('Imported as a separate local profile.')
    })
  }
  function openProfiles() {
    try {
      setProfiles(readCurrentProfiles())
      setName('')
      dialog.current?.showModal()
    } catch (error) {
      setMessage(String(error))
      dialog.current?.showModal()
    }
  }
  if (initial.error) return <main className="home-main">
    <h1>Local profiles need attention</h1>
    <p role="alert">{initial.error}</p>
    <Button type="button" onClick={() => location.reload()}>Reload</Button>
  </main>
  const disabled = Boolean(busy)
  return <>
    <App key={active} profileName={current?.name ?? 'My learning'} onManageProfiles={openProfiles} />
    <dialog ref={dialog} className="profile-dialog" aria-labelledby="profiles-title">
      <div className="hub-dialog-heading">
        <div><span className="home-label">On this device</span><h2 id="profiles-title">Local profiles</h2></div>
        <Button variant="text" disabled={disabled} onClick={() => dialog.current?.close()}>Close</Button>
      </div>
      <p>No signup or connection required. Profiles separate learning data; they do not hide it from people with access to this machine.</p>
      <label>Switch profile<Select value={active} disabled={disabled} onChange={e => void switchTo(e.target.value)}>
        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select></label>
      <details className="profile-management">
        <summary>Create or rename a profile</summary>
        <label>
          Profile name
          <Input maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Name a learner or learning track" />
        </label>
        <div className="hub-actions">
          <Button variant="primary" type="button" disabled={disabled || !name.trim()} onClick={() => void create()}>Create profile</Button>
          <Button type="button" disabled={disabled || !name.trim()} onClick={rename}>Rename current</Button>
        </div>
      </details>
      <details className="profile-portability">
        <summary>Export or import a profile</summary>
        <p>Export a full copy or import a backup into a separate local profile.</p>
        <Button type="button" disabled={disabled} onClick={() => void exportProfile()}>Export current</Button>
        <label className="file-button">Import profile<Input type="file" accept="application/json,.json" disabled={disabled} onChange={e => {
          const file = e.target.files?.[0]
          if (file) void importProfile(file)
          e.target.value = ''
        }} /></label>
      </details>
      <p role="status" className={busy ? 'loading-status profile-loading-status' : undefined}>{busy || message}</p>
      {deleteRequested
        ? <div className="delete-confirm">
          <p>Delete {current?.name} and its drafts, attempts, notes, and assessments? Export first if you want to keep them.</p>
          <Button variant="danger" type="button" disabled={disabled} onClick={() => void remove()}>Delete this profile</Button>
          <Button type="button" disabled={disabled} onClick={() => setDeleteRequested(false)}>Keep profile</Button>
        </div>
        : <Button type="button" disabled={disabled || profiles.length <= 1} onClick={() => setDeleteRequested(true)}>
          Delete current profile…
        </Button>}
    </dialog>
  </>
}
