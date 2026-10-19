import type { AsyncFixtureSpec } from './async-fixture.ts'

export type SqlValue = number | string | null
/** A named starting data set for SQLite checks: what it holds, in words, and the statements that insert it. */
export type SqlSeed = { about: string; sql: string }
/**
 * A rep checked against real SQLite. Every check builds a fresh in-memory database from `schema` and its seed.
 * Learner SQL (`format: 'sql'`): with `compare` 'ordered' or 'unordered' the learner submits one read-only statement
 * whose rows are compared with `columns`; with 'state' the statements may change data, and the `read` queries
 * capture the stored rows afterwards. Learner TypeScript receives a narrow run/query interface instead; its return
 * value is reported under `returns`, and `unchanged` reports whether every table kept its rows and schema.
 */
export type SqlTask = {
  schema: string
  seeds: Record<string, SqlSeed>
  compare: 'ordered' | 'unordered' | 'state'
  columns?: string[]
  read?: { label: string; sql: string }[]
  returns?: string
  unchanged?: boolean
  /** Turn on SQLite's foreign key enforcement (off by default) before the schema runs. */
  foreignKeys?: boolean
}
/**
 * One SQLite check: its seed, and probe statements run after the learner's SQL that SQLite should accept or reject.
 * `labels` names each probe in feedback ("price -5"); without one, the statement itself is shown. `plan` runs an
 * authored query after the learner's SQL: its rows are compared as `result`, and SQLite's EXPLAIN QUERY PLAN lines
 * must match every `uses` pattern and no `avoids` pattern (regular expressions) for `plan: 'matches'`. Each pattern's
 * `about` finishes the feedback sentence "SQLite's plan does not …" or "SQLite's plan still …".
 */
export type PlanFact = { pattern: string; about: string }
export type SqlCheck = {
  seed: string
  probes?: string[]
  labels?: string[]
  plan?: { sql: string; uses?: PlanFact[]; avoids?: PlanFact[] }
}
export type Check = { name: string; input: unknown[]; expected: unknown; fixture?: AsyncFixtureSpec; sql?: SqlCheck }
export type Rep = {
  id: string
  title: string
  category: string
  format?: 'debug' | 'read' | 'transform' | 'frontend' | 'backend' | 'refactor' | 'sql' | 'devops'
  context?: string
  acceptanceCriteria?: string[]
  prompt: string
  /** Optional structured brief: shown in place of `prompt`; `prompt` stays the full contract text. */
  brief?: { summary: string; rules: string[]; edgeCases?: string[] }
  example: { input: string; output: string }
  note: string
  vocabulary: { term: string; meaning: string }[]
  planPrompt: string
  starter: string
  /** The learner's function. SQL reps (`format: 'sql'`) have no function and leave it empty. */
  functionName: string
  preserveInput?: boolean
  runtime?: 'async-fixture'
  /** Checks run against a fresh in-memory SQLite database; the worker loads the engine only for these reps. */
  sql?: SqlTask
  /** Frontend reps that check authored DOM and ARIA contracts. Without it the rep uses the directory scenarios. */
  reactPreview?: boolean
  domPreview?: { title: string; description: string; props: Record<string, unknown>; review: string[] }
  hints: string[]
  checks: Check[]
}
