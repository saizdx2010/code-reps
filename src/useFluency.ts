import { useState } from 'react'
import { emptyFluency, fluencyKey, parseFluency } from './fluency'
import type { FluencyState } from './fluency'
import { localStore } from './local-store'
export function useFluency() {
  const [loaded] = useState(() => {
    try { const raw = localStore.getItem(fluencyKey); return { state: raw ? parseFluency(JSON.parse(raw)) : emptyFluency(), error: '' } }
    catch (error) { return { state: emptyFluency(), error: error instanceof Error ? error.message : 'Learning data could not load.' } }
  })
  const [state, setState] = useState(loaded.state)
  const [error, setError] = useState(loaded.error)
  function update(next: FluencyState) {
    if (loaded.error) { setError(loaded.error); return false }
    try { const valid = parseFluency(next); localStore.setItem(fluencyKey, JSON.stringify(valid)); setState(valid); setError(''); return true }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not save learning data.'); return false }
  }
  return { state, update, error }
}
