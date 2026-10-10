// Independent reference solutions for the find-the-bug journey. The implementations maps are copied from each rep's
// starter, because a learner's file contains them too; the case tables and comparison logic are the learner work.
const pageImplementations = `
const implementations: Record<string, (items: number[], page: number, size: number) => number[]> = {
  correct: (items, page, size) => { if (page < 1 || size < 1) return []; return items.slice((page - 1) * size, page * size) },
  'starts-one-late': (items, page, size) => { if (page < 1 || size < 1) return []; return items.slice(page * size, page * size + size) },
  'drops-short-last-page': (items, page, size) => { if (page < 1 || size < 1) return []; const result = items.slice((page - 1) * size, page * size); return result.length < size ? [] : result },
  'removes-from-input': (items, page, size) => { if (page < 1 || size < 1) return []; return items.splice((page - 1) * size, size) },
  'zero-size-returns-everything': (items, page, size) => { if (page < 1) return []; if (size < 1) return items; return items.slice((page - 1) * size, page * size) },
}`

export const exposePageCases = `
const cases: { items: number[]; page: number; size: number; expected: number[] }[] = [
  { items: [10, 20, 30], page: 1, size: 2, expected: [10, 20] },
  { items: [10, 20, 30], page: 2, size: 2, expected: [30] },
  { items: [10, 20, 30], page: 3, size: 2, expected: [] },
  { items: [10, 20, 30], page: 0, size: 2, expected: [] },
  { items: [10, 20, 30], page: 1, size: 0, expected: [] },
]`

const overlapImplementations = `
type Interval = [number, number]
const implementations: Record<string, (a: Interval, b: Interval) => boolean> = {
  correct: (a, b) => a[0] < a[1] && b[0] < b[1] && a[0] < b[1] && b[0] < a[1],
  'variant-a': (a, b) => a[0] < a[1] && b[0] < b[1] && a[0] <= b[1] && b[0] <= a[1],
  'variant-b': (a, b) => a[0] < a[1] && b[0] < b[1] && a[0] <= b[0] && b[0] < a[1],
  'variant-c': (a, b) => a[0] < b[1] && b[0] < a[1],
  'variant-d': (a, b) => (a[0] < b[0] && b[0] < a[1]) || (b[0] < a[0] && a[0] < b[1]),
  'variant-e': (a, b) => { const start = a.shift() as number; const end = a.shift() as number; return start < end && b[0] < b[1] && start < b[1] && b[0] < end },
}`

export const exposeOverlapCases = `
const cases: { a: Interval; b: Interval; expected: boolean }[] = [
  { a: [1, 5], b: [3, 8], expected: true },
  { a: [1, 5], b: [5, 9], expected: false },
  { a: [5, 9], b: [1, 5], expected: false },
  { a: [5, 9], b: [1, 6], expected: true },
  { a: [1, 10], b: [3, 4], expected: true },
  { a: [3, 3], b: [1, 5], expected: false },
  { a: [1, 5], b: [1, 3], expected: true },
  { a: [2, 4], b: [2, 4], expected: true },
]`

export const exposePageSolution = (cases = exposePageCases) => `${pageImplementations}
${cases}
function exposes(variant: string): boolean {
  const run = implementations[variant]
  for (const c of cases) {
    const copy = [...c.items]
    const got = run(copy, c.page, c.size)
    if (JSON.stringify(got) !== JSON.stringify(c.expected)) return true
    if (JSON.stringify(copy) !== JSON.stringify(c.items)) return true
  }
  return false
}`

export const exposeOverlapSolution = (cases = exposeOverlapCases) => `${overlapImplementations}
${cases}
function exposes(variant: string): boolean {
  const run = implementations[variant]
  for (const c of cases) {
    const a: Interval = [c.a[0], c.a[1]]
    const b: Interval = [c.b[0], c.b[1]]
    if (run(a, b) !== c.expected) return true
    if (a[0] !== c.a[0] || a[1] !== c.a[1] || a.length !== 2 || b[0] !== c.b[0] || b[1] !== c.b[1]) return true
  }
  return false
}`

export const testingJourneySolutions = {
  'expose-page-bugs': exposePageSolution(),
  'repair-range-label': 'function rangeLabel(total: number, page: number, size: number): string { if (total === 0) return "No results"; const start = (page - 1) * size + 1; if (page < 1 || size < 1 || start > total) return "Page out of range"; const end = Math.min(page * size, total); return `Showing ${start}-${end} of ${total}` }',
  'expose-overlap-bugs': exposeOverlapSolution(),
}
