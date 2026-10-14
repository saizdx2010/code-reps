import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { expectChecksFinished, replaceCode } from './helpers'

const solution = readFileSync(new URL('../fixtures/sqlite-solution.mjs', import.meta.url), 'utf8').split('`')[1]

test('browser-only SQLite queries, rollback, fresh runs, review, and saved completion', async ({ page, baseURL }) => {
  const external: string[] = []
  page.on('request', request => {
    if (!request.url().startsWith(baseURL!) && !request.url().startsWith('data:')) external.push(request.url())
  })
  await page.goto('/#/practice/sqlite-stock-transfer')
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Begin, debit, credit, insert, commit; roll back either constraint failure.')
  await replaceCode(page, solution.replace("db.run('ROLLBACK')", ''), 'sqlite-stock-transfer')
  await page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
  await expectChecksFinished(page.getByText('3 of 7 checks passed', { exact: true }))
  await replaceCode(page, solution, 'sqlite-stock-transfer')
  for (let i = 0; i < 2; i++) {
    await page
      .locator('.workspace-toolbar')
      .getByRole('button', { name: /Run checks/ })
      .click()
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  }
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page
    .getByLabel('Your explanation', { exact: true })
    .fill('The audit insert can fail after both updates. Rollback restores both warehouses and preserves the existing audit row.')
  await page.getByText('Compare your plan and explanation', { exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Trace a boundary case' })).toBeVisible()
  await expect(page.locator('.reflection-guide')).toContainText('ROLLBACK restores 10 and 3')
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Rep completed', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await expect(page.getByText('Rep completed', { exact: true })).toBeVisible()
  expect(external).toEqual([])
})

test('the spend report runs a grouped query against real SQLite in the browser', async ({ page }) => {
  await page.goto('/#/practice/sqlite-spend-report')
  await replaceCode(
    page,
    "function spendReport(db: { query(sql: string, parameters?: (number | string | null)[]): (number | string | null)[][] }, minimumCents: number) { return db.query(\"SELECT c.name, COUNT(o.id), COALESCE(SUM(o.cents), 0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid' GROUP BY c.id HAVING total >= ? ORDER BY total DESC, c.name\", [minimumCents]) }",
    'sqlite-spend-report',
  )
  await page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await replaceCode(
    page,
    "function spendReport(db: { query(sql: string, parameters?: (number | string | null)[]): (number | string | null)[][] }, minimumCents: number) { return db.query(\"SELECT c.name, COUNT(*), SUM(o.cents) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid' GROUP BY c.id HAVING total >= ? ORDER BY total DESC, c.name\", [minimumCents]) }",
    'sqlite-spend-report',
  )
  await page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
  await expectChecksFinished(page.locator('.result-summary.failed'))
  await expect(page.locator('.result-summary')).not.toContainText('All checks passed')
})
