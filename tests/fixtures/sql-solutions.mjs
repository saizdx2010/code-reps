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
}
