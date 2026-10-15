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

const runTask = (id, code) => runRep(code, id, () => new SQL.Database())
const failedNames = (id, code) =>
  runTask(id, code)
    .filter(row => !row.passed)
    .map(row => row.name)

test('customer totals checks reject inner joins, counting joined rows, missing COALESCE, and WHERE filtering', () => {
  const id = 'sqlite-customer-totals'
  const query = sql => `function customerTotals(db, minimumCents) { return db.query(${JSON.stringify(sql)}, [minimumCents]) }`
  const good =
    'SELECT c.name, COUNT(o.id), COALESCE(SUM(o.cents), 0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id HAVING total >= ? ORDER BY total DESC, c.name ASC'
  assert.deepEqual(failedNames(id, query(good)), [])
  for (const mistake of [
    good.replace('LEFT JOIN', 'JOIN'),
    good.replace('COUNT(o.id)', 'COUNT(*)'),
    good.replace('COALESCE(SUM(o.cents), 0)', 'SUM(o.cents)'),
    good.replace(', c.name ASC', ''),
    good.replace('HAVING total >= ?', 'HAVING total > ?'),
  ])
    assert.ok(failedNames(id, query(mistake)).length > 0, mistake)
  // A query that changes data is caught even when its rows are right.
  assert.ok(
    failedNames(id, query(good).replace('return db.query', "db.run('DELETE FROM orders WHERE cents = 0'); return db.query")).length > 0,
  )
})

test('restock checks reject per-delivery commits, replacing rows, string-built SQL, and open transactions', () => {
  const id = 'sqlite-restock-upsert'
  const upsert = sql => `function restock(db, deliveries) {
    db.run('BEGIN')
    try {
      for (const d of deliveries) ${sql}
      db.run('COMMIT')
      return true
    } catch {
      db.run('ROLLBACK')
      return false
    }
  }`
  const good =
    "{ db.run('UPDATE inventory SET units = units + ? WHERE sku = ?', [d.units, d.sku]); if (db.query('SELECT changes()')[0][0] === 0) db.run('INSERT INTO inventory (sku, units) VALUES (?, ?)', [d.sku, d.units]) }"
  assert.deepEqual(failedNames(id, upsert(good)), [])
  // SQLite tests CHECK on the row it tries to insert before resolving the conflict, so the plain upsert rejects a valid correction.
  assert.deepEqual(
    failedNames(
      id,
      upsert(
        "db.run('INSERT INTO inventory (sku, units) VALUES (?, ?) ON CONFLICT(sku) DO UPDATE SET units = units + excluded.units', [d.sku, d.units])",
      ),
    ),
    ['A correction down to zero'],
  )
  assert.ok(failedNames(id, upsert("db.run('INSERT OR REPLACE INTO inventory (sku, units) VALUES (?, ?)', [d.sku, d.units])")).length > 0)
  assert.ok(
    failedNames(
      id,
      upsert(
        "{ db.run('UPDATE inventory SET units = units + ' + d.units + \" WHERE sku = '\" + d.sku + \"'\"); if (db.query('SELECT changes()')[0][0] === 0) db.run(\"INSERT INTO inventory (sku, units) VALUES ('\" + d.sku + \"', \" + d.units + ')') }",
      ),
    ).includes('A SKU containing a quote'),
  )
  const perDelivery = `function restock(db, deliveries) { try { for (const d of deliveries) ${good} return true } catch { return false } }`
  assert.ok(failedNames(id, perDelivery).includes('A failing correction undoes the whole batch'))
  const noRollback = upsert(good).replace("db.run('ROLLBACK')", '')
  assert.ok(failedNames(id, noRollback).includes('A failing correction undoes the whole batch'))
})
