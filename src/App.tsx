import { repNotes } from './rep-notes.ts'
import { usePracticeSessions } from './usePracticeSessions'
import { AppNavigation } from './AppNavigation'
import { InterviewStatus } from './InterviewStatus'
import { useFluency } from './useFluency'
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CommandPalette, GlossaryDrawer, ScreenMemory, WorkspaceSplit } from './Experience'
import { useSessionPreference } from './useSessionPreference'
import { useNavigation } from './useNavigation'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { View } from './ui-navigation'
import { ProjectEditor } from './ProjectEditor'
import { getActiveProfile, localStore } from './local-store'
import { deviceSaveFailure } from './save-status'
import { repIndex as reps } from './catalog-index'
import type { RepSummary } from './catalog-index'
import type { Rep } from './rep-types'
import { useRepContent } from './useRepContent'
import { peekRepContent } from './rep-content'
import { paths } from './path'
import { JournalTabs } from './Journal'
import { useReviewContent } from './useReviewContent'
import { attemptStatus, getPracticePlan, nextRepInPath, practiceWritingPrompts } from './practice'
import { completionEvidence } from './curriculum'
import { skillSummaryById } from './skill-index.ts'
import type { LearnerStart } from './learning'
import './design.css'
import './motion.css'
import './trail.css'
import { StepIndicator } from './StepIndicator'
import { PreviewLoading } from './LoadingStates'
import { revealElement } from './ui-motion'
import { learnerStartKey, readAttempt, readLearnerStart } from './attempt-store'
import type { Attempt, AttemptRecord } from './attempt-store'
import { useAttempt } from './useAttempt'
import { useCheckRun } from './useCheckRun'
import { applyBackup, backupDownloaded, downloadBackup, previewBackup } from './backup'
import type { BackupPreview } from './backup'
import { AppRoutes } from './AppRoutes'
import { actionLabel } from './practice-actions'
import type { SearchEntry, SearchTarget } from './command-search'
import type { NavigationRequest } from './AppNavigation'
import { WorkspaceHeader } from './WorkspaceHeader'
import { BriefSection, ExplainSection, PlanSection, RepContentNotice, ReviewSection } from './PracticeSections'
import type { UpdateAttempt } from './PracticeSections'
import { ChecksDrawer, WorkspaceToolbar } from './ChecksDrawer'
import { practiceSteps, sectionStep, stepSection } from './practice-steps'

const repIds = reps.map(rep => rep.id)
// The badge notice and its artwork load on their own, keeping badge rules out of the first load. The notice is a
// courtesy: if it cannot load, the badges still appear on Progress.
const BadgeNotice = lazy(() =>
  import('./BadgeNotice').then(module => ({ default: module.BadgeNotice })).catch(() => ({ default: () => null })),
)
const FirstRepWalkthrough = lazy(() =>
  import('./FirstRepWalkthrough')
    .then(module => ({ default: module.FirstRepWalkthrough }))
    .catch(() => ({
      default: ({ onDismiss }: { onDismiss: () => void }) => (
        <aside aria-label="First rep walkthrough">
          <p>Guide unavailable. Reload to try again, or continue practice.</p>
          <button type="button" className="text-button" onClick={onDismiss}>
            Skip walkthrough
          </button>
        </aside>
      ),
    })),
)
const FrontendPreview = lazy(() =>
  import('./FrontendPreview').catch(() => ({
    default: () => (
      <section className="panel frontend-preview" role="alert">
        <p>The preview could not load. Reload to try again; your draft will be kept.</p>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>
          Reload app
        </button>
      </section>
    ),
  })),
)

