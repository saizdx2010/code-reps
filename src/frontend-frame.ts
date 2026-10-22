import { compileSolution } from './compile-solution.ts'
import { checkFrontendSize, frontendFrameHtml, previewScenarios } from './frontend-frame-html.ts'
import type { Rep } from './rep'

export { previewScenarios }

/** Compiles on the calling thread. The app compiles in the practice worker and calls `frontendFrameHtml` instead. */
export function buildFrontendFrame(
  code: string,
  rep: Rep,
  token: string,
  mode: 'preview' | 'checks',
  requested = previewScenarios.ready,
  reactRuntime = '',
): string {
  checkFrontendSize(code)
  const outputText = compileSolution(code, rep.functionName, rep.reactPreview, { guardLoops: true })
  return frontendFrameHtml(outputText, rep, token, mode, requested, reactRuntime)
}
