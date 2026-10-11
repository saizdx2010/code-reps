import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { SqliteFactory } from './sqlite-task.ts'

export async function loadSqlite(): Promise<SqliteFactory> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  return () => new SQL.Database()
}
