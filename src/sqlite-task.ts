export const SQLITE_REP_ID = 'sqlite-stock-transfer'
type SqlValue = number | string | null
export type SqliteDatabase = {
  run(sql: string, parameters?: SqlValue[]): unknown
  prepare(sql: string): { bind(parameters: SqlValue[]): void; step(): boolean; get(): SqlValue[]; free(): void }
  close(): void
}
export type SqliteFactory = () => SqliteDatabase
type Solve = (...values: unknown[]) => unknown
type Query = (sql: string, parameters?: SqlValue[]) => SqlValue[][]

/**
 * Each check owns a new database; no files, persistence API, or progress data enter this adapter. The learner sees
 * only run and query, and every task reads the stored rows itself after the learner returns.
 */
function withDatabase<T>(createDatabase: SqliteFactory, setup: string, body: (db: SqliteDatabase, query: Query) => T): T {
  const db = createDatabase()
  const query: Query = (sql, parameters = []) => {
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
  try {
    db.run(setup)
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
// An open transaction is not a committed success or completed rollback.
const rejectOpenTransaction = (db: SqliteDatabase) => {
  db.run('BEGIN')
  db.run('ROLLBACK')
}

export function checkStockTransfer(solve: Solve, input: unknown[], createDatabase: SqliteFactory) {
  return withDatabase(
    createDatabase,
    'CREATE TABLE warehouses (id INTEGER PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0)); CREATE TABLE transfers (id INTEGER PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount > 0)); INSERT INTO warehouses VALUES (1,10),(2,3),(3,0);',
    (db, query) => {
      if (input[1]) db.run('INSERT INTO transfers VALUES (1,2)')
      const accepted = solve(learnerApi(db, query), input[0])
      rejectOpenTransaction(db)
      return {
        accepted,
        warehouses: query('SELECT id, units FROM warehouses ORDER BY id'),
        transfers: query('SELECT id, amount FROM transfers ORDER BY id'),
      }
    },
  )
}

const customerSeeds: Record<string, string> = {
  standard:
    "INSERT INTO customers VALUES (1,'Ada'),(2,'Bo'),(3,'Cy'),(4,'Di'); INSERT INTO orders VALUES (1,1,1200),(2,2,2000),(3,4,150),(4,1,800),(5,4,50),(6,4,300);",
  'free-order': "INSERT INTO customers VALUES (1,'Ada'),(2,'Bo'); INSERT INTO orders VALUES (1,1,0);",
  'no-orders': "INSERT INTO customers VALUES (1,'Zed'),(2,'Amy');",
  empty: '',
}

export function checkCustomerTotals(solve: Solve, input: unknown[], createDatabase: SqliteFactory) {
  const seed = customerSeeds[String(input[1])] ?? ''
  return withDatabase(
    createDatabase,
    `CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), cents INTEGER NOT NULL CHECK(cents >= 0)); ${seed}`,
    (db, query) => {
      const snapshot = () => JSON.stringify([query('SELECT * FROM customers ORDER BY id'), query('SELECT * FROM orders ORDER BY id')])
      const before = snapshot()
      const rows = solve(learnerApi(db, query), input[0])
      rejectOpenTransaction(db)
      return { rows, unchanged: snapshot() === before }
    },
  )
}

export function checkRestock(solve: Solve, input: unknown[], createDatabase: SqliteFactory) {
  return withDatabase(
    createDatabase,
    "CREATE TABLE inventory (sku TEXT PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0)); INSERT INTO inventory VALUES ('A-1',5),('B-2',0);",
    (db, query) => {
      const accepted = solve(learnerApi(db, query), input[0])
      rejectOpenTransaction(db)
      return { accepted, inventory: query('SELECT sku, units FROM inventory ORDER BY sku') }
    },
  )
}

const sqliteTasks: Record<string, (solve: Solve, input: unknown[], createDatabase: SqliteFactory) => unknown> = {
  [SQLITE_REP_ID]: checkStockTransfer,
  'sqlite-customer-totals': checkCustomerTotals,
  'sqlite-restock-upsert': checkRestock,
}

/** Reps whose checks need the bundled SQLite engine. The worker loads it only for these IDs. */
export const isSqliteRep = (repId: string) => Object.hasOwn(sqliteTasks, repId)

export function checkSqliteTask(repId: string, solve: Solve, input: unknown[], createDatabase: SqliteFactory) {
  return sqliteTasks[repId](solve, input, createDatabase)
}
