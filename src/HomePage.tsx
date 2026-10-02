import type { ReactNode } from 'react'
import { preloadEditor } from './editor-loader'
import { reps } from './rep'
import type { Rep } from './rep'
import { stageLabels } from './learning'
import type { LearnerStart } from './learning'
import type { getPracticePlan, PracticeAction } from './practice'

type Props = {
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

export function HomePage({ learnerStart, startingPoint, practicePlan, draftQueue, setDraftQueue, reviewQueue, setReviewQueue, repStatus, openPracticeAction, actionLabel, onProgress, onKnowledge, onCatalog }: Props) {
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && reps.find(rep => rep.id === recommendation.repId)
  const journeyStates = practicePlan.progress
  const journey = journeyStates.find(item => item.recallDue) ?? journeyStates.find(item => item.nextRepId) ?? journeyStates.find(item => item.stage !== 'retained') ?? journeyStates[0]
  return <main className="home-main" id="top">
    <div className="home-heading">
      <h1 tabIndex={-1}>{learnerStart ? 'Pick up where you left off.' : 'Build the skill to solve it yourself.'}</h1>
      <p>Practice, see what changed, and return to prove what stayed with you. Free on your laptop.</p>
    </div>
    {!learnerStart && <div className="first-run-start">{startingPoint}</div>}
    {recommendation && recommendedRep ? <section className="continue-panel" aria-labelledby="continue-heading">
      <div>
        <span className="home-label">{recommendation.mode === 'review' ? 'READY TO REVIEW' : recommendation.mode === 'resume' ? 'PICK UP YOUR DRAFT' : 'NEXT REP'}</span>
        <h2 id="continue-heading">{recommendedRep.title}</h2>
        <p>{recommendation.reason}</p>
        <span className="continue-status">{repStatus(recommendedRep)} <span aria-hidden="true">/</span> {recommendedRep.category}</span>
      </div>
      <button className="primary-button" type="button" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openPracticeAction(recommendation)}>{actionLabel(recommendation.mode)} <span aria-hidden="true">→</span>
      </button>
    </section> : <section className="continue-panel" aria-labelledby="continue-heading">
      <div>
        <span className="home-label">CAUGHT UP FOR NOW</span>
        <h2 id="continue-heading">Your next review can wait.</h2>
        <p>No unfinished reps or reviews are ready. Check your skill evidence or choose a rep to practise again.</p>
      </div>
      <button className="primary-button" type="button" onClick={onProgress}>See progress →</button>
    </section>}
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
          <button className="text-button" type="button" onClick={() => openPracticeAction(action)}>Continue rep →</button>
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
          <button className="text-button" type="button" onClick={() => openPracticeAction(action)}>{action.mode === 'resume' ? 'Continue recall' : 'Start review'} →</button>
        </li>)}</ul>{practicePlan.due.length>3&&<button type="button" className="text-button" aria-expanded={reviewQueue==='all'} aria-controls="home-reviews" onClick={()=>setReviewQueue(reviewQueue==='all'?'short':'all')}>{reviewQueue==='all'?'Show fewer reviews':`Show all ${practicePlan.due.length} reviews`}</button>}</section>}
    <section className="home-journey" aria-labelledby="home-journey-title">
      <div>
        <span className="home-label">SKILL IN FOCUS</span>
        <h2 id="home-journey-title">{journey.journey.title}</h2>
        <p>{journey.stage === 'retained' ? 'You solved a fresh problem after a gap, without hints.' : journey.stage === 'independent' ? journey.recallDue ? 'Your fresh recall problem is ready.' : `You solved a related problem without hints. Return ${new Date(journey.recallAt!).toLocaleDateString()} for a fresh one.` : journey.stage === 'practising' ? 'You completed guided practice. Try a related problem without hints.' : 'Start with a guided rep.'}</p>
      </div>
      <button className="text-button" type="button" onClick={onProgress}>See your evidence →</button>
      <span className="journey-state">{stageLabels[journey.stage]}</span>
    </section>
    <section className="hub-home-links">
      <h2>Build knowledge and assess your fluency</h2>
      <p>Explore skill lessons, find your starting point, plan a week, and keep a learning notebook.</p>
      <button type="button" className="text-button" onClick={onKnowledge}>Open learning tools →</button>
    </section>{learnerStart && <details className="starting-point-settings">
      <summary>Change starting point</summary>{startingPoint}</details>}
    <section className="home-practice">
      <button className="browse-reps-button" type="button" onClick={onCatalog}>
        <span className="library-copy">
          <span className="home-label">PRACTICE LIBRARY</span>
          <strong>Find a different rep</strong>
          <small>{reps.length} exercises across TypeScript and problem solving</small>
        </span>
        <span className="library-action">Browse reps <span aria-hidden="true">↗</span>
        </span>
      </button>
    </section>
  </main>
}
