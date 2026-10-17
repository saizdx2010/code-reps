import { useId, useLayoutEffect, useRef } from 'react'
import type { SqlValue } from './rep-types'
import type { ResultTable, ShownRows, SqlError } from './runner.types'

/** One SQLite value as text. NULL and empty text look different, and neither relies on colour. */
export function SqlCell({ value }: { value: SqlValue }) {
  if (value === null) return <span className="sql-null">NULL</span>
  if (value === '')
    return (
      <span className="sql-null" aria-label="empty text">
        ""
      </span>
    )
  return <>{String(value)}</>
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

function RowsTable({ caption, side, mark }: { caption: string; side: ShownRows; mark: 'Extra row' | 'Missing row' }) {
  const width = Math.max(side.columns.length, ...side.rows.map(row => row.cells.length), 1)
  const marked = side.rows.some(row => row.mark)
  const id = useId()
  const wrap = useRef<HTMLDivElement>(null)
  // A wide result opens scrolled to its first wrong cell, so the difference is in view without hunting for it.
  useLayoutEffect(() => {
    const box = wrap.current
    const cell = box?.querySelector<HTMLElement>('.sql-cell-wrong')
    if (!box || !cell) return
    // The row number and row status stay pinned at the edges, so the cell must fit between them.
    const status = box.querySelector<HTMLElement>('td.sql-row-status')?.offsetWidth ?? 0
    const right = cell.offsetLeft + cell.offsetWidth
    if (right > box.clientWidth - status) box.scrollLeft = right - box.clientWidth + status + 12
  }, [side])
  return (
    <div className="sql-compare-side">
      <p className="sql-caption" id={id}>
        {caption}
      </p>
      {/* The table scrolls inside its own box, so a keyboard user can reach and scroll it. */}
      <div ref={wrap} className="sql-table-wrap" role="region" aria-labelledby={id} tabIndex={0}>
        <table className="sql-table" aria-labelledby={id}>
          <thead>
            <tr>
              <th scope="col" className="sql-row-number">
                #
              </th>
              {Array.from({ length: width }, (_, index) => (
                <th key={index} scope="col">
                  {side.columns[index] ?? ''}
                </th>
              ))}
              {marked && (
                <th scope="col">
                  <span className="visually-hidden">Row status</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {side.before > 0 && (
              <tr className="sql-gap">
                <td colSpan={width + 1 + (marked ? 1 : 0)}>{plural(side.before, 'row')} before</td>
              </tr>
            )}
            {side.rows.length ? (
              side.rows.map(row => {
                const wrong = new Map(row.wrong ?? [])
                return (
                  <tr key={row.n} className={row.mark ? 'sql-row-marked' : undefined}>
                    <td className="sql-row-number">{row.n}</td>
                    {Array.from({ length: width }, (_, column) =>
                      wrong.has(column) ? (
                        <td key={column} className="sql-cell-wrong">
                          <span>
                            <strong>
                              <SqlCell value={row.cells[column] ?? null} />
                            </strong>{' '}
                            <span className="sql-cell-expected">
                              expected <SqlCell value={wrong.get(column)!} />
                            </span>
                          </span>
                        </td>
                      ) : (
                        <td key={column}>{column < row.cells.length ? <SqlCell value={row.cells[column]} /> : null}</td>
                      ),
                    )}
                    {marked && <td className="sql-row-status">{row.mark && <span className="sql-pill">{mark}</span>}</td>}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={width + 1 + (marked ? 1 : 0)} className="sql-empty">
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {side.after > 0 && <p className="sql-more">+ {plural(side.after, 'more row')}</p>}
    </div>
  )
}

/** Expected rows beside received rows for one table a SQLite check compared, then the first difference in words. */
export function SqlComparison({ table, stale }: { table: ResultTable; stale: boolean }) {
  const order = table.ordered === undefined ? '' : table.ordered ? ' · order matters' : ' · order does not matter'
  const { expected, received } = table
  const receivedLabel = stale ? 'Received (last run)' : 'Received'
  return (
    <div className="sql-comparison">
      {table.label !== 'Rows' && <span className="field-label">{table.label} afterwards</span>}
      {table.columnNote && <p className="sql-difference">{table.columnNote}</p>}
      <div className={`sql-comparison-tables${expected && received ? '' : ' is-single'}`}>
        {expected && (
          <RowsTable
            caption={`Expected · ${plural(expected.total, 'row')}${order}${received ? '' : ` · received ${table.totals.received}`}`}
            side={expected}
            mark="Missing row"
          />
        )}
        {received && (
          <RowsTable
            caption={`${receivedLabel} · ${plural(received.total, 'row')}${expected ? '' : ` · expected ${table.totals.expected}`}`}
            side={received}
            mark="Extra row"
          />
        )}
      </div>
      {table.first && <p className="sql-difference">{table.first}</p>}
    </div>
  )
}

/** SQLite's own complaint about the query, with the offending line and a caret under the place it points to. */
export function SqlErrorBox({ error }: { error: SqlError }) {
  const located = error.line !== undefined && error.column !== undefined && error.source !== undefined
  const gutter = located ? `${error.line} │ ` : ''
  return (
    <div className="sql-error">
      <pre className="sql-error-code">
        <code>
          <span className="sql-error-message">{error.message}</span>
          {located && (
            <>
              {'\n'}
              {gutter}
              {error.source}
              {'\n'}
              <span aria-hidden="true">
                {' '.repeat(gutter.length + error.column! - 1)}
                {'^'.repeat(error.length ?? 1)}
              </span>
            </>
          )}
        </code>
      </pre>
      <p>No checks ran. Your query is unchanged: {located ? `fix line ${error.line}` : 'fix the query'} and run the checks again.</p>
    </div>
  )
}

/** SQLite's EXPLAIN QUERY PLAN for a check's query, with what it does and does not show. */
export function SqlPlan({ lines }: { lines: string[] }) {
  return (
    <div className="sql-plan">
      <pre className="sql-plan-code">
        <code>
          <span className="sql-plan-label">QUERY PLAN</span>
          {'\n'}
          {lines.join('\n')}
        </code>
      </pre>
      <p>This is the plan SQLite chose for the check data. It shows which index is used, not how fast the query runs.</p>
    </div>
  )
}
