import { test, expect } from '@playwright/test'
import { replaceCode, expectChecksFinished } from './helpers'
import { reactSolution } from '../fixtures/react-solution.mjs'
test('React TSX renders, checks cleanup, and completes the review flow', async ({ page }) => {
  await page.goto('/#/practice/react-channel-counter')
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page
    .getByLabel('Your plan', { exact: true })
    .fill('Keep total in state and release each channel subscription when the effect ends.')
  await replaceCode(page, reactSolution, 'react-channel-counter')
  await page.getByRole('button', { name: 'Update preview', exact: true }).click()
  const preview = page.frameLocator('iframe[title="Your React channel counter"]')
  await expect(preview.getByTestId('total')).toHaveText('north: 0')
  await preview.getByRole('button', { name: 'Reset', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(preview.getByTestId('total')).toHaveText('north: 0')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Solve', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page
    .getByLabel('Your explanation', { exact: true })
    .fill(
      'The functional update adds to current state. The effect returns unsubscribe and depends on channel and source, so switching removes the old listener and unmount removes the final one.',
    )
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
})
