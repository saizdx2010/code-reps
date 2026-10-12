import { reviews } from './review-registry.ts'

export type ReflectionGuide = { plan: string[]; explanation: string[]; example: string }

// Authored self-review guides, shown after an attempt.
export const reflectionGuides: Record<string, ReflectionGuide> = Object.assign({}, ...reviews.map(review => review.guides))
