import { expect, test } from '@playwright/test'

for (const width of [1280, 390]) {
  test(`daily entry names the goal and skill and opens the next rep by keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/home')
    await page.locator('.starting-point-settings > summary').click()
    await page.getByRole('button', { name: /New to coding/ }).click()
    await expect(page.getByText('Your trail · Active learning goal')).toBeVisible()
    await expect(page.getByText('Browsing another track does not change your learning goal.')).toBeVisible()
    await expect(page.locator('.continue-panel')).toContainText('Values, types, and functions')
    await expect(page.locator('.continue-panel')).toContainText('Afterward')
    const choices = page.locator('.list-group').filter({ hasText: "Choose today's practice" })
    await expect(choices.locator('.list-row')).toHaveCount(1)
    await expect(choices).not.toContainText('Continue saved draft')
    await expect(choices).not.toContainText('Due review')
    await choices.getByRole('button').focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/practice\/declare-variables$/)
    await page.goBack()
    await expect(choices).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
