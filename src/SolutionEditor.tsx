import { Component, lazy, Suspense } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import type CodeEditor from './CodeEditor'

import { loadEditor } from './editor-loader'

const Editor = lazy(loadEditor)
type Props = Omit<ComponentProps<typeof CodeEditor>, 'onChange'> & { onChange: (value: string) => void }

class EditorRecovery extends Component<{ children: ReactNode; value: string; onChange: Props['onChange'] }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <div className="editor-recovery"><p role="status">The code editor could not load. You can keep working in this plain text editor and run the same checks.</p><label htmlFor="fallback-code" className="field-label">SOLUTION.TS</label><textarea id="fallback-code" value={this.props.value} onChange={event => this.props.onChange(event.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
  }
}

export function SolutionEditor(props: Props) {
  const loading = <div className="editor-loading" role="status">Loading editor… Your saved code will appear here.</div>
  return <EditorRecovery value={String(props.value ?? '')} onChange={props.onChange}><Suspense fallback={loading}><Editor {...props} onChange={value => props.onChange(value ?? '')} loading={loading} /></Suspense></EditorRecovery>
}
