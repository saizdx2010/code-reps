import { useCallback, useEffect, useState } from 'react'
import { loadReviewContent, type ReviewContent } from './load-review-content.ts'

type Settled = { repId: string; attempt: number; content?: ReviewContent }

type ReviewContentState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; content: ReviewContent }

/** The open rep's review; only the module that holds it loads. */
export function useReviewContent(repId: string): ReviewContentState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)
  useEffect(() => {
    let current = true
    loadReviewContent(repId).then(
      content => {
        if (current) setSettled({ repId, attempt, content })
      },
      () => {
        if (current) setSettled({ repId, attempt })
      },
    )
    return () => {
      current = false
    }
  }, [repId, attempt])
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  const state: ReviewContentState =
    settled?.attempt !== attempt || settled.repId !== repId
      ? { status: 'loading' }
      : settled.content
        ? { status: 'ready', content: settled.content }
        : { status: 'error' }
  return { ...state, retry }
}
