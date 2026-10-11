import { runAsyncRep } from './runner'

type RunRequest = { code: string; repId: string }

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try { self.postMessage({ results: await runAsyncRep(event.data.code, event.data.repId) }) }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Could not run the solution.' }) }
}
