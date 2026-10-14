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
}
