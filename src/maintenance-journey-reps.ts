import { encodeFiles } from './project-files.ts'
import { lines } from './rep-helpers.ts'
import type { Rep } from './rep-types.ts'

// Maintenance journey: read an unfamiliar module, reproduce a reported bug, write a regression case and fix it, then
// adapt the module to a changed requirement. It reuses the multi-file loader and the function worker. A learner's case
// is checked by running it against a frozen copy of the faulty code and against their fix. The checks establish that a
// case separates those two versions. They do not establish that a regression suite is complete.

// ---- Shipping module (guided domain) ----

const ratesSource = lines(
  "export type Zone = 'home' | 'region' | 'world'",
  '',
  '// Prices are whole currency units.',
  'export const BASE: Record<Zone, number> = { home: 4, region: 8, world: 18 }',
  'export const PER_KG: Record<Zone, number> = { home: 1, region: 3, world: 7 }',
  'export const FREE_FROM = 100',
  '',
  "const REGION = ['SG', 'MY', 'TH']",
  '',
  'export function zoneFor(country: string): Zone {',
  '  const code = country.trim().toUpperCase()',
  "  if (code === 'ID') return 'home'",
  "  return REGION.includes(code) ? 'region' : 'world'",
  '}'
)

const quoteBody = (billable: string) => lines(
  "import { BASE, FREE_FROM, PER_KG, zoneFor } from './rates'",
  '',
  'export type Parcel = { country: string; weightKg: number; express: boolean }',
  '',
  'function billableKg(weightKg: number): number {',
  `  return ${billable}`,
  '}',
  '',
  'export function quote(parcel: Parcel, subtotal: number): number | null {',
  '  if (!Number.isFinite(parcel.weightKg) || parcel.weightKg <= 0 || !(subtotal >= 0)) return null',
  '  const zone = zoneFor(parcel.country)',
  '  const standard = BASE[zone] + PER_KG[zone] * billableKg(parcel.weightKg)',
  '  if (parcel.express) return Math.ceil(standard * 1.5)',
  "  if (subtotal >= FREE_FROM && zone !== 'world') return 0",
  '  return standard',
  '}'
)
const faultyQuoteSource = quoteBody('Math.floor(weightKg) + 1')
const fixedQuoteSource = quoteBody('Math.ceil(weightKg)')

const summarySource = lines(
  "import { quote } from './quote'",
  "import type { Parcel } from './quote'",
  '',
  'export function shippingLine(parcel: Parcel, subtotal: number): string {',
  '  const cost = quote(parcel, subtotal)',
  "  if (cost === null) return 'Shipping unavailable'",
  "  return cost === 0 ? 'Shipping: free' : `Shipping: ${cost}`",
  '}'
)

const predictEntry = lines(
  "import { shippingLine } from './summary'",
  '',
  'type CaseName = "standard" | "whole-kg" | "express" | "free" | "world" | "invalid"',
  '',
  '// Predict the line the code above returns today for each named case in the brief.',
  'export function predictLine(caseName: CaseName): string {',
  "  return ''",
  '}'
)

const versionsSource = lines(
  "import { BASE, FREE_FROM, PER_KG, zoneFor } from './rates'",
  "import type { Parcel } from './quote'",
  '',
  '// Written from the pricing sheet, not copied from quote.ts.',
  'function price(parcel: Parcel, subtotal: number, billable: (kg: number) => number): number | null {',
  '  if (!Number.isFinite(parcel.weightKg) || parcel.weightKg <= 0 || !(subtotal >= 0)) return null',
  '  const zone = zoneFor(parcel.country)',
  '  const standard = BASE[zone] + PER_KG[zone] * billable(parcel.weightKg)',
  '  if (parcel.express) return Math.ceil(standard * 1.5)',
  "  return subtotal >= FREE_FROM && zone !== 'world' ? 0 : standard",
  '}',
  '',
  'export const reference = (parcel: Parcel, subtotal: number) => price(parcel, subtotal, Math.ceil)',
  'export const roundsToNearest = (parcel: Parcel, subtotal: number) => price(parcel, subtotal, Math.round)'
)

