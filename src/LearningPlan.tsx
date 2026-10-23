import { formatDate } from './ui-copy.ts'
import { InfoNote } from './Layout'
import { Button } from './Button'
import { Input, NumberInput, Select, Textarea } from './Input'
import { useEffect, useMemo, useState } from 'react'
import { recurringReviews, weeklyPlan } from './fluency'
import type { FluencyState } from './fluency'
import type { PortableRecord } from './portability'
import { paths } from './path'
import { repTitle } from './rep-index.ts'
import { retroNoteBody, retroQuestions, weeklyRetro } from './retro.ts'
import { goToView } from './ui-navigation'

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
