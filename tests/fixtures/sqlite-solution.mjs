export const sqliteSolution = `function transferStock(db, amount) {
  db.run('BEGIN')
  try {
    db.run('UPDATE warehouses SET units = units - ? WHERE id = 1', [amount])
    db.run('UPDATE warehouses SET units = units + ? WHERE id = 2', [amount])
    db.run('INSERT INTO transfers (id, amount) VALUES (1, ?)', [amount])
    db.run('COMMIT')
    return true
  } catch {
    db.run('ROLLBACK')
    return false
  }
}`
