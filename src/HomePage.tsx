import { lazy, Suspense, useState } from 'react'
import { preloadPractice } from './editor-loader'
import { Icon } from './Icon'
import { Button } from './Button'
import { repCurriculumRole, repPracticeContext } from './curriculum'
import type { LearnerStart } from './learning'
import { effortRange } from './rep-guidance'
import { repLevelLabel } from './rep-levels.ts'
import { ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { Trail } from './Trail'
import type { buildTrail } from './trail-map'
import { repSummaryById, repTitle } from './rep-index.ts'
import { paths } from './path'
import { usePathText } from './usePathText'
import type { getPracticePlan, PracticeAction } from './practice'
import { withoutGoal } from './practice-actions'
import type { PortableRecord } from './portability'
import type { FluencyState } from './fluency'
import type { SetItem } from './warmup'

// Today's plan loads beside the trail; it starts loading as soon as Trail renders. If it cannot load, due reviews stay
// one link away on Progress.
const TodayPlan = lazy(() =>
  import('./TodayPlan').catch(() => ({
    // The warm-up offer lives in the same module, so a failed load still offers it here.
    default: ({ onAllReviews, warmup, startWarmup }: { onAllReviews: () => void; warmup: string[]; startWarmup: () => void }) => (
      <p className="today-more" role="status">
        Today's plan could not load. Reload to try again, or{' '}
        <Button variant="text" onClick={onAllReviews}>
          see due reviews on Progress
        </Button>
        {warmup.length >= 2 && (
          <>
            {' '}
            or{' '}
            <Button variant="text" onClick={startWarmup}>
              start a quick warm-up
            </Button>
          </>
        )}
        .
      </p>
    ),
  })),
)

// The first four weeks load beside the trail too; without them the trail and Today are unchanged.
const StarterProgramCard = lazy(() => import('./StarterProgram').catch(() => ({ default: () => null })))

// The first-rep walkthrough is authored for this rep only.
const walkthroughRepId = 'declare-variables'

type Props = {
  walkthroughSeen: boolean
  launchWalkthrough: () => void
  goalPathId: string
  onPath: (id: (typeof paths)[number]['id']) => void
  practicePlan: ReturnType<typeof getPracticePlan>
  openPracticeAction: (action: PracticeAction) => void
  actionLabel: (mode: string) => string
  onProgress: () => void
  onLibrary: () => void
  trail: ReturnType<typeof buildTrail>
  evidence: (repId: string) => string
  openRep: (id: string) => void
  openLesson: (skillId: string) => void
  learnerStart: LearnerStart | null
  onLearnerStart: (value: LearnerStart) => void
  history: PortableRecord[]
  now: number
  learning: FluencyState
  warmup: string[]
  startWarmup: () => void
  startSet: (items: SetItem[]) => void
}

const modeLabel = (mode?: string) =>
  mode === 'review'
    ? 'Ready to review'
    : mode === 'resume'
      ? 'Continue your draft'
      : mode === 'retry'
        ? 'Try it without hints'
        : 'Next practice'
const stageNumber = (index: number) => `Stage ${String(index + 1).padStart(2, '0')}`
const shortEffort = (repId: string) =>
  effortRange(repId)
    .replace(/, plus time to build$/, '')
    .replace(' minutes', ' min')

/** Home is the learner's trail: the goal drawn as connected stages, with the next useful action beside it. */
export function HomePage(props: Props) {
  const { walkthroughSeen, launchWalkthrough, goalPathId, onPath, practicePlan, openPracticeAction, actionLabel } = props
  const { onProgress, onLibrary, trail, evidence, openRep, openLesson, learnerStart, onLearnerStart, warmup, startWarmup } = props
  const pathText = usePathText()
  const goal = paths.find(path => path.id === goalPathId) ?? paths[0]
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && repSummaryById.get(recommendation.repId)
  const context = recommendation && repPracticeContext(recommendation.repId)
  const draft = practicePlan.unfinished.find(action => action.repId !== recommendation?.repId)
  const moreDrafts = practicePlan.unfinished.filter(action => action.repId !== recommendation?.repId).length - (draft ? 1 : 0)
  const stageOf = (repId: string) => trail.stages.findIndex(stage => stage.nodes.some(node => node.kind === 'rep' && node.repId === repId))
  const where = (repId: string) => {
    const index = stageOf(repId)
    return index >= 0 ? `${stageNumber(index)} · ${trail.stages[index].title}` : (repSummaryById.get(repId)?.category ?? '')
  }
  // The starting question belongs to a learner's very first visit: nothing finished, nothing started, nothing chosen.
  const asksStart = learnerStart === null && trail.done === 0 && practicePlan.unfinished.length === 0 && practicePlan.due.length === 0
  const [startChange, setStartChange] = useState<LearnerStart | null>(null)
  // The panel settles in when its rep changes in place (after a starting choice), never on the page's own arrival.
  const [shownRep, setShownRep] = useState(recommendation?.repId)
  const [changedRep, setChangedRep] = useState<string>()
  if (shownRep !== recommendation?.repId) {
    setShownRep(recommendation?.repId)
    setChangedRep(recommendation?.repId)
  }
  function chooseStart(value: LearnerStart) {
    onLearnerStart(value)
    setStartChange(value)
  }
  const chips = (repId: string) => {
    const role = repCurriculumRole(repId)
    return [repLevelLabel(repId), role === 'Application' ? '' : role, shortEffort(repId)].filter(Boolean)
  }
  const reason = recommendation && context ? (recommendation.mode === 'start' ? context.reason : withoutGoal(recommendation.reason)) : ''
  const recommendedStage = recommendation ? stageOf(recommendation.repId) : -1
  return (
    <main className="home-main trail-home" id="top">
      <div className="trail-layout">
        {/* The goal's heading comes first in reading order, so on a phone the page starts with its title, not a panel. */}
        <div className="trail-head">
          <PageHeader
            eyebrow="Your goal"
            title={goal.title}
            description={`${trail.done} of ${trail.total} reps completed`}
            actions={
              <Button variant="text" onClick={() => onPath(goal.id)}>
                View or choose goal
              </Button>
            }
          />
          <div
            className="path-progress"
            role="progressbar"
            aria-label="Trail progress"
            aria-valuenow={trail.done}
            aria-valuemin={0}
            aria-valuemax={trail.total}
          >
            <span style={{ width: `${trail.total ? (trail.done / trail.total) * 100 : 0}%` }} />
          </div>
        </div>
        <aside className="trail-aside" aria-label="Up next">
          {recommendation && recommendedRep ? (
            <section className="continue-panel" aria-labelledby="continue-heading">
              <div key={recommendation.repId} className={`continue-body${changedRep === recommendation.repId ? ' is-changed' : ''}`}>
                <span className="home-label">
                  {modeLabel(recommendation.mode)}
                  {recommendedStage >= 0 ? ` · ${stageNumber(recommendedStage)}` : ''}
                </span>
                <h2 id="continue-heading">{recommendedRep.title}</h2>
                <p>{reason}</p>
                <span className="continue-chips">
                  {chips(recommendation.repId).map(chip => (
                    <StatusChip key={chip}>{chip}</StatusChip>
                  ))}
                </span>
              </div>
              <Button
                variant="primary"
                onMouseEnter={() => preloadPractice(recommendation.repId)}
                onFocus={() => preloadPractice(recommendation.repId)}
                onClick={() => openPracticeAction(recommendation)}
              >
                {actionLabel(recommendation.mode)}
                <Icon name="arrow" />
              </Button>
              {!walkthroughSeen && recommendation.repId === walkthroughRepId && (
                <Button variant="text" className="continue-guide" onClick={launchWalkthrough}>
                  Show me how a rep works
                </Button>
              )}
              {asksStart && (
                <p className="continue-start">
                  <span>Coming back to coding?</span>
                  <Button variant="text" onClick={() => chooseStart('returning')}>
                    Skip the language basics
                  </Button>
                </p>
              )}
            </section>
          ) : (
            <section className="continue-panel" aria-labelledby="continue-heading">
              <div>
                <span className="home-label">Caught up for now</span>
                <h2 id="continue-heading">Your next review can wait.</h2>
                <p>No unfinished reps or reviews are ready. Check your skill evidence or choose a rep to practice again.</p>
              </div>
              <Button variant="primary" onClick={onProgress}>
                See progress
              </Button>
            </section>
          )}
          <p className="visually-hidden" role="status">
            {startChange && recommendedRep ? `Your next rep is now ${recommendedRep.title}.` : ''}
          </p>
          {startChange && (
            <p className="trail-notice">
              <Icon name="check" />
              <span>
                {startChange === 'returning' ? 'Starting as returning to coding. ' : 'Starting with the language basics. '}
                <Button variant="text" onClick={() => chooseStart(startChange === 'returning' ? 'new' : 'returning')}>
                  {startChange === 'returning' ? 'Undo' : 'Skip them instead'}
                </Button>
              </span>
            </p>
          )}
          <Suspense fallback={null}>
            <TodayPlan
              history={props.history}
              now={props.now}
              practicePlan={practicePlan}
              hasNext={Boolean(recommendation)}
              nextRepId={recommendation?.repId}
              where={repId => (stageOf(repId) >= 0 ? stageNumber(stageOf(repId)) : where(repId))}
              onOpen={item => (item.action ? openPracticeAction(item.action) : props.openRep(item.repId))}
              onAllReviews={props.onProgress}
              onStartSet={props.startSet}
              warmup={warmup}
              startWarmup={startWarmup}
            />
          </Suspense>
          {draft && (
            <ListGroup title="Also waiting" open>
              <ListRow
                title={repTitle(draft.repId)}
                meta={moreDrafts > 0 ? `${where(draft.repId)} · ${moreDrafts} more in progress` : where(draft.repId)}
                status={<StatusChip tone="progress">In progress</StatusChip>}
                onOpen={() => openPracticeAction(draft)}
                onPreview={() => preloadPractice(draft.repId)}
              />
            </ListGroup>
          )}
          {moreDrafts > 0 && (
            <p className="trail-more">
              <Button variant="text" onClick={onLibrary}>
                Find saved drafts in the Library
              </Button>
            </p>
          )}
          <Suspense fallback={null}>
            <StarterProgramCard
              history={props.history}
              now={props.now}
              state={props.learning}
              stages={trail.stages}
              openRep={openRep}
              openLesson={openLesson}
            />
          </Suspense>
          <nav className="trail-links" aria-label="Progress">
            <Button variant="text" onClick={onProgress}>
              View your progress
            </Button>
            {walkthroughSeen && (
              <Button variant="text" onClick={launchWalkthrough}>
                Replay walkthrough
              </Button>
            )}
          </nav>
        </aside>
        <section className="trail-column home-goal" aria-label="Learning goal">
          <Trail
            stages={trail.stages}
            text={pathText?.stageTexts[goal.id]}
            evidence={evidence}
            onOpenRep={openRep}
            onOpenLesson={openLesson}
            onOpenTrack={id => onPath(id as (typeof paths)[number]['id'])}
          />
        </section>
      </div>
    </main>
  )
}
