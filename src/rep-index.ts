// Light lookups over the generated catalog. Full rep bodies live in the rep modules and load with practice.
import { repIndex, type RepSummary } from './catalog-index.ts'

export const repSummaryById: ReadonlyMap<string, RepSummary> = new Map(repIndex.map(rep => [rep.id, rep]))
/** The authored title, or the ID itself when a record names a rep that no longer exists. */
export const repTitle = (id: string): string => repSummaryById.get(id)?.title ?? id
