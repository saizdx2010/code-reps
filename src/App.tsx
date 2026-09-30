import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CheckFeedback, CommandPalette, GlossaryDrawer, ScreenMemory, WorkspaceSplit } from './Experience'
import { useSessionPreference } from './useSessionPreference'
import { useNavigation } from './useNavigation'
import { preloadEditor } from './editor-loader'
import { readRoute } from './ui-navigation'
import type { View } from './ui-navigation'
import { SolutionEditor } from './SolutionEditor'
import { startCheckRun } from './check-run'
import type { TestResult } from './runner.types'
import { reps } from './rep'
import type { Rep } from './rep'
import { paths } from './path'
import { PathIntroduction } from './PathIntroduction'
import { foundations } from './foundations'
import { coreLessons } from './ai-era-reps'
import { reflectionGuides, stageLabels } from './learning'
import { attemptStatus, getPracticePlan } from './practice'
import type { LearnerStart } from './learning'
import { mergeHistory, parseBackup } from './portability'
import type { Backup } from './portability'
import { flushStorage, isServerReady, localStore, retryStorage, storageIssue } from './local-store'
import { ProgressPage } from './ProgressPage'
import './App.css'
import './design.css'
import './practice.css'
import './system.css'
import './experience.css'

const repIds = reps.map(rep => rep.id)
const FrontendPreview = lazy(() => import('./FrontendPreview').catch(() => ({ default: () => <section className="panel frontend-preview" role="alert"><p>The preview could not load. Reload to try again; your draft will be kept.</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload app</button></section> })))
const storageKey = (repId: string) => `code-reps:attempt:${repId}:v1`
const historyKey = 'code-reps:history:v1'
const learnerStartKey = 'code-reps:learner-start:v1'

type Difficulty = 'none' | 'wording' | 'approach' | 'typescript' | 'edge-cases'
type Confidence = 'need-practice' | 'getting-there' | 'confident'
type Attempt = { plan: string; code: string; explanation: string; hintCount: number; difficulty?: Difficulty; confidence?: Confidence; completedAt?: string }
type AttemptRecord = Attempt & { id: string; repId: string; completedAt: string }
const difficultyLabels: Record<Difficulty, string> = { none: 'Nothing in particular', wording: 'Understanding the wording', approach: 'Finding an approach', typescript: 'Writing TypeScript', 'edge-cases': 'Handling edge cases' }
const formatLabels: Record<string, string> = { algorithm: 'Algorithm / TypeScript', debug: 'Debugging', read: 'Code reading', transform: 'Data transformation', frontend: 'Frontend', backend: 'Backend', refactor: 'Refactoring' }
const confidenceLabels: Record<Confidence, string> = { 'need-practice': 'Need more practice', 'getting-there': 'Getting there', confident: 'Confident' }
function readHistory(): AttemptRecord[] {
  try {
    const saved: unknown = JSON.parse(localStore.getItem(historyKey) || '[]')
    return Array.isArray(saved) ? saved.filter((item): item is AttemptRecord =>
      typeof item?.id === 'string' && typeof item?.repId === 'string' && typeof item?.completedAt === 'string' &&
      typeof item?.plan === 'string' && typeof item?.code === 'string' && typeof item?.explanation === 'string') : []
  } catch { return [] }
}

function readAttempt(rep: Rep): Attempt {
  try {
    const saved = JSON.parse(localStore.getItem(storageKey(rep.id)) || 'null') as Partial<Attempt> | null
    return {
      plan: typeof saved?.plan === 'string' ? saved.plan : '',
      code: typeof saved?.code === 'string' ? saved.code : rep.starter,
      explanation: typeof saved?.explanation === 'string' ? saved.explanation : '',
      hintCount: typeof saved?.hintCount === 'number' ? Math.min(rep.hints.length, Math.max(0, saved.hintCount)) : 0,
      difficulty: saved?.difficulty && saved.difficulty in difficultyLabels ? saved.difficulty : undefined,
      confidence: saved?.confidence && saved.confidence in confidenceLabels ? saved.confidence : undefined,
      completedAt: typeof saved?.completedAt === 'string' ? saved.completedAt : undefined,
    }
  } catch { return { plan: '', code: rep.starter, explanation: '', hintCount: 0 } }
}

