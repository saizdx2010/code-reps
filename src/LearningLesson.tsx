import { InlineCode } from './InlineCode'
import { formatDate } from './ui-copy.ts'
import { InfoNote } from './Layout'
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
import { useSessionPreference } from './useSessionPreference'

const defaultReview = (): SelfReview => ({
  understanding: 'not-yet', approach: 'not-yet', implementation: 'not-yet', explanation: 'not-yet',
  evidence: '', updatedAt: new Date().toISOString(),
})
const sectionLabels: Record<string, string> = { read: 'Read', predict: 'Predict', practise: 'Practice', review: 'Review' }

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
  useEffect(() => { revealElement(article.current?.querySelector(`#lesson-${section}`) ?? null) }, [section, skill.id])
  function revealLesson(next: string) {
    setSection(next)
    if (next === 'review') setReviewOpen(true)
  }
  const depth = lessonDepth[skill.id]
  const bookmarked = state.bookmarks.includes(skill.id)
  function toggleBookmark() {
    update({ ...state, bookmarks: bookmarked ? state.bookmarks.filter(id => id !== skill.id) : [...state.bookmarks, skill.id] })
  }
  return <article ref={article} className="knowledge-article">
    <div className="hub-heading">
      <div><h2>{skill.title}</h2><p><InlineCode text={skill.summary} /></p></div>
      <Button type="button" aria-pressed={bookmarked} onClick={toggleBookmark}>{bookmarked ? 'Bookmarked' : 'Bookmark'}</Button>
    </div>
    <nav className="lesson-navigation" aria-label="Lesson sections">
      <StepIndicator active={section} />
      {['read', 'predict', 'practise', 'review'].map(id => (
        <Button key={id} aria-current={section === id ? 'location' : undefined} onClick={() => revealLesson(id)}>
          {sectionLabels[id]}
        </Button>
      ))}
    </nav>
    <div id="lesson-read" hidden={section !== 'read'} tabIndex={-1}>
    {skill.prerequisites.length > 0 && <div className="prerequisite-links">
      <strong>Helpful foundations</strong>
      {skill.prerequisites.map(id => <Button type="button" key={id} onClick={() => onSkill(id)}>{skillById(id)?.title}</Button>)}
      <p>These are suggestions. You can practice any skill at any time.</p>
    </div>}
    <section><h3>What you will learn</h3><ul>{skill.objectives.map(o => <li key={o}><InlineCode text={o} /></li>)}</ul></section>
    {skill.sections.map(section => <section key={section.title}>
      <h3>{section.title}</h3>
      <p><InlineCode text={section.body} /></p>
    </section>)}
    <section>
      <h3>A worked example</h3>
      <pre><code>{skill.example}</code></pre>
      <ol>{skill.walkthrough.map(step => <li key={step}><InlineCode text={step} /></li>)}</ol>
    </section>
    {depth && <section>
      <h3>{depth.title}</h3>
      <pre><code>{depth.code}</code></pre>
      <p><InlineCode text={depth.reasoning} /></p>
      <h4>Reason it through</h4>
      <p><InlineCode text={depth.challenge} /></p>
      <p>Write your prediction and reason before opening the discussion. Review your reasoning yourself.</p>
      <details><summary>Compare your reasoning</summary><p><InlineCode text={depth.answer} /></p></details>
    </section>}
    <section><h3>Common mistakes</h3><ul>{skill.mistakes.map(m => <li key={m}><InlineCode text={m} /></li>)}</ul></section>
    </div>
    <section id="lesson-predict" hidden={section !== 'predict'} tabIndex={-1}>
      <h3>Predict, then check</h3>
      <p>Predict what happens and check your answer. These questions help you read code; independent coding needs a rep without hints.</p>
      <LessonQuestions skill={skill} state={state} update={update} />
    </section>
    <section id="lesson-practise" hidden={section !== 'practise'} tabIndex={-1}>
      <h3>Apply the skill</h3>
      <div className="rep-links">
        {skill.repIds.map(id => <Button type="button" key={id} onClick={() => openRep(id)}>{repTitle(id)}</Button>)}
      </div>
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
        {skill.related.map(id => <Button type="button" key={id} onClick={() => onSkill(id)}>{skillById(id)?.title}</Button>)}
      </div>
    </section>
  </article>
}

