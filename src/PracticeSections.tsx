import { lazy, Suspense, useRef } from 'react'
import type { ReactNode } from 'react'
import { confidenceLabels, difficultyLabels } from './attempt-labels.ts'
import type { Confidence, Difficulty } from './attempt-labels.ts'
import type { Attempt, AttemptRecord } from './attempt-store'
import { Button } from './Button'
import { preloadEditor } from './editor-loader'
import { Icon } from './Icon'
import { InlineCode } from './InlineCode'
import { Input, Textarea } from './Input'
import { InfoNote } from './Layout'
import { lazyRoute } from './lazy-route'
import { mistakeTags } from './mistakes'
import { appendSentenceStarter } from './practice'
import type { practiceWritingPrompts } from './practice'
import type { RepSummary } from './catalog-index'
import type { RepLesson } from './rep-content'
import type { repNotes } from './rep-notes.ts'
import type { Rep } from './rep-types'
import { StepIndicator } from './StepIndicator'
import type { useRepContent } from './useRepContent'
import type { useReviewContent } from './useReviewContent'

const RepGuidance = lazy(() => import('./RepGuidance'))
const TraceViewer = lazyRoute(() => import('./TraceViewer').then(module => module.TraceViewer), 'The trace')

type Writing = ReturnType<typeof practiceWritingPrompts>
type RepContent = ReturnType<typeof useRepContent>
type ReviewContent = ReturnType<typeof useReviewContent>
export type UpdateAttempt = <K extends keyof Attempt>(key: K, value: Attempt[K]) => void
/** Moves to a practice section by its element id. */
type Reveal = (section: string) => void

/** Stands in for the brief while the rep's content loads, or offers a retry when it fails. */
export function RepContentNotice({ content }: { content: RepContent }) {
  if (content.status !== 'error') return <p className="rep-content-notice" role="status">Loading the brief…</p>
  const retryHint = ' Retrying did not help; reloading the app usually does.'
  const reload = () => { if (window.dispatchEvent(new Event('code-reps-save-current', { cancelable: true }))) window.location.reload() }
  return <div className="rep-content-notice" role="alert">
    <p>This rep's brief could not load. Your draft is safe.{content.failures > 1 && retryHint}</p>
    <Button type="button" onClick={content.retry}>Retry</Button>
    {content.failures > 1 && <Button type="button" onClick={reload}>Reload app</Button>}
  </div>
}

/** A writing box with sentence starters that append to it and return focus to the end of the text. */
function WritingField({ id, label, kind, starters, value, onChange, placeholder, rows }: {
  id: string; label: string; kind: string; starters: readonly string[]; value: string; onChange: (value: string) => void
  placeholder: string; rows: number
}) {
  const field = useRef<HTMLTextAreaElement>(null)
  function insertStarter(starter: string) {
    onChange(appendSentenceStarter(value, starter))
    field.current?.focus()
    requestAnimationFrame(() => field.current?.setSelectionRange(field.current.value.length, field.current.value.length))
  }
  return <>
    <label className="field-label" htmlFor={id}>{label}</label>
    <div className="sentence-starters" role="group" aria-label={`${kind} sentence starters`}>
      {starters.map(starter => <Button key={starter} onClick={() => insertStarter(starter)}>{starter}</Button>)}
    </div>
    <Textarea ref={field} id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
  </>
}

function BriefRules({ rules }: { rules: string[] }) {
  return <ol className="brief-rules">{rules.map(rule => <li key={rule}><InlineCode text={rule} /></li>)}</ol>
}

