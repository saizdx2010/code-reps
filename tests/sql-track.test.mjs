import assert from 'node:assert/strict'
import test from 'node:test'
import initSqlJs from 'sql.js'
import { runRep } from '../src/runner.ts'
import { reps } from '../src/rep.ts'
import { paths } from '../src/path.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { sqlSolutions } from './fixtures/sql-solutions.mjs'

const SQL = await initSqlJs()
const failed = (id, code) =>
  runRep(code, id, () => new SQL.Database())
    .filter(result => !result.passed)
    .map(result => result.name)
const solution = id => sqlSolutions[id]

/** Each mutant names the authored check that must catch it, so a check that stops testing its boundary fails here. */
function assertCaught(id, mutants) {
  assert.deepEqual(failed(id, solution(id)), [], `${id} reference`)
  for (const [code, check] of mutants) assert.ok(failed(id, code).includes(check), `${id}: "${check}" did not catch ${code}`)
}

test('every SQL track rep is SQL text with a reference query and fresh-database checks', () => {
  const ids = paths.find(path => path.id === 'sql').stages.flatMap(stage => stage.repIds)
  for (const id of ids.filter(item => !item.startsWith('sqlite-'))) {
    const rep = reps.find(item => item.id === id)
    assert.equal(rep.format, 'sql', id)
    assert.equal(rep.functionName, '', id)
    assert.ok(sqlSolutions[id], `${id} needs a reference query`)
    // A schema rep starts empty and probes one rule per check; every other rep needs several data sets.
    const schemaRep = rep.checks.every(check => check.sql.probes?.length)
    if (schemaRep) assert.ok(rep.checks.length >= 4 && rep.checks.some(check => check.expected.probes.includes('rejected')), id)
    // Index and migration reps vary their queries and probes more than the data, so two data sets are enough.
    else
      assert.ok(
        Object.keys(rep.sql.seeds).length >= (rep.checks.some(check => check.sql.plan || check.sql.probes) ? 2 : 3),
        `${id} needs several data sets`,
      )
  }
})

test('S1 filtering and sorting checks catch boundary, case, NULL, and tie-breaker mistakes', () => {
  const base = solution('sql-filter-sort')
  assertCaught('sql-filter-sort', [
    [base.replace('ORDER BY year, title', 'ORDER BY year'), 'Films from the same year are in title order'],
    [base.replace('year < 2000', 'year <= 2000'), '1999 counts, 2000 does not'],
    [base.replace("genre = 'Drama'", "lower(genre) = 'drama'"), 'Exact genre, and an unknown year is left out'],
    [base.replace('year < 2000', '(year < 2000 OR year IS NULL)'), 'Exact genre, and an unknown year is left out'],
    [base.replace('ORDER BY year, title', 'ORDER BY year DESC, title'), 'Dramas before 2000, oldest first'],
    [base.replace("WHERE genre = 'Drama' AND year < 2000", "WHERE genre = 'Drama'"), 'Dramas before 2000, oldest first'],
  ])
})

test('S1 distinct-city checks catch repeats, inexact country codes, and the wrong order', () => {
  const base = solution('sql-distinct-cities')
  assertCaught('sql-distinct-cities', [
    [base.replace('DISTINCT ', ''), 'Each Norwegian city once, in text order'],
    [base.replace("country = 'NO'", "country = 'NO' COLLATE NOCASE"), 'The country code is compared exactly'],
    [base.replace("country = 'NO'", "city <> ''"), 'A same-named city in another country does not count'],
    [base.replace('ORDER BY city', 'ORDER BY city DESC'), 'Each Norwegian city once, in text order'],
  ])
})

test('S1 calculated-column checks catch a missing direction, tie-breaker, or name, and dropped zero totals', () => {
  const base = solution('sql-line-totals')
  assertCaught('sql-line-totals', [
    [base.replace('total_cents DESC', 'total_cents'), 'Most valuable line first'],
    [base.replace(', product, id;', ';'), 'Equal totals by product name'],
    [base.replace(', product, id;', ', id;'), 'Equal totals by product name'],
    [base.replace('AS total_cents', 'AS total').replace('ORDER BY total_cents', 'ORDER BY total'), 'Most valuable line first'],
    [base.replace('FROM order_lines', 'FROM order_lines\nWHERE quantity * unit_cents > 0'), 'Zero totals still appear'],
  ])
})

test('S1 newest-ticket checks catch a missing filter, direction, tie-breaker, and limit', () => {
  const base = solution('sql-recent-open-tickets')
  assertCaught('sql-recent-open-tickets', [
    [base.replace(', id DESC', ''), 'Same minute: higher id first'],
    [base.replace('id DESC', 'id'), 'Same minute: higher id first'],
    [base.replace('opened_at DESC', 'opened_at'), 'Three newest open tickets'],
    [base.replace("WHERE status = 'open'\n", ''), 'Three newest open tickets'],
    [base.replace('LIMIT 3', 'LIMIT 2'), 'Three newest open tickets'],
    [base.replace('\nLIMIT 3', ''), 'Three newest open tickets'],
  ])
})

