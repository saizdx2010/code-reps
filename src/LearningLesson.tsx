import { InlineCode } from './InlineCode'
import { formatDate } from './ui-copy.ts'
import { InfoNote, ListRow, StatusChip } from './Layout'
import { repLevelLabel } from './rep-levels.ts'
import { Button } from './Button'
import { Icon } from './Icon'
import { StepIndicator } from './StepIndicator'
import { revealElement } from './ui-motion'
import { Input, Select, Textarea } from './Input'
import { useEffect, useRef, useState } from 'react'
import { skills, skillById } from './knowledge'
import type { Skill } from './knowledge'
import { lessonDepth } from './lesson-depth'
import { rubrics, skillEvidence } from './fluency'
import type { FluencyState, SelfReview } from './fluency'
import { judgmentLabels } from './learning-pages'
import type { PortableRecord } from './portability'
import { repTitle } from './rep-index.ts'
import { preloadPractice } from './editor-loader'
import { useSessionPreference } from './useSessionPreference'
import './milestones.css'

const defaultReview = (): SelfReview => ({
  understanding: 'not-yet',
  approach: 'not-yet',
  implementation: 'not-yet',
  explanation: 'not-yet',
  evidence: '',
  updatedAt: new Date().toISOString(),
})
const sectionLabels: Record<string, string> = { read: 'Read', predict: 'Predict', practise: 'Practice', review: 'Review' }
// Section ids are saved per lesson in session state, so they keep their original spelling.
const [, , practiceSection] = ['read', 'predict', 'practise', 'review']

type Props = {
  skillId: string
  state: FluencyState
  update: (next: FluencyState) => boolean
  history: PortableRecord[]
  openRep: (id: string) => void
  onSkill: (id: string) => void
}

