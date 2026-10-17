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
}
