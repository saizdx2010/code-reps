// Independent reference queries for the SQL track (src/sql-reps.ts). Each runs as written against every check.
export const sqlSolutions = {
  'sql-select-columns': `SELECT title, author, year AS published
FROM books;`,
  'sql-filter-sort': `SELECT title, year
FROM movies
WHERE genre = 'Drama' AND year < 2000
ORDER BY year, title;`,
  'sql-distinct-cities': `SELECT DISTINCT city
FROM customers
WHERE country = 'NO'
ORDER BY city;`,
  'sql-recent-open-tickets': `SELECT id, subject
FROM tickets
WHERE status = 'open'
ORDER BY opened_at DESC, id DESC
LIMIT 3;`,
  'sql-catalog-page': `SELECT name, price_cents
FROM products
WHERE active = 1
ORDER BY price_cents, name, id
LIMIT 4 OFFSET 4;`,
  'sql-line-totals': `SELECT id, quantity * unit_cents AS total_cents
FROM order_lines
ORDER BY total_cents DESC, product, id;`,
}
