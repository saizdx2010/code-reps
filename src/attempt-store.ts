import { confidenceLabels, isDifficulty } from './attempt-labels.ts'
import type { Confidence, Difficulty } from './attempt-labels.ts'
import type { RepSummary } from './catalog-index.ts'
import type { LearnerStart } from './learning.ts'
import { localStore } from './local-store.ts'
import { normalizeMistakes } from './mistakes.ts'
import { peekRepContent } from './rep-content.ts'

// Storage keys and their value shapes are part of the backup contract: never rename one.
export const attemptKey = (repId: string) => `code-reps:attempt:${repId}:v1`
export const historyKey = 'code-reps:history:v1'
export const learnerStartKey = 'code-reps:learner-start:v1'
export const selectedRepKey = 'code-reps:selected-rep'

// `code` is undefined only while the rep's starter has not loaded and the learner has no saved draft. It is never written to storage.
export type Attempt = {
  plan: string
  code?: string
  explanation: string
  hintCount: number
  difficulty?: Difficulty
  confidence?: Confidence
  mistakes?: string[]
  completedAt?: string
}
export type AttemptRecord = Attempt & { code: string; id: string; repId: string; completedAt: string }

export const freshAttempt = (starter: string | undefined): Attempt => ({ plan: '', code: starter, explanation: '', hintCount: 0 })

/** A draft with no code yet is skipped: it would be read back as a saved draft and fail backup validation. */
export function saveAttempt(repId: string, attempt: Attempt) {
  if (attempt.code !== undefined) localStore.setItem(attemptKey(repId), JSON.stringify(attempt))
}

export function readHistory(): AttemptRecord[] {
  try {
    const saved: unknown = JSON.parse(localStore.getItem(historyKey) || '[]')
    if (!Array.isArray(saved)) return []
    return saved
      .filter(
        (item): item is AttemptRecord =>
          typeof item?.id === 'string' &&
          typeof item?.repId === 'string' &&
          typeof item?.completedAt === 'string' &&
          typeof item?.plan === 'string' &&
          typeof item?.code === 'string' &&
          typeof item?.explanation === 'string',
      )
      .map(item => ({ ...item, mistakes: normalizeMistakes(item.mistakes) }))
  } catch {
    return []
  }
}

export function readAttempt(rep: RepSummary): Attempt {
  try {
    const saved = JSON.parse(localStore.getItem(attemptKey(rep.id)) || 'null') as Partial<Attempt> | null
    return {
      plan: typeof saved?.plan === 'string' ? saved.plan : '',
      code: typeof saved?.code === 'string' ? saved.code : peekRepContent(rep.id)?.rep.starter,
      explanation: typeof saved?.explanation === 'string' ? saved.explanation : '',
      hintCount: typeof saved?.hintCount === 'number' ? Math.min(rep.hintTotal, Math.max(0, saved.hintCount)) : 0,
      difficulty: isDifficulty(saved?.difficulty) ? saved.difficulty : undefined,
      confidence: saved?.confidence && saved.confidence in confidenceLabels ? saved.confidence : undefined,
      mistakes: normalizeMistakes(saved?.mistakes),
      completedAt: typeof saved?.completedAt === 'string' ? saved.completedAt : undefined,
    }
  } catch {
    return freshAttempt(peekRepContent(rep.id)?.rep.starter)
  }
}

export function readLearnerStart(): LearnerStart | null {
  try {
    const saved = localStore.getItem(learnerStartKey)
    return saved === 'new' || saved === 'returning' ? saved : null
  } catch {
    return null
  }
}
