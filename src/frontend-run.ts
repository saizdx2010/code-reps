import { buildFrontendFrame } from './frontend-frame.ts'
import type { Rep } from './rep'
import type { TestResult } from './runner.types'

type FrameEnvironment = { document: Document; window: Window; token: string }

export function startFrontendRun(code: string, rep: Rep, onResults: (results: TestResult[]) => void, onError: (message: string) => void, environment: FrameEnvironment = { document, window, token: crypto.randomUUID() }): () => void {
  const { document: frameDocument, window: frameWindow, token } = environment
  const frame = frameDocument.createElement('iframe')
  frame.title = 'Frontend interaction checks'
  frame.hidden = true
  frame.setAttribute('sandbox', 'allow-scripts')
  let timer: number | undefined
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    frameWindow.removeEventListener('message', receive)
    if (timer !== undefined) frameWindow.clearTimeout(timer)
    frame.remove()
  }
  const receive = (event: MessageEvent) => {
    if (disposed || event.source !== frame.contentWindow || event.data?.token !== token) return
    const data = event.data as { results?: TestResult[]; error?: string }
    if (typeof data.error === 'string') { dispose(); onError(data.error) }
    else if (Array.isArray(data.results)) {
      const complete = data.results.length === rep.checks.length && data.results.every((result, index) =>
        result?.name === rep.checks[index].name && typeof result.passed === 'boolean' &&
        (result.input === undefined || typeof result.input === 'string') &&
        (result.message === undefined || typeof result.message === 'string') &&
        (result.expected === undefined || typeof result.expected === 'string') &&
        (result.actual === undefined || typeof result.actual === 'string'))
      dispose()
      if (complete) onResults(data.results)
      else onError('Browser checks returned incomplete feedback. Your code is still here; try again.')
    }
  }
  try {
    frame.srcdoc = buildFrontendFrame(code, rep, token, 'checks')
    frameWindow.addEventListener('message', receive)
    timer = frameWindow.setTimeout(() => { if (disposed) return; dispose(); onError('The browser checks did not finish. Your code is still here; review it and try again.') }, 5000)
    frameDocument.body.append(frame)
  } catch (error) { dispose(); onError(error instanceof Error ? error.message : 'The browser checks could not start.') }
  return dispose
}
