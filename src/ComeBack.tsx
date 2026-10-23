import { useMemo, useState } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { Input } from './Input'
import { awayDays, daysAway, rhythmDrop } from './come-back'
import { dayNumber } from './dates'
import type { PortableRecord } from './portability'
import { useSessionPreference } from './useSessionPreference'
import { reasonLimit } from './fluency'
import { repTitle } from './rep-index.ts'
import { plural } from './ui-copy'
import './come-back.css'

/** A Break it hunt: a different kind of practice when the usual kind has gone stale. */
export const breakItRepId = 'break-page-count'

type SlotProps = {
  /** Which part of Trail's aside this slot fills: the welcome leads it, the rhythm note follows Today. */
  place: 'welcome' | 'rhythm'
  history: PortableRecord[]
  now: number
  reason?: string
  onSaveReason: (reason: string) => boolean
  familiar?: string
  target: number
  onTarget: (days: number) => void
  onOpenReview: (repId: string) => void
  onOpenRep: (repId: string) => void
}

/**
 * Trail's coming-back slots. After a few days away the welcome leads the aside; when practice has only slowed, a quiet
 * note follows Today. Either can be skipped for the rest of the day (session UI state), and at most one shows.
 */
export default function ComeBackSlot(props: SlotProps) {
  const { place, history, now } = props
  const today = String(dayNumber(new Date(now)))
  const [welcomeSkipped, setWelcomeSkipped] = useSessionPreference<string>('welcome-back', '')
  const [nudgeSkipped, setNudgeSkipped] = useSessionPreference<string>('rhythm-nudge', '')
  const away = useMemo(() => daysAway(history, new Date(now)), [history, now])
  const welcome = away !== null && away >= awayDays && welcomeSkipped !== today
  const drop = useMemo(() => (welcome ? null : rhythmDrop(history, new Date(now))), [welcome, history, now])
  if (place === 'welcome')
    return welcome ? (
      <WelcomeBack
        days={away!}
        reason={props.reason}
        onSaveReason={props.onSaveReason}
        familiar={props.familiar}
        onOpen={props.onOpenReview}
        onDismiss={() => setWelcomeSkipped(today)}
      />
    ) : null
  return drop && nudgeSkipped !== today ? (
    <RhythmNudge
      drop={drop}
      target={props.target}
      onTarget={props.onTarget}
      onOpen={props.onOpenRep}
      onDismiss={() => setNudgeSkipped(today)}
    />
  ) : null
}

type WelcomeProps = {
  days: number
  reason?: string
  onSaveReason: (reason: string) => boolean
  /** A rep the learner finished before, to ease back in with. */
  familiar?: string
  onOpen: (repId: string) => void
  onDismiss: () => void
}

/**
 * Trail after a break of a few days: no guilt, nothing lost, the learner's own reason, and one familiar rep to ease
 * back in before the plan. It disappears once anything is completed, or for the rest of the day when skipped.
 */
export function WelcomeBack({ days, reason, onSaveReason, familiar, onOpen, onDismiss }: WelcomeProps) {
  return (
    <section className="welcome-back" aria-labelledby="welcome-back-heading">
      <span className="home-label">Welcome back</span>
      <h2 id="welcome-back-heading">
        {days} {plural(days, 'day')} away, and nothing was lost.
      </h2>
      <p>Your drafts, skills, and badges are where you left them. Ease in with something you already know, then carry on.</p>
      {reason ? (
        <figure className="planned-note welcome-reason">
          <figcaption>Why you practice</figcaption>
          <blockquote>{reason}</blockquote>
        </figure>
      ) : (
        <ReasonPrompt onSave={onSaveReason} />
      )}
      <div className="welcome-back-actions">
        {familiar && (
          <Button onClick={() => onOpen(familiar)}>
            Ease back in: {repTitle(familiar)}
            <Icon name="arrow" />
          </Button>
        )}
        <Button variant="text" onClick={onDismiss}>
          Skip to my plan
        </Button>
      </div>
    </section>
  )
}

/** One line on why the learner practices, asked where it will be read: on coming back. */
function ReasonPrompt({ onSave }: { onSave: (reason: string) => boolean }) {
  const [reason, setReason] = useState('')
  const [failed, setFailed] = useState(false)
  return (
    <form
      className="reason-prompt"
      onSubmit={event => {
        event.preventDefault()
        if (reason.trim()) setFailed(!onSave(reason.trim()))
      }}
    >
      <label htmlFor="reason-prompt">Why are you learning? One line, shown here next time.</label>
      <div>
        <Input
          id="reason-prompt"
          maxLength={reasonLimit}
          value={reason}
          placeholder="Build my own app, or pass interviews"
          onChange={event => setReason(event.target.value)}
        />
        <Button type="submit" disabled={!reason.trim()}>
          Save
        </Button>
      </div>
      {failed && <p role="alert">Your reason could not be saved. It is still in the field.</p>}
    </form>
  )
}

type NudgeProps = {
  drop: NonNullable<ReturnType<typeof rhythmDrop>>
  target: number
  onTarget: (days: number) => void
  onOpen: (repId: string) => void
  onDismiss: () => void
}

/**
 * When practice days fall off, a lighter target and a different kind of rep, instead of more of the same. It names
 * the counts it compares and never scolds.
 */
export function RhythmNudge({ drop, target, onTarget, onOpen, onDismiss }: NudgeProps) {
  const lighter = drop.lighterTarget < target
  return (
    <section className="rhythm-nudge" aria-labelledby="rhythm-nudge-heading">
      <h2 id="rhythm-nudge-heading">Your rhythm slowed</h2>
      <p>
        {drop.before} practice days in the two weeks before, {drop.recent} in the last two. A lighter week is still a week, and a different
        kind of rep can make practice feel new.
      </p>
      <div className="rhythm-nudge-actions">
        {lighter && (
          <Button onClick={() => onTarget(drop.lighterTarget)}>
            Aim for {drop.lighterTarget} {plural(drop.lighterTarget, 'day')} a week
          </Button>
        )}
        <Button variant="text" onClick={() => onOpen(breakItRepId)}>
          Try a Break it hunt
          <Icon name="arrow" />
        </Button>
        <Button variant="text" onClick={onDismiss}>
          Not now
        </Button>
      </div>
    </section>
  )
}
