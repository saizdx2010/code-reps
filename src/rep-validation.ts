import type { Rep } from './rep-types.ts'

type SelfReviewGuide = { plan: string[]; explanation: string[]; example: string }
const requiredFields = ['title', 'category', 'prompt', 'note', 'planPrompt', 'starter', 'functionName'] as const

/** Per-rep authoring rules shared by tests/content.test.mjs and `yarn content:check`. */
export function validateReps(reps: readonly Rep[], guides: Record<string, SelfReviewGuide | undefined>): string[] {
  const errors: string[] = []
  if (new Set(reps.map(rep => rep.id)).size !== reps.length) errors.push('Exercise IDs must be unique.')
  for (const rep of reps) {
    // SQL reps run the learner's SQL text directly, so they have no function name.
    for (const field of requiredFields)
      if (!rep[field]?.trim() && !(field === 'functionName' && rep.format === 'sql')) errors.push(`${rep.id}: missing ${field}`)
    if (rep.format === 'sql' && (!rep.sql || rep.checks.some(check => !check.sql || !rep.sql?.seeds[check.sql.seed])))
      errors.push(`${rep.id}: SQL checks need a task and known seeds`)
    for (const check of rep.checks) {
      for (const { pattern } of [...(check.sql?.plan?.uses ?? []), ...(check.sql?.plan?.avoids ?? [])])
        try {
          new RegExp(pattern)
        } catch {
          errors.push(`${rep.id}: ${check.name} has an invalid plan pattern`)
        }
    }
    for (const check of rep.checks)
      if (check.sql?.labels && check.sql.labels.length !== (check.sql.probes?.length ?? 0))
        errors.push(`${rep.id}: ${check.name} needs one label per probe`)
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
