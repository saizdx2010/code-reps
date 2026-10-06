import type { PracticeSession } from './practice-sessions'
import type { ReactNode } from 'react'
import { preloadEditor } from './editor-loader'
import { reps } from './rep'
import type { Rep } from './rep'
import { paths } from './path'
import { stageLabels } from './learning'
import type { LearnerStart } from './learning'
import type { getPracticePlan, PracticeAction } from './practice'

type Props = {
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
  repStatus: (rep: Rep) => string
  openPracticeAction: (action: PracticeAction) => void
  actionLabel: (mode: string) => string
  onProgress: () => void
  onKnowledge: () => void
  onCatalog: () => void
}

export function HomePage({ sessionBusy, startPractice, unfinishedSessions, resumeSession, onPracticeHistory, goalPathId, onPath, learnerStart, startingPoint, practicePlan, draftQueue, setDraftQueue, reviewQueue, setReviewQueue, repStatus, openPracticeAction, actionLabel, onProgress, onKnowledge, onCatalog }: Props) {
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && reps.find(rep => rep.id === recommendation.repId)
  const journeyStates = practicePlan.progress
  const journey = journeyStates.find(item => item.recallDue) ?? journeyStates.find(item => item.nextRepId) ?? journeyStates.find(item => item.stage !== 'retained') ?? journeyStates[0]
  return <main className="home-main" id="top">
    <div className="home-heading">
      <h1 tabIndex={-1}>{learnerStart ? 'Pick up your practice.' : 'Start with what you know.'}</h1>
      <p>One useful rep, then a little reflection. Your work stays on this device.</p>
    </div>
    <section className="home-goal" aria-label="Learning goal"><div><strong>{paths.find(path => path.id === goalPathId)?.title}</strong><p>Follow your ordered path or explicitly choose a different learning goal.</p></div><button type="button" className="text-button" onClick={() => onPath((paths.find(path => path.id === goalPathId) ?? paths[0]).id)}>View or choose goal path</button></section>
    {!learnerStart && <div className="first-run-start">{startingPoint}</div>}
    {recommendation && recommendedRep ? <section className="continue-panel" aria-labelledby="continue-heading">
      <div>
        <span className="home-label">{recommendation.mode === 'review' ? 'Ready to review' : recommendation.mode === 'resume' ? 'Your saved draft' : 'Next practice'}</span>
        <h2 id="continue-heading">{recommendedRep.title}</h2>
        <p>{recommendation.reason}</p>
        <span className="continue-status">{recommendedRep.category}<span>{repStatus(recommendedRep)}</span></span>
      </div>
      <button className="primary-button" type="button" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openPracticeAction(recommendation)}>{actionLabel(recommendation.mode)}</button>
    </section> : <section className="continue-panel" aria-labelledby="continue-heading">
      <div>
        <span className="home-label">Caught up for now</span>
        <h2 id="continue-heading">Your next review can wait.</h2>
        <p>No unfinished reps or reviews are ready. Check your skill evidence or choose a rep to practise again.</p>
      </div>
      <button className="primary-button" type="button" onClick={onProgress}>See progress</button>
    </section>}
    {recommendation && <button type="button" className="text-button" disabled={sessionBusy} onClick={() => startPractice(recommendation)}>Start practice</button>}
    {unfinishedSessions.length > 0 && <section className="home-sessions" aria-labelledby="unfinished-sessions-title"><h2 id="unfinished-sessions-title">Unfinished sessions</h2><p>Resume the saved work in a new session. Earlier sessions remain unfinished.</p><ul>{[...new Map(unfinishedSessions.map(record => [record.repId, record])).values()].slice(0, 3).map(record => <li key={record.id}><span>{reps.find(rep => rep.id === record.repId)?.title}</span><button type="button" className="text-button" disabled={sessionBusy} onClick={() => resumeSession(record.repId)}>Resume practice</button></li>)}</ul><button type="button" className="text-button" onClick={onPracticeHistory}>View practice history</button></section>}
    {practicePlan.unfinished.length > 0 && <section className="practice-queue" aria-labelledby="unfinished-heading">
      <div className="home-section-heading">
        <h2 id="unfinished-heading">Your unfinished work</h2>
        <p>{practicePlan.unfinished.length} saved {practicePlan.unfinished.length === 1 ? 'draft' : 'drafts'}. Continue with your work intact.</p>
      </div>
      <ul id="home-drafts">{(draftQueue==='all'?practicePlan.unfinished:practicePlan.unfinished.slice(0,3)).map(action => <li key={action.repId}>
          <div>
            <strong>{reps.find(item => item.id === action.repId)!.title}</strong>
            <p>{action.reason}</p>
          </div>
          <button className="text-button" type="button" onClick={() => openPracticeAction(action)}>Continue rep</button>
        </li>)}</ul>{practicePlan.unfinished.length>3&&<button type="button" className="text-button" aria-expanded={draftQueue==='all'} aria-controls="home-drafts" onClick={()=>setDraftQueue(draftQueue==='all'?'short':'all')}>{draftQueue==='all'?'Show fewer drafts':`Show all ${practicePlan.unfinished.length} drafts`}</button>}</section>}
    {practicePlan.due.length > 0 && <section className="practice-queue" aria-labelledby="reviews-heading">
      <div className="home-section-heading">
        <h2 id="reviews-heading">Ready to review</h2>
        <p>{practicePlan.due.length} {practicePlan.due.length === 1 ? 'rep is' : 'reps are'} ready. Completed attempts stay in History.</p>
      </div>
      <ul id="home-reviews">{(reviewQueue==='all'?practicePlan.due:practicePlan.due.slice(0,3)).map(action => <li key={action.repId}>
          <div>
            <strong>{reps.find(item => item.id === action.repId)!.title}</strong>
            <p>{action.reason}</p>
          </div>
          <button className="text-button" type="button" onClick={() => openPracticeAction(action)}>{action.mode === 'resume' ? 'Continue recall' : 'Start review'}</button>
        </li>)}</ul>{practicePlan.due.length>3&&<button type="button" className="text-button" aria-expanded={reviewQueue==='all'} aria-controls="home-reviews" onClick={()=>setReviewQueue(reviewQueue==='all'?'short':'all')}>{reviewQueue==='all'?'Show fewer reviews':`Show all ${practicePlan.due.length} reviews`}</button>}</section>}
    <section className="home-journey" aria-labelledby="home-journey-title">
      <div>
        <h2 id="home-journey-title">{journey.journey.title}</h2>
        <p>{journey.stage === 'retained' ? 'You solved a fresh problem after a gap, without hints.' : journey.stage === 'independent' ? journey.recallDue ? 'Your fresh recall problem is ready.' : `You solved a related problem without hints. Return ${new Date(journey.recallAt!).toLocaleDateString()} for a fresh one.` : journey.stage === 'practising' ? 'You completed guided practice. Try a related problem without hints.' : 'Start with a guided rep.'}</p>
      </div>
      <button className="text-button" type="button" onClick={onProgress}>View skill evidence</button>
      <span className="journey-state">{stageLabels[journey.stage]}</span>
    </section>
    {learnerStart && <details className="starting-point-settings">
      <summary>Change starting point</summary>{startingPoint}</details>}
    <nav className="home-discovery" aria-label="Explore Code Reps">
      <button className="text-button" type="button" onClick={onCatalog}>Browse exercises</button>
      <button className="text-button" type="button" onClick={onKnowledge}>Learn a concept</button>
    </nav>
  </main>
}
