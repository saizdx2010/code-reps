import { Icon } from './Icon'
import { Button } from './Button'
import { PageHeader } from './Layout'
import { Input, Select } from './Input'
import { parseProfileBackup } from './profile-backup'
import { backupFileText } from './portability'
import { repIndex as reps } from './catalog-index'
import { useRef, useState } from 'react'
import App from './App'
import { activateProfile, flushStorage, rawLocalStore } from './local-store'
import { legacyMigration, parseProfiles, profileClearEntries, profilePrefix, profileRegistryKey } from './profiles'
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
  // Throws instead of writing a file that import would reject; the export notice shows why.
  const url = URL.createObjectURL(
    new Blob([backupFileText(value, text => parseProfileBackup(text, new Set(reps.map(r => r.id))))], { type: 'application/json' }),
  )
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
      try {
        selected = sessionStorage.getItem(sessionKey)
      } catch {
        /* A default works without session storage. */
      }
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
  const [newName, setNewName] = useState('')
  const [deleteRequested, setDeleteRequested] = useState(false)
  const [resetRequested, setResetRequested] = useState(false)
  // Bumped by a reset so the workspace remounts and rereads the now-empty profile.
  const [resets, setResets] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const current = profiles.find(p => p.id === active)
  function readCurrentProfiles() {
    return parseProfiles(rawLocalStore.getItem(profileRegistryKey)).profiles
  }
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
    try {
      await action()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : failure)
    } finally {
      setBusy('')
    }
  }
  /** Open a profile's workspace on Home and remember it for this browser session. */
  function enterProfile(id: string) {
    activateProfile(id)
    setActive(id)
    try {
      sessionStorage.setItem(sessionKey, id)
    } catch {
      /* Optional session preference. */
    }
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
      setResetRequested(false)
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
      saveProfiles(readCurrentProfiles().map(p => (p.id === active ? { ...p, name: newName.trim() } : p)))
      setNewName('')
      setMessage('Profile renamed.')
    } catch (error) {
      setMessage(String(error))
    }
  }
  async function remove() {
    await withBusy('Deleting profile…', 'Could not delete profile.', async () => {
      await saveCurrent()
      const fresh = readCurrentProfiles()
      if (fresh.length <= 1) throw new Error('Keep at least one local profile.')
      const remaining = fresh.filter(p => p.id !== active)
      rawLocalStore.setEntries({
        ...profileClearEntries(active, Object.keys(cachedEntries())),
        [profileRegistryKey]: registryValue(remaining),
      })
      await flushStorage()
      setProfiles(remaining)
      enterProfile(remaining[0].id)
      setDeleteRequested(false)
      setMessage('Profile deleted from this installation. Automatic backups may retain earlier copies.')
    })
  }
  /** Clear this profile's practice data but keep the profile and its name, then reopen it on Home. */
  async function reset() {
    await withBusy('Resetting progress…', 'Could not reset progress.', async () => {
      await saveCurrent()
      const fresh = readCurrentProfiles()
      if (!fresh.some(p => p.id === active)) throw new Error('That profile was removed.')
      rawLocalStore.setEntries(profileClearEntries(active, Object.keys(cachedEntries())))
      await flushStorage()
      setProfiles(fresh)
      setResets(n => n + 1)
      enterProfile(active)
      setResetRequested(false)
      setMessage('Progress reset. Automatic backups may retain earlier copies.')
    })
  }
  async function exportProfile() {
    await withBusy('Exporting profile…', 'Could not export profile.', async () => {
      await saveCurrent()
      const prefix = profilePrefix(active)
      const entries = Object.fromEntries(
        Object.entries(cachedEntries())
          .filter(([k]) => k.startsWith(prefix))
          .map(([k, v]) => [k.slice(prefix.length), v]),
      )
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
      setNewName('')
      dialog.current?.showModal()
    } catch (error) {
      setMessage(String(error))
      dialog.current?.showModal()
    }
  }
  if (initial.error)
    return (
      <main className="home-main">
        <PageHeader
          title="Local profiles need attention"
          actions={
            <Button variant="primary" onClick={() => location.reload()}>
              Reload
            </Button>
          }
        />
        <p role="alert">{initial.error}</p>
      </main>
    )
  const disabled = Boolean(busy)
  return (
    <>
      <App key={`${active}:${resets}`} profileName={current?.name ?? 'My learning'} onManageProfiles={openProfiles} />
      <dialog ref={dialog} className="profile-dialog" aria-labelledby="profiles-title">
        {/* The same close control as Search and the glossary: icon, word, and the Esc key that also closes it. */}
        <div className="utility-heading">
          <div>
            <span className="home-label">On this device</span>
            <h2 id="profiles-title">Local profiles</h2>
          </div>
          <button type="button" aria-label="Close" disabled={disabled} onClick={() => dialog.current?.close()}>
            <Icon name="close" />
            Close <kbd>Esc</kbd>
          </button>
        </div>
        <p>
          No signup or connection required. Profiles separate learning data; they do not hide it from people with access to this machine.
        </p>
        <label>
          Switch profile
          <Select value={active} disabled={disabled} onChange={e => void switchTo(e.target.value)}>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <details className="profile-management">
          <summary>New profile</summary>
          <label>
            Profile name
            <Input maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Name a learner or learning track" />
          </label>
          <div className="hub-actions">
            <Button variant="primary" type="button" disabled={disabled || !name.trim()} onClick={() => void create()}>
              Create profile
            </Button>
          </div>
        </details>
        <details className="profile-management">
          <summary>Rename {current?.name}</summary>
          <label>
            New name
            <Input maxLength={60} value={newName} onChange={e => setNewName(e.target.value)} placeholder={current?.name} />
          </label>
          <div className="hub-actions">
            <Button type="button" disabled={disabled || !newName.trim() || newName.trim() === current?.name} onClick={rename}>
              Rename profile
            </Button>
          </div>
        </details>
        <details className="profile-management profile-portability">
          <summary>Full profile file</summary>
          <p>
            A full profile file copies everything in a profile: attempts, drafts, notes, lesson answers, assessments, and preferences.
            Importing one always adds a new profile and never changes {current?.name}. To merge practice into this profile instead, use Back
            up or restore practice on Progress.
          </p>
          <div className="hub-actions">
            <Button type="button" disabled={disabled} onClick={() => void exportProfile()}>
              Export {current?.name}
            </Button>
          </div>
          <label className="profile-import">
            Import as a new profile
            <Input
              type="file"
              accept="application/json,.json"
              disabled={disabled}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) void importProfile(file)
                e.target.value = ''
              }}
            />
          </label>
        </details>
        <p role="status" className={busy ? 'loading-status profile-loading-status' : 'profile-status'}>
          {busy || message}
        </p>
        <div className="profile-delete">
          {resetRequested ? (
            <div className="delete-confirm">
              <p>
                Reset {current?.name}? This clears its drafts, attempts, notes, lesson answers, assessments, and preferences, and keeps the
                profile. Export it first if you want to keep them.
              </p>
              <Button variant="danger" type="button" disabled={disabled} onClick={() => void reset()}>
                Reset progress
              </Button>
              <Button type="button" disabled={disabled} onClick={() => setResetRequested(false)}>
                Keep progress
              </Button>
            </div>
          ) : (
            !deleteRequested && (
              <div className="profile-reset">
                <Button type="button" disabled={disabled} onClick={() => setResetRequested(true)}>
                  Reset {current?.name} progress…
                </Button>
              </div>
            )
          )}
          {deleteRequested ? (
            <div className="delete-confirm">
              <p>Delete {current?.name} and its drafts, attempts, notes, and assessments? Export it first if you want to keep them.</p>
              <Button variant="danger" type="button" disabled={disabled} onClick={() => void remove()}>
                Delete this profile
              </Button>
              <Button type="button" disabled={disabled} onClick={() => setDeleteRequested(false)}>
                Keep profile
              </Button>
            </div>
          ) : resetRequested ? null : profiles.length <= 1 ? (
            <p>This is the only profile, so it cannot be deleted. Create another profile first.</p>
          ) : (
            <Button type="button" disabled={disabled} onClick={() => setDeleteRequested(true)}>
              Delete {current?.name}…
            </Button>
          )}
        </div>
      </dialog>
    </>
  )
}
