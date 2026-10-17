import { sameValue } from './compare.ts'
import type { Check, SqlCheck, SqlTask, SqlValue } from './rep-types.ts'
import type { ResultTable, ShownRow, ShownRows, SqlError } from './runner.types.ts'

type SqlStatement = {
  bind(parameters: SqlValue[]): void
  step(): boolean
  get(): unknown[]
  getColumnNames(): string[]
  free(): void
}
type StatementIterator = { next(): { done?: boolean; value?: SqlStatement }; getRemainingSQL(): string }
export type SqliteDatabase = {
  run(sql: string, parameters?: SqlValue[]): unknown
  prepare(sql: string): SqlStatement
  iterateStatements(sql: string): StatementIterator
  close(): void
}
export type SqliteFactory = () => SqliteDatabase
type Solve = (...values: unknown[]) => unknown
type Query = (sql: string, parameters?: SqlValue[]) => SqlValue[][]
type Table = { columns: string[]; rows: SqlValue[][] }

/** A query that returns more rows than this fails its check, so a runaway join cannot flood the worker or the drawer. */
export const sqlRowLimit = 1000
/** Up to this many rows show in full; longer results show a window around the first difference. */
const fullRows = 20
const windowRows = 2
const shownColumns = 64
const shownText = 200

/** A failed guard or SQLite error worded for the learner. It fails the check with this message. */
export class SqlProblem extends Error {
  readonly sqlError?: SqlError
  constructor(message: string, sqlError?: SqlError) {
    super(message)
    this.sqlError = sqlError
  }
}

// Numbers, text, and null cross postMessage unchanged; a blob is shown as its hexadecimal literal.
function toValue(value: unknown): SqlValue {
  if (value === null || typeof value === 'number' || typeof value === 'string') return value
  if (value instanceof Uint8Array) return `x'${Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')}'`
  return String(value)
}

function readRows(statement: SqlStatement): Table {
  const columns = statement.getColumnNames()
  const rows: SqlValue[][] = []
  while (statement.step()) {
    if (rows.length === sqlRowLimit)
      throw new SqlProblem(`The query returned more than ${sqlRowLimit} rows. Check for a missing join condition or filter.`)
    rows.push(statement.get().map(toValue))
  }
  return { columns, rows }
}

function queryTable(db: SqliteDatabase, sql: string, parameters: SqlValue[] = []): Table {
  const statement = db.prepare(sql)
  try {
    statement.bind(parameters)
    return readRows(statement)
  } finally {
    statement.free()
  }
}

const quoteName = (name: SqlValue) => `"${String(name).replaceAll('"', '""')}"`

