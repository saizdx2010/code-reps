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

test('S2 grouped-filter checks catch missing parentheses, inexact categories, and the price boundary', () => {
  const base = solution('sql-filter-groups')
  assertCaught('sql-filter-groups', [
    [
      base.replace("category IN ('Poetry', 'Drama')", "category = 'Poetry' OR category = 'Drama'"),
      'Price and stock rules apply to poetry too',
    ],
    [base.replace("category IN ('Poetry', 'Drama')", "lower(category) IN ('poetry', 'drama')"), 'Category is compared exactly'],
    [base.replace('price_cents < 1500', 'price_cents <= 1500'), 'Cheap poetry and drama in stock'],
    [base.replace(' AND in_stock = 1', ''), 'Cheap poetry and drama in stock'],
  ])
})

test('S2 range checks catch exclusive ends, the beds rule, and the name tie-breaker', () => {
  const base = solution('sql-price-band')
  assertCaught('sql-price-band', [
    [base.replace('BETWEEN 8000 AND 12000', '> 8000 AND nightly_cents < 12000'), 'Both ends of the range count'],
    [base.replace('beds >= 2', 'beds > 2'), 'Both ends of the range count'],
    [base.replace(' AND beds >= 2', ''), 'Both ends of the range count'],
    [base.replace('ORDER BY nightly_cents, name', 'ORDER BY nightly_cents'), 'Equal prices in name order'],
  ])
})

test('S2 pattern checks catch % for a fixed length, a loose prefix, and case-sensitive matching', () => {
  const base = solution('sql-code-pattern')
  assertCaught('sql-code-pattern', [
    [base.replace("'BR-___'", "'BR-%'"), 'Exactly three characters after BR-'],
    [base.replace("'BR-___'", "'%BR-___'"), 'Exactly three characters after BR-'],
    [base.replace("code LIKE 'BR-___'", "code GLOB 'BR-???'"), 'Letter case does not matter'],
  ])
})

test('S2 NULL checks catch a NULL status that blocks, an empty phone, and the id tie-breaker', () => {
  const base = solution('sql-members-to-text')
  assertCaught('sql-members-to-text', [
    [
      base.replace(" AND (status <> 'blocked' OR status IS NULL)", " AND status <> 'blocked'"),
      'A status that was never set does not block',
    ],
    [base.replace("phone <> ''", 'phone IS NOT NULL'), 'Reachable members in name order'],
    [base.replace('ORDER BY name, id', 'ORDER BY name, id DESC'), 'Same name, ordered by id'],
    [base.replace("status <> 'blocked' OR status IS NULL", "status = 'active'"), 'Reachable members in name order'],
  ])
  // SQLite's IS NOT treats NULL as a value, so it is an accepted alternative here.
  assert.deepEqual(failed('sql-members-to-text', base.replace("(status <> 'blocked' OR status IS NULL)", "status IS NOT 'blocked'")), [])
})

test('S2 search checks catch an ungrouped OR, a prefix-only pattern, drafts, and the tie-breaker', () => {
  const base = solution('sql-search-articles')
  assertCaught('sql-search-articles', [
    [
      base.replace(
        "published_at IS NOT NULL AND section IN ('guides', 'news') AND title LIKE '%sql%'",
        "published_at IS NOT NULL AND section = 'guides' OR section = 'news' AND title LIKE '%sql%'",
      ),
      'Drafts and other sections are left out',
    ],
    [base.replace("'%sql%'", "'sql%'"), 'Published guides and news about SQL, newest first'],
    [base.replace('published_at IS NOT NULL AND ', ''), 'Published guides and news about SQL, newest first'],
    [base.replace('published_at DESC, id', 'published_at DESC, id DESC'), 'Published guides and news about SQL, newest first'],
    [base.replace("title LIKE '%sql%'", "title GLOB '*sql*'"), 'Any letter case, anywhere in the title'],
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
