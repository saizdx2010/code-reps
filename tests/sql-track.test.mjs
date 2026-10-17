import assert from 'node:assert/strict'
import test from 'node:test'
import initSqlJs from 'sql.js'
import { runRep } from '../src/runner.ts'
import { reps } from '../src/rep.ts'
import { paths } from '../src/path.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { sqlSolutions } from './fixtures/sql-solutions.mjs'

const SQL = await initSqlJs()
const failed = (id, code) =>
  runRep(code, id, () => new SQL.Database())
    .filter(result => !result.passed)
    .map(result => result.name)
const solution = id => sqlSolutions[id]

/** Each mutant names the authored check that must catch it, so a check that stops testing its boundary fails here. */
function assertCaught(id, mutants) {
  assert.deepEqual(failed(id, solution(id)), [], `${id} reference`)
  for (const [code, check] of mutants) assert.ok(failed(id, code).includes(check), `${id}: "${check}" did not catch ${code}`)
}

test('every SQL track rep is SQL text with a reference query and fresh-database checks', () => {
  const ids = paths.find(path => path.id === 'sql').stages.flatMap(stage => stage.repIds)
  for (const id of ids.filter(item => !item.startsWith('sqlite-'))) {
    const rep = reps.find(item => item.id === id)
    assert.equal(rep.format, 'sql', id)
    assert.equal(rep.functionName, '', id)
    assert.ok(sqlSolutions[id], `${id} needs a reference query`)
    assert.ok(Object.keys(rep.sql.seeds).length >= 3, `${id} needs several data sets`)
  }
})

test('S1 filtering and sorting checks catch boundary, case, NULL, and tie-breaker mistakes', () => {
  const base = solution('sql-filter-sort')
  assertCaught('sql-filter-sort', [
    [base.replace('ORDER BY year, title', 'ORDER BY year'), 'Films from the same year are in title order'],
    [base.replace('year < 2000', 'year <= 2000'), '1999 counts, 2000 does not'],
    [base.replace("genre = 'Drama'", "lower(genre) = 'drama'"), 'Exact genre, and an unknown year is left out'],
    [base.replace('year < 2000', '(year < 2000 OR year IS NULL)'), 'Exact genre, and an unknown year is left out'],
    [base.replace('ORDER BY year, title', 'ORDER BY year DESC, title'), 'Dramas before 2000, oldest first'],
    [base.replace("WHERE genre = 'Drama' AND year < 2000", "WHERE genre = 'Drama'"), 'Dramas before 2000, oldest first'],
  ])
})

test('S1 distinct-city checks catch repeats, inexact country codes, and the wrong order', () => {
  const base = solution('sql-distinct-cities')
  assertCaught('sql-distinct-cities', [
    [base.replace('DISTINCT ', ''), 'Each Norwegian city once, in text order'],
    [base.replace("country = 'NO'", "country = 'NO' COLLATE NOCASE"), 'The country code is compared exactly'],
    [base.replace("country = 'NO'", "city <> ''"), 'A same-named city in another country does not count'],
    [base.replace('ORDER BY city', 'ORDER BY city DESC'), 'Each Norwegian city once, in text order'],
  ])
})

test('S1 calculated-column checks catch a missing direction, tie-breaker, or name, and dropped zero totals', () => {
  const base = solution('sql-line-totals')
  assertCaught('sql-line-totals', [
    [base.replace('total_cents DESC', 'total_cents'), 'Most valuable line first'],
    [base.replace(', product, id;', ';'), 'Equal totals by product name'],
    [base.replace(', product, id;', ', id;'), 'Equal totals by product name'],
    [base.replace('AS total_cents', 'AS total').replace('ORDER BY total_cents', 'ORDER BY total'), 'Most valuable line first'],
    [base.replace('FROM order_lines', 'FROM order_lines\nWHERE quantity * unit_cents > 0'), 'Zero totals still appear'],
  ])
})

test('S1 newest-ticket checks catch a missing filter, direction, tie-breaker, and limit', () => {
  const base = solution('sql-recent-open-tickets')
  assertCaught('sql-recent-open-tickets', [
    [base.replace(', id DESC', ''), 'Same minute: higher id first'],
    [base.replace('id DESC', 'id'), 'Same minute: higher id first'],
    [base.replace('opened_at DESC', 'opened_at'), 'Three newest open tickets'],
    [base.replace("WHERE status = 'open'\n", ''), 'Three newest open tickets'],
    [base.replace('LIMIT 3', 'LIMIT 2'), 'Three newest open tickets'],
    [base.replace('\nLIMIT 3', ''), 'Three newest open tickets'],
  ])
})

test('S1 catalog-page checks catch the wrong page, a missing tie-breaker, and hidden products', () => {
  const base = solution('sql-catalog-page')
  assertCaught('sql-catalog-page', [
    [base.replace('OFFSET 4', 'OFFSET 8'), 'Page 2 of the shelf'],
    [base.replace('OFFSET 4', 'OFFSET 3'), 'Page 2 of the shelf'],
    [base.replace('ORDER BY price_cents, name, id', 'ORDER BY price_cents'), 'Equal prices order by name across the page break'],
    [base.replace('WHERE active = 1\n', ''), 'Page 2 of the shelf'],
    [base.replace('LIMIT 4 OFFSET 4', 'LIMIT 4'), 'Page 2 of the shelf'],
  ])
})

test('the S1 journey keeps recall distinct from its guided and independent reps', () => {
  const journey = journeys.find(item => item.id === 'sql-reading')
  assert.deepEqual(
    [journey.guided, journey.independent, journey.recall],
    ['sql-filter-sort', 'sql-recent-open-tickets', 'sql-catalog-page'],
  )
  assert.equal(recallVariants['sql-reading'][0], journey.recall)
  // Recall adds paging to a fresh table: its contract needs OFFSET, which neither earlier rep uses.
  assert.match(sqlSolutions[journey.recall], /OFFSET/)
  for (const id of [journey.guided, journey.independent]) assert.doesNotMatch(sqlSolutions[id], /OFFSET/)
  const prompt = reps.find(rep => rep.id === journey.independent).prompt
  assert.doesNotMatch(prompt, /LIMIT|DESC|ORDER BY/, 'the independent prompt names no clause')
  assert.doesNotMatch(reps.find(rep => rep.id === journey.recall).prompt, /LIMIT|OFFSET/, 'the recall prompt names no clause')
})
