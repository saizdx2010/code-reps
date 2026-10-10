import { expect, test } from '@playwright/test'
import { editor, expectChecksFinished, replaceCode, route, saved, solution } from './helpers'

// most-frequent-number lives in core-reps; its heavy content loads from that module when the rep opens.
const contentModule = '**/core-reps.ts*'

test('a failed rep-content load keeps the draft and Retry recovers the brief and checks', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution)
  await saved(page)

  let blocked = true
  await page.route(contentModule, route => blocked ? route.abort() : route.continue())
  await page.reload()

  const alert = page.getByRole('alert').filter({ hasText: 'brief could not load' })
  await expect(alert).toContainText('Your draft is safe.')
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('counts')
  await expect(page.getByRole('button', { name: 'Run checks', exact: true })).toBeDisabled()
  await expect(page.locator('#brief-section').getByText('appears most often')).toHaveCount(0)

  blocked = false
  await alert.getByRole('button', { name: 'Retry' }).click()
  await expect(alert).toHaveCount(0)
  await expect(page.locator('#brief-section').getByText('appears most often')).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('counts')
  await expect(page.getByRole('button', { name: 'Run checks', exact: true })).toBeEnabled()

  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed'))
})

test('opening another rep shows its own content, never the previous rep\'s', async ({ page }) => {
  await page.goto(route)
  await expect(page.locator('#brief-section').getByText('appears most often')).toBeVisible()
  await page.goto('/#/practice/balanced-brackets')
  await expect(page.locator('#brief-section').getByText('closed in the correct order')).toBeVisible()
  await expect(page.locator('#brief-section').getByText('appears most often')).toHaveCount(0)
})

test('a load that keeps failing offers Reload app and still keeps the draft', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution)
  await saved(page)

  let blocked = true
  await page.route(contentModule, route => blocked ? route.abort() : route.continue())
  await page.reload()
  const alert = page.getByRole('alert').filter({ hasText: 'brief could not load' })
  await expect(alert).toBeVisible()
  await expect(alert.getByRole('button', { name: 'Reload app' })).toHaveCount(0)

  await alert.getByRole('button', { name: 'Retry' }).click()
  await expect(alert.getByRole('button', { name: 'Reload app' })).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('counts')

  blocked = false
  await alert.getByRole('button', { name: 'Reload app' }).click()
  await expect(page.locator('#brief-section').getByText('appears most often')).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('counts')
})
