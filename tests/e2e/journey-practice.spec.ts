import { expect, test } from '@playwright/test'
import { editor } from './helpers'

for (const width of [1440, 390]) {
  test(`optional journey practice opens without hints at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/progress')
    const journey = page.locator('.progress-journey').filter({ has: page.getByRole('heading', { name: 'Work through arrays', exact: true }) })
    await journey.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(journey.getByText('4. Later recall', { exact: true })).toBeVisible()
    await expect(journey.getByRole('button', { name: 'Try rep', exact: true })).toHaveCount(2)
    const action = journey.getByRole('button', { name: 'Try rep', exact: true }).first()
    await action.focus()
    await expect(action).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/practice\/sum-in-range/)
    await page.getByRole('button', { name: 'Solve', exact: true }).first().click()
    await expect(editor(page)).toBeVisible()
    await page.getByRole('button', { name: 'Understand', exact: true }).first().click()
    await expect(page.getByText('0 of 3 revealed', { exact: true })).toBeVisible()
    await expect(page.locator('.task-hints')).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(/#\/progress/)
  })
}
