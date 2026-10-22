import { expect, test } from '@playwright/test'
import { expectChecksFinished, replaceCode, route, solution } from './helpers'

const tieBug = solution.replace(' || (count === counts.get(best)! && number < best)', '')

test('a failed check says how the values differ, and rows land failed first in one cascade', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, tieBug)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('5 of 6 checks passed', { exact: true }))
  const checks = page.locator('#checks-section')
  await expect(checks.locator('.value-difference')).toHaveText('Expected 2, received 9: 7 more than expected.')
  // One running place across the failed and passed lists.
  const places = await checks
    .locator('.result-list > li')
    .evaluateAll(rows => rows.map(row => (row as HTMLElement).style.getPropertyValue('--row')))
  expect(places).toEqual(['0', '1', '2', '3', '4', '5'])
})

test('the first all-green run of a never-completed rep says so once', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  const checks = page.locator('#checks-section')
  await expect(checks.getByText('First all-green run on this rep')).toBeVisible()
  // A second green run is not the first one.
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await expect(checks.getByText('First all-green run on this rep')).toHaveCount(0)
})
