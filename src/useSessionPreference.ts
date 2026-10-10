import { useCallback, useState } from 'react'
import { getActiveProfile } from './local-store'

/** Session-only UI preferences survive refresh without entering learner backups. */
export function useSessionPreference<T extends string = string>(key: string, initial: T, scope = getActiveProfile()) {
  const [value, setValue] = useState<T>(() => {
    try { return (sessionStorage.getItem(`code-reps:ui:${scope}:${key}`) as T | null) ?? initial } catch { return initial }
  })
  // Stable across renders so effects that depend on the setter are not restarted every render.
  const update = useCallback((next: T) => {
    setValue(next)
    try { sessionStorage.setItem(`code-reps:ui:${scope}:${key}`, next) } catch { /* The control still works without storage. */ }
  }, [key, scope])
  return [value, update] as const
}
