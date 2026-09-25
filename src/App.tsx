import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { TestResult } from './runner.types'
import { rep } from './rep'
import './App.css'

const Editor = lazy(() => import('./CodeEditor'))
const storageKey = `code-reps:attempt:${rep.id}:v1`

type Attempt = { plan: string; code: string; explanation: string; hintCount: number; completedAt?: string }

function readAttempt(): Attempt {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as Partial<Attempt> | null
    return {
      plan: typeof saved?.plan === 'string' ? saved.plan : '',
      code: typeof saved?.code === 'string' ? saved.code : rep.starter,
      explanation: typeof saved?.explanation === 'string' ? saved.explanation : '',
      hintCount: typeof saved?.hintCount === 'number' ? Math.min(rep.hints.length, Math.max(0, saved.hintCount)) : 0,
      completedAt: typeof saved?.completedAt === 'string' ? saved.completedAt : undefined,
    }
  } catch { return { plan: '', code: rep.starter, explanation: '', hintCount: 0 } }
}

function App() {
  const [attempt, setAttempt] = useState(readAttempt)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [runError, setRunError] = useState('')
  const [running, setRunning] = useState(false)
  const [saveState, setSaveState] = useState('Saved locally')
  const [mobileTab, setMobileTab] = useState<'task' | 'workspace'>('task')
  const workerRef = useRef<Worker | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(attempt)); setSaveState('Saved locally') }
      catch { setSaveState('Could not save on this device') }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [attempt])

  useEffect(() => () => { workerRef.current?.terminate(); if (timerRef.current !== null) window.clearTimeout(timerRef.current) }, [])

  function update<K extends keyof Attempt>(key: K, value: Attempt[K]) {
    setAttempt((current) => ({ ...current, [key]: value, completedAt: undefined }))
    setSaveState('Saving…')
    if (key === 'code') { setResults(null); setRunError('') }
  }

  function stopRun() {
    workerRef.current?.terminate(); workerRef.current = null
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null; setRunning(false)
  }

  function runChecks() {
    stopRun(); setResults(null); setRunError(''); setRunning(true)
    const worker = new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<{ results?: TestResult[]; error?: string }>) => {
      stopRun()
      if (event.data.error) setRunError(event.data.error)
      else setResults(event.data.results ?? [])
    }
    worker.onerror = () => { stopRun(); setRunError('The checks could not start. Please try again.') }
    timerRef.current = window.setTimeout(() => { stopRun(); setRunError('The checks took too long and were stopped. Check for an endless loop.') }, 5000)
    worker.postMessage({ code: attempt.code })
  }

  const allPassed = results?.length === rep.checkCount && results.every((result) => result.passed)
  const canFinish = allPassed && attempt.plan.trim() && attempt.explanation.trim()

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="Code Reps home"><span className="brand-mark">&lt;/&gt;</span><span>code<span className="brand-accent">reps</span></span></a><div className="topbar-right"><span className="local-badge"><span className="status-dot" /> Local practice</span><span className="topbar-divider" /><span className="save-status" role="status">{saveState}</span></div></header>
    <main id="top">
      <div className="page-intro"><div className="breadcrumb">PRACTICE <span>/</span> ARRAYS &amp; MAPS <span>/</span> REP 01</div><div className="intro-row"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR FIRST REP</div><h1>{rep.title}</h1><p className="intro-copy">A small problem, a clear plan, and one more skill you can trust.</p></div><div className="rep-meta"><span>01 <span className="meta-slash">/</span> 01</span><small>TYPESCRIPT · FOUNDATIONS</small></div></div><div className="progress-track" aria-label={attempt.completedAt ? 'Rep completed' : 'Rep in progress'}><span style={{ width: attempt.completedAt ? '100%' : '16%' }} /></div></div>
      <div className="mobile-tabs" role="tablist" aria-label="Rep panels"><button type="button" role="tab" aria-selected={mobileTab === 'task'} onClick={() => setMobileTab('task')}>Task &amp; plan</button><button type="button" role="tab" aria-selected={mobileTab === 'workspace'} onClick={() => setMobileTab('workspace')}>Workspace</button></div>
      <div className="workspace-layout">
        <div className={`task-column ${mobileTab === 'workspace' ? 'mobile-hidden' : ''}`}>
          <section className="panel task-panel"><div className="panel-heading"><span className="step-number">01</span><h2>Understand the task</h2></div><p>{rep.prompt}</p><div className="example"><div className="example-label">EXAMPLE</div><code>{rep.example.input}</code><span className="example-arrow">→</span><code>{rep.example.output}</code></div><p className="task-note">{rep.note}</p><div className="vocab"><span className="vocab-icon">i</span><div><strong>Quick vocabulary</strong><p><b>Frequency</b> means how many times a value appears. A <b>map</b> stores a value alongside a key so you can find it quickly.</p></div></div></section>
          <section className="panel plan-panel"><div className="panel-heading"><span className="step-number">02</span><h2>Plan your approach</h2></div><p>Before coding, what will you count? What happens with an empty array or a tie?</p><label className="field-label" htmlFor="plan">YOUR PLAN</label><textarea id="plan" value={attempt.plan} onChange={(event) => update('plan', event.target.value)} placeholder="I'll go through the array once and…" rows={5} /><div className="field-foot">A few sentences are enough. This is for your own thinking.</div></section>
          <section className="hint-panel"><div><span className="hint-spark">✳</span><strong>Need a nudge?</strong><p>Hints reveal one step at a time.</p></div>{attempt.hintCount > 0 && <ol className="hint-list">{rep.hints.slice(0, attempt.hintCount).map((hint) => <li key={hint}>{hint}</li>)}</ol>}<button className="text-button" type="button" disabled={attempt.hintCount >= rep.hints.length} onClick={() => update('hintCount', attempt.hintCount + 1)}>{attempt.hintCount >= rep.hints.length ? 'All hints revealed' : `Reveal hint ${attempt.hintCount + 1}`} <span aria-hidden="true">↗</span></button></section>
        </div>
        <div className={`code-column ${mobileTab === 'task' ? 'mobile-hidden' : ''}`}>
          <section className="panel code-panel"><div className="panel-heading code-heading"><div><span className="step-number">03</span><h2>Write your solution</h2></div><span className="language-pill">TYPESCRIPT</span></div><div className="editor-top"><span className="file-tab"><span className="ts-icon">TS</span> solution.ts</span><span className="editor-hint">Your code stays on this device</span></div><div className="editor-wrap"><Suspense fallback={<div className="editor-loading">Loading editor…</div>}><Editor height="350px" language="typescript" theme="vs-dark" value={attempt.code} onChange={(value) => update('code', value ?? '')} options={{ minimap: { enabled: false }, fontSize: 14, lineHeight: 24, padding: { top: 18 }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on' }} /></Suspense></div><div className="code-actions"><span>Run your code against {rep.checkCount} checks</span><button className="primary-button" type="button" onClick={runChecks} disabled={running}>{running ? 'Running…' : '▶  Run checks'}</button></div></section>
          <section className="panel results-panel" aria-live="polite"><div className="panel-heading"><span className="step-number">04</span><h2>Check your work</h2></div>{runError ? <div className="error-message">{runError}</div> : results ? <><div className={`result-summary ${allPassed ? 'passed' : 'failed'}`}><span>{allPassed ? '✓' : '!'}</span><div><strong>{allPassed ? 'All checks passed' : `${results.filter((result) => result.passed).length} of ${results.length} checks passed`}</strong><p>{allPassed ? 'Nice work. Explain your thinking to complete this rep.' : 'Read the feedback, adjust your code, and try again.'}</p></div></div><ul className="result-list">{results.map((result) => <li key={result.name}><span className={result.passed ? 'pass-icon' : 'fail-icon'}>{result.passed ? '✓' : '×'}</span><div><strong>{result.name}</strong>{result.message && <p>{result.message}</p>}</div></li>)}</ul></> : <div className="empty-results"><span className="empty-icon">⌁</span><div><strong>Ready when you are</strong><p>Run checks to see how your solution handles the examples and edge cases.</p></div></div>}</section>
          <section className="panel explain-panel"><div className="panel-heading"><span className="step-number">05</span><h2>Explain your thinking</h2></div><p>How does your solution work? Mention the time and space it uses if you can.</p><label className="field-label" htmlFor="explanation">YOUR EXPLANATION</label><textarea id="explanation" value={attempt.explanation} onChange={(event) => update('explanation', event.target.value)} placeholder="I used a map to count each value…" rows={4} /><button className="finish-button" type="button" disabled={!canFinish || !!attempt.completedAt} onClick={() => setAttempt((current) => ({ ...current, completedAt: new Date().toISOString() }))}>{attempt.completedAt ? '✓ Rep completed' : 'Complete rep →'}</button>{!canFinish && <p className="finish-note">Add a plan and explanation, then pass all checks to complete the rep.</p>}{attempt.completedAt && <p className="finish-note success">Completed and saved on this device. You can still edit and retry.</p>}</section>
        </div>
      </div>
    </main><footer><span>CODE REPS</span><span>Practice clearly. Build fluency.</span><span>01 / 01</span></footer>
  </div>
}

export default App
