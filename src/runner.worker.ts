import { repNeedsSqlite, runAsyncRep } from './runner'

type RunRequest = { code: string; repId: string }

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    // The SQLite engine loads only for reps whose checks use it, before the five-second check limit starts.
    const createDatabase = repNeedsSqlite(event.data.repId) ? await (await import('./sqlite-loader.ts')).loadSqlite() : undefined
    self.postMessage({ ready: true })
    self.postMessage({ results: await runAsyncRep(event.data.code, event.data.repId, createDatabase) })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Could not run the solution.' })
  }
}
