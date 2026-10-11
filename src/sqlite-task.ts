export const SQLITE_REP_ID = 'sqlite-stock-transfer'
export type SqlValue = number | string | null
export type SqliteDatabase = {
  run(sql: string, parameters?: SqlValue[]): unknown
  prepare(sql: string): { bind(parameters: SqlValue[]): void; step(): boolean; get(): SqlValue[]; free(): void }
  close(): void
}
export type SqliteFactory = () => SqliteDatabase

/** Each check owns a new database; no files, persistence API, or progress data enter this adapter. */
export function checkStockTransfer(solve: (...values: unknown[]) => unknown, input: unknown[], createDatabase: SqliteFactory) {
  const db = createDatabase()
  const query = (sql: string, parameters: SqlValue[] = []) => {
    const statement = db.prepare(sql)
    try {
      statement.bind(parameters)
      const rows: SqlValue[][] = []
      while (statement.step()) rows.push(statement.get())
      return rows
    } finally { statement.free() }
  }
  try {
    db.run('CREATE TABLE warehouses (id INTEGER PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0)); CREATE TABLE transfers (id INTEGER PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount > 0)); INSERT INTO warehouses VALUES (1,10),(2,3),(3,0);')
    if (input[1]) db.run('INSERT INTO transfers VALUES (1,2)')
    const accepted = solve({ run: (sql: string, parameters?: SqlValue[]) => { db.run(sql, parameters) }, query }, input[0])
    // An open transaction is not a committed success or completed rollback.
    db.run('BEGIN')
    db.run('ROLLBACK')
    return { accepted, warehouses: query('SELECT id, units FROM warehouses ORDER BY id'), transfers: query('SELECT id, amount FROM transfers ORDER BY id') }
  } finally { db.close() }
}
