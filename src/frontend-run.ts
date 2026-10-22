import { checkFrontendSize, frontendFrameHtml } from './frontend-frame-html.ts'
import { compileInWorker } from './practice-worker.ts'
import type { Rep } from './rep'
import type { TestResult } from './runner.types'

/** Compiles learner code for the frame. The app compiles in the practice worker; tests may compile synchronously. */
export type FrontendCompile = (code: string, rep: Rep) => string | Promise<string>
type FrameEnvironment = { document: Document; window: Window; token: string; compile?: FrontendCompile }

export const compileFrontend: FrontendCompile = (code, rep) => {
  checkFrontendSize(code)
  return compileInWorker(code, rep.functionName, Boolean(rep.reactPreview), true)
}

export function startFrontendRun(
  code: string,
  rep: Rep,
  onResults: (results: TestResult[]) => void,
  onError: (message: string) => void,
  environment: FrameEnvironment = { document, window, token: crypto.randomUUID() },
): () => void {
  const { document: frameDocument, window: frameWindow, token, compile = compileFrontend } = environment
  const frame = frameDocument.createElement('iframe')
  frame.title = 'Frontend interaction checks'
  // Rendered but offscreen: browsers cannot focus elements inside a display:none frame, and the focus checks need real focus.
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;opacity:0;pointer-events:none'
  frame.setAttribute('sandbox', 'allow-scripts')
  let timer: number | undefined
  let disposed = false
  // Focus checks move real focus into the frame; return it to the learner's control when the run ends.
  const previousFocus = frameDocument.activeElement
  const dispose = () => {
    if (disposed) return
    disposed = true
    frameWindow.removeEventListener('message', receive)
    if (timer !== undefined) frameWindow.clearTimeout(timer)
    const frameHadFocus = frameDocument.activeElement === frame
    frame.remove()
    if (frameHadFocus && previousFocus?.isConnected && 'focus' in previousFocus)
      (previousFocus as HTMLElement).focus({ preventScroll: true })
  }
  const receive = (event: MessageEvent) => {
    if (disposed || event.source !== frame.contentWindow || event.data?.token !== token) return
    const data = event.data as { results?: TestResult[]; error?: string }
    if (typeof data.error === 'string') {
      dispose()
      onError(data.error)
    } else if (Array.isArray(data.results)) {
      const complete =
        data.results.length === rep.checks.length &&
        data.results.every(
          (result, index) =>
            result?.name === rep.checks[index].name &&
            typeof result.passed === 'boolean' &&
            (result.input === undefined || typeof result.input === 'string') &&
            (result.message === undefined || typeof result.message === 'string') &&
            (result.expected === undefined || typeof result.expected === 'string') &&
            (result.actual === undefined || typeof result.actual === 'string'),
        )
      dispose()
      if (complete) onResults(data.results)
      else onError('Browser checks returned incomplete feedback. Your code is still here; try again.')
    }
  }
  const launch = (compiled: string, runtime = '') => {
    if (disposed) return
    try {
      frame.srcdoc = frontendFrameHtml(compiled, rep, token, 'checks', undefined, runtime)
      frameWindow.addEventListener('message', receive)
      timer = frameWindow.setTimeout(() => {
        if (disposed) return
        dispose()
        onError('The browser checks did not finish. Your code is still here; review it and try again.')
      }, 5000)
      frameDocument.body.append(frame)
    } catch (error) {
      dispose()
      onError(error instanceof Error ? error.message : 'The browser checks could not start.')
    }
  }
  const fail = (error: unknown, fallback: string) => {
    if (disposed) return
    dispose()
    onError(error instanceof Error ? error.message : fallback)
  }
  let compiled: string | Promise<string>
  try {
    compiled = compile(code, rep)
  } catch (error) {
    fail(error, 'The browser checks could not start.')
    return dispose
  }
  // A synchronous compile with no React runtime starts the frame at once; otherwise both arrive first.
  if (typeof compiled === 'string' && !rep.reactPreview) launch(compiled)
  else
    Promise.all([
      Promise.resolve(compiled),
      rep.reactPreview
        ? import('virtual:react-frame').then(
            module => module.default,
            error => Promise.reject(error instanceof Error ? error : new Error('React could not load.')),
          )
        : '',
    ]).then(
      ([output, runtime]) => launch(output, runtime),
      error => fail(error, 'The browser checks could not start.'),
    )
  return dispose
}
