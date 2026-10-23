import { Suspense, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Attempt, AttemptRecord } from './attempt-store'
import { catalogAreas, catalogTopic } from './catalog-labels.ts'
import { skillIndex } from './catalog-index'
import { repLevel } from './rep-levels.ts'
import { repIndex as reps } from './catalog-index'
import type { RepSummary } from './catalog-index'
import { repCurriculumEvidence, returningSkipStages } from './curriculum'
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
import type { RestoreFlow } from './backup'
import { repSearchText, searchWords } from './command-search'
import type { useFluency } from './useFluency'
import type { SetItem } from './warmup'
import { useSessionPreference } from './useSessionPreference'

const PathsPage = lazyRoute(() => import('./PathsPage').then(module => module.PathsPage), 'The tracks', 'paths-main')
const ProgressPage = lazyRoute(() => import('./ProgressPage').then(module => module.ProgressPage), 'Progress', 'progress-main')
const MistakesPage = lazyRoute(
  () => import('./MistakesPage').then(module => module.MistakesPage),
  'Mistakes',
  'progress-main mistakes-main',
)
const StuckPage = lazyRoute(() => import('./StuckPage').then(module => module.StuckPage), 'Stuck points', 'progress-main stuck-main')
const PatternCardsPage = lazyRoute(
  () => import('./PatternCardsPage').then(module => module.PatternCardsPage),
  'Pattern cards',
  'learn-main pattern-cards-main',
)
const SkillMapPage = lazyRoute(() => import('./SkillMapPage').then(module => module.SkillMapPage), 'The skill map', 'skill-map-main')
const PracticeCatalog = lazyRoute(() => import('./PracticeCatalog').then(module => module.PracticeCatalog), 'The library', 'catalog-main')
const QuickLessons = lazyRoute(() => import('./QuickLessons').then(module => module.default), 'The lessons', 'learn-main')
const HistoryPage = lazyRoute(() => import('./HistoryPage').then(module => module.HistoryPage), 'Attempt history', 'history-main')
const LearningHub = lazyRoute(() => import('./LearningHub').then(module => module.LearningHub), 'Learning tools', 'learning-hub')

const categories = [...new Set(reps.map(catalogTopic))].sort()
// The Library lists topics in learning order inside their areas; other pages keep the alphabetical list.
const libraryTopics = [...catalogAreas.flatMap(area => area.topics), ...categories].filter(
  (topic, index, all) => categories.includes(topic) && all.indexOf(topic) === index,
)
// Search also reads the titles of the lessons a rep practices, so concept words like "binary search" find reps.
const searchText = new Map(reps.map(item => [item.id, repSearchText(item)]))
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
  /** Opens the app-wide glossary drawer. */
  onGlossary: () => void
  drafts: Record<string, Attempt>
  practicePlan: PracticePlan
  completedPathIds: Set<string>
  repStatus: (rep: RepSummary) => string
  pathId: PathId
  setPathId: (id: PathId) => void
  knowledgeSkill: string
  setKnowledgeSkill: (id: string) => void
  walkthroughSeen: boolean
  launchWalkthrough: () => void
  setView: (view: View) => void
  openRep: (id: string) => void
  openReview: (id: string) => void
  openLesson: (id: string) => void
  openPracticeAction: (action: Action) => void
  /** Reps a warm-up would start with now, least recently practiced first. */
  warmup: string[]
  startWarmup: () => void
  startSet: (items: SetItem[]) => void
  onExport: () => void
  onImport: (file: File) => void
  transferMessage: string
  transferTone: 'success' | 'error'
  restore: RestoreFlow
}

