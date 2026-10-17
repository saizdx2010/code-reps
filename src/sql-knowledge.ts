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
]
