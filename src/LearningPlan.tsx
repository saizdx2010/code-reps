import { formatDate } from './ui-copy.ts'
import { InfoNote } from './Layout'
import { Button } from './Button'
import { Input, NumberInput, Select } from './Input'
import { useEffect, useMemo, useState } from 'react'
import { recurringReviews, weeklyPlan } from './fluency'
import type { FluencyState } from './fluency'
import type { PortableRecord } from './portability'
import { paths } from './path'
import { repTitle } from './rep-index.ts'

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
  return <>
    <section className="hub-panel">
      <h2>A manageable practice week</h2>
      <InfoNote><p>
        Choose a goal and time budget. Suggestions mix due reviews, saved work, and your chosen track. Time is a budget, not an estimate of
        mastery.
      </p></InfoNote>
      <div className="hub-form-row">
        <label>Goal<Select value={goal.pathId} onChange={e => setGoal({ pathId: e.target.value })}>
          {paths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select></label>
        <label>
          Minutes per session
          <NumberInput min={5} max={120} value={goal.minutes} onValueChange={value => setGoal({ minutes: value })} />
        </label>
      </div>
      <fieldset className="day-picker">
        <legend>Practice days</legend>
        {weekdays.map((day, i) => <label key={day}>
          <Input type="checkbox" checked={goal.days.includes(i)} onChange={() => toggleDay(i)} />
          {day}
        </label>)}
      </fieldset>
      <ol className="milestone-list">{weeklyPlan(goal, candidates).map(session => {
        const action = session.action
        return <li key={session.date.toISOString()}>
          <div>
            <strong>
              {session.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {session.minutes} minutes
            </strong>
            <p>{action ? `${repTitle(action.repId)}: ${action.reason}` : 'Use this session for your notebook or a knowledge lesson.'}</p>
          </div>
          {action && <Button
            variant="text" type="button"
            onClick={() => action.mode === 'review' || action.mode === 'retry' ? reviewRep(action.repId) : openRep(action.repId)}
          >Open practice</Button>}
        </li>
      })}</ol>
      {!goal.days.length && <p>Select at least one day to make a plan. Nothing is scheduled until you do.</p>}
    </section>
    <section className="hub-panel">
      <h2>Keep skills available</h2>
      <InfoNote><p>
        After first delayed recall, additional reviews rotate through different applications. Successful independent scheduled recalls
        extend the interval;
        difficult or hinted recalls shorten it. These intervals are starting rules to validate with learners.
      </p></InfoNote>
      {reviews.length
        ? <ul className="milestone-list">{reviews.map(review => <li key={review.skillId}>
          <div>
            <strong>{review.title}</strong>
            <p>{review.due ? 'Ready now' : `Next review ${formatDate(review.dueAt)}`} · {review.successes} further independent recalls</p>
            <p>{review.reason}</p>
          </div>
          <Button variant="text" type="button" disabled={!review.due} onClick={() => reviewRep(review.repId)}>Fresh review</Button>
        </li>)}</ul>
        : <p>Complete a guided, independent, and delayed recall journey to begin recurring reviews.</p>}
    </section>
  </>
}
