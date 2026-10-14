import type { Rep } from './rep-types.ts'

type SelfReviewGuide = { plan: string[]; explanation: string[]; example: string }
const requiredFields = ['title', 'category', 'prompt', 'note', 'planPrompt', 'starter', 'functionName'] as const

/** Per-rep authoring rules shared by tests/content.test.mjs and `yarn content:check`. */
export function validateReps(reps: readonly Rep[], guides: Record<string, SelfReviewGuide | undefined>): string[] {
  const errors: string[] = []
  if (new Set(reps.map(rep => rep.id)).size !== reps.length) errors.push('Exercise IDs must be unique.')
  for (const rep of reps) {
    for (const field of requiredFields) if (!rep[field]?.trim()) errors.push(`${rep.id}: missing ${field}`)
    if (!rep.example?.input || !rep.example.output) errors.push(`${rep.id}: missing example`)
    if (!rep.checks.length || new Set(rep.checks.map(check => check.name)).size !== rep.checks.length)
      errors.push(`${rep.id}: missing or duplicate checks`)
    if (!rep.vocabulary.length || rep.hints.length < 3 || rep.checks.length < 3)
      errors.push(`${rep.id}: incomplete support (needs vocabulary, three hints, and three checks)`)
    const guide = guides[rep.id]
    if (!guide?.plan.length || !guide.explanation.length || !guide.example) errors.push(`${rep.id}: missing self-review`)
  }
  return errors
}
