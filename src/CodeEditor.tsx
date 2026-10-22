import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from './monaco'
import { useLayoutEffect, useRef } from 'react'
import { sortTypeIssues } from './type-issues'
import type { TypeIssue } from './type-issues'
import type { ComponentProps } from 'react'
import editorWorker from '../node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker'
import tsWorker from '../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'

self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    return label === 'typescript' || label === 'javascript' ? new tsWorker() : new editorWorker()
  },
}

loader.config({ monaco })

function applyEditorTheme(instance: typeof monaco) {
  const desk = document.querySelector('.code-column')
  const style = desk ? getComputedStyle(desk) : null
  const colour = (token: string, fallback: string) => style?.getPropertyValue(token).trim() || fallback
  const replacements: Record<string, string> = {
    '#303f38': colour('--bg', '#303f38'),
    '#3b4b42': colour('--surface-2', '#3b4b42'),
    '#35423b': colour('--surface-2', '#35423b'),
    '#edf0eb': colour('--text', '#edf0eb'),
    '#a5b9aa': colour('--muted', '#a5b9aa'),
    '#dce7da': colour('--text', '#dce7da'),
    '#bce57b': colour('--accent', '#bce57b'),
    '#55685b': colour('--border', '#55685b'),
    '#526255': colour('--border', '#526255'),
    '#94a88c': colour('--border-strong', '#94a88c'),
    '#414f38': colour('--accent-soft', '#414f38'),
    '#728f6988': colour('--accent', '#728f69') + '44',
    '#728f6955': colour('--accent', '#728f69') + '22',
  }
  const theme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'b1c1b5' },
      { token: 'keyword', foreground: 'bce57b' },
      { token: 'string', foreground: 'dfb890' },
      { token: 'number', foreground: 'c9b9e9' },
      { token: 'type', foreground: 'a9d3c8' },
      // The base theme gives SQL strings, built-in names, and operators loud colours of their own; match the desk instead.
      { token: 'string.sql', foreground: 'dfb890' },
      { token: 'predefined.sql', foreground: 'a9d3c8' },
      { token: 'operator.sql', foreground: 'edf0eb' },
    ],
    colors: {
      'editor.background': '#303f38',
      'editor.foreground': '#edf0eb',
      'editorLineNumber.foreground': '#a5b9aa',
      'editorLineNumber.activeForeground': '#dce7da',
      'editor.lineHighlightBackground': '#3b4b42',
      'editor.selectionBackground': '#728f6988',
      'editor.inactiveSelectionBackground': '#728f6955',
      'editorCursor.foreground': '#bce57b',
      'editorIndentGuide.background1': '#55685b',
      'editorIndentGuide.activeBackground1': '#94a88c',
      'editorGutter.background': '#303f38',
      'editorWidget.background': '#3b4b42',
      'editorWidget.border': '#55685b',
      'input.background': '#303f38',
      'input.border': '#94a88c',
      focusBorder: '#bce57b',
      'menu.background': '#35423b',
      'menu.foreground': '#edf0eb',
      'menu.border': '#526255',
      'menu.selectionBackground': '#414f38',
      'menu.selectionForeground': '#bce57b',
      'menu.separatorBackground': '#526255',
      'editorSuggestWidget.background': '#35423b',
      'editorSuggestWidget.border': '#526255',
      'editorSuggestWidget.foreground': '#edf0eb',
      'editorSuggestWidget.selectedBackground': '#414f38',
      'editorSuggestWidget.selectedForeground': '#bce57b',
      'editorHoverWidget.background': '#35423b',
      'editorHoverWidget.border': '#526255',
    },
  }
  theme.colors = Object.fromEntries(Object.entries(theme.colors ?? {}).map(([key, value]) => [key, replacements[value] ?? value]))
  theme.rules = theme.rules.map(rule => ({
    ...rule,
    foreground:
      rule.token === 'keyword'
        ? colour('--accent', '#bce57b').slice(1)
        : rule.token === 'comment'
          ? colour('--muted', '#b1c1b5').slice(1)
          : rule.token === 'operator.sql'
            ? colour('--text', '#edf0eb').slice(1)
            : rule.foreground,
  }))
  instance.editor.defineTheme('code-reps', theme)
}

type Props = ComponentProps<typeof MonacoEditor> & {
  onRunChecks: () => void
  focusRequest?: number
  /** Other files of a multi-file project, keyed by model path, so relative imports resolve. */
  siblingFiles?: Record<string, string>
  /** Receives the TypeScript errors for this rep's files whenever the editor's diagnostics change. */
  onTypeIssues?: (issues: TypeIssue[]) => void
}

const viewStateKey = (path: string | undefined) => `code-reps:editor:${path}`
function saveViewState(editor: monaco.editor.IStandaloneCodeEditor, path: string | undefined) {
  try {
    sessionStorage.setItem(viewStateKey(path), JSON.stringify(editor.saveViewState()))
  } catch {
    /* View state is optional. */
  }
}