/** One knowledge lesson: read, predict, apply, then review the learner's own evidence. */
export function LearningLesson({ skillId, state, update, openRep, onSkill, history }: Props) {
  const skill = skillById(skillId) ?? skills[0]
  const article = useRef<HTMLElement>(null)
  const [section, setSection] = useSessionPreference<string>(`lesson-section:${skill.id}`, 'read')
  const [reviewOpen, setReviewOpen] = useState(false)
  useEffect(() => {
    revealElement(article.current?.querySelector(`#lesson-${section}`) ?? null)
  }, [section, skill.id])
  function revealLesson(next: string) {
    setSection(next)
    if (next === 'review') setReviewOpen(true)
  }
  const depth = lessonDepth[skill.id]
  const checked = skill.questions.filter(question => state.answers[`${skill.id}:${question.id}`]).length
  const practiced = skill.repIds.filter(id => history.some(record => record.repId === id)).length
  // Each tab says how far it has gone, so a learner can see what is left without opening it.
  const progress: Record<string, string> = {
    predict: skill.questions.length ? `${checked}/${skill.questions.length}` : '',
    practise: skill.repIds.length ? `${practiced}/${skill.repIds.length}` : '',
  }
  const [reasoning, setReasoning] = useSessionPreference<string>(`lesson-reasoning:${skill.id}`, '')
  // Every section ends with the next one, so the loop read, predict, practice, review is one click at a time.
  const next = (to: string, label: string) => (
    <div className="lesson-next">
      <Button variant="primary" onClick={() => revealLesson(to)}>
        {label}
        <Icon name="arrow" />
      </Button>
    </div>
  )
  const bookmarked = state.bookmarks.includes(skill.id)
  function toggleBookmark() {
    update({ ...state, bookmarks: bookmarked ? state.bookmarks.filter(id => id !== skill.id) : [...state.bookmarks, skill.id] })
  }
  return (
    <article ref={article} className="knowledge-article">
      <div className="hub-heading">
        <div>
          <h2>{skill.title}</h2>
          <p>
            <InlineCode text={skill.summary} />
          </p>
        </div>
        <Button type="button" aria-pressed={bookmarked} onClick={toggleBookmark}>
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
      </div>
      <nav className="lesson-navigation" aria-label="Lesson sections">
        <StepIndicator active={section} />
        {['read', 'predict', 'practise', 'review'].map(id => (
          <Button
            key={id}
            aria-label={sectionLabels[id]}
            aria-describedby={progress[id] ? `lesson-tab-${id}` : undefined}
            aria-current={section === id ? 'location' : undefined}
            onClick={() => revealLesson(id)}
          >
            {sectionLabels[id]}
            {progress[id] && (
              <small id={`lesson-tab-${id}`} className="lesson-tab-progress">
                {progress[id]}
              </small>
            )}
          </Button>
        ))}
      </nav>
      <div id="lesson-read" hidden={section !== 'read'} tabIndex={-1}>
        {skill.prerequisites.length > 0 && (
          <div className="prerequisite-links">
            <strong>Helpful foundations</strong>
            {skill.prerequisites.map(id => (
              <Button type="button" key={id} onClick={() => onSkill(id)}>
                {skillById(id)?.title}
              </Button>
            ))}
            <p>These are suggestions. You can practice any skill at any time.</p>
          </div>
        )}
        <section>
          <h3>What you will learn</h3>
          <ul>
            {skill.objectives.map(o => (
              <li key={o}>
                <InlineCode text={o} />
              </li>
            ))}
          </ul>
        </section>
        {skill.sections.map(section => (
          <section key={section.title}>
            <h3>{section.title}</h3>
            <p>
              <InlineCode text={section.body} />
            </p>
          </section>
        ))}
        <section>
          <h3>A worked example</h3>
          <pre>
            <code>{skill.example}</code>
          </pre>
          <ol>
            {skill.walkthrough.map(step => (
              <li key={step}>
                <InlineCode text={step} />
              </li>
            ))}
          </ol>
        </section>
        {depth && (
          <section>
            <h3>{depth.title}</h3>
            <pre>
              <code>{depth.code}</code>
            </pre>
            <p>
              <InlineCode text={depth.reasoning} />
            </p>
            <h4>Reason it through</h4>
            <p>
              <InlineCode text={depth.challenge} />
            </p>
            <label className="field-label" htmlFor={`reasoning-${skill.id}`}>
              Your prediction and reason <span className="optional-note">kept in this browser session; you review it yourself</span>
            </label>
            <Textarea
              id={`reasoning-${skill.id}`}
              rows={3}
              maxLength={5_000}
              value={reasoning}
              onChange={event => setReasoning(event.target.value)}
              placeholder="I predict… because…"
            />
            <details className="reasoning-compare">
              <summary>{reasoning.trim() ? 'Compare with the discussion' : 'Show the discussion (write yours first to compare)'}</summary>
              <div className="reasoning-columns">
                {reasoning.trim() && (
                  <div>
                    <strong>Your reasoning</strong>
                    <p>{reasoning}</p>
                  </div>
                )}
                <div>
                  <strong>Discussion</strong>
                  <p>
                    <InlineCode text={depth.answer} />
                  </p>
                </div>
              </div>
            </details>
          </section>
        )}
        <section>
          <h3>Common mistakes</h3>
          <ul>
            {skill.mistakes.map(m => (
              <li key={m}>
                <InlineCode text={m} />
              </li>
            ))}
          </ul>
        </section>
        {skill.questions.length
          ? next('predict', `Next: Predict · ${skill.questions.length} ${skill.questions.length === 1 ? 'question' : 'questions'}`)
          : next(practiceSection, 'Next: Practice')}
      </div>
      <section id="lesson-predict" hidden={section !== 'predict'} tabIndex={-1}>
        <h3>Predict, then check</h3>
        <p>Predict what happens and check your answer. These questions help you read code; independent coding needs a rep without hints.</p>
        <LessonQuestions skill={skill} state={state} update={update} />
        {/* Once every prediction is checked, the lesson closes: the first-check score, then the rep that uses it next. */}
        {skill.questions.length > 0 && checked === skill.questions.length ? (
          <LessonCloseout
            skill={skill}
            state={state}
            history={history}
            openRep={openRep}
            onPractice={() => revealLesson(practiceSection)}
          />
        ) : (
          next(practiceSection, `Next: Practice · ${skill.repIds.length} ${skill.repIds.length === 1 ? 'rep' : 'reps'}`)
        )}
      </section>
      <section id="lesson-practise" hidden={section !== 'practise'} tabIndex={-1}>
        <h3>Apply the skill</h3>
        <p>
          {practiced} of {skill.repIds.length} done. Each opens in the workspace, and its back link returns here.
        </p>
        <ul className="list-rows lesson-reps">
          {skill.repIds.map(id => {
            const done = history.some(record => record.repId === id)
            return (
              <ListRow
                key={id}
                title={repTitle(id)}
                status={
                  <>
                    {repLevelLabel(id) && <span className="list-row-level">{repLevelLabel(id)}</span>}
                    {done ? <StatusChip tone="success">Completed</StatusChip> : <span className="visually-hidden">Not started</span>}
                  </>
                }
                onOpen={() => openRep(id)}
              />
            )
          })}
        </ul>
        {next('review', 'Next: Review your evidence')}
      </section>
      <div id="lesson-review" hidden={section !== 'review'} tabIndex={-1}>
        <details className="lesson-review-details" open={reviewOpen} onToggle={event => setReviewOpen(event.currentTarget.open)}>
          <summary>Your evidence and self-assessment</summary>
          <LessonEvidence skillId={skill.id} state={state} history={history} />
          <LessonSelfReview skillId={skill.id} state={state} update={update} />
        </details>
      </div>
      <section hidden={section !== 'read'}>
        <h3>Related knowledge</h3>
        <div className="rep-links">
          {skill.related.map(id => (
            <Button type="button" key={id} onClick={() => onSkill(id)}>
              {skillById(id)?.title}
            </Button>
          ))}
        </div>
      </section>
    </article>
  )
}

