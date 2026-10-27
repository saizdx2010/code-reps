import { expect, test } from '@playwright/test'
import { editor } from './helpers'

for (const width of [1440, 390]) {
  test(`optional journey practice opens without hints at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    // Skills lists a journey once it has started (before that it shows a welcome note), so the arrays journey's guided rep
    // is saved as finished first.
    await page.goto('/#/home')
    await page.evaluate(() => {
      const attempt = {
        completedAt: new Date(Date.now() - 86_400_000).toISOString(),
        plan: 'Plan',
        code: 'code',
        explanation: 'Explanation',
        hintCount: 0,
        confidence: 'getting-there',
        difficulty: 'none',
      }
      localStorage.setItem(
        'code-reps:profile:default:history:v1',
        JSON.stringify([{ id: 'sum-1', repId: 'sum-positive-numbers', ...attempt }]),
      )
      localStorage.setItem('code-reps:profile:default:attempt:sum-positive-numbers:v1', JSON.stringify(attempt))
    })
    await page.goto('/#/progress')
    await page.reload()
    const journey = page
      .locator('.progress-journey')
      .filter({ has: page.getByRole('heading', { name: 'Work through arrays', exact: true }) })
    await journey.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(journey.getByText('4. Later recall', { exact: true })).toBeVisible()
    // The independent problem and both optional practice reps are open; the optional one is tried here.
    await expect(journey.getByRole('button', { name: 'Try rep', exact: true })).toHaveCount(3)
    const action = journey
      .getByRole('listitem')
      .filter({ hasText: 'Extra practice (optional): Sum numbers in a range' })
      .getByRole('button', { name: 'Try rep', exact: true })
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
