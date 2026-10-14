// Heavy rep material (brief, example, notes, vocabulary, hints, checks, the lesson before a rep) is loaded when a rep opens.
// Each source becomes its own chunk through its generated loader in src/rep-chunks.ts.
// Keep startup modules on src/catalog-index.ts and never import a rep module directly.
import { repIndex, type RepSourceName } from './catalog-index.ts'
import { repSourceLoaders as sources } from './rep-chunks.ts'
import type { RepLesson, RepSource as Source } from './rep-source-loader.ts'
import type { Rep } from './rep-types.ts'

export type { RepLesson }
export type RepContent = { rep: Rep; lesson?: RepLesson }

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
    promise = importSource(name).then(
      module => {
        const picked = sources[name].pick(module)
        loaded.set(name, picked)
        failedUrls.delete(name)
        return picked
      },
      error => {
        pending.delete(name)
        const url = moduleUrl(error)
        if (url && !failedUrls.has(name)) failedUrls.set(name, { url, retries: 0 })
        throw error
      },
    )
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