// UI-only renders reuse the same learner summary. Consumers read only draft status, so typing that keeps the status changes nothing here.
function usePracticeOverview(
  repId: string,
  attempt: Attempt,
  history: AttemptRecord[],
  learnerStart: LearnerStart | null,
  now: number,
  goalPathId: string,
) {
  // Other reps' saved drafts change only on rep switch or completion (history); re-reading every one on each keystroke
  // dominated typing cost.
  const savedDrafts = useMemo(
    () => Object.fromEntries(reps.filter(item => item.id !== repId).map(item => [item.id, readAttempt(item)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- history signals a completion write to another rep's draft.
    [repId, history],
  )
  const currentStatus = attemptStatus(repId, attempt)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the current attempt is refreshed whenever its status changes.
  const drafts = useMemo(() => ({ ...savedDrafts, [repId]: attempt }), [savedDrafts, repId, currentStatus])
  const practicePlan = useMemo(
    () => getPracticePlan(drafts, history, learnerStart, repId, now, goalPathId),
    [drafts, history, learnerStart, repId, now, goalPathId],
  )
  return { drafts, practicePlan }
}

const repById = new Map(reps.map(item => [item.id, item]))
const splitWidthKey = 'code-reps:split-width'
const editorOptions = {
  tabFocusMode: true,
  minimap: { enabled: false },
  fontFamily: 'Maple Mono, monospace',
  fontLigatures: true,
  fontSize: 14,
  lineHeight: 24,
  padding: { top: 18 },
  scrollBeyondLastLine: false,
  scrollbar: { alwaysConsumeMouseWheel: false },
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
} as const
/** What a SQL rep accepts, in the editor's footer: one read-only statement, or a script that may change data. */
function sqlContract(rep: Rep) {
  if (rep.sql?.compare !== 'state') return 'One statement · read-only'
  return rep.checks.some(check => check.sql?.probes?.length) ? 'Your schema · probe statements run after' : 'Statements run in order'
}

type IndonesianHelp = Pick<typeof import('./vocabulary-id'), 'indonesianGlossary' | 'englishTipsForIndonesianSpeakers'>

function App({ profileName = 'My learning', onManageProfiles }: { profileName?: string; onManageProfiles?: () => void }) {
  const fluency = useFluency()
  const sessions = usePracticeSessions()
  // The lesson in the address wins; #/knowledge alone reopens the last lesson of this session.
  const [lastLesson, setLastLesson] = useSessionPreference<string>('knowledge-skill', 'values')
  // A rep opened from a lesson remembers it, so the workspace can lead back to that lesson instead of the Library.
  const [repOrigin, setRepOrigin] = useSessionPreference<string>('rep-origin', '')
  function openKnowledge(id: string) {
    setLastLesson(id)
    setView('knowledge', id)
  }

  function setView(next: View, id?: string) {
    if (next !== 'workspace') setEditorFocusRequest(0)
    if (next === 'workspace') setRepOrigin(route.view === 'knowledge' && id ? `${id}:${knowledgeSkill}` : '')
    navigate(next, next === 'workspace' ? (id ?? repId) : next === 'knowledge' ? id : undefined)
  }
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  // Search can open Appearance or switch dark mode, which the navigation owns.
  const [navigationRequest, setNavigationRequest] = useState<NavigationRequest | undefined>(undefined)
  const [focusMode, setFocusMode] = useState(false)
  const [checksOpen, setChecksOpen] = useState(false)
  const workspaceRef = useRef<HTMLElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const tabsRef = useRef<HTMLDivElement | null>(null)
  const [editorFocusRequest, setEditorFocusRequest] = useState(0)
  const [splitWidth, setSplitWidth] = useState(() => {
    try {
      return Math.max(25, Math.min(60, Number(localStore.getItem(splitWidthKey)) || 40))
    } catch {
      return 40
    }
  })
  function saveSplit(value: number) {
    try {
      localStore.setItem(splitWidthKey, String(value))
    } catch {
      /* Layout preference is optional. */
    }
  }
  const sectionRequest = useRef(0)
  function revealSection(id: string) {
    const request = ++sectionRequest.current
    if (id === 'checks-section') setChecksOpen(true)
    const pane = id === 'solution-section' || id === 'checks-section' ? 'workspace' : 'task'
    setMobileTab(pane)
    setActiveStep(sectionStep(id))
    if (pane === 'task') setFocusMode(false)
    requestAnimationFrame(() => {
      if (request !== sectionRequest.current) return
      const target = document.getElementById(id)
      if (matchMedia('(min-width: 901px)').matches) {
        const task = target?.closest<HTMLElement>('.task-column')
        if (task && target) {
          const top = task.scrollTop + target.getBoundingClientRect().top - task.getBoundingClientRect().top
          task.scrollTo({ top, behavior: 'instant' })
        }
      } else target?.scrollIntoView({ block: 'start', behavior: 'instant' })
      target?.focus({ preventScroll: true })
    })
  }
  const [pathId, setPathId] = useSessionPreference<(typeof paths)[number]['id']>('path', 'typescript')
  const [pathPicker, setPathPicker] = useSessionPreference<'open' | 'closed'>(
    'path-picker',
    matchMedia('(min-width: 901px)').matches ? 'open' : 'closed',
  )
  const [learnerStart, setLearnerStart] = useState(readLearnerStart)
  const [mobileTab, setMobileTab] = useSessionPreference<'task' | 'workspace'>('workspace-tab', 'task')
  const [walkthrough, setWalkthrough] = useSessionPreference<'new' | 'active' | 'dismissed'>('first-rep-walkthrough', 'new')
  const [indonesianHelp, setIndonesianHelp] = useSessionPreference<'off' | 'on'>('indonesian-help', 'off')
  const [indonesianHelpContent, setIndonesianHelpContent] = useState<IndonesianHelp | null>(null)
  useEffect(() => {
    if (indonesianHelp !== 'on' || indonesianHelpContent) return
    let active = true
    // Loaded on demand so the glossary stays out of the initial bundle; a failed load just hides the glosses.
    import('./vocabulary-id').then(
      module => {
        if (active) setIndonesianHelpContent(module)
      },
      () => {},
    )
    return () => {
      active = false
    }
  }, [indonesianHelp, indonesianHelpContent])
  const indonesianHelpShown = indonesianHelp === 'on' ? indonesianHelpContent : null
  const [activeStep, setActiveStep] = useSessionPreference<string>('practice-step', mobileTab === 'task' ? 'understand' : 'solve')
  function dismissWalkthrough() {
    setWalkthrough('dismissed')
    revealSection(stepSection(activeStep))
  }
  const { repId, rep, attempt, history, saveState, setSaveState, ...attempts } = useAttempt()
  const checks = useCheckRun()
  const { results, runError, running, runNotice } = checks
  const [transferMessage, setTransferMessage] = useState('')
  // A chosen backup waits here for confirmation; nothing is written until the learner merges it.
  const [pendingRestore, setPendingRestore] = useState<BackupPreview | null>(null)
  // After a merge the app reloads, so the receipt crosses the reload in session storage and shows once.
  const receiptKey = `code-reps:ui:${getActiveProfile()}:restore-receipt`
  const [restoreReceipt, setRestoreReceipt] = useState(() => {
    try {
      return sessionStorage.getItem(receiptKey) ?? ''
    } catch {
      return ''
    }
  })
  useEffect(() => {
    try {
      sessionStorage.removeItem(receiptKey)
    } catch {
      /* The receipt is optional. */
    }
  }, [receiptKey])
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  // Editing code makes earlier check feedback obsolete.
  const update: UpdateAttempt = (key, value) => {
    attempts.update(key, value)
    if (key === 'code') checks.invalidate()
  }

  function selectRep(nextId: string) {
    if (nextId === repId) return
    const nextRep = repById.get(nextId)
    if (!nextRep) return
    checks.reset()
    attempts.select(nextRep)
    setEditorFocusRequest(0)
    setActiveStep('understand')
  }

  const { route, navigate } = useNavigation(repIds, next => {
    if (next.view === 'workspace' && next.repId) selectRep(next.repId)
  })
  const view = route.view
  const knowledgeSkill = route.view === 'knowledge' && route.skillId ? route.skillId : lastLesson
  useEffect(() => {
    if (route.skillId && route.skillId !== lastLesson) setLastLesson(route.skillId)
  }, [route.skillId, lastLesson, setLastLesson])
  const originLesson = repOrigin.startsWith(`${repId}:`) ? repOrigin.slice(repId.length + 1) : undefined

  useEffect(() => {
    if (view === 'workspace') revealElement(document.querySelector('.task-column section:not([hidden])'), 'none')
  }, [activeStep, view, repId])
  useEffect(() => {
    revealElement(document.querySelector('.task-hints'))
  }, [attempt.hintCount])
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
    setChecksOpen(false)
    selectRep(nextId)
    setActiveStep('understand')
    setMobileTab('task')
    setView('workspace', nextId)
  }

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandsOpen(current => !current)
      }
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setFocusMode(false)
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [])

  // Reviewing a completed rep starts a blank attempt; the completed one stays in history.
  function openReview(nextId: string) {
    openRep(nextId)
    const nextRep = repById.get(nextId)
    if (nextRep && (nextId === repId ? attempt.completedAt : readAttempt(nextRep).completedAt)) {
      attempts.restart(peekRepContent(nextId)?.rep.starter)
      checks.clearResults()
    }
  }

  function chooseStart(value: LearnerStart) {
    setLearnerStart(value)
    try {
      localStore.setItem(learnerStartKey, value)
    } catch (error) {
      setSaveState(deviceSaveFailure(error))
    }
  }

  function exportData() {
    setTransferMessage(downloadBackup({ attempt, repId, learnerStart, history, learning: fluency.state, sessions }))
  }

  async function importData(file: File) {
    setTransferMessage('')
    setRestoreReceipt('')
    try {
      setPendingRestore(await previewBackup(file, { history, learning: fluency.state }))
    } catch (error) {
      setPendingRestore(null)
      setTransferMessage(error instanceof Error ? error.message : 'The backup could not be imported.')
    }
  }

  async function confirmRestore() {
    if (!pendingRestore) return
    const { newAttempts, newNotes } = pendingRestore
    const added = [
      `${newAttempts} new ${newAttempts === 1 ? 'attempt' : 'attempts'}`,
      ...(newNotes ? [`${newNotes} new ${newNotes === 1 ? 'note' : 'notes'}`] : []),
    ].join(' and ')
    try {
      sessionStorage.setItem(receiptKey, `Backup merged into ${profileName}: ${added}.`)
    } catch {
      /* The merge still happens; only the receipt is skipped. */
    }
    try {
      await applyBackup(pendingRestore.backup, { learnerStart, history, learning: fluency.state, sessions })
    } catch (error) {
      try {
        sessionStorage.removeItem(receiptKey)
      } catch {
        /* Nothing to clear. */
      }
      setPendingRestore(null)
      setTransferMessage(error instanceof Error ? error.message : 'The backup could not be imported.')
    }
  }

  function runChecks() {
    if (running || !full || attempt.code === undefined) return
    checks.run(attempt.code, full, repId)
    setMobileTab('workspace')
    setActiveStep('solve')
    setChecksOpen(true)
  }

  const repContent = useRepContent(repId, view === 'workspace')
  const full = repContent.status === 'ready' ? repContent.content.rep : undefined
  // The starter arrives with the rep's content; only an attempt still waiting for it takes it, so a saved draft is never replaced.
  const { setAttempt } = attempts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopts the starter once its content has loaded.
    if (full && full.id === repId) setAttempt(current => (current.code === undefined ? { ...current, code: full.starter } : current))
  }, [full, repId, setAttempt])
  const allPassed = !!full && results?.length === full.checks.length && results.every(result => result.passed)
  const contentNotice = <RepContentNotice content={repContent} />
  const writing = practiceWritingPrompts({ id: rep.id, format: rep.format, planPrompt: full?.planPrompt ?? '' })
  // Small reps keep plan and explanation optional; reasoned reps still require both. Difficulty is always optional.
  const writingRequired = writing.scale === 'reasoned'
  const stepDone: Record<string, boolean> & { plan: boolean; solve: boolean; explain: boolean; review: boolean } = {
    plan: !!attempt.plan.trim(),
    solve: !!allPassed || !!attempt.completedAt,
    explain: !!attempt.explanation.trim(),
    review: !!attempt.difficulty,
  }
  const planMissing = writingRequired && !stepDone.plan
  const explainMissing = writingRequired && !stepDone.explain
  const missingStep = planMissing ? 'plan' : !stepDone.solve ? 'solve' : explainMissing ? 'explain' : undefined
  const canFinish = allPassed && !planMissing && !explainMissing
  const finishMissing = planMissing ? 'a plan' : !stepDone.solve ? 'passing checks' : explainMissing ? 'an explanation' : undefined
  const canComplete = !!canFinish && !attempt.completedAt
  // Complete stays a normal button. When something is missing, it moves the learner to that step instead of doing nothing.
  function showMissingStep() {
    if (missingStep) revealSection(stepSection(missingStep))
  }
  const [badgeSlot, setBadgeSlot] = useState<HTMLElement | null>(null)
  // What the saved attempt shows about growth, worked out from history: reopening a finished rep shows the same notes.
  // Only a rep completed here queues its skill steps for the skill map to replay once.
  const [completedHere, setCompletedHere] = useState<string>()
  const completedRecord = attempt.completedAt
    ? history.find(record => record.repId === repId && record.completedAt === attempt.completedAt)
    : undefined

  const { drafts, practicePlan } = usePracticeOverview(repId, attempt, history, learnerStart, now, fluency.state.goal.pathId)
  const repStatus = (item: RepSummary) => attemptStatus(item.id, drafts[item.id])
  const currentStatus = repStatus(rep)
  const currentLesson = repContent.status === 'ready' ? repContent.content.lesson : undefined
  const journeyStates = practicePlan.progress
  const review = useReviewContent()
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && repById.get(recommendation.repId)
  const openPracticeAction = (action: { repId: string; mode: string }) =>
    action.mode === 'review' || action.mode === 'retry' ? openReview(action.repId) : openRep(action.repId)
  const completedPathIds = useMemo(() => new Set(history.map(record => record.repId)), [history])
  const recallReady = (id: string) => !journeyStates.some(state => state.journey.recall === id && !state.recallDue && !state.retained)
  // Due reviews and hint-free retries outrank path order; recall reps wait until they are due.
  const pathNextRep =
    recommendation?.mode === 'review' || recommendation?.mode === 'retry'
      ? undefined
      : reps.find(item => item.id === nextRepInPath(fluency.state.goal.pathId, repId, id => completedPathIds.has(id) || !recallReady(id)))
  const completionNext = pathNextRep ? { repId: pathNextRep.id, mode: 'start' } : recommendation
  const completionLabel = pathNextRep
    ? `Next rep: ${pathNextRep.title}`
    : recommendedRep && recommendation
      ? `${actionLabel(recommendation.mode)}: ${recommendedRep.title}`
      : 'Return to your trail'
  const journalTabs = <JournalTabs view={view} onNavigate={setView} />
  const notes = repNotes(full?.note ?? '')
  const focusEditor = () => {
    setFocusMode(true)
    revealSection('solution-section')
    setEditorFocusRequest(current => current + 1)
  }
  const toggleFocusMode = () => {
    setFocusMode(!focusMode)
    setMobileTab('workspace')
    setActiveStep('solve')
  }
  // Search actions, by id. The palette shows them in the groups below; pages, lessons, and exercises come from command-search.
  const searchActions: Record<string, () => void> = {
    continue: () => recommendation && openPracticeAction(recommendation),
    run: runChecks,
    editor: focusEditor,
    'focus-mode': toggleFocusMode,
    brief: () => revealSection('brief-section'),
    checks: () => revealSection('checks-section'),
    explain: () => revealSection('explain-section'),
    glossary: () => setGlossaryOpen(true),
    appearance: () => setNavigationRequest(current => ({ kind: 'appearance', at: (current?.at ?? 0) + 1 })),
    theme: () => setNavigationRequest(current => ({ kind: 'theme', at: (current?.at ?? 0) + 1 })),
    profiles: () => onManageProfiles?.(),
    backup: exportData,
  }
  const action = (group: SearchEntry['group'], id: string, label: string, text = '', extra: Partial<SearchEntry> = {}): SearchEntry => ({
    group,
    label,
    target: { kind: 'action', id },
    text,
    ...extra,
  })
  const searchContext: SearchEntry[] = [
    ...(recommendedRep && recommendation && !(view === 'workspace' && recommendation.repId === repId)
      ? [action('Continue', 'continue', recommendedRep.title, 'continue next', { detail: actionLabel(recommendation.mode) })]
      : []),
    ...(view === 'workspace'
      ? [
          action('This rep', 'run', 'Run checks', 'test', { shortcut: 'Ctrl / ⌘ Enter' }),
          action('This rep', 'editor', 'Focus the editor', 'code solve'),
          action('This rep', 'focus-mode', focusMode ? 'Leave focus mode' : 'Enter focus mode'),
          action('This rep', 'brief', 'Read the brief and hints', 'understand'),
          action('This rep', 'checks', 'See check results', 'tests'),
          action('This rep', 'explain', 'Explain your solution', 'explain'),
        ]
      : []),
    action('Pages', 'glossary', 'Glossary', 'terms vocabulary words'),
    action('Settings', 'appearance', 'Appearance', 'colors color scheme palette theme'),
    action('Settings', 'theme', 'Dark mode', 'theme light appearance', { detail: 'Switch on or off' }),
    ...(onManageProfiles ? [action('Settings', 'profiles', 'Manage profiles', 'learner profile switch rename export')] : []),
    action('Settings', 'backup', 'Download practice backup', 'export save file'),
  ]
  function chooseSearchTarget(target: SearchTarget) {
    if (target.kind === 'rep') openRep(target.repId)
    else if (target.kind === 'lesson') openKnowledge(target.skillId)
    else if (target.kind === 'page') setView(target.view)
    else searchActions[target.id]?.()
  }

  function completeRep() {
    if (!canFinish) return
    // The clock ticks once a minute; refresh it so a completion moments old is not dated in the future.
    if (attempts.complete()) {
      setNow(Date.now())
      setCompletedHere(repId)
    }
  }

  function startNewAttempt() {
    if (!attempt.completedAt) return
    checks.reset()
    attempts.restart(full?.starter)
    window.scrollTo(0, 0)
  }

  const resetDialogRef = useRef<HTMLDialogElement | null>(null)
  function resetRep() {
    resetDialogRef.current?.close()
    checks.reset()
    attempts.restart(full?.starter)
    setMobileTab('task')
    setActiveStep('understand')
  }

  const walkthroughActive = walkthrough === 'active' && repId === 'declare-variables'
  const walkthroughGuide = (
    <Suspense fallback={null}>
      <FirstRepWalkthrough step={activeStep} completed={!!attempt.completedAt} onNext={revealSection} onDismiss={dismissWalkthrough} />
    </Suspense>
  )
  // Finish is never "Optional": it is where the rep is completed. It reads Ready once nothing is missing.
  const stepStatus = (stepId: string) =>
    stepId === 'understand'
      ? 'Read'
      : stepId === 'review'
        ? attempt.completedAt
          ? 'Done'
          : canFinish
            ? 'Ready'
            : 'To do'
        : stepDone[stepId]
          ? 'Done'
          : stepId === 'solve' || writingRequired
            ? 'Needed'
            : 'Optional'
  const stepComplete = (stepId: string) => (stepId === 'review' ? !!attempt.completedAt : stepId !== 'understand' && stepDone[stepId])
  const layoutColumns = focusMode ? 'auto minmax(0, 1fr)' : `minmax(0, ${splitWidth}fr) 12px minmax(0, ${100 - splitWidth}fr)`
  const activeRound = fluency.state.rounds.find(round => !round.endedAt && round.repId === repId)
  // The catalog knows a SQL rep before its content loads, so the editor opens with the right file and language.
  const sqlRep = rep.format === 'sql'
  const editorPath = `code-reps://${getActiveProfile()}/${rep.id}/${sqlRep ? 'query.sql' : `solution.${full?.reactPreview ? 'tsx' : 'ts'}`}`
  const editorLabel =
    `${sqlRep ? 'SQL query' : 'TypeScript solution'} for ${rep.title}. Press Control or Command Enter to run checks. ` +
    'Tab moves focus out of the editor.'

  const runChecksShortcut = (event: ReactKeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      runChecks()
    }
  }
  const workspace = (
    <main
      ref={workspaceRef}
      className={`practice-main ${focusMode ? 'focus-mode' : ''}`}
      data-step={activeStep}
      id="main-content"
      onKeyDown={runChecksShortcut}
    >
      <WorkspaceHeader
        rep={rep}
        status={currentStatus}
        saveState={saveState}
        focusMode={focusMode}
        onLibrary={() => (originLesson ? openKnowledge(originLesson) : setView('catalog'))}
        backLabel={originLesson ? skillSummaryById(originLesson)?.title : undefined}
        onGlossary={() => setGlossaryOpen(true)}
        onFocusMode={() => {
          setFocusMode(!focusMode)
          revealSection('solution-section')
        }}
        onReset={() => resetDialogRef.current?.showModal()}
        openLesson={openKnowledge}
      />
      {activeRound && (
        <InterviewStatus
          round={activeRound}
          onControls={() => {
            setView('interview')
          }}
        />
      )}
      <div className="workspace-layout" style={{ gridTemplateColumns: layoutColumns }}>
        <div className="task-pane">
          <div ref={tabsRef} className="practice-steps" role="navigation" aria-label="Practice steps">
            <StepIndicator active={activeStep} />
            {practiceSteps.map(step => (
              <button
                key={step.id}
                type="button"
                aria-label={step.label}
                aria-current={activeStep === step.id ? 'step' : undefined}
                aria-describedby={`step-status-${step.id}`}
                aria-controls={step.section}
                data-done={stepComplete(step.id) || undefined}
                onClick={() => revealSection(step.section)}
              >
                <span>{step.label}</span>
                <small id={`step-status-${step.id}`}>{stepStatus(step.id)}</small>
              </button>
            ))}
          </div>
          <div
            id="task-workspace"
            key={`task-${rep.id}`}
            className={`task-column ${activeStep !== 'solve' ? 'mobile-active' : ''}`}
            role="region"
            aria-label="Task and plan"
            tabIndex={0}
          >
            {walkthroughActive && activeStep !== 'solve' && walkthroughGuide}
            <BriefSection
              hidden={activeStep !== 'understand' && activeStep !== 'solve'}
              understanding={activeStep === 'understand'}
              repId={repId}
              full={full}
              lesson={currentLesson}
              notes={notes}
              contentNotice={contentNotice}
              history={history}
              openRep={openRep}
              openLesson={openKnowledge}
              indonesianHelp={indonesianHelp === 'on'}
              onIndonesianHelp={on => setIndonesianHelp(on ? 'on' : 'off')}
              glossary={indonesianHelpShown?.indonesianGlossary}
              hintCount={attempt.hintCount}
              onRevealHint={() => {
                update('hintCount', attempt.hintCount + 1)
                setMobileTab('task')
              }}
              onReveal={revealSection}
            />
            <PlanSection
              hidden={activeStep !== 'plan'}
              full={full}
              contentNotice={contentNotice}
              writing={writing}
              plan={attempt.plan}
              onPlan={plan => update('plan', plan)}
              onReveal={revealSection}
            />
            <ExplainSection
              hidden={activeStep !== 'explain'}
              repId={repId}
              writing={writing}
              explanation={attempt.explanation}
              onExplanation={explanation => update('explanation', explanation)}
              englishTips={indonesianHelpShown?.englishTipsForIndonesianSpeakers}
              allPassed={allPassed}
              review={review}
              onReveal={revealSection}
            />
            <ReviewSection
              hidden={activeStep !== 'review'}
              rep={rep}
              attempt={attempt}
              update={update}
              stepDone={stepDone}
              writingRequired={writingRequired}
              missingStep={missingStep}
              finishMissing={finishMissing}
              canComplete={canComplete}
              onComplete={completeRep}
              onShowMissing={showMissingStep}
              badgeSlot={setBadgeSlot}
              completionLabel={completionLabel}
              onCompletionNext={() => (completionNext ? openPracticeAction(completionNext) : setView('home'))}
              onDone={() => setView('home')}
              onFreshAttempt={startNewAttempt}
              evidence={completionEvidence(repId, attempt.hintCount, journeyStates)}
              moments={
                completedRecord
                  ? { history, recordId: completedRecord.id, now, fresh: completedHere === repId, onSkillMap: () => setView('skillmap') }
                  : undefined
              }
            />
          </div>
        </div>
        <WorkspaceSplit value={splitWidth} onChange={setSplitWidth} onCommit={saveSplit} />
        <div
          id="code-workspace"
          key={`code-${rep.id}`}
          className={`code-column ${activeStep === 'solve' ? 'mobile-active' : ''}`}
          role="region"
          aria-label="Code and preview"
          tabIndex={0}
        >
          <section id="solution-section" tabIndex={-1} className="panel code-panel">
            {walkthroughActive && activeStep === 'solve' && walkthroughGuide}
            <div className="editor-wrap">
              {attempt.code === undefined ? (
                <p className="rep-content-notice" role="status">
                  {repContent.status === 'error'
                    ? 'The starter code could not load. Retry above; your other work is safe.'
                    : 'Loading the starter code…'}
                </p>
              ) : (
                <ProjectEditor
                  showHeader
                  key={rep.id}
                  focusRequest={editorFocusRequest}
                  height="100%"
                  path={editorPath}
                  language={sqlRep ? 'sql' : 'typescript'}
                  value={attempt.code}
                  onChange={value => update('code', value ?? '')}
                  onRunChecks={runChecks}
                  options={{ ariaLabel: editorLabel, ...editorOptions }}
                />
              )}
              {sqlRep && (
                <div className="editor-foot">
                  <span>SQLite · a fresh database for every check</span>
                  {full?.sql && <span>{sqlContract(full)}</span>}
                </div>
              )}
            </div>
          </section>

          {rep.format === 'frontend' &&
            (full ? (
              <Suspense fallback={<PreviewLoading />}>
                <FrontendPreview key={rep.id} rep={full} code={attempt.code ?? full.starter} />
              </Suspense>
            ) : (
              repContent.status === 'loading' && <PreviewLoading />
            ))}
          <ChecksDrawer
            run={checks}
            allPassed={allPassed}
            checkCount={full?.checks.length}
            open={checksOpen}
            onToggle={() => setChecksOpen(!checksOpen)}
            completed={!!attempt.completedAt}
            repId={repId}
            openLesson={openKnowledge}
            onExplain={() => revealSection('explain-section')}
            explaining={activeStep === 'explain' || stepDone.explain}
            probes={Boolean(full?.sql && full.checks.every(check => check.sql?.probes?.length))}
          />
          <WorkspaceToolbar
            ref={toolbarRef}
            run={checks}
            canRun={!!full}
            onRun={runChecks}
            onStop={checks.cancel}
            onResults={() => revealSection('checks-section')}
          />
        </div>
      </div>
    </main>
  )

  return (
    <div className="app-shell">
      <AppNavigation
        view={view}
        profileName={profileName}
        saveState={saveState}
        onNavigate={setView}
        onManageProfiles={onManageProfiles}
        onCommands={() => setCommandsOpen(true)}
        request={navigationRequest}
        notice={
          view !== 'workspace' ? (
            <Suspense fallback={null}>
              <BadgeNotice history={history} now={now} onView={() => setView('progress')} />
            </Suspense>
          ) : undefined
        }
      />
      {view === 'workspace' && (
        <Suspense fallback={null}>
          <BadgeNotice
            portalTarget={attempt.completedAt ? badgeSlot : null}
            history={history}
            now={now}
            onView={() => setView('progress')}
          />
        </Suspense>
      )}
      {saveState !== 'Saving…' && !saveState.startsWith('Saved') && (
        <div className="storage-recovery" role="status">
          <p>{saveState}</p>
          <button
            type="button"
            onClick={() => {
              void attempts.retrySaving()
            }}
          >
            Retry saving
          </button>
          <button className="reset-button" type="button" onClick={exportData}>
            Download backup
          </button>
        </div>
      )}
      <ScreenMemory key={`${view}:${view === 'workspace' ? repId : ''}`} screenKey={`${view}:${view === 'workspace' ? repId : ''}`}>
        <AppRoutes
          view={view}
          journalTabs={journalTabs}
          profileName={profileName}
          onManageProfiles={onManageProfiles}
          fluency={fluency}
          history={history}
          now={now}
          learnerStart={learnerStart}
          onLearnerStart={chooseStart}
          drafts={drafts}
          practicePlan={practicePlan}
          completedPathIds={completedPathIds}
          repStatus={repStatus}
          pathId={pathId}
          setPathId={setPathId}
          pathPicker={pathPicker}
          setPathPicker={setPathPicker}
          knowledgeSkill={knowledgeSkill}
          setKnowledgeSkill={openKnowledge}
          walkthroughSeen={walkthrough !== 'new'}
          launchWalkthrough={() => {
            setWalkthrough('active')
            openRep('declare-variables')
          }}
          setView={setView}
          openRep={openRep}
          openReview={openReview}
          openLesson={openKnowledge}
          openPracticeAction={openPracticeAction}
          onExport={exportData}
          onImport={file => {
            void importData(file)
          }}
          transferMessage={transferMessage}
          transferTone={transferMessage === backupDownloaded ? 'success' : 'error'}
          restore={{
            pending: pendingRestore,
            profileName,
            onConfirm: () => void confirmRestore(),
            onCancel: () => setPendingRestore(null),
            receipt: restoreReceipt,
            onDismissReceipt: () => setRestoreReceipt(''),
          }}
        >
          {workspace}
        </AppRoutes>
      </ScreenMemory>
      {glossaryOpen && <GlossaryDrawer onClose={() => setGlossaryOpen(false)} />}
      {commandsOpen && <CommandPalette context={searchContext} onChoose={chooseSearchTarget} onClose={() => setCommandsOpen(false)} />}
      <dialog
        className="reset-dialog"
        ref={resetDialogRef}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <span className="reset-dialog-label">Start again</span>
        <h2 id="reset-dialog-title">Reset this rep?</h2>
        <p id="reset-dialog-description">
          Your plan, code, explanation, revealed hints, and check results will be cleared. The starter code will be restored.
        </p>
        <p className="reset-dialog-note">Completed attempts in History will stay saved.</p>
        <div className="reset-dialog-actions">
          <button className="reset-dialog-cancel" type="button" autoFocus onClick={() => resetDialogRef.current?.close()}>
            Cancel
          </button>
          <button className="reset-dialog-confirm" type="button" onClick={resetRep}>
            Reset rep
          </button>
        </div>
      </dialog>
      {view !== 'workspace' && (
        <footer>
          <span>Code Reps</span>
          <span>Free practice. Saved locally.</span>
        </footer>
      )}
    </div>
  )
}

export default App
