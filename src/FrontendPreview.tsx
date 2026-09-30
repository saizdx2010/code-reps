import { useEffect, useRef, useState } from 'react'
import { buildFrontendFrame, previewScenarios } from './frontend-frame'
import { SearchDrawer } from './Experience'
import type { Rep } from './rep'

type Props = { code: string; rep: Rep }
export default function FrontendPreview({ code, rep }: Props) {
  const [scenario, setScenario] = useState('ready')
  const [width, setWidth] = useState('fluid')
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<{ html: string; code: string; token: string } | null>(null)
  const [error, setError] = useState('')
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source === frameRef.current?.contentWindow && event.data?.token === preview?.token && typeof event.data.error === 'string') setError(event.data.error)
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [preview])
  function refresh(nextScenario = scenario) {
    setError('')
    try {
      const token = crypto.randomUUID()
      setPreview({ html: buildFrontendFrame(code, rep, token, 'preview', previewScenarios[nextScenario]), code, token })
    } catch (error) { setError(error instanceof Error ? error.message : 'The preview could not start.') }
  }
  const content = <>{!expanded && <div className="panel-heading"><h2 id="preview-heading">Interactive preview</h2></div>}<p>Try the request states, type a search, and test Retry. The preview runs the code from your last preview update.</p><div className="preview-controls"><label htmlFor="preview-state">Request state</label><select id="preview-state" value={scenario} onChange={event => { const value = event.target.value; setScenario(value); if (preview) refresh(value) }}><option value="ready">Ready</option><option value="loading">Loading</option><option value="error">Error</option><option value="empty">Empty</option></select><label htmlFor="preview-width">Viewport</label><select id="preview-width" value={width} onChange={event => setWidth(event.target.value)}><option value="fluid">Fit panel</option><option value="375">Phone · 375px</option><option value="768">Tablet · 768px</option><option value="1280">Desktop · 1280px</option></select><button className="primary-button" type="button" onClick={() => refresh()}>Update preview</button><button className="stop-checks-button" type="button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Exit expanded preview' : 'Expand preview'}</button>{preview && <button className="stop-checks-button" type="button" onClick={() => { setPreview(null); setError('') }}>Close preview</button>}</div>{preview && preview.code !== code && <p role="status" className="preview-stale">Your code changed. Update the preview to see this version.</p>}{error && <p role="alert" className="error-message">{error}</p>}{preview ? <div className="preview-viewport"><iframe style={{ width: width === 'fluid' ? '100%' : `${width}px` }} key={preview.token} ref={frameRef} title="Your directory implementation" sandbox="allow-scripts" srcDoc={preview.html} /></div> : <div className="preview-empty">Write your solution, then choose Update preview.</div>}<details className="reflection-guide"><summary>Manual UI review</summary><ul><li>Reach the search and Retry controls using Tab; check the visible focus indicator.</li><li>Try an unmatched search, then clear it and confirm the full list returns.</li><li>Try all four request states and check readability on a narrow screen.</li><li>Use the visible label to identify the search field. Checks assess behavior, not visual quality.</li></ul></details></>
  return expanded ? <SearchDrawer title="Expanded preview" className="preview-dialog frontend-preview" onClose={() => setExpanded(false)}>{content}</SearchDrawer> : <section className="panel frontend-preview" aria-labelledby="preview-heading">{content}</section>
}
