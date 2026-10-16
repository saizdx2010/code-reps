import { repTitle } from './rep-index.ts'
import { formatDate, plural } from './ui-copy.ts'
import { InfoNote, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { Icon } from './Icon'
import { withoutGoal } from './practice-actions'
import { profileBadges } from './badges'
import type { Badge } from './badges'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BadgeArt } from './BadgeArt'
import { useSessionPreference } from './useSessionPreference'
import type { paths } from './path'
import { profileProgress } from './profile-progress'
import type { PortableRecord } from './portability'
import type { BackupPreview, RestoreFlow } from './backup'
import { Button } from './Button'
import { stageLabels } from './learning'
import type { JourneyProgress } from './learning'
import { StepIndicator } from './StepIndicator'
import { goToView } from './ui-navigation'

/** Skills has two views: the journey list and the skill map. Both keep their own routes. */
export function SkillsSwitch({ view }: { view: 'progress' | 'skillmap' }) {
  return (
    <div className="segmented-control journal-tabs" role="group" aria-label="Skills view">
      <StepIndicator active={view} selector="button[aria-pressed=true]" />
      <Button aria-pressed={view === 'progress'} onClick={() => goToView('progress')}>
        Journeys
      </Button>
      <Button aria-pressed={view === 'skillmap'} onClick={() => goToView('skillmap')}>
        Skill map
      </Button>
    </div>
  )
}

type PracticeAction = { title: string; reason: string; label: string; open: () => void }
type Props = {
  profileName: string
  history: PortableRecord[]
  now: number
  onManageProfiles?: () => void
  onOpenPath: (id: (typeof paths)[number]['id']) => void
  progress: JourneyProgress[]
  recommendation?: PracticeAction
  dueReviews: (PracticeAction & { repId: string })[]
  onOpenRep: (id: string) => void
  onReviewRep: (id: string) => void
  onExport: () => void
  onImport: (file: File) => void
  transferMessage: string
  transferTone: 'success' | 'error'
  restore: RestoreFlow
  serverReady: boolean
}

