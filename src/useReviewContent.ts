import { useCallback, useEffect, useState } from 'react'
import { loadReviewContent, type ReviewContent } from './load-review-content.ts'

type Settled = { attempt: number; content?: ReviewContent }

export type ReviewContentState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; content: ReviewContent }

export function useReviewContent(): ReviewContentState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)
  useEffect(() => {
    let current = true
    loadReviewContent().then(content => { if (current) setSettled({ attempt, content }) }, () => { if (current) setSettled({ attempt }) })
    return () => { current = false }
  }, [attempt])
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  const state: ReviewContentState = settled?.attempt !== attempt ? { status: 'loading' } : settled.content ? { status: 'ready', content: settled.content } : { status: 'error' }
  return { ...state, retry }
}
