import { test, expect } from '@playwright/test'
import { saved } from './helpers'

for (const width of [1280, 320]) {
  test(`English starters and optional Indonesian help preserve writing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#/practice/frontend-sort-table')
    // Indonesian help is an on/off toggle that says its state, like the other settings.
    const help = page.getByRole('button', { name: 'Show Indonesian help', exact: true })
    await expect(help).toHaveAttribute('aria-pressed', 'false')
    await expect(help).toContainText('Off')
    await page.locator('.vocab > summary').click()
    await expect(page.locator('.vocab')).toContainText('Mutation')
    await expect(page.locator('.indonesian-gloss')).toHaveCount(0)
    await help.focus()
    await help.press('Space')
    await expect(help).toHaveAttribute('aria-pressed', 'true')
    await expect(help).toContainText('On')
    await expect(
      page
        .locator('.vocab p > span')
        .filter({ has: page.locator('b', { hasText: /^Mutation$/ }) })
        .locator('[lang="id"]'),
    ).toContainText('mengubah data yang sudah ada')
    await page.getByRole('button', { name: 'Plan', exact: true }).click()
    const plan = page.getByLabel('Your plan', { exact: true })
    await plan.fill('Keep the input unchanged.')
    const starter = page.getByRole('button', { name: 'My approach is', exact: true })
    // Starters share the reflection chips' pill shape, and the step ends with the way to the next one.
    const reflectionChip = page.locator('#review-section .choice-chips button').first()
    expect(await starter.evaluate(element => getComputedStyle(element).borderRadius)).toBe(
      await reflectionChip.evaluate(element => getComputedStyle(element).borderRadius),
    )
    await expect(page.locator('#plan-section > .step-next').getByRole('button')).toHaveText('Go to Solve')
    await starter.focus()
    await starter.press('Enter')
    await expect(plan).toBeFocused()
    await expect(plan).toHaveValue('Keep the input unchanged. My approach is ')
    await saved(page)
    await page.reload()
    await expect(plan).toHaveValue('Keep the input unchanged. My approach is ')
    await page.getByRole('button', { name: 'Explain', exact: true }).click()
    await page.getByRole('button', { name: 'This works because', exact: true }).click()
    const explanation = page.getByLabel('Your explanation', { exact: true })
    await expect(explanation).toBeFocused()
    await expect(explanation).toHaveValue('This works because ')
    const tips = page.locator('.info-note').filter({ hasText: 'English tips for Indonesian speakers' })
    await tips.locator('summary').click()
    await expect(tips).toContainText('the list is empty')
    await saved(page)
    await page.reload()
    await expect(explanation).toHaveValue('This works because ')
    await page.getByRole('button', { name: 'Understand', exact: true }).click()
    await expect(help).toHaveAttribute('aria-pressed', 'true')
    await help.click()
    await expect(help).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.indonesian-gloss')).toHaveCount(0)
    await page.getByRole('button', { name: 'Explain', exact: true }).click()
    await expect(tips).toHaveCount(0)
    expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.includes('indonesian-help')))).toBe(false)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