test('S1 catalog-page checks catch the wrong page, a missing tie-breaker, and hidden products', () => {
  const base = solution('sql-catalog-page')
  assertCaught('sql-catalog-page', [
    [base.replace('OFFSET 4', 'OFFSET 8'), 'Page 2 of the shelf'],
    [base.replace('OFFSET 4', 'OFFSET 3'), 'Page 2 of the shelf'],
    [base.replace('ORDER BY price_cents, name, id', 'ORDER BY price_cents'), 'Equal prices order by name across the page break'],
    [base.replace('WHERE active = 1\n', ''), 'Page 2 of the shelf'],
    [base.replace('LIMIT 4 OFFSET 4', 'LIMIT 4'), 'Page 2 of the shelf'],
  ])
})

test('S2 grouped-filter checks catch missing parentheses, inexact categories, and the price boundary', () => {
  const base = solution('sql-filter-groups')
  assertCaught('sql-filter-groups', [
    [
      base.replace("category IN ('Poetry', 'Drama')", "category = 'Poetry' OR category = 'Drama'"),
      'Price and stock rules apply to poetry too',
    ],
    [base.replace("category IN ('Poetry', 'Drama')", "lower(category) IN ('poetry', 'drama')"), 'Category is compared exactly'],
    [base.replace('price_cents < 1500', 'price_cents <= 1500'), 'Cheap poetry and drama in stock'],
    [base.replace(' AND in_stock = 1', ''), 'Cheap poetry and drama in stock'],
  ])
})

test('S2 range checks catch exclusive ends, the beds rule, and the name tie-breaker', () => {
  const base = solution('sql-price-band')
  assertCaught('sql-price-band', [
    [base.replace('BETWEEN 8000 AND 12000', '> 8000 AND nightly_cents < 12000'), 'Both ends of the range count'],
    [base.replace('beds >= 2', 'beds > 2'), 'Both ends of the range count'],
    [base.replace(' AND beds >= 2', ''), 'Both ends of the range count'],
    [base.replace('ORDER BY nightly_cents, name', 'ORDER BY nightly_cents'), 'Equal prices in name order'],
  ])
})

test('S2 pattern checks catch % for a fixed length, a loose prefix, and case-sensitive matching', () => {
  const base = solution('sql-code-pattern')
  assertCaught('sql-code-pattern', [
    [base.replace("'BR-___'", "'BR-%'"), 'Exactly three characters after BR-'],
    [base.replace("'BR-___'", "'%BR-___'"), 'Exactly three characters after BR-'],
    [base.replace("code LIKE 'BR-___'", "code GLOB 'BR-???'"), 'Letter case does not matter'],
  ])
})

test('S2 NULL checks catch a NULL status that blocks, an empty phone, and the id tie-breaker', () => {
  const base = solution('sql-members-to-text')
  assertCaught('sql-members-to-text', [
    [
      base.replace(" AND (status <> 'blocked' OR status IS NULL)", " AND status <> 'blocked'"),
      'A status that was never set does not block',
    ],
    [base.replace("phone <> ''", 'phone IS NOT NULL'), 'Reachable members in name order'],
    [base.replace('ORDER BY name, id', 'ORDER BY name, id DESC'), 'Same name, ordered by id'],
    [base.replace("status <> 'blocked' OR status IS NULL", "status = 'active'"), 'Reachable members in name order'],
  ])
  // SQLite's IS NOT treats NULL as a value, so it is an accepted alternative here.
  assert.deepEqual(failed('sql-members-to-text', base.replace("(status <> 'blocked' OR status IS NULL)", "status IS NOT 'blocked'")), [])
})

test('S2 search checks catch an ungrouped OR, a prefix-only pattern, drafts, and the tie-breaker', () => {
  const base = solution('sql-search-articles')
  assertCaught('sql-search-articles', [
    [
      base.replace(
        "published_at IS NOT NULL AND section IN ('guides', 'news') AND title LIKE '%sql%'",
        "published_at IS NOT NULL AND section = 'guides' OR section = 'news' AND title LIKE '%sql%'",
      ),
      'Drafts and other sections are left out',
    ],
    [base.replace("'%sql%'", "'sql%'"), 'Published guides and news about SQL, newest first'],
    [base.replace('published_at IS NOT NULL AND ', ''), 'Published guides and news about SQL, newest first'],
    [base.replace('published_at DESC, id', 'published_at DESC, id DESC'), 'Published guides and news about SQL, newest first'],
    [base.replace("title LIKE '%sql%'", "title GLOB '*sql*'"), 'Any letter case, anywhere in the title'],
  ])
})

test('S3 grouping checks catch a missing group, COUNT of a nullable column, and the tie-breaker', () => {
  const base = solution('sql-count-by-status')
  assertCaught('sql-count-by-status', [
    [base.replace('COUNT(*)', 'COUNT(status)'), 'One row per status, biggest first'],
    [base.replace('ORDER BY order_count DESC, status', 'ORDER BY order_count DESC'), 'Equal counts by status'],
    [base.replace('ORDER BY order_count DESC, status', 'ORDER BY order_count DESC, status DESC'), 'One row per status, biggest first'],
    ["SELECT 'all' AS status, COUNT(*) AS order_count FROM shop_orders", 'No orders gives no rows'],
  ])
})