/** Renders the page for the current route. Pages other than Home load on demand. */
export function AppRoutes(props: Props) {
  const {
    view,
    journalTabs,
    fluency,
    history,
    now,
    learnerStart,
    drafts,
    practicePlan,
    completedPathIds,
    repStatus,
    pathId,
    setPathId,
    setView,
    openRep,
    openReview,
    openLesson,
    openPracticeAction,
  } = props
  const goalPathId = fluency.state.goal.pathId
  const journeyStates = practicePlan.progress
  const answers = fluency.state.answers
  const [goalTrail, browsedTrail] = useMemo(() => {
    const ready = (id: string) => !journeyStates.some(state => state.journey.recall === id && !state.recallDue && !state.retained)
    const checkedSkills = new Set(
      Object.keys(answers)
        .filter(key => key.includes(':'))
        .map(key => key.slice(0, key.indexOf(':'))),
    )
    const input = (id: string) => ({
      completed: (repId: string) => completedPathIds.has(repId),
      inProgress: (repId: string) => attemptStatus(repId, drafts[repId]) === 'In progress',
      recallReady: ready,
      lessonChecked: (skillId: string) => checkedSkills.has(skillId),
      skipStages: learnerStart === 'returning' ? returningSkipStages(id) : 0,
      focusRepId: practicePlan.next?.repId,
    })
    return [buildTrail(goalPathId, input(goalPathId)), buildTrail(pathId, input(pathId))]
  }, [goalPathId, pathId, completedPathIds, journeyStates, drafts, answers, learnerStart, practicePlan.next?.repId])
  const trailEvidence = (id: string) => repCurriculumEvidence(id, journeyStates)
  const openPath = (id: PathId) => {
    setPathId(id)
    setView('paths')
  }
  const setGoalPath = (id: PathId) => fluency.update({ ...fluency.state, goal: { ...fluency.state.goal, pathId: id } })

  if (isHubTab(view)) {
    const goalPath = paths.find(path => path.id === goalPathId) ?? paths[0]
    const trackReps = goalPath.stages.flatMap(stage => stage.repIds).filter(id => !history.some(attempt => attempt.repId === id))
    const candidates = [
      ...practicePlan.due,
      ...practicePlan.unfinished,
      ...(practicePlan.next ? [practicePlan.next] : []),
      ...trackReps.map(repId => ({ repId, reason: 'Build toward your selected track.' })),
    ]
    const loading = (
      <PageLoading
        journalTabs={journalTabs}
        page={view}
        notebookHasDraft={Boolean(fluency.state.noteDraft)}
        notebookHasEntries={fluency.state.notes.length > 0}
      />
    )
    return (
      <Suspense fallback={loading}>
        <LearningHub
          journalTabs={journalTabs}
          onQuickLessons={() => setView('learn')}
          tab={view}
          setTab={setView}
          state={fluency.state}
          update={fluency.update}
          error={fluency.error}
          history={history}
          openRep={openRep}
          reviewRep={openReview}
          skillId={props.knowledgeSkill}
          onSkill={props.setKnowledgeSkill}
          candidates={candidates}
        />
      </Suspense>
    )
  }
  switch (view) {
    case 'home':
      return (
        <HomePage
          walkthroughSeen={props.walkthroughSeen}
          launchWalkthrough={props.launchWalkthrough}
          goalPathId={goalPathId}
          onPath={openPath}
          practicePlan={practicePlan}
          openPracticeAction={openPracticeAction}
          actionLabel={actionLabel}
          onProgress={() => setView('progress')}
          onLibrary={() => setView('catalog')}
          trail={goalTrail}
          evidence={trailEvidence}
          openRep={openRep}
          openLesson={openLesson}
          learnerStart={learnerStart}
          onLearnerStart={props.onLearnerStart}
          history={history}
          now={now}
          warmup={props.warmup}
          startWarmup={props.startWarmup}
          startSet={props.startSet}
        />
      )
    case 'catalog':
      return (
        <Suspense fallback={<RouteLoading title="Find your next rep" status="Opening the library…" className="catalog-main" />}>
          <CatalogRoute
            goalPathId={goalPathId}
            practicePlan={practicePlan}
            repStatus={repStatus}
            openRep={openRep}
            openLesson={openLesson}
          />
        </Suspense>
      )
    case 'paths':
      return (
        <Suspense fallback={<RouteLoading title="Choose a track" status="Opening tracks…" className="paths-main" />}>
          <PathsPage
            goalPathId={goalPathId}
            setGoalPath={setGoalPath}
            goalError={fluency.error}
            pathId={pathId}
            setPathId={setPathId}
            learnerStart={learnerStart}
            startingPoint={<StartingPoint learnerStart={learnerStart} onChoose={props.onLearnerStart} />}
            completedPathIds={completedPathIds}
            trail={browsedTrail}
            evidence={trailEvidence}
            openRep={openRep}
            openLesson={openLesson}
          />
        </Suspense>
      )
    case 'skillmap':
      return (
        <Suspense fallback={<RouteLoading title="Skill map" status="Opening the skill map…" className="skill-map-main" />}>
          <SkillMapPage goalPathId={goalPathId} progress={journeyStates} openRep={openRep} reviewRep={openReview} />
        </Suspense>
      )
    case 'mistakes':
      return (
        <Suspense fallback={<RouteLoading title="Mistakes" status="Opening mistakes…" className="progress-main mistakes-main" />}>
          <MistakesPage history={history} now={now} onOpenRep={openRep} onOpenLesson={openLesson} />
        </Suspense>
      )
    case 'stuck':
      return (
        <Suspense fallback={<RouteLoading title="Stuck points" status="Opening stuck points…" className="progress-main stuck-main" />}>
          <StuckPage history={history} drafts={drafts} now={now} onOpenRep={openRep} onOpenLesson={openLesson} />
        </Suspense>
      )
    case 'progress': {
      const recommendation = practicePlan.next
      const recommendedRep = recommendation && repById.get(recommendation.repId)
      const dueReviews = practicePlan.due.map(action => ({
        title: reps.find(item => item.id === action.repId)!.title,
        reason: action.reason,
        open: () => openPracticeAction(action),
        label: actionLabel(action.mode),
        repId: action.repId,
      }))
      return (
        <Suspense fallback={<RouteLoading title="Skills" status="Opening your skills…" className="progress-main" />}>
          <ProgressPage
            profileName={props.profileName}
            history={history}
            now={now}
            onManageProfiles={props.onManageProfiles}
            onOpenPath={openPath}
            progress={journeyStates}
            recommendation={
              recommendation && recommendedRep
                ? {
                    title: recommendedRep.title,
                    reason: recommendation.reason,
                    label: actionLabel(recommendation.mode),
                    open: () => openPracticeAction(recommendation),
                  }
                : undefined
            }
            dueReviews={dueReviews}
            onOpenRep={openRep}
            onReviewRep={openReview}
            onExport={props.onExport}
            onImport={props.onImport}
            transferMessage={props.transferMessage}
            transferTone={props.transferTone}
            restore={props.restore}
            serverReady={isServerReady()}
          />
        </Suspense>
      )
    }
    case 'patterns':
      return (
        <Suspense
          fallback={
            <RouteLoading
              eyebrow="Lessons"
              title="Pattern cards"
              status="Opening pattern cards…"
              className="learn-main pattern-cards-main"
            />
          }
        >
          <PatternCardsPage openRep={openRep} onLessons={() => setView('knowledge')} />
        </Suspense>
      )
    case 'learn':
      return (
        <Suspense fallback={<RouteLoading eyebrow="Lessons" title="Quick lessons" status="Opening the lessons…" className="learn-main" />}>
          <QuickLessons openRep={openRep} onBrowse={() => setView('knowledge')} onGlossary={props.onGlossary} />
        </Suspense>
      )
    case 'history':
      return (
        <Suspense
          fallback={
            <RouteLoading
              eyebrow="Journal"
              title="Attempt history"
              status="Opening your attempt history…"
              className="history-main"
              actions={journalTabs}
            />
          }
        >
          <HistoryPage history={history} categories={categories} journalTabs={journalTabs} openRep={openRep} />
        </Suspense>
      )
    default:
      return props.children
  }
}

