import type { PracticeSession } from './practice-sessions'
import type { ReactNode } from 'react'
import { preloadEditor } from './editor-loader'
import { Icon } from './Icon'
import { Button } from './Button'
import { repPracticeContext } from './curriculum'
import { InfoNote, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { Trail } from './Trail'
import type { buildTrail } from './trail-map'
import { repIndex as reps } from './catalog-index'
import { paths } from './path'
import type { LearnerStart } from './learning'
import type { getPracticePlan, PracticeAction } from './practice'

type Props = {
  walkthroughSeen: boolean
  hasCompletedRep: boolean
  launchWalkthrough: () => void
  sessionBusy: boolean
  startPractice: (action: PracticeAction) => void
  unfinishedSessions: PracticeSession[]
  resumeSession: (repId: string) => void
  onPracticeHistory: () => void
  goalPathId: string
  onPath: (id: (typeof paths)[number]['id']) => void
  learnerStart: LearnerStart | null
  startingPoint: ReactNode
  practicePlan: ReturnType<typeof getPracticePlan>
  draftQueue: 'short' | 'all'
  setDraftQueue: (value: 'short' | 'all') => void
  reviewQueue: 'short' | 'all'
  setReviewQueue: (value: 'short' | 'all') => void
  repStatus: (rep: (typeof reps)[number]) => string
  openPracticeAction: (action: PracticeAction) => void
  actionLabel: (mode: string) => string
  onProgress: () => void
  onSkillMap: () => void
  onPlan: () => void
  trail: ReturnType<typeof buildTrail>
  evidence: (repId: string) => string
  openRep: (id: string) => void
  openLesson: (skillId: string) => void
}

const title = (id: string) => reps.find(item => item.id === id)?.title

/** Home is the learner's trail: the goal drawn as connected stages, with the next useful action beside it. */
export function HomePage({ walkthroughSeen, hasCompletedRep, launchWalkthrough, sessionBusy, startPractice, unfinishedSessions, resumeSession, onPracticeHistory, goalPathId, onPath, learnerStart, startingPoint, practicePlan, draftQueue, setDraftQueue, reviewQueue, setReviewQueue, repStatus, openPracticeAction, actionLabel, onProgress, onSkillMap, onPlan, trail, evidence, openRep, openLesson }: Props) {
  const goal = paths.find(path => path.id === goalPathId) ?? paths[0]
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && reps.find(rep => rep.id === recommendation.repId)
  const context = recommendation && repPracticeContext(recommendation.repId)
  const choices = [
    practicePlan.unfinished[0] && { label: 'Continue saved draft', action: practicePlan.unfinished[0] },
    practicePlan.recommended && { label: 'Recommended next rep', action: practicePlan.recommended },
    practicePlan.due[0] && { label: 'Due review', action: practicePlan.due[0] },
  ].filter(item => item !== null && item !== undefined)
  const sessions = [...new Map(unfinishedSessions.map(record => [record.repId, record])).values()].slice(0, 3)
  const startLabel = learnerStart === 'new' ? 'New to coding' : learnerStart === 'returning' ? 'Returning to coding' : 'Not chosen yet'
  return <main className="home-main trail-home" id="top">
    <div className="trail-layout">
      <aside className="trail-aside" aria-label="Up next">
        {recommendation && recommendedRep ? <section className="continue-panel" aria-labelledby="continue-heading">
          <div>
            <span className="home-label">{recommendation.mode === 'review' ? 'Ready to review' : recommendation.mode === 'resume' ? 'Your saved draft' : 'Next practice'}</span>
            <h2 id="continue-heading">{recommendedRep.title}</h2>
            <p>{recommendation.reason} {!recommendation.reason.includes(context!.reason) && context!.reason}</p>
            <p>{context!.afterward}</p>
            <span className="continue-status">{recommendedRep.category}<span>{repStatus(recommendedRep)}</span></span>
          </div>
          <Button variant="primary" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openPracticeAction(recommendation)}>{actionLabel(recommendation.mode)}<Icon name="arrow" /></Button>
          {!walkthroughSeen && <Button variant="text" className="continue-guide" onClick={launchWalkthrough}>Show me how a rep works</Button>}
        </section> : <section className="continue-panel" aria-labelledby="continue-heading">
          <div>
            <span className="home-label">Caught up for now</span>
            <h2 id="continue-heading">Your next review can wait.</h2>
            <p>No unfinished reps or reviews are ready. Check your skill evidence or choose a rep to practice again.</p>
          </div>
          <button className="primary-button" type="button" onClick={onProgress}>See progress</button>
        </section>}
        <details className="starting-point-settings">
          <summary>Starting as: <strong>{startLabel}</strong> · {learnerStart ? 'Change' : 'Choose'}</summary>
          {startingPoint}
        </details>
        {recommendation && hasCompletedRep && <button type="button" className="text-button" disabled={sessionBusy} onClick={() => startPractice(recommendation)}>Record a session</button>}
        {choices.some(item => item.action.repId !== recommendation?.repId) && <ListGroup title="Choose today's practice" open>
          {choices.map(({ label, action }) => <ListRow key={label} title={title(action.repId)} meta={label} status={<StatusChip tone={action.mode === 'resume' ? 'progress' : action.mode === 'review' ? 'attention' : 'neutral'}>{action.mode === 'resume' ? 'Saved' : label === 'Due review' ? 'Due' : 'Next'}</StatusChip>} onOpen={() => openPracticeAction(action)} onPreview={preloadEditor} />)}
        </ListGroup>}
        {sessions.length > 0 && <section className="home-sessions trail-queue" aria-labelledby="unfinished-sessions-title"><h2 id="unfinished-sessions-title">Unfinished sessions</h2><ul>{sessions.map(record => <li key={record.id}><span>{title(record.repId)}</span><button type="button" className="text-button" disabled={sessionBusy} onClick={() => resumeSession(record.repId)}>Resume session</button></li>)}</ul><button type="button" className="text-button" onClick={onPracticeHistory}>View practice history</button></section>}
        {practicePlan.unfinished.length > 0 && <section className="practice-queue trail-queue" aria-labelledby="unfinished-heading">
          <h2 id="unfinished-heading">Your unfinished work <span>{practicePlan.unfinished.length}</span></h2>
          <ul id="home-drafts">{(draftQueue === 'all' ? practicePlan.unfinished : practicePlan.unfinished.slice(0, 3)).map(action => <li key={action.repId}>
            <span>{title(action.repId)}</span>
            <button className="text-button" type="button" onClick={() => openPracticeAction(action)}>Continue rep</button>
          </li>)}</ul>
          {practicePlan.unfinished.length > 3 && <button type="button" className="text-button" aria-expanded={draftQueue === 'all'} aria-controls="home-drafts" onClick={() => setDraftQueue(draftQueue === 'all' ? 'short' : 'all')}>{draftQueue === 'all' ? 'Show fewer drafts' : `Show all ${practicePlan.unfinished.length} drafts`}</button>}
        </section>}
        {practicePlan.due.length > 0 && <section className="practice-queue trail-queue" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading">Ready to review <span>{practicePlan.due.length}</span></h2>
          <ul id="home-reviews">{(reviewQueue === 'all' ? practicePlan.due : practicePlan.due.slice(0, 3)).map(action => <li key={action.repId}>
            <span>{title(action.repId)}</span>
            <button className="text-button" type="button" onClick={() => openPracticeAction(action)}>{action.mode === 'resume' ? 'Continue recall' : 'Start review'}</button>
          </li>)}</ul>
          {practicePlan.due.length > 3 && <button type="button" className="text-button" aria-expanded={reviewQueue === 'all'} aria-controls="home-reviews" onClick={() => setReviewQueue(reviewQueue === 'all' ? 'short' : 'all')}>{reviewQueue === 'all' ? 'Show fewer reviews' : `Show all ${practicePlan.due.length} reviews`}</button>}
        </section>}
        <nav className="trail-links" aria-label="Plan and progress">
          {hasCompletedRep && <button type="button" className="text-button" onClick={onPlan}><Icon name="calendar" />Plan this week</button>}
          <button type="button" className="text-button" onClick={onSkillMap}>See your skill map</button>
          <button type="button" className="text-button" onClick={onProgress}>View skill evidence</button>
        </nav>
        <InfoNote label="How a rep works"><p>Understand the brief, plan, solve with checks, explain, then review. Work stays on this device. Opening a rep records no session. Complete rep saves an attempt; Reflect and end session ends a session.</p>{walkthroughSeen && <Button variant="text" onClick={launchWalkthrough}>Replay walkthrough</Button>}</InfoNote>
      </aside>
      <section className="trail-column home-goal" aria-label="Learning goal">
        <PageHeader eyebrow="Your trail · Active learning goal" title={goal.title} description={`${trail.done} of ${trail.total} reps completed. Lessons appear just before the reps that use them.`} actions={<button type="button" className="text-button" onClick={() => onPath(goal.id)}>View or choose goal</button>} />
        <p className="goal-browsing-note">Browsing another track does not change your learning goal.</p>
        <div className="path-progress" role="progressbar" aria-label="Trail progress" aria-valuenow={trail.done} aria-valuemin={0} aria-valuemax={trail.total}><span style={{ width: `${trail.total ? trail.done / trail.total * 100 : 0}%` }} /></div>
        <Trail stages={trail.stages} evidence={evidence} onOpenRep={openRep} onOpenLesson={openLesson} onOpenFoundations={() => onPath('typescript')} />
      </section>
    </div>
  </main>
}
