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
]
