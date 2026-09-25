import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { TestResult } from './runner.types'
import { reps } from './rep'
import type { Rep } from './rep'
import './App.css'

const Editor = lazy(() => import('./CodeEditor'))
const storageKey = (repId: string) => `code-reps:attempt:${repId}:v1`
const historyKey = 'code-reps:history:v1'

type Attempt = { plan: string; code: string; explanation: string; hintCount: number; completedAt?: string }
type AttemptRecord = Attempt & { id: string; repId: string; completedAt: string }

function readHistory(): AttemptRecord[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(historyKey) || '[]')
    return Array.isArray(saved) ? saved.filter((item): item is AttemptRecord =>
      typeof item?.id === 'string' && typeof item?.repId === 'string' && typeof item?.completedAt === 'string' &&
      typeof item?.plan === 'string' && typeof item?.code === 'string' && typeof item?.explanation === 'string') : []
  } catch { return [] }
}

function readAttempt(rep: Rep): Attempt {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(rep.id)) || 'null') as Partial<Attempt> | null
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
  const [view, setView] = useState<'home' | 'workspace' | 'history'>('home')
  const [mobileTab, setMobileTab] = useState<'task' | 'workspace'>('task')
  const [history, setHistory] = useState(readHistory)
  const [repId, setRepId] = useState(() => {
    try { return reps.find((item) => item.id === localStorage.getItem('code-reps:selected-rep'))?.id ?? reps[0].id }
    catch { return reps[0].id }
  })
  const rep = reps.find((item) => item.id === repId) ?? reps[0]
  const [attempt, setAttempt] = useState(() => readAttempt(rep))
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [runError, setRunError] = useState('')
  const [running, setRunning] = useState(false)
  const [saveState, setSaveState] = useState('Saved locally')
  const workerRef = useRef<Worker | null>(null)
  const timerRef = useRef<number | null>(null)
  const resetDialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(storageKey(repId), JSON.stringify(attempt)); setSaveState('Saved locally') }
      catch { setSaveState('Could not save on this device') }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [attempt, repId])

  useEffect(() => () => { workerRef.current?.terminate(); if (timerRef.current !== null) window.clearTimeout(timerRef.current) }, [])

  function update<K extends keyof Attempt>(key: K, value: Attempt[K]) {
    setAttempt((current) => ({ ...current, [key]: value, completedAt: key === 'hintCount' ? current.completedAt : undefined }))
    setSaveState('Saving…')
    if (key === 'code') { setResults(null); setRunError('') }
  }

  function stopRun() {
    workerRef.current?.terminate(); workerRef.current = null
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null; setRunning(false)
  }

  function selectRep(nextId: string) {
    if (nextId === repId) return
    const nextRep = reps.find((item) => item.id === nextId)
    if (!nextRep) return
    stopRun()
    try {
      localStorage.setItem(storageKey(repId), JSON.stringify(attempt))
      localStorage.setItem('code-reps:selected-rep', nextId)
      setSaveState('Saved locally')
    } catch { setSaveState('Could not save on this device') }
    setRepId(nextId)
    setAttempt(readAttempt(nextRep))
    setResults(null)
    setRunError('')
  }

  function openRep(nextId: string) {
    selectRep(nextId)
    setMobileTab('task')
    setView('workspace')
    window.scrollTo(0, 0)
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
    worker.postMessage({ code: attempt.code, repId })
  }

  const allPassed = results?.length === rep.checks.length && results.every((result) => result.passed)
  const canFinish = allPassed && attempt.plan.trim() && attempt.explanation.trim()

  const repStatus = (item: Rep) => {
    const saved = item.id === repId ? attempt : readAttempt(item)
    if (saved.completedAt) return 'Completed'
    if (saved.plan.trim() || saved.code !== item.starter || saved.explanation.trim() || saved.hintCount > 0) return 'In progress'
    return 'Not started'
  }
  const currentStatus = repStatus(rep)

  function completeRep() {
    if (!canFinish || attempt.completedAt) return
    const completedAt = new Date().toISOString()
    const completed = { ...attempt, completedAt }
    const nextHistory = [{ ...completed, id: crypto.randomUUID(), repId }, ...history]
    try {
      localStorage.setItem(historyKey, JSON.stringify(nextHistory))
      localStorage.setItem(storageKey(repId), JSON.stringify(completed))
      setHistory(nextHistory)
      setAttempt(completed)
      setSaveState('Saved locally')
    } catch { setSaveState('Could not save on this device') }
  }

  function startNewAttempt() {
    if (!attempt.completedAt) return
    stopRun()
    setAttempt({ plan: '', code: rep.starter, explanation: '', hintCount: 0 })
    setResults(null)
    setRunError('')
    setSaveState('Saving…')
    window.scrollTo(0, 0)
  }

  function resetRep() {
    resetDialogRef.current?.close()
    stopRun()
    setAttempt({ plan: '', code: rep.starter, explanation: '', hintCount: 0 })
    setResults(null)
    setRunError('')
    setMobileTab('task')
    setSaveState('Saving…')
  }

  return <div className="app-shell">
    <header className="topbar"><button className="brand" type="button" onClick={() => setView('home')} aria-label="Code Reps home"><img className="brand-mark" src="/favicon.svg" alt="" /><span>code<span className="brand-accent">reps</span></span></button><div className="topbar-right"><nav className="top-nav" aria-label="Main navigation"><button type="button" aria-current={view === 'home' ? 'page' : undefined} onClick={() => setView('home')}>Home</button><button type="button" aria-current={view === 'workspace' ? 'page' : undefined} onClick={() => setView('workspace')}>Practice</button><button type="button" aria-current={view === 'history' ? 'page' : undefined} onClick={() => setView('history')}>History</button></nav><span className="topbar-divider" /><span className="save-status" role="status">{saveState}</span></div></header>
    {view === 'home' ? <main className="home-main" id="top">
      <div className="home-heading"><h1>Pick up where you left off.</h1><p>Small problems, clear thinking, steady practice.</p></div>
      <section className="continue-panel" aria-labelledby="continue-heading"><div><span className="home-label">CONTINUE PRACTISING</span><h2 id="continue-heading">{rep.title}</h2><p>{currentStatus === 'Not started' ? 'Start with a plan, then write and check your solution.' : currentStatus === 'Completed' ? 'Revisit your solution or try it again.' : 'Your saved work is ready when you are.'}</p><span className="continue-status">{currentStatus} <span aria-hidden="true">/</span> {rep.category}</span></div><button className="primary-button" type="button" onClick={() => openRep(rep.id)}>{currentStatus === 'Not started' ? 'Start rep' : 'Continue'} <span aria-hidden="true">→</span></button></section>
      <section className="home-practice" aria-labelledby="practice-heading"><div className="home-section-heading"><h2 id="practice-heading">Practice</h2><p>Choose a rep to work on.</p></div><div className="rep-list">{reps.map((item, index) => <button className="rep-list-row" type="button" key={item.id} onClick={() => openRep(item.id)}><span className="rep-list-index">{String(index + 1).padStart(2, '0')}</span><span className="rep-list-name"><strong>{item.title}</strong><small>{item.category}</small></span><span className={`rep-list-status ${repStatus(item).toLowerCase().replace(' ', '-')}`}>{repStatus(item)}</span><span className="rep-list-arrow" aria-hidden="true">→</span></button>)}</div></section>
    </main> : view === 'history' ? <main className="history-main"><div className="home-heading"><h1>Attempt history</h1><p>Completed reps stay here so you can compare your thinking over time.</p></div>{history.length === 0 ? <div className="history-empty">No completed attempts yet. Finish a rep to save your first one here.</div> : <ol className="history-list">{history.map((record) => { const item = reps.find((entry) => entry.id === record.repId); return <li key={record.id}><div><strong>{item?.title ?? 'Unknown rep'}</strong><span>{new Date(record.completedAt).toLocaleString()} · {record.hintCount} {record.hintCount === 1 ? 'hint' : 'hints'} used</span></div><details><summary>Review attempt</summary><h3>Plan</h3><p>{record.plan}</p><h3>Code</h3><pre><code>{record.code}</code></pre><h3>Explanation</h3><p>{record.explanation}</p></details>{item && <button className="text-button" type="button" onClick={() => openRep(item.id)}>Open rep →</button>}</li> })}</ol>}</main> : <main className="practice-main" id="top">
      <div className="page-intro"><div className="practice-context"><span className="breadcrumb">PRACTICE <span>/</span> {rep.category.toUpperCase()}</span><span className="practice-status">{currentStatus}</span></div><div className="intro-row"><div><h1>{rep.title}</h1><p className="intro-copy">Read the task, make a plan, then test your solution.</p></div><div className="intro-actions"><button className="reset-button" type="button" onClick={() => resetDialogRef.current?.showModal()}>↺ Reset rep</button><button className="hint-button" type="button" disabled={attempt.hintCount >= rep.hints.length} onClick={() => { update('hintCount', attempt.hintCount + 1); setMobileTab('task') }}>{attempt.hintCount >= rep.hints.length ? 'All hints revealed' : `✳  Reveal hint ${attempt.hintCount + 1}`}<span aria-hidden="true"> ↗</span></button></div></div></div>
      <div className="mobile-tabs" aria-label="Practice workspace"><button type="button" aria-pressed={mobileTab === 'task'} onClick={() => setMobileTab('task')}>Task & plan</button><button type="button" aria-pressed={mobileTab === 'workspace'} onClick={() => setMobileTab('workspace')}>Code & results</button></div>
      <div className="workspace-layout">
        <div className={`task-column ${mobileTab === 'task' ? 'mobile-active' : ''}`}>
          <section className="panel task-panel"><div className="panel-heading"><span className="step-number">01</span><h2>Understand the task</h2></div><p>{rep.prompt}</p>{attempt.hintCount > 0 && <div className="task-hints" aria-live="polite"><div className="hint-heading"><span className="hint-spark">✳</span><strong>Hints revealed</strong><span>{attempt.hintCount} / {rep.hints.length}</span></div><ol className="hint-list">{rep.hints.slice(0, attempt.hintCount).map((hint) => <li key={hint}>{hint}</li>)}</ol></div>}<div className="example"><div className="example-label">EXAMPLE</div><code>{rep.example.input}</code><span className="example-arrow">→</span><code>{rep.example.output}</code></div><p className="task-note">{rep.note}</p><div className="vocab"><span className="vocab-icon">i</span><div><strong>Quick vocabulary</strong><p>{rep.vocabulary.map((item, index) => <span key={item.term}>{index > 0 && ' ' }<b>{item.term}</b> means {item.meaning}.</span>)}</p></div></div></section>
          <section className="panel plan-panel"><div className="panel-heading"><span className="step-number">02</span><h2>Plan your approach</h2></div><p>{rep.planPrompt}</p><label className="field-label" htmlFor="plan">YOUR PLAN</label><textarea id="plan" value={attempt.plan} onChange={(event) => update('plan', event.target.value)} placeholder="I'll start by…" rows={5} /><div className="field-foot">A few sentences are enough. This is for your own thinking.</div></section>
        </div>
        <div className={`code-column ${mobileTab === 'workspace' ? 'mobile-active' : ''}`}>
          <section className="panel code-panel"><div className="panel-heading code-heading"><div><span className="step-number">03</span><h2>Write your solution</h2></div><span className="language-pill">TYPESCRIPT</span></div><div className="editor-top"><span className="file-tab"><span className="ts-icon">TS</span> solution.ts</span><span className="editor-hint">Your code stays on this device</span></div><div className="editor-wrap"><Suspense fallback={<div className="editor-loading">Loading editor…</div>}><Editor key={rep.id} height="350px" language="typescript" theme="vs-dark" value={attempt.code} onChange={(value) => update('code', value ?? '')} options={{ minimap: { enabled: false }, fontSize: 14, lineHeight: 24, padding: { top: 18 }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on' }} /></Suspense></div><div className="code-actions"><span>Run your code against {rep.checks.length} checks</span><button className="primary-button" type="button" onClick={runChecks} disabled={running}>{running ? 'Running…' : '▶  Run checks'}</button></div></section>
          <section className="panel results-panel" aria-live="polite"><div className="panel-heading"><span className="step-number">04</span><h2>Check your work</h2></div>{runError ? <div className="error-message">{runError}</div> : results ? <><div className={`result-summary ${allPassed ? 'passed' : 'failed'}`}><span>{allPassed ? '✓' : '!'}</span><div><strong>{allPassed ? 'All checks passed' : `${results.filter((result) => result.passed).length} of ${results.length} checks passed`}</strong><p>{allPassed ? 'Nice work. Explain your thinking to complete this rep.' : 'Read the feedback, adjust your code, and try again.'}</p></div></div><ul className="result-list">{results.map((result) => <li key={result.name}><span className={result.passed ? 'pass-icon' : 'fail-icon'}>{result.passed ? '✓' : '×'}</span><div><strong>{result.name}</strong>{result.message && <p>{result.message}</p>}</div></li>)}</ul></> : <div className="empty-results"><span className="empty-icon">⌁</span><div><strong>Ready when you are</strong><p>Run checks to see how your solution handles the examples and edge cases.</p></div></div>}</section>
        </div>
        <section className={`panel explain-panel ${mobileTab === 'workspace' ? 'mobile-active' : ''}`}><div className="explain-intro"><div className="panel-heading"><span className="step-number">05</span><h2>Explain your thinking</h2></div><p>How does your solution work? Mention the time and space it uses if you can.</p></div><div className="explain-form"><label className="field-label" htmlFor="explanation">YOUR EXPLANATION</label><textarea id="explanation" value={attempt.explanation} onChange={(event) => update('explanation', event.target.value)} placeholder="My solution works by…" rows={4} /><div className="explain-actions"><div>{!canFinish && <p className="finish-note">Add a plan and explanation, then pass all checks to complete the rep.</p>}{attempt.completedAt && <p className="finish-note success">Completed and saved on this device.</p>}</div><button className="finish-button" type="button" disabled={!canFinish || !!attempt.completedAt} onClick={completeRep}>{attempt.completedAt ? '✓ Rep completed' : 'Complete rep →'}</button></div>{attempt.completedAt && <button className="text-button retry-button" type="button" onClick={startNewAttempt}>Start a fresh attempt →</button>}</div></section>
      </div>
    </main>}
    <dialog className="reset-dialog" ref={resetDialogRef} aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
      <span className="reset-dialog-label">START AGAIN</span>
      <h2 id="reset-dialog-title">Reset this rep?</h2>
      <p id="reset-dialog-description">Your plan, code, explanation, revealed hints, and check results will be cleared. The starter code will be restored.</p>
      <p className="reset-dialog-note">Completed attempts in History will stay saved.</p>
      <div className="reset-dialog-actions"><button className="reset-dialog-cancel" type="button" onClick={() => resetDialogRef.current?.close()}>Cancel</button><button className="reset-dialog-confirm" type="button" onClick={resetRep}>Reset rep</button></div>
    </dialog>
    <footer><span>CODE REPS</span><span>Practice clearly. Build fluency.</span></footer>
  </div>
}

export default App
