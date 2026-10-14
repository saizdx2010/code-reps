import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const sqliteDepth: Record<string, RepDepth> = {
  'sqlite-stock-transfer': {
    reasoning: 'A transfer preserves total stock only if the debit, credit, and audit insert share a transaction. The nonnegative constraint rejects an excessive debit; the primary key rejects a duplicate audit ID. SQLite aborts the failing statement, so the catch must explicitly roll back earlier successful statements. Commit only after all three writes succeed.',
    trace: 'With amount 4 and existing transfer (1,2), BEGIN starts from stock 10 and 3. The debit gives 6, the credit gives 7, then INSERT id 1 fails. ROLLBACK restores 10 and 3 and keeps the original audit row (1,2). Without rollback, the earlier updates remain pending and the runner rejects the open transaction.',
    alternative: 'Reading stock before updating can give a friendlier error, but does not replace the transaction or database constraint. For this tiny database direct updates and constraint handling are simpler. On a concurrent database, locking and conditional updates need separate design; these in-memory checks do not establish concurrency safety.',
    counterexample: 'Catching the duplicate insert and returning false without rollback leaves both earlier writes in the transaction. Committing the updates before the insert leaves stock 6 and 7 despite the rejected transfer. The final-insert failure check exposes both mistakes.',
    transfer: 'Allow several transfers with caller-supplied audit IDs and retry a repeated request without applying stock twice. Decide whether an existing ID with a different amount is an error. This changed contract is self-reviewed and not covered by the original checks.',
  },
}
export const sqliteGuides: Record<string, ReflectionGuide> = {
  'sqlite-stock-transfer': {
    plan: ['List the three writes and which constraints can fail.', 'Predict stock and audit rows after the last write fails.', 'Decide where commit and rollback belong.'],
    explanation: ['Trace the duplicate audit ID failure through both updates and rollback.', 'Inspect that values are bound, all writes share a transaction, and schema stays unchanged.', 'Explain that these checks exercise SQLite locally, not disk durability, concurrency, or understanding.'],
    example: 'I begin before debiting and bind the amount in each statement. I credit the destination and insert the audit row before committing. If any write fails I roll back and return false. The duplicate audit check matters because its failure happens after both stock updates have succeeded.',
  },
}
