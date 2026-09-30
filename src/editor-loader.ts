let editorImport: Promise<typeof import('./CodeEditor')> | undefined
export function loadEditor() { return editorImport ??= import('./CodeEditor') }
export function preloadEditor() { void loadEditor().catch(() => { editorImport = undefined }) }
