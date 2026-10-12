import { Suspense, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Attempt, AttemptRecord } from './attempt-store'
import { catalogTopic } from './catalog-labels.ts'
import { repIndex as reps } from './catalog-index'
import type { RepSummary } from './catalog-index'
import { foundationsPathId, repCurriculumEvidence } from './curriculum'
import { HomePage } from './HomePage'
import { isHubTab } from './learning-pages'
import type { LearnerStart } from './learning'
import { lazyRoute } from './lazy-route'
import { PageLoading, RouteLoading } from './LoadingStates'
import { isServerReady } from './local-store'
import { paths } from './path'
import { attemptStatus } from './practice'
import { actionLabel } from './practice-actions'
import type { getPracticePlan, PracticeAction } from './practice'
import { buildTrail } from './trail-map'
import type { View } from './ui-navigation'
import type { useFluency } from './useFluency'
import { useSessionPreference } from './useSessionPreference'

const PathsPage = lazyRoute(() => import('./PathsPage').then(module => module.PathsPage), 'The tracks')
const ProgressPage = lazyRoute(() => import('./ProgressPage').then(module => module.ProgressPage), 'Progress')
const MistakesPage = lazyRoute(() => import('./MistakesPage').then(module => module.MistakesPage), 'Mistakes')
const SkillMapPage = lazyRoute(() => import('./SkillMapPage').then(module => module.SkillMapPage), 'The skill map')
const PracticeCatalog = lazyRoute(() => import('./PracticeCatalog').then(module => module.PracticeCatalog), 'The library')
const QuickLessons = lazyRoute(() => import('./QuickLessons').then(module => module.default), 'The lessons', 'learn-main')
const HistoryPage = lazyRoute(() => import('./HistoryPage').then(module => module.HistoryPage), 'Attempt history', 'history-main')
const LearningHub = lazyRoute(() => import('./LearningHub').then(module => module.LearningHub), 'Learning tools', 'learning-hub')

const categories = [...new Set(reps.map(catalogTopic))].sort()
const repById = new Map(reps.map(item => [item.id, item]))

type PathId = (typeof paths)[number]['id']
type PracticePlan = ReturnType<typeof getPracticePlan>
type Action = Pick<PracticeAction, 'repId' | 'mode'>

type Props = {
  view: View
  /** The coding desk, shown for the workspace route. */
  children: ReactNode
  journalTabs: ReactNode
  profileName: string
  onManageProfiles?: () => void
  fluency: ReturnType<typeof useFluency>
  history: AttemptRecord[]
  now: number
  learnerStart: LearnerStart | null
  onLearnerStart: (value: LearnerStart) => void
  drafts: Record<string, Attempt>
  practicePlan: PracticePlan
  completedPathIds: Set<string>
  repStatus: (rep: RepSummary) => string
  pathId: PathId
  setPathId: (id: PathId) => void
  pathPicker: 'open' | 'closed'
  setPathPicker: (value: 'open' | 'closed') => void
  knowledgeSkill: string
  setKnowledgeSkill: (id: string) => void
  walkthroughSeen: boolean
  launchWalkthrough: () => void
  setView: (view: View) => void
  openRep: (id: string) => void
  openReview: (id: string) => void
  openLesson: (id: string) => void
  openPracticeAction: (action: Action) => void
  onExport: () => void
  onImport: (file: File) => void
  transferMessage: string
}

