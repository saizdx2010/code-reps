import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'

// A direct FIFO simulation independently checks the arithmetic fixture's expectations.
test('parcel loading checks agree with a cart-identity FIFO simulation', async () => {
  const code = `function loadingTurn(parcels, targetIndex) {
    const line = parcels.map((count, id) => ({ count, id }))
    let turns = 0
    while (line.length) {
      const cart = line.shift()
      turns++
      cart.count--
      if (cart.count === 0 && cart.id === targetIndex) return turns
      if (cart.count > 0) line.push(cart)
    }
  }`
  const results = runRep(code, 'parcel-loading-turns')
  assert.ok(results.every(result => result.passed), JSON.stringify(results))
})
