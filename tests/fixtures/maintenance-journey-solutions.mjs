// Reference solutions for the maintenance journey. Each one starts from the rep's own starter files and replaces only
// the learner work: a prediction, a case table with a comparison, a regression table, a fix, or an adaptation.
import { maintenanceJourneyReps } from '../../src/maintenance-journey-reps.ts'
import { decodeFiles, encodeFiles } from '../../src/project-files.ts'

export const solve = (id, overrides) => {
  const project = decodeFiles(maintenanceJourneyReps.find(rep => rep.id === id).starter)
  return encodeFiles({ entry: project.entry, files: { ...project.files, ...overrides } })
}
const replaceIn = (id, file, from, to) => {
  const source = decodeFiles(maintenanceJourneyReps.find(rep => rep.id === id).starter).files[file]
  if (!source.includes(from)) throw new Error(`${id}/${file}: missing ${from}`)
  return source.replace(from, to)
}

export const predictEntry = `import { shippingLine } from './summary'
type CaseName = "standard" | "whole-kg" | "express" | "free" | "world" | "invalid"
export function predictLine(caseName: CaseName): string {
  const lines: Record<CaseName, string> = { standard: 'Shipping: 7', 'whole-kg': 'Shipping: 17', express: 'Shipping: 21', free: 'Shipping: free', world: 'Shipping: 46', invalid: 'Shipping unavailable' }
  return lines[caseName]
}`

export const reproCases = `export const cases: Case[] = [
  { parcel: { country: 'SG', weightKg: 2, express: false }, subtotal: 40, expected: 14 },
  { parcel: { country: 'ID', weightKg: 1.2, express: false }, subtotal: 0, expected: 6 },
  { parcel: { country: 'ID', weightKg: 2.5, express: false }, subtotal: 40, expected: 7 },
  { parcel: { country: 'ID', weightKg: 0, express: false }, subtotal: 0, expected: null },
]`
export const reproExposes = (cases = reproCases) => {
  const starter = decodeFiles(maintenanceJourneyReps.find(rep => rep.id === 'reproduce-quote-bug').starter).files['repro.ts']
  const head = starter.slice(0, starter.indexOf('// 1.'))
  return `${head}${cases}

export function exposes(version: string): boolean {
  const run = versions[version]
  for (const c of cases) {
    const copy = { ...c.parcel }
    if (run(copy, c.subtotal) !== c.expected) return true
    if (JSON.stringify(copy) !== JSON.stringify(c.parcel)) return true
  }
  return false
}`
}

export const shippingRegression = `import type { Parcel } from './quote'
export type Case = { parcel: Parcel; subtotal: number; expected: number | null }
export const regression: Case[] = [
  { parcel: { country: 'SG', weightKg: 2, express: false }, subtotal: 40, expected: 14 },
  { parcel: { country: 'SG', weightKg: 2.5, express: false }, subtotal: 40, expected: 17 },
]`

const adaptedRates = source =>
  source.replace('export const FREE_FROM = 100', 'export const FREE_FROM = 120\nexport const HEAVY_KG = 20\nexport const HEAVY_FEE = 15')
export const adaptedQuote = `import { BASE, FREE_FROM, HEAVY_FEE, HEAVY_KG, PER_KG, zoneFor } from './rates'
export type Parcel = { country: string; weightKg: number; express: boolean }
export function quote(parcel: Parcel, subtotal: number): number | null {
  if (!Number.isFinite(parcel.weightKg) || parcel.weightKg <= 0 || !(subtotal >= 0)) return null
  const zone = zoneFor(parcel.country)
  const billable = Math.ceil(parcel.weightKg)
  const standard = BASE[zone] + PER_KG[zone] * billable
  const price = parcel.express ? Math.ceil(standard * 1.5) : subtotal >= FREE_FROM && zone !== 'world' ? 0 : standard
  return price + (billable > HEAVY_KG ? HEAVY_FEE : 0)
}`

export const finesRegression = `import type { Loan } from './fines'
export type Case = { loan: Loan; expected: number }
export const regression: Case[] = [
  { loan: { kind: 'book', due: 10, returned: 10, waived: false }, expected: 0 },
  { loan: { kind: 'dvd', due: 10, returned: 11, waived: false }, expected: 0 },
  { loan: { kind: 'book', due: 10, returned: 13, waived: false }, expected: 25 },
]`

export const bookingRegression = `import type { Booking } from './pricing'
export type Case = { booking: Booking; expected: number | null }
export const regression: Case[] = [
  { booking: { start: 9, end: 12, member: false }, expected: 120 },
  { booking: { start: 9, end: 13, member: false }, expected: 140 },
  { booking: { start: 8, end: 18, member: true }, expected: 207 },
]`

export const maintenanceSolutions = {
  'read-shipping-quote': solve('read-shipping-quote', { 'predict.ts': predictEntry }),
  'reproduce-quote-bug': solve('reproduce-quote-bug', { 'repro.ts': reproExposes() }),
  'fix-quote-bug': solve('fix-quote-bug', {
    'quote.ts': replaceIn('fix-quote-bug', 'quote.ts', 'Math.floor(weightKg) + 1', 'Math.ceil(weightKg)'),
    'guard.ts': shippingRegression,
  }),
  'adapt-quote-rule': solve('adapt-quote-rule', {
    'rates.ts': adaptedRates(decodeFiles(maintenanceJourneyReps.find(rep => rep.id === 'adapt-quote-rule').starter).files['rates.ts']),
    'quote.ts': adaptedQuote,
  }),
  'maintain-library-fines': solve('maintain-library-fines', {
    'fines.ts': replaceIn(
      'maintain-library-fines',
      'fines.ts',
      'const chargeable = daysLate(loan.due, loan.returned) - GRACE_DAYS',
      'const chargeable = Math.max(0, daysLate(loan.due, loan.returned) - GRACE_DAYS)',
    ),
    'guard.ts': finesRegression,
  }),
  'maintain-room-booking': solve('maintain-room-booking', {
    'pricing.ts': replaceIn(
      'maintain-room-booking',
      'pricing.ts',
      'for (let hour = start; hour < end; hour++) total += isPeak(hour) ? PEAK_RATE : OFF_PEAK_RATE',
      'for (let hour = start; hour < end; hour++) {\n    const rate = isPeak(hour) ? PEAK_RATE : OFF_PEAK_RATE\n    total += hour - start >= 3 ? rate / 2 : rate\n  }',
    ),
    'guard.ts': bookingRegression,
  }),
}
