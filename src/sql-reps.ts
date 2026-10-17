import type { Rep, SqlTask } from './rep-types.ts'

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
]
