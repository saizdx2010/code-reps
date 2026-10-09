import { usePracticeSessions } from './usePracticeSessions'
import { PracticeSessionPanel } from './PracticeSessionPanel'
import { PracticeHistory } from './PracticeHistory'
import { emptySessions } from './practice-sessions'
import type { PracticeSession } from './practice-sessions'
import type { PortableRecord } from './portability'
import { Input, Select, Textarea } from './Input'
import { DateInput } from './DateInput'
import { AppNavigation } from './AppNavigation'
import type { HubTab } from './LearningHub'
import { InterviewStatus } from './InterviewStatus'
import { useFluency } from './useFluency'
import { relatedHelp, parseFluency } from './fluency'
import { skillsForRep } from './knowledge'
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CheckFeedback, CommandPalette, GlossaryDrawer, ScreenMemory, WorkspaceSplit } from './Experience'
import { useSessionPreference } from './useSessionPreference'
import { useNavigation } from './useNavigation'
import { preloadEditor } from './editor-loader'
import { readRoute } from './ui-navigation'
import type { View } from './ui-navigation'
import { ProjectEditor } from './ProjectEditor'
import { getActiveProfile } from './local-store'
import { startCheckRun } from './check-run'
import type { TestResult } from './runner.types'
import { reps } from './rep'
import type { Rep } from './rep'
import { paths } from './path'
import { PathsPage } from './PathsPage'
import { buildTrail } from './trail-map'
import { JournalTabs } from './Journal'
import { PageHeader } from './Layout'
import { foundationsPathId, repCurriculumEvidence } from './curriculum'
import { HomePage } from './HomePage'
import { PracticeCatalog } from './PracticeCatalog'
import { foundations } from './foundations'
import { coreLessons } from './ai-era-reps'
import { TraceViewer } from './TraceViewer'
import { Button } from './Button'
import { useReviewContent } from './useReviewContent'
import { attemptStatus, getPracticePlan, nextRepInPath } from './practice'
import type { LearnerStart } from './learning'
import { mergeHistory, parseBackup } from './portability'
import type { Backup } from './portability'
import { flushStorage, isServerReady, localStore, retryStorage, storageIssue } from './local-store'
import { ProgressPage } from './ProgressPage'
import './design.css'
import './motion.css'
import './trail.css'
import { StepIndicator } from './StepIndicator'
import { PageLoading, PreviewLoading } from './LoadingStates'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { statusTone } from './ui-status'
import { repLevelLabel } from './rep-levels.ts'
import { revealElement } from './ui-motion'

const repIds = reps.map(rep => rep.id)
const FirstRepWalkthrough = lazy(() => import('./FirstRepWalkthrough').then(module => ({ default: module.FirstRepWalkthrough })).catch(() => ({ default: ({ onDismiss }: { onDismiss: () => void }) => <aside aria-label="First rep walkthrough"><p>The guide could not load. Regular practice is available.</p><button type="button" className="text-button" onClick={onDismiss}>Skip walkthrough</button></aside> })))
const LearningHub = lazy(() => import('./LearningHub').then(module => ({ default: module.LearningHub })).catch(() => ({ default: () => <main className="learning-hub"><h1>Learning tools could not load</h1><p>Reload to try again. Your saved work is kept.</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload app</button></main> })))
const FrontendPreview = lazy(() => import('./FrontendPreview').catch(() => ({ default: () => <section className="panel frontend-preview" role="alert"><p>The preview could not load. Reload to try again; your draft will be kept.</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload app</button></section> })))
const storageKey = (repId: string) => `code-reps:attempt:${repId}:v1`
const historyKey = 'code-reps:history:v1'
const learnerStartKey = 'code-reps:learner-start:v1'

type Difficulty = 'none' | 'wording' | 'approach' | 'typescript' | 'edge-cases'
type Confidence = 'need-practice' | 'getting-there' | 'confident'
type Attempt = { plan: string; code: string; explanation: string; hintCount: number; difficulty?: Difficulty; confidence?: Confidence; completedAt?: string }
type AttemptRecord = Attempt & { id: string; repId: string; completedAt: string }
const difficultyLabels: Record<Difficulty, string> = { none: 'Nothing in particular', wording: 'Understanding the wording', approach: 'Finding an approach', typescript: 'Writing TypeScript', 'edge-cases': 'Handling edge cases' }
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

// UI-only renders reuse the same learner summary; work changes invalidate it.
function usePracticeOverview(repId: string, attempt: Attempt, history: AttemptRecord[], learnerStart: LearnerStart | null, now: number, goalPathId: string) {
  const drafts = useMemo(() => Object.fromEntries(reps.map(item => [item.id, item.id === repId ? attempt : readAttempt(item)])), [repId, attempt])
  const practicePlan = useMemo(() => getPracticePlan(drafts, history, learnerStart, repId, now, goalPathId), [drafts, history, learnerStart, repId, now, goalPathId])
  return { drafts, practicePlan }
}