const reproEntry = lines(
  "import { quote as reported } from './quote'",
  "import { reference, roundsToNearest } from './versions'",
  "import type { Parcel } from './quote'",
  '',
  'type Case = { parcel: Parcel; subtotal: number; expected: number | null }',
  'type Version = (parcel: Parcel, subtotal: number) => number | null',
  '',
  "const versions: Record<string, Version> = { reference, reported, 'rounds-to-nearest': roundsToNearest }",
  '',
  '// 1. Work out each expected price by hand from the pricing sheet, not by running a version.',
  'export const cases: Case[] = [',
  "  // { parcel: { country: 'ID', weightKg: 2.5, express: false }, subtotal: 40, expected: 7 },",
  ']',
  '',
  '// 2. Run each case on a copy of its parcel. Return true as soon as one case fails.',
  'export function exposes(version: string): boolean {',
  '  return false',
  '}'
)

const guardTypes = lines(
  "import type { Parcel } from './quote'",
  '',
  'export type Case = { parcel: Parcel; subtotal: number; expected: number | null }'
)
const shippingGuard = lines(
  guardTypes,
  '// Regression cases for the reported bug. Work out each expected price from the pricing sheet.',
  '// Your fix must pass every case, and the original code must fail at least one.',
  'export const regression: Case[] = [',
  ']'
)

// The shipping harness takes two arguments, so it has its own entry.
const shippingHarness = lines(
  "import { quote as fixed } from './quote'",
  "import { quote as original } from './original'",
  "import { regression } from './guard'",
  "import type { Parcel } from './quote'",
  '',
  '// Supplied. Do not edit: the checks run your regression cases through these tasks.',
  'type Run = (parcel: Parcel, subtotal: number) => number | null',
  'const differs = (run: Run, c: { parcel: Parcel; subtotal: number; expected: number | null }) => run({ ...c.parcel }, c.subtotal) !== c.expected',
  '',
  'export function run(task: string, parcel?: Parcel, subtotal?: number): unknown {',
  "  if (task === 'quote') return fixed(parcel as Parcel, subtotal as number)",
  "  if (task === 'guard-passes-on-fix') return regression.length > 0 && regression.every(c => !differs(fixed, c))",
  "  if (task === 'guard-fails-on-original') return regression.some(c => differs(original, c))",
  "  throw new Error('Unknown task: ' + task)",
  '}'
)

const originalHeader = '// A frozen copy of the code as reported. Do not edit; the checks compare your regression cases with it.\n'

// ---- Library fines module (independent domain) ----

const calendarSource = lines(
  '// Days are whole numbers counted from the library’s opening day.',
  'export function daysLate(due: number, returned: number): number {',
  '  return Math.max(0, returned - due)',
  '}'
)
const finesBody = (chargeable: string) => lines(
  "import { daysLate } from './calendar'",
  '',
  "export type Loan = { kind: 'book' | 'dvd'; due: number; returned: number; waived: boolean }",
  '',
  '// Amounts are in cents.',
  'export const RATE = { book: 25, dvd: 100 }',
  'export const CAP = { book: 1000, dvd: 2000 }',
  'export const GRACE_DAYS = 2',
  '',
  'export function fine(loan: Loan): number {',
  '  if (loan.waived) return 0',
  `  const chargeable = ${chargeable}`,
  '  return Math.min(chargeable * RATE[loan.kind], CAP[loan.kind])',
  '}'
)
const faultyFinesSource = finesBody('daysLate(loan.due, loan.returned) - GRACE_DAYS')
export const fixedFinesSource = finesBody('Math.max(0, daysLate(loan.due, loan.returned) - GRACE_DAYS)')

const loanGuard = lines(
  "import type { Loan } from './fines'",
  '',
  'export type Case = { loan: Loan; expected: number }',
  '',
  'export const regression: Case[] = [',
  ']'
)
const singleHarness = (mod: string, fn: string, type: string, arg: string, ret: string) => lines(
  `import { ${fn} as fixed } from './${mod}'`,
  `import { ${fn} as original } from './original'`,
  "import { regression } from './guard'",
  `import type { ${type} } from './${mod}'`,
  '',
  '// Supplied. Do not edit: the checks run your regression cases through these tasks.',
  `type Run = (${arg}: ${type}) => ${ret}`,
  `const differs = (run: Run, c: { ${arg}: ${type}; expected: ${ret} }) => run({ ...c.${arg} }) !== c.expected`,
  '',
  `export function run(task: string, ${arg}?: ${type}): unknown {`,
  `  if (task === '${fn}') return fixed(${arg} as ${type})`,
  "  if (task === 'guard-passes-on-fix') return regression.length > 0 && regression.every(c => !differs(fixed, c))",
  "  if (task === 'guard-fails-on-original') return regression.some(c => differs(original, c))",
  "  throw new Error('Unknown task: ' + task)",
  '}'
)

// ---- Room booking module (delayed recall domain) ----

