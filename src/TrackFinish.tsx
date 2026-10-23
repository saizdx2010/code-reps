import { useMemo } from 'react'
import './track-finish.css'
import { BadgeArt } from './BadgeArt'
import { profileBadges } from './badges'
import { Button } from './Button'
import { FirstAndLast } from './CompareWork'
import type { LearningNote } from './fluency'
import { Icon } from './Icon'
import { EmptyState, InfoNote, PageHeader, StatusChip } from './Layout'
import { paths } from './path'
import type { PathId } from './path'
import type { PortableRecord } from './portability'
import { repTitle } from './rep-index.ts'
import { skillStateLabels } from './skill-map'
import { trackFinish, trackNotes, trackProgress } from './track-finish'
import { formatDate, plural } from './ui-copy.ts'
import { goToView } from './ui-navigation'

type Props = {
  pathId: string
  history: PortableRecord[]
  now: number
  notes: readonly LearningNote[]
  openRep: (repId: string) => void
  onOpenPath: (pathId: PathId) => void
}

const noteKinds: Record<LearningNote['kind'], string> = { note: 'Note', mistake: 'Mistake', question: 'Question' }

/**
 * A finished track, under Progress (#/finished/<path-id>): when it started and finished, the first and last reps, the skills
 * reached, the learner's notes, and the track's badges. Everything is worked out from saved attempts and notes.
 */