/**
 * The close of a lesson's Predict section, once every question has a first check: how many first predictions were right,
 * and the reps that use the lesson next, with the first one not yet completed as the one primary action.
 */
function LessonCloseout({
  skill,
  state,
  history,
  openRep,
  onPractice,
}: {
  skill: Skill
  state: FluencyState
  history: PortableRecord[]
  openRep: (id: string) => void
  onPractice: () => void
}) {
  const right = skill.questions.filter(question => state.answers[`${skill.id}:${question.id}`]?.correct).length
  const total = skill.questions.length
  const open = skill.repIds.filter(id => !history.some(record => record.repId === id))
  const [first, ...later] = open
  return (
    <section className="closeout lesson-closeout" aria-labelledby={`lesson-closeout-${skill.id}`}>
      <p className="closeout-label">
        <Icon name="check" />
        Lesson checked
      </p>
      <h4 id={`lesson-closeout-${skill.id}`}>
        {right} of {total} {total === 1 ? 'prediction' : 'predictions'} right on the first check
      </h4>
      <p>
        {right === total ? 'Every first prediction held. ' : 'Your first checks stay as they were; checking again above is practice. '}
        Predictions show you can read the idea. Using it in a rep without hints shows you can apply it.
      </p>
      {first ? (
        <>
          <Button
            variant="primary"
            className="closeout-action"
            onMouseEnter={() => preloadPractice(first)}
            onFocus={() => preloadPractice(first)}
            onClick={() => openRep(first)}
          >
            Use it next: {repTitle(first)}
            <Icon name="arrow" />
          </Button>
          {later.length > 0 && (
            <p className="closeout-also">
              Then {later.slice(0, 2).map(repTitle).join(' and ')}
              {later.length > 2 ? `, and ${later.length - 2} more` : ''}.{' '}
              <Button variant="text" onClick={onPractice}>
                See every rep
              </Button>
            </p>
          )}
        </>
      ) : (
        <p className="closeout-also">
          Every rep that uses this lesson is completed.{' '}
          <Button variant="text" onClick={onPractice}>
            See them in Practice
          </Button>
        </p>
      )}
    </section>
  )
}

// An option is shown as code unless it already carries its own inline-code marks.
const asCode = (option: string) => (option.includes('`') ? <InlineCode text={option} /> : <code>{option}</code>)

