import type { PlanFact, Rep, SqlTask } from './rep-types.ts'

// SQL track reps: the learner writes SQL text, and every check runs it against a fresh in-memory SQLite database.
// Expected rows are authored by hand; tests/fixtures/sql-solutions.mjs holds an independent reference query for each.

const books =
  'CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, year INTEGER, pages INTEGER NOT NULL);'
const bookSeeds: SqlTask['seeds'] = {
  shelf: {
    about: 'five books, two of them by Ursula K. Le Guin',
    sql: "INSERT INTO books VALUES (1,'Kindred','Octavia E. Butler',1979,264),(2,'The Left Hand of Darkness','Ursula K. Le Guin',1969,304),(3,'Beloved','Toni Morrison',1987,324),(4,'Piranesi','Susanna Clarke',2020,272),(5,'The Dispossessed','Ursula K. Le Guin',1974,387);",
  },
  copies: {
    about: 'two copies of Emma with the same title, author, and year, plus Persuasion',
    sql: "INSERT INTO books VALUES (1,'Emma','Jane Austen',1815,474),(2,'Persuasion','Jane Austen',1817,249),(3,'Emma','Jane Austen',1815,474);",
  },
  'unknown-year': {
    about: 'two books, one with an unknown (NULL) year',
    sql: "INSERT INTO books VALUES (1,'The Pillow Book','Sei Shonagon',NULL,400),(2,'Frankenstein','Mary Shelley',1818,280);",
  },
  single: { about: 'one book', sql: "INSERT INTO books VALUES (7,'Middlemarch','George Eliot',1871,880);" },
  empty: { about: 'no books', sql: '' },
}

const movies =
  'CREATE TABLE movies (id INTEGER PRIMARY KEY, title TEXT NOT NULL, genre TEXT NOT NULL, year INTEGER, minutes INTEGER NOT NULL);'
const customers = 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL);'
const tickets =
  "CREATE TABLE tickets (id INTEGER PRIMARY KEY, subject TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('open', 'pending', 'closed')), opened_at TEXT NOT NULL);"
const products =
  'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price_cents INTEGER NOT NULL, active INTEGER NOT NULL CHECK (active IN (0, 1)));'

const orderLines =
  'CREATE TABLE order_lines (id INTEGER PRIMARY KEY, product TEXT NOT NULL, quantity INTEGER NOT NULL, unit_cents INTEGER NOT NULL);'
const listings =
  'CREATE TABLE listings (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL, in_stock INTEGER NOT NULL CHECK (in_stock IN (0, 1)));'
const rooms = 'CREATE TABLE rooms (id INTEGER PRIMARY KEY, name TEXT NOT NULL, nightly_cents INTEGER NOT NULL, beds INTEGER NOT NULL);'
const parts = 'CREATE TABLE parts (id INTEGER PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL);'
const members = 'CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, status TEXT);'
const articles = 'CREATE TABLE articles (id INTEGER PRIMARY KEY, title TEXT NOT NULL, section TEXT NOT NULL, published_at TEXT);'

const shopOrders = 'CREATE TABLE shop_orders (id INTEGER PRIMARY KEY, customer TEXT NOT NULL, status TEXT);'
const reviews = 'CREATE TABLE reviews (id INTEGER PRIMARY KEY, product TEXT NOT NULL, stars INTEGER CHECK (stars BETWEEN 1 AND 5));'
const pageViews = 'CREATE TABLE page_views (id INTEGER PRIMARY KEY, page TEXT NOT NULL, visitor TEXT);'
const deliveries =
  "CREATE TABLE deliveries (id INTEGER PRIMARY KEY, day TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('delivered', 'late', 'cancelled')));"
const payments =
  'CREATE TABLE payments (id INTEGER PRIMARY KEY, account TEXT NOT NULL, amount_cents INTEGER NOT NULL, paid_on TEXT NOT NULL);'

const customerOrders =
  'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL);'
const teamTables =
  'CREATE TABLE teams (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE team_members (id INTEGER PRIMARY KEY, team_id INTEGER NOT NULL, name TEXT NOT NULL); CREATE TABLE expenses (id INTEGER PRIMARY KEY, team_id INTEGER NOT NULL, cents INTEGER NOT NULL);'
const productReturns =
  'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE product_returns (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, returned_on TEXT NOT NULL);'
const authorBooks =
  'CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE books (id INTEGER PRIMARY KEY, author_id INTEGER NOT NULL, title TEXT NOT NULL, year INTEGER);'

const invoices = 'CREATE TABLE invoices (id INTEGER PRIMARY KEY, client TEXT NOT NULL, cents INTEGER NOT NULL);'
const catalogItems =
  'CREATE TABLE catalog_items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL);'
const studentWork =
  'CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE submissions (id INTEGER PRIMARY KEY, student_id INTEGER, task TEXT NOT NULL);'
const roomBookings =
  'CREATE TABLE rooms (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE bookings (id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL);'
const salesLedger = 'CREATE TABLE sales (id INTEGER PRIMARY KEY, sold_on TEXT NOT NULL, cents INTEGER NOT NULL);'

// Schema reps start empty; these inserts set up members and clubs before the membership probes.
const membershipSetup = [
  "INSERT INTO members (id, email) VALUES (1, 'ana@example.com')",
  "INSERT INTO clubs (id, name) VALUES (1, 'Chess')",
  "INSERT INTO clubs (id, name) VALUES (2, 'Rowing')",
]
const membershipLabels = ['member Ana', 'the Chess club', 'the Rowing club']

const shopProducts =
  'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL, active INTEGER NOT NULL CHECK (active IN (0, 1)));'
const sessionTable =
  'CREATE TABLE sessions (id INTEGER PRIMARY KEY, user_name TEXT NOT NULL, expires_at TEXT NOT NULL, revoked INTEGER NOT NULL CHECK (revoked IN (0, 1)));'
const stockTables =
  'CREATE TABLE stock (sku TEXT PRIMARY KEY, units INTEGER NOT NULL CHECK (units >= 0)); CREATE TABLE incoming (id INTEGER PRIMARY KEY, sku TEXT NOT NULL, units INTEGER NOT NULL CHECK (units > 0));'
const archiveTables =
  'CREATE TABLE orders (id INTEGER PRIMARY KEY, placed_on TEXT NOT NULL, cents INTEGER NOT NULL); CREATE TABLE archived_orders (id INTEGER PRIMARY KEY, placed_on TEXT NOT NULL, cents INTEGER NOT NULL);'

const arcadeScores = 'CREATE TABLE scores (id INTEGER PRIMARY KEY, player TEXT NOT NULL, level INTEGER NOT NULL, points INTEGER NOT NULL);'
const raceResults = 'CREATE TABLE results (id INTEGER PRIMARY KEY, runner TEXT NOT NULL, seconds INTEGER NOT NULL);'
const dailyVisits = 'CREATE TABLE visits (day TEXT PRIMARY KEY, visitors INTEGER NOT NULL);'
const ledgerTable = 'CREATE TABLE ledger (id INTEGER PRIMARY KEY, account TEXT NOT NULL, posted_on TEXT NOT NULL, cents INTEGER NOT NULL);'
const regionReps =
  'CREATE TABLE sales_reps (id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL, revenue_cents INTEGER NOT NULL);'

const userAccounts = 'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL);'
const eventLog = 'CREATE TABLE events (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, happened_at TEXT NOT NULL);'
const teaProducts =
  'CREATE TABLE products (id INTEGER PRIMARY KEY, sku TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL);'
const datedOrders =
  'CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL, cents INTEGER NOT NULL);'
const joinTables =
  'CREATE TABLE customers (id INTEGER PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL);'

// Plan facts are patterns over SQLite 3.49's EXPLAIN QUERY PLAN text, each with the words feedback uses.
const scanOf = (name: string, label = name): PlanFact => ({ pattern: `SCAN ${name}\\b`, about: `reads every row of ${label}` })
const tempSort: PlanFact = { pattern: 'USE TEMP B-TREE FOR ORDER BY', about: 'sorts the rows in a temporary B-tree afterwards' }
const emailSearch: PlanFact[] = [
  { pattern: 'SEARCH users USING (COVERING )?INDEX \\S+ \\(email=\\?\\)', about: 'search users through an index on email' },
]
const kindSearch: PlanFact[] = [
  { pattern: 'SEARCH events USING (COVERING )?INDEX \\S+ \\(kind=\\?\\)', about: 'search events through an index on kind' },
]
const coveringCategory: PlanFact[] = [
  { pattern: 'SEARCH products USING COVERING INDEX \\S+ \\(category=\\?\\)', about: 'answer from a covering index searched by category' },
]
const customerDateSearch: PlanFact[] = [
  {
    pattern: 'SEARCH orders USING (COVERING )?INDEX \\S+ \\(customer_id=\\? AND placed_on>\\?\\)',
    about: 'search one index by customer_id and placed_on together',
  },
]
const joinSearches: PlanFact[] = [
  { pattern: 'SEARCH c USING (COVERING )?INDEX \\S+ \\(email=\\?\\)', about: 'search customers by email' },
  { pattern: 'SEARCH o USING (COVERING )?INDEX \\S+ \\(customer_id=\\?\\)', about: 'search orders by customer_id' },
]
const joinQuery = (email: string) =>
  `SELECT o.id, o.cents FROM customers AS c JOIN orders AS o ON o.customer_id = c.id WHERE c.email = '${email}' ORDER BY o.id`

const loyaltyCustomers = 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, lifetime_cents INTEGER NOT NULL);'
const tierColumns = [
  ['id', 'INTEGER', 0],
  ['name', 'TEXT', 1],
  ['lifetime_cents', 'INTEGER', 1],
  ['tier', 'TEXT', 1],
]
const stockCounts = 'CREATE TABLE stock (id INTEGER PRIMARY KEY, sku TEXT NOT NULL, qty INTEGER NOT NULL);'
const renamedColumns = [
  ['id', 'INTEGER', 0],
  ['sku', 'TEXT', 1],
  ['quantity', 'INTEGER', 1],
]
const peopleNames = 'CREATE TABLE people (id INTEGER PRIMARY KEY, full_name TEXT NOT NULL);'
const loosePrices = 'CREATE TABLE products (id INTEGER PRIMARY KEY, sku TEXT NOT NULL, price_cents INTEGER);'
const strictPriceColumns = [
  ['id', 'INTEGER', 0],
  ['sku', 'TEXT', 1],
  ['price_cents', 'INTEGER', 1],
]
const codedOrders = 'CREATE TABLE orders (id INTEGER PRIMARY KEY, status_code INTEGER NOT NULL, cents INTEGER NOT NULL);'
const statusColumns = [
  ['id', 'INTEGER', 0],
  ['cents', 'INTEGER', 1],
  ['status', 'TEXT', 1],
]

const reportTables =
  'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL); CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL, status TEXT NOT NULL); CREATE TABLE order_lines (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL, unit_cents INTEGER NOT NULL);'
const interviewTables =
  'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL, status TEXT NOT NULL);'

