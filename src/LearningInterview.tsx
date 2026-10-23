import { formatDate } from './ui-copy.ts'
import { InfoNote } from './Layout'
import { Button } from './Button'
import { NumberInput, Select, Textarea } from './Input'
import { useEffect, useState } from 'react'
import type { FluencyState } from './fluency'
import { repTitle } from './rep-index.ts'
import { useSessionPreference } from './useSessionPreference'

type Round = FluencyState['rounds'][number]
type Props = {
  state: FluencyState
  update: (next: FluencyState) => boolean
  openRep: (id: string) => void
  reviewRep: (id: string) => void
  // The unstarted round length outlives a visit to another hub tab.
  minutes: number
  setMinutes: (minutes: number) => void
}

/** Optional timed interview practice: start a round, keep notes while it runs, then debrief. */
export function LearningInterview({ state, update, openRep, reviewRep, minutes, setMinutes }: Props) {
  const [roundRep, setRoundRep] = useSessionPreference<string>('interview-focus', 'interview-frontend')
  const currentRound = state.rounds.find(r => !r.endedAt)
  const editRound = (id: string, change: Partial<Round>) =>
    update({
      ...state,
      rounds: state.rounds.map(r => (r.id === id ? { ...r, ...change } : r)),
    })
  function startRound() {
    const round = { id: crypto.randomUUID(), repId: roundRep, minutes, startedAt: new Date().toISOString(), clarification: '', debrief: '' }
    update({ ...state, rounds: [round, ...state.rounds] })
    reviewRep(roundRep)
  }
  return (
    <>
      <section className="hub-panel hub-section">
        <h2>Optional timed practice</h2>
        <InfoNote label="How a round works">
          <p>
            Clarify, plan, implement, explain, and review. Timing is recorded separately from checks and your self-assessment. The timer
            does not submit or erase your work.
          </p>
        </InfoNote>
        {!currentRound ? (
          <>
            <label>
              Round length in minutes
              <NumberInput min={5} max={120} value={minutes} onValueChange={setMinutes} />
            </label>
            <label htmlFor="interview-focus">Interview focus</label>
            <Select id="interview-focus" value={roundRep} onChange={event => setRoundRep(event.target.value)}>
              <option value="interview-frontend">Frontend</option>
              <option value="interview-backend">Backend</option>
            </Select>
            <div className="hub-actions">
              <Button
                variant="primary"
                type="button"
                disabled={!Number.isInteger(minutes) || minutes < 5 || minutes > 120}
                onClick={startRound}
              >
                Start round
              </Button>
            </div>
          </>
        ) : (
          <>
            <p>
              <strong>{repTitle(currentRound.repId)}</strong> · <RoundRemaining round={currentRound} /> minutes remaining
            </p>
            <label>
              Clarifications and assumptions
              <Textarea
                rows={3}
                maxLength={20_000}
                value={currentRound.clarification}
                onChange={e => editRound(currentRound.id, { clarification: e.target.value })}
              />
            </label>
            <div className="hub-actions">
              <Button variant="primary" type="button" onClick={() => openRep(currentRound.repId)}>
                Continue coding
              </Button>
              <Button type="button" onClick={() => editRound(currentRound.id, { endedAt: new Date().toISOString() })}>
                End round and review
              </Button>
            </div>
          </>
        )}
      </section>
      {state.rounds
        .filter(r => r.endedAt)
        .map(round => (
          <section className="hub-panel" key={round.id}>
            <h3>{repTitle(round.repId)}</h3>
            <p>
              {formatDate(round.startedAt, true)} · {Math.ceil((Date.parse(round.endedAt!) - Date.parse(round.startedAt)) / 60_000)} minutes
              elapsed · {round.minutes}-minute budget
            </p>
            <p>Clarifications: {round.clarification || 'None recorded.'}</p>
            <label>
              Debrief: approach, implementation, explanation, and next focus
              <Textarea
                rows={4}
                maxLength={20_000}
                value={round.debrief}
                onChange={e => editRound(round.id, { debrief: e.target.value })}
              />
            </label>
            <p className="utility-note">
              Review checked attempts in History and record skill judgments in Self-assessment. Elapsed time is not a correctness score.
            </p>
          </section>
        ))}
    </>
  )
}

/** Whole minutes left in a running round, ticking each second while visible. */
function RoundRemaining({ round }: { round: Round }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return Math.max(0, Math.ceil((Date.parse(round.startedAt) + round.minutes * 60_000 - now) / 60_000))
}
