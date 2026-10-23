import { expect, test } from '@playwright/test'
import { saved } from './helpers'

const ring = (page: import('@playwright/test').Page) => page.locator('button[aria-current="step"] .trail-node-title')

for (const width of [1280, 390]) {
  test(`a first visit can skip the language basics from Trail and undo it at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/home')
    await expect(page.locator('#continue-heading')).toHaveText('Declare a value')
    await expect(ring(page)).toHaveText('Declare a value')
    await page.getByRole('button', { name: 'Skip the language basics', exact: true }).click()
    // The panel and the trail's next node move together, and the change is announced.
    await expect(page.locator('#continue-heading')).toHaveText('Sum positive numbers')
    await expect(ring(page)).toHaveText('Sum positive numbers')
    await expect(page.locator('.trail-aside [role="status"]')).toHaveText('Your next rep is now Sum positive numbers.')
    await expect(page.getByRole('button', { name: 'Skip the language basics' })).toHaveCount(0)
    await page.reload()
    await expect(page.locator('#continue-heading')).toHaveText('Sum positive numbers')
    await expect(page.locator('.trail-notice')).toHaveCount(0)
    await page.goto('/#/home')
    await expect(page.getByRole('region', { name: 'Learning goal' }).locator('.trail-stage').first()).toContainText('Work through arrays')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('undo restores the language basics in the same visit', async ({ page }) => {
  await page.goto('/#/home')
  await page.getByRole('button', { name: 'Skip the language basics', exact: true }).click()
  await page.locator('.trail-notice').getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('#continue-heading')).toHaveText('Declare a value')
  await expect(ring(page)).toHaveText('Declare a value')
})

test('with two drafts, the panel, the trail, and Also waiting never disagree', async ({ page }) => {
  await page.goto('/#/home')
  for (const rep of ['basic-types', 'make-arrays']) {
    await page.goto(`/#/practice/${rep}`)
    await page.getByRole('button', { name: 'Plan', exact: true }).click()
    await page.getByLabel('Your plan', { exact: true }).fill('A saved draft plan')
    await saved(page)
  }
  await page.goto('/#/home')
  const title = (await page.locator('#continue-heading').textContent())!
  await expect(ring(page)).toHaveText(title)
  const waiting = page.locator('.list-group').filter({ hasText: 'Also waiting' })
  await expect(waiting).not.toContainText(title)
  await expect(waiting.locator('.status-chip')).toHaveText('In progress')
  await expect(page.locator('button[aria-current="step"]')).toContainText('Next · In progress')
  // Starting-point advice is for an empty first visit only.
  await expect(page.getByRole('button', { name: 'Skip the language basics' })).toHaveCount(0)
})

test('Back to Trail restores the scroll position and puts focus on the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/#/home')
  // The current stage starts open; open two more so the page can scroll that far.
  await page.locator('.path-stage').nth(3).locator('summary').click()
  await page.locator('.path-stage').nth(4).locator('summary').click()
  await page.evaluate(() => window.scrollTo(0, 900))
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(900)
  // A pointer click would first scroll the tab at the top into view, which really does move the page; dispatch the click
  // where the page stands, as a keyboard shortcut or a sticky control would.
  await page.getByRole('button', { name: 'All tracks', exact: true }).dispatchEvent('click')
  await expect(page.locator('#path-title')).toBeVisible()
  await page.goBack()
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(900)
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true)
})

test('opening a rep from the trail and coming back returns focus to that node', async ({ page }) => {
  await page.goto('/#/home')
  await page.locator('#trail-create-objects').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/practice\/create-objects$/)
  await page.goBack()
  await expect(page.locator('#trail-create-objects')).toBeFocused()
})
