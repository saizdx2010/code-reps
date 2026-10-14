import assert from 'node:assert/strict'
import test from 'node:test'
import initSqlJs from 'sql.js'
import { checkStockTransfer } from '../src/sqlite-task.ts'
import { runRep } from '../src/runner.ts'
import { sqliteSolution } from './fixtures/sqlite-solution.mjs'

const SQL = await initSqlJs()
const run = code => runRep(code, 'sqlite-stock-transfer', () => new SQL.Database())

test('SQLite reference passes all query and transaction checks repeatedly on fresh databases', () => {
  for (let i = 0; i < 2; i++)
    assert.deepEqual(
      run(sqliteSolution).filter(row => !row.passed),
      [],
    )
})
test('real SQLite rejects missing rollback and premature commit after a final insert failure', () => {
  for (const code of [
    sqliteSolution.replace("db.run('ROLLBACK')", ''),
    sqliteSolution.replace(
      "db.run('INSERT INTO transfers (id, amount) VALUES (1, ?)', [amount])",
      "db.run('COMMIT'); db.run('INSERT INTO transfers (id, amount) VALUES (1, ?)', [amount]); db.run('BEGIN')",
    ),
  ]) {
    assert.equal(run(code).find(row => row.name === 'Final insert failure undoes both updates').passed, false)
  }
})
test('return values alone cannot fake stored query results', () => {
  assert.ok(run('function transferStock() { return true }').every(row => !row.passed))
})
test('databases close on learner errors and fresh checks still run', () => {
  let opened = 0
  let closed = 0
  const results = runRep('function transferStock() { throw new Error("learner failure") }', 'sqlite-stock-transfer', () => {
    opened++
    const db = new SQL.Database()
    const close = db.close.bind(db)
    db.close = () => {
      closed++
      close()
    }
    return db
  })
  assert.equal(opened, 7)
  assert.equal(closed, opened)
  assert.ok(results.every(row => !row.passed && row.message === 'learner failure'))
  assert.ok(run(sqliteSolution).every(row => row.passed))
})
test('database initialization failures remain actionable check failures', () => {
  const results = runRep(sqliteSolution, 'sqlite-stock-transfer', () => {
    throw new Error('SQLite unavailable')
  })
  assert.ok(results.every(row => !row.passed && row.message === 'SQLite unavailable'))
})

test('learner query binds parameters, returns empty rows, and releases failed statements', () => {
  const transfer = new Function(`${sqliteSolution}; return transferStock`)()
  const result = checkStockTransfer(
    (db, amount) => {
      assert.deepEqual(db.query('SELECT units FROM warehouses WHERE id = ?', [2]), [[3]])
      assert.deepEqual(db.query('SELECT units FROM warehouses WHERE id = ?', [99]), [])
      assert.throws(() => db.query('SELECT missing FROM warehouses'))
      return transfer(db, amount)
    },
    [4, false],
    () => new SQL.Database(),
  )
  assert.deepEqual(result, {
    accepted: true,
    warehouses: [
      [1, 6],
      [2, 7],
      [3, 0],
    ],
    transfers: [[1, 4]],
  })
})

const reportSql = `function spendReport(db, minimumCents) {
  return db.query(
    "SELECT c.name, COUNT(o.id), COALESCE(SUM(o.cents), 0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid' GROUP BY c.id HAVING total >= ? ORDER BY total DESC, c.name",
    [minimumCents],
  )
}`
const report = code => runRep(code, 'sqlite-spend-report', () => new SQL.Database())
const failedNames = code =>
  report(code)
    .filter(row => !row.passed)
    .map(row => row.name)

test('a single grouped SQL query passes every spend report check on fresh databases', () => {
  for (let i = 0; i < 2; i++) assert.deepEqual(failedNames(reportSql), [])
})

test('spend report checks reject the characteristic SQL mistakes', () => {
  const mistakes = {
    // The paid condition in WHERE drops customers whose orders are missing or cancelled.
    where: reportSql.replace(" AND o.status = 'paid' GROUP BY", " WHERE o.status = 'paid' GROUP BY"),
    // COUNT(*) counts the null row of a customer with no orders.
    countStar: reportSql.replace('COUNT(o.id)', 'COUNT(*)'),
    // SUM without COALESCE returns null for no paid orders.
    nullSum: reportSql.replace('COALESCE(SUM(o.cents), 0)', 'SUM(o.cents)'),
    // Ties are left in id order.
    noNameOrder: reportSql.replace('ORDER BY total DESC, c.name', 'ORDER BY total DESC, c.id DESC'),
    // A strict minimum.
    strict: reportSql.replace('HAVING total >= ?', 'HAVING total > ?'),
    // Cleaning up cancelled orders changes stored data.
    deletes: reportSql.replace(
      'function spendReport(db, minimumCents) {',
      'function spendReport(db, minimumCents) {\n  db.run("DELETE FROM orders WHERE status = \'cancelled\'")',
    ),
  }
  for (const [name, code] of Object.entries(mistakes)) assert.ok(failedNames(code).length > 0, `${name} escaped the checks`)
  assert.ok(failedNames(mistakes.deletes).includes('Every customer when the minimum is zero'))
})

test('an unfinished report transaction is rejected rather than counted as unchanged', () => {
  const open = reportSql.replace('function spendReport(db, minimumCents) {', "function spendReport(db, minimumCents) {\n  db.run('BEGIN')")
  assert.ok(report(open).every(row => !row.passed))
})
