import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const sqliteDepth: Record<string, RepDepth> = {
  'sqlite-spend-report': {
    reasoning:
      "Starting from customers and LEFT JOINing orders keeps every customer, and putting status = 'paid' in the join condition means cancelled orders never attach, so a customer with only cancelled orders keeps one row with null order columns. GROUP BY customer makes one row each; COUNT(o.id) counts only real paid orders, and COALESCE(SUM(o.cents), 0) turns the missing sum into 0. HAVING filters the grouped totals, and ORDER BY total DESC, name gives the required order.",
    trace:
      "In the shop data, Ana's paid orders 500 and 250 give 2 and 750; her cancelled 100 never joins. Di has no orders, so the join gives one null row: COUNT(o.id) is 0 and SUM is null, which COALESCE makes 0. With a minimum of 750, Ana, Cy, and O'Neil tie at 750 and sort by name; with 751 only Bo remains. In the quiet data, Bo's paid order of 0 cents counts as one order with total 0.",
    alternative:
      'Two queries, one for customers and one for paid totals, joined in TypeScript with a Map, give the same rows but move grouping and sorting out of the database. A correlated subquery per customer is readable but runs one subquery for each customer. For this size all are fast; one grouped query keeps the rule in one place.',
    counterexample:
      "Writing WHERE o.status = 'paid' after a LEFT JOIN removes Di and Ana in the quiet data, because their null or cancelled rows fail the condition. COUNT(*) reports 1 for a customer with no orders, and SUM without COALESCE returns null instead of 0. Building the SQL with the minimum pasted into the text passes these checks but skips parameter binding, which the brief asks you to review.",
    transfer:
      'Add a date range for paid orders and report each customer’s largest single paid order too. Decide which conditions belong in the join and which in HAVING, and what a customer with no orders in the range shows. This changed contract is self-reviewed.',
  },
  'sqlite-stock-transfer': {
    reasoning:
      'A transfer preserves total stock only if the debit, credit, and audit insert share a transaction. The nonnegative constraint rejects an excessive debit; the primary key rejects a duplicate audit ID. SQLite aborts the failing statement, so the catch must explicitly roll back earlier successful statements. Commit only after all three writes succeed.',
    trace:
      'With amount 4 and existing transfer (1,2), BEGIN starts from stock 10 and 3. The debit gives 6, the credit gives 7, then INSERT id 1 fails. ROLLBACK restores 10 and 3 and keeps the original audit row (1,2). Without rollback, the earlier updates remain pending and the runner rejects the open transaction.',
    alternative:
      'Reading stock before updating can give a friendlier error, but does not replace the transaction or database constraint. For this tiny database direct updates and constraint handling are simpler. On a concurrent database, locking and conditional updates need separate design; these in-memory checks do not establish concurrency safety.',
    counterexample:
      'Catching the duplicate insert and returning false without rollback leaves both earlier writes in the transaction. Committing the updates before the insert leaves stock 6 and 7 despite the rejected transfer. The final-insert failure check exposes both mistakes.',
    transfer:
      'Allow several transfers with caller-supplied audit IDs and retry a repeated request without applying stock twice. Decide whether an existing ID with a different amount is an error. This changed contract is self-reviewed and not covered by the original checks.',
  },
  'sqlite-customer-totals': {
    reasoning:
      'A LEFT JOIN keeps every customer even when no order matches, producing one row with null order columns. COUNT(o.id) counts only real orders, so it is 0 for that row, and COALESCE turns the null SUM into 0. GROUP BY folds each customer’s orders into one row, HAVING filters on the aggregated total, and ORDER BY sorts by total and then name.',
    trace:
      'Cy has no orders, so the join produces one row with o.id and o.cents null. COUNT(o.id) gives 0 and SUM gives null, which COALESCE turns into 0. With minimumCents 0, HAVING keeps Cy, and the sort puts Cy last because 0 is the smallest total.',
    alternative:
      'A correlated subquery per customer, such as (SELECT SUM(cents) FROM orders WHERE customer_id = c.id), avoids the join and reads clearly but runs once per customer. Fetching all rows and aggregating in JavaScript works for tiny tables but moves work the database does well into the application.',
    counterexample:
      'An inner JOIN drops Cy entirely. COUNT(*) reports 1 order for a customer with none, because the joined row still exists. Filtering the total in WHERE instead of HAVING is rejected, because aggregates are not available before grouping. Concatenating minimumCents into the SQL text works here but is the habit that leads to injection.',
    transfer:
      'Only count orders placed in the last 30 days, given an orders.placed_at column. Decide whether that condition belongs in WHERE or in the JOIN’s ON clause, and why the choice changes which customers appear. This changed contract is self-reviewed and not covered by the original checks.',
  },
  'sqlite-restock-upsert': {
    reasoning:
      'Updating by sku first and inserting only when no row changed handles both cases, and a sku that appears twice simply updates twice. The CHECK constraint rejects any result below zero, including a new product that would start negative, and wrapping the batch in one transaction with ROLLBACK in the catch means a late failure undoes the earlier, successful writes.',
    trace:
      'For A-1 +2 and B-2 -1: BEGIN, then A-1 becomes 7. B-2 would become -1, the CHECK fails, and the statement throws. The catch rolls back, so A-1 is 5 again, and restock returns false.',
    alternative:
      'INSERT … ON CONFLICT(sku) DO UPDATE SET units = units + excluded.units is the usual one-statement upsert and works for deliveries, but SQLite tests the CHECK constraint on the row it tries to insert before resolving the conflict, so a correction of -5 to A-1 fails even though the result would be 0. Querying for the row first, then choosing UPDATE or INSERT, also works and reads clearly. INSERT OR REPLACE deletes and reinserts the row, which loses the old units.',
    counterexample:
      'Committing after each delivery leaves A-1 at 7 when B-2 fails. Building SQL text with the sku in quotes breaks on O’NEIL-1. INSERT OR REPLACE sets C-3 to 2 instead of 3 when it appears twice in one batch. The plain upsert rejects the valid correction A-1 -5.',
    transfer:
      'Record each accepted delivery in a deliveries table with an id, and make resubmitting the same batch id do nothing. Decide where the duplicate check happens relative to the transaction. This changed contract is self-reviewed and not covered by the original checks.',
  },
}
export const sqliteGuides: Record<string, ReflectionGuide> = {
  'sqlite-spend-report': {
    plan: [
      'Name the customers an inner join or a WHERE condition on orders would drop.',
      'Decide what COUNT and SUM return for a customer with no paid orders.',
      'State the filter and both sort keys before writing SQL.',
    ],
    explanation: [
      'Explain where the paid-only condition goes and why.',
      'Trace Di, who has no orders, and Bo in the quiet data, whose only paid order is 0 cents.',
      'Review that minimumCents is bound and that the query changes no rows.',
    ],
    example:
      "I start from customers and LEFT JOIN orders on the customer id and status = 'paid', so customers without paid orders keep one row with null order columns. COUNT(o.id) ignores those nulls and COALESCE(SUM(o.cents), 0) turns a missing sum into 0. HAVING filters on the bound minimum, and ORDER BY total DESC, name sorts ties by name.",
  },
  'sqlite-stock-transfer': {
    plan: [
      'List the three writes and which constraints can fail.',
      'Predict stock and audit rows after the last write fails.',
      'Decide where commit and rollback belong.',
    ],
    explanation: [
      'Trace the duplicate audit ID failure through both updates and rollback.',
      'Inspect that values are bound, all writes share a transaction, and schema stays unchanged.',
      'Explain that these checks exercise SQLite locally, not disk durability, concurrency, or understanding.',
    ],
    example:
      'I begin before debiting and bind the amount in each statement. I credit the destination and insert the audit row before committing. If any write fails I roll back and return false. The duplicate audit check matters because its failure happens after both stock updates have succeeded.',
  },
  'sqlite-customer-totals': {
    plan: [
      'Write the result you expect for a customer with no orders, then name the clauses that produce it.',
      'Decide which filter runs before grouping and which runs after.',
    ],
    explanation: [
      'Explain how your query keeps customers with no orders and reports 0 for both columns.',
      'Explain why the minimum belongs in HAVING and how ties are ordered.',
      'Inspect parameter binding and that no table is changed; checks compare rows only.',
    ],
    example:
      'I LEFT JOIN orders to customers, group by customer, select the name, COUNT(o.id), and COALESCE(SUM(o.cents), 0) as total, keep groups with total >= ? bound to minimumCents, and order by total descending and name ascending.',
  },
  'sqlite-restock-upsert': {
    plan: [
      'Predict the stored rows after a batch that adds to A-1 and then corrects B-2 below zero.',
      'Name the statement that fails and what undoes the first change.',
    ],
    explanation: [
      'Explain how your code decides between updating and inserting, and why a negative correction must not go through the insert.',
      'Trace a failing correction through rollback.',
      'Inspect parameter binding yourself; the quote check exposes string building but not every unsafe pattern.',
    ],
    example:
      'I BEGIN, then for each delivery run UPDATE inventory SET units = units + ? WHERE sku = ? and read SELECT changes(); when nothing changed I INSERT the new row. All values are bound. After the loop I COMMIT and return true; any failure rolls back the whole batch and returns false. I tried the ON CONFLICT upsert first, but its CHECK runs on the inserted row, so negative corrections failed.',
  },
}
