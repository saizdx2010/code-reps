import { lazy, Suspense } from 'react'
import { Icon } from './Icon'
import type { ResultTable, TestResult } from './runner.types'
import { describeDifference } from './value-diff.ts'

// A failed check's details: loaded with the first failure, so passing runs and startup never pay for them.
const SqlPlan = lazy(() =>
  import('./SqlResults')
    .then(module => ({ default: module.SqlPlan }))
    .catch(() => ({ default: ({ lines }: { lines: string[] }) => <pre>{lines.join('\n')}</pre> })),
)
const SqlComparison = lazy(() =>
  import('./SqlResults')
    .then(module => ({ default: module.SqlComparison }))
    .catch(() => ({
      default: ({ table }: { table: ResultTable; stale: boolean }) => <p>{[table.columnNote, table.first].filter(Boolean).join(' ')}</p>,
    })),
)

function formatValue(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function ValueDifference({ value, other }: { value: string; other: string }) {
  const lines = formatValue(value).split('\n')
  const comparison = formatValue(other).split('\n')
  return (
    <pre>
      {lines.map((line, index) => (
        <span key={index} className={line === comparison[index] ? '' : 'diff-line'}>
          {line}
          {index < lines.length - 1 ? '\n' : ''}
        </span>
      ))}
    </pre>
  )
}

/** The input, expected and actual values, and message for one failed check. */
export function FailedCheck({ result, stale }: { result: TestResult; stale: boolean }) {
  return (
    <>
      <summary>{result.name}</summary>
      {result.input?.startsWith('Starting data: ') ? (
        <p className="sql-starting">{result.input}</p>
      ) : (
        result.input && (
          <div>
            <span className="field-label">Input</span>
            <pre>{result.input}</pre>
          </div>
        )
      )}
      {!!result.tables?.length && (
        <Suspense fallback={<p className="utility-note">Loading the row comparison…</p>}>
          {result.tables.map(table => (
            <SqlComparison key={table.label} table={table} stale={stale} />
          ))}
        </Suspense>
      )}
      {result.plan && (
        <Suspense fallback={<pre>{result.plan.join('\n')}</pre>}>
          <SqlPlan lines={result.plan} />
        </Suspense>
      )}
      {/* Code that threw returned nothing to compare: show what was expected, then the error itself. */}
      {result.expected !== undefined && result.actual === undefined && (
        <div>
          <span className="field-label">Expected</span>
          <pre>{result.expected}</pre>
        </div>
      )}
      {result.expected !== undefined && result.actual !== undefined && (
        <div className="value-comparison">
          <div>
            <span className="field-label">Expected</span>
            <ValueDifference value={result.expected} other={result.actual} />
          </div>
          <div>
            <span className="field-label">{stale ? 'Actual (last run)' : 'Actual'}</span>
            <ValueDifference value={result.actual} other={result.expected} />
          </div>
        </div>
      )}
      {/* SQLite checks compare rows in their own tables, so only plain values get a sentence. */}
      {result.expected !== undefined && result.actual !== undefined && !result.tables?.length && (
        <DifferenceNote expected={result.expected} actual={result.actual} />
      )}
      {result.message &&
        (!result.tables?.length || result.plan) &&
        !(result.expected !== undefined && result.message.startsWith('Expected ')) && <p>{result.message}</p>}
      {!stale && <p className="utility-note">Trace this input through your code, then try again.</p>}
    </>
  )
}

/** The difference in one sentence, beside the marked lines: words, never colour alone. */
function DifferenceNote({ expected, actual }: { expected: string; actual: string }) {
  const difference = describeDifference(expected, actual)
  return difference ? (
    <p className="value-difference">
      <Icon name="info" />
      <span>{difference}</span>
    </p>
  ) : null
}
