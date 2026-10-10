// Heavy rep material (brief, example, notes, vocabulary, hints, checks, the lesson before a rep) is loaded when a rep opens.
// Each source file below becomes its own chunk. Keep startup modules on src/catalog-index.ts and never import a rep module directly.
import { repIndex, type RepSourceName } from './catalog-index.ts'
import type { Rep } from './rep-types.ts'

export type RepLesson = { repId: string; title: string; explanation: string; example: string; tip: string }
export type RepContent = { rep: Rep; lesson?: RepLesson }
type Source = { reps: Rep[]; lessons?: readonly RepLesson[] }

// A browser remembers a failed import of one URL, so Retry cannot simply import it again.
// `pick` is separate from `load` so a retry can import the same chunk under a fresh query string.
type Loader = { load: () => Promise<unknown>; pick: (module: unknown) => Source }
function source<Module>(load: () => Promise<Module>, pick: (module: Module) => Source): Loader {
  return { load, pick: pick as (module: unknown) => Source }
}
const sources: Record<RepSourceName, Loader> = {
  'practical-concepts': source(() => import('./practical-concepts.ts'), module => ({ reps: module.practicalReps })),
  'foundations': source(() => import('./foundations.ts'), module => ({ reps: module.foundationReps, lessons: module.foundations })),
  'dsa-reps': source(() => import('./dsa-reps.ts'), module => ({ reps: module.dsaReps })),
  'dsa-advanced-reps': source(() => import('./dsa-advanced-reps.ts'), module => ({ reps: module.dsaAdvancedReps })),
  'ai-era-reps': source(() => import('./ai-era-reps.ts'), module => ({ reps: module.aiEraReps, lessons: module.coreLessons })),
  'core-reps': source(() => import('./core-reps.ts'), module => ({ reps: module.coreReps })),
  'journey-reps': source(() => import('./journey-reps.ts'), module => ({ reps: module.journeyReps })),
  'transfer-reps': source(() => import('./transfer-reps.ts'), module => ({ reps: module.transferReps })),
  'rich-reps': source(() => import('./rich-reps.ts'), module => ({ reps: module.richReps })),
  'fluency-reps': source(() => import('./fluency-reps.ts'), module => ({ reps: module.fluencyReps })),
  'capstone-reps': source(() => import('./capstone-reps.ts'), module => ({ reps: module.capstoneReps })),
  'validation-reps': source(() => import('./validation-reps.ts'), module => ({ reps: module.validationReps })),
  'app-reps': source(() => import('./app-reps.ts'), module => ({ reps: module.appReps })),
  'browser-state-reps': source(() => import('./browser-state-reps.ts'), module => ({ reps: module.browserStateReps })),
  'dom-reps': source(() => import('./dom-reps.ts'), module => ({ reps: module.domReps })),
  'connected-feature-reps': source(() => import('./connected-feature-reps.ts'), module => ({ reps: module.connectedFeatureReps })),
  'testing-journey-reps': source(() => import('./testing-journey-reps.ts'), module => ({ reps: module.testingJourneyReps })),
}

const pending = new Map<RepSourceName, Promise<Source>>()
const loaded = new Map<RepSourceName, Source>()
const failedUrls = new Map<RepSourceName, { url: string; retries: number }>()
const moduleUrl = (error: unknown) => (error instanceof Error ? error.message : '').match(/https?:\/\/[^\s'"]+/)?.[0]

function importSource(name: RepSourceName): Promise<unknown> {
  const failed = failedUrls.get(name)
  // Chromium never re-requests a URL whose dynamic import failed, so ask for the same file with a new query.
  if (failed) return import(/* @vite-ignore */ `${failed.url.split('?')[0]}?retry=${++failed.retries}`)
  return sources[name].load()
}

function loadSource(name: RepSourceName): Promise<Source> {
  let promise = pending.get(name)
  if (!promise) {
    // A failed import is forgotten so Retry can request the chunk again.
    promise = importSource(name).then(module => {
      const picked = sources[name].pick(module)
      loaded.set(name, picked)
      failedUrls.delete(name)
      return picked
    }, error => {
      pending.delete(name)
      const url = moduleUrl(error)
      if (url && !failedUrls.has(name)) failedUrls.set(name, { url, retries: 0 })
      throw error
    })
    pending.set(name, promise)
  }
  return promise
}

function contentFrom(source: Source, entry: { id: string; source: RepSourceName }): RepContent {
  const rep = source.reps.find(item => item.id === entry.id)
  if (!rep) throw new Error(`Rep ${entry.id} is missing from ${entry.source}`)
  return { rep, lesson: source.lessons?.find(lesson => lesson.repId === entry.id) }
}

/** The content of a rep whose source has already loaded, so moving between reps does not flash a loading state. */
export function peekRepContent(repId: string): RepContent | undefined {
  const entry = repIndex.find(item => item.id === repId)
  const source = entry && loaded.get(entry.source)
  return entry && source ? contentFrom(source, entry) : undefined
}

export async function loadRepContent(repId: string): Promise<RepContent> {
  const entry = repIndex.find(item => item.id === repId)
  if (!entry) throw new Error(`Unknown rep: ${repId}`)
  return contentFrom(await loadSource(entry.source), entry)
}

/** Every rep, in catalog order. Only for views that read all of them, such as the glossary. */
export async function loadAllReps(): Promise<Rep[]> {
  const names = [...new Set(repIndex.map(item => item.source))]
  const loaded = new Map(await Promise.all(names.map(async name => [name, await loadSource(name)] as const)))
  return repIndex.map(entry => loaded.get(entry.source)!.reps.find(rep => rep.id === entry.id)!)
}
