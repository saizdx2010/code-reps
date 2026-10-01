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
  check(skillIds, lessons, ['title', 'code', 'reasoning', 'challenge', 'answer'], 'lesson depth')
  return errors
}