test('S3 rating checks catch COUNT(*) for rated reviews, NULL as zero stars, and rounding', () => {
  const base = solution('sql-ratings-summary')
  assertCaught('sql-ratings-summary', [
    [base.replace('COUNT(stars) AS rated', 'COUNT(*) AS rated'), 'All, rated, and average per product'],
    [base.replace('AVG(stars)', 'AVG(COALESCE(stars, 0))'), 'All, rated, and average per product'],
    [base.replace('ROUND(AVG(stars), 2)', 'ROUND(AVG(stars), 1)'), 'All, rated, and average per product'],
    [base.replace('ROUND(AVG(stars), 2)', 'AVG(stars)'), 'All, rated, and average per product'],
  ])
})

test('S3 visitor checks catch repeat visitors, anonymous visitors, and the tie-breaker', () => {
  const base = solution('sql-count-visitors')
  assertCaught('sql-count-visitors', [
    [base.replace('COUNT(DISTINCT visitor)', 'COUNT(visitor)'), 'Views and different visitors per page'],
    [base.replace('COUNT(DISTINCT visitor)', 'COUNT(DISTINCT COALESCE(visitor, id))'), 'Views and different visitors per page'],
    [base.replace('ORDER BY views DESC, page', 'ORDER BY views DESC'), 'Equal views by page'],
  ])
})

test('S3 busy-day checks catch counting cancellations, a strict threshold, and filtering in the wrong place', () => {
  const base = solution('sql-busy-days')
  assertCaught('sql-busy-days', [
    [base.replace("WHERE status <> 'cancelled'\n", ''), 'Busy days counted without cancellations'],
    [base.replace('COUNT(*) >= 3', 'COUNT(*) > 3'), 'Busy days counted without cancellations'],
    [
      base
        .replace("WHERE status <> 'cancelled'\n", '')
        .replace('HAVING COUNT(*) >= 3', "HAVING COUNT(*) >= 3 AND SUM(status = 'cancelled') = 0"),
      'Busy days counted without cancellations',
    ],
  ])
  assert.match(
    failed(
      'sql-busy-days',
      base.replace('HAVING COUNT(*) >= 3', '').replace("WHERE status <> 'cancelled'", "WHERE status <> 'cancelled' AND COUNT(*) >= 3"),
    ).join(),
    /Busy days/,
  )
})

test('S3 monthly-spender checks catch per-payment thresholds, a missed month edge, and other months', () => {
  const base = solution('sql-month-spenders')
  assertCaught('sql-month-spenders', [
    [
      base.replace("BETWEEN '2026-03-01' AND '2026-03-31'", ">= '2026-03-01' AND paid_on < '2026-03-31'"),
      'March totals of at least 10000, refunds included',
    ],
    [base.replace("WHERE paid_on BETWEEN '2026-03-01' AND '2026-03-31'\n", ''), 'March totals of at least 10000, refunds included'],
    [base.replace('SUM(amount_cents) >= 10000', 'SUM(amount_cents) > 10000'), 'March totals of at least 10000, refunds included'],
    [
      base.replace(
        "WHERE paid_on BETWEEN '2026-03-01' AND '2026-03-31'",
        "WHERE paid_on BETWEEN '2026-03-01' AND '2026-03-31' AND amount_cents > 0",
      ),
      'Just below, or brought below by a refund',
    ],
    [
      base.replace('ORDER BY total_cents DESC, account', 'ORDER BY total_cents DESC, account DESC'),
      'March totals of at least 10000, refunds included',
    ],
  ])
})

test('S4 inner-join checks catch a LEFT JOIN, joining on names, and the order key', () => {
  const base = solution('sql-join-orders')
  assertCaught('sql-join-orders', [
    [base.replace('FROM orders AS o\nJOIN customers', 'FROM orders AS o\nLEFT JOIN customers'), 'Orders with their customer names'],
    [
      base.replace('ON c.id = o.customer_id', 'ON c.name = (SELECT name FROM customers WHERE id = o.customer_id)'),
      'Matched by id, not by name',
    ],
    [base.replace('ORDER BY o.id', 'ORDER BY c.name'), 'Orders with their customer names'],
  ])
})

test('S4 missing-match checks catch an inner join and a test on the wrong side', () => {
  const base = solution('sql-customers-without-orders')
  assertCaught('sql-customers-without-orders', [
    [base.replace('LEFT JOIN', 'JOIN'), 'Customers who never ordered'],
    [base.replace('WHERE o.id IS NULL', 'WHERE c.id IS NULL'), 'Customers who never ordered'],
    [base.replace('ORDER BY c.name, c.id', 'ORDER BY c.name, c.id DESC'), 'Nobody has ordered'],
  ])
})

