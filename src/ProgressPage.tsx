import { formatDate, plural } from './ui-copy.ts'
import { InfoNote, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { profileBadges } from './badges'
import type { Badge } from './badges'
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

export function ProgressPage({ profileName, history, now, onManageProfiles, onOpenPath, progress, recommendation, dueReviews, onOpenRep, onReviewRep, onExport, onImport, transferMessage, serverReady }: Props) {
  const summary = profileProgress(history, new Date(now))
  const badges = profileBadges(history, new Date(now))
  const earned = badges.filter(badge => badge.earned)
  const upcoming = badges.filter(badge => !badge.earned)
  const open = (badge: Badge) => badge.kind === 'path' && badge.pathId ? onOpenPath(badge.pathId as typeof paths[number]['id']) : onOpenRep(badge.repId)
  const importRef = useRef<HTMLInputElement | null>(null)
  return <main className="progress-main">
    <PageHeader title={profileName} eyebrow="Your local learning profile" description="Your practice, milestones, and evidence of what stayed with you." actions={onManageProfiles && <Button onClick={onManageProfiles}>Manage profiles</Button>} />
    {summary.completedReps === 0 && <p>Welcome to your progress. Finish your first rep to start filling this in.{recommendation && <> <Button variant="text" onClick={recommendation.open}>{recommendation.label}</Button></>}</p>}
    <dl className="progress-summary profile-summary" aria-label="Practice summary">
      <div><dt>Completed reps<small>{summary.completedReps === 0 ? 'Finish a rep with checks, writing, and reflection.' : ''}</small></dt><dd>{summary.completedReps}</dd></div>
      <div><dt>Current streak<small>{summary.currentStreak === 0 ? 'Finish a rep to start your streak.' : ''}</small></dt><dd>{summary.currentStreak}<small> {plural(summary.currentStreak, 'day')}</small></dd></div>
      <div><dt>Longest streak<small>{summary.longestStreak === 0 ? 'Finish a rep to start your streak.' : ''}</small></dt><dd>{summary.longestStreak}<small> {plural(summary.longestStreak, 'day')}</small></dd></div>
      <div><dt>Practice days<small>{summary.practiceDays === 0 ? 'Finish a rep to record a practice day.' : ''}</small></dt><dd>{summary.practiceDays}</dd></div><div><dt>Reviews ready<small>{dueReviews.length === 0 ? 'Finish a rep; reviews become ready after a break.' : ''}</small></dt><dd>{dueReviews.length}</dd></div><div><dt>Independent skills<small>{progress.filter(item => item.independent).length === 0 ? 'Solve a related rep without hints after guided practice.' : ''}</small></dt><dd>{progress.filter(item => item.independent).length}</dd></div><div><dt>Retained skills<small>{progress.filter(item => item.retained).length === 0 ? 'Solve a fresh recall rep without hints after a break.' : ''}</small></dt><dd>{progress.filter(item => item.retained).length}</dd></div>
    </dl>
    <InfoNote><p>Finish a rep to record a practice day. If you practised yesterday, your streak stays active through today. Breaks are welcome; your milestones stay.</p><p>Badges count finished reps, including work with hints. To record an independent skill, solve a related rep without hints after guided practice. To record retention, solve a fresh recall rep without hints after a break. Checks show behavior; you review your writing. These records are not an overall coding score.</p></InfoNote>
    <section className="profile-badges" aria-labelledby="profile-badges-title">
      <h2 id="profile-badges-title">Completion badges</h2>
      <p className="badge-count" role="status">{earned.length} of {badges.length} earned. Each finished rep counts once.</p>
      {earned.length > 0 ? <ul className="badge-grid" aria-label="Earned badges">{earned.map(badge => <li key={badge.id} className="badge-card" data-kind={badge.kind}>
        <BadgeArt kind={badge.kind} earned />
        <div className="badge-text"><strong>{badge.name}</strong><span className="badge-rule">{badge.rule}</span><StatusChip tone="success">Earned{badge.earnedAt ? ` ${formatDate(badge.earnedAt)}` : ''}</StatusChip><span className="badge-progress">{badge.completed} of {badge.total} {plural(badge.total, 'rep')}</span></div>
        <button type="button" className="text-button" aria-label={`${badge.kind === 'path' ? 'Open path' : 'Open rep'} for ${badge.name}`} onClick={() => open(badge)}>{badge.kind === 'path' ? 'Open path' : 'Open rep'}</button>
      </li>)}</ul> : <p className="badge-empty">No badges yet. Finish one rep to earn the first.</p>}
      {upcoming.length > 0 && <div className="badge-upcoming"><ListGroup title="Upcoming badges" count={upcoming.length}>{upcoming.map(badge => <ListRow key={badge.id} title={<><BadgeArt kind={badge.kind} earned={false} />{badge.name}</>} meta={<>{badge.rule} {badge.completed} of {badge.total} {plural(badge.total, 'rep')} completed<progress value={badge.completed} max={badge.total} aria-label={`${badge.name} progress`} /></>} status={<StatusChip>{badge.completed > 0 ? 'In progress' : 'Not started'}</StatusChip>} onOpen={() => open(badge)} />)}</ListGroup></div>}
    </section>
    {dueReviews.length > 0 && <details className="progress-reviews"><summary>Choose a review · {dueReviews.length} ready</summary><ul>{dueReviews.map(review => <li key={review.repId}><div><strong>{review.title}</strong><p>{review.reason}</p></div><button type="button" className="text-button" onClick={review.open}>{review.label}</button></li>)}</ul></details>}
    <h2 className="progress-skills-title">Your skill journeys</h2>
    {progress.map(({ journey, stage, guided, independent, retained, recallAt, recallDue }) => <details className="progress-journey" aria-labelledby={`progress-${journey.id}`} key={journey.id}>
      <summary className="progress-heading"><div><h2 id={`progress-${journey.id}`}>{journey.title}</h2><p>{retained ? `Recall recorded ${formatDate(retained.completedAt)}` : recallDue ? 'Fresh recall is ready now' : recallAt ? `Recall ready ${formatDate(recallAt)}` : independent ? 'Independent practice recorded' : guided ? 'Next: solve a related problem without hints' : 'Next: start with guided practice'}</p></div><span className="journey-markers" aria-label={stageLabels[stage]}>{[['Guided', Boolean(guided)], ['Independent', Boolean(independent)], ['Recall', Boolean(retained)]].map(([label, complete]) => <span key={String(label)} role="img" aria-label={`${label}: ${complete ? 'recorded' : 'not recorded'}`} data-complete={complete}>{label}</span>)}</span></summary>
      <ol className="evidence-list">
        <li><strong>1. Guided practice</strong><span>{guided ? `Completed ${formatDate(guided.completedAt)}${guided.hintCount ? ` with ${guided.hintCount} ${plural(guided.hintCount, 'hint')}` : ' without hints'}` : 'Start with a guided rep.'}</span><button type="button" className="text-button" onClick={() => onOpenRep(journey.guided)}>Open rep</button></li>
        <li><strong>2. Independent problem</strong><span>{independent ? `Solved without hints ${formatDate(independent.completedAt)}` : 'Solve a related problem without hints after guided practice.'}</span><button type="button" className="text-button" disabled={!guided} onClick={() => onReviewRep(journey.independent)}>{!guided ? 'After guided rep' : independent ? 'Open rep' : 'Try rep'}</button></li>
        <li><strong>3. Later recall</strong><span>{retained ? `Fresh problem solved without hints ${formatDate(retained.completedAt)}` : recallAt ? recallDue ? 'Ready now. Solve a fresh problem without hints.' : `Ready ${formatDate(recallAt)}. Try a fresh problem then to see what stayed with you.` : 'Available after an independent solve.'}</span><button type="button" className="text-button" disabled={!recallDue} onClick={() => onReviewRep(journey.recall)}>{recallDue ? 'Try recall' : retained ? 'Evidence recorded' : 'Available later'}</button></li>
      </ol>
    </details>)}
    <details className="local-data"><summary>Back up or restore practice</summary><section aria-labelledby="local-data-title"><div><h2 id="local-data-title">Your work stays yours</h2><p>{serverReady ? 'Progress is saved on this laptop.' : 'Progress is saved in this browser.'} Download a practice backup to carry it elsewhere. Use Profiles to export a full profile.</p><p>Import adds completed attempts and fills empty drafts. Existing drafts stay as they are.</p></div><div className="local-data-actions"><button type="button" onClick={onExport}>Download backup</button><button type="button" onClick={() => importRef.current?.click()}>Import backup</button><input ref={importRef} type="file" accept=".json,application/json" aria-label="Choose Code Reps backup" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = '' }} /></div>{transferMessage && <p className="transfer-message" role="status">{transferMessage}</p>}</section></details>
  </main>
}

function BadgeArt({ kind, earned }: { kind: Badge['kind']; earned: boolean }) {
  // Decorative: the badge name, rule, and status chip carry the meaning.
  return <svg className="badge-art" data-earned={earned} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    {kind === 'path' ? <path d="M16 3l11 5v8c0 7-5 11-11 13C10 27 5 23 5 16V8z" /> : kind === 'stage' ? <path d="M16 3l11 6.5v13L16 29 5 22.5v-13z" /> : <circle cx="16" cy="16" r="12" />}
    {earned && <path className="badge-check" d="M10.5 16.5l4 4 7-8" />}
  </svg>
}