export function BriefSection({ hidden, repId, full, lesson, notes, contentNotice, history, openRep, openLesson,
  indonesianHelp, onIndonesianHelp, glossary, hintCount, onRevealHint, onReveal }: {
  hidden: boolean; repId: string; full?: Rep; lesson?: RepLesson; notes: ReturnType<typeof repNotes>; contentNotice: ReactNode
  history: AttemptRecord[]; openRep: (id: string) => void; openLesson: (id: string) => void
  indonesianHelp: boolean; onIndonesianHelp: (on: boolean) => void; glossary?: Record<string, string>
  hintCount: number; onRevealHint: () => void; onReveal: Reveal
}) {
  return <section id="brief-section" hidden={hidden} tabIndex={-1} className="panel task-panel">
    {lesson && <div className="rep-lesson">
      <span className="home-label">Lesson before this rep</span>
      <h2>{lesson.title}</h2>
      <p><InlineCode text={lesson.explanation} /></p>
      <pre><code>{lesson.example}</code></pre>
      <p className="foundation-tip"><InlineCode text={lesson.tip} /></p>
    </div>}
    <div className="panel-heading"><h2>The brief</h2></div>
    <Suspense fallback={null}><RepGuidance repId={repId} history={history} openRep={openRep} openLesson={openLesson} /></Suspense>
    {full ? <>
      {full.context && <p className="rep-context"><InlineCode text={full.context} /></p>}
      {full.brief ? <div className="brief-structure">
        <p><InlineCode text={full.brief.summary} /></p>
        <h3 className="brief-subhead">Rules, in order</h3>
        <BriefRules rules={full.brief.rules} />
        {full.brief.edgeCases && <>
          <h3 className="brief-subhead">Edge cases</h3>
          <ul className="brief-rules">{full.brief.edgeCases.map(edge => <li key={edge}><InlineCode text={edge} /></li>)}</ul>
        </>}
      </div> : <p><InlineCode text={full.prompt} /></p>}
      {full.acceptanceCriteria && <ul className="acceptance-criteria">
        {full.acceptanceCriteria.map(point => <li key={point}><InlineCode text={point} /></li>)}
      </ul>}
      <div className="example">
        <div className="example-label">Example</div>
        <code>{full.example.input}</code>
        <span className="example-arrow"><Icon name="arrow" /></span>
        <code>{full.example.output}</code>
      </div>
      {notes.brief && <p className="task-note"><InlineCode text={notes.brief} /></p>}
      <InfoNote label="How this is checked">
        <p>
          Checks show how your code behaves in the tested cases. You review your plan and explanation yourself, including any variations.
        </p>
        {notes.checking && <p><InlineCode text={notes.checking} /></p>}
      </InfoNote>
      <label className="indonesian-help">
        <Input type="checkbox" checked={indonesianHelp} onChange={event => onIndonesianHelp(event.target.checked)} />Show Indonesian help
      </label>
      <details className="vocab">
        <summary>Quick vocabulary</summary>
        <div><p>{full.vocabulary.map((item, index) => <span key={item.term}>
          {index > 0 && ' ' }<b>{item.term}</b> means <InlineCode text={item.meaning} />.
          {glossary?.[item.term] && <span className="indonesian-gloss" lang="id"> {glossary[item.term]}.</span>}
        </span>)}</p></div>
      </details>
      <div className="hint-control">
        <button className="hint-button" type="button" disabled={hintCount >= full.hints.length} onClick={onRevealHint}>
          <Icon name="hint" />{hintCount >= full.hints.length ? 'All hints revealed' : `Reveal hint ${hintCount + 1}`}
        </button>
        <span>{hintCount} of {full.hints.length} revealed</span>
      </div>
      {hintCount > 0 && <div className="task-hints" aria-live="polite">
        <div className="hint-heading"><span className="hint-spark"><Icon name="hint" /></span><strong>Hints revealed</strong></div>
        <ol className="hint-list">{full.hints.slice(0, hintCount).map((hint) => <li key={hint}><InlineCode text={hint} /></li>)}</ol>
      </div>}
    </> : contentNotice}
    <button className="text-button step-next" type="button" onClick={() => onReveal('plan-section')}>
      Plan your approach<Icon name="arrow" />
    </button>
  </section>
}

export function PlanSection({ hidden, full, contentNotice, writing, plan, onPlan, onReveal }: {
  hidden: boolean; full?: Rep; contentNotice: ReactNode; writing: Writing; plan: string; onPlan: (plan: string) => void; onReveal: Reveal
}) {
  return <section id="plan-section" hidden={hidden} tabIndex={-1} className="panel plan-panel">
    <div className="panel-heading"><h2>Plan your approach</h2></div>
    <details className="plan-brief" open>
      <summary>The brief</summary>
      <div>{!full ? contentNotice : full.brief
        ? <><p><InlineCode text={full.brief.summary} /></p><BriefRules rules={full.brief.rules} /></>
        : <p><InlineCode text={full.prompt} /></p>}</div>
    </details>
    {writing.plan && <p>{writing.plan}</p>}
    <WritingField id="plan" label="Your plan" kind="Plan" starters={writing.starters.plan} value={plan} onChange={onPlan}
      placeholder="I'll start by…" rows={writing.rows} />
    <div className="field-foot">{writing.planHelp}</div>
    <button className="text-button plan-to-code" type="button" onClick={() => onReveal('solution-section')}>
      Go to code<Icon name="arrow" />
    </button>
  </section>
}