const hoursSource = lines(
  '// Hours are whole numbers from 0 to 24 on a 24-hour clock.',
  'export const PEAK_START = 9',
  'export const PEAK_END = 17',
  '',
  'export function isPeak(hour: number): boolean {',
  '  return hour >= PEAK_START && hour < PEAK_END',
  '}'
)
const pricingBody = (loop: string) => lines(
  "import { isPeak } from './hours'",
  '',
  'export type Booking = { start: number; end: number; member: boolean }',
  '',
  'export const PEAK_RATE = 40',
  'export const OFF_PEAK_RATE = 20',
  '',
  'export function price(booking: Booking): number | null {',
  '  const { start, end, member } = booking',
  '  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 24 || end <= start) return null',
  '  let total = 0',
  loop,
  '  return member ? Math.floor((total * 9) / 10) : total',
  '}'
)
const flatLoop = '  for (let hour = start; hour < end; hour++) total += isPeak(hour) ? PEAK_RATE : OFF_PEAK_RATE'
const flatPricingSource = pricingBody(flatLoop)
export const tieredPricingSource = pricingBody(lines(
  '  for (let hour = start; hour < end; hour++) {',
  '    const rate = isPeak(hour) ? PEAK_RATE : OFF_PEAK_RATE',
  '    total += hour - start >= 3 ? rate / 2 : rate',
  '  }'
).trimEnd())
const bookingGuard = lines(
  "import type { Booking } from './pricing'",
  '',
  'export type Case = { booking: Booking; expected: number | null }',
  '',
  'export const regression: Case[] = [',
  ']'
)

const category = 'Maintaining code'
const noteCaveat = 'These checks establish only that your case tells the original code from your fix. They do not establish that your regression cases are complete.'

