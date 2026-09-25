import { runRep } from './runner'

type RunRequest = { code: string; repId: string }

self.onmessage = (event: MessageEvent<RunRequest>) => {
  try { self.postMessage({ results: runRep(event.data.code, event.data.repId) }) }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Could not run the solution.' }) }
}
