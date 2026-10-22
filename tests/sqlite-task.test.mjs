import assert from 'node:assert/strict'
import test from 'node:test'
import initSqlJs from 'sql.js'
import { compareRows, formatSqlValue, judgeSql, observeSql, observeSqlFunction, sqlRowLimit } from '../src/sqlite-task.ts'
import { repNeedsSqlite, runAsyncRep, runRep } from '../src/runner.ts'
import { reps } from '../src/rep.ts'
import { sqliteSolution } from './fixtures/sqlite-solution.mjs'
import { sqlSolutions } from './fixtures/sql-solutions.mjs'

const SQL = await initSqlJs()
const run = code => runRep(code, 'sqlite-stock-transfer', () => new SQL.Database())
const repById = id => reps.find(rep => rep.id === id)

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
test('an open transaction fails with a learner-facing message', () => {
  const failed = run(sqliteSolution.replace("db.run('ROLLBACK')", '')).find(row => row.name === 'Final insert failure undoes both updates')
  assert.equal(failed.message, 'A transaction is still open. Finish it with COMMIT or ROLLBACK.')
  assert.match(failed.input, /^transferStock\(db, 4\) with .*existing transfer \(1, 2\)/)
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
  const rep = repById('sqlite-stock-transfer')
  const transfer = new Function(`${sqliteSolution}; return transferStock`)()
  const { outcome } = observeSqlFunction(
    rep.sql,
    { seed: 'standard' },
    (db, amount) => {
      assert.deepEqual(db.query('SELECT units FROM warehouses WHERE id = ?', [2]), [[3]])
      assert.deepEqual(db.query('SELECT units FROM warehouses WHERE id = ?', [99]), [])
      assert.throws(() => db.query('SELECT missing FROM warehouses'))
      return transfer(db, amount)
    },
    [4],
    () => new SQL.Database(),
  )
  assert.deepEqual(outcome, {
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
  // So is a schema change that leaves every row in place.
  assert.ok(
    failedNames(id, query(good).replace('return db.query', "db.run('CREATE INDEX extra ON orders (cents)'); return db.query")).length > 0,
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

test('needing SQLite comes from rep data, not a list of IDs', () => {
  const needs = reps.filter(rep => repNeedsSqlite(rep.id)).map(rep => rep.id)
  assert.deepEqual(
    needs.sort(),
    reps
      .filter(rep => rep.sql)
      .map(rep => rep.id)
      .sort(),
  )
  for (const id of ['sqlite-stock-transfer', 'sqlite-customer-totals', 'sqlite-restock-upsert', 'sql-select-columns'])
    assert.ok(needs.includes(id), id)
  assert.equal(repNeedsSqlite('sum-positive-numbers'), false)
  assert.equal(repNeedsSqlite('not-a-rep'), false)
  for (const rep of reps.filter(item => item.format === 'sql')) {
    assert.ok(rep.sql, rep.id)
    for (const check of rep.checks) assert.ok(check.sql && rep.sql.seeds[check.sql.seed], `${rep.id}: ${check.name}`)
  }
})

// Learner SQL text: the generic checker, its guards, and the comparison it reports.
const select = code => runRep(code, 'sql-select-columns', () => new SQL.Database())
const failures = code => select(code).filter(row => !row.passed)

test('learner SQL runs as written: reference passes, and row order does not matter in an unordered comparison', async () => {
  assert.deepEqual(failures(sqlSolutions['sql-select-columns']), [])
  assert.deepEqual(failures('select TITLE, Author, year as PUBLISHED from books order by title desc'), [])
  assert.deepEqual(failures('SELECT title, author, year AS published FROM books; -- trailing comment\n'), [])
  assert.deepEqual(
    (await runAsyncRep(sqlSolutions['sql-select-columns'], 'sql-select-columns', () => new SQL.Database())).filter(row => !row.passed),
    [],
  )
})

test('wrong columns are reported first, and the learner rows still show in their own columns', () => {
  const [first] = failures('SELECT * FROM books')
  assert.match(first.message, /^Your query returned 5 columns \(id, title, author, year, pages\); expected 3: title, author, published\./)
  assert.equal(first.input, 'Starting data: five books, two of them by Ursula K. Le Guin')
  const [table] = first.tables
  assert.deepEqual(table.expected.columns, ['title', 'author', 'published'])
  assert.deepEqual(table.received.columns, ['id', 'title', 'author', 'year', 'pages'])
  // Order does not matter here, so both sides are sorted by every column, numbers by value.
  assert.deepEqual(
    table.received.rows.map(row => row.cells[0]),
    [1, 2, 3, 4, 5],
  )
  assert.equal(table.ordered, false)
  assert.equal(first.expected, undefined)
  const [renamed] = failures('SELECT title, author, year FROM books')
  assert.match(renamed.message, /^Column 3 is named year; expected published\.$/)
})

test('DISTINCT, filtering, and a missing alias each fail a named boundary', () => {
  const names = code => failures(code).map(row => row.name)
  assert.deepEqual(names('SELECT DISTINCT title, author, year AS published FROM books'), ['Both copies of a duplicated book stay'])
  assert.deepEqual(names('SELECT title, author, year AS published FROM books WHERE year IS NOT NULL'), ['An unknown year stays NULL'])
  assert.equal(names('SELECT title, author, year FROM books').length, 5)
  const [copies] = failures('SELECT DISTINCT title, author, year AS published FROM books')
  assert.match(copies.message, /^First difference: expected row [12] is missing\.$/)
  assert.deepEqual(copies.tables[0].totals, { expected: 3, received: 2 })
})

test('read-only SQL rejects more than one statement, even two SELECTs', () => {
  for (const code of [
    'SELECT title, author, year AS published FROM books; SELECT 1',
    'DELETE FROM books; SELECT title, author, year AS published FROM books',
    'SELECT title, author, year AS published FROM books; SELEC',
  ]) {
    const results = select(code)
    assert.ok(
      results.every(row => !row.passed && /Submit exactly one statement/.test(row.message)),
      code,
    )
  }
})

test('read-only SQL that changes data fails with what it changed, and the change is undone', () => {
  const read = (code, check = 0) => select(code)[check].message
  const undone = 'The change was undone, so every other check starts from the same data.'
  assert.equal(read("UPDATE books SET title = 'x'"), `This rep expects a read-only query, but yours changed 5 rows in books. ${undone}`)
  assert.equal(read('DELETE FROM books WHERE id = 1'), `This rep expects a read-only query, but yours deleted 1 row from books. ${undone}`)
  assert.equal(read('DROP TABLE books'), `This rep expects a read-only query, but yours dropped the table books. ${undone}`)
  assert.equal(
    read("INSERT INTO books VALUES (9,'a','b',1,1)"),
    `This rep expects a read-only query, but yours inserted 1 row into books. ${undone}`,
  )
  assert.equal(
    read('CREATE INDEX by_title ON books (title)'),
    `This rep expects a read-only query, but yours changed the database schema. ${undone}`,
  )
  // Even when the returned rows are right, a write that returns them fails: the stored data changed.
  assert.equal(
    read('DELETE FROM books RETURNING title, author, year AS published'),
    `This rep expects a read-only query, but yours deleted 5 rows from books. ${undone}`,
  )
  // The savepoint undoes the change inside the check's own database before the next statement could see it.
  const rep = repById('sql-select-columns')
  let observed
  observeSql(rep.sql, { seed: 'shelf' }, 'DELETE FROM books', () => {
    const db = new SQL.Database()
    const close = db.close.bind(db)
    db.close = () => {
      observed = db.exec('SELECT COUNT(*) FROM books')[0].values[0][0]
      close()
    }
    return db
  })
  assert.equal(observed, 5)
})

test('empty SQL, syntax errors, and unknown columns are readable failures that locate the problem', () => {
  assert.match(failures('')[0].message, /Write one SELECT statement/)
  assert.match(failures('-- nothing yet')[0].message, /Write one SELECT statement/)
  const syntax = failures('SELECT title, author\nFORM books')
  assert.equal(syntax[0].message, 'SQLite could not run your SQL (line 2): near "books": syntax error')
  assert.ok(syntax.every(row => row.sqlError?.message === 'near "books": syntax error'))
  assert.deepEqual(syntax[0].sqlError, { message: 'near "books": syntax error', line: 2, column: 6, source: 'FORM books', length: 5 })
  // The prefix search skips an earlier, valid use of the same word.
  assert.deepEqual(failures('SELECT title FROM FROM books')[0].sqlError, {
    message: 'near "FROM": syntax error',
    line: 1,
    column: 19,
    source: 'SELECT title FROM FROM books',
    length: 4,
  })
  const missing = failures('SELECT nope FROM books')[0]
  assert.match(missing.message, /no such column: nope/)
  assert.equal(missing.sqlError.column, 8)
  assert.equal(failures('SELECT title FROM')[0].sqlError.message, 'incomplete input')
  // A runtime error depends on the data, so it is reported per check without a location.
  assert.equal(failures('SELECT title, author, year AS published FROM books WHERE abs(-9223372036854775807 - 1)')[0].sqlError, undefined)
})

test('a runaway result fails at the row limit instead of flooding the drawer', () => {
  const code = `WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${sqlRowLimit + 5}) SELECT 't', 'a', i FROM n`
  assert.ok(select(code).every(row => !row.passed && /more than 1000 rows/.test(row.message)))
})

test('every SQL check opens its own database and closes it, even when the SQL fails', () => {
  for (const code of [sqlSolutions['sql-select-columns'], 'SELEC', 'DELETE FROM books']) {
    let opened = 0
    let closed = 0
    runRep(code, 'sql-select-columns', () => {
      opened++
      const db = new SQL.Database()
      const close = db.close.bind(db)
      db.close = () => {
        closed++
        close()
      }
      return db
    })
    assert.equal(opened, repById('sql-select-columns').checks.length)
    assert.equal(closed, opened)
  }
  assert.ok(runRep('SELECT 1', 'sql-select-columns').every(row => !row.passed && /SQLite must be loaded/.test(row.message)))
})

// Comparison modes and state checks, on small authored tasks.
const items = {
  schema: 'CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, qty INTEGER NOT NULL CHECK (qty >= 0));',
  seeds: { two: { about: 'two items', sql: "INSERT INTO items VALUES (1,'bolt',4),(2,'nut',0);" } },
}
const observe = (task, check, sql) => observeSql(task, check, sql, () => new SQL.Database())
const judge = (task, check, sql) => judgeSql(task, check, observe(task, check.sql, sql))

test('an ordered comparison names a sort problem when only the order differs', () => {
  const task = { ...items, compare: 'ordered', columns: ['name'] }
  const check = { name: 'by name', input: [], sql: { seed: 'two' }, expected: { rows: [['bolt'], ['nut']] } }
  assert.equal(judge(task, check, 'SELECT name FROM items ORDER BY name').passed, true)
  const wrong = judge(task, check, 'SELECT name FROM items ORDER BY name DESC')
  assert.equal(wrong.passed, false)
  assert.match(wrong.message, /right rows in a different order/)
  // The same rows in any order pass an unordered comparison.
  assert.equal(judge({ ...task, compare: 'unordered' }, check, 'SELECT name FROM items ORDER BY name DESC').passed, true)
})

test('state comparisons run a script, read tables back, and report the failing statement', () => {
  const task = { ...items, compare: 'state', read: [{ label: 'items', sql: 'SELECT name, qty FROM items ORDER BY id' }] }
  const check = {
    name: 'restock',
    input: [],
    sql: { seed: 'two' },
    expected: {
      items: [
        ['bolt', 4],
        ['nut', 5],
      ],
    },
  }
  assert.equal(judge(task, check, "UPDATE items SET qty = qty + 5 WHERE name = 'nut';").passed, true)
  const wrong = judge(task, check, 'UPDATE items SET qty = qty + 5;')
  assert.equal(wrong.passed, false)
  assert.equal(wrong.message, 'First difference: row 1, qty — expected 4, received 9.')
  assert.deepEqual(wrong.tables[0].received.rows[0], { n: 1, cells: ['bolt', 9], wrong: [[1, 4]] })
  assert.equal(wrong.tables[0].ordered, undefined)
  assert.match(
    judge(task, check, 'UPDATE items SET qty = 1; UPDATE items SET qty = -1').message,
    /SQLite stopped at statement 2: CHECK constraint failed/,
  )
  assert.match(judge(task, check, 'BEGIN; UPDATE items SET qty = 5 WHERE id = 2').message, /transaction is still open/)
  assert.match(judge(task, check, 'DROP TABLE items').message, /could not read items afterwards: no such table: items/)
  // An empty script changes nothing, so the comparison shows the unchanged rows.
  assert.deepEqual(
    judge(task, check, '  -- not yet').tables[0].received.rows.map(row => row.cells),
    [
      ['bolt', 4],
      ['nut', 0],
    ],
  )
  const second = judge(task, check, 'UPDATE items SET qty = 5 WHERE id = 2;\nUPDAT items SET qty = 1')
  assert.equal(second.message, 'SQLite could not run statement 2 (line 2): near "UPDAT": syntax error')
  assert.equal(second.sqlError.line, 2)
})

test('probe statements report what SQLite accepted and rejected after the learner schema', () => {
  const task = { schema: '', seeds: { none: { about: 'an empty database', sql: '' } }, compare: 'state' }
  const check = {
    name: 'unique names',
    input: [],
    sql: {
      seed: 'none',
      probes: ["INSERT INTO tags (name) VALUES ('a')", "INSERT INTO tags (name) VALUES ('a')", 'INSERT INTO tags (name) VALUES (NULL)'],
    },
    expected: { probes: ['accepted', 'rejected', 'rejected'] },
  }
  assert.equal(judge(task, check, 'CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);').passed, true)
  const loose = judge(task, check, 'CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT);')
  assert.equal(loose.passed, false)
  assert.equal(
    loose.message,
    "Your table accepted INSERT INTO tags (name) VALUES ('a') instead of rejecting it. Your table accepted INSERT INTO tags (name) VALUES (NULL) instead of rejecting it.",
  )
  const strict = judge(
    task,
    { ...check, expected: { probes: ['accepted', 'accepted', 'rejected'] } },
    'CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);',
  )
  assert.equal(strict.message, "Your table rejected INSERT INTO tags (name) VALUES ('a'): UNIQUE constraint failed: tags.name.")
})

test('row comparisons pair similar rows, mark extra and missing rows, and window long results', () => {
  const columns = ['name', 'total']
  const changed = compareRows(
    'Rows',
    columns,
    [
      ['Ada', 2000],
      ['Bo', 2000],
      ['Di', 500],
    ],
    columns,
    [
      ['Ada', 2000],
      ['Bo', 2000],
      ['Di', 450],
    ],
    true,
  )
  assert.equal(changed.table.first, 'First difference: row 3, total — expected 500, received 450.')
  assert.deepEqual(changed.table.received.rows[2], { n: 3, cells: ['Di', 450], wrong: [[1, 500]] })
  assert.deepEqual(changed.table.totals, { expected: 3, received: 3 })
  const extra = compareRows(
    'Rows',
    columns,
    [
      ['Ada', 2000],
      ['Bo', 2000],
      ['Di', 500],
    ],
    columns,
    [
      ['Ada', 2000],
      ['Bo', 2000],
      ['Di', 500],
      ['Cy', null],
    ],
    true,
  )
  assert.equal(extra.table.first, 'First difference: row 4 is extra.')
  assert.equal(extra.table.expected, null)
  assert.deepEqual(extra.table.received.rows[3], { n: 4, cells: ['Cy', null], mark: 'extra' })
  const missing = compareRows(
    'Rows',
    columns,
    [
      ['Ada', 1],
      ['Bo', 2],
      ['Cy', 3],
    ],
    columns,
    [
      ['Ada', 1],
      ['Cy', 3],
    ],
    true,
  )
  assert.equal(missing.table.first, 'First difference: expected row 2 is missing.')
  assert.equal(missing.table.received, null)
  assert.equal(missing.table.expected.rows[1].mark, 'missing')
  // A missing row in the middle does not turn every later row into a wrong cell.
  const shifted = compareRows('Rows', ['n'], [['a'], ['b'], ['c'], ['d']], ['n'], [['a'], ['c'], ['d'], ['e']], true)
  assert.deepEqual(
    shifted.table.expected.rows.map(row => row.mark ?? ''),
    ['', 'missing', '', ''],
  )
  assert.deepEqual(
    shifted.table.received.rows.map(row => row.mark ?? ''),
    ['', '', '', 'extra'],
  )
  const reordered = compareRows(
    'Rows',
    columns,
    [
      ['Ada', 1],
      ['Bo', 2],
    ],
    columns,
    [
      ['Bo', 2],
      ['Ada', 1],
    ],
    true,
  )
  assert.match(
    reordered.table.first,
    /^The right rows in a different order\. First difference: row 1, name — expected 'Ada', received 'Bo'\.$/,
  )
  assert.equal(
    compareRows(
      'Rows',
      columns,
      [
        ['Ada', 1],
        ['Bo', 2],
      ],
      columns,
      [
        ['Bo', 2],
        ['Ada', 1],
      ],
      false,
    ).same,
    true,
  )
  const long = Array.from({ length: 60 }, (_, index) => [`r${String(index).padStart(2, '0')}`, index])
  const window = compareRows(
    'Rows',
    columns,
    long,
    columns,
    long.map((row, index) => (index === 30 ? [row[0], -1] : row)),
    true,
  )
  assert.deepEqual(
    window.table.received.rows.map(row => row.n),
    [29, 30, 31, 32, 33],
  )
  assert.deepEqual([window.table.received.before, window.table.received.after], [28, 27])
  assert.equal(compareRows('Rows', columns, long.slice(0, 20), columns, long.slice(0, 19), true).table.expected.rows.length, 20)
})

test('formatted values keep text quoted and NULL distinct from empty text', () => {
  assert.equal(formatSqlValue(null), 'NULL')
  assert.equal(formatSqlValue(''), "''")
  assert.equal(formatSqlValue('Ada'), "'Ada'")
  assert.equal(formatSqlValue(2.5), '2.5')
})

const reportSql = `function spendReport(db, minimumCents) {
  return db.query(
    "SELECT c.name, COUNT(o.id), COALESCE(SUM(o.cents), 0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid' GROUP BY c.id HAVING total >= ? ORDER BY total DESC, c.name",
    [minimumCents],
  )
}`
const report = code => runTask('sqlite-spend-report', code)
const reportFailures = code => failedNames('sqlite-spend-report', code)

test('a single grouped SQL query passes every spend report check on fresh databases', () => {
  for (let i = 0; i < 2; i++) assert.deepEqual(reportFailures(reportSql), [])
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
  for (const [name, code] of Object.entries(mistakes)) assert.ok(reportFailures(code).length > 0, `${name} escaped the checks`)
  assert.ok(reportFailures(mistakes.deletes).includes('Every customer when the minimum is zero'))
})

test('an unfinished report transaction is rejected rather than counted as unchanged', () => {
  const open = reportSql.replace('function spendReport(db, minimumCents) {', "function spendReport(db, minimumCents) {\n  db.run('BEGIN')")
  assert.ok(report(open).every(row => !row.passed))
})