export default function CodeEditor({ onRunChecks, focusRequest = 0, siblingFiles, onTypeIssues, ...props }: Props) {
  const typeIssuesRef = useRef(onTypeIssues)
  useLayoutEffect(() => {
    typeIssuesRef.current = onTypeIssues
  }, [onTypeIssues])
  useLayoutEffect(() => {
    const observer = new MutationObserver(() => {
      applyEditorTheme(monaco)
      monaco.editor.setTheme('code-reps')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette', 'data-theme'] })
    return () => observer.disconnect()
  }, [])
  const runRef = useRef(onRunChecks)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const pathRef = useRef(props.path)
  const focusRequestRef = useRef(focusRequest)
  const viewSaveTimer = useRef<number | undefined>(undefined)
  const siblingModels = useRef(new Map<string, monaco.editor.ITextModel>())
  const syncedContent = useRef(new Map<string, string>())
  useLayoutEffect(() => {
    const models = siblingModels.current
    const synced = syncedContent.current
    return () => {
      models.forEach(model => model.dispose())
      models.clear()
      synced.clear()
    }
  }, [])
  // Sibling files are separate models so the TypeScript worker sees './state' and './view' as real modules.
  // The active file stays with the editor.
  useLayoutEffect(() => {
    // Runs every render, so skip unchanged files without reading the model text.
    const siblings = siblingFiles ?? {}
    for (const [path, content] of Object.entries(siblings)) {
      if (syncedContent.current.get(path) === content) continue
      const uri = monaco.Uri.parse(path)
      const model = monaco.editor.getModel(uri)
      if (!model) siblingModels.current.set(path, monaco.editor.createModel(content, 'typescript', uri))
      else if (model.getValue() !== content) model.setValue(content)
      syncedContent.current.set(path, content)
    }
    // Release models for files that left the project; a model the editor now shows as the active file stays until unmount.
    for (const [path, model] of siblingModels.current) {
      if (path in siblings || path === props.path) continue
      model.dispose()
      siblingModels.current.delete(path)
    }
    for (const path of syncedContent.current.keys()) if (!(path in siblings)) syncedContent.current.delete(path)
  })
  useLayoutEffect(() => {
    const save = () => {
      const editor = editorRef.current
      if (editor && pathRef.current) saveViewState(editor, pathRef.current)
    }
    window.addEventListener('pagehide', save)
    return () => {
      window.clearTimeout(viewSaveTimer.current)
      save()
      window.removeEventListener('pagehide', save)
    }
  }, [])
  useLayoutEffect(() => {
    focusRequestRef.current = focusRequest
    if (!focusRequest) return
    const frame = requestAnimationFrame(() => editorRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [focusRequest])
  useLayoutEffect(() => {
    runRef.current = onRunChecks
  }, [onRunChecks])
  return (
    <MonacoEditor
      {...props}
      onMount={(editor, instance) => {
        editorRef.current = editor
        if (focusRequestRef.current) requestAnimationFrame(() => editor.focus())
        try {
          const saved = sessionStorage.getItem(viewStateKey(props.path))
          if (saved) editor.restoreViewState(JSON.parse(saved))
        } catch {
          /* Keep the default position. */
        }
        const scheduleViewSave = () => {
          window.clearTimeout(viewSaveTimer.current)
          viewSaveTimer.current = window.setTimeout(() => saveViewState(editor, props.path), 120)
        }
        editor.onDidChangeCursorPosition(scheduleViewSave)
        editor.onDidScrollChange(scheduleViewSave)
        // Report errors for every model in this rep's folder, so a multi-file project includes its other files.
        const folder = props.path?.replace(/[^/]*$/, '') ?? ''
        const reportTypeIssues = () => {
          const issues = monaco.editor
            .getModelMarkers({ owner: 'typescript' })
            .filter(marker => marker.severity === monaco.MarkerSeverity.Error && marker.resource.toString().startsWith(folder))
            .map(marker => ({
              file: marker.resource.path.split('/').at(-1) ?? '',
              line: marker.startLineNumber,
              message: marker.message,
            }))
          typeIssuesRef.current?.(sortTypeIssues(issues))
        }
        const markerListener = monaco.editor.onDidChangeMarkers(reportTypeIssues)
        editor.onDidDispose(() => markerListener.dispose())
        reportTypeIssues()
        editor.addAction({
          id: 'code-reps.run-checks',
          label: 'Run checks',
          keybindings: [instance.KeyMod.CtrlCmd | instance.KeyCode.Enter],
          run: () => runRef.current(),
        })
        props.onMount?.(editor, instance)
      }}
      theme="code-reps"
      beforeMount={instance => {
        applyEditorTheme(instance)
        props.beforeMount?.(instance)
      }}
    />
  )
}
