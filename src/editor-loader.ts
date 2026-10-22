import { loadRepContent } from './rep-content'

let editorImport: Promise<typeof import('./CodeEditor')> | undefined
export function loadEditor() {
  return (editorImport ??= import('./CodeEditor'))
}
export function preloadEditor() {
  void loadEditor().catch(() => {
    editorImport = undefined
  })
}

/** Starts loading the editor and a rep's content when the learner points at it, so opening the rep does not wait for either. */
export function preloadPractice(repId: string) {
  preloadEditor()
  void loadRepContent(repId).catch(() => {})
}
