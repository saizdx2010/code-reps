import type { ReactNode } from 'react'
import { SqlCell } from './SqlResults'
import { sqlPreviews } from './sql-previews.ts'
import type { SqlValue } from './rep-types'
import { useSessionPreference } from './useSessionPreference'

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** A few rows in the code font. Wider than the pane, it scrolls inside its own box, never the brief. */
function MiniTable({ label, columns, rows }: { label: string; columns: string[]; rows: SqlValue[][] }) {
  return (
    <div className="sql-mini-wrap" role="region" aria-label={label} tabIndex={0}>
      <table className="sql-mini-table" aria-label={label}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, column) => (
                  <td key={column}>
                    <SqlCell value={cell} />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={Math.max(columns.length, 1)} className="sql-empty">
                No rows yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/**
 * The brief's Tables card: every table of the rep's first data set, with its columns, types, keys, and first rows.
 * It is generated from the same schema and seed the checks load, so the brief and the checks cannot disagree.
 */
export function SqlTables({ repId }: { repId: string }) {
  const preview = sqlPreviews[repId]
  const [open, setOpen] = useSessionPreference<'open' | 'closed'>(`sql-tables:${repId}`, 'open')
  if (!preview?.tables.length) return null
  return (
    <details className="sql-tables" open={open === 'open'} onToggle={event => setOpen(event.currentTarget.open ? 'open' : 'closed')}>
      <summary>
        <span className="sql-tables-title">Tables</span>
        <span className="sql-tables-meta">
          {plural(preview.tables.length, 'table')}
          <span className="sql-tables-fresh"> · every check starts from a fresh copy</span>
        </span>
      </summary>
      <div className="sql-tables-body">
        {preview.tables.map(table => (
          <section key={table.name} className="sql-table-preview" aria-label={`Table ${table.name}`}>
            <h4>
              <code>{table.name}</code> <span>{plural(table.rows, 'row')}</span>
            </h4>
            <p className="sql-definition">
              {table.definition.map((part, index) => (
                <span key={index}>
                  {index > 0 && ' · '}
                  {part}
                </span>
              ))}
            </p>
            <MiniTable label={`First rows of ${table.name}`} columns={table.columns} rows={table.sample} />
            {table.rows > table.sample.length && <p className="sql-more">+ {plural(table.rows - table.sample.length, 'more row')}</p>}
          </section>
        ))}
      </div>
    </details>
  )
}

/** The expected rows for the data set above, as a mini table; reps without them keep their written example. */
export function SqlExample({ repId, children }: { repId: string; children: ReactNode }) {
  const example = sqlPreviews[repId]?.example
  if (!example) return children
  return (
    <div className="sql-example">
      <span className="example-label">Example · rows for the data above</span>
      <MiniTable label="Example result rows" columns={example.columns} rows={example.rows} />
    </div>
  )
}
