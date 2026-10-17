import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { editor, expectChecksFinished, replaceCode, saved } from './helpers'
import { sqlSolutions } from '../fixtures/sql-solutions.mjs'

const route = '/#/practice/sql-select-columns'
const solution = sqlSolutions['sql-select-columns']
const run = (page: Page) =>
  page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
const openFailure = (page: Page) => page.locator('#check-details details[open]')

test('a SQL rep shows its tables, loads SQLite in the worker, and compares rows as tables', async ({ page, baseURL }) => {
  const external: string[] = []
  page.on('request', request => {
    if (!request.url().startsWith(baseURL!) && !request.url().startsWith('data:')) external.push(request.url())
  })
  // Hold the engine back briefly so the loading state is observable.
  await page.route('**/sql-wasm*.wasm*', async request => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    await request.continue()
  })
  await page.goto(route)
  await expect(page.getByRole('textbox', { name: /^SQL query for Choose columns with SELECT/ })).toBeVisible()
  await expect(page.locator('.file-tab')).toHaveText('SQL query.sql')
  await expect(page.locator('.editor-foot')).toHaveText(/SQLite · a fresh database for every check\s*One statement · read-only/)

  // The brief draws the starting data from the same schema and seed the checks use.
  const tables = page.locator('details.sql-tables')
  await expect(tables).toHaveAttribute('open', '')
  await expect(tables.locator('summary')).toContainText('1 table · every check starts from a fresh copy')
  await expect(tables.getByRole('region', { name: 'Table books' })).toContainText('5 rows')
  await expect(tables.locator('.sql-definition')).toContainText('id INTEGER PRIMARY KEY · title TEXT NOT NULL')
  await expect(tables.getByRole('table', { name: 'First rows of books' }).getByRole('row')).toHaveCount(4)
  await expect(tables).toContainText('+ 2 more rows')
  await expect(page.getByRole('table', { name: 'Example result rows' }).getByRole('columnheader', { name: 'published' })).toBeVisible()
  await tables.locator('summary').click()
  await expect(tables).not.toHaveAttribute('open', '')
  // The toggle event that records the choice runs as its own task; wait for it before reloading.
  await expect
    .poll(() => page.evaluate(() => Object.entries(sessionStorage).find(([key]) => key.endsWith(':sql-tables:sql-select-columns'))?.[1]))
    .toBe('closed')
  await page.reload()
  await expect(page.locator('details.sql-tables')).not.toHaveAttribute('open', '')
  await page.locator('details.sql-tables summary').click()

  // The starter selects every stored column: columns are reported first, and the learner rows keep their own headings.
  await run(page)
  await expect(page.getByText('Loading SQLite', { exact: true })).toBeVisible()
  await expectChecksFinished(page.getByText('0 of 5 checks passed', { exact: true }))
  await page.unroute('**/sql-wasm*.wasm*')
  const failure = openFailure(page)
  await expect(failure.locator('summary')).toHaveText('Every book, with three named columns')
  await expect(failure).toContainText(
    'Your query returned 5 columns (id, title, author, year, pages); expected 3: title, author, published.',
  )
  await expect(failure).toContainText('Starting data: five books, two of them by Ursula K. Le Guin')
  const expected = failure.getByRole('table', { name: 'Expected · 5 rows · order does not matter' })
  const received = failure.getByRole('table', { name: 'Received · 5 rows' })
  await expect(expected.getByRole('columnheader', { name: 'published' })).toBeVisible()
  await expect(received.getByRole('columnheader', { name: 'pages' })).toBeAttached()
  await expect(received.getByRole('row')).toHaveCount(6)
  // The tables scroll inside their own region, which keyboard users can reach.
  await failure.getByRole('region', { name: 'Received · 5 rows' }).focus()
  await expect(failure.getByRole('region', { name: 'Received · 5 rows' })).toBeFocused()

  // A wrong cell shows both values; an extra row says so in words.
  await replaceCode(
    page,
    "SELECT title, author, CASE WHEN year = 1987 THEN 1988 ELSE year END AS published FROM books UNION ALL SELECT 'Extra', 'Someone', NULL",
    'sql-select-columns',
  )
  await run(page)
  await expectChecksFinished(page.getByText('0 of 5 checks passed', { exact: true }))
  await expect(openFailure(page)).toContainText('First difference: row 1, published — expected 1987, received 1988.')
  await expect(openFailure(page).locator('.sql-cell-wrong')).toHaveText('1988 expected 1987')
  await expect(openFailure(page).getByText('Extra row', { exact: true })).toBeVisible()
  await expect(openFailure(page).locator('.sql-null').first()).toHaveText('NULL')
  expect(external).toEqual([])
})

