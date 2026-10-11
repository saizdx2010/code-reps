import type { Rep } from './rep-types.ts'

export const sqliteReps: Rep[] = [{
  id: 'sqlite-stock-transfer', title: 'Transfer stock with SQLite', category: 'Backend', format: 'backend',
  functionName: 'transferStock',
  prompt: 'Write transferStock(db, amount). Use real SQL to move amount units from warehouse 1 to warehouse 2 as one transaction. Return true after committing, or false after rolling back a SQL failure. The runner supplies a fresh in-memory SQLite database for every check. warehouses has id INTEGER PRIMARY KEY and units INTEGER NOT NULL CHECK(units >= 0); rows start as (1, 10), (2, 3), (3, 0). transfers has id INTEGER PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount > 0), and starts empty. Debit warehouse 1, credit warehouse 2, and insert a transfers row with id 1 and the amount, all inside the transaction. A check may already contain transfer id 1, so that final insert must fail and undo both updates. amount is an integer from 1 to 20; insufficient stock must also roll back. Do not change the schema, warehouse 3, or existing transfer rows. db.run(sql, parameters?) executes SQL and throws on failure; db.query(sql, parameters?) returns rows as arrays of numbers, strings, or null. Bind values with ? placeholders and an array. Return synchronously; do not close the database. Checks independently query all rows after your function returns, rather than trusting your return value.',
  brief: {
    summary: 'Write transferStock(db, amount). Move units between two warehouses using real SQLite and one transaction. Return true on commit or false after rolling back a SQL failure.',
    rules: [
      'Each check gets a fresh in-memory database. warehouses(id INTEGER PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0)) starts with rows (1,10), (2,3), (3,0). transfers(id INTEGER PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount > 0)) starts empty unless the check seeds (1,2).',
      'Inside one transaction: debit amount from warehouse 1, credit amount to warehouse 2, then insert transfer (1, amount). Commit only after all three writes succeed. Roll back on any SQL failure.',
      'db.run(sql, parameters?) executes SQL and throws on failure. db.query(sql, parameters?) returns rows as arrays of numbers, strings, or null. Bind values with ? placeholders and a parameter array.',
      'amount is an integer from 1 to 20. Return synchronously. Do not close the database, change its schema, change warehouse 3, or change existing transfers.',
      'Checks query all stored rows after your return and reject an open transaction. SQL style, parameter binding, and schema preservation also need self-review.',
    ],
    edgeCases: ['An excessive debit violates the nonnegative-stock constraint: leave every row unchanged.', 'An existing transfer id 1 makes the final insert fail after both stock updates. Undo both updates and preserve the existing transfer.'],
  },
  example: { input: 'transferStock(db, 4), fresh rows (1,10), (2,3), (3,0)', output: 'true; warehouses [[1,6],[2,7],[3,0]]; transfers [[1,4]]' },
  note: 'Only this rep loads bundled SQLite WASM in the existing timed worker. Its temporary database never opens the learner progress database. Passing checks establishes the listed behavior; inspect SQL, parameter binding, and transaction boundaries yourself.',
  vocabulary: [
    { term: 'Transaction', meaning: 'A group of database changes that succeeds or is undone together.' },
    { term: 'Rollback', meaning: 'Undo the changes made since the transaction began.' },
    { term: 'Constraint', meaning: 'A database rule that rejects invalid stored values.' },
    { term: 'Parameter binding', meaning: 'Supply values separately from SQL text using placeholders.' },
  ],
  planPrompt: 'Name the three writes, the two possible failures, and what every table should contain after each outcome.',
  starter: `type SqlValue = number | string | null
type Database = {
  run(sql: string, parameters?: SqlValue[]): void
  query(sql: string, parameters?: SqlValue[]): SqlValue[][]
}

function transferStock(db: Database, amount: number): boolean {
  // Write your SQL and transaction handling here.
  return false
}
`,
  hints: ['Separate the return value from the stored rows: both must agree with the outcome.', 'Begin before the first write. A failure in the last write must undo earlier successful writes.', 'Use BEGIN, then parameterized UPDATE and INSERT statements in try. COMMIT on success; ROLLBACK and return false in catch.'],
  checks: [
    { name: 'Ordinary transfer and recorded SQL rows', input: [4, false], expected: { accepted: true, warehouses: [[1,6],[2,7],[3,0]], transfers: [[1,4]] } },
    { name: 'One unit', input: [1, false], expected: { accepted: true, warehouses: [[1,9],[2,4],[3,0]], transfers: [[1,1]] } },
    { name: 'Exact available stock', input: [10, false], expected: { accepted: true, warehouses: [[1,0],[2,13],[3,0]], transfers: [[1,10]] } },
    { name: 'Insufficient stock rolls back', input: [11, false], expected: { accepted: false, warehouses: [[1,10],[2,3],[3,0]], transfers: [] } },
    { name: 'Maximum amount rolls back', input: [20, false], expected: { accepted: false, warehouses: [[1,10],[2,3],[3,0]], transfers: [] } },
    { name: 'Final insert failure undoes both updates', input: [4, true], expected: { accepted: false, warehouses: [[1,10],[2,3],[3,0]], transfers: [[1,2]] } },
    { name: 'Final failure at exact stock boundary', input: [10, true], expected: { accepted: false, warehouses: [[1,10],[2,3],[3,0]], transfers: [[1,2]] } },
  ],
}]