export const maintenanceJourneyReps: Rep[] = [
  {
    id: 'read-shipping-quote', title: 'Read an unfamiliar shipping module', category, format: 'read',
    context: 'You have inherited a small shipping module that three files share. Before anyone reports a bug, predict what it returns today. Predict the code as written, not the code you think was meant.',
    prompt: 'Read rates.ts, quote.ts, and summary.ts. Complete predictLine(caseName) with the line shippingLine returns today for each named case. standard = country " ID", 2.5 kg, not express, subtotal 40 (the country has a leading space). whole-kg = country SG, 2 kg, not express, subtotal 40. express = country " my ", 1 kg, express, subtotal 150. free = country id, 0.5 kg, not express, subtotal 100. world = country us, 3 kg, not express, subtotal 500. invalid = country ID, 0 kg, not express, subtotal 10. Do not change the module.',
    brief: { summary: 'Predict what shippingLine returns today for six named parcels.', rules: [
      'Read rates.ts, quote.ts, and summary.ts, then complete predictLine(caseName).',
      'standard = country " ID" (with a leading space), 2.5 kg, not express, subtotal 40.',
      'whole-kg = country SG, 2 kg, not express, subtotal 40.',
      'express = country " my ", 1 kg, express, subtotal 150.',
      'free = country id, 0.5 kg, not express, subtotal 100.',
      'world = country us, 3 kg, not express, subtotal 500.',
      'invalid = country ID, 0 kg, not express, subtotal 10.',
      'Predict what the code does today and do not change the module.',
    ] },
    example: { input: "shippingLine({ country: 'ID', weightKg: 0.5, express: false }, 10)", output: "'Shipping: 5'" },
    note: 'This is a prediction exercise. You may write each line directly. The checks verify the six predictions; your written trace is self-reviewed. If a result surprises you, write down the line that caused it.',
    vocabulary: [{ term: 'Unfamiliar code', meaning: 'code you did not write and have not yet traced' }, { term: 'Trace', meaning: 'follow values through code one step at a time' }, { term: 'Billable weight', meaning: 'the weight a price is charged for after rounding' }],
    planPrompt: 'For each case, write the zone, the billable weight, the standard price, and which rule fires last. Predict all six before you run the checks.',
    starter: encodeFiles({ entry: 'predict.ts', files: { 'rates.ts': ratesSource, 'quote.ts': faultyQuoteSource, 'summary.ts': summarySource, 'predict.ts': predictEntry } }),
    functionName: 'predictLine',
    hints: [
      'Start with rates.ts: trim and uppercase the country, then find its zone.',
      'In quote.ts, work out billableKg for the weight on its own line before you add anything.',
      'Order matters at the end of quote: express returns first, then free shipping, then the standard price.',
    ],
    checks: [
      { name: 'Predicts a trimmed country and a fractional weight', input: ['standard'], expected: 'Shipping: 7' },
      { name: 'Predicts a whole-kilogram weight', input: ['whole-kg'], expected: 'Shipping: 17' },
      { name: 'Predicts express before free shipping', input: ['express'], expected: 'Shipping: 21' },
      { name: 'Predicts free shipping at the threshold', input: ['free'], expected: 'Shipping: free' },
      { name: 'Predicts a world order that is never free', input: ['world'], expected: 'Shipping: 46' },
      { name: 'Predicts an unavailable quote', input: ['invalid'], expected: 'Shipping unavailable' },
    ],
  },
  {
    id: 'reproduce-quote-bug', title: 'Reproduce a reported shipping bug', category, format: 'backend',
    context: 'Bug report: "A 2 kg parcel to Singapore was quoted 17. The pricing sheet says 14." You cannot fix what you cannot reproduce. Write a case that fails on the reported code, and check it passes on the pricing sheet.',
    prompt: 'Fill the cases table and write exposes(version) in repro.ts. The pricing sheet: the country code is trimmed and case-insensitive; ID is home, SG, MY, and TH are region, and any other code is world. A parcel costs the base plus the per-kilogram rate times its billable weight: home 4 + 1, region 8 + 3, world 18 + 7. Every started kilogram is billed, so 1.5 kg bills 2 kg and 2 kg bills 2 kg. An express parcel costs 1.5 times the standard price, rounded up. A standard parcel to home or region ships free when the subtotal is at least 100; world and express parcels never ship free. A weight that is not above 0, or a negative subtotal, has no quote (null). Run each case on a copy of its parcel and return true as soon as a result differs from the expected price. exposes("reference") must be false, exposes("reported") must be true, and exposes("rounds-to-nearest") must be true.',
    brief: { summary: 'Write cases that fail on the reported shipping code and pass on the pricing sheet.', rules: [
      'The country code is trimmed and case-insensitive: ID is home; SG, MY, and TH are region; any other code is world.',
      'A parcel costs the base plus the per-kilogram rate times its billable weight: home 4 + 1, region 8 + 3, world 18 + 7.',
      'Every started kilogram is billed, so 1.5 kg bills 2 kg and 2 kg bills 2 kg.',
      'An express parcel costs 1.5 times the standard price, rounded up.',
      'A standard parcel to home or region ships free when the subtotal is at least 100; world and express parcels never ship free.',
      'A weight that is not above 0, or a negative subtotal, has no quote (null).',
      'exposes(version) runs each case on a copy of its parcel and returns true as soon as a result differs from the expected price.',
      'exposes("reference") must be false; exposes("reported") and exposes("rounds-to-nearest") must be true.',
    ] },
    example: { input: "cases: [{ parcel: { country: 'ID', weightKg: 2.5, express: false }, subtotal: 40, expected: 7 }]", output: "exposes('reported') is false: this case does not reproduce the report" },
    note: `Write each expected price from the pricing sheet, not by running a version. A case that every version passes reproduces nothing. ${noteCaveat}`,
    vocabulary: [{ term: 'Reproduce', meaning: 'make a reported bug happen again with a specific input' }, { term: 'Reported behavior', meaning: 'what the code does today, as seen by the person who filed the bug' }, { term: 'Answer key', meaning: 'the trusted expected values a case is compared with' }],
    planPrompt: 'Which input does the report name? What does the code return for it, and what should it return? Which nearby input would also separate the reported code from a version that rounds to the nearest kilogram?',
    starter: encodeFiles({ entry: 'repro.ts', files: { 'rates.ts': ratesSource, 'quote.ts': faultyQuoteSource, 'versions.ts': versionsSource, 'repro.ts': reproEntry } }),
    functionName: 'exposes',
    hints: [
      'Start from the report: write the 2 kg Singapore parcel with its expected price from the sheet, 14.',
      'The sheet says every started kilogram is billed. Which weights sit exactly on a kilogram, and which sit just above one?',
      'Run the case on { ...c.parcel } and return true when the result differs from c.expected.',
    ],
    checks: [
      { name: 'Your cases accept the pricing sheet', input: ['reference'], expected: false },
      { name: 'Reproduces the reported bug', input: ['reported'], expected: true },
      { name: 'Also exposes the version that rounds to the nearest kilogram', input: ['rounds-to-nearest'], expected: true },
    ],
  },
  {
    id: 'fix-quote-bug', title: 'Write a regression case and fix the shipping bug', category, format: 'debug',
    context: 'Bug report: "A 2 kg parcel to Singapore was quoted 17; the pricing sheet says 14." Add your regression case to guard.ts, then fix quote.ts. The original.ts file is a frozen copy of the reported code, so your case must fail there and pass on your fix.',
    prompt: 'Fix quote(parcel, subtotal) in quote.ts and add regression cases in guard.ts. The pricing sheet: the country code is trimmed and case-insensitive; ID is home, SG, MY, and TH are region, and any other code is world. A parcel costs the base plus the per-kilogram rate times its billable weight: home 4 + 1, region 8 + 3, world 18 + 7. Every started kilogram is billed, so 1.5 kg bills 2 kg and 2 kg bills 2 kg. An express parcel costs 1.5 times the standard price, rounded up. A standard parcel to home or region ships free when the subtotal is at least 100; world and express parcels never ship free. A weight that is not above 0, or a negative subtotal, returns null. Keep every price the code already got right. Do not edit original.ts or main.ts.',
    brief: { summary: 'Add a regression case, then fix quote so the pricing sheet holds.', rules: [
      'The country code is trimmed and case-insensitive: ID is home; SG, MY, and TH are region; any other code is world.',
      'A parcel costs the base plus the per-kilogram rate times its billable weight: home 4 + 1, region 8 + 3, world 18 + 7.',
      'Every started kilogram is billed, so 1.5 kg bills 2 kg and 2 kg bills 2 kg.',
      'An express parcel costs 1.5 times the standard price, rounded up.',
      'A standard parcel to home or region ships free when the subtotal is at least 100; world and express parcels never ship free.',
      'A weight that is not above 0, or a negative subtotal, returns null.',
      'guard.ts holds your regression cases: your fix must pass them and the frozen original in original.ts must fail at least one.',
      'Keep every price the code already got right, and do not edit original.ts or main.ts.',
    ] },
    example: { input: "run('quote', { country: 'ID', weightKg: 2.5, express: false }, 40)", output: '7' },
    note: `The checks run your guard cases against the frozen original and against your fix, then price a set of parcels. ${noteCaveat} Say which one line caused the report.`,
    vocabulary: [{ term: 'Regression test', meaning: 'a case that fails on the bug and keeps the fix from breaking again' }, { term: 'Frozen copy', meaning: 'an unchanged copy of the faulty code kept for comparison' }, { term: 'Minimal fix', meaning: 'the smallest change that removes the cause and keeps everything else' }],
    planPrompt: 'Write the regression case first and confirm by hand that it fails on the reported code. Which single line causes the report, and which prices must stay the same after you change it?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'rates.ts': ratesSource, 'quote.ts': faultyQuoteSource, 'original.ts': originalHeader + faultyQuoteSource, 'guard.ts': shippingGuard, 'main.ts': shippingHarness } }),
    functionName: 'run',
    preserveInput: true,
    hints: [
      'Write the case before touching quote.ts: the 2 kg Singapore parcel with subtotal 40 should cost 14.',
      'Find the line that decides how many kilograms are billed, and compare 2 with 2.5.',
      'After the fix, check a weight just above a kilogram and a very small weight, so a different rounding does not slip in.',
    ],
    checks: [
      { name: 'Your regression cases pass on your fix', input: ['guard-passes-on-fix'], expected: true },
      { name: 'Your regression cases fail on the original code', input: ['guard-fails-on-original'], expected: true },
      { name: 'Reported parcel is fixed', input: ['quote', { country: 'SG', weightKg: 2, express: false }, 40], expected: 14 },
      { name: 'A whole kilogram is billed once', input: ['quote', { country: 'ID', weightKg: 1, express: false }, 0], expected: 5 },
      { name: 'A started kilogram is still billed', input: ['quote', { country: 'SG', weightKg: 2.5, express: false }, 40], expected: 17 },
      { name: 'A tiny weight bills one kilogram', input: ['quote', { country: ' sg ', weightKg: 0.2, express: false }, 40], expected: 11 },
      { name: 'Express uses the corrected weight', input: ['quote', { country: 'MY', weightKg: 3, express: true }, 0], expected: 26 },
      { name: 'Free shipping at the threshold', input: ['quote', { country: 'ID', weightKg: 1, express: false }, 100], expected: 0 },
      { name: 'Just under the threshold is charged', input: ['quote', { country: 'ID', weightKg: 1, express: false }, 99], expected: 5 },
      { name: 'World orders are never free', input: ['quote', { country: 'US', weightKg: 1, express: false }, 500], expected: 25 },
      { name: 'Invalid weight and subtotal have no quote', input: ['quote', { country: 'ID', weightKg: 0, express: false }, 10], expected: null },
    ],
  },
  {
    id: 'adapt-quote-rule', title: 'Adapt the shipping module to a changed rule', category, format: 'backend',
    context: 'The fix shipped. Now the business has changed two rules, and the module you just repaired must change with them. Existing prices that the new rules do not touch must stay exactly as they were.',
    prompt: 'Change the module so shippingLine follows the new rules. Free shipping now starts at a subtotal of 120, not 100. A parcel whose billable weight is over 20 kg adds a flat heavy fee of 15 after any express multiplier. Free shipping never waives the heavy fee, so a free heavy parcel costs 15. Billable weight is the rounded-up weight, so 20 kg adds no fee and 20.2 kg does. Everything else keeps its current behavior: the country normalization, the zones and rates, express at 1.5 times rounded up, world and express parcels never ship free, and no quote (the unavailable line) for a weight not above 0 or a negative subtotal. The line is "Shipping: free" for a cost of 0, "Shipping: N" for any other cost, and "Shipping unavailable" for no quote.',
    brief: { summary: 'Update the shipping module for a higher free threshold and a heavy fee.', rules: [
      'Free shipping now starts at a subtotal of 120, not 100.',
      'A parcel whose billable weight is over 20 kg adds a flat heavy fee of 15 after any express multiplier.',
      'Free shipping never waives the heavy fee, so a free heavy parcel costs 15.',
      'Billable weight is the rounded-up weight, so 20 kg adds no fee and 20.2 kg does.',
      'Everything else keeps its behavior: normalization, zones and rates, express at 1.5 times rounded up, world and express never free, and no quote for a weight not above 0 or a negative subtotal.',
      'The line is "Shipping: free" for a cost of 0, "Shipping: N" for any other cost, and "Shipping unavailable" for no quote.',
    ] },
    example: { input: "shippingLine({ country: 'ID', weightKg: 21, express: false }, 0)", output: "'Shipping: 40'" },
    note: 'The checks price new-rule parcels and also re-price the parcels the old rules got right, so a fix that only handles the new rules can fail. They do not prove that you changed the fewest lines, and the reasoning stays self-reviewed.',
    vocabulary: [{ term: 'Changed requirement', meaning: 'a new rule that replaces or adds to an existing one' }, { term: 'Behavior preserved', meaning: 'results the change was not meant to alter stay the same' }, { term: 'Flat fee', meaning: 'a fixed amount added regardless of size' }],
    planPrompt: 'List the old rules the change does not touch. Where does each new rule enter the calculation, before or after the express multiplier and the free check? Which weights and subtotals sit exactly on the new boundaries?',
    starter: encodeFiles({ entry: 'summary.ts', files: { 'rates.ts': ratesSource, 'quote.ts': fixedQuoteSource, 'summary.ts': summarySource } }),
    functionName: 'shippingLine',
    preserveInput: true,
    hints: [
      'Find every place the old numbers live, and decide which file should own each new constant.',
      'Decide the order: weight, standard or express price, free check, then the heavy fee on top.',
      'Test both sides of each boundary: subtotals 119 and 120, and weights 20 and 20.2.',
    ],
    checks: [
      { name: 'Unchanged fractional weight', input: [{ country: ' ID', weightKg: 2.5, express: false }, 40], expected: 'Shipping: 7' },
      { name: 'Whole kilogram stays fixed', input: [{ country: 'SG', weightKg: 2, express: false }, 40], expected: 'Shipping: 14' },
      { name: 'Old threshold no longer ships free', input: [{ country: 'ID', weightKg: 1, express: false }, 100], expected: 'Shipping: 5' },
      { name: 'Just under the new threshold is charged', input: [{ country: 'ID', weightKg: 1, express: false }, 119], expected: 'Shipping: 5' },
      { name: 'New threshold ships free', input: [{ country: 'ID', weightKg: 1, express: false }, 120], expected: 'Shipping: free' },
      { name: 'Exactly 20 kg has no heavy fee', input: [{ country: 'ID', weightKg: 20, express: false }, 0], expected: 'Shipping: 24' },
      { name: 'A started kilogram past 20 adds the heavy fee', input: [{ country: 'ID', weightKg: 20.2, express: false }, 0], expected: 'Shipping: 40' },
      { name: 'Free shipping keeps the heavy fee', input: [{ country: 'ID', weightKg: 25, express: false }, 200], expected: 'Shipping: 15' },
      { name: 'Heavy fee comes after the express multiplier', input: [{ country: 'SG', weightKg: 30, express: true }, 0], expected: 'Shipping: 162' },
      { name: 'World heavy parcel pays everything', input: [{ country: 'us', weightKg: 21, express: false }, 500], expected: 'Shipping: 180' },
      { name: 'Express still ignores free shipping', input: [{ country: ' my ', weightKg: 1, express: true }, 150], expected: 'Shipping: 17' },
      { name: 'No quote for a weight of zero', input: [{ country: 'ID', weightKg: 0, express: false }, 10], expected: 'Shipping unavailable' },
    ],
  },
  {
    id: 'maintain-library-fines', title: 'Fix a library fines bug with a regression case', category, format: 'debug',
    context: 'A different system, the same job. Bug report: "Members who return a book on time, or one day late, see a negative fine such as -50." Reproduce it, guard it, fix it, and keep everything else.',
    prompt: 'Fix fine(loan) and add regression cases in guard.ts. Days are whole numbers. A loan is late by the days from due to returned, or 0 if it was returned on or before the due day. The first 2 late days are free. Each later day costs 25 cents for a book and 100 cents for a dvd. A book fine never passes 1000 cents and a dvd fine never passes 2000 cents. A waived loan costs 0 whatever its dates. A fine is never negative. Do not edit original.ts or main.ts.',
    brief: { summary: 'Reproduce, guard, and fix a negative library fine.', rules: [
      'Days are whole numbers. A loan is late by the days from due to returned, or 0 if returned on or before the due day.',
      'The first 2 late days are free. Each later day costs 25 cents for a book and 100 cents for a dvd.',
      'A book fine never passes 1000 cents and a dvd fine never passes 2000 cents.',
      'A waived loan costs 0 whatever its dates.',
      'A fine is never negative.',
      'guard.ts holds your regression cases: your fix must pass them and the frozen original in original.ts must fail at least one. Do not edit original.ts or main.ts.',
    ] },
    example: { input: "run('fine', { kind: 'book', due: 10, returned: 14, waived: false })", output: '50' },
    note: `Reproduce the report by hand before you edit. ${noteCaveat}`,
    vocabulary: [{ term: 'Grace period', meaning: 'days after a deadline before a charge starts' }, { term: 'Cap', meaning: 'an upper limit a charge cannot pass' }, { term: 'Regression test', meaning: 'a case that fails on the bug and keeps the fix from breaking again' }],
    planPrompt: 'Which loans does the report describe, and what does each step of the code return for them? Which two late-day counts sit on either side of the bug? Which cases must still pass after the fix?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'calendar.ts': calendarSource, 'fines.ts': faultyFinesSource, 'original.ts': originalHeader + faultyFinesSource, 'guard.ts': loanGuard, 'main.ts': singleHarness('fines', 'fine', 'Loan', 'loan', 'number') } }),
    functionName: 'run',
    preserveInput: true,
    hints: [
      'Walk one loan through the code by hand: write daysLate, then the chargeable days, then the fine.',
      'Try the day counts around where the free days end, not only the one in the report.',
      'After the fix, confirm the cap and the waiver still win where they should.',
    ],
    checks: [
      { name: 'Your regression cases pass on your fix', input: ['guard-passes-on-fix'], expected: true },
      { name: 'Your regression cases fail on the original code', input: ['guard-fails-on-original'], expected: true },
      { name: 'On time costs nothing', input: ['fine', { kind: 'book', due: 10, returned: 10, waived: false }], expected: 0 },
      { name: 'Early costs nothing', input: ['fine', { kind: 'dvd', due: 10, returned: 8, waived: false }], expected: 0 },
      { name: 'One day late is inside the free days', input: ['fine', { kind: 'book', due: 10, returned: 11, waived: false }], expected: 0 },
      { name: 'Two days late is the last free day', input: ['fine', { kind: 'dvd', due: 10, returned: 12, waived: false }], expected: 0 },
      { name: 'Three days late charges one day of a book', input: ['fine', { kind: 'book', due: 10, returned: 13, waived: false }], expected: 25 },
      { name: 'Three days late charges one day of a dvd', input: ['fine', { kind: 'dvd', due: 10, returned: 13, waived: false }], expected: 100 },
      { name: 'A book fine reaches its cap exactly', input: ['fine', { kind: 'book', due: 0, returned: 42, waived: false }], expected: 1000 },
      { name: 'A book fine stays at its cap', input: ['fine', { kind: 'book', due: 0, returned: 100, waived: false }], expected: 1000 },
      { name: 'A dvd fine stays at its cap', input: ['fine', { kind: 'dvd', due: 0, returned: 100, waived: false }], expected: 2000 },
      { name: 'A waived late loan costs nothing', input: ['fine', { kind: 'dvd', due: 0, returned: 50, waived: true }], expected: 0 },
    ],
  },
  {
    id: 'maintain-room-booking', title: 'Change a room booking price and guard the new rule', category, format: 'backend',
    context: 'A meeting-room tool prices bookings by the hour. Product has added a rule, and you must write the cases that prove the old code does not have it before you change the code.',
    prompt: 'Add a long-booking rule to price(booking) and put cases for it in guard.ts. A booking has a start hour, an end hour, and a member flag. The end hour is not charged. Whole hours from 0 to 24 only; anything else, or an end that is not after the start, has no price (null). Peak hours 9 to 16 cost 40 each and other hours cost 20 each. New rule: from the fourth hour of a booking onward, each hour costs half of its normal rate. Members then pay 90 percent of the total, rounded down. Your guard cases must fail on the old code in original.ts and pass on your change. Do not edit original.ts or main.ts.',
    brief: { summary: 'Add the long-booking rule and guard it with your own cases.', rules: [
      'A booking has a start hour, an end hour, and a member flag. The end hour is not charged.',
      'Whole hours from 0 to 24 only; anything else, or an end that is not after the start, has no price (null).',
      'Peak hours 9 to 16 cost 40 each and other hours cost 20 each.',
      'New rule: from the fourth hour of a booking onward, each hour costs half of its normal rate.',
      'Members then pay 90 percent of the total, rounded down.',
      'guard.ts holds your cases for the new rule: they must fail on the old code in original.ts and pass on your change. Do not edit original.ts or main.ts.',
    ] },
    example: { input: "run('price', { start: 9, end: 12, member: false })", output: '120' },
    note: `Requirements only; no steps are given. ${noteCaveat}`,
    vocabulary: [{ term: 'Half-open range', meaning: 'a range that includes its start and excludes its end' }, { term: 'Tier', meaning: 'a band of a quantity that has its own price' }],
    planPrompt: 'Which bookings are priced the same by the old and new rules, and which differ? Where does the half rate stop and the member discount begin? Which cases show that the old code lacks the rule?',
    starter: encodeFiles({ entry: 'main.ts', files: { 'hours.ts': hoursSource, 'pricing.ts': flatPricingSource, 'original.ts': originalHeader + flatPricingSource, 'guard.ts': bookingGuard, 'main.ts': singleHarness('pricing', 'price', 'Booking', 'booking', 'number | null') } }),
    functionName: 'run',
    preserveInput: true,
    hints: [
      'Restate each requirement as a booking with a price you can compute by hand.',
      'Put a case on each side of the point where the rule starts.',
      'Check the order of the rules: rate by hour, then half rate, then the member discount.',
    ],
    checks: [
      { name: 'Your new-rule cases pass on your change', input: ['guard-passes-on-fix'], expected: true },
      { name: 'Your new-rule cases fail on the old code', input: ['guard-fails-on-original'], expected: true },
      { name: 'Three peak hours are unchanged', input: ['price', { start: 9, end: 12, member: false }], expected: 120 },
      { name: 'The fourth hour is half price', input: ['price', { start: 9, end: 13, member: false }], expected: 140 },
      { name: 'Peak and off-peak hours mix', input: ['price', { start: 8, end: 18, member: false }], expected: 230 },
      { name: 'The member discount comes after the half rate', input: ['price', { start: 8, end: 18, member: true }], expected: 207 },
      { name: 'Short off-peak booking', input: ['price', { start: 22, end: 24, member: false }], expected: 40 },
      { name: 'A full day', input: ['price', { start: 0, end: 24, member: false }], expected: 350 },
      { name: 'A full day for a member', input: ['price', { start: 0, end: 24, member: true }], expected: 315 },
      { name: 'Hour 16 is peak and hour 17 is not', input: ['price', { start: 16, end: 18, member: false }], expected: 60 },
      { name: 'An empty booking has no price', input: ['price', { start: 5, end: 5, member: false }], expected: null },
      { name: 'A booking past 24 has no price', input: ['price', { start: 20, end: 25, member: false }], expected: null },
      { name: 'A fractional hour has no price', input: ['price', { start: 9.5, end: 11, member: false }], expected: null },
    ],
  },
]
