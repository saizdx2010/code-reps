// The shape of one rep source and its lazy loader. src/rep-chunks.ts holds a generated loader for every source in src/rep-sources.ts.
import type { Rep } from './rep-types.ts'

export type RepLesson = { repId: string; title: string; explanation: string; example: string; tip: string }
export type RepSource = { reps: Rep[]; lessons?: readonly RepLesson[] }

// A browser remembers a failed import of one URL, so Retry cannot simply import it again.
// `pick` is separate from `load` so a retry can import the same chunk under a fresh query string.
export type RepSourceLoader = { load: () => Promise<unknown>; pick: (module: unknown) => RepSource }
export function source<Module>(load: () => Promise<Module>, pick: (module: Module) => RepSource): RepSourceLoader {
  return { load, pick: pick as (module: unknown) => RepSource }
}
