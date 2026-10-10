// The full catalog, loaded synchronously. Only tests, scripts, and the practice worker import this module.
// The app reads src/catalog-index.ts and loads rep content on demand (src/rep-content.ts).
import { repSources } from './rep-sources.ts'
import type { Rep } from './rep-types.ts'
export type { Check, Rep } from './rep-types.ts'

export const reps: Rep[] = repSources.flatMap(source => source.reps)
