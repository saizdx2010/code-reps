import { mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { DatabaseSync, backup } from 'node:sqlite'

const keyAllowed = (key) => typeof key === 'string' && /^code-reps:[a-z0-9:-]+$/.test(key) && key.length < 160

export function createStore(dataDir = process.env.CODE_REPS_DATA_DIR || join(homedir(), '.code-reps')) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 })
  const dbPath = join(dataDir, 'progress.sqlite')
  const existed = existsSync(dbPath)
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS entries (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL) STRICT;')
  const read = db.prepare('SELECT key, value FROM entries')
  const put = db.prepare('INSERT INTO entries (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
  const remove = db.prepare('DELETE FROM entries WHERE key = ?')
  const count = db.prepare('SELECT COUNT(*) AS count FROM entries')

  function entries() { return Object.fromEntries(read.all().map((row) => [row.key, row.value])) }
  function set(key, value) {
    if (!keyAllowed(key) || typeof value !== 'string' || value.length > 1_000_000) throw new Error('Invalid saved entry.')
    put.run(key, value, new Date().toISOString())
  }
  function unset(key) {
    if (!keyAllowed(key)) throw new Error('Invalid saved entry.')
    remove.run(key)
  }
  function migrate(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Invalid migration data.')
    const pairs = Object.entries(candidate)
    if (pairs.length > 500 || pairs.some(([key, value]) => !keyAllowed(key) || typeof value !== 'string' || value.length > 1_000_000)) {
      throw new Error('Invalid migration data.')
    }
    db.exec('BEGIN IMMEDIATE')
    try {
      if (count.get().count !== 0) { db.exec('ROLLBACK'); return { migrated: false, entries: entries() } }
      for (const [key, value] of pairs) put.run(key, value, new Date().toISOString())
      db.exec('COMMIT')
      return { migrated: true, entries: entries() }
    } catch (error) { db.exec('ROLLBACK'); throw error }
  }
  async function makeBackup() {
    const backupDir = join(dataDir, 'backups')
    await mkdir(backupDir, { recursive: true, mode: 0o700 })
    const date = new Date().toISOString().slice(0, 10)
    const target = join(backupDir, `${date}.sqlite`)
    if (!existsSync(target)) await backup(db, target)
    const files = (await readdir(backupDir)).filter((file) => /^\d{4}-\d{2}-\d{2}\.sqlite$/.test(file)).sort().reverse()
    await Promise.all(files.slice(7).map((file) => rm(join(backupDir, file))))
    return target
  }
  return { entries, set, unset, migrate, makeBackup, close: () => db.close(), existed, dbPath }
}
