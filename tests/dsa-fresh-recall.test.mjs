import assert from 'node:assert/strict'
import test from 'node:test'
import { recallVariants } from '../src/fluency.ts'
import { runRep } from '../src/runner.ts'

const variants = {
  windows: ['shortest-run-reaching-target', 'count-unique-windows', 'algo-window-sum', 'quiet-sensor-span'],
  'two-pointers': ['reading-run-summary', 'sorted-offset-squares', 'algo-sorted-pair', 'shared-seat-occurrences'],
  sorting: ['closest-value-gap', 'sort-score-records', 'algo-merge-sorted', 'dispatch-priority-order', 'kth-smallest-copy'],
  'binary-search': ['smallest-daily-capacity', 'first-insertion-point', 'algo-binary-search', 'first-affordable-edition'],
  recursion: ['count-object-leaves', 'flatten-nested-numbers', 'algo-recursive-sum', 'nested-parcel-load'],
  trees: ['tree-value-path', 'tree-depth-sum', 'algo-tree-depth', 'terminal-folder-paths'],
  graphs: ['graph-connected-groups', 'graph-shortest-hops', 'algo-graph-reachable', 'broadcast-unreached-stations'],
}

test('fresh DSA recall applications append without changing evidence-sensitive order', () => {
  for (const [journey, ids] of Object.entries(variants)) assert.deepEqual(recallVariants[journey], ids)
})

test('fresh recall checks reject characteristic contract mistakes', () => {
  const mistakes = {
    'quiet-sensor-span': 'function quietSpan(readings, threshold, allowance) { return readings.filter(x => x < threshold).length }',
    'shared-seat-occurrences': 'function sharedSeats(left,right) { return [...new Set(left)].filter(x => right.includes(x)) }',
    'dispatch-priority-order':
      'function dispatchOrder(requests) { return [...requests].sort((a,b)=>a.deadline-b.deadline || b.urgency-a.urgency).map(x=>x.id) }',
    'first-affordable-edition': 'function firstAffordable(costs,budget) { return costs.indexOf(budget) }',
    'nested-parcel-load':
      'function parcelLoad(parcel) { return typeof parcel === "number" ? parcel : parcel.flat(Infinity).reduce((a,b)=>a+b,0) }',
    'terminal-folder-paths':
      'function folderPaths(root) { if(!root) return []; if(!root.children.length) return [[root.name]]; return [...root.children].sort((a,b)=>a.name.localeCompare(b.name)).flatMap(child=>folderPaths(child).map(path=>[root.name,...path])) }',
    'broadcast-unreached-stations':
      'function unreachedStations(links,seeds) { const seen=new Set(seeds); let change=true; while(change) { change=false; for(let i=0;i<links.length;i++) for(const j of links[i]) if(seen.has(i)||seen.has(j)) { if(!seen.has(i)||!seen.has(j)) change=true; seen.add(i); seen.add(j) } } return links.map((_,i)=>i).filter(i=>!seen.has(i)) }',
  }
  for (const [id, code] of Object.entries(mistakes)) {
    assert.ok(
      runRep(code, id).some(result => !result.passed),
      `${id}: accepted a known contract mistake`,
    )
  }
})
