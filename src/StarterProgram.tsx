import { useMemo, useState } from 'react'
import './starter-program.css'
import { Button } from './Button'
import { preloadPractice } from './editor-loader'
import type { FluencyState } from './fluency'
import { Icon } from './Icon'
import { Textarea } from './Input'
import { InfoNote, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import type { PortableRecord } from './portability'
import { programWeeks, reflectionBody, reflectionPrefix, reflectionQuestions, starterProgram } from './starter-program'
import type { ProgramItem, ProgramWeek, StarterProgram } from './starter-program'
import type { TrailStage } from './trail-map'
import { formatDate, plural } from './ui-copy.ts'
import { goToView } from './ui-navigation'
import type { useFluency } from './useFluency'

type Common = {
  history: PortableRecord[]
  now: number
  /** The goal trail Home draws, so the weeks follow the same order and done states. */
  stages: readonly TrailStage[]
  openRep: (repId: string) => void
  openLesson: (skillId: string) => void
}

function useProgram({ history, now, stages }: Common, state: FluencyState) {
  return useMemo(
    () => starterProgram({ history, goal: state.goal, stages, notes: state.notes, now }),
    [history, now, stages, state.goal, state.notes],
  )
}

const stageLabel = (stage: number) => `Stage ${String(stage).padStart(2, '0')}`
const itemMeta = (item: ProgramItem) =>
  item.kind === 'lesson' ? 'Lesson' : [stageLabel(item.stage), item.role === 'Application' ? '' : item.role].filter(Boolean).join(' · ')
const weekDates = (week: ProgramWeek) =>
  `${new Date(week.startsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${new Date(week.endsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`

function ItemRow({ item, openRep, openLesson }: { item: ProgramItem } & Pick<Common, 'openRep' | 'openLesson'>) {
  return (
    <ListRow
      className={item.done ? 'is-done' : undefined}
      marker={
        <span className="today-mark" data-done={item.done || undefined}>
          {item.done && <Icon name="check" />}
        </span>
      }
      title={item.kind === 'lesson' ? `Lesson: ${item.title}` : item.title}
      meta={itemMeta(item)}
      status={item.done ? <StatusChip tone="success">Done</StatusChip> : <span className="visually-hidden">Not done yet</span>}
      onOpen={() => (item.kind === 'lesson' ? openLesson(item.id) : openRep(item.id))}
      onPreview={item.kind === 'rep' ? () => preloadPractice(item.id) : undefined}
    />
  )
}

function WeekMeter({ program }: { program: StarterProgram }) {
  return (
    <span className="today-meter" aria-hidden="true">
      {program.weeks.map(week => (
        <span key={week.number} data-done={week.number <= program.week || undefined} />
      ))}
    </span>
  )
}

/**
 * The first four weeks on Trail, while they run: this week's targets with their done checks. After week four it shows
 * the finish state until the reflection is saved, or for one more week, then leaves Trail; the page under Progress stays.
 */
export default function StarterProgramCard(props: Common & { state: FluencyState }) {
  const program = useProgram(props, props.state)
  if (!program.onTrail) return null
  const week = program.weeks[program.week - 1]
  return (
    <section className="starter-card" aria-labelledby="starter-heading">
      <div className="today-plan-head">
        <h2 id="starter-heading">Your first 4 weeks</h2>
        <span className="today-plan-count">{program.finished ? 'Finished' : `Week ${program.week} of ${programWeeks}`}</span>
        <WeekMeter program={program} />
      </div>
      {program.finished ? (
        <p className="today-done">
          <Icon name="check" />
          <span>
            <strong>Four weeks done.</strong> {program.done} of {program.total} {plural(program.total, 'target')} completed. Take two
            minutes to look back before you go on.
          </span>
        </p>
      ) : week.items.length ? (
        <>
          <ul className="list-rows today-rows" aria-label={`Week ${week.number} targets`}>
            {week.items.map(item => (
              <ItemRow key={`${item.kind}:${item.id}`} item={item} openRep={props.openRep} openLesson={props.openLesson} />
            ))}
          </ul>
          {week.done === week.items.length && (
            <p className="today-done">
              <Icon name="check" />
              <span>
                <strong>This week's targets are done.</strong> You can stop here; next week's are on the page.
              </span>
            </p>
          )}
        </>
      ) : (
        <p className="starter-quiet">No new reps this week. Reviews and recall keep what you learned.</p>
      )}
      <p className="today-more">
        <Button variant="text" onClick={() => goToView('first-weeks')}>
          {program.finished ? 'Look back on your four weeks' : 'See all four weeks'}
          <Icon name="arrow" />
        </Button>
      </p>
    </section>
  )
}

/** The whole program under Progress (#/first-weeks): every week's targets, then the reflection that ends it. */
export function StarterProgramPage(props: Common & { fluency: ReturnType<typeof useFluency> }) {
  const { fluency, history, now } = props
  const program = useProgram(props, fluency.state)
  const facts = [
    {
      label: 'This week',
      value: program.finished ? 'Finished' : `Week ${program.week} of ${programWeeks}`,
      note: program.started ? `Started ${formatDate(program.startAt)}` : 'Starts with your first completed rep',
    },
    { label: 'Targets done', value: `${program.done} of ${program.total}`, note: 'new reps and their lessons' },
    { label: 'New reps a week', value: String(program.perWeek), note: 'from your practice days and minutes' },
  ]
  return (
    <main className="progress-main starter-main">
      <PageHeader
        back={{ label: 'Skills', onClick: () => goToView('progress') }}
        title="Your first 4 weeks"
        description="A short starter program: a few reps from your goal track each week, then a look back."
      />
      <dl className="week-review-facts starter-facts" aria-label="Program summary">
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
      <InfoNote label="How the four weeks work">
        <p>
          Week one starts on the day of your first completed rep. Each week takes the next reps on your trail, with the lesson the trail
          places before them; recall reps come back later as reviews. Your practice days and minutes per session set how many reps a week,
          so changing them on the practice week page changes the weeks.
        </p>
        <p>
          Done means completed at least once, hints included; Skills shows what is Independent or Retained. Only the reflection you save to
          your Notebook is stored.
        </p>
      </InfoNote>
      <div className="starter-weeks">
        {program.weeks.map(week => (
          <ListGroup
            key={week.number}
            title={week.number === program.week ? `Week ${week.number} · This week` : `Week ${week.number}`}
            meta={`${weekDates(week)} · ${week.done} of ${week.items.length} done`}
            open={week.number === program.week}
          >
            {week.items.length ? (
              week.items.map(item => (
                <ItemRow key={`${item.kind}:${item.id}`} item={item} openRep={props.openRep} openLesson={props.openLesson} />
              ))
            ) : (
              <li className="starter-quiet">No new reps this week. Reviews and recall keep what you learned.</li>
            )}
          </ListGroup>
        ))}
      </div>
      {program.week >= programWeeks && <Reflection program={program} history={history} now={now} fluency={fluency} />}
    </main>
  )
}

/** The look back that ends the program. Saving writes one ordinary Notebook note; nothing else is stored. */
function Reflection({
  program,
  history,
  now,
  fluency,
}: {
  program: StarterProgram
  history: PortableRecord[]
  now: number
  fluency: ReturnType<typeof useFluency>
}) {
  const [answers, setAnswers] = useState<string[]>(() => reflectionQuestions.map(() => ''))
  const [message, setMessage] = useState('')
  const written = answers.some(answer => answer.trim())
  function save() {
    const note = {
      id: `${reflectionPrefix}${crypto.randomUUID()}`,
      title: `Your first 4 weeks · ${formatDate(now)}`,
      body: reflectionBody(program, history, answers),
      skillId: '',
      repId: '',
      kind: 'note' as const,
      updatedAt: new Date(now).toISOString(),
    }
    if (fluency.update({ ...fluency.state, notes: [note, ...fluency.state.notes] })) setMessage('')
    else setMessage('Your reflection could not be saved. Your writing is still here.')
  }
  return (
    <section className="starter-reflection" aria-labelledby="starter-reflection-title">
      <h2 id="starter-reflection-title">Look back on your first four weeks</h2>
      {program.reflection ? (
        <div className="feedback-note starter-saved" data-state="success" role="status">
          <p>
            <Icon name="check" />
            <strong>Saved to your Notebook {formatDate(program.reflection.updatedAt)}.</strong>
          </p>
          <p className="starter-reflection-body">{program.reflection.body}</p>
          <Button variant="text" onClick={() => goToView('notebook')}>
            Open Notebook
            <Icon name="arrow" />
          </Button>
        </div>
      ) : (
        <>
          <p className="starter-lead">
            {program.finished ? 'Your four weeks are done.' : 'This is the last week.'} Answer any of these; they save together as one
            Notebook note.
          </p>
          {reflectionQuestions.map((question, index) => (
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
              <p className="feedback-note" data-state="error" role="alert">
                {message}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
