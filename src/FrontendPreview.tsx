import { Select } from './Input'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { buildFrontendFrame, previewScenarios } from './frontend-frame'
import type { Rep } from './rep'

type Props = { code: string; rep: Rep }
export default function FrontendPreview({ code, rep }: Props) {
  const [scenario, setScenario] = useState('ready')
  const [width, setWidth] = useState('fluid')
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<{ html: string; code: string; token: string } | null>(null)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const expandRef = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    const dialog = dialogRef.current!
    if (expanded) {
      dialog.removeAttribute('open')
      dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
      dialog.setAttribute('open', '')
    }
  }, [expanded])
  function collapse() {
    setExpanded(false)
    requestAnimationFrame(() => expandRef.current?.focus())
  }
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
  const content = <>{!expanded && <div className="panel-heading"><h2 id="preview-heading">Interactive preview</h2></div>}<p>Try the request states, type a search, and test Retry. The preview runs the code from your last preview update.</p><div className="preview-controls"><label htmlFor="preview-state">Request state</label><Select id="preview-state" value={scenario} onChange={event => { const value = event.target.value; setScenario(value); if (preview) refresh(value) }}><option value="ready">Ready</option><option value="loading">Loading</option><option value="error">Error</option><option value="empty">Empty</option></Select><label htmlFor="preview-width">Viewport</label><Select id="preview-width" value={width} onChange={event => setWidth(event.target.value)}><option value="fluid">Fit panel</option><option value="375">Phone · 375px</option><option value="768">Tablet · 768px</option><option value="1280">Desktop · 1280px</option></Select><button className="primary-button" type="button" onClick={() => refresh()}>Update preview</button><button ref={expandRef} className="stop-checks-button" type="button" onClick={() => expanded ? collapse() : setExpanded(true)}>{expanded ? 'Exit expanded preview' : 'Expand preview'}</button>{preview && <button className="stop-checks-button" type="button" onClick={() => { setPreview(null); setError('') }}>Close preview</button>}</div>{preview && preview.code !== code && <p role="status" className="preview-stale">Your code changed. Update the preview to see this version.</p>}{error && <p role="alert" className="error-message">{error}</p>}{preview ? <div className="preview-viewport"><iframe style={{ width: width === 'fluid' ? '100%' : `${width}px` }} key={preview.token} ref={frameRef} title="Your directory implementation" sandbox="allow-scripts" srcDoc={preview.html} /></div> : <div className="preview-empty">Write your solution, then choose Update preview.</div>}<details className="reflection-guide"><summary>Manual UI review</summary><ul><li>Reach the search and Retry controls using Tab; check the visible focus indicator.</li><li>Try an unmatched search, then clear it and confirm the full list returns.</li><li>Try all four request states and check readability on a narrow screen.</li><li>Use the visible label to identify the search field. Checks assess behavior, not visual quality.</li></ul></details></>
  return <dialog ref={dialogRef} role={expanded ? 'dialog' : 'region'} aria-modal={expanded || undefined} className={expanded ? 'utility-dialog preview-dialog frontend-preview' : 'panel frontend-preview preview-inline'} aria-label={expanded ? 'Expanded preview' : 'Interactive preview'} onCancel={event => { event.preventDefault(); if (expanded) collapse() }}>
    {expanded && <div className="utility-heading"><h2>Expanded preview</h2><button type="button" onClick={collapse}>Close <kbd>Esc</kbd></button></div>}
    {content}
  </dialog>
}