const defaultPlanGuide = ['Describe how you will use the inputs.', 'Name an edge case from the task.', 'Explain the steps before coding.']
const defaultExplanationGuide = ['Explain why the code handles the example and edge cases.', 'Describe the time and extra space used.']

export function ExplainSection({ hidden, repId, writing, explanation, onExplanation, englishTips, allPassed, review, onReveal }: {
  hidden: boolean; repId: string; writing: Writing; explanation: string; onExplanation: (explanation: string) => void
  englishTips?: readonly string[]; allPassed: boolean; review: ReviewContent; onReveal: Reveal
}) {
  const reflectionGuide = review.status === 'ready' ? review.content.reflectionGuides[repId] : undefined
  const depth = review.status === 'ready' ? review.content.repDepth[repId] : undefined
  return <section id="explain-section" hidden={hidden} tabIndex={-1} className="panel explain-panel">
    <div className="explain-intro"><div className="panel-heading"><h2>Explain your thinking</h2></div><p>{writing.explanation}</p></div>
    <div className="explain-form">
      <WritingField id="explanation" label="Your explanation" kind="Explanation" starters={writing.starters.explanation} value={explanation}
        onChange={onExplanation} placeholder="My solution works by…" rows={writing.rows} />
      {englishTips && <InfoNote label="English tips for Indonesian speakers">
        <ul>{englishTips.map(tip => <li key={tip}>{tip}</li>)}</ul>
      </InfoNote>}
      {allPassed && <details className="reflection-guide">
        <summary>Compare your plan and explanation</summary>
        <div className="reflection-guide-columns">
          <div>
            <strong>Plan</strong>
            <ul>{(reflectionGuide?.plan ?? defaultPlanGuide).map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
          <div>
            <strong>Explanation</strong>
            <ul>{(reflectionGuide?.explanation ?? defaultExplanationGuide).map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
        </div>
        {review.status === 'loading' && <p role="status">Loading the review…</p>}
        {review.status === 'error' && <div role="alert">
          <p>The review could not load. Your draft is safe.</p>
          <Button type="button" onClick={review.retry}>Retry</Button>
        </div>}
        {reflectionGuide && <div className="reflection-example">
          <strong>Example to compare with</strong><p>{reflectionGuide.example}</p>
        </div>}
        {depth && <div className="reflection-example">
          <h3>Why this works</h3><p>{depth.reasoning}</p>
          <h3>Trace a boundary case</h3><p>{depth.trace}</p>
          {depth.traceSteps && <Suspense fallback={<p className="loading-status" role="status">Opening trace…</p>}>
            <TraceViewer key={repId} trace={depth.traceSteps} />
          </Suspense>}
          <h3>Compare approaches</h3><p>{depth.alternative}</p>
          <h3>A tempting mistake</h3><p>{depth.counterexample}</p>
          <h3>Try a variation</h3><p>{depth.transfer}</p>
          <p>Write your prediction in your notes, then compare your reasoning.</p>
        </div>}
      </details>}
      <button className="primary-button step-next" type="button" onClick={() => onReveal('review-section')}>
        Review attempt<Icon name="arrow" />
      </button>
    </div>
  </section>
}

type StepDone = { plan: boolean; solve: boolean; explain: boolean; review: boolean }

export function ReviewSection({ hidden, rep, attempt, update, stepDone, writingRequired, missingStep, finishMissing, canComplete,
  onComplete, onShowMissing, badgeSlot, completionLabel, onCompletionNext, onDone, onFreshAttempt }: {
  hidden: boolean; rep: RepSummary; attempt: Attempt; update: UpdateAttempt; stepDone: StepDone; writingRequired: boolean
  missingStep?: string; finishMissing?: string; canComplete: boolean; onComplete: () => void; onShowMissing: () => void
  badgeSlot: (element: HTMLElement | null) => void; completionLabel: string; onCompletionNext: () => void; onDone: () => void
  onFreshAttempt: () => void
}) {
  function toggleMistake(id: string, chosen: boolean) {
    const next = chosen ? (attempt.mistakes ?? []).filter(tag => tag !== id) : [...(attempt.mistakes ?? []), id]
    update('mistakes', next.length ? next : undefined)
  }
  const checklist = [
    { label: 'Plan', done: stepDone.plan, needed: 'a plan', required: writingRequired },
    { label: 'Checks', done: stepDone.solve, needed: 'passing checks', required: true },
    { label: 'Explanation', done: stepDone.explain, needed: 'an explanation', required: writingRequired },
    { label: 'Difficulty', done: stepDone.review, needed: 'a difficulty choice', required: false },
  ]
  return <section id="review-section" hidden={hidden} tabIndex={-1} className="reflection-section">
    <h3>Review this attempt</h3>
    <div className="reflection-fields">
      <div role="group" aria-labelledby="difficulty-label">
        <span className="field-label">
          <span id="difficulty-label">What was hardest?</span> <span className="optional-note">Optional</span>
        </span>
        <div id="difficulty-choice" className="segmented-control reflection-choice">
          <StepIndicator active={attempt.difficulty ?? ''} selector="button[aria-pressed=true]" />
          {Object.entries(difficultyLabels).map(([value, label]) => <button key={value} type="button"
            aria-pressed={attempt.difficulty === value}
            onClick={() => update('difficulty', attempt.difficulty === value ? undefined : value as Difficulty)}>{label}</button>)}
        </div>
      </div>
      <div role="group" aria-labelledby="confidence-label">
        <span className="field-label">
          <span id="confidence-label">How confident do you feel?</span> <span className="optional-note">Optional</span>
        </span>
        <div className="segmented-control reflection-choice">
          <StepIndicator active={attempt.confidence ?? ''} selector="button[aria-pressed=true]" />
          {Object.entries(confidenceLabels).map(([value, label]) => <button key={value} type="button"
            aria-pressed={attempt.confidence === value}
            onClick={() => update('confidence', attempt.confidence === value ? undefined : value as Confidence)}>{label}</button>)}
        </div>
      </div>
      <div role="group" aria-labelledby="mistakes-label">
        <span className="field-label">
          <span id="mistakes-label">Mistakes you made</span> <span className="optional-note">Optional</span>
        </span>
        <div className="segmented-control reflection-choice">
          {mistakeTags.map(tag => {
            const chosen = attempt.mistakes?.includes(tag.id) ?? false
            return <button key={tag.id} type="button" aria-pressed={chosen} disabled={!!attempt.completedAt}
              onClick={() => toggleMistake(tag.id, chosen)}>{tag.label}</button>
          })}
        </div>
        <small className="optional-note">Your own note for the Mistakes page. It never blocks finishing.</small>
      </div>
    </div>
    <ul className="completion-checklist" aria-label="Completion requirements">{checklist.map(({ label, done, needed, required }) => {
      const status = done ? label === 'Checks' ? 'passed' : 'added'
        : required ? <span className="checklist-need">Still needed: {needed}</span> : <span className="optional-note">Optional</span>
      return <li key={label} className={done ? 'done' : ''}><Icon name={done ? 'check' : 'circle'} /> {label} {status}</li>
    })}</ul>
    <div className="explain-actions">
      <div>
        {!attempt.completedAt && missingStep && <button type="button" className="text-button missing-work" onClick={onShowMissing}>
          Continue: {missingStep}
        </button>}
        {finishMissing && !attempt.completedAt && <p className="finish-note" id="finish-note">Still needed: {finishMissing}.</p>}
      </div>
      {attempt.completedAt
        ? <p className="finish-status" role="status"><Icon name="check" />Rep completed</p>
        : <button className="finish-button" type="button" aria-describedby={finishMissing ? 'finish-note' : undefined}
          onClick={canComplete ? onComplete : onShowMissing}>Complete rep</button>}
    </div>
    {attempt.completedAt && <section className="completion-panel" aria-labelledby="completion-title">
      <h3 id="completion-title">You finished {rep.title}.</h3>
      <p>Your attempt is saved in the Journal.</p>
      <div ref={badgeSlot} className="badge-slot" />
      <div>
        <button type="button" className="primary-button" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={onCompletionNext}>
          {completionLabel}
        </button>
        <button type="button" className="text-button" onClick={onDone}>Done for today</button>
      </div>
      <p className="stop-for-today">Stop here; continue from Trail next time.</p>
    </section>}
    {attempt.completedAt && <button className="text-button retry-button" type="button" onClick={onFreshAttempt}>
      Start a fresh attempt
    </button>}
  </section>
}
