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
  'sql-above-average': {
    reasoning:
      'The scalar subquery computes one number, the average of all invoices, and WHERE compares each invoice with it. Strict > leaves out invoices equal to the average. With one invoice the average equals that invoice, and with none the average is NULL, so the comparison is never true and no rows come back.',
    trace:
      'With the month data, the subquery averages 300, 500, 700, 500, and 1000: 3000 / 5 = 600. Invoice 3 (700) and invoice 5 (1000) are greater; the two 500s and the 300 are not. Sorting by cents descending gives 5, then 3.',
    alternative:
      'A WITH step that computes the average once, joined to invoices, says the same thing in two named steps and is easier to extend, for example to show the average beside each row. A window function, AVG(cents) OVER (), puts the average on every row; a later stage covers it.',
    counterexample:
      '>= keeps the two 500-cent invoices in the at-average data. HAVING cents > AVG(cents) without GROUP BY collapses the table into one group and returns at most one row.',
    transfer:
      'The accountant now wants invoices more than 50% above the average, with the average shown in a third column. Decide where the average is computed so it is written only once. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-category-average': {
    reasoning:
      'The subquery refers to the outer row’s category, so it averages only the products of that category, once for each product the outer query examines. A product alone in its category is compared with its own price and never passes, because > is strict.',
    trace:
      'For the Hose, the subquery averages the garden products 400 and 600 to 500, and 600 > 500, so the Hose stays. For the Globe, the only decor product, the average is 2500, and 2500 > 2500 is false. The starter instead compared every product with the store average of about 1583, which let the Pan and the Globe through.',
    alternative:
      'A derived table of category averages, joined on category, computes each average once and makes the comparison visible as a column. A window function, AVG(price_cents) OVER (PARTITION BY category), attaches the category average to each row; the window stage returns to it.',
    counterexample:
      'Leaving the subquery uncorrelated compares every product with the whole store, the starter’s mistake. Correlating on name instead of category compares each product with itself.',
    transfer:
      'The buyer now wants products more expensive than every other product in their category, that is, the most expensive one, with ties all kept. Decide between a correlated MAX and NOT EXISTS of a pricier product. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-students-without-work': {
    reasoning:
      'NOT EXISTS keeps a student when no submission has their id. A guest submission has student_id NULL; NULL = s.id is never true, so it simply matches nobody and cannot hide anyone. NOT IN instead compares each id with every value in the list, and a NULL in that list makes the result unknown for everyone.',
    trace:
      'With the class data, the subquery for Bo looks for submissions with student_id 2 and finds none, so NOT EXISTS is true. With the starter, 2 NOT IN (1, NULL, 4, 1) asks whether 2 differs from the unknown value; that is unknown, so Bo is dropped, and so is everyone else.',
    alternative:
      'NOT IN (SELECT student_id FROM submissions WHERE student_id IS NOT NULL) repairs the starter by keeping NULL out of the list. A LEFT JOIN with WHERE sub.id IS NULL also works and suits a query that needs columns from both tables.',
    counterexample:
      'The starter returns no rows for the class data, and it fails the same way whenever any guest submission exists, however many students there are. Testing s.task IS NULL after a LEFT JOIN works only while task can never be NULL; test the joined key instead.',
    transfer:
      'The teacher now wants students with no essay, even if they submitted a quiz. Decide where the task condition belongs in your subquery and why it must not go in the outer WHERE. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-free-rooms': {
    reasoning:
      'A room is free when no covering booking exists, so the question is NOT EXISTS: for the outer room, look for a booking of that room with starts_on on or before the night and ends_on after it. Because the guest leaves on ends_on, a booking ending on 2026-08-15 does not cover that night. EXISTS never repeats the outer row, so a room with many bookings still appears at most once.',
    trace:
      "For Fir, the subquery finds the 2026-08-14 to 2026-08-20 booking, which starts before and ends after the night, so NOT EXISTS is false and Fir is left out, even though its other booking is in early August. For Birch, the only booking ends on 2026-08-15, and '2026-08-15' > '2026-08-15' is false, so nothing covers the night and Birch stays.",
    alternative:
      'A LEFT JOIN of bookings with the covering condition in ON, followed by WHERE b.id IS NULL, gives the same rooms. Selecting room ids that are NOT IN a subquery of covering bookings also works here, because room_id is NOT NULL.',
    counterexample:
      'Joining bookings and keeping rows whose booking does not cover the night keeps Fir through its old booking, and lists Dogwood twice. ends_on >= the night marks Birch as busy on the morning its guest leaves.',
    transfer:
      'The guest now asks for rooms free for three nights, 15 to 17 August, leaving on the 18th. Write the condition for a booking that overlaps a range of nights. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-strong-months': {
    reasoning:
      'The question has two steps, so WITH names the first: 2026 sales grouped into one row per month, with the month taken as the first seven characters of the date. The main query then reads that step twice, once for the rows and once inside a scalar subquery for their average, and keeps totals strictly above it. Months without sales never appear in the step, so they do not lower the average.',
    trace:
      'With the year data, the step produces 2026-01 (1000), 2026-02 (3500), 2026-03 (2000), and 2026-05 (5500); the 2025 sale is filtered out. Their average is 12000 / 4 = 3000. February and May are above it.',
    alternative:
      "A derived table in FROM, plus a second copy of the same grouping in the subquery, computes the same result but repeats the grouping. strftime('%Y-%m', sold_on) extracts the month as clearly as substr for well-formed dates.",
    counterexample:
      'Averaging single sales instead of monthly totals gives 1500 for the refunds data and adds July. Filtering 2026 in the outer query instead of the step still averages the 2025 month in. >= keeps July in the refunds data.',
    transfer:
      'The shop now counts months without sales as 0 when averaging, so April counts. Decide where the missing months would come from, since no table lists them. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-create-products': {
    reasoning:
      'Each rule in the brief maps to one constraint: NOT NULL on sku, name, and price_cents refuses missing values, UNIQUE on sku refuses a repeat, and CHECK (price_cents >= 0) refuses a negative price while allowing 0. Because the rules live in the table, every program that inserts a product is held to them.',
    trace:
      'For the repeated SKU check, the first insert of D-4 is stored. The second insert of D-4 finds the value already present, so UNIQUE fails and SQLite rejects the row; the first row stays. For price -5, the CHECK condition -5 >= 0 is false, so the insert is rejected.',
    alternative:
      'Validating in application code before inserting gives friendlier messages, but a second program or a manual fix can bypass it. The usual design keeps both: constraints as the guarantee, application checks for the message. Making sku the primary key would also enforce uniqueness, but a separate integer id keeps links stable if a SKU is ever renamed.',
    counterexample:
      'CHECK (price_cents > 0) rejects the free sample. UNIQUE without NOT NULL on sku still accepts a product with no SKU, because NULLs never clash.',
    transfer:
      'Products now have a sale_price_cents that may be missing but, when present, must be lower than price_cents. Decide how one CHECK expresses an optional rule that compares two columns. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-default-values': {
    reasoning:
      "DEFAULT supplies a value only when an insert leaves the column out; CHECK limits the values; NOT NULL refuses an explicit NULL. Together they make a title-only insert produce ('…', 'open', 3) while 'blocked', priority 0 or 6, and an explicit NULL status are refused. The CHECKs also apply to the defaults, which keeps them honest.",
    trace:
      "INSERT INTO tasks (title) VALUES ('Write report') names only title, so status takes 'open' and priority takes 3; both pass their CHECKs and the row reads back as ('Write report', 'open', 3). INSERT … (title, status) VALUES ('Vague', NULL) names status, so no default applies, and NOT NULL rejects the row.",
    alternative:
      'Filling defaults in application code works but has to be repeated in every program that inserts tasks. A trigger could replace an explicit NULL with the default, which changes what NULL means and surprises readers; refusing it is clearer.',
    counterexample:
      "DEFAULT 'open' without NOT NULL stores the explicit NULL. CHECK (priority BETWEEN 0 AND 5) accepts priority 0. A default of 'Open' fails its own CHECK on every title-only insert.",
    transfer:
      'Tasks now record when they were created, defaulting to the current time. Decide what default expression SQLite allows here and why a check of the stored value would depend on the clock. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-strict-types': {
    reasoning:
      "In an ordinary SQLite table, REAL is only a type affinity: SQLite converts values to a real number when it can and otherwise stores them as they are, so 'warm' is kept as text. STRICT makes the declared type a rule. SQLite still converts what it can without loss, so 20 and '19.5' become real numbers, and rejects what it cannot, so 'warm' is refused.",
    trace:
      "With the starter, INSERT … VALUES ('south', 'warm') stores the text, and typeof(celsius) reads back 'text'. With ) STRICT, the same insert fails with cannot store TEXT value in REAL column. '19.5' converts to 19.5 and reads back as 'real' in both tables.",
    alternative:
      "CHECK (typeof(celsius) = 'real') also rejects 'warm', because affinity converts numbers before the check runs, but it must be written for every column. Validating in application code helps only the programs that remember to do it.",
    counterexample:
      "The starter's NOT NULL rules cannot catch 'warm', because the value is not missing. A CHECK (celsius > -100) also lets 'warm' through: in SQLite any text compares greater than any number.",
    transfer:
      'The greenhouse now stores the reading time as an INTEGER of Unix seconds. Decide whether STRICT is enough to keep a text date out, and what else would check the range. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-create-memberships': {
    reasoning:
      'memberships links two tables, so each of its key columns REFERENCES the table it points into, and PRIMARY KEY (member_id, club_id) makes the pair the identity of a membership: a member can appear in many clubs and a club can have many members, but the same pair only once. NOT NULL on the dates, emails, and names covers the required values, and UNIQUE covers emails and club names.',
    trace:
      'The setup inserts member 1 and clubs 1 and 2. Ana joining Chess stores the pair (1, 1). Joining Chess again repeats (1, 1), so the primary key rejects it. A membership for member 9 finds no member with id 9, so with foreign keys on, the reference fails and SQLite rejects the row.',
    alternative:
      'An id INTEGER PRIMARY KEY on memberships with a separate UNIQUE (member_id, club_id) gives each membership its own id, which helps when other tables point at memberships. Without foreign key enforcement, the same rules would need triggers or application checks.',
    counterexample:
      'UNIQUE (member_id) alone stops Ana from joining Rowing. Leaving out REFERENCES lets the membership for member 9 through even with foreign keys on.',
    transfer:
      'Deleting a member should now delete their memberships, while deleting a club with members should be refused. Decide which ON DELETE actions express that. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-create-shifts': {
    reasoning:
      'Single-column rules sit on their columns: NOT NULL for required values and CHECK (role IN (…)) for known roles. Two rules involve two columns and are written as table constraints: CHECK (ends_at > starts_at) compares values in the same row, and UNIQUE (worker, starts_at) refuses a repeated pair while letting different workers share a start time. Text times compare correctly because they are written year first with a fixed width.',
    trace:
      "Dee's first 12:00 shift is stored, Eli's 12:00 shift is a different pair and is stored, and Dee's second 12:00 shift repeats (Dee, 2026-09-03 12:00), so UNIQUE rejects it. A shift ending at 18:00 when it starts at 18:00 fails ends_at > starts_at, because the two texts are equal.",
    alternative:
      'Storing times as INTEGER minutes since midnight plus a date column makes arithmetic easy and avoids text comparison, at the cost of readability. Refusing overlapping shifts, not just equal starts, needs a trigger or application logic, because a CHECK sees only one row.',
    counterexample:
      'UNIQUE (starts_at) refuses Eli’s shift. CHECK (ends_at >= starts_at) accepts the zero-length shift. A role column without CHECK accepts manager.',
    transfer:
      'The restaurant now refuses any two shifts of one worker that overlap, not only those with equal start times. Decide why no table constraint can express that and what would. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-update-scope': {
    reasoning:
      "The WHERE clause is the scope of the change: only rows for which category = 'tea' AND active = 1 is true are updated, and SET adds 50 to each of their own prices. Every other row is untouched because UPDATE never visits rows its WHERE rejects. The text comparison is exact, so 'Tea' is outside the scope.",
    trace:
      "With the shelf data, Sencha (tea, active) goes from 800 to 850 and Earl Grey from 650 to 700. Old Oolong is tea but inactive, the Mug is ware, and Chai is filed as 'Tea', so their rows keep 700, 900, and 500.",
    alternative:
      "Running SELECT id FROM products WHERE category = 'tea' AND active = 1 first previews the scope, and on real data wrapping the update in BEGIN … COMMIT lets you check the result and ROLLBACK if it is wrong. lower(category) = 'tea' would include Chai, which this contract excludes.",
    counterexample:
      "The starter without WHERE raises every price, including the Mug and the inactive tea. WHERE category = 'tea' alone raises Old Oolong.",
    transfer:
      'The shop now raises active teas by 5%, rounded to whole cents, with a minimum increase of 10 cents. Decide how to express the rounding and the minimum in one SET. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-delete-scope': {
    reasoning:
      "A session goes when either reason applies, so the condition is expires_at < '2026-06-01 00:00' OR revoked = 1. Strict < keeps a session expiring exactly at the cutoff. The text times compare correctly because they are written year first with a fixed width.",
    trace:
      "With the logins data, ana's session expired on 20 May, bo's is revoked, cy's is both, and fu's expired at 23:59 on 31 May, so all four are deleted. di's expires exactly at the cutoff and is not revoked, so it stays, as does ed's July session.",
    alternative:
      'Two DELETE statements, one per reason, give the same result and can be easier to log separately. Marking rows as deleted instead of removing them keeps an audit trail, at the cost of filtering them out everywhere else.',
    counterexample:
      "The starter keeps ana's and fu's expired sessions. expires_at <= '2026-06-01 00:00' deletes di's. AND instead of OR deletes only cy's.",
    transfer:
      'Sessions now also expire after 30 days without activity, given a last_seen_at column. Decide how to compute 30 days before the cutoff in SQLite text dates. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-upsert-stock': {
    reasoning:
      'INSERT … SELECT feeds every incoming row into stock in turn. The first row for a new sku is inserted; any later row whose sku already exists conflicts on the primary key, and DO UPDATE adds its units with units + excluded.units. Because each listing is processed separately, a sku listed twice gains both amounts, whether or not it was in stock before.',
    trace:
      'With the repeated-sku data, incoming row 1 (C-3, 1) inserts C-3 with 1. Row 2 (A-1, 1) conflicts and makes A-1 6. Row 3 (C-3, 2) now conflicts too and makes C-3 3. Row 4 makes A-1 7. incoming is only read, so it is unchanged.',
    alternative:
      'An UPDATE that adds each sku’s summed incoming units, followed by an INSERT of the skus not yet in stock, also works and runs on databases without upsert. Summing incoming by sku first and then upserting the sums processes each sku once.',
    counterexample:
      'INSERT OR REPLACE replaces the stock row with the incoming units, so A-1 becomes 3 instead of 8. Inserting the new skus straight from the raw incoming rows fails on the second C-3 listing with a primary key conflict. Leaving out WHERE true is a parse error in SQLite.',
    transfer:
      'Deliveries can now also contain corrections with negative units that must never take stock below zero, and a failing correction must undo the whole delivery. Decide where the CHECK constraint fires during an upsert, as the restock rep showed. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-archive-orders': {
    reasoning:
      "Moving is copy then delete, and both statements use the same condition, placed_on < '2026-01-01', so exactly the copied rows are removed. The ids move with the rows, so nothing else that refers to an order id has to change. A transaction around the pair makes the move all or nothing: if the delete failed, ROLLBACK would also undo the copy.",
    trace:
      "With the year-end data, the INSERT copies orders 1 (2025-11-30) and 2 (2025-12-31) next to archived order 90. The DELETE then removes 1 and 2 from orders. Order 3, placed on 2026-01-01, fails < '2026-01-01' in both statements and stays.",
    alternative:
      'SQLite’s DELETE … RETURNING could feed an insert in application code, moving rows in one pass. Marking orders as archived with a flag avoids moving them at all, at the cost of every query filtering on the flag.',
    counterexample:
      "Using <= '2026-01-01' in one statement and < in the other duplicates or loses order 3. Deleting first and then copying from orders copies nothing. Without a transaction, a failure between the two statements leaves the copy without the delete.",
    transfer:
      'Archived orders must now also take their order lines from an order_lines table. Decide the order of the statements so that no line is ever left pointing at a missing order. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-rank-scores': {
    reasoning:
      'ROW_NUMBER() OVER (PARTITION BY level ORDER BY points DESC, player) numbers each level separately, from 1 for the most points. The player name breaks equal points, so every row gets a different, defined place. The window keeps every row, which GROUP BY would not.',
    trace:
      'For level 1 the window sees Ana 300, Bo 500, and Cy 300. Ordered by points descending, then player, they are Bo, Ana, Cy, numbered 1, 2, 3. Level 2 starts again: Di 1, Ed 2.',
    alternative:
      'A correlated count, 1 + (SELECT COUNT(*) FROM scores AS s WHERE s.level = scores.level AND (s.points > scores.points OR (s.points = scores.points AND s.player < scores.player))), gives the same places without windows but is harder to read and slower on large tables.',
    counterexample:
      'Leaving out PARTITION BY numbers all scores together, so Di gets 1 and Bo 2. Leaving out the player tie-breaker lets Ana and Cy swap. RANK gives Ana and Cy both 2.',
    transfer:
      'The leaderboard now shows only each player’s best score per level before placing them. Decide what to collapse first and what to number afterwards. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-competition-rank': {
    reasoning:
      'RANK() OVER (ORDER BY seconds) gives each runner 1 plus the number of runners with a strictly lower time, which is exactly the contract: equal times share a rank, and the next rank skips past the shared ones.',
    trace:
      'Ordered by seconds, Bo and Ed (59) share rank 1. Ana and Cy (61) come next; two runners are ahead, so they share rank 3. Di (70) has four runners ahead and gets 5.',
    alternative:
      'DENSE_RANK would give 1, 1, 2, 2, 3, which some leaderboards prefer. The correlated count from the contract, 1 + (SELECT COUNT(*) FROM results AS r WHERE r.seconds < results.seconds), computes the same ranks without a window.',
    counterexample: 'ROW_NUMBER gives Bo and Ed 1 and 2. DENSE_RANK gives Ana 2 instead of 3.',
    transfer:
      'A runner who did not finish now has seconds NULL and must be listed last without a rank. Decide where NULL sorts in the window and how to show no rank. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-day-over-day': {
    reasoning:
      'LAG(visitors) OVER (ORDER BY day) reads the visitors of the previous row in date order, which is the previous recorded day whether or not a calendar day is missing. The first row has no previous row, so LAG returns NULL and the subtraction stays NULL.',
    trace:
      'For 2026-03-05 the previous row in date order is 2026-03-03 (90), because 2026-03-04 was not recorded; 90 − 90 = 0. For 2026-03-01 there is no earlier row, so change is NULL.',
    alternative:
      'A self-join to the row with the greatest earlier day, or a correlated subquery for it, works without windows but needs care to find exactly one previous row. Comparing with the previous calendar day instead would give NULL for 2026-03-05, which is a different contract.',
    counterexample:
      'Joining each day to day − 1 calendar day misses 2026-03-05. LEAD instead of LAG compares with the next day. Ordering the window by insertion order gives wrong changes for the out-of-order data.',
    transfer:
      'The report now shows the change as a percentage of the previous day, rounded to one decimal, and NULL when the previous day had 0 visitors. Decide how to avoid dividing by zero. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-running-balance': {
    reasoning:
      'SUM(cents) OVER (PARTITION BY account ORDER BY posted_on, id) adds, for each entry, the account’s entries up to and including it. Including id in the window order makes it complete, so no two rows are peers and each gets its own balance. PARTITION BY account starts each account from 0.',
    trace:
      'For account A, ordered by posted_on then id: 50 gives 50, 1000 gives 1050, then the two 2026-01-05 entries in id order: -300 gives 750 and 200 gives 950. Ordered by posted_on alone, both 2026-01-05 entries would be peers and both would show 950.',
    alternative:
      'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW with ORDER BY posted_on also avoids peers but leaves same-day order to chance, so the in-between balance could differ between runs. A correlated SUM over earlier entries works without windows but repeats work for every row.',
    counterexample:
      'ORDER BY posted_on alone shows 950 for both same-day entries. Leaving out PARTITION BY carries account A’s balance into account B.',
    transfer:
      'The statement now flags the first entry that takes an account below zero. Decide how to find it from the running balance and keep only that row per account. This changed contract is self-reviewed; the original checks do not cover it.',
  },
  'sql-top-two-per-region': {
    reasoning:
      'The cut must restart in each region, so a WITH step numbers reps with ROW_NUMBER() OVER (PARTITION BY region ORDER BY revenue_cents DESC, name), and the main query keeps numbers 1 and 2. ROW_NUMBER never ties, so exactly two reps survive per region, and the name decides a tie for second.',
    trace:
      'In North the order is Bo 1200, then Ana and Cy at 900 ordered by name, then Di: numbers 1, 2, 3, 4, so Bo and Ana stay. In West, Gu and Ha tie at 800 and are numbered 1 and 2 by name; Fi gets 3 and is dropped. South has only Ed, numbered 1.',
    alternative:
      'A correlated count of reps that beat each rep in its region, kept when fewer than two beat it, works without windows but must spell out the tie rule by hand. RANK would keep every rep tied for second place, which is a different, also reasonable, policy.',
    counterexample:
      'LIMIT 2 keeps two reps for the whole company. RANK keeps Ana and Cy in North, three rows. Filtering ROW_NUMBER in the same SELECT’s WHERE is an error.',
    transfer:
      'The review now invites every rep tied for a top-two revenue, so ties for second all come. Decide which numbering function expresses that and how many rows a region can then return. This changed contract is self-reviewed; the original checks do not cover it.',
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
  'sql-above-average': {
    plan: ['Work out the average for the month data.', 'Write the condition each invoice must meet.'],
    explanation: [
      'Explain why the 500-cent invoices are left out of the at-average data.',
      'Explain what happens with one invoice and with none.',
    ],
    example:
      'I keep cents > (SELECT AVG(cents) FROM invoices) and order by cents DESC, id. The subquery gives one number, and strict > leaves out invoices equal to it.',
  },
  'sql-category-average': {
    plan: ['Write the average the Hose is compared with.', 'Say which rows that average covers.'],
    explanation: ['Explain how the subquery knows which category to average.', 'Explain why the Globe is left out.'],
    example:
      'I alias the outer table c and keep price_cents > (SELECT AVG(price_cents) FROM catalog_items AS i WHERE i.category = c.category). Each product is compared with its own category.',
  },
  'sql-students-without-work': {
    plan: ['Explain the starter’s empty result.', 'Choose a form that a NULL cannot break.'],
    explanation: ['Explain what the guest submission does to NOT IN.', 'Explain why NOT EXISTS is safe.'],
    example:
      'I keep students WHERE NOT EXISTS (SELECT 1 FROM submissions AS s WHERE s.student_id = students.id). A NULL student_id never equals an id, so a guest submission hides nobody.',
  },
  'sql-free-rooms': {
    plan: ['Trace Fir through your plan.', 'Write the condition for a booking that covers the night.'],
    explanation: ['Explain why Birch is free.', 'Explain why each free room appears once.'],
    example:
      "I keep rooms WHERE NOT EXISTS a booking with b.room_id = r.id, b.starts_on <= '2026-08-15', and b.ends_on > '2026-08-15', ordered by name, id.",
  },
  'sql-strong-months': {
    plan: ['Write the monthly totals for the year data and their average.', 'Name the two steps.'],
    explanation: ['Explain why the average is of months, not of sales.', 'Explain why 2025 is filtered inside the first step.'],
    example:
      "WITH monthly AS (SELECT substr(sold_on, 1, 7) AS month, SUM(cents) AS total_cents FROM sales WHERE sold_on LIKE '2026-%' GROUP BY month) SELECT month, total_cents FROM monthly WHERE total_cents > (SELECT AVG(total_cents) FROM monthly) ORDER BY month.",
  },
  'sql-create-products': {
    plan: ['For each column, write its rule and one insert the rule must reject.'],
    explanation: ['Explain which constraint rejects each bad row.', 'Explain why a price of 0 is still accepted.'],
    example:
      'I declare sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, and price_cents INTEGER NOT NULL CHECK (price_cents >= 0). Each probe that should fail meets exactly one of those rules.',
  },
  'sql-default-values': {
    plan: ['Write the default, the allowed values, and what an explicit NULL should do for status and priority.'],
    explanation: ['Explain why a title-only task reads back as open with priority 3.', 'Explain why an explicit NULL is rejected.'],
    example:
      "I declare status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')) and priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5). Defaults fill omitted columns; NOT NULL refuses an explicit NULL.",
  },
  'sql-strict-types': {
    plan: ['Predict what the starter stores for each insert, including the type of celsius.'],
    explanation: ["Explain why the starter keeps 'warm'.", "Explain why '19.5' is still accepted."],
    example:
      "I add STRICT after the closing bracket. SQLite then converts 20 and '19.5' to real numbers and refuses 'warm', which an ordinary REAL column would store as text.",
  },
  'sql-create-memberships': {
    plan: ['List every rule and the table it belongs to.', 'Decide how to state the rule about the same club twice.'],
    explanation: ['Explain which rule rejects each refused membership.', 'Explain why foreign keys needed the PRAGMA.'],
    example:
      'I create members and clubs with NOT NULL UNIQUE email and name, and memberships with member_id REFERENCES members(id), club_id REFERENCES clubs(id), joined_on NOT NULL, and PRIMARY KEY (member_id, club_id).',
  },
  'sql-create-shifts': {
    plan: ['List each rule and whether it involves one column or several.'],
    explanation: ['Explain why Eli’s 12:00 shift is accepted and Dee’s second one is not.', 'Explain why a zero-length shift is rejected.'],
    example:
      "I declare every column NOT NULL, CHECK (role IN ('cook', 'server', 'host')), and the table constraints CHECK (ends_at > starts_at) and UNIQUE (worker, starts_at).",
  },
  'sql-update-scope': {
    plan: ['Write the SELECT that lists exactly the rows to change.', 'Turn it into the change.'],
    explanation: ['Explain why Old Oolong and Chai keep their prices.', 'Explain what the starter did to every row.'],
    example:
      "I run UPDATE products SET price_cents = price_cents + 50 WHERE category = 'tea' AND active = 1. The WHERE is the scope: only active rows filed exactly as tea change.",
  },
  'sql-delete-scope': {
    plan: ['Write the SELECT that lists the sessions to delete.', 'Check it against session 4.'],
    explanation: ["Explain why di's session stays.", 'Explain why the two reasons are joined with OR.'],
    example:
      "I run DELETE FROM sessions WHERE expires_at < '2026-06-01 00:00' OR revoked = 1. Strict < keeps a session expiring at the cutoff.",
  },
  'sql-upsert-stock': {
    plan: ['Predict the stock rows after the repeated-sku delivery.', 'Name the statements that produce them.'],
    explanation: ['Trace C-3 through both of its listings.', 'Explain what excluded.units refers to.'],
    example:
      'I run INSERT INTO stock (sku, units) SELECT sku, units FROM incoming WHERE true ON CONFLICT(sku) DO UPDATE SET units = units + excluded.units. Each listing is processed in turn, so repeats add up.',
  },
  'sql-archive-orders': {
    plan: ['List the steps and the condition each uses.', 'Say what a failure between them would leave behind.'],
    explanation: ['Explain why both statements must use the same condition.', 'Explain what the transaction protects.'],
    example:
      "I BEGIN, copy orders WHERE placed_on < '2026-01-01' into archived_orders, delete the same rows from orders, and COMMIT. The same condition picks the same rows, and the transaction keeps the pair together.",
  },
  'sql-rank-scores': {
    plan: ['Write the places you expect on level 1.', 'Say what restarts the numbering and what orders it.'],
    explanation: ['Explain why Ana comes before Cy.', 'Explain why the window keeps every row.'],
    example:
      'I select ROW_NUMBER() OVER (PARTITION BY level ORDER BY points DESC, player) AS place and order by level, place. Each level restarts at 1, and the name settles equal points.',
  },
  'sql-competition-rank': {
    plan: ['Write the ranks for the race data.', 'Pick the numbering function that produces them.'],
    explanation: ['Explain why Ana and Cy get 3, not 2.'],
    example: 'I select RANK() OVER (ORDER BY seconds) AS rank and order by rank, runner. RANK shares equal times and skips past them.',
  },
  'sql-day-over-day': {
    plan: ['Write the change for 2026-03-05 and the row it is compared with.'],
    explanation: ['Explain why the first day is NULL.', 'Explain why a missing day does not break the change.'],
    example:
      'I select visitors - LAG(visitors) OVER (ORDER BY day) AS change, ordered by day. LAG reads the previous recorded row, or NULL for the first.',
  },
  'sql-running-balance': {
    plan: ['Write both balances for account A on 2026-01-05.', 'Say what decides their order.'],
    explanation: ['Explain what peers are and why id removes them.', 'Explain why each account starts from 0.'],
    example:
      'I select SUM(cents) OVER (PARTITION BY account ORDER BY posted_on, id) AS balance. The id makes the window order complete, so same-day entries get their own balances.',
  },
  'sql-top-two-per-region': {
    plan: ['Write the rows you expect for North and West.', 'Say what is numbered and where the cut happens.'],
    explanation: ['Explain why the cut needs a second step.', 'Explain why Cy is dropped.'],
    example:
      'WITH ranked AS (SELECT region, name, revenue_cents, ROW_NUMBER() OVER (PARTITION BY region ORDER BY revenue_cents DESC, name) AS n FROM sales_reps) SELECT region, name, revenue_cents FROM ranked WHERE n <= 2 ORDER BY region, revenue_cents DESC, name.',
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
  'sql-subqueries': {
    title: 'One NULL can empty a NOT IN',
    code: 'SELECT name FROM students\nWHERE id NOT IN (SELECT student_id FROM submissions);\n-- submissions.student_id: 1, NULL',
    reasoning:
      'NOT IN is shorthand for id <> 1 AND id <> NULL. For student 2, the first part is true and the second is unknown, and true AND unknown is unknown. WHERE keeps only true rows, so student 2 disappears, and so does every other student. NOT EXISTS asks a different question, whether any row matches, and an unknown comparison simply matches nothing.',
    challenge:
      'Predict the result of the query above for students 1, 2, and 3. Then rewrite it twice: once with NOT EXISTS and once keeping NOT IN but making it safe. Discuss before revealing.',
    answer:
      'It returns no students. With NOT EXISTS (SELECT 1 FROM submissions AS s WHERE s.student_id = students.id) it returns 2 and 3. Adding WHERE student_id IS NOT NULL inside the NOT IN subquery also returns 2 and 3. This discussion is self-reviewed; the students rep checks the guest-submission case.',
  },
  'sql-schema-design': {
    title: 'A constraint guards every insert, not just yours',
    code: 'CREATE TABLE products (\n  sku TEXT UNIQUE,\n  price_cents INTEGER CHECK (price_cents >= 0)\n);\nINSERT INTO products VALUES (NULL, NULL);\nINSERT INTO products VALUES (NULL, NULL);',
    reasoning:
      'Both inserts succeed. UNIQUE compares known values and NULL is not equal to NULL, so two missing SKUs do not clash. The CHECK condition NULL >= 0 is unknown, and a CHECK fails only when its condition is false, so a missing price passes too. Constraints treat NULL as "not known", which is why required columns need NOT NULL in addition to their other rules.',
    challenge:
      "Predict which of these the table above accepts: ('A', -1), ('A', 5) twice, and (NULL, 5) twice. Then add the smallest change that refuses every row with a missing value. Discuss before revealing.",
    answer:
      "('A', -1) is rejected by the CHECK. The second ('A', 5) is rejected by UNIQUE. Both (NULL, 5) rows are accepted. Adding NOT NULL to sku and price_cents refuses missing values; UNIQUE and CHECK stay as they are. This discussion is self-reviewed; the products rep checks these rules with real inserts.",
  },
  'sql-changing-data': {
    title: 'A move is two changes that must agree',
    code: "INSERT INTO archived_orders SELECT id, placed_on, cents FROM orders\n  WHERE placed_on <= '2025-12-31';\nDELETE FROM orders WHERE placed_on < '2026-01-01';",
    reasoning:
      "For well-formed dates the two conditions pick the same rows, so this move works. But one stored value such as '2025-12-31 18:00', or a later edit to just one condition, makes them disagree: the copy skips the row because the longer text sorts after '2025-12-31', while the delete still removes it, and the order is lost. Writing the condition once and reusing it, inside one transaction, removes that whole class of mistake.",
    challenge:
      "With an order placed_on '2025-12-31 18:00', predict what each statement does to it. Then rewrite the move so the condition is written once. Discuss before revealing.",
    answer:
      "The INSERT skips it, because '2025-12-31 18:00' sorts after '2025-12-31'; the DELETE removes it, because it sorts before '2026-01-01'. The order disappears from both tables. Using < '2026-01-01' in both statements, or first selecting the ids to move into a temporary table and using it for both, keeps the two steps in agreement. This discussion is self-reviewed; the archive rep checks the stored rows.",
  },
  'sql-window-functions': {
    title: 'A running total adds peers together',
    code: '-- account A: 1050 before 2026-01-05\n-- 2026-01-05: id 2 (-300), id 5 (200)\nSUM(cents) OVER (PARTITION BY account ORDER BY posted_on)',
    reasoning:
      'With ORDER BY posted_on, the two 2026-01-05 entries tie on every key of the window order, so they are peers. The default frame runs from the first row to the last peer of the current row, so each of them adds both same-day entries and shows 950. No balance of 750 ever appears, although the account really held 750 between the two entries.',
    challenge:
      'Predict the balance shown for id 2 and id 5 with ORDER BY posted_on, then with ORDER BY posted_on, id, then with ORDER BY posted_on ROWS UNBOUNDED PRECEDING. Which of the three gives the same answer on every run? Discuss before revealing.',
    answer:
      'ORDER BY posted_on shows 950 and 950. ORDER BY posted_on, id shows 750 then 950, and always in that order. The ROWS frame gives each entry its own balance, but which same-day entry comes first is not promised, so a run may show 750 then 950, or 1250 then 950. Only the complete order is both correct and stable. This discussion is self-reviewed; the running-balance rep checks the same-day case.',
  },
}
