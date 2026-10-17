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
}
