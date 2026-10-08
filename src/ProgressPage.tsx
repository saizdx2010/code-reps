import { InfoNote, ListRow, PageHeader, StatusChip } from './Layout'
import { useRef } from 'react'
import type { paths } from './path'
import { profileProgress } from './profile-progress'
import type { PortableRecord } from './portability'
import { Button } from './Button'
import { stageLabels } from './learning'
import type { JourneyProgress } from './learning'

type PracticeAction = { title: string; reason: string; label: string; open: () => void }
type Props = {
  profileName: string
  history: PortableRecord[]
  now: number
  onManageProfiles?: () => void
  onOpenPath: (id: typeof paths[number]['id']) => void
  progress: JourneyProgress[]
  recommendation?: PracticeAction
  dueReviews: (PracticeAction & { repId: string })[]
  onOpenRep: (id: string) => void
  onReviewRep: (id: string) => void
  onExport: () => void
  onImport: (file: File) => void
  transferMessage: string
  serverReady: boolean
}

export function ProgressPage({ profileName, history, now, onManageProfiles, onOpenPath, progress, dueReviews, onOpenRep, onReviewRep, onExport, onImport, transferMessage, serverReady }: Props) {
  const summary = profileProgress(history, new Date(now))
  const importRef = useRef<HTMLInputElement | null>(null)
  return <main className="progress-main">
    <PageHeader title={profileName} eyebrow="Your local learning profile" description="Your practice, milestones, and evidence of what stayed with you." actions={onManageProfiles && <Button onClick={onManageProfiles}>Manage profiles</Button>} />
    <dl className="progress-summary profile-summary" aria-label="Practice summary">
      <div><dt>Completed reps</dt><dd>{summary.completedReps}</dd></div>
      <div><dt>Current streak</dt><dd>{summary.currentStreak}<small> days</small></dd></div>
      <div><dt>Longest streak</dt><dd>{summary.longestStreak}<small> days</small></dd></div>
      <div><dt>Practice days</dt><dd>{summary.practiceDays}</dd></div><div><dt>Reviews ready</dt><dd>{dueReviews.length}</dd></div><div><dt>Independent skills</dt><dd>{progress.filter(item => item.independent).length}</dd></div><div><dt>Retained skills</dt><dd>{progress.filter(item => item.retained).length}</dd></div>
    </dl>
    <InfoNote><p>A practice day counts when you finish a rep with checks, a plan, and a reflection. Your current streak stays active through today if you practised yesterday. Breaks are welcome; your milestones stay.</p><p>{summary.badges.filter(badge => badge.earned).length} badges earned. Finish every rep in a path to earn its badge. Completion can include hints; independent skill and retention have separate evidence. Hints remain visible in History, but a hinted attempt cannot establish independence or retention. These are skill-specific observations, not an overall coding score.</p></InfoNote>
    <section className="profile-badges" aria-labelledby="profile-badges-title">
      <h2 id="profile-badges-title">Path completion badges</h2>
      <ul className="compact-path-list">{summary.badges.map(badge => <ListRow key={badge.id} title={badge.title} meta={<>{badge.completed} of {badge.total} reps completed<progress value={badge.completed} max={badge.total} aria-label={`${badge.title} completion`} /></>} status={badge.earned && <StatusChip tone="success">Completed</StatusChip>} onOpen={() => onOpenPath(badge.id)} />)}</ul>
    </section>
    {dueReviews.length > 0 && <details className="progress-reviews"><summary>Choose a review · {dueReviews.length} ready</summary><ul>{dueReviews.map(review => <li key={review.repId}><div><strong>{review.title}</strong><p>{review.reason}</p></div><button type="button" className="text-button" onClick={review.open}>{review.label}</button></li>)}</ul></details>}
    <h2 className="progress-skills-title">Your skill journeys</h2>
    {progress.map(({ journey, stage, guided, independent, retained, recallAt, recallDue }) => <details className="progress-journey" aria-labelledby={`progress-${journey.id}`} key={journey.id}>
      <summary className="progress-heading"><div><h2 id={`progress-${journey.id}`}>{journey.title}</h2><p>{retained ? `Recall recorded ${new Date(retained.completedAt).toLocaleDateString()}` : recallDue ? 'Fresh recall is ready now' : recallAt ? `Recall ready ${new Date(recallAt).toLocaleDateString()}` : independent ? 'Independent practice recorded' : guided ? 'Next: solve a related problem without hints' : 'Next: start with guided practice'}</p></div><span className="journey-markers" aria-label={stageLabels[stage]}>{[['Guided', Boolean(guided)], ['Independent', Boolean(independent)], ['Recall', Boolean(retained)]].map(([label, complete]) => <span key={String(label)} role="img" aria-label={`${label}: ${complete ? 'recorded' : 'not recorded'}`} data-complete={complete}>{label}</span>)}</span></summary>
      <ol className="evidence-list">
        <li><strong>1. Guided practice</strong><span>{guided ? `Completed ${new Date(guided.completedAt).toLocaleDateString()}${guided.hintCount ? ` with ${guided.hintCount} hint(s)` : ' without hints'}` : 'Start with a guided rep.'}</span><button type="button" className="text-button" onClick={() => onOpenRep(journey.guided)}>Open rep</button></li>
        <li><strong>2. Independent problem</strong><span>{independent ? `Solved without hints ${new Date(independent.completedAt).toLocaleDateString()}` : 'Solve a related problem without hints after guided practice.'}</span><button type="button" className="text-button" disabled={!guided} onClick={() => onReviewRep(journey.independent)}>{!guided ? 'After guided rep' : independent ? 'Open rep' : 'Try rep'}</button></li>
        <li><strong>3. Later recall</strong><span>{retained ? `Fresh problem solved without hints ${new Date(retained.completedAt).toLocaleDateString()}` : recallAt ? recallDue ? 'Ready now. Solve a fresh problem without hints.' : `Ready ${new Date(recallAt).toLocaleDateString()}. A later attempt is needed for retention.` : 'Available after an independent solve.'}</span><button type="button" className="text-button" disabled={!recallDue} onClick={() => onReviewRep(journey.recall)}>{recallDue ? 'Try recall' : retained ? 'Evidence recorded' : 'Available later'}</button></li>
      </ol>
    </details>)}
    <details className="local-data"><summary>Back up or restore practice</summary><section aria-labelledby="local-data-title"><div><h2 id="local-data-title">Your work stays yours</h2><p>{serverReady ? 'Progress is saved on this laptop.' : 'Progress is saved in this browser.'} Download a practice backup to carry it elsewhere. Use Profiles to export a full profile.</p><p>Import adds completed attempts and fills empty drafts. Existing drafts stay as they are.</p></div><div className="local-data-actions"><button type="button" onClick={onExport}>Download backup</button><button type="button" onClick={() => importRef.current?.click()}>Import backup</button><input ref={importRef} type="file" accept=".json,application/json" aria-label="Choose Code Reps backup" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = '' }} /></div>{transferMessage && <p className="transfer-message" role="status">{transferMessage}</p>}</section></details>
  </main>
}
