import { repDepth } from './rep-depth.ts'
import { lessonDepth } from './lesson-depth.ts'

// Structural checks enforce coverage; editorial review must establish teaching quality.
export function validateContentDepth(repIds: Set<string>, skillIds: Set<string>, reviews = repDepth, lessons = lessonDepth) {
  const errors: string[] = []
  function check(ids: Set<string>, entries: Record<string, object>, fields: string[], label: string) {
    for (const id of ids) {
      const entry = entries[id] as Record<string, unknown> | undefined
      for (const field of fields) {
        if (typeof entry?.[field] !== 'string' || !entry[field].trim()) errors.push(`${id}: missing ${label} ${field}`)
      }
    }
    for (const id of Object.keys(entries)) if (!ids.has(id)) errors.push(`${id}: unknown ${label} target`)
  }
  check(repIds, reviews, ['reasoning', 'trace', 'alternative', 'counterexample', 'transfer'], 'rep review')
  for (const [id, review] of Object.entries(reviews)) {
    const trace = review.traceSteps
    if (!trace) continue
    if (!Array.isArray(trace.code) || !trace.code.length || trace.code.some(line => typeof line !== 'string') || !trace.code.some(line => typeof line === 'string' && line.trim())) errors.push(`${id}: trace code must be non-empty`)
    if (!Array.isArray(trace.steps) || trace.steps.length < 2) errors.push(`${id}: trace needs at least two steps`)
    for (const [index, step] of (trace.steps ?? []).entries()) {
      if (!Number.isInteger(step.line) || step.line < 0 || step.line >= (trace.code?.length ?? 0)) errors.push(`${id}: trace step ${index} line is out of bounds`)
      if (typeof step.note !== 'string' || !step.note.trim()) errors.push(`${id}: trace step ${index} needs a note`)
      if (step.structure?.kind === 'array') {
        for (const pointer of Object.values(step.structure.pointers ?? {})) {
          if (!Number.isInteger(pointer) || pointer < 0 || pointer >= step.structure.values.length) errors.push(`${id}: trace step ${index} pointer is out of bounds`)
        }
      }
    }
  }
  check(skillIds, lessons, ['title', 'code', 'reasoning', 'challenge', 'answer'], 'lesson depth')
  return errors
}
