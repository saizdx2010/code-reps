import type { LessonDepth } from './lesson-depth.ts'
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
  'sql-filter-sort': {
    reasoning:
      "WHERE decides membership and ORDER BY decides position, so each part can be checked on its own. A row belongs only when both conditions are true: genre = 'Drama' compares text exactly, and year < 2000 is false at 2000 and unknown for NULL, which WHERE treats as not kept. ORDER BY year, title sorts by year and uses the title only among rows with the same year, so the order is fully defined for every distinct title.",
    trace:
      "With the same-year data, WHERE keeps all five dramas. Sorting by year puts Rashomon (1950) first, and the four 1957 films tie. The title key then orders them by character code: '12 Angry Men' (a digit) before 'Nights of Cabiria', 'The Seventh Seal', and 'Wild Strawberries'. With the case-and-null data, 'drama' fails the exact comparison and the NULL year makes year < 2000 unknown, so only Umberto D. remains.",
    alternative:
      "Writing year <= 1999 is equivalent for whole years and reads as \"up to 1999\"; year < 2000 states the contract's boundary directly. Comparing lower(genre) = 'drama' would also accept 'drama', which this contract forbids, and it would need a different index to be fast. Sorting in application code works, but then the query result has no promised order for any other caller.",
    counterexample:
      'ORDER BY year alone passes the archive data, where every year differs, but leaves the four 1957 films in whatever order SQLite produces; the same-year check exposes it. year <= 2000 keeps Yi Yi and fails the 1999/2000 boundary check.',
    transfer:
      'The club now wants dramas and documentaries before 2000, documentaries listed after dramas. Decide how OR and AND combine without changing which years count, and how the sort expresses the genre order. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-distinct-cities': {
    reasoning:
      'WHERE keeps Norwegian customers, SELECT keeps only the city, and DISTINCT then removes result rows that repeat another row exactly. Because DISTINCT works on the selected columns, it must see only the city: selecting the name as well would keep one row per customer. ORDER BY city gives the promised text order.',
    trace:
      'With the mixed data, WHERE keeps Ingrid (Oslo), Lars (Bergen), Kari (Oslo), Mats (Tromsø), Siri (Oslo), and Åse (Ålesund). Selecting city gives Oslo, Bergen, Oslo, Tromsø, Oslo, Ålesund; DISTINCT keeps Oslo, Bergen, Tromsø, Ålesund once each. Sorting by character code puts Bergen, Oslo, Tromsø, then Ålesund, because Å has a larger code than every plain letter.',
    alternative:
      'GROUP BY city also returns each city once and is the natural step when you later need a count per city. DISTINCT states the intent, one row per distinct value, more directly when no aggregate is needed. A locale-aware order (Å after Z in Norwegian, but beside A in some other languages) needs a collation SQLite does not provide by default.',
    counterexample:
      "Leaving out DISTINCT returns Oslo three times and fails the first check. Writing country = 'no' or comparing without the exact code accepts the lowercase row, which the exact-code check rejects.",
    transfer:
      'The planner now wants each city once with the number of customers in it, busiest first. Decide which clause produces the count and which keys the order needs. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-line-totals': {
    reasoning:
      'SELECT can compute a value per row, and AS gives that value a name the rest of the query can use. ORDER BY total_cents DESC sorts on the computed value; product orders equal totals, and id settles any remaining tie because ids are unique, so every line has one position. Multiplying whole numbers of cents keeps the result exact; there is no rounding to argue about.',
    trace:
      'With the equal-totals data, Napkins (6 × 200), Candles (4 × 300), and Plates (2 × 600) all total 1200, and Bowl totals 1500. Sorting by total descending puts Bowl first, then the three ties, which the product key orders Candles (3), Napkins (7), Plates (5). Without that key SQLite would likely return them in id order, 3, 5, 7, which only looks sorted.',
    alternative:
      'ORDER BY quantity * unit_cents DESC repeats the expression instead of naming it; it gives the same order, but the result column still needs its name for the checks. Computing totals in application code works, but then the sort has to happen there too, after every row has been sent.',
    counterexample:
      'Forgetting DESC lists the cheapest line first. Sorting by total alone, or by total and then id, leaves the three 1200-cent lines in id order (3, 5, 7), which the equal-totals check rejects. Filtering out zero totals drops the Sample and Free bag lines that the contract keeps.',
    transfer:
      'The packing screen now shows totals in euros with two decimals, such as 13.50. Decide whether to divide in SQL or format in the application, and how to avoid binary floating-point rounding surprises. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-recent-open-tickets': {
    reasoning:
      "The result is the first three rows of one complete order over the open tickets. WHERE status = 'open' fixes the set; ORDER BY opened_at DESC, id DESC fixes every position, because ids are unique; LIMIT 3 then keeps three rows. The text times sort correctly because every value is written year first with the same width, so comparing characters left to right compares the times.",
    trace:
      'With the same-minute data, all four tickets are open. Sorting by opened_at descending puts the three 10:00 tickets ahead of the 09:59 one; among them id DESC gives 4, 2, 1. LIMIT 3 keeps exactly those, so Slow search (09:59) is dropped. With the two-open data, LIMIT 3 keeps both open tickets and returns two rows.',
    alternative:
      'Storing opened_at as a number of seconds would sort the same way and allow arithmetic, but is harder to read in a table. Selecting every open ticket and slicing in application code works for small tables but moves rows across the boundary that SQL could have discarded.',
    counterexample:
      'Forgetting DESC returns the three oldest open tickets. Sorting only by opened_at passes the queue data but leaves the same-minute order to chance; the same-minute check exposes it. Filtering after LIMIT, for example with a subquery that limits first, can return fewer than three open tickets.',
    transfer:
      'Suppose tickets gain a priority column, and the dashboard shows the newest three open tickets for each priority. Decide whether one LIMIT can express a per-group limit, and what you would need instead. This changed contract is self-reviewed, and the original checks do not cover it. The window-function stage returns to it.',
  },
  'sql-catalog-page': {
    reasoning:
      'A page is a slice of a total order. The order price_cents, name, id is total because ids are unique, so every product has exactly one position. Page 2 of size 4 skips positions 1 to 4 and keeps 5 to 8: LIMIT 4 OFFSET 4. Because the slice is taken after filtering and sorting, hidden products never take a place on any page.',
    trace:
      'With the shelf data, the active products sorted are Eraser 120, Paper clips 150, Highlighter 220, Ruler 300, Sticky notes 300, Notebook 450, Pencil case 650, Ink bottle 700, Fountain pen 2400. Ruler and Sticky notes tie on price and the name orders them. OFFSET 4 skips the first four; LIMIT 4 keeps Sticky notes, Notebook, Pencil case, and Ink bottle. Fountain pen would open page 3.',
    alternative:
      'Keyset paging remembers the last row of page 1 (price 300, name Ruler, id 5) and asks for rows after it. It stays fast on large tables and does not skip or repeat rows when products are added between requests, but it cannot jump straight to page 7. OFFSET is simpler and fits a small, rarely changing catalog.',
    counterexample:
      'OFFSET 8 returns page 3, a common off-by-one from computing n × k instead of (n - 1) × k. Ordering by price alone lets equal prices swap across the page break; the price-ties check catches the missing name key. Filtering active products after paging is not possible in one SELECT, and forgetting the filter puts hidden products on the page.',
    transfer:
      'The shop adds a sort by newest first, using an added_at column, and a page size of 10. Decide the full order, including what breaks ties when two products arrive in the same second, and the OFFSET for page 3. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-filter-groups': {
    reasoning:
      'The sale has one category rule and two rules that apply to every category, so the category alternatives must be grouped before AND joins the rest. With parentheses or IN, a row passes only when its category is one of the two and it is cheap and in stock. Strict less-than keeps 1499 and excludes 1500, and = compares the category text exactly.',
    trace:
      "With the expensive-poetry data, the grouped filter checks Collected Poems: Poetry, but 4200 is not under 1500, so it fails. Sonnets fails the stock rule. Oedipus passes all three. Without parentheses, Collected Poems and Sonnets would pass the bare category = 'Poetry' alternative and appear in the result.",
    alternative:
      "category IN ('Poetry', 'Drama') replaces the OR and needs no brackets, and it stays short when a third category joins the sale. Repeating the price and stock tests in each OR branch also works, but every later change to the sale rules must then be made twice.",
    counterexample:
      "category = 'Poetry' OR category = 'Drama' AND price_cents < 1500 AND in_stock = 1 keeps the sold-out Leaves of Grass on the shop data, and both the expensive and the sold-out poetry on the expensive-poetry data. price_cents <= 1500 keeps Medea at exactly 1500.",
    transfer:
      'The sale adds a rule: poetry is on sale at any price, but drama only under 15.00, and both must be in stock. Write the condition in words with brackets first, then decide whether IN still helps. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-price-band': {
    reasoning:
      'An inclusive range has two boundaries that both belong to it. BETWEEN 8000 AND 12000 expresses exactly that, and the beds rule joins it with AND. Sorting by price, then name, gives every room a defined position, because the checks never repeat a name at one price.',
    trace:
      'With the hotel data, Attic (7999) and Tower (12001) fall just outside, and Garden (8000) and Harbour (12000) sit on the ends and stay. Studio is in range but has one bed, so the beds rule removes it. Sorting leaves Garden, Loft, Harbour.',
    alternative:
      'nightly_cents >= 8000 AND nightly_cents <= 12000 says the same and makes each end visible. BETWEEN reads closer to the request. Both are inclusive; an exclusive upper end needs < instead, which BETWEEN cannot express.',
    counterexample:
      'nightly_cents > 8000 AND nightly_cents < 12000 drops Garden and Harbour; the boundary check catches it. beds > 2 drops every two-bed room.',
    transfer:
      'The family now asks for rooms under 120.00 a night but at least 80.00, written as a half-open range. Decide which end is included and whether BETWEEN can still express it. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-code-pattern': {
    reasoning:
      "The pattern 'BR-___' fixes the code to six characters: three literal ones and three _ wildcards, each matching exactly one character. LIKE must match the whole value, so codes that are longer, shorter, or have a prefix fail. In SQLite, LIKE ignores ASCII letter case, which the contract asks for.",
    trace:
      'With the bins data, BR-104 matches B, R, -, then one character each for 1, 0, 4. BR-12 runs out after two characters and BR-1050 has one left over, so both fail. XBR-110 fails at the first character. Sorting by code puts BR-009 before BR-104 and BR-A7Z, because digits come before capital letters.',
    alternative:
      "code LIKE 'BR-%' AND length(code) = 6 works too and says the length explicitly. SQLite's GLOB uses * and ? and respects letter case, so it would reject br-300 here. A regular expression is not built into SQLite.",
    counterexample:
      "LIKE 'BR-%' keeps BR-12 and BR-1050; the first check rejects it. LIKE '%BR-___' also matches XBR-110. Comparing with = instead of LIKE matches nothing, because the wildcards are then literal characters.",
    transfer:
      'Codes now end in a check letter: BR- then three digits then one capital letter, such as BR-104K. Decide what LIKE can and cannot express about digits versus letters, and what else you would need. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-members-to-text': {
    reasoning:
      "Each column has three kinds of value to decide on. For phone, NULL and empty text both mean no number, so phone <> '' handles both: an empty phone fails, and NULL makes the comparison unknown, which WHERE drops. For status, NULL must pass, so the condition says so explicitly: (status <> 'blocked' OR status IS NULL). Name, then id, gives every member one position.",
    trace:
      "With the club data, Dag has a phone and status NULL: status <> 'blocked' is unknown, but status IS NULL is true, so the OR is true and Dag stays. Eli's phone is empty, so phone <> '' is false. Bea's phone is NULL, so that comparison is unknown and she is dropped. Ade, Dag, and Fia remain, in name order.",
    alternative:
      "SQLite's status IS NOT 'blocked' treats NULL as a value, so it is true for NULL; it is concise but not portable to every database. COALESCE(status, 'active') <> 'blocked' substitutes a stand-in for NULL, which works but hides the decision in a made-up value.",
    counterexample:
      "status <> 'blocked' alone drops Dag, Zoe, and Yan, whose status was never set; the never-set check catches it. phone IS NOT NULL alone keeps Eli with an empty phone.",
    transfer:
      'The club adds an opted_out column that is 1, 0, or NULL for members who were never asked. Decide what NULL should mean for a marketing message versus an urgent safety message, and write both conditions. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-search-articles': {
    reasoning:
      "Three conditions must all hold: published, in one of two sections, and a title containing sql. Grouping the sections (with IN or brackets) keeps the OR from swallowing the other conditions. LIKE '%sql%' matches the letters anywhere, and SQLite's LIKE ignores ASCII letter case. published_at IS NOT NULL removes drafts; the text dates sort correctly because they are written year first.",
    trace:
      'With the site data, Writing better sql matches the title and section but is a draft, so it fails. MySQL or SQLite? is published and matches, but blog is not one of the sections. Of the four that pass, two were published on 2026-03-15; id orders them 2, then 6, followed by 8 and 1.',
    alternative:
      "instr(lower(title), 'sql') > 0 finds the letters without a pattern and makes the case rule explicit. A full-text index would rank results and match whole words, which this search does not attempt.",
    counterexample:
      "published_at IS NOT NULL AND section = 'guides' OR section = 'news' AND title LIKE '%sql%' lets the news draft through; the drafts check catches it. LIKE 'sql%' only matches titles that start with sql and misses Joins in SQL.",
    transfer:
      'Search now matches sql as a whole word only, so NoSQL and MySQL should not count. Decide whether LIKE patterns can express word boundaries in every position, including the start and end of a title. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-count-by-status': {
    reasoning:
      'GROUP BY status gives one group per distinct status, with all NULL statuses in one group, and COUNT(*) counts the rows of each group. Ordering by the count, then the status, gives every group one position because statuses are distinct within the result. With no orders there are no groups, so no row appears.',
    trace:
      'With the week data, the groups are shipped (orders 1, 4, 8), pending (2, 6), NULL (3, 7), and cancelled (5). Their counts are 3, 2, 2, and 1. The tie between NULL and pending is settled by status, and SQLite sorts NULL before any text, so NULL comes first.',
    alternative:
      "COUNT(status) would count only non-NULL statuses and report 0 for the NULL group, which hides two real orders. COALESCE(status, 'none') would label the NULL group with text, which reads well on screen but breaks the contract's NULL and changes where it sorts.",
    counterexample:
      'SELECT COUNT(*) FROM shop_orders without GROUP BY returns one row with the total. Sorting by count alone leaves pending and shipped in an order SQLite does not promise; the equal-counts check catches it. COUNT(status) reports 0 for the NULL group.',
    transfer:
      'The owner now wants each status with its count and its share of all orders as a percentage, rounded to one decimal. Decide where the total comes from and how to avoid integer division. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-ratings-summary': {
    reasoning:
      'Each column answers a different counting question over the same group. COUNT(*) counts every review, COUNT(stars) counts reviews with a value, and AVG(stars) averages only those values, so the unrated reviews neither count as zero stars nor shrink the average. AVG over no values is NULL, and ROUND keeps NULL as NULL.',
    trace:
      'For Lamp the group holds 5, 4, NULL, and 4. COUNT(*) is 4, COUNT(stars) is 3, and AVG(stars) is 13 / 3 = 4.333…, which ROUND turns into 4.33. For Rug both stars are NULL: COUNT(*) is 2, COUNT(stars) is 0, and AVG(stars) is NULL.',
    alternative:
      'SUM(stars) * 1.0 / COUNT(stars) computes the same average by hand but divides by zero for Rug, which SQLite turns into NULL; AVG says it directly. Treating an unrated review as 0 stars with COALESCE would lower every average, which is a product decision, not a technical one.',
    counterexample:
      'COUNT(*) used for rated reports 4 rated reviews for Lamp. AVG(COALESCE(stars, 0)) gives Lamp 3.25 and Rug 0 instead of NULL. Rounding before averaging changes nothing here, but rounding to 1 decimal reports 4.3.',
    transfer:
      'The shop now shows a rating only when at least three reviews have stars, and otherwise shows nothing. Decide whether that rule belongs in HAVING, in a CASE expression, or in the application. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-count-visitors': {
    reasoning:
      'Views and visitors are two counts of the same group. COUNT(*) counts every view, including anonymous ones. COUNT(DISTINCT visitor) first removes repeated values and NULL, then counts what is left, so a visitor who returns counts once and anonymous views never count as visitors.',
    trace:
      'For /home the group holds ana, ana, bo, NULL, NULL. COUNT(*) is 5. DISTINCT keeps ana and bo, and NULL is skipped, so visitors is 2. /pricing has one NULL visitor: one view, zero visitors.',
    alternative:
      'Counting visitors in a subquery that first selects DISTINCT page and visitor, then grouping, gives the same numbers in two steps. Treating every anonymous view as a different person would need a session identifier that this table does not have.',
    counterexample:
      'COUNT(visitor) counts ana twice and reports 3 visitors for /home. COUNT(DISTINCT page) per page always reports 1. Sorting by views alone leaves /a and /b in an order SQLite does not promise.',
    transfer:
      'The site now wants, for each page, the number of visitors who viewed it on at least two different days, given a viewed_on column. Decide what you group by first and what you count afterwards. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-busy-days': {
    reasoning:
      "Two filters work at different times. WHERE status <> 'cancelled' removes single deliveries before grouping, so they never reach a count. HAVING COUNT(*) >= 3 then removes whole days whose remaining count is too small. A day whose deliveries were all cancelled leaves no rows behind and forms no group.",
    trace:
      'For 2026-05-03 there are two delivered and two cancelled. WHERE keeps the two delivered, the group counts 2, and HAVING drops the day. Without the WHERE filter the count would be 4 and the day would wrongly qualify. 2026-05-02 keeps two delivered and one late: 3, so it stays.',
    alternative:
      "COUNT(CASE WHEN status <> 'cancelled' THEN 1 END) counts only kept deliveries inside each group, without WHERE. It is useful when the same query also needs the cancelled count, but here it keeps days with only cancelled deliveries as groups with a count of 0 that HAVING must then remove.",
    counterexample:
      'Counting every delivery and filtering in HAVING alone makes 2026-05-03 busy with 4. HAVING COUNT(*) > 3 drops the two days with exactly 3. Putting COUNT(*) >= 3 in WHERE is an error in SQLite.',
    transfer:
      'A day is now busy when at least three deliveries went ahead or at least two were late. Decide which counts you need per day and how HAVING combines them. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-month-spenders': {
    reasoning:
      "The date range picks the March payments before grouping, so payments from other months never touch a total. Text dates written year first compare like dates, so BETWEEN '2026-03-01' AND '2026-03-31' includes both edges. Each account's group is counted and summed with its refunds, then HAVING keeps totals of at least 10000, and the order is total descending, then account.",
    trace:
      'For dune, WHERE keeps 2026-03-31 (4000) and 2026-03-01 (6000) and drops 2026-04-01. The group counts 2 and sums 10000, which meets the threshold. For bolt, 12000 and the -3000 refund sum to 9000, so HAVING drops it. core and dune tie at 10000 and the account name orders them.',
    alternative:
      "paid_on >= '2026-03-01' AND paid_on < '2026-04-01' states a half-open range, which keeps working if times are ever added to the dates. Filtering the month with strftime('%Y-%m', paid_on) = '2026-03' reads clearly but cannot use an index on paid_on.",
    counterexample:
      "Filtering amount_cents >= 10000 in WHERE checks single payments, so acme's two smaller payments never qualify. paid_on < '2026-03-31' drops dune's last-day payment. Leaving out WHERE adds acme's February payment and dune's April payment.",
    transfer:
      'Finance now wants the same report for every month of 2026, one row per account and month. Decide what you group by and how you would label the month. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-join-orders': {
    reasoning:
      'The ON condition pairs each order with the customer whose id equals its customer_id. An inner join keeps only pairs, so an order whose customer was deleted, and a customer who never ordered, produce no row. Joining on the id rather than the name keeps two customers called Ola apart, and qualifying o.id avoids confusing the order id with the customer id.',
    trace:
      'With the shop data, order 10 pairs with Ada, 11 with Bo, and 12 with Ada again. Order 13 has customer_id 9, and no customer has id 9, so it produces no pair. Cy has no order, so Cy produces no row either. Sorting by o.id gives 10, 11, 12.',
    alternative:
      'Writing FROM customers JOIN orders gives the same rows; the table order does not change an inner join’s result, only which name feels natural to read first. A LEFT JOIN from orders would keep order 13 with a NULL name, which suits a report of broken links but not this invoice list.',
    counterexample:
      'Joining on names instead of ids pairs each Ola order with both Olas and doubles the rows. Selecting a bare id when both tables have one is an ambiguity error in SQLite. A LEFT JOIN from orders keeps order 13 with a NULL name.',
    transfer:
      'The invoice list now also shows orders of deleted customers, labelled "Deleted customer" instead of a name. Decide which join keeps those orders and how to fill the missing name. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-customers-without-orders': {
    reasoning:
      'A LEFT JOIN keeps every customer; one with no orders becomes a single row whose order columns are NULL. The order id is never NULL in a real order, because it is the primary key, so o.id IS NULL is true exactly for customers with no match. Orders of deleted customers never pair with anyone, so they cannot affect the result.',
    trace:
      'With the shop data, Ada pairs with orders 10 and 12, Cy with 11, and Bo and Di pair with nothing. The LEFT JOIN gives Bo and Di one row each with o.id NULL, and the filter keeps exactly those. Sorting by name, then id, gives Bo, Di.',
    alternative:
      'WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id) states the question directly and never produces duplicate rows; the next stage covers it. WHERE c.id NOT IN (SELECT customer_id FROM orders) also works here because customer_id is NOT NULL, but returns nothing if that subquery ever yields a NULL.',
    counterexample:
      'Testing o.cents IS NULL works only while cents can never be NULL; testing the primary key is the safe habit. An inner join with WHERE o.id IS NULL always returns no rows, because an inner join never produces the NULL row.',
    transfer:
      'The campaign now targets customers whose only orders were cancelled, given a status column on orders. Decide whether this is still a missing-match question, and how the join or subquery changes. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-team-totals': {
    reasoning:
      'Each list is summarized on its own before it meets the team: one row per team with its member count, and one with its expense total. Joining one-row summaries cannot multiply anything. LEFT JOINs keep teams with no members or no expenses, and COALESCE turns a missing total into 0.',
    trace:
      'For Alpha, the expense summary gives one row (team 1, 500) and the member summary one row (team 1, 3). Joined to Alpha they make one row: 3 and 500. In the starter, Alpha met 3 members and 2 expenses at once, making 6 rows, so it reported 6 members and 1500 cents.',
    alternative:
      'Scalar subqueries per column, such as (SELECT COUNT(*) FROM team_members WHERE team_id = t.id), avoid the join entirely and read clearly for a few columns. COUNT(DISTINCT m.id) repairs the member count but not the sum, and SUM(DISTINCT e.cents) merges two real expenses of the same amount.',
    counterexample:
      'The starter reports Alpha with 6 members and 1500 cents. SUM(DISTINCT e.cents) reports Delta’s two 300-cent expenses as 300. Dropping COALESCE shows NULL instead of 0 for Beta.',
    transfer:
      'The page now also shows each team’s number of open tickets from a third list. Decide how your query grows and whether the join or the subquery form stays easier to read. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-june-returns': {
    reasoning:
      'The LEFT JOIN keeps every product, and the date range sits in ON, so it only decides which returns pair up. A product with no June return keeps one row with NULL return columns. COUNT(r.id) counts real returns only, so that row counts as 0. Grouping by p.id keeps every product exactly once, and returns of deleted products never pair.',
    trace:
      'For the Toaster, the only return is on 2026-07-01, which fails the date part of ON, so the Toaster keeps one row with r.id NULL; COUNT(r.id) gives 0. The Kettle pairs with 2026-06-03 and 2026-06-30 but not 2026-05-31, so it counts 2.',
    alternative:
      'A derived table that counts June returns per product, joined with a LEFT JOIN and wrapped in COALESCE(count, 0), separates the two steps and works well when more columns join later. A scalar subquery per product, counting its June returns, reads clearly for one column.',
    counterexample:
      'Moving the date range into WHERE drops the Toaster and Grill, because their return date is NULL or outside June after the join. COUNT(*) reports 1 for a product with no June returns. An inner join drops every product without a June return.',
    transfer:
      'The team now wants June returns and July returns side by side for every product. Decide whether one join can count both, for example with conditional counting, or whether you need two. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-authors-latest': {
    reasoning:
      'A LEFT JOIN keeps authors without books as one row with NULL book columns. COUNT(b.id) counts real books, so such an author counts 0, and MAX(b.year) skips NULL years, so an author whose books all lack a year gets NULL. Grouping by a.id keeps the two authors named Kim apart, and sorting by name, then id, orders them.',
    trace:
      "For Anonymous, the only book has year NULL: COUNT(b.id) is 1 and MAX(b.year) is NULL. For Newcomer, no book matches, so the single row has b.id NULL: COUNT gives 0 and MAX gives NULL. Le Guin's years 1969, 1974, and NULL give 3 and 1974.",
    alternative:
      'Correlated subqueries per column, (SELECT COUNT(*) FROM books WHERE author_id = a.id) and (SELECT MAX(year) …), avoid grouping and read well. Ordering books by year and picking the first per author needs window functions, a later stage; MAX is enough when only the year is needed.',
    counterexample:
      'An inner join drops Newcomer. COUNT(*) counts Newcomer as 1 book. Grouping by name merges the two Kims into one row with 3 books.',
    transfer:
      'The catalogue now shows the title of each author’s latest book, not just its year, and must choose when two books share the latest year. Decide why MAX(year) alone cannot pick the title and what would. This changed contract is self-reviewed; the original checks do not cover it.',
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
  'sql-filter-sort': {
    plan: ['Write the two conditions a row must meet.', 'Name both sort keys in order and say which data set tests the second one.'],
    explanation: [
      'Explain why 2000, a NULL year, and a lowercase genre are all left out.',
      'Explain what the second sort key changes, using the 1957 films.',
    ],
    example:
      "I keep rows where genre = 'Drama' and year < 2000, then ORDER BY year, title. A NULL year makes the comparison unknown, so that film is left out, and the title only orders films that share a year.",
  },
  'sql-distinct-cities': {
    plan: ['Say which rows qualify and which single column you keep.', 'Decide when repeated cities collapse into one.'],
    explanation: ['Explain why DISTINCT must see only the city column.', 'Explain where Ålesund lands in the order and why.'],
    example:
      "I select DISTINCT city from customers where country = 'NO', ordered by city. DISTINCT compares only the selected column, so three Oslo customers give one Oslo row, and Ålesund sorts last because SQLite compares character codes.",
  },
  'sql-line-totals': {
    plan: ['Write the calculation and its column name.', 'Name every sort key with its direction.'],
    explanation: ['Explain how the three 1200-cent lines are ordered.', 'Explain why a zero total still appears.'],
    example:
      'I select id and quantity * unit_cents AS total_cents, then ORDER BY total_cents DESC, product, id. The product orders equal totals, the id settles a repeated product, and nothing filters out a zero total.',
  },
  'sql-recent-open-tickets': {
    plan: [
      'Name the filter, both sort keys with their directions, and the row count.',
      'Pick the data set that would break a missing second key.',
    ],
    explanation: ['Explain why sorting the opened_at text sorts the times.', 'Trace the same-minute data through the sort and the limit.'],
    example:
      "I keep status = 'open', ORDER BY opened_at DESC, id DESC, and LIMIT 3. The text is written year first, so it sorts as time, and id DESC settles tickets from the same minute, so the three rows are always the same three.",
  },
  'sql-catalog-page': {
    plan: ['Write the complete sort order.', 'Work out how many rows page 2 skips and keeps.'],
    explanation: [
      'Explain why the order needs name and id after price.',
      'Explain how you would get page n, and what happens past the last page.',
    ],
    example:
      'I keep active = 1, ORDER BY price_cents, name, id, then LIMIT 4 OFFSET 4. Page n skips (n - 1) × 4 rows. The name settles equal prices, and the id settles equal names, so no product can move between pages.',
  },
  'sql-filter-groups': {
    plan: ['Write the condition in words with brackets around the category choice.', 'Name the data set that shows missing brackets.'],
    explanation: ['Explain what AND-before-OR does to the starter query.', 'Explain why 1499 counts and 1500 does not.'],
    example:
      "I keep category IN ('Poetry', 'Drama') AND price_cents < 1500 AND in_stock = 1, ordered by id. Without grouping, AND binds first, so every poetry book would pass whatever its price or stock.",
  },
  'sql-price-band': {
    plan: ['Write the two ends of the range and whether each is included.', 'Add the beds rule and both sort keys.'],
    explanation: ['Explain which rooms sit exactly on the ends and why they stay.'],
    example:
      'I keep nightly_cents BETWEEN 8000 AND 12000 AND beds >= 2, ordered by nightly_cents, name. BETWEEN includes both ends, so Garden and Harbour stay.',
  },
  'sql-code-pattern': {
    plan: ['Write the pattern one position at a time.', 'Say which wildcard fixes the length.'],
    explanation: ['Explain why BR-12 and BR-1050 fail.', 'Explain why br-300 passes in SQLite.'],
    example:
      "I keep code LIKE 'BR-___', ordered by code. Each _ matches one character, so the code must be exactly six characters, and SQLite's LIKE ignores ASCII letter case.",
  },
  'sql-members-to-text': {
    plan: ['List every kind of phone and status value and whether it lets a member through.', 'Name both sort keys.'],
    explanation: ['Trace a member whose status is NULL through your condition.', 'Explain how your phone test treats NULL and empty text.'],
    example:
      "I keep phone <> '' AND (status <> 'blocked' OR status IS NULL), ordered by name, id. A NULL phone makes the comparison unknown, so it is dropped, while a NULL status is let through on purpose.",
  },
  'sql-search-articles': {
    plan: ['Write the three conditions and how they group.', 'Name the sort keys.'],
    explanation: ['Explain why a news draft does not appear.', 'Explain why NoSQL myths does appear.'],
    example:
      "I keep published_at IS NOT NULL AND section IN ('guides', 'news') AND title LIKE '%sql%', ordered by published_at DESC, id. Grouping the sections stops the OR from letting drafts through, and LIKE ignores ASCII case in SQLite.",
  },
  'sql-count-by-status': {
    plan: ['Say what one result row stands for and what is counted in it.', 'Decide where orders with no status go.'],
    explanation: ['Explain where the NULL group appears and why.', 'Explain what an empty table returns and why.'],
    example:
      'I GROUP BY status and select status with COUNT(*) AS order_count, ordered by order_count DESC, status. NULL statuses form one group, and SQLite sorts NULL before text, so it comes ahead of pending at the same count.',
  },
  'sql-ratings-summary': {
    plan: ['Predict the four values for the Rug.', 'Say which count includes unrated reviews.'],
    explanation: ['Explain the difference between COUNT(*) and COUNT(stars).', 'Explain why the Rug average is NULL.'],
    example:
      'I GROUP BY product and select COUNT(*), COUNT(stars), and ROUND(AVG(stars), 2), ordered by product. AVG skips NULL stars, so unrated reviews do not drag the average down, and with no stars at all it is NULL.',
  },
  'sql-count-visitors': {
    plan: ['Write the views and visitors you expect for /home.', 'Say which rows each count includes.'],
    explanation: ['Explain why ana counts once and anonymous views not at all.'],
    example:
      'I GROUP BY page and select COUNT(*) AS views and COUNT(DISTINCT visitor) AS visitors, ordered by views DESC, page. DISTINCT removes repeat visitors and COUNT skips NULL.',
  },
  'sql-busy-days': {
    plan: ['Name the filter on rows and the filter on groups.', 'Check your plan against 2026-05-03.'],
    explanation: ['Explain why cancelled deliveries must go before counting.', 'Explain why exactly 3 qualifies.'],
    example:
      "I keep status <> 'cancelled' in WHERE, GROUP BY day, keep HAVING COUNT(*) >= 3, and order by day. Cancelled deliveries leave before counting, so they cannot make a day busy.",
  },
  'sql-month-spenders': {
    plan: ['Write which of bolt’s and dune’s payments count, and their totals.', 'Order the steps: rows, groups, totals, sort.'],
    explanation: ['Explain why the threshold belongs to the total, not to a payment.', 'Explain how both month edges are included.'],
    example:
      "I keep paid_on BETWEEN '2026-03-01' AND '2026-03-31', GROUP BY account, select COUNT(*) and SUM(amount_cents), keep HAVING SUM(amount_cents) >= 10000, and order by the total descending, then account.",
  },
  'sql-join-orders': {
    plan: ['Write the condition that pairs an order with its customer.', 'Predict what happens to order 13.'],
    explanation: ['Explain why order 13 and Cy produce no rows.', 'Explain why joining on the id keeps the two Olas apart.'],
    example:
      'I join orders AS o to customers AS c ON o.customer_id = c.id, select o.id, c.name, o.cents, and order by o.id. The inner join keeps only matched pairs.',
  },
  'sql-customers-without-orders': {
    plan: ['Describe the row a LEFT JOIN gives a customer with no orders.', 'Name the column that shows the missing match.'],
    explanation: ['Explain why o.id IS NULL is a safe test.', 'Explain why orders of deleted customers change nothing.'],
    example:
      'I LEFT JOIN orders on the customer id and keep rows WHERE o.id IS NULL, ordered by name, id. The primary key is never NULL in a real order, so a NULL id means no match.',
  },
  'sql-team-totals': {
    plan: ['Predict the rows of the starter’s join for Alpha.', 'Decide how to summarize each list before joining.'],
    explanation: ['Explain why the starter reported 6 members.', 'Explain why SUM(DISTINCT …) is not a fix.'],
    example:
      'I select each team’s name with (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) and COALESCE((SELECT SUM(cents) FROM expenses WHERE team_id = t.id), 0), ordered by name. Each list is counted alone, so neither multiplies the other.',
  },
  'sql-june-returns': {
    plan: ['Trace the Toaster through the join, any filter, and the grouping.', 'Decide where the June rule goes.'],
    explanation: ['Explain why the date range belongs in ON.', 'Explain why COUNT(r.id) gives 0 for a product without June returns.'],
    example:
      'I LEFT JOIN product_returns ON the product id AND the June range, GROUP BY p.id, count r.id, and order by the count descending, then name. The date in ON keeps every product.',
  },
  'sql-authors-latest': {
    plan: ['Predict the rows for Newcomer and Anonymous.', 'Name the join, the grouping, and the two aggregates.'],
    explanation: ['Explain why COUNT(b.id) and MAX(b.year) give 0 and NULL for Newcomer.', 'Explain why grouping by id matters.'],
    example:
      'I LEFT JOIN books on the author id, GROUP BY a.id, select the name, COUNT(b.id), and MAX(b.year), and order by name, then id.',
  },
}

export const sqlLessonDepth: Record<string, LessonDepth> = {
  'sql-reading': {
    title: 'A page is only as stable as its order',
    code: '-- Prices: Ruler 300 (id 5), Sticky notes 300 (id 8)\nSELECT name FROM products\nWHERE active = 1\nORDER BY price_cents\nLIMIT 4;',
    reasoning:
      'ORDER BY price_cents puts Ruler and Sticky notes in a tie. SQLite may return a tied pair in either order, and nothing in the query says which one wins. When the tie sits on a page break, one request can show Ruler on page 1 and the next can show Sticky notes there, so a customer can see a product twice and miss another. Adding name and then id as tie-breakers gives every row one position.',
    challenge:
      'Predict what LIMIT 4 OFFSET 4 shows on the shelf data with ORDER BY price_cents alone, then with ORDER BY price_cents, name, id. Which rows can change between runs in the first version? Discuss before revealing.',
    answer:
      'With price alone, the fourth and fifth rows are Ruler and Sticky notes in an order SQLite does not promise, so page 1 ends with one of them and page 2 starts with the other. With name and id added the order is total: page 2 is always Sticky notes, Notebook, Pencil case, Ink bottle. This discussion is self-reviewed; it explains why the catalog rep checks a tie across the page break.',
  },
  'sql-filtering': {
    title: 'Unknown is not the same as false',
    code: "-- status: 'active', 'blocked', NULL\nSELECT name FROM members\nWHERE NOT (status = 'blocked');",
    reasoning:
      "For a NULL status, status = 'blocked' is unknown, and NOT unknown is still unknown, so the row is dropped even though the condition looks like it asks for everyone who is not blocked. Unknown values pass through NOT, AND, and OR by their own rules: unknown AND false is false, unknown OR true is true, and otherwise the result stays unknown.",
    challenge:
      "Predict which of three members (active, blocked, NULL) each condition keeps: NOT (status = 'blocked'), status IS NOT 'blocked', and status <> 'blocked' OR status IS NULL. Discuss before revealing.",
    answer:
      'The first keeps only the active member: the NULL row is unknown under NOT. The second, a SQLite form that treats NULL as a value, keeps active and NULL. The third keeps active and NULL in any database. This discussion is self-reviewed; the members rep checks the NULL case.',
  },
  'sql-summarizing': {
    title: 'A filter means something different before and after grouping',
    code: "SELECT day, COUNT(*) AS kept\nFROM deliveries\nWHERE status <> 'cancelled'\nGROUP BY day;\n-- versus HAVING SUM(status = 'cancelled') = 0",
    reasoning:
      "WHERE status <> 'cancelled' removes cancelled rows, so a day still appears with a smaller count. HAVING SUM(status = 'cancelled') = 0 instead removes every day that had any cancellation, keeping its full count when it had none. The same words, cancelled and not, ask two different questions depending on whether they run before or after the groups exist.",
    challenge:
      'For a day with three delivered and one cancelled delivery, predict what each query returns for that day: the WHERE version and the HAVING version. Then describe a report that needs each one. Discuss before revealing.',
    answer:
      'The WHERE version returns the day with 3. The HAVING version drops the day entirely, because one delivery was cancelled. A workload report wants the first, counting what went ahead; a report of perfect days wants the second. This discussion is self-reviewed; the busy-days rep checks the WHERE version.',
  },
  'sql-joining': {
    title: 'A WHERE after a LEFT JOIN can quietly undo it',
    code: "SELECT p.name, COUNT(r.id)\nFROM products AS p\nLEFT JOIN product_returns AS r ON r.product_id = p.id\nWHERE r.returned_on >= '2026-06-01'\nGROUP BY p.id;",
    reasoning:
      'The LEFT JOIN keeps a product with no returns as a row whose returned_on is NULL. WHERE then tests NULL >= a date, which is unknown, so that row is removed before grouping. The result looks like a report of every product but silently omits every product that had no qualifying return.',
    challenge:
      'Predict which products this query returns for Kettle (two June returns), Toaster (one July return), and Grill (no returns). Then move the date condition into ON and predict again. Discuss before revealing.',
    answer:
      'As written it returns only Kettle (2) and Toaster (1): Toaster’s July return passes >= June 1, and Grill disappears. With the condition in ON and an upper bound for June, all three appear: Kettle 2, Toaster 0, Grill 0. This discussion is self-reviewed; the June returns rep checks the ON version.',
  },
}
