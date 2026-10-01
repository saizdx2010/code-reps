import { Button } from './Button'
import { Input, Select } from './Input'
import { parseProfileBackup } from './profile-backup'
import { reps } from './rep'
import { useRef, useState } from 'react'
import App from './App'
import { activateProfile, flushStorage, rawLocalStore } from './local-store'
import { legacyMigration, parseProfiles, profilePrefix, profileRegistryKey } from './profiles'
import type { LocalProfile } from './profiles'
import './fluency.css'
const sessionKey = 'code-reps:active-profile'
function cachedEntries() {
  const entries: Record<string, string> = {}
  for (let i=0; i<localStorage.length; i++) { const key=localStorage.key(i); if(key?.startsWith('code-reps:')) entries[key]=localStorage.getItem(key)! }
  return entries
}
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href=url; link.download=name; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export default function ProfileApp() {
  const [initial] = useState(() => {
    try {
      const raw = rawLocalStore.getItem(profileRegistryKey)
      const registry = parseProfiles(raw)
      if (!raw) rawLocalStore.setEntries({ ...legacyMigration(cachedEntries()), [profileRegistryKey]: JSON.stringify(registry) })
      let selected: string | null = null
      try { selected=sessionStorage.getItem(sessionKey) } catch { /* A default works without session storage. */ }
      const id=registry.profiles.some(p=>p.id===selected) ? selected! : registry.profiles[0].id
      activateProfile(id)
      return { profiles: registry.profiles, id, error: '' }
    } catch(error) { return { profiles: [] as LocalProfile[], id: '', error: error instanceof Error ? error.message : 'Profiles could not load.' } }
  })
  const [profiles,setProfiles]=useState(initial.profiles)
  const [active,setActive]=useState(initial.id)
  const [message,setMessage]=useState(initial.error)
  const [busy,setBusy]=useState(false)
  const [name,setName]=useState('')
  const [deleteRequested,setDeleteRequested]=useState(false)
  const dialog=useRef<HTMLDialogElement>(null)
  const current=profiles.find(p=>p.id===active)
  function readCurrentProfiles() { return parseProfiles(rawLocalStore.getItem(profileRegistryKey)).profiles }
  function saveProfiles(next: LocalProfile[]) { rawLocalStore.setItem(profileRegistryKey,JSON.stringify({version:1,profiles:next})); setProfiles(next) }
  async function saveCurrent() { if (!window.dispatchEvent(new Event('code-reps-save-current', { cancelable: true }))) throw new Error('Current work could not be saved. Keep this profile open and export a backup.'); await flushStorage() }
  async function switchTo(id: string) {
    setBusy(true); setMessage('')
    try { await saveCurrent(); const fresh=readCurrentProfiles(); if(!fresh.some(p=>p.id===id)) throw new Error('That profile was removed.'); setProfiles(fresh); activateProfile(id); setActive(id); try { sessionStorage.setItem(sessionKey,id) } catch { /* Optional session preference. */ } location.hash='#/home'; setDeleteRequested(false) }
    catch(error) { setMessage(error instanceof Error ? error.message : 'Could not switch profiles.') }
    finally { setBusy(false) }
  }
  async function create() {
    if(!name.trim()) return
    setBusy(true)
    try { await saveCurrent(); const fresh=readCurrentProfiles(); if(fresh.length>=50) throw new Error('This installation supports up to 50 profiles.'); const next={id:crypto.randomUUID(),name:name.trim(),createdAt:new Date().toISOString()}; saveProfiles([...fresh,next]); await flushStorage(); activateProfile(next.id); setActive(next.id); try { sessionStorage.setItem(sessionKey,next.id) } catch { /* Optional. */ } location.hash='#/home'; setName('');setMessage('Profile created.') }
    catch(error) { setMessage(error instanceof Error ? error.message : 'Could not create profile.') } finally {setBusy(false)}
  }
  async function remove() {
    setBusy(true)
    try {
      await saveCurrent(); const fresh=readCurrentProfiles(); if(fresh.length<=1) throw new Error('Keep at least one local profile.')
      const remaining=fresh.filter(p=>p.id!==active); const prefix=profilePrefix(active)
      const deletes=Object.fromEntries(Object.keys(cachedEntries()).filter(k=>k.startsWith(prefix)).map(k=>[k,null]))
      rawLocalStore.setEntries({...deletes,[profileRegistryKey]:JSON.stringify({version:1,profiles:remaining})}); await flushStorage(); setProfiles(remaining);activateProfile(remaining[0].id);setActive(remaining[0].id);try { sessionStorage.setItem(sessionKey,remaining[0].id) } catch { /* Optional. */ } location.hash='#/home';setDeleteRequested(false);setMessage('Profile deleted from this installation. Automatic backups may retain earlier copies.')
    }catch(error){setMessage(error instanceof Error?error.message:'Could not delete profile.')}finally{setBusy(false)}
  }
  async function exportProfile() {
    try { await saveCurrent(); const prefix=profilePrefix(active); const entries=Object.fromEntries(Object.entries(cachedEntries()).filter(([k])=>k.startsWith(prefix)).map(([k,v])=>[k.slice(prefix.length),v]));download({format:'code-reps-profile',version:1,name:current?.name,exportedAt:new Date().toISOString(),entries},`code-reps-profile-${active}.json`);setMessage('Full profile exported, including notes, assessments, preferences, and attempts.') } catch(error){setMessage(error instanceof Error?error.message:'Could not export profile.')}
  }
  async function importProfile(file: File) {
    setBusy(true)
    try {
      const value=parseProfileBackup(await file.text(),new Set(reps.map(r=>r.id)))
      await saveCurrent(); const fresh=readCurrentProfiles();if(fresh.length>=50)throw new Error('This installation supports up to 50 profiles.');const profile={id:crypto.randomUUID(),name:value.name,createdAt:new Date().toISOString()}
      rawLocalStore.setEntries({...Object.fromEntries(Object.entries(value.entries).map(([k,v])=>[profilePrefix(profile.id)+k,v as string])),[profileRegistryKey]:JSON.stringify({version:1,profiles:[...fresh,profile]})});await flushStorage();setProfiles([...fresh,profile]);activateProfile(profile.id);setActive(profile.id);try { sessionStorage.setItem(sessionKey,profile.id) } catch { /* Optional. */ }location.hash='#/home';setMessage('Imported as a separate local profile.')
    }catch(error){setMessage(error instanceof Error?error.message:'Could not import profile.')}finally{setBusy(false)}
  }
  if(initial.error)return <main className="home-main"><h1>Local profiles need attention</h1><p role="alert">{initial.error}</p><Button type="button" onClick={()=>location.reload()}>Reload</Button></main>
  return <><div className="profile-strip"><span>LOCAL PROFILE</span><strong>{current?.name}</strong><Button type="button" className="text-button" onClick={()=>{try{setProfiles(readCurrentProfiles());setName('');dialog.current?.showModal()}catch(error){setMessage(String(error));dialog.current?.showModal()}}}>Manage profiles</Button></div><App key={active}/><dialog ref={dialog} className="profile-dialog" aria-labelledby="profiles-title"><div className="hub-dialog-heading"><div><span className="home-label">ON THIS DEVICE</span><h2 id="profiles-title">Local profiles</h2></div><Button variant="text" disabled={busy} onClick={()=>dialog.current?.close()}>Close</Button></div><p>No signup or connection required. Profiles separate learning data; they do not hide it from people with access to this machine.</p><label>Switch profile<Select value={active} disabled={busy} onChange={e=>void switchTo(e.target.value)}>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></label><label>Profile name<Input maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="Name a learner or learning track" /></label><div className="hub-actions"><Button variant="primary" type="button" disabled={busy||!name.trim()} onClick={()=>void create()}>Create profile</Button><Button type="button" disabled={busy||!name.trim()} onClick={()=>{try{saveProfiles(readCurrentProfiles().map(p=>p.id===active?{...p,name:name.trim()}:p));setName('');setMessage('Profile renamed.')}catch(error){setMessage(String(error))}}}>Rename current</Button></div><section className="profile-portability"><h3>Take your learning with you</h3><p>Export a full copy or import a backup into a separate local profile.</p><Button type="button" disabled={busy} onClick={()=>void exportProfile()}>Export current</Button><label className="file-button">Import profile<Input type="file" accept="application/json,.json" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void importProfile(file);e.target.value=''}}/></label></section><p role="status">{message}</p>{deleteRequested?<div className="delete-confirm"><p>Delete {current?.name} and its drafts, attempts, notes, and assessments? Export first if you want to keep them.</p><Button variant="danger" type="button" disabled={busy} onClick={()=>void remove()}>Delete this profile</Button><Button type="button" disabled={busy} onClick={()=>setDeleteRequested(false)}>Keep profile</Button></div>:<Button type="button" disabled={busy||profiles.length<=1} onClick={()=>setDeleteRequested(true)}>Delete current profile…</Button>}</dialog></>
}
