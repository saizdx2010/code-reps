import assert from 'node:assert/strict'
import test from 'node:test'
import { reps } from '../src/rep.ts'
import { repDepth } from '../src/rep-depth.ts'
import { paths } from '../src/path.ts'
import { skills } from '../src/knowledge.ts'
import { runRep } from '../src/runner.ts'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'
import { assertMutantsFail } from './helpers/checks.mjs'

const ids = ['next-warmer-day', 'top-k-frequent-tags', 'course-order', 'longest-shared-sequence']
for (const id of ids) {
  test(`advanced application reference passes every authored check: ${id}`, () => {
    const rep = reps.find(rep => rep.id === id)
    const results = runRep(dsaSolutions[id], id)
    assert.equal(results.length, rep.checks.length)
    assert.ok(results.every(result => result.passed), JSON.stringify(results.filter(result => !result.passed)))
    assert.equal(rep.preserveInput, true)
    assert.doesNotMatch(rep.prompt + rep.planPrompt + rep.starter, /monotonic|heap|bucket|topological|dynamic programming|\bDP\b/i)
    assert.ok(rep.checks.some(check => /Maximum/.test(check.name)))
  })
}

test('array and nested prerequisite mutation remains detectable', () => {
  for (const [id, mutation] of [
    ['next-warmer-day', 'temperatures.push(0)'],
    ['top-k-frequent-tags', "tags.push('changed')"],
    ['course-order', 'if (prerequisites.length) prerequisites[0][0] = -1'],
  ]) {
    const source = dsaSolutions[id].replace('{', `{ ${mutation};`)
    assert.ok(runRep(source, id).some(result => !result.passed && /mutat|chang/i.test(result.message ?? result.actual ?? '')), id)
  }
})

test('checks expose strict-warmth, cutoff ties, eligible ordering, cycles, and subsequence mistakes', () => {
  const wrong = [
    ['next-warmer-day', dsaSolutions['next-warmer-day'].replace('temperatures[j]>t', 'temperatures[j]>=t')],
    ['top-k-frequent-tags', dsaSolutions['top-k-frequent-tags'].replace('(a<b?-1:a>b?1:0)', '0')],
    ['course-order', 'function courseOrder(n,p) { const pending=Array.from({length:n},(_,i)=>i),done=[]; while(pending.length) { const i=pending.findIndex(c=>p.every(([a,b])=>a!==c||done.includes(b))); if(i<0)return done; done.push(pending.splice(i,1)[0]) } return done }'],
    ['course-order', 'function courseOrder(n,p) { const q=[], degree=Array(n).fill(0),out=[]; for(const [c] of p)degree[c]++; for(let c=0;c<n;c++)if(!degree[c])q.push(c); while(q.length){const c=q.shift();out.push(c);for(const [d,pre] of p)if(pre===c&&!--degree[d])q.push(d)} return out.length===n?out:[] }'],
    ['longest-shared-sequence', 'function longestSharedSequence(a,b) { let n=0; for(const c of a){const i=b.indexOf(c);if(i>=0){n++;b=b.slice(0,i)+b.slice(i+1)}}return n }'],
    ['longest-shared-sequence', 'function longestSharedSequence(a,b) { let best=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<=a.length;j++)if(b.includes(a.slice(i,j)))best=Math.max(best,j-i);return best }'],
  ]
  assertMutantsFail(wrong)
})

test('new mixed stage alternates patterns and keeps every new rep in Problem solving', () => {
  const recognition = paths.find(path => path.id === 'pattern-recognition')
  const stage = recognition.stages.find(stage => stage.title === 'Choose under pressure')
  assert.equal(stage.title, 'Choose under pressure')
  assert.deepEqual(stage.repIds, ['next-warmer-day', 'top-k-frequent-tags', 'algo-prefix-sums', 'course-order', 'longest-shared-sequence', 'algo-subsets'])
  const patterns = { 'next-warmer-day': 'monotonic', 'top-k-frequent-tags': 'ranking', 'algo-prefix-sums': 'prefix', 'course-order': 'dependency', 'longest-shared-sequence': 'dp', 'algo-subsets': 'enumeration' }
  stage.repIds.slice(1).forEach((id, index) => assert.notEqual(patterns[id], patterns[stage.repIds[index]]))
  const problem = paths.find(path => path.id === 'algorithms-data-structures')
  assert.equal(problem.stages.at(-2).title, 'Harder patterns')
  for (const id of ids) assert.equal(problem.stages.flatMap(stage => stage.repIds).filter(repId => repId === id).length, 1)
})

test('new recognition questions retain unique identities and explain all three candidates', () => {
  const questions = skills.find(skill => skill.id === 'recognize-the-pattern').questions
  const contracts = [['recognition-warmer-readings-v1', 0], ['recognition-course-dependencies-v1', 1], ['recognition-shared-message-v1', 2]]
  for (const [id, answer] of contracts) {
    const question = questions.find(question => question.id === id)
    assert.equal(questions.filter(question => question.id === id).length, 1)
    assert.equal(question.answer, answer)
    assert.equal(question.options.length, 3)
    assert.ok(question.explanation.length > 200)
  }
})

test('visual traces show equality, ordered tie buckets, changing eligibility, and DP reads', () => {
  const warmer = repDepth['next-warmer-day'].traceSteps.steps
  assert.deepEqual(warmer.map(step => step.structure.values), [[], [0], [0,1], [0,1,2], [0,1], [0], [], [3], [3]])
  assert.equal(warmer.at(-1).vars.result, '[3,2,1,0]')
  const tags = repDepth['top-k-frequent-tags'].traceSteps.steps
  assert.deepEqual(tags[5].structure.entries, [['web',2], ['api',2], ['app',1]])
  assert.deepEqual(tags[7].structure.entries, [['2','api, web'], ['1','app']])
  const courses = repDepth['course-order'].traceSteps.steps
  assert.deepEqual(courses.slice(3,7).map(step => step.vars.next), [0,1,2,3])
  assert.deepEqual(courses[4].structure.entries, [['0','done'], ['1','done'], ['2',0], ['3',0]])
  const dp = repDepth['longest-shared-sequence'].traceSteps.steps
  assert.deepEqual(dp.slice(1,5).map(step => step.structure.current), [[1,1], [1,2], [2,1], [2,2]])
  for (const step of dp.slice(1,5)) {
    const { cells, current: [i,j], reads } = step.structure
    const expected = 'ab'[i-1] === 'ba'[j-1] ? cells[i-1][j-1]+1 : Math.max(cells[i-1][j],cells[i][j-1])
    assert.equal(cells[i][j], expected)
    assert.deepEqual(reads, 'ab'[i-1] === 'ba'[j-1] ? [[i-1,j-1]] : [[i-1,j],[i,j-1]])
  }
})
