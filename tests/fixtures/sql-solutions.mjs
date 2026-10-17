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
  'sql-filter-groups': `SELECT id, title
FROM listings
WHERE category IN ('Poetry', 'Drama') AND price_cents < 1500 AND in_stock = 1
ORDER BY id;`,
  'sql-price-band': `SELECT name, nightly_cents
FROM rooms
WHERE nightly_cents BETWEEN 8000 AND 12000 AND beds >= 2
ORDER BY nightly_cents, name;`,
  'sql-code-pattern': `SELECT code, name
FROM parts
WHERE code LIKE 'BR-___'
ORDER BY code;`,
  'sql-members-to-text': `SELECT id, name
FROM members
WHERE phone <> '' AND (status <> 'blocked' OR status IS NULL)
ORDER BY name, id;`,
  'sql-search-articles': `SELECT id, title
FROM articles
WHERE published_at IS NOT NULL AND section IN ('guides', 'news') AND title LIKE '%sql%'
ORDER BY published_at DESC, id;`,
  'sql-count-by-status': `SELECT status, COUNT(*) AS order_count
FROM shop_orders
GROUP BY status
ORDER BY order_count DESC, status;`,
  'sql-ratings-summary': `SELECT product, COUNT(*) AS reviews, COUNT(stars) AS rated, ROUND(AVG(stars), 2) AS avg_stars
FROM reviews
GROUP BY product
ORDER BY product;`,
  'sql-count-visitors': `SELECT page, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
FROM page_views
GROUP BY page
ORDER BY views DESC, page;`,
  'sql-busy-days': `SELECT day, COUNT(*) AS deliveries
FROM deliveries
WHERE status <> 'cancelled'
GROUP BY day
HAVING COUNT(*) >= 3
ORDER BY day;`,
  'sql-month-spenders': `SELECT account, COUNT(*) AS payments, SUM(amount_cents) AS total_cents
FROM payments
WHERE paid_on BETWEEN '2026-03-01' AND '2026-03-31'
GROUP BY account
HAVING SUM(amount_cents) >= 10000
ORDER BY total_cents DESC, account;`,
  'sql-join-orders': `SELECT o.id, c.name, o.cents
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
ORDER BY o.id;`,
  'sql-customers-without-orders': `SELECT c.id, c.name
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.name, c.id;`,
  'sql-team-totals': `SELECT t.name, COALESCE(m.members, 0) AS members, COALESCE(e.total, 0) AS expense_cents
FROM teams AS t
LEFT JOIN (SELECT team_id, COUNT(*) AS members FROM team_members GROUP BY team_id) AS m ON m.team_id = t.id
LEFT JOIN (SELECT team_id, SUM(cents) AS total FROM expenses GROUP BY team_id) AS e ON e.team_id = t.id
ORDER BY t.name;`,
  'sql-june-returns': `SELECT p.name, COUNT(r.id) AS june_returns
FROM products AS p
LEFT JOIN product_returns AS r
  ON r.product_id = p.id AND r.returned_on BETWEEN '2026-06-01' AND '2026-06-30'
GROUP BY p.id
ORDER BY june_returns DESC, p.name;`,
  'sql-authors-latest': `SELECT a.name, COUNT(b.id) AS books, MAX(b.year) AS latest_year
FROM authors AS a
LEFT JOIN books AS b ON b.author_id = a.id
GROUP BY a.id
ORDER BY a.name, a.id;`,
}