function App({ profileName = 'My learning', onManageProfiles }: { profileName?: string; onManageProfiles?: () => void }) {
  const fluency = useFluency()
  const sessions = usePracticeSessions()
  const [endedSession, setEndedSession] = useState<PracticeSession | undefined>()
  const [recordedAttempt, setRecordedAttempt] = useState<PortableRecord | null>(null)
  const recordedAttemptRef = useRef<HTMLDivElement>(null)
  const recordedAttemptOpener = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => { if (recordedAttempt) { recordedAttemptRef.current?.focus(); recordedAttemptRef.current?.scrollIntoView({ block: 'start' }) } }, [recordedAttempt])
  function setHubTab(tab: HubTab) { setView(tab) }
  const [knowledgeSkill, setKnowledgeSkill] = useSessionPreference<string>('knowledge-skill', 'values')
  function openKnowledge(id: string) { setKnowledgeSkill(id); setView('knowledge') }

  function setView(next: View, id?: string) { if (next !== 'workspace') setEditorFocusRequest(0); navigate(next, next === 'workspace' ? id ?? repId : undefined) }
  const [draftQueue,setDraftQueue]=useSessionPreference<'short' | 'all'>('home-drafts','short')
  const [reviewQueue,setReviewQueue]=useSessionPreference<'short' | 'all'>('home-reviews','short')
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
  const [checksOpen, setChecksOpen] = useState(false)
  const workspaceRef = useRef<HTMLElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const tabsRef = useRef<HTMLDivElement | null>(null)
  const [editorFocusRequest, setEditorFocusRequest] = useState(0)
  const [splitWidth, setSplitWidth] = useState(() => { try { return Math.max(25, Math.min(60, Number(localStore.getItem('code-reps:split-width')) || 40)) } catch { return 40 } })
  function resizeSplit(value: number) { setSplitWidth(value) }
  function saveSplit(value: number) { try { localStore.setItem('code-reps:split-width', String(value)) } catch { /* Layout preference is optional. */ } }
  const sectionRequest = useRef(0)
  function revealSection(id: string) {
    const request = ++sectionRequest.current
    if (id === 'checks-section') setChecksOpen(true)
    const pane = id === 'solution-section' || id === 'checks-section' ? 'workspace' : 'task'
    setMobileTab(pane)
    setActiveStep(({ 'brief-section': 'understand', 'plan-section': 'plan', 'solution-section': 'solve', 'checks-section': 'solve', 'explain-section': 'explain', 'review-section': 'review' } as Record<string, string>)[id] ?? 'solve')
    if (pane === 'task') setFocusMode(false)
    requestAnimationFrame(() => {
      if (request !== sectionRequest.current) return
      const target = document.getElementById(id)
      if (matchMedia('(min-width: 901px)').matches) {
        const task = target?.closest<HTMLElement>('.task-column')
        if (task && target) task.scrollTo({ top: task.scrollTop + target.getBoundingClientRect().top - task.getBoundingClientRect().top, behavior: 'instant' })
      } else target?.scrollIntoView({ block: 'start', behavior: 'instant' })
      target?.focus({ preventScroll: true })
    })
  }
  const [catalogQuery, setCatalogQuery] = useSessionPreference<string>('catalogQuery', '')
  const [pathId, setPathId] = useSessionPreference<(typeof paths)[number]['id']>('path', 'typescript')
  const [pathPicker, setPathPicker] = useSessionPreference<'open' | 'closed'>('path-picker', matchMedia('(min-width: 901px)').matches ? 'open' : 'closed')
  const [learnerStart, setLearnerStart] = useState<LearnerStart | null>(() => {
    try { const saved = localStore.getItem(learnerStartKey); return saved === 'new' || saved === 'returning' ? saved : null }
    catch { return null }
  })
  const [mobileTab, setMobileTab] = useSessionPreference<'task' | 'workspace'>('workspace-tab', 'task')
  const [walkthrough, setWalkthrough] = useSessionPreference<'new' | 'active' | 'dismissed'>('first-rep-walkthrough', 'new')
  const [activeStep, setActiveStep] = useSessionPreference<string>('practice-step', mobileTab === 'task' ? 'understand' : 'solve')
  const [history, setHistory] = useState(readHistory)
  const [repId, setRepId] = useState(() => {
    const bookmarked = readRoute(location.hash, repIds).repId
    if (bookmarked) return bookmarked
    try { return reps.find((item) => item.id === localStore.getItem('code-reps:selected-rep'))?.id ?? reps[0].id }
    catch { return reps[0].id }
  })
  const rep = reps.find((item) => item.id === repId) ?? reps[0]
  const [attempt, setAttempt] = useState(() => readAttempt(rep))
  const latestWork = useRef({ repId, attempt })
  useLayoutEffect(() => { latestWork.current = { repId, attempt } }, [repId, attempt])
  const completing = useRef(false)
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
    const saveDraft = (event?: Event) => {
      try { localStore.setItem(storageKey(repId), JSON.stringify(attempt)) }
      catch { event?.preventDefault(); setSaveState('Could not save on this device; download a backup') }
    }
    const saveWhenHidden = () => { if (document.visibilityState === 'hidden') saveDraft() }
    window.addEventListener('code-reps-save-current', saveDraft)
    window.addEventListener('pagehide', saveDraft)
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => { window.removeEventListener('code-reps-save-current', saveDraft); window.removeEventListener('pagehide', saveDraft); document.removeEventListener('visibilitychange', saveWhenHidden) }
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
    setActiveStep('understand')
    setRepId(nextId)
    setAttempt(readAttempt(nextRep))
    setResults(null)
    setRunError('')
    setRunNotice('')
  }

  const { route, navigate } = useNavigation(repIds, next => { if (next.view === 'workspace' && next.repId) selectRep(next.repId) })
  const view = route.view

  useEffect(() => {
    if (view === 'workspace') revealElement(document.querySelector('.task-column section:not([hidden])'), 'none')
  }, [activeStep, view, repId])
  useEffect(() => { revealElement(document.querySelector('.task-hints')) }, [attempt.hintCount])
  useEffect(() => {
    revealElement(document.querySelector('.result-summary, .result-running, .error-message, .empty-results'))
  }, [results, running, runError, runNotice])

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
    setEndedSession(undefined)
    setChecksOpen(false)
    selectRep(nextId)
    setActiveStep('understand')
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
      const backup: Backup = { format: 'code-reps-backup', version: 1, exportedAt: new Date().toISOString(), learnerStart, history, drafts, learning: fluency.state, sessions: sessions.backup() }
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
      await sessions.flush()
      sessions.verifyRevision()
      const backup = parseBackup(await file.text(), new Set(reps.map((item) => item.id)))
      const merged = mergeHistory(history, backup.history).sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
      const updates: [string, string][] = [[historyKey, JSON.stringify(merged)]]
      for (const [id, draft] of Object.entries(backup.drafts)) {
        const key = storageKey(id)
        if (localStore.getItem(key) === null) updates.push([key, JSON.stringify(draft)])
      }
      if (!learnerStart && backup.learnerStart) updates.push([learnerStartKey, backup.learnerStart])
      if (backup.learning) {
        const current = fluency.state
        const incoming = backup.learning
        updates.push(['code-reps:fluency:v1', JSON.stringify(parseFluency({ ...incoming, ...current,
          answers: { ...incoming.answers, ...current.answers }, reviews: { ...incoming.reviews, ...current.reviews },
          notes: mergeHistory(current.notes, incoming.notes), rounds: mergeHistory(current.rounds, incoming.rounds),
          bookmarks: [...new Set([...current.bookmarks, ...incoming.bookmarks])],
        }))])
      }
      sessions.verifyRevision()
      if (backup.sessions || sessions.state.records.length) await sessions.importRecords(backup.sessions ?? emptySessions(), Object.fromEntries(updates))
      else localStore.setEntries(Object.fromEntries(updates))
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
    setActiveStep('solve')
    setChecksOpen(true)
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

  const { drafts, practicePlan } = usePracticeOverview(repId, attempt, history, learnerStart, now, fluency.state.goal.pathId)
  const repStatus = (item: Rep) => attemptStatus(item.id, drafts[item.id])
  const currentStatus = repStatus(rep)
  const currentLesson = [...foundations, ...coreLessons].find(lesson => lesson.repId === rep.id)
  const journeyStates = practicePlan.progress
  const review = useReviewContent()
  const reflectionGuide = review.status === 'ready' ? review.content.reflectionGuides[rep.id] : undefined
  const depth = review.status === 'ready' ? review.content.repDepth[rep.id] : undefined
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && reps.find(item => item.id === recommendation.repId)
  const actionLabel = (mode: string) => mode === 'resume' ? 'Continue rep' : mode === 'review' ? 'Start review' : mode === 'retry' ? 'Retry without hints' : 'Start rep'
  const openPracticeAction = (action: { repId: string; mode: string }) => action.mode === 'review' || action.mode === 'retry' ? openReview(action.repId) : openRep(action.repId)
  const completedPathIds = new Set(history.map(record => record.repId))
  const recallReady = (id: string) => !journeyStates.some(state => state.journey.recall === id && !state.recallDue && !state.retained)
  // Due reviews and hint-free retries outrank path order; recall reps wait until they are due.
  const pathNextRep = recommendation?.mode === 'review' || recommendation?.mode === 'retry' ? undefined : reps.find(item => item.id === nextRepInPath(fluency.state.goal.pathId, repId, id => completedPathIds.has(id) || !recallReady(id)))
  const trailInput = (id: string) => ({ completed: (repId: string) => completedPathIds.has(repId), inProgress: (repId: string) => repStatus(reps.find(item => item.id === repId)!) === 'In progress', recallReady, lessonChecked: (skillId: string) => Object.keys(fluency.state.answers).some(key => key.startsWith(`${skillId}:`)), skipStages: learnerStart === 'returning' && id === foundationsPathId ? 1 : 0 })
  const goalTrail = buildTrail(fluency.state.goal.pathId, trailInput(fluency.state.goal.pathId))
  const browsedTrail = buildTrail(pathId, trailInput(pathId))
  const trailEvidence = (id: string) => repCurriculumEvidence(id, journeyStates)
  const journalTabs = <JournalTabs view={view} onNavigate={setView} />
  const glossary = [...new Map(reps.flatMap((item) => item.vocabulary.map((entry) => [entry.term.toLowerCase(), entry] as const))).values()]
    .sort((a, b) => a.term.localeCompare(b.term))
  const categories = [...new Set(reps.map(item => item.category))].sort()
  const dueIds = new Set(practicePlan.due.map(item => item.repId))
  const visibleReps = reps.filter(item => `${item.title} ${item.category} ${item.format ?? 'algorithm'}`.toLowerCase().includes(catalogQuery.trim().toLowerCase()) && (!catalogSkill || item.category === catalogSkill) && (!catalogFormat || (item.format ?? 'algorithm') === catalogFormat) && (!catalogStatus || (catalogStatus === 'review' ? dueIds.has(item.id) : repStatus(item) === catalogStatus)))
  const visibleHistory = history.filter(record => { const item = reps.find(rep => rep.id === record.repId); return (!historyQuery || `${item?.title ?? ''} ${item?.category ?? ''}`.toLowerCase().includes(historyQuery.toLowerCase())) && (!historySkill || item?.category === historySkill) && (!historyDifficulty || record.difficulty === historyDifficulty) && (!historyDate || new Date(record.completedAt).toLocaleDateString('en-CA') === new Date(`${historyDate}T12:00:00`).toLocaleDateString('en-CA')) })
  const commands = [
    ...(['home', 'paths', 'catalog', 'learn', 'knowledge', 'notebook', 'plan', 'projects', 'interview', 'assessment', 'progress', 'history', 'sessions'] as View[]).map(page => ({ label: `Go to ${page === 'catalog' ? 'practice library' : page === 'learn' ? 'quick lessons' : page === 'home' ? 'Home: your trail' : page === 'paths' ? 'all tracks' : page === 'plan' ? 'this week' : page}`, run: () => setView(page) })),
    { label: 'Open glossary', run: () => setGlossaryOpen(true) },
    ...(view === 'workspace' ? [
      { label: 'Run checks', shortcut: 'Ctrl / ⌘ Enter', run: runChecks },
      { label: 'Focus editor', run: () => { setFocusMode(true); revealSection('solution-section'); setEditorFocusRequest(current => current + 1) } },
      { label: focusMode ? 'Leave focus mode' : 'Enter focus mode', run: () => { setFocusMode(!focusMode); setMobileTab('workspace'); setActiveStep('solve') } },
      { label: 'Read brief and hints', run: () => revealSection('brief-section') },
      { label: 'View check results', run: () => revealSection('checks-section') },
      { label: 'Explain solution', run: () => revealSection('explain-section') },
    ] : []),
  ]

  async function completeRep() {
    if (completing.current || !canFinish || !attempt.difficulty || !attempt.confidence || attempt.completedAt) return
    completing.current = true
    const completedAt = new Date().toISOString()
    const completed = { ...attempt, completedAt }
    const record = { ...completed, id: crypto.randomUUID(), repId }
    const nextHistory = [record, ...history]
    try {
      const entries = () => ({ [historyKey]: JSON.stringify(nextHistory), [storageKey(repId)]: JSON.stringify(latestWork.current.repId === repId ? latestWork.current.attempt === attempt ? completed : latestWork.current.attempt : readAttempt(rep)) })
      if (sessions.activeId) await sessions.recordCompletion(record.id, repId, attempt.hintCount, entries)
      else localStore.setEntries(entries())
      setHistory(nextHistory)
      setAttempt(current => current === attempt ? completed : current)
      setSaveState('Saving…')
    } catch { setSaveState('Could not save on this device') } finally { completing.current = false }
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
    setActiveStep('understand')
    setSaveState('Saving…')
  }

  async function startSession(id = repId, mode = 'resume') {
    const item = reps.find(rep => rep.id === id)!
    const source = id === repId ? attempt : readAttempt(item)
    const fresh = mode === 'review' || mode === 'retry'
    const next = fresh ? { plan: '', code: item.starter, explanation: '', hintCount: 0 } : source
    const saved = await sessions.start(id, next.hintCount, () => {
      if (latestWork.current.repId !== repId || latestWork.current.attempt !== attempt) throw new Error('Your draft changed while starting practice. Try Start practice again; your work is kept.')
      return { [storageKey(repId)]: JSON.stringify(attempt), [storageKey(id)]: JSON.stringify(next) }
    })
    if (saved) {
      if (fresh) { stopRun(); setRepId(id); setAttempt(next); setResults(null); setRunError(''); setRunNotice('') }
      openRep(id)
    }
  }
  async function endSession() {
    const active = sessions.state.records.find(record => record.id === sessions.activeId && record.repId === repId)
    if (!active) return
    const ended = await sessions.end(active.id, attempt.hintCount, attempt.difficulty, () => ({ [storageKey(repId)]: JSON.stringify(latestWork.current.repId === repId ? latestWork.current.attempt : readAttempt(rep)) }))
    if (ended) setEndedSession(ended)
  }
  function viewRecordedAttempt(record: PortableRecord) { recordedAttemptOpener.current = document.activeElement as HTMLElement; setRecordedAttempt(record) }
  const activeSession = sessions.state.records.find(record => record.id === sessions.activeId && record.repId === repId)
  useEffect(() => { if (activeSession) sessions.observeHints(activeSession.id, attempt.hintCount) })

  const startingPoint = <section className="starting-point" aria-labelledby="starting-point-title"><div><span className="home-label">Your starting point</span><h2 id="starting-point-title">Where are you starting?</h2><p>This only changes your next suggested rep. You can open any rep at any time.</p></div><div className="starting-options"><button type="button" aria-pressed={learnerStart === 'new'} onClick={() => chooseStart('new')}><strong>New to coding</strong><span>Start with TypeScript building blocks.</span></button><button type="button" aria-pressed={learnerStart === 'returning'} onClick={() => chooseStart('returning')}><strong>Returning to coding</strong><span>Start with guided problem solving.</span></button></div></section>
  const practiceSteps = [
    { id: 'understand', label: 'Understand', section: 'brief-section' },
    { id: 'plan', label: 'Plan', section: 'plan-section' },
    { id: 'solve', label: 'Solve', section: 'solution-section' },
    { id: 'explain', label: 'Explain', section: 'explain-section' },
    { id: 'review', label: 'Review', section: 'review-section' },
  ] as const

  return <div className="app-shell">
    <AppNavigation view={view} profileName={profileName} saveState={saveState} onNavigate={setView} onManageProfiles={onManageProfiles} onCommands={() => setCommandsOpen(true)} />
    {saveState !== 'Saving…' && !saveState.startsWith('Saved') && <div className="storage-recovery" role="status"><p>{saveState}</p><button type="button" onClick={() => { void retrySaving() }}>Retry saving</button><button className="reset-button" type="button" onClick={exportData}>Download backup</button></div>}
    {(sessions.error || (sessions.message && (view !== 'workspace' || !['Saved in browser', 'Saved on this laptop'].includes(sessions.message)))) && <div className="session-save" role="status"><p>{sessions.error || sessions.message}</p>{(sessions.error || sessions.message.includes('waiting') || sessions.message.startsWith('Session records reloaded')) && <><button className="reset-button" type="button" onClick={() => { void sessions.retry() }}>Retry session save</button><button className="reset-button" type="button" onClick={sessions.reload}>Reload session records</button><button className="reset-button" type="button" onClick={exportData}>Download recovery backup</button></>}</div>}
    {recordedAttempt && <div ref={recordedAttemptRef} tabIndex={-1} className="recorded-attempt" role="region" aria-label="Recorded attempt"><h2>Recorded attempt: {reps.find(rep => rep.id === recordedAttempt.repId)?.title}</h2><p>{new Date(recordedAttempt.completedAt).toLocaleString()}. Viewing this snapshot does not replace your current draft.</p><pre>{recordedAttempt.code}</pre><p>Plan: {recordedAttempt.plan}</p><p>Explanation: {recordedAttempt.explanation}</p><button className="reset-button" type="button" onClick={() => { setRecordedAttempt(null); recordedAttemptOpener.current?.focus() }}>Close recorded attempt</button></div>}
    <ScreenMemory key={`${view}:${view === 'workspace' ? repId : ''}`} screenKey={`${view}:${view === 'workspace' ? repId : ''}`}>
    {(['knowledge', 'notebook', 'plan', 'assessment', 'projects', 'interview'] as View[]).includes(view) ? <Suspense fallback={<PageLoading journalTabs={journalTabs} page={view as HubTab} notebookHasDraft={Boolean(fluency.state.noteDraft)} notebookHasEntries={fluency.state.notes.length > 0} />}><LearningHub journalTabs={journalTabs} onQuickLessons={() => setView('learn')} tab={view as HubTab} setTab={setHubTab} state={fluency.state} update={fluency.update} error={fluency.error} history={history} openRep={openRep} reviewRep={openReview} skillId={knowledgeSkill} onSkill={setKnowledgeSkill} candidates={[...practicePlan.due, ...practicePlan.unfinished, ...(practicePlan.next ? [practicePlan.next] : []), ...((paths.find(p => p.id === fluency.state.goal.pathId) ?? paths[0]).stages.flatMap(stage => stage.repIds).filter(id => !history.some(a => a.repId === id)).map(repId => ({ repId, reason: 'Build toward your selected path.' })))]} /></Suspense> : view === 'sessions' ? <PracticeHistory journalTabs={journalTabs} hasDraft={id => localStore.getItem(storageKey(id)) !== null} records={sessions.state.records} activeId={sessions.activeId} reflection={sessions.reflection} setReflection={sessions.setReflection} remove={id => { void sessions.remove(id) }} resume={id => { void startSession(id) }} openDraft={openRep} openAttempt={viewRecordedAttempt} history={history} /> : view === 'home' ? <HomePage walkthroughSeen={walkthrough !== 'new'} launchWalkthrough={() => { setWalkthrough('active'); openRep('declare-variables') }} sessionBusy={sessions.busy} startPractice={action => { void startSession(action.repId, action.mode) }} unfinishedSessions={sessions.state.records.filter(record => !record.endedAt)} resumeSession={id => { void startSession(id) }} onPracticeHistory={() => setView('sessions')} goalPathId={fluency.state.goal.pathId} onPath={id => { setPathId(id); setView('paths') }} learnerStart={learnerStart} startingPoint={startingPoint} practicePlan={practicePlan} draftQueue={draftQueue} setDraftQueue={setDraftQueue} reviewQueue={reviewQueue} setReviewQueue={setReviewQueue} repStatus={repStatus} openPracticeAction={openPracticeAction} actionLabel={actionLabel} onProgress={() => setView('progress')} onPlan={() => setView('plan')} trail={goalTrail} evidence={trailEvidence} openRep={openRep} openLesson={openKnowledge} /> : view === 'catalog' ? <PracticeCatalog filters={{ query: catalogQuery, skill: catalogSkill, format: catalogFormat, status: catalogStatus }} onFilter={(field, value) => ({ query: setCatalogQuery, skill: setCatalogSkill, format: setCatalogFormat, status: setCatalogStatus })[field](value)} clearFilters={() => { setCatalogQuery(''); setCatalogSkill(''); setCatalogFormat(''); setCatalogStatus('') }} categories={categories} visibleReps={visibleReps} dueIds={dueIds} repStatus={repStatus} openRep={openRep} /> : view === 'paths' ? <PathsPage goalPathId={fluency.state.goal.pathId} setGoalPath={id => fluency.update({ ...fluency.state, goal: { ...fluency.state.goal, pathId: id } })} goalError={fluency.error} pathId={pathId} setPathId={setPathId} pathPicker={pathPicker} setPathPicker={setPathPicker} learnerStart={learnerStart} completedPathIds={completedPathIds} trail={browsedTrail} evidence={trailEvidence} openRep={openRep} openLesson={openKnowledge} /> : view === 'progress' ? <ProgressPage profileName={profileName} history={history} now={now} onManageProfiles={onManageProfiles} onOpenPath={id => { setPathId(id); setView('paths') }} progress={journeyStates} recommendation={recommendation && recommendedRep ? { title: recommendedRep.title, reason: recommendation.reason, label: actionLabel(recommendation.mode), open: () => openPracticeAction(recommendation) } : undefined} dueReviews={practicePlan.due.map(action => ({ title: reps.find(item => item.id === action.repId)!.title, reason: action.reason, open: () => openPracticeAction(action), label: actionLabel(action.mode), repId: action.repId }))} onOpenRep={openRep} onReviewRep={openReview} onExport={exportData} onImport={(file) => { void importData(file) }} transferMessage={transferMessage} serverReady={isServerReady()} /> : view === 'learn' ? <main className="learn-main"><PageHeader eyebrow="Lessons" title="Quick lessons" description="Short introductions before your first rep. Full lessons have interactive predictions and learning tools." actions={<button type="button" className="text-button" onClick={() => setView('knowledge')}>Browse knowledge</button>} /><details className="learn-section" open><summary><h2 id="foundations-heading">TypeScript foundations</h2></summary><p className="section-intro">Start here if variables, types, and objects are new to you. Read an example, then try its short rep.</p><div className="foundation-list">{foundations.map((lesson, index) => <details className="foundation-lesson" key={lesson.repId}><summary><span className="foundation-number">{String(index + 1).padStart(2, '0')}</span><h3>{lesson.title}</h3><span className="disclosure-arrow" aria-hidden="true" /></summary><div className="foundation-content"><p>{lesson.explanation}</p><pre><code>{lesson.example}</code></pre><p className="foundation-tip">{lesson.tip}</p><button className="text-button" type="button" onClick={() => openRep(lesson.repId)}>Try the rep</button></div></details>)}</div></details><details className="learn-section"><summary><h2 id="core-lessons-heading">AI-era, frontend, backend, and interview core</h2></summary><p className="section-intro">Read a concept, try a focused rep, and explain how you checked your result.</p><div className="foundation-list">{coreLessons.map((lesson, index) => <details className="foundation-lesson" key={lesson.repId}><summary><span className="foundation-number">{String(index + 1).padStart(2, '0')}</span><h3>{lesson.title}</h3><span className="disclosure-arrow" aria-hidden="true" /></summary><div className="foundation-content"><p>{lesson.explanation}</p><pre><code>{lesson.example}</code></pre><p className="foundation-tip">{lesson.tip}</p><button className="text-button" type="button" onClick={() => openRep(lesson.repId)}>Try the rep</button></div></details>)}</div></details><details className="learn-section"><summary><h2>Problem-solving skills</h2></summary><div className="skill-list">{['Arrays', 'Maps & sets', 'Strings', 'Stacks'].map((skill) => { const related = reps.filter((item) => skill === 'Arrays' ? item.category.includes('Arrays') : skill === 'Maps & sets' ? /maps|sets/i.test(item.category) : item.category.includes(skill)); return <article className="skill-card" key={skill}><h3>{skill}</h3><p>{skill === 'Arrays' ? 'Visit values in order, count them, and decide what to keep.' : skill === 'Maps & sets' ? 'Use keys for counts and sets to remember what you have seen.' : skill === 'Strings' ? 'Work through text one character or word at a time.' : 'Track the most recent unmatched opening item.'}</p><span>{related.length} {related.length === 1 ? 'rep' : 'reps'}</span><button className="text-button" type="button" onClick={() => openRep(related[0].id)}>Try {related[0].title}</button></article> })}</div></details><details className="learn-section"><summary><h2>Glossary</h2></summary><dl className="glossary-list">{glossary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl></details></main> : view === 'history' ? <main className="history-main"><PageHeader eyebrow="Journal" title="Attempt history" description="Completed reps stay here so you can compare your thinking over time." actions={journalTabs} /><div className="filter-bar" aria-label="History filters"><label>Find an attempt<Input type="search" value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Rep or skill…" /></label><label>Skill<Select aria-label="Skill" value={historySkill} onChange={event => setHistorySkill(event.target.value)}><option value="">All skills</option>{categories.map(category => <option key={category}>{category}</option>)}</Select></label><label>Difficulty<Select aria-label="Difficulty" value={historyDifficulty} onChange={event => setHistoryDifficulty(event.target.value)}><option value="">Any difficulty</option>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label>Date<DateInput value={historyDate} onValueChange={setHistoryDate} /></label><button className="text-button" type="button" onClick={() => { setHistoryQuery(''); setHistorySkill(''); setHistoryDifficulty(''); setHistoryDate('') }}>Clear filters</button></div><p className="utility-note" aria-live="polite">{visibleHistory.length} matching attempts</p>{history.length === 0 ? <div className="history-empty">No completed attempts yet. Finish a rep to save your first one here.</div> : <ol className="history-list">{visibleHistory.map((record) => { const item = reps.find((entry) => entry.id === record.repId); const previous = history.filter(entry => entry.repId === record.repId && Date.parse(entry.completedAt) < Date.parse(record.completedAt)).sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0]; return <li key={record.id} data-attempt-id={record.id}><div><strong>{item?.title ?? 'Unknown rep'}</strong><span>{new Date(record.completedAt).toLocaleString()} · {record.hintCount} {record.hintCount === 1 ? 'hint' : 'hints'} used</span></div><details><summary>Review attempt</summary>{record.difficulty && <p className="reflection-detail">Difficulty: {difficultyLabels[record.difficulty]}</p>}{record.confidence && <p className="reflection-detail">Confidence: {confidenceLabels[record.confidence]}</p>}{previous && <section className="attempt-compare"><strong>Since your previous attempt</strong><p>Hints: {previous.hintCount} {record.hintCount}. Compare the plans and explanations below; the app does not grade their quality.</p><div className="attempt-comparison"><div><h4>Previous · {new Date(previous.completedAt).toLocaleDateString()}</h4><h5>Plan</h5><p>{previous.plan}</p><h5>Code</h5><pre><code>{previous.code}</code></pre><h5>Explanation</h5><p>{previous.explanation}</p></div><div><h4>This attempt · {new Date(record.completedAt).toLocaleDateString()}</h4><h5>Plan</h5><p>{record.plan}</p><h5>Code</h5><pre><code>{record.code}</code></pre><h5>Explanation</h5><p>{record.explanation}</p></div></div></section>}<h3>Plan</h3><p>{record.plan}</p><h3>Code</h3><pre><code>{record.code}</code></pre><h3>Explanation</h3><p>{record.explanation}</p></details>{item && <button className="text-button" type="button" onClick={() => openRep(item.id)}>Open rep</button>}</li> })}</ol>}{history.length > 0 && !visibleHistory.length && <p className="history-empty">No attempts match these filters. Try another date or clear filters.</p>}</main> : <main ref={workspaceRef} className={`practice-main ${focusMode ? 'focus-mode' : ''}`} data-step={activeStep} id="main-content" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runChecks() } }}>
      <header className="workspace-header">
        <div className="workspace-title"><button type="button" className="breadcrumb-link" onClick={() => setView('catalog')}><Icon name="left" />Library</button><h1 tabIndex={-1}>{rep.title}</h1>{repLevelLabel(rep.id) && <StatusChip>{repLevelLabel(rep.id)}</StatusChip>}<StatusChip tone={statusTone(currentStatus)}>{currentStatus}</StatusChip><span className="workspace-category">{rep.category}</span></div>
        <PracticeSessionPanel key={activeSession?.id ?? endedSession?.id ?? repId} active={activeSession} reflection={activeSession ? sessions.reflection(activeSession.id) : ''} setReflection={value => { if (activeSession) sessions.setReflection(activeSession.id, value) }} busy={sessions.busy} onStart={() => { void startSession() }} onEnd={() => { void endSession() }} explanation={attempt.explanation} ended={endedSession?.repId === repId ? endedSession : undefined} onHome={() => { sessions.pause(); setView('home') }} onAnother={() => { setEndedSession(undefined); setView('home') }} />
        <div className="workspace-actions"><p className="workspace-save-status" role="status">{saveState}</p><button className="reset-button" type="button" onClick={() => setGlossaryOpen(true)}>Glossary</button><details className="workspace-options" onClick={event => { if ((event.target as HTMLElement).closest('button')) event.currentTarget.open = false }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}><summary>Tools</summary><div><button className="reset-button" type="button" onClick={() => { setFocusMode(!focusMode); revealSection('solution-section') }}>{focusMode ? 'Exit focus' : 'Focus mode'}</button><button className="reset-button" type="button" onClick={() => resetDialogRef.current?.showModal()}>Reset rep</button>{skillsForRep(repId).length > 0 && <div className="workspace-knowledge"><span>Related concepts</span>{skillsForRep(repId).slice(0,3).map(skill => <button type="button" key={skill.id} onClick={() => openKnowledge(skill.id)}>{skill.title}</button>)}</div>}</div></details></div>
      </header>
      {fluency.state.rounds.find(r => !r.endedAt && r.repId === repId) && <InterviewStatus round={fluency.state.rounds.find(r => !r.endedAt && r.repId === repId)!} onControls={() => { setHubTab('interview') }} />}
      <div className="workspace-layout" style={{ gridTemplateColumns: focusMode ? 'auto minmax(0, 1fr)' : `minmax(0, ${splitWidth}fr) 12px minmax(0, ${100 - splitWidth}fr)` }}>
        <div className="task-pane">
          <div ref={tabsRef} className="practice-steps" role="navigation" aria-label="Practice steps">
            <StepIndicator active={activeStep} />
            {practiceSteps.map(step => <button key={step.id} type="button" aria-label={step.label} aria-current={activeStep === step.id ? 'step' : undefined} aria-controls={step.section} onClick={() => revealSection(step.section)}><span>{step.label}</span></button>)}
          </div>
        <div id="task-workspace" key={`task-${rep.id}`} className={`task-column ${activeStep !== 'solve' ? 'mobile-active' : ''}`} role="region" aria-label="Task and plan" tabIndex={0}>
          {walkthrough === 'active' && repId === 'declare-variables' && activeStep !== 'solve' && <Suspense fallback={null}><FirstRepWalkthrough step={activeStep} completed={!!attempt.completedAt} onNext={revealSection} onDismiss={() => setWalkthrough('dismissed')} /></Suspense>}
          <section id="brief-section" hidden={activeStep !== 'understand' && activeStep !== 'solve'} tabIndex={-1} className="panel task-panel">{currentLesson && <div className="rep-lesson"><span className="home-label">Before you start</span><h2>{currentLesson.title}</h2><p>{currentLesson.explanation}</p><pre><code>{currentLesson.example}</code></pre><p className="foundation-tip">{currentLesson.tip}</p></div>}<div className="panel-heading"><h2>The brief</h2></div>{rep.context && <p className="rep-context">{rep.context}</p>}<p>{rep.prompt}</p>{rep.acceptanceCriteria && <ul className="acceptance-criteria">{rep.acceptanceCriteria.map(point => <li key={point}>{point}</li>)}</ul>}<div className="example"><div className="example-label">Example</div><code>{rep.example.input}</code><span className="example-arrow"><Icon name="arrow" /></span><code>{rep.example.output}</code></div><p className="task-note">{rep.note}</p><details className="vocab"><summary>Quick vocabulary</summary><div><p>{rep.vocabulary.map((item, index) => <span key={item.term}>{index > 0 && ' ' }<b>{item.term}</b> means {item.meaning}.</span>)}</p></div></details><div className="hint-control"><button className="hint-button" type="button" disabled={attempt.hintCount >= rep.hints.length} onClick={() => { update('hintCount', attempt.hintCount + 1); setMobileTab('task') }}><Icon name="hint" />{attempt.hintCount >= rep.hints.length ? 'All hints revealed' : `Reveal hint ${attempt.hintCount + 1}`}</button><span>{attempt.hintCount} of {rep.hints.length} revealed</span></div>{attempt.hintCount > 0 && <div className="task-hints" aria-live="polite"><div className="hint-heading"><span className="hint-spark"><Icon name="hint" /></span><strong>Hints revealed</strong></div><ol className="hint-list">{rep.hints.slice(0, attempt.hintCount).map((hint) => <li key={hint}>{hint}</li>)}</ol></div>}</section>
          <section id="plan-section" hidden={activeStep !== 'plan'} tabIndex={-1} className="panel plan-panel"><div className="panel-heading"><h2>Plan your approach</h2></div><p>{rep.planPrompt}</p><label className="field-label" htmlFor="plan">Your plan</label><Textarea id="plan" value={attempt.plan} onChange={(event) => update('plan', event.target.value)} placeholder="I'll start by…" rows={5} /><div className="field-foot">A few sentences are enough. This is for your own thinking.</div><button className="text-button plan-to-code" type="button" onClick={() => revealSection('solution-section')}>Go to code<Icon name="arrow" /></button></section>
        <section id="explain-section" hidden={activeStep !== 'explain'} tabIndex={-1} className="panel explain-panel"><div className="explain-intro"><div className="panel-heading"><h2>Explain your thinking</h2></div><p>How does your solution work? Mention the time and space it uses if you can.</p></div><div className="explain-form"><label className="field-label" htmlFor="explanation">Your explanation</label><Textarea id="explanation" value={attempt.explanation} onChange={(event) => update('explanation', event.target.value)} placeholder="My solution works by…" rows={4} />{allPassed && <details className="reflection-guide"><summary>Compare your plan and explanation</summary><p>These prompts support your own review. The app checks code behavior, not the quality of your writing.</p><div className="reflection-guide-columns"><div><strong>Plan</strong><ul>{(reflectionGuide?.plan ?? ['Describe how you will use the inputs.', 'Name an edge case from the task.', 'Explain the steps before coding.']).map((point) => <li key={point}>{point}</li>)}</ul></div><div><strong>Explanation</strong><ul>{(reflectionGuide?.explanation ?? ['Explain why the code handles the example and edge cases.', 'Describe the time and extra space used.']).map((point) => <li key={point}>{point}</li>)}</ul></div></div>{review.status === 'loading' && <p role="status">Loading the authored review…</p>}{review.status === 'error' && <div role="alert"><p>The authored review could not load. Your draft is unchanged.</p><Button type="button" onClick={review.retry}>Retry</Button></div>}{reflectionGuide && <div className="reflection-example"><strong>Example to compare with</strong><p>{reflectionGuide.example}</p></div>}{depth && <div className="reflection-example"><h3>Why this works</h3><p>{depth.reasoning}</p><h3>Trace a boundary case</h3><p>{depth.trace}</p>{depth.traceSteps && <TraceViewer key={rep.id} trace={depth.traceSteps} />}<h3>Compare approaches</h3><p>{depth.alternative}</p><h3>A tempting mistake</h3><p>{depth.counterexample}</p><h3>Try a variation</h3><p>{depth.transfer}</p><p>Predict and explain the variation in your notes before coding. It is an optional self-reviewed task; the current checks assess the original contract.</p></div>}</details>}<button className="primary-button step-next" type="button" onClick={() => revealSection('review-section')}>Review attempt<Icon name="arrow" /></button></div></section>
          <section id="review-section" hidden={activeStep !== 'review'} tabIndex={-1} className="reflection-section"><h3>Review this attempt</h3><p>Your plan, explanation, and confidence are self-reviewed. Checks verify code behavior.</p><div className="reflection-fields"><div><label className="field-label" htmlFor="difficulty">What was hardest?</label><Select id="difficulty" value={attempt.difficulty ?? ''} onChange={(event) => update('difficulty', event.target.value as Difficulty)}><option value="">Choose one</option>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><div><label className="field-label" htmlFor="confidence">How confident do you feel?</label><Select id="confidence" value={attempt.confidence ?? ''} onChange={(event) => update('confidence', event.target.value as Confidence)}><option value="">Choose one</option>{Object.entries(confidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div></div><ul className="completion-checklist" aria-label="Completion requirements">{[['Plan', !!attempt.plan.trim()], ['Checks', !!allPassed], ['Explanation', !!attempt.explanation.trim()], ['Reflection', !!attempt.difficulty && !!attempt.confidence]].map(([label, done]) => <li key={String(label)} className={done ? 'done' : ''}><Icon name={done ? 'check' : 'circle'} /> {label} {done ? label === 'Checks' ? 'passed' : 'added' : 'needed'}</li>)}</ul><div className="explain-actions"><div>{!attempt.completedAt && (!attempt.plan.trim() || !allPassed || !attempt.explanation.trim()) && <button type="button" className="text-button missing-work" onClick={() => revealSection(!attempt.plan.trim() ? 'plan-section' : !allPassed ? 'checks-section' : 'explain-section')}>{!attempt.plan.trim() ? 'Write your plan' : !allPassed ? 'Check your code' : 'Add your explanation'}</button>}{!canFinish && <p className="finish-note">Add the missing work before completing this rep.</p>}{canFinish && (!attempt.difficulty || !attempt.confidence) && !attempt.completedAt && <p className="finish-note">Choose a difficulty and confidence level to finish.</p>}{attempt.completedAt && <p className="finish-note success">Completed and saved on this device.</p>}</div><button className="finish-button" type="button" disabled={!canFinish || !attempt.difficulty || !attempt.confidence || !!attempt.completedAt} onClick={completeRep}>{attempt.completedAt ? <><Icon name="check" />Rep completed</> : 'Complete rep'}</button></div>{attempt.completedAt && <section className="completion-panel" aria-labelledby="completion-title"><span className="home-label">Attempt recorded</span><h3 id="completion-title">You finished {rep.title}.</h3><p>Your code, plan, explanation, and reflection are recorded in History. {attempt.hintCount ? `You used ${attempt.hintCount} hint(s); this attempt supports learning.` : 'You completed this attempt without hints.'}</p>{journeyStates.filter(state => [state.journey.guided, state.journey.independent, state.journey.recall].includes(rep.id)).map(state => <p key={state.journey.id}>{state.recallAt ? state.recallDue ? 'A fresh recall problem is ready.' : `Recall becomes available ${new Date(state.recallAt).toLocaleDateString()}.` : 'Complete independent practice to schedule later recall.'}</p>)}<p>{pathNextRep ? 'Next in your path, in the order the trail shows.' : recommendation?.reason}</p><div>{pathNextRep ? <button type="button" className="primary-button" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openRep(pathNextRep.id)}>Next rep: {pathNextRep.title}</button> : recommendation && recommendedRep && <button type="button" className="primary-button" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openPracticeAction(recommendation)}>{actionLabel(recommendation.mode)}: {recommendedRep.title}</button>}<button type="button" className="text-button" onClick={() => setView('home')}>Done for today</button></div></section>}{attempt.completedAt && <button className="text-button retry-button" type="button" onClick={startNewAttempt}>Start a fresh attempt</button>}</section>
        </div></div>
        <WorkspaceSplit value={splitWidth} onChange={resizeSplit} onCommit={saveSplit} />
        <div id="code-workspace" key={`code-${rep.id}`} className={`code-column ${activeStep === 'solve' ? 'mobile-active' : ''}`} role="region" aria-label="Code and preview" tabIndex={0}>
          <section id="solution-section" tabIndex={-1} className="panel code-panel">{walkthrough === 'active' && repId === 'declare-variables' && activeStep === 'solve' && <Suspense fallback={null}><FirstRepWalkthrough step={activeStep} completed={!!attempt.completedAt} onNext={revealSection} onDismiss={() => setWalkthrough('dismissed')} /></Suspense>}<div className="editor-top"><span className="file-tab"><span className="ts-icon">TS</span> solution.ts</span><span className="editor-hint">Ctrl / ⌘ Enter to run</span></div><div className="editor-wrap"><ProjectEditor key={rep.id} focusRequest={editorFocusRequest} height="100%" path={`code-reps://${getActiveProfile()}/${rep.id}/solution.ts`} language="typescript" value={attempt.code} onChange={(value) => update('code', value ?? '')} onRunChecks={runChecks} options={{ ariaLabel: `TypeScript solution for ${rep.title}. Press Control or Command Enter to run checks. Tab moves focus out of the editor.`, tabFocusMode: true, minimap: { enabled: false }, fontFamily: 'Maple Mono, monospace', fontLigatures: true, fontSize: 14, lineHeight: 24, padding: { top: 18 }, scrollBeyondLastLine: false, scrollbar: { alwaysConsumeMouseWheel: false }, automaticLayout: true, tabSize: 2, wordWrap: 'on' }} /></div></section>

          {rep.format === 'frontend' && <Suspense fallback={<PreviewLoading />}><FrontendPreview key={rep.id} rep={rep} code={attempt.code} /></Suspense>}
          <section id="checks-section" tabIndex={-1} className={`checks-drawer ${running ? 'running' : runError ? 'failed' : results ? allPassed ? 'passed' : 'failed' : ''}`} aria-live="polite" aria-busy={running}><button type="button" className="checks-toggle" aria-expanded={checksOpen} aria-controls="check-details" onClick={() => setChecksOpen(!checksOpen)}><span>Checks</span><span>{running ? 'Running…' : results ? `${results.filter(result => result.passed).length} of ${results.length} passed` : runError ? 'Needs attention' : 'Not run yet'} <Icon name="chevron" /></span></button><div id="check-details" hidden={!checksOpen}>{running ? <div className="result-running"><span className="result-running-track" aria-hidden="true"><span /></span><strong>Running checks</strong><p>Checking your solution against {rep.checks.length} cases.</p></div> : runError ? <div className="error-message" role="alert">{runError}</div> : results ? <><div className={`result-summary ${allPassed ? 'passed' : 'failed'}`}><span><Icon name={allPassed ? 'check' : 'alert'} /></span><div><strong>{allPassed ? 'All checks passed' : `${results.filter((result) => result.passed).length} of ${results.length} checks passed`}</strong><p>{allPassed ? 'Behavior is checked. Your plan and explanation remain self-reviewed.' : 'Read the feedback, adjust your code, and try again.'}</p></div></div><CheckFeedback results={results} />{allPassed && <button type="button" className="primary-button checks-next" onClick={() => revealSection('explain-section')}>Explain your solution</button>}{!allPassed && <aside className="mistake-help"><h3>Explore the concepts behind these checks</h3><p>These references may help you trace the failure. They are suggestions, not a diagnosis of your code.</p>{relatedHelp(repId, results.filter(r => !r.passed).map(r => r.name)).map(skill => <div key={skill.id}><button type="button" onClick={() => openKnowledge(skill.id)}>{skill.title}</button><p>{skill.mistakes[0]}</p></div>)}</aside>}</> : <div className="empty-results"><span className="empty-icon"><Icon name="code" /></span><div><strong>{runNotice ? 'Run checks again when ready' : 'Ready when you are'}</strong><p>{runNotice || 'Run checks to see how your solution handles the examples and edge cases.'}</p></div></div>}</div></section>
          <div ref={toolbarRef} className="workspace-toolbar"><div className="workspace-toolbar-links">{(results || runError) && <button type="button" onClick={() => revealSection('checks-section')}>{results?.some(result => !result.passed) ? 'View failed checks' : 'Results'}</button>}{allPassed && <button type="button" onClick={() => revealSection('explain-section')}>Explain solution</button>}</div><div className="workspace-toolbar-run"><span role="status">{running ? 'Running checks…' : results ? `${results.filter(result => result.passed).length}/${results.length} passed` : 'Ready to run'}</span>{running ? <button type="button" className="stop-checks-button" onClick={cancelChecks}>Stop checks</button> : <button className="primary-button" type="button" onClick={runChecks}><Icon name="play" />Run checks</button>}</div></div>
        </div>
      </div>
    </main>}
    </ScreenMemory>
    {glossaryOpen && <GlossaryDrawer terms={glossary} onClose={() => setGlossaryOpen(false)} />}
    {commandsOpen && <CommandPalette reps={reps} commands={commands} onOpenRep={openRep} onClose={() => setCommandsOpen(false)} />}
    <dialog className="reset-dialog" ref={resetDialogRef} aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
      <span className="reset-dialog-label">Start again</span>
      <h2 id="reset-dialog-title">Reset this rep?</h2>
      <p id="reset-dialog-description">Your plan, code, explanation, revealed hints, and check results will be cleared. The starter code will be restored.</p>
      <p className="reset-dialog-note">Completed attempts in History will stay saved.</p>
      <div className="reset-dialog-actions"><button className="reset-dialog-cancel" type="button" autoFocus onClick={() => resetDialogRef.current?.close()}>Cancel</button><button className="reset-dialog-confirm" type="button" onClick={resetRep}>Reset rep</button></div>
    </dialog>
    {view !== 'workspace' && <footer><span>Code Reps</span><span>Free practice. Saved locally.</span></footer>}
  </div>
}

export default App
