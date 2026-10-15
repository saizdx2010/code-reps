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

export const sqliteCustomerTotalsSolution = `function customerTotals(db, minimumCents) {
  return db.query(
    'SELECT c.name, COUNT(o.id), COALESCE(SUM(o.cents), 0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id HAVING total >= ? ORDER BY total DESC, c.name ASC',
    [minimumCents],
  )
}`

export const sqliteRestockSolution = `function restock(db, deliveries) {
  db.run('BEGIN')
  try {
    for (const delivery of deliveries) {
      const existing = db.query('SELECT units FROM inventory WHERE sku = ?', [delivery.sku])
      if (existing.length) db.run('UPDATE inventory SET units = units + ? WHERE sku = ?', [delivery.units, delivery.sku])
      else db.run('INSERT INTO inventory (sku, units) VALUES (?, ?)', [delivery.sku, delivery.units])
    }
    db.run('COMMIT')
    return true
  } catch {
    db.run('ROLLBACK')
    return false
  }
}`
