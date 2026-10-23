import { reducedMotion } from './ui-motion'
import { Button } from './Button'
import { useRef } from 'react'
import { Icon } from './Icon'
import { foundationsPathId, trackBuildsOn, trackGroups } from './curriculum'
import { Select } from './Input'
import { InfoNote, PageHeader } from './Layout'
import { PathIntroduction } from './PathIntroduction'
import { Trail } from './Trail'
import type { buildTrail } from './trail-map'
import { paths } from './path'
import { pathIntroductions } from './path-introductions'
import { goToView } from './ui-navigation'
import { stageTexts, trackDescriptions } from './path-text'
import type { LearnerStart } from './learning'

type PathId = (typeof paths)[number]['id']
type Props = {
  goalPathId: string
  setGoalPath: (id: PathId) => void
  goalError: string
  pathId: PathId
  setPathId: (id: PathId) => void
  learnerStart: LearnerStart | null
  /** Chooses where the learner starts; the choice shows in a disclosure above the tracks. */
  onLearnerStart?: (value: LearnerStart) => void
  completedPathIds: Set<string>
  trail: ReturnType<typeof buildTrail>
  evidence: (repId: string) => string
  openRep: (id: string) => void
  openLesson: (skillId: string) => void
}

/** All tracks: Foundations first, then the tracks that build on it, and the selected track's trail. */
export function PathsPage(props: Props) {
  const { goalPathId, setGoalPath, goalError, pathId, setPathId, learnerStart, onLearnerStart } = props
  const { completedPathIds, trail, evidence, openRep, openLesson } = props
  const goalLine = useRef<HTMLParagraphElement>(null)
  const selectedPath = paths.find(path => path.id === pathId) ?? paths[0]
  const refresher = learnerStart === 'returning' && selectedPath.id === foundationsPathId
  // The goal's trail is already drawn on Your trail, so this page links there instead of drawing it twice.
  const isGoal = goalPathId === selectedPath.id
  const pathIntroduction = refresher
    ? {
        ...pathIntroductions[selectedPath.id],
        title: 'A quick TypeScript refresher',
        next:
          'You can revisit the language basics above whenever you need them. ' +
          'Start with a guided array rep, then solve a related task on your own.',
      }
    : pathIntroductions[selectedPath.id]
  const firstRepId = trail.stages
    .flatMap(stage => stage.nodes)
    .find(node => node.kind === 'rep')
    ?.id.slice(4)
  const count = (id: string) => {
    const ids = [...new Set(paths.find(path => path.id === id)!.stages.flatMap(stage => stage.repIds))]
    return `${ids.filter(item => completedPathIds.has(item)).length} of ${ids.length} reps completed`
  }
  function choose(id: PathId) {
    setPathId(id)
    requestAnimationFrame(() => {
      const heading = document.getElementById('path-title')
      heading?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'instant' : 'smooth' })
      heading?.focus({ preventScroll: true })
    })
  }
  const choice = (id: PathId, wide = false) => {
    const path = paths.find(item => item.id === id)!
    return (
      <button key={id} type="button" className={wide ? 'track-root' : undefined} aria-pressed={pathId === id} onClick={() => choose(id)}>
        <strong>{path.title}</strong>
        <span>{trackDescriptions[path.id]}</span>
        <small>
          {count(id)}
          {goalPathId === id ? ' · Your goal' : ''}
          {trackBuildsOn[id] ? ` · Builds on ${paths.find(item => item.id === trackBuildsOn[id])!.title}` : ''}
        </small>
      </button>
    )
  }
  return (
    <main className="paths-main">
      <PageHeader
        title="Choose a track"
        description="Every track builds on Foundations. Follow one as your goal or browse any of them freely."
      />
      {onLearnerStart && (
        <details className="starting-point-settings">
          <summary>
            Starting as:{' '}
            <strong>
              {learnerStart === 'new' ? 'New to coding' : learnerStart === 'returning' ? 'Returning to coding' : 'Not chosen yet'}
            </strong>{' '}
            · {learnerStart ? 'Change' : 'Choose'}
          </summary>
          <StartingPoint learnerStart={learnerStart} onChoose={onLearnerStart} />
        </details>
      )}
      {/* Every track at a glance on a wide screen; a narrow screen gets the same choice as one menu. */}
      <label className="path-select track-menu">
        Choose track
        <Select value={selectedPath.id} onChange={event => setPathId(event.target.value as PathId)}>
          {paths.map(path => (
            <option key={path.id} value={path.id}>
              {path.title}
              {goalPathId === path.id ? ' (your goal)' : ''}
            </option>
          ))}
        </Select>
      </label>
      <div className="track-map" role="group" aria-label="Learning tracks">
        <div className="path-choices track-foundations">
          <span className="home-label">Start here</span>
          {choice(foundationsPathId, true)}
        </div>
        {trackGroups.map(group => (
          <div key={group.title} className="track-group">
            <span className="home-label">{group.title}</span>
            <div className="path-choices">{group.pathIds.map(id => choice(id))}</div>
          </div>
        ))}
      </div>
      {/* The selected card already describes the track; this bar names it and holds its goal and next step. */}
      <section className="path-overview" aria-labelledby="path-title">
        <div>
          <h2 id="path-title" tabIndex={-1}>
            {refresher ? 'Return to problem solving' : selectedPath.title}
          </h2>
          {refresher && <p>Start with guided problems, then revisit skills without hints after a break.</p>}
          <div className="path-goal">
            <p ref={goalLine} tabIndex={-1} role="status">
              {/* Keyed so a newly chosen goal settles in; the live region itself stays mounted and announces it. */}
              <span key={isGoal ? 'goal' : 'browsing'}>
                {isGoal ? 'Your learning goal.' : 'Browsing this track does not change your learning goal.'}
              </span>
            </p>
            {!isGoal && (
              <Button
                variant="text"
                onClick={() => {
                  setGoalPath(selectedPath.id)
                  // The button leaves once the goal is saved; keep keyboard focus on the line that confirms it.
                  requestAnimationFrame(() => {
                    if (document.activeElement === document.body) goalLine.current?.focus()
                  })
                }}
              >
                Use this as my learning goal
              </Button>
            )}
            {goalError && <p role="alert">{goalError}</p>}
          </div>
        </div>
        <div className="path-overview-action">
          {/* The cards already show each track's count; the menu on narrow screens does not, so the bar does there. */}
          <span className="continue-status path-overview-count">
            {trail.done} of {trail.total} reps completed
          </span>
          {trail.nextRepId && (
            <Button variant="primary" onClick={() => openRep(trail.nextRepId!)}>
              {trail.done === 0 ? 'Start track' : 'Continue track'}
              <Icon name="arrow" />
            </Button>
          )}
        </div>
      </section>
      <div
        className="path-progress"
        role="progressbar"
        aria-label="Track progress"
        aria-valuenow={trail.done}
        aria-valuemin={0}
        aria-valuemax={trail.total}
      >
        <span style={{ width: `${trail.total ? (trail.done / trail.total) * 100 : 0}%` }} />
      </div>
      <InfoNote label="What track progress counts">
        <p>
          Track completion records finished reps, including hinted work. Independence and retention use separate skill evidence: a guided
          rep, a related rep without hints, then a fresh recall after a break.
        </p>
      </InfoNote>
      <details className="path-intro-details">
        <summary>Introduction: {pathIntroduction.title}</summary>
        <PathIntroduction introduction={pathIntroduction} onStart={() => firstRepId && openRep(firstRepId)} />
      </details>
      {isGoal ? (
        <p className="quiet-line">
          <span>Its stages are drawn on Your trail.</span>
          <Button variant="text" onClick={() => goToView('home')}>
            Open Your trail
            <Icon name="arrow" />
          </Button>
        </p>
      ) : (
        <Trail
          stages={trail.stages}
          text={stageTexts[selectedPath.id]}
          evidence={evidence}
          onOpenRep={openRep}
          onOpenLesson={openLesson}
          onOpenTrack={id => choose(id as PathId)}
        />
      )}
    </main>
  )
}

/** The starting question: new to coding or returning. It only changes the suggested next rep. */
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
