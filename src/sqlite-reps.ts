import type { Rep } from './rep-types.ts'

export const sqliteReps: Rep[] = [
  {
    id: 'sqlite-stock-transfer',
    title: 'Transfer stock with SQLite',
    category: 'Backend',
    format: 'backend',
    functionName: 'transferStock',
    prompt:
      'Write transferStock(db, amount). Use real SQL to move amount units from warehouse 1 to warehouse 2 as one transaction. Return true after committing, or false after rolling back a SQL failure. The runner supplies a fresh in-memory SQLite database for every check. warehouses has id INTEGER PRIMARY KEY and units INTEGER NOT NULL CHECK(units >= 0); rows start as (1, 10), (2, 3), (3, 0). transfers has id INTEGER PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount > 0), and starts empty. Debit warehouse 1, credit warehouse 2, and insert a transfers row with id 1 and the amount, all inside the transaction. A check may already contain transfer id 1, so that final insert must fail and undo both updates. amount is an integer from 1 to 20; insufficient stock must also roll back. Do not change the schema, warehouse 3, or existing transfer rows. db.run(sql, parameters?) executes SQL and throws on failure; db.query(sql, parameters?) returns rows as arrays of numbers, strings, or null. Bind values with ? placeholders and an array. Return synchronously; do not close the database. Checks independently query all rows after your function returns, rather than trusting your return value.',
    brief: {
      summary:
        'Write transferStock(db, amount). Move units between two warehouses using real SQLite and one transaction. Return true on commit or false after rolling back a SQL failure.',
      rules: [
        'Each check gets a fresh in-memory database. warehouses(id INTEGER PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0)) starts with rows (1,10), (2,3), (3,0). transfers(id INTEGER PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount > 0)) starts empty unless the check seeds (1,2).',
        'Inside one transaction: debit amount from warehouse 1, credit amount to warehouse 2, then insert transfer (1, amount). Commit only after all three writes succeed. Roll back on any SQL failure.',
        'db.run(sql, parameters?) executes SQL and throws on failure. db.query(sql, parameters?) returns rows as arrays of numbers, strings, or null. Bind values with ? placeholders and a parameter array.',
        'amount is an integer from 1 to 20. Return synchronously. Do not close the database, change its schema, change warehouse 3, or change existing transfers.',
        'Checks query all stored rows after your return and reject an open transaction. SQL style, parameter binding, and schema preservation also need self-review.',
      ],
      edgeCases: [
        'An excessive debit violates the nonnegative-stock constraint: leave every row unchanged.',
        'An existing transfer id 1 makes the final insert fail after both stock updates. Undo both updates and preserve the existing transfer.',
      ],
    },
    example: {
      input: 'transferStock(db, 4), fresh rows (1,10), (2,3), (3,0)',
      output: 'true; warehouses [[1,6],[2,7],[3,0]]; transfers [[1,4]]',
    },
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
    hints: [
      'Separate the return value from the stored rows: both must agree with the outcome.',
      'Begin before the first write. A failure in the last write must undo earlier successful writes.',
      'Use BEGIN, then parameterized UPDATE and INSERT statements in try. COMMIT on success; ROLLBACK and return false in catch.',
    ],
    checks: [
      {
        name: 'Ordinary transfer and recorded SQL rows',
        input: [4, false],
        expected: {
          accepted: true,
          warehouses: [
            [1, 6],
            [2, 7],
            [3, 0],
          ],
          transfers: [[1, 4]],
        },
      },
      {
        name: 'One unit',
        input: [1, false],
        expected: {
          accepted: true,
          warehouses: [
            [1, 9],
            [2, 4],
            [3, 0],
          ],
          transfers: [[1, 1]],
        },
      },
      {
        name: 'Exact available stock',
        input: [10, false],
        expected: {
          accepted: true,
          warehouses: [
            [1, 0],
            [2, 13],
            [3, 0],
          ],
          transfers: [[1, 10]],
        },
      },
      {
        name: 'Insufficient stock rolls back',
        input: [11, false],
        expected: {
          accepted: false,
          warehouses: [
            [1, 10],
            [2, 3],
            [3, 0],
          ],
          transfers: [],
        },
      },
      {
        name: 'Maximum amount rolls back',
        input: [20, false],
        expected: {
          accepted: false,
          warehouses: [
            [1, 10],
            [2, 3],
            [3, 0],
          ],
          transfers: [],
        },
      },
      {
        name: 'Final insert failure undoes both updates',
        input: [4, true],
        expected: {
          accepted: false,
          warehouses: [
            [1, 10],
            [2, 3],
            [3, 0],
          ],
          transfers: [[1, 2]],
        },
      },
      {
        name: 'Final failure at exact stock boundary',
        input: [10, true],
        expected: {
          accepted: false,
          warehouses: [
            [1, 10],
            [2, 3],
            [3, 0],
          ],
          transfers: [[1, 2]],
        },
      },
    ],
  },

  {
    id: 'sqlite-customer-totals',
    title: 'Total orders per customer with a JOIN',
    category: 'Backend',
    format: 'backend',
    functionName: 'customerTotals',
    context:
      'A support dashboard lists customers by how much they have spent, so the team can spot their biggest accounts. Customers who have never ordered must still appear when the minimum is zero.',
    prompt:
      'Write customerTotals(db, minimumCents). Use one SQL query to return a row [name, orderCount, totalCents] for every customer whose total order value is at least minimumCents, including customers with no orders, whose count and total are 0. Sort by totalCents from highest to lowest, then by name in ascending order. customers has id INTEGER PRIMARY KEY and name TEXT NOT NULL. orders has id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL referencing customers, and cents INTEGER NOT NULL CHECK(cents >= 0). Return the rows that db.query gives you, without changing them, and do not change any table. db.query(sql, parameters?) returns rows as arrays; bind minimumCents with a ? placeholder. Each check seeds a fresh in-memory database.',
    brief: {
      summary: 'Write customerTotals(db, minimumCents) and return one [name, orderCount, totalCents] row per qualifying customer.',
      rules: [
        'customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL); orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL CHECK(cents >= 0)).',
        'Include every customer whose total order value is at least minimumCents, including customers with no orders, whose count and total are 0.',
        'Sort by totalCents from highest to lowest, then by name in ascending order.',
        'Use one query through db.query(sql, parameters?), bind minimumCents with a ? placeholder, and return its rows unchanged.',
      ],
      edgeCases: ['Do not change any table. Each check seeds a fresh in-memory database.', 'An order of 0 cents still counts as an order.'],
    },
    example: {
      input: 'customerTotals(db, 600), where Ada has orders of 1200 and 800, Bo one of 2000, Cy none, and Di three totalling 500',
      output: "[['Ada', 2, 2000], ['Bo', 1, 2000]]",
    },
    note: 'minimumCents is an integer from 0 to 1000000. Checks compare your returned rows and confirm the tables are unchanged. They do not establish that you used one query, a JOIN, or parameter binding; review those yourself.',
    vocabulary: [
      { term: 'LEFT JOIN', meaning: 'a join that keeps every row of the first table even when the second has no match' },
      { term: 'Aggregate', meaning: 'a function such as COUNT or SUM that combines many rows into one value' },
      { term: 'HAVING', meaning: 'a filter applied to groups after aggregates are calculated' },
    ],
    planPrompt:
      'Write the result you expect for a customer with no orders, then name the clauses that produce it. Which filter runs before grouping, and which after?',
    starter: `type SqlValue = number | string | null
type Database = {
  run(sql: string, parameters?: SqlValue[]): void
  query(sql: string, parameters?: SqlValue[]): SqlValue[][]
}

function customerTotals(db: Database, minimumCents: number): SqlValue[][] {
  return db.query('SELECT name FROM customers')
}
`,
    hints: [
      'A plain JOIN drops customers who have no orders. Choose the join that keeps them.',
      'Over no matching rows, COUNT(*) still counts the customer’s own row and SUM returns null. Count a column from orders, and turn a null total into 0.',
      'GROUP BY the customer, filter totals with HAVING, and ORDER BY the total descending and then the name.',
    ],
    checks: [
      {
        name: 'Everyone, including a customer with no orders',
        input: [0, 'standard'],
        expected: {
          rows: [
            ['Ada', 2, 2000],
            ['Bo', 1, 2000],
            ['Di', 3, 500],
            ['Cy', 0, 0],
          ],
          unchanged: true,
        },
      },
      {
        name: 'A minimum keeps only bigger accounts',
        input: [600, 'standard'],
        expected: {
          rows: [
            ['Ada', 2, 2000],
            ['Bo', 1, 2000],
          ],
          unchanged: true,
        },
      },
      {
        name: 'The minimum is inclusive',
        input: [500, 'standard'],
        expected: {
          rows: [
            ['Ada', 2, 2000],
            ['Bo', 1, 2000],
            ['Di', 3, 500],
          ],
          unchanged: true,
        },
      },
      { name: 'A minimum above every total', input: [2001, 'standard'], expected: { rows: [], unchanged: true } },
      {
        name: 'A free order still counts as an order',
        input: [0, 'free-order'],
        expected: {
          rows: [
            ['Ada', 1, 0],
            ['Bo', 0, 0],
          ],
          unchanged: true,
        },
      },
      {
        name: 'No orders at all, ties sorted by name',
        input: [0, 'no-orders'],
        expected: {
          rows: [
            ['Amy', 0, 0],
            ['Zed', 0, 0],
          ],
          unchanged: true,
        },
      },
      { name: 'No customers', input: [0, 'empty'], expected: { rows: [], unchanged: true } },
    ],
  },
  {
    id: 'sqlite-restock-upsert',
    title: 'Restock inventory without duplicate rows',
    category: 'Backend',
    format: 'backend',
    functionName: 'restock',
    context:
      'A warehouse records deliveries and corrections. A delivery for a new product creates its row; a delivery for a known product adds to it. A batch is all or nothing: if one correction would push stock below zero, none of the batch is applied.',
    prompt:
      'Write restock(db, deliveries). inventory has sku TEXT PRIMARY KEY and units INTEGER NOT NULL CHECK(units >= 0), and starts with (A-1, 5) and (B-2, 0). Inside one transaction, apply each {sku, units} in order: insert a new row for an unknown sku, or add units to the existing row. units may be negative for a correction. Commit and return true when every delivery succeeds. If any statement fails, for example because stock would go below zero, roll back the whole batch and return false. Bind values with ? placeholders; SKUs may contain quotes. db.run(sql, parameters?) executes SQL and throws on failure. Return synchronously and do not close the database.',
    brief: {
      summary: 'Write restock(db, deliveries): insert or add to inventory rows inside one transaction, all or nothing.',
      rules: [
        'inventory(sku TEXT PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0)) starts with (A-1, 5) and (B-2, 0).',
        'Inside one transaction, apply each {sku, units} in order: insert a new row for an unknown sku, or add units to the existing row. units may be negative for a correction.',
        'Commit and return true when every delivery succeeds. If any statement fails, roll back the whole batch and return false.',
        'Bind values with ? placeholders; SKUs may contain quotes. db.run(sql, parameters?) throws on failure. Return synchronously and do not close the database.',
      ],
      edgeCases: ['The same sku may appear twice in one batch.', 'An empty batch succeeds and changes nothing.'],
    },
    example: {
      input: "restock(db, [{sku: 'A-1', units: 3}, {sku: 'C-3', units: 4}])",
      output: "true; inventory [['A-1', 8], ['B-2', 0], ['C-3', 4]]",
    },
    note: 'deliveries has 0 to 50 entries; sku is a nonempty string of up to 20 printable ASCII characters; units is an integer from -50 to 50. Checks read every stored row after you return and reject an open transaction. Statement style and parameter binding remain self-reviewed.',
    vocabulary: [
      { term: 'Upsert', meaning: 'insert a row, or update it if a row with the same key already exists' },
      { term: 'Primary key', meaning: 'a column whose value identifies exactly one row' },
      { term: 'All or nothing', meaning: 'either every change in a group is kept or none are' },
    ],
    planPrompt:
      'Predict the stored rows after a batch that adds to A-1 and then corrects B-2 below zero. Which statement fails, and what undoes the first change?',
    starter: `type SqlValue = number | string | null
type Database = {
  run(sql: string, parameters?: SqlValue[]): void
  query(sql: string, parameters?: SqlValue[]): SqlValue[][]
}

function restock(db: Database, deliveries: { sku: string; units: number }[]): boolean {
  // Write your SQL and transaction handling here.
  return false
}
`,
    hints: [
      'Each delivery either changes an existing row or creates a new one, and a failure anywhere must undo the whole batch.',
      'INSERT … ON CONFLICT DO UPDATE looks ideal, but SQLite tests the CHECK constraint on the row you try to insert before it handles the conflict, so a negative correction to an existing product fails.',
      'BEGIN before the loop. For each delivery, UPDATE the row by sku and read SELECT changes(); when no row changed, INSERT a new one. COMMIT after the loop; ROLLBACK and return false in catch.',
    ],
    checks: [
      {
        name: 'Adds to an existing product',
        input: [[{ sku: 'A-1', units: 3 }]],
        expected: {
          accepted: true,
          inventory: [
            ['A-1', 8],
            ['B-2', 0],
          ],
        },
      },
      {
        name: 'Creates a new product',
        input: [[{ sku: 'C-3', units: 4 }]],
        expected: {
          accepted: true,
          inventory: [
            ['A-1', 5],
            ['B-2', 0],
            ['C-3', 4],
          ],
        },
      },
      {
        name: 'The same product twice in one batch',
        input: [
          [
            { sku: 'C-3', units: 1 },
            { sku: 'C-3', units: 2 },
          ],
        ],
        expected: {
          accepted: true,
          inventory: [
            ['A-1', 5],
            ['B-2', 0],
            ['C-3', 3],
          ],
        },
      },
      {
        name: 'An empty batch changes nothing',
        input: [[]],
        expected: {
          accepted: true,
          inventory: [
            ['A-1', 5],
            ['B-2', 0],
          ],
        },
      },
      {
        name: 'A correction down to zero',
        input: [[{ sku: 'A-1', units: -5 }]],
        expected: {
          accepted: true,
          inventory: [
            ['A-1', 0],
            ['B-2', 0],
          ],
        },
      },
      {
        name: 'A failing correction undoes the whole batch',
        input: [
          [
            { sku: 'A-1', units: 2 },
            { sku: 'B-2', units: -1 },
          ],
        ],
        expected: {
          accepted: false,
          inventory: [
            ['A-1', 5],
            ['B-2', 0],
          ],
        },
      },
      {
        name: 'A new product cannot start below zero',
        input: [[{ sku: 'D-4', units: -1 }]],
        expected: {
          accepted: false,
          inventory: [
            ['A-1', 5],
            ['B-2', 0],
          ],
        },
      },
      {
        name: 'A SKU containing a quote',
        input: [[{ sku: "O'NEIL-1", units: 2 }]],
        expected: {
          accepted: true,
          inventory: [
            ['A-1', 5],
            ['B-2', 0],
            ["O'NEIL-1", 2],
          ],
        },
      },
    ],
  },
]
