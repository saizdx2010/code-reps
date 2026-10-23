import { formatDate } from './ui-copy.ts'
import { InfoNote } from './Layout'
import { Button, Toggle } from './Button'
import { Icon } from './Icon'
import { Input, NumberInput, Select, Textarea } from './Input'
import { useEffect, useMemo, useRef, useState } from 'react'
import { reasonLimit, recurringReviews, weeklyPlan } from './fluency'
import type { FluencyState } from './fluency'
import type { PortableRecord } from './portability'
import { paths } from './path'
import { repTitle } from './rep-index.ts'
import { retroNoteBody, retroQuestions, weeklyRetro } from './retro.ts'
import { goToView } from './ui-navigation'
import { calendarFile } from './calendar-file'
import { canInstall, install, installed, onInstallChange } from './install-prompt'

type Props = {
  state: FluencyState
  update: (next: FluencyState) => boolean
  history: PortableRecord[]
  openRep: (id: string) => void
  reviewRep: (id: string) => void
  candidates: { repId: string; reason: string; mode?: string }[]
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** The weekly plan: practice days and a session budget, plus recurring reviews that keep skills available. */
export function LearningPlan({ state, update, history, openRep, reviewRep, candidates }: Props) {
  const [now, setNow] = useState(Date.now)
  // Reviews become due on a day scale, so a minute tick is enough.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const reviews = useMemo(() => recurringReviews(history, now), [history, now])
  const goal = state.goal
  const setGoal = (next: Partial<FluencyState['goal']>) => update({ ...state, goal: { ...goal, ...next } })
  const toggleDay = (day: number) => setGoal({ days: goal.days.includes(day) ? goal.days.filter(d => d !== day) : [...goal.days, day] })
  return (
    <>
      <WeekInReview state={state} update={update} history={history} now={now} />
      <section className="hub-panel hub-section">
        <h2>A manageable practice week</h2>
        <InfoNote label="How suggestions are chosen">
          <p>
            Choose a goal and time budget. Suggestions mix due reviews, saved work, and your chosen track. Time is a budget, not an estimate
            of mastery.
          </p>
        </InfoNote>
        <div className="hub-form-row">
          <label>
            Goal
            <Select value={goal.pathId} onChange={e => setGoal({ pathId: e.target.value })}>
              {paths.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Minutes per session
            <NumberInput min={5} max={120} value={goal.minutes} onValueChange={value => setGoal({ minutes: value })} />
          </label>
        </div>
        <fieldset className="day-picker">
          <legend>Practice days</legend>
          {weekdays.map((day, i) => (
            <label key={day}>
              <Input type="checkbox" checked={goal.days.includes(i)} onChange={() => toggleDay(i)} />
              {day}
            </label>
          ))}
        </fieldset>
        <ol className="milestone-list plan-days">
          {weeklyPlan(goal, candidates).map(session => {
            const action = session.action
            return (
              <li key={session.date.toISOString()}>
                <div>
                  <strong>
                    {session.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {session.minutes}{' '}
                    minutes
                  </strong>
                  <p>
                    {action ? `${repTitle(action.repId)}: ${action.reason}` : 'Use this session for your notebook or a knowledge lesson.'}
                  </p>
                </div>
                {action && (
                  <Button
                    variant="text"
                    type="button"
                    onClick={() => (action.mode === 'review' || action.mode === 'retry' ? reviewRep(action.repId) : openRep(action.repId))}
                  >
                    Open practice
                  </Button>
                )}
              </li>
            )
          })}
        </ol>
        {!goal.days.length && <p>Select at least one day to make a plan. Nothing is scheduled until you do.</p>}
      </section>
      <ComeBackOnTime state={state} update={update} />
      <section className="hub-panel hub-section">
        <h2>Keep skills available</h2>
        <InfoNote label="How reviews are spaced">
          <p>
            After first delayed recall, additional reviews rotate through different applications. Successful independent scheduled recalls
            extend the interval; difficult or hinted recalls shorten it. These intervals are starting rules to validate with learners.
          </p>
        </InfoNote>
        {reviews.length ? (
          <ul className="milestone-list">
            {reviews.map(review => (
              <li key={review.skillId}>
                <div>
                  <strong>{review.title}</strong>
                  <p>
                    {review.due ? 'Ready now' : `Next review ${formatDate(review.dueAt)}`} · {review.successes} further independent recalls
                  </p>
                  <p>{review.reason}</p>
                </div>
                <Button variant="text" type="button" disabled={!review.due} onClick={() => reviewRep(review.repId)}>
                  Fresh review
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Complete a guided, independent, and delayed recall journey to begin recurring reviews.</p>
        )}
      </section>
    </>
  )
}

/** A short look back at the last seven days. Saving writes one ordinary Notebook note; nothing else is stored. */
function WeekInReview({ state, update, history, now }: Pick<Props, 'state' | 'update' | 'history'> & { now: number }) {
  const retro = useMemo(() => weeklyRetro(history, now), [history, now])
  const [answers, setAnswers] = useState<string[]>(() => retroQuestions.map(() => ''))
  const [message, setMessage] = useState('')
  const written = answers.some(answer => answer.trim())
  const change = retro.attempts - retro.previousAttempts
  function save() {
    const note = {
      id: crypto.randomUUID(),
      title: `Week in review · ${formatDate(now)}`,
      body: retroNoteBody(retro, answers),
      skillId: '',
      repId: '',
      kind: 'note' as const,
      updatedAt: new Date(now).toISOString(),
    }
    if (update({ ...state, notes: [note, ...state.notes] })) {
      setAnswers(retroQuestions.map(() => ''))
      setMessage('Saved to your Notebook.')
    } else setMessage('Your review could not be saved. Your writing is still here.')
  }
  return (
    <section className="hub-panel hub-section week-review" aria-labelledby="week-review-title">
      <h2 id="week-review-title">Look back at the last seven days</h2>
      <InfoNote label="What this shows">
        <p>
          Counts come from completed attempts; mistakes and the hardest part are your own answers. This is a reflection prompt, not a score.
        </p>
      </InfoNote>
      <dl className="week-review-facts">
        <div>
          <dt>Completed attempts</dt>
          <dd>
            {retro.attempts}
            <small>
              {change === 0 ? ' same as the week before' : ` ${Math.abs(change)} ${change > 0 ? 'more' : 'fewer'} than the week before`}
            </small>
          </dd>
        </div>
        <div>
          <dt>Practice days</dt>
          <dd>{retro.practiceDays}</dd>
        </div>
        <div>
          <dt>Without hints</dt>
          <dd>
            {retro.unhinted}
            <small> of {retro.attempts}</small>
          </dd>
        </div>
        <div>
          <dt>Most tagged mistake</dt>
          <dd>{retro.topMistake ? `${retro.topMistake.label} (${retro.topMistake.count})` : 'None tagged'}</dd>
        </div>
        <div>
          <dt>Hardest most often</dt>
          <dd>{retro.topStuck ? `${retro.topStuck.label} (${retro.topStuck.count})` : 'Not answered'}</dd>
        </div>
      </dl>
      {retro.attempts === 0 ? (
        <p>No completed attempts in the last seven days. A short rep is enough to restart; the plan below suggests one.</p>
      ) : (
        <p className="week-review-reps">Reps this week: {retro.reps.map(repTitle).join(', ')}.</p>
      )}
      {retroQuestions.map((question, index) => (
        <label key={question} className="week-review-question">
          {question}
          <Textarea
            rows={2}
            value={answers[index]}
            onChange={event => {
              setMessage('')
              setAnswers(current => current.map((answer, at) => (at === index ? event.target.value : answer)))
            }}
          />
        </label>
      ))}
      <div className="week-review-actions">
        <Button variant="primary" disabled={!written} onClick={save}>
          Save to Notebook
        </Button>
        {message && (
          <p role="status">
            {message}{' '}
            {message.startsWith('Saved') && (
              <Button variant="text" onClick={() => goToView('notebook')}>
                Open Notebook
              </Button>
            )}
          </p>
        )}
      </div>
    </section>
  )
}

/**
 * The bridges that bring a learner back: their reason, a calendar file for the practice days, an in-app reminder, and
 * installing Code Reps as an app. Nothing is sent anywhere; the calendar does the reminding while Code Reps is closed.
 */
function ComeBackOnTime({ state, update }: Pick<Props, 'state' | 'update'>) {
  const goal = state.goal
  const [reason, setReason] = useState(state.reason ?? '')
  const [message, setMessage] = useState('')
  const [installable, setInstallable] = useState(canInstall)
  useEffect(() => onInstallChange(() => setInstallable(canInstall())), [])
  // Leaving the reason field and changing the time can happen before the page re-renders, so each save builds on the
  // last one written here rather than on a state from an earlier render.
  const latest = useRef(state)
  useEffect(() => {
    latest.current = state
  }, [state])
  const write = (next: FluencyState) => {
    const saved = update(next)
    if (saved) latest.current = next
    return saved
  }
  const setGoal = (next: Partial<FluencyState['goal']>) => write({ ...latest.current, goal: { ...latest.current.goal, ...next } })
  function saveReason() {
    const text = reason.trim()
    if (text === (latest.current.reason ?? '')) return
    const saved = write({ ...latest.current, reason: text || undefined })
    setMessage(saved ? (text ? 'Reason saved.' : 'Reason cleared.') : 'Your reason could not be saved.')
  }
  function download() {
    const file = calendarFile(latest.current.goal, { reason: latest.current.reason, url: `${location.origin}/#/home` })
    if (!file) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([file], { type: 'text/calendar' }))
    link.download = 'code-reps-practice.ics'
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    setMessage('Calendar file downloaded. Open it to add your practice days to your calendar.')
  }
  async function toggleReminder() {
    if (goal.remind) {
      setGoal({ remind: false })
      return setMessage('Reminders are off.')
    }
    if (typeof Notification === 'undefined') return setMessage('This browser cannot show notifications. The calendar file still works.')
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    if (permission !== 'granted')
      return setMessage('Notifications are blocked for Code Reps in this browser’s site settings. The calendar file still works.')
    setGoal({ remind: true })
    setMessage('Reminders are on while Code Reps is open.')
  }
  return (
    <section className="hub-panel hub-section come-back-settings" aria-labelledby="come-back-title">
      <h2 id="come-back-title">Come back on time</h2>
      <InfoNote label="What these can and cannot do">
        <p>
          Code Reps runs on your machine and has no server to message you, so it cannot remind you while it is closed. A calendar file puts
          your practice days in your own calendar, which can. The in-app reminder only appears while Code Reps is open in a tab or installed
          as an app, and only on a practice day you have not practiced yet.
        </p>
      </InfoNote>
      <label className="come-back-reason">
        Why you practice <span className="optional-note">optional · shown when you come back after a break</span>
        <Textarea
          rows={2}
          maxLength={reasonLimit}
          value={reason}
          placeholder="Pass my interviews in March, or build my own app"
          onChange={event => setReason(event.target.value)}
          onBlur={saveReason}
        />
      </label>
      <div className="hub-form-row">
        <label>
          Practice time
          <Input type="time" value={goal.time ?? '19:00'} onChange={event => event.target.value && setGoal({ time: event.target.value })} />
        </label>
      </div>
      <div className="come-back-actions">
        <Button disabled={!goal.days.length} onClick={download}>
          <Icon name="calendar" />
          Add to my calendar
        </Button>
        <Toggle on={!!goal.remind} onClick={() => void toggleReminder()}>
          Remind me while Code Reps is open
        </Toggle>
        {installable && !installed() && (
          <Button
            variant="text"
            onClick={() => void install().then(done => setMessage(done ? 'Installed. Code Reps now opens like an app.' : ''))}
          >
            Install Code Reps as an app
          </Button>
        )}
      </div>
      {!goal.days.length && <p>Choose practice days above to make a calendar file.</p>}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
