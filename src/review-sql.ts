import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Post-attempt reviews for the SQL track. Keep these out of independent and recall prompts.
export const sqlDepth: Record<string, RepDepth> = {
  'sql-select-columns': {
    reasoning:
      'A SELECT list is a projection: it chooses which columns appear and in what order, while FROM decides which rows are read. Without WHERE, DISTINCT, or LIMIT, every stored row produces exactly one result row, so duplicates and NULL values pass through unchanged. AS renames only the result heading; the stored year column keeps its name.',
    trace:
      'With the copies data, SQLite reads row 1 (Emma, 1815), row 2 (Persuasion, 1817), and row 3 (Emma, 1815). Each becomes one result row with title, author, and year under the heading published, so Emma appears twice. With the unknown-year data, The Pillow Book has year NULL, and published is NULL too: projection copies the value, it does not invent one.',
    alternative:
      'SELECT * returns all five stored columns, which is quick for exploring but couples the screen to every column the table ever gains, and here it fails the column contract. Renaming in application code instead of with AS works, but then the query result no longer matches the name the screen uses. Listing the columns makes the result shape explicit and is the usual choice for code that depends on it.',
    counterexample:
      'SELECT DISTINCT title, author, year AS published looks harmless but merges the two identical Emma rows into one, so the copies check reports one row missing. Writing published without AS (SELECT title, author, published) fails because no stored column has that name.',
    transfer:
      'The catalog screen now also wants a fourth column, pages_per_year, that divides pages by the age of the book in years. Decide what the result should show when the year is unknown, and whether integer division is acceptable. This changed contract is self-reviewed; the original checks do not cover it.',
  },
}

export const sqlGuides: Record<string, ReflectionGuide> = {
  'sql-select-columns': {
    plan: ['Name the three result columns in order and where each value comes from.', 'Decide whether any stored row should be left out.'],
    explanation: [
      'Explain what SELECT * returned and why the contract rejects it.',
      'Explain why both Emma rows appear and why an unknown year stays NULL.',
    ],
    example:
      'I select title, author, and year AS published from books. There is no WHERE or DISTINCT, so each stored row gives exactly one result row; the two Emma copies stay, and a NULL year stays NULL because the query copies the value.',
  },
}
