import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from './monaco'
import { useLayoutEffect, useRef } from 'react'
import type { ComponentProps } from 'react'
import editorWorker from '../node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker'
import tsWorker from '../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'

self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    return label === 'typescript' || label === 'javascript' ? new tsWorker() : new editorWorker()
  },
}

loader.config({ monaco })

export default function CodeEditor({ onRunChecks, focusRequest = 0, ...props }: ComponentProps<typeof MonacoEditor> & { onRunChecks: () => void; focusRequest?: number }) {
  const runRef = useRef(onRunChecks)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const pathRef = useRef(props.path)
  const focusRequestRef = useRef(focusRequest)
  const viewSaveTimer = useRef<number | undefined>(undefined)
  useLayoutEffect(() => {
    const save = () => {
      const editor = editorRef.current
      if (editor && pathRef.current) {
        try { sessionStorage.setItem(`code-reps:editor:${pathRef.current}`, JSON.stringify(editor.saveViewState())) } catch { /* View state is optional. */ }
      }
    }
    window.addEventListener('pagehide', save)
    return () => { window.clearTimeout(viewSaveTimer.current); save(); window.removeEventListener('pagehide', save) }
  }, [])
  useLayoutEffect(() => {
    focusRequestRef.current = focusRequest
    if (!focusRequest) return
    const frame = requestAnimationFrame(() => editorRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [focusRequest])
  useLayoutEffect(() => { runRef.current = onRunChecks }, [onRunChecks])
  return <MonacoEditor {...props} onMount={(editor, instance) => {
    editorRef.current = editor
    if (focusRequestRef.current) requestAnimationFrame(() => editor.focus())
    try { const saved = sessionStorage.getItem(`code-reps:editor:${props.path}`); if (saved) editor.restoreViewState(JSON.parse(saved)) } catch { /* Keep the default position. */ }
    const scheduleViewSave = () => {
      window.clearTimeout(viewSaveTimer.current)
      viewSaveTimer.current = window.setTimeout(() => {
        try { sessionStorage.setItem(`code-reps:editor:${props.path}`, JSON.stringify(editor.saveViewState())) } catch { /* View state is optional. */ }
      }, 120)
    }
    editor.onDidChangeCursorPosition(scheduleViewSave)
    editor.onDidScrollChange(scheduleViewSave)
    editor.addAction({ id: 'code-reps.run-checks', label: 'Run checks', keybindings: [instance.KeyMod.CtrlCmd | instance.KeyCode.Enter], run: () => runRef.current() })
    props.onMount?.(editor, instance)
  }} theme="code-reps" beforeMount={(instance) => {
    instance.editor.defineTheme('code-reps', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '798c7d' },
        { token: 'keyword', foreground: 'bce57b' },
        { token: 'string', foreground: 'dfb890' },
        { token: 'number', foreground: 'c9b9e9' },
        { token: 'type', foreground: 'a9d3c8' },
      ],
      colors: {
        'editor.background': '#1b2221',
        'editor.foreground': '#e9efe9',
        'editorLineNumber.foreground': '#718079',
        'editorLineNumber.activeForeground': '#c4d2c4',
        'editor.lineHighlightBackground': '#25302b',
        'editor.selectionBackground': '#49664b88',
        'editor.inactiveSelectionBackground': '#49664b55',
        'editorCursor.foreground': '#bce57b',
        'editorIndentGuide.background1': '#344039',
        'editorIndentGuide.activeBackground1': '#697e69',
        'editorGutter.background': '#1b2221',
        'editorWidget.background': '#252d2b',
        'editorWidget.border': '#4c5d52',
        'input.background': '#1b2221',
        'input.border': '#667a68',
        'focusBorder': '#bce57b',
      },
    })
    props.beforeMount?.(instance)
  }} />
}