/** The library with its session-only filters. */
function CatalogRoute({
  goalPathId,
  practicePlan,
  repStatus,
  openRep,
  openLesson,
}: {
  goalPathId: string
  practicePlan: PracticePlan
  repStatus: (rep: RepSummary) => string
  openRep: (id: string) => void
  openLesson: (id: string) => void
}) {
  const [query, setQuery] = useSessionPreference<string>('catalogQuery', '')
  const [level, setLevel] = useSessionPreference<string>('catalogLevel', '')
  // The open topic or progress shelf; an older saved topic that no longer exists falls back inside the catalog.
  const [shelf, setShelf] = useSessionPreference<string>('catalogSkill', '')
  const [format, setFormat] = useSessionPreference<string>('catalogFormat', '')
  const dueIds = useMemo(() => new Set(practicePlan.due.map(item => item.repId)), [practicePlan])
  const browseReps = useMemo(
    () => reps.filter(item => (!level || String(repLevel(item.id)) === level) && (!format || (item.format ?? 'algorithm') === format)),
    [level, format],
  )
  const visibleReps = useMemo(
    () => browseReps.filter(item => searchWords(query).every(word => searchText.get(item.id)!.includes(word))),
    [query, browseReps],
  )
  const lessonMatches = useMemo(
    () =>
      query.trim() && !visibleReps.length
        ? skillIndex
            .filter(skill => searchWords(query).every(word => `${skill.title} ${skill.summary}`.toLowerCase().includes(word)))
            .slice(0, 3)
        : [],
    [query, visibleReps.length],
  )
  const setters = { query: setQuery, format: setFormat, level: setLevel }
  return (
    <PracticeCatalog
      goalPathId={goalPathId}
      filters={{ query, format, level }}
      onFilter={(field, value) => setters[field](value)}
      clearFilters={() => {
        setQuery('')
        setFormat('')
        setLevel('')
      }}
      shelf={shelf}
      onShelf={setShelf}
      categories={libraryTopics}
      lessonMatches={lessonMatches}
      openLesson={openLesson}
      visibleReps={visibleReps}
      browseReps={browseReps}
      dueIds={dueIds}
      repStatus={repStatus}
      openRep={openRep}
    />
  )
}

function StartingPoint({ learnerStart, onChoose }: { learnerStart: LearnerStart | null; onChoose: (value: LearnerStart) => void }) {
  return (
    <section className="starting-point" aria-labelledby="starting-point-title">
      <div>
        <span className="home-label">Your starting point</span>
        <h2 id="starting-point-title">Where are you starting?</h2>
        <p>This only changes your next suggested rep. You can open any rep at any time.</p>
      </div>
      <div className="starting-options">
        <button type="button" aria-pressed={learnerStart === 'new'} onClick={() => onChoose('new')}>
          <strong>New to coding</strong>
          <span>Start with TypeScript building blocks.</span>
        </button>
        <button type="button" aria-pressed={learnerStart === 'returning'} onClick={() => onChoose('returning')}>
          <strong>Returning to coding</strong>
          <span>Start with guided problem solving.</span>
        </button>
      </div>
    </section>
  )
}