test('S4 fan-out checks catch joining both lists at once, DISTINCT sums, and missing zeroes', () => {
  const base = solution('sql-team-totals')
  const naive =
    'SELECT t.name, COUNT(m.id) AS members, COALESCE(SUM(e.cents), 0) AS expense_cents FROM teams AS t LEFT JOIN team_members AS m ON m.team_id = t.id LEFT JOIN expenses AS e ON e.team_id = t.id GROUP BY t.id ORDER BY t.name'
  assertCaught('sql-team-totals', [
    [naive, 'Counts and totals that do not multiply'],
    [naive.replace('COUNT(m.id)', 'COUNT(DISTINCT m.id)').replace('SUM(e.cents)', 'SUM(DISTINCT e.cents)'), 'Equal expenses both count'],
    [base.replace('COALESCE(e.total, 0)', 'e.total'), 'Counts and totals that do not multiply'],
  ])
  // The starter is the naive query, so running it shows the multiplication.
  assert.ok(
    failed('sql-team-totals', reps.find(rep => rep.id === 'sql-team-totals').starter).includes('Counts and totals that do not multiply'),
  )
})

test('S4 June-return checks catch the date in WHERE, COUNT(*), an inner join, and the wrong range', () => {
  const base = solution('sql-june-returns')
  assertCaught('sql-june-returns', [
    [
      base
        .replace(" AND r.returned_on BETWEEN '2026-06-01' AND '2026-06-30'", '')
        .replace('GROUP BY', "WHERE r.returned_on BETWEEN '2026-06-01' AND '2026-06-30'\nGROUP BY"),
      'June returns for every product',
    ],
    [base.replace('COUNT(r.id)', 'COUNT(*)'), 'June returns for every product'],
    [base.replace('LEFT JOIN', 'JOIN'), 'June returns for every product'],
    [base.replace("'2026-06-30'", "'2026-06-29'"), 'June returns for every product'],
    [
      base.replace('ORDER BY june_returns DESC, p.name', 'ORDER BY june_returns DESC'),
      'Returns outside June still leave the product listed',
    ],
  ])
})

test('S4 latest-book checks catch an inner join, COUNT(*), and grouping by name', () => {
  const base = solution('sql-authors-latest')
  assertCaught('sql-authors-latest', [
    [base.replace('LEFT JOIN', 'JOIN'), 'Book counts and newest years, including authors with none'],
    [base.replace('COUNT(b.id)', 'COUNT(*)'), 'Book counts and newest years, including authors with none'],
    [base.replace('GROUP BY a.id', 'GROUP BY a.name'), 'Two authors with the same name'],
    [base.replace('MAX(b.year)', 'MIN(b.year)'), 'Book counts and newest years, including authors with none'],
  ])
})

test('S5 average checks catch >=, a grouped HAVING, and the tie-breaker', () => {
  const base = solution('sql-above-average')
  assertCaught('sql-above-average', [
    [base.replace('cents > (SELECT', 'cents >= (SELECT'), 'Equal to the average is not above it'],
    ['SELECT id, cents FROM invoices GROUP BY id HAVING cents > AVG(cents) ORDER BY cents DESC, id', 'Invoices above the average'],
    [base.replace('ORDER BY cents DESC, id', 'ORDER BY cents DESC, id DESC'), 'Equal amounts by id'],
  ])
})

test('S5 correlated checks catch an uncorrelated average and correlating on the wrong column', () => {
  const base = solution('sql-category-average')
  assertCaught('sql-category-average', [
    [reps.find(rep => rep.id === 'sql-category-average').starter, 'Above the average of their own category'],
    [base.replace('i.category = c.category', 'i.name = c.name'), 'Above the average of their own category'],
    [base.replace('c.price_cents > (', 'c.price_cents >= ('), 'Equal prices are never above their average'],
  ])
})

test('S5 missing-work checks catch NOT IN over a NULL and an inner join', () => {
  const base = solution('sql-students-without-work')
  assertCaught('sql-students-without-work', [
    [reps.find(rep => rep.id === 'sql-students-without-work').starter, 'A guest submission does not hide anyone'],
    [
      'SELECT DISTINCT st.id, st.name FROM students AS st JOIN submissions AS s ON s.student_id <> st.id ORDER BY st.id',
      'A guest submission does not hide anyone',
    ],
  ])
  assert.deepEqual(
    failed(
      'sql-students-without-work',
      'SELECT id, name FROM students WHERE id NOT IN (SELECT student_id FROM submissions WHERE student_id IS NOT NULL) ORDER BY id',
    ),
    [],
  )
})

test('S5 free-room checks catch a join that keeps old bookings, the leaving day, and duplicates', () => {
  const base = solution('sql-free-rooms')
  assertCaught('sql-free-rooms', [
    [
      "SELECT r.id, r.name FROM rooms AS r LEFT JOIN bookings AS b ON b.room_id = r.id WHERE b.id IS NULL OR NOT (b.starts_on <= '2026-08-15' AND b.ends_on > '2026-08-15') ORDER BY r.name, r.id",
      'Free rooms on the night',
    ],
    [base.replace("b.ends_on > '2026-08-15'", "b.ends_on >= '2026-08-15'"), 'Free rooms on the night'],
    [base.replace("b.starts_on <= '2026-08-15'", "b.starts_on < '2026-08-15'"), 'Free rooms on the night'],
    [base.replace('ORDER BY r.name, r.id', 'ORDER BY r.name, r.id DESC'), 'Rooms with no bookings, same name'],
  ])
})

