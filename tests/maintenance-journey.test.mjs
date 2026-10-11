import assert from 'node:assert/strict'
import test from 'node:test'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { maintenanceJourneyReps } from '../src/maintenance-journey-reps.ts'
import { reps } from '../src/rep.ts'
import { runRep } from '../src/runner.ts'
import { bookingRegression, finesRegression, reproExposes, shippingRegression, solve } from './fixtures/maintenance-journey-solutions.mjs'

const failed = (code, id) => runRep(code, id).filter(result => !result.passed).map(result => result.name)
const rep = id => reps.find(item => item.id === id)
const repro = (cases, tail) => solve('reproduce-quote-bug', { 'repro.ts': tail ? reproExposes(cases).replace(/export function exposes[\s\S]*$/, tail) : reproExposes(cases) })
const emptyGuard = source => source.replace(/export const regression: Case\[\] = \[[\s\S]*\]$/, 'export const regression: Case[] = []')
const onlyGuard = (source, keep) => {
  const rows = source.split('\n').filter(line => line.trim().startsWith('{ '))
  return source.replace(/export const regression: Case\[\] = \[[\s\S]*\]$/, `export const regression: Case[] = [\n${keep.map(index => rows[index]).join('\n')}\n]`)
}

test('the maintenance journey ships six reps in order with a staged journey', () => {
  assert.deepEqual(maintenanceJourneyReps.map(item => item.id), ['read-shipping-quote', 'reproduce-quote-bug', 'fix-quote-bug', 'adapt-quote-rule', 'maintain-library-fines', 'maintain-room-booking'])
  const journey = journeys.find(item => item.id === 'maintenance')
  assert.deepEqual([journey.guided, journey.independent, journey.recall], ['fix-quote-bug', 'maintain-library-fines', 'maintain-room-booking'])
  assert.deepEqual(recallVariants.maintenance, ['maintain-room-booking'])
})

test('the independent and recall reps use a different domain from the guided module', () => {
  for (const id of ['maintain-library-fines', 'maintain-room-booking']) assert.doesNotMatch(rep(id).starter + rep(id).prompt, /shipping|parcel|kilogram/i)
})

test('the notes say that the checks do not prove a regression suite is complete', () => {
  for (const id of ['reproduce-quote-bug', 'fix-quote-bug', 'maintain-library-fines', 'maintain-room-booking']) assert.match(rep(id).note, /do not establish that your regression cases are complete/)
})

test('unmodified starters fail their checks', () => {
  assert.ok(failed(rep('read-shipping-quote').starter, 'read-shipping-quote').length >= 5)
  assert.ok(failed(rep('reproduce-quote-bug').starter, 'reproduce-quote-bug').length >= 2)
  assert.ok(failed(rep('fix-quote-bug').starter, 'fix-quote-bug').length >= 6)
  assert.ok(failed(rep('adapt-quote-rule').starter, 'adapt-quote-rule').length >= 5)
  assert.ok(failed(rep('maintain-library-fines').starter, 'maintain-library-fines').length >= 4)
  assert.ok(failed(rep('maintain-room-booking').starter, 'maintain-room-booking').length >= 5)
})

test('an empty reproduction table accepts the reference and exposes nothing', () => {
  assert.deepEqual(failed(repro('export const cases: Case[] = []'), 'reproduce-quote-bug'), ['Reproduces the reported bug', 'Also exposes the version that rounds to the nearest kilogram'])
})

test('a reproduction on fractional weights alone does not reproduce the report', () => {
  const fractional = `export const cases: Case[] = [{ parcel: { country: 'ID', weightKg: 2.5, express: false }, subtotal: 40, expected: 7 }]`
  assert.deepEqual(failed(repro(fractional), 'reproduce-quote-bug'), ['Reproduces the reported bug', 'Also exposes the version that rounds to the nearest kilogram'])
  const wholeOnly = `export const cases: Case[] = [{ parcel: { country: 'SG', weightKg: 2, express: false }, subtotal: 40, expected: 14 }]`
  assert.deepEqual(failed(repro(wholeOnly), 'reproduce-quote-bug'), ['Also exposes the version that rounds to the nearest kilogram'])
})

test('a shortcut that always reports a failure is rejected by the reference check', () => {
  const always = repro(undefined, 'export function exposes(version: string): boolean { return true }')
  assert.deepEqual(failed(always, 'reproduce-quote-bug'), ['Your cases accept the pricing sheet'])
})

