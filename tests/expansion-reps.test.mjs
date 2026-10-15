import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { reps } from '../src/rep.ts'
import { expansionSolutions } from './fixtures/expansion-solutions.mjs'

// tests/content.test.mjs runs each reference against its authored checks; these confirm the checks also reject
// the plausible mistakes each review names.
const rejects = (id, code) =>
  assert.ok(
    runRep(code, id).some(check => !check.passed),
    `${id} accepted: ${code.slice(0, 90)}`,
  )

test('text checks reject characteristic mistakes', () => {
  // Counts totals instead of runs.
  rejects(
    'text-run-length',
    'function compressRuns(t) { const m = new Map(); for (const c of t) m.set(c, (m.get(c) ?? 0) + 1); return [...m].map(([c, n]) => c + n).join("") }',
  )
  // Loses the final run.
  rejects(
    'text-run-length',
    'function compressRuns(t) { let r = "", s = 0; for (let i = 1; i < t.length; i++) if (t[i] !== t[s]) { r += t[s] + (i - s); s = i } return r }',
  )
  // Keys by distinct letters only.
  rejects(
    'text-anagram-groups',
    'function anagramGroups(w) { const g = new Map(); for (const x of w) { const k = [...new Set(x)].sort().join(""); if (!g.has(k)) g.set(k, []); g.get(k).push(x) } return [...g.values()] }',
  )
  // Sorts the input words.
  rejects(
    'text-anagram-groups',
    'function anagramGroups(w) { const g = new Map(); for (const x of [...w].sort()) { const k = [...x].sort().join(""); if (!g.has(k)) g.set(k, []); g.get(k).push(x) } return [...g.values()] }',
  )
  // Drops digits.
  rejects(
    'text-normalized-palindrome',
    'function isPalindrome(t) { const c = t.toLowerCase().replace(/[^a-z]/g, ""); return c === [...c].reverse().join("") }',
  )
  // Filters before lowercasing.
  rejects(
    'text-normalized-palindrome',
    'function isPalindrome(t) { const c = t.replace(/[^a-z0-9]/g, "").toLowerCase(); return c === [...c].reverse().join("") }',
  )
  // Splits on single spaces.
  rejects(
    'text-wrap-column',
    'function wrapText(t, w) { const out = []; let line = ""; for (const word of t.split(" ")) { if (line && line.length + 1 + word.length <= w) line += " " + word; else { if (line) out.push(line); line = word } } if (line) out.push(line); return out }',
  )
  // Uses a strict width comparison.
  rejects(
    'text-wrap-column',
    'function wrapText(t, w) { const out = []; let line = ""; for (const word of t.split(" ").filter(Boolean)) { if (line && line.length + 1 + word.length < w) line += " " + word; else { if (line) out.push(line); line = word } } if (line) out.push(line); return out }',
  )
})

test('debugging checks reject partial repairs', () => {
  const date = expansionSolutions['debug-date-range-filter']
  rejects('debug-date-range-filter', date.replace('order.date <= to', 'order.date < to'))
  rejects('debug-date-range-filter', date.replace('from <= order.date', 'from < order.date'))
  rejects(
    'debug-date-range-filter',
    'function ordersInRange(orders, from, to) { return orders.slice(1).filter(o => o.date >= from && o.date <= to).map(o => o.id) }',
  )
  // Replaces floor with round only at the end.
  rejects(
    'debug-invoice-rounding',
    'function invoiceCents(lines, taxPercent) { let total = 0; for (const line of lines) total += line.price * line.quantity; return Math.round(total * (1 + taxPercent / 100) * 100) }',
  )
  // Rounds prices but floors the tax.
  rejects(
    'debug-invoice-rounding',
    'function invoiceCents(lines, taxPercent) { const s = lines.reduce((sum, l) => sum + Math.round(l.price * 100) * l.quantity, 0); return s + Math.floor(s * taxPercent / 100) }',
  )
  // Copies the state but still pushes into the shared array.
  rejects(
    'debug-reducer-mutation',
    'function applyAction(state, action) { if (action.type === "add") { if (!state.items.includes(action.item)) state.items.push(action.item); return { ...state } } if (action.type === "remove") return { items: state.items.filter(i => i !== action.item), selected: state.selected === action.item ? null : state.selected }; if (action.type === "select") return state.items.includes(action.item) ? { ...state, selected: action.item } : state; return { items: [], selected: null } }',
  )
  // Fixes the label but not the button number.
  rejects(
    'debug-stale-handlers',
    'function handlerLabels(labels, clicks) { const h = []; for (var i = 0; i < labels.length; i++) { const label = labels[i]; h.push(() => label + " (button " + (i + 1) + ")") } return clicks.map(x => h[x]()) }',
  )
})

