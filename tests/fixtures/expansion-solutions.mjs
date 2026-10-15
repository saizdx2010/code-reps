// Independent references for the strings, debugging, suggested-code review, and practical journey reps.
// Each is written separately from the review traces so a shared mistake cannot pass both.
export const expansionSolutions = {
  'text-run-length': 'function compressRuns(text) { return (text.match(/(.)\\1*/gs) ?? []).map(run => run[0] + run.length).join("") }',
  'text-anagram-groups':
    'function anagramGroups(words) { const groups = new Map(); for (const word of words) { const counts = Array(26).fill(0); for (const ch of word) counts[ch.charCodeAt(0) - 97]++; const key = counts.join(","); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(word) } return [...groups.values()] }',
  'text-normalized-palindrome':
    'function isPalindrome(text) { const ok = c => /[A-Za-z0-9]/.test(c); let i = 0, j = text.length - 1; while (i < j) { if (!ok(text[i])) { i++; continue } if (!ok(text[j])) { j--; continue } if (text[i].toLowerCase() !== text[j].toLowerCase()) return false; i++; j-- } return true }',
  'text-wrap-column':
    'function wrapText(text, width) { const lines = []; let line = ""; for (const word of text.split(" ").filter(Boolean)) { if (line && line.length + 1 + word.length <= width) line += " " + word; else { if (line) lines.push(line); line = word } } if (line) lines.push(line); return lines }',
  'debug-date-range-filter':
    'function ordersInRange(orders, from, to) { return orders.filter(order => from <= order.date && order.date <= to).map(order => order.id) }',
  'debug-invoice-rounding':
    'function invoiceCents(lines, taxPercent) { const subtotal = lines.reduce((sum, line) => sum + Math.round(line.price * 100) * line.quantity, 0); return subtotal + Math.round(subtotal * taxPercent / 100) }',
  'debug-reducer-mutation':
    'function applyAction(state, action) { if (action.type === "add") return state.items.includes(action.item) ? state : { items: state.items.concat(action.item), selected: state.selected }; if (action.type === "remove") return { items: state.items.filter(item => item !== action.item), selected: state.selected === action.item ? null : state.selected }; if (action.type === "select") return state.items.includes(action.item) ? { items: state.items, selected: action.item } : state; if (action.type === "clear") return { items: [], selected: null }; return state }',
  'debug-stale-handlers':
    'function handlerLabels(labels, clicks) { const handlers = labels.map((label, index) => () => label + " (button " + (index + 1) + ")"); return clicks.map(index => handlers[index]()) }',
  'ai-empty-input-suggestion':
    'function averageRating(ratings) { let total = 0, count = 0; for (const r of ratings) if (Number.isInteger(r) && r >= 1 && r <= 5) { total += r; count++ } return count === 0 ? null : Math.round(total * 10 / count) / 10 }',
  'ai-invented-api':
    'function titleCase(text) { const words = text.trim().split(/\\s+/).filter(Boolean); return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ") }',
  'ai-expose-wrong-median': `type Case = { values: number[]; expected: number | null }
type Median = (values: number[]) => number | null
const implementations: Record<string, Median> = {
  correct: values => {
    if (values.length === 0) return null
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  },
  'suggestion-a': values => {
    if (values.length === 0) return null
    const sorted = [...values].sort()
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  },
  'suggestion-b': values => {
    if (values.length === 0) return null
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  },
  'suggestion-c': values => {
    if (values.length === 0) return null
    const sorted = values.sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  },
  'suggestion-d': values => {
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  },
}
const cases: Case[] = [
  { values: [10, 9, 2], expected: 9 },
  { values: [4, 1, 3, 2], expected: 2.5 },
  { values: [], expected: null },
  { values: [3, 1, 2], expected: 2 },
]
function exposes(variant: string): boolean {
  for (const c of cases) {
    const copy = [...c.values]
    const result = implementations[variant](copy)
    if (result !== c.expected || JSON.stringify(copy) !== JSON.stringify(c.values)) return true
  }
  return false
}`,
  'autosave-debounce':
    'function autosaves(events, wait, savedText) { const out = []; let last = savedText, pending = null; const flush = at => { if (pending.text !== last) { out.push({ at, text: pending.text }); last = pending.text } pending = null }; for (const e of events) { if (pending && e.at >= pending.due) flush(pending.due); if (e.kind === "edit") pending = { text: e.text, due: e.at + wait }; else if (pending) flush(e.at) } if (pending) flush(pending.due); return out }',
  'scroll-report-throttle':
    'function scrollReports(events, interval) { const out = []; let end = null, kept = null; const close = until => { while (end !== null && end <= until) { if (kept) { out.push({ at: end, y: kept.y }); kept = null; end = end + interval } else end = null } }; for (const e of events) { close(e.at); if (end === null) { out.push({ at: e.at, y: e.y }); end = e.at + interval } else kept = e } close(Infinity); return out }',
  'payment-resubmit':
    'function settlePayments(attempts) { const server = new Map(), latest = new Map(); let charged = 0; const results = attempts.map(a => { latest.set(a.key, a.outcome); if (a.outcome === "lost") return "none"; if (!server.has(a.key)) { server.set(a.key, a.amount); charged += a.amount; return "charged" } return server.get(a.key) === a.amount ? "replayed" : "conflict" }); return { charged, results, unconfirmed: [...latest].filter(([, outcome]) => outcome !== "processed").map(([key]) => key) } }',
  'quote-cache-retry':
    'function quoteLabels(requests, ttl, maxAttempts, outcomes) { let cache = null, used = 0; return requests.map(at => { if (cache && at < cache.at + ttl) return "cache:" + cache.price; for (let i = 0; i < maxAttempts; i++) { const price = used < outcomes.length ? outcomes[used] : null; used++; if (price !== null) { cache = { price, at }; return "fresh:" + price } } return cache ? "stale:" + cache.price : "failed" }) }',
}
