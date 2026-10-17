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
  'sql-above-average': `SELECT id, cents
FROM invoices
WHERE cents > (SELECT AVG(cents) FROM invoices)
ORDER BY cents DESC, id;`,
  'sql-category-average': `SELECT c.name, c.category, c.price_cents
FROM catalog_items AS c
WHERE c.price_cents > (SELECT AVG(i.price_cents) FROM catalog_items AS i WHERE i.category = c.category)
ORDER BY c.category, c.price_cents DESC, c.name;`,
  'sql-students-without-work': `SELECT st.id, st.name
FROM students AS st
WHERE NOT EXISTS (SELECT 1 FROM submissions AS s WHERE s.student_id = st.id)
ORDER BY st.id;`,
  'sql-free-rooms': `SELECT r.id, r.name
FROM rooms AS r
WHERE NOT EXISTS (
  SELECT 1 FROM bookings AS b
  WHERE b.room_id = r.id AND b.starts_on <= '2026-08-15' AND b.ends_on > '2026-08-15'
)
ORDER BY r.name, r.id;`,
  'sql-strong-months': `WITH monthly AS (
  SELECT substr(sold_on, 1, 7) AS month, SUM(cents) AS total_cents
  FROM sales
  WHERE sold_on BETWEEN '2026-01-01' AND '2026-12-31'
  GROUP BY month
)
SELECT month, total_cents
FROM monthly
WHERE total_cents > (SELECT AVG(total_cents) FROM monthly)
ORDER BY month;`,
  'sql-create-products': `CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
);`,
  'sql-default-values': `CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5)
);`,
  'sql-strict-types': `CREATE TABLE readings (
  id INTEGER PRIMARY KEY,
  sensor TEXT NOT NULL,
  celsius REAL NOT NULL
) STRICT;`,
  'sql-create-memberships': `CREATE TABLE members (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);
CREATE TABLE clubs (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE memberships (
  member_id INTEGER NOT NULL REFERENCES members(id),
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  joined_on TEXT NOT NULL,
  PRIMARY KEY (member_id, club_id)
);`,
  'sql-create-shifts': `CREATE TABLE shifts (
  id INTEGER PRIMARY KEY,
  worker TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cook', 'server', 'host')),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  CHECK (ends_at > starts_at),
  UNIQUE (worker, starts_at)
);`,
  'sql-update-scope': `UPDATE products
SET price_cents = price_cents + 50
WHERE category = 'tea' AND active = 1;`,
  'sql-delete-scope': `DELETE FROM sessions
WHERE expires_at < '2026-06-01 00:00' OR revoked = 1;`,
  'sql-upsert-stock': `INSERT INTO stock (sku, units)
SELECT sku, units FROM incoming WHERE true
ON CONFLICT(sku) DO UPDATE SET units = units + excluded.units;`,
  'sql-archive-orders': `BEGIN;
INSERT INTO archived_orders (id, placed_on, cents)
  SELECT id, placed_on, cents FROM orders WHERE placed_on < '2026-01-01';
DELETE FROM orders WHERE placed_on < '2026-01-01';
COMMIT;`,
  'sql-rank-scores': `SELECT level, player, points,
  ROW_NUMBER() OVER (PARTITION BY level ORDER BY points DESC, player) AS place
FROM scores
ORDER BY level, place;`,
  'sql-competition-rank': `SELECT runner, seconds, RANK() OVER (ORDER BY seconds) AS rank
FROM results
ORDER BY rank, runner;`,
  'sql-day-over-day': `SELECT day, visitors, visitors - LAG(visitors) OVER (ORDER BY day) AS change
FROM visits
ORDER BY day;`,
  'sql-running-balance': `SELECT account, id, cents,
  SUM(cents) OVER (PARTITION BY account ORDER BY posted_on, id) AS balance
FROM ledger
ORDER BY account, posted_on, id;`,
  'sql-top-two-per-region': `WITH ranked AS (
  SELECT region, name, revenue_cents,
    ROW_NUMBER() OVER (PARTITION BY region ORDER BY revenue_cents DESC, name) AS n
  FROM sales_reps
)
SELECT region, name, revenue_cents
FROM ranked
WHERE n <= 2
ORDER BY region, revenue_cents DESC, name;`,
}
