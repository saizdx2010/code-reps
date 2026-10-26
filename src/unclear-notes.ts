import type { LearningNote } from './fluency.ts'

// "Something unclear?" in a rep's brief saves an ordinary Notebook question, so nothing new is stored and backups,
// merging, and the Notebook already handle it. The id prefix and title make these notes easy to find for the quality
// pass (docs/QUALITY_PASS.md): search the Notebook for "Unclear".
export const unclearPrefix = 'unclear-'
export const unclearParts = ['The task or rules', 'The example', 'A hint', 'A check name', 'A word'] as const
export type UnclearPart = (typeof unclearParts)[number]

const titleLimit = 120
const bodyLimit = 2000

/** The Notebook entry for a flag, or undefined when the learner chose no part and wrote nothing. */
export function unclearNote(input: {
  id: string
  repId: string
  repTitle: string
  skillId: string
  parts: readonly UnclearPart[]
  detail: string
  now: number
}): LearningNote | undefined {
  const parts = unclearParts.filter(part => input.parts.includes(part))
  const detail = input.detail.trim().slice(0, bodyLimit)
  if (!parts.length && !detail) return undefined
  return {
    id: `${unclearPrefix}${input.id}`.slice(0, 80),
    title: `Unclear: ${input.repTitle}`.slice(0, titleLimit),
    body: [parts.length ? `Unclear part: ${parts.join(', ')}.` : '', detail].filter(Boolean).join('\n\n'),
    skillId: input.skillId,
    repId: input.repId,
    kind: 'question',
    updatedAt: new Date(input.now).toISOString(),
  }
}

/** This rep's flags, newest first. */
export function unclearNotesFor(notes: readonly LearningNote[], repId: string): LearningNote[] {
  return notes
    .filter(note => note.repId === repId && note.id.startsWith(unclearPrefix))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}
