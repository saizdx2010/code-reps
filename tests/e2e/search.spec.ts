import { expect, test } from '@playwright/test'

test('Search opens in its field, finds lessons by concept, and names results like the navigation', async ({ page }) => {
  await page.goto('/#/home')
  // The shortcut belongs to the app, so wait for it to replace the startup screen.
  await expect(page.locator('.startup-loading')).toHaveCount(0)
  await page.keyboard.press('ControlOrMeta+K')
  const search = page.getByRole('dialog', { name: 'Search' })
  const field = search.getByRole('combobox', { name: /^Search pages/ })
  await expect(field).toBeFocused()
  // An empty query offers what to continue and the pages, not every exercise.
  await expect(search.locator('.command-group')).toHaveText(['Continue', 'Pages', 'Settings'])
  await expect(search.getByRole('option', { name: 'Library › Lessons', exact: true })).toBeVisible()
  // Typing (not filling) proves keystrokes reach the field.
  await page.keyboard.type('closure')
  await expect(search.locator('.command-group')).toHaveText(['Lessons', 'Exercises'])
  await expect(search.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/knowledge\/[a-z-]+$/)
  await expect(page.locator('.knowledge-article h1, .knowledge-article h2').first()).toContainText('Closures')
  await expect(search).toHaveCount(0)
})

test('Search switches dark mode and opens a page with the arrow keys', async ({ page }) => {
  await page.goto('/#/practice')
  await page.keyboard.press('ControlOrMeta+K')
  await page.keyboard.type('dark mode')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('dialog', { name: 'Search' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.keyboard.type('journal')
  const options = page.getByRole('dialog', { name: 'Search' }).getByRole('option')
  const mistakes = options.filter({ hasText: 'Progress › Journal › Mistakes' })
  const index = await options.evaluateAll(items => items.findIndex(item => item.textContent?.includes('Journal › Mistakes')))
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown')
  await expect(mistakes).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/mistakes$/)
})
