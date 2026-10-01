import { useState } from 'react'
import { getActiveProfile } from './local-store'

/** Session-only UI preferences survive refresh without entering learner backups. */
export function useSessionPreference<T extends string = string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { return (sessionStorage.getItem(`code-reps:ui:${getActiveProfile()}:${key}`) as T | null) ?? initial } catch { return initial }
  })
  function update(next: T) {
    setValue(next)
    try { sessionStorage.setItem(`code-reps:ui:${getActiveProfile()}:${key}`, next) } catch { /* The control still works without storage. */ }
  }
  return [value, update] as const
}
