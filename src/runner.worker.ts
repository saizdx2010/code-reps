import { compileSolution } from './compile-solution.ts'
import { repSourceLoaders } from './rep-chunks.ts'
import { runRepChecksAsync } from './run-rep.ts'
import type { SqliteFactory } from './sqlite-task.ts'
import type { Rep } from './rep-types.ts'
import type { CompileRequest } from './runner.types'
import { lifeStepper } from './life-toy.ts'
import type { LifeSources, LifeStep } from './life-toy.ts'

// `source` names the rep's content chunk, so the worker does not need the catalog to find it.
type RunRequest = { code: string; repId: string; source?: string }
type PrepareRequest = { prepare: string; source?: string }
type Prepared = { rep: Rep; createDatabase?: SqliteFactory }

// A worker runs one set of checks, so it prepares at most one rep. Preparing early (while the learner is still writing)
// loads that rep's content and any SQLite engine before Run is pressed.
let prepared: { repId: string; promise: Promise<Prepared> } | undefined
async function loadRep(repId: string, source: string | undefined): Promise<Rep> {
  const loader = source && Object.hasOwn(repSourceLoaders, source) ? repSourceLoaders[source as keyof typeof repSourceLoaders] : undefined
  const rep = loader?.pick(await loader.load()).reps.find(item => item.id === repId)
  if (!rep) throw new Error('This rep could not be found.')
  return rep
}

function prepare(repId: string, source: string | undefined): Promise<Prepared> {
  if (prepared?.repId !== repId) {
    const promise = loadRep(repId, source).then(async rep => ({
      rep,
      // The SQLite engine loads only for reps whose checks use it, before the five-second check limit starts.
      createDatabase: rep.sql ? await (await import('./sqlite-loader.ts')).loadSqlite() : undefined,
    }))
    // An early failure is reported when a run asks for the same rep.
    promise.catch(() => {})
    prepared = { repId, promise }
  }
  return prepared.promise
}

// The Game of Life toy keeps one worker while it is open and steps the learner's saved code here, never on the page.
// The compiled parts are kept until the sources change; the page stops the worker if a step runs past five seconds.
type LifeRequest = { life: { id: number; sources: LifeSources; step: LifeStep } }
let life: { key: string; step: ReturnType<typeof lifeStepper> } | undefined

self.onmessage = async (event: MessageEvent<RunRequest | PrepareRequest | { compile: CompileRequest } | LifeRequest>) => {
  const data = event.data
  if ('life' in data) {
    const { id, sources, step } = data.life
    // The time limit starts here, once the worker has loaded, as check runs start theirs after preparing.
    self.postMessage({ life: { id, started: true } })
    try {
      const key = JSON.stringify(sources)
      if (life?.key !== key) life = { key, step: lifeStepper(sources, (source, functionName) => compileSolution(source, functionName)) }
      self.postMessage({ life: { id, result: life.step(step) } })
    } catch (error) {
      life = undefined
      self.postMessage({
        life: { id, result: { error: error instanceof Error ? error.message : 'Your saved code could not be prepared.' } },
      })
    }
    return
  }
  if ('compile' in data) {
    // Compiling only transforms text; learner code never runs here, so one compile worker can serve many requests.
    const { id, code, functionName, jsx, guardLoops } = data.compile
    try {
      self.postMessage({ compiled: { id, output: compileSolution(code, functionName, jsx, { guardLoops }) } })
    } catch (error) {
      self.postMessage({ compiled: { id, error: error instanceof Error ? error.message : 'The solution could not be compiled.' } })
    }
    return
  }
  if ('prepare' in data) {
    void prepare(data.prepare, data.source)
    return
  }
  try {
    let ready: Prepared
    try {
      ready = await prepare(data.repId, data.source)
    } catch {
      // A failed chunk or engine load is forgotten, so running again retries it.
      prepared = undefined
      throw new Error('This rep could not be loaded. Your code is still here; try running the checks again.')
    }
    self.postMessage({ ready: true })
    self.postMessage({ results: await runRepChecksAsync(data.code, ready.rep, ready.createDatabase) })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Could not run the solution.' })
  }
}
