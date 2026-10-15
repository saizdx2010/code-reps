import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { dsaDpHeapReps } from '../src/dsa-dp-heap-reps.ts'
import { skills } from '../src/knowledge.ts'
import { repDepth } from '../src/rep-depth.ts'

// tests/content.test.mjs runs each reference against its authored checks.
test('dynamic programming and heap checks reject characteristic mistakes', () => {
  const mistakes = {
    'dp-garage-paths': [
      // Ignores blocked cells.
      'function garageRoutes(grid) { const w = grid.map(row => row.map(() => 0)); for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) w[r][c] = r === 0 && c === 0 ? 1 : (r ? w[r-1][c] : 0) + (c ? w[r][c-1] : 0); return w.at(-1).at(-1) }',
      // Seeds the start even when it is blocked.
      'function garageRoutes(grid) { const w = grid.map(row => row.map(() => 0)); for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) w[r][c] = r === 0 && c === 0 ? 1 : grid[r][c] ? 0 : (r ? w[r-1][c] : 0) + (c ? w[r][c-1] : 0); return w.at(-1).at(-1) }',
      // Treats the edge as one route.
      'function garageRoutes(grid) { const w = grid.map(row => row.map(() => 0)); for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) w[r][c] = grid[r][c] ? 0 : r === 0 || c === 0 ? 1 : w[r-1][c] + w[r][c-1]; return w.at(-1).at(-1) }',
    ],
    'dp-stall-revenue': [
      // Rents the highest stall first.
      'function bestRevenue(revenues) { const used = revenues.map(() => false); let total = 0; const order = revenues.map((v, i) => i).sort((a, b) => revenues[b] - revenues[a]); for (const i of order) if (!used[i] && !used[i-1] && !used[i+1]) { used[i] = true; total += revenues[i] } return total }',
      // Compares even and odd positions only.
      'function bestRevenue(revenues) { let even = 0, odd = 0; revenues.forEach((v, i) => i % 2 ? odd += v : even += v); return Math.max(even, odd) }',
    ],
    'dp-tag-edits': [
      // Compares positions one to one.
      'function tagEdits(from, to) { let edits = Math.abs(from.length - to.length); for (let i = 0; i < Math.min(from.length, to.length); i++) if (from[i] !== to[i]) edits++; return edits }',
      // Ignores case.
      'function tagEdits(from, to) { from = from.toLowerCase(); to = to.toLowerCase(); const d = []; for (let i = 0; i <= from.length; i++) { d[i] = [i]; for (let j = 1; j <= to.length; j++) d[i][j] = i === 0 ? j : from[i-1] === to[j-1] ? d[i-1][j-1] : 1 + Math.min(d[i-1][j-1], d[i-1][j], d[i][j-1]) } return d[from.length][to.length] }',
      // Counts characters missing from the other tag.
      'function tagEdits(from, to) { const a = [...from], b = [...to]; for (const ch of from) { const i = b.indexOf(ch); if (i >= 0) { b.splice(i, 1); a.splice(a.indexOf(ch), 1) } } return Math.max(a.length, b.length) }',
    ],
    'heap-merge-log-streams': [
      // Breaks ties by name.
      'function mergeStreams(streams) { return streams.flatMap(s => s.times.map(at => ({ at, name: s.name }))).sort((a, b) => a.at - b.at || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) }',
      // Shifts the caller’s arrays.
      'function mergeStreams(streams) { const out = []; for (;;) { let best = -1; streams.forEach((s, i) => { if (s.times.length && (best < 0 || s.times[0] < streams[best].times[0])) best = i }); if (best < 0) return out; out.push({ at: streams[best].times.shift(), name: streams[best].name }) } }',
    ],
    'heap-rooms-needed': [
      // Treats touching meetings as overlapping.
      'function roomsNeeded(meetings) { const ev = meetings.flatMap(([s, e]) => [[s, 1], [e, -1]]).sort((a, b) => a[0] - b[0] || b[1] - a[1]); let open = 0, most = 0; for (const [, c] of ev) { open += c; most = Math.max(most, open) } return most }',
      // Places meetings in input order.
      'function roomsNeeded(meetings) { const ends = []; for (const [s, e] of meetings) { ends.sort((a, b) => a - b); if (ends.length && ends[0] <= s) ends.shift(); ends.push(e) } return ends.length }',
    ],
    'heap-kth-largest-stream': [
      // Removes duplicate scores.
      'function cutoffs(scores, k) { return scores.map((_, i) => { const top = [...new Set(scores.slice(0, i + 1))].sort((a, b) => b - a); return top.length < k ? null : top[k - 1] }) }',
      // Reports 0 before k scores arrive.
      'function cutoffs(scores, k) { return scores.map((_, i) => { const top = scores.slice(0, i + 1).sort((a, b) => b - a); return top.length < k ? 0 : top[k - 1] }) }',
      // Reads the highest score instead of the kth.
      'function cutoffs(scores, k) { return scores.map((_, i) => i + 1 < k ? null : Math.max(...scores.slice(0, i + 1))) }',
    ],
  }
  for (const [id, codes] of Object.entries(mistakes))
    for (const code of codes)
      assert.ok(
        runRep(code, id).some(check => !check.passed),
        `${id} accepted: ${code.slice(0, 80)}`,
      )
})

test('starters do not pass their checks', () => {
  for (const rep of dsaDpHeapReps)
    assert.ok(
      runRep(rep.starter, rep.id).some(check => !check.passed),
      rep.id,
    )
})

test('the dynamic programming and heap journeys are distinct and linked from lessons', () => {
  const dp = journeys.find(journey => journey.id === 'dynamic-programming')
  assert.deepEqual([dp.guided, dp.independent, dp.recall], ['dp-garage-paths', 'dp-stall-revenue', 'dp-tag-edits'])
  const heaps = journeys.find(journey => journey.id === 'heaps')
  assert.deepEqual([heaps.guided, heaps.independent, heaps.recall], ['algo-min-heap', 'heap-merge-log-streams', 'heap-rooms-needed'])
  for (const journey of [dp, heaps]) assert.equal(recallVariants[journey.id][0], journey.recall)
  for (const [lesson, journey] of [
    ['dynamic-programming', dp],
    ['heaps', heaps],
  ]) {
    const skill = skills.find(skill => skill.id === lesson)
    for (const id of [journey.guided, journey.independent, journey.recall]) assert.ok(skill.repIds.includes(id), `${lesson}: ${id}`)
  }
})

test('independent and recall prompts do not name the technique', () => {
  for (const id of ['dp-stall-revenue', 'dp-tag-edits', 'heap-merge-log-streams', 'heap-rooms-needed']) {
    const rep = dsaDpHeapReps.find(rep => rep.id === id)
    assert.doesNotMatch(`${rep.prompt} ${rep.context ?? ''} ${rep.planPrompt}`, /dynamic programming|table|heap|priority queue|memo/i, id)
  }
  assert.ok(repDepth['dp-tag-edits'].traceSteps)
})
