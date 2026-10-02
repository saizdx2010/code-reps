// Independent implementations of the authored contracts; no production validator is reused.
export const validationSolutions = {
  'validate-stock-adjustment': `
function stockAdjustment(input: unknown) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return null
  const row = input as Record<string, unknown>
  if (typeof row.sku !== 'string' || typeof row.change !== 'number') return null
  const sku = row.sku.trim().toUpperCase()
  if (!/^[A-Z0-9-]{1,12}$/.test(sku)) return null
  if (!Number.isInteger(row.change) || row.change === 0 || Math.abs(row.change) > 50) return null
  return {sku, change: row.change}
}`,
  'parse-delivery-window': `
function deliveryWindow(input: unknown) {
  const fail = (error: string) => ({ok: false, error})
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return fail('INVALID_REQUEST')
  const request = input as Record<string, unknown>
  if (!['pickup', 'delivery'].includes(String(request.mode)) || typeof request.mode !== 'string') return fail('INVALID_MODE')
  let address: string | null = null
  if (request.mode === 'delivery') {
    if (typeof request.address !== 'string') return fail('INVALID_ADDRESS')
    address = request.address.trim()
    if (address.length < 1 || address.length > 80) return fail('INVALID_ADDRESS')
  }
  const minutes = request.minutes === undefined ? 20 : request.minutes
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 0 || minutes > 120) return fail('INVALID_MINUTES')
  return {ok: true, mode: request.mode, address, minutes}
}`,
  'validate-import-batch': `
function importBatch(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 50) return {ok: false, index: -1, error: 'INVALID_BATCH'}
  const rows: {id: string; amount: number}[] = []
  for (let index = 0; index < input.length; index++) {
    const row = input[index]
    if (row === null || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || typeof row.amount !== 'number' || !Number.isInteger(row.amount) || row.amount < 0 || row.amount > 9999) return {ok: false, index, error: 'INVALID_ROW'}
    const id = row.id.trim().toLowerCase()
    if (!/^[a-z0-9]{1,10}$/.test(id)) return {ok: false, index, error: 'INVALID_ROW'}
    if (rows.some(accepted => accepted.id === id)) return {ok: false, index, error: 'DUPLICATE_ID'}
    rows.push({id, amount: row.amount})
  }
  return {ok: true, rows}
}`,
}
