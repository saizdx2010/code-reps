import { useCallback, useEffect, useState } from 'react'
import { loadRepContent, peekRepContent, type RepContent } from './rep-content.ts'

type Settled = { repId: string; attempt: number; content?: RepContent; failures?: number }

export type RepContentState = { status: 'loading' } | { status: 'error'; failures: number } | { status: 'ready'; content: RepContent }

/** Loads the heavy material for one rep once `enabled`. A result for a rep the learner has already left is ignored. */
export function useRepContent(repId: string, enabled = true): RepContentState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)
  useEffect(() => {
    if (!enabled) return
    let current = true
    loadRepContent(repId).then(content => { if (current) setSettled({ repId, attempt, content }) }, () => { if (current) setSettled(previous => ({ repId, attempt, failures: previous?.repId === repId ? (previous.failures ?? 0) + 1 : 1 })) })
    return () => { current = false }
  }, [repId, attempt, enabled])
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  const cached = enabled ? peekRepContent(repId) : undefined
  const state: RepContentState = cached ? { status: 'ready', content: cached } : settled?.repId !== repId || settled.attempt !== attempt ? { status: 'loading' } : settled.content ? { status: 'ready', content: settled.content } : { status: 'error', failures: settled.failures ?? 1 }
  return { ...state, retry }
}
