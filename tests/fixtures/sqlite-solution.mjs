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

// An independent reference that groups in TypeScript instead of SQL, so the checks do not encode one query.
export const spendReportSolution = `function spendReport(db, minimumCents) {
  const totals = new Map(db.query('SELECT id, name FROM customers').map(([id, name]) => [id, [name, 0, 0]]))
  for (const [customer, cents] of db.query("SELECT customer_id, cents FROM orders WHERE status = ?", ['paid'])) {
    const row = totals.get(customer)
    row[1] += 1
    row[2] += cents
  }
  return [...totals.values()]
    .filter(row => row[2] >= minimumCents)
    .sort((a, b) => b[2] - a[2] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
}`