test('suggested-code checks reject partial repairs', () => {
  // Starts reduce at 0 but keeps invalid ratings and returns NaN for empty input.
  rejects(
    'ai-empty-input-suggestion',
    'function averageRating(r) { const t = r.reduce((s, x) => s + x, 0); return Math.round((t / r.length) * 10) / 10 }',
  )
  // Filters but treats 0 as valid.
  rejects(
    'ai-empty-input-suggestion',
    'function averageRating(r) { const v = r.filter(x => Number.isInteger(x) && x >= 0 && x <= 5); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length * 10) / 10 : null }',
  )
  // Splits on single spaces.
  rejects(
    'ai-invented-api',
    'function titleCase(t) { return t.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") }',
  )
  // Forgets to lowercase the rest.
  rejects(
    'ai-invented-api',
    'function titleCase(t) { return t.trim().split(/\\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") }',
  )
  // A table without the copy comparison misses the in-place sort.
  const median = expansionSolutions['ai-expose-wrong-median']
  rejects('ai-expose-wrong-median', median.replace(' || JSON.stringify(copy) !== JSON.stringify(c.values)', ''))
  // A table without an even-length case misses the even rule.
  rejects('ai-expose-wrong-median', median.replace('  { values: [4, 1, 3, 2], expected: 2.5 },\n', ''))
})

test('timing and reliability checks reject characteristic mistakes', () => {
  const autosave = expansionSolutions['autosave-debounce']
  // Saves when the next event arrives instead of at the due time.
  rejects('autosave-debounce', autosave.replace('flush(pending.due); if (e.kind', 'flush(e.at); if (e.kind'))
  // Never skips unchanged text.
  rejects('autosave-debounce', autosave.replace('if (pending.text !== last) {', 'if (true) {'))
  const scroll = expansionSolutions['scroll-report-throttle']
  // Closes at most one window per event.
  rejects('scroll-report-throttle', scroll.replace('while (end !== null', 'if (end !== null'))
  // Never sends the final trailing report.
  rejects('scroll-report-throttle', scroll.replace('close(Infinity); return out', 'return out'))
  const payment = expansionSolutions['payment-resubmit']
  // Treats a timeout as lost.
  rejects('payment-resubmit', payment.replace('if (a.outcome === "lost")', 'if (a.outcome !== "processed")'))
  // Charges again on a replay.
  rejects(
    'payment-resubmit',
    payment.replace(
      'return server.get(a.key) === a.amount ? "replayed"',
      'if (server.get(a.key) === a.amount) charged += a.amount; return server.get(a.key) === a.amount ? "replayed"',
    ),
  )
  const quote = expansionSolutions['quote-cache-retry']
  // Uses an inclusive freshness check.
  rejects('quote-cache-retry', quote.replace('at < cache.at + ttl', 'at <= cache.at + ttl'))
  // Refreshes the fetch time when serving stale.
  rejects(
    'quote-cache-retry',
    quote.replace('return cache ? "stale:" + cache.price', 'if (cache) cache.at = at; return cache ? "stale:" + cache.price'),
  )
  // Treats a zero price as a failure.
  rejects('quote-cache-retry', quote.replace('if (price !== null)', 'if (price)'))
})

test('new journeys are distinct, start their rotation with the recall rep, and keep briefs free of approach clues', () => {
  const expected = {
    'string-building': ['text-run-length', 'text-anagram-groups', 'text-normalized-palindrome'],
    'timing-policies': ['debounce-schedule', 'autosave-debounce', 'scroll-report-throttle'],
    'reliable-requests': ['idempotent-ledger', 'payment-resubmit', 'quote-cache-retry'],
    'fresh-debugging': ['debug-date-range-filter', 'debug-invoice-rounding', 'debug-reducer-mutation'],
    'suggested-code': ['ai-empty-input-suggestion', 'ai-invented-api', 'ai-expose-wrong-median'],
  }
  for (const [id, stages] of Object.entries(expected)) {
    const journey = journeys.find(journey => journey.id === id)
    assert.deepEqual([journey.guided, journey.independent, journey.recall], stages, id)
    assert.equal(recallVariants[id][0], journey.recall, id)
  }
  const clues = /\b(Map|Set|sort|regular expression|two pointers|let instead of var|Math\.round|spread)\b/
  for (const id of [
    'text-anagram-groups',
    'text-normalized-palindrome',
    'autosave-debounce',
    'scroll-report-throttle',
    'payment-resubmit',
    'quote-cache-retry',
    'debug-invoice-rounding',
    'debug-reducer-mutation',
    'ai-invented-api',
  ]) {
    const rep = reps.find(rep => rep.id === id)
    assert.doesNotMatch(`${rep.prompt} ${rep.planPrompt}`, clues, id)
  }
})