/** Renders the page for the current route. Pages other than Home load on demand. */
export function AppRoutes(props: Props) {
  const { view, journalTabs, fluency, history, now, learnerStart, drafts, practicePlan, completedPathIds, repStatus, pathId, setPathId,
    setView, openRep, openReview, openLesson, openPracticeAction } = props
  const goalPathId = fluency.state.goal.pathId
  const journeyStates = practicePlan.progress
  const answers = fluency.state.answers
  const [goalTrail, browsedTrail] = useMemo(() => {
    const ready = (id: string) => !journeyStates.some(state => state.journey.recall === id && !state.recallDue && !state.retained)
    const checkedSkills = new Set(Object.keys(answers).filter(key => key.includes(':')).map(key => key.slice(0, key.indexOf(':'))))
    const input = (id: string) => ({
      completed: (repId: string) => completedPathIds.has(repId),
      inProgress: (repId: string) => attemptStatus(repId, drafts[repId]) === 'In progress',
      recallReady: ready,
      lessonChecked: (skillId: string) => checkedSkills.has(skillId),
      skipStages: learnerStart === 'returning' && id === foundationsPathId ? 1 : 0,
    })
    return [buildTrail(goalPathId, input(goalPathId)), buildTrail(pathId, input(pathId))]
  }, [goalPathId, pathId, completedPathIds, journeyStates, drafts, answers, learnerStart])
  const trailEvidence = (id: string) => repCurriculumEvidence(id, journeyStates)
  const openPath = (id: PathId) => { setPathId(id); setView('paths') }
  const setGoalPath = (id: PathId) => fluency.update({ ...fluency.state, goal: { ...fluency.state.goal, pathId: id } })

  if (isHubTab(view)) {
    const goalPath = paths.find(path => path.id === goalPathId) ?? paths[0]
    const trackReps = goalPath.stages.flatMap(stage => stage.repIds).filter(id => !history.some(attempt => attempt.repId === id))
    const candidates = [
      ...practicePlan.due, ...practicePlan.unfinished, ...(practicePlan.next ? [practicePlan.next] : []),
      ...trackReps.map(repId => ({ repId, reason: 'Build toward your selected track.' })),
    ]
    const loading = <PageLoading journalTabs={journalTabs} page={view} notebookHasDraft={Boolean(fluency.state.noteDraft)}
      notebookHasEntries={fluency.state.notes.length > 0} />
    return <Suspense fallback={loading}>
      <LearningHub journalTabs={journalTabs} onQuickLessons={() => setView('learn')} tab={view} setTab={setView}
        state={fluency.state} update={fluency.update} error={fluency.error} history={history} openRep={openRep} reviewRep={openReview}
        skillId={props.knowledgeSkill} onSkill={props.setKnowledgeSkill} candidates={candidates} />
    </Suspense>
  }
  switch (view) {
    case 'home':
      return <HomePage walkthroughSeen={props.walkthroughSeen} launchWalkthrough={props.launchWalkthrough} goalPathId={goalPathId}
        onPath={openPath} practicePlan={practicePlan} repStatus={repStatus} openPracticeAction={openPracticeAction}
        actionLabel={actionLabel}
        onProgress={() => setView('progress')} onLibrary={() => setView('catalog')} trail={goalTrail} evidence={trailEvidence}
        openRep={openRep} openLesson={openLesson} />
    case 'catalog':
      return <Suspense fallback={<main aria-busy="true"><p role="status">Loading the library…</p></main>}>
        <CatalogRoute goalPathId={goalPathId} drafts={drafts} practicePlan={practicePlan} repStatus={repStatus} openRep={openRep} />
      </Suspense>
    case 'paths':
      return <Suspense fallback={<RouteLoading title="Choose a track." status="Opening tracks…" />}>
        <PathsPage goalPathId={goalPathId} setGoalPath={setGoalPath}
          goalError={fluency.error} pathId={pathId} setPathId={setPathId} pathPicker={props.pathPicker} setPathPicker={props.setPathPicker}
          learnerStart={learnerStart} startingPoint={<StartingPoint learnerStart={learnerStart} onChoose={props.onLearnerStart} />}
          completedPathIds={completedPathIds} trail={browsedTrail} evidence={trailEvidence} openRep={openRep} openLesson={openLesson} />
      </Suspense>
    case 'skillmap':
      return <Suspense fallback={<RouteLoading title="Skill map." status="Opening the skill map…" />}>
        <SkillMapPage goalPathId={goalPathId} progress={journeyStates} openRep={openRep} reviewRep={openReview} />
      </Suspense>
    case 'mistakes':
      return <Suspense fallback={<RouteLoading title="Mistakes" status="Opening mistakes…" />}>
        <MistakesPage history={history} now={now} onOpenRep={openRep} />
      </Suspense>
    case 'progress': {
      const recommendation = practicePlan.next
      const recommendedRep = recommendation && repById.get(recommendation.repId)
      const dueReviews = practicePlan.due.map(action => ({
        title: reps.find(item => item.id === action.repId)!.title, reason: action.reason, open: () => openPracticeAction(action),
        label: actionLabel(action.mode), repId: action.repId,
      }))
      return <Suspense fallback={<RouteLoading title="Your progress" status="Opening your progress…" />}>
        <ProgressPage profileName={props.profileName} history={history} now={now} onManageProfiles={props.onManageProfiles}
          onOpenPath={openPath} progress={journeyStates} recommendation={recommendation && recommendedRep ? {
            title: recommendedRep.title, reason: recommendation.reason, label: actionLabel(recommendation.mode),
            open: () => openPracticeAction(recommendation),
          } : undefined} dueReviews={dueReviews} onOpenRep={openRep} onReviewRep={openReview}
          onExport={props.onExport} onImport={props.onImport} transferMessage={props.transferMessage} serverReady={isServerReady()} />
      </Suspense>
    }
    case 'learn':
      return <Suspense fallback={<main className="learn-main" aria-busy="true"><p role="status">Loading the lessons…</p></main>}>
        <QuickLessons openRep={openRep} onBrowse={() => setView('knowledge')} />
      </Suspense>
    case 'history':
      return <Suspense fallback={<main className="history-main" aria-busy="true">
        <p role="status">Loading your attempt history…</p>
      </main>}>
        <HistoryPage history={history} categories={categories} journalTabs={journalTabs} openRep={openRep} />
      </Suspense>
    default:
      return props.children
  }
}

