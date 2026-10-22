import type { SqlValue } from './rep-types.ts'

/**
 * One displayed row of a SQLite comparison. `n` is its 1-based position on its own side. `mark` labels a row with no
 * counterpart; `wrong` lists [column index, expected value] for cells that differ from the paired expected row.
 */
export type ShownRow = { n: number; cells: SqlValue[]; mark?: 'extra' | 'missing'; wrong?: [number, SqlValue][] }
/** A window of one side's rows: `before` and `after` count rows left out around it. */
export type ShownRows = { columns: string[]; total: number; rows: ShownRow[]; before: number; after: number }
/**
 * A table a SQLite check compared, ready to draw. A side is null when it adds nothing (only extra rows, or only
 * missing ones). `ordered` is true or false for a learner query's rows and absent for tables read back afterwards.
 */
export type ResultTable = {
  label: string
  ordered?: boolean
  expected: ShownRows | null
  received: ShownRows | null
  /** Row counts of both sides, including a side that is not shown. */
  totals: { expected: number; received: number }
  /** A missing, extra, or renamed column, reported before any rows. */
  columnNote?: string
  /** The first row difference, as one sentence. */
  first?: string
}
/** SQLite refused the SQL text itself. `line` and `column` (1-based) locate it when the offending text can be found. */
export type SqlError = { message: string; line?: number; column?: number; source?: string; length?: number }
export type TestResult = {
  name: string
  passed: boolean
  message?: string
  input?: string
  expected?: string
  actual?: string
  /** SQLite checks: the tables that differ, drawn side by side. */
  tables?: ResultTable[]
  /** SQLite checks: SQLite could not prepare the learner's SQL. The same error on every check means nothing ran. */
  sqlError?: SqlError
  /** SQLite checks of an index: the EXPLAIN QUERY PLAN lines SQLite chose for the check's query, passed or not. */
  plan?: string[]
}
/** A request to the practice worker to compile learner code without running it, for frontend previews and checks. */
export type CompileRequest = { id: number; code: string; functionName: string; jsx: boolean; guardLoops: boolean }
