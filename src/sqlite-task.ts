export const SQLITE_REP_ID = 'sqlite-stock-transfer'
export const SPEND_REPORT_ID = 'sqlite-spend-report'
/** Reps whose checks run against real SQLite. Only these load the bundled SQLite WASM in the worker. */
export const isSqliteRep = (repId: string) => repId === SQLITE_REP_ID || repId === SPEND_REPORT_ID
type SqlValue = number | string | null
export type SqliteDatabase = {
  run(sql: string, parameters?: SqlValue[]): unknown
  prepare(sql: string): { bind(parameters: SqlValue[]): void; step(): boolean; get(): SqlValue[]; free(): void }
  close(): void
}
export type SqliteFactory = () => SqliteDatabase

type Solve = (...values: unknown[]) => unknown

/** Rows as arrays, with the statement released even when binding or stepping fails. */
const queryWith =
  (db: SqliteDatabase) =>
  (sql: string, parameters: SqlValue[] = []) => {
    const statement = db.prepare(sql)
    try {
      statement.bind(parameters)
      const rows: SqlValue[][] = []
      while (statement.step()) rows.push(statement.get())
      return rows
    } finally {
      statement.free()
    }
  }

/** Runs the check for whichever SQLite rep `repId` names. */
export function checkSqliteRep(repId: string, solve: Solve, input: unknown[], createDatabase: SqliteFactory) {
  return repId === SPEND_REPORT_ID ? checkSpendReport(solve, input, createDatabase) : checkStockTransfer(solve, input, createDatabase)
}

/** Each check owns a new database; no files, persistence API, or progress data enter this adapter. */
export function checkStockTransfer(solve: Solve, input: unknown[], createDatabase: SqliteFactory) {
  const db = createDatabase()
  const query = queryWith(db)
  try {
    db.run(
      'CREATE TABLE warehouses (id INTEGER PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0)); CREATE TABLE transfers (id INTEGER PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount > 0)); INSERT INTO warehouses VALUES (1,10),(2,3),(3,0);',
    )
    if (input[1]) db.run('INSERT INTO transfers VALUES (1,2)')
    const accepted = solve(
      {
        run: (sql: string, parameters?: SqlValue[]) => {
          db.run(sql, parameters)
        },
        query,
      },
      input[0],
    )
    // An open transaction is not a committed success or completed rollback.
    db.run('BEGIN')
    db.run('ROLLBACK')
    return {
      accepted,
      warehouses: query('SELECT id, units FROM warehouses ORDER BY id'),
      transfers: query('SELECT id, amount FROM transfers ORDER BY id'),
    }
  } finally {
    db.close()
  }
}

const shopSchema =
  "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), cents INTEGER NOT NULL CHECK(cents >= 0), status TEXT NOT NULL CHECK(status IN ('paid', 'cancelled')));"
/** Seed data for the spend report, by the name a check gives as its second input. */
export const spendReportSeeds: Record<string, string> = {
  shop: "INSERT INTO customers VALUES (1,'Ana'),(2,'Bo'),(3,'Cy'),(4,'Di'),(5,'O''Neil'); INSERT INTO orders VALUES (1,1,500,'paid'),(2,1,250,'paid'),(3,2,900,'paid'),(4,2,400,'cancelled'),(5,3,750,'paid'),(6,1,100,'cancelled'),(7,5,750,'paid');",
  quiet: "INSERT INTO customers VALUES (1,'Ana'),(2,'Bo'); INSERT INTO orders VALUES (1,2,0,'paid'),(2,1,300,'cancelled');",
  empty: '',
}

/** The report is read-only: checks compare every stored row before and after, and reject an open transaction. */
export function checkSpendReport(solve: Solve, input: unknown[], createDatabase: SqliteFactory) {
  const db = createDatabase()
  const query = queryWith(db)
  const snapshot = () => JSON.stringify([query('SELECT * FROM customers ORDER BY id'), query('SELECT * FROM orders ORDER BY id')])
  try {
    db.run(shopSchema + (spendReportSeeds[String(input[1])] ?? ''))
    const before = snapshot()
    const report = solve(
      {
        run: (sql: string, parameters?: SqlValue[]) => {
          db.run(sql, parameters)
        },
        query,
      },
      input[0],
    )
    db.run('BEGIN')
    db.run('ROLLBACK')
    return { report, unchanged: snapshot() === before }
  } finally {
    db.close()
  }
}
