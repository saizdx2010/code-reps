import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { chooseSegment, expectChecksFinished, replaceCode } from './helpers'

const mapRoute = '/#/skillmap'
const node = (page: Page, title: string) => page.locator('.skill-node', { hasText: title })

async function finishGuidedArrayRep(page: Page) {
  await page.goto('/#/practice/sum-positive-numbers')
  await page.getByRole('button', { name: 'Plan', exact: true }).first().click()
  await page.getByLabel('Your plan', { exact: true }).fill('Start a total at zero and add each number that is greater than zero.')
  await page.getByRole('button', { name: 'Solve', exact: true }).first().click()
  await replaceCode(page, 'function sumPositive(numbers: number[]): number {\n  let total = 0\n  for (const number of numbers) if (number > 0) total += number\n  return total\n}\n', 'sum-positive-numbers')
  await page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).first().click()
  await page.getByLabel('Your explanation', { exact: true }).fill('It keeps a running total and only adds values above zero.')
  await page.getByRole('button', { name: 'Review', exact: true }).first().click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
}

test('a fresh profile shows every skill as not started', async ({ page }) => {
  await page.goto(mapRoute)
  await expect(page.getByRole('heading', { level: 1, name: 'Skill map.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Progress pages' }).getByRole('button', { name: 'Skills' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('group', { name: 'Skills view' }).getByRole('button', { name: 'Skill map' })).toHaveAttribute('aria-pressed', 'true')
  const nodes = page.locator('.skill-node')
  expect(await nodes.count()).toBeGreaterThan(0)
  await expect(page.locator('.skill-node .status-chip', { hasText: 'Not started' })).toHaveCount(await nodes.count())
  await expect(page.getByText('describes recorded practice evidence, not mastery')).toBeHidden()
  await page.getByText('What this map shows').click()
  await expect(page.getByText('describes recorded practice evidence, not mastery')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Legend' })).toBeVisible()
})

test('completing a guided rep marks its skill practiced and the route survives reload and Back', async ({ page }) => {
  await finishGuidedArrayRep(page)
  await page.goto(mapRoute)
  const arrays = node(page, 'Work through arrays')
  await expect(arrays.locator('.status-chip')).toHaveText('Practiced')
  await expect(arrays.getByRole('button', { name: /Try without hints/ })).toBeVisible()
  await expect(node(page, 'Work through words').locator('.status-chip')).toHaveText('Not started')
  await page.reload()
  await expect(arrays.locator('.status-chip')).toHaveText('Practiced')
  await arrays.getByRole('button', { name: /Try without hints/ }).click()
  await expect(page).toHaveURL(/#\/practice\/count-even-numbers/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/skillmap/)
  await expect(page.getByRole('heading', { level: 1, name: 'Skill map.' })).toBeVisible()
})

test('the keyboard reaches a node link and opens its rep; Progress links to the map', async ({ page }) => {
  await page.goto('/#/progress')
  await page.getByRole('navigation', { name: 'Progress pages' }).getByRole('button', { name: 'Skill map', exact: true }).click()
  await expect(page).toHaveURL(/#\/skillmap/)
  const first = page.locator('.skill-node .text-button').first()
  for (let presses = 0; presses < 60 && !(await first.evaluate(element => element === document.activeElement)); presses++) await page.keyboard.press('Tab')
  await expect(first).toBeFocused()
  await expect(first).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/practice\//)
})

test('the map fits a 390px screen without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(mapRoute)
  await expect(page.locator('.skill-node').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/skill-map-390.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('.skill-node').first()).toBeVisible()
  await page.screenshot({ path: 'test-results/skill-map-desktop.png', fullPage: true })
  testInfo.annotations.push({ type: 'screenshots', description: 'test-results/skill-map-390.png, skill-map-desktop.png' })
})