test('regression cases must fail on the original, pass on the fix, and exist', () => {
  const fix = 'Math.ceil(weightKg)'
  const withFix = guard => solve('fix-quote-bug', { 'quote.ts': decodeFile('fix-quote-bug', 'quote.ts').replace('Math.floor(weightKg) + 1', fix), 'guard.ts': guard })
  assert.deepEqual(failed(withFix(emptyGuard(shippingRegression)), 'fix-quote-bug'), ['Your regression cases pass on your fix', 'Your regression cases fail on the original code'])
  // A case that the original also passes protects nothing.
  assert.deepEqual(failed(withFix(onlyGuard(shippingRegression, [1])), 'fix-quote-bug'), ['Your regression cases fail on the original code'])
  // A correct case guarding the original code instead of the fix is rejected.
  assert.deepEqual(failed(solve('fix-quote-bug', { 'guard.ts': shippingRegression }), 'fix-quote-bug').filter(name => name.startsWith('Your')), ['Your regression cases pass on your fix'])
  // A wrong expected value passes on neither version.
  const wrong = shippingRegression.replace('expected: 14', 'expected: 15')
  assert.ok(failed(withFix(wrong), 'fix-quote-bug').includes('Your regression cases pass on your fix'))
})

test('the nearby-rounding fix is rejected by the neighbour checks', () => {
  const rounding = solve('fix-quote-bug', { 'quote.ts': decodeFile('fix-quote-bug', 'quote.ts').replace('Math.floor(weightKg) + 1', 'Math.round(weightKg)'), 'guard.ts': shippingRegression })
  assert.ok(failed(rounding, 'fix-quote-bug').includes('A tiny weight bills one kilogram'))
})

test('the adapted module rejects a fee before the express multiplier and a fee waived by free shipping', () => {
  const files = JSON.parse(rep('adapt-quote-rule').starter).files
  const adapted = (quote, rates = files['rates.ts'].replace('FREE_FROM = 100', 'FREE_FROM = 120\nexport const HEAVY_KG = 20\nexport const HEAVY_FEE = 15')) => solve('adapt-quote-rule', { 'rates.ts': rates, 'quote.ts': quote })
  const base = `import { BASE, FREE_FROM, HEAVY_FEE, HEAVY_KG, PER_KG, zoneFor } from './rates'
export type Parcel = { country: string; weightKg: number; express: boolean }
export function quote(parcel: Parcel, subtotal: number): number | null {
  if (!Number.isFinite(parcel.weightKg) || parcel.weightKg <= 0 || !(subtotal >= 0)) return null
  const zone = zoneFor(parcel.country)
  const billable = Math.ceil(parcel.weightKg)
  `
  const beforeExpress = base + `const standard = BASE[zone] + PER_KG[zone] * billable + (billable > HEAVY_KG ? HEAVY_FEE : 0)
  return parcel.express ? Math.ceil(standard * 1.5) : subtotal >= FREE_FROM && zone !== 'world' ? 0 : standard
}`
  assert.ok(failed(adapted(beforeExpress), 'adapt-quote-rule').includes('Heavy fee comes after the express multiplier'))
  assert.ok(failed(adapted(beforeExpress), 'adapt-quote-rule').includes('Free shipping keeps the heavy fee'))
  const oldThreshold = files['rates.ts'].replace('FREE_FROM = 100', 'FREE_FROM = 100\nexport const HEAVY_KG = 20\nexport const HEAVY_FEE = 15')
  assert.ok(failed(adapted(beforeExpress, oldThreshold), 'adapt-quote-rule').includes('Old threshold no longer ships free'))
})

test('weak regression cases for the fines and booking modules are rejected', () => {
  const fines = solve('maintain-library-fines', { 'fines.ts': decodeFile('maintain-library-fines', 'fines.ts').replace('const chargeable = daysLate(loan.due, loan.returned) - GRACE_DAYS', 'const chargeable = Math.max(0, daysLate(loan.due, loan.returned) - GRACE_DAYS)'), 'guard.ts': onlyGuard(finesRegression, [2]) })
  assert.deepEqual(failed(fines, 'maintain-library-fines'), ['Your regression cases fail on the original code'])
  const fixedBooking = decodeFile('maintain-room-booking', 'pricing.ts').replace('total += isPeak(hour) ? PEAK_RATE : OFF_PEAK_RATE', 'total += (hour - start >= 3 ? 0.5 : 1) * (isPeak(hour) ? PEAK_RATE : OFF_PEAK_RATE)')
  assert.deepEqual(failed(solve('maintain-room-booking', { 'pricing.ts': fixedBooking, 'guard.ts': onlyGuard(bookingRegression, [0]) }), 'maintain-room-booking'), ['Your new-rule cases fail on the old code'])
  assert.deepEqual(failed(solve('maintain-room-booking', { 'pricing.ts': fixedBooking, 'guard.ts': onlyGuard(bookingRegression, [1]) }), 'maintain-room-booking'), [])
})

test('a booking change that halves the whole total is rejected', () => {
  const halved = decodeFile('maintain-room-booking', 'pricing.ts').replace('  return member', '  if (end - start >= 4) total = Math.floor(total / 2)\n  return member')
  assert.ok(failed(solve('maintain-room-booking', { 'pricing.ts': halved, 'guard.ts': onlyGuard(bookingRegression, [1]) }), 'maintain-room-booking').includes('The fourth hour is half price'))
})

function decodeFile(id, file) { return JSON.parse(rep(id).starter).files[file] }
