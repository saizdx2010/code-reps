import { expect, test } from '@playwright/test'
import { domSolutions } from '../fixtures/dom-solutions.mjs'
import { dsaSolutions } from '../fixtures/dsa-solutions.mjs'
import { reactSolutions } from '../fixtures/react-solution.mjs'
import { sqliteCustomerTotalsSolution, sqliteRestockSolution } from '../fixtures/sqlite-solution.mjs'
import { expectChecksFinished, replaceCode } from './helpers'

// Real-browser coverage for the expanded runners: SQLite reps chosen by ID in the worker, DOM widgets that depend on
// real focus, React request responses, and a table trace in the post-solve review.
const runChecks = (page: import('@playwright/test').Page) =>
  page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()

for (const [id, code] of [
  ['sqlite-customer-totals', sqliteCustomerTotalsSolution],
  ['sqlite-restock-upsert', sqliteRestockSolution],
  ['dom-reorder-list', domSolutions['dom-reorder-list']],
  ['dom-modal-dialog', domSolutions['dom-modal-dialog']],
  ['dom-combobox', domSolutions['dom-combobox']],
  ['react-row-keys', reactSolutions['react-row-keys']],
  ['react-stale-request', reactSolutions['react-stale-request']],
] as const)
  test(`the reference passes every check in the browser: ${id}`, async ({ page }) => {
    await page.goto(`/#/practice/${id}`)
    await replaceCode(page, code, id)
    await runChecks(page)
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  })

test('a dynamic programming table trace steps through the filled grid', async ({ page }) => {
  await page.goto('/#/practice/dp-garage-paths')
  await replaceCode(page, dsaSolutions['dp-garage-paths'], 'dp-garage-paths')
  await runChecks(page)
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByText('Compare with a model answer', { exact: true }).click()
  const viewer = page.getByRole('region', { name: 'Step trace' })
  await viewer.focus()
  await expect(viewer.locator('.trace-note')).toContainText('Step 1 of 10')
  await viewer.getByRole('button', { name: 'Go to step 9', exact: true }).click()
  await expect(viewer).toContainText('The finish adds the route around the right side')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(viewer).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
