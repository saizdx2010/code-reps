import { useId, useMemo, useState } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { Select, Textarea } from './Input'
import { nextNoteLimit } from './daily-loop'
import { weekProgress } from './week-progress'
import { todayReceipt } from './today-plan'
import type { NextUp } from './fluency'
import type { PortableRecord } from './portability'
import { repTitle } from './rep-index.ts'
import { plural } from './ui-copy'
import './daily-loop.css'

export type NextChoice = { repId: string; label: string }

type Props = {
  history: PortableRecord[]
  now: number
  weeklyTarget: number
  /** The rep already chosen for next time, if any. */
  planned: NextUp | null
  /** Reps worth choosing for next time, the suggested one first. */
  choices: NextChoice[]
  onPlan: (repId: string, note: string) => void
  onClearPlan: () => void
  /** The next rep, for anyone who wants more today. */
  more?: { title: string; open: () => void }
  onReopen: () => void
}

/**
 * Trail once the learner has finished for the day: what today held, where this week stands against the target, and
 * the rep chosen for next time with a note to a future self. Everything but that choice is worked out from attempts.
 */
export default function DayClosed({ history, now, weeklyTarget, planned, choices, onPlan, onClearPlan, more, onReopen }: Props) {
  const receipt = useMemo(() => todayReceipt(history, new Date(now)), [history, now])
  const week = useMemo(() => weekProgress(history, weeklyTarget, new Date(now)), [history, weeklyTarget, now])
  const items = [
    { label: 'New', value: receipt.newReps, unit: 'rep' },
    { label: 'Reviews', value: receipt.reviews, unit: 'review' },
    { label: 'No hints', value: receipt.withoutHints, unit: 'attempt' },
  ]
  return (
    <section className="day-closed" aria-labelledby="day-closed-heading">
      <div className="day-closed-head">
        <span className="day-closed-mark" aria-hidden="true">
          <Icon name="check" />
        </span>
        <div>
          <h2 id="day-closed-heading">Done for today</h2>
          <p>
            {receipt.attempts
              ? `${receipt.attempts} ${plural(receipt.attempts, 'attempt')} finished today. You can stop here.`
              : 'Nothing finished today, and that is fine. Rest counts too.'}
          </p>
        </div>
      </div>
      {receipt.attempts > 0 && (
        <dl className="day-closed-receipt" aria-label="Today">
          {items.map(item => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>
                {item.value}
                <span className="visually-hidden"> {plural(item.value, item.unit)}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <WeekMeter week={week} />
      <NextTime planned={planned} choices={choices} onPlan={onPlan} onClearPlan={onClearPlan} />
      <p className="day-closed-more">
        {more && (
          <Button variant="text" onClick={more.open}>
            Want more? {more.title}
            <Icon name="arrow" />
          </Button>
        )}
        <Button variant="text" onClick={onReopen}>
          Show today's plan
        </Button>
      </p>
    </section>
  )
}

/** This Monday-to-Sunday week as seven marks against the weekly target. */
export function WeekMeter({ week }: { week: ReturnType<typeof weekProgress> }) {
  const left = week.target - week.done
  const note = week.met
    ? week.weeksMet > 1
      ? `Target met · ${week.weeksMet} weeks in a row`
      : 'Target met this week'
    : left <= week.daysLeft - (week.practicedToday ? 1 : 0)
      ? `${left} more ${plural(left, 'day')} reaches it`
      : 'Any day you practice still counts'
  return (
    <div className="week-meter">
      <p className="week-meter-text">
        <strong>
          This week: {Math.min(week.done, 7)} of {week.target} {plural(week.target, 'day')}
        </strong>
        <span>{note}</span>
      </p>
      <ol aria-label="This week, Monday to Sunday">
        {week.week.map(day => (
          <li
            key={day.date.toISOString()}
            data-practiced={day.practiced || undefined}
            data-today={day.today || undefined}
            data-future={day.future || undefined}
          >
            <span className="week-meter-dot" aria-hidden="true">
              {day.practiced && <Icon name="check" />}
            </span>
            <small aria-hidden="true">{day.date.toLocaleDateString(undefined, { weekday: 'narrow' })}</small>
            <span className="visually-hidden">
              {day.date.toLocaleDateString(undefined, { weekday: 'long' })}:{' '}
              {day.practiced ? 'practiced' : day.future ? 'to come' : 'not practiced'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Choose the rep for next time and, optionally, leave a note for the person who opens it. */
function NextTime({ planned, choices, onPlan, onClearPlan }: Pick<Props, 'planned' | 'choices' | 'onPlan' | 'onClearPlan'>) {
  const id = useId()
  const [editing, setEditing] = useState(!planned)
  const [repId, setRepId] = useState(planned?.repId ?? choices[0]?.repId ?? '')
  const [note, setNote] = useState(planned?.note ?? '')
  const [saved, setSaved] = useState(false)
  if (!editing && planned)
    return (
      <div className="next-time">
        <h3>Next time</h3>
        <p className="next-time-planned">
          <Icon name="flag" />
          <span>
            <strong>{repTitle(planned.repId)}</strong> is waiting on Trail.
          </span>
        </p>
        {planned.note && <blockquote className="next-time-note">{planned.note}</blockquote>}
        {saved && (
          <p className="next-time-saved" role="status">
            Saved for next time.
          </p>
        )}
        <p className="next-time-actions">
          <Button variant="text" onClick={() => setEditing(true)}>
            Change
          </Button>
          <Button
            variant="text"
            onClick={() => {
              onClearPlan()
              setSaved(false)
              setEditing(true)
            }}
          >
            Clear
          </Button>
        </p>
      </div>
    )
  if (!choices.length) return null
  return (
    <form
      className="next-time"
      onSubmit={event => {
        event.preventDefault()
        if (!repId) return
        onPlan(repId, note.trim())
        setSaved(true)
        setEditing(false)
      }}
    >
      <h3>Next time</h3>
      <p className="next-time-lead">Choose where you start, so coming back is one click.</p>
      <label htmlFor={`${id}-rep`}>Start with</label>
      <Select id={`${id}-rep`} value={repId} onChange={event => setRepId(event.target.value)}>
        {choices.map(choice => (
          <option key={choice.repId} value={choice.repId}>
            {choice.label}
          </option>
        ))}
      </Select>
      <label htmlFor={`${id}-note`}>
        Note to your future self <span className="optional-note">optional</span>
      </label>
      <Textarea
        id={`${id}-note`}
        rows={2}
        maxLength={nextNoteLimit}
        value={note}
        placeholder="Where you got to, or what to try first"
        onChange={event => setNote(event.target.value)}
      />
      <p className="next-time-actions">
        <Button variant="primary" type="submit">
          Save for next time
        </Button>
        {planned && (
          <Button variant="text" onClick={() => setEditing(false)}>
            Keep {repTitle(planned.repId)}
          </Button>
        )}
      </p>
    </form>
  )
}