function App() {
  function setView(next: View, id?: string) { if (next !== 'workspace') setEditorFocusRequest(0); navigate(next, next === 'workspace' ? id ?? repId : undefined) }
  const [catalogSkill, setCatalogSkill] = useSessionPreference<string>('catalogSkill', '')
  const [catalogFormat, setCatalogFormat] = useSessionPreference<string>('catalogFormat', '')
  const [catalogStatus, setCatalogStatus] = useSessionPreference<string>('catalogStatus', '')
  const [historyQuery, setHistoryQuery] = useSessionPreference<string>('historyQuery', '')
  const [historySkill, setHistorySkill] = useSessionPreference<string>('historySkill', '')
  const [historyDifficulty, setHistoryDifficulty] = useSessionPreference<string>('historyDifficulty', '')
  const [historyDate, setHistoryDate] = useSessionPreference<string>('historyDate', '')
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const workspaceRef = useRef<HTMLElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const tabsRef = useRef<HTMLDivElement | null>(null)
  const [editorFocusRequest, setEditorFocusRequest] = useState(0)
  const [splitWidth, setSplitWidth] = useState(() => { try { return Math.max(25, Math.min(60, Number(localStore.getItem('code-reps:split-width')) || 35)) } catch { return 35 } })
  function resizeSplit(value: number) { setSplitWidth(value) }
  function saveSplit(value: number) { try { localStore.setItem('code-reps:split-width', String(value)) } catch { /* Layout preference is optional. */ } }
  function revealSection(id: string, tab: 'task' | 'workspace' = 'workspace') {
    setMobileTab(tab)
    if (tab === 'task') setFocusMode(false)
    requestAnimationFrame(() => { const target = document.getElementById(id); target?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); target?.focus({ preventScroll: true }) })
  }
  const [catalogQuery, setCatalogQuery] = useSessionPreference<string>('catalogQuery', '')
  const [pathId, setPathId] = useSessionPreference<(typeof paths)[number]['id']>('path', 'typescript')
  const [learnerStart, setLearnerStart] = useState<LearnerStart | null>(() => {
    try { const saved = localStore.getItem(learnerStartKey); return saved === 'new' || saved === 'returning' ? saved : null }
    catch { return null }
  })
  const [mobileTab, setMobileTab] = useSessionPreference<'task' | 'workspace'>('workspace-tab', 'task')
  const [history, setHistory] = useState(readHistory)
  const [repId, setRepId] = useState(() => {
    const bookmarked = readRoute(location.hash, repIds).repId
    if (bookmarked) return bookmarked
    try { return reps.find((item) => item.id === localStore.getItem('code-reps:selected-rep'))?.id ?? reps[0].id }
    catch { return reps[0].id }
  })
  const rep = reps.find((item) => item.id === repId) ?? reps[0]
  const [attempt, setAttempt] = useState(() => readAttempt(rep))
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [runError, setRunError] = useState('')
  const [running, setRunning] = useState(false)
  const [saveState, setSaveState] = useState(storageIssue() || (isServerReady() ? 'Saved on this laptop' : 'Saved in browser'))
  const cancelRunRef = useRef<(() => void) | null>(null)
  const saveGenerationRef = useRef(0)
  const [runNotice, setRunNotice] = useState('')
  const resetDialogRef = useRef<HTMLDialogElement | null>(null)
  const [transferMessage, setTransferMessage] = useState('')
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const pendingSave = saveGenerationRef
    const generation = ++pendingSave.current
    const timer = window.setTimeout(() => {
      try {
        localStore.setItem(storageKey(repId), JSON.stringify(attempt))
        void flushStorage().then(() => {
          if (generation === pendingSave.current) setSaveState(isServerReady() ? 'Saved on this laptop' : 'Saved in browser')
        }).catch(() => {
          if (generation === pendingSave.current) setSaveState('Could not save to the local server; download a backup')
        })
      } catch { setSaveState('Could not save on this device') }
    }, 300)
    return () => { window.clearTimeout(timer); pendingSave.current++ }
  }, [attempt, repId])

  useEffect(() => {
    const activeRun = cancelRunRef
    return () => activeRun.current?.()
  }, [])
  useEffect(() => {
    const onError = () => setSaveState(storageIssue() || 'Local server save failed; download a backup')
    window.addEventListener('code-reps-storage-error', onError)
    return () => window.removeEventListener('code-reps-storage-error', onError)
  }, [])
  useEffect(() => {
    const saveDraft = () => {
      try { localStore.setItem(storageKey(repId), JSON.stringify(attempt)) }
      catch { setSaveState('Could not save on this device; download a backup') }
    }
    const saveWhenHidden = () => { if (document.visibilityState === 'hidden') saveDraft() }
    window.addEventListener('pagehide', saveDraft)
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => { window.removeEventListener('pagehide', saveDraft); document.removeEventListener('visibilitychange', saveWhenHidden) }
  }, [attempt, repId])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  function update<K extends keyof Attempt>(key: K, value: Attempt[K]) {
    setAttempt((current) => ({ ...current, [key]: value, completedAt: key === 'hintCount' ? current.completedAt : undefined }))
    setSaveState('Saving…')
    if (key === 'code') {
      if (running || results || runError) setRunNotice('Your code changed. Run checks again to check this version.')
      stopRun(); setResults(null); setRunError('')
    }
  }

  function stopRun() {
    cancelRunRef.current?.()
    cancelRunRef.current = null
    setRunning(false)
  }

  function cancelChecks() {
    stopRun()
    setRunNotice('Checks stopped. Your code is unchanged; run again when you are ready.')
  }

  function selectRep(nextId: string) {
    if (nextId === repId) return
    const nextRep = reps.find((item) => item.id === nextId)
    if (!nextRep) return
    stopRun()
    try {
      localStore.setItem(storageKey(repId), JSON.stringify(attempt))
      localStore.setItem('code-reps:selected-rep', nextId)
      setSaveState('Saving…')
    } catch { setSaveState('Could not save on this device') }
    setEditorFocusRequest(0)
    setRepId(nextId)
    setAttempt(readAttempt(nextRep))
    setResults(null)
    setRunError('')
    setRunNotice('')
  }

  const { route, navigate } = useNavigation(repIds, next => { if (next.view === 'workspace' && next.repId) selectRep(next.repId) })
  const view = route.view

  useLayoutEffect(() => {
    const workspace = workspaceRef.current
    const toolbar = toolbarRef.current
    const tabs = tabsRef.current
    if (!workspace || !toolbar || !tabs) return
    const measure = () => {
      workspace.style.setProperty('--workspace-toolbar-height', `${toolbar.getBoundingClientRect().height}px`)
      workspace.style.setProperty('--workspace-tabs-height', `${tabs.getBoundingClientRect().height}px`)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(toolbar)
    observer.observe(tabs)
    measure()
    return () => observer.disconnect()
  }, [view, repId])

  function openRep(nextId: string) {
    selectRep(nextId)
    setMobileTab('task')
    setView('workspace', nextId)
  }

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandsOpen(current => !current) }
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setFocusMode(false)
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [])

  function openReview(nextId: string) {
    openRep(nextId)
    const nextRep = reps.find((item) => item.id === nextId)
    if (nextRep && (nextId === repId ? attempt.completedAt : readAttempt(nextRep).completedAt)) {
      setAttempt({ plan: '', code: nextRep.starter, explanation: '', hintCount: 0 })
      setResults(null)
      setSaveState('Saving…')
    }
  }

  function chooseStart(value: LearnerStart) {
    setLearnerStart(value)
    try { localStore.setItem(learnerStartKey, value) }
    catch { setSaveState('Could not save on this device') }
  }

  function exportData() {
    try {
      const drafts: Backup['drafts'] = {}
      for (const item of reps) {
        const saved = localStore.getItem(storageKey(item.id))
        if (saved) drafts[item.id] = readAttempt(item)
      }
      drafts[repId] = attempt
      const backup: Backup = { format: 'code-reps-backup', version: 1, exportedAt: new Date().toISOString(), learnerStart, history, drafts }
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `code-reps-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setTransferMessage('Backup downloaded to this device.')
    } catch { setTransferMessage('The backup could not be created on this device.') }
  }

  async function importData(file: File) {
    try {
      const backup = parseBackup(await file.text(), new Set(reps.map((item) => item.id)))
      const merged = mergeHistory(history, backup.history).sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
      const updates: [string, string][] = [[historyKey, JSON.stringify(merged)]]
      for (const [id, draft] of Object.entries(backup.drafts)) {
        const key = storageKey(id)
        if (localStore.getItem(key) === null) updates.push([key, JSON.stringify(draft)])
      }
      if (!learnerStart && backup.learnerStart) updates.push([learnerStartKey, backup.learnerStart])
      localStore.setEntries(Object.fromEntries(updates))
      await flushStorage()
      window.location.reload()
    } catch (error) { setTransferMessage(error instanceof Error ? error.message : 'The backup could not be imported.') }
  }

  async function retrySaving() {
    setSaveState('Saving…')
    try {
      localStore.setItem(storageKey(repId), JSON.stringify(attempt))
      await retryStorage()
      setSaveState(isServerReady() ? 'Saved on this laptop' : 'Saved in browser')
    } catch (error) { setSaveState(error instanceof Error ? error.message : 'Could not save; download a backup') }
  }

  function runChecks() {
    if (running) return
    stopRun(); setResults(null); setRunError(''); setRunNotice(''); setRunning(true)
    setMobileTab('workspace')
    if (rep.format === 'frontend') {
      let cancelled = false
      let cancelFrame = () => {}
      cancelRunRef.current = () => { cancelled = true; cancelFrame() }
      void import('./frontend-run').then(({ startFrontendRun }) => {
        if (cancelled) return
        cancelFrame = startFrontendRun(attempt.code, rep,
          nextResults => { setRunning(false); setResults(nextResults) },
          message => { setRunning(false); setRunError(message) })
      }).catch(() => { if (!cancelled) { setRunning(false); setRunError('Browser checks could not load. Your code is still here; try again.') } })
      return
    }
    cancelRunRef.current = startCheckRun(attempt.code, repId, {
      createWorker: () => new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' }),
      schedule: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
      clearTimer: id => window.clearTimeout(id),
      onResults: nextResults => { setRunning(false); setResults(nextResults) },
      onError: message => { setRunning(false); setRunError(message) },
    })
  }

  const allPassed = results?.length === rep.checks.length && results.every((result) => result.passed)
  const canFinish = allPassed && attempt.plan.trim() && attempt.explanation.trim()

  const drafts = Object.fromEntries(reps.map(item => [item.id, item.id === repId ? attempt : readAttempt(item)]))
  const repStatus = (item: Rep) => attemptStatus(item.id, drafts[item.id])
  const currentStatus = repStatus(rep)
  const currentLesson = [...foundations, ...coreLessons].find(lesson => lesson.repId === rep.id)
  const practicePlan = getPracticePlan(drafts, history, learnerStart, repId, now)
  const journeyStates = practicePlan.progress
  const journey = journeyStates.find(item => item.recallDue) ?? journeyStates.find(item => item.nextRepId) ?? journeyStates.find(item => item.stage !== 'retained') ?? journeyStates[0]
  const reflectionGuide = reflectionGuides[rep.id]
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && reps.find(item => item.id === recommendation.repId)
  const actionLabel = (mode: string) => mode === 'resume' ? 'Continue rep' : mode === 'review' ? 'Start review' : mode === 'retry' ? 'Retry without hints' : 'Start rep'
  const openPracticeAction = (action: { repId: string; mode: string }) => action.mode === 'review' || action.mode === 'retry' ? openReview(action.repId) : openRep(action.repId)
  const selectedPath = paths.find((path) => path.id === pathId) ?? paths[0]
  const pathStages = learnerStart === 'returning' && selectedPath.id === 'typescript' ? selectedPath.stages.slice(1) : selectedPath.stages
  const pathIntroduction = learnerStart === 'returning' && selectedPath.id === 'typescript'
    ? { ...selectedPath.introduction, title: 'A quick TypeScript refresher', next: 'You can revisit the language basics above whenever you need them. Start with a guided array rep, then solve a related task on your own.' }
    : selectedPath.introduction
  const pathRepIds = pathStages.flatMap((stage) => stage.repIds)
  const completedPathIds = new Set(history.map((record) => record.repId))
  const recallReady = (id: string) => !journeyStates.some((state) => state.journey.recall === id && !state.recallDue && !state.retained)
  const nextPathRep = reps.find((item) => item.id === pathRepIds.find((id) => !completedPathIds.has(id) && recallReady(id)))
  const pathCompletedCount = pathRepIds.filter((id) => completedPathIds.has(id)).length
  const glossary = [...new Map(reps.flatMap((item) => item.vocabulary.map((entry) => [entry.term.toLowerCase(), entry] as const))).values()]
    .sort((a, b) => a.term.localeCompare(b.term))
  const categories = [...new Set(reps.map(item => item.category))].sort()
  const dueIds = new Set(practicePlan.due.map(item => item.repId))
  const visibleReps = reps.filter(item => `${item.title} ${item.category} ${item.format ?? 'algorithm'}`.toLowerCase().includes(catalogQuery.trim().toLowerCase()) && (!catalogSkill || item.category === catalogSkill) && (!catalogFormat || (item.format ?? 'algorithm') === catalogFormat) && (!catalogStatus || (catalogStatus === 'review' ? dueIds.has(item.id) : repStatus(item) === catalogStatus)))
  const visibleHistory = history.filter(record => { const item = reps.find(rep => rep.id === record.repId); return (!historyQuery || `${item?.title ?? ''} ${item?.category ?? ''}`.toLowerCase().includes(historyQuery.toLowerCase())) && (!historySkill || item?.category === historySkill) && (!historyDifficulty || record.difficulty === historyDifficulty) && (!historyDate || new Date(record.completedAt).toLocaleDateString('en-CA') === new Date(`${historyDate}T12:00:00`).toLocaleDateString('en-CA')) })
  const commands = [
    ...(['home', 'paths', 'catalog', 'learn', 'progress', 'history'] as View[]).map(page => ({ label: `Go to ${page === 'catalog' ? 'practice library' : page}`, run: () => setView(page) })),
    { label: 'Open glossary', run: () => setGlossaryOpen(true) },
    ...(view === 'workspace' ? [
      { label: 'Run checks', shortcut: 'Ctrl / ⌘ Enter', run: runChecks },
      { label: 'Focus editor', run: () => { setFocusMode(true); revealSection('solution-section'); setEditorFocusRequest(current => current + 1) } },
      { label: focusMode ? 'Leave focus mode' : 'Enter focus mode', run: () => { setFocusMode(!focusMode); setMobileTab('workspace') } },
      { label: 'Read brief and hints', run: () => revealSection('brief-section', 'task') },
      { label: 'View check results', run: () => revealSection('checks-section') },
      { label: 'Explain solution', run: () => revealSection('explain-section') },
    ] : []),
  ]

  function completeRep() {
    if (!canFinish || !attempt.difficulty || !attempt.confidence || attempt.completedAt) return
    const completedAt = new Date().toISOString()
    const completed = { ...attempt, completedAt }
    const nextHistory = [{ ...completed, id: crypto.randomUUID(), repId }, ...history]
    try {
      localStore.setItem(historyKey, JSON.stringify(nextHistory))
      localStore.setItem(storageKey(repId), JSON.stringify(completed))
      setHistory(nextHistory)
      setAttempt(completed)
      setSaveState('Saving…')
    } catch { setSaveState('Could not save on this device') }
  }

  function startNewAttempt() {
    if (!attempt.completedAt) return
    stopRun()
    setAttempt({ plan: '', code: rep.starter, explanation: '', hintCount: 0 })
    setResults(null)
    setRunError('')
    setRunNotice('')
    setSaveState('Saving…')
    window.scrollTo(0, 0)
  }

  function resetRep() {
    resetDialogRef.current?.close()
    stopRun()
    setAttempt({ plan: '', code: rep.starter, explanation: '', hintCount: 0 })
    setResults(null)
    setRunError('')
    setRunNotice('')
    setMobileTab('task')
    setSaveState('Saving…')
  }

  return <div className="app-shell">
    <header className="topbar"><button className="brand" type="button" onClick={() => setView('home')} aria-label="Code Reps home"><img className="brand-mark" src="/favicon.svg" alt="" /><span>code<span className="brand-accent">reps</span></span></button><div className="topbar-right"><nav className="top-nav" aria-label="Main navigation"><button type="button" aria-current={view === 'home' ? 'page' : undefined} onClick={() => setView('home')}>Home</button><button type="button" aria-current={view === 'paths' ? 'page' : undefined} onClick={() => setView('paths')}>Paths</button><button type="button" aria-current={view === 'workspace' || view === 'catalog' ? 'page' : undefined} onClick={() => setView('catalog')}>Practice</button><button type="button" aria-current={view === 'learn' ? 'page' : undefined} onClick={() => setView('learn')}>Learn</button><button type="button" aria-current={view === 'progress' ? 'page' : undefined} onClick={() => setView('progress')}>Progress</button><button type="button" aria-current={view === 'history' ? 'page' : undefined} onClick={() => setView('history')}>History</button></nav><button className="commands-trigger" type="button" onClick={() => setCommandsOpen(true)} aria-label="Open commands and keyboard shortcuts">Commands <kbd>⌘ / Ctrl K</kbd></button><span className="topbar-divider" /><span className="save-status" role="status">{saveState}</span></div></header>
    {saveState !== 'Saving…' && !saveState.startsWith('Saved') && <div className="storage-recovery" role="status"><p>{saveState}</p><button type="button" onClick={() => { void retrySaving() }}>Retry saving</button><button type="button" onClick={exportData}>Download backup</button></div>}
    <ScreenMemory key={`${view}:${view === 'workspace' ? repId : ''}`} screenKey={`${view}:${view === 'workspace' ? repId : ''}`}>
    {view === 'home' ? <main className="home-main" id="top">
      <div className="home-heading"><h1 tabIndex={-1}>{learnerStart ? 'Pick up where you left off.' : 'Build the skill to solve it yourself.'}</h1><p>Practice, see what changed, and return to prove what stayed with you. Free on your laptop.</p></div>
      {recommendation && recommendedRep ? <section className="continue-panel" aria-labelledby="continue-heading"><div><span className="home-label">{recommendation.mode === 'review' ? 'READY TO REVIEW' : recommendation.mode === 'resume' ? 'PICK UP YOUR DRAFT' : 'NEXT REP'}</span><h2 id="continue-heading">{recommendedRep.title}</h2><p>{recommendation.reason}</p><span className="continue-status">{repStatus(recommendedRep)} <span aria-hidden="true">/</span> {recommendedRep.category}</span></div><button className="primary-button" type="button" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openPracticeAction(recommendation)}>{actionLabel(recommendation.mode)} <span aria-hidden="true">→</span></button></section> : <section className="continue-panel" aria-labelledby="continue-heading"><div><span className="home-label">CAUGHT UP FOR NOW</span><h2 id="continue-heading">Your next review can wait.</h2><p>No unfinished reps or reviews are ready. Check your skill evidence or choose a rep to practise again.</p></div><button className="primary-button" type="button" onClick={() => setView('progress')}>See progress →</button></section>}
      {practicePlan.unfinished.length > 0 && <section className="practice-queue" aria-labelledby="unfinished-heading"><div className="home-section-heading"><h2 id="unfinished-heading">Your unfinished work</h2><p>{practicePlan.unfinished.length} saved {practicePlan.unfinished.length === 1 ? 'draft' : 'drafts'}. Continue with your work intact.</p></div><ul>{practicePlan.unfinished.map(action => <li key={action.repId}><div><strong>{reps.find(item => item.id === action.repId)!.title}</strong><p>{action.reason}</p></div><button className="text-button" type="button" onClick={() => openPracticeAction(action)}>Continue rep →</button></li>)}</ul></section>}
      {practicePlan.due.length > 0 && <section className="practice-queue" aria-labelledby="reviews-heading"><div className="home-section-heading"><h2 id="reviews-heading">Ready to review</h2><p>{practicePlan.due.length} {practicePlan.due.length === 1 ? 'rep is' : 'reps are'} ready. Completed attempts stay in History.</p></div><ul>{practicePlan.due.map(action => <li key={action.repId}><div><strong>{reps.find(item => item.id === action.repId)!.title}</strong><p>{action.reason}</p></div><button className="text-button" type="button" onClick={() => openPracticeAction(action)}>{action.mode === 'resume' ? 'Continue recall' : 'Start review'} →</button></li>)}</ul></section>}
      <section className="home-journey" aria-labelledby="home-journey-title"><div><span className="home-label">SKILL IN FOCUS</span><h2 id="home-journey-title">{journey.journey.title}</h2><p>{journey.stage === 'retained' ? 'You solved a fresh problem after a gap, without hints.' : journey.stage === 'independent' ? journey.recallDue ? 'Your fresh recall problem is ready.' : `You solved a related problem without hints. Return ${new Date(journey.recallAt!).toLocaleDateString()} for a fresh one.` : journey.stage === 'practising' ? 'You completed guided practice. Try a related problem without hints.' : 'Start with a guided rep.'}</p></div><button className="text-button" type="button" onClick={() => setView('progress')}>See your evidence →</button><span className="journey-state">{stageLabels[journey.stage]}</span></section>
      <section className="starting-point" aria-labelledby="starting-point-title"><div><span className="home-label">YOUR STARTING POINT</span><h2 id="starting-point-title">Where are you starting?</h2><p>This only changes your next suggested rep. You can open any rep at any time.</p></div><div className="starting-options"><button type="button" aria-pressed={learnerStart === 'new'} onClick={() => chooseStart('new')}><strong>New to coding</strong><span>Start with TypeScript building blocks.</span></button><button type="button" aria-pressed={learnerStart === 'returning'} onClick={() => chooseStart('returning')}><strong>Returning to coding</strong><span>Start with guided problem solving.</span></button></div></section>
      <section className="home-practice"><button className="browse-reps-button" type="button" onClick={() => setView('catalog')}><span className="library-copy"><span className="home-label">PRACTICE LIBRARY</span><strong>Find a different rep</strong><small>{reps.length} exercises across TypeScript and problem solving</small></span><span className="library-action">Browse reps <span aria-hidden="true">↗</span></span></button></section>
    </main> : view === 'catalog' ? <main className="catalog-main"><div className="catalog-heading"><div><span className="home-label">PRACTICE LIBRARY</span><h1 tabIndex={-1}>Choose your next rep.</h1><p>Search by title or skill. Your draft is saved when you switch exercises.</p></div><div className="catalog-search"><label htmlFor="catalog-query">Find a rep</label><input id="catalog-query" type="search" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Try arrays, strings, debugging…" /></div></div><div className="filter-bar" aria-label="Practice filters"><label>Skill<select aria-label="Skill" value={catalogSkill} onChange={event => setCatalogSkill(event.target.value)}><option value="">All skills</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Format<select aria-label="Format" value={catalogFormat} onChange={event => setCatalogFormat(event.target.value)}><option value="">All formats</option>{[...new Set(reps.map(item => item.format ?? 'algorithm'))].map(format => <option key={format} value={format}>{formatLabels[format]}</option>)}</select></label><label>Status<select aria-label="Status" value={catalogStatus} onChange={event => setCatalogStatus(event.target.value)}><option value="">All statuses</option>{['Not started', 'In progress', 'Completed'].map(status => <option key={status}>{status}</option>)}<option value="review">Review due</option></select></label><button type="button" className="text-button" onClick={() => { setCatalogQuery(''); setCatalogSkill(''); setCatalogFormat(''); setCatalogStatus('') }}>Clear filters</button></div><div className="catalog-list-heading"><h2>{catalogQuery.trim() ? 'Search results' : 'All exercises'}</h2><span aria-live="polite">{visibleReps.length} {visibleReps.length === 1 ? 'rep' : 'reps'}</span></div><div className="catalog-list" role="region" aria-label="Exercise list" tabIndex={0}>{visibleReps.length ? visibleReps.map((item) => <button className="rep-list-row" type="button" key={item.id} onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openRep(item.id)}><span className="rep-list-index">{String(reps.indexOf(item) + 1).padStart(2, '0')}</span><span className="rep-list-name"><strong>{item.title}</strong><small>{item.category} · {formatLabels[item.format ?? 'algorithm']}{dueIds.has(item.id) ? ' · Review due' : ''}</small></span><span className={`rep-list-status ${repStatus(item).toLowerCase().replace(' ', '-')}`}>{repStatus(item)}</span><span className="rep-list-arrow" aria-hidden="true">→</span></button>) : <p className="catalog-empty">No reps match these filters. Clear filters or try a shorter search.</p>}</div></main> : view === 'paths' ? <main className="paths-main"><div className="home-heading"><h1 tabIndex={-1}>Choose a learning path.</h1><p>Free lessons and practice for coding in an AI-rich world. Open any path or rep.</p></div><div className="path-choices" role="group" aria-label="Learning paths">{paths.map((path) => <button key={path.id} type="button" aria-pressed={pathId === path.id} onClick={() => setPathId(path.id)}><strong>{path.title}</strong><span>{path.description}</span></button>)}</div><section className="path-overview" aria-labelledby="path-title"><div><span className="home-label">START HERE</span><h2 id="path-title">{learnerStart === 'returning' && selectedPath.id === 'typescript' ? 'Return to problem solving' : selectedPath.title}</h2><p>{learnerStart === 'returning' && selectedPath.id === 'typescript' ? 'Start with guided problems, then revisit skills without hints after a break.' : selectedPath.description}</p><span className="continue-status">{pathCompletedCount} of {pathRepIds.length} reps completed</span></div>{nextPathRep && <button className="primary-button" type="button" onClick={() => pathCompletedCount === 0 ? document.getElementById('path-introduction')?.scrollIntoView({ behavior: 'smooth' }) : openRep(nextPathRep.id)}>{pathCompletedCount === 0 ? 'Read introduction ↓' : 'Continue path →'}</button>}</section><PathIntroduction introduction={pathIntroduction} onStart={() => openRep(pathRepIds[0])} /><div className="path-progress" role="progressbar" aria-label="Path progress" aria-valuenow={pathCompletedCount} aria-valuemin={0} aria-valuemax={pathRepIds.length}><span style={{ width: `${pathCompletedCount / pathRepIds.length * 100}%` }} /></div><div className="path-stages">{pathStages.map((stage, stageIndex) => <details className="path-stage" key={stage.title} open={stageIndex === 0}><summary className="path-stage-heading"><span>{String(stageIndex + 1).padStart(2, '0')}</span><div><h3>{stage.title}</h3><p>{stage.description}</p></div></summary><ol>{stage.repIds.map((id) => { const item = reps.find((entry) => entry.id === id); if (!item) return null; const done = completedPathIds.has(id); return <li key={id}><button type="button" disabled={!recallReady(id)} onClick={() => openRep(id)}><span>{item.title}</span><small>{!recallReady(id) ? 'Available after independent practice' : done ? 'Completed' : repStatus(item)}</small><span aria-hidden="true">→</span></button></li> })}</ol></details>)}</div></main> : view === 'progress' ? <ProgressPage progress={journeyStates} onOpenRep={openRep} onReviewRep={openReview} onExport={exportData} onImport={(file) => { void importData(file) }} transferMessage={transferMessage} serverReady={isServerReady()} /> : view === 'learn' ? <main className="learn-main"><div className="home-heading"><h1 tabIndex={-1}>Learn the building blocks.</h1><p>Short explanations to revisit before or after a rep.</p></div><details className="learn-section" open><summary><h2 id="foundations-heading">TypeScript foundations</h2></summary><p className="section-intro">Start here if variables, types, and objects are new to you. Read an example, then try its short rep.</p><div className="foundation-list">{foundations.map((lesson, index) => <details className="foundation-lesson" key={lesson.repId}><summary><span className="foundation-number">{String(index + 1).padStart(2, '0')}</span><h3>{lesson.title}</h3><span className="disclosure-arrow" aria-hidden="true">↗</span></summary><div className="foundation-content"><p>{lesson.explanation}</p><pre><code>{lesson.example}</code></pre><p className="foundation-tip">{lesson.tip}</p><button className="text-button" type="button" onClick={() => openRep(lesson.repId)}>Try the rep →</button></div></details>)}</div></details><details className="learn-section"><summary><h2 id="core-lessons-heading">AI-era, frontend, backend, and interview core</h2></summary><p className="section-intro">Read a concept, try a focused rep, and explain how you checked your result.</p><div className="foundation-list">{coreLessons.map((lesson, index) => <details className="foundation-lesson" key={lesson.repId}><summary><span className="foundation-number">{String(index + 1).padStart(2, '0')}</span><h3>{lesson.title}</h3><span className="disclosure-arrow" aria-hidden="true">↗</span></summary><div className="foundation-content"><p>{lesson.explanation}</p><pre><code>{lesson.example}</code></pre><p className="foundation-tip">{lesson.tip}</p><button className="text-button" type="button" onClick={() => openRep(lesson.repId)}>Try the rep →</button></div></details>)}</div></details><details className="learn-section"><summary><h2>Problem-solving skills</h2></summary><div className="skill-list">{['Arrays', 'Maps & sets', 'Strings', 'Stacks'].map((skill) => { const related = reps.filter((item) => skill === 'Arrays' ? item.category.includes('Arrays') : skill === 'Maps & sets' ? /maps|sets/i.test(item.category) : item.category.includes(skill)); return <article className="skill-card" key={skill}><h3>{skill}</h3><p>{skill === 'Arrays' ? 'Visit values in order, count them, and decide what to keep.' : skill === 'Maps & sets' ? 'Use keys for counts and sets to remember what you have seen.' : skill === 'Strings' ? 'Work through text one character or word at a time.' : 'Track the most recent unmatched opening item.'}</p><span>{related.length} {related.length === 1 ? 'rep' : 'reps'}</span><button className="text-button" type="button" onClick={() => openRep(related[0].id)}>Try {related[0].title} →</button></article> })}</div></details><details className="learn-section"><summary><h2>Glossary</h2></summary><dl className="glossary-list">{glossary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl></details></main> : view === 'history' ? <main className="history-main"><div className="home-heading"><h1 tabIndex={-1}>Attempt history</h1><p>Completed reps stay here so you can compare your thinking over time.</p></div><div className="filter-bar" aria-label="History filters"><label>Find an attempt<input type="search" value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Rep or skill…" /></label><label>Skill<select aria-label="Skill" value={historySkill} onChange={event => setHistorySkill(event.target.value)}><option value="">All skills</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Difficulty<select aria-label="Difficulty" value={historyDifficulty} onChange={event => setHistoryDifficulty(event.target.value)}><option value="">Any difficulty</option>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Date<input type="date" value={historyDate} onChange={event => setHistoryDate(event.target.value)} /></label><button className="text-button" type="button" onClick={() => { setHistoryQuery(''); setHistorySkill(''); setHistoryDifficulty(''); setHistoryDate('') }}>Clear filters</button></div><p className="utility-note" aria-live="polite">{visibleHistory.length} matching attempts</p>{history.length === 0 ? <div className="history-empty">No completed attempts yet. Finish a rep to save your first one here.</div> : <ol className="history-list">{visibleHistory.map((record) => { const item = reps.find((entry) => entry.id === record.repId); const previous = history.filter(entry => entry.repId === record.repId && Date.parse(entry.completedAt) < Date.parse(record.completedAt)).sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0]; return <li key={record.id} data-attempt-id={record.id}><div><strong>{item?.title ?? 'Unknown rep'}</strong><span>{new Date(record.completedAt).toLocaleString()} · {record.hintCount} {record.hintCount === 1 ? 'hint' : 'hints'} used</span></div><details><summary>Review attempt</summary>{record.difficulty && <p className="reflection-detail">Difficulty: {difficultyLabels[record.difficulty]}</p>}{record.confidence && <p className="reflection-detail">Confidence: {confidenceLabels[record.confidence]}</p>}{previous && <section className="attempt-compare"><strong>Since your previous attempt</strong><p>Hints: {previous.hintCount} → {record.hintCount}. Compare the plans and explanations below; the app does not grade their quality.</p><div className="attempt-comparison"><div><h4>Previous · {new Date(previous.completedAt).toLocaleDateString()}</h4><h5>Plan</h5><p>{previous.plan}</p><h5>Code</h5><pre><code>{previous.code}</code></pre><h5>Explanation</h5><p>{previous.explanation}</p></div><div><h4>This attempt · {new Date(record.completedAt).toLocaleDateString()}</h4><h5>Plan</h5><p>{record.plan}</p><h5>Code</h5><pre><code>{record.code}</code></pre><h5>Explanation</h5><p>{record.explanation}</p></div></div></section>}<h3>Plan</h3><p>{record.plan}</p><h3>Code</h3><pre><code>{record.code}</code></pre><h3>Explanation</h3><p>{record.explanation}</p></details>{item && <button className="text-button" type="button" onClick={() => openRep(item.id)}>Open rep →</button>}</li> })}</ol>}{history.length > 0 && !visibleHistory.length && <p className="history-empty">No attempts match these filters. Try another date or clear filters.</p>}</main> : <main ref={workspaceRef} className={`practice-main ${focusMode ? 'focus-mode' : ''}`} id="top" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runChecks() } }}>
      <div className="page-intro"><div className="practice-context"><span className="breadcrumb"><button type="button" className="breadcrumb-link" onClick={() => setView('catalog')}>Practice</button><span aria-hidden="true">/</span>{rep.category}</span><span className="practice-status">{currentStatus}</span></div><div className="intro-row"><div><h1 tabIndex={-1}>{rep.title}</h1><p className="intro-copy">Read the brief. Plan your approach. Make it work.</p></div><div className="intro-actions"><button className="reset-button" type="button" onClick={() => setGlossaryOpen(true)}>Glossary</button><button className="reset-button" type="button" onClick={() => { setFocusMode(!focusMode); setMobileTab('workspace') }}>{focusMode ? 'Exit focus' : 'Focus mode'}</button><button className="reset-button" type="button" onClick={() => resetDialogRef.current?.showModal()}>↺ Reset rep</button></div></div></div>
      <p className="workspace-save-status" role="status">{saveState}</p>
      <div ref={tabsRef} className="mobile-tabs" role="group" aria-label="Practice workspace"><button type="button" aria-controls="task-workspace" aria-pressed={mobileTab === 'task'} onClick={() => { setFocusMode(false); setMobileTab('task') }}>Task & plan</button><button type="button" aria-controls="code-workspace" aria-pressed={mobileTab === 'workspace'} onClick={() => setMobileTab('workspace')}>Code & results</button></div>
      <div className="workspace-layout" style={{ gridTemplateColumns: focusMode ? 'minmax(0, 1fr)' : `minmax(0, ${splitWidth}fr) 12px minmax(0, ${100 - splitWidth}fr)` }}>
        <div id="task-workspace" key={`task-${rep.id}`} className={`task-column ${mobileTab === 'task' ? 'mobile-active' : ''}`} role="region" aria-label="Task and plan" tabIndex={0}>
          <section id="brief-section" tabIndex={-1} className="panel task-panel">{currentLesson && <div className="rep-lesson"><span className="home-label">CORE LESSON</span><h2>{currentLesson.title}</h2><p>{currentLesson.explanation}</p><pre><code>{currentLesson.example}</code></pre><p className="foundation-tip">{currentLesson.tip}</p></div>}<div className="panel-heading"><span className="step-number">01</span><h2>The brief</h2></div>{rep.context && <p className="rep-context">{rep.context}</p>}<p>{rep.prompt}</p>{rep.acceptanceCriteria && <ul className="acceptance-criteria">{rep.acceptanceCriteria.map(point => <li key={point}>{point}</li>)}</ul>}<div className="example"><div className="example-label">EXAMPLE</div><code>{rep.example.input}</code><span className="example-arrow">→</span><code>{rep.example.output}</code></div><p className="task-note">{rep.note}</p><div className="vocab"><span className="vocab-icon">i</span><div><strong>Quick vocabulary</strong><p>{rep.vocabulary.map((item, index) => <span key={item.term}>{index > 0 && ' ' }<b>{item.term}</b> means {item.meaning}.</span>)}</p></div></div><div className="hint-control"><button className="hint-button" type="button" disabled={attempt.hintCount >= rep.hints.length} onClick={() => { update('hintCount', attempt.hintCount + 1); setMobileTab('task') }}>{attempt.hintCount >= rep.hints.length ? 'All hints revealed' : `Reveal hint ${attempt.hintCount + 1}`}<span aria-hidden="true"> ↗</span></button><span>{attempt.hintCount} of {rep.hints.length} revealed</span></div>{attempt.hintCount > 0 && <div className="task-hints" aria-live="polite"><div className="hint-heading"><span className="hint-spark">✳</span><strong>Hints revealed</strong></div><ol className="hint-list">{rep.hints.slice(0, attempt.hintCount).map((hint) => <li key={hint}>{hint}</li>)}</ol></div>}</section>
          <section className="panel plan-panel"><div className="panel-heading"><span className="step-number">02</span><h2>Plan your approach</h2></div><p>{rep.planPrompt}</p><label className="field-label" htmlFor="plan">YOUR PLAN</label><textarea id="plan" value={attempt.plan} onChange={(event) => update('plan', event.target.value)} placeholder="I'll start by…" rows={5} /><div className="field-foot">A few sentences are enough. This is for your own thinking.</div><button className="text-button plan-to-code" type="button" onClick={() => revealSection('solution-section')}>Go to code →</button></section>
        </div>
        <WorkspaceSplit value={splitWidth} onChange={resizeSplit} onCommit={saveSplit} />
        <div id="code-workspace" key={`code-${rep.id}`} className={`code-column ${mobileTab === 'workspace' ? 'mobile-active' : ''}`} role="region" aria-label="Code, checks, and reflection" tabIndex={0}>
          <div ref={toolbarRef} className="workspace-toolbar"><div className="workspace-toolbar-links"><button type="button" onClick={() => revealSection('brief-section', 'task')}>Brief & hints</button><button type="button" onClick={() => revealSection('solution-section')}>Go to code</button><button type="button" onClick={() => revealSection('checks-section')}>{results?.some(result => !result.passed) ? 'View failed checks' : 'Results'}</button><button type="button" onClick={() => revealSection('explain-section')}>Explain solution</button></div><div className="workspace-toolbar-run"><span role="status">{running ? 'Running checks…' : results ? `${results.filter(result => result.passed).length}/${results.length} passed` : 'Ready to run'}</span>{running ? <button type="button" className="stop-checks-button" onClick={cancelChecks}>Stop checks</button> : <button className="primary-button" type="button" onClick={runChecks}>▶ Run checks</button>}</div></div><section id="solution-section" tabIndex={-1} className="panel code-panel"><div className="panel-heading code-heading"><div><span className="step-number">03</span><h2>{rep.format === 'debug' ? 'Repair the code' : rep.format === 'read' ? 'Read and edit the code' : rep.format === 'transform' ? 'Transform the data' : rep.format === 'frontend' ? 'Build the interface' : rep.format === 'backend' ? 'Implement the handler' : rep.format === 'refactor' ? 'Improve the structure' : 'Your solution'}</h2></div><span className="language-pill">TYPESCRIPT</span></div><div className="editor-top"><span className="file-tab"><span className="ts-icon">TS</span> solution.ts</span><span className="editor-hint">Your code stays on this device</span></div><div className="editor-wrap"><SolutionEditor key={rep.id} focusRequest={editorFocusRequest} height={focusMode ? 'clamp(380px, 65vh, 800px)' : 'clamp(280px, 40vh, 390px)'} path={`code-reps://${rep.id}/solution.ts`} language="typescript" value={attempt.code} onChange={(value) => update('code', value ?? '')} onRunChecks={runChecks} options={{ ariaLabel: `TypeScript solution for ${rep.title}. Press Control or Command Enter to run checks. Tab moves focus out of the editor.`, tabFocusMode: true, minimap: { enabled: false }, fontFamily: 'Maple Mono, monospace', fontLigatures: true, fontSize: 14, lineHeight: 24, padding: { top: 18 }, scrollBeyondLastLine: false, scrollbar: { alwaysConsumeMouseWheel: false }, automaticLayout: true, tabSize: 2, wordWrap: 'on' }} /></div><div className="code-actions"><span>{rep.checks.length} checks · Ctrl / ⌘ Enter to run</span><div className="run-buttons">{running && <button className="stop-checks-button" type="button" onClick={cancelChecks}>Stop checks</button>}<button className="primary-button" type="button" onClick={runChecks} disabled={running}>{running ? 'Running…' : '▶  Run checks'}</button></div></div></section>
          {rep.format === 'frontend' && <Suspense fallback={<section className="panel frontend-preview" role="status">Loading preview controls…</section>}><FrontendPreview key={rep.id} rep={rep} code={attempt.code} /></Suspense>}
          <section id="checks-section" tabIndex={-1} className="panel results-panel" aria-live="polite" aria-busy={running}><div className="panel-heading"><span className="step-number">04</span><h2>Check your work</h2></div>{running ? <div className="result-running"><span className="result-running-track" aria-hidden="true"><span /></span><strong>Running checks</strong><p>Checking your solution against {rep.checks.length} cases.</p></div> : runError ? <div className="error-message" role="alert">{runError}</div> : results ? <><div className={`result-summary ${allPassed ? 'passed' : 'failed'}`}><span>{allPassed ? '✓' : '!'}</span><div><strong>{allPassed ? 'All checks passed' : `${results.filter((result) => result.passed).length} of ${results.length} checks passed`}</strong><p>{allPassed ? 'Nice work. Explain your thinking to complete this rep.' : 'Read the feedback, adjust your code, and try again.'}</p></div></div><CheckFeedback results={results} /></> : <div className="empty-results"><span className="empty-icon">⌁</span><div><strong>{runNotice ? 'Run checks again when ready' : 'Ready when you are'}</strong><p>{runNotice || 'Run checks to see how your solution handles the examples and edge cases.'}</p></div></div>}</section>
        <section id="explain-section" tabIndex={-1} className="panel explain-panel"><div className="explain-intro"><div className="panel-heading"><span className="step-number">05</span><h2>Explain your thinking</h2></div><p>How does your solution work? Mention the time and space it uses if you can.</p></div><div className="explain-form"><label className="field-label" htmlFor="explanation">YOUR EXPLANATION</label><textarea id="explanation" value={attempt.explanation} onChange={(event) => update('explanation', event.target.value)} placeholder="My solution works by…" rows={4} />{allPassed && <details className="reflection-guide"><summary>Compare your plan and explanation</summary><p>These prompts support your own review. The app checks code behavior, not the quality of your writing.</p><div className="reflection-guide-columns"><div><strong>Plan</strong><ul>{(reflectionGuide?.plan ?? ['Describe how you will use the inputs.', 'Name an edge case from the task.', 'Explain the steps before coding.']).map((point) => <li key={point}>{point}</li>)}</ul></div><div><strong>Explanation</strong><ul>{(reflectionGuide?.explanation ?? ['Explain why the code handles the example and edge cases.', 'Describe the time and extra space used.']).map((point) => <li key={point}>{point}</li>)}</ul></div></div>{reflectionGuide && <div className="reflection-example"><strong>Example to compare with</strong><p>{reflectionGuide.example}</p></div>}</details>}<div className="reflection-fields"><div><label className="field-label" htmlFor="difficulty">WHAT WAS HARDEST?</label><select id="difficulty" value={attempt.difficulty ?? ''} onChange={(event) => update('difficulty', event.target.value as Difficulty)}><option value="">Choose one</option>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label className="field-label" htmlFor="confidence">HOW CONFIDENT DO YOU FEEL?</label><select id="confidence" value={attempt.confidence ?? ''} onChange={(event) => update('confidence', event.target.value as Confidence)}><option value="">Choose one</option>{Object.entries(confidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div><ul className="completion-checklist" aria-label="Completion requirements">{[['Plan', !!attempt.plan.trim()], ['Checks', !!allPassed], ['Explanation', !!attempt.explanation.trim()], ['Reflection', !!attempt.difficulty && !!attempt.confidence]].map(([label, done]) => <li key={String(label)} className={done ? 'done' : ''}>{done ? '✓' : '○'} {label} {done ? label === 'Checks' ? 'passed' : 'added' : 'needed'}</li>)}</ul><div className="explain-actions"><div>{!canFinish && <p className="finish-note">Add a plan and explanation, then pass all checks to complete the rep.</p>}{canFinish && (!attempt.difficulty || !attempt.confidence) && !attempt.completedAt && <p className="finish-note">Choose a difficulty and confidence level to finish.</p>}{attempt.completedAt && <p className="finish-note success">Completed and saved on this device.</p>}</div><button className="finish-button" type="button" disabled={!canFinish || !attempt.difficulty || !attempt.confidence || !!attempt.completedAt} onClick={completeRep}>{attempt.completedAt ? '✓ Rep completed' : 'Complete rep →'}</button></div>{attempt.completedAt && <section className="completion-panel" aria-labelledby="completion-title"><span className="home-label">ATTEMPT RECORDED</span><h3 id="completion-title">You finished {rep.title}.</h3><p>Your code, plan, explanation, and reflection are recorded in History. {attempt.hintCount ? `You used ${attempt.hintCount} hint(s); this attempt supports learning.` : 'You completed this attempt without hints.'}</p>{journeyStates.filter(state => [state.journey.guided, state.journey.independent, state.journey.recall].includes(rep.id)).map(state => <p key={state.journey.id}>{state.recallAt ? state.recallDue ? 'A fresh recall problem is ready.' : `Recall becomes available ${new Date(state.recallAt).toLocaleDateString()}.` : 'Complete independent practice to schedule later recall.'}</p>)}<div>{recommendation && recommendedRep && <button type="button" className="primary-button" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openPracticeAction(recommendation)}>{actionLabel(recommendation.mode)}: {recommendedRep.title} →</button>}<button type="button" className="text-button" onClick={() => setView('progress')}>See skill evidence →</button></div></section>}{attempt.completedAt && <button className="text-button retry-button" type="button" onClick={startNewAttempt}>Start a fresh attempt →</button>}</div></section>
        </div>
      </div>
    </main>}
    </ScreenMemory>
    {glossaryOpen && <GlossaryDrawer terms={glossary} onClose={() => setGlossaryOpen(false)} />}
    {commandsOpen && <CommandPalette reps={reps} commands={commands} onOpenRep={openRep} onClose={() => setCommandsOpen(false)} />}
    <dialog className="reset-dialog" ref={resetDialogRef} aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
      <span className="reset-dialog-label">START AGAIN</span>
      <h2 id="reset-dialog-title">Reset this rep?</h2>
      <p id="reset-dialog-description">Your plan, code, explanation, revealed hints, and check results will be cleared. The starter code will be restored.</p>
      <p className="reset-dialog-note">Completed attempts in History will stay saved.</p>
      <div className="reset-dialog-actions"><button className="reset-dialog-cancel" type="button" autoFocus onClick={() => resetDialogRef.current?.close()}>Cancel</button><button className="reset-dialog-confirm" type="button" onClick={resetRep}>Reset rep</button></div>
    </dialog>
    <footer><span>CODE REPS</span><span>Practice clearly. Build fluency.</span></footer>
  </div>
}

export default App