test('S5 monthly-average checks catch averaging sales, the wrong year filter, and >=', () => {
  const base = solution('sql-strong-months')
  assertCaught('sql-strong-months', [
    [
      base.replace(
        '(SELECT AVG(total_cents) FROM monthly)',
        "(SELECT AVG(cents) FROM sales WHERE sold_on BETWEEN '2026-01-01' AND '2026-12-31')",
      ),
      'A refund lowers a month',
    ],
    [base.replace("  WHERE sold_on BETWEEN '2026-01-01' AND '2026-12-31'\n", ''), 'Months above the average month'],
    [base.replace('total_cents > (SELECT', 'total_cents >= (SELECT'), 'A refund lowers a month'],
  ])
})

const probeMessages = (id, code) =>
  runRep(code, id, () => new SQL.Database())
    .filter(result => !result.passed)
    .map(result => `${result.name}: ${result.message}`)

test('S6 product checks name each rule the starter misses, in words', () => {
  const starter = reps.find(rep => rep.id === 'sql-create-products').starter
  assert.deepEqual(probeMessages('sql-create-products', starter), [
    'Rejects a negative price: Your table stored price -5 instead of rejecting it.',
    'Rejects a product with no name: Your table stored a product with no name instead of rejecting it.',
    'Rejects a product with no SKU: Your table stored a product with no SKU instead of rejecting it.',
    'Rejects a repeated SKU: Your table stored a second product with SKU D-4 instead of rejecting it.',
  ])
  const base = solution('sql-create-products')
  assertCaught('sql-create-products', [
    [base.replace('price_cents >= 0', 'price_cents > 0'), 'Accepts a free product'],
    [base.replace('sku TEXT NOT NULL UNIQUE', 'sku TEXT UNIQUE'), 'Rejects a product with no SKU'],
    [base.replace('sku TEXT NOT NULL UNIQUE', 'sku TEXT NOT NULL'), 'Rejects a repeated SKU'],
  ])
  assert.match(
    probeMessages('sql-create-products', 'CREATE TABLE goods (id INTEGER PRIMARY KEY)')[0],
    /Your table rejected a pen for 250 cents: no such table: products/,
  )
})

test('S6 default checks catch a missing default, an explicit NULL, and a range off by one', () => {
  const base = solution('sql-default-values')
  assertCaught('sql-default-values', [
    [base.replace("DEFAULT 'open' ", ''), 'A new task starts open with priority 3'],
    [base.replace("status TEXT NOT NULL DEFAULT 'open'", "status TEXT DEFAULT 'open'"), 'An explicit NULL status is rejected'],
    [base.replace('BETWEEN 1 AND 5', 'BETWEEN 0 AND 5'), 'Priority stays from 1 to 5'],
    [base.replace("CHECK (status IN ('open', 'done'))", ''), 'Rejects an unknown status'],
  ])
})

test('S6 type checks catch an ordinary table, and a typeof CHECK is an accepted alternative', () => {
  const base = solution('sql-strict-types')
  assertCaught('sql-strict-types', [
    [base.replace(') STRICT;', ');'), 'Rejects text that is not a number'],
    [base.replace(') STRICT;', ', CHECK (celsius > -100));'), 'Rejects text that is not a number'],
  ])
  assert.deepEqual(failed('sql-strict-types', base.replace(') STRICT;', ", CHECK (typeof(celsius) = 'real'));")), [])
})

test('S6 membership checks need foreign keys, a pair key, and required dates', () => {
  const base = solution('sql-create-memberships')
  assertCaught('sql-create-memberships', [
    [base.replace(' REFERENCES members(id)', ''), 'Rejects a membership for a member who does not exist'],
    [base.replace(' REFERENCES clubs(id)', ''), 'Rejects a membership for a club that does not exist'],
    [base.replace('PRIMARY KEY (member_id, club_id)', 'UNIQUE (member_id)'), 'Accepts a member joining two clubs'],
    [base.replace(',\n  PRIMARY KEY (member_id, club_id)', ''), 'Rejects joining the same club twice'],
    [base.replace('joined_on TEXT NOT NULL', 'joined_on TEXT'), 'Rejects a membership with no date'],
    [base.replace('email TEXT NOT NULL UNIQUE', 'email TEXT NOT NULL'), 'Rejects a repeated email'],
  ])
  // Foreign keys are enforced only because the task turns them on before the learner's SQL.
  const rep = reps.find(item => item.id === 'sql-create-memberships')
  assert.equal(rep.sql.foreignKeys, true)
  const withoutPragma = runRep(base, 'sql-create-memberships', () => {
    const db = new SQL.Database()
    const run = db.run.bind(db)
    db.run = (sql, ...rest) => (sql === 'PRAGMA foreign_keys = ON' ? db : run(sql, ...rest))
    return db
  })
  assert.ok(withoutPragma.some(result => result.name === 'Rejects a membership for a member who does not exist' && !result.passed))
})