/** The library with its session-only filters. */
function CatalogRoute({ goalPathId, drafts, practicePlan, repStatus, openRep }: {
  goalPathId: string; drafts: Record<string, Attempt>; practicePlan: PracticePlan; repStatus: (rep: RepSummary) => string
  openRep: (id: string) => void
}) {
  const [query, setQuery] = useSessionPreference<string>('catalogQuery', '')
  const [skill, setSkill] = useSessionPreference<string>('catalogSkill', '')
  const [format, setFormat] = useSessionPreference<string>('catalogFormat', '')
  const [status, setStatus] = useSessionPreference<string>('catalogStatus', '')
  const dueIds = useMemo(() => new Set(practicePlan.due.map(item => item.repId)), [practicePlan])
  const visibleReps = useMemo(() => reps.filter(item =>
    `${item.title} ${catalogTopic(item)} ${item.category} ${item.format ?? 'algorithm'}`.toLowerCase()
      .includes(query.trim().toLowerCase()) &&
    (!skill || catalogTopic(item) === skill) &&
    (!format || (item.format ?? 'algorithm') === format) &&
    (!status || (status === 'review' ? dueIds.has(item.id) : attemptStatus(item.id, drafts[item.id]) === status))),
  [query, skill, format, status, dueIds, drafts])
  const setters = { query: setQuery, skill: setSkill, format: setFormat, status: setStatus }
  return <PracticeCatalog goalPathId={goalPathId} filters={{ query, skill, format, status }}
    onFilter={(field, value) => setters[field](value)} clearFilters={() => { setQuery(''); setSkill(''); setFormat(''); setStatus('') }}
    categories={categories} visibleReps={visibleReps}
    dueIds={dueIds} repStatus={repStatus} openRep={openRep} />
}

function StartingPoint({ learnerStart, onChoose }: { learnerStart: LearnerStart | null; onChoose: (value: LearnerStart) => void }) {
  return <section className="starting-point" aria-labelledby="starting-point-title">
    <div>
      <span className="home-label">Your starting point</span>
      <h2 id="starting-point-title">Where are you starting?</h2>
      <p>This only changes your next suggested rep. You can open any rep at any time.</p>
    </div>
    <div className="starting-options">
      <button type="button" aria-pressed={learnerStart === 'new'} onClick={() => onChoose('new')}>
        <strong>New to coding</strong><span>Start with TypeScript building blocks.</span>
      </button>
      <button type="button" aria-pressed={learnerStart === 'returning'} onClick={() => onChoose('returning')}>
        <strong>Returning to coding</strong><span>Start with guided problem solving.</span>
      </button>
    </div>
  </section>
}