function LessonQuestions({ skill, state, update }: { skill: Skill; state: FluencyState; update: (next: FluencyState) => boolean }) {
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [responses, setResponses] = useState<Record<string, string>>({})
  // Retries after the first check are practice: shown here, never written over the recorded first prediction.
  const [retries, setRetries] = useState<Record<string, { choice: number; response?: string; correct: boolean }>>({})
  return skill.questions.map(question => {
    const id = `${skill.id}:${question.id}`
    const answer = state.answers[id]
    const choice = choices[id] ?? answer?.choice
    const response = responses[id] ?? answer?.response ?? ''
    const retry = retries[id]
    // Feedback belongs to the choice that was checked; changing the choice hides it until the next check.
    const shown =
      retry && retry.choice === choice && (!question.completion || retry.response === response)
        ? { ...retry, practice: true }
        : answer && !retries[id] && answer.choice === choice && (!question.completion || (answer.response ?? '') === response)
          ? { choice: answer.choice, response: answer.response, correct: answer.correct, practice: false }
          : undefined
    function check() {
      const correct = question.completion ? response.trim() === question.options[question.answer] : choice === question.answer
      if (answer) {
        setRetries({ ...retries, [id]: { choice: question.completion ? question.answer : choice!, response, correct } })
        return
      }
      update({
        ...state,
        answers: {
          ...state.answers,
          [id]: {
            choice: question.completion ? question.answer : choice!,
            correct,
            answeredAt: new Date().toISOString(),
            ...(question.completion ? { response } : {}),
          },
        },
      })
    }
    const pick = (i: number) => {
      setChoices({ ...choices, [id]: i })
    }
    return (
      <fieldset className="lesson-question" key={id}>
        <legend>
          <InlineCode text={question.prompt} />
        </legend>
        {question.code && (
          <pre>
            <code>{question.code}</code>
          </pre>
        )}
        {question.completion ? (
          <label>
            Missing code
            <Input
              type="text"
              value={response}
              maxLength={300}
              spellCheck={false}
              onChange={e => setResponses({ ...responses, [id]: e.target.value })}
            />
          </label>
        ) : (
          question.options.map((option, i) => {
            const mark = shown ? (i === question.answer ? 'is-answer' : i === shown.choice ? 'is-chosen-wrong' : '') : ''
            return (
              <label key={option} className={mark || undefined}>
                <Input type="radio" name={id} checked={choice === i} onChange={() => pick(i)} />
                <InlineCode text={option} />
                {mark === 'is-answer' && (
                  <span className="lesson-option-note" aria-hidden="true">
                    Answer
                  </span>
                )}
                {mark === 'is-chosen-wrong' && (
                  <span className="lesson-option-note" aria-hidden="true">
                    Your choice
                  </span>
                )}
              </label>
            )
          })
        )}
        {!shown && (
          <Button variant="primary" type="button" disabled={question.completion ? !response.trim() : choice === undefined} onClick={check}>
            {answer ? 'Check again (practice)' : 'Check prediction'}
          </Button>
        )}
        {shown && (
          <div className="lesson-feedback feedback-note" data-state={shown.correct ? 'success' : 'error'} role="status">
            <Icon name={shown.correct ? 'check' : 'alert'} play={shown.correct ? 'correct' : 'revisit'} />
            <div>
              <p>
                <strong>{shown.correct ? 'Correct prediction.' : 'Revisit this idea.'}</strong>{' '}
                {!shown.correct && !question.completion && (
                  <>
                    You chose {asCode(question.options[shown.choice])}; the answer is {asCode(question.options[question.answer])}.{' '}
                  </>
                )}
                <InlineCode text={question.explanation} />
              </p>
              <p className="lesson-feedback-meta">
                {shown.practice
                  ? 'Practice check: your first prediction stays as your evidence.'
                  : `Your first prediction, checked ${formatDate(answer!.answeredAt)}. Later checks are practice.`}
              </p>
            </div>
          </div>
        )}
      </fieldset>
    )
  })
}

function LessonEvidence({ skillId, state, history }: { skillId: string; state: FluencyState; history: PortableRecord[] }) {
  const evidence = skillEvidence(skillId, history, state)
  const recall = evidence.retained
    ? `Delayed independent recall recorded ${formatDate(evidence.retained.completedAt)}.`
    : 'No delayed independent recall recorded for this skill.'
  return (
    <section className="skill-evidence">
      <h3>Your evidence</h3>
      <p>
        {evidence.lessonCorrect} of {evidence.lessonTotal} predictions correct on the first check. {evidence.attempts.length} completed
        coding attempts; {evidence.independent.length} without revealed hints.
      </p>
      <p>{recall} Code checks and predictions do not assess your written reasoning.</p>
      {evidence.attempts.length > 0 && (
        <details>
          <summary>Inspect the attempts</summary>
          <ul>
            {evidence.attempts.slice(0, 10).map(a => (
              <li key={a.id}>
                {repTitle(a.repId)} · {formatDate(a.completedAt)} · {a.hintCount} hints
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function LessonSelfReview({ skillId, state, update }: { skillId: string; state: FluencyState; update: (next: FluencyState) => boolean }) {
  const review = state.reviews[skillId] ?? defaultReview()
  function saveReview(key: keyof SelfReview, value: string) {
    update({ ...state, reviews: { ...state.reviews, [skillId]: { ...review, [key]: value, updatedAt: new Date().toISOString() } } })
  }
  return (
    <section>
      <h3>Assess yourself</h3>
      <InfoNote label="How self-review works">
        <p>
          Use the criteria and name the attempt or example supporting your judgment. These are your assessments, separate from checked
          behavior.
        </p>
      </InfoNote>
      <div className="rubric-grid">
        {(Object.keys(rubrics) as (keyof typeof rubrics)[]).map(dimension => (
          <fieldset key={dimension}>
            <legend>{dimension}</legend>
            <ul>
              {rubrics[dimension].map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <label>
              Your judgment
              <Select value={review[dimension]} onChange={e => saveReview(dimension, e.target.value)}>
                {Object.entries(judgmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
          </fieldset>
        ))}
      </div>
      <label htmlFor="lesson-evidence">Evidence and what to improve</label>
      <Textarea
        id="lesson-evidence"
        value={review.evidence}
        maxLength={20_000}
        rows={4}
        onChange={e => saveReview('evidence', e.target.value)}
        placeholder="Name the attempt, explain your evidence, and identify a next step."
      />
      {state.reviews[skillId] && <p className="utility-note">Self-review updated {formatDate(review.updatedAt, true)}.</p>}
    </section>
  )
}