export default function TrackFinishPage({ pathId, history, now, notes, openRep, onOpenPath }: Props) {
  const finish = useMemo(() => trackFinish(pathId, history, now), [pathId, history, now])
  const badges = useMemo(
    // The track's own badge first, then its stages in order.
    () =>
      profileBadges(history, new Date(now))
        .filter(badge => badge.pathId === pathId && badge.kind !== 'evidence' && badge.earned)
        .sort((a, b) => Number(b.kind === 'path') - Number(a.kind === 'path')),
    [pathId, history, now],
  )
  const linked = useMemo(() => trackNotes(pathId, notes), [pathId, notes])
  const back = { label: 'Skills', onClick: () => goToView('progress') }
  const path = paths.find(item => item.id === pathId)
  // An old or mistyped address names no track: say so and lead back to Skills, which lists the finished tracks.
  if (!path)
    return (
      <main className="progress-main track-finish-main">
        <PageHeader back={back} title="Finished track" description="This address does not name a track." />
        <EmptyState
          title="No track to show here."
          action={
            <Button variant="primary" onClick={back.onClick}>
              Go to Skills
            </Button>
          }
        >
          Skills lists every track you have finished, each with a link to its page.
        </EmptyState>
      </main>
    )
  if (!finish) {
    const { done, total } = trackProgress(path.id, history, now)
    return (
      <main className="progress-main track-finish-main">
        <PageHeader back={back} title={path.title} description={`${done} of ${total} ${plural(total, 'rep')} completed so far.`} />
        <EmptyState
          title="This track is not finished yet."
          action={
            <Button variant="primary" onClick={() => onOpenPath(path.id)}>
              Open {path.title}
              <Icon name="arrow" />
            </Button>
          }
        >
          Its finish page opens once every rep in the track is completed.
        </EmptyState>
      </main>
    )
  }
  const facts = [
    { label: 'Started', value: formatDate(finish.first.completedAt), note: repTitle(finish.first.repId) },
    { label: 'Finished', value: formatDate(finish.last.completedAt), note: repTitle(finish.last.repId) },
    { label: 'Days taken', value: `${finish.days} ${plural(finish.days, 'day')}`, note: 'first rep to last, both counted' },
    {
      label: 'Practice days',
      value: String(finish.practiceDays),
      note: `with a rep from this track`,
    },
  ]
  return (
    <main className="progress-main track-finish-main">
      <PageHeader
        back={back}
        title={path.title}
        description={`Track finished: all ${finish.repCount} reps completed, ${formatDate(finish.first.completedAt)} to ${formatDate(finish.last.completedAt)}.`}
      />
      <dl className="week-review-facts finish-facts" aria-label="Track dates">
        {facts.map(fact => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>
              {fact.value}
              <small>{fact.note}</small>
            </dd>
          </div>
        ))}
      </dl>
      <InfoNote label="What a finished track shows">
        <p>
          Finished means every rep in the track is completed at least once, hints included. It does not prove mastery: Independent and
          Retained below come from reps solved without hints and from fresh recall after a break. This page is worked out from your saved
          attempts and notes; nothing new is stored.
        </p>
      </InfoNote>
      <section className="finish-section" aria-labelledby="finish-first-last">
        <h2 id="finish-first-last">Your first and last rep</h2>
        {finish.first.id === finish.last.id ? (
          <p className="finish-lead">This track finished with the rep that started it: {repTitle(finish.first.repId)}.</p>
        ) : (
          <FirstAndLast first={finish.first} last={finish.last} />
        )}
      </section>
      <section className="finish-section" aria-labelledby="finish-skills">
        <h2 id="finish-skills">Skills you reached</h2>
        {finish.skills.length ? (
          <>
            <p className="finish-lead">
              {finish.skills.length} of the track's {finish.skillTotal} {plural(finish.skillTotal, 'skill')}{' '}
              {finish.skills.length === 1 ? 'is' : 'are'} Independent or Retained now.
            </p>
            <ul className="finish-skills">
              {finish.skills.map(skill => (
                <li key={skill.id}>
                  <span>{skill.title}</span>
                  <StatusChip tone={skill.state === 'retained' ? 'success' : 'progress'}>{skillStateLabels[skill.state]}</StatusChip>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            title={
              finish.skillTotal ? 'No skill from this track is Independent yet.' : 'This track has no skill journeys to reach Independent.'
            }
            action={
              finish.skillTotal ? (
                <Button variant="text" onClick={() => goToView('skillmap')}>
                  See the skill map
                  <Icon name="arrow" />
                </Button>
              ) : undefined
            }
          >
            {finish.skillTotal ? 'A related rep solved without hints after a guided one moves a skill to Independent.' : undefined}
          </EmptyState>
        )}
      </section>
      <section className="finish-section" aria-labelledby="finish-notes">
        <h2 id="finish-notes">Your notes from this track</h2>
        {linked.length ? (
          <ul className="finish-notes">
            {linked.map(note => (
              <li key={note.id}>
                <div className="finish-note-head">
                  <strong>{note.title || 'Untitled entry'}</strong>
                  <small>
                    {noteKinds[note.kind]} · {formatDate(note.updatedAt)}
                    {note.repId ? ` · ${repTitle(note.repId)}` : ''}
                  </small>
                </div>
                {note.body.trim() && <p>{note.body}</p>}
                {note.repId && (
                  <Button variant="text" onClick={() => openRep(note.repId)}>
                    Open rep
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No notes about this track's skills."
            action={
              <Button variant="text" onClick={() => goToView('notebook')}>
                Open your Notebook
                <Icon name="arrow" />
              </Button>
            }
          >
            Notebook entries linked to one of its lessons or reps collect here.
          </EmptyState>
        )}
      </section>
      <section className="finish-section" aria-labelledby="finish-badges">
        <h2 id="finish-badges">Badges from this track</h2>
        {/* The track's own badge as a card; its stage badges as small tiles, so a long track stays one screen. */}
        <ul className="finish-badges" aria-label={`Earned ${path.title} badges`}>
          {badges.map(badge => (
            <li key={badge.id} className={badge.kind === 'path' ? 'badge-card' : 'finish-badge'} data-kind={badge.kind}>
              <BadgeArt badge={badge} />
              <div className="badge-text">
                <strong>{badge.name}</strong>
                {badge.kind === 'path' && <span className="badge-rule">{badge.rule}</span>}
                {badge.kind === 'path' ? (
                  <StatusChip tone="success">Earned{badge.earnedAt ? ` ${formatDate(badge.earnedAt)}` : ''}</StatusChip>
                ) : (
                  badge.earnedAt && <small>Earned {formatDate(badge.earnedAt)}</small>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
