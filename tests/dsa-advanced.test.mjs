import assert from 'node:assert/strict'
import test from 'node:test'
import { dsaAdvancedReps } from '../src/dsa-advanced-reps.ts'
import { compileSolution } from '../src/compile-solution.ts'
import { runRep } from '../src/runner.ts'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'

for (const rep of dsaAdvancedReps) {
  test(`advanced reference meets every authored check: ${rep.id}`, () => {
    assert.ok(runRep(dsaSolutions[rep.id], rep.id).every(check => check.passed))
  })
}

test('advanced checks reject endpoint, ordering, base-case, greedy, and stack mistakes', () => {
  const mistakes = {
    'algo-prefix-sums': 'function rangeSums(a,q) { return q.map(([l,r])=>a.slice(l,r).reduce((s,v)=>s+v,0)) }',
    'algo-merge-intervals': 'function mergeIntervals(a) { const out=[]; for(const [s,e] of [...a].sort((a,b)=>a[0]-b[0])) { const last=out.at(-1); if(last && s<last[1]) last[1]=e; else out.push([s,e]) } return out }',
    'algo-linked-list-reverse': 'function reverseList(head) { return head }',
    'algo-min-heap': 'function heapPops(ops) { const stack=[],out=[]; for(const op of ops) if(op.type==="push") stack.push(op.value); else out.push(stack.pop() ?? null); return out }',
    'algo-subsets': 'function subsets(a) { let out=[[]]; for(const v of a) out=out.concat(out.map(s=>[...s,v])); return out }',
    'algo-climb-stairs': 'function climbStairs(n) { if(n===0) return 0; let a=1,b=1; for(let i=2;i<=n;i++) [a,b]=[b,a+b]; return b }',
    'algo-coin-change': 'function coinChange(coins,amount) { let n=0; for(const coin of [...coins].sort((a,b)=>b-a)) while(amount>=coin) { amount-=coin; n++ } return amount ? -1 : n }',
  }
  for (const [id, code] of Object.entries(mistakes)) {
    assert.ok(runRep(code, id).some(check => !check.passed), id)
  }
})

test('linked-list reference allocates fresh nodes and leaves input links unchanged', () => {
  const source = compileSolution(dsaSolutions['algo-linked-list-reverse'], 'reverseList')
  const reverse = new Function(`${source}\nreturn reverseList`)()
  const tail = { value: 0, next: null }
  const head = { value: 2, next: tail }
  const result = reverse(head)
  assert.deepEqual(result, { value: 0, next: { value: 2, next: null } })
  for (let p = result; p; p = p.next) {
    assert.notEqual(p, head)
    assert.notEqual(p, tail)
  }
  assert.equal(head.next, tail)
  assert.equal(tail.next, null)
  assert.notEqual(reverse(tail), tail)
})

const heap = `function heapPops(operations) {
  const heap=[], out=[]
  for (const op of operations) {
    if (op.type==='push') {
      heap.push(op.value)
      let i=heap.length-1
      while(i>0) {
        const parent=Math.floor((i-1)/2)
        if(heap[parent]<=heap[i]) break
        ;[heap[parent],heap[i]]=[heap[i],heap[parent]]
        i=parent
      }
    } else if (!heap.length) out.push(null)
    else {
      out.push(heap[0])
      const last=heap.pop()
      if(!heap.length) continue
      heap[0]=last
      let i=0
      while(2*i+1<heap.length) {
        let child=2*i+1
        if(child+1<heap.length && heap[child+1]<heap[child]) child++
        if(heap[i]<=heap[child]) break
        ;[heap[i],heap[child]]=[heap[child],heap[i]]
        i=child
      }
    }
  }
  return out
}`

test('the taught heap repair satisfies interleaved, duplicate, and child-branch checks', () => {
  assert.ok(runRep(heap, 'algo-min-heap').every(check => check.passed))
})

test('nested linked-list mutations are reported separately', () => {
  const code = 'function reverseList(head) { const values=[]; for(let p=head;p;p=p.next) { values.push(p.value); p.value++ } let out=null; for(const value of values) out={value,next:out}; return out }'
  assert.ok(runRep(code, 'algo-linked-list-reverse').some(check => check.message?.includes('changed its input')))
})