test('S6 shift checks catch a zero-length shift, a one-column unique rule, and unknown roles', () => {
  const base = solution('sql-create-shifts')
  assertCaught('sql-create-shifts', [
    [base.replace('ends_at > starts_at', 'ends_at >= starts_at'), 'Rejects a shift that does not end after it starts'],
    [base.replace('UNIQUE (worker, starts_at)', 'UNIQUE (starts_at)'), 'One worker cannot start two shifts at once'],
    [base.replace(',\n  UNIQUE (worker, starts_at)', ''), 'One worker cannot start two shifts at once'],
    [base.replace(" CHECK (role IN ('cook', 'server', 'host'))", ''), 'Rejects an unknown role'],
    [base.replace('worker TEXT NOT NULL', 'worker TEXT'), 'Rejects a shift with no worker'],
  ])
})

test('S7 change checks catch an unscoped update, a loose category, and an inactive row', () => {
  const base = solution('sql-update-scope')
  assertCaught('sql-update-scope', [
    [reps.find(rep => rep.id === 'sql-update-scope').starter, 'Only active teas change'],
    [base.replace(' AND active = 1', ''), 'Only active teas change'],
    [base.replace("category = 'tea'", "lower(category) = 'tea'"), 'Only active teas change'],
  ])
})

test('S7 delete checks catch one missing reason, the cutoff, and AND for OR', () => {
  const base = solution('sql-delete-scope')
  assertCaught('sql-delete-scope', [
    [reps.find(rep => rep.id === 'sql-delete-scope').starter, 'Expired and revoked sessions go'],
    [base.replace('expires_at <', 'expires_at <='), 'Expired and revoked sessions go'],
    [base.replace(' OR revoked', ' AND revoked'), 'Expired and revoked sessions go'],
    ['DELETE FROM sessions', 'Current sessions stay'],
  ])
})

test('S7 upsert checks catch a replace, a skipped repeat, and a changed delivery list', () => {
  const base = solution('sql-upsert-stock')
  assertCaught('sql-upsert-stock', [
    ['INSERT OR REPLACE INTO stock (sku, units) SELECT sku, units FROM incoming', 'Known products gain units, new ones are added'],
    [base.replace('units + excluded.units', 'excluded.units'), 'Known products gain units, new ones are added'],
    [base.replace('DO UPDATE SET units = units + excluded.units', 'DO NOTHING'), 'A product listed twice counts twice'],
    [`${base}\nDELETE FROM incoming;`, 'Known products gain units, new ones are added'],
  ])
  assert.match(failed('sql-upsert-stock', base.replace(' WHERE true', '')).join(), /Known products/)
  // A two-step version without upsert is also accepted.
  assert.deepEqual(
    failed(
      'sql-upsert-stock',
      'UPDATE stock SET units = units + (SELECT SUM(units) FROM incoming WHERE incoming.sku = stock.sku) WHERE sku IN (SELECT sku FROM incoming); INSERT INTO stock (sku, units) SELECT sku, SUM(units) FROM incoming WHERE sku NOT IN (SELECT sku FROM stock) GROUP BY sku;',
    ),
    [],
  )
})

test('S7 archive checks catch disagreeing conditions, a missing delete, and the wrong order of steps', () => {
  const base = solution('sql-archive-orders')
  assertCaught('sql-archive-orders', [
    [
      base.replace("DELETE FROM orders WHERE placed_on < '2026-01-01';", "DELETE FROM orders WHERE placed_on <= '2026-01-01';"),
      'Last year’s orders move, this year’s stay',
    ],
    [base.replace("DELETE FROM orders WHERE placed_on < '2026-01-01';\n", ''), 'Last year’s orders move, this year’s stay'],
    [
      "BEGIN; DELETE FROM orders WHERE placed_on < '2026-01-01'; INSERT INTO archived_orders SELECT id, placed_on, cents FROM orders WHERE placed_on < '2026-01-01'; COMMIT;",
      'Last year’s orders move, this year’s stay',
    ],
    [base.replace('COMMIT;', ''), 'Last year’s orders move, this year’s stay'],
  ])
})

test('S8 numbering checks catch a missing partition, a missing tie-breaker, and the wrong numbering kind', () => {
  const base = solution('sql-rank-scores')
  assertCaught('sql-rank-scores', [
    [base.replace('PARTITION BY level ', ''), 'Places within each level'],
    [base.replace('points DESC, player', 'points DESC'), 'Places within each level'],
    // RANK lets equal points share a place once the name no longer separates them.
    [base.replace('ROW_NUMBER()', 'RANK()').replace('points DESC, player', 'points DESC'), 'Places within each level'],
  ])
  const rank = solution('sql-competition-rank')
  assertCaught('sql-competition-rank', [
    [rank.replace('RANK()', 'ROW_NUMBER()'), 'Equal times share a rank, the next one skips'],
    [rank.replace('RANK()', 'DENSE_RANK()'), 'Equal times share a rank, the next one skips'],
  ])
})

test('S8 neighbour checks catch LEAD, a calendar-day join, and insertion order', () => {
  const base = solution('sql-day-over-day')
  assertCaught('sql-day-over-day', [
    [base.replace('LAG(visitors)', 'LEAD(visitors)'), 'Change from the previous recorded day'],
    [
      "SELECT v.day, v.visitors, v.visitors - p.visitors AS change FROM visits AS v LEFT JOIN visits AS p ON p.day = date(v.day, '-1 day') ORDER BY v.day",
      'Change from the previous recorded day',
    ],
    [base.replace('OVER (ORDER BY day)', 'OVER (ORDER BY rowid)'), 'Date order, not insert order'],
  ])
})

