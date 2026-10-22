import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { reducedMotion } from './ui-motion'
import { confidenceLabels, difficultyLabels } from './attempt-labels.ts'
import type { Confidence, Difficulty } from './attempt-labels.ts'
import type { Attempt, AttemptRecord } from './attempt-store'
import { Button } from './Button'
import { GuidanceLoading, SqlTablesLoading } from './LoadingStates'
import { repCurriculumRole } from './curriculum'
import { preloadEditor } from './editor-loader'
import { Icon } from './Icon'
import { InlineCode } from './InlineCode'
import { Input, Textarea } from './Input'
import { InfoNote } from './Layout'
import { lazyRoute } from './lazy-route'
import { mistakeTags } from './mistakes'
import { decodeFiles } from './project-files.ts'
import { appendSentenceStarter } from './practice'
import type { practiceWritingPrompts } from './practice'
import type { RepSummary } from './catalog-index'
import type { RepLesson } from './rep-content'
import type { repNotes } from './rep-notes.ts'
import type { Rep } from './rep-types'
import { practiceSteps } from './practice-steps'
import type { useRepContent } from './useRepContent'
import type { useReviewContent } from './useReviewContent'
import type { Moments } from './LearningMoments'

const RepGuidance = lazy(() =>
  import('./RepGuidance').catch(() => ({
    default: () => <p role="status">This rep's guidance could not load. Reload to try again; your draft is kept.</p>,
  })),
)
// Growth notes appear only after a completion, so they load with it rather than with the app. They describe a saved
// attempt, so if they cannot load the completion panel simply goes without them.
const LearningMoments = lazy<ComponentType<Moments>>(() => import('./LearningMoments').catch(() => ({ default: () => null })))
// A SQLite rep's tables and example rows load with its brief. Without them the brief still has its written contract.
const SqlTables = lazy(() => import('./SqlTables').then(module => ({ default: module.SqlTables })).catch(() => ({ default: () => null })))
const SqlExample = lazy<ComponentType<{ repId: string; children: ReactNode }>>(() =>
  import('./SqlTables')
    .then(module => ({ default: module.SqlExample }))
    .catch(() => ({ default: ({ children }: { children: ReactNode }) => children })),
)
const TraceViewer = lazyRoute(() => import('./TraceViewer').then(module => module.TraceViewer), 'The trace')
// The comparisons appear only after every check passes or the rep is complete, so they load then. If they cannot load,
// the trace and the receipt still show; nothing about the attempt depends on them.
const ReferenceComparison = lazy<ComponentType<{ yours: string; reference: string }>>(() =>
  import('./CompareWork').then(module => ({ default: module.ReferenceComparison })).catch(() => ({ default: () => null })),
)
const EarlierWork = lazy<ComponentType<{ repId: string; attempt: Attempt; history: AttemptRecord[] }>>(() =>
  import('./CompareWork').then(module => ({ default: module.EarlierWork })).catch(() => ({ default: () => null })),
)

const exampleBlock = (rep: Rep) => (
  <div className="example">
    <div className="example-label">Example</div>
    <code>{rep.example.input}</code>
    <span className="example-arrow">
      <Icon name="arrow" />
    </span>
    <code>{rep.example.output}</code>
  </div>
)

type Writing = ReturnType<typeof practiceWritingPrompts>
type RepContent = ReturnType<typeof useRepContent>
type ReviewContent = ReturnType<typeof useReviewContent>
export type UpdateAttempt = <K extends keyof Attempt>(key: K, value: Attempt[K]) => void
/** Moves to a practice section by its element id. */
type Reveal = (section: string) => void

/** Stands in for the brief while the rep's content loads, or offers a retry when it fails. */
export function RepContentNotice({ content }: { content: RepContent }) {
  if (content.status !== 'error')
    return (
      <p className="rep-content-notice" role="status">
        Loading the brief…
      </p>
    )
  const retryHint = ' Retrying did not help; reloading the app usually does.'
  const reload = () => {
    if (window.dispatchEvent(new Event('code-reps-save-current', { cancelable: true }))) window.location.reload()
  }
  return (
    <div className="rep-content-notice" role="alert">
      <p>This rep's brief could not load. Your draft is safe.{content.failures > 1 && retryHint}</p>
      <Button type="button" onClick={content.retry}>
        Retry
      </Button>
      {content.failures > 1 && (
        <Button type="button" onClick={reload}>
          Reload app
        </Button>
      )}
    </div>
  )
}