/** Every schema object and every table's rows, keyed by table, so any change at all is visible and can be described. */
function tableState(db: SqliteDatabase) {
  const objects = queryTable(db, "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").rows
  const tables = new Map<string, string[]>()
  for (const [type, name] of objects)
    if (type === 'table')
      tables.set(
        String(name),
        queryTable(db, `SELECT * FROM ${quoteName(name)}`).rows.map(row => JSON.stringify(row)),
      )
  return { schema: JSON.stringify(objects), tables }
}
type TableState = ReturnType<typeof tableState>
const snapshot = (db: SqliteDatabase) => {
  const state = tableState(db)
  return JSON.stringify([state.schema, [...state.tables]])
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** What changed between two states, in words: "deleted 1 row from orders". Empty when nothing changed. */
export function describeChange(before: TableState, after: TableState): string {
  const changes: string[] = []
  for (const name of before.tables.keys()) if (!after.tables.has(name)) changes.push(`dropped the table ${name}`)
  for (const name of after.tables.keys()) if (!before.tables.has(name)) changes.push(`created the table ${name}`)
  for (const [name, rows] of before.tables) {
    const now = after.tables.get(name)
    if (!now) continue
    const left = new Map<string, number>()
    for (const row of now) left.set(row, (left.get(row) ?? 0) + 1)
    let removed = 0
    for (const row of rows) {
      const count = left.get(row) ?? 0
      if (count) left.set(row, count - 1)
      else removed++
    }
    const added = [...left.values()].reduce((sum, count) => sum + count, 0)
    if (removed && !added) changes.push(`deleted ${plural(removed, 'row')} from ${name}`)
    else if (added && !removed) changes.push(`inserted ${plural(added, 'row')} into ${name}`)
    else if (added || removed) changes.push(`changed ${plural(Math.max(added, removed), 'row')} in ${name}`)
  }
  if (!changes.length && before.schema !== after.schema) changes.push('changed the database schema')
  return changes.join(' and ')
}

// The iterator holds a copy of the SQL until it reaches the end, so it is always drained: preparing is not running.
function drain(statements: StatementIterator) {
  try {
    while (!statements.next().done) {
      /* Prepare and free the rest without running it. */
    }
  } catch {
    /* A statement that cannot be prepared ends the iterator too. */
  }
}

/** Whether text after the first statement holds another one. Text that cannot even be prepared counts as one. */
function hasStatement(db: SqliteDatabase, sql: string) {
  const statements = db.iterateStatements(sql)
  try {
    return !statements.next().done
  } catch {
    return true
  } finally {
    drain(statements)
  }
}

/** SQLite's complaint about preparing the first statement of `sql`, or '' when it prepares. Nothing runs. */
function prepareMessage(db: SqliteDatabase, sql: string) {
  const statements = db.iterateStatements(sql)
  try {
    statements.next()
    return ''
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  } finally {
    drain(statements)
  }
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Where SQLite's complaint points in the learner's text. A syntax error is located by preparing growing prefixes of the
 * failing statement until SQLite gives the same complaint; other errors point at the first mention of the name.
 */
export function locateSqlError(db: SqliteDatabase, sql: string, statementStart: number, message: string): SqlError {
  const statement = sql.slice(statementStart)
  const near = /^near "(.+)": syntax error$/.exec(message)
  const named = /^(?:no such (?:column|table|function)|ambiguous column name): (.+)$/.exec(message)
  const token = near?.[1] ?? named?.[1]
  let offset = -1
  if (token) {
    const word = /^\w+$/.test(token)
    const pattern = new RegExp(word ? `(?<![\\w.])${escapeRegExp(token)}(?!\\w)` : escapeRegExp(token), 'gi')
    for (const match of statement.matchAll(pattern)) {
      if (near && prepareMessage(db, statement.slice(0, match.index + token.length)) !== message) continue
      offset = match.index
      break
    }
  } else if (message === 'incomplete input') offset = Math.max(0, statement.trimEnd().length - 1)
  if (offset < 0) return { message }
  const absolute = statementStart + offset
  const before = sql.slice(0, absolute)
  const lineStart = before.lastIndexOf('\n') + 1
  const lineEnd = sql.indexOf('\n', absolute)
  return {
    message,
    line: before.split('\n').length,
    column: absolute - lineStart + 1,
    source: sql.slice(lineStart, lineEnd < 0 ? undefined : lineEnd),
    length: Math.max(1, token?.length ?? 1),
  }
}

/** SQLite could not prepare a statement: the complaint, located in the learner's text when possible. */
function prepareProblem(db: SqliteDatabase, sql: string, statements: StatementIterator, error: unknown, position: number) {
  const reason = error instanceof Error ? error.message : String(error)
  const start = sql.length - statements.getRemainingSQL().length
  const located = locateSqlError(db, sql, start >= 0 && start <= sql.length ? start : 0, reason)
  const where = located.line ? ` (line ${located.line})` : ''
  return new SqlProblem(
    position > 1 ? `SQLite could not run statement ${position}${where}: ${reason}` : `SQLite could not run your SQL${where}: ${reason}`,
    located,
  )
}

/** Runs exactly one learner statement and returns its rows. A second statement fails the check before anything runs. */
function runOneStatement(db: SqliteDatabase, sql: string): Table {
  const statements = db.iterateStatements(sql)
  try {
    let first: ReturnType<StatementIterator['next']>
    try {
      first = statements.next()
    } catch (error) {
      throw prepareProblem(db, sql, statements, error, 1)
    }
    if (first.done || !first.value) throw new SqlProblem('Write one SELECT statement for the checks to run.')
    // Checked before anything runs, so a script is refused as a whole rather than stopping at its first write.
    if (hasStatement(db, statements.getRemainingSQL()))
      throw new SqlProblem('Submit exactly one statement. This task reads data with a single SELECT; remove the extra statement.')
    try {
      return readRows(first.value)
    } catch (error) {
      if (error instanceof SqlProblem) throw error
      throw new SqlProblem(`SQLite stopped while running your query: ${error instanceof Error ? error.message : String(error)}`)
    }
  } finally {
    drain(statements)
  }
}

/** Runs every learner statement in order, as a script would. The first failure stops the script and fails the check. */
function runScript(db: SqliteDatabase, sql: string) {
  const statements = db.iterateStatements(sql)
  let position = 0
  try {
    for (;;) {
      let next: ReturnType<StatementIterator['next']>
      try {
        next = statements.next()
      } catch (error) {
        throw prepareProblem(db, sql, statements, error, position + 1)
      }
      if (next.done || !next.value) break
      position++
      const statement = next.value
      let rows = 0
      try {
        while (statement.step())
          if (++rows > sqlRowLimit)
            throw new SqlProblem(
              `Statement ${position} returned more than ${sqlRowLimit} rows. Check for a missing join condition or filter.`,
            )
      } catch (error) {
        if (error instanceof SqlProblem) throw error
        const reason = error instanceof Error ? error.message : String(error)
        throw new SqlProblem(position > 1 ? `SQLite stopped at statement ${position}: ${reason}` : `SQLite stopped your SQL: ${reason}`)
      }
    }
  } finally {
    drain(statements)
  }
  if (position === 0) throw new SqlProblem('Write at least one SQL statement for the checks to run.')
}

// An open transaction is neither a committed success nor a completed rollback.
function rejectOpenTransaction(db: SqliteDatabase) {
  try {
    db.run('BEGIN')
  } catch {
    throw new SqlProblem('A transaction is still open. Finish it with COMMIT or ROLLBACK.')
  }
  db.run('ROLLBACK')
}

/**
 * Each check owns a new database; no files, persistence API, or progress data enter this adapter. The seed is authored
 * data, and the database is closed even when the learner's work throws.
 */
function withDatabase<T>(createDatabase: SqliteFactory, task: SqlTask, check: SqlCheck, body: (db: SqliteDatabase, query: Query) => T): T {
  const seed = task.seeds[check.seed]
  if (!seed) throw new Error(`Unknown SQLite seed: ${check.seed}`)
  const db = createDatabase()
  const query: Query = (sql, parameters = []) => queryTable(db, sql, parameters).rows
  try {
    if (task.foreignKeys) db.run('PRAGMA foreign_keys = ON')
    db.run(`${task.schema}\n${seed.sql}`)
    return body(db, query)
  } finally {
    db.close()
  }
}

const learnerApi = (db: SqliteDatabase, query: Query) => ({
  run: (sql: string, parameters?: SqlValue[]) => {
    db.run(sql, parameters)
  },
  query,
})

/**
 * What one SQLite check observed: the compared outcome, the columns of each table in it, SQLite's reasons for rejected
 * probes, and a failed guard with its located SQL error.
 */
export type SqlObservation = {
  outcome: Record<string, unknown>
  columns: Record<string, string[]>
  probeErrors?: string[]
  problem?: string
  sqlError?: SqlError
}

function readBack(db: SqliteDatabase, task: SqlTask, outcome: Record<string, unknown>, columns: Record<string, string[]>) {
  for (const { label, sql } of task.read ?? []) {
    try {
      const table = queryTable(db, sql)
      outcome[label] = table.rows
      columns[label] = table.columns
    } catch (error) {
      if (error instanceof SqlProblem) throw error
      throw new SqlProblem(`The checks could not read ${label} afterwards: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

function runProbes(db: SqliteDatabase, probes: readonly string[]) {
  const errors: string[] = []
  const results = probes.map((probe, index) => {
    try {
      db.run(probe)
      return 'accepted'
    } catch (error) {
      errors[index] = error instanceof Error ? error.message : String(error)
      return 'rejected'
    }
  })
  return { results, errors }
}

/** Runs one read-only statement inside a savepoint. Any change it made is described, undone, and fails the check. */
function runReadOnly(db: SqliteDatabase, sql: string): Table {
  const before = tableState(db)
  db.run('SAVEPOINT code_reps_check')
  let table: Table | undefined
  let failure: unknown
  try {
    table = runOneStatement(db, sql)
  } catch (error) {
    failure = error
  }
  const change = describeChange(before, tableState(db))
  try {
    db.run('ROLLBACK TO code_reps_check')
    db.run('RELEASE code_reps_check')
  } catch {
    /* The learner's statement ended the transaction itself; this database is discarded after the check anyway. */
  }
  if (change)
    throw new SqlProblem(
      `This rep expects a read-only query, but yours ${change}. The change was undone, so every other check starts from the same data.`,
    )
  if (failure !== undefined || !table) throw failure
  return table
}

/**
 * Checks learner SQL text. Read-only comparisons run one statement and compare its rows. State comparisons run a
 * script, then the check's probe statements, then the authored read-back queries.
 */
export function observeSql(task: SqlTask, check: SqlCheck, sql: string, createDatabase: SqliteFactory): SqlObservation {
  return withDatabase(createDatabase, task, check, db => {
    const outcome: Record<string, unknown> = {}
    const columns: Record<string, string[]> = {}
    try {
      if (task.compare === 'state') {
        runScript(db, sql)
        rejectOpenTransaction(db)
        let probeErrors: string[] | undefined
        if (check.probes?.length) {
          const probes = runProbes(db, check.probes)
          outcome.probes = probes.results
          probeErrors = probes.errors
        }
        readBack(db, task, outcome, columns)
        return { outcome, columns, probeErrors }
      }
      const table = runReadOnly(db, sql)
      outcome.rows = task.compare === 'unordered' ? sortRows(table.rows) : table.rows
      columns.rows = table.columns
      return { outcome, columns }
    } catch (error) {
      if (error instanceof SqlProblem) return { outcome, columns, problem: error.message, sqlError: error.sqlError }
      throw error
    }
  })
}

/** Checks a learner TypeScript function that receives the run/query interface. Stored rows are read independently. */
export function observeSqlFunction(task: SqlTask, check: SqlCheck, solve: Solve, args: unknown[], createDatabase: SqliteFactory) {
  return withDatabase(createDatabase, task, check, (db, query) => {
    const before = task.unchanged ? snapshot(db) : ''
    const value = solve(learnerApi(db, query), ...args)
    rejectOpenTransaction(db)
    const outcome: Record<string, unknown> = { [task.returns ?? 'value']: value }
    const columns: Record<string, string[]> = {}
    readBack(db, task, outcome, columns)
    if (task.unchanged) outcome.unchanged = snapshot(db) === before
    return { outcome, columns }
  })
}

// SQLite's own ordering of values: NULL first, then numbers by value, then text.
const rank = (value: SqlValue) => (value === null ? 0 : typeof value === 'number' ? 1 : 2)
function compareValues(a: SqlValue, b: SqlValue) {
  if (rank(a) !== rank(b)) return rank(a) - rank(b)
  if (a === null || b === null) return 0
  return a < b ? -1 : a > b ? 1 : 0
}
/** Sorts rows by every column, first to last, so rows compare as a multiset: duplicates stay, order stops mattering. */
export const sortRows = (rows: SqlValue[][]) =>
  [...rows].sort((a, b) => {
    for (let column = 0; column < Math.max(a.length, b.length); column++) {
      const order = compareValues(a[column] ?? null, b[column] ?? null)
      if (order) return order
    }
    return a.length - b.length
  })

/** The authored expectation in the same canonical form the observation uses. */
export function expectedOutcome(task: SqlTask, expected: unknown): unknown {
  if (task.compare !== 'unordered' || !expected || typeof expected !== 'object' || !('rows' in expected)) return expected
  return { ...expected, rows: sortRows((expected as { rows: SqlValue[][] }).rows) }
}

const isTable = (value: unknown): value is SqlValue[][] => Array.isArray(value) && value.every(row => Array.isArray(row))

/** A value as the comparison sentence names it: text in quotes, so case and spaces show; NULL as NULL. */
export const formatSqlValue = (value: SqlValue) => (value === null ? 'NULL' : typeof value === 'string' ? `'${value}'` : String(value))

type Step = { kind: 'same' | 'changed' | 'missing' | 'extra'; e?: number; r?: number }

/**
 * Pairs expected and received rows with the fewest changes: identical rows match, similar rows pair up with their
 * differing cells marked, and the rest are missing or extra. Rows that share no cell never pair, except single values.
 */
export function alignRows(expected: SqlValue[][], received: SqlValue[][]): Step[] {
  const n = expected.length
  const m = received.length
  const width = m + 1
  const cost = new Float64Array((n + 1) * width)
  const move = new Uint8Array((n + 1) * width)
  const pair = (a: SqlValue[], b: SqlValue[]) => {
    if (a.length !== b.length) return Infinity
    let differ = 0
    for (let index = 0; index < a.length; index++) if (!sameValue(a[index], b[index])) differ++
    if (!differ) return 0
    if (differ === a.length) return a.length === 1 ? 1.5 : Infinity
    return (2 * differ) / a.length
  }
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= m; j++) {
      if (!i && !j) continue
      let best = Infinity
      let choice = 0
      if (i && j) {
        const value = cost[(i - 1) * width + j - 1] + pair(expected[i - 1], received[j - 1])
        if (value < best) [best, choice] = [value, 1]
      }
      if (i && cost[(i - 1) * width + j] + 1 < best) [best, choice] = [cost[(i - 1) * width + j] + 1, 2]
      if (j && cost[i * width + j - 1] + 1 < best) [best, choice] = [cost[i * width + j - 1] + 1, 3]
      cost[i * width + j] = best
      move[i * width + j] = choice
    }
  const steps: Step[] = []
  for (let i = n, j = m; i || j;) {
    const choice = move[i * width + j]
    if (choice === 1) {
      i--
      j--
      steps.push({ kind: sameValue(expected[i], received[j]) ? 'same' : 'changed', e: i, r: j })
    } else if (choice === 2) steps.push({ kind: 'missing', e: --i })
    else steps.push({ kind: 'extra', r: --j })
  }
  return steps.reverse()
}

const clip = (cells: SqlValue[]) =>
  cells.slice(0, shownColumns).map(cell => (typeof cell === 'string' && cell.length > shownText ? `${cell.slice(0, shownText)}…` : cell))

type Marks = Map<number, Omit<ShownRow, 'n' | 'cells'>>
function windowOf(columns: string[], rows: SqlValue[][], focus: number, marks: Marks): ShownRows {
  const all = rows.length <= fullRows
  const start = all ? 0 : Math.max(0, Math.min(focus - windowRows, rows.length - (2 * windowRows + 1)))
  const end = all ? rows.length : Math.min(rows.length, start + 2 * windowRows + 1)
  return {
    columns: columns.slice(0, shownColumns),
    total: rows.length,
    rows: rows.slice(start, end).map((cells, offset) => ({ n: start + offset + 1, cells: clip(cells), ...marks.get(start + offset) })),
    before: start,
    after: rows.length - end,
  }
}

/**
 * Compares one table side by side. Columns are checked first; then rows are paired (sorted by every column first
 * when order does not matter) and the first difference is named in one sentence.
 */
export function compareRows(
  label: string,
  expectedColumns: string[],
  expected: SqlValue[][],
  receivedColumns: string[],
  received: SqlValue[][],
  ordered?: boolean,
): { same: boolean; table: ResultTable } {
  const want = ordered === false ? sortRows(expected) : expected
  const got = ordered === false ? sortRows(received) : received
  let columnNote: string | undefined
  if (receivedColumns.length !== expectedColumns.length)
    columnNote = `Your query returned ${plural(receivedColumns.length, 'column')} (${receivedColumns.join(', ') || 'none'}); expected ${expectedColumns.length}: ${expectedColumns.join(', ')}.`
  else {
    const renamed = expectedColumns.findIndex((name, index) => name.toLowerCase() !== receivedColumns[index].toLowerCase())
    if (renamed >= 0) columnNote = `Column ${renamed + 1} is named ${receivedColumns[renamed]}; expected ${expectedColumns[renamed]}.`
  }
  const comparable = receivedColumns.length === expectedColumns.length
  const sameRows = sameValue(got, want)
  const empty: Marks = new Map()
  if (sameRows && !columnNote)
    return {
      same: true,
      table: {
        label,
        ordered,
        expected: windowOf(expectedColumns, want, 0, empty),
        received: windowOf(receivedColumns, got, 0, empty),
        totals: { expected: want.length, received: got.length },
      },
    }
  const expectedMarks: Marks = new Map()
  const receivedMarks: Marks = new Map()
  let first: string | undefined
  let focusE = 0
  let focusR = 0
  if (comparable && !sameRows) {
    // The same rows in another order pair up by position, so the sentence can say the order is what differs.
    const reordered = ordered === true && want.length === got.length && sameValue(sortRows(want), sortRows(got))
    const steps: Step[] = reordered
      ? want.map((row, index) => ({ kind: sameValue(row, got[index]) ? 'same' : 'changed', e: index, r: index }))
      : alignRows(want, got)
    for (const step of steps) {
      if (step.kind === 'missing') expectedMarks.set(step.e!, { mark: 'missing' })
      if (step.kind === 'extra') receivedMarks.set(step.r!, { mark: 'extra' })
      if (step.kind === 'changed') {
        const wrong = want[step.e!].flatMap((value, column): [number, SqlValue][] =>
          sameValue(value, got[step.r!][column]) ? [] : [[column, value]],
        )
        receivedMarks.set(step.r!, { wrong })
      }
    }
    const at = steps.findIndex(step => step.kind !== 'same')
    const step = steps[at]
    const earlier = steps.slice(0, at)
    focusE = step.e ?? earlier.findLast(item => item.e !== undefined)?.e ?? 0
    focusR = step.r ?? earlier.findLast(item => item.r !== undefined)?.r ?? 0
    const lead = reordered ? 'The right rows in a different order. First difference' : 'First difference'
    if (step.kind === 'changed') {
      const [column, value] = receivedMarks.get(step.r!)!.wrong![0]
      first = `${lead}: row ${step.r! + 1}, ${expectedColumns[column]} — expected ${formatSqlValue(value)}, received ${formatSqlValue(got[step.r!][column])}.`
    } else if (step.kind === 'extra') first = `${lead}: row ${step.r! + 1} is extra.`
    else first = `${lead}: expected row ${step.e! + 1} is missing.`
  }
  const onlyExtra = comparable && !sameRows && !expectedMarks.size && [...receivedMarks.values()].every(mark => mark.mark === 'extra')
  const onlyMissing = comparable && !sameRows && !receivedMarks.size
  return {
    same: false,
    table: {
      label,
      ordered,
      expected: onlyExtra ? null : windowOf(expectedColumns, want, focusE, expectedMarks),
      received: onlyMissing ? null : windowOf(receivedColumns, got, focusR, receivedMarks),
      totals: { expected: want.length, received: got.length },
      ...(columnNote ? { columnNote } : {}),
      ...(first ? { first } : {}),
    },
  }
}

/**
 * Compares one learner SQL observation with its check: columns, then rows, then tables read back afterwards, then
 * probe statements. Returns the learner-facing verdict, the tables that differ, and any located SQL error.
 */
export function judgeSql(task: SqlTask, check: Check, observation: SqlObservation) {
  const expected = expectedOutcome(task, check.expected) as Record<string, unknown>
  const { outcome, columns, problem, sqlError } = observation
  const tables: ResultTable[] = []
  if (problem) return { passed: false, message: problem, tables, sqlError }
  const messages: string[] = []
  let passed = true
  const compare = (label: string, wantColumns: string[], want: SqlValue[][], gotColumns: string[], got: unknown, ordered?: boolean) => {
    const result = compareRows(label, wantColumns, want, gotColumns, isTable(got) ? got : [], ordered)
    if (result.same) return
    passed = false
    tables.push(result.table)
    for (const line of [result.table.columnNote, result.table.first]) if (line) messages.push(line)
  }
  if (task.compare !== 'state' && 'rows' in expected)
    compare('Rows', task.columns ?? [], expected.rows as SqlValue[][], columns.rows ?? [], outcome.rows, task.compare === 'ordered')
  for (const { label } of task.read ?? [])
    if (label in expected) compare(label, columns[label] ?? [], expected[label] as SqlValue[][], columns[label] ?? [], outcome[label])
  const probes = check.sql?.probes
  if (probes && 'probes' in expected && !sameValue(outcome.probes, expected.probes)) {
    passed = false
    const got = (outcome.probes as string[] | undefined) ?? []
    ;(expected.probes as string[]).forEach((want, index) => {
      if (got[index] === want) return
      const label = check.sql?.labels?.[index]
      messages.push(
        want === 'rejected'
          ? label
            ? `Your table stored ${label} instead of rejecting it.`
            : `Your table accepted ${probes[index]} instead of rejecting it.`
          : `Your table rejected ${label ?? probes[index]}: ${observation.probeErrors?.[index] ?? 'SQLite refused it'}.`,
      )
    })
  }
  if (passed && !sameValue(outcome, expected)) {
    passed = false
    messages.push('The result does not match the contract.')
  }
  return { passed, message: passed ? undefined : messages.join(' '), tables, sqlError: undefined }
}