test('S8 running-balance checks catch peers, a missing partition, and the outer order', () => {
  const base = solution('sql-running-balance')
  assertCaught('sql-running-balance', [
    [
      base.replace('ORDER BY posted_on, id) AS balance', 'ORDER BY posted_on) AS balance'),
      'Balances per account, same-day entries in id order',
    ],
    [base.replace('PARTITION BY account ', ''), 'Balances per account, same-day entries in id order'],
    [base.replace('ORDER BY account, posted_on, id;', 'ORDER BY account, id;'), 'One account in date order'],
  ])
})

test('S8 top-two checks catch LIMIT, RANK, and a missing name tie-breaker', () => {
  const base = solution('sql-top-two-per-region')
  assertCaught('sql-top-two-per-region', [
    ['SELECT region, name, revenue_cents FROM sales_reps ORDER BY region, revenue_cents DESC, name LIMIT 2', 'Top two per region'],
    [base.replace('ROW_NUMBER()', 'RANK()').replace('revenue_cents DESC, name) AS n', 'revenue_cents DESC) AS n'), 'Top two per region'],
    [base.replace('revenue_cents DESC, name) AS n', 'revenue_cents DESC) AS n'), 'Top two per region'],
    [base.replace('n <= 2', 'n < 2'), 'Top two per region'],
  ])
})

test('S9 plan checks report the plan on every result and name what the plan lacks', () => {
  const run = code => runRep(code, 'sql-index-lookup', () => new SQL.Database())
  const passed = run(solution('sql-index-lookup'))
  assert.ok(
    passed.every(result => result.passed && result.plan.some(line => /SEARCH users USING INDEX users_email \(email=\?\)/.test(line))),
  )
  const empty = run('-- nothing yet')
  assert.ok(empty.every(result => !result.passed && result.plan.join() === 'SCAN users'))
  assert.equal(
    empty[0].message,
    "SQLite's plan does not search users through an index on email. SQLite's plan still reads every row of users.",
  )
  assert.deepEqual(failed('sql-index-lookup', 'CREATE UNIQUE INDEX users_email ON users (email);'), [])
  assertCaught('sql-index-lookup', [
    ['CREATE INDEX users_name ON users (name);', 'A lookup by email searches an index'],
    ['CREATE INDEX users_email ON users (lower(email));', 'A lookup by email searches an index'],
    ['CREATE INDEX users_email ON users (email); DELETE FROM users WHERE id = 3;', 'A lookup by email searches an index'],
  ])
})

