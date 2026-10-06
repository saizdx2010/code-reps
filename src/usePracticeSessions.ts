import { useEffect, useRef, useState } from 'react'
import { getActiveProfile, localStore, flushStorage, retryStorage, isServerReady } from './local-store'
import { scopedKey } from './profiles'
import { assertSessionRevision, emptySessions, finishSession, mergeSessions, parseSessions, sessionsKey } from './practice-sessions'
import type { PracticeSession, SessionState } from './practice-sessions'
import { reps } from './rep'

const repIds = new Set(reps.map(rep => rep.id))
export function usePracticeSessions() {
  const [loaded] = useState(() => {
    try { const raw = localStore.getItem(sessionsKey); return { raw, state: raw === null ? emptySessions() : parseSessions(JSON.parse(raw), repIds), error: '' } }
    catch (error) { return { raw: null, state: emptySessions(), error: String(error) } }
  })
  const [state, setState] = useState(loaded.state)
  const stateRef = useRef(loaded.state)
  const expected = useRef(loaded.raw)
  const [error, setError] = useState(loaded.error)
  const blocked = useRef(Boolean(loaded.error))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [reflections, setReflections] = useState<Record<string, string>>({})
  const reflectionRef = useRef(reflections)
  const pending = useRef(Promise.resolve())
  const [profile] = useState(getActiveProfile)
  const pendingCount = useRef(0)
  const lockName = scopedKey(profile, sessionsKey)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  function commit(change: (current: SessionState) => SessionState, entries: Record<string, string> | (() => Record<string, string>) = {}) {
    pendingCount.current++
    const work = async () => {
      if (getActiveProfile() !== profile) throw new Error('Keep this profile open until its practice save finishes.')
      if (blocked.current) throw new Error(error || 'Reload session records before saving again. Your reflection is kept here.')
      const write = () => {
        const current = localStore.getItem(sessionsKey)
        assertSessionRevision(expected.current, current)
        const next = parseSessions({ ...change(stateRef.current), revision: crypto.randomUUID() }, repIds)
        const raw = JSON.stringify(next)
        localStore.setEntries({ ...(typeof entries === 'function' ? entries() : entries), [sessionsKey]: raw })
        expected.current = raw
        stateRef.current = next
        if (mounted.current) { setState(next); setError(''); setMessage('Saved in browser') }
      }
      // Serialize same-origin session writes across tabs, then reject a stale loaded revision.
      if (navigator.locks) await navigator.locks.request(lockName, write)
      else throw new Error('This browser cannot coordinate session saves safely. Use a browser with Web Locks; your coding drafts remain usable.')
      void flushStorage().then(() => {
        if (mounted.current) setMessage(isServerReady() ? 'Saved on this laptop' : 'Saved in browser')
      }).catch(() => { if (mounted.current) setMessage('Saved in browser; waiting for the local server. Retry saving or download a backup.') })
    }
    const result = pending.current.then(work).finally(() => { pendingCount.current-- })
    pending.current = result.catch(problem => {
      if (mounted.current) setError(problem instanceof Error ? problem.message : 'Practice could not save. Retry or download a backup.')
      if (problem instanceof Error && /another tab|Reload session/.test(problem.message)) blocked.current = true
    })
    return result
  }

  function reflection(id: string) { return reflections[id] ?? state.records.find(record => record.id === id)?.reflection ?? '' }
  function currentReflection(id: string) { return reflectionRef.current[id] ?? stateRef.current.records.find(record => record.id === id)?.reflection ?? '' }
  function setReflection(id: string, value: string) {
    reflectionRef.current = { ...reflectionRef.current, [id]: value }
    setReflections(reflectionRef.current)
    void commit(current => ({ ...current, records: current.records.map(record => record.id === id ? { ...record, reflection: value } : record) })).then(() => {
      if (reflectionRef.current[id] === value) { const next = { ...reflectionRef.current }; delete next[id]; reflectionRef.current = next; if (mounted.current) setReflections(next) }
    }).catch(() => {})
  }
  async function start(repId: string, hintCount: number, entries: Record<string, string> | (() => Record<string, string>)) {
    setBusy(true)
    try {
      const record: PracticeSession = { id: crypto.randomUUID(), repId, startedAt: new Date().toISOString(), reflection: '', hintCount }
      await commit(current => ({ ...current, records: [record, ...current.records] }), entries)
      setActiveId(record.id)
      return true
    } catch { return false } finally { setBusy(false) }
  }
  async function end(id: string, hintCount: number, difficulty: PracticeSession['difficulty'], entries: Record<string, string> | (() => Record<string, string>)) {
    setBusy(true)
    try {
      await commit(current => ({ ...current, records: current.records.map(record => record.id === id ? finishSession({ ...record, reflection: currentReflection(id), hintCount: Math.max(record.hintCount, hintCount), ...(difficulty ? { difficulty } : {}) }, new Date().toISOString()) : record) }), entries)
      setActiveId(null)
      return stateRef.current.records.find(record => record.id === id)
    } catch { return false } finally { setBusy(false) }
  }
  function recordCompletion(attemptId: string, repId: string, hintCount: number, entries: Record<string, string> | (() => Record<string, string>)) {
    return commit(current => ({ ...current, records: current.records.map(record => record.id === activeId && record.repId === repId && !record.endedAt ? { ...record, attemptId, hintCount: Math.max(record.hintCount, hintCount) } : record) }), entries)
  }
  async function remove(id: string) {
    try { await commit(current => ({ ...current, records: current.records.filter(record => record.id !== id) })); if (activeId === id) setActiveId(null) } catch { /* Recovery controls show the failure. */ }
  }
  async function retry() {
    try {
      await commit(current => ({ ...current, records: current.records.map(record => ({ ...record, reflection: currentReflection(record.id) })) }))
      reflectionRef.current = {}; setReflections({})
      await retryStorage()
      setMessage(isServerReady() ? 'Saved on this laptop' : 'Saved in browser')
    } catch (problem) { setError(String(problem)) }
  }
  function reload() {
    try {
      const raw = localStore.getItem(sessionsKey)
      const next = raw === null ? emptySessions() : parseSessions(JSON.parse(raw), repIds)
      expected.current = raw; stateRef.current = next; blocked.current = false; setState(next); setActiveId(null); setError(''); setMessage('Session records reloaded. Unsaved reflection text is kept; retry saving to apply it.')
    } catch (problem) { setError(String(problem)) }
  }
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if ((event.key === lockName || event.key === null) && localStore.getItem(sessionsKey) !== expected.current) {
        blocked.current = true
        setError('Practice history changed in another tab. Your reflection is kept here. Reload session records before saving again.')
      }
    }
    window.addEventListener('storage', receive)
    const saveCurrent = (event: Event) => { if (pendingCount.current || busy || (error && Object.keys(reflectionRef.current).length > 0)) event.preventDefault() }
    window.addEventListener('code-reps-save-current', saveCurrent)
    return () => { window.removeEventListener('storage', receive); window.removeEventListener('code-reps-save-current', saveCurrent) }
  }, [lockName, error, busy])
  function backup() { return parseSessions({ ...stateRef.current, records: stateRef.current.records.map(record => ({ ...record, reflection: record.endedAt && !currentReflection(record.id).trim() ? record.reflection : currentReflection(record.id) })) }, repIds) }
  function observeHints(id: string, hintCount: number) {
    if (hintCount <= (stateRef.current.records.find(record => record.id === id)?.hintCount ?? 0)) return
    void commit(current => ({ ...current, records: current.records.map(record => record.id === id ? { ...record, hintCount: Math.max(record.hintCount, hintCount) } : record) })).catch(() => {})
  }
  function importRecords(incoming: SessionState, entries: Record<string, string>) { return commit(current => mergeSessions(current, incoming, repIds), entries) }
  return { pause: () => setActiveId(null), importRecords, state, activeId, error, message, busy, reflection, setReflection, start, end, remove, retry, reload, backup, recordCompletion, observeHints,
    flush: () => pending.current, verifyRevision: () => assertSessionRevision(expected.current, localStore.getItem(sessionsKey)) }
}