export const sqlReps: Rep[] = [
  {
    id: 'sql-select-columns',
    title: 'Choose columns with SELECT',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: { schema: books, seeds: bookSeeds, compare: 'unordered', columns: ['title', 'author', 'published'] },
    context:
      'A library catalog screen lists each book by title and author, with its year labelled "published". The screen needs only those three values from the books table.',
    prompt:
      'Write one SQL SELECT statement that returns three columns for every row of books, in this order: title, author, and the year column renamed to published. Return one result row per stored row, including duplicate rows; do not filter or remove rows. Any row order is accepted. books has id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, year INTEGER (NULL when the year is unknown), and pages INTEGER NOT NULL. An unknown year stays NULL in the result. Column names are compared without letter case. Submit a single statement that only reads data; the checks use SQLite.',
    brief: {
      summary: 'Write one SELECT that lists title, author, and published (the year column, renamed) for every book.',
      rules: [
        '`books(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, year INTEGER, pages INTEGER NOT NULL)`. year is NULL when it is unknown.',
        'Return exactly three columns, in this order: `title`, `author`, `published`. published holds the year value. Letter case in column names is ignored.',
        'Return one row per stored book, including duplicate rows. Do not filter or remove rows. Any row order is accepted.',
        'Submit a single statement that only reads data. The checks use SQLite.',
      ],
      edgeCases: ['An unknown year stays NULL.', 'An empty table returns no rows, still with the same three columns.'],
    },
    example: {
      input: "books holds (1, 'Kindred', 'Octavia E. Butler', 1979, 264)",
      output: "title: 'Kindred', author: 'Octavia E. Butler', published: 1979",
    },
    note: 'Run SELECT * FROM books first if you want to see every stored column: a failed check shows your rows beside the expected rows. Checks run your statement on a fresh in-memory SQLite database for each starting data set and compare column names and rows; they do not judge layout or style.',
    vocabulary: [
      { term: 'SELECT', meaning: 'the SQL statement that reads rows and chooses which columns the result has' },
      { term: 'Column alias', meaning: 'a new name for a result column, written with AS; the stored column keeps its name' },
      { term: 'NULL', meaning: "SQL's marker for a missing or unknown value" },
      { term: 'Result set', meaning: 'the rows and columns a query returns' },
    ],
    planPrompt: 'Name the three result columns in order and the table they come from. Which one needs a new name in the result?',
    starter: 'SELECT *\nFROM books;\n',
    hints: [
      'SELECT * returns every stored column. Replace the star with a list of only the columns the screen needs, separated by commas, in the order it needs them.',
      'A result column can take a different name than the stored column. The stored year column does not change; only the heading of the result does.',
      'Write title, then author, then year followed by AS and the new heading. Leave out WHERE and DISTINCT, because every stored row belongs in the result.',
    ],
    checks: [
      {
        name: 'Every book, with three named columns',
        input: [],
        sql: { seed: 'shelf' },
        expected: {
          rows: [
            ['Kindred', 'Octavia E. Butler', 1979],
            ['The Left Hand of Darkness', 'Ursula K. Le Guin', 1969],
            ['Beloved', 'Toni Morrison', 1987],
            ['Piranesi', 'Susanna Clarke', 2020],
            ['The Dispossessed', 'Ursula K. Le Guin', 1974],
          ],
        },
      },
      {
        name: 'Both copies of a duplicated book stay',
        input: [],
        sql: { seed: 'copies' },
        expected: {
          rows: [
            ['Emma', 'Jane Austen', 1815],
            ['Persuasion', 'Jane Austen', 1817],
            ['Emma', 'Jane Austen', 1815],
          ],
        },
      },
      {
        name: 'An unknown year stays NULL',
        input: [],
        sql: { seed: 'unknown-year' },
        expected: {
          rows: [
            ['The Pillow Book', 'Sei Shonagon', null],
            ['Frankenstein', 'Mary Shelley', 1818],
          ],
        },
      },
      { name: 'A single book', input: [], sql: { seed: 'single' }, expected: { rows: [['Middlemarch', 'George Eliot', 1871]] } },
      { name: 'No books gives no rows', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-filter-sort',
    title: 'Filter and sort rows',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: movies,
      seeds: {
        archive: {
          about: 'eight films, four of them dramas from before 2000',
          sql: "INSERT INTO movies VALUES (1,'Rashomon','Drama',1950,88),(2,'Amélie','Comedy',2001,122),(3,'Ikiru','Drama',1952,143),(4,'Tokyo Story','Drama',1953,136),(5,'Paris, Texas','Drama',1984,147),(6,'Spirited Away','Animation',2001,125),(7,'Yi Yi','Drama',2000,173),(8,'Seven Samurai','Action',1954,207);",
        },
        'same-year': {
          about: 'four dramas from 1957, inserted out of title order',
          sql: "INSERT INTO movies VALUES (1,'Wild Strawberries','Drama',1957,91),(2,'The Seventh Seal','Drama',1957,96),(3,'12 Angry Men','Drama',1957,96),(4,'Nights of Cabiria','Drama',1957,110),(5,'Rashomon','Drama',1950,88);",
        },
        'case-and-null': {
          about: "a genre stored as lowercase 'drama', a drama with an unknown (NULL) year, and one ordinary drama",
          sql: "INSERT INTO movies VALUES (1,'Late Spring','drama',1949,108),(2,'Bicycle Thieves','Drama',NULL,89),(3,'Umberto D.','Drama',1952,89);",
        },
        boundary: {
          about: 'dramas from 1999 and 2000',
          sql: "INSERT INTO movies VALUES (1,'Yi Yi','Drama',2000,173),(2,'Magnolia','Drama',1999,188);",
        },
        'no-dramas': {
          about: 'only comedies and documentaries',
          sql: "INSERT INTO movies VALUES (1,'Playtime','Comedy',1967,124),(2,'Shoah','Documentary',1985,566);",
        },
      },
      compare: 'ordered',
      columns: ['title', 'year'],
    },
    context:
      'A film club plans a season of older dramas. The programme lists each film with its year, oldest first, and films from the same year in title order.',
    prompt:
      "Write one SELECT statement on movies that returns title and year, in that column order, for every movie whose genre is exactly 'Drama' and whose year is before 2000. Sort by year from oldest to newest, then by title in ascending order using SQLite's default text ordering. movies has id INTEGER PRIMARY KEY, title TEXT NOT NULL, genre TEXT NOT NULL, year INTEGER (NULL when unknown), and minutes INTEGER NOT NULL. Genre comparison is exact, so a genre stored as 'drama' does not match. A movie with an unknown year is not before 2000 and is left out. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the title and year of every drama from before 2000, oldest first, with same-year films in title order.',
      rules: [
        '`movies(id INTEGER PRIMARY KEY, title TEXT NOT NULL, genre TEXT NOT NULL, year INTEGER, minutes INTEGER NOT NULL)`. year is NULL when it is unknown.',
        "Keep a movie only when its genre is exactly `'Drama'` and its year is before 2000.",
        "Return the columns `title`, `year`. Sort by year ascending, then by title ascending in SQLite's default text order.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: [
        "A genre stored as `'drama'` does not match `'Drama'`.",
        'A movie from 2000 is not before 2000.',
        'A movie with an unknown (NULL) year is left out.',
        'No matching movies gives no rows.',
      ],
    },
    example: {
      input: 'movies holds Rashomon (Drama, 1950), Yi Yi (Drama, 2000), and Amélie (Comedy, 2001)',
      output: "one row: title 'Rashomon', year 1950",
    },
    note: 'Checks run your statement on a fresh SQLite database for each data set and compare columns, rows, and their order. They do not judge layout or whether you wrote AND or used another equivalent form.',
    vocabulary: [
      { term: 'WHERE', meaning: 'the clause that keeps only the rows for which its condition is true' },
      { term: 'ORDER BY', meaning: 'the clause that sorts result rows by one or more keys' },
      { term: 'Tie-breaker', meaning: 'a second sort key that orders rows whose first key is equal' },
      { term: 'String literal', meaning: "a text value written in single quotes, such as 'Drama'" },
    ],
    planPrompt:
      'Write the two conditions a row must meet, then the two sort keys in order. Which data set shows whether your tie-breaker works?',
    starter: 'SELECT title, year\nFROM movies;\n',
    hints: [
      'Filtering comes before sorting: first decide which rows qualify, then how they are ordered. Here a row qualifies only when two conditions are both true.',
      'Text values go in single quotes, and = compares text exactly, letter case included. Before 2000 means strictly less than 2000.',
      'Join the two conditions so both must hold. Sort by the year first and the title second; ascending is the default direction, so neither key needs a keyword.',
    ],
    checks: [
      {
        name: 'Dramas before 2000, oldest first',
        input: [],
        sql: { seed: 'archive' },
        expected: {
          rows: [
            ['Rashomon', 1950],
            ['Ikiru', 1952],
            ['Tokyo Story', 1953],
            ['Paris, Texas', 1984],
          ],
        },
      },
      {
        name: 'Films from the same year are in title order',
        input: [],
        sql: { seed: 'same-year' },
        expected: {
          rows: [
            ['Rashomon', 1950],
            ['12 Angry Men', 1957],
            ['Nights of Cabiria', 1957],
            ['The Seventh Seal', 1957],
            ['Wild Strawberries', 1957],
          ],
        },
      },
      {
        name: 'Exact genre, and an unknown year is left out',
        input: [],
        sql: { seed: 'case-and-null' },
        expected: { rows: [['Umberto D.', 1952]] },
      },
      { name: '1999 counts, 2000 does not', input: [], sql: { seed: 'boundary' }, expected: { rows: [['Magnolia', 1999]] } },
      { name: 'No dramas gives no rows', input: [], sql: { seed: 'no-dramas' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-distinct-cities',
    title: 'List each city once',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: customers,
      seeds: {
        mixed: {
          about: 'eight customers in three countries, three of them in Oslo',
          sql: "INSERT INTO customers VALUES (1,'Ingrid','Oslo','NO'),(2,'Lars','Bergen','NO'),(3,'Ana','Lisbon','PT'),(4,'Kari','Oslo','NO'),(5,'Mats','Tromsø','NO'),(6,'Siri','Oslo','NO'),(7,'Emil','Stockholm','SE'),(8,'Åse','Ålesund','NO');",
        },
        'one-city': {
          about: 'three Norwegian customers, all in Bergen',
          sql: "INSERT INTO customers VALUES (1,'Lars','Bergen','NO'),(2,'Eva','Bergen','NO'),(3,'Ola','Bergen','NO');",
        },
        'other-countries': {
          about: 'customers only outside Norway, including one in a city also called Bergen',
          sql: "INSERT INTO customers VALUES (1,'Joost','Bergen','NL'),(2,'Ana','Lisbon','PT');",
        },
        'lowercase-code': {
          about: "a customer whose country is stored as lowercase 'no', and one stored as 'NO'",
          sql: "INSERT INTO customers VALUES (1,'Per','Ålesund','no'),(2,'Tone','Drammen','NO');",
        },
      },
      compare: 'ordered',
      columns: ['city'],
    },
    context: 'A delivery planner wants the list of Norwegian cities that have at least one customer, each city once, to plan routes.',
    prompt:
      "Write one SELECT statement on customers that returns one column, city, listing each distinct city of customers whose country is exactly 'NO', once, sorted in ascending order using SQLite's default text ordering. customers has id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, and country TEXT NOT NULL (a two-letter code). Country comparison is exact, so 'no' in lowercase does not match. City names are compared exactly as stored. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: "List each city with at least one customer in Norway ('NO'), once, in ascending order.",
      rules: [
        '`customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL)`; country is a two-letter code.',
        "Keep customers whose country is exactly `'NO'`. Return one column, `city`, with each city once.",
        "Sort cities ascending in SQLite's default text order. City names are compared exactly as stored.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: [
        "A country stored as `'no'` does not match.",
        'A city with many customers appears once.',
        'No Norwegian customers gives no rows.',
      ],
    },
    example: {
      input: 'customers in Oslo (NO), Oslo (NO), and Lisbon (PT)',
      output: "one row: city 'Oslo'",
    },
    note: "SQLite's default text order compares character codes, so a name starting with Å sorts after Z. Checks compare your rows and their order on fresh databases; they do not establish which keyword you used to remove repeats.",
    vocabulary: [
      { term: 'DISTINCT', meaning: 'a SELECT keyword that removes repeated result rows' },
      { term: 'Duplicate row', meaning: 'a result row whose values all equal another row' },
    ],
    planPrompt: 'Which rows qualify, which column do you keep, and at what point do repeated cities become one?',
    starter: 'SELECT city\nFROM customers;\n',
    hints: [
      'Three customers in Oslo would give Oslo three times. Decide where the repeats disappear: after choosing the column, not before.',
      'One keyword after SELECT keeps only distinct result rows. It compares the selected columns, here just the city.',
      "Filter to the exact code 'NO', keep each city once, and sort the single column ascending.",
    ],
    checks: [
      {
        name: 'Each Norwegian city once, in text order',
        input: [],
        sql: { seed: 'mixed' },
        expected: { rows: [['Bergen'], ['Oslo'], ['Tromsø'], ['Ålesund']] },
      },
      { name: 'Many customers in one city', input: [], sql: { seed: 'one-city' }, expected: { rows: [['Bergen']] } },
      { name: 'A same-named city in another country does not count', input: [], sql: { seed: 'other-countries' }, expected: { rows: [] } },
      { name: 'The country code is compared exactly', input: [], sql: { seed: 'lowercase-code' }, expected: { rows: [['Drammen']] } },
    ],
  },
  {
    id: 'sql-recent-open-tickets',
    title: 'Find the newest open tickets',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: tickets,
      seeds: {
        queue: {
          about: 'seven tickets: five open, one pending, one closed',
          sql: "INSERT INTO tickets VALUES (1,'Cannot log in','open','2026-03-02 09:15'),(2,'Invoice total wrong','closed','2026-03-05 11:00'),(3,'Export times out','open','2026-03-04 16:40'),(4,'Reset email missing','pending','2026-03-06 08:05'),(5,'Dark mode contrast','open','2026-03-06 08:05'),(6,'Typo on pricing page','open','2026-02-27 13:30'),(7,'Search ignores accents','open','2026-03-05 17:20');",
        },
        'same-minute': {
          about: 'three open tickets opened in the same minute and one opened a minute earlier',
          sql: "INSERT INTO tickets VALUES (1,'Sync stalls','open','2026-04-01 10:00'),(2,'Badge misaligned','open','2026-04-01 10:00'),(3,'Slow search','open','2026-04-01 09:59'),(4,'Logo blurry','open','2026-04-01 10:00');",
        },
        'two-open': {
          about: 'two open tickets and a newer closed one',
          sql: "INSERT INTO tickets VALUES (1,'Old bug','open','2026-01-05 12:00'),(2,'Fixed bug','closed','2026-06-01 08:00'),(3,'New bug','open','2026-02-11 07:45');",
        },
        'none-open': {
          about: 'only pending and closed tickets',
          sql: "INSERT INTO tickets VALUES (1,'Waiting on customer','pending','2026-05-01 10:00'),(2,'Done','closed','2026-05-02 10:00');",
        },
        'year-end': {
          about: 'open tickets on both sides of a new year, plus a newer pending one',
          sql: "INSERT INTO tickets VALUES (1,'Year-end report','open','2025-12-31 23:59'),(2,'New year banner','open','2026-01-01 00:00'),(3,'January sale','open','2026-01-10 09:00'),(4,'Old January bug','open','2026-01-09 21:00'),(5,'Pending review','pending','2026-02-01 08:00');",
        },
      },
      compare: 'ordered',
      columns: ['id', 'subject'],
    },
    context: "A support lead's dashboard shows the three tickets that most recently became open work, so nothing new waits unnoticed.",
    prompt:
      "Write one SELECT statement on tickets that returns id and subject, in that column order, for the three most recently opened tickets whose status is 'open', newest first. When tickets were opened in the same minute, the higher id comes first. If fewer than three tickets are open, return all of them. tickets has id INTEGER PRIMARY KEY, subject TEXT NOT NULL, status TEXT NOT NULL (one of 'open', 'pending', 'closed'), and opened_at TEXT NOT NULL written as 'YYYY-MM-DD HH:MM' in one time zone. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: "Return the id and subject of the three most recently opened tickets whose status is 'open', newest first.",
      rules: [
        "`tickets(id INTEGER PRIMARY KEY, subject TEXT NOT NULL, status TEXT NOT NULL, opened_at TEXT NOT NULL)`. status is 'open', 'pending', or 'closed'; opened_at is 'YYYY-MM-DD HH:MM' in one time zone.",
        "Only tickets whose status is `'open'` count. Return the columns `id`, `subject`.",
        'Newest first. Tickets opened in the same minute: the higher id first. At most three rows.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['Fewer than three open tickets: return them all.', 'No open tickets gives no rows.'],
    },
    example: {
      input: "open tickets opened at '2026-03-06 08:05' (id 5), '2026-03-05 17:20' (id 7), '2026-03-04 16:40' (id 3), and two older",
      output: 'rows (5, …), (7, …), (3, …)',
    },
    note: 'This is an independent rep: plan before you look at the hints. Checks run your statement on fresh databases and compare rows and their order; they do not establish that the times are real dates.',
    vocabulary: [
      { term: 'LIMIT', meaning: 'the clause that keeps at most a given number of rows from the sorted result' },
      { term: 'DESC', meaning: 'a sort direction meaning descending: largest or latest first' },
    ],
    planPrompt:
      'Name the filter, both sort keys with their directions, and the row count. Which data set would break a plan that forgot the second key?',
    starter: 'SELECT id, subject\nFROM tickets;\n',
    hints: [
      'Separate the three decisions: which tickets qualify, how they are ordered, and how many are kept.',
      'opened_at is text written year first, so sorting the text sorts the times. Same-minute tickets need a second key with its own direction.',
      'Sort both keys descending, then keep only the first three rows of the sorted result.',
    ],
    checks: [
      {
        name: 'Three newest open tickets',
        input: [],
        sql: { seed: 'queue' },
        expected: {
          rows: [
            [5, 'Dark mode contrast'],
            [7, 'Search ignores accents'],
            [3, 'Export times out'],
          ],
        },
      },
      {
        name: 'Same minute: higher id first',
        input: [],
        sql: { seed: 'same-minute' },
        expected: {
          rows: [
            [4, 'Logo blurry'],
            [2, 'Badge misaligned'],
            [1, 'Sync stalls'],
          ],
        },
      },
      {
        name: 'Fewer than three open tickets',
        input: [],
        sql: { seed: 'two-open' },
        expected: {
          rows: [
            [3, 'New bug'],
            [1, 'Old bug'],
          ],
        },
      },
      { name: 'No open tickets', input: [], sql: { seed: 'none-open' }, expected: { rows: [] } },
      {
        name: 'Times across a new year',
        input: [],
        sql: { seed: 'year-end' },
        expected: {
          rows: [
            [3, 'January sale'],
            [4, 'Old January bug'],
            [2, 'New year banner'],
          ],
        },
      },
    ],
  },
  {
    id: 'sql-catalog-page',
    title: 'Show the second page of a catalog',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: products,
      seeds: {
        shelf: {
          about: 'eleven products, nine of them active',
          sql: "INSERT INTO products VALUES (1,'Notebook',450,1),(2,'Fountain pen',2400,1),(3,'Eraser',120,1),(4,'Stapler',250,0),(5,'Ruler',300,1),(6,'Pencil case',650,1),(7,'Ink bottle',700,1),(8,'Sticky notes',300,1),(9,'Desk lamp',3200,0),(10,'Paper clips',150,1),(11,'Highlighter',220,1);",
        },
        'price-ties': {
          about: 'nine active products with repeated prices and two products both named Pencil',
          sql: "INSERT INTO products VALUES (1,'Pencil',100,1),(2,'Clip',100,1),(3,'Tape',200,1),(4,'Pencil',100,1),(5,'Glue',200,1),(6,'Card',200,1),(7,'Pin',100,1),(8,'Wax',300,1),(9,'Band',100,1);",
        },
        'six-active': {
          about: 'six active products and one inactive',
          sql: "INSERT INTO products VALUES (1,'A4 paper',500,1),(2,'Binder',800,1),(3,'Folder',200,1),(4,'Archive box',1500,0),(5,'Labels',300,1),(6,'Scissors',900,1),(7,'Tape',250,1);",
        },
        'one-page': {
          about: 'four active products, which fill only the first page',
          sql: "INSERT INTO products VALUES (1,'Mug',900,1),(2,'Coaster',200,1),(3,'Tray',1200,1),(4,'Spoon',150,1),(5,'Kettle',4000,0);",
        },
        'exact-eight': {
          about: 'exactly eight active products',
          sql: "INSERT INTO products VALUES (1,'H',800,1),(2,'G',700,1),(3,'F',600,1),(4,'E',500,1),(5,'D',400,1),(6,'C',300,1),(7,'B',200,1),(8,'A',100,1);",
        },
      },
      compare: 'ordered',
      columns: ['name', 'price_cents'],
    },
    context: 'An online stationery shop lists its active products cheapest first, four to a page. A customer has pressed Next once.',
    prompt:
      "Write one SELECT statement on products that returns name and price_cents, in that column order, for page 2 of the catalog: the fifth to eighth active products when active products are sorted by price_cents from lowest to highest, then by name in ascending order using SQLite's default text ordering, then by id ascending. Pages hold four products. If page 2 is only partly filled, return what it holds; if it is empty, return no rows. products has id INTEGER PRIMARY KEY, name TEXT NOT NULL (names can repeat), price_cents INTEGER NOT NULL, and active INTEGER NOT NULL (1 for active, 0 for hidden). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'Return the name and price of the products on page 2 of the catalog: active products, cheapest first, four per page.',
      rules: [
        '`products(id INTEGER PRIMARY KEY, name TEXT NOT NULL, price_cents INTEGER NOT NULL, active INTEGER NOT NULL)`. active is 1 for listed products and 0 for hidden ones. Names can repeat.',
        "Only active products are listed. Order them by price_cents ascending, then name ascending in SQLite's default text order, then id ascending.",
        'Pages hold four products. Return the columns `name`, `price_cents` for page 2: the fifth to eighth products in that order.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A partly filled page 2 returns what it holds.', 'Four or fewer active products leave page 2 empty: no rows.'],
    },
    example: {
      input: 'nine active products',
      output: 'the fifth, sixth, seventh, and eighth cheapest active products',
    },
    note: 'This is a delayed recall rep: come back to it after a break and solve it without hints. Checks compare rows and their order on fresh databases; they do not establish how a real shop would page through changing data.',
    vocabulary: [
      { term: 'OFFSET', meaning: 'the clause that skips a number of rows of the sorted result before LIMIT keeps some' },
      { term: 'Page', meaning: 'one fixed-size slice of a sorted list' },
    ],
    planPrompt: 'Write the full sort order, then how many rows page 2 skips and how many it keeps.',
    starter: 'SELECT name, price_cents\nFROM products;\n',
    hints: [
      'A page is a slice of one fixed order. Settle the order completely before taking the slice, or two equal prices could swap pages between requests.',
      'Page 2 skips the rows of page 1 and keeps the next page-sized run.',
      'Sort by price, then name, then id, all ascending; skip four rows and keep four.',
    ],
    checks: [
      {
        name: 'Page 2 of the shelf',
        input: [],
        sql: { seed: 'shelf' },
        expected: {
          rows: [
            ['Sticky notes', 300],
            ['Notebook', 450],
            ['Pencil case', 650],
            ['Ink bottle', 700],
          ],
        },
      },
      {
        name: 'Equal prices order by name across the page break',
        input: [],
        sql: { seed: 'price-ties' },
        expected: {
          rows: [
            ['Pin', 100],
            ['Card', 200],
            ['Glue', 200],
            ['Tape', 200],
          ],
        },
      },
      {
        name: 'A partly filled page',
        input: [],
        sql: { seed: 'six-active' },
        expected: {
          rows: [
            ['Binder', 800],
            ['Scissors', 900],
          ],
        },
      },
      { name: 'Only one page of products', input: [], sql: { seed: 'one-page' }, expected: { rows: [] } },
      {
        name: 'Exactly two full pages',
        input: [],
        sql: { seed: 'exact-eight' },
        expected: {
          rows: [
            ['E', 500],
            ['F', 600],
            ['G', 700],
            ['H', 800],
          ],
        },
      },
    ],
  },
  {
    id: 'sql-line-totals',
    title: 'Sort by a calculated column',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: orderLines,
      seeds: {
        basket: {
          about: 'five order lines with different totals',
          sql: "INSERT INTO order_lines VALUES (1,'Tea',3,450),(2,'Kettle',1,3900),(3,'Mug',4,800),(4,'Spoon',12,90),(5,'Tray',2,1250);",
        },
        'equal-totals': {
          about: 'three lines that all total 1200 cents, and one larger line',
          sql: "INSERT INTO order_lines VALUES (7,'Napkins',6,200),(3,'Candles',4,300),(5,'Plates',2,600),(9,'Bowl',1,1500);",
        },
        'zero-quantity': {
          about: 'a line with quantity 0 and a line with a price of 0',
          sql: "INSERT INTO order_lines VALUES (1,'Sample',0,500),(2,'Gift card',1,2000),(3,'Free bag',3,0);",
        },
        empty: { about: 'no order lines', sql: '' },
      },
      compare: 'ordered',
      columns: ['id', 'total_cents'],
    },
    context: 'A packing screen lists the lines of the day’s orders by value, so the most valuable lines are checked first.',
    prompt:
      "Write one SELECT statement on order_lines that returns two columns, id and total_cents, where total_cents is quantity multiplied by unit_cents, for every line. Sort by total_cents from largest to smallest; lines with equal totals by product in ascending order using SQLite's default text ordering, then by id ascending. order_lines has id INTEGER PRIMARY KEY, product TEXT NOT NULL, quantity INTEGER NOT NULL (0 or more), and unit_cents INTEGER NOT NULL (0 or more). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List every order line with its total in cents, most valuable first.',
      rules: [
        '`order_lines(id INTEGER PRIMARY KEY, product TEXT NOT NULL, quantity INTEGER NOT NULL, unit_cents INTEGER NOT NULL)`; quantity and unit_cents are 0 or more.',
        'Return the columns `id`, `total_cents`. total_cents is quantity multiplied by unit_cents.',
        "Sort by total_cents descending; equal totals by product ascending in SQLite's default text order, then by id.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A line with quantity 0 or price 0 totals 0 and still appears.', 'No lines gives no rows.'],
    },
    example: { input: "order_lines holds (2, 'Kettle', 1, 3900) and (1, 'Tea', 3, 450)", output: 'rows (2, 3900), (1, 1350)' },
    note: 'Checks compare columns, rows, and their order on fresh databases. They do not establish whether you sorted by the column name or repeated the calculation.',
    vocabulary: [
      { term: 'Calculated column', meaning: 'a result column computed from other columns in the same row' },
      { term: 'Sort direction', meaning: 'whether a sort key orders from smallest to largest or the reverse' },
    ],
    planPrompt: 'Write the calculation and its column name, then every sort key with its direction.',
    starter: 'SELECT id\nFROM order_lines;\n',
    hints: [
      'A SELECT list can hold an expression, not just a column name. The result needs a name for it.',
      'ORDER BY can use a result column’s name. Each sort key has its own direction.',
      'Multiply the two columns and name the result total_cents; sort by it descending, then by product and id ascending.',
    ],
    checks: [
      {
        name: 'Most valuable line first',
        input: [],
        sql: { seed: 'basket' },
        expected: {
          rows: [
            [2, 3900],
            [3, 3200],
            [5, 2500],
            [1, 1350],
            [4, 1080],
          ],
        },
      },
      {
        name: 'Equal totals by product name',
        input: [],
        sql: { seed: 'equal-totals' },
        expected: {
          rows: [
            [9, 1500],
            [3, 1200],
            [7, 1200],
            [5, 1200],
          ],
        },
      },
      {
        name: 'Zero totals still appear',
        input: [],
        sql: { seed: 'zero-quantity' },
        expected: {
          rows: [
            [2, 2000],
            [3, 0],
            [1, 0],
          ],
        },
      },
      { name: 'No lines', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-filter-groups',
    title: 'Group conditions with parentheses',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: listings,
      seeds: {
        shop: {
          about: 'seven listings across poetry, drama, and fiction, priced around 1500 cents',
          sql: "INSERT INTO listings VALUES (1,'Ariel','Poetry',1200,1),(2,'Hamlet','Drama',1800,1),(3,'Dune','Fiction',900,1),(4,'Antigone','Drama',1100,1),(5,'Leaves of Grass','Poetry',1400,0),(6,'Odes','Poetry',1499,1),(7,'Medea','Drama',1500,1);",
        },
        'expensive-poetry': {
          about: 'an expensive poetry book in stock, a cheap one out of stock, and two dramas',
          sql: "INSERT INTO listings VALUES (1,'Collected Poems','Poetry',4200,1),(2,'Sonnets','Poetry',800,0),(3,'Oedipus','Drama',1000,1),(4,'Faust','Drama',2000,0);",
        },
        'exact-category': {
          about: "a category stored as lowercase 'poetry' and one stored as 'Poetry'",
          sql: "INSERT INTO listings VALUES (1,'Howl','poetry',700,1),(2,'Ode to Joy','Poetry',700,1);",
        },
        'no-match': {
          about: 'listings that each miss one condition',
          sql: "INSERT INTO listings VALUES (1,'Atlas','Maps',500,1),(2,'Tartuffe','Drama',1600,1),(3,'Spring','Poetry',900,0);",
        },
      },
      compare: 'ordered',
      columns: ['id', 'title'],
    },
    context:
      'A bookshop runs a sale on poetry and drama. The sale page shows books from those two categories that cost under 15.00 and are in stock.',
    prompt:
      "Write one SELECT statement on listings that returns id and title, in that column order, for every listing whose category is exactly 'Poetry' or exactly 'Drama', whose price_cents is less than 1500, and which is in stock (in_stock is 1). Order by id ascending. listings has id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL, and in_stock INTEGER NOT NULL (1 in stock, 0 sold out). The price and stock conditions apply to both categories. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the poetry and drama books under 1500 cents that are in stock.',
      rules: [
        '`listings(id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL, in_stock INTEGER NOT NULL)`; in_stock is 1 or 0.',
        "Keep a listing when its category is exactly `'Poetry'` or exactly `'Drama'`, its price_cents is less than 1500, and in_stock is 1. The price and stock rules apply to both categories.",
        'Return the columns `id`, `title`, ordered by id ascending.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['1499 cents qualifies; 1500 does not.', "A category stored as `'poetry'` does not match."],
    },
    example: {
      input: "listings (1, 'Ariel', 'Poetry', 1200, 1) and (2, 'Hamlet', 'Drama', 1800, 1)",
      output: "one row: (1, 'Ariel')",
    },
    note: 'Checks compare rows and their order on fresh databases. They do not establish whether you used IN, OR with parentheses, or another equivalent form.',
    vocabulary: [
      { term: 'Operator precedence', meaning: 'the rule for which operator applies first when no parentheses say otherwise' },
      { term: 'IN list', meaning: 'a condition that is true when a value equals any value in a list, such as IN (1, 2)' },
      { term: 'OR', meaning: 'a condition that is true when at least one side is true' },
    ],
    planPrompt:
      'Write the condition in words with brackets around the part that belongs together. Which data set would show the brackets missing?',
    starter: "SELECT id, title\nFROM listings\nWHERE category = 'Poetry' OR category = 'Drama';\n",
    hints: [
      'Run the starter on the expensive-poetry data and look at which rows it keeps: the category test alone lets every poem through.',
      'AND is applied before OR. Without brackets, a condition written as A OR B AND C means A OR (B AND C).',
      'Put the two category tests together in brackets, or replace them with one IN list, then join the price and stock conditions with AND.',
    ],
    checks: [
      {
        name: 'Cheap poetry and drama in stock',
        input: [],
        sql: { seed: 'shop' },
        expected: {
          rows: [
            [1, 'Ariel'],
            [4, 'Antigone'],
            [6, 'Odes'],
          ],
        },
      },
      {
        name: 'Price and stock rules apply to poetry too',
        input: [],
        sql: { seed: 'expensive-poetry' },
        expected: { rows: [[3, 'Oedipus']] },
      },
      { name: 'Category is compared exactly', input: [], sql: { seed: 'exact-category' }, expected: { rows: [[2, 'Ode to Joy']] } },
      { name: 'Each listing misses one condition', input: [], sql: { seed: 'no-match' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-price-band',
    title: 'Keep values inside a range',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: rooms,
      seeds: {
        hotel: {
          about: 'seven rooms priced from 6500 to 15000 cents a night, with one to four beds',
          sql: "INSERT INTO rooms VALUES (1,'Garden',8000,2),(2,'Attic',7999,2),(3,'Harbour',12000,3),(4,'Tower',12001,2),(5,'Studio',9500,1),(6,'Loft',10500,2),(7,'Suite',15000,4);",
        },
        'same-price': {
          about: 'three two-bed rooms at the same price',
          sql: "INSERT INTO rooms VALUES (1,'Willow',9000,2),(2,'Birch',9000,2),(3,'Aspen',9000,2);",
        },
        'outside-band': {
          about: 'rooms just outside the price range, and one inside it with a single bed',
          sql: "INSERT INTO rooms VALUES (1,'Cabin',7000,2),(2,'Penthouse',20000,4),(3,'Nook',9000,1);",
        },
      },
      compare: 'ordered',
      columns: ['name', 'nightly_cents'],
    },
    context: 'A family searches for a room for two or more people, from 80.00 to 120.00 a night, both prices included.',
    prompt:
      "Write one SELECT statement on rooms that returns name and nightly_cents, in that column order, for every room whose nightly_cents is from 8000 to 12000 inclusive and which has at least 2 beds. Order by nightly_cents ascending, then name ascending in SQLite's default text order. rooms has id INTEGER PRIMARY KEY, name TEXT NOT NULL, nightly_cents INTEGER NOT NULL, and beds INTEGER NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List rooms from 8000 to 12000 cents a night, both included, that have at least two beds, cheapest first.',
      rules: [
        '`rooms(id INTEGER PRIMARY KEY, name TEXT NOT NULL, nightly_cents INTEGER NOT NULL, beds INTEGER NOT NULL)`.',
        'Keep rooms whose nightly_cents is from 8000 to 12000, both ends included, and whose beds is at least 2.',
        "Return the columns `name`, `nightly_cents`, ordered by nightly_cents ascending, then name ascending in SQLite's default text order.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['8000 and 12000 qualify; 7999 and 12001 do not.', 'Exactly 2 beds qualifies.'],
    },
    example: { input: "rooms 'Garden' 8000 with 2 beds and 'Attic' 7999 with 2 beds", output: "one row: ('Garden', 8000)" },
    note: 'Checks compare rows and their order on fresh databases; they do not establish whether you wrote BETWEEN or two comparisons.',
    vocabulary: [
      { term: 'BETWEEN', meaning: 'a range test that includes both of its ends, as in x BETWEEN 1 AND 5' },
      { term: 'Inclusive range', meaning: 'a range that contains its first and last values' },
    ],
    planPrompt: 'Write the price range with its two ends and say whether each is included. Then the beds rule and both sort keys.',
    starter: 'SELECT name, nightly_cents\nFROM rooms;\n',
    hints: [
      'Both ends of the price range belong to it. Check your comparison with the 8000 and 12000 rooms in mind.',
      'One keyword tests an inclusive range in a single condition; two comparisons with >= and <= say the same thing.',
      'Join the range and the beds condition with AND, and sort by price, then name.',
    ],
    checks: [
      {
        name: 'Both ends of the range count',
        input: [],
        sql: { seed: 'hotel' },
        expected: {
          rows: [
            ['Garden', 8000],
            ['Loft', 10500],
            ['Harbour', 12000],
          ],
        },
      },
      {
        name: 'Equal prices in name order',
        input: [],
        sql: { seed: 'same-price' },
        expected: {
          rows: [
            ['Aspen', 9000],
            ['Birch', 9000],
            ['Willow', 9000],
          ],
        },
      },
      { name: 'Just outside the range, or too few beds', input: [], sql: { seed: 'outside-band' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-code-pattern',
    title: 'Match codes with LIKE',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: parts,
      seeds: {
        bins: {
          about: 'seven part codes, some starting with BR- and of different lengths',
          sql: "INSERT INTO parts VALUES (1,'BR-104','Brake pad'),(2,'BR-12','Bracket'),(3,'BR-1050','Brake disc'),(4,'XBR-110','Cross brace'),(5,'BR-A7Z','Brush'),(6,'CL-200','Clamp'),(7,'BR-009','Bolt');",
        },
        'letter-case': {
          about: 'codes written as br- in lowercase and as BR- in capitals',
          sql: "INSERT INTO parts VALUES (1,'br-300','Bearing'),(2,'BR-301','Bushing');",
        },
        'no-codes': {
          about: 'only codes that do not start with BR-',
          sql: "INSERT INTO parts VALUES (1,'CL-200','Clamp'),(2,'B-R100','Rivet');",
        },
      },
      compare: 'ordered',
      columns: ['code', 'name'],
    },
    context:
      'A warehouse labels brake parts BR- followed by exactly three characters. Older labels used other lengths and need a separate clean-up.',
    prompt:
      "Write one SELECT statement on parts that returns code and name, in that column order, for every part whose code is BR- followed by exactly three more characters of any kind. Letter case does not matter, so br-300 qualifies too. Order by code ascending in SQLite's default text order. parts has id INTEGER PRIMARY KEY, code TEXT NOT NULL, and name TEXT NOT NULL. Submit a single statement that only reads data; the checks use SQLite, whose LIKE ignores letter case for ASCII letters, and compare row order.",
    brief: {
      summary: 'List parts whose code is BR- followed by exactly three characters, in any letter case.',
      rules: [
        '`parts(id INTEGER PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL)`.',
        'Keep a part when its code is BR- followed by exactly three more characters of any kind. Letter case does not matter.',
        "Return the columns `code`, `name`, ordered by code ascending in SQLite's default text order.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['BR-12 is too short and BR-1050 too long.', 'XBR-110 does not start with BR-.', 'br-300 qualifies.'],
    },
    example: { input: "codes 'BR-104', 'BR-12', and 'XBR-110'", output: "one row: ('BR-104', 'Brake pad')" },
    note: "SQLite's LIKE ignores letter case for ASCII letters by default; other databases often do not. Checks compare rows and their order on fresh databases.",
    vocabulary: [
      { term: 'LIKE', meaning: 'a text match against a pattern with wildcards' },
      { term: 'Wildcard', meaning: 'a pattern character standing for others: % for any run of characters, _ for exactly one' },
    ],
    planPrompt: 'Write the pattern with one symbol per position. Which wildcard stands for exactly one character?',
    starter: "SELECT code, name\nFROM parts\nWHERE code LIKE 'BR-%';\n",
    hints: [
      'The starter keeps BR-12 and BR-1050 as well: % matches any number of characters, including none.',
      'One wildcard matches exactly one character, so a fixed number of them fixes the length.',
      'Use BR- followed by three single-character wildcards, and sort by code.',
    ],
    checks: [
      {
        name: 'Exactly three characters after BR-',
        input: [],
        sql: { seed: 'bins' },
        expected: {
          rows: [
            ['BR-009', 'Bolt'],
            ['BR-104', 'Brake pad'],
            ['BR-A7Z', 'Brush'],
          ],
        },
      },
      {
        name: 'Letter case does not matter',
        input: [],
        sql: { seed: 'letter-case' },
        expected: {
          rows: [
            ['BR-301', 'Bushing'],
            ['br-300', 'Bearing'],
          ],
        },
      },
      { name: 'No brake codes', input: [], sql: { seed: 'no-codes' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-members-to-text',
    title: 'Find members you can text',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: members,
      seeds: {
        club: {
          about: 'six members with missing, empty, and present phone numbers and every status, including none set',
          sql: "INSERT INTO members VALUES (1,'Ade','+4711111111','active'),(2,'Bea',NULL,'active'),(3,'Cai','+4722222222','blocked'),(4,'Dag','+4733333333',NULL),(5,'Eli','','active'),(6,'Fia','+4744444444','paused');",
        },
        'never-set': {
          about: 'two members with phones whose status was never set',
          sql: "INSERT INTO members VALUES (1,'Zoe','+4755555555',NULL),(2,'Yan','+4766666666',NULL);",
        },
        'same-name': {
          about: 'two members both named Ola, and one blocked member',
          sql: "INSERT INTO members VALUES (4,'Ola','+4777777777','active'),(2,'Ola','+4788888888','paused'),(3,'Kim','+4799999999','blocked');",
        },
        'nobody-reachable': {
          about: 'members who are blocked or have no usable phone',
          sql: "INSERT INTO members VALUES (1,'Rui',NULL,NULL),(2,'Sol','','active'),(3,'Tor','+4712121212','blocked');",
        },
      },
      compare: 'ordered',
      columns: ['id', 'name'],
    },
    context:
      'A sports club sends a text message about a schedule change. It may text members who have a phone number on file, unless they are blocked.',
    prompt:
      "Write one SELECT statement on members that returns id and name, in that column order, for every member who can be texted: phone is present, meaning neither NULL nor empty text, and status is not 'blocked'. A NULL status means it was never set, and it does not block a member. Order by name ascending in SQLite's default text order, then id ascending. members has id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT (NULL when unknown), and status TEXT (NULL when never set, otherwise 'active', 'paused', or 'blocked'). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the members who have a phone number on file and are not blocked.',
      rules: [
        "`members(id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, status TEXT)`. phone is NULL when unknown; status is NULL when never set, otherwise 'active', 'paused', or 'blocked'.",
        "A member can be texted when phone is neither NULL nor empty text and status is not `'blocked'`. A NULL status does not block a member.",
        "Return the columns `id`, `name`, ordered by name ascending in SQLite's default text order, then id ascending.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['An empty phone is not a phone number.', 'A member whose status was never set can be texted.'],
    },
    example: {
      input: "members (1, 'Ade', '+4711111111', 'active') and (2, 'Bea', NULL, 'active')",
      output: "one row: (1, 'Ade')",
    },
    note: 'This is an independent rep: plan before you look at the hints. Checks compare rows and their order on fresh databases.',
    vocabulary: [
      { term: 'IS NULL', meaning: 'the test that is true exactly when a value is NULL' },
      { term: 'Three-valued logic', meaning: 'SQL conditions can be true, false, or unknown; WHERE keeps only true' },
    ],
    planPrompt: 'For each column, list every kind of value it can hold and say whether that value lets a member through.',
    starter: 'SELECT id, name\nFROM members;\n',
    hints: [
      'Check what each condition does with NULL. A comparison with NULL is neither true nor false, and WHERE keeps only true.',
      "A member with no status set must pass the status test, so a plain comparison against 'blocked' is not enough on its own.",
      'Test the phone against both NULL and empty text, let a NULL status through explicitly, and sort by name, then id.',
    ],
    checks: [
      {
        name: 'Reachable members in name order',
        input: [],
        sql: { seed: 'club' },
        expected: {
          rows: [
            [1, 'Ade'],
            [4, 'Dag'],
            [6, 'Fia'],
          ],
        },
      },
      {
        name: 'A status that was never set does not block',
        input: [],
        sql: { seed: 'never-set' },
        expected: {
          rows: [
            [2, 'Yan'],
            [1, 'Zoe'],
          ],
        },
      },
      {
        name: 'Same name, ordered by id',
        input: [],
        sql: { seed: 'same-name' },
        expected: {
          rows: [
            [2, 'Ola'],
            [4, 'Ola'],
          ],
        },
      },
      { name: 'Nobody can be texted', input: [], sql: { seed: 'nobody-reachable' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-search-articles',
    title: 'Search published articles',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: articles,
      seeds: {
        site: {
          about: 'eight articles in three sections, two of them drafts',
          sql: "INSERT INTO articles VALUES (1,'Intro to SQL','guides','2026-02-01'),(2,'SQLite tips','news','2026-03-15'),(3,'Release notes','news','2026-03-20'),(4,'MySQL or SQLite?','blog','2026-03-01'),(5,'Writing better sql','guides',NULL),(6,'Joins in SQL','guides','2026-03-15'),(7,'Indexes explained','guides','2026-01-10'),(8,'SQL for analysts','news','2026-02-20');",
        },
        'letter-case': {
          about: 'published titles containing sql, Sql, and SQL',
          sql: "INSERT INTO articles VALUES (1,'Learn sql','guides','2026-04-01'),(2,'Sql style','news','2026-04-02'),(3,'NoSQL myths','news','2026-04-03');",
        },
        'drafts-and-blog': {
          about: 'matching titles that are drafts or in the blog section',
          sql: "INSERT INTO articles VALUES (1,'SQL drafts','guides',NULL),(2,'SQL opinions','blog','2026-05-01'),(3,'Draft news on SQL','news',NULL);",
        },
        'no-match': {
          about: 'published guides and news without sql in the title',
          sql: "INSERT INTO articles VALUES (1,'Caching','guides','2026-06-01'),(2,'Queues','news','2026-06-02');",
        },
      },
      compare: 'ordered',
      columns: ['id', 'title'],
    },
    context:
      "A documentation site's search box looks for a word in titles. It searches only published articles in the guides and news sections.",
    prompt:
      "Write one SELECT statement on articles that returns id and title, in that column order, for every published article (published_at is not NULL) in section 'guides' or section 'news' whose title contains the letters sql anywhere, in any letter case. Order by published_at from newest to oldest, then id ascending. articles has id INTEGER PRIMARY KEY, title TEXT NOT NULL, section TEXT NOT NULL (compared exactly), and published_at TEXT (a 'YYYY-MM-DD' date, or NULL for a draft). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List published guides and news articles whose title contains sql in any letter case, newest first.',
      rules: [
        "`articles(id INTEGER PRIMARY KEY, title TEXT NOT NULL, section TEXT NOT NULL, published_at TEXT)`. published_at is a 'YYYY-MM-DD' date, or NULL for a draft.",
        "Keep published articles in section `'guides'` or `'news'` whose title contains sql anywhere, in any letter case. Sections are compared exactly.",
        'Return the columns `id`, `title`, ordered by published_at newest first, then id ascending.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A draft is never returned.', 'Words such as MySQL and NoSQL contain sql.'],
    },
    example: {
      input: "articles (1, 'Intro to SQL', 'guides', '2026-02-01') and (5, 'Writing better sql', 'guides', NULL)",
      output: "one row: (1, 'Intro to SQL')",
    },
    note: 'This is a delayed recall rep: solve it without hints after the break. Checks compare rows and their order on fresh databases; they do not establish how a real search ranks results.',
    vocabulary: [
      { term: 'Substring', meaning: 'a run of characters inside a longer text' },
      { term: 'Draft article', meaning: 'an article that is saved but not published yet' },
    ],
    planPrompt: 'Write the conditions an article must meet and how they group, then the sort keys.',
    starter: 'SELECT id, title\nFROM articles;\n',
    hints: [
      'Four facts decide each article: whether it is published, its section, its title, and nothing else. Make sure the section test cannot let a draft through.',
      'A pattern can match text anywhere in a title, and in SQLite it ignores the letter case of ASCII letters.',
      'Group the two sections, require a date, match the title anywhere, and sort newest first with the id after it.',
    ],
    checks: [
      {
        name: 'Published guides and news about SQL, newest first',
        input: [],
        sql: { seed: 'site' },
        expected: {
          rows: [
            [2, 'SQLite tips'],
            [6, 'Joins in SQL'],
            [8, 'SQL for analysts'],
            [1, 'Intro to SQL'],
          ],
        },
      },
      {
        name: 'Any letter case, anywhere in the title',
        input: [],
        sql: { seed: 'letter-case' },
        expected: {
          rows: [
            [3, 'NoSQL myths'],
            [2, 'Sql style'],
            [1, 'Learn sql'],
          ],
        },
      },
      { name: 'Drafts and other sections are left out', input: [], sql: { seed: 'drafts-and-blog' }, expected: { rows: [] } },
      { name: 'No title mentions sql', input: [], sql: { seed: 'no-match' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-count-by-status',
    title: 'Count rows in each group',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: shopOrders,
      seeds: {
        week: {
          about: 'eight orders: three shipped, two pending, one cancelled, and two with no status yet',
          sql: "INSERT INTO shop_orders VALUES (1,'Ada','shipped'),(2,'Bo','pending'),(3,'Cy',NULL),(4,'Di','shipped'),(5,'Ed','cancelled'),(6,'Fu','pending'),(7,'Gil',NULL),(8,'Hu','shipped');",
        },
        'one-order': { about: 'a single pending order', sql: "INSERT INTO shop_orders VALUES (1,'Ada','pending');" },
        'equal-counts': {
          about: 'two statuses with two orders each',
          sql: "INSERT INTO shop_orders VALUES (1,'Ada','shipped'),(2,'Bo','pending'),(3,'Cy','shipped'),(4,'Di','pending');",
        },
        empty: { about: 'no orders', sql: '' },
      },
      compare: 'ordered',
      columns: ['status', 'order_count'],
    },
    context: 'A shop owner wants one line per order status with the number of orders in it, the biggest pile first.',
    prompt:
      "Write one SELECT statement on shop_orders that returns status and order_count, in that column order: one row per distinct status, with the number of orders that have it. Orders whose status is NULL form one group of their own, shown with status NULL. Sort by order_count from largest to smallest, then by status ascending in SQLite's default order, which puts NULL first. With no orders, return no rows. shop_orders has id INTEGER PRIMARY KEY, customer TEXT NOT NULL, and status TEXT (NULL when not set yet). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'Return one row per order status with the number of orders in it, biggest group first.',
      rules: [
        '`shop_orders(id INTEGER PRIMARY KEY, customer TEXT NOT NULL, status TEXT)`; status is NULL when not set yet.',
        'Return the columns `status`, `order_count`: one row per distinct status. Orders with a NULL status form one group, shown as NULL.',
        "Sort by order_count descending, then status ascending in SQLite's default order, which puts NULL first.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['No orders gives no rows, not a row with a count of 0.'],
    },
    example: { input: 'three shipped orders and one cancelled order', output: "rows ('shipped', 3), ('cancelled', 1)" },
    note: 'Checks compare columns, rows, and their order on fresh databases; they do not establish how you counted.',
    vocabulary: [
      { term: 'GROUP BY', meaning: 'the clause that folds rows with equal values into one result row per group' },
      { term: 'COUNT', meaning: 'an aggregate that counts rows, or the non-NULL values of a column' },
      { term: 'Group', meaning: 'the set of rows that share the grouped values' },
    ],
    planPrompt: 'Say what one result row stands for, and what is counted inside it. Where does a NULL status go?',
    starter: 'SELECT status\nFROM shop_orders;\n',
    hints: [
      'Each result row stands for one status, not one order. Something must fold the orders of a status into a single row.',
      'Once rows are grouped, an aggregate such as COUNT(*) works on each group separately. NULL values of the grouped column form one group of their own.',
      'Group by status, count the rows of each group as order_count, and sort by that count descending, then by status.',
    ],
    checks: [
      {
        name: 'One row per status, biggest first',
        input: [],
        sql: { seed: 'week' },
        expected: {
          rows: [
            ['shipped', 3],
            [null, 2],
            ['pending', 2],
            ['cancelled', 1],
          ],
        },
      },
      { name: 'A single order', input: [], sql: { seed: 'one-order' }, expected: { rows: [['pending', 1]] } },
      {
        name: 'Equal counts by status',
        input: [],
        sql: { seed: 'equal-counts' },
        expected: {
          rows: [
            ['pending', 2],
            ['shipped', 2],
          ],
        },
      },
      { name: 'No orders gives no rows', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-ratings-summary',
    title: 'Count rated and unrated reviews',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: reviews,
      seeds: {
        shop: {
          about: 'seven reviews of three products, three of them without stars',
          sql: "INSERT INTO reviews VALUES (1,'Lamp',5),(2,'Lamp',4),(3,'Mug',3),(4,'Lamp',NULL),(5,'Rug',NULL),(6,'Lamp',4),(7,'Rug',NULL);",
        },
        'half-star': { about: 'two rated reviews of one product', sql: "INSERT INTO reviews VALUES (1,'Pen',1),(2,'Pen',2);" },
        empty: { about: 'no reviews', sql: '' },
      },
      compare: 'ordered',
      columns: ['product', 'reviews', 'rated', 'avg_stars'],
    },
    context: 'A shop shows each product with its review count and average rating. Some reviewers wrote text without choosing stars.',
    prompt:
      "Write one SELECT statement on reviews that returns product, reviews, rated, and avg_stars, in that column order, with one row per product: reviews is the number of reviews, rated is the number of reviews with stars, and avg_stars is the average of the stars given, rounded to 2 decimal places, or NULL when no review has stars. Order by product ascending in SQLite's default text order. reviews has id INTEGER PRIMARY KEY, product TEXT NOT NULL, and stars INTEGER from 1 to 5, or NULL for a review without stars. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'For each product, count all reviews, count the rated ones, and average the stars given.',
      rules: [
        '`reviews(id INTEGER PRIMARY KEY, product TEXT NOT NULL, stars INTEGER)`; stars is 1 to 5, or NULL for a review without stars.',
        'Return the columns `product`, `reviews`, `rated`, `avg_stars`: all reviews, reviews with stars, and the average of the stars given, rounded to 2 decimal places.',
        'avg_stars is NULL when no review of the product has stars.',
        "Order by product ascending in SQLite's default text order. Submit a single statement that only reads data.",
      ],
      edgeCases: ['A review without stars counts as a review but not in the average.'],
    },
    example: { input: 'Lamp reviews with stars 5, 4, 4, and one without stars', output: "('Lamp', 4, 3, 4.33)" },
    note: 'Rounding uses SQLite’s ROUND on the average. Checks compare rows and their order on fresh databases.',
    vocabulary: [
      { term: 'AVG', meaning: 'an aggregate that averages the non-NULL values of a column' },
      { term: 'COUNT(*)', meaning: 'counts every row of a group, whatever its values' },
      { term: 'ROUND', meaning: 'a function that rounds a number to a given number of decimal places' },
    ],
    planPrompt: 'For the Rug, predict each of the four values before you write anything.',
    starter: 'SELECT product\nFROM reviews\nGROUP BY product;\n',
    hints: [
      'Counting rows and counting values of one column are different questions when the column can be NULL.',
      'Aggregates such as AVG skip NULL values, and the average of no values is NULL.',
      'Use COUNT(*) for reviews, COUNT(stars) for rated, and ROUND(AVG(stars), 2) for the average.',
    ],
    checks: [
      {
        name: 'All, rated, and average per product',
        input: [],
        sql: { seed: 'shop' },
        expected: {
          rows: [
            ['Lamp', 4, 3, 4.33],
            ['Mug', 1, 1, 3],
            ['Rug', 2, 0, null],
          ],
        },
      },
      { name: 'An average between whole stars', input: [], sql: { seed: 'half-star' }, expected: { rows: [['Pen', 2, 2, 1.5]] } },
      { name: 'No reviews', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-count-visitors',
    title: 'Count visitors, not visits',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: pageViews,
      seeds: {
        site: {
          about: 'eight views of three pages, three of them by visitors who were not signed in',
          sql: "INSERT INTO page_views VALUES (1,'/home','ana'),(2,'/home','ana'),(3,'/docs','bo'),(4,'/home','bo'),(5,'/home',NULL),(6,'/docs','cy'),(7,'/pricing',NULL),(8,'/home',NULL);",
        },
        'equal-views': {
          about: 'two pages with two views each',
          sql: "INSERT INTO page_views VALUES (1,'/b','x'),(2,'/a','x'),(3,'/b','x'),(4,'/a','y');",
        },
        empty: { about: 'no views', sql: '' },
      },
      compare: 'ordered',
      columns: ['page', 'views', 'visitors'],
    },
    context: 'A small site counts how often each page was viewed and by how many different signed-in visitors.',
    prompt:
      "Write one SELECT statement on page_views that returns page, views, and visitors, in that column order, with one row per page: views is the number of views, and visitors is the number of different signed-in visitors who viewed it. A view by someone not signed in has visitor NULL; it counts as a view but not as a visitor. Order by views from most to fewest, then page ascending in SQLite's default text order. page_views has id INTEGER PRIMARY KEY, page TEXT NOT NULL, and visitor TEXT. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'For each page, count its views and its different signed-in visitors.',
      rules: [
        '`page_views(id INTEGER PRIMARY KEY, page TEXT NOT NULL, visitor TEXT)`; visitor is NULL for someone not signed in.',
        'Return the columns `page`, `views`, `visitors`: all views of the page, and the number of different non-NULL visitors.',
        "Order by views descending, then page ascending in SQLite's default text order.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['Two views by one visitor count once as a visitor.', 'A page viewed only by people not signed in has 0 visitors.'],
    },
    example: { input: "'/home' viewed by ana twice and once by someone not signed in", output: "('/home', 3, 1)" },
    note: 'Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'COUNT(DISTINCT)', meaning: 'counts the different non-NULL values of a column' }],
    planPrompt: 'For /home, write the views and visitors you expect and which rows each count includes.',
    starter: 'SELECT page, COUNT(*) AS views\nFROM page_views\nGROUP BY page;\n',
    hints: [
      'The starter counts views. Visitors need a count that ignores repeats and people who were not signed in.',
      'DISTINCT can sit inside COUNT, and COUNT of a column already skips NULL values.',
      'Add COUNT(DISTINCT visitor) AS visitors, then sort by views descending and page ascending.',
    ],
    checks: [
      {
        name: 'Views and different visitors per page',
        input: [],
        sql: { seed: 'site' },
        expected: {
          rows: [
            ['/home', 5, 2],
            ['/docs', 2, 2],
            ['/pricing', 1, 0],
          ],
        },
      },
      {
        name: 'Equal views by page',
        input: [],
        sql: { seed: 'equal-views' },
        expected: {
          rows: [
            ['/a', 2, 2],
            ['/b', 2, 1],
          ],
        },
      },
      { name: 'No views', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-busy-days',
    title: 'Find the busy delivery days',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: deliveries,
      seeds: {
        month: {
          about: 'deliveries on five days, some of them cancelled',
          sql: "INSERT INTO deliveries VALUES (1,'2026-05-01','delivered'),(2,'2026-05-01','delivered'),(3,'2026-05-01','delivered'),(4,'2026-05-02','delivered'),(5,'2026-05-02','late'),(6,'2026-05-02','cancelled'),(7,'2026-05-02','delivered'),(8,'2026-05-03','delivered'),(9,'2026-05-03','cancelled'),(10,'2026-05-03','cancelled'),(11,'2026-05-03','delivered'),(12,'2026-05-04','delivered'),(13,'2026-05-04','delivered'),(14,'2026-05-04','late'),(15,'2026-05-04','delivered'),(16,'2026-05-05','delivered');",
        },
        'all-cancelled': {
          about: 'a day with four cancelled deliveries and a day with three delivered',
          sql: "INSERT INTO deliveries VALUES (1,'2026-06-01','cancelled'),(2,'2026-06-01','cancelled'),(3,'2026-06-01','cancelled'),(4,'2026-06-01','cancelled'),(5,'2026-06-02','delivered'),(6,'2026-06-02','late'),(7,'2026-06-02','delivered');",
        },
        quiet: {
          about: 'two days with two deliveries each',
          sql: "INSERT INTO deliveries VALUES (1,'2026-07-01','delivered'),(2,'2026-07-01','late'),(3,'2026-07-02','delivered'),(4,'2026-07-02','delivered');",
        },
        empty: { about: 'no deliveries', sql: '' },
      },
      compare: 'ordered',
      columns: ['day', 'deliveries'],
    },
    context:
      'A courier company adds a second van on busy days. A day is busy when at least three deliveries went ahead; cancelled ones do not count.',
    prompt:
      "Write one SELECT statement on deliveries that returns day and deliveries, in that column order, for every day with at least 3 deliveries whose status is not 'cancelled', where deliveries is that number. Order by day ascending. deliveries has id INTEGER PRIMARY KEY, day TEXT NOT NULL written as 'YYYY-MM-DD', and status TEXT NOT NULL, one of 'delivered', 'late', or 'cancelled'. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the days with at least three deliveries that were not cancelled, with that number.',
      rules: [
        "`deliveries(id INTEGER PRIMARY KEY, day TEXT NOT NULL, status TEXT NOT NULL)`; day is 'YYYY-MM-DD'; status is 'delivered', 'late', or 'cancelled'.",
        "Count only deliveries whose status is not `'cancelled'`. A day qualifies when that count is at least 3.",
        'Return the columns `day`, `deliveries`, ordered by day ascending.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['Late deliveries count.', 'Exactly 3 qualifies; cancelled deliveries never help a day qualify.'],
    },
    example: { input: "'2026-05-02': two delivered, one late, one cancelled", output: "('2026-05-02', 3)" },
    note: 'This is an independent rep: plan before you look at the hints. Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'HAVING', meaning: 'a filter applied to groups after aggregates are calculated' }],
    planPrompt: 'Which rows are removed before counting, and which groups are removed after? Use 2026-05-03 to check your plan.',
    starter: 'SELECT day\nFROM deliveries;\n',
    hints: [
      'Two filters happen at different times here: one removes individual deliveries, the other removes whole days.',
      'A filter on single rows runs before grouping; a filter on a count can only run after it.',
      'Remove cancelled deliveries first, group by day, keep groups whose count is at least 3, and sort by day.',
    ],
    checks: [
      {
        name: 'Busy days counted without cancellations',
        input: [],
        sql: { seed: 'month' },
        expected: {
          rows: [
            ['2026-05-01', 3],
            ['2026-05-02', 3],
            ['2026-05-04', 4],
          ],
        },
      },
      {
        name: 'Cancelled deliveries do not make a day busy',
        input: [],
        sql: { seed: 'all-cancelled' },
        expected: { rows: [['2026-06-02', 3]] },
      },
      { name: 'No busy days', input: [], sql: { seed: 'quiet' }, expected: { rows: [] } },
      { name: 'No deliveries', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-month-spenders',
    title: 'Find the big spenders of a month',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: payments,
      seeds: {
        quarter: {
          about: 'payments and refunds from February to April 2026 for five accounts',
          sql: "INSERT INTO payments VALUES (1,'acme',6000,'2026-03-04'),(2,'acme',5000,'2026-03-18'),(3,'acme',9000,'2026-02-11'),(4,'bolt',12000,'2026-03-09'),(5,'bolt',-3000,'2026-03-12'),(6,'core',10000,'2026-03-20'),(7,'dune',4000,'2026-03-31'),(8,'dune',6000,'2026-03-01'),(9,'dune',20000,'2026-04-01'),(10,'echo',50000,'2026-02-28');",
        },
        'one-account': {
          about: 'one account with one large March payment',
          sql: "INSERT INTO payments VALUES (1,'fern',15000,'2026-03-15');",
        },
        'below-threshold': {
          about: 'March totals all below 10000, one only because of a refund',
          sql: "INSERT INTO payments VALUES (1,'gale',9999,'2026-03-02'),(2,'hale',11000,'2026-03-05'),(3,'hale',-2000,'2026-03-06');",
        },
        empty: { about: 'no payments', sql: '' },
      },
      compare: 'ordered',
      columns: ['account', 'payments', 'total_cents'],
    },
    context: 'A finance team thanks every account that paid at least 100.00 in total during March 2026. Refunds reduce the total.',
    prompt:
      "Write one SELECT statement on payments that returns account, payments, and total_cents, in that column order, for every account whose payments dated from 2026-03-01 to 2026-03-31 inclusive total at least 10000 cents. payments is the number of those March payments, refunds included, and total_cents is their sum. Payments outside March are ignored. Order by total_cents from largest to smallest, then account ascending in SQLite's default text order. payments has id INTEGER PRIMARY KEY, account TEXT NOT NULL, amount_cents INTEGER NOT NULL (negative for a refund), and paid_on TEXT NOT NULL written as 'YYYY-MM-DD'. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the accounts whose March 2026 payments total at least 10000 cents, with their March payment count and total.',
      rules: [
        "`payments(id INTEGER PRIMARY KEY, account TEXT NOT NULL, amount_cents INTEGER NOT NULL, paid_on TEXT NOT NULL)`; a refund has a negative amount; paid_on is 'YYYY-MM-DD'.",
        'Only payments dated from 2026-03-01 to 2026-03-31, both included, count. Refunds count in both the number and the sum.',
        'Return the columns `account`, `payments`, `total_cents` for accounts whose March total is at least 10000.',
        "Order by total_cents descending, then account ascending in SQLite's default text order. Submit a single statement that only reads data.",
      ],
      edgeCases: ['A total of exactly 10000 qualifies.', 'A refund can take an account below the threshold.'],
    },
    example: { input: 'acme paid 6000 and 5000 in March and 9000 in February', output: "('acme', 2, 11000)" },
    note: 'This is a delayed recall rep: solve it without hints after the break. Checks compare rows and their order on fresh databases.',
    vocabulary: [
      { term: 'SUM', meaning: 'an aggregate that adds the non-NULL values of a column' },
      { term: 'Refund', meaning: 'money paid back, stored here as a negative amount' },
    ],
    planPrompt: 'For bolt and dune, write which payments count and the total you expect, then the steps that produce it.',
    starter: 'SELECT account\nFROM payments;\n',
    hints: [
      'Decide which payments belong to March before adding anything up, and which accounts qualify only after.',
      'The date text is written year first, so a range of text compares as a range of dates. The threshold applies to a total, not to single payments.',
      'Keep March payments, group by account, count and sum each group, keep totals of at least 10000, and sort by total, then account.',
    ],
    checks: [
      {
        name: 'March totals of at least 10000, refunds included',
        input: [],
        sql: { seed: 'quarter' },
        expected: {
          rows: [
            ['acme', 2, 11000],
            ['core', 1, 10000],
            ['dune', 2, 10000],
          ],
        },
      },
      { name: 'One account, one payment', input: [], sql: { seed: 'one-account' }, expected: { rows: [['fern', 1, 15000]] } },
      { name: 'Just below, or brought below by a refund', input: [], sql: { seed: 'below-threshold' }, expected: { rows: [] } },
      { name: 'No payments', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-join-orders',
    title: 'Join orders to their customers',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: customerOrders,
      seeds: {
        shop: {
          about: 'three customers and four orders, one of them for a deleted customer',
          sql: "INSERT INTO customers VALUES (1,'Ada'),(2,'Bo'),(3,'Cy'); INSERT INTO orders VALUES (10,1,1200),(11,2,800),(12,1,300),(13,9,500);",
        },
        'same-name': {
          about: 'two different customers both named Ola, with one order each',
          sql: "INSERT INTO customers VALUES (1,'Ola'),(2,'Ola'); INSERT INTO orders VALUES (21,2,700),(20,1,400);",
        },
        'no-orders': { about: 'customers who have not ordered', sql: "INSERT INTO customers VALUES (1,'Ada'),(2,'Bo');" },
        'deleted-customers': {
          about: 'orders whose customers were all deleted',
          sql: "INSERT INTO customers VALUES (1,'Ada'); INSERT INTO orders VALUES (30,7,900),(31,8,100);",
        },
      },
      compare: 'ordered',
      columns: ['id', 'name', 'cents'],
    },
    context:
      'An invoice list shows each order with the name of the customer who placed it. Orders left behind by deleted customers are handled elsewhere.',
    prompt:
      "Write one SELECT statement that returns id, name, and cents, in that column order: the order's id, the name of the customer who placed it, and the order's cents, for every order whose customer_id matches a customer's id. Leave out orders whose customer no longer exists, and customers with no orders. Order by the order id ascending. customers has id INTEGER PRIMARY KEY and name TEXT NOT NULL (names can repeat). orders has id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, and cents INTEGER NOT NULL; a customer_id can point at a deleted customer, because these tables do not enforce the link. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: "List every order with its customer's name, leaving out orders whose customer was deleted.",
      rules: [
        '`customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL)`; names can repeat. `orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL)`.',
        'An order belongs to the customer whose id equals its customer_id. Some customer_id values point at deleted customers; the tables do not enforce the link.',
        'Return the columns `id` (the order id), `name`, `cents` for orders with a matching customer, ordered by the order id.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['An order for a deleted customer is left out.', 'Two customers with the same name are still different customers.'],
    },
    example: { input: "customer (1, 'Ada') and order (10, 1, 1200)", output: "(10, 'Ada', 1200)" },
    note: 'Checks compare columns, rows, and their order on fresh databases. They do not establish whether you wrote JOIN or INNER JOIN, or which table you named first.',
    vocabulary: [
      { term: 'JOIN', meaning: 'combines rows of two tables that match an ON condition' },
      { term: 'Table alias', meaning: 'a short name for a table in one query, such as orders AS o' },
      { term: 'Orphan row', meaning: 'a row that points at a row in another table that no longer exists' },
    ],
    planPrompt: 'Write the condition that pairs an order with its customer, and predict what happens to order 13.',
    starter: 'SELECT id, cents\nFROM orders;\n',
    hints: [
      'The name lives in another table. A join pairs each order with the customer row whose id matches.',
      'When both tables have an id column, say which one you mean, for example with a short alias for each table.',
      'Join orders to customers on customer_id = customer id, select the order id, the name, and the cents, and sort by the order id.',
    ],
    checks: [
      {
        name: 'Orders with their customer names',
        input: [],
        sql: { seed: 'shop' },
        expected: {
          rows: [
            [10, 'Ada', 1200],
            [11, 'Bo', 800],
            [12, 'Ada', 300],
          ],
        },
      },
      {
        name: 'Matched by id, not by name',
        input: [],
        sql: { seed: 'same-name' },
        expected: {
          rows: [
            [20, 'Ola', 400],
            [21, 'Ola', 700],
          ],
        },
      },
      { name: 'Customers without orders add nothing', input: [], sql: { seed: 'no-orders' }, expected: { rows: [] } },
      { name: 'Orders of deleted customers are left out', input: [], sql: { seed: 'deleted-customers' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-customers-without-orders',
    title: 'Find customers with no orders',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: customerOrders,
      seeds: {
        shop: {
          about: 'four customers, two of whom have ordered, and an order for a deleted customer',
          sql: "INSERT INTO customers VALUES (1,'Ada'),(2,'Bo'),(3,'Cy'),(4,'Di'); INSERT INTO orders VALUES (10,1,1200),(11,3,800),(12,1,300),(13,9,500);",
        },
        'everyone-ordered': {
          about: 'two customers who have both ordered',
          sql: "INSERT INTO customers VALUES (1,'Ada'),(2,'Bo'); INSERT INTO orders VALUES (10,2,100),(11,1,200);",
        },
        'nobody-ordered': {
          about: 'three customers with no orders, two sharing a name',
          sql: "INSERT INTO customers VALUES (3,'Zed'),(1,'Amy'),(2,'Amy');",
        },
      },
      compare: 'ordered',
      columns: ['id', 'name'],
    },
    context: 'A welcome campaign writes to customers who signed up but never ordered.',
    prompt:
      "Write one SELECT statement that returns id and name, in that column order, for every customer who has no orders: no row of orders has a customer_id equal to the customer's id. Order by name ascending in SQLite's default text order, then id ascending. customers has id INTEGER PRIMARY KEY and name TEXT NOT NULL. orders has id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, and cents INTEGER NOT NULL; some orders point at deleted customers. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the customers who have never ordered.',
      rules: [
        '`customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL)` and `orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL)`.',
        "A customer has no orders when no order's customer_id equals the customer's id.",
        "Return the columns `id`, `name`, ordered by name ascending in SQLite's default text order, then id ascending.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['Everyone has ordered: no rows.', 'Orders for deleted customers change nothing.'],
    },
    example: { input: 'customers Ada and Bo; one order for Ada', output: "(2, 'Bo')" },
    note: 'Checks compare rows and their order on fresh databases; they do not establish whether you used a LEFT JOIN or NOT EXISTS.',
    vocabulary: [
      { term: 'LEFT JOIN', meaning: 'a join that keeps every row of the first table even when the second has no match' },
      { term: 'Anti-join', meaning: 'a query for the rows of one table that have no match in another' },
    ],
    planPrompt: 'What does a LEFT JOIN produce for a customer with no orders, and which column tells you so?',
    starter: 'SELECT c.id, c.name\nFROM customers AS c\nJOIN orders AS o ON o.customer_id = c.id;\n',
    hints: [
      'The starter keeps only customers who have orders, and repeats them once per order. You want the opposite set.',
      'A LEFT JOIN keeps a customer with no orders as one row whose order columns are all NULL.',
      'LEFT JOIN orders, keep the rows where the order id IS NULL, and sort by name, then id.',
    ],
    checks: [
      {
        name: 'Customers who never ordered',
        input: [],
        sql: { seed: 'shop' },
        expected: {
          rows: [
            [2, 'Bo'],
            [4, 'Di'],
          ],
        },
      },
      { name: 'Everyone has ordered', input: [], sql: { seed: 'everyone-ordered' }, expected: { rows: [] } },
      {
        name: 'Nobody has ordered',
        input: [],
        sql: { seed: 'nobody-ordered' },
        expected: {
          rows: [
            [1, 'Amy'],
            [2, 'Amy'],
            [3, 'Zed'],
          ],
        },
      },
    ],
  },
  {
    id: 'sql-team-totals',
    title: 'Total two lists without double counting',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: teamTables,
      seeds: {
        office: {
          about:
            'three teams: one with three members and two expenses, one with a member and no expenses, one with an expense and no members',
          sql: "INSERT INTO teams VALUES (1,'Alpha'),(2,'Beta'),(3,'Gamma'); INSERT INTO team_members VALUES (1,1,'Ana'),(2,1,'Ben'),(3,1,'Cleo'),(4,2,'Dov'); INSERT INTO expenses VALUES (1,1,200),(2,1,300),(3,3,400);",
        },
        'equal-expenses': {
          about: 'one team with two members and two expenses of the same amount',
          sql: "INSERT INTO teams VALUES (1,'Delta'); INSERT INTO team_members VALUES (1,1,'Eva'),(2,1,'Finn'); INSERT INTO expenses VALUES (1,1,300),(2,1,300);",
        },
        'empty-team': { about: 'one team with no members and no expenses', sql: "INSERT INTO teams VALUES (1,'Omega');" },
      },
      compare: 'ordered',
      columns: ['name', 'members', 'expense_cents'],
    },
    context:
      'A budget page shows every team with its head count and its total expenses. Both come from separate lists attached to the team.',
    prompt:
      "Write one SELECT statement that returns name, members, and expense_cents, in that column order, with one row per team: members is the number of the team's members, and expense_cents is the sum of the team's expenses, or 0 when it has none. Every team appears, even with no members or no expenses. Order by name ascending in SQLite's default text order. teams has id INTEGER PRIMARY KEY and name TEXT NOT NULL. team_members has id INTEGER PRIMARY KEY, team_id INTEGER NOT NULL, and name TEXT NOT NULL. expenses has id INTEGER PRIMARY KEY, team_id INTEGER NOT NULL, and cents INTEGER NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'For every team, count its members and total its expenses, without one list multiplying the other.',
      rules: [
        '`teams(id INTEGER PRIMARY KEY, name TEXT NOT NULL)`, `team_members(id INTEGER PRIMARY KEY, team_id INTEGER NOT NULL, name TEXT NOT NULL)`, `expenses(id INTEGER PRIMARY KEY, team_id INTEGER NOT NULL, cents INTEGER NOT NULL)`.',
        "Return the columns `name`, `members`, `expense_cents`: the team's member count and its expense total, 0 when it has none.",
        "Every team appears. Order by name ascending in SQLite's default text order.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['Two expenses of the same amount both count.', 'A team with no members and no expenses shows 0 and 0.'],
    },
    example: { input: 'Alpha with three members and expenses of 200 and 300', output: "('Alpha', 3, 500)" },
    note: 'Checks compare rows and their order on fresh databases; they do not establish how you avoided the duplication.',
    vocabulary: [
      { term: 'Fan-out', meaning: 'a join repeating a row once per match, which inflates counts and sums' },
      { term: 'Derived table', meaning: 'a SELECT used in FROM as if it were a table' },
    ],
    planPrompt: 'Predict what joining Alpha to both lists produces, row by row, before you sum anything.',
    starter:
      'SELECT t.name, COUNT(m.id) AS members, COALESCE(SUM(e.cents), 0) AS expense_cents\nFROM teams AS t\nLEFT JOIN team_members AS m ON m.team_id = t.id\nLEFT JOIN expenses AS e ON e.team_id = t.id\nGROUP BY t.id\nORDER BY t.name;\n',
    hints: [
      'Run the starter and look at Alpha: three members and two expenses produce six joined rows, so each list is counted once per row of the other.',
      'Summarize each list on its own first, one row per team, and only then join the summaries to teams.',
      'Join teams to a derived table that sums expenses per team, count members in another one, or use a subquery per column, and replace a missing total with 0.',
    ],
    checks: [
      {
        name: 'Counts and totals that do not multiply',
        input: [],
        sql: { seed: 'office' },
        expected: {
          rows: [
            ['Alpha', 3, 500],
            ['Beta', 1, 0],
            ['Gamma', 0, 400],
          ],
        },
      },
      { name: 'Equal expenses both count', input: [], sql: { seed: 'equal-expenses' }, expected: { rows: [['Delta', 2, 600]] } },
      { name: 'A team with nothing attached', input: [], sql: { seed: 'empty-team' }, expected: { rows: [['Omega', 0, 0]] } },
    ],
  },
  {
    id: 'sql-june-returns',
    title: 'Count each product’s returns in June',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: productReturns,
      seeds: {
        store: {
          about: 'four products and returns from May to July 2026',
          sql: "INSERT INTO products VALUES (1,'Kettle'),(2,'Toaster'),(3,'Blender'),(4,'Grill'); INSERT INTO product_returns VALUES (1,1,'2026-06-03'),(2,1,'2026-06-30'),(3,1,'2026-05-31'),(4,2,'2026-07-01'),(5,3,'2026-06-15');",
        },
        'no-june-returns': {
          about: 'products whose returns all fall outside June',
          sql: "INSERT INTO products VALUES (1,'Mixer'),(2,'Fan'); INSERT INTO product_returns VALUES (1,1,'2026-05-20'),(2,2,'2026-07-02');",
        },
        'deleted-product': {
          about: 'a June return of a deleted product, and one product with a June return',
          sql: "INSERT INTO products VALUES (1,'Iron'); INSERT INTO product_returns VALUES (1,1,'2026-06-10'),(2,5,'2026-06-11');",
        },
        empty: { about: 'no products and no returns', sql: '' },
      },
      compare: 'ordered',
      columns: ['name', 'june_returns'],
    },
    context:
      'A quality team reviews June: every product appears with its number of returns that month, so products with none can be noted as clean.',
    prompt:
      "Write one SELECT statement that returns name and june_returns, in that column order, for every product: june_returns is the number of its returns dated from 2026-06-01 to 2026-06-30 inclusive, and 0 when it has none in June. Every product appears exactly once. Order by june_returns from most to fewest, then name ascending in SQLite's default text order. products has id INTEGER PRIMARY KEY and name TEXT NOT NULL. product_returns has id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, and returned_on TEXT NOT NULL written as 'YYYY-MM-DD'; some returns point at deleted products. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List every product with its number of June 2026 returns, including products with none.',
      rules: [
        "`products(id INTEGER PRIMARY KEY, name TEXT NOT NULL)` and `product_returns(id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, returned_on TEXT NOT NULL)`; returned_on is 'YYYY-MM-DD'.",
        'june_returns counts a product’s returns dated from 2026-06-01 to 2026-06-30, both included; it is 0 when there are none.',
        "Return the columns `name`, `june_returns` for every product, ordered by june_returns descending, then name ascending in SQLite's default text order.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A product with returns only outside June appears with 0.', 'Returns of deleted products are ignored.'],
    },
    example: { input: 'Kettle returned on 2026-06-03, 2026-06-30, and 2026-05-31', output: "('Kettle', 2)" },
    note: 'This is an independent rep: plan before you look at the hints. Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'Join condition', meaning: 'the ON expression that decides which rows of two tables pair up' }],
    planPrompt: 'Trace the Toaster through your query: which rows does it have after the join, after any filter, and after grouping?',
    starter: 'SELECT name\nFROM products;\n',
    hints: [
      'Every product must survive to the end, including one whose only return is in July. Watch where the June rule removes rows.',
      'A condition in WHERE runs after a LEFT JOIN and can remove the very rows the LEFT JOIN kept. A condition in ON only decides which returns pair up.',
      'LEFT JOIN returns ON the product id and the June date range, count the return ids per product, and sort by the count, then name.',
    ],
    checks: [
      {
        name: 'June returns for every product',
        input: [],
        sql: { seed: 'store' },
        expected: {
          rows: [
            ['Kettle', 2],
            ['Blender', 1],
            ['Grill', 0],
            ['Toaster', 0],
          ],
        },
      },
      {
        name: 'Returns outside June still leave the product listed',
        input: [],
        sql: { seed: 'no-june-returns' },
        expected: {
          rows: [
            ['Fan', 0],
            ['Mixer', 0],
          ],
        },
      },
      { name: 'Returns of deleted products are ignored', input: [], sql: { seed: 'deleted-product' }, expected: { rows: [['Iron', 1]] } },
      { name: 'No products', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-authors-latest',
    title: 'Find each author’s latest book',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: authorBooks,
      seeds: {
        library: {
          about: 'four authors: one with three books, one with one, one with none, and one whose only book has no known year',
          sql: "INSERT INTO authors VALUES (1,'Le Guin'),(2,'Butler'),(3,'Newcomer'),(4,'Anonymous'); INSERT INTO books VALUES (1,1,'The Left Hand of Darkness',1969),(2,1,'The Dispossessed',1974),(3,1,'Collected Notes',NULL),(4,2,'Kindred',1979),(5,4,'Old Ballads',NULL);",
        },
        'same-name': {
          about: 'two different authors both named Kim',
          sql: "INSERT INTO authors VALUES (2,'Kim'),(1,'Kim'); INSERT INTO books VALUES (1,1,'First',2001),(2,2,'Second',2010),(3,2,'Third',2012);",
        },
        empty: { about: 'no authors and no books', sql: '' },
      },
      compare: 'ordered',
      columns: ['name', 'books', 'latest_year'],
    },
    context: 'A library catalogue lists every author with how many of their books it holds and the year of the newest one.',
    prompt:
      "Write one SELECT statement that returns name, books, and latest_year, in that column order, for every author: books is the number of their books, and latest_year is the largest known year among them, or NULL when they have no books or no book with a known year. Every author appears exactly once. Order by name ascending in SQLite's default text order, then by author id ascending. authors has id INTEGER PRIMARY KEY and name TEXT NOT NULL (names can repeat). books has id INTEGER PRIMARY KEY, author_id INTEGER NOT NULL, title TEXT NOT NULL, and year INTEGER (NULL when unknown). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List every author with their number of books and the year of their newest one.',
      rules: [
        '`authors(id INTEGER PRIMARY KEY, name TEXT NOT NULL)`; names can repeat. `books(id INTEGER PRIMARY KEY, author_id INTEGER NOT NULL, title TEXT NOT NULL, year INTEGER)`; year is NULL when unknown.',
        'Return the columns `name`, `books`, `latest_year` for every author: the number of their books, and the largest known year, or NULL when there is none.',
        "Order by name ascending in SQLite's default text order, then by author id.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['An author with no books shows 0 and NULL.', 'A book with an unknown year counts as a book but has no year.'],
    },
    example: { input: 'Le Guin with books from 1969, 1974, and an unknown year', output: "('Le Guin', 3, 1974)" },
    note: 'This is a delayed recall rep: solve it without hints after the break. Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'MAX', meaning: 'an aggregate that returns the largest non-NULL value of a column' }],
    planPrompt: 'Predict the row for Newcomer and for Anonymous, then the steps that produce them.',
    starter: 'SELECT name\nFROM authors;\n',
    hints: [
      'Every author appears, so the books must attach without removing anyone.',
      'Counting books needs a column that is NULL when an author has none, and the largest year should skip unknown years.',
      'LEFT JOIN books, group by author id, count book ids, take the largest year, and sort by name, then author id.',
    ],
    checks: [
      {
        name: 'Book counts and newest years, including authors with none',
        input: [],
        sql: { seed: 'library' },
        expected: {
          rows: [
            ['Anonymous', 1, null],
            ['Butler', 1, 1979],
            ['Le Guin', 3, 1974],
            ['Newcomer', 0, null],
          ],
        },
      },
      {
        name: 'Two authors with the same name',
        input: [],
        sql: { seed: 'same-name' },
        expected: {
          rows: [
            ['Kim', 1, 2001],
            ['Kim', 2, 2012],
          ],
        },
      },
      { name: 'No authors', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-above-average',
    title: 'Compare each row with an average',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: invoices,
      seeds: {
        month: {
          about: 'five invoices averaging 600 cents',
          sql: "INSERT INTO invoices VALUES (1,'Acme',300),(2,'Bolt',500),(3,'Core',700),(4,'Dune',500),(5,'Echo',1000);",
        },
        'at-average': {
          about: 'four invoices averaging 500 cents, two of them exactly 500',
          sql: "INSERT INTO invoices VALUES (1,'Ash',500),(2,'Bay',500),(3,'Cove',800),(4,'Dell',200);",
        },
        'equal-highs': {
          about: 'two invoices of 900 and one of 100',
          sql: "INSERT INTO invoices VALUES (3,'Fig',900),(2,'Gum',100),(1,'Hop',900);",
        },
        single: { about: 'one invoice', sql: "INSERT INTO invoices VALUES (1,'Ivy',450);" },
        empty: { about: 'no invoices', sql: '' },
      },
      compare: 'ordered',
      columns: ['id', 'cents'],
    },
    context: "An accountant reviews the invoices that are larger than this month's average invoice.",
    prompt:
      'Write one SELECT statement on invoices that returns id and cents, in that column order, for every invoice whose cents is greater than the average cents of all invoices. Order by cents from largest to smallest, then id ascending. invoices has id INTEGER PRIMARY KEY, client TEXT NOT NULL, and cents INTEGER NOT NULL. An invoice equal to the average is not greater than it. Submit a single statement that only reads data; the checks use SQLite and compare row order.',
    brief: {
      summary: 'List the invoices larger than the average invoice, largest first.',
      rules: [
        '`invoices(id INTEGER PRIMARY KEY, client TEXT NOT NULL, cents INTEGER NOT NULL)`.',
        'Keep an invoice when its cents is greater than the average cents of all invoices.',
        'Return the columns `id`, `cents`, ordered by cents descending, then id ascending.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['An invoice equal to the average is left out.', 'One invoice, or none, gives no rows.'],
    },
    example: { input: 'invoices of 300, 500, 700, 500, and 1000 cents', output: 'rows (5, 1000), (3, 700)' },
    note: 'Checks compare rows and their order on fresh databases; they do not establish whether the average was computed once.',
    vocabulary: [
      { term: 'Subquery', meaning: 'a SELECT written inside another statement' },
      { term: 'Scalar subquery', meaning: 'a subquery in parentheses that produces a single value' },
    ],
    planPrompt: 'Write the average for the month data, then the condition each invoice must meet.',
    starter: 'SELECT id, cents\nFROM invoices;\n',
    hints: [
      'Each invoice is compared with one number that describes all invoices together. Work that number out separately first.',
      'An aggregate cannot sit directly in WHERE, but a whole SELECT in parentheses can stand where a value goes.',
      'Compare cents with (SELECT AVG(cents) FROM invoices) using >, then sort by cents descending, then id.',
    ],
    checks: [
      {
        name: 'Invoices above the average',
        input: [],
        sql: { seed: 'month' },
        expected: {
          rows: [
            [5, 1000],
            [3, 700],
          ],
        },
      },
      { name: 'Equal to the average is not above it', input: [], sql: { seed: 'at-average' }, expected: { rows: [[3, 800]] } },
      {
        name: 'Equal amounts by id',
        input: [],
        sql: { seed: 'equal-highs' },
        expected: {
          rows: [
            [1, 900],
            [3, 900],
          ],
        },
      },
      { name: 'A single invoice is never above itself', input: [], sql: { seed: 'single' }, expected: { rows: [] } },
      { name: 'No invoices', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-category-average',
    title: 'Compare each row with its own group',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: catalogItems,
      seeds: {
        store: {
          about: 'six products in three categories; kitchen averages 2000 and garden 500',
          sql: "INSERT INTO catalog_items VALUES (1,'Whisk','kitchen',1000),(2,'Pan','kitchen',2000),(3,'Mixer','kitchen',3000),(4,'Rake','garden',400),(5,'Hose','garden',600),(6,'Globe','decor',2500);",
        },
        'one-price': {
          about: 'a category where every product costs the same',
          sql: "INSERT INTO catalog_items VALUES (1,'Cup','kitchen',800),(2,'Bowl','kitchen',800);",
        },
        empty: { about: 'no products', sql: '' },
      },
      compare: 'ordered',
      columns: ['name', 'category', 'price_cents'],
    },
    context: 'A buyer looks for products priced above the usual price of their own category, not above the store as a whole.',
    prompt:
      "Write one SELECT statement on catalog_items that returns name, category, and price_cents, in that column order, for every product whose price_cents is greater than the average price_cents of the products in its own category. Order by category ascending in SQLite's default text order, then price_cents from highest to lowest, then name ascending. catalog_items has id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, and price_cents INTEGER NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the products priced above the average of their own category.',
      rules: [
        '`catalog_items(id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL)`.',
        'Keep a product when its price_cents is greater than the average price_cents of its category.',
        'Return the columns `name`, `category`, `price_cents`, ordered by category, then price_cents descending, then name.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A product alone in its category equals its own average and is left out.'],
    },
    example: { input: 'kitchen products at 1000, 2000, and 3000', output: "('Mixer', 'kitchen', 3000)" },
    note: 'Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'Correlated subquery', meaning: 'a subquery that refers to the row the outer query is looking at' }],
    planPrompt: 'For the Hose, write the average it is compared with and which rows that average covers.',
    starter: 'SELECT name, category, price_cents\nFROM catalog_items\nWHERE price_cents > (SELECT AVG(price_cents) FROM catalog_items);\n',
    hints: [
      'The starter compares every product with the whole store’s average. The Globe, alone in decor, should never pass.',
      'Give the outer table an alias, and let the subquery average only the rows whose category equals the outer row’s category.',
      'Add WHERE inner.category = outer.category inside the subquery, then sort by category, price descending, and name.',
    ],
    checks: [
      {
        name: 'Above the average of their own category',
        input: [],
        sql: { seed: 'store' },
        expected: {
          rows: [
            ['Hose', 'garden', 600],
            ['Mixer', 'kitchen', 3000],
          ],
        },
      },
      { name: 'Equal prices are never above their average', input: [], sql: { seed: 'one-price' }, expected: { rows: [] } },
      { name: 'No products', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-students-without-work',
    title: 'Find students with no submissions',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: studentWork,
      seeds: {
        class: {
          about: 'four students, two of whom submitted, and one guest submission with no student',
          sql: "INSERT INTO students VALUES (1,'Ana'),(2,'Bo'),(3,'Cy'),(4,'Di'); INSERT INTO submissions VALUES (1,1,'essay'),(2,NULL,'essay'),(3,4,'quiz'),(4,1,'quiz');",
        },
        'no-guests': {
          about: 'three students and submissions that all name a student',
          sql: "INSERT INTO students VALUES (1,'Ana'),(2,'Bo'),(3,'Cy'); INSERT INTO submissions VALUES (1,2,'essay');",
        },
        'all-submitted': {
          about: 'two students who both submitted, and a guest submission',
          sql: "INSERT INTO students VALUES (1,'Ana'),(2,'Bo'); INSERT INTO submissions VALUES (1,1,'essay'),(2,2,'essay'),(3,NULL,'quiz');",
        },
      },
      compare: 'ordered',
      columns: ['id', 'name'],
    },
    context: 'A teacher emails students who have not handed in any work yet. Guests can also submit, without a student record.',
    prompt:
      "Write one SELECT statement that returns id and name, in that column order, for every student with no submission: no row of submissions has a student_id equal to the student's id. Order by id ascending. students has id INTEGER PRIMARY KEY and name TEXT NOT NULL. submissions has id INTEGER PRIMARY KEY, student_id INTEGER (NULL for a guest submission), and task TEXT NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the students who have not submitted anything.',
      rules: [
        '`students(id INTEGER PRIMARY KEY, name TEXT NOT NULL)` and `submissions(id INTEGER PRIMARY KEY, student_id INTEGER, task TEXT NOT NULL)`; student_id is NULL for a guest submission.',
        "A student has no submission when no submission's student_id equals the student's id.",
        'Return the columns `id`, `name`, ordered by id ascending.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A guest submission belongs to no student and must not hide anyone.'],
    },
    example: { input: 'students Ana and Bo; Ana submitted an essay', output: "(2, 'Bo')" },
    note: 'Checks compare rows and their order on fresh databases.',
    vocabulary: [
      { term: 'NOT EXISTS', meaning: 'a condition that is true when its subquery returns no rows' },
      { term: 'NOT IN', meaning: 'a condition that is true when a value equals none of a list; a NULL in the list makes it never true' },
    ],
    planPrompt: 'Run the starter on the class data and explain the result before changing it.',
    starter: 'SELECT id, name\nFROM students\nWHERE id NOT IN (SELECT student_id FROM submissions)\nORDER BY id;\n',
    hints: [
      'The starter returns nothing for the class data. Look at what the subquery returns for the guest submission.',
      'x NOT IN (1, NULL) asks whether x differs from an unknown value, which is unknown, so the row is never kept.',
      'Use NOT EXISTS with a subquery matching student_id to the outer id, or keep NULL out of the NOT IN list.',
    ],
    checks: [
      {
        name: 'A guest submission does not hide anyone',
        input: [],
        sql: { seed: 'class' },
        expected: {
          rows: [
            [2, 'Bo'],
            [3, 'Cy'],
          ],
        },
      },
      {
        name: 'Students without submissions',
        input: [],
        sql: { seed: 'no-guests' },
        expected: {
          rows: [
            [1, 'Ana'],
            [3, 'Cy'],
          ],
        },
      },
      { name: 'Everyone submitted', input: [], sql: { seed: 'all-submitted' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-free-rooms',
    title: 'Find the rooms free on a night',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: roomBookings,
      seeds: {
        inn: {
          about: 'six rooms with bookings around the night of 2026-08-15',
          sql: "INSERT INTO rooms VALUES (1,'Ash'),(2,'Birch'),(3,'Cedar'),(4,'Dogwood'),(5,'Elm'),(6,'Fir'); INSERT INTO bookings VALUES (1,1,'2026-08-14','2026-08-16'),(2,2,'2026-08-10','2026-08-15'),(3,3,'2026-08-15','2026-08-17'),(4,4,'2026-08-16','2026-08-18'),(5,4,'2026-08-01','2026-08-03'),(6,6,'2026-08-01','2026-08-03'),(7,6,'2026-08-14','2026-08-20');",
        },
        'nothing-booked': { about: 'two rooms with no bookings', sql: "INSERT INTO rooms VALUES (2,'Oak'),(1,'Oak');" },
        'all-busy': {
          about: 'two rooms that are both booked over that night, one of them twice',
          sql: "INSERT INTO rooms VALUES (1,'Pine'),(2,'Yew'); INSERT INTO bookings VALUES (1,1,'2026-08-15','2026-08-16'),(2,2,'2026-08-12','2026-08-19'),(3,2,'2026-08-14','2026-08-16');",
        },
      },
      compare: 'ordered',
      columns: ['id', 'name'],
    },
    context:
      'A guest asks which rooms are free for the night of 15 August 2026. Guests leave on the end date, so that night is free again.',
    prompt:
      "Write one SELECT statement that returns id and name, in that column order, for every room that has no booking covering the night of 2026-08-15. A booking covers that night when its starts_on is on or before '2026-08-15' and its ends_on is after '2026-08-15'; the guest leaves on ends_on. Each free room appears once. Order by name ascending in SQLite's default text order, then id ascending. rooms has id INTEGER PRIMARY KEY and name TEXT NOT NULL (names can repeat). bookings has id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL, starts_on TEXT NOT NULL, and ends_on TEXT NOT NULL, both written as 'YYYY-MM-DD'. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the rooms with no booking covering the night of 2026-08-15.',
      rules: [
        "`rooms(id INTEGER PRIMARY KEY, name TEXT NOT NULL)` and `bookings(id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL)`; dates are 'YYYY-MM-DD'.",
        "A booking covers the night when starts_on is on or before '2026-08-15' and ends_on is after it. The guest leaves on ends_on.",
        "Return the columns `id`, `name` for rooms with no covering booking, each once, ordered by name in SQLite's default text order, then id.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A booking ending on 2026-08-15 leaves the room free that night.', 'A booking starting on 2026-08-15 covers it.'],
    },
    example: {
      input: 'Birch booked 2026-08-10 to 2026-08-15; Cedar booked 2026-08-15 to 2026-08-17',
      output: 'Birch is free; Cedar is not',
    },
    note: 'This is an independent rep: plan before you look at the hints. Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'Date overlap', meaning: 'two date ranges sharing at least one night' }],
    planPrompt: 'Trace Fir, which has one old booking and one covering booking, through your plan.',
    starter: 'SELECT id, name\nFROM rooms;\n',
    hints: [
      'A room is free when something does not exist: no booking of that room covers the night. Joining and filtering bookings answers a different question.',
      'A subquery can look for a covering booking of the room the outer query is looking at.',
      'Keep rooms WHERE NOT EXISTS a booking with the same room_id, starts_on on or before the night, and ends_on after it; sort by name, then id.',
    ],
    checks: [
      {
        name: 'Free rooms on the night',
        input: [],
        sql: { seed: 'inn' },
        expected: {
          rows: [
            [2, 'Birch'],
            [4, 'Dogwood'],
            [5, 'Elm'],
          ],
        },
      },
      {
        name: 'Rooms with no bookings, same name',
        input: [],
        sql: { seed: 'nothing-booked' },
        expected: {
          rows: [
            [1, 'Oak'],
            [2, 'Oak'],
          ],
        },
      },
      { name: 'Every room is booked', input: [], sql: { seed: 'all-busy' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-strong-months',
    title: 'Find the months above the monthly average',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: salesLedger,
      seeds: {
        year: {
          about: 'sales in four months of 2026 and one December 2025 sale',
          sql: "INSERT INTO sales VALUES (1,'2026-01-05',400),(2,'2026-01-20',600),(3,'2026-02-11',3500),(4,'2026-03-02',2000),(5,'2026-05-09',5000),(6,'2026-05-28',500),(7,'2025-12-30',9000);",
        },
        refunds: {
          about: 'three months of 2026, one reduced by a refund',
          sql: "INSERT INTO sales VALUES (1,'2026-06-01',4000),(2,'2026-06-15',-3000),(3,'2026-07-01',2000),(4,'2026-08-01',3000);",
        },
        'even-months': {
          about: 'two months of 2026 with equal totals',
          sql: "INSERT INTO sales VALUES (1,'2026-09-01',700),(2,'2026-10-01',700);",
        },
        'other-year': { about: 'sales only in 2025', sql: "INSERT INTO sales VALUES (1,'2025-04-01',900),(2,'2025-05-01',100);" },
      },
      compare: 'ordered',
      columns: ['month', 'total_cents'],
    },
    context: 'A shop compares the months of 2026 with each other: which months sold more than a typical month with sales?',
    prompt:
      "Write one SELECT statement on sales that returns month and total_cents, in that column order. Consider only sales dated in 2026, ignoring other years. For each month of 2026 that has at least one sale, total_cents is the sum of that month's cents, refunds included, and month is written 'YYYY-MM'. Return the months whose total is greater than the average of those monthly totals, ordered by month ascending. sales has id INTEGER PRIMARY KEY, sold_on TEXT NOT NULL written as 'YYYY-MM-DD', and cents INTEGER NOT NULL (negative for a refund). Months without sales are not part of the average. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'List the months of 2026 whose sales total is above the average monthly total.',
      rules: [
        "`sales(id INTEGER PRIMARY KEY, sold_on TEXT NOT NULL, cents INTEGER NOT NULL)`; sold_on is 'YYYY-MM-DD'; a refund is negative.",
        "Only 2026 sales count. A month's total is the sum of its sales, refunds included; months without sales are not part of the average.",
        "Return the columns `month` ('YYYY-MM') and `total_cents` for months whose total is greater than the average monthly total, ordered by month.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A month equal to the average is left out.', 'No 2026 sales gives no rows.'],
    },
    example: { input: '2026 monthly totals 1000, 3500, 2000, and 5500', output: "rows ('2026-02', 3500), ('2026-05', 5500)" },
    note: 'This is a delayed recall rep: solve it without hints after the break. Checks compare rows and their order on fresh databases.',
    vocabulary: [
      { term: 'Common table expression', meaning: 'a named query written with WITH before the main SELECT, used like a table' },
      { term: 'substr', meaning: 'a SQLite function that takes part of a text value, such as its first seven characters' },
    ],
    planPrompt: 'Write the monthly totals for the year data, their average, and which months pass.',
    starter: 'SELECT sold_on, cents\nFROM sales;\n',
    hints: [
      'This is two questions in a row: first the total of each month, then which of those totals beat their own average.',
      'The month is the first seven characters of the date. A named step can be queried twice: once for the rows and once for their average.',
      'Group 2026 sales by month into a step called monthly, then select from it where total_cents is greater than the average of monthly totals, ordered by month.',
    ],
    checks: [
      {
        name: 'Months above the average month',
        input: [],
        sql: { seed: 'year' },
        expected: {
          rows: [
            ['2026-02', 3500],
            ['2026-05', 5500],
          ],
        },
      },
      { name: 'A refund lowers a month', input: [], sql: { seed: 'refunds' }, expected: { rows: [['2026-08', 3000]] } },
      { name: 'Equal months are not above their average', input: [], sql: { seed: 'even-months' }, expected: { rows: [] } },
      { name: 'No 2026 sales', input: [], sql: { seed: 'other-year' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-create-products',
    title: 'Create a table that guards its data',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: { schema: '', seeds: { empty: { about: 'an empty database; your statements create the table', sql: '' } }, compare: 'state' },
    context:
      'A shop moves its product list into SQLite. Bad rows have slipped in before: missing names, repeated SKUs, and negative prices. This time the table itself should refuse them.',
    prompt:
      'Write the SQL that creates a table named products with exactly these columns: id INTEGER PRIMARY KEY; sku TEXT, required and unique; name TEXT, required; price_cents INTEGER, required and never negative (0 is allowed). The checks then insert rows that name their columns and expect SQLite to accept or reject each one. Each check starts from an empty database. Do not add other required columns. The checks use SQLite.',
    brief: {
      summary: 'Create a products table whose own rules reject missing names, repeated SKUs, and negative prices.',
      rules: [
        'Create a table named `products` with the columns `id`, `sku`, `name`, `price_cents`.',
        '`id` is INTEGER PRIMARY KEY. `sku` is TEXT, required and unique. `name` is TEXT and required. `price_cents` is INTEGER, required, and never negative.',
        'The checks insert rows naming their columns and expect SQLite to accept or reject each one. Each check starts from an empty database.',
        'Do not add other required columns. The checks use SQLite.',
      ],
      edgeCases: ['A price of 0 is allowed.', 'A row with no SKU or no name is rejected.'],
    },
    example: {
      input: "INSERT INTO products (sku, name, price_cents) VALUES ('B-2', 'Ink', -5)",
      output: 'rejected by a CHECK constraint',
    },
    note: 'Each check is one rule, probed with real inserts. Checks establish how SQLite treats these rows; they do not establish that the column names, types, or rule wording are the best design.',
    vocabulary: [
      { term: 'CREATE TABLE', meaning: 'the statement that defines a new table, its columns, and their rules' },
      { term: 'NOT NULL', meaning: 'a column rule that rejects a missing value' },
      { term: 'UNIQUE', meaning: 'a rule that rejects a second row with the same value; NULL values do not clash' },
      { term: 'CHECK constraint', meaning: 'a rule with a condition every stored row must meet' },
    ],
    planPrompt: 'For each column, write the rule it needs and one insert that the rule must reject.',
    starter: 'CREATE TABLE products (\n  id INTEGER PRIMARY KEY,\n  sku TEXT,\n  name TEXT,\n  price_cents INTEGER\n);\n',
    hints: [
      'Run the starter: it accepts every row. Each failed check names a row the table should have refused.',
      'Rules can follow a column’s type: one rejects a missing value, one rejects a repeat, and one tests a condition.',
      'Add NOT NULL to sku, name, and price_cents, UNIQUE to sku, and CHECK (price_cents >= 0) to price_cents.',
    ],
    checks: [
      {
        name: 'Accepts a complete product',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO products (sku, name, price_cents) VALUES ('A-1', 'Pen', 250)"],
          labels: ['a pen for 250 cents'],
        },
        expected: { probes: ['accepted'] },
      },
      {
        name: 'Accepts a free product',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO products (sku, name, price_cents) VALUES ('F-0', 'Sample', 0)"], labels: ['price 0'] },
        expected: { probes: ['accepted'] },
      },
      {
        name: 'Rejects a negative price',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO products (sku, name, price_cents) VALUES ('B-2', 'Ink', -5)"], labels: ['price -5'] },
        expected: { probes: ['rejected'] },
      },
      {
        name: 'Rejects a product with no name',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO products (sku, price_cents) VALUES ('C-3', 100)"], labels: ['a product with no name'] },
        expected: { probes: ['rejected'] },
      },
      {
        name: 'Rejects a product with no SKU',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO products (name, price_cents) VALUES ('Clip', 100)"],
          labels: ['a product with no SKU'],
        },
        expected: { probes: ['rejected'] },
      },
      {
        name: 'Rejects a repeated SKU',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            "INSERT INTO products (sku, name, price_cents) VALUES ('D-4', 'Tape', 300)",
            "INSERT INTO products (sku, name, price_cents) VALUES ('D-4', 'Glue', 400)",
          ],
          labels: ['the first D-4', 'a second product with SKU D-4'],
        },
        expected: { probes: ['accepted', 'rejected'] },
      },
    ],
  },
  {
    id: 'sql-default-values',
    title: 'Fill in values with DEFAULT',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: '',
      seeds: { empty: { about: 'an empty database; your statements create the table', sql: '' } },
      compare: 'state',
      read: [{ label: 'tasks', sql: 'SELECT title, status, priority FROM tasks ORDER BY id' }],
    },
    context:
      'A to-do app adds tasks by title alone. Every new task should start open with a middle priority, and odd values should be refused.',
    prompt:
      "Write the SQL that creates a table named tasks with exactly these columns: id INTEGER PRIMARY KEY; title TEXT, required; status TEXT, required, either 'open' or 'done', and 'open' when an insert leaves it out; priority INTEGER, required, from 1 to 5, and 3 when an insert leaves it out. The checks insert rows naming their columns, expect SQLite to accept or reject each one, and then read title, status, and priority back in id order. An insert that writes NULL explicitly is not leaving the column out. Each check starts from an empty database. The checks use SQLite.",
    brief: {
      summary: 'Create a tasks table where a new task starts open with priority 3, and odd values are refused.',
      rules: [
        'Create a table named `tasks` with the columns `id` (INTEGER PRIMARY KEY), `title`, `status`, `priority`.',
        "`title` is TEXT and required. `status` is TEXT, required, 'open' or 'done', and 'open' when an insert leaves it out.",
        '`priority` is INTEGER, required, from 1 to 5, and 3 when an insert leaves it out.',
        'The checks insert rows naming their columns, then read title, status, and priority back. Each check starts from an empty database.',
      ],
      edgeCases: ['Writing NULL explicitly is not leaving a column out, and NULL is rejected.', 'Priority 5 is allowed; 0 and 6 are not.'],
    },
    example: { input: "INSERT INTO tasks (title) VALUES ('Write report')", output: "stored as ('Write report', 'open', 3)" },
    note: 'Checks establish how SQLite treats these rows and what it stores. They do not establish the best default for your own app.',
    vocabulary: [{ term: 'DEFAULT', meaning: 'the value a column gets when an insert leaves it out' }],
    planPrompt: 'For status and priority, write the default, the allowed values, and what an explicit NULL should do.',
    starter: 'CREATE TABLE tasks (\n  id INTEGER PRIMARY KEY,\n  title TEXT NOT NULL,\n  status TEXT,\n  priority INTEGER\n);\n',
    hints: [
      'A default fills a column only when the insert does not mention it. Rules about allowed values are separate.',
      'DEFAULT gives the value; CHECK limits the values; NOT NULL refuses an explicit NULL, which a default does not replace.',
      "Give status DEFAULT 'open', NOT NULL, and CHECK (status IN ('open', 'done')); give priority DEFAULT 3, NOT NULL, and CHECK (priority BETWEEN 1 AND 5).",
    ],
    checks: [
      {
        name: 'A new task starts open with priority 3',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO tasks (title) VALUES ('Write report')"], labels: ['a task with only a title'] },
        expected: { probes: ['accepted'], tasks: [['Write report', 'open', 3]] },
      },
      {
        name: 'Given values are kept',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO tasks (title, status, priority) VALUES ('Ship', 'done', 1)"],
          labels: ['a done task with priority 1'],
        },
        expected: { probes: ['accepted'], tasks: [['Ship', 'done', 1]] },
      },
      {
        name: 'Rejects an unknown status',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO tasks (title, status) VALUES ('Plan', 'blocked')"], labels: ["status 'blocked'"] },
        expected: { probes: ['rejected'], tasks: [] },
      },
      {
        name: 'Priority stays from 1 to 5',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            "INSERT INTO tasks (title, priority) VALUES ('Edge', 5)",
            "INSERT INTO tasks (title, priority) VALUES ('Low', 0)",
            "INSERT INTO tasks (title, priority) VALUES ('High', 6)",
          ],
          labels: ['priority 5', 'priority 0', 'priority 6'],
        },
        expected: { probes: ['accepted', 'rejected', 'rejected'], tasks: [['Edge', 'open', 5]] },
      },
      {
        name: 'An explicit NULL status is rejected',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO tasks (title, status) VALUES ('Vague', NULL)"], labels: ['status NULL'] },
        expected: { probes: ['rejected'], tasks: [] },
      },
    ],
  },
  {
    id: 'sql-strict-types',
    title: 'Make SQLite enforce column types',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: '',
      seeds: { empty: { about: 'an empty database; your statements create the table', sql: '' } },
      compare: 'state',
      read: [{ label: 'readings', sql: 'SELECT sensor, celsius, typeof(celsius) FROM readings ORDER BY id' }],
    },
    context:
      "A greenhouse logs temperatures. Someone once stored the word 'warm' in the temperature column, and SQLite kept it. The new table should refuse values that are not numbers.",
    prompt:
      "Write the SQL that creates a table named readings with exactly these columns: id INTEGER PRIMARY KEY; sensor TEXT, required; celsius REAL, required. SQLite normally stores any value in any column, so make the table enforce its declared types: a celsius value that is not a number must be rejected, while whole numbers and numeric text such as '19.5' are stored as real numbers. The checks insert rows naming their columns, expect SQLite to accept or reject each one, and read sensor, celsius, and the stored type of celsius back in id order. Each check starts from an empty database. The checks use SQLite 3.49.",
    brief: {
      summary: 'Create a readings table that refuses a temperature that is not a number.',
      rules: [
        'Create a table named `readings` with `id` (INTEGER PRIMARY KEY), `sensor` (TEXT, required), and `celsius` (REAL, required).',
        "Make the table enforce its declared types: a celsius value such as 'warm' is rejected.",
        "Whole numbers and numeric text such as '19.5' are accepted and stored as real numbers.",
        'The checks insert rows naming their columns, then read the values and the stored type of celsius back. Each check starts from an empty database; the checks use SQLite 3.49.',
      ],
      edgeCases: ['Without type enforcement, SQLite would store the text.'],
    },
    example: { input: "INSERT INTO readings (sensor, celsius) VALUES ('north', 'warm')", output: 'rejected' },
    note: 'SQLite gives columns a type affinity rather than a fixed type unless a table is declared STRICT; other databases enforce types by default. Checks establish SQLite 3.49 behavior for these rows.',
    vocabulary: [
      {
        term: 'Type affinity',
        meaning: "SQLite's preferred type for a column, which converts values when it can but does not reject others",
      },
      { term: 'STRICT table', meaning: 'a SQLite table that rejects values that cannot be stored as the declared column type' },
    ],
    planPrompt: 'Predict what the starter stores for each insert, including the type of celsius.',
    starter: 'CREATE TABLE readings (\n  id INTEGER PRIMARY KEY,\n  sensor TEXT NOT NULL,\n  celsius REAL NOT NULL\n);\n',
    hints: [
      "Run the starter: it accepts 'warm' and stores it as text in a REAL column. The rules already in place cannot catch it.",
      'SQLite has a table option, written after the closing bracket of CREATE TABLE, that turns declared types into enforced types.',
      'End the statement with ) STRICT; a CHECK with typeof would also work but must list every type rule by hand.',
    ],
    checks: [
      {
        name: 'Accepts a number',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO readings (sensor, celsius) VALUES ('north', 21.5)"], labels: ['21.5'] },
        expected: { probes: ['accepted'], readings: [['north', 21.5, 'real']] },
      },
      {
        name: 'Rejects text that is not a number',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO readings (sensor, celsius) VALUES ('south', 'warm')"], labels: ["the text 'warm'"] },
        expected: { probes: ['rejected'], readings: [] },
      },
      {
        name: 'Whole numbers and numeric text become real numbers',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            "INSERT INTO readings (sensor, celsius) VALUES ('east', 20)",
            "INSERT INTO readings (sensor, celsius) VALUES ('west', '19.5')",
          ],
          labels: ['20', "the text '19.5'"],
        },
        expected: {
          probes: ['accepted', 'accepted'],
          readings: [
            ['east', 20, 'real'],
            ['west', 19.5, 'real'],
          ],
        },
      },
      {
        name: 'Rejects a missing temperature',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO readings (sensor) VALUES ('roof')"], labels: ['a reading with no temperature'] },
        expected: { probes: ['rejected'], readings: [] },
      },
    ],
  },
  {
    id: 'sql-create-memberships',
    title: 'Link members and clubs',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: '',
      seeds: { empty: { about: 'an empty database; your statements create the tables', sql: '' } },
      compare: 'state',
      foreignKeys: true,
    },
    context:
      'A sports centre records which members belong to which clubs. A member can join many clubs, but not the same club twice, and a membership must point at a real member and a real club.',
    prompt:
      "Write the SQL that creates three tables. members: id INTEGER PRIMARY KEY; email TEXT, required and unique. clubs: id INTEGER PRIMARY KEY; name TEXT, required and unique. memberships: member_id INTEGER, required, referring to members.id; club_id INTEGER, required, referring to clubs.id; joined_on TEXT, required; and no member may hold two memberships of the same club. The checks turn on SQLite's foreign key enforcement (PRAGMA foreign_keys = ON) before your SQL runs, insert rows naming their columns, and expect SQLite to accept or reject each one. Each check starts from an empty database. The checks use SQLite.",
    brief: {
      summary: 'Create members, clubs, and memberships so that every membership points at a real member and club, once.',
      rules: [
        '`members`: `id` INTEGER PRIMARY KEY, `email` TEXT required and unique. `clubs`: `id` INTEGER PRIMARY KEY, `name` TEXT required and unique.',
        '`memberships`: `member_id` INTEGER required, referring to members.id; `club_id` INTEGER required, referring to clubs.id; `joined_on` TEXT required.',
        'No member may hold two memberships of the same club.',
        "The checks turn on SQLite's foreign key enforcement before your SQL runs, then insert rows naming their columns. Each check starts from an empty database.",
      ],
      edgeCases: ['One member in two different clubs is fine.', 'A membership for a member or club that does not exist is rejected.'],
    },
    example: {
      input: 'a membership for member 9, who does not exist',
      output: 'rejected by the foreign key',
    },
    note: 'This is an independent rep: plan before you look at the hints. SQLite enforces foreign keys only when PRAGMA foreign_keys = ON is set on the connection; the checks set it, and a real application must too. Checks establish how SQLite treats these rows.',
    vocabulary: [
      { term: 'Foreign key', meaning: 'a column whose value must match a key in another table' },
      { term: 'Composite primary key', meaning: 'a primary key made of two or more columns together' },
    ],
    planPrompt: 'List every rule in the brief, the table it belongs to, and how you will state it.',
    starter: '-- Create members, clubs, and memberships.\n',
    hints: [
      'Three different kinds of rule appear: required values, uniqueness, and links to other tables. The last one involves two columns at once.',
      'A REFERENCES clause links a column to another table’s key. A uniqueness rule on a pair of columns can be written after the columns.',
      'Give memberships member_id REFERENCES members(id), club_id REFERENCES clubs(id), and PRIMARY KEY (member_id, club_id), all with NOT NULL where required.',
    ],
    checks: [
      {
        name: 'Accepts a member joining two clubs',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            ...membershipSetup,
            "INSERT INTO memberships (member_id, club_id, joined_on) VALUES (1, 1, '2026-01-05')",
            "INSERT INTO memberships (member_id, club_id, joined_on) VALUES (1, 2, '2026-02-01')",
          ],
          labels: [...membershipLabels, 'Ana joining Chess', 'Ana joining Rowing'],
        },
        expected: { probes: ['accepted', 'accepted', 'accepted', 'accepted', 'accepted'] },
      },
      {
        name: 'Rejects joining the same club twice',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            ...membershipSetup,
            "INSERT INTO memberships (member_id, club_id, joined_on) VALUES (1, 1, '2026-01-05')",
            "INSERT INTO memberships (member_id, club_id, joined_on) VALUES (1, 1, '2026-03-01')",
          ],
          labels: [...membershipLabels, 'Ana joining Chess', 'Ana joining Chess again'],
        },
        expected: { probes: ['accepted', 'accepted', 'accepted', 'accepted', 'rejected'] },
      },
      {
        name: 'Rejects a membership for a member who does not exist',
        input: [],
        sql: {
          seed: 'empty',
          probes: [...membershipSetup, "INSERT INTO memberships (member_id, club_id, joined_on) VALUES (9, 1, '2026-01-05')"],
          labels: [...membershipLabels, 'a membership for member 9, who does not exist'],
        },
        expected: { probes: ['accepted', 'accepted', 'accepted', 'rejected'] },
      },
      {
        name: 'Rejects a membership for a club that does not exist',
        input: [],
        sql: {
          seed: 'empty',
          probes: [...membershipSetup, "INSERT INTO memberships (member_id, club_id, joined_on) VALUES (1, 9, '2026-01-05')"],
          labels: [...membershipLabels, 'a membership of club 9, which does not exist'],
        },
        expected: { probes: ['accepted', 'accepted', 'accepted', 'rejected'] },
      },
      {
        name: 'Rejects a repeated email',
        input: [],
        sql: {
          seed: 'empty',
          probes: [...membershipSetup, "INSERT INTO members (id, email) VALUES (2, 'ana@example.com')"],
          labels: [...membershipLabels, 'a second member with ana@example.com'],
        },
        expected: { probes: ['accepted', 'accepted', 'accepted', 'rejected'] },
      },
      {
        name: 'Rejects a membership with no date',
        input: [],
        sql: {
          seed: 'empty',
          probes: [...membershipSetup, 'INSERT INTO memberships (member_id, club_id) VALUES (1, 2)'],
          labels: [...membershipLabels, 'a membership with no joined_on date'],
        },
        expected: { probes: ['accepted', 'accepted', 'accepted', 'rejected'] },
      },
    ],
  },
  {
    id: 'sql-create-shifts',
    title: 'Design a table of work shifts',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: { schema: '', seeds: { empty: { about: 'an empty database; your statements create the table', sql: '' } }, compare: 'state' },
    context:
      'A restaurant schedules shifts. A shift must end after it starts, use a known role, and a worker cannot be booked for two shifts starting at the same time.',
    prompt:
      "Write the SQL that creates a table named shifts with exactly these columns: id INTEGER PRIMARY KEY; worker TEXT, required; role TEXT, required, one of 'cook', 'server', or 'host'; starts_at TEXT, required; ends_at TEXT, required and later than starts_at. Times are written 'YYYY-MM-DD HH:MM'. One worker cannot have two shifts with the same starts_at, but two workers can start at the same time. The checks insert rows naming their columns and expect SQLite to accept or reject each one. Each check starts from an empty database. The checks use SQLite.",
    brief: {
      summary: 'Create a shifts table that refuses impossible shifts, unknown roles, and double bookings.',
      rules: [
        'Create a table named `shifts` with `id` (INTEGER PRIMARY KEY), `worker`, `role`, `starts_at`, `ends_at`, all required TEXT apart from id.',
        "`role` is 'cook', 'server', or 'host'. `ends_at` is later than `starts_at`; times are 'YYYY-MM-DD HH:MM'.",
        'One worker cannot have two shifts with the same starts_at; two different workers can.',
        'The checks insert rows naming their columns. Each check starts from an empty database.',
      ],
      edgeCases: ['A shift that ends when it starts is rejected.'],
    },
    example: { input: "a cook shift from '2026-09-01 18:00' to '2026-09-01 17:00'", output: 'rejected' },
    note: 'This is a delayed recall rep: solve it without hints after the break. Text times compare correctly only because they are written year first with the same width. Checks establish how SQLite treats these rows.',
    vocabulary: [{ term: 'Table constraint', meaning: 'a rule written after the columns that can involve several of them' }],
    planPrompt: 'List each rule, whether it involves one column or several, and where you will write it.',
    starter: '-- Create the shifts table.\n',
    hints: [
      'Some rules concern a single column; two of them compare or combine two columns.',
      'A CHECK can compare two columns of the same row, and a uniqueness rule can cover a pair of columns.',
      "Use CHECK (role IN ('cook', 'server', 'host')), CHECK (ends_at > starts_at), and UNIQUE (worker, starts_at), with NOT NULL on every required column.",
    ],
    checks: [
      {
        name: 'Accepts a normal shift',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO shifts (worker, role, starts_at, ends_at) VALUES ('Ana', 'cook', '2026-09-01 10:00', '2026-09-01 16:00')"],
          labels: ['a cook shift from 10:00 to 16:00'],
        },
        expected: { probes: ['accepted'] },
      },
      {
        name: 'Rejects a shift that does not end after it starts',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            "INSERT INTO shifts (worker, role, starts_at, ends_at) VALUES ('Ben', 'host', '2026-09-01 18:00', '2026-09-01 17:00')",
            "INSERT INTO shifts (worker, role, starts_at, ends_at) VALUES ('Ben', 'host', '2026-09-01 18:00', '2026-09-01 18:00')",
          ],
          labels: ['a shift ending before it starts', 'a shift ending when it starts'],
        },
        expected: { probes: ['rejected', 'rejected'] },
      },
      {
        name: 'Rejects an unknown role',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            "INSERT INTO shifts (worker, role, starts_at, ends_at) VALUES ('Cy', 'manager', '2026-09-02 09:00', '2026-09-02 17:00')",
          ],
          labels: ["role 'manager'"],
        },
        expected: { probes: ['rejected'] },
      },
      {
        name: 'One worker cannot start two shifts at once',
        input: [],
        sql: {
          seed: 'empty',
          probes: [
            "INSERT INTO shifts (worker, role, starts_at, ends_at) VALUES ('Dee', 'server', '2026-09-03 12:00', '2026-09-03 15:00')",
            "INSERT INTO shifts (worker, role, starts_at, ends_at) VALUES ('Eli', 'server', '2026-09-03 12:00', '2026-09-03 15:00')",
            "INSERT INTO shifts (worker, role, starts_at, ends_at) VALUES ('Dee', 'host', '2026-09-03 12:00', '2026-09-03 14:00')",
          ],
          labels: ['Dee at 12:00', 'Eli at 12:00', 'a second shift for Dee at 12:00'],
        },
        expected: { probes: ['accepted', 'accepted', 'rejected'] },
      },
      {
        name: 'Rejects a shift with no worker',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO shifts (role, starts_at, ends_at) VALUES ('cook', '2026-09-04 08:00', '2026-09-04 12:00')"],
          labels: ['a shift with no worker'],
        },
        expected: { probes: ['rejected'] },
      },
    ],
  },
  {
    id: 'sql-update-scope',
    title: 'Update only the rows you mean',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: shopProducts,
      seeds: {
        shelf: {
          about: "five products: two active teas, an inactive tea, a mug, and a category written 'Tea'",
          sql: "INSERT INTO products VALUES (1,'Sencha','tea',800,1),(2,'Earl Grey','tea',650,1),(3,'Mug','ware',900,1),(4,'Old Oolong','tea',700,0),(5,'Chai','Tea',500,1);",
        },
        'no-tea': {
          about: 'products with no active tea',
          sql: "INSERT INTO products VALUES (1,'Mug','ware',900,1),(2,'Old Oolong','tea',700,0);",
        },
        'all-tea': {
          about: 'three active teas',
          sql: "INSERT INTO products VALUES (1,'Sencha','tea',800,1),(2,'Matcha','tea',1500,1),(3,'Rooibos','tea',0,1);",
        },
      },
      compare: 'state',
      read: [{ label: 'products', sql: 'SELECT id, category, price_cents, active FROM products ORDER BY id' }],
    },
    context:
      'A tea shop raises the price of its active teas by 50 cents. Other products, inactive teas, and anything not filed as tea keep their prices.',
    prompt:
      "Write SQL that adds 50 to price_cents for every product whose category is exactly 'tea' and whose active is 1, and changes nothing else in any row. products has id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL, and active INTEGER NOT NULL (1 or 0). The checks then read every product's id, category, price_cents, and active in id order. The checks use SQLite.",
    brief: {
      summary: 'Add 50 cents to the price of every active tea, and change nothing else.',
      rules: [
        '`products(id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL, active INTEGER NOT NULL)`; active is 1 or 0.',
        "Add 50 to price_cents only where category is exactly `'tea'` and active is 1.",
        'Change nothing else in any row. The checks read every product back in id order.',
        'The checks use SQLite.',
      ],
      edgeCases: ['An inactive tea keeps its price.', "A category written 'Tea' is not 'tea'."],
    },
    example: {
      input: "products (1, 'Sencha', 'tea', 800, 1) and (3, 'Mug', 'ware', 900, 1)",
      output: 'Sencha becomes 850; the mug stays 900',
    },
    note: 'Checks compare every stored row afterwards. They do not establish that you previewed the rows first, which is a habit worth keeping on real data.',
    vocabulary: [
      { term: 'UPDATE', meaning: 'the statement that changes values in existing rows' },
      { term: 'Scope', meaning: 'the set of rows a change applies to, set by its WHERE clause' },
    ],
    planPrompt: 'Write the SELECT that would list exactly the rows to change. Then turn it into the change.',
    starter: 'UPDATE products\nSET price_cents = price_cents + 50;\n',
    hints: [
      'Run the starter and look at the stored rows: without a WHERE clause, UPDATE changes every row in the table.',
      'The rows to change are the ones a SELECT with the same conditions would return. Text comparison is exact.',
      "Add WHERE category = 'tea' AND active = 1 to the UPDATE.",
    ],
    checks: [
      {
        name: 'Only active teas change',
        input: [],
        sql: { seed: 'shelf' },
        expected: {
          products: [
            [1, 'tea', 850, 1],
            [2, 'tea', 700, 1],
            [3, 'ware', 900, 1],
            [4, 'tea', 700, 0],
            [5, 'Tea', 500, 1],
          ],
        },
      },
      {
        name: 'Nothing to change',
        input: [],
        sql: { seed: 'no-tea' },
        expected: {
          products: [
            [1, 'ware', 900, 1],
            [2, 'tea', 700, 0],
          ],
        },
      },
      {
        name: 'Every active tea changes, even a free one',
        input: [],
        sql: { seed: 'all-tea' },
        expected: {
          products: [
            [1, 'tea', 850, 1],
            [2, 'tea', 1550, 1],
            [3, 'tea', 50, 1],
          ],
        },
      },
    ],
  },
  {
    id: 'sql-delete-scope',
    title: 'Delete only expired or revoked sessions',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: sessionTable,
      seeds: {
        logins: {
          about: 'six sessions: expired, revoked, both, and current ones, one expiring exactly at the cutoff',
          sql: "INSERT INTO sessions VALUES (1,'ana','2026-05-20 10:00',0),(2,'bo','2026-06-03 09:00',1),(3,'cy','2026-05-01 08:00',1),(4,'di','2026-06-01 00:00',0),(5,'ed','2026-07-01 12:00',0),(6,'fu','2026-05-31 23:59',0);",
        },
        'all-current': {
          about: 'two current sessions',
          sql: "INSERT INTO sessions VALUES (1,'ana','2026-06-02 10:00',0),(2,'bo','2026-08-01 10:00',0);",
        },
        empty: { about: 'no sessions', sql: '' },
      },
      compare: 'state',
      read: [{ label: 'sessions', sql: 'SELECT id, user_name FROM sessions ORDER BY id' }],
    },
    context:
      'A nightly job clears sign-in sessions that can no longer be used: those that expired before 1 June 2026 and those an administrator revoked.',
    prompt:
      "Write SQL that deletes every session whose expires_at is before '2026-06-01 00:00' or whose revoked is 1, and keeps every other session unchanged. sessions has id INTEGER PRIMARY KEY, user_name TEXT NOT NULL, expires_at TEXT NOT NULL written as 'YYYY-MM-DD HH:MM', and revoked INTEGER NOT NULL (1 or 0). The checks then read every remaining session's id and user_name in id order. The checks use SQLite.",
    brief: {
      summary: 'Delete the sessions that expired before 1 June 2026 or were revoked.',
      rules: [
        "`sessions(id INTEGER PRIMARY KEY, user_name TEXT NOT NULL, expires_at TEXT NOT NULL, revoked INTEGER NOT NULL)`; expires_at is 'YYYY-MM-DD HH:MM'; revoked is 1 or 0.",
        "Delete a session when its expires_at is before '2026-06-01 00:00', or when revoked is 1.",
        'Keep every other session unchanged. The checks read the remaining sessions back in id order.',
        'The checks use SQLite.',
      ],
      edgeCases: ["A session expiring exactly at '2026-06-01 00:00' is kept unless revoked."],
    },
    example: {
      input: "sessions expiring '2026-05-20 10:00' and '2026-07-01 12:00', neither revoked",
      output: 'only the July session remains',
    },
    note: 'Checks compare the remaining rows. They do not establish that you previewed the rows with a SELECT first.',
    vocabulary: [{ term: 'DELETE', meaning: 'the statement that removes rows; without WHERE it removes every row' }],
    planPrompt: 'Write the SELECT that lists exactly the sessions to delete, and check it against session 4.',
    starter: 'DELETE FROM sessions\nWHERE revoked = 1;\n',
    hints: [
      'The starter handles one of the two reasons. A session goes when either reason applies.',
      'Text times written year first compare correctly; "before" the cutoff means strictly less.',
      "Delete WHERE expires_at < '2026-06-01 00:00' OR revoked = 1.",
    ],
    checks: [
      {
        name: 'Expired and revoked sessions go',
        input: [],
        sql: { seed: 'logins' },
        expected: {
          sessions: [
            [4, 'di'],
            [5, 'ed'],
          ],
        },
      },
      {
        name: 'Current sessions stay',
        input: [],
        sql: { seed: 'all-current' },
        expected: {
          sessions: [
            [1, 'ana'],
            [2, 'bo'],
          ],
        },
      },
      { name: 'No sessions to delete', input: [], sql: { seed: 'empty' }, expected: { sessions: [] } },
    ],
  },
  {
    id: 'sql-upsert-stock',
    title: 'Add a delivery to stock',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: stockTables,
      seeds: {
        delivery: {
          about: 'stock of A-1 (5) and B-2 (0), and a delivery of A-1 and a new C-3',
          sql: "INSERT INTO stock VALUES ('A-1',5),('B-2',0); INSERT INTO incoming VALUES (1,'A-1',3),(2,'C-3',4);",
        },
        'repeated-sku': {
          about: 'a delivery listing A-1 twice and a new C-3 twice',
          sql: "INSERT INTO stock VALUES ('A-1',5),('B-2',0); INSERT INTO incoming VALUES (1,'C-3',1),(2,'A-1',1),(3,'C-3',2),(4,'A-1',1);",
        },
        'empty-delivery': { about: 'stock and no incoming rows', sql: "INSERT INTO stock VALUES ('A-1',5),('B-2',0);" },
      },
      compare: 'state',
      read: [
        { label: 'stock', sql: 'SELECT sku, units FROM stock ORDER BY sku' },
        { label: 'incoming', sql: 'SELECT id, sku, units FROM incoming ORDER BY id' },
      ],
    },
    context:
      'A warehouse receives a delivery list. A product it already stocks gains the delivered units; a new product gets its own stock row.',
    prompt:
      'Write SQL that adds every row of incoming to stock: for a sku already in stock, add the incoming units to its units; for a sku not yet in stock, create its row with those units. incoming may list the same sku more than once, and every listing counts. Leave incoming unchanged. stock has sku TEXT PRIMARY KEY and units INTEGER NOT NULL CHECK (units >= 0). incoming has id INTEGER PRIMARY KEY, sku TEXT NOT NULL, and units INTEGER NOT NULL CHECK (units > 0). The checks then read stock in sku order and incoming in id order. The checks use SQLite.',
    brief: {
      summary: 'Add each delivery row to stock, creating rows for new products.',
      rules: [
        '`stock(sku TEXT PRIMARY KEY, units INTEGER NOT NULL CHECK (units >= 0))` and `incoming(id INTEGER PRIMARY KEY, sku TEXT NOT NULL, units INTEGER NOT NULL CHECK (units > 0))`.',
        'A sku already in stock gains the incoming units; a new sku gets a stock row with them. Every listing of a repeated sku counts.',
        'Leave incoming unchanged. The checks read stock and incoming back.',
        'The checks use SQLite.',
      ],
      edgeCases: ['A new sku listed twice ends with the sum of both listings.', 'An empty delivery changes nothing.'],
    },
    example: { input: 'stock A-1 = 5; incoming A-1 3 and C-3 4', output: 'stock A-1 = 8, B-2 = 0, C-3 = 4' },
    note: 'This is an independent rep: plan before you look at the hints. Checks compare the stored rows afterwards.',
    vocabulary: [
      { term: 'Upsert', meaning: 'insert a row, or update it if a row with the same key already exists' },
      { term: 'excluded', meaning: 'in an ON CONFLICT clause, the row that was about to be inserted' },
    ],
    planPrompt: 'Predict the stock rows after the repeated-sku delivery, then the statements that produce them.',
    starter: '-- Add the incoming rows to stock.\n',
    hints: [
      'Each incoming row either changes an existing stock row or creates one. Decide what happens when a new sku appears for the second time.',
      'An INSERT can take its rows from a SELECT, and SQLite can turn a key conflict into an update that refers to the incoming value.',
      'INSERT INTO stock (sku, units) SELECT sku, units FROM incoming WHERE true ON CONFLICT(sku) DO UPDATE SET units = units + excluded.units. SQLite needs the WHERE true there.',
    ],
    checks: [
      {
        name: 'Known products gain units, new ones are added',
        input: [],
        sql: { seed: 'delivery' },
        expected: {
          stock: [
            ['A-1', 8],
            ['B-2', 0],
            ['C-3', 4],
          ],
          incoming: [
            [1, 'A-1', 3],
            [2, 'C-3', 4],
          ],
        },
      },
      {
        name: 'A product listed twice counts twice',
        input: [],
        sql: { seed: 'repeated-sku' },
        expected: {
          stock: [
            ['A-1', 7],
            ['B-2', 0],
            ['C-3', 3],
          ],
          incoming: [
            [1, 'C-3', 1],
            [2, 'A-1', 1],
            [3, 'C-3', 2],
            [4, 'A-1', 1],
          ],
        },
      },
      {
        name: 'An empty delivery changes nothing',
        input: [],
        sql: { seed: 'empty-delivery' },
        expected: {
          stock: [
            ['A-1', 5],
            ['B-2', 0],
          ],
          incoming: [],
        },
      },
    ],
  },
  {
    id: 'sql-archive-orders',
    title: 'Move old orders to an archive',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: archiveTables,
      seeds: {
        'year-end': {
          about: 'four orders around the new year and one order already archived',
          sql: "INSERT INTO orders VALUES (1,'2025-11-30',500),(2,'2025-12-31',700),(3,'2026-01-01',900),(4,'2026-02-10',300); INSERT INTO archived_orders VALUES (90,'2025-01-15',100);",
        },
        'nothing-old': {
          about: 'only 2026 orders and an empty archive',
          sql: "INSERT INTO orders VALUES (1,'2026-03-01',250),(2,'2026-04-02',350);",
        },
        'all-old': { about: 'only 2025 orders', sql: "INSERT INTO orders VALUES (5,'2025-06-01',400),(6,'2025-07-15',600);" },
      },
      compare: 'state',
      read: [
        { label: 'orders', sql: 'SELECT id, placed_on, cents FROM orders ORDER BY id' },
        { label: 'archived_orders', sql: 'SELECT id, placed_on, cents FROM archived_orders ORDER BY id' },
      ],
    },
    context:
      'At the start of 2026 a shop moves last year’s orders into an archive table, so the live table stays small. Each order must end up in exactly one of the two tables.',
    prompt:
      "Write SQL that moves every order placed before 2026-01-01 from orders into archived_orders, keeping its id, placed_on, and cents, so that each order is in exactly one of the two tables afterwards. Orders already in archived_orders stay there. orders and archived_orders both have id INTEGER PRIMARY KEY, placed_on TEXT NOT NULL written as 'YYYY-MM-DD', and cents INTEGER NOT NULL. The checks then read both tables in id order. The checks use SQLite.",
    brief: {
      summary: 'Move the orders placed before 2026 into archived_orders, so each order is in exactly one table.',
      rules: [
        "`orders(id INTEGER PRIMARY KEY, placed_on TEXT NOT NULL, cents INTEGER NOT NULL)`, and `archived_orders` with the same columns; placed_on is 'YYYY-MM-DD'.",
        'Move every order placed before 2026-01-01 into archived_orders with the same id, placed_on, and cents.',
        'Afterwards each order is in exactly one table. Orders already archived stay.',
        'The checks read both tables back. The checks use SQLite.',
      ],
      edgeCases: ['An order from 2026-01-01 stays in orders.', 'Nothing old: both tables keep their rows.'],
    },
    example: { input: "orders placed '2025-12-31' and '2026-01-01'", output: 'the first moves to archived_orders; the second stays' },
    note: 'This is a delayed recall rep: solve it without hints after the break. Checks read both tables after your SQL; they cannot see whether a transaction wrapped the steps, which belongs in your self-review.',
    vocabulary: [{ term: 'INSERT … SELECT', meaning: 'an insert whose rows come from a query' }],
    planPrompt: 'List the steps, the condition each uses, and what a failure between them would leave behind.',
    starter: '-- Move last year’s orders into archived_orders.\n',
    hints: [
      'Moving is two changes: copying rows into the archive and removing them from orders. Both must pick exactly the same rows.',
      'A row can be inserted from a SELECT, and the same condition can drive the delete. A transaction makes the pair all or nothing.',
      "BEGIN; INSERT INTO archived_orders SELECT id, placed_on, cents FROM orders WHERE placed_on < '2026-01-01'; DELETE FROM orders WHERE placed_on < '2026-01-01'; COMMIT;",
    ],
    checks: [
      {
        name: 'Last year’s orders move, this year’s stay',
        input: [],
        sql: { seed: 'year-end' },
        expected: {
          orders: [
            [3, '2026-01-01', 900],
            [4, '2026-02-10', 300],
          ],
          archived_orders: [
            [1, '2025-11-30', 500],
            [2, '2025-12-31', 700],
            [90, '2025-01-15', 100],
          ],
        },
      },
      {
        name: 'Nothing old to move',
        input: [],
        sql: { seed: 'nothing-old' },
        expected: {
          orders: [
            [1, '2026-03-01', 250],
            [2, '2026-04-02', 350],
          ],
          archived_orders: [],
        },
      },
      {
        name: 'Every order is old',
        input: [],
        sql: { seed: 'all-old' },
        expected: {
          orders: [],
          archived_orders: [
            [5, '2025-06-01', 400],
            [6, '2025-07-15', 600],
          ],
        },
      },
    ],
  },
  {
    id: 'sql-rank-scores',
    title: 'Number rows within each group',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: arcadeScores,
      seeds: {
        arcade: {
          about: 'five scores on two levels, with a tie on level 1',
          sql: "INSERT INTO scores VALUES (1,'Cy',1,300),(2,'Bo',1,500),(3,'Ana',1,300),(4,'Di',2,900),(5,'Ed',2,100);",
        },
        'one-level': { about: 'three scores on one level', sql: "INSERT INTO scores VALUES (1,'Zia',3,40),(2,'Yan',3,70),(3,'Xu',3,55);" },
        empty: { about: 'no scores', sql: '' },
      },
      compare: 'ordered',
      columns: ['level', 'player', 'points', 'place'],
    },
    context: 'An arcade shows a leaderboard per level: every score gets a place number, 1 for the best on that level.',
    prompt:
      "Write one SELECT statement on scores that returns level, player, points, and place, in that column order, for every score. place numbers the scores within their own level from 1, by points from highest to lowest, and equal points by player ascending in SQLite's default text order; every score gets a different place. Order the result by level ascending, then place ascending. scores has id INTEGER PRIMARY KEY, player TEXT NOT NULL, level INTEGER NOT NULL, and points INTEGER NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'Give every score a place within its own level: 1 for the most points.',
      rules: [
        '`scores(id INTEGER PRIMARY KEY, player TEXT NOT NULL, level INTEGER NOT NULL, points INTEGER NOT NULL)`.',
        "place numbers scores within their level from 1, by points descending, then player ascending in SQLite's default text order. Every score gets a different place.",
        'Return the columns `level`, `player`, `points`, `place`, ordered by level, then place.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['Equal points still get different places, decided by name.', 'Each level starts again at 1.'],
    },
    example: { input: 'level 1 scores: Ana 300, Bo 500, Cy 300', output: "(1, 'Bo', 500, 1), (1, 'Ana', 300, 2), (1, 'Cy', 300, 3)" },
    note: 'Checks compare rows and their order on fresh databases.',
    vocabulary: [
      {
        term: 'Window function',
        meaning: 'a function computed over a set of rows related to the current row, without merging them into one',
      },
      { term: 'PARTITION BY', meaning: 'splits the rows a window function sees into groups, like GROUP BY without collapsing them' },
      { term: 'ROW_NUMBER', meaning: 'a window function numbering rows 1, 2, 3 in the window’s order, with no ties' },
    ],
    planPrompt: 'Write the places you expect on level 1, then what restarts the numbering and what orders it.',
    starter: 'SELECT level, player, points\nFROM scores;\n',
    hints: [
      'GROUP BY would merge each level into one row, but every score must stay. You need numbering that looks at the other rows of the same level.',
      'A window function with OVER (PARTITION BY …) restarts for each group, and its own ORDER BY decides the numbering.',
      'ROW_NUMBER() OVER (PARTITION BY level ORDER BY points DESC, player) AS place, then ORDER BY level, place.',
    ],
    checks: [
      {
        name: 'Places within each level',
        input: [],
        sql: { seed: 'arcade' },
        expected: {
          rows: [
            [1, 'Bo', 500, 1],
            [1, 'Ana', 300, 2],
            [1, 'Cy', 300, 3],
            [2, 'Di', 900, 1],
            [2, 'Ed', 100, 2],
          ],
        },
      },
      {
        name: 'One level, no ties',
        input: [],
        sql: { seed: 'one-level' },
        expected: {
          rows: [
            [3, 'Yan', 70, 1],
            [3, 'Xu', 55, 2],
            [3, 'Zia', 40, 3],
          ],
        },
      },
      { name: 'No scores', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-competition-rank',
    title: 'Rank with shared places',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: raceResults,
      seeds: {
        race: {
          about: 'five runners with two pairs of equal times',
          sql: "INSERT INTO results VALUES (1,'Ana',61),(2,'Bo',59),(3,'Cy',61),(4,'Di',70),(5,'Ed',59);",
        },
        'all-different': {
          about: 'three runners with different times',
          sql: "INSERT INTO results VALUES (1,'Kai',80),(2,'Lu',75),(3,'Mo',90);",
        },
        'all-equal': {
          about: 'three runners with the same time',
          sql: "INSERT INTO results VALUES (1,'Pip',66),(2,'Ola',66),(3,'Ned',66);",
        },
      },
      compare: 'ordered',
      columns: ['runner', 'seconds', 'rank'],
    },
    context:
      'A race result lists runners fastest first. Equal times share a rank, and the next rank skips as many places as were shared, so two runners in first are followed by third.',
    prompt:
      "Write one SELECT statement on results that returns runner, seconds, and rank, in that column order, for every runner. rank is 1 plus the number of runners with a strictly lower time, so equal times share a rank and the next rank skips (1, 1, 3). Order the result by rank ascending, then runner ascending in SQLite's default text order. results has id INTEGER PRIMARY KEY, runner TEXT NOT NULL, and seconds INTEGER NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'Rank runners by time; equal times share a rank and the next rank skips.',
      rules: [
        '`results(id INTEGER PRIMARY KEY, runner TEXT NOT NULL, seconds INTEGER NOT NULL)`.',
        'rank is 1 plus the number of runners with a strictly lower time: equal times share a rank, and the next rank skips (1, 1, 3).',
        "Return the columns `runner`, `seconds`, `rank`, ordered by rank, then runner ascending in SQLite's default text order.",
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['All equal times share rank 1.'],
    },
    example: { input: 'Bo 59, Ed 59, Ana 61', output: "('Bo', 59, 1), ('Ed', 59, 1), ('Ana', 61, 3)" },
    note: 'Checks compare rows and their order on fresh databases.',
    vocabulary: [
      { term: 'RANK', meaning: 'a window function where equal values share a rank and the next rank skips' },
      { term: 'DENSE_RANK', meaning: 'a window function where equal values share a rank and the next rank does not skip' },
    ],
    planPrompt: 'Write the ranks for the race data, then say which of the three numbering functions produces them.',
    starter: 'SELECT runner, seconds\nFROM results;\n',
    hints: [
      'Three numbering styles exist: always different numbers, shared numbers that skip, and shared numbers that do not skip.',
      'The window needs only an order, by seconds; there are no groups here.',
      'RANK() OVER (ORDER BY seconds) AS rank, then ORDER BY rank, runner.',
    ],
    checks: [
      {
        name: 'Equal times share a rank, the next one skips',
        input: [],
        sql: { seed: 'race' },
        expected: {
          rows: [
            ['Bo', 59, 1],
            ['Ed', 59, 1],
            ['Ana', 61, 3],
            ['Cy', 61, 3],
            ['Di', 70, 5],
          ],
        },
      },
      {
        name: 'Different times',
        input: [],
        sql: { seed: 'all-different' },
        expected: {
          rows: [
            ['Lu', 75, 1],
            ['Kai', 80, 2],
            ['Mo', 90, 3],
          ],
        },
      },
      {
        name: 'Everyone tied',
        input: [],
        sql: { seed: 'all-equal' },
        expected: {
          rows: [
            ['Ned', 66, 1],
            ['Ola', 66, 1],
            ['Pip', 66, 1],
          ],
        },
      },
    ],
  },
  {
    id: 'sql-day-over-day',
    title: 'Compare each day with the one before',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: dailyVisits,
      seeds: {
        week: {
          about: 'five recorded days with one day missing',
          sql: "INSERT INTO visits VALUES ('2026-03-01',120),('2026-03-02',150),('2026-03-03',90),('2026-03-05',90),('2026-03-06',200);",
        },
        'one-day': { about: 'a single recorded day', sql: "INSERT INTO visits VALUES ('2026-04-01',75);" },
        'out-of-order': {
          about: 'three days inserted out of date order',
          sql: "INSERT INTO visits VALUES ('2026-05-03',30),('2026-05-01',10),('2026-05-02',25);",
        },
      },
      compare: 'ordered',
      columns: ['day', 'visitors', 'change'],
    },
    context: 'A site report shows each day’s visitors and how much that changed from the previous recorded day.',
    prompt:
      "Write one SELECT statement on visits that returns day, visitors, and change, in that column order, for every recorded day. change is visitors minus the visitors of the previous recorded day in date order, or NULL for the first recorded day. A missing calendar day is skipped: compare with the previous row that exists. Order the result by day ascending. visits has day TEXT PRIMARY KEY written as 'YYYY-MM-DD' and visitors INTEGER NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'Show each day’s visitors and the change from the previous recorded day.',
      rules: [
        "`visits(day TEXT PRIMARY KEY, visitors INTEGER NOT NULL)`; day is 'YYYY-MM-DD'.",
        'change is visitors minus the previous recorded day’s visitors in date order, or NULL for the first day. A missing calendar day is skipped.',
        'Return the columns `day`, `visitors`, `change`, ordered by day.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['The first day has change NULL.', 'Rows may have been inserted out of date order.'],
    },
    example: { input: "'2026-03-01' 120, '2026-03-02' 150", output: "('2026-03-01', 120, NULL), ('2026-03-02', 150, 30)" },
    note: 'Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'LAG', meaning: 'a window function that reads a value from an earlier row in the window’s order' }],
    planPrompt: 'Write the change for 2026-03-05 and say which row it is compared with.',
    starter: 'SELECT day, visitors\nFROM visits;\n',
    hints: [
      'Each row needs a value from another row: the one just before it in date order.',
      'A window function can look back a row in a stated order, and returns NULL when there is no row before.',
      'visitors - LAG(visitors) OVER (ORDER BY day) AS change, ordered by day.',
    ],
    checks: [
      {
        name: 'Change from the previous recorded day',
        input: [],
        sql: { seed: 'week' },
        expected: {
          rows: [
            ['2026-03-01', 120, null],
            ['2026-03-02', 150, 30],
            ['2026-03-03', 90, -60],
            ['2026-03-05', 90, 0],
            ['2026-03-06', 200, 110],
          ],
        },
      },
      { name: 'One day has no change', input: [], sql: { seed: 'one-day' }, expected: { rows: [['2026-04-01', 75, null]] } },
      {
        name: 'Date order, not insert order',
        input: [],
        sql: { seed: 'out-of-order' },
        expected: {
          rows: [
            ['2026-05-01', 10, null],
            ['2026-05-02', 25, 15],
            ['2026-05-03', 30, 5],
          ],
        },
      },
    ],
  },
  {
    id: 'sql-running-balance',
    title: 'Keep a running balance',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: ledgerTable,
      seeds: {
        'two-accounts': {
          about: 'six entries in two accounts, two of them on the same day',
          sql: "INSERT INTO ledger VALUES (1,'A','2026-01-02',1000),(2,'A','2026-01-05',-300),(3,'A','2026-01-01',50),(4,'B','2026-01-03',500),(5,'A','2026-01-05',200),(6,'B','2026-01-04',-100);",
        },
        'one-account': {
          about: 'three entries on different days',
          sql: "INSERT INTO ledger VALUES (1,'C','2026-02-01',400),(2,'C','2026-02-03',-150),(3,'C','2026-02-02',50);",
        },
        empty: { about: 'no entries', sql: '' },
      },
      compare: 'ordered',
      columns: ['account', 'id', 'cents', 'balance'],
    },
    context: 'A bank statement shows every entry of an account with the balance right after it, oldest first.',
    prompt:
      "Write one SELECT statement on ledger that returns account, id, cents, and balance, in that column order, for every entry. balance is the sum of cents of all entries of the same account up to and including this one, where entries are ordered by posted_on and, on the same day, by id. Each account starts from 0. Order the result by account ascending, then posted_on, then id. ledger has id INTEGER PRIMARY KEY, account TEXT NOT NULL, posted_on TEXT NOT NULL written as 'YYYY-MM-DD', and cents INTEGER NOT NULL (negative for a withdrawal). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'Show each ledger entry with its account’s balance just after it.',
      rules: [
        "`ledger(id INTEGER PRIMARY KEY, account TEXT NOT NULL, posted_on TEXT NOT NULL, cents INTEGER NOT NULL)`; posted_on is 'YYYY-MM-DD'; a withdrawal is negative.",
        'balance sums the cents of the same account up to and including this entry, ordered by posted_on, then id on the same day. Each account starts from 0.',
        'Return the columns `account`, `id`, `cents`, `balance`, ordered by account, then posted_on, then id.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['Two entries on the same day get different balances, in id order.'],
    },
    example: { input: 'account A: 50 on 2026-01-01, 1000 on 2026-01-02', output: "('A', 3, 50, 50), ('A', 1, 1000, 1050)" },
    note: 'This is an independent rep: plan before you look at the hints. Checks compare rows and their order on fresh databases.',
    vocabulary: [
      { term: 'Running sum', meaning: 'a sum that grows row by row, including every earlier row' },
      { term: 'Window frame', meaning: 'the rows a window function adds up for the current row, such as all earlier rows' },
    ],
    planPrompt: 'Write the two balances you expect on 2026-01-05 for account A, and what decides their order.',
    starter: 'SELECT account, id, cents\nFROM ledger\nORDER BY account, posted_on, id;\n',
    hints: [
      'Each balance depends on all earlier entries of the same account, so every row needs a sum over other rows.',
      'With a window ORDER BY, rows that tie on every ordering key are added up together. Make the order complete, or count rows rather than values.',
      'SUM(cents) OVER (PARTITION BY account ORDER BY posted_on, id) AS balance.',
    ],
    checks: [
      {
        name: 'Balances per account, same-day entries in id order',
        input: [],
        sql: { seed: 'two-accounts' },
        expected: {
          rows: [
            ['A', 3, 50, 50],
            ['A', 1, 1000, 1050],
            ['A', 2, -300, 750],
            ['A', 5, 200, 950],
            ['B', 4, 500, 500],
            ['B', 6, -100, 400],
          ],
        },
      },
      {
        name: 'One account in date order',
        input: [],
        sql: { seed: 'one-account' },
        expected: {
          rows: [
            ['C', 1, 400, 400],
            ['C', 3, 50, 450],
            ['C', 2, -150, 300],
          ],
        },
      },
      { name: 'No entries', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-top-two-per-region',
    title: 'Keep the top two in each region',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: regionReps,
      seeds: {
        company: {
          about: 'eight sales reps in three regions, with ties in two of them',
          sql: "INSERT INTO sales_reps VALUES (1,'Cy','North',900),(2,'Bo','North',1200),(3,'Ana','North',900),(4,'Di','North',300),(5,'Ed','South',500),(6,'Fi','West',700),(7,'Gu','West',800),(8,'Ha','West',800);",
        },
        'one-region': {
          about: 'three reps in one region',
          sql: "INSERT INTO sales_reps VALUES (1,'Kim','East',100),(2,'Lee','East',300),(3,'Max','East',200);",
        },
        empty: { about: 'no sales reps', sql: '' },
      },
      compare: 'ordered',
      columns: ['region', 'name', 'revenue_cents'],
    },
    context:
      'A quarterly review invites the two best sales reps of each region. When two reps tie, the one whose name comes first alphabetically is chosen.',
    prompt:
      "Write one SELECT statement on sales_reps that returns region, name, and revenue_cents, in that column order, for the top two reps of each region: highest revenue_cents first, and equal revenue by name ascending in SQLite's default text order, so exactly two reps per region are kept (fewer if the region has fewer). Order the result by region ascending, then revenue_cents from highest to lowest, then name. sales_reps has id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL, and revenue_cents INTEGER NOT NULL. Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary: 'Keep the two best sales reps of each region.',
      rules: [
        '`sales_reps(id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL, revenue_cents INTEGER NOT NULL)`.',
        "Within each region, order reps by revenue_cents descending, then name ascending in SQLite's default text order, and keep the first two.",
        'Return the columns `region`, `name`, `revenue_cents`, ordered by region, then revenue_cents descending, then name.',
        'Submit a single statement that only reads data. Row order is checked.',
      ],
      edgeCases: ['A region with one rep keeps one.', 'A tie for second place keeps only the name that comes first.'],
    },
    example: { input: 'North: Bo 1200, Ana 900, Cy 900, Di 300', output: "('North', 'Bo', 1200), ('North', 'Ana', 900)" },
    note: 'This is a delayed recall rep: solve it without hints after the break. Checks compare rows and their order on fresh databases.',
    vocabulary: [{ term: 'Top-N per group', meaning: 'the first N rows of each group in a stated order' }],
    planPrompt: 'Write the rows you expect for North and West, then the steps: what is numbered, and where the cut happens.',
    starter: 'SELECT region, name, revenue_cents\nFROM sales_reps;\n',
    hints: [
      'LIMIT cuts the whole result, not each region. The cut has to follow a numbering that restarts per region.',
      'A window function cannot appear in WHERE, so number the rows in one step and filter them in the next.',
      'Number reps with ROW_NUMBER() OVER (PARTITION BY region ORDER BY revenue_cents DESC, name) in a WITH step, then keep the numbers 1 and 2.',
    ],
    checks: [
      {
        name: 'Top two per region',
        input: [],
        sql: { seed: 'company' },
        expected: {
          rows: [
            ['North', 'Bo', 1200],
            ['North', 'Ana', 900],
            ['South', 'Ed', 500],
            ['West', 'Gu', 800],
            ['West', 'Ha', 800],
          ],
        },
      },
      {
        name: 'One region',
        input: [],
        sql: { seed: 'one-region' },
        expected: {
          rows: [
            ['East', 'Lee', 300],
            ['East', 'Max', 200],
          ],
        },
      },
      { name: 'No reps', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-index-lookup',
    title: 'Index a lookup column',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: userAccounts,
      seeds: {
        members: {
          about: 'five users with different emails',
          sql: "INSERT INTO users VALUES (1,'ana@example.com','Ana'),(2,'bo@example.com','Bo'),(3,'cy@example.com','Cy'),(4,'di@example.com','Di'),(5,'ed@example.com','Ed');",
        },
        empty: { about: 'no users yet', sql: '' },
      },
      compare: 'state',
    },
    context:
      'Every sign-in looks a user up by email. Today SQLite reads every row of users to find one. An index lets it jump to the match instead.',
    prompt:
      "Write SQL that lets SQLite answer SELECT id, name FROM users WHERE email = ? by searching an index on email instead of scanning every row. Do not change the stored rows. users has id INTEGER PRIMARY KEY, email TEXT NOT NULL, and name TEXT NOT NULL. Each check runs the lookup with a literal email after your SQL, compares its rows, and reads SQLite's EXPLAIN QUERY PLAN for it: the plan must search users with an index on email and must not scan users. The checks use SQLite 3.49; a plan shows which index SQLite chose for this data, not how fast the query runs.",
    brief: {
      summary: 'Add an index so a lookup by email searches instead of reading every row.',
      rules: [
        '`users(id INTEGER PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL)`.',
        'After your SQL, the checks run `SELECT id, name FROM users WHERE email = …` with a literal email and compare its rows.',
        "SQLite's EXPLAIN QUERY PLAN for that lookup must search users with an index on email, and must not scan users.",
        'Do not change the stored rows. The checks use SQLite 3.49.',
      ],
      edgeCases: ['An email that is not stored still finds nothing.', 'The index works on an empty table too.'],
    },
    example: {
      input: 'CREATE INDEX … then the lookup for cy@example.com',
      output: 'plan: SEARCH users USING INDEX … (email=?); row (3, Cy)',
    },
    note: "A query plan is SQLite's choice for this data and version; it shows which index is used, not how fast the query runs. Checks compare the lookup's rows and its plan.",
    vocabulary: [
      { term: 'Database index', meaning: 'a sorted copy of some columns that lets the database find rows without reading them all' },
      { term: 'Query plan', meaning: 'the steps the database chooses to answer a query, shown by EXPLAIN QUERY PLAN' },
      { term: 'Full scan', meaning: 'reading every row of a table to answer a query' },
    ],
    planPrompt: 'Name the column the lookup filters on, and predict the plan line before and after your change.',
    starter:
      '-- Sign-in runs: SELECT id, name FROM users WHERE email = ?\n-- Write the statement that lets SQLite search for the email instead of scanning.\n',
    hints: [
      'Run the checks once as the starter is: the plan box shows SCAN users, which reads every row.',
      'An index is created on the column the WHERE clause compares. It needs a name of its own.',
      'CREATE INDEX users_email ON users (email);',
    ],
    checks: [
      {
        name: 'A lookup by email searches an index',
        input: [],
        sql: {
          seed: 'members',
          plan: { sql: "SELECT id, name FROM users WHERE email = 'cy@example.com'", uses: emailSearch, avoids: [scanOf('users')] },
        },
        expected: { plan: 'matches', result: [[3, 'Cy']] },
      },
      {
        name: 'An email that is not stored finds nothing',
        input: [],
        sql: {
          seed: 'members',
          plan: { sql: "SELECT id, name FROM users WHERE email = 'CY@example.com'", uses: emailSearch, avoids: [scanOf('users')] },
        },
        expected: { plan: 'matches', result: [] },
      },
      {
        name: 'The index works on an empty table',
        input: [],
        sql: {
          seed: 'empty',
          plan: { sql: "SELECT id, name FROM users WHERE email = 'ana@example.com'", uses: emailSearch, avoids: [scanOf('users')] },
        },
        expected: { plan: 'matches', result: [] },
      },
    ],
  },
  {
    id: 'sql-index-sort',
    title: 'Index a filter and its sort',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: eventLog,
      seeds: {
        log: {
          about: 'eight events: six logins and two logouts',
          sql: "INSERT INTO events VALUES (1,'login','2026-03-01 09:00'),(2,'logout','2026-03-01 17:00'),(3,'login','2026-03-02 08:30'),(4,'login','2026-03-03 10:15'),(5,'login','2026-03-04 07:45'),(6,'logout','2026-03-04 18:00'),(7,'login','2026-03-05 09:05'),(8,'login','2026-03-06 11:20');",
        },
        empty: { about: 'no events', sql: '' },
      },
      compare: 'state',
    },
    context:
      'An admin screen shows the five most recent logins. SQLite currently finds the logins and then sorts them in a temporary structure every time.',
    prompt:
      "Write SQL that lets SQLite answer SELECT id FROM events WHERE kind = ? ORDER BY happened_at DESC LIMIT 5 by searching an index on kind and reading the rows already in happened_at order, with no separate sort. Do not change the stored rows. events has id INTEGER PRIMARY KEY, kind TEXT NOT NULL, and happened_at TEXT NOT NULL written as 'YYYY-MM-DD HH:MM'. Each check runs the query with a literal kind after your SQL, compares its rows, and reads SQLite's EXPLAIN QUERY PLAN: it must search events by kind, must not scan events, and must not use a temporary B-tree for ORDER BY. The checks use SQLite 3.49; a plan shows SQLite's choice for this data, not speed.",
    brief: {
      summary: 'Add an index so the newest logins are found and already sorted.',
      rules: [
        "`events(id INTEGER PRIMARY KEY, kind TEXT NOT NULL, happened_at TEXT NOT NULL)`; happened_at is 'YYYY-MM-DD HH:MM'.",
        'The checks run `SELECT id FROM events WHERE kind = … ORDER BY happened_at DESC LIMIT 5` and compare its rows.',
        'The plan must search events by kind, must not scan events, and must not use a temporary B-tree for ORDER BY.',
        'Do not change the stored rows. The checks use SQLite 3.49.',
      ],
      edgeCases: ['A kind with fewer than five events returns them all.'],
    },
    example: { input: 'the newest five logins', output: 'ids 8, 7, 5, 4, 3, with no USE TEMP B-TREE line in the plan' },
    note: "A query plan is SQLite's choice for this data and version, not a speed measurement. Checks compare the query's rows and its plan.",
    vocabulary: [
      { term: 'Composite index', meaning: 'an index on two or more columns, sorted by the first, then the next' },
      { term: 'Temporary B-tree', meaning: 'a structure SQLite builds during a query to sort rows that are not already in order' },
    ],
    planPrompt: 'Which column narrows the rows, and which one orders them? Decide the order of columns in your index.',
    starter: '-- The admin screen runs:\n--   SELECT id FROM events WHERE kind = ? ORDER BY happened_at DESC LIMIT 5\n',
    hints: [
      'An index on kind alone finds the logins but leaves them unsorted, so SQLite still sorts them afterwards.',
      'An index on several columns keeps rows with the same first column sorted by the second.',
      'CREATE INDEX events_kind_time ON events (kind, happened_at);',
    ],
    checks: [
      {
        name: 'The newest logins come from the index, already sorted',
        input: [],
        sql: {
          seed: 'log',
          plan: {
            sql: "SELECT id FROM events WHERE kind = 'login' ORDER BY happened_at DESC LIMIT 5",
            uses: kindSearch,
            avoids: [scanOf('events'), tempSort],
          },
        },
        expected: { plan: 'matches', result: [[8], [7], [5], [4], [3]] },
      },
      {
        name: 'Fewer than five of a kind',
        input: [],
        sql: {
          seed: 'log',
          plan: {
            sql: "SELECT id FROM events WHERE kind = 'logout' ORDER BY happened_at DESC LIMIT 5",
            uses: kindSearch,
            avoids: [scanOf('events'), tempSort],
          },
        },
        expected: { plan: 'matches', result: [[6], [2]] },
      },
      {
        name: 'No events',
        input: [],
        sql: {
          seed: 'empty',
          plan: {
            sql: "SELECT id FROM events WHERE kind = 'login' ORDER BY happened_at DESC LIMIT 5",
            uses: kindSearch,
            avoids: [scanOf('events'), tempSort],
          },
        },
        expected: { plan: 'matches', result: [] },
      },
    ],
  },
  {
    id: 'sql-covering-index',
    title: 'Answer a query from the index alone',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: teaProducts,
      seeds: {
        shelf: {
          about: 'six products, three of them teas',
          sql: "INSERT INTO products VALUES (1,'T-300','tea',650),(2,'M-100','ware',900),(3,'T-100','tea',800),(4,'C-200','coffee',700),(5,'T-200','tea',1200),(6,'M-200','ware',300);",
        },
        empty: { about: 'no products', sql: '' },
      },
      compare: 'state',
    },
    context:
      'A price list shows the sku and price of every tea, sorted by sku. With the right index SQLite never has to read the table itself.',
    prompt:
      "Write SQL that lets SQLite answer SELECT sku, price_cents FROM products WHERE category = ? ORDER BY sku from a covering index: an index that holds every column the query needs, searched by category and already in sku order, so SQLite neither reads the table rows nor sorts afterwards. Do not change the stored rows. products has id INTEGER PRIMARY KEY, sku TEXT NOT NULL, category TEXT NOT NULL, and price_cents INTEGER NOT NULL. Each check runs the query with a literal category after your SQL, compares its rows, and reads SQLite's EXPLAIN QUERY PLAN. The checks use SQLite 3.49; a plan shows SQLite's choice for this data, not speed.",
    brief: {
      summary: 'Add an index that answers the tea price list on its own, already sorted.',
      rules: [
        '`products(id INTEGER PRIMARY KEY, sku TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL)`.',
        'The checks run `SELECT sku, price_cents FROM products WHERE category = … ORDER BY sku` and compare its rows.',
        'The plan must search products with a covering index by category, and must not use a temporary B-tree for ORDER BY.',
        'Do not change the stored rows. The checks use SQLite 3.49.',
      ],
      edgeCases: ['A category with no products returns no rows.'],
    },
    example: { input: 'the tea price list', output: "plan: SEARCH products USING COVERING INDEX … (category=?); rows ('T-100', 800), …" },
    note: "A query plan is SQLite's choice for this data and version, not a speed measurement. Checks compare the query's rows and its plan.",
    vocabulary: [{ term: 'Covering index', meaning: 'an index that contains every column a query needs, so the table itself is not read' }],
    planPrompt: 'List every column the query mentions and the role each plays: filter, order, or output.',
    starter: '-- The price list runs:\n--   SELECT sku, price_cents FROM products WHERE category = ? ORDER BY sku\n',
    hints: [
      'An index on category finds the teas, but SQLite then reads each row for its sku and price and sorts them.',
      'Column order matters: the filtered column first, then the sort column, then anything else the query only outputs.',
      'CREATE INDEX products_price_list ON products (category, sku, price_cents);',
    ],
    checks: [
      {
        name: 'The tea list comes from a covering index, already sorted',
        input: [],
        sql: {
          seed: 'shelf',
          plan: {
            sql: "SELECT sku, price_cents FROM products WHERE category = 'tea' ORDER BY sku",
            uses: coveringCategory,
            avoids: [tempSort],
          },
        },
        expected: {
          plan: 'matches',
          result: [
            ['T-100', 800],
            ['T-200', 1200],
            ['T-300', 650],
          ],
        },
      },
      {
        name: 'Another category from the same index',
        input: [],
        sql: {
          seed: 'shelf',
          plan: {
            sql: "SELECT sku, price_cents FROM products WHERE category = 'ware' ORDER BY sku",
            uses: coveringCategory,
            avoids: [tempSort],
          },
        },
        expected: {
          plan: 'matches',
          result: [
            ['M-100', 900],
            ['M-200', 300],
          ],
        },
      },
      {
        name: 'No products',
        input: [],
        sql: {
          seed: 'empty',
          plan: {
            sql: "SELECT sku, price_cents FROM products WHERE category = 'tea' ORDER BY sku",
            uses: coveringCategory,
            avoids: [tempSort],
          },
        },
        expected: { plan: 'matches', result: [] },
      },
    ],
  },
  {
    id: 'sql-composite-index',
    title: 'Index two conditions at once',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: datedOrders,
      seeds: {
        history: {
          about: 'seven orders for two customers across 2025 and 2026',
          sql: "INSERT INTO orders VALUES (1,7,'2025-11-02',500),(2,7,'2026-01-15',800),(3,8,'2026-02-01',300),(4,7,'2026-03-09',1200),(5,7,'2025-12-31',250),(6,8,'2025-06-30',900),(7,7,'2026-01-01',400);",
        },
        empty: { about: 'no orders', sql: '' },
      },
      compare: 'state',
    },
    context:
      "An account page lists a customer's orders since the start of 2026. Both conditions should narrow the search inside one index.",
    prompt:
      "Write SQL that lets SQLite answer SELECT id, cents FROM orders WHERE customer_id = ? AND placed_on >= ? ORDER BY id by searching one index with both conditions: customer_id for equality and placed_on for the range. Do not change the stored rows. orders has id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL written as 'YYYY-MM-DD', and cents INTEGER NOT NULL. Each check runs the query with literal values after your SQL, compares its rows, and reads SQLite's EXPLAIN QUERY PLAN: it must search orders using customer_id and placed_on together, and must not scan orders. The checks use SQLite 3.49; a plan shows SQLite's choice for this data, not speed.",
    brief: {
      summary: "Add an index that narrows a customer's recent orders by both conditions at once.",
      rules: [
        "`orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL, cents INTEGER NOT NULL)`; placed_on is 'YYYY-MM-DD'.",
        'The checks run `SELECT id, cents FROM orders WHERE customer_id = … AND placed_on >= … ORDER BY id` and compare its rows.',
        'The plan must search orders using customer_id and placed_on together, and must not scan orders.',
        'Do not change the stored rows. The checks use SQLite 3.49.',
      ],
      edgeCases: ['An order placed exactly on the start date is included.'],
    },
    example: { input: "customer 7 since '2026-01-01'", output: 'plan: SEARCH orders USING INDEX … (customer_id=? AND placed_on>?)' },
    note: "This is an independent rep: plan before you look at the hints. A query plan is SQLite's choice for this data and version, not a speed measurement.",
    vocabulary: [{ term: 'Leftmost prefix', meaning: 'the leading columns of an index, which a search must use in order' }],
    planPrompt: 'Which condition is an equality and which a range? Decide which column comes first and why.',
    starter: '-- The account page runs:\n--   SELECT id, cents FROM orders WHERE customer_id = ? AND placed_on >= ? ORDER BY id\n',
    hints: [
      'An index on customer_id alone finds all of a customer’s orders, then checks each date one by one.',
      'An index search uses its columns from the left. Equality on the first column lets the range on the next one narrow further; a range first stops the search there.',
      'CREATE INDEX orders_customer_date ON orders (customer_id, placed_on);',
    ],
    checks: [
      {
        name: 'Both conditions narrow one index search',
        input: [],
        sql: {
          seed: 'history',
          plan: {
            sql: "SELECT id, cents FROM orders WHERE customer_id = 7 AND placed_on >= '2026-01-01' ORDER BY id",
            uses: customerDateSearch,
            avoids: [scanOf('orders')],
          },
        },
        expected: {
          plan: 'matches',
          result: [
            [2, 800],
            [4, 1200],
            [7, 400],
          ],
        },
      },
      {
        name: 'Another customer and date',
        input: [],
        sql: {
          seed: 'history',
          plan: {
            sql: "SELECT id, cents FROM orders WHERE customer_id = 8 AND placed_on >= '2025-07-01' ORDER BY id",
            uses: customerDateSearch,
            avoids: [scanOf('orders')],
          },
        },
        expected: { plan: 'matches', result: [[3, 300]] },
      },
      {
        name: 'No orders',
        input: [],
        sql: {
          seed: 'empty',
          plan: {
            sql: "SELECT id, cents FROM orders WHERE customer_id = 7 AND placed_on >= '2026-01-01' ORDER BY id",
            uses: customerDateSearch,
            avoids: [scanOf('orders')],
          },
        },
        expected: { plan: 'matches', result: [] },
      },
    ],
  },
  {
    id: 'sql-index-join',
    title: 'Index both sides of a join',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: joinTables,
      seeds: {
        shop: {
          about: 'three customers and five orders',
          sql: "INSERT INTO customers VALUES (1,'ana@example.com','Ana'),(2,'bo@example.com','Bo'),(3,'cy@example.com','Cy'); INSERT INTO orders VALUES (10,3,700),(11,1,200),(12,3,150),(13,2,900),(14,3,50);",
        },
        empty: { about: 'no customers and no orders', sql: '' },
      },
      compare: 'state',
    },
    context: "A support tool shows a customer's orders after an agent types their email. Today SQLite scans orders to find them.",
    prompt:
      "Write SQL that lets SQLite answer SELECT o.id, o.cents FROM customers AS c JOIN orders AS o ON o.customer_id = c.id WHERE c.email = ? ORDER BY o.id by searching customers by email and searching orders by customer_id, scanning neither table. Do not change the stored rows. customers has id INTEGER PRIMARY KEY, email TEXT NOT NULL, and name TEXT NOT NULL. orders has id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, and cents INTEGER NOT NULL. Each check runs the query with a literal email after your SQL, compares its rows, and reads SQLite's EXPLAIN QUERY PLAN. The checks use SQLite 3.49; a plan shows SQLite's choice for this data, not speed.",
    brief: {
      summary: "Add the indexes that let SQLite find a customer's orders by email without scanning either table.",
      rules: [
        '`customers(id INTEGER PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL)` and `orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, cents INTEGER NOT NULL)`.',
        'The checks run `SELECT o.id, o.cents FROM customers AS c JOIN orders AS o ON o.customer_id = c.id WHERE c.email = … ORDER BY o.id` and compare its rows.',
        'The plan must search customers by email and orders by customer_id, and must scan neither table.',
        'Do not change the stored rows. The checks use SQLite 3.49.',
      ],
      edgeCases: ['An email with no customer returns no rows.'],
    },
    example: { input: 'the orders of cy@example.com', output: 'plan: SEARCH c … (email=?), SEARCH o … (customer_id=?); rows 10, 12, 14' },
    note: "This is a delayed recall rep: solve it without hints after the break. A query plan is SQLite's choice for this data and version, not a speed measurement.",
    vocabulary: [{ term: 'Join order', meaning: 'which table the database reads first when it pairs rows of two tables' }],
    planPrompt: 'Trace how SQLite should answer the query: which table it reads first, and how it finds the matching rows of the other.',
    starter:
      '-- The support tool runs:\n--   SELECT o.id, o.cents FROM customers AS c JOIN orders AS o ON o.customer_id = c.id\n--   WHERE c.email = ? ORDER BY o.id\n',
    hints: [
      'Two lookups happen: first the customer by email, then that customer’s orders. Each needs its own way in.',
      'Without an index on the linking column, SQLite may start from orders and scan it, even with an index on email.',
      'CREATE INDEX customers_email ON customers (email); CREATE INDEX orders_customer ON orders (customer_id);',
    ],
    checks: [
      {
        name: 'Both tables are searched, neither is scanned',
        input: [],
        sql: {
          seed: 'shop',
          plan: { sql: joinQuery('cy@example.com'), uses: joinSearches, avoids: [scanOf('c', 'customers'), scanOf('o', 'orders')] },
        },
        expected: {
          plan: 'matches',
          result: [
            [10, 700],
            [12, 150],
            [14, 50],
          ],
        },
      },
      {
        name: 'An email with no customer',
        input: [],
        sql: {
          seed: 'shop',
          plan: { sql: joinQuery('zoe@example.com'), uses: joinSearches, avoids: [scanOf('c', 'customers'), scanOf('o', 'orders')] },
        },
        expected: { plan: 'matches', result: [] },
      },
      {
        name: 'No customers or orders',
        input: [],
        sql: {
          seed: 'empty',
          plan: { sql: joinQuery('ana@example.com'), uses: joinSearches, avoids: [scanOf('c', 'customers'), scanOf('o', 'orders')] },
        },
        expected: { plan: 'matches', result: [] },
      },
    ],
  },
  {
    id: 'sql-add-column',
    title: 'Add a column and fill it in',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: loyaltyCustomers,
      seeds: {
        book: {
          about: 'four customers with lifetime spend around 100000 cents',
          sql: "INSERT INTO customers VALUES (1,'Ada',250000),(2,'Bo',99999),(3,'Cy',100000),(4,'Di',0);",
        },
        empty: { about: 'no customers yet', sql: '' },
      },
      compare: 'state',
      read: [
        { label: 'customers', sql: 'SELECT id, name, lifetime_cents, tier FROM customers ORDER BY id' },
        { label: 'columns', sql: 'SELECT name, upper(type), "notnull" FROM pragma_table_info(\'customers\') ORDER BY cid' },
      ],
    },
    context:
      'A shop introduces loyalty tiers. Every customer needs a tier from now on; existing big spenders start as gold, everyone else as standard.',
    prompt:
      "Write SQL that adds a column tier to customers: TEXT, required, and 'standard' when an insert leaves it out. Then set tier to 'gold' for every existing customer whose lifetime_cents is at least 100000. Keep every existing row and value. customers starts with id INTEGER PRIMARY KEY, name TEXT NOT NULL, and lifetime_cents INTEGER NOT NULL. The checks read every customer and the table's columns (name, type, and whether NOT NULL) afterwards, and some insert a row to test the default and the rule. The checks use SQLite 3.49.",
    brief: {
      summary: 'Add a required tier column that defaults to standard, then mark existing big spenders as gold.',
      rules: [
        '`customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL, lifetime_cents INTEGER NOT NULL)` to start with.',
        "Add `tier`: TEXT, required, and `'standard'` when an insert leaves it out.",
        "Then set tier to `'gold'` for existing customers whose lifetime_cents is at least 100000. Keep every existing row and value.",
        'The checks read the customers and the column list afterwards, and some insert a row. The checks use SQLite 3.49.',
      ],
      edgeCases: ['Exactly 100000 is gold; 99999 is standard.', 'A tier of NULL is rejected.'],
    },
    example: { input: 'customers Ada (250000) and Bo (99999)', output: 'Ada gold, Bo standard; tier is TEXT NOT NULL' },
    note: 'Checks compare stored rows, the column list, and probe inserts. They do not establish that the migration would be safe to run twice; that is part of your self-review.',
    vocabulary: [
      { term: 'Migration', meaning: 'a script that changes a database schema from one version to the next' },
      { term: 'Backfill', meaning: 'filling a new column for rows that already exist' },
      { term: 'ALTER TABLE', meaning: 'the statement that changes an existing table, such as adding or renaming a column' },
    ],
    planPrompt: 'Write the two steps in order, and what each existing customer’s tier is after each step.',
    starter: 'ALTER TABLE customers ADD COLUMN tier TEXT;\n',
    hints: [
      'Run the starter: the column appears, but it is NULL for every customer and nothing stops a NULL later.',
      'SQLite can add a NOT NULL column only together with a default, which also fills the existing rows. A second statement then corrects the big spenders.',
      "ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'; then UPDATE customers SET tier = 'gold' WHERE lifetime_cents >= 100000.",
    ],
    checks: [
      {
        name: 'Existing customers keep their rows and get a tier',
        input: [],
        sql: { seed: 'book' },
        expected: {
          customers: [
            [1, 'Ada', 250000, 'gold'],
            [2, 'Bo', 99999, 'standard'],
            [3, 'Cy', 100000, 'gold'],
            [4, 'Di', 0, 'standard'],
          ],
          columns: tierColumns,
        },
      },
      {
        name: 'A new customer gets the default tier',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO customers (name, lifetime_cents) VALUES ('Eve', 500000)"],
          labels: ['a new customer with no tier'],
        },
        expected: { probes: ['accepted'], customers: [[1, 'Eve', 500000, 'standard']], columns: tierColumns },
      },
      {
        name: 'The tier cannot be NULL',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO customers (name, lifetime_cents, tier) VALUES ('Fay', 10, NULL)"],
          labels: ['tier NULL'],
        },
        expected: { probes: ['rejected'], customers: [], columns: tierColumns },
      },
    ],
  },
  {
    id: 'sql-rename-column',
    title: 'Rename a column and keep its data',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: stockCounts,
      seeds: {
        shelf: { about: 'three stock rows', sql: "INSERT INTO stock VALUES (1,'A-1',5),(2,'B-2',0),(3,'C-3',12);" },
        empty: { about: 'no stock rows', sql: '' },
      },
      compare: 'state',
      read: [
        { label: 'stock', sql: 'SELECT * FROM stock ORDER BY id' },
        { label: 'columns', sql: 'SELECT name, upper(type), "notnull" FROM pragma_table_info(\'stock\') ORDER BY cid' },
      ],
    },
    context: 'A team agrees that short names like qty hurt readability. The column becomes quantity, and no stock count may be lost.',
    prompt:
      'Write SQL that renames the column qty of stock to quantity, keeping its type, its NOT NULL rule, its position, and every stored value. stock has id INTEGER PRIMARY KEY, sku TEXT NOT NULL, and qty INTEGER NOT NULL. The checks read every row and the column list afterwards, and some insert a row using the new or the old name. The checks use SQLite 3.49.',
    brief: {
      summary: 'Rename qty to quantity without losing any stock count.',
      rules: [
        '`stock(id INTEGER PRIMARY KEY, sku TEXT NOT NULL, qty INTEGER NOT NULL)` to start with.',
        'Rename `qty` to `quantity`, keeping its type, its NOT NULL rule, its position, and every stored value.',
        'The checks read the rows and the column list afterwards, and some insert a row using the new or the old name.',
        'The checks use SQLite 3.49.',
      ],
      edgeCases: ['An insert that still says qty is rejected afterwards.'],
    },
    example: { input: "stock (1, 'A-1', 5)", output: 'columns id, sku, quantity; row (1, A-1, 5)' },
    note: 'Checks compare stored rows, the column list, and probe inserts. Renaming breaks every query and program that still uses the old name; finding those is part of your self-review.',
    vocabulary: [{ term: 'RENAME COLUMN', meaning: 'an ALTER TABLE action that gives an existing column a new name and keeps its data' }],
    planPrompt: 'Predict the column list after your change, and what happens to an old insert that still says qty.',
    starter: 'ALTER TABLE stock ADD COLUMN quantity INTEGER;\n',
    hints: [
      'The starter adds a second, empty column instead of renaming the first, so the counts are not in quantity.',
      'SQLite can rename a column in place, keeping its data and rules.',
      'ALTER TABLE stock RENAME COLUMN qty TO quantity;',
    ],
    checks: [
      {
        name: 'Every count keeps its value under the new name',
        input: [],
        sql: { seed: 'shelf' },
        expected: {
          stock: [
            [1, 'A-1', 5],
            [2, 'B-2', 0],
            [3, 'C-3', 12],
          ],
          columns: renamedColumns,
        },
      },
      {
        name: 'New inserts use quantity',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO stock (sku, quantity) VALUES ('D-4', 7)"], labels: ['an insert naming quantity'] },
        expected: { probes: ['accepted'], stock: [[1, 'D-4', 7]], columns: renamedColumns },
      },
      {
        name: 'The old name is gone',
        input: [],
        sql: { seed: 'empty', probes: ["INSERT INTO stock (sku, qty) VALUES ('E-5', 2)"], labels: ['an insert still naming qty'] },
        expected: { probes: ['rejected'], stock: [], columns: renamedColumns },
      },
    ],
  },
  {
    id: 'sql-split-name',
    title: 'Fill new columns from existing text',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: peopleNames,
      seeds: {
        staff: {
          about: 'four names: two words, three words, one word, and two spaces in a row',
          sql: "INSERT INTO people VALUES (1,'Ada Lovelace'),(2,'Mary Ann Evans'),(3,'Plato'),(4,'Grace  Hopper');",
        },
        empty: { about: 'no people', sql: '' },
        'one-word': { about: 'two single-word names', sql: "INSERT INTO people VALUES (1,'Sappho'),(2,'Homer');" },
      },
      compare: 'state',
      read: [{ label: 'people', sql: 'SELECT id, full_name, first_name, last_name FROM people ORDER BY id' }],
    },
    context:
      'A contact list stores full names in one column. Mail merges need first and last names separately, so two new columns are added and filled from the old one.',
    prompt:
      "Write SQL that adds two columns to people, first_name TEXT and last_name TEXT, and fills them for every existing row from full_name: first_name is the text before the first space, and last_name is everything after that space, exactly as stored. A name without a space gets the whole name as first_name and '' (empty text) as last_name. Keep full_name unchanged. people has id INTEGER PRIMARY KEY and full_name TEXT NOT NULL. The checks read id, full_name, first_name, and last_name afterwards. The checks use SQLite 3.49.",
    brief: {
      summary: 'Add first_name and last_name and fill them by splitting full_name at its first space.',
      rules: [
        '`people(id INTEGER PRIMARY KEY, full_name TEXT NOT NULL)` to start with. Add `first_name TEXT` and `last_name TEXT`.',
        'first_name is the text before the first space; last_name is everything after that space, exactly as stored.',
        "A name without a space: first_name is the whole name and last_name is '' (empty text). Keep full_name unchanged.",
        'The checks read the rows back. The checks use SQLite 3.49.',
      ],
      edgeCases: ["'Mary Ann Evans' gives 'Mary' and 'Ann Evans'.", "'Grace  Hopper' with two spaces gives 'Grace' and ' Hopper'."],
    },
    example: { input: "'Ada Lovelace'", output: "first_name 'Ada', last_name 'Lovelace'" },
    note: 'Checks compare the stored rows. Splitting names is a rough rule; many real names do not fit it, which is worth noting in your self-review.',
    vocabulary: [
      { term: 'instr', meaning: 'a SQLite function that returns the position of one text inside another, or 0 when it is absent' },
    ],
    planPrompt: 'For Plato and Mary Ann Evans, write the first and last name you expect and how you find the split point.',
    starter: 'ALTER TABLE people ADD COLUMN first_name TEXT;\nALTER TABLE people ADD COLUMN last_name TEXT;\n',
    hints: [
      'The starter adds the columns but leaves them NULL. An UPDATE has to compute both values for every row.',
      "instr(full_name, ' ') finds the first space, or 0 when there is none; substr takes the parts on either side.",
      "UPDATE people SET first_name = CASE WHEN instr(full_name, ' ') = 0 THEN full_name ELSE substr(full_name, 1, instr(full_name, ' ') - 1) END, and last_name the same way with substr after the space or ''.",
    ],
    checks: [
      {
        name: 'Names split at the first space',
        input: [],
        sql: { seed: 'staff' },
        expected: {
          people: [
            [1, 'Ada Lovelace', 'Ada', 'Lovelace'],
            [2, 'Mary Ann Evans', 'Mary', 'Ann Evans'],
            [3, 'Plato', 'Plato', ''],
            [4, 'Grace  Hopper', 'Grace', ' Hopper'],
          ],
        },
      },
      {
        name: 'One-word names keep an empty last name',
        input: [],
        sql: { seed: 'one-word' },
        expected: {
          people: [
            [1, 'Sappho', 'Sappho', ''],
            [2, 'Homer', 'Homer', ''],
          ],
        },
      },
      { name: 'No people', input: [], sql: { seed: 'empty' }, expected: { people: [] } },
    ],
  },
  {
    id: 'sql-rebuild-table',
    title: 'Add a rule to an existing table',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: loosePrices,
      seeds: {
        catalog: {
          about: 'four products, one with no price',
          sql: "INSERT INTO products VALUES (1,'A-1',500),(2,'B-2',NULL),(3,'C-3',0),(4,'D-4',1250);",
        },
        empty: { about: 'no products', sql: '' },
      },
      compare: 'state',
      read: [
        { label: 'products', sql: 'SELECT id, sku, price_cents FROM products ORDER BY id' },
        { label: 'columns', sql: 'SELECT name, upper(type), "notnull" FROM pragma_table_info(\'products\') ORDER BY cid' },
        { label: 'tables', sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name" },
      ],
    },
    context:
      'Prices were optional when the product table was first made, and some are missing. From now on a price is required and never negative. Missing prices become 0 so they can be reviewed.',
    prompt:
      "Write SQL that changes products so that price_cents is INTEGER NOT NULL and never negative, enforced by the table itself. First set every NULL price_cents to 0. Keep every id, sku, and other price, keep the table name products, the column order, and the other columns' rules, and leave no other table behind. products has id INTEGER PRIMARY KEY, sku TEXT NOT NULL, and price_cents INTEGER (nullable, with no rule). SQLite's ALTER TABLE cannot add NOT NULL or CHECK to an existing column. The checks read every product, the column list, and the list of tables afterwards, and some insert rows to test the new rules. The checks use SQLite 3.49.",
    brief: {
      summary: 'Make price_cents required and never negative on an existing table, turning missing prices into 0.',
      rules: [
        '`products(id INTEGER PRIMARY KEY, sku TEXT NOT NULL, price_cents INTEGER)` to start with; price_cents may be NULL and has no rule.',
        'Afterwards price_cents is INTEGER NOT NULL and never negative, enforced by the table. Missing prices become 0.',
        'Keep every id, sku, and price, the table name products, the column order, and the other rules. Leave no other table behind.',
        "SQLite's ALTER TABLE cannot add NOT NULL or CHECK to an existing column. The checks read the rows, the column list, and the tables. SQLite 3.49.",
      ],
      edgeCases: ['A price of 0 is allowed.', 'A negative price or a missing price is rejected afterwards.'],
    },
    example: { input: "products (2, 'B-2', NULL)", output: "becomes (2, 'B-2', 0); a later price of -5 is rejected" },
    note: 'This is an independent rep: plan before you look at the hints. Checks compare stored rows, the column list, the table list, and probe inserts. Whether a transaction wrapped your steps is part of your self-review.',
    vocabulary: [
      { term: 'Table rebuild', meaning: 'creating a new table with the right rules, copying the rows in, and replacing the old table' },
    ],
    planPrompt: 'List the steps, what could go wrong between them, and how the rows get from the old table to the new one.',
    starter: '-- Make price_cents required and never negative.\n',
    hints: [
      'ALTER TABLE cannot add these rules, so the table must be built again with them and the rows moved across.',
      'Create the new table under another name, copy the rows with the missing prices replaced, drop the old table, and give the new one the old name, all inside one transaction.',
      'BEGIN; CREATE TABLE products_new (id INTEGER PRIMARY KEY, sku TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK (price_cents >= 0)); INSERT INTO products_new SELECT id, sku, COALESCE(price_cents, 0) FROM products; DROP TABLE products; ALTER TABLE products_new RENAME TO products; COMMIT;',
    ],
    checks: [
      {
        name: 'Rows are kept and missing prices become 0',
        input: [],
        sql: { seed: 'catalog' },
        expected: {
          products: [
            [1, 'A-1', 500],
            [2, 'B-2', 0],
            [3, 'C-3', 0],
            [4, 'D-4', 1250],
          ],
          columns: strictPriceColumns,
          tables: [['products']],
        },
      },
      {
        name: 'A negative price is rejected',
        input: [],
        sql: { seed: 'catalog', probes: ["INSERT INTO products (sku, price_cents) VALUES ('E-5', -5)"], labels: ['price -5'] },
        expected: {
          probes: ['rejected'],
          products: [
            [1, 'A-1', 500],
            [2, 'B-2', 0],
            [3, 'C-3', 0],
            [4, 'D-4', 1250],
          ],
          columns: strictPriceColumns,
          tables: [['products']],
        },
      },
      {
        name: 'A missing price is rejected, 0 is accepted',
        input: [],
        sql: {
          seed: 'empty',
          probes: ["INSERT INTO products (sku) VALUES ('F-6')", "INSERT INTO products (sku, price_cents) VALUES ('G-7', 0)"],
          labels: ['a product with no price', 'price 0'],
        },
        expected: { probes: ['rejected', 'accepted'], products: [[1, 'G-7', 0]], columns: strictPriceColumns, tables: [['products']] },
      },
    ],
  },
  {
    id: 'sql-migrate-status-codes',
    title: 'Replace codes with readable values',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: codedOrders,
      seeds: {
        orders: { about: 'four orders with codes 1, 2, and 3', sql: 'INSERT INTO orders VALUES (1,2,500),(2,1,250),(3,3,900),(4,2,100);' },
        'all-new': { about: 'two orders, both code 1', sql: 'INSERT INTO orders VALUES (7,1,300),(8,1,50);' },
        empty: { about: 'no orders', sql: '' },
      },
      compare: 'state',
      read: [
        { label: 'orders', sql: 'SELECT id, cents, status FROM orders ORDER BY id' },
        { label: 'columns', sql: 'SELECT name, upper(type), "notnull" FROM pragma_table_info(\'orders\') ORDER BY cid' },
      ],
    },
    context:
      'Orders store their status as a number that nobody remembers: 1, 2, or 3. The team replaces it with readable text and removes the number.',
    prompt:
      "Write SQL that adds a column status to orders, TEXT, required, and 'new' when an insert leaves it out; fills it for every existing order from status_code (1 is 'new', 2 is 'paid', 3 is 'shipped'); and then removes status_code. Keep every id and cents. Afterwards the columns are id, cents, and status, in that order. orders has id INTEGER PRIMARY KEY, status_code INTEGER NOT NULL (always 1, 2, or 3), and cents INTEGER NOT NULL. The checks read every order and the column list afterwards, and one inserts an order to test the default. The checks use SQLite 3.49.",
    brief: {
      summary: 'Replace the numeric status_code with a readable status column.',
      rules: [
        '`orders(id INTEGER PRIMARY KEY, status_code INTEGER NOT NULL, cents INTEGER NOT NULL)`; status_code is always 1, 2, or 3.',
        "Add `status`: TEXT, required, `'new'` when an insert leaves it out. Fill it from status_code: 1 'new', 2 'paid', 3 'shipped'.",
        'Then remove status_code. Keep every id and cents; the columns end as id, cents, status.',
        'The checks read the orders and the column list, and one inserts an order. The checks use SQLite 3.49.',
      ],
      edgeCases: ['No orders: the columns still change.'],
    },
    example: { input: 'order (1, 2, 500)', output: "becomes (1, 500, 'paid')" },
    note: 'This is a delayed recall rep: solve it without hints after the break. Checks compare stored rows, the column list, and a probe insert. Programs that still read status_code break after this change; finding them is part of your self-review.',
    vocabulary: [{ term: 'DROP COLUMN', meaning: 'an ALTER TABLE action that removes a column and its data' }],
    planPrompt: 'Write the steps in order and what would be lost if the last one ran first.',
    starter: '-- Replace status_code with status.\n',
    hints: [
      'Three changes happen in order: a new column appears, it is filled from the old one, and the old one goes. The order matters.',
      'A CASE expression maps each code to its text inside one UPDATE. ALTER TABLE can both add and drop a column.',
      "ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'new'; UPDATE orders SET status = CASE status_code WHEN 1 THEN 'new' WHEN 2 THEN 'paid' WHEN 3 THEN 'shipped' END; ALTER TABLE orders DROP COLUMN status_code;",
    ],
    checks: [
      {
        name: 'Every order gets its readable status',
        input: [],
        sql: { seed: 'orders' },
        expected: {
          orders: [
            [1, 500, 'paid'],
            [2, 250, 'new'],
            [3, 900, 'shipped'],
            [4, 100, 'paid'],
          ],
          columns: statusColumns,
        },
      },
      {
        name: 'Orders that were already new',
        input: [],
        sql: { seed: 'all-new' },
        expected: {
          orders: [
            [7, 300, 'new'],
            [8, 50, 'new'],
          ],
          columns: statusColumns,
        },
      },
      {
        name: 'A new order defaults to new',
        input: [],
        sql: { seed: 'empty', probes: ['INSERT INTO orders (cents) VALUES (750)'], labels: ['an order with only cents'] },
        expected: { probes: ['accepted'], orders: [[1, 750, 'new']], columns: statusColumns },
      },
    ],
  },
  {
    id: 'sql-capstone-report',
    title: 'Build a monthly category report',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: reportTables,
      seeds: {
        march: {
          about: 'four customers in three regions, seven orders around March 2026 (one cancelled), and eleven order lines',
          sql: "INSERT INTO customers VALUES (1,'Ada','North'),(2,'Bo','North'),(3,'Cy','South'),(4,'Di','West'); INSERT INTO products VALUES (1,'Tea Sampler','tea'),(2,'Kettle','ware'),(3,'Green Tea','tea'),(4,'Mug','ware'),(5,'Beans','coffee'); INSERT INTO orders VALUES (10,1,'2026-03-02','paid'),(11,2,'2026-03-15','shipped'),(12,1,'2026-03-20','cancelled'),(13,3,'2026-03-05','paid'),(14,3,'2026-02-27','paid'),(15,2,'2026-04-01','paid'),(16,4,'2026-03-31','paid'); INSERT INTO order_lines VALUES (1,10,1,2,1500),(2,10,2,1,4000),(3,11,3,3,800),(4,11,4,2,900),(5,12,2,5,4000),(6,13,5,4,1200),(7,13,1,1,1500),(8,14,3,10,800),(9,15,2,3,4000),(10,16,4,1,900),(11,11,2,1,900);",
        },
        'tied-categories': {
          about: 'one region whose two categories earn the same in March',
          sql: "INSERT INTO customers VALUES (1,'Eve','East'); INSERT INTO products VALUES (1,'Beans','coffee'),(2,'Sencha','tea'); INSERT INTO orders VALUES (1,1,'2026-03-10','paid'),(2,1,'2026-03-11','paid'); INSERT INTO order_lines VALUES (1,1,2,2,500),(2,2,1,1,1000);",
        },
        'no-march-sales': {
          about: 'only a cancelled March order and orders in other months',
          sql: "INSERT INTO customers VALUES (1,'Fay','North'); INSERT INTO products VALUES (1,'Mug','ware'); INSERT INTO orders VALUES (1,1,'2026-03-05','cancelled'),(2,1,'2026-02-28','paid'),(3,1,'2026-04-01','shipped'); INSERT INTO order_lines VALUES (1,1,1,1,900),(2,2,1,1,900),(3,3,1,1,900);",
        },
      },
      compare: 'ordered',
      columns: ['region', 'category', 'revenue_cents', 'orders', 'share'],
    },
    context:
      "A retail team reviews March 2026 region by region. For each region it wants the product category that earned the most, how many orders it appeared in, and how much of the region's March revenue it made up.",
    prompt:
      "Write one SELECT statement that returns region, category, revenue_cents, orders, and share, in that column order, with one row per region: its best-earning product category in March 2026, defined as follows. Count only order lines of orders placed from 2026-03-01 to 2026-03-31 inclusive whose status is not 'cancelled'; a line earns quantity multiplied by unit_cents. revenue_cents is the category's March revenue in that region, orders is the number of different qualifying orders with at least one line in that category, and share is that revenue as a percentage of the region's whole March revenue, rounded to 1 decimal place. The best category has the most revenue; on a tie, the category that comes first in SQLite's default text order. A region with no qualifying revenue is left out. Order by region. Tables: customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL), products(id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL), orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL written as 'YYYY-MM-DD', status TEXT NOT NULL: 'paid', 'shipped', or 'cancelled'), and order_lines(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL, unit_cents INTEGER NOT NULL). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary:
        "For each region, report March 2026's best-earning category with its revenue, order count, and share of the region's revenue.",
      rules: [
        "Tables: `customers(id, name, region)`, `products(id, name, category)`, `orders(id, customer_id, placed_on, status)`, `order_lines(id, order_id, product_id, quantity, unit_cents)`. placed_on is 'YYYY-MM-DD'; status is 'paid', 'shipped', or 'cancelled'.",
        "Count only lines of orders placed from 2026-03-01 to 2026-03-31 inclusive whose status is not 'cancelled'. A line earns quantity × unit_cents.",
        "Per region, the best category has the most revenue; on a tie, the category first in SQLite's default text order. orders counts different qualifying orders with a line in that category.",
        "share is the category's revenue as a percentage of the region's March revenue, rounded to 1 decimal place. Return `region`, `category`, `revenue_cents`, `orders`, `share`, ordered by region; leave out regions with no March revenue.",
      ],
      edgeCases: ['A cancelled March order earns nothing.', 'An order with lines in two categories counts once for each of them.'],
    },
    example: { input: 'North earned 6700 from ware in two orders and 5400 from tea in March', output: "('North', 'ware', 6700, 2, 55.4)" },
    note: 'This capstone combines joins, filters, grouping, windows, and steps. Checks compare rows and their order on fresh databases; they do not establish that the report would stay correct as the data grows, which is part of your self-review.',
    vocabulary: [{ term: 'Share', meaning: 'a part of a whole, written as a percentage of it' }],
    planPrompt:
      'Write the North row you expect and the steps that produce it: which rows qualify, what is grouped, and how the best category is chosen.',
    starter:
      '-- March 2026, one row per region:\n-- region, category, revenue_cents, orders, share\nSELECT c.region\nFROM orders AS o\nJOIN customers AS c ON c.id = o.customer_id;\n',
    hints: [
      'Work in steps. First, every qualifying order line with its region, category, order, and revenue. Then, revenue and orders per region and category. Last, pick one category per region.',
      "Count orders with COUNT(DISTINCT …), because one order can have several lines in a category. A window over each region can both number the categories and total the region's revenue.",
      'In WITH steps: join lines to orders, customers, and products with the date and status filter; group by region and category; add ROW_NUMBER() and SUM() OVER (PARTITION BY region); keep row 1 with ROUND(100.0 * revenue / region total, 1).',
    ],
    checks: [
      {
        name: "Each region's best March category",
        input: [],
        sql: { seed: 'march' },
        expected: {
          rows: [
            ['North', 'ware', 6700, 2, 55.4],
            ['South', 'coffee', 4800, 1, 76.2],
            ['West', 'ware', 900, 1, 100],
          ],
        },
      },
      {
        name: 'Tied categories by name',
        input: [],
        sql: { seed: 'tied-categories' },
        expected: { rows: [['East', 'coffee', 1000, 1, 50]] },
      },
      { name: 'No qualifying March revenue', input: [], sql: { seed: 'no-march-sales' }, expected: { rows: [] } },
    ],
  },
  {
    id: 'sql-interview-repeat-customers',
    title: 'SQL interview: find repeat customers',
    category: 'SQL',
    format: 'sql',
    functionName: '',
    sql: {
      schema: interviewTables,
      seeds: {
        year: {
          about: 'five customers with orders across 2025 and 2026, one cancelled',
          sql: "INSERT INTO customers VALUES (1,'Ada'),(2,'Bo'),(3,'Cy'),(4,'Di'),(5,'Ed'); INSERT INTO orders VALUES (1,1,'2026-01-05','paid'),(2,1,'2026-01-20','paid'),(3,1,'2026-03-02','shipped'),(4,2,'2026-02-10','paid'),(5,3,'2026-02-01','paid'),(6,3,'2026-02-28','paid'),(7,3,'2026-05-15','cancelled'),(8,4,'2025-12-30','paid'),(9,4,'2026-01-02','paid'),(10,4,'2026-06-30','paid'),(11,4,'2026-12-31','shipped'),(12,5,'2026-04-01','paid'),(13,5,'2026-04-30','paid');",
        },
        'same-name': {
          about: 'two customers both named Kim, each ordering in two months',
          sql: "INSERT INTO customers VALUES (2,'Kim'),(1,'Kim'); INSERT INTO orders VALUES (1,2,'2026-03-03','paid'),(2,2,'2026-04-04','paid'),(3,1,'2026-01-01','paid'),(4,1,'2026-02-02','paid');",
        },
        empty: { about: 'no customers and no orders', sql: '' },
      },
      compare: 'ordered',
      columns: ['name', 'months', 'first_order', 'last_order'],
    },
    context:
      'Interview task. A marketing lead asks which customers came back in different months of 2026. Before writing SQL, restate the question, ask what counts as an order, and say how you would check your answer.',
    prompt:
      "Write one SELECT statement that returns name, months, first_order, and last_order, in that column order, for every customer whose orders that are not 'cancelled' and are placed in 2026 fall in at least two different calendar months. months is the number of different months of 2026 with such an order, and first_order and last_order are the earliest and latest placed_on among those orders. Orders in other years and cancelled orders do not count. Order by months from most to fewest, then name ascending in SQLite's default text order, then customer id ascending. customers has id INTEGER PRIMARY KEY and name TEXT NOT NULL (names can repeat). orders has id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL written as 'YYYY-MM-DD', and status TEXT NOT NULL ('paid', 'shipped', or 'cancelled'). Submit a single statement that only reads data; the checks use SQLite and compare row order.",
    brief: {
      summary:
        'List the customers who ordered in at least two different months of 2026, with how many months and their first and last order.',
      rules: [
        "`customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL)`; names can repeat. `orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, placed_on TEXT NOT NULL, status TEXT NOT NULL)`; placed_on is 'YYYY-MM-DD'; status is 'paid', 'shipped', or 'cancelled'.",
        "Only 2026 orders that are not 'cancelled' count. A customer qualifies with such orders in at least two different calendar months.",
        'Return `name`, `months` (different months), `first_order`, `last_order` (earliest and latest placed_on of the counted orders).',
        "Order by months descending, then name ascending in SQLite's default text order, then customer id. Submit a single statement that only reads data.",
      ],
      edgeCases: [
        'Two orders in one month count as one month.',
        'A cancelled order cannot make a second month.',
        'December 2025 is not part of 2026.',
      ],
    },
    example: { input: 'Ada ordered on 2026-01-05, 2026-01-20, and 2026-03-02', output: "('Ada', 2, '2026-01-05', '2026-03-02')" },
    note: 'This is an interview round: clarify the question, plan aloud, write the query, then explain one boundary you tested. It is untimed here. Checks compare rows and their order; how you clarified and explained is self-reviewed.',
    vocabulary: [{ term: 'Calendar month', meaning: 'a month of a particular year, such as 2026-03, regardless of the day' }],
    planPrompt: 'Restate the question in one sentence, list two questions you would ask the marketing lead, and outline the query.',
    starter: '-- Clarify, plan, then write one SELECT.\n',
    hints: [
      'Settle what counts first: which years, which statuses, and what makes two orders different months.',
      'The first seven characters of placed_on name the month. Counting different values of that per customer gives the number of months.',
      'Join customers to orders, keep 2026 orders that are not cancelled, GROUP BY customer id, HAVING COUNT(DISTINCT substr(placed_on, 1, 7)) >= 2, with MIN and MAX of placed_on.',
    ],
    checks: [
      {
        name: 'Customers with orders in two or more months',
        input: [],
        sql: { seed: 'year' },
        expected: {
          rows: [
            ['Di', 3, '2026-01-02', '2026-12-31'],
            ['Ada', 2, '2026-01-05', '2026-03-02'],
          ],
        },
      },
      {
        name: 'Two customers with the same name',
        input: [],
        sql: { seed: 'same-name' },
        expected: {
          rows: [
            ['Kim', 2, '2026-01-01', '2026-02-02'],
            ['Kim', 2, '2026-03-03', '2026-04-04'],
          ],
        },
      },
      { name: 'No orders', input: [], sql: { seed: 'empty' }, expected: { rows: [] } },
    ],
  },
]