test('S9 index checks catch the wrong column order, a missing sort column, and a half-indexed join', () => {
  assertCaught('sql-index-sort', [
    ['CREATE INDEX k ON events (kind);', 'The newest logins come from the index, already sorted'],
    ['CREATE INDEX k ON events (happened_at, kind);', 'The newest logins come from the index, already sorted'],
  ])
  assert.deepEqual(failed('sql-index-sort', 'CREATE INDEX k ON events (kind, happened_at DESC);'), [])
  assertCaught('sql-covering-index', [
    ['CREATE INDEX a ON products (category);', 'The tea list comes from a covering index, already sorted'],
    ['CREATE INDEX a ON products (category, sku);', 'The tea list comes from a covering index, already sorted'],
    ['CREATE INDEX a ON products (category, price_cents, sku);', 'The tea list comes from a covering index, already sorted'],
  ])
  assertCaught('sql-composite-index', [
    ['CREATE INDEX a ON orders (placed_on, customer_id);', 'Both conditions narrow one index search'],
    ['CREATE INDEX a ON orders (customer_id);', 'Both conditions narrow one index search'],
    ['CREATE INDEX a ON orders (customer_id); CREATE INDEX b ON orders (placed_on);', 'Both conditions narrow one index search'],
  ])
  assert.deepEqual(failed('sql-composite-index', 'CREATE INDEX a ON orders (customer_id, placed_on, cents);'), [])
  assertCaught('sql-index-join', [
    ['CREATE INDEX e ON customers (email);', 'Both tables are searched, neither is scanned'],
    ['CREATE INDEX f ON orders (customer_id);', 'Both tables are searched, neither is scanned'],
  ])
  const halfJoin = runRep('CREATE INDEX e ON customers (email);', 'sql-index-join', () => new SQL.Database())[0]
  assert.match(halfJoin.message, /SQLite's plan still reads every row of orders\./)
})

test('S10 migration checks catch a nullable column, a strict boundary, and a rename that adds a column', () => {
  const add = solution('sql-add-column')
  assertCaught('sql-add-column', [
    [reps.find(rep => rep.id === 'sql-add-column').starter, 'Existing customers keep their rows and get a tier'],
    [add.replace('>= 100000', '> 100000'), 'Existing customers keep their rows and get a tier'],
    [add.replace("TEXT NOT NULL DEFAULT 'standard'", "TEXT DEFAULT 'standard'"), 'The tier cannot be NULL'],
    [add.replace("DEFAULT 'standard'", "DEFAULT 'gold'"), 'A new customer gets the default tier'],
  ])
  assertCaught('sql-rename-column', [
    [reps.find(rep => rep.id === 'sql-rename-column').starter, 'Every count keeps its value under the new name'],
    ['ALTER TABLE stock RENAME COLUMN qty TO amount;', 'Every count keeps its value under the new name'],
  ])
  // Adding, copying, and dropping ends in the same table here, because qty was the last column.
  assert.deepEqual(
    failed(
      'sql-rename-column',
      'ALTER TABLE stock ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0; UPDATE stock SET quantity = qty; ALTER TABLE stock DROP COLUMN qty;',
    ),
    [],
  )
})

test('S10 backfill checks catch splitting at the wrong space, NULL for one-word names, and trimming', () => {
  const base = solution('sql-split-name')
  assertCaught('sql-split-name', [
    [base.replace("THEN '' ELSE", 'THEN NULL ELSE'), 'One-word names keep an empty last name'],
    [
      base.replace("substr(full_name, instr(full_name, ' ') + 1)", "trim(substr(full_name, instr(full_name, ' ') + 1))"),
      'Names split at the first space',
    ],
    [
      "ALTER TABLE people ADD COLUMN first_name TEXT; ALTER TABLE people ADD COLUMN last_name TEXT; UPDATE people SET first_name = substr(full_name, 1, instr(full_name, ' ') - 1), last_name = substr(full_name, instr(full_name, ' ') + 1);",
      'One-word names keep an empty last name',
    ],
  ])
})

test('S10 rebuild checks catch an update without a rebuild, a leftover table, and a lost row', () => {
  const base = solution('sql-rebuild-table')
  assertCaught('sql-rebuild-table', [
    ['UPDATE products SET price_cents = 0 WHERE price_cents IS NULL;', 'A negative price is rejected'],
    [
      base.replace(
        'DROP TABLE products;\nALTER TABLE products_new RENAME TO products;',
        'ALTER TABLE products RENAME TO products_old;\nALTER TABLE products_new RENAME TO products;',
      ),
      'Rows are kept and missing prices become 0',
    ],
    [
      base.replace(
        'SELECT id, sku, COALESCE(price_cents, 0) FROM products',
        'SELECT id, sku, price_cents FROM products WHERE price_cents IS NOT NULL',
      ),
      'Rows are kept and missing prices become 0',
    ],
  ])
  const codes = solution('sql-migrate-status-codes')
  assertCaught('sql-migrate-status-codes', [
    [codes.replace(" WHEN 3 THEN 'shipped'", ''), 'Every order gets its readable status'],
    [
      "ALTER TABLE orders DROP COLUMN status_code; ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'new';",
      'Every order gets its readable status',
    ],
    [codes.replace('\nALTER TABLE orders DROP COLUMN status_code;', ''), 'Orders that were already new'],
  ])
})

test('S11 capstone checks catch cancelled orders, counted lines, integer shares, and shared ranks', () => {
  const base = solution('sql-capstone-report')
  assertCaught('sql-capstone-report', [
    [base.replace(" AND o.status <> 'cancelled'", ''), "Each region's best March category"],
    [base.replace('COUNT(DISTINCT order_id)', 'COUNT(*)'), "Each region's best March category"],
    [base.replace('100.0 * revenue_cents', '100 * revenue_cents'), "Each region's best March category"],
    [base.replace('ROW_NUMBER()', 'RANK()').replace('revenue_cents DESC, category)', 'revenue_cents DESC)'), 'Tied categories by name'],
    [base.replace("'2026-03-31'", "'2026-03-30'"), "Each region's best March category"],
  ])
  const interview = solution('sql-interview-repeat-customers')
  assertCaught('sql-interview-repeat-customers', [
    [interview.replaceAll('substr(o.placed_on, 1, 7)', 'o.placed_on'), 'Customers with orders in two or more months'],
    [interview.replace(" AND o.status <> 'cancelled'", ''), 'Customers with orders in two or more months'],
    [interview.replace('GROUP BY c.id', 'GROUP BY c.name'), 'Two customers with the same name'],
    [interview.replace("o.placed_on BETWEEN '2026-01-01' AND '2026-12-31' AND ", ''), 'Customers with orders in two or more months'],
  ])
})

test('the S1 journey keeps recall distinct from its guided and independent reps', () => {
  const journey = journeys.find(item => item.id === 'sql-reading')
  assert.deepEqual(
    [journey.guided, journey.independent, journey.recall],
    ['sql-filter-sort', 'sql-recent-open-tickets', 'sql-catalog-page'],
  )
  assert.equal(recallVariants['sql-reading'][0], journey.recall)
  // Recall adds paging to a fresh table: its contract needs OFFSET, which neither earlier rep uses.
  assert.match(sqlSolutions[journey.recall], /OFFSET/)
  for (const id of [journey.guided, journey.independent]) assert.doesNotMatch(sqlSolutions[id], /OFFSET/)
  const prompt = reps.find(rep => rep.id === journey.independent).prompt
  assert.doesNotMatch(prompt, /LIMIT|DESC|ORDER BY/, 'the independent prompt names no clause')
  assert.doesNotMatch(reps.find(rep => rep.id === journey.recall).prompt, /LIMIT|OFFSET/, 'the recall prompt names no clause')
})
