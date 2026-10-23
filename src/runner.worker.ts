import { compileSolution } from './compile-solution.ts'
import { repSourceLoaders } from './rep-chunks.ts'
import { runBreakIt, runRepChecksAsync } from './run-rep.ts'
import type { SqliteFactory } from './sqlite-task.ts'
import type { Rep } from './rep-types.ts'
import type { CompileRequest } from './runner.types'
import { lifeStepper } from './life-toy.ts'
import type { LifeSources, LifeStep } from './life-toy.ts'
import type { ToyKind } from './toy-session'

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

// A toy (the Game of Life) keeps one worker while it is open and runs the learner's saved code here,
// never on the page. The compiled parts are kept until the sources change; the page stops the worker if a run takes
// more than five seconds.
type ToyRequest = { toy: { id: number; kind: ToyKind; sources: Record<string, string>; input: unknown } }
const compile = (source: string, functionName: string) => compileSolution(source, functionName)
const toys: Record<ToyKind, (sources: Record<string, string>) => (input: never) => unknown> = {
  life: sources => lifeStepper(sources as LifeSources, compile) as (step: LifeStep) => unknown,
}
let toy: { key: string; run: (input: never) => unknown } | undefined

self.onmessage = async (event: MessageEvent<RunRequest | PrepareRequest | { compile: CompileRequest } | ToyRequest>) => {
  const data = event.data
  if ('toy' in data) {
    const { id, kind, sources, input } = data.toy
    // The time limit starts here, once the worker has loaded, as check runs start theirs after preparing.
    self.postMessage({ toy: { id, started: true } })
    try {
      const key = `${kind}:${JSON.stringify(sources)}`
      if (toy?.key !== key) toy = { key, run: toys[kind](sources) }
      self.postMessage({ toy: { id, result: toy.run(input as never) } })
    } catch (error) {
      toy = undefined
      self.postMessage({
        toy: { id, result: { error: error instanceof Error ? error.message : 'Your saved code could not be prepared.' } },
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
    // A Break it hunt also sends back each try as recomputed here, which the hunt saves and shows.
    self.postMessage(
      ready.rep.breakIt
        ? runBreakIt(data.code, ready.rep)
        : { results: await runRepChecksAsync(data.code, ready.rep, ready.createDatabase) },
    )
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Could not run the solution.' })
  }
}