/** A writing box with sentence starters that append to it and return focus to the end of the text. */
function WritingField({
  id,
  label,
  kind,
  starters,
  value,
  onChange,
  placeholder,
  rows,
}: {
  id: string
  label: string
  kind: string
  starters: readonly string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows: number
}) {
  const field = useRef<HTMLTextAreaElement>(null)
  function insertStarter(starter: string) {
    onChange(appendSentenceStarter(value, starter))
    field.current?.focus()
    requestAnimationFrame(() => field.current?.setSelectionRange(field.current.value.length, field.current.value.length))
  }
  return (
    <>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="sentence-starters" role="group" aria-label={`${kind} sentence starters`}>
        {starters.map(starter => (
          <Button key={starter} onClick={() => insertStarter(starter)}>
            {starter}
          </Button>
        ))}
      </div>
      <Textarea ref={field} id={id} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
    </>
  )
}

function BriefRules({ rules }: { rules: string[] }) {
  return (
    <ol className="brief-rules">
      {rules.map(rule => (
        <li key={rule}>
          <InlineCode text={rule} />
        </li>
      ))}
    </ol>
  )
}

export function BriefSection({
  hidden,
  repId,
  full,
  lesson,
  notes,
  contentNotice,
  history,
  openRep,
  openLesson,
  indonesianHelp,
  onIndonesianHelp,
  glossary,
  hintCount,
  onRevealHint,
  onReveal,
  understanding,
}: {
  hidden: boolean
  understanding: boolean
  repId: string
  full?: Rep
  lesson?: RepLesson
  notes: ReturnType<typeof repNotes>
  contentNotice: ReactNode
  history: AttemptRecord[]
  openRep: (id: string) => void
  openLesson: (id: string) => void
  indonesianHelp: boolean
  onIndonesianHelp: (on: boolean) => void
  glossary?: Record<string, string>
  hintCount: number
  onRevealHint: () => void
  onReveal: Reveal
}) {
  // On Independent and Recall reps the first hint changes what the attempt shows, so it asks once, inline.
  const role = repCurriculumRole(repId)
  const asksFirst = hintCount === 0 && (role === 'Independent' || role === 'Recall')
  const [confirmingRep, setConfirmingRep] = useState<string | null>(null)
  const confirming = confirmingRep === repId && asksFirst
  const keepTrying = useRef<HTMLButtonElement>(null)
  const hintButton = useRef<HTMLButtonElement>(null)
  const answered = useRef(false)
  // Focus moves to the safe choice when the question appears, and back to the hint control once it is answered.
  useEffect(() => {
    if (confirming) keepTrying.current?.focus()
    else if (answered.current) {
      answered.current = false
      hintButton.current?.focus()
    }
  }, [confirming])
  const answer = (reveal: boolean) => {
    answered.current = true
    setConfirmingRep(null)
    if (reveal) onRevealHint()
  }
  return (
    <section id="brief-section" hidden={hidden} tabIndex={-1} className="panel task-panel">
      {lesson && (
        <div className="rep-lesson">
          <span className="home-label">Lesson before this rep</span>
          <h2>{lesson.title}</h2>
          <p>
            <InlineCode text={lesson.explanation} />
          </p>
          <pre>
            <code>{lesson.example}</code>
          </pre>
          <p className="foundation-tip">
            <InlineCode text={lesson.tip} />
          </p>
        </div>
      )}
      <div className="panel-heading">
        <h2>The brief</h2>
      </div>
      <Suspense fallback={<GuidanceLoading />}>
        <RepGuidance repId={repId} history={history} openRep={openRep} openLesson={openLesson} understanding={understanding} />
      </Suspense>
      {full ? (
        <>
          {full.context && (
            <p className="rep-context">
              <InlineCode text={full.context} />
            </p>
          )}
          {full.errorReport && (
            <figure className="error-report">
              <figcaption>Error report</figcaption>
              <pre tabIndex={0}>
                <code>{full.errorReport}</code>
              </pre>
            </figure>
          )}
          {full.brief ? (
            <div className="brief-structure">
              <p>
                <InlineCode text={full.brief.summary} />
              </p>
              <h3 className="brief-subhead">Rules, in order</h3>
              <BriefRules rules={full.brief.rules} />
              {full.brief.edgeCases && (
                <>
                  <h3 className="brief-subhead">Edge cases</h3>
                  <ul className="brief-rules">
                    {full.brief.edgeCases.map(edge => (
                      <li key={edge}>
                        <InlineCode text={edge} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p>
              <InlineCode text={full.prompt} />
            </p>
          )}
          {full.acceptanceCriteria && (
            <ul className="acceptance-criteria">
              {full.acceptanceCriteria.map(point => (
                <li key={point}>
                  <InlineCode text={point} />
                </li>
              ))}
            </ul>
          )}
          {full.sql && (
            <Suspense fallback={<SqlTablesLoading />}>
              <SqlTables repId={full.id} />
            </Suspense>
          )}
          {full.sql ? (
            <Suspense fallback={exampleBlock(full)}>
              <SqlExample repId={full.id}>{exampleBlock(full)}</SqlExample>
            </Suspense>
          ) : (
            exampleBlock(full)
          )}
          {notes.brief && (
            <p className="task-note">
              <InlineCode text={notes.brief} />
            </p>
          )}
          <InfoNote label="How this is checked">
            <p>
              Checks show how your code behaves in the tested cases. You review your plan and explanation yourself, including any
              variations.
            </p>
            {notes.checking && (
              <p>
                <InlineCode text={notes.checking} />
              </p>
            )}
          </InfoNote>
          <label className="indonesian-help">
            <Input type="checkbox" checked={indonesianHelp} onChange={event => onIndonesianHelp(event.target.checked)} />
            Show Indonesian help
          </label>
          <details className="vocab">
            <summary>Quick vocabulary</summary>
            <div>
              <p>
                {full.vocabulary.map((item, index) => (
                  <span key={item.term}>
                    {index > 0 && ' '}
                    <b>{item.term}</b> means <InlineCode text={item.meaning} />.
                    {glossary?.[item.term] && (
                      <span className="indonesian-gloss" lang="id">
                        {' '}
                        {glossary[item.term]}.
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          </details>
          {confirming ? (
            <div className="hint-confirm" role="group" aria-labelledby="hint-confirm-title">
              <strong id="hint-confirm-title">
                <Icon name="hint" />
                Reveal hint 1?
              </strong>
              <p>
                This is {role === 'Recall' ? 'a Recall' : 'an Independent'} rep. With a hint, this attempt counts as guided practice, not{' '}
                {role === 'Recall' ? 'recall' : 'independent'} evidence.
              </p>
              <div>
                <button className="hint-button" type="button" onClick={() => answer(true)}>
                  Reveal hint
                </button>
                <Button variant="text" ref={keepTrying} onClick={() => answer(false)}>
                  Keep trying
                </Button>
              </div>
            </div>
          ) : (
            <div className="hint-control">
              <button
                ref={hintButton}
                className="hint-button"
                type="button"
                disabled={hintCount >= full.hints.length}
                onClick={() => (asksFirst ? setConfirmingRep(repId) : onRevealHint())}
              >
                <Icon name="hint" />
                {hintCount >= full.hints.length ? 'All hints revealed' : `Reveal hint ${hintCount + 1}`}
              </button>
              <span>
                {hintCount} of {full.hints.length} revealed
              </span>
              <span className="hint-note">Hints are recorded with this attempt.</span>
            </div>
          )}
          {hintCount > 0 && (
            <div className="task-hints" aria-live="polite">
              <div className="hint-heading">
                <span className="hint-spark">
                  <Icon name="hint" />
                </span>
                <strong>Hints revealed</strong>
              </div>
              <ol className="hint-list">
                {full.hints.slice(0, hintCount).map(hint => (
                  <li key={hint}>
                    <InlineCode text={hint} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : (
        contentNotice
      )}
      <Button variant="text" className="step-next" onClick={() => onReveal('plan-section')}>
        Plan your approach
        <Icon name="arrow" />
      </Button>
    </section>
  )
}

export function PlanSection({
  hidden,
  full,
  contentNotice,
  writing,
  plan,
  onPlan,
  onReveal,
}: {
  hidden: boolean
  full?: Rep
  contentNotice: ReactNode
  writing: Writing
  plan: string
  onPlan: (plan: string) => void
  onReveal: Reveal
}) {
  return (
    <section id="plan-section" hidden={hidden} tabIndex={-1} className="panel plan-panel">
      <div className="panel-heading">
        <h2>Plan your approach</h2>
      </div>
      <details className="plan-brief" open>
        <summary>The brief</summary>
        <div>
          {!full ? (
            contentNotice
          ) : full.brief ? (
            <>
              <p>
                <InlineCode text={full.brief.summary} />
              </p>
              <BriefRules rules={full.brief.rules} />
            </>
          ) : (
            <p>
              <InlineCode text={full.prompt} />
            </p>
          )}
        </div>
      </details>
      {writing.plan && <p>{writing.plan}</p>}
      <WritingField
        id="plan"
        label="Your plan"
        kind="Plan"
        starters={writing.starters.plan}
        value={plan}
        onChange={onPlan}
        placeholder="I'll start by…"
        rows={writing.rows}
      />
      <div className="field-foot">{writing.planHelp}</div>
      <Button variant="text" className="plan-to-code" onClick={() => onReveal('solution-section')}>
        Go to code
        <Icon name="arrow" />
      </Button>
    </section>
  )
}

const defaultPlanGuide = ['Describe how you will use the inputs.', 'Name an edge case from the task.', 'Explain the steps before coding.']
const defaultExplanationGuide = ['Explain why the code handles the example and edge cases.', 'Describe the time and extra space used.']

export function ExplainSection({
  hidden,
  repId,
  writing,
  explanation,
  onExplanation,
  englishTips,
  allPassed,
  review,
  onReveal,
  code,
  coolDown = false,
}: {
  hidden: boolean
  repId: string
  writing: Writing
  code?: string
  /** The Today set's cool-down: the trace opens in predict mode and comes into view. */
  coolDown?: boolean
  explanation: string
  onExplanation: (explanation: string) => void
  englishTips?: readonly string[]
  allPassed: boolean
  review: ReviewContent
  onReveal: Reveal
}) {
  const reflectionGuide = review.status === 'ready' ? review.content.guide : undefined
  const depth = review.status === 'ready' ? review.content.depth : undefined
  // The cool-down brings the trace into view once, after the step reveal has placed the Explain section.
  const seeItRun = useRef<HTMLElement>(null)
  const hasTrace = !!depth?.traceSteps
  useEffect(() => {
    if (!coolDown || hidden || !hasTrace) return
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        seeItRun.current?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' }),
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [coolDown, hidden, hasTrace])
  return (
    <section id="explain-section" hidden={hidden} tabIndex={-1} className="panel explain-panel">
      <div className="explain-intro">
        <div className="panel-heading">
          <h2>Explain your thinking</h2>
        </div>
        <p>{writing.explanation}</p>
      </div>
      <div className="explain-form">
        <WritingField
          id="explanation"
          label="Your explanation"
          kind="Explanation"
          starters={writing.starters.explanation}
          value={explanation}
          onChange={onExplanation}
          placeholder="My solution works by…"
          rows={writing.rows}
        />
        {englishTips && (
          <InfoNote label="English tips for Indonesian speakers">
            <ul>
              {englishTips.map(tip => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </InfoNote>
        )}
        {allPassed && depth?.traceSteps && (
          // The trace walks a reference solution, so it only appears once the learner's own checks pass.
          <section className="see-it-run" aria-labelledby="see-it-run-title" ref={seeItRun}>
            <h3 id="see-it-run-title">{coolDown ? 'Cool-down: see it run' : 'See it run'}</h3>
            <p>
              {coolDown
                ? 'The last part of today’s set. Before each step appears, call what changes, then reveal it. Stop whenever you like.'
                : 'Step through a reference solution, then compare each step with what your code does.'}
            </p>
            <Suspense
              fallback={
                <p className="loading-status" role="status">
                  Opening trace…
                </p>
              }
            >
              <TraceViewer key={coolDown ? `${repId}-cool-down` : repId} trace={depth.traceSteps} predictFirst={coolDown} />
            </Suspense>
            {code !== undefined && !decodeFiles(code) && (
              <Suspense fallback={null}>
                <ReferenceComparison yours={code} reference={depth.traceSteps.code.join('\n')} />
              </Suspense>
            )}
          </section>
        )}
        {allPassed && (
          <details className="reflection-guide">
            <summary>Compare with a model answer</summary>
            <div className="reflection-guide-columns">
              <div>
                <strong>Plan</strong>
                <ul>
                  {(reflectionGuide?.plan ?? defaultPlanGuide).map(point => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Explanation</strong>
                <ul>
                  {(reflectionGuide?.explanation ?? defaultExplanationGuide).map(point => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
            {review.status === 'loading' && <p role="status">Loading the review…</p>}
            {review.status === 'error' && (
              <div role="alert">
                <p>The review could not load. Your draft is safe.</p>
                <Button type="button" onClick={review.retry}>
                  Retry
                </Button>
              </div>
            )}
            {reflectionGuide && (
              <div className="reflection-example">
                <strong>Example to compare with</strong>
                <p>{reflectionGuide.example}</p>
              </div>
            )}
            {depth && (
              <div className="reflection-example">
                <h3>Why this works</h3>
                <p>{depth.reasoning}</p>
                <h3>Trace a boundary case</h3>
                <p>{depth.trace}</p>
                <h3>Compare approaches</h3>
                <p>{depth.alternative}</p>
                {depth.alternativeTrace && (
                  <Suspense
                    fallback={
                      <p className="loading-status" role="status">
                        Opening trace…
                      </p>
                    }
                  >
                    <TraceViewer key={`${repId}-alternative`} trace={depth.alternativeTrace.trace} title={depth.alternativeTrace.title} />
                  </Suspense>
                )}
                <h3>A tempting mistake</h3>
                <p>{depth.counterexample}</p>
                <h3>Try a variation</h3>
                <p>{depth.transfer}</p>
                <p>Write your prediction in your notes, then compare your reasoning.</p>
              </div>
            )}
          </details>
        )}
        <Button variant="primary" className="step-next" onClick={() => onReveal('review-section')}>
          Review attempt
          <Icon name="arrow" />
        </Button>
      </div>
    </section>
  )
}

type StepDone = { plan: boolean; solve: boolean; explain: boolean; review: boolean }

/** The completed attempt's reflection in one line, or nothing when the learner skipped it. */
function reflectionSummary(attempt: Attempt) {
  const parts = [
    attempt.difficulty && `Hardest: ${difficultyLabels[attempt.difficulty]}`,
    attempt.confidence && `Confidence: ${confidenceLabels[attempt.confidence]}`,
    attempt.mistakes?.length &&
      `Mistakes: ${mistakeTags
        .filter(tag => attempt.mistakes?.includes(tag.id))
        .map(tag => tag.label)
        .join(', ')}`,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : undefined
}

export function ReviewSection({
  hidden,
  rep,
  attempt,
  update,
  stepDone,
  writingRequired,
  missingStep,
  finishMissing,
  canComplete,
  onComplete,
  onShowMissing,
  badgeSlot,
  completionLabel,
  onCompletionNext,
  onDone,
  onFreshAttempt,
  evidence,
  moments,
  history,
}: {
  hidden: boolean
  rep: RepSummary
  history: AttemptRecord[]
  attempt: Attempt
  update: UpdateAttempt
  stepDone: StepDone
  writingRequired: boolean
  missingStep?: string
  finishMissing?: string
  canComplete: boolean
  onComplete: () => void
  onShowMissing: () => void
  badgeSlot: (element: HTMLElement | null) => void
  completionLabel: string
  onCompletionNext: () => void
  onDone: () => void
  onFreshAttempt: () => void
  /** What this attempt counts as in journey terms, shown once it is complete; absent outside the journeys. */
  evidence?: string
  /** The completed record, for the skills it moved up and at most one personal best. */
  moments?: Moments
}) {
  function toggleMistake(id: string, chosen: boolean) {
    const next = chosen ? (attempt.mistakes ?? []).filter(tag => tag !== id) : [...(attempt.mistakes ?? []), id]
    update('mistakes', next.length ? next : undefined)
  }
  const checklist = [
    { label: 'Plan', done: stepDone.plan, required: writingRequired },
    { label: 'Checks passed', done: stepDone.solve, required: true },
    { label: 'Explanation', done: stepDone.explain, required: writingRequired },
  ]
  const missingLabel = practiceSteps.find(step => step.id === missingStep)?.label
  // Completing moves the learner to the reward: the panel takes the top of the pane and focus, once.
  const panel = useRef<HTMLElement>(null)
  const [completedOnArrival] = useState(attempt.completedAt)
  useEffect(() => {
    if (!attempt.completedAt || attempt.completedAt === completedOnArrival) return
    panel.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    panel.current?.focus({ preventScroll: true })
  }, [attempt.completedAt, completedOnArrival])
  if (attempt.completedAt) {
    // The attempt's facts, as recorded: the receipt replaces the old "done" chip and sentence.
    const receipt = [
      { label: 'Checks', value: rep.checkTotal ? `All ${rep.checkTotal} passed` : 'All passed' },
      { label: 'Hints', value: attempt.hintCount ? `${attempt.hintCount} of ${rep.hintTotal}` : 'None' },
      { label: 'Plan', value: stepDone.plan ? 'Written' : 'Skipped' },
      { label: 'Explanation', value: stepDone.explain ? 'Written' : 'Skipped' },
    ]
    const reflection = reflectionSummary(attempt)
    return (
      <section id="review-section" hidden={hidden} tabIndex={-1} className="reflection-section">
        <section ref={panel} className="completion-panel" aria-labelledby="completion-title" tabIndex={-1}>
          <div className="completion-head">
            <span className="completion-mark" aria-hidden="true">
              <Icon name="check" />
            </span>
            <div>
              <p className="finish-status" role="status">
                Rep completed
              </p>
              <h3 id="completion-title">{rep.title}</h3>
            </div>
          </div>
          {evidence && <p className="completion-evidence">{evidence}</p>}
          <dl className="completion-receipt" aria-label="This attempt">
            {receipt.map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {reflection && (
            <p className="completion-reflection">
              <strong>Reflection</strong> {reflection}
            </p>
          )}
          <div ref={badgeSlot} className="badge-slot" />
          {moments && (
            <Suspense fallback={null}>
              <LearningMoments {...moments} />
            </Suspense>
          )}
          <div className="completion-actions">
            <Button variant="primary" onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={onCompletionNext}>
              {completionLabel}
              <Icon name="arrow" />
            </Button>
            <Button variant="text" onClick={onDone}>
              Done for today
            </Button>
          </div>
          <div className="completion-foot">
            <p className="completion-saved">Your attempt is saved in the Journal.</p>
            <Button variant="text" className="retry-button" onClick={onFreshAttempt}>
              Start a fresh attempt
            </Button>
          </div>
        </section>
        <Suspense fallback={null}>
          <EarlierWork repId={rep.id} attempt={attempt} history={history} />
        </Suspense>
      </section>
    )
  }
  return (
    <section id="review-section" hidden={hidden} tabIndex={-1} className="reflection-section">
      <h3>Ready to finish?</h3>
      <ul className="completion-checklist" aria-label="Completion requirements">
        {checklist
          .filter(item => item.required || item.done)
          .map(({ label, done }) => (
            <li key={label} className={done ? 'done' : 'needed'}>
              <Icon name={done ? 'check' : 'circle'} />
              {label}
              {!done && <span className="visually-hidden"> still needed</span>}
            </li>
          ))}
        <li className="optional">
          <Icon name="circle" />
          Reflection <span className="optional-note">optional</span>
        </li>
      </ul>
      {/* Reflection comes before Complete rep, so the saved record carries it; nothing on this pane edits a finished attempt. */}
      <div className="reflection-fields" role="group" aria-labelledby="reflect-heading">
        <h4 id="reflect-heading">
          Reflect <span className="optional-note">Optional · about 20 seconds · saved with this attempt</span>
        </h4>
        <div role="group" aria-labelledby="difficulty-label">
          <span className="field-label" id="difficulty-label">
            What was hardest?
          </span>
          <div className="choice-chips">
            {Object.entries(difficultyLabels).map(([value, label]) => {
              const chosen = attempt.difficulty === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => update('difficulty', chosen ? undefined : (value as Difficulty))}
                >
                  {chosen && <Icon name="check" />}
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div role="group" aria-labelledby="confidence-label">
          <span className="field-label" id="confidence-label">
            How confident do you feel?
          </span>
          <div className="choice-chips">
            {Object.entries(confidenceLabels).map(([value, label]) => {
              const chosen = attempt.confidence === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => update('confidence', chosen ? undefined : (value as Confidence))}
                >
                  {chosen && <Icon name="check" />}
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div role="group" aria-labelledby="mistakes-label">
          <span className="field-label" id="mistakes-label">
            Mistakes you made <span className="optional-note">choose any; for your Mistakes page</span>
          </span>
          <div className="choice-chips">
            {mistakeTags.map(tag => {
              const chosen = attempt.mistakes?.includes(tag.id) ?? false
              return (
                <button key={tag.id} type="button" aria-pressed={chosen} onClick={() => toggleMistake(tag.id, chosen)}>
                  {chosen && <Icon name="check" />}
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="explain-actions">
        <button
          className="finish-button"
          type="button"
          aria-describedby={finishMissing ? 'finish-note' : undefined}
          onClick={canComplete ? onComplete : onShowMissing}
        >
          Complete rep
        </button>
        {finishMissing && (
          <p className="finish-note" id="finish-note">
            Still needed: {finishMissing}.
            {missingLabel && (
              <Button variant="text" className="missing-work" onClick={onShowMissing}>
                Go to {missingLabel}
                <Icon name="arrow" />
              </Button>
            )}
          </p>
        )}
      </div>
    </section>
  )
}
