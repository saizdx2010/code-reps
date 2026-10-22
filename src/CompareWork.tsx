import type { Attempt, AttemptRecord } from './attempt-store'
import { earlierWork, lineDiff, sharedShare } from './compare-work.ts'
import { repTitle } from './rep-index.ts'
import { formatDate } from './ui-copy.ts'

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

/** After completion, the learner's earlier writing for this rep or the journey step before it, beside today's. */
export function EarlierWork({ repId, attempt, history }: { repId: string; attempt: Attempt; history: AttemptRecord[] }) {
  if (!attempt.completedAt) return null
  const earlier = earlierWork(repId, attempt.completedAt, history).filter(item => item.record.plan.trim() || item.record.explanation.trim())
  if (!earlier.length) return null
  return (
    <details className="earlier-work">
      <summary>Read back your earlier explanation</summary>
      <p>Compare what you wrote before with what you wrote today. What do you understand now that you did not then?</p>
      {earlier.map(({ record, relation, journeyTitle }) => (
        <section key={record.id} className="earlier-work-pair" aria-label={`Earlier work on ${repTitle(record.repId)}`}>
          <h4>
            {relation === 'same'
              ? `Your earlier attempt, ${formatDate(record.completedAt)}`
              : `${repTitle(record.repId)}, the step before this one in “${journeyTitle}”, ${formatDate(record.completedAt)}`}
          </h4>
          <div className="earlier-work-columns">
            <div>
              <strong>Then</strong>
              {record.plan.trim() && <p>Plan: {record.plan}</p>}
              {record.explanation.trim() && <p>Explanation: {record.explanation}</p>}
            </div>
            <div>
              <strong>Today</strong>
              {attempt.plan.trim() ? <p>Plan: {attempt.plan}</p> : <p>No plan written.</p>}
              {attempt.explanation.trim() ? <p>Explanation: {attempt.explanation}</p> : <p>No explanation written.</p>}
            </div>
          </div>
        </section>
      ))}
    </details>
  )
}