export function ProgressPage(props: Props) {
  const { profileName, history, now, onOpenPath, progress, recommendation, dueReviews, onOpenRep, onReviewRep } = props
  // Worked out once per saved history and clock tick, not on every render of the restore controls below.
  const summary = useMemo(() => profileProgress(history, new Date(now)), [history, now])
  const badges = useMemo(() => profileBadges(history, new Date(now)), [history, now])
  const earned = badges.filter(badge => badge.earned)
  const open = (badge: Badge) =>
    badge.kind === 'path' && badge.pathId ? onOpenPath(badge.pathId as (typeof paths)[number]['id']) : onOpenRep(badge.repId)
  // One ladder: every journey sits on exactly one rung, so nothing is counted twice.
  const rungs = ladder(progress)
  const nextRecall = progress
    .filter(item => item.recallAt && !item.retained && !item.recallDue)
    .map(item => item.recallAt!)
    .sort((a, b) => a - b)[0]
  const [firstReview, ...moreReviews] = dueReviews
  const groups = [
    {
      title: 'In progress',
      // Due recall first, then the journeys with the most recent evidence.
      items: progress
        .filter(item => !item.retained && (item.guided || item.independent))
        .sort((a, b) => Number(b.recallDue) - Number(a.recallDue) || lastEvidence(b) - lastEvidence(a)),
      open: true,
    },
    { title: 'Retained', items: progress.filter(item => item.retained), open: false },
    { title: 'Not started', items: progress.filter(item => !item.guided && !item.independent && !item.retained), open: false },
  ].filter(group => group.items.length)
  return (
    <main className="progress-main">
      <PageHeader
        title="Skills"
        eyebrow={`${profileName} · local profile`}
        description="What you have practiced, what stayed with you, and what is due."
        actions={<SkillsSwitch view="progress" />}
      />
      {props.restore.receipt && (
        <div className="feedback-note restore-receipt" data-state="success" role="status">
          <Icon name="check" />
          <span className="restore-receipt-text">{props.restore.receipt}</span>
          <Button variant="text" onClick={props.restore.onDismissReceipt}>
            Dismiss
          </Button>
        </div>
      )}
      {(firstReview || recommendation) && (
        <section className="progress-next" aria-labelledby="progress-next-title">
          {firstReview ? (
            <StatusChip tone="attention">Review due</StatusChip>
          ) : (
            <span className="home-label">{summary.completedReps ? 'Next on your trail' : 'Your first rep'}</span>
          )}
          <div className="progress-next-text">
            <h2 id="progress-next-title">{(firstReview ?? recommendation)!.title}</h2>
            <p>{withoutGoal((firstReview ?? recommendation)!.reason)}</p>
          </div>
          <Button variant="primary" className="progress-next-action" onClick={(firstReview ?? recommendation)!.open}>
            {(firstReview ?? recommendation)!.label}
            <Icon name="arrow" />
          </Button>
          {moreReviews.length > 0 && (
            <details className="progress-more-reviews">
              <summary>
                {moreReviews.length} more {plural(moreReviews.length, 'review')} ready
              </summary>
              <ul className="list-rows">
                {moreReviews.map(review => (
                  <ListRow key={review.repId} title={review.title} meta={review.reason} onOpen={review.open} />
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
      <dl className="progress-summary profile-summary" aria-label="Practice summary">
        <div className="progress-stat">
          <dd>{summary.completedReps}</dd>
          <dt>
            Completed reps
            <small>
              {summary.completedReps
                ? `${summary.attempts} ${plural(summary.attempts, 'attempt')} in all`
                : 'Finish a rep by passing its checks.'}
            </small>
          </dt>
        </div>
        <div className="progress-stat">
          <dd>{dueReviews.length}</dd>
          <dt>
            Reviews ready
            <small>
              {dueReviews.length
                ? 'Start the first one at the top of this page.'
                : nextRecall
                  ? `Next one opens ${formatDate(nextRecall)}.`
                  : summary.completedReps
                    ? 'None scheduled yet.'
                    : 'Reviews open a few days after a rep.'}
            </small>
          </dt>
        </div>
        <div className="progress-days practice-rhythm">
          <dt className="visually-hidden">Practice rhythm</dt>
          <dd>
            <PracticeRhythm summary={summary} />
            <details className="practice-history">
              <summary>
                Last 12 weeks
                <Icon name="chevron" />
              </summary>
              <PracticeCalendar history={history} now={now} />
            </details>
          </dd>
        </div>
        <div className="skill-ladder">
          <dt>
            Skill ladder
            <small>Each of the {progress.length} journey skills on its highest rung</small>
          </dt>
          <dd>
            <span className="skill-ladder-bar" aria-hidden="true">
              {rungs.map(rung => (rung.count ? <span key={rung.id} data-rung={rung.id} style={{ flexGrow: rung.count }} /> : null))}
            </span>
            <ul className="skill-ladder-legend" aria-label="Skills on each rung">
              {rungs.map(rung => (
                <li key={rung.id} data-rung={rung.id}>
                  <span>{rung.label}</span>
                  <b>{rung.count}</b>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <InfoNote>
        <p>
          The ladder goes Not started, Guided (a guided rep finished, hints allowed), Independent (a related rep solved without hints after
          the guided one), then Retained (a fresh recall rep solved without hints after a break). Each skill is counted once, on its highest
          rung. Checks show behavior; you review your writing. These records are not an overall coding score.
        </p>
        <p>
          Finishing a rep or a review records a practice day. A streak counts practice days and carries over one missed day in any seven;
          two missed days in a row end it, and if you practiced yesterday it stays active through today. Breaks are welcome; your milestones
          stay.
        </p>
      </InfoNote>
      <h2 className="progress-skills-title">Your skill journeys</h2>
      <div className="journey-groups">
        {groups.map(group => (
          // With nothing started yet, the journeys are the page, so that group starts open.
          <ListGroup key={group.title} title={group.title} count={group.items.length} open={group.open || groups.length === 1}>
            {group.items.map(item => (
              <li key={item.journey.id}>
                <JourneyEvidence progress={item} onOpenRep={onOpenRep} onReviewRep={onReviewRep} />
              </li>
            ))}
          </ListGroup>
        ))}
      </div>
      <section className="profile-badges" aria-labelledby="profile-badges-title">
        <h2 id="profile-badges-title">Badges earned</h2>
        <p className="badge-count" role="status">
          {earned.length} earned. Evidence first, then completion; each links to the work that earned it.
        </p>
        {earned.length > 0 ? (
          <EarnedBadges earned={earned} onOpen={open} />
        ) : (
          <p className="badge-empty">No badges yet. Finish one rep to earn the first.</p>
        )}
      </section>
      <nav className="progress-quiet-links" aria-label="More ways to practice">
        <Button variant="text" onClick={() => goToView('plan')}>
          Plan a practice week
          <Icon name="arrow" />
        </Button>
        <Button variant="text" onClick={() => goToView('assessment')}>
          Take the self-assessment
          <Icon name="arrow" />
        </Button>
      </nav>
      <BackupSection
        serverReady={props.serverReady}
        onExport={props.onExport}
        onImport={props.onImport}
        transferMessage={props.transferMessage}
        transferTone={props.transferTone}
        restore={props.restore}
      />
    </main>
  )
}

const lastEvidence = (item: JourneyProgress) =>
  Math.max(0, ...[item.guided, item.independent, item.retained].map(record => (record ? Date.parse(record.completedAt) : 0)))

/** Each journey on its highest rung, in ladder order. */
function ladder(progress: JourneyProgress[]) {
  const count = (stage: JourneyProgress['stage']) => progress.filter(item => item.stage === stage).length
  // Highest rung first; the ids are the saved evidence stages, so they come from the shared label map.
  return (Object.keys(stageLabels) as (keyof typeof stageLabels)[]).reverse().map(stage => ({
    id: stage,
    label: stageLabels[stage],
    count: count(stage),
  }))
}

/**
 * Twelve weeks of practice days, Monday to Sunday down each column. A day with a hint-free completion is darker.
 * Decorative grid with a text summary: the counts above carry the meaning.
 */
function PracticeCalendar({ history, now }: { history: PortableRecord[]; now: number }) {
  const key = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  const days = new Map<string, 'any' | 'clean'>()
  for (const record of history) {
    const date = new Date(record.completedAt)
    if (!Number.isFinite(date.getTime()) || date.getTime() > now) continue
    const day = key(date)
    if (record.hintCount === 0) days.set(day, 'clean')
    else if (!days.has(day)) days.set(day, 'any')
  }
  const today = new Date(now)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7) - 7 * 11)
  const weeks = Array.from({ length: 12 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + weekday)),
  )
  const recent = weeks.flat().filter(date => days.has(key(date))).length
  return (
    <div className="practice-calendar">
      <div className="practice-calendar-grid" aria-hidden="true">
        {weeks.map((week, index) => (
          <span key={index}>
            {week.map(date => (
              <i key={key(date)} data-day={date > today ? 'future' : (days.get(key(date)) ?? 'none')} />
            ))}
          </span>
        ))}
      </div>
      <small className="practice-calendar-key">
        <span>
          {recent} {plural(recent, 'day')} in 12 weeks
        </span>
        <span>
          <i data-day="clean" /> hint-free
        </span>
        <span>
          <i data-day="any" /> with hints
        </span>
      </small>
    </div>
  )
}

const dayKindText = { new: 'new practice', review: 'reviews only', rest: 'rest day, carried over', none: 'no practice' } as const

/**
 * The forgiving streak beside the last seven days. Reviews count as practice, and a single missed day can be carried
 * over once in any seven, so the tile shows consistency without a number to lose.
 */
function PracticeRhythm({ summary }: { summary: ReturnType<typeof profileProgress> }) {
  const { currentStreak, longestStreak, restDays, recentDays, practiceDays, week } = summary
  const streakNote = currentStreak
    ? [`Longest ${longestStreak}`, restDays ? `${restDays} rest ${plural(restDays, 'day')}` : ''].filter(Boolean).join(' · ')
    : longestStreak
      ? `Longest ${longestStreak} · a rep or review starts a new one`
      : 'Finish a rep to record a practice day.'
  return (
    <div className="rhythm">
      <div className="rhythm-stats">
        <p className="rhythm-stat">
          <b>{currentStreak}</b>
          <span>Practice-day streak</span>
          <small>{streakNote}</small>
        </p>
        <p className="rhythm-stat">
          <b>{recentDays} of 7</b>
          <span>Recent days practiced</span>
          <small>
            {practiceDays} practice {plural(practiceDays, 'day')} in all
          </small>
        </p>
      </div>
      <ol className="rhythm-week" aria-label="The last seven days">
        {week.map(day => (
          <li key={day.date.toISOString()} data-kind={day.kind} data-today={day.today || undefined}>
            <span className="rhythm-day" aria-hidden="true">
              {day.kind === 'new' ? <Icon name="check" /> : day.kind === 'review' ? <Icon name="repeat" /> : null}
            </span>
            <small>
              {day.today ? (
                'Today'
              ) : (
                <>
                  <span>{day.date.toLocaleDateString(undefined, { weekday: 'short' })}</span> <span>{day.date.getDate()}</span>
                </>
              )}
            </small>
            <span className="visually-hidden">: {day.today && day.kind === 'none' ? 'not yet' : dayKindText[day.kind]}</span>
          </li>
        ))}
      </ol>
      <p className="rhythm-key">
        Check: a new rep. Arrows: reviews only. Dashed: a rest day the streak carried over. Today fills in once you finish anything.
      </p>
    </div>
  )
}

const readSeen = (value: string): string[] | null => {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : null
  } catch {
    return null
  }
}

/**
 * Earned badges in two quiet groups: evidence (square tiles) before completion (round tiles). A badge earned since this
 * page was last shown in this browser session plays its earning motion once; without a session record, arriving never
 * replays earlier badges. The record is session UI state, so it never enters backups.
 */
function EarnedBadges({ earned, onOpen }: { earned: Badge[]; onOpen: (badge: Badge) => void }) {
  const [seenValue, setSeen] = useSessionPreference<string>('badges-art-seen', '')
  const ids = earned.map(badge => badge.id)
  const [fresh] = useState(() => {
    const seen = readSeen(seenValue)
    return new Set(seen ? ids.filter(id => !seen.includes(id)) : [])
  })
  const record = JSON.stringify(ids)
  useEffect(() => {
    if (seenValue !== record) setSeen(record)
  }, [record, seenValue, setSeen])
  const groups = [
    { title: 'Evidence', badges: earned.filter(badge => badge.kind === 'evidence') },
    { title: 'Completion', badges: earned.filter(badge => badge.kind !== 'evidence') },
  ].filter(group => group.badges.length > 0)
  return groups.map(group => (
    <div key={group.title} className="badge-group">
      <h3 className="badge-group-title">
        {group.title} · {group.badges.length}
      </h3>
      <ul className="badge-grid" aria-label={`Earned ${group.title.toLowerCase()} badges`}>
        {group.badges.map(badge => (
          <EarnedBadge key={badge.id} badge={badge} earning={fresh.has(badge.id)} onOpen={onOpen} />
        ))}
      </ul>
    </div>
  ))
}

function EarnedBadge({ badge, earning, onOpen }: { badge: Badge; earning: boolean; onOpen: (badge: Badge) => void }) {
  const action = badge.kind === 'path' ? 'Open track' : 'Open rep'
  return (
    <li className="badge-card" data-kind={badge.kind}>
      <BadgeArt badge={badge} earning={earning} />
      <div className="badge-text">
        <strong>{badge.name}</strong>
        {/* An earned evidence badge says what earned it; the general rule is for the ones that are not about one moment. */}
        {badge.detail ? <span className="badge-detail">{badge.detail}</span> : <span className="badge-rule">{badge.rule}</span>}
        <StatusChip tone="success">Earned{badge.earnedAt ? ` ${formatDate(badge.earnedAt)}` : ''}</StatusChip>
        {badge.kind !== 'evidence' && (
          <span className="badge-progress">
            {badge.completed} of {badge.total} {plural(badge.total, 'rep')}
          </span>
        )}
      </div>
      <button type="button" className="text-button" aria-label={`${action} for ${badge.name}`} onClick={() => onOpen(badge)}>
        {action}
      </button>
    </li>
  )
}

type JourneyProps = { progress: JourneyProgress; onOpenRep: (id: string) => void; onReviewRep: (id: string) => void }

/** One skill journey: guided practice, an independent problem, optional extra practice, and later recall. */
function JourneyEvidence({ progress, onOpenRep, onReviewRep }: JourneyProps) {
  const { journey, stage, guided, independent, practiced, retained, recallAt, recallDue } = progress
  const status = retained
    ? `Recall recorded ${formatDate(retained.completedAt)}`
    : recallDue
      ? 'Fresh recall is ready now'
      : recallAt
        ? `Recall ready ${formatDate(recallAt)}`
        : independent
          ? 'Independent practice recorded'
          : guided
            ? 'Next: solve a related problem without hints'
            : 'Next: start with guided practice'
  const markers = [
    ['Guided', Boolean(guided)],
    ['Independent', Boolean(independent)],
    ['Retained', Boolean(retained)],
  ] as const
  const guidedHints = guided?.hintCount ? ` with ${guided.hintCount} ${plural(guided.hintCount, 'hint')}` : ' without hints'
  const guidedNote = guided ? `Completed ${formatDate(guided.completedAt)}${guidedHints}` : 'Start with a guided rep.'
  const recallNote = retained
    ? `Fresh problem solved without hints ${formatDate(retained.completedAt)}`
    : recallDue && recallAt
      ? 'Ready now. Solve a fresh problem without hints.'
      : recallAt
        ? `Ready ${formatDate(recallAt)}. Try a fresh problem then to see what stayed with you.`
        : 'Available after an independent solve.'
  return (
    <details className="progress-journey" aria-labelledby={`progress-${journey.id}`}>
      <summary className="progress-heading">
        <div>
          <h2 id={`progress-${journey.id}`}>{journey.title}</h2>
          <p>{status}</p>
        </div>
        {/* A three-rung mini ladder: filled rungs are recorded; a due recall rung is ringed. */}
        <span className="journey-markers" aria-label={stageLabels[stage]}>
          {markers.map(([label, complete], index) => (
            <span
              key={label}
              role="img"
              aria-label={`${label}: ${complete ? 'recorded' : index === 2 && recallDue ? 'due now' : 'not recorded'}`}
              data-complete={complete}
              data-due={index === 2 && recallDue ? true : undefined}
            >
              <span className="journey-rung">
                <Icon name={complete ? 'check' : index === 2 ? 'repeat' : 'circle'} />
              </span>
              <small>{label}</small>
            </span>
          ))}
        </span>
      </summary>
      <ol className="evidence-list">
        <li>
          <strong>1. Guided practice</strong>
          <span>{guidedNote}</span>
          <button type="button" className="text-button" onClick={() => onOpenRep(journey.guided)}>
            Open rep
          </button>
        </li>
        <li>
          <strong>2. Independent problem</strong>
          <span>
            {independent
              ? `Solved without hints ${formatDate(independent.completedAt)}`
              : 'Solve a related problem without hints after guided practice.'}
          </span>
          <button type="button" className="text-button" disabled={!guided} onClick={() => onReviewRep(journey.independent)}>
            {!guided ? 'After guided rep' : independent ? 'Open rep' : 'Try rep'}
          </button>
        </li>
        {journey.practice?.map((id, index) => {
          const completed = practiced.find(record => record.repId === id)
          return (
            <li key={id}>
              <strong>
                {index === 0 ? '3. Extra practice (optional)' : 'Extra practice (optional)'}: {repTitle(id)}
              </strong>
              <span>
                {completed
                  ? `Solved without hints ${formatDate(completed.completedAt)}`
                  : 'Try without hints. This is optional and does not postpone recall.'}
              </span>
              <button type="button" className="text-button" onClick={() => onReviewRep(id)}>
                {completed ? 'Open rep' : 'Try rep'}
              </button>
            </li>
          )
        })}
        <li>
          <strong>{journey.practice?.length ? '4' : '3'}. Later recall</strong>
          <span>{recallNote}</span>
          <button type="button" className="text-button" disabled={!recallDue} onClick={() => onReviewRep(journey.recall)}>
            {recallDue ? 'Try recall' : retained ? 'Evidence recorded' : 'Available later'}
          </button>
        </li>
      </ol>
    </details>
  )
}

type BackupProps = {
  serverReady: boolean
  onExport: () => void
  onImport: (file: File) => void
  transferMessage: string
  transferTone: 'success' | 'error'
  restore: RestoreFlow
}

function BackupSection({ serverReady, onExport, onImport, transferMessage, transferTone, restore }: BackupProps) {
  const importRef = useRef<HTMLInputElement | null>(null)
  const panelRef = useRef<HTMLDetailsElement | null>(null)
  const { pending } = restore
  // A preview or message opens the section; clearing them leaves it as the learner set it.
  useEffect(() => {
    if ((pending || transferMessage) && panelRef.current) panelRef.current.open = true
  }, [pending, transferMessage])
  return (
    <details className="local-data" ref={panelRef}>
      <summary>Back up or restore practice</summary>
      <section aria-labelledby="local-data-title">
        <div>
          <h2 id="local-data-title">Your work stays yours</h2>
          <p>
            {serverReady ? 'Progress is saved on this laptop.' : 'Progress is saved in this browser.'} A practice backup holds your
            attempts, drafts, and notes. Importing one shows what it adds before anything merges, and your existing drafts stay as they are.
            To copy a whole profile instead, use Manage profiles.
          </p>
        </div>
        <div className="local-data-actions">
          <button type="button" onClick={onExport}>
            Download backup
          </button>
          <button type="button" onClick={() => importRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            aria-label="Choose Code Reps backup"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) onImport(file)
              event.target.value = ''
            }}
          />
        </div>
        {pending && (
          <div className="restore-preview" role="group" aria-labelledby="restore-preview-title">
            <h3 id="restore-preview-title">Check before merging</h3>
            <p className="restore-file">
              <Icon name="check" />
              {pending.fileName} is a valid practice backup.
            </p>
            <ul>
              <li>Into profile: {restore.profileName}</li>
              <li>{attemptsLine(pending)}</li>
              {pending.newNotes > 0 && (
                <li>
                  Adds {pending.newNotes} {plural(pending.newNotes, 'note')}
                </li>
              )}
              <li>
                Fills {pending.draftsToFill} empty {plural(pending.draftsToFill, 'draft')}; your existing drafts stay as they are
              </li>
            </ul>
            <div className="restore-actions">
              <Button variant="primary" onClick={restore.onConfirm}>
                Merge into {restore.profileName}
              </Button>
              <Button onClick={restore.onCancel}>Cancel</Button>
            </div>
          </div>
        )}
        {transferMessage && (
          <p className="transfer-message feedback-note" data-state={transferTone} role={transferTone === 'error' ? 'alert' : 'status'}>
            <Icon name={transferTone === 'error' ? 'alert' : 'check'} />
            {transferMessage}
            {transferTone === 'error' && !/kept/.test(transferMessage) && ' Nothing was changed.'}
          </p>
        )}
      </section>
    </details>
  )
}

function attemptsLine({ attempts, newAttempts }: BackupPreview) {
  const noun = plural(attempts, 'attempt')
  if (!attempts) return 'Has no completed attempts'
  if (!newAttempts) return `Adds no attempts; ${attempts === 1 ? 'its one completed attempt is' : `all ${attempts} are`} already here`
  if (newAttempts === attempts) return `Adds ${attempts === 1 ? 'its' : `all ${attempts}`} completed ${noun}`
  return `Adds ${newAttempts} of its ${attempts} completed ${noun}; the rest are already here`
}
