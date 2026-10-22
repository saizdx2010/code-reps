import { useState } from 'react'
import './compare-work.css'
import { confidenceLabels } from './attempt-labels'
import type { Confidence } from './attempt-labels'
import type { Attempt, AttemptRecord } from './attempt-store'
import { Button } from './Button'
import { earlierWork, lineDiff, sharedShare, sideBySide } from './compare-work.ts'
import type { SideLine } from './compare-work.ts'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { decodeFiles } from './project-files.ts'
import { repSummaryById, repTitle } from './rep-index.ts'
import { StepIndicator } from './StepIndicator'
import { formatDate, plural } from './ui-copy.ts'

// Post-check and post-completion comparisons, loaded with the first one shown (src/PracticeSections.tsx).

/** The learner's code beside the authored reference, shown only after every check passes. */
export function ReferenceComparison({ yours, reference }: { yours: string; reference: string }) {
  const diff = lineDiff(yours, reference)
  const { shared, reference: total } = sharedShare(diff)
  const marks = { both: ['=', 'In both'], yours: ['+', 'Only in yours'], reference: ['−', 'Only in the reference'] } as const
  return (
    <div className="code-compare">
      <h4>Compare your code with the reference</h4>
      <p>
        Your code shares {shared} of the reference’s {total} lines, ignoring spacing and comments. Different lines can still be correct: the
        checks show behavior, and you judge the approach.
      </p>
      <ol aria-label="Line comparison">
        {diff.map((line, index) => (
          <li key={index} className={`code-compare-${line.side}`}>
            <span className="code-compare-mark" aria-hidden="true">
              {marks[line.side][0]}
            </span>
            <span className="sr-only">{marks[line.side][1]}: </span>
            <code>{line.text}</code>
          </li>
        ))}
      </ol>
      <p className="code-compare-legend" aria-hidden="true">
        = in both · + only in yours · − only in the reference
      </p>
    </div>
  )
}

/** Hints and confidence as saved: facts about each attempt, never a score. */
function attemptChips(record: { hintCount: number; confidence?: string }) {
  const confidence = record.confidence && Object.hasOwn(confidenceLabels, record.confidence) ? (record.confidence as Confidence) : null
  return (
    <p className="then-now-chips">
      <StatusChip tone={record.hintCount ? 'neutral' : 'success'}>
        {record.hintCount ? plural(record.hintCount, 'hint') : 'No hints'}
      </StatusChip>
      {confidence && <StatusChip>{`Confidence: ${confidenceLabels[confidence]}`}</StatusChip>}
    </p>
  )
}

function writing(record: Pick<Attempt, 'plan' | 'explanation'>) {
  return (
    <>
      {record.plan.trim() ? <p>Plan: {record.plan}</p> : <p className="then-now-empty">No plan written.</p>}
      {record.explanation.trim() ? <p>Explanation: {record.explanation}</p> : <p className="then-now-empty">No explanation written.</p>}
    </>
  )
}

function codeBlock(lines: SideLine[], label: string) {
  return (
    <pre className="then-now-code" aria-label={label}>
      {lines.map((line, index) => (
        <span key={index} className={line.changed ? 'is-changed' : undefined}>
          {line.changed && <span className="sr-only">Changed: </span>}
          {line.text}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}

const apart = (days: number) => (days < 1 ? 'earlier today' : `${plural(days, 'day')} apart`)

/**
 * Then and now, under the Finish receipt: the first earlier attempt at this rep (code side by side) and, for a journey's
 * independent or recall rep, the first attempt at the step before it (evidence only, since the tasks differ). Only you
 * against you: nothing here scores which version is better.
 */
export function EarlierWork({ repId, attempt, history }: { repId: string; attempt: Attempt; history: AttemptRecord[] }) {
  const [side, setSide] = useState<'now' | 'then'>('now')
  if (!attempt.completedAt) return null
  const earlier = earlierWork(repId, attempt.completedAt, history)
  if (!earlier.length) return null
  const lead = earlier[0]
  return (
    <details className="then-now" data-side={side} open>
      <summary>
        <span className="then-now-title">Then and now</span>
        <span className="then-now-meta">
          {lead.relation === 'same' ? `Same rep, ${apart(lead.days)}` : `The step before in “${lead.journeyTitle}”, ${apart(lead.days)}`}
        </span>
        <Icon name="chevron" />
      </summary>
      <div className="segmented-control then-now-switch" role="group" aria-label="Show version">
        <StepIndicator active={side} selector="button[aria-pressed=true]" />
        <Button aria-pressed={side === 'now'} onClick={() => setSide('now')}>
          Today
        </Button>
        <Button aria-pressed={side === 'then'} onClick={() => setSide('then')}>
          {formatDate(lead.record.completedAt)}
        </Button>
      </div>
      {earlier.map(({ record, relation, journeyTitle }) => {
        // Code lines compare only for plain source: a multi-file project and a Break it tries table are saved as JSON.
        const plain = (text: string) => !decodeFiles(text) && repSummaryById.get(repId)?.format !== 'break'
        const comparable =
          relation === 'same' && (record.code.trim() || attempt.code?.trim()) && plain(record.code) && plain(attempt.code ?? '')
        const code = comparable ? sideBySide(record.code, attempt.code ?? '') : null
        const thenTitle = relation === 'same' ? 'first attempt' : `${repTitle(record.repId)}, the step before in “${journeyTitle}”`
        return (
          <section key={record.id} className="then-now-pair" aria-label={`Then and now: ${repTitle(record.repId)}`}>
            <div className="then-now-columns">
              <div className="then-now-then">
                <h4>
                  <Icon name="calendar" />
                  {formatDate(record.completedAt)} <span>{thenTitle}</span>
                </h4>
                {attemptChips(record)}
                {code && codeBlock(code.then, `Code from ${formatDate(record.completedAt)}`)}
                {writing(record)}
              </div>
              <div className="then-now-now">
                <h4>
                  <Icon name="calendar" />
                  Today <span>{relation === 'same' ? 'this attempt' : repTitle(repId)}</span>
                </h4>
                {attemptChips(attempt)}
                {code && codeBlock(code.now, 'Code from today')}
                {writing(attempt)}
              </div>
            </div>
            {code && (
              <p className="then-now-legend">A bar marks a line found in only one version. Blank lines and // comments are left out.</p>
            )}
          </section>
        )
      })}
      <p className="then-now-prompt">What do you understand now that you did not then?</p>
    </details>
  )
}