test('SQL guards, SQLite errors, and a labelled missing row lead to a completed SQL rep', async ({ page, baseURL }) => {
  const external: string[] = []
  page.on('request', request => {
    if (!request.url().startsWith(baseURL!) && !request.url().startsWith('data:')) external.push(request.url())
  })
  await page.goto(route)

  // Read-only reps refuse a second statement before anything runs, and undo and report a change.
  await replaceCode(page, `DELETE FROM books;\n${solution}`, 'sql-select-columns')
  await run(page)
  await expectChecksFinished(page.getByText('0 of 5 checks passed', { exact: true }))
  await expect(openFailure(page)).toContainText('Submit exactly one statement.')
  await replaceCode(page, 'DELETE FROM books WHERE id = 1', 'sql-select-columns')
  await run(page)
  await expectChecksFinished(page.getByText('0 of 5 checks passed', { exact: true }))
  await expect(openFailure(page)).toContainText(
    'This rep expects a read-only query, but yours deleted 1 row from books. The change was undone, so every other check starts from the same data.',
  )

  // SQLite's own complaint, located with a caret, replaces the check list when nothing could run.
  await replaceCode(page, 'SELECT title, author\nFORM books', 'sql-select-columns')
  await run(page)
  await expectChecksFinished(page.getByText('SQLite could not run the query', { exact: true }).first())
  await expect(page.locator('.sql-error-code')).toContainText('near "books": syntax error')
  await expect(page.locator('.sql-error-code')).toContainText('2 │ FORM books')
  await expect(page.locator('.sql-error-code')).toContainText('^^^^^')
  await expect(page.locator('.sql-error')).toContainText('No checks ran. Your query is unchanged: fix line 2 and run the checks again.')

  // DISTINCT merges the duplicated copies: one boundary fails, and the missing row is labelled.
  await replaceCode(page, solution.replace('SELECT', 'SELECT DISTINCT'), 'sql-select-columns')
  await run(page)
  await expectChecksFinished(page.getByText('4 of 5 checks passed', { exact: true }))
  const copies = openFailure(page)
  await expect(copies.locator('summary')).toHaveText('Both copies of a duplicated book stay')
  await expect(copies).toContainText(/First difference: expected row [12] is missing\./)
  await expect(copies.getByRole('table', { name: 'Expected · 3 rows · order does not matter · received 2' })).toBeVisible()
  await expect(copies.getByText('Missing row', { exact: true })).toHaveCount(1)

  // An edit makes the results out of date; the draft runs again on a fresh database.
  await replaceCode(page, solution, 'sql-select-columns')
  await expect(page.locator('.checks-drawer')).toContainText('Out of date')
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('ControlOrMeta+Enter')
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  }

  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page
    .getByLabel('Your explanation', { exact: true })
    .fill('I list title, author, and year AS published. No WHERE or DISTINCT, so both Emma copies stay and a NULL year stays NULL.')
  await page.getByText('Compare with a model answer', { exact: true }).click()
  await expect(page.locator('.reflection-guide')).toContainText('I select title, author, and year AS published from books.')
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Rep completed', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await expect(page.getByText('Rep completed', { exact: true })).toBeVisible()
  expect(external).toEqual([])
})

test('stopping a long SQL run keeps the draft, and a fresh run works', async ({ page }) => {
  await page.goto(route)
  const endless = 'WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n) SELECT count(*), 0, 0 FROM n;'
  await replaceCode(page, endless, 'sql-select-columns')
  await run(page)
  await page.getByRole('button', { name: 'Stop checks', exact: true }).click()
  await expect(page.getByText('Checks stopped. Your code is unchanged; run again when you are ready.')).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('WITH RECURSIVE')
  await replaceCode(page, solution, 'sql-select-columns')
  await run(page)
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
})

test('a failed editor load keeps the SQL draft in a plain text editor that still runs checks', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution, 'sql-select-columns')
  await saved(page)
  await page.route('**/src/CodeEditor.tsx*', request => request.abort())
  await page.reload()
  await expect(page.getByText('The code editor could not load.', { exact: false })).toBeVisible()
  const fallback = page.getByLabel('QUERY.SQL', { exact: true })
  await expect(fallback).toHaveValue(solution)
  await expect(page.locator('.editor-foot')).toContainText('One statement · read-only')
  await fallback.fill(solution + '\n-- Continued in the fallback editor')
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await saved(page)
  await page.unroute('**/src/CodeEditor.tsx*')
  await page.reload()
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('Continued in the fallback editor')
})

test('SQL tables and results stay inside their boxes at a phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(route)
  await expect(page.locator('details.sql-tables summary')).toContainText('1 table')
  await expect(page.locator('.sql-tables-fresh')).toBeHidden()
  await page.getByRole('button', { name: 'Solve', exact: true }).click()
  await run(page)
  await expectChecksFinished(page.getByText('0 of 5 checks passed', { exact: true }))
  const received = openFailure(page).getByRole('region', { name: 'Received · 5 rows' })
  await expect(received).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
