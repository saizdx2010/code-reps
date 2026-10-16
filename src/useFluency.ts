import { useEffect, useRef, useState } from 'react'
import { emptyFluency, fluencyKey, mergeFluency, parseFluency } from './fluency'
import type { FluencyState } from './fluency'
import { getActiveProfile, localStore } from './local-store'
import { scopedKey } from './profiles'
export function useFluency() {
  const [profile] = useState(getActiveProfile)
  const [loaded] = useState(() => {
    try {
      const raw = localStore.getItem(fluencyKey)
      return { state: raw ? parseFluency(JSON.parse(raw)) : emptyFluency(), raw, error: '' }
    } catch (error) {
      return { state: emptyFluency(), raw: null, error: error instanceof Error ? error.message : 'Learning data could not load.' }
    }
  })
  const [state, setState] = useState(loaded.state)
  const [error, setError] = useState(loaded.error)
  // The saved text this tab last read or wrote; anything else in storage came from another tab.
  const savedRaw = useRef(loaded.raw)
  useEffect(() => {
    if (loaded.error) return
    const receive = (event: StorageEvent) => {
      if (event.key !== scopedKey(profile, fluencyKey) && event.key !== null) return
      if (getActiveProfile() !== profile) return
      try {
        const raw = localStore.getItem(fluencyKey)
        if (raw === savedRaw.current) return
        setState(raw ? parseFluency(JSON.parse(raw)) : emptyFluency())
        savedRaw.current = raw
      } catch {
        // A copy that cannot be read is left alone here; the next save reports it.
      }
    }
    window.addEventListener('storage', receive)
    return () => window.removeEventListener('storage', receive)
  }, [loaded.error, profile])
  function update(next: FluencyState) {
    if (loaded.error) {
      setError(loaded.error)
      return false
    }
    // After a profile switch the old workspace may still be mounted; its changes must not reach the new profile.
    if (getActiveProfile() !== profile) return false
    try {
      const raw = localStore.getItem(fluencyKey)
      // Another tab saved since this one loaded: apply this change on top of its copy instead of replacing it.
      const merged = raw && raw !== savedRaw.current ? mergeFluency(state, next, parseFluency(JSON.parse(raw))) : next
      const valid = parseFluency(merged)
      const text = JSON.stringify(valid)
      localStore.setItem(fluencyKey, text)
      savedRaw.current = text
      setState(valid)
      setError('')
      return true
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not save learning data.')
      return false
    }
  }
  return { state, update, error }
}