function LessonQuestions({ skill, state, update }: { skill: Skill; state: FluencyState; update: (next: FluencyState) => boolean }) {
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [responses, setResponses] = useState<Record<string, string>>({})
  return skill.questions.map(question => {
    const id = `${skill.id}:${question.id}`
    const answer = state.answers[id]
    const choice = choices[id] ?? answer?.choice
    const response = responses[id] ?? answer?.response ?? ''
    function check() {
      const correct = question.completion ? response.trim() === question.options[question.answer] : choice === question.answer
      update({ ...state, answers: { ...state.answers, [id]: {
        choice: question.completion ? question.answer : choice!, correct, answeredAt: new Date().toISOString(),
        ...(question.completion ? { response } : {}),
      } } })
    }
    return <fieldset className="lesson-question" key={id}>
      <legend><InlineCode text={question.prompt} /></legend>
      {question.code && <pre><code>{question.code}</code></pre>}
      {question.completion
        ? <label>Missing code<Input
          type="text" value={response} maxLength={300} spellCheck={false}
          onChange={e => setResponses({ ...responses, [id]: e.target.value })}
        /></label>
        : question.options.map((option, i) => <label key={option}>
          <Input type="radio" name={id} checked={choice === i} onChange={() => setChoices({ ...choices, [id]: i })} />
          <InlineCode text={option} />
        </label>)}
      <Button variant="primary" type="button" disabled={question.completion ? !response.trim() : choice === undefined} onClick={check}>
        Check prediction
      </Button>
      {answer && <p className="lesson-feedback feedback-note" data-state={answer.correct ? 'success' : 'error'} role="status">
        <Icon name={answer.correct ? 'check' : 'alert'} />
        <strong>{answer.correct ? 'Correct prediction.' : 'Revisit this idea.'}</strong> <InlineCode text={question.explanation} />
        {' '}<span>Last checked {formatDate(answer.answeredAt)}.</span>
      </p>}
    </fieldset>
  })
}

function LessonEvidence({ skillId, state, history }: { skillId: string; state: FluencyState; history: PortableRecord[] }) {
  const evidence = skillEvidence(skillId, history, state)
  const recall = evidence.retained
    ? `Delayed independent recall recorded ${formatDate(evidence.retained.completedAt)}.`
    : 'No delayed independent recall recorded for this skill.'
  return <section className="skill-evidence">
    <h3>Your evidence</h3>
    <p>
      {evidence.lessonCorrect} of {evidence.lessonTotal} latest predictions correct. {evidence.attempts.length} completed coding attempts;
      {' '}{evidence.independent.length} without revealed hints.
    </p>
    <p>{recall} Code checks and predictions do not assess your written reasoning.</p>
    {evidence.attempts.length > 0 && <details>
      <summary>Inspect the attempts</summary>
      <ul>{evidence.attempts.slice(0, 10).map(a => (
        <li key={a.id}>{repTitle(a.repId)} · {formatDate(a.completedAt)} · {a.hintCount} hints</li>
      ))}</ul>
    </details>}
  </section>
}

function LessonSelfReview({ skillId, state, update }: { skillId: string; state: FluencyState; update: (next: FluencyState) => boolean }) {
  const review = state.reviews[skillId] ?? defaultReview()
  function saveReview(key: keyof SelfReview, value: string) {
    update({ ...state, reviews: { ...state.reviews, [skillId]: { ...review, [key]: value, updatedAt: new Date().toISOString() } } })
  }
  return <section>
    <h3>Assess yourself</h3>
    <InfoNote>
      <p>
        Use the criteria and name the attempt or example supporting your judgment. These are your assessments, separate from checked
        behavior.
      </p>
    </InfoNote>
    <div className="rubric-grid">{(Object.keys(rubrics) as (keyof typeof rubrics)[]).map(dimension => <fieldset key={dimension}>
      <legend>{dimension}</legend>
      <ul>{rubrics[dimension].map(point => <li key={point}>{point}</li>)}</ul>
      <label>Your judgment<Select value={review[dimension]} onChange={e => saveReview(dimension, e.target.value)}>
        {Object.entries(judgmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select></label>
    </fieldset>)}</div>
    <label htmlFor="lesson-evidence">Evidence and what to improve</label>
    <Textarea
      id="lesson-evidence" value={review.evidence} maxLength={20_000} rows={4} onChange={e => saveReview('evidence', e.target.value)}
      placeholder="Name the attempt, explain your evidence, and identify a next step."
    />
    {state.reviews[skillId] && <p className="utility-note">Self-review updated {formatDate(review.updatedAt, true)}.</p>}
  </section>
}
