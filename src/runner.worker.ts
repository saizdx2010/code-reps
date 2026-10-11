import { runAsyncRep } from './runner'
import { SQLITE_REP_ID } from './sqlite-task.ts'

type RunRequest = { code: string; repId: string }

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    const createDatabase = event.data.repId === SQLITE_REP_ID ? await (await import('./sqlite-loader.ts')).loadSqlite() : undefined
    if (createDatabase) self.postMessage({ ready: true })
    self.postMessage({ results: await runAsyncRep(event.data.code, event.data.repId, createDatabase) })
  }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Could not run the solution.' }) }
}
