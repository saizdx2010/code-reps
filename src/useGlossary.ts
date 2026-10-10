import { useCallback, useEffect, useState } from 'react'
import { loadAllReps } from './rep-content.ts'

export type GlossaryTerm = { term: string; meaning: string }
type Settled = { attempt: number; terms?: GlossaryTerm[] }
export type GlossaryState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; terms: GlossaryTerm[] }

/** Collects every rep's vocabulary. The material loads when a view that shows the glossary opens, not at startup. */
export function useGlossary(): GlossaryState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)
  useEffect(() => {
    let current = true
    loadAllReps().then(reps => {
      const terms = [...new Map(reps.flatMap(rep => rep.vocabulary.map(entry => [entry.term.toLowerCase(), entry] as const))).values()].sort((a, b) => a.term.localeCompare(b.term))
      if (current) setSettled({ attempt, terms })
    }, () => { if (current) setSettled({ attempt }) })
    return () => { current = false }
  }, [attempt])
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  const state: GlossaryState = settled?.attempt !== attempt ? { status: 'loading' } : settled.terms ? { status: 'ready', terms: settled.terms } : { status: 'error' }
  return { ...state, retry }
}
