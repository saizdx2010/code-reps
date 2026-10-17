import type { Skill } from './knowledge.ts'
import { q } from './knowledge-question.ts'

// SQL track lessons. Checked questions keep their IDs and answer contracts once shipped.
export const sqlSkills: Skill[] = [
  {
    id: 'sql-reading',
    title: 'Read rows with SELECT, WHERE, ORDER BY, and LIMIT',
    summary: 'Choose columns, keep matching rows, put them in a defined order, and take a slice of the result.',
    prerequisites: [],
    objectives: [
      'Read a query in the order SQLite works through it: FROM, WHERE, SELECT, ORDER BY, then LIMIT and OFFSET.',
      'Filter with comparisons joined by AND, writing text values in single quotes.',
      'Give every result a complete order, with tie-breakers, before taking a page of it.',
    ],
    sections: [
      {
        title: 'A query describes its result',
        body: 'A table stores rows; every row has the same named columns. `SELECT title, year FROM movies` asks for two columns of every row in movies. You describe the result and SQLite decides how to produce it. AS renames a result column without changing the stored one, and `SELECT DISTINCT` removes result rows that repeat another row exactly. These lessons and checks use SQLite; other databases share most of this but differ in details.',
      },
      {
        title: 'WHERE keeps matching rows',
        body: "WHERE runs before SELECT and keeps a row only when its condition is true. Compare with =, <, <=, >, >=, and <> (not equal). AND requires both conditions; text values go in single quotes, as in `genre = 'Drama'`, and SQLite compares text exactly, letter case included. A comparison with NULL, the marker for an unknown value, is never true, so a row with an unknown year fails `year < 2000` as well as `year >= 2000`.",
      },
      {
        title: 'ORDER BY makes the order a promise',
        body: 'Without ORDER BY, SQLite returns rows in whatever order is convenient; the order you happen to see is not part of the result. ORDER BY takes a list of keys: the first key sorts, and each later key orders only the rows that tie on the keys before it. Add DESC after a key for largest or latest first; ascending is the default. Text sorts by character code by default, so capital letters come before lowercase ones and Å comes after Z.',
      },
      {
        title: 'LIMIT and OFFSET take a slice',
        body: 'LIMIT 3 keeps the first three rows of the sorted result; OFFSET 4 skips four rows first. They apply last, after sorting, so the slice is only as stable as the order: two equal prices without a tie-breaker can swap between pages. Page n of size k skips (n - 1) × k rows and keeps k. A page past the end is simply empty.',
      },
    ],
    example: "SELECT title, year\nFROM movies\nWHERE genre = 'Drama' AND year < 2000\nORDER BY year, title\nLIMIT 2;",
    walkthrough: [
      'FROM movies reads every stored film.',
      'WHERE keeps dramas from before 2000; a film with an unknown year is not kept.',
      'SELECT keeps two columns of each remaining row.',
      'ORDER BY sorts by year, and by title within a year.',
      'LIMIT keeps the first two rows of that order.',
    ],
    mistakes: [
      'Relying on the order rows happened to appear in, without ORDER BY.',
      'Sorting by one key when ties are possible, so equal rows can swap places or pages.',
      'Writing text in double quotes: in SQLite double quotes name a column, and only fall back to text when no column matches.',
      'Expecting LIMIT to choose the best rows without sorting first.',
    ],
    questions: [
      q(
        'unordered-v1',
        'Without ORDER BY, which order does SQLite promise for the result rows?',
        'SELECT title FROM movies;',
        ['The order the rows were inserted', 'Primary key order', 'No particular order'],
        2,
        'Only ORDER BY makes order part of the result. The order you see without it can change with indexes, data, or versions.',
      ),
      q(
        'offset-page-v1',
        'Rows sort as A, B, C, D, E, F. Which rows does LIMIT 2 OFFSET 2 return?',
        '',
        ['A, B', 'C, D', 'E, F'],
        1,
        'OFFSET 2 skips A and B; LIMIT 2 keeps the next two rows, C and D. This is page 2 of size 2.',
      ),
      q(
        'null-filter-v1',
        'A movie has year NULL. Which WHERE condition keeps it?',
        '',
        ['year < 2000', 'year >= 2000', 'Neither'],
        2,
        'A comparison with NULL is unknown, never true, so the row fails both conditions. Testing for NULL needs IS NULL, covered in the next stage.',
      ),
    ],
    repIds: [
      'sql-select-columns',
      'sql-filter-sort',
      'sql-distinct-cities',
      'sql-line-totals',
      'sql-recent-open-tickets',
      'sql-catalog-page',
    ],
    related: ['databases'],
  },
  {
    id: 'sql-filtering',
    title: 'Filter precisely: AND, OR, IN, LIKE, and NULL',
    summary: 'Group conditions so they mean what you intend, match lists, ranges, and patterns, and handle unknown values on purpose.',
    prerequisites: ['sql-reading'],
    objectives: [
      'Predict how AND and OR combine without parentheses, and add parentheses that state the intent.',
      'Use IN, BETWEEN, and LIKE with % and _ for lists, inclusive ranges, and patterns.',
      'Explain three-valued logic and test for missing values with IS NULL.',
    ],
    sections: [
      {
        title: 'AND is applied before OR',
        body: "In `a OR b AND c`, AND binds first, so it means `a OR (b AND c)`. A filter for poetry or drama under 15.00 written that way lets every poetry book through at any price. Parentheses state what belongs together: `(category = 'Poetry' OR category = 'Drama') AND price_cents < 1500`. When the alternatives are values of one column, `category IN ('Poetry', 'Drama')` says the same thing more briefly.",
      },
      {
        title: 'Ranges and patterns',
        body: "`x BETWEEN 8000 AND 12000` includes both ends, exactly like `x >= 8000 AND x <= 12000`. LIKE matches text against a pattern: % stands for any run of characters, including none, and _ for exactly one character, so `'BR-___'` matches BR- and three more characters. In SQLite, LIKE ignores letter case for ASCII letters while = does not; other databases differ, which is why a rep says which rule it uses.",
      },
      {
        title: 'NULL means unknown',
        body: "SQL conditions have three outcomes: true, false, and unknown. Any comparison with NULL, even `NULL = NULL`, is unknown, and WHERE keeps only true rows. So `status <> 'blocked'` drops rows whose status is NULL, although NULL is not 'blocked'. Test missing values directly with `IS NULL` or `IS NOT NULL`, and decide on purpose what an unknown value should mean for your result.",
      },
      {
        title: 'NOT and lists with NULL',
        body: "NOT turns true into false and unknown stays unknown. `x NOT IN (1, NULL)` is never true, because x might equal the unknown value; this is a classic way for a filter to return nothing. Keep NULLs out of the lists you write, and when a column may be NULL, name what NULL should do: `(status <> 'blocked' OR status IS NULL)`.",
      },
    ],
    example: "SELECT id, title\nFROM listings\nWHERE category IN ('Poetry', 'Drama')\n  AND price_cents < 1500\n  AND in_stock = 1;",
    walkthrough: [
      'IN keeps rows whose category is either value, so no OR needs grouping.',
      'Each AND condition must also be true, for poetry and drama alike.',
      'A listing with price 1500 fails the strict comparison.',
      'If price_cents were NULL, the comparison would be unknown and the row would be left out.',
    ],
    mistakes: [
      'Mixing AND and OR without parentheses and getting a different filter than intended.',
      "Writing `column = NULL` or `column <> 'x'` and silently losing the rows where the column is NULL.",
      'Using % where exactly one character is meant, so longer or shorter values match.',
      'Assuming LIKE treats letter case the same way in every database.',
    ],
    questions: [
      q(
        'and-or-v1',
        'Which rows does this keep?',
        "WHERE kind = 'tea' OR kind = 'coffee' AND price < 5",
        ['Cheap tea and cheap coffee', 'All tea, and coffee under 5', 'Nothing, the condition is invalid'],
        1,
        'AND binds first, so the condition means kind = tea OR (kind = coffee AND price < 5). Every tea passes at any price.',
      ),
      q(
        'like-underscore-v1',
        "Which code does LIKE 'A_1' match?",
        '',
        ['A1', 'AB1', 'ABC1'],
        1,
        '_ stands for exactly one character, so only AB1 has the right length. % would also match A1 and ABC1.',
      ),
      q(
        'null-not-equal-v1',
        "A row has status NULL. Does WHERE status <> 'blocked' keep it?",
        '',
        ['Yes, NULL is not blocked', 'No, the comparison is unknown', 'Only in SQLite'],
        1,
        'Comparing with NULL gives unknown, and WHERE keeps only true rows. Add OR status IS NULL to keep it.',
      ),
    ],
    repIds: ['sql-filter-groups', 'sql-price-band', 'sql-code-pattern', 'sql-members-to-text', 'sql-search-articles'],
    related: ['sql-reading'],
  },
  {
    id: 'sql-summarizing',
    title: 'Summarize with COUNT, SUM, AVG, GROUP BY, and HAVING',
    summary: 'Fold rows into one result per group, count what you mean to count, and filter before and after grouping.',
    prerequisites: ['sql-filtering'],
    objectives: [
      'Choose between COUNT(*), COUNT(column), and COUNT(DISTINCT column), and predict SUM and AVG with NULL values.',
      'Write GROUP BY so that each result row stands for one group.',
      'Put a filter on rows in WHERE and a filter on groups in HAVING.',
    ],
    sections: [
      {
        title: 'Aggregates fold many rows into one value',
        body: 'COUNT(*) counts rows. COUNT(stars) counts the rows where stars is not NULL, and COUNT(DISTINCT visitor) counts different non-NULL values. SUM, AVG, MIN, and MAX skip NULL values too, and over no values SUM, AVG, MIN, and MAX give NULL while COUNT gives 0. AVG returns a real number; ROUND(AVG(stars), 2) keeps two decimal places.',
      },
      {
        title: 'GROUP BY makes one row per group',
        body: 'GROUP BY status puts rows with the same status into one group, and each aggregate then works on one group at a time. Rows whose status is NULL form a single group of their own. Every selected column should either be grouped or sit inside an aggregate; SQLite accepts other columns but fills them from an arbitrary row of the group, which is rarely what you want. An empty table has no groups, so a grouped query returns no rows.',
      },
      {
        title: 'WHERE runs before grouping, HAVING after',
        body: "SQLite works through FROM, WHERE, GROUP BY, HAVING, SELECT, then ORDER BY. WHERE removes single rows before they are grouped, so `WHERE status <> 'cancelled'` keeps cancelled deliveries out of every count. HAVING removes whole groups after the aggregates exist, so `HAVING COUNT(*) >= 3` keeps busy days. An aggregate cannot appear in WHERE, because no group exists yet at that point.",
      },
      {
        title: 'Name and sort the summary',
        body: 'Give each aggregate a column name with AS, such as COUNT(*) AS order_count, and ORDER BY that name. A summary still needs a tie-breaker: two statuses with the same count otherwise come out in an order SQLite does not promise.',
      },
    ],
    example:
      "SELECT day, COUNT(*) AS deliveries\nFROM deliveries\nWHERE status <> 'cancelled'\nGROUP BY day\nHAVING COUNT(*) >= 3\nORDER BY day;",
    walkthrough: [
      'WHERE drops cancelled deliveries before anything is counted.',
      'GROUP BY day makes one group per remaining day.',
      'COUNT(*) counts the deliveries in each group.',
      'HAVING keeps only days with at least three, and ORDER BY sorts them by day.',
    ],
    mistakes: [
      'Using COUNT(*) when the question is how many rows have a value, or the reverse.',
      'Filtering an aggregate in WHERE, or filtering single rows in HAVING after they have already been counted.',
      'Selecting a column that is neither grouped nor aggregated and trusting the value SQLite picks.',
      'Expecting a grouped query over no rows to return a row with a count of 0.',
    ],
    questions: [
      q(
        'count-null-v1',
        'Three reviews have stars 5, NULL, and 3. What are COUNT(*) and COUNT(stars)?',
        '',
        ['3 and 3', '3 and 2', '2 and 2'],
        1,
        'COUNT(*) counts every row; COUNT(stars) skips the NULL value.',
      ),
      q(
        'having-v1',
        'Which clause can keep only the days with at least three deliveries?',
        'SELECT day, COUNT(*) FROM deliveries GROUP BY day',
        ['WHERE COUNT(*) >= 3', 'HAVING COUNT(*) >= 3', 'Either one'],
        1,
        'The count exists only after grouping, so the filter belongs in HAVING. WHERE runs before any group is formed.',
      ),
      q(
        'empty-sum-v1',
        'The payments table is empty. What does SELECT SUM(amount_cents) FROM payments return?',
        '',
        ['One row with 0', 'One row with NULL', 'No rows'],
        1,
        'Without GROUP BY an aggregate query always returns one row, and the sum of no values is NULL. COUNT(*) would give 0.',
      ),
    ],
    repIds: ['sql-count-by-status', 'sql-ratings-summary', 'sql-count-visitors', 'sql-busy-days', 'sql-month-spenders'],
    related: ['sql-filtering'],
  },
  {
    id: 'sql-joining',
    title: 'Combine tables with JOIN',
    summary: 'Pair rows of two tables, keep rows that have no match, and avoid sums that a join multiplies.',
    prerequisites: ['sql-summarizing'],
    objectives: [
      'Write an inner join with an ON condition and qualified column names.',
      'Use a LEFT JOIN to keep unmatched rows, and place a condition in ON or WHERE on purpose.',
      'Recognize join fan-out and summarize each list before joining.',
    ],
    sections: [
      {
        title: 'A join pairs matching rows',
        body: 'FROM orders AS o JOIN customers AS c ON o.customer_id = c.id makes one result row for every pair of rows that satisfies the ON condition. An order with no matching customer, and a customer with no orders, produce no pair, so an inner join leaves them out. A customer with three orders appears three times. When both tables have a column called id, write o.id or c.id so SQLite knows which one you mean.',
      },
      {
        title: 'LEFT JOIN keeps the first table',
        body: 'customers AS c LEFT JOIN orders AS o ON o.customer_id = c.id keeps every customer. A customer with no orders appears once, with every column of orders set to NULL. That NULL is how you find missing matches: WHERE o.id IS NULL keeps exactly the customers with no orders. COUNT(o.id) counts 0 for them, while COUNT(*) would count their single row as 1.',
      },
      {
        title: 'ON decides the pairs, WHERE decides the rows',
        body: "With a LEFT JOIN, a condition on the second table means different things in different places. In ON, `AND r.returned_on >= '2026-06-01'` only limits which returns pair up, so every product still appears. In WHERE, the same condition runs after the join and removes the rows where r.returned_on is NULL, which turns the LEFT JOIN back into an inner join.",
      },
      {
        title: 'Fan-out multiplies sums',
        body: 'Joining a team to its 3 members and its 2 expenses produces 3 × 2 = 6 rows, so COUNT(m.id) reports 6 and SUM(e.cents) adds each expense three times. DISTINCT does not repair a sum, because two real expenses can have the same amount. Summarize each list first, one row per team, in a derived table such as (SELECT team_id, SUM(cents) AS total FROM expenses GROUP BY team_id), or in a subquery per column, and join the summaries instead.',
      },
    ],
    example:
      "SELECT p.name, COUNT(r.id) AS june_returns\nFROM products AS p\nLEFT JOIN product_returns AS r\n  ON r.product_id = p.id\n AND r.returned_on BETWEEN '2026-06-01' AND '2026-06-30'\nGROUP BY p.id\nORDER BY june_returns DESC, p.name;",
    walkthrough: [
      'Every product is kept by the LEFT JOIN.',
      'Only June returns pair up, because the date is part of ON.',
      'A product with no June return has one row with r.id NULL, which COUNT(r.id) counts as 0.',
      'Grouping by p.id keeps two products with the same name apart.',
    ],
    mistakes: [
      'Using an inner join when rows without a match must still appear.',
      'Putting a condition on the second table of a LEFT JOIN in WHERE and losing the unmatched rows.',
      'Counting with COUNT(*) after a LEFT JOIN, which counts an unmatched row as 1.',
      'Joining two one-to-many lists at once and summing the multiplied rows.',
    ],
    questions: [
      q(
        'inner-join-rows-v1',
        'Ada has two orders and Bo has none. How many rows does customers JOIN orders ON orders.customer_id = customers.id return?',
        '',
        ['1', '2', '3'],
        1,
        'Each of Ada’s two orders makes a pair; Bo has no pair, so the inner join leaves him out.',
      ),
      q(
        'left-join-where-v1',
        'After customers c LEFT JOIN orders o ON o.customer_id = c.id, which line removes customers who have no orders?',
        '',
        ['ON o.cents > 0 added to the join condition', 'WHERE o.cents > 0', 'ORDER BY o.cents'],
        1,
        'For a customer with no orders, o.cents is NULL, so o.cents > 0 is unknown and WHERE drops the row. In ON it would only limit which orders pair up.',
      ),
      q(
        'fan-out-v1',
        'A team has 2 members and 3 expenses of 100 cents. Joining the team to both lists and summing expense cents gives what?',
        '',
        ['300', '600', '100'],
        1,
        'The join makes 2 × 3 = 6 rows, so each expense is added twice: 600. Summing expenses before the join gives the real 300.',
      ),
    ],
    repIds: ['sql-join-orders', 'sql-customers-without-orders', 'sql-team-totals', 'sql-june-returns', 'sql-authors-latest'],
    related: ['sql-summarizing', 'databases'],
  },
  {
    id: 'sql-subqueries',
    title: 'Ask in steps: subqueries, EXISTS, and WITH',
    summary: 'Use the answer of one query inside another, test whether related rows exist, and name the steps of a longer question.',
    prerequisites: ['sql-joining'],
    objectives: [
      'Compare rows with a value computed by a scalar subquery, including one correlated with the outer row.',
      'Use EXISTS and NOT EXISTS for questions about related rows, and avoid NOT IN with NULL.',
      'Break a question into named steps with WITH.',
    ],
    sections: [
      {
        title: 'A subquery can stand for a value',
        body: 'A SELECT in parentheses that produces one value can stand wherever a value goes: WHERE cents > (SELECT AVG(cents) FROM invoices) compares every invoice with the average of all of them. A correlated subquery refers to the outer row, as in (SELECT AVG(price_cents) FROM catalog_items AS i WHERE i.category = c.category), so each row gets the average of its own category. Give the tables aliases so the two copies of a table cannot be confused.',
      },
      {
        title: 'EXISTS asks whether related rows are there',
        body: 'EXISTS (subquery) is true when the subquery returns at least one row, whatever it selects; NOT EXISTS is true when it returns none. WHERE NOT EXISTS (SELECT 1 FROM bookings AS b WHERE b.room_id = r.id AND …) keeps rooms with no matching booking. Unlike a join, EXISTS never repeats the outer row, however many matches there are.',
      },
      {
        title: 'NOT IN and NULL',
        body: 'x IN (subquery) works like a list of values. NOT IN has a trap: if the subquery returns a NULL, x NOT IN (…) can never be true, because x might equal the unknown value. A single guest submission with student_id NULL then hides every student. Prefer NOT EXISTS, or filter the NULL out inside the subquery.',
      },
      {
        title: 'WITH names the steps',
        body: 'WITH monthly AS (SELECT substr(sold_on, 1, 7) AS month, SUM(cents) AS total_cents FROM sales GROUP BY month) SELECT … FROM monthly … defines a named result, a common table expression, that the main query reads like a table, as many times as it needs. Steps read top to bottom, each one small enough to check on its own. A derived table in FROM does the same job without a name.',
      },
    ],
    example:
      'WITH monthly AS (\n  SELECT substr(sold_on, 1, 7) AS month, SUM(cents) AS total_cents\n  FROM sales\n  GROUP BY month\n)\nSELECT month, total_cents\nFROM monthly\nWHERE total_cents > (SELECT AVG(total_cents) FROM monthly);',
    walkthrough: [
      'The WITH step turns sales into one row per month with its total.',
      'The scalar subquery averages those monthly totals once.',
      'The main query keeps the months above that average.',
      'Each step can be run alone while you check it.',
    ],
    mistakes: [
      'Writing NOT IN (subquery) over a column that can be NULL and getting no rows.',
      'Forgetting to correlate a subquery, so every row is compared with the whole table.',
      'Using a join where EXISTS is meant, and repeating rows once per match.',
      'Assuming a scalar subquery that returns several rows is an error: SQLite quietly uses the first row.',
    ],
    questions: [
      q(
        'not-in-null-v1',
        'submissions.student_id holds 1, 2, and NULL. Which students does WHERE id NOT IN (SELECT student_id FROM submissions) return?',
        '',
        ['Every student except 1 and 2', 'No students', 'Every student'],
        1,
        'For student 3, 3 NOT IN (1, 2, NULL) is unknown, because 3 might equal the unknown value. WHERE keeps no unknown rows, so nobody is returned.',
      ),
      q(
        'exists-v1',
        'When is EXISTS (subquery) true?',
        '',
        [
          'When the subquery returns at least one row',
          'When the subquery returns a value that is not NULL',
          'When the subquery returns exactly one row',
        ],
        0,
        'EXISTS only asks whether rows come back. Even SELECT NULL inside it makes EXISTS true when a row matches.',
      ),
      q(
        'correlated-v1',
        'Which subquery gives each product the average price of its own category?',
        'SELECT name FROM catalog_items AS c WHERE price_cents > (…)',
        [
          'SELECT AVG(price_cents) FROM catalog_items',
          'SELECT AVG(price_cents) FROM catalog_items AS i WHERE i.category = c.category',
          'SELECT AVG(price_cents) FROM catalog_items GROUP BY category',
        ],
        1,
        'Only the correlated version refers to the outer row c. The grouped version returns several rows, and SQLite would quietly compare with the first.',
      ),
    ],
    repIds: ['sql-above-average', 'sql-category-average', 'sql-students-without-work', 'sql-free-rooms', 'sql-strong-months'],
    related: ['sql-joining', 'sql-summarizing'],
  },
  {
    id: 'sql-schema-design',
    title: 'Design a table: keys, constraints, and types',
    summary: 'Let the table itself refuse bad rows with keys, NOT NULL, UNIQUE, CHECK, DEFAULT, foreign keys, and SQLite’s STRICT tables.',
    prerequisites: ['sql-reading'],
    objectives: [
      'Write CREATE TABLE with a primary key and column rules for required, unique, and allowed values.',
      'Use DEFAULT for values an insert leaves out, and explain why an explicit NULL is different.',
      'Link tables with foreign keys and know what SQLite enforces by default, including STRICT typing.',
    ],
    sections: [
      {
        title: 'Rules belong in the table',
        body: 'Application code changes and has bugs; a constraint applies to every insert from every program. INTEGER PRIMARY KEY gives each row a unique id that SQLite fills in when an insert leaves it out. NOT NULL rejects a missing value. UNIQUE rejects a second row with the same value, though several NULLs never clash with each other. CHECK (price_cents >= 0) rejects any row for which the condition is false.',
      },
      {
        title: 'Defaults fill what an insert leaves out',
        body: "status TEXT NOT NULL DEFAULT 'open' gives a new row 'open' when the insert does not name status. A default does not replace an explicit NULL: INSERT … (status) VALUES (NULL) still hits NOT NULL. Rules about allowed values, such as CHECK (status IN ('open', 'done')), apply to defaults and given values alike.",
      },
      {
        title: 'Rules over several columns',
        body: 'Some rules involve more than one column, so they are written after the columns as table constraints: CHECK (ends_at > starts_at) compares two values of the same row, UNIQUE (worker, starts_at) refuses a repeated pair while allowing each value alone to repeat, and PRIMARY KEY (member_id, club_id) makes a pair the identity of a row in a linking table.',
      },
      {
        title: 'Foreign keys and types in SQLite',
        body: 'member_id INTEGER REFERENCES members(id) declares that each value must match a member. SQLite enforces this only after PRAGMA foreign_keys = ON on that connection; by default it stores the row anyway. SQLite also treats a declared type as a preference, its type affinity: a REAL column accepts the text warm. Adding STRICT after the closing bracket of CREATE TABLE makes SQLite reject values that cannot be stored as the declared type. Other databases differ on both points.',
      },
    ],
    example:
      "CREATE TABLE tasks (\n  id INTEGER PRIMARY KEY,\n  title TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'open'\n    CHECK (status IN ('open', 'done')),\n  priority INTEGER NOT NULL DEFAULT 3\n    CHECK (priority BETWEEN 1 AND 5)\n);",
    walkthrough: [
      "INSERT INTO tasks (title) VALUES ('Plan') stores status 'open' and priority 3.",
      "INSERT … (title, status) VALUES ('Plan', 'blocked') fails the status CHECK.",
      "INSERT … (title, status) VALUES ('Plan', NULL) fails NOT NULL: the default does not apply.",
      "INSERT … (title, priority) VALUES ('Plan', 6) fails the priority CHECK.",
    ],
    mistakes: [
      'Expecting UNIQUE to reject a second NULL.',
      'Expecting a DEFAULT to replace an explicit NULL.',
      'Declaring REFERENCES and assuming SQLite enforces it without PRAGMA foreign_keys = ON.',
      'Assuming a declared column type rejects other values in a table that is not STRICT.',
    ],
    questions: [
      q(
        'unique-null-v1',
        'A column is declared email TEXT UNIQUE. How many rows with email NULL can the table hold?',
        '',
        ['One', 'Any number', 'None'],
        1,
        'UNIQUE compares known values. NULLs are not equal to each other, so they never clash. Add NOT NULL if a value is required.',
      ),
      q(
        'default-null-v1',
        "status is TEXT NOT NULL DEFAULT 'open'. What happens to INSERT INTO tasks (title, status) VALUES ('Plan', NULL)?",
        '',
        ["SQLite stores 'open'", 'SQLite rejects it', 'SQLite stores NULL'],
        1,
        'The insert names status and gives NULL, so the default does not apply and NOT NULL rejects the row.',
      ),
      q(
        'foreign-key-default-v1',
        'orders.customer_id REFERENCES customers(id), with SQLite’s default settings. What happens to an order for customer 99, who does not exist?',
        '',
        ['It is rejected', 'It is stored', 'SQLite creates customer 99'],
        1,
        'SQLite checks foreign keys only after PRAGMA foreign_keys = ON on the connection. By default the order is stored.',
      ),
    ],
    repIds: ['sql-create-products', 'sql-default-values', 'sql-strict-types', 'sql-create-memberships', 'sql-create-shifts'],
    related: ['databases', 'sql-joining'],
  },
  {
    id: 'sql-changing-data',
    title: 'Change data safely: UPDATE, DELETE, upserts, and transactions',
    summary:
      'Scope every change with WHERE, insert from queries and upsert on conflicts, group related changes, and bind values from code.',
    prerequisites: ['sql-filtering', 'sql-schema-design'],
    objectives: [
      'Write UPDATE and DELETE whose WHERE clause picks exactly the intended rows.',
      'Insert rows from a query, and upsert with ON CONFLICT … DO UPDATE using excluded.',
      'Wrap related changes in a transaction, and pass values from code as parameters.',
    ],
    sections: [
      {
        title: 'WHERE is the scope of a change',
        body: "UPDATE products SET price_cents = price_cents + 50 changes every row; adding WHERE category = 'tea' AND active = 1 limits it to the rows a SELECT with that WHERE would return. Run that SELECT first on real data. DELETE works the same way, and without WHERE it empties the table. SQLite's changes() reports how many rows the last statement changed.",
      },
      {
        title: 'Insert from a query, or update on conflict',
        body: "INSERT INTO archived_orders SELECT id, placed_on, cents FROM orders WHERE … copies rows a query finds. An upsert, INSERT … ON CONFLICT(sku) DO UPDATE SET units = units + excluded.units, updates the existing row when the key is taken; excluded is the row that was about to be inserted. When the rows come from a SELECT, SQLite needs a WHERE clause before ON CONFLICT, even WHERE true, to read it unambiguously. SQLite checks the inserted row's CHECK constraints before it resolves the conflict, so a negative correction to an existing row can fail as an insert.",
      },
      {
        title: 'Transactions make several statements one change',
        body: 'Moving rows is an insert plus a delete; if the second fails after the first succeeded, the data is half moved. BEGIN starts a transaction, COMMIT makes all its changes permanent together, and ROLLBACK undoes everything since BEGIN. Every statement on its own is already atomic; a transaction extends that to a group.',
      },
      {
        title: 'From application code, bind values',
        body: "In TypeScript, pass values separately: db.run('UPDATE stock SET units = units + ? WHERE sku = ?', [units, sku]). The database receives the SQL and the values apart, so a SKU containing a quote, or a hostile one, can never become SQL. Building the text with string concatenation is how SQL injection happens.",
      },
    ],
    example:
      "BEGIN;\nINSERT INTO archived_orders\n  SELECT id, placed_on, cents FROM orders\n  WHERE placed_on < '2026-01-01';\nDELETE FROM orders WHERE placed_on < '2026-01-01';\nCOMMIT;",
    walkthrough: [
      'BEGIN opens a transaction.',
      'The INSERT copies every 2025 order into the archive.',
      'The DELETE removes exactly the same rows, chosen by the same condition.',
      'COMMIT makes both changes permanent together; after a failure, ROLLBACK would undo the copy.',
    ],
    mistakes: [
      'Running UPDATE or DELETE without WHERE, or with a WHERE you never previewed.',
      'Copying and deleting with two slightly different conditions, so rows are lost or duplicated.',
      'Leaving out WHERE true before ON CONFLICT in INSERT … SELECT, which SQLite cannot parse.',
      'Concatenating values into SQL text from application code instead of binding them.',
    ],
    questions: [
      q(
        'update-scope-v1',
        'How many rows does this change in a table of 40 products, 3 of them teas?',
        'UPDATE products SET price_cents = price_cents + 50;',
        ['3', '40', 'None until COMMIT'],
        1,
        'Without WHERE, UPDATE changes every row. Outside an explicit transaction the change is committed at once.',
      ),
      q(
        'excluded-v1',
        'In ON CONFLICT(sku) DO UPDATE SET units = units + excluded.units, what is excluded.units?',
        '',
        ['The units already stored', 'The units of the row that was about to be inserted', 'The units removed by the conflict'],
        1,
        'excluded is the proposed row; units alone refers to the stored row being updated.',
      ),
      q(
        'binding-v1',
        'Which call is safe when sku comes from a form?',
        '',
        [
          'db.run("DELETE FROM stock WHERE sku = \'" + sku + "\'")',
          "db.run('DELETE FROM stock WHERE sku = ?', [sku])",
          'Both, if the form trims spaces',
        ],
        1,
        'Binding keeps the value apart from the SQL text, so a quote in the SKU stays data. Trimming does not remove quotes.',
      ),
    ],
    repIds: [
      'sql-update-scope',
      'sql-delete-scope',
      'sql-upsert-stock',
      'sqlite-customer-totals',
      'sqlite-stock-transfer',
      'sqlite-restock-upsert',
      'sql-archive-orders',
    ],
    related: ['sql-schema-design', 'databases'],
  },
]
