import { preloadEditor } from './editor-loader'
import { Icon } from './Icon'
import { Button } from './Button'
import { repPracticeContext } from './curriculum'
import { ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { Trail } from './Trail'
import type { buildTrail } from './trail-map'
import { repIndex as reps } from './catalog-index'
import { paths } from './path'
import type { getPracticePlan, PracticeAction } from './practice'

type Props = {
  walkthroughSeen: boolean
  launchWalkthrough: () => void
  goalPathId: string
  onPath: (id: (typeof paths)[number]['id']) => void
  practicePlan: ReturnType<typeof getPracticePlan>
  repStatus: (rep: (typeof reps)[number]) => string
  openPracticeAction: (action: PracticeAction) => void
  actionLabel: (mode: string) => string
  onProgress: () => void
  onLibrary: () => void
  trail: ReturnType<typeof buildTrail>
  evidence: (repId: string) => string
  openRep: (id: string) => void
  openLesson: (skillId: string) => void
}

const title = (id: string) => reps.find(item => item.id === id)?.title

/** Home is the learner's trail: the goal drawn as connected stages, with the next useful action beside it. */
export function HomePage({ walkthroughSeen, launchWalkthrough, goalPathId, onPath, practicePlan, repStatus, openPracticeAction, actionLabel, onProgress, onLibrary, trail, evidence, openRep, openLesson }: Props) {
  const goal = paths.find(path => path.id === goalPathId) ?? paths[0]
  const recommendation = practicePlan.next
  const recommendedRep = recommendation && reps.find(rep => rep.id === recommendation.repId)
  const context = recommendation && repPracticeContext(recommendation.repId)
  const draft = practicePlan.unfinished.find(action => action.repId !== recommendation?.repId)
  const review = practicePlan.due.find(action => action.repId !== recommendation?.repId)
  const moreDrafts = practicePlan.unfinished.filter(action => action.repId !== recommendation?.repId).length - (draft ? 1 : 0)
  const moreReviews = practicePlan.due.filter(action => action.repId !== recommendation?.repId).length - (review ? 1 : 0)
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
        {(draft || review) && <ListGroup title="Also waiting" open>
          {draft && <ListRow title={title(draft.repId)} meta={moreDrafts > 0 ? `Saved draft · ${moreDrafts} more saved` : 'Saved draft'} status={<StatusChip tone="progress">Saved</StatusChip>} onOpen={() => openPracticeAction(draft)} onPreview={preloadEditor} />}
          {review && <ListRow title={title(review.repId)} meta={moreReviews > 0 ? `Due review · ${moreReviews} more due` : 'Due review'} status={<StatusChip tone="attention">Due</StatusChip>} onOpen={() => openPracticeAction(review)} onPreview={preloadEditor} />}
        </ListGroup>}
        {(moreDrafts > 0 || moreReviews > 0) && <p className="trail-more">{moreReviews > 0 && <button type="button" className="text-button" onClick={onProgress}>See all due reviews</button>} {moreDrafts > 0 && <button type="button" className="text-button" onClick={onLibrary}>Find saved drafts in the Library</button>}</p>}
        <nav className="trail-links" aria-label="Progress">
          <button type="button" className="text-button" onClick={onProgress}>View your progress</button>
          {walkthroughSeen && <Button variant="text" onClick={launchWalkthrough}>Replay walkthrough</Button>}
        </nav>
      </aside>
      <section className="trail-column home-goal" aria-label="Learning goal">
        <PageHeader eyebrow="Your trail · Active learning goal" title={goal.title} description={`${trail.done} of ${trail.total} reps completed. Lessons appear just before the reps that use them.`} actions={<button type="button" className="text-button" onClick={() => onPath(goal.id)}>View or choose goal</button>} />
        <div className="path-progress" role="progressbar" aria-label="Trail progress" aria-valuenow={trail.done} aria-valuemin={0} aria-valuemax={trail.total}><span style={{ width: `${trail.total ? trail.done / trail.total * 100 : 0}%` }} /></div>
        <Trail stages={trail.stages} evidence={evidence} onOpenRep={openRep} onOpenLesson={openLesson} onOpenFoundations={() => onPath('typescript')} />
      </section>
    </div>
  </main>
}
