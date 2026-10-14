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
    id: 'sqlite-spend-report',
    title: 'Report paid spending with a SQL query',
    category: 'Backend',
    format: 'backend',
    functionName: 'spendReport',
    prompt:
      "Write spendReport(db, minimumCents). Use one SQL query to report, for every customer, their name, how many paid orders they have, and the total cents of those paid orders. Count only orders whose status is 'paid'. A customer with no paid orders still appears, with 0 orders and 0 cents. Keep only customers whose paid total is at least minimumCents, and sort by paid total from highest to lowest, then by name in ascending order. Return the rows as arrays [name, paidOrders, paidCents]. The runner supplies a fresh in-memory SQLite database for every check. customers has id INTEGER PRIMARY KEY and name TEXT NOT NULL. orders has id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL CHECK(cents >= 0), and status TEXT that is 'paid' or 'cancelled'. db.query(sql, parameters?) returns rows as arrays; db.run(sql, parameters?) executes SQL. Bind minimumCents with a ? placeholder. The report must not change any row; checks compare every stored row before and after.",
    brief: {
      summary:
        'Write spendReport(db, minimumCents) with one SQL query: each customer’s name, paid order count, and paid total, filtered and sorted. Do not change any row.',
      rules: [
        "customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL) and orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL CHECK(cents >= 0), status TEXT 'paid' or 'cancelled'). Each check gets a fresh in-memory database with its own rows.",
        "Count only orders with status 'paid'. A customer with no paid orders appears with 0 orders and 0 cents.",
        'Keep customers whose paid total is at least minimumCents. Bind minimumCents with a ? placeholder.',
        'Sort by paid total from highest to lowest, then by name in ascending order. Return rows as [name, paidOrders, paidCents].',
        'db.query(sql, parameters?) returns rows as arrays of numbers, strings, or null. Do not change, add, or delete rows; checks compare all stored rows afterwards.',
      ],
      edgeCases: [
        'A customer whose only orders are cancelled, or who has no orders at all',
        'A paid order of 0 cents still counts as a paid order',
        'Customers tied on total, including a name with an apostrophe',
      ],
    },
    example: {
      input: "spendReport(db, 751), customers Ana, Bo, Cy; Bo's paid orders total 900 and Ana's 750",
      output: '[["Bo", 1, 900]]',
    },
    note: 'minimumCents is a whole number from 0 to 100000. Names are ASCII text and may contain apostrophes; sorting by name uses SQLite’s default binary order. Checks run real SQLite in the existing timed worker and never open the learner progress database. They establish the returned rows and unchanged data, not that you used one query or bound the parameter; review those yourself.',
    vocabulary: [
      { term: 'LEFT JOIN', meaning: 'a join that keeps every row of the left table, filling the missing right side with null' },
      { term: 'Aggregate', meaning: 'a SQL function, such as COUNT or SUM, that combines many rows into one value' },
      { term: 'GROUP BY', meaning: 'the SQL clause that makes one result row for each group of rows sharing a value' },
      { term: 'COALESCE', meaning: 'a SQL function that returns its first argument that is not null' },
    ],
    planPrompt:
      'Which customers would an inner join lose? Where must the paid-only condition go so they still appear, and what do COUNT and SUM give for a customer with no matching orders?',
    starter: `type SqlValue = number | string | null
type Database = {
  run(sql: string, parameters?: SqlValue[]): void
  query(sql: string, parameters?: SqlValue[]): SqlValue[][]
}

function spendReport(db: Database, minimumCents: number): SqlValue[][] {
  // Write one SQL query here.
  return []
}
`,
    hints: [
      'Start from customers so every customer can appear, then attach their orders.',
      "A condition on orders in WHERE removes customers whose orders do not match. Put status = 'paid' in the join condition instead.",
      'Group by customer, count matching order ids rather than rows, turn a missing sum into 0, filter the groups with HAVING and a bound value, then ORDER BY the total and the name.',
    ],
    checks: [
      {
        name: 'Every customer when the minimum is zero',
        input: [0, 'shop'],
        expected: {
          report: [
            ['Bo', 1, 900],
            ['Ana', 2, 750],
            ['Cy', 1, 750],
            ["O'Neil", 1, 750],
            ['Di', 0, 0],
          ],
          unchanged: true,
        },
      },
      {
        name: 'Minimum is inclusive and ties sort by name',
        input: [750, 'shop'],
        expected: {
          report: [
            ['Bo', 1, 900],
            ['Ana', 2, 750],
            ['Cy', 1, 750],
            ["O'Neil", 1, 750],
          ],
          unchanged: true,
        },
      },
      { name: 'Just above a tie', input: [751, 'shop'], expected: { report: [['Bo', 1, 900]], unchanged: true } },
      { name: 'Nobody reaches a high minimum', input: [901, 'shop'], expected: { report: [], unchanged: true } },
      {
        name: 'Cancelled-only and zero-cent customers',
        input: [0, 'quiet'],
        expected: {
          report: [
            ['Ana', 0, 0],
            ['Bo', 1, 0],
          ],
          unchanged: true,
        },
      },
      { name: 'A minimum of one leaves zero totals out', input: [1, 'quiet'], expected: { report: [], unchanged: true } },
      { name: 'No customers', input: [0, 'empty'], expected: { report: [], unchanged: true } },
    ],
  },
]
