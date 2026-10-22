import { expect, test } from '@playwright/test'

test('pattern cards are reachable from Lessons, give feedback, and link to a rep', async ({ page }) => {
  await page.goto('/#/knowledge')
  await page.getByRole('button', { name: 'Pattern cards', exact: true }).click()
  await expect(page).toHaveURL(/#\/patterns$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Pattern cards' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Library pages' }).getByRole('button', { name: 'Lessons' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByText('Card 1 of')).toBeVisible()
  const choices = page.getByRole('group', { name: 'Which tool fits best?' }).getByRole('button')
  await expect(choices).toHaveCount(3)
  await choices.first().focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.pattern-feedback')).toContainText('Signal:')
  await expect(page.locator('.pattern-feedback')).toContainText('Near miss:')
  await expect(page.getByText('Best fit', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Next card', exact: true }).click()
  await expect(page.getByText(/Card 2 of \d+ · matched [01] of 1/)).toBeVisible()
  await choices.nth(1).click()
  await page.getByRole('button', { name: /^Practice it:/ }).click()
  await expect(page).toHaveURL(/#\/practice\//)
})
